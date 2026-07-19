(function () {
  /* ---- Scroll-reveal ---- */
  function setupReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ---- Animated stat counters ---- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals) + suffix;
    }

    requestAnimationFrame(tick);
  }

  function setupCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ---- Form handling (contact + newsletter), progressive AJAX submit ---- */
  function setupForm(form) {
    const statusEl = form.querySelector(".form-status");
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener("submit", async (e) => {
      const action = form.getAttribute("action") || "";
      const isConfigured = action && !action.includes("YOUR_FORM_ID");

      if (!isConfigured) {
        e.preventDefault();
        showStatus(
          statusEl,
          "error",
          "This form isn't connected yet. Add a Formspree endpoint in the HTML (see README) to start receiving submissions."
        );
        return;
      }

      e.preventDefault();
      const originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      try {
        const res = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          showStatus(statusEl, "success", "Thanks — your message is on its way. We'll be in touch within 1 business day.");
          form.reset();
        } else {
          showStatus(statusEl, "error", "Something went wrong sending that. Please try again or call us directly.");
        }
      } catch (err) {
        showStatus(statusEl, "error", "Something went wrong sending that. Please try again or call us directly.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }
    });
  }

  function showStatus(el, type, message) {
    if (!el) return;
    el.textContent = message;
    el.className = "form-status is-visible " + type;
  }

  function setupForms() {
    document.querySelectorAll("form[data-ajax-form]").forEach(setupForm);
  }

  /* ---- Prefill "Service of Interest" from ?service= query param ---- */
  function prefillService() {
    const select = document.getElementById("serviceInterest");
    if (!select) return;
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    if (!service) return;
    const match = Array.from(select.options).find((opt) => opt.value === service || opt.textContent === service);
    if (match) select.value = match.value;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupReveal();
    setupCounters();
    setupForms();
    prefillService();
  });
})();
