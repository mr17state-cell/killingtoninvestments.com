const header = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress");
const accessForm = document.querySelector("#access-form");
const accessFormStatus = document.querySelector("#access-form-status");
const accessFormEndpoint =
  "https://formsubmit.co/ajax/d8d72dc4eef7a47f1f749b4c3f34ac20";
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

const showAccessFormError = () => {
  if (!accessFormStatus) return;

  accessFormStatus.textContent =
    "We couldn't send your request. Please try again later.";
  accessFormStatus.dataset.state = "error";
};

const submittedViaFallback = new URLSearchParams(window.location.search).has(
  "submitted",
);
if (submittedViaFallback && accessFormStatus) {
  accessFormStatus.textContent = "Thank you. Your request has been sent.";
  accessFormStatus.dataset.state = "success";
  window.history.replaceState({}, "", `${window.location.pathname}#contact`);
}

accessForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!accessForm.checkValidity()) {
    accessForm.reportValidity();
    return;
  }

  const submitButton = accessForm.querySelector('button[type="submit"]');
  const formData = new FormData(accessForm);

  if (String(formData.get("_honey") || "").trim()) return;

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending";
  }
  accessForm.setAttribute("aria-busy", "true");
  if (accessFormStatus) {
    accessFormStatus.textContent = "Sending your request...";
    delete accessFormStatus.dataset.state;
  }

  try {
    const response = await fetch(accessFormEndpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === "false") {
      throw new Error("Contact request was not accepted");
    }

    accessForm.reset();
    if (accessFormStatus) {
      accessFormStatus.textContent = "Thank you. Your request has been sent.";
      accessFormStatus.dataset.state = "success";
    }
  } catch {
    showAccessFormError();
  } finally {
    accessForm.removeAttribute("aria-busy");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
      submitButton.textContent = "Request access";
    }
  }
});
