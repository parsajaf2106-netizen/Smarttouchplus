(function () {
  async function inject(targetId, url) {
    const target = document.getElementById(targetId);
    if (!target) return;
    try {
      const res = await fetch(url);
      target.innerHTML = await res.text();
    } catch (err) {
      console.error("Failed to load " + url, err);
    }
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) link.classList.add("active");
    });
  }

  function setupMobileNav() {
    const toggle = document.getElementById("navToggle");
    const panel = document.getElementById("navMobilePanel");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        panel.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setFooterYear() {
    const el = document.getElementById("footerYear");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
      inject("site-header", "/partials/header.html"),
      inject("site-footer", "/partials/footer.html"),
    ]);
    setActiveNav();
    setupMobileNav();
    setFooterYear();
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  });
})();
