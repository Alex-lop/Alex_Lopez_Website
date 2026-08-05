const resumeUrl = document.body.dataset.resumeUrl;
document.querySelectorAll("[data-resume-link]").forEach((link) => {
  link.href = resumeUrl;
});

const header = document.querySelector("#site-header");
const menuButton = document.querySelector("#menu-toggle");
const nav = document.querySelector("#primary-nav");

function setMenu(open) {
  header.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
}

menuButton.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});

const navLinks = new Map(
  [...document.querySelectorAll("[data-section-link]")].map((link) => [link.dataset.sectionLink, link]),
);
const visibleSections = new Map();

function setActiveSection(id) {
  navLinks.forEach((link, sectionId) => {
    if (sectionId === id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => visibleSections.set(entry.target.dataset.navSection, entry.intersectionRatio));
    const active = [...visibleSections.entries()]
      .filter(([, ratio]) => ratio > 0)
      .sort((a, b) => b[1] - a[1])[0];
    setActiveSection(active?.[0]);
  },
  { rootMargin: "-20% 0px -55%", threshold: [0, 0.01, 0.25, 0.5, 0.75] },
);

document.querySelectorAll("[data-nav-section]").forEach((section) => sectionObserver.observe(section));

const progressBar = document.querySelector("#page-progress-bar");
const backToTop = document.querySelector("#back-to-top");
const hero = document.querySelector(".hero");
let scrollFrame;

function updateScrollUi() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  backToTop.classList.toggle("visible", window.scrollY >= hero.offsetHeight - header.offsetHeight - 32);
  scrollFrame = undefined;
}

function requestScrollUiUpdate() {
  if (scrollFrame === undefined) scrollFrame = requestAnimationFrame(updateScrollUi);
}

window.addEventListener("scroll", requestScrollUiUpdate, { passive: true });
window.addEventListener("resize", requestScrollUiUpdate);
updateScrollUi();

const copyButton = document.querySelector("#copy-email");
const copyStatus = document.querySelector("#copy-status");
let copyTimer;

async function copyEmail() {
  const email = copyButton.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    const field = document.createElement("textarea");
    field.value = email;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }

  clearTimeout(copyTimer);
  copyStatus.textContent = "Email copied";
  copyTimer = setTimeout(() => {
    copyStatus.textContent = "";
  }, 2400);
}

copyButton.addEventListener("click", copyEmail);
