const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopScroll = window.matchMedia("(min-width: 769px) and (pointer: fine)");
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

const glide = {
  current: window.scrollY,
  target: window.scrollY,
  mode: null,
  targetId: null,
  frame: 0,
  startY: 0,
  startTime: 0,
  duration: 0,
};

function stopGlide() {
  glide.current = window.scrollY;
  glide.target = window.scrollY;
  glide.mode = null;
  glide.targetId = null;
  glide.startTime = 0;
  glide.duration = 0;
}

function targetTop(id) {
  const target = document.getElementById(id);
  return target ? clamp(Math.round(target.getBoundingClientRect().top + window.scrollY), 0, maxScroll()) : null;
}

// Soft takeoff, long coast, soft landing — like sliding on ice.
function iceEase(t) {
  const p = clamp(t, 0, 1);
  return p * p * p * (p * (p * 6 - 15) + 10);
}

function navigationDuration(distance) {
  return clamp(900 + Math.abs(distance) * 0.42, 1200, 2300);
}

function runGlide(now = performance.now()) {
  glide.frame = 0;
  if (!glide.mode) return;

  if (glide.mode === "navigation") {
    const elapsed = now - glide.startTime;
    const progress = iceEase(elapsed / glide.duration);
    glide.current = glide.startY + (glide.target - glide.startY) * progress;

    if (elapsed >= glide.duration) {
      glide.current = glide.target;
      window.scrollTo(0, glide.current);
      stopGlide();
      return;
    }

    window.scrollTo(0, glide.current);
    glide.frame = requestAnimationFrame(runGlide);
    return;
  }

  const distance = glide.target - glide.current;
  const ease = 0.28;
  glide.current += distance * ease;

  if (Math.abs(distance) < 0.45) {
    glide.current = glide.target;
    window.scrollTo(0, glide.current);
    stopGlide();
    return;
  }

  window.scrollTo(0, glide.current);
  glide.frame = requestAnimationFrame(runGlide);
}

function requestGlide() {
  if (!glide.frame) glide.frame = requestAnimationFrame(runGlide);
}

function handleWheel(event) {
  if (!desktopScroll.matches || reducedMotion.matches || document.body.classList.contains("lightbox-open")) return;

  event.preventDefault();
  const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
  const delta = clamp(event.deltaY * scale, -180, 180);

  if (glide.mode !== "wheel") {
    glide.current = window.scrollY;
    glide.target = window.scrollY;
  }

  glide.mode = "wheel";
  glide.targetId = null;
  glide.target = clamp(glide.target + delta * 0.95, 0, maxScroll());
  requestGlide();
}

window.portfolioHandleWheel = handleWheel;
window.addEventListener("wheel", handleWheel, { passive: false });

function navigateTo(id, updateHistory = true, focusTarget = false) {
  const top = targetTop(id);
  if (top === null) return;

  if (updateHistory && window.location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);

  if (reducedMotion.matches) {
    stopGlide();
    window.scrollTo(0, top);
  } else {
    const startY = window.scrollY;
    glide.current = startY;
    glide.startY = startY;
    glide.target = top;
    glide.targetId = id;
    glide.mode = "navigation";
    glide.startTime = performance.now();
    glide.duration = navigationDuration(top - startY);
    requestGlide();
  }

  if (focusTarget) {
    const target = document.getElementById(id);
    target?.setAttribute("tabindex", "-1");
    target?.focus({ preventScroll: true });
  }
}

document.querySelectorAll("[data-scroll-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.hash.slice(1);
    if (!id) return;
    event.preventDefault();
    navigateTo(id, true);
  });
});

document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  navigateTo("main-content", true, true);
});

function followLocation() {
  const id = window.location.hash.slice(1);
  if (id && document.getElementById(id)) navigateTo(id, false);
  else stopGlide();
}

window.addEventListener("popstate", followLocation);
window.addEventListener("hashchange", followLocation);
window.addEventListener("pageshow", () => requestAnimationFrame(() => {
  const id = window.location.hash.slice(1);
  const top = id && targetTop(id);
  if (top !== null && top !== "") window.scrollTo(0, top);
  stopGlide();
  updateScrollUi();
}));

window.addEventListener("resize", () => {
  if (glide.mode === "navigation" && glide.targetId) {
    const nextTarget = targetTop(glide.targetId);
    if (nextTarget !== null) {
      glide.startY = window.scrollY;
      glide.current = window.scrollY;
      glide.target = nextTarget;
      glide.startTime = performance.now();
      glide.duration = navigationDuration(nextTarget - glide.startY);
      requestGlide();
    }
  } else {
    stopGlide();
  }
  requestScrollUiUpdate();
});

window.addEventListener("keydown", (event) => {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) stopGlide();
});
window.addEventListener("pointerdown", stopGlide, { passive: true });
window.addEventListener("touchstart", stopGlide, { passive: true });

const navLinks = new Map([...document.querySelectorAll("[data-nav]")].map((link) => [link.dataset.nav, link]));
const navSections = [...document.querySelectorAll("[data-nav-section]")];
const backToTop = document.getElementById("back-to-top");
const laterPanel = document.getElementById("experience-panel");
const sceneOutro = document.getElementById("scene-outro");
let scrollUiFrame = 0;

function updateScrollUi() {
  const marker = window.scrollY + window.innerHeight * 0.45;
  let active = "top";
  for (const section of navSections) {
    if (section.offsetTop <= marker) active = section.dataset.navSection;
  }

  navLinks.forEach((link, id) => {
    if (id === active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  backToTop.classList.toggle("visible", window.scrollY > laterPanel.offsetTop - window.innerHeight * 0.5);
  document.body.classList.toggle("scene-outro-active", window.scrollY > sceneOutro.offsetTop - window.innerHeight * 0.35);
  scrollUiFrame = 0;
}

function requestScrollUiUpdate() {
  if (!scrollUiFrame) scrollUiFrame = requestAnimationFrame(updateScrollUi);
}

window.addEventListener("scroll", () => {
  if (!glide.mode) {
    glide.current = window.scrollY;
    glide.target = window.scrollY;
  }
  requestScrollUiUpdate();
}, { passive: true });
updateScrollUi();

const resumeToggle = document.getElementById("resume-toggle");
const resumePreview = document.getElementById("resume-preview");
resumeToggle.addEventListener("click", () => {
  const opening = resumePreview.hidden;
  resumePreview.hidden = !opening;
  resumeToggle.setAttribute("aria-expanded", String(opening));
  resumeToggle.textContent = opening ? "Close résumé" : "View résumé";
});

const copyButton = document.getElementById("copy-email");
const copyStatus = document.getElementById("copy-status");
let copyTimer;

copyButton.addEventListener("click", async () => {
  const email = copyButton.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    const field = document.createElement("textarea");
    field.value = email;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;opacity:0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }

  clearTimeout(copyTimer);
  copyStatus.textContent = "Email copied";
  copyTimer = setTimeout(() => { copyStatus.textContent = ""; }, 2200);
});

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");
let lightboxTrigger;

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  lightboxTrigger?.focus();
}

document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
  button.addEventListener("click", () => {
    stopGlide();
    lightboxTrigger = button;
    lightboxImage.src = button.dataset.lightboxSrc;
    lightboxImage.alt = button.dataset.lightboxAlt;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    lightboxClose.focus();
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
});

if (!("IntersectionObserver" in window) || reducedMotion.matches) {
  document.querySelectorAll(".image-reveal").forEach((element) => element.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("visible", entry.isIntersecting));
  }, { threshold: 0.12 });
  document.querySelectorAll(".image-reveal").forEach((element) => revealObserver.observe(element));
}

const dragHint = document.getElementById("drag-hint");
setTimeout(() => dragHint.classList.add("hidden"), 5000);
window.addEventListener("pointermove", () => dragHint.classList.add("hidden"), { once: true, passive: true });
