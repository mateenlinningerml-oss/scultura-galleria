/**
 * Shared block types for page builder (Admin + public renderer)
 */
(function (global) {
  function bi(it, en) {
    return { it: it || "", en: en || it || "" };
  }

  const BLOCK_TYPES = {
    hero: {
      label: "Entrance / Hero",
      icon: "◆",
      description: "Großer Einstieg mit Titel und Buttons",
      defaults: (t) => ({
        ornament: "MUSEO",
        kicker: bi(t?.("hero.kicker", "it"), t?.("hero.kicker", "en")),
        title: bi(t?.("hero.title", "it"), t?.("hero.title", "en")),
        tagline: bi(t?.("hero.tagline", "it"), t?.("hero.tagline", "en")),
        desc: bi(t?.("hero.desc", "it"), t?.("hero.desc", "en")),
        ctaPrimary: bi(t?.("hero.cta.gallery", "it"), t?.("hero.cta.gallery", "en")),
        ctaPrimaryLink: "gallery.html",
        ctaSecondary: bi(t?.("hero.cta.about", "it"), t?.("hero.cta.about", "en")),
        ctaSecondaryLink: "about.html"
      })
    },
    visit: {
      label: "Besucher-Streifen",
      icon: "—",
      description: "Drei Infos: Orari, Ingresso, Sede",
      defaults: (t) => ({
        items: [
          {
            label: bi(t?.("visit.hours.label", "it"), t?.("visit.hours.label", "en")),
            value: bi(t?.("visit.hours.value", "it"), t?.("visit.hours.value", "en"))
          },
          {
            label: bi(t?.("visit.ticket.label", "it"), t?.("visit.ticket.label", "en")),
            value: bi(t?.("visit.ticket.value", "it"), t?.("visit.ticket.value", "en"))
          },
          {
            label: bi(t?.("visit.place.label", "it"), t?.("visit.place.label", "en")),
            value: bi(t?.("visit.place.value", "it"), t?.("visit.place.value", "en"))
          }
        ]
      })
    },
    intro: {
      label: "Intro / Text + Bild",
      icon: "¶",
      description: "Zweispalter mit Bildkarte und Text",
      defaults: (t) => ({
        visualKicker: bi(t?.("intro.visual.kicker", "it"), t?.("intro.visual.kicker", "en")),
        visualTitle: bi(t?.("intro.visual.title", "it"), t?.("intro.visual.title", "en")),
        image: "",
        kicker: bi(t?.("intro.kicker", "it"), t?.("intro.kicker", "en")),
        title: bi(t?.("intro.title", "it"), t?.("intro.title", "en")),
        p1: bi(t?.("intro.p1", "it"), t?.("intro.p1", "en")),
        p2: bi(t?.("intro.p2", "it"), t?.("intro.p2", "en")),
        cta: bi(t?.("intro.cta", "it"), t?.("intro.cta", "en")),
        ctaLink: "about.html",
        showStats: true
      })
    },
    featured: {
      label: "Werke (Auswahl)",
      icon: "▣",
      description: "Featured Skulpturen aus der Sammlung",
      defaults: (t) => ({
        kicker: bi(t?.("featured.kicker", "it"), t?.("featured.kicker", "en")),
        title: bi(t?.("featured.title", "it"), t?.("featured.title", "en")),
        lead: bi(t?.("featured.lead", "it"), t?.("featured.lead", "en")),
        cta: bi(t?.("featured.all", "it"), t?.("featured.all", "en")),
        ctaLink: "gallery.html",
        mode: "featured"
      })
    },
    gallery: {
      label: "Werke (volle Galerie)",
      icon: "▦",
      description: "Alle Werke mit Filter",
      defaults: (t) => ({
        kicker: bi(t?.("gallery.kicker", "it"), t?.("gallery.kicker", "en")),
        title: bi(t?.("gallery.title", "it"), t?.("gallery.title", "en")),
        lead: bi(t?.("gallery.lead", "it"), t?.("gallery.lead", "en")),
        showFilters: true
      })
    },
    process: {
      label: "Prozess / 4 Schritte",
      icon: "Ⅳ",
      description: "Dunkler Block mit vier Karten",
      defaults: (t) => ({
        kicker: bi(t?.("process.kicker", "it"), t?.("process.kicker", "en")),
        title: bi(t?.("process.title", "it"), t?.("process.title", "en")),
        lead: bi(t?.("process.lead", "it"), t?.("process.lead", "en")),
        steps: [
          {
            num: "I",
            title: bi(t?.("process.1.title", "it"), t?.("process.1.title", "en")),
            desc: bi(t?.("process.1.desc", "it"), t?.("process.1.desc", "en"))
          },
          {
            num: "II",
            title: bi(t?.("process.2.title", "it"), t?.("process.2.title", "en")),
            desc: bi(t?.("process.2.desc", "it"), t?.("process.2.desc", "en"))
          },
          {
            num: "III",
            title: bi(t?.("process.3.title", "it"), t?.("process.3.title", "en")),
            desc: bi(t?.("process.3.desc", "it"), t?.("process.3.desc", "en"))
          },
          {
            num: "IV",
            title: bi(t?.("process.4.title", "it"), t?.("process.4.title", "en")),
            desc: bi(t?.("process.4.desc", "it"), t?.("process.4.desc", "en"))
          }
        ]
      })
    },
    quote: {
      label: "Zitat",
      icon: "❝",
      description: "Zitat mit Quellenangabe",
      defaults: (t) => ({
        text: bi(t?.("quote.text", "it"), t?.("quote.text", "en")),
        cite: bi(t?.("quote.cite", "it"), t?.("quote.cite", "en"))
      })
    },
    contact: {
      label: "Kontakt / Formular",
      icon: "✉",
      description: "Kontaktinfos und Formular",
      defaults: (t) => ({
        kicker: bi(t?.("contact.kicker", "it"), t?.("contact.kicker", "en")),
        title: bi(t?.("contact.title", "it"), t?.("contact.title", "en")),
        lead: bi(t?.("contact.lead", "it"), t?.("contact.lead", "en")),
        showForm: true
      })
    },
    pageHero: {
      label: "Seiten-Kopf",
      icon: "▬",
      description: "Titelbereich für Unterseiten",
      defaults: () => ({
        kicker: bi("Catalogo", "Catalogue"),
        title: bi("La Collezione", "The Collection"),
        lead: bi("", "")
      })
    },
    richText: {
      label: "Freier Text",
      icon: "T",
      description: "Kicker, Titel und Fließtext",
      defaults: () => ({
        kicker: bi("Nota", "Note"),
        title: bi("Nuovo blocco", "New block"),
        body: bi("Scrivi qui il tuo testo…", "Write your text here…"),
        align: "left",
        dark: false
      })
    },
    imageText: {
      label: "Bild + Text",
      icon: "▣¶",
      description: "Bild und Text nebeneinander",
      defaults: () => ({
        image: "",
        imageSide: "left",
        kicker: bi("Sala", "Room"),
        title: bi("Titolo", "Title"),
        body: bi("Descrizione…", "Description…"),
        cta: bi("", ""),
        ctaLink: ""
      })
    },
    cta: {
      label: "Call-to-Action",
      icon: "→",
      description: "Aufforderung mit Button",
      defaults: () => ({
        kicker: bi("Prossima tappa", "Next step"),
        title: bi("Esplora la collezione", "Explore the collection"),
        lead: bi("", ""),
        cta: bi("Alla galleria", "To the gallery"),
        ctaLink: "gallery.html",
        dark: true
      })
    },
    materials: {
      label: "3 Material-Karten",
      icon: "M",
      description: "Drei Karten (z. B. Marmor, Bronzo…)",
      defaults: (t) => ({
        kicker: bi(t?.("about.mat.kicker", "it"), t?.("about.mat.kicker", "en")),
        title: bi(t?.("about.mat.title", "it"), t?.("about.mat.title", "en")),
        lead: bi(t?.("about.mat.lead", "it"), t?.("about.mat.lead", "en")),
        cards: [
          {
            icon: "M",
            title: bi(t?.("about.mat.m.title", "it"), t?.("about.mat.m.title", "en")),
            desc: bi(t?.("about.mat.m.desc", "it"), t?.("about.mat.m.desc", "en"))
          },
          {
            icon: "B",
            title: bi(t?.("about.mat.b.title", "it"), t?.("about.mat.b.title", "en")),
            desc: bi(t?.("about.mat.b.desc", "it"), t?.("about.mat.b.desc", "en"))
          },
          {
            icon: "T",
            title: bi(t?.("about.mat.t.title", "it"), t?.("about.mat.t.title", "en")),
            desc: bi(t?.("about.mat.t.desc", "it"), t?.("about.mat.t.desc", "en"))
          }
        ]
      })
    },
    spacer: {
      label: "Abstand",
      icon: "↕",
      description: "Leerer vertikaler Abstand",
      defaults: () => ({ size: "md" })
    },
    freeCanvas: {
      label: "Freie Fläche (Bilder)",
      icon: "✥",
      description: "Bilder frei positionieren und verschieben",
      defaults: () => ({
        height: 520,
        background: "#ebe4d7",
        items: []
      })
    },
    imageBanner: {
      label: "Bild-Banner",
      icon: "🖼",
      description: "Vollbreites Bild mit optionalem Text",
      defaults: () => ({
        image: "",
        height: 360,
        overlay: true,
        kicker: bi("Immagine", "Image"),
        title: bi("Titolo", "Title"),
        caption: bi("", "")
      })
    }
  };

  function createBlock(type, tFn) {
    const def = BLOCK_TYPES[type];
    if (!def) throw new Error("Unknown block type: " + type);
    return {
      id: "blk_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      type,
      enabled: true,
      data: JSON.parse(JSON.stringify(def.defaults(tFn)))
    };
  }

  function resolveBi(field, lang) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[lang] || field.it || field.en || "";
  }

  global.GS_BLOCKS = {
    BLOCK_TYPES,
    createBlock,
    resolveBi,
    bi
  };
})(typeof window !== "undefined" ? window : global);
