/* Museo Admin */

let content = null;
let textLang = "it";
let dirty = false;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const TEXT_GROUPS = [
  { id: "nav", title: "Navigation & Logo", prefixes: ["nav.", "logo.", "topbar.", "meta."] },
  { id: "hero", title: "Hero / Eingang", prefixes: ["hero."] },
  { id: "visit", title: "Besucher-Info", prefixes: ["visit."] },
  { id: "intro", title: "Museum / Intro", prefixes: ["intro."] },
  { id: "featured", title: "Auswahl / Galerie", prefixes: ["featured.", "gallery.", "filter.", "mat."] },
  { id: "process", title: "Pfad / Prozess", prefixes: ["process."] },
  { id: "quote", title: "Zitat", prefixes: ["quote."] },
  { id: "contact", title: "Kontakt & Formular", prefixes: ["contact.", "form."] },
  { id: "footer", title: "Footer", prefixes: ["footer."] },
  { id: "about", title: "Über das Museum", prefixes: ["about."] },
  { id: "other", title: "Weitere Texte", prefixes: [] }
];

const CATEGORIES = [
  { value: "marmor", label: "Marmor" },
  { value: "bronze", label: "Bronze" },
  { value: "ton", label: "Terrakotta" },
  { value: "stein", label: "Stein" },
  { value: "holz", label: "Holz" }
];

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/api/admin/login" && path !== "/api/admin/me") {
    showLoginOnly();
    throw new Error("Sitzung abgelaufen — bitte erneut anmelden.");
  }
  if (!res.ok) throw new Error(data.error || `Fehler ${res.status}`);
  return data;
}

function toast(msg, isError = false) {
  const el = $("#toast");
  el.hidden = false;
  el.textContent = msg;
  el.classList.toggle("error", isError);
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 3200);
}

function markDirty() {
  dirty = true;
}

/* ---------- Auth (strict gate) ---------- */
function showLoginOnly() {
  document.body.classList.remove("is-authenticated");
  document.body.classList.add("auth-locked");
  const login = $("#login-view");
  const app = $("#app-view");
  if (login) {
    login.hidden = false;
    login.setAttribute("aria-hidden", "false");
  }
  if (app) {
    app.hidden = true;
    app.setAttribute("aria-hidden", "true");
  }
  content = null;
}

function showAppShell() {
  document.body.classList.add("is-authenticated");
  document.body.classList.remove("auth-locked");
  const login = $("#login-view");
  const app = $("#app-view");
  if (login) {
    login.hidden = true;
    login.setAttribute("aria-hidden", "true");
  }
  if (app) {
    app.hidden = false;
    app.setAttribute("aria-hidden", "false");
  }
}

async function checkAuth() {
  showLoginOnly();
  try {
    const me = await api("/api/admin/me");
    if (me.authenticated) {
      await enterApp();
    }
  } catch {
    showLoginOnly();
  }
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#login-error");
  const btn = $("#login-submit");
  err.hidden = true;
  btn.disabled = true;
  try {
    const password = $("#password").value;
    if (!password.trim()) {
      throw new Error("Bitte Passwort eingeben.");
    }
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });
    $("#password").value = "";
    await enterApp();
  } catch (ex) {
    showLoginOnly();
    err.hidden = false;
    err.textContent = ex.message === "Password errata"
      ? "Falsches Passwort."
      : ex.message;
    $("#password").focus();
  } finally {
    btn.disabled = false;
  }
});

$("#logout-btn").addEventListener("click", async () => {
  try {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
  } catch {
    /* ignore */
  }
  showLoginOnly();
  location.reload();
});

async function enterApp() {
  // First verify session again — never show app without auth
  const me = await api("/api/admin/me");
  if (!me.authenticated) {
    showLoginOnly();
    throw new Error("Nicht angemeldet.");
  }

  content = await api("/api/admin/content");
  window.__adminContent = content;
  window.__adminApi = api;
  window.__adminMarkDirty = markDirty;
  window.__adminToast = toast;
  window.__adminOpenBlockEditor = openBlockEditor;
  window.__adminRenderBuilderList = renderBuilder;
  window.__builderPage = builderPage || "home";
  showAppShell();
  renderAll();
  dirty = false;
}

/* ---------- Navigation ---------- */
$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const panel = btn.dataset.panel;
    $$(".panel").forEach((p) => { p.hidden = true; });
    $(`#panel-${panel}`).hidden = false;
    const titles = {
      sculptures: ["Werke & Bilder", "Skulpturen anlegen, Bilder hochladen, in der Galerie anzeigen."],
      builder: ["Visueller Baukasten", "Seite sehen, Bilder hochladen & frei verschieben, Blöcke sortieren."],
      texts: ["Texte (IT / EN)", "Alle Website-Texte — Italienisch und Englisch."],
      sections: ["Sektionen", "Bereiche der Website ein- oder ausblenden (z. B. Entrance / Hero)."],
      settings: ["Einstellungen", "Logo, E-Mail und Kennzahlen."]
    };
    $("#panel-title").textContent = titles[panel][0];
    $("#panel-sub").textContent = titles[panel][1];
    document.querySelector("#app-view")?.classList.toggle("builder-mode", panel === "builder");
    if (panel === "builder" && window.GS_VISUAL) {
      window.__builderPage = builderPage;
      window.__adminContent = content;
      window.GS_VISUAL.refresh();
    }
  });
});

/* ---------- Render ---------- */
const SECTION_DEFS = [
  {
    group: "Startseite",
    items: [
      { key: "hero", label: "Entrance / Hero", hint: "Großer Eingangsbereich oben" },
      { key: "visit", label: "Besucher-Info-Streifen", hint: "Orari · Ingresso · Sede" },
      { key: "intro", label: "Il Museo / Intro", hint: "Text + Statistik" },
      { key: "featured", label: "Auswahl aus der Sammlung", hint: "Werke auf der Startseite" },
      { key: "process", label: "Percorso / Prozess", hint: "Vier Schritte" },
      { key: "quote", label: "Zitat", hint: "Epigraph-Block" },
      { key: "contactHome", label: "Kontakt auf der Startseite", hint: "Formular + Adresse" }
    ]
  },
  {
    group: "Global",
    items: [
      { key: "topbar", label: "Obere Museumsleiste", hint: "Ort · Sammlung · Link" }
    ]
  },
  {
    group: "Seiten (Navigation)",
    items: [
      { key: "pageGallery", label: "Seite: Collezione", hint: "Galerie-Seite + Menüpunkt" },
      { key: "pageAbout", label: "Seite: Il Museo", hint: "About-Seite + Menüpunkt" },
      { key: "pageContact", label: "Seite: Visita", hint: "Kontakt-Seite + Menüpunkt" }
    ]
  },
  {
    group: "Seite „Il Museo“",
    items: [
      { key: "aboutMission", label: "Mission / Timeline", hint: "" },
      { key: "aboutMaterials", label: "Materiali", hint: "" },
      { key: "aboutDesign", label: "Allestimento", hint: "" },
      { key: "aboutQuote", label: "Zitat am Ende", hint: "" }
    ]
  },
  {
    group: "Seite „Visita“",
    items: [
      { key: "contactVisitStrip", label: "Besucher-Streifen", hint: "" },
      { key: "contactForm", label: "Segreteria / Formular", hint: "" },
      { key: "contactNext", label: "Prossima sala", hint: "Link zur Sammlung" }
    ]
  }
];

function ensureSections() {
  content.settings = content.settings || {};
  content.settings.sections = content.settings.sections || {};
  SECTION_DEFS.forEach((g) => {
    g.items.forEach((item) => {
      if (typeof content.settings.sections[item.key] !== "boolean") {
        content.settings.sections[item.key] = true;
      }
    });
  });
}

let builderPage = "home";
let builderLang = "it";
let editingBlockId = null;

function renderAll() {
  ensurePages();
  renderSculptures();
  renderBuilder();
  renderTexts();
  renderSections();
  renderSettings();
  fillBuilderTypeSelect();
}

function ensurePages() {
  content.pages = content.pages || {};
  ["home", "gallery", "about", "contact"].forEach((key) => {
    if (!content.pages[key]) {
      content.pages[key] = { enabled: true, blocks: [] };
    }
    if (!Array.isArray(content.pages[key].blocks)) {
      content.pages[key].blocks = [];
    }
  });
}

function fillBuilderTypeSelect() {
  const sel = $("#builder-add-type");
  if (!sel || !window.GS_BLOCKS) return;
  const types = window.GS_BLOCKS.BLOCK_TYPES;
  sel.innerHTML = Object.keys(types)
    .map((k) => `<option value="${k}">${escapeHtml(types[k].label)}</option>`)
    .join("");
}

function renderBuilder() {
  ensurePages();
  window.__adminContent = content;
  window.__builderPage = builderPage;
  const page = content.pages[builderPage];
  const list = $("#builder-list");
  const en = $("#builder-page-enabled");
  if (!page) return;

  if (en) {
    en.checked = page.enabled !== false;
  }

  // Visual mode
  if (window.GS_VISUAL) {
    window.GS_VISUAL.refresh();
  }

  // Optional list mode
  if (!list || list.hidden) return;

  const types = window.GS_BLOCKS?.BLOCK_TYPES || {};
  list.innerHTML = "";

  if (!page.blocks.length) {
    list.innerHTML = `<p class="muted">Noch keine Blöcke — fügen Sie oben einen Baustein hinzu.</p>`;
    return;
  }

  page.blocks.forEach((block, index) => {
    const meta = types[block.type] || { label: block.type, icon: "?", description: "" };
    const card = document.createElement("article");
    card.className = "builder-card" + (block.enabled === false ? " is-off" : "");
    card.innerHTML = `
      <div class="builder-card-icon">${escapeHtml(meta.icon || "•")}</div>
      <div class="builder-card-meta">
        <strong>${escapeHtml(meta.label || block.type)}</strong>
        <span>${escapeHtml(meta.description || block.type)} · ${escapeHtml(block.id)}</span>
      </div>
      <div class="builder-card-actions">
        <button type="button" class="btn btn-outline btn-sm" data-b-up ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="btn btn-outline btn-sm" data-b-down ${index === page.blocks.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="btn btn-outline btn-sm" data-b-toggle>${block.enabled === false ? "Ein" : "Aus"}</button>
        <button type="button" class="btn btn-outline btn-sm" data-b-edit>Bearbeiten</button>
        <button type="button" class="btn btn-danger btn-sm" data-b-del>Löschen</button>
      </div>
    `;
    card.querySelector("[data-b-up]")?.addEventListener("click", () => moveBlock(index, -1));
    card.querySelector("[data-b-down]")?.addEventListener("click", () => moveBlock(index, 1));
    card.querySelector("[data-b-toggle]")?.addEventListener("click", () => {
      block.enabled = block.enabled === false;
      markDirty();
      renderBuilder();
    });
    card.querySelector("[data-b-edit]")?.addEventListener("click", () => openBlockEditor(block.id));
    card.querySelector("[data-b-del]")?.addEventListener("click", () => {
      if (!confirm("Block löschen?")) return;
      page.blocks.splice(index, 1);
      markDirty();
      renderBuilder();
    });
    list.appendChild(card);
  });
}

function moveBlock(index, dir) {
  const blocks = content.pages[builderPage].blocks;
  const j = index + dir;
  if (j < 0 || j >= blocks.length) return;
  const tmp = blocks[index];
  blocks[index] = blocks[j];
  blocks[j] = tmp;
  markDirty();
  renderBuilder();
}

function biField(val, lang) {
  if (!val || typeof val === "string") {
    return { it: val || "", en: val || "" }[lang] || "";
  }
  return val[lang] || "";
}

function setBiField(obj, key, lang, value) {
  if (!obj[key] || typeof obj[key] === "string") {
    obj[key] = { it: obj[key] || "", en: obj[key] || "" };
  }
  obj[key][lang] = value;
}

function openBlockEditor(blockId) {
  ensurePages();
  const block = content.pages[builderPage].blocks.find((b) => b.id === blockId);
  if (!block) return;
  editingBlockId = blockId;
  builderLang = "it";
  $$("[data-builder-lang]").forEach((t) => t.classList.toggle("active", t.dataset.builderLang === "it"));
  const types = window.GS_BLOCKS?.BLOCK_TYPES || {};
  $("#builder-modal-title").textContent =
    (types[block.type]?.label || block.type) + " bearbeiten";
  renderBlockEditorFields(block);
  $("#builder-modal").hidden = false;
}

function closeBlockEditor() {
  editingBlockId = null;
  $("#builder-modal").hidden = true;
  // refresh visual preview after edits
  if (window.GS_VISUAL) window.GS_VISUAL.renderVisualPreview();
}

function renderBlockEditorFields(block) {
  const root = $("#builder-modal-fields");
  const d = block.data || {};
  const lang = builderLang;
  root.innerHTML = "";

  const add = (label, control) => {
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = `<label>${escapeHtml(label)}</label>`;
    field.appendChild(control);
    root.appendChild(field);
  };

  const textInput = (label, get, set, multi = false) => {
    const el = document.createElement(multi ? "textarea" : "input");
    if (!multi) el.type = "text";
    el.value = get();
    el.addEventListener("input", () => {
      set(el.value);
      markDirty();
    });
    add(label, el);
  };

  const biInput = (label, key, multi = false) => {
    textInput(
      `${label} (${lang.toUpperCase()})`,
      () => biField(d[key], lang),
      (v) => setBiField(d, key, lang, v),
      multi
    );
  };

  // Common simple fields by type
  if (block.type === "hero") {
    textInput("Ornament (z. B. MUSEO)", () => d.ornament || "", (v) => { d.ornament = v; });
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Tagline", "tagline");
    biInput("Beschreibung", "desc", true);
    biInput("Button 1", "ctaPrimary");
    textInput("Button 1 Link", () => d.ctaPrimaryLink || "", (v) => { d.ctaPrimaryLink = v; });
    biInput("Button 2", "ctaSecondary");
    textInput("Button 2 Link", () => d.ctaSecondaryLink || "", (v) => { d.ctaSecondaryLink = v; });
  } else if (block.type === "visit") {
    (d.items || []).forEach((item, i) => {
      textInput(
        `Label ${i + 1} (${lang.toUpperCase()})`,
        () => biField(item.label, lang),
        (v) => {
          if (!item.label || typeof item.label === "string") item.label = { it: "", en: "" };
          item.label[lang] = v;
        }
      );
      textInput(
        `Wert ${i + 1} (${lang.toUpperCase()})`,
        () => biField(item.value, lang),
        (v) => {
          if (!item.value || typeof item.value === "string") item.value = { it: "", en: "" };
          item.value[lang] = v;
        }
      );
    });
  } else if (block.type === "intro" || block.type === "imageText") {
    biInput("Bild-Kicker", "visualKicker");
    biInput("Bild-Titel", "visualTitle");
    textInput("Bild-URL", () => d.image || "", (v) => { d.image = v; });
    const up = document.createElement("input");
    up.type = "file";
    up.accept = "image/*";
    up.addEventListener("change", async () => {
      if (!up.files?.[0]) return;
      try {
        d.image = await uploadImage(up.files[0]);
        markDirty();
        toast("Bild hochgeladen");
        renderBlockEditorFields(block);
      } catch (ex) {
        toast(ex.message, true);
      }
    });
    add("Bild hochladen", up);
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    if (block.type === "intro") {
      biInput("Absatz 1", "p1", true);
      biInput("Absatz 2", "p2", true);
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = d.showStats !== false;
      chk.addEventListener("change", () => {
        d.showStats = chk.checked;
        markDirty();
      });
      add("Statistiken anzeigen", chk);
    } else {
      biInput("Text", "body", true);
      const side = document.createElement("select");
      side.innerHTML = `<option value="left">Bild links</option><option value="right">Bild rechts</option>`;
      side.value = d.imageSide || "left";
      side.addEventListener("change", () => {
        d.imageSide = side.value;
        markDirty();
      });
      add("Bildseite", side);
    }
    biInput("Button", "cta");
    textInput("Button-Link", () => d.ctaLink || "", (v) => { d.ctaLink = v; });
  } else if (block.type === "featured" || block.type === "gallery") {
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Lead", "lead", true);
    if (block.type === "featured") {
      biInput("Button", "cta");
      textInput("Button-Link", () => d.ctaLink || "", (v) => { d.ctaLink = v; });
    } else {
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = d.showFilters !== false;
      chk.addEventListener("change", () => {
        d.showFilters = chk.checked;
        markDirty();
      });
      add("Filter anzeigen", chk);
    }
  } else if (block.type === "process") {
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Lead", "lead", true);
    (d.steps || []).forEach((step, i) => {
      textInput(`Schritt ${i + 1} Nr.`, () => step.num || "", (v) => { step.num = v; });
      textInput(
        `Schritt ${i + 1} Titel (${lang.toUpperCase()})`,
        () => biField(step.title, lang),
        (v) => {
          if (!step.title || typeof step.title === "string") step.title = { it: "", en: "" };
          step.title[lang] = v;
        }
      );
      textInput(
        `Schritt ${i + 1} Text (${lang.toUpperCase()})`,
        () => biField(step.desc, lang),
        (v) => {
          if (!step.desc || typeof step.desc === "string") step.desc = { it: "", en: "" };
          step.desc[lang] = v;
        },
        true
      );
    });
  } else if (block.type === "quote") {
    biInput("Zitat", "text", true);
    biInput("Quelle", "cite");
  } else if (block.type === "contact") {
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Lead", "lead", true);
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = d.showForm !== false;
    chk.addEventListener("change", () => {
      d.showForm = chk.checked;
      markDirty();
    });
    add("Formular anzeigen", chk);
  } else if (block.type === "pageHero") {
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Lead", "lead", true);
  } else if (block.type === "richText") {
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Text", "body", true);
    const align = document.createElement("select");
    align.innerHTML = `<option value="left">Links</option><option value="center">Zentriert</option>`;
    align.value = d.align || "left";
    align.addEventListener("change", () => {
      d.align = align.value;
      markDirty();
    });
    add("Ausrichtung", align);
    const dark = document.createElement("input");
    dark.type = "checkbox";
    dark.checked = !!d.dark;
    dark.addEventListener("change", () => {
      d.dark = dark.checked;
      markDirty();
    });
    add("Dunkler Hintergrund", dark);
  } else if (block.type === "cta") {
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Lead", "lead", true);
    biInput("Button", "cta");
    textInput("Button-Link", () => d.ctaLink || "", (v) => { d.ctaLink = v; });
  } else if (block.type === "materials") {
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Lead", "lead", true);
    (d.cards || []).forEach((card, i) => {
      textInput(`Karte ${i + 1} Icon`, () => card.icon || "", (v) => { card.icon = v; });
      textInput(
        `Karte ${i + 1} Titel (${lang.toUpperCase()})`,
        () => biField(card.title, lang),
        (v) => {
          if (!card.title || typeof card.title === "string") card.title = { it: "", en: "" };
          card.title[lang] = v;
        }
      );
      textInput(
        `Karte ${i + 1} Text (${lang.toUpperCase()})`,
        () => biField(card.desc, lang),
        (v) => {
          if (!card.desc || typeof card.desc === "string") card.desc = { it: "", en: "" };
          card.desc[lang] = v;
        },
        true
      );
    });
  } else if (block.type === "spacer") {
    const sel = document.createElement("select");
    sel.innerHTML = `<option value="sm">Klein</option><option value="md">Mittel</option><option value="lg">Groß</option>`;
    sel.value = d.size || "md";
    sel.addEventListener("change", () => {
      d.size = sel.value;
      markDirty();
    });
    add("Höhe", sel);
  } else if (block.type === "freeCanvas") {
    textInput("Höhe (px)", () => String(d.height || 520), (v) => {
      d.height = Number(v) || 520;
    });
    textInput("Hintergrundfarbe", () => d.background || "#ebe4d7", (v) => {
      d.background = v;
    });
    const hint = document.createElement("p");
    hint.className = "muted";
    hint.style.fontSize = "0.85rem";
    hint.textContent = `Bilder: ${(d.items || []).filter((i) => i.type === "image").length} — in der Live-Vorschau ablegen und verschieben.`;
    root.appendChild(hint);
  } else if (block.type === "imageBanner") {
    textInput("Bild-URL", () => d.image || "", (v) => {
      d.image = v;
    });
    const up = document.createElement("input");
    up.type = "file";
    up.accept = "image/*";
    up.addEventListener("change", async () => {
      if (!up.files?.[0]) return;
      try {
        d.image = await uploadImage(up.files[0]);
        markDirty();
        toast("Bild hochgeladen");
        renderBlockEditorFields(block);
      } catch (ex) {
        toast(ex.message, true);
      }
    });
    add("Bild hochladen", up);
    textInput("Höhe (px)", () => String(d.height || 360), (v) => {
      d.height = Number(v) || 360;
    });
    biInput("Kicker", "kicker");
    biInput("Titel", "title");
    biInput("Untertitel", "caption", true);
  } else {
    textInput("JSON (erweitert)", () => JSON.stringify(d, null, 2), (v) => {
      try {
        block.data = JSON.parse(v);
        markDirty();
      } catch {
        /* ignore while typing */
      }
    }, true);
  }
}

// Builder event wiring
function wireBuilderUi() {
  $$("[data-builder-page]").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$("[data-builder-page]").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      builderPage = tab.dataset.builderPage;
      window.__builderPage = builderPage;
      renderBuilder();
    });
  });

  $("#builder-add-btn")?.addEventListener("click", () => {
    ensurePages();
    const type = $("#builder-add-type")?.value;
    if (!type || !window.GS_BLOCKS) return;
    const tFn = (key, lang) => content.texts?.[lang || "it"]?.[key] || "";
    const block = window.GS_BLOCKS.createBlock(type, tFn);
    content.pages[builderPage].blocks.push(block);
    window.__adminContent = content;
    markDirty();
    renderBuilder();
    toast("Block hinzugefügt");
  });

  $("#builder-page-enabled")?.addEventListener("change", (e) => {
    ensurePages();
    content.pages[builderPage].enabled = e.target.checked;
    content.settings = content.settings || {};
    content.settings.sections = content.settings.sections || {};
    if (builderPage === "gallery") content.settings.sections.pageGallery = e.target.checked;
    if (builderPage === "about") content.settings.sections.pageAbout = e.target.checked;
    if (builderPage === "contact") content.settings.sections.pageContact = e.target.checked;
    markDirty();
  });

  $("#builder-modal-close")?.addEventListener("click", closeBlockEditor);
  $("#builder-modal-done")?.addEventListener("click", closeBlockEditor);
  $("#builder-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "builder-modal") closeBlockEditor();
  });

  $$("[data-builder-lang]").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$("[data-builder-lang]").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      builderLang = tab.dataset.builderLang;
      if (!editingBlockId) return;
      const block = content.pages[builderPage].blocks.find((b) => b.id === editingBlockId);
      if (block) renderBlockEditorFields(block);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireBuilderUi);
} else {
  wireBuilderUi();
}

function renderSections() {
  ensureSections();
  const root = $("#sections-list");
  if (!root) return;
  root.innerHTML = "";

  SECTION_DEFS.forEach((group) => {
    const box = document.createElement("div");
    box.className = "section-group";
    box.innerHTML = `<h3 class="section-group-title">${escapeHtml(group.group)}</h3>`;
    const list = document.createElement("div");
    list.className = "section-toggles";

    group.items.forEach((item) => {
      const on = content.settings.sections[item.key] !== false;
      const row = document.createElement("label");
      row.className = "section-toggle" + (on ? "" : " is-off");
      row.innerHTML = `
        <span class="section-toggle-text">
          <strong>${escapeHtml(item.label)}</strong>
          ${item.hint ? `<span class="muted">${escapeHtml(item.hint)}</span>` : ""}
        </span>
        <span class="switch">
          <input type="checkbox" data-section-key="${escapeAttr(item.key)}" ${on ? "checked" : ""} />
          <span class="switch-ui"></span>
        </span>
      `;
      row.querySelector("input").addEventListener("change", (e) => {
        content.settings.sections[item.key] = e.target.checked;
        row.classList.toggle("is-off", !e.target.checked);
        markDirty();
      });
      list.appendChild(row);
    });

    box.appendChild(list);
    root.appendChild(box);
  });
}

function renderSculptures() {
  const list = $("#sculpture-list");
  list.innerHTML = "";
  (content.sculptures || []).forEach((s, index) => {
    list.appendChild(createSculptureCard(s, index));
  });
}

function createSculptureCard(s, index) {
  const card = document.createElement("article");
  card.className = "sculpture-card";
  card.dataset.index = String(index);

  const imgHtml = s.image
    ? `<img src="${escapeAttr(s.image)}" alt="">`
    : `<span class="placeholder">Kein Bild<br>SVG-Platzhalter</span>`;

  card.innerHTML = `
    <div class="sculpture-preview">${imgHtml}</div>
    <div class="sculpture-fields">
      <div class="field">
        <label>Titel</label>
        <input data-f="title" value="${escapeAttr(s.title || "")}" />
      </div>
      <div class="field">
        <label>Inventar-Nr.</label>
        <input data-f="inventory" value="${escapeAttr(s.inventory || "")}" />
      </div>
      <div class="field">
        <label>Jahr</label>
        <input data-f="year" value="${escapeAttr(s.year || "")}" />
      </div>
      <div class="field">
        <label>Größe</label>
        <input data-f="size" value="${escapeAttr(s.size || "")}" />
      </div>
      <div class="field">
        <label>Kategorie</label>
        <select data-f="category">
          ${CATEGORIES.map((c) =>
            `<option value="${c.value}" ${s.category === c.value ? "selected" : ""}>${c.label}</option>`
          ).join("")}
        </select>
      </div>
      <div class="field">
        <label>ID (technisch)</label>
        <input data-f="id" value="${escapeAttr(s.id || "")}" />
      </div>
      <div class="field full">
        <label>Meta IT (Material · Jahr · Maß)</label>
        <input data-f="meta.it" value="${escapeAttr(s.meta?.it || "")}" />
      </div>
      <div class="field full">
        <label>Meta EN</label>
        <input data-f="meta.en" value="${escapeAttr(s.meta?.en || "")}" />
      </div>
      <div class="field full">
        <label>Beschreibung IT</label>
        <textarea data-f="desc.it">${escapeHtml(s.desc?.it || "")}</textarea>
      </div>
      <div class="field full">
        <label>Beschreibung EN</label>
        <textarea data-f="desc.en">${escapeHtml(s.desc?.en || "")}</textarea>
      </div>
      <div class="sculpture-actions">
        <label class="check-row">
          <input type="checkbox" data-f="featured" ${s.featured ? "checked" : ""} />
          Auf Startseite zeigen
        </label>
        <label class="btn btn-outline btn-sm file-btn">
          Bild hochladen
          <input type="file" accept="image/*" data-upload />
        </label>
        ${s.image ? `<button type="button" class="btn btn-outline btn-sm" data-clear-image>Bild entfernen</button>` : ""}
        <button type="button" class="btn btn-danger btn-sm" data-delete>Löschen</button>
      </div>
    </div>
  `;

  card.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.dataset.f) return;
    setSculptureField(index, t.dataset.f, t.type === "checkbox" ? t.checked : t.value);
    markDirty();
  });

  card.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.dataset.upload != null && t.files?.[0]) {
      try {
        const url = await uploadImage(t.files[0]);
        content.sculptures[index].image = url;
        markDirty();
        renderSculptures();
        toast("Bild hochgeladen — bitte speichern");
      } catch (ex) {
        toast(ex.message, true);
      }
    }
    if (t.dataset.f === "category" || t.dataset.f === "featured") {
      setSculptureField(index, t.dataset.f, t.type === "checkbox" ? t.checked : t.value);
      markDirty();
    }
  });

  card.querySelector("[data-delete]")?.addEventListener("click", () => {
    if (!confirm("Werk wirklich löschen?")) return;
    content.sculptures.splice(index, 1);
    markDirty();
    renderSculptures();
  });

  card.querySelector("[data-clear-image]")?.addEventListener("click", () => {
    content.sculptures[index].image = "";
    markDirty();
    renderSculptures();
  });

  return card;
}

function setSculptureField(index, path, value) {
  const s = content.sculptures[index];
  if (path.includes(".")) {
    const [a, b] = path.split(".");
    s[a] = s[a] || {};
    s[a][b] = value;
  } else {
    s[path] = value;
  }
}

$("#add-sculpture-btn").addEventListener("click", () => {
  const n = (content.sculptures?.length || 0) + 1;
  const id = `opera-${Date.now().toString(36)}`;
  content.sculptures = content.sculptures || [];
  content.sculptures.push({
    id,
    title: "Nuova opera",
    inventory: `GS-${String(n).padStart(3, "0")}`,
    year: String(new Date().getFullYear()),
    size: "",
    category: "marmor",
    featured: false,
    image: "",
    meta: { it: "", en: "" },
    desc: { it: "", en: "" },
    materialKey: "mat.marble"
  });
  markDirty();
  renderSculptures();
  toast("Neues Werk hinzugefügt — bitte speichern");
});

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "same-origin",
    body: fd
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
  return data.url;
}

/* ---------- Texts ---------- */
function groupKey(key) {
  for (const g of TEXT_GROUPS) {
    if (g.prefixes.some((p) => key.startsWith(p))) return g.id;
  }
  return "other";
}

function renderTexts() {
  const filter = ($("#text-filter").value || "").toLowerCase();
  const texts = content.texts?.[textLang] || {};
  const keys = Object.keys(texts).sort();
  const groups = {};
  TEXT_GROUPS.forEach((g) => { groups[g.id] = []; });

  keys.forEach((key) => {
    const val = texts[key] || "";
    if (filter && !key.toLowerCase().includes(filter) && !String(val).toLowerCase().includes(filter)) {
      return;
    }
    groups[groupKey(key)].push(key);
  });

  const root = $("#text-groups");
  root.innerHTML = "";

  TEXT_GROUPS.forEach((g) => {
    const list = groups[g.id];
    if (!list.length) return;
    const details = document.createElement("details");
    details.className = "text-group";
    details.open = Boolean(filter) || g.id === "hero" || g.id === "nav";
    details.innerHTML = `<summary>${g.title} <span class="muted">${list.length}</span></summary>`;
    const body = document.createElement("div");
    body.className = "text-group-body";
    list.forEach((key) => {
      const row = document.createElement("div");
      row.className = "text-row";
      const long = String(texts[key] || "").length > 80;
      row.innerHTML = `<label>${escapeHtml(key)}</label>`;
      if (long) {
        const ta = document.createElement("textarea");
        ta.value = texts[key] || "";
        ta.dataset.key = key;
        ta.addEventListener("input", () => {
          content.texts[textLang][key] = ta.value;
          markDirty();
        });
        row.appendChild(ta);
      } else {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.value = texts[key] || "";
        inp.dataset.key = key;
        inp.addEventListener("input", () => {
          content.texts[textLang][key] = inp.value;
          markDirty();
        });
        row.appendChild(inp);
      }
      body.appendChild(row);
    });
    details.appendChild(body);
    root.appendChild(details);
  });
}

$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    textLang = tab.dataset.lang;
    renderTexts();
  });
});

$("#text-filter").addEventListener("input", () => renderTexts());

/* ---------- Settings ---------- */
function renderSettings() {
  const s = content.settings || {};
  $("#set-logo").value = s.logo || "";
  $("#set-email").value = s.contactEmail || "";
  $("#set-works").value = s.stats?.works || "";
  $("#set-materials").value = s.stats?.materials || "";
  $("#set-rooms").value = s.stats?.rooms || "";
}

["set-logo", "set-email", "set-works", "set-materials", "set-rooms"].forEach((id) => {
  $(`#${id}`).addEventListener("input", () => {
    content.settings = content.settings || {};
    content.settings.stats = content.settings.stats || {};
    content.settings.logo = $("#set-logo").value;
    content.settings.contactEmail = $("#set-email").value;
    content.settings.stats.works = $("#set-works").value;
    content.settings.stats.materials = $("#set-materials").value;
    content.settings.stats.rooms = $("#set-rooms").value;
    markDirty();
  });
});

/* ---------- Save ---------- */
$("#save-all-btn").addEventListener("click", async () => {
  try {
    // sync materialKey from category
    content.sculptures = (content.sculptures || []).map((s) => ({
      ...s,
      materialKey:
        s.category === "marmor"
          ? "mat.marble"
          : s.category === "bronze"
            ? "mat.bronze"
            : s.category === "ton"
              ? "mat.terra"
              : s.category === "holz"
                ? "mat.wood"
                : "mat.stone"
    }));
    ensureSections();
    await api("/api/admin/content", {
      method: "PUT",
      body: JSON.stringify(content)
    });
    dirty = false;
    toast("Gespeichert — Website aktualisieren (neu laden)");
  } catch (ex) {
    toast(ex.message, true);
  }
});

window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

checkAuth();
