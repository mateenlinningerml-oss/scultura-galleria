/**
 * Loads CMS content (texts + sculptures) from /api/content
 * Falls back to baked-in I18N if the API is unavailable.
 */

window.GS_CONTENT = null;
window.GS_SCULPTURES = [];

async function loadSiteContent() {
  try {
    const res = await fetch("/api/content", { cache: "no-store" });
    if (!res.ok) throw new Error("API offline");
    const data = await res.json();
    window.GS_CONTENT = data;

    // Merge CMS texts into I18N
    if (data.texts?.it && typeof I18N !== "undefined") {
      I18N.it = { ...I18N.it, ...data.texts.it };
    }
    if (data.texts?.en && typeof I18N !== "undefined") {
      I18N.en = { ...I18N.en, ...data.texts.en };
    }

    // Build sculpture catalog for lightbox + pages
    window.GS_SCULPTURES = Array.isArray(data.sculptures) ? data.sculptures : [];

    // Settings → logo / email / stats
    applySettings(data.settings);
    return data;
  } catch (err) {
    console.warn("CMS content not loaded, using defaults:", err.message);
    window.GS_SCULPTURES = defaultSculpturesFromI18n();
    return null;
  }
}

/** Default: all sections visible unless explicitly set to false */
const DEFAULT_SECTIONS = {
  topbar: true,
  hero: true,
  visit: true,
  intro: true,
  featured: true,
  process: true,
  quote: true,
  contactHome: true,
  pageGallery: true,
  pageAbout: true,
  pageContact: true,
  aboutMission: true,
  aboutMaterials: true,
  aboutDesign: true,
  aboutQuote: true,
  contactVisitStrip: true,
  contactForm: true,
  contactNext: true
};

function applySettings(settings) {
  if (!settings) return;

  document.querySelectorAll(".logo-mark").forEach((el) => {
    if (settings.logo) el.textContent = settings.logo;
  });

  // Contact email plain text nodes
  if (settings.contactEmail) {
    document.querySelectorAll("[data-contact-email]").forEach((el) => {
      el.textContent = settings.contactEmail;
    });
  }

  const stats = settings.stats || {};
  if (stats.works) {
    document.querySelectorAll("[data-stat='works']").forEach((el) => {
      el.textContent = stats.works;
    });
  }
  if (stats.materials) {
    document.querySelectorAll("[data-stat='materials']").forEach((el) => {
      el.textContent = stats.materials;
    });
  }
  if (stats.rooms) {
    document.querySelectorAll("[data-stat='rooms']").forEach((el) => {
      el.textContent = stats.rooms;
    });
  }

  applySectionVisibility(settings.sections);
}

function applySectionVisibility(sections) {
  const flags = { ...DEFAULT_SECTIONS, ...(sections || {}) };

  document.querySelectorAll("[data-section]").forEach((el) => {
    const key = el.getAttribute("data-section");
    if (!key) return;
    // Missing key → visible; only hide when explicitly false
    const enabled = flags[key] !== false;
    el.hidden = !enabled;
    el.classList.toggle("section-off", !enabled);
    if (!enabled) {
      el.setAttribute("aria-hidden", "true");
    } else {
      el.removeAttribute("aria-hidden");
    }
  });

  // Page enabled flags from builder take precedence when present
  const pages = window.GS_CONTENT?.pages || {};
  if (pages.gallery && pages.gallery.enabled === false) flags.pageGallery = false;
  if (pages.about && pages.about.enabled === false) flags.pageAbout = false;
  if (pages.contact && pages.contact.enabled === false) flags.pageContact = false;

  // Footer / nav links to disabled pages
  document.querySelectorAll("a[href='gallery.html']").forEach((a) => {
    if (a.closest("[data-section]")) return;
    const off = flags.pageGallery === false;
    a.closest("li")?.classList.toggle("section-off", off);
    if (!a.closest("li")) a.hidden = off;
  });
  document.querySelectorAll("a[href='about.html']").forEach((a) => {
    if (a.closest("[data-section]")) return;
    const off = flags.pageAbout === false;
    a.closest("li")?.classList.toggle("section-off", off);
    if (!a.closest("li")) a.hidden = off;
  });
  document.querySelectorAll("a[href='contact.html']").forEach((a) => {
    if (a.closest("[data-section]")) return;
    const off = flags.pageContact === false;
    a.closest("li")?.classList.toggle("section-off", off);
    if (!a.closest("li")) a.hidden = off;
  });
}

function defaultSculpturesFromI18n() {
  const ids = ["aurora", "minerva", "tiber", "vesper", "forum", "luna", "vulcan", "silva", "roma"];
  const titles = {
    aurora: "Aurora",
    minerva: "Minerva",
    tiber: "Tiber",
    vesper: "Vesper",
    forum: "Forum",
    luna: "Luna",
    vulcan: "Vulcanus",
    silva: "Silva",
    roma: "Roma Aeterna"
  };
  const cats = {
    aurora: "marmor",
    minerva: "bronze",
    tiber: "stein",
    vesper: "ton",
    forum: "marmor",
    luna: "stein",
    vulcan: "bronze",
    silva: "holz",
    roma: "marmor"
  };
  return ids.map((id, i) => ({
    id,
    title: titles[id],
    inventory: `GS-00${i + 1}`,
    year: "",
    category: cats[id],
    featured: i < 3,
    image: "",
    meta: {
      it: typeof t === "function" ? t(`sculpt.${id}.meta`, "it") : "",
      en: typeof t === "function" ? t(`sculpt.${id}.meta`, "en") : ""
    },
    desc: {
      it: typeof t === "function" ? t(`sculpt.${id}.desc`, "it") : "",
      en: typeof t === "function" ? t(`sculpt.${id}.desc`, "en") : ""
    }
  }));
}

function getSculptureById(id) {
  return (window.GS_SCULPTURES || []).find((s) => s.id === id) || null;
}

function renderSculptureCard(s, lang, index = 0, variant = "default") {
  const materialKey =
    s.materialKey ||
    (s.category === "marmor"
      ? "mat.marble"
      : s.category === "bronze"
        ? "mat.bronze"
        : s.category === "ton"
          ? "mat.terra"
          : s.category === "holz"
            ? "mat.wood"
            : "mat.stone");
  const materialLabel = typeof t === "function" ? t(materialKey, lang) : materialKey;
  const metaShort =
    (s.meta && (s.meta[lang] || s.meta.it)) ||
    [s.size, s.year].filter(Boolean).join(" · ");
  const desc = (s.desc && (s.desc[lang] || s.desc.it)) || "";

  const media = s.image
    ? `<img src="${escapeAttr(s.image)}" alt="${escapeAttr(s.title)}" loading="lazy" />`
    : `<div class="sculpture-shape">${placeholderSvg(s.id || s.category)}</div>`;

  const editorial = variant === "editorial";
  return `
    <article class="card${editorial ? " card--editorial" : ""}" data-sculpture="${escapeAttr(s.id)}" data-category="${escapeAttr(s.category || "")}" data-index="${index}">
      <a class="card-open" href="artwork.html?id=${encodeURIComponent(s.id)}" aria-label="${escapeAttr((lang === "en" ? "View " : "Apri ") + (s.title || "opera"))}">
        <div class="card-media">
          <span class="card-badge">${escapeHtml(materialLabel)}</span>
          ${s.inventory ? `<span class="card-inv">${escapeHtml(s.inventory)}</span>` : ""}
          ${media}
          ${editorial ? `<span class="card-view">${lang === "en" ? "View work" : "Vedi l’opera"}</span>` : ""}
        </div>
        <div class="card-body">
          <div class="card-heading-row">
            <h3 class="card-title">${escapeHtml(s.title || "")}</h3>
            ${s.year ? `<span class="card-year">${escapeHtml(s.year)}</span>` : ""}
          </div>
          <p class="card-meta">${escapeHtml(metaShort)}</p>
          ${editorial && desc ? `<p class="card-excerpt">${escapeHtml(desc)}</p>` : ""}
          <div class="card-footer">
            <span class="card-material">${escapeHtml(materialLabel)}</span>
            ${s.size ? `<span class="card-size">${escapeHtml(s.size)}</span>` : ""}
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderGalleryGrids() {
  const lang = typeof getLang === "function" ? getLang() : "it";
  const all = window.GS_SCULPTURES || [];
  const featured = all.filter((s) => s.featured);
  const list = featured.length ? featured : all.slice(0, 3);

  document.querySelectorAll("[data-gallery='featured']").forEach((el) => {
    el.innerHTML = list.map((s, index) => renderSculptureCard(s, lang, index, "default")).join("");
  });

  document.querySelectorAll("[data-gallery='all']").forEach((el) => {
    el.innerHTML = all.map((s, index) => renderSculptureCard(s, lang, index, "editorial")).join("");
  });
}

function placeholderSvg(seed) {
  // Reuse simple abstract form
  const tones = ["#e8e0d4", "#c9bba8", "#a89880"];
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="100" cy="55" rx="28" ry="34" fill="${tones[0]}"/>
    <rect x="88" y="85" width="24" height="70" rx="8" fill="${tones[1]}"/>
    <ellipse cx="100" cy="170" rx="42" ry="12" fill="${tones[2]}"/>
  </svg>`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

// Re-render when language changes
window.addEventListener("langchange", () => {
  if (typeof renderCurrentPage === "function") {
    renderCurrentPage();
  }
  renderGalleryGrids();
  if (typeof initFilters === "function") initFilters();
  if (typeof initContactForm === "function") initContactForm();
});
