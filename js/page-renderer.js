/**
 * Renders page builder blocks into a container
 */
(function () {
  function lang() {
    return typeof getLang === "function" ? getLang() : "it";
  }

  function L(field) {
    return window.GS_BLOCKS.resolveBi(field, lang());
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mediaUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "";
    if (/^(?:https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
    return url.startsWith("/") ? url : `/${url.replace(/^\.\//, "")}`;
  }

  function renderBlock(block) {
    if (!block || block.enabled === false) return "";
    const d = block.data || {};
    const type = block.type;

    switch (type) {
      case "hero":
        return `
        <section class="hero${d.image ? " hero--image" : ""}" data-block-id="${esc(block.id)}" data-block-type="hero">
          <div class="hero-bg">
            ${d.image ? `<img class="hero-bg-image" src="${esc(d.image)}" alt="" />` : `<div class="hero-bg-marble"></div>`}
            ${d.image ? `<div class="hero-bg-overlay" aria-hidden="true"></div>` : ""}
          </div>
          <div class="hero-content">
            ${d.ornament ? `<div class="hero-ornament" aria-hidden="true"><span>${esc(d.ornament)}</span></div>` : ""}
            ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
            <h1>${esc(L(d.title))}</h1>
            ${L(d.tagline) ? `<p class="hero-tagline">${esc(L(d.tagline))}</p>` : ""}
            <div class="hero-divider" aria-hidden="true"></div>
            ${L(d.desc) ? `<p class="hero-desc">${esc(L(d.desc))}</p>` : ""}
            <div class="hero-actions">
              ${d.ctaPrimaryLink ? `<a href="${esc(d.ctaPrimaryLink)}" class="btn btn-primary">${esc(L(d.ctaPrimary))}</a>` : ""}
              ${d.ctaSecondaryLink ? `<a href="${esc(d.ctaSecondaryLink)}" class="btn btn-outline">${esc(L(d.ctaSecondary))}</a>` : ""}
            </div>
          </div>
        </section>`;

      case "artistIntro":
        return `
        <section class="artist-intro" data-block-id="${esc(block.id)}" data-block-type="artistIntro">
          <div class="artist-intro-inner">
            ${L(d.eyebrow) ? `<p class="artist-intro-eyebrow">${esc(L(d.eyebrow))}</p>` : ""}
            ${L(d.kicker) ? `<p class="artist-intro-kicker">${esc(L(d.kicker))}</p>` : ""}
            <h2>${esc(L(d.title))}</h2>
            ${L(d.tagline) ? `<p class="artist-intro-tagline">${esc(L(d.tagline))}</p>` : ""}
            <div class="artist-intro-divider" aria-hidden="true"></div>
            ${L(d.desc) ? `<p class="artist-intro-desc">${esc(L(d.desc))}</p>` : ""}
            <div class="artist-intro-actions">
              ${d.ctaPrimaryLink ? `<a href="${esc(d.ctaPrimaryLink)}" class="btn btn-primary">${esc(L(d.ctaPrimary))}</a>` : ""}
              ${d.ctaSecondaryLink ? `<a href="${esc(d.ctaSecondaryLink)}" class="btn btn-outline">${esc(L(d.ctaSecondary))}</a>` : ""}
            </div>
          </div>
        </section>`;

      case "visit": {
        const items = Array.isArray(d.items) ? d.items : [];
        return `
        <aside class="visit-strip" data-block-id="${esc(block.id)}" data-block-type="visit">
          <div class="container visit-strip-grid">
            ${items
              .map(
                (it) => `
              <div class="visit-item">
                <strong>${esc(L(it.label))}</strong>
                <span>${esc(L(it.value))}</span>
              </div>`
              )
              .join("")}
          </div>
        </aside>`;
      }

      case "intro": {
        const stats = window.GS_CONTENT?.settings?.stats || {};
        const media = d.image
          ? `<img src="${esc(d.image)}" alt="" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" />`
          : "";
        return `
        <section class="section intro" data-block-id="${esc(block.id)}" data-block-type="intro">
          <div class="container intro-grid">
            <div class="intro-visual">
              <div class="marble-overlay" aria-hidden="true"></div>
              ${media}
              <div class="intro-visual-inner">
                <p>${esc(L(d.visualKicker))}</p>
                <h3>${esc(L(d.visualTitle))}</h3>
              </div>
            </div>
            <div class="intro-text">
              ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
              <h2 class="section-title">${esc(L(d.title))}</h2>
              ${L(d.p1) ? `<p>${esc(L(d.p1))}</p>` : ""}
              ${L(d.p2) ? `<p>${esc(L(d.p2))}</p>` : ""}
              ${d.ctaLink && L(d.cta) ? `<a href="${esc(d.ctaLink)}" class="btn btn-bronze">${esc(L(d.cta))}</a>` : ""}
              ${
                d.showStats !== false
                  ? `<div class="intro-stats">
                <div class="stat"><div class="stat-num" data-stat="works">${esc(stats.works || "—")}</div><div class="stat-label">${esc(typeof t === "function" ? t("intro.stat.works") : "")}</div></div>
                <div class="stat"><div class="stat-num" data-stat="materials">${esc(stats.materials || "—")}</div><div class="stat-label">${esc(typeof t === "function" ? t("intro.stat.materials") : "")}</div></div>
                <div class="stat"><div class="stat-num" data-stat="rooms">${esc(stats.rooms || "—")}</div><div class="stat-label">${esc(typeof t === "function" ? t("intro.stat.inspo") : "")}</div></div>
              </div>`
                  : ""
              }
            </div>
          </div>
        </section>`;
      }

      case "featured":
        return `
        <section class="section gallery-section" data-block-id="${esc(block.id)}" data-block-type="featured">
          <div class="container">
            <div class="gallery-header">
              <div>
                ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
                <h2 class="section-title">${esc(L(d.title))}</h2>
                ${L(d.lead) ? `<p class="section-lead">${esc(L(d.lead))}</p>` : ""}
              </div>
              ${d.ctaLink && L(d.cta) ? `<a href="${esc(d.ctaLink)}" class="btn btn-outline">${esc(L(d.cta))}</a>` : ""}
            </div>
            <div class="gallery-grid" data-gallery="featured"></div>
          </div>
        </section>`;

      case "gallery":
        return `
        <section class="section gallery-section gallery-section--editorial" data-block-id="${esc(block.id)}" data-block-type="gallery">
          <div class="container gallery-editorial-shell">
            <div class="gallery-header gallery-header--editorial">
              <div>
                ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
                <h2 class="section-title">${esc(L(d.title))}</h2>
                ${L(d.lead) ? `<p class="section-lead">${esc(L(d.lead))}</p>` : ""}
              </div>
              ${
                d.showFilters !== false
                  ? `<div class="filter-bar" role="group">
                <button type="button" class="filter-btn active" data-filter="all">${esc(typeof t === "function" ? t("filter.all") : "All")}</button>
                <button type="button" class="filter-btn" data-filter="marmor">${esc(typeof t === "function" ? t("filter.marble") : "Marble")}</button>
                <button type="button" class="filter-btn" data-filter="bronze">${esc(typeof t === "function" ? t("filter.bronze") : "Bronze")}</button>
                <button type="button" class="filter-btn" data-filter="ton">${esc(typeof t === "function" ? t("filter.terra") : "Terracotta")}</button>
                <button type="button" class="filter-btn" data-filter="stein">${esc(typeof t === "function" ? t("filter.stone") : "Stone")}</button>
                <button type="button" class="filter-btn" data-filter="holz">${esc(typeof t === "function" ? t("filter.wood") : "Wood")}</button>
              </div>`
                  : ""
              }
            </div>
            <div class="gallery-grid gallery-grid--editorial" data-gallery="all"></div>
          </div>
        </section>`;

      case "process": {
        const steps = Array.isArray(d.steps) ? d.steps : [];
        const visual = d.variant === "visual" || steps.some((s) => s.image);
        return `
        <section class="section process${visual ? " process--visual" : ""}" data-block-id="${esc(block.id)}" data-block-type="process">
          <div class="container">
            <header class="process-heading">
              ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
              <h2 class="section-title">${esc(L(d.title))}</h2>
              ${L(d.lead) ? `<p class="section-lead">${esc(L(d.lead))}</p>` : ""}
            </header>
            <div class="process-grid">
              ${steps
                .map((s, index) => {
                  const chapterClass = index === steps.length - 1 ? " process-card--final" : index % 2 ? " process-card--reverse" : "";
                  return `
                <article class="process-card${chapterClass}" data-process-step="${index + 1}">
                  ${visual ? `<div class="process-media">${s.image ? `<img src="${esc(mediaUrl(s.image))}" alt="${esc(L(s.imageAlt) || L(s.title))}" loading="lazy" />` : `<div class="process-media-placeholder"><span>${esc(L(s.title))}</span><small>${esc(typeof t === "function" ? t("admin.imagePlaceholder") : "Image can be added in the admin")}</small></div>`}</div>` : ""}
                  <div class="process-copy">
                    <div class="process-num">${esc(s.num || "")}</div>
                    <h3>${esc(L(s.title))}</h3>
                    <p>${esc(L(s.desc))}</p>
                  </div>
                </article>`;
                })
                .join("")}
            </div>
          </div>
        </section>`;
      }

      case "quote":
        return `
        <section class="section quote-section" data-block-id="${esc(block.id)}" data-block-type="quote">
          <div class="container">
            <blockquote>
              <q>${esc(L(d.text))}</q>
              ${L(d.cite) ? `<cite>${esc(L(d.cite))}</cite>` : ""}
            </blockquote>
          </div>
        </section>`;

      case "contact":
        return `
        <section class="section contact-preview" data-block-id="${esc(block.id)}" data-block-type="contact">
          <div class="container contact-grid">
            <div>
              ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
              <h2 class="section-title">${esc(L(d.title))}</h2>
              ${L(d.lead) ? `<p class="section-lead">${esc(L(d.lead))}</p>` : ""}
              <ul class="contact-info-list">
                <li class="contact-info-item">
                  <span class="contact-icon" aria-hidden="true">01</span>
                  <div>
                    <strong>${esc(typeof t === "function" ? t("contact.email") : "Email")}</strong>
                    <span data-contact-email>${esc(window.GS_CONTENT?.settings?.contactEmail || "")}</span>
                  </div>
                </li>
                <li class="contact-info-item">
                  <span class="contact-icon" aria-hidden="true">02</span>
                  <div>
                    <strong>${esc(typeof t === "function" ? t("contact.address") : "Address")}</strong>
                    <span>${esc(typeof t === "function" ? t("contact.address.value") : "")}</span>
                  </div>
                </li>
                <li class="contact-info-item">
                  <span class="contact-icon" aria-hidden="true">03</span>
                  <div>
                    <strong>${esc(typeof t === "function" ? t("contact.visits") : "Visits")}</strong>
                    <span>${esc(typeof t === "function" ? t("contact.visits.value") : "")}</span>
                  </div>
                </li>
              </ul>
              ${(d.ctaLink && L(d.cta)) || (d.secondaryCtaLink && L(d.secondaryCta)) ? `<div class="contact-preview-actions">
                ${d.ctaLink && L(d.cta) ? `<a href="${esc(d.ctaLink)}" class="btn btn-primary">${esc(L(d.cta))}</a>` : ""}
                ${d.secondaryCtaLink && L(d.secondaryCta) ? `<a href="${esc(d.secondaryCtaLink)}" class="contact-text-link">${esc(L(d.secondaryCta))}<span aria-hidden="true">↗</span></a>` : ""}
              </div>` : ""}
            </div>
            ${
              d.showForm !== false
                ? `<form class="contact-form" id="contact-form" action="#" method="post">
              <div class="form-success" role="status"></div>
              <div class="form-row">
                <div class="form-group">
                  <label for="name">${esc(typeof t === "function" ? t("form.name") : "Name")}</label>
                  <input type="text" id="name" name="name" required autocomplete="name" />
                </div>
                <div class="form-group">
                  <label for="email">${esc(typeof t === "function" ? t("form.email") : "Email")}</label>
                  <input type="email" id="email" name="email" required autocomplete="email" />
                </div>
              </div>
              <div class="form-group">
                <label for="subject">${esc(typeof t === "function" ? t("form.subject") : "Subject")}</label>
                <select id="subject" name="subject">
                  <option value="allgemein">${esc(typeof t === "function" ? t("form.subject.general") : "")}</option>
                  <option value="werk">${esc(typeof t === "function" ? t("form.subject.work") : "")}</option>
                  <option value="auftrag">${esc(typeof t === "function" ? t("form.subject.commission") : "")}</option>
                  <option value="ausstellung">${esc(typeof t === "function" ? t("form.subject.press") : "")}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="message">${esc(typeof t === "function" ? t("form.message") : "Message")}</label>
                <textarea id="message" name="message" required placeholder="${esc(typeof t === "function" ? t("form.placeholder") : "")}"></textarea>
              </div>
              <button type="submit" class="btn btn-primary">${esc(typeof t === "function" ? t("form.submit") : "Send")}</button>
              <p class="form-note">${esc(typeof t === "function" ? t("form.note") : "")}</p>
            </form>`
                : ""
            }
          </div>
        </section>`;

      case "pageHero":
        return `
        <header class="page-hero" data-block-id="${esc(block.id)}" data-block-type="pageHero">
          <div class="container">
            <div class="page-hero-inner">
              ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
              <h1>${esc(L(d.title))}</h1>
              ${L(d.lead) ? `<p>${esc(L(d.lead))}</p>` : ""}
            </div>
          </div>
        </header>`;

      case "richText": {
        const align = d.align === "center" ? "text-center" : "";
        const dark = d.dark ? "process" : "section intro";
        return `
        <section class="section ${dark}" data-block-id="${esc(block.id)}" data-block-type="richText">
          <div class="container ${align}">
            ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
            <h2 class="section-title">${esc(L(d.title))}</h2>
            ${L(d.body) ? `<p class="section-lead" style="${d.align === "center" ? "margin-inline:auto;" : ""}">${esc(L(d.body))}</p>` : ""}
          </div>
        </section>`;
      }

      case "imageText": {
        const imgFirst = d.imageSide !== "right";
        const imgCol = d.image
          ? `<div class="intro-visual"><img src="${esc(d.image)}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>`
          : `<div class="intro-visual"><div class="marble-overlay"></div><div class="intro-visual-inner"><p>${esc(L(d.kicker))}</p><h3>${esc(L(d.title))}</h3></div></div>`;
        const textCol = `
          <div class="intro-text">
            ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
            <h2 class="section-title">${esc(L(d.title))}</h2>
            ${L(d.body) ? `<p>${esc(L(d.body))}</p>` : ""}
            ${d.ctaLink && L(d.cta) ? `<a href="${esc(d.ctaLink)}" class="btn btn-bronze">${esc(L(d.cta))}</a>` : ""}
          </div>`;
        return `
        <section class="section intro" data-block-id="${esc(block.id)}" data-block-type="imageText">
          <div class="container intro-grid">
            ${imgFirst ? imgCol + textCol : textCol + imgCol}
          </div>
        </section>`;
      }

      case "cta": {
        const dark = d.dark !== false;
        return `
        <section class="section ${dark ? "process" : "quote-section"}" data-block-id="${esc(block.id)}" data-block-type="cta">
          <div class="container text-center">
            ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
            <h2 class="section-title">${esc(L(d.title))}</h2>
            ${L(d.lead) ? `<p class="section-lead" style="margin-inline:auto;">${esc(L(d.lead))}</p>` : ""}
            ${
              d.ctaLink && L(d.cta)
                ? `<div class="mt-2"><a href="${esc(d.ctaLink)}" class="btn ${dark ? "btn-outline" : "btn-primary"}" ${dark ? 'style="border-color:rgba(243,238,229,0.25);color:var(--bg);"' : ""}>${esc(L(d.cta))}</a></div>`
                : ""
            }
          </div>
        </section>`;
      }

      case "materials": {
        const cards = Array.isArray(d.cards) ? d.cards : [];
        return `
        <section class="section materials-section" data-block-id="${esc(block.id)}" data-block-type="materials">
          <div class="container materials-shell">
            <header class="materials-heading">
              <div>
                ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
                <h2 class="section-title">${esc(L(d.title))}</h2>
              </div>
              ${L(d.lead) ? `<p class="section-lead">${esc(L(d.lead))}</p>` : ""}
            </header>
            <div class="materials-grid materials-grid--editorial">
              ${cards
                .map(
                  (c, index) => `
                <article class="material-card material-card--editorial">
                  <div class="material-card-media">
                    ${c.image ? `<img src="${esc(c.image)}" alt="${esc(L(c.title))}" loading="lazy" />` : `<div class="material-card-placeholder" aria-hidden="true"></div>`}
                    <span class="material-card-number">${esc(c.icon || String(index + 1).padStart(2, "0"))}</span>
                  </div>
                  <div class="material-card-copy">
                    <h3>${esc(L(c.title))}</h3>
                    <p>${esc(L(c.desc))}</p>
                  </div>
                </article>`
                )
                .join("")}
            </div>
          </div>
        </section>`;
      }

      case "spacer": {
        const map = { sm: "2rem", md: "4rem", lg: "6rem" };
        const h = map[d.size] || map.md;
        return `<div data-block-id="${esc(block.id)}" data-block-type="spacer" style="height:${h}" aria-hidden="true"></div>`;
      }

      case "imageBanner": {
        const h = Number(d.height) || 360;
        const bg = d.image
          ? `background-image:url('${esc(d.image)}');background-size:cover;background-position:center;`
          : "background:#d4c8b8;";
        return `
        <section class="image-banner" data-block-id="${esc(block.id)}" data-block-type="imageBanner" style="min-height:${h}px;${bg}">
          ${d.overlay !== false ? `<div class="image-banner-overlay"></div>` : ""}
          <div class="image-banner-content container">
            ${L(d.kicker) ? `<p class="section-kicker">${esc(L(d.kicker))}</p>` : ""}
            ${L(d.title) ? `<h2 class="section-title" style="color:#fff;">${esc(L(d.title))}</h2>` : ""}
            ${L(d.caption) ? `<p style="color:rgba(255,255,255,0.85);font-style:italic;">${esc(L(d.caption))}</p>` : ""}
          </div>
        </section>`;
      }

      case "freeCanvas": {
        const h = Number(d.height) || 520;
        const bg = d.background || "#ebe4d7";
        const items = Array.isArray(d.items) ? d.items : [];
        return `
        <section class="free-canvas" data-block-id="${esc(block.id)}" data-block-type="freeCanvas"
          style="height:${h}px;background:${esc(bg)};" data-canvas-height="${h}">
          ${items
            .map((item) => {
              if (item.type === "image" && item.src) {
                return `<div class="free-canvas-item free-canvas-image" data-item-id="${esc(item.id)}"
                  style="left:${Number(item.x) || 0}%;top:${Number(item.y) || 0}%;width:${Number(item.w) || 25}%;height:${Number(item.h) || 30}%;z-index:${Number(item.z) || 1};">
                  <img src="${esc(item.src)}" alt="" draggable="false" style="object-fit:${esc(item.objectFit || "cover")};" />
                </div>`;
              }
              if (item.type === "text") {
                return `<div class="free-canvas-item free-canvas-text" data-item-id="${esc(item.id)}"
                  style="left:${Number(item.x) || 0}%;top:${Number(item.y) || 0}%;width:${Number(item.w) || 30}%;z-index:${Number(item.z) || 2};">
                  <p>${esc(L(item.text))}</p>
                </div>`;
              }
              return "";
            })
            .join("")}
        </section>`;
      }

      default:
        return "";
    }
  }

  function renderPage(pageKey, container) {
    if (!container) return;
    const page = window.GS_CONTENT?.pages?.[pageKey];
    if (!page || !Array.isArray(page.blocks) || !page.blocks.length) {
      // leave existing static HTML
      return false;
    }
    if (page.enabled === false) {
      container.innerHTML = `<section class="section"><div class="container text-center"><p class="section-lead">—</p></div></section>`;
      return true;
    }
    container.innerHTML = page.blocks.map(renderBlock).join("");
    container.dataset.builderRendered = "1";
    return true;
  }

  window.GS_PAGE_RENDERER = {
    renderBlock,
    renderPage
  };
})();
