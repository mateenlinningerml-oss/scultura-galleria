/* Galleria Scultura — public site */

let currentSculptureId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadSiteContent();
  initI18n();
  renderCurrentPage();
  renderGalleryGrids();
  initHeader();
  initNav();
  initFilters();
  initLightbox();
  initContactForm();
  initReveal();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

function renderCurrentPage() {
  const root = document.getElementById("page-root") || document.querySelector("[data-page-root]");
  if (!root || !window.GS_PAGE_RENDERER) return;
  const key = root.getAttribute("data-page-root") || document.body.dataset.page || "home";
  // Map body data-page names to pages keys
  const map = { home: "home", gallery: "gallery", about: "about", contact: "contact" };
  const pageKey = map[key] || key;
  window.GS_PAGE_RENDERER.renderPage(pageKey, root);
  // re-apply logo/email/stats after DOM rebuild
  if (window.GS_CONTENT?.settings && typeof applySettings === "function") {
    applySettings(window.GS_CONTENT.settings);
  }
}

function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initFilters() {
  const bar = document.querySelector(".filter-bar");
  if (!bar) return;

  // rebind fresh
  bar.onclick = (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    bar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    document.querySelectorAll(".card[data-category]").forEach((card) => {
      const match = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("hidden", !match);
    });
  };
}

function sculptureSvg(id) {
  const tones = {
    aurora: ["#e8e0d4", "#c9bba8", "#a89880"],
    minerva: ["#8a7a5c", "#6b5a42", "#4a3d2a"],
    tiber: ["#d4cfc4", "#b8b0a0", "#9a9080"],
    vesper: ["#c47a52", "#a85c38", "#8a4428"],
    forum: ["#f0ebe3", "#d4cbc0", "#b0a498"],
    luna: ["#f5f2ec", "#e0d9ce", "#c8bfb2"],
    vulcan: ["#5c4a38", "#3d3024", "#2a2118"],
    silva: ["#8b6b3d", "#6e5330", "#4f3a22"],
    roma: ["#ebe4d8", "#cfc4b4", "#a89888"]
  };
  const [a, b, c] = tones[id] || tones.aurora;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="100" cy="55" rx="28" ry="34" fill="${a}"/>
    <rect x="88" y="85" width="24" height="70" rx="8" fill="${b}"/>
    <ellipse cx="100" cy="170" rx="42" ry="12" fill="${c}"/>
  </svg>`;
}

function getSculptureData(id) {
  const s = typeof getSculptureById === "function" ? getSculptureById(id) : null;
  const lang = typeof getLang === "function" ? getLang() : "it";

  if (s) {
    const meta = (s.meta && (s.meta[lang] || s.meta.it)) || "";
    const desc = (s.desc && (s.desc[lang] || s.desc.it)) || "";
    return {
      title: s.title || id,
      meta,
      desc,
      image: s.image || "",
      svg: sculptureSvg(s.id || id)
    };
  }

  // Fallback to i18n keys
  return {
    title: id,
    meta: typeof t === "function" ? t(`sculpt.${id}.meta`) : "",
    desc: typeof t === "function" ? t(`sculpt.${id}.desc`) : "",
    image: "",
    svg: sculptureSvg(id)
  };
}

function openSculpture(id) {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  const media = lightbox.querySelector(".lightbox-media");
  const title = lightbox.querySelector(".lightbox-title");
  const meta = lightbox.querySelector(".lightbox-meta");
  const desc = lightbox.querySelector(".lightbox-desc");
  const data = getSculptureData(id);
  currentSculptureId = id;

  if (data.image) {
    media.innerHTML = `<img src="${data.image}" alt="${data.title}" style="width:100%;height:100%;object-fit:cover;" />`;
  } else {
    media.innerHTML = data.svg;
  }
  title.textContent = data.title;
  meta.textContent = data.meta;
  desc.textContent = data.desc;
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

window.openSculpture = openSculpture;

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const closeBtn = lightbox.querySelector(".lightbox-close");

  document.body.addEventListener("click", (e) => {
    const card = e.target.closest("[data-sculpture]");
    if (card) openSculpture(card.dataset.sculpture);
  });

  window.refreshLightboxLang = function () {
    if (!currentSculptureId || !lightbox.classList.contains("open")) return;
    const data = getSculptureData(currentSculptureId);
    lightbox.querySelector(".lightbox-meta").textContent = data.meta;
    lightbox.querySelector(".lightbox-desc").textContent = data.desc;
    lightbox.querySelector(".lightbox-title").textContent = data.title;
  };

  const close = () => {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    currentSculptureId = null;
  };

  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("open")) close();
  });
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const success = form.querySelector(".form-success");
    if (success) {
      success.classList.add("show");
      success.textContent = typeof t === "function" ? t("form.success") : "OK";
    }
    form.reset();
    setTimeout(() => success?.classList.remove("show"), 5000);
  });
}

function initReveal() {
  const els = document.querySelectorAll(".card, .process-card, .material-card, .intro-visual, .intro-text");
  if (!els.length || !("IntersectionObserver" in window)) return;

  els.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
}
