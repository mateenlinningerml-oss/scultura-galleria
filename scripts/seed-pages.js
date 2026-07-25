/**
 * Seed pages.blocks from existing texts + section flags
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const content = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "content.json"), "utf8"));

// Load block types via vm-like simple require of logic
const BLOCK_TYPES = {
  hero: true,
  visit: true,
  intro: true,
  featured: true,
  gallery: true,
  process: true,
  quote: true,
  contact: true,
  pageHero: true,
  richText: true,
  imageText: true,
  cta: true,
  materials: true,
  spacer: true
};

function t(key, lang) {
  return content.texts?.[lang]?.[key] || "";
}
function bi(key) {
  return { it: t(key, "it"), en: t(key, "en") };
}
function biRaw(it, en) {
  return { it: it || "", en: en || it || "" };
}
function id(type) {
  return "blk_" + type + "_" + Math.random().toString(36).slice(2, 8);
}

const sec = content.settings?.sections || {};

function defaults(type) {
  switch (type) {
    case "hero":
      return {
        ornament: "MUSEO",
        kicker: bi("hero.kicker"),
        title: bi("hero.title"),
        tagline: bi("hero.tagline"),
        desc: bi("hero.desc"),
        ctaPrimary: bi("hero.cta.gallery"),
        ctaPrimaryLink: "gallery.html",
        ctaSecondary: bi("hero.cta.about"),
        ctaSecondaryLink: "about.html"
      };
    case "visit":
      return {
        items: [
          { label: bi("visit.hours.label"), value: bi("visit.hours.value") },
          { label: bi("visit.ticket.label"), value: bi("visit.ticket.value") },
          { label: bi("visit.place.label"), value: bi("visit.place.value") }
        ]
      };
    case "intro":
      return {
        visualKicker: bi("intro.visual.kicker"),
        visualTitle: bi("intro.visual.title"),
        image: "",
        kicker: bi("intro.kicker"),
        title: bi("intro.title"),
        p1: bi("intro.p1"),
        p2: bi("intro.p2"),
        cta: bi("intro.cta"),
        ctaLink: "about.html",
        showStats: true
      };
    case "featured":
      return {
        kicker: bi("featured.kicker"),
        title: bi("featured.title"),
        lead: bi("featured.lead"),
        cta: bi("featured.all"),
        ctaLink: "gallery.html",
        mode: "featured"
      };
    case "gallery":
      return {
        kicker: bi("gallery.kicker"),
        title: bi("gallery.title"),
        lead: bi("gallery.lead"),
        showFilters: true
      };
    case "process":
      return {
        kicker: bi("process.kicker"),
        title: bi("process.title"),
        lead: bi("process.lead"),
        steps: [1, 2, 3, 4].map((n, i) => ({
          num: ["I", "II", "III", "IV"][i],
          title: bi(`process.${n}.title`),
          desc: bi(`process.${n}.desc`)
        }))
      };
    case "quote":
      return { text: bi("quote.text"), cite: bi("quote.cite") };
    case "contact":
      return {
        kicker: bi("contact.kicker"),
        title: bi("contact.title"),
        lead: bi("contact.lead"),
        showForm: true
      };
    case "pageHero":
      return { kicker: biRaw("", ""), title: biRaw("", ""), lead: biRaw("", "") };
    case "materials":
      return {
        kicker: bi("about.mat.kicker"),
        title: bi("about.mat.title"),
        lead: bi("about.mat.lead"),
        cards: [
          { icon: "M", title: bi("about.mat.m.title"), desc: bi("about.mat.m.desc") },
          { icon: "B", title: bi("about.mat.b.title"), desc: bi("about.mat.b.desc") },
          { icon: "T", title: bi("about.mat.t.title"), desc: bi("about.mat.t.desc") }
        ]
      };
    case "cta":
      return {
        kicker: bi("contact.next.kicker"),
        title: bi("contact.next.title"),
        lead: bi("contact.next.lead"),
        cta: bi("contact.next.cta"),
        ctaLink: "gallery.html",
        dark: true
      };
    default:
      return {};
  }
}

function blk(type, enabled = true, dataPatch = null) {
  const data = { ...defaults(type), ...(dataPatch || {}) };
  return { id: id(type), type, enabled, data };
}

const home = {
  enabled: true,
  blocks: [
    blk("hero", sec.hero !== false),
    blk("visit", sec.visit !== false),
    blk("intro", sec.intro !== false),
    blk("featured", sec.featured !== false),
    blk("process", sec.process !== false),
    blk("quote", sec.quote !== false),
    blk("contact", sec.contactHome !== false)
  ]
};

const gallery = {
  enabled: sec.pageGallery !== false,
  blocks: [
    blk("pageHero", true, {
      kicker: bi("gallery.hero.kicker"),
      title: bi("gallery.hero.title"),
      lead: bi("gallery.hero.lead")
    }),
    blk("gallery", true)
  ]
};

const about = {
  enabled: sec.pageAbout !== false,
  blocks: [
    blk("pageHero", true, {
      kicker: bi("about.hero.kicker"),
      title: bi("about.hero.title"),
      lead: bi("about.hero.lead")
    }),
    blk("intro", sec.aboutMission !== false, {
      visualKicker: bi("about.visual.kicker"),
      visualTitle: bi("about.visual.title"),
      kicker: bi("about.kicker"),
      title: bi("about.title"),
      p1: bi("about.p1"),
      p2: bi("about.p2"),
      cta: biRaw("", ""),
      ctaLink: "",
      showStats: false
    }),
    blk("materials", sec.aboutMaterials !== false),
    blk("process", sec.aboutDesign !== false, {
      kicker: bi("about.design.kicker"),
      title: bi("about.design.title"),
      lead: bi("about.design.lead"),
      steps: [1, 2, 3, 4].map((n, i) => ({
        num: ["I", "II", "III", "IV"][i],
        title: bi(`about.d${n}.title`),
        desc: bi(`about.d${n}.desc`)
      }))
    }),
    blk("quote", sec.aboutQuote !== false, {
      text: bi("about.quote"),
      cite: bi("quote.cite")
    })
  ]
};

const contactPage = {
  enabled: sec.pageContact !== false,
  blocks: [
    blk("pageHero", true, {
      kicker: bi("contact.hero.kicker"),
      title: bi("contact.hero.title"),
      lead: bi("contact.hero.lead")
    }),
    blk("visit", sec.contactVisitStrip !== false),
    blk("contact", sec.contactForm !== false, {
      kicker: bi("contact.kicker"),
      title: bi("contact.page.title"),
      lead: bi("contact.page.lead")
    }),
    blk("cta", sec.contactNext !== false)
  ]
};

content.pages = { home, gallery, about, contact: contactPage };
content.settings = content.settings || {};
content.settings.builder = true;

fs.writeFileSync(path.join(ROOT, "data", "content.json"), JSON.stringify(content, null, 2));
console.log(
  "Seeded pages:",
  Object.entries(content.pages)
    .map(([k, v]) => `${k}=${v.blocks.length}`)
    .join(", ")
);
