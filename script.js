const header = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress");
const accessForm = document.querySelector("#access-form");
const accessFormStatus = document.querySelector("#access-form-status");
const accessEmail = "alex@killingtontechnologies.com";
const countUps = document.querySelectorAll(".count-up");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const onScroll = () => {
  const y = window.scrollY;
  header?.toggleAttribute("data-scrolled", y > 80);

  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, y / max) : 0;
    progressBar.style.width = `${pct * 100}%`;
  }
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
});

const revealables = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && revealables.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("is-in"));
}

const formatCount = (value) => Math.round(value).toLocaleString("en-US");

const animateCountUp = (el) => {
  if (el.dataset.counted === "true") return;

  const target = Number(el.dataset.countTarget || "0");
  if (!Number.isFinite(target)) return;

  el.dataset.counted = "true";

  if (prefersReducedMotion) {
    el.textContent = formatCount(target);
    return;
  }

  const duration = 1350;
  const start = performance.now();

  const tick = (now) => {
    const elapsed = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    el.textContent = formatCount(target * eased);

    if (elapsed < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = formatCount(target);
    }
  };

  requestAnimationFrame(tick);
};

if ("IntersectionObserver" in window && countUps.length) {
  const countIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCountUp(entry.target);
          countIo.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.7 },
  );

  countUps.forEach((el) => countIo.observe(el));
} else {
  countUps.forEach(animateCountUp);
}

accessForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!accessForm.checkValidity()) {
    accessForm.reportValidity();
    return;
  }

  const formData = new FormData(accessForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const organization = String(formData.get("organization") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const body = [
    "Investor access request",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    organization ? `Organization: ${organization}` : "Organization:",
    "",
    "Requested materials or access level:",
    message || "Please provide access to the Killington private data room.",
  ].join("\n");

  const subject = encodeURIComponent(`Investor access request - ${name}`);
  const encodedBody = encodeURIComponent(body);

  window.location.href = `mailto:${accessEmail}?subject=${subject}&body=${encodedBody}`;

  if (accessFormStatus) {
    accessFormStatus.textContent =
      "Your email client should open with the access request prepared.";
  }
});
