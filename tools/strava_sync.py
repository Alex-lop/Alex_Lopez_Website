#!/usr/bin/env python3
"""Refresh data/strava.json from Strava. Stdlib only.

Run by .github/workflows/strava-sync.yml with STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET and
STRAVA_REFRESH_TOKEN in the environment. `python3 tools/strava_sync.py --self-check` runs the
offline asserts and touches nothing. The hand-edited keys `feeling` and `pr` are preserved.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

MI, FT, OUT, TZ = 1609.344, 3.28084, "data/strava.json", ZoneInfo("America/New_York")


def api(url, token=None, form=None):
    req = urllib.request.Request(
        url,
        urllib.parse.urlencode(form).encode() if form else None,
        {"Authorization": "Bearer " + token} if token else {},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def build(acts, monday, old):
    runs = [a for a in acts if a.get("type") in ("Run", "TrailRun") and a.get("distance", 0) > 0]
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
    # The hero draws a route, so "latest" is the newest run that has a public one; read_all also
    # returns private activities and those never leave this script.
    public = [a for a in runs if a.get("visibility") == "everyone" and (a.get("map") or {}).get("summary_polyline")]
    latest = max(public, key=lambda a: a["start_date_local"], default=None)
    old_latest = old.get("latest") or {}
    if latest:
        place = ", ".join(x for x in (latest.get("location_city"), latest.get("location_state")) if x)
        poly = latest["map"]["summary_polyline"]
        out["latest"] = {
            "date": latest["start_date_local"][:10],
            "name": latest.get("name", "Run"),
            "place": place or old_latest.get("place", "Boston, MA"),
            "miles": round(latest["distance"] / MI, 2),
            "pace_sec_per_mi": round(latest["moving_time"] / (latest["distance"] / MI)),
            "elev_ft": round(latest["total_elevation_gain"] * FT),
            "polyline": poly,
        }
    elif old_latest:
        out["latest"] = old_latest
    out["feeling"] = old.get("feeling", "")
    out["pr"] = old.get("pr", {"half_marathon": "1:32"})
    return out


def self_check():
    acts = [
        {"type": "Run", "distance": 3.82 * MI, "moving_time": 1639, "total_elevation_gain": 23.0,
         "start_date_local": "2026-09-14T17:23:18Z", "name": "a", "visibility": "everyone", "map": {"summary_polyline": "x"}},
        {"type": "Run", "distance": 4.34 * MI, "moving_time": 1863, "total_elevation_gain": 23.0,
         "start_date_local": "2026-09-15T17:18:31Z", "name": "b", "visibility": "everyone", "map": {}},
        {"type": "Run", "distance": 6.03 * MI, "moving_time": 2804, "total_elevation_gain": 35.0,
         "start_date_local": "2026-09-16T17:00:42Z", "name": "c", "visibility": "only_me", "map": {"summary_polyline": "secret"}},
        {"type": "WeightTraining", "distance": 0, "moving_time": 1149, "total_elevation_gain": 0,
         "start_date_local": "2026-09-16T16:32:43Z"},
        {"type": "Run", "distance": 0, "moving_time": 30, "total_elevation_gain": 0, "name": "false start",
         "start_date_local": "2026-09-16T18:00:00Z", "visibility": "everyone", "map": {"summary_polyline": "z"}},
        {"type": "Run", "distance": 4.0 * MI, "moving_time": 1800, "total_elevation_gain": 10.0,
         "start_date_local": "2026-09-12T12:59:54Z", "name": "last week", "visibility": "everyone", "map": {}},
    ]
    old = {"feeling": "keep me", "pr": {"half_marathon": "1:32"}, "latest": {"polyline": "old-route", "place": "Boston, MA"}}
    out = build(acts, date(2026, 9, 14), old)
    w = out["week"]
    assert (w["runs"], w["miles"], w["elev_ft"], w["moving_time_s"]) == (3, 14.2, 266, 6306), w
    assert 440 <= w["pace_sec_per_mi"] <= 450 and w["days"][3:] == [0, 0, 0, 0] and w["days"][2] == 6.03, w
    assert out["latest"]["date"] == "2026-09-14" and out["latest"]["polyline"] == "x", out["latest"]
    assert build([acts[3]], date(2026, 9, 14), old)["latest"] == old["latest"]
    assert out["feeling"] == "keep me" and out["pr"] == {"half_marathon": "1:32"}
    empty = build([], date(2026, 9, 21), old)["week"]
    assert empty["runs"] == 0 and empty["pace_sec_per_mi"] is None and empty["days"] == [0] * 7
    print("ok")


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
    if tok.get("refresh_token") != os.environ["STRAVA_REFRESH_TOKEN"]:
        print("warning: Strava rotated the refresh token; update the STRAVA_REFRESH_TOKEN secret", file=sys.stderr)
    after = int(datetime.combine(monday - timedelta(days=10), datetime.min.time(), TZ).timestamp())
    acts = api(f"https://www.strava.com/api/v3/athlete/activities?after={after}&per_page=50", token=tok["access_token"])
    new = build(acts, monday, old)
    if {k: v for k, v in old.items() if k != "generated_at"} == new:
        print("unchanged")
        return
    new = {"generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), **new}
    os.makedirs("data", exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(new, f, indent=2)
        f.write("\n")
    print("wrote", OUT)


if __name__ == "__main__":
    self_check() if "--self-check" in sys.argv else main()
