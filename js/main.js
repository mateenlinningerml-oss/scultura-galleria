/* Galleria Scultura — public site */

let currentSculptureId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadSiteContent();
  initI18n();
  renderCurrentPage();
  renderGalleryGrids();
  renderArtworkPage();
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
    media.innerHTML = `<img src="${data.image}" alt="${data.title}" style="width:100%;height:100%;object-fit:contain;object-position:center;" />`;
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
  const prevBtn = lightbox.querySelector(".lightbox-prev");
  const nextBtn = lightbox.querySelector(".lightbox-next");

  const navigate = (direction) => {
    const works = (window.GS_SCULPTURES || []).filter((item) => item && item.id);
    if (!works.length || !currentSculptureId) return;
    const currentIndex = works.findIndex((item) => item.id === currentSculptureId);
    const safeIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + works.length) % works.length;
    openSculpture(works[nextIndex].id);
  };

  document.body.addEventListener("click", (e) => {
    const card = e.target.closest("[data-sculpture]");
    if (card && !e.target.closest("a[href*='artwork.html']")) openSculpture(card.dataset.sculpture);
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
  prevBtn?.addEventListener("click", () => navigate(-1));
  nextBtn?.addEventListener("click", () => navigate(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") navigate(-1);
    if (e.key === "ArrowRight") navigate(1);
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


function renderArtworkPage() {
  const root = document.getElementById("artwork-root");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const works = (window.GS_SCULPTURES || []).filter((item) => item && item.id);
  const work = works.find((item) => item.id === id) || works[0];
  const lang = typeof getLang === "function" ? getLang() : "it";

  if (!work) {
    root.innerHTML = `<section class="artwork-empty"><p>${lang === "en" ? "No work available." : "Nessuna opera disponibile."}</p><a class="btn btn-outline" href="gallery.html">${lang === "en" ? "Back to works" : "Torna alle opere"}</a></section>`;
    return;
  }

  const currentIndex = works.findIndex((item) => item.id === work.id);
  const prev = works[(currentIndex - 1 + works.length) % works.length];
  const next = works[(currentIndex + 1) % works.length];
  const materialKey = work.materialKey || (work.category === "holz" ? "mat.wood" : work.category === "bronze" ? "mat.bronze" : work.category === "ton" ? "mat.terra" : work.category === "marmor" ? "mat.marble" : "mat.stone");
  const material = typeof t === "function" ? t(materialKey, lang) : materialKey;
  const description = (work.desc && (work.desc[lang] || work.desc.it)) || "";
  const story = (work.story && (work.story[lang] || work.story.it)) || description;
  const images = [work.image, ...(Array.isArray(work.images) ? work.images : [])].filter(Boolean);
  const hero = images[0] || "";
  const detailImages = images.slice(1);
  const related = works.filter((item) => item.id !== work.id && (item.category === work.category || item.featured)).slice(0, 3);
  const heroMedia = hero
    ? `<img src="${escapeArtwork(hero)}" alt="${escapeArtwork(work.title || "")}" />`
    : `<div class="artwork-placeholder">${sculptureSvg(work.id)}</div>`;

  document.title = `${work.title || (lang === "en" ? "Work" : "Opera")} — Emanuele “Willy” Bellemo`;

  root.innerHTML = `
    <article class="artwork-detail">
      <section class="artwork-hero">
        <div class="artwork-hero-media">${heroMedia}</div>
        <div class="artwork-hero-caption">
          <p class="section-kicker">${lang === "en" ? "Selected work" : "Opera selezionata"}</p>
          <h1>${escapeArtwork(work.title || "")}</h1>
          <p class="artwork-hero-meta">${escapeArtwork([material, work.year].filter(Boolean).join(" · "))}</p>
          <a href="#artwork-story" class="artwork-scroll-link">${lang === "en" ? "Discover the work" : "Scopri l’opera"} ↓</a>
        </div>
      </section>

      <section class="artwork-facts" id="artwork-story">
        <div class="artwork-facts-title">
          <p class="section-kicker">${lang === "en" ? "The work" : "L’opera"}</p>
          <h2>${escapeArtwork(work.title || "")}</h2>
        </div>
        <dl class="artwork-facts-list">
          <div><dt>${lang === "en" ? "Material" : "Materiale"}</dt><dd>${escapeArtwork(material)}</dd></div>
          <div><dt>${lang === "en" ? "Dimensions" : "Dimensioni"}</dt><dd>${escapeArtwork(work.size || "—")}</dd></div>
          <div><dt>${lang === "en" ? "Year" : "Anno"}</dt><dd>${escapeArtwork(work.year || "—")}</dd></div>
          ${work.inventory ? `<div><dt>${lang === "en" ? "Inventory" : "Inventario"}</dt><dd>${escapeArtwork(work.inventory)}</dd></div>` : ""}
        </dl>
        <div class="artwork-story-copy">
          <p>${escapeArtwork(story)}</p>
        </div>
      </section>

      <section class="artwork-details-gallery ${detailImages.length ? "" : "artwork-details-gallery--empty"}">
        ${detailImages.length
          ? detailImages.map((src, i) => `<figure class="artwork-detail-image artwork-detail-image--${i + 1}"><button type="button" class="artwork-detail-open" data-artwork-image-index="${i + 1}" aria-label="${lang === "en" ? "Open image" : "Apri immagine"} ${i + 1}"><img src="${escapeArtwork(src)}" alt="${escapeArtwork((work.title || "") + " — dettaglio " + (i + 1))}" loading="lazy" /></button></figure>`).join("")
          : `<div class="artwork-detail-note"><span>${lang === "en" ? "Detail photographs can be added later in the admin." : "Le fotografie di dettaglio potranno essere aggiunte in seguito nel pannello admin."}</span></div>`}
      </section>

      <nav class="artwork-pagination" aria-label="${lang === "en" ? "Works navigation" : "Navigazione opere"}">
        <a href="artwork.html?id=${encodeURIComponent(prev.id)}"><span>← ${lang === "en" ? "Previous" : "Precedente"}</span><strong>${escapeArtwork(prev.title || "")}</strong></a>
        <a class="artwork-pagination-all" href="gallery.html">${lang === "en" ? "All works" : "Tutte le opere"}</a>
        <a href="artwork.html?id=${encodeURIComponent(next.id)}"><span>${lang === "en" ? "Next" : "Successiva"} →</span><strong>${escapeArtwork(next.title || "")}</strong></a>
      </nav>

      ${related.length ? `<section class="artwork-related"><div class="artwork-related-heading"><p class="section-kicker">${lang === "en" ? "Continue exploring" : "Continua la visita"}</p><h2>${lang === "en" ? "Related works" : "Opere affini"}</h2></div><div class="artwork-related-grid">${related.map((item) => `<a href="artwork.html?id=${encodeURIComponent(item.id)}" class="artwork-related-card"><div class="artwork-related-media">${item.image ? `<img src="${escapeArtwork(item.image)}" alt="${escapeArtwork(item.title || "")}" loading="lazy" />` : sculptureSvg(item.id)}</div><h3>${escapeArtwork(item.title || "")}</h3><p>${escapeArtwork([item.year, item.size].filter(Boolean).join(" · "))}</p></a>`).join("")}</div></section>` : ""}
    </article>`;

  initArtworkImageViewer(images, work.title || "", lang);
}

function initArtworkImageViewer(images, title, lang) {
  if (!Array.isArray(images) || !images.length) return;
  let current = 0;
  const viewer = document.createElement("div");
  viewer.className = "artwork-image-viewer";
  viewer.setAttribute("aria-hidden", "true");
  viewer.innerHTML = `
    <div class="artwork-image-viewer-backdrop" data-viewer-close></div>
    <div class="artwork-image-viewer-dialog" role="dialog" aria-modal="true" aria-label="${escapeArtwork(title)}">
      <button type="button" class="artwork-image-viewer-close" data-viewer-close aria-label="${lang === "en" ? "Close" : "Chiudi"}">×</button>
      <button type="button" class="artwork-image-viewer-nav artwork-image-viewer-prev" data-viewer-prev aria-label="${lang === "en" ? "Previous image" : "Immagine precedente"}">←</button>
      <img src="" alt="">
      <button type="button" class="artwork-image-viewer-nav artwork-image-viewer-next" data-viewer-next aria-label="${lang === "en" ? "Next image" : "Immagine successiva"}">→</button>
      <div class="artwork-image-viewer-count"></div>
    </div>`;
  document.body.appendChild(viewer);
  const image = viewer.querySelector("img");
  const count = viewer.querySelector(".artwork-image-viewer-count");
  const update = () => {
    image.src = images[current];
    image.alt = `${title} — ${current + 1}`;
    count.textContent = `${current + 1} / ${images.length}`;
  };
  const open = (index) => {
    current = Math.max(0, Math.min(images.length - 1, index));
    update();
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("artwork-viewer-open");
  };
  const close = () => {
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("artwork-viewer-open");
  };
  rootArtworkButtons().forEach((button) => button.addEventListener("click", () => open(Number(button.dataset.artworkImageIndex))));
  viewer.querySelectorAll("[data-viewer-close]").forEach((button) => button.addEventListener("click", close));
  viewer.querySelector("[data-viewer-prev]").addEventListener("click", () => { current = (current - 1 + images.length) % images.length; update(); });
  viewer.querySelector("[data-viewer-next]").addEventListener("click", () => { current = (current + 1) % images.length; update(); });
  document.addEventListener("keydown", (event) => {
    if (!viewer.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") { current = (current - 1 + images.length) % images.length; update(); }
    if (event.key === "ArrowRight") { current = (current + 1) % images.length; update(); }
  });
}

function rootArtworkButtons() {
  return document.querySelectorAll("[data-artwork-image-index]");
}

function escapeArtwork(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

window.addEventListener("langchange", renderArtworkPage);
