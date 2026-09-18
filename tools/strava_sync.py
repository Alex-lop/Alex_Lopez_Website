#!/usr/bin/env python3
"""Refresh data/strava.json from Strava. Stdlib only.

Run by .github/workflows/strava-sync.yml with STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET and
STRAVA_REFRESH_TOKEN in the environment; GH_SECRETS_PAT (optional) lets it write a rotated
refresh token back into the repo secret. `python3 tools/strava_sync.py --self-check` runs the
offline asserts and touches nothing. The hand-edited keys `feeling` and `pr` are preserved.

Shape and rules live in DESIGN.md §6. The token exchange and the activity list are fatal; the
detail, streams and athlete-stats calls are optional and their keys are simply omitted on failure.
"""
import json
import os
import random
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

MI, FT, OUT, TZ = 1609.344, 3.28084, "data/strava.json", ZoneInfo("America/New_York")
RUN_TYPES = ("Run", "TrailRun")
ATHLETE = "141554769"
STREAM_KEYS = "time,distance,velocity_smooth,altitude,heartrate"


def api(url, token=None, form=None):
    req = urllib.request.Request(
        url,
        urllib.parse.urlencode(form).encode() if form else None,
        {"Authorization": "Bearer " + token} if token else {},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def api_opt(url, token):
    """Same, but None instead of an exception: these calls only add keys."""
    try:
        return api(url, token)
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        print(f"optional call failed ({e}): {url}", file=sys.stderr)
        return None


# ---------------------------------------------------------------- polyline

def decode_polyline(s):
    pts, lat, lng, i = [], 0, 0, 0
    while i < len(s):
        vals = []
        for _ in range(2):
            shift = result = 0
            while True:
                b = ord(s[i]) - 63
                i += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            vals.append(~(result >> 1) if result & 1 else result >> 1)
        lat, lng = lat + vals[0], lng + vals[1]
        pts.append((lat / 1e5, lng / 1e5))
    return pts


def encode_polyline(pts):
    """Diff each point against the previously *rounded* integer, not the float, or the rounding
    error accumulates and the decoded track drifts off the road."""
    out, plat, plng = [], 0, 0
    for lat, lng in pts:
        ilat, ilng = round(lat * 1e5), round(lng * 1e5)
        for d in (ilat - plat, ilng - plng):
            v = ~(d << 1) if d < 0 else d << 1
            while v >= 0x20:
                out.append(chr((0x20 | (v & 0x1F)) + 63))
                v >>= 5
            out.append(chr(v + 63))
        plat, plng = ilat, ilng
    return "".join(out)


def stride(seq, n):
    """Uniform stride down to at most n items, the last item always kept."""
    seq = list(seq)
    if len(seq) <= n:
        return seq
    out = seq[:: -(-len(seq) // n)]
    out[-1] = seq[-1]
    return out


# ---------------------------------------------------------------- pieces

def pick_latest(acts):
    """The hero draws a route, so `latest` is the newest run that has a public one; read_all also
    returns private activities and those never leave this script."""
    runs = [a for a in acts if a.get("type") in RUN_TYPES and a.get("distance", 0) > 0]
    public = [a for a in runs if a.get("visibility") == "everyone" and (a.get("map") or {}).get("summary_polyline")]
    return max(public, key=lambda a: a["start_date_local"], default=None)


def split_rows(splits):
    rows = []
    for i, s in enumerate(splits or []):
        mi, t = s["distance"] / MI, s["moving_time"]
        partial = s["distance"] < 0.9 * MI
        rows.append({
            "mile": i + 1,
            "miles": round(mi, 2),
            "moving_time_s": t,
            "pace_sec_per_mi": None if partial else round(t / mi),
            "elev_change_ft": round((s.get("elevation_difference") or 0) * FT),
            "hr": round(s["average_heartrate"]) if s.get("average_heartrate") else None,
            "partial": partial,
        })
    return rows


def stream_block(raw, n=300):
    """{time, miles, pace_sec_per_mi, alt_ft, hr}, uniform stride to <= n samples with the last
    sample kept. A stream Strava did not return (no heart-rate strap, no barometer) is written as
    a list of nulls of the same length, so every array stays index-aligned with time[]."""
    get = lambda k: ((raw or {}).get(k) or {}).get("data") or []
    time, dist, vel, alt, hr = (get(k) for k in ("time", "distance", "velocity_smooth", "altitude", "heartrate"))
    if not time:
        return None
    idx = stride(range(len(time)), n)
    col = lambda s, f: [f(s[i]) if i < len(s) else None for i in idx] if s else [None] * len(idx)
    return {
        "time": [time[i] for i in idx],
        "miles": col(dist, lambda d: round(d / MI, 3)),
        # under 0.3 m/s the watch is stopped at a light, not running: a pace there is nonsense
        "pace_sec_per_mi": col(vel, lambda v: round(MI / v) if v and v >= 0.3 else None),
        "alt_ft": col(alt, lambda a: round(a * FT, 1)),
        "hr": col(hr, lambda h: round(h)),
    }


def week_rows(runs, monday, n=8):
    """The last n Monday-start weeks, oldest first; the last row is the live week."""
    rows = []
    for k in range(n - 1, -1, -1):
        ws = monday - timedelta(days=7 * k)
        lo, hi = ws.isoformat(), (ws + timedelta(days=7)).isoformat()
        wk = [a for a in runs if lo <= a["start_date_local"][:10] < hi]
        rows.append({
            "week_start": lo,
            "miles": round(sum(a["distance"] for a in wk) / MI, 1),
            "runs": len(wk),
            "moving_time_s": sum(a["moving_time"] for a in wk),
        })
    return rows


def lifts_before_runs(acts, monday):
    """Days this week with a WeightTraining that started within two hours before a run."""
    at = lambda a: datetime.fromisoformat(a["start_date_local"][:19])
    lo, hi = monday.isoformat(), (monday + timedelta(days=7)).isoformat()
    week = [a for a in acts if lo <= a["start_date_local"][:10] < hi]
    lifts = [at(a) for a in week if a.get("type") == "WeightTraining"]
    days = {r.date() for r in (at(a) for a in week if a.get("type") in RUN_TYPES)
            if any(timedelta(0) <= r - lift <= timedelta(hours=2) for lift in lifts)}
    return len(days)


def build(acts, monday, old, detail=None, streams=None, stats=None):
    """Pure: everything network-shaped is handed in. See DESIGN.md §6 "JSON shape"."""
    runs = [a for a in acts if a.get("type") in RUN_TYPES and a.get("distance", 0) > 0]
    lo, hi = monday.isoformat(), (monday + timedelta(days=7)).isoformat()
    week = [a for a in runs if lo <= a["start_date_local"][:10] < hi]
    dist = sum(a["distance"] for a in week)
    secs = sum(a["moving_time"] for a in week)
    days = [0.0] * 7
    for a in week:
        i = (date.fromisoformat(a["start_date_local"][:10]) - monday).days
        if 0 <= i < 7:
            days[i] += a["distance"] / MI
    out = {
        "week_start": monday.isoformat(),
        "week": {
            "runs": len(week),
            "miles": round(dist / MI, 1),
            "pace_sec_per_mi": round(secs / (dist / MI)) if dist else None,
            "elev_ft": round(sum(a["total_elevation_gain"] for a in week) * FT),
            "moving_time_s": secs,
            "days": [round(d, 2) for d in days],
        },
    }
    latest = pick_latest(acts)
    old_latest = old.get("latest") or {}
    if latest:
        place = ", ".join(x for x in (latest.get("location_city"), latest.get("location_state")) if x)
        out["latest"] = {
            "date": latest["start_date_local"][:10],
            "name": latest.get("name", "Run"),
            "place": place or old_latest.get("place", "Boston, MA"),
            "miles": round(latest["distance"] / MI, 2),
            "pace_sec_per_mi": round(latest["moving_time"] / (latest["distance"] / MI)),
            "elev_ft": round(latest["total_elevation_gain"] * FT),
            "polyline": latest["map"]["summary_polyline"],
        }
        if detail:
            poly = (detail.get("map") or {}).get("polyline")
            hr = detail.get("has_heartrate")
            out["latest"].update({
                "polyline": encode_polyline(stride(decode_polyline(poly), 800)) if poly else out["latest"]["polyline"],
                "id": detail.get("id"),
                "name": detail.get("name") or out["latest"]["name"],
                "moving_time_s": detail.get("moving_time"),
                "elapsed_time_s": detail.get("elapsed_time"),
                "avg_hr": round(detail["average_heartrate"]) if hr and detail.get("average_heartrate") else None,
                "max_hr": round(detail["max_heartrate"]) if hr and detail.get("max_heartrate") else None,
                "cadence": detail.get("average_cadence"),
                "suffer_score": detail.get("suffer_score"),
                "calories": detail.get("calories"),
                "splits": split_rows(detail.get("splits_standard")),
            })
        block = stream_block(streams)
        if block:
            out["latest"]["streams"] = block
    elif old_latest:
        out["latest"] = old_latest
    out["weeks"] = week_rows(runs, monday)
    ytd, allt = ((stats or {}).get(k) or {} for k in ("ytd_run_totals", "all_run_totals"))
    mi = lambda t: round(t["distance"] / MI, 1) if t.get("distance") is not None else None
    out["totals"] = {
        "ytd_runs": ytd.get("count"),
        "ytd_miles": mi(ytd),
        "all_runs": allt.get("count"),
        "all_miles": mi(allt),
        "lifts_before_runs_this_week": lifts_before_runs(acts, monday),
    }
    # 30 days back from the end of the live week; build() gets no clock of its own
    since = (monday + timedelta(days=7) - timedelta(days=30)).isoformat()
    recent = [a for a in runs if a["start_date_local"][:10] >= since]
    out["achievements"] = {
        "prs_30d": sum(a.get("pr_count") or 0 for a in recent),
        "achievements_30d": sum(a.get("achievement_count") or 0 for a in recent),
    }
    out["feeling"] = old.get("feeling", "")
    out["pr"] = old.get("pr", {"half_marathon": "1:32"})
    return out


# ---------------------------------------------------------------- writing

def dumps(out):
    """indent 2, except the stream arrays and the split/week entries, one line each, so a sync is
    a small diff instead of a thousand-line one."""
    flat = []

    def mark(v):
        flat.append(json.dumps(v, allow_nan=False, separators=(",", ":")))
        return f"\x00{len(flat) - 1}\x00"

    out = json.loads(json.dumps(out, allow_nan=False))  # deep copy, and proves it serialises
    latest = out.get("latest") or {}
    if "streams" in latest:
        latest["streams"] = {k: mark(v) for k, v in latest["streams"].items()}
    if "splits" in latest:
        latest["splits"] = [mark(s) for s in latest["splits"]]
    if "weeks" in out:
        out["weeks"] = [mark(w) for w in out["weeks"]]
    s = json.dumps(out, indent=2, allow_nan=False)
    for i, one in enumerate(flat):
        s = s.replace(json.dumps(f"\x00{i}\x00"), one)
    return s + "\n"


def write(out):
    os.makedirs("data", exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        f.write(dumps(out))
    os.replace(tmp, OUT)


def rotate(new_token):
    """Persist a refresh token Strava rotated. True if it landed in the secret."""
    pat = os.environ.get("GH_SECRETS_PAT")
    if not pat:
        return False
    subprocess.run(
        ["gh", "secret", "set", "STRAVA_REFRESH_TOKEN", "--repo",
         os.environ.get("GITHUB_REPOSITORY", "Alex-lop/Alex_Lopez_Website")],
        input=new_token, text=True, check=True, env={**os.environ, "GH_TOKEN": pat},
    )
    print("rotated the refresh token secret")
    return True


# ---------------------------------------------------------------- self-check

def self_check():
    lift = {"type": "WeightTraining", "distance": 0, "moving_time": 1149, "total_elevation_gain": 0,
            "start_date_local": "2026-09-16T16:32:43Z"}
    early_lift = {"type": "WeightTraining", "distance": 0, "moving_time": 900, "total_elevation_gain": 0,
                  "start_date_local": "2026-09-15T14:00:00Z"}  # 3h before Tuesday's run: must not count
    acts = [
        {"type": "Run", "distance": 3.82 * MI, "moving_time": 1639, "total_elevation_gain": 23.0, "pr_count": 1,
         "start_date_local": "2026-09-14T17:23:18Z", "name": "a", "visibility": "everyone", "map": {"summary_polyline": "x"}},
        {"type": "Run", "distance": 4.34 * MI, "moving_time": 1863, "total_elevation_gain": 23.0, "achievement_count": 2,
         "start_date_local": "2026-09-15T17:18:31Z", "name": "b", "visibility": "everyone", "map": {}},
        {"type": "Run", "distance": 6.03 * MI, "moving_time": 2804, "total_elevation_gain": 35.0, "pr_count": 2,
         "start_date_local": "2026-09-16T17:00:42Z", "name": "c", "visibility": "only_me", "map": {"summary_polyline": "secret"}},
        lift,
        early_lift,
        {"type": "Run", "distance": 0, "moving_time": 30, "total_elevation_gain": 0, "name": "false start",
         "start_date_local": "2026-09-16T18:00:00Z", "visibility": "everyone", "map": {"summary_polyline": "z"}},
        {"type": "Run", "distance": 4.0 * MI, "moving_time": 1800, "total_elevation_gain": 10.0, "achievement_count": 1,
         "start_date_local": "2026-09-12T12:59:54Z", "name": "last week", "visibility": "everyone", "map": {}},
        {"type": "Run", "distance": 9.0 * MI, "moving_time": 4000, "total_elevation_gain": 50.0, "pr_count": 9,
         "start_date_local": "2026-07-16T12:00:00Z", "name": "nine weeks ago", "visibility": "everyone", "map": {}},
    ]
    old = {"feeling": "keep me", "pr": {"half_marathon": "1:32"}, "latest": {"polyline": "old-route", "place": "Boston, MA"}}
    monday = date(2026, 9, 14)

    # the week, as before
    out = build(acts, monday, old)
    w = out["week"]
    assert (w["runs"], w["miles"], w["elev_ft"], w["moving_time_s"]) == (3, 14.2, 266, 6306), w
    assert 440 <= w["pace_sec_per_mi"] <= 450 and w["days"][3:] == [0, 0, 0, 0] and w["days"][2] == 6.03, w
    assert out["latest"]["date"] == "2026-09-14" and out["latest"]["polyline"] == "x", out["latest"]
    assert build([lift], monday, old)["latest"] == old["latest"]
    assert out["feeling"] == "keep me" and out["pr"] == {"half_marathon": "1:32"}
    empty = build([], date(2026, 9, 21), old)["week"]
    assert empty["runs"] == 0 and empty["pace_sec_per_mi"] is None and empty["days"] == [0] * 7

    # no detail / streams / stats: the old latest shape exactly, nothing extra
    assert set(out["latest"]) == {"date", "name", "place", "miles", "pace_sec_per_mi", "elev_ft", "polyline"}, out["latest"]
    assert out["totals"] == {"ytd_runs": None, "ytd_miles": None, "all_runs": None, "all_miles": None,
                             "lifts_before_runs_this_week": 1}, out["totals"]

    # weeks: 8 rows, oldest first, the live week last, the nine-week-old run outside the window
    weeks = out["weeks"]
    assert len(weeks) == 8 and weeks[0]["week_start"] == "2026-07-27" and weeks[-1]["week_start"] == "2026-09-14", weeks
    assert (weeks[-1]["miles"], weeks[-1]["runs"]) == (14.2, 3) and weeks[-2]["miles"] == 4.0, weeks[-2:]
    assert not any(r["miles"] == 9.0 for r in weeks), weeks

    # achievements: the 30-day window, so the 4.0 last week counts and the 9.0 in July does not
    assert out["achievements"] == {"prs_30d": 3, "achievements_30d": 3}, out["achievements"]

    # detail + streams + stats
    pts = [(42.34 + i * 2e-4, -71.09 - i * 3e-4) for i in range(1200)]
    detail = {
        "id": 16111222333, "name": "Afternoon Run", "moving_time": 2857, "elapsed_time": 2901,
        "has_heartrate": True, "average_heartrate": 158.4, "max_heartrate": 179.0,
        "average_cadence": 84.2, "suffer_score": 103, "calories": 712.0,
        "map": {"polyline": encode_polyline(pts)},
        "splits_standard": [
            {"distance": MI, "moving_time": 458, "elevation_difference": 12.0, "average_heartrate": 151.2},
            {"distance": MI, "moving_time": 452, "elevation_difference": -9.0, "average_heartrate": 160.8},
            {"distance": 0.4 * MI, "moving_time": 170, "elevation_difference": 0.0, "average_heartrate": None},
        ],
    }
    raw = {
        "time": {"data": list(range(900))},
        "distance": {"data": [i * 3.2 for i in range(900)]},
        # index 300 survives the stride of 3, so the stopped sample is in the output
        "velocity_smooth": {"data": [0.0 if i == 300 else 3.5 for i in range(900)]},
        "altitude": {"data": [10.0 + (i % 50) * 0.5 for i in range(900)]},
    }
    stats = {"ytd_run_totals": {"count": 112, "distance": 1_207_008.0},
             "all_run_totals": {"count": 604, "distance": 6_437_376.0}}
    out = build(acts, monday, old, detail, raw, stats)
    lat = out["latest"]
    assert (lat["id"], lat["name"], lat["moving_time_s"], lat["elapsed_time_s"]) == (16111222333, "Afternoon Run", 2857, 2901), lat
    assert (lat["avg_hr"], lat["max_hr"], lat["cadence"], lat["suffer_score"], lat["calories"]) == (158, 179, 84.2, 103, 712.0), lat
    assert len(decode_polyline(lat["polyline"])) <= 800, len(decode_polyline(lat["polyline"]))
    end = decode_polyline(lat["polyline"])[-1]
    assert max(abs(a - b) for a, b in zip(end, pts[-1])) <= 1e-5, "the last route point is always kept"

    sp = lat["splits"]
    assert [s["mile"] for s in sp] == [1, 2, 3] and sp[0]["pace_sec_per_mi"] == 458, sp
    assert sp[1]["elev_change_ft"] == -30 and sp[1]["hr"] == 161, sp[1]
    assert sp[2]["partial"] and sp[2]["pace_sec_per_mi"] is None and sp[2]["hr"] is None, sp[2]
    assert not sp[0]["partial"] and sp[0]["elev_change_ft"] == 39, sp[0]

    st = lat["streams"]
    assert all(len(v) == len(st["time"]) for v in st.values()) and len(st["time"]) <= 300, {k: len(v) for k, v in st.items()}
    assert st["time"][-1] == 899 and st["miles"][-1] == round(899 * 3.2 / MI, 3), "the last sample is always kept"
    assert st["pace_sec_per_mi"][st["time"].index(300)] is None, "a stopped sample has no pace"
    assert st["pace_sec_per_mi"][0] == round(MI / 3.5) and st["alt_ft"][0] == round(10.0 * FT, 1), st
    assert st["hr"] == [None] * len(st["time"]), "a stream Strava did not return is aligned nulls"

    assert out["totals"] == {"ytd_runs": 112, "ytd_miles": 750.0, "all_runs": 604, "all_miles": 4000.0,
                             "lifts_before_runs_this_week": 1}, out["totals"]

    # the encoder: Google's own test vector, then a round trip
    assert encode_polyline([(38.5, -120.2), (40.7, -120.95), (43.252, -126.453)]) == "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
    rng = random.Random(7)
    trip = [(rng.uniform(-85, 85), rng.uniform(-180, 180)) for _ in range(1000)]
    back = decode_polyline(encode_polyline(trip))
    assert len(back) == len(trip) and all(abs(a - c) <= 1e-5 and abs(b - d) <= 1e-5
                                         for (a, b), (c, d) in zip(trip, back)), "round trip drifted"

    json.dumps(out, allow_nan=False)
    assert json.loads(dumps(out)) == out and '"time": [' in dumps(out), "compact arrays, valid JSON"
    print("ok")


# ---------------------------------------------------------------- main

def main():
    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    today = datetime.now(TZ).date()
    monday = today - timedelta(days=today.weekday())
    tok = api("https://www.strava.com/oauth/token", form={
        "client_id": os.environ["STRAVA_CLIENT_ID"],
        "client_secret": os.environ["STRAVA_CLIENT_SECRET"],
        "grant_type": "refresh_token",
        "refresh_token": os.environ["STRAVA_REFRESH_TOKEN"],
    })
    access = tok["access_token"]
    # Before anything else: if Strava rotated the refresh token, the one in the secret is dead.
    stale_secret = (tok.get("refresh_token") != os.environ["STRAVA_REFRESH_TOKEN"]
                    and not rotate(tok["refresh_token"]))

    after = int(datetime.combine(monday - timedelta(days=56), datetime.min.time(), TZ).timestamp())
    acts, page = [], 1
    while True:
        batch = api(f"https://www.strava.com/api/v3/athlete/activities?after={after}&per_page=200&page={page}", access)
        acts += batch
        if len(batch) < 200:
            break
        page += 1

    cand = pick_latest(acts)
    detail = streams = None
    if cand:
        detail = api_opt(f"https://www.strava.com/api/v3/activities/{cand['id']}", access)
        streams = api_opt(
            f"https://www.strava.com/api/v3/activities/{cand['id']}/streams?keys={STREAM_KEYS}&key_by_type=true", access)
    stats = api_opt(f"https://www.strava.com/api/v3/athletes/{ATHLETE}/stats", access)

    new = build(acts, monday, old, detail, streams, stats)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if {k: v for k, v in old.items() if k != "generated_at"} == new:
        # quiet day: keep "synced N hours ago" honest without eight commits a day
        try:
            age = datetime.now(timezone.utc) - datetime.strptime(old["generated_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        except (KeyError, ValueError):
            age = timedelta.max
        if age > timedelta(hours=20):
            write({**old, "generated_at": stamp})
            print("heartbeat")
        else:
            print("unchanged")
    else:
        write({"generated_at": stamp, **new})
        print("wrote", OUT)

    if stale_secret:
        print("Strava rotated the refresh token and there is no GH_SECRETS_PAT to write it back. "
              "The STRAVA_REFRESH_TOKEN secret is now dead: re-authorise with steps 2-4 of the header "
              "in .github/workflows/strava-sync.yml and `gh secret set STRAVA_REFRESH_TOKEN`, or add a "
              "GH_SECRETS_PAT secret with secret-write permission so this runs itself.", file=sys.stderr)
        sys.exit(3)


if __name__ == "__main__":
    self_check() if "--self-check" in sys.argv else main()
