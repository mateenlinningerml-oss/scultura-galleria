/**
 * Visual page builder: live preview, media library, free image placement
 * Depends on: content (global via window.__admin), GS_BLOCKS, GS_PAGE_RENDERER
 */
(function () {
  let media = [];
  let listMode = false;
  let selectedBlockId = null;
  let dragMediaUrl = null;

  function getContent() {
    return window.__adminContent;
  }

  function getPageKey() {
    return window.__builderPage || "home";
  }

  function markDirty() {
    if (typeof window.__adminMarkDirty === "function") window.__adminMarkDirty();
  }

  function toast(msg, err) {
    if (typeof window.__adminToast === "function") window.__adminToast(msg, err);
  }

  async function api(path, options = {}) {
    if (typeof window.__adminApi === "function") return window.__adminApi(path, options);
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.status);
    return data;
  }

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $$(sel, root = document) {
    return [...root.querySelectorAll(sel)];
  }

  async function loadMedia() {
    try {
      const data = await api("/api/admin/media");
      media = data.media || [];
    } catch {
      media = [];
    }
    renderMediaGrid();
  }

  function renderMediaGrid() {
    const grid = $("#media-grid");
    if (!grid) return;
    if (!media.length) {
      grid.innerHTML = `<p class="muted" style="grid-column:1/-1;font-size:0.8rem;">Noch keine Bilder — bitte hochladen.</p>`;
      return;
    }
    grid.innerHTML = media
      .map(
        (m) => `
      <div class="media-thumb" draggable="true" data-url="${m.url}" title="${m.filename}">
        <img src="${m.url}" alt="" />
        <button type="button" class="media-del" data-del="${m.filename}" title="Löschen">×</button>
      </div>`
      )
      .join("");

    grid.querySelectorAll(".media-thumb").forEach((el) => {
      el.addEventListener("dragstart", (e) => {
        dragMediaUrl = el.dataset.url;
        e.dataTransfer.setData("text/uri-list", dragMediaUrl);
        e.dataTransfer.setData("text/plain", dragMediaUrl);
        e.dataTransfer.effectAllowed = "copy";
      });
      el.addEventListener("dragend", () => {
        dragMediaUrl = null;
      });
    });

    grid.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm("Bild löschen?")) return;
        try {
          await api("/api/admin/upload", {
            method: "DELETE",
            body: JSON.stringify({ filename: btn.dataset.del })
          });
          await loadMedia();
          toast("Bild gelöscht");
        } catch (ex) {
          toast(ex.message, true);
        }
      });
    });
  }

  function ensurePage() {
    const content = getContent();
    if (!content) return null;
    content.pages = content.pages || {};
    const key = getPageKey();
    if (!content.pages[key]) content.pages[key] = { enabled: true, blocks: [] };
    return content.pages[key];
  }

  function renderVisualPreview() {
    const preview = $("#visual-preview");
    const content = getContent();
    const page = ensurePage();
    if (!preview || !content || !page || !window.GS_PAGE_RENDERER) return;

    // Provide content for renderer helpers
    window.GS_CONTENT = content;
    window.GS_SCULPTURES = content.sculptures || [];

    if (typeof getLang !== "function") {
      window.getLang = () => "it";
    }
    if (typeof t !== "function") {
      window.t = (key) => content.texts?.it?.[key] || key;
      window.I18N = content.texts ? { it: content.texts.it || {}, en: content.texts.en || {} } : { it: {}, en: {} };
    }

    const enabledBlocks = (page.blocks || []).filter((b) => b);
    preview.innerHTML = enabledBlocks
      .map((block) => {
        const html = window.GS_PAGE_RENDERER.renderBlock({
          ...block,
          enabled: true // always render shell; dim if off
        });
        if (!html) return "";
        const off = block.enabled === false ? " is-off" : "";
        const sel = block.id === selectedBlockId ? " is-selected" : "";
        // wrap
        const wrap = document.createElement("div");
        wrap.innerHTML = html.trim();
        const el = wrap.firstElementChild;
        if (!el) return "";
        el.classList.add("vb-block");
        if (off) el.classList.add("is-off");
        if (sel) el.classList.add("is-selected");
        el.dataset.vbId = block.id;
        el.dataset.vbType = block.type;
        el.setAttribute("draggable", "true");

        const chrome = document.createElement("div");
        chrome.className = "vb-block-chrome";
        chrome.innerHTML = `
          <button type="button" data-vb-up title="Nach oben">↑</button>
          <button type="button" data-vb-down title="Nach unten">↓</button>
          <button type="button" data-vb-toggle title="Ein/Aus">${block.enabled === false ? "Ein" : "Aus"}</button>
          <button type="button" data-vb-edit title="Bearbeiten">Edit</button>
          <button type="button" data-vb-del title="Löschen">×</button>
        `;
        el.style.position = el.style.position || "relative";
        el.appendChild(chrome);

        const drop = document.createElement("div");
        drop.className = "vb-drop-hint";
        drop.textContent =
          block.type === "freeCanvas"
            ? "Bild hier ablegen"
            : "Bild hierher — wird in diesen Block gesetzt";
        el.appendChild(drop);

        return el.outerHTML;
      })
      .join("");

    // Wire interactions
    wirePreviewInteractions(preview, page);
  }

  function wirePreviewInteractions(preview, page) {
    preview.querySelectorAll(".vb-block").forEach((el) => {
      const id = el.dataset.vbId;

      el.addEventListener("click", (e) => {
        if (e.target.closest(".vb-block-chrome")) return;
        if (e.target.closest(".free-canvas-item")) return;
        selectedBlockId = id;
        preview.querySelectorAll(".vb-block").forEach((b) => b.classList.remove("is-selected"));
        el.classList.add("is-selected");
      });

      el.addEventListener("dragstart", (e) => {
        if (e.target.closest(".free-canvas-item")) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("application/x-block-id", id);
        e.dataTransfer.effectAllowed = "move";
      });

      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        el.classList.add("is-drop-target");
      });
      el.addEventListener("dragleave", () => el.classList.remove("is-drop-target"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("is-drop-target");
        const blockIdMove = e.dataTransfer.getData("application/x-block-id");
        const imgUrl = e.dataTransfer.getData("text/plain") || dragMediaUrl;
        const block = page.blocks.find((b) => b.id === id);

        if (blockIdMove && blockIdMove !== id) {
          reorderBlocks(page, blockIdMove, id);
          markDirty();
          renderVisualPreview();
          if (typeof window.__adminRenderBuilderList === "function") window.__adminRenderBuilderList();
          return;
        }

        if (imgUrl && imgUrl.startsWith("/uploads/") && block) {
          applyImageToBlock(block, imgUrl, e, el);
          markDirty();
          renderVisualPreview();
          if (typeof window.__adminRenderBuilderList === "function") window.__adminRenderBuilderList();
          toast("Bild platziert");
        }
      });

      el.querySelector("[data-vb-up]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        moveBlockById(page, id, -1);
      });
      el.querySelector("[data-vb-down]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        moveBlockById(page, id, 1);
      });
      el.querySelector("[data-vb-toggle]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const b = page.blocks.find((x) => x.id === id);
        if (!b) return;
        b.enabled = b.enabled === false;
        markDirty();
        renderVisualPreview();
        if (typeof window.__adminRenderBuilderList === "function") window.__adminRenderBuilderList();
      });
      el.querySelector("[data-vb-edit]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof window.__adminOpenBlockEditor === "function") {
          window.__adminOpenBlockEditor(id);
        }
      });
      el.querySelector("[data-vb-del]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm("Block löschen?")) return;
        const i = page.blocks.findIndex((x) => x.id === id);
        if (i >= 0) page.blocks.splice(i, 1);
        markDirty();
        renderVisualPreview();
        if (typeof window.__adminRenderBuilderList === "function") window.__adminRenderBuilderList();
      });
    });

    // Free canvas item drag/resize
    preview.querySelectorAll(".free-canvas").forEach((canvas) => {
      const blockId =
        canvas.dataset.vbId ||
        canvas.dataset.blockId ||
        canvas.closest(".vb-block")?.dataset.vbId;
      const block = page.blocks.find((b) => b.id === blockId);
      if (!block) return;
      canvas.classList.add("is-edit");

      // ensure drop on empty canvas
      canvas.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      canvas.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const imgUrl = e.dataTransfer.getData("text/plain") || dragMediaUrl;
        if (!imgUrl || !imgUrl.startsWith("/uploads/")) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100 - 12;
        const y = ((e.clientY - rect.top) / rect.height) * 100 - 12;
        addImageToCanvas(block, imgUrl, clamp(x, 0, 80), clamp(y, 0, 70));
        markDirty();
        renderVisualPreview();
        toast("Bild auf Fläche gesetzt");
      });

      canvas.querySelectorAll(".free-canvas-item").forEach((item) => {
        item.classList.add("is-edit");
        // remove btn
        if (!item.querySelector(".item-remove")) {
          const rm = document.createElement("button");
          rm.type = "button";
          rm.className = "item-remove";
          rm.textContent = "×";
          rm.addEventListener("click", (e) => {
            e.stopPropagation();
            const itemId = item.dataset.itemId;
            block.data.items = (block.data.items || []).filter((i) => i.id !== itemId);
            markDirty();
            renderVisualPreview();
          });
          item.appendChild(rm);
        }
        if (!item.querySelector(".item-resize") && item.classList.contains("free-canvas-image")) {
          const rz = document.createElement("div");
          rz.className = "item-resize";
          item.appendChild(rz);
          wireResize(item, canvas, block);
        }
        wireDrag(item, canvas, block);
      });
    });
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function applyImageToBlock(block, url, event, el) {
    if (block.type === "freeCanvas") {
      const canvas = el.classList.contains("free-canvas") ? el : el.querySelector(".free-canvas");
      if (canvas && event) {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100 - 12;
        const y = ((event.clientY - rect.top) / rect.height) * 100 - 12;
        addImageToCanvas(block, url, clamp(x, 0, 80), clamp(y, 0, 70));
      } else {
        addImageToCanvas(block, url, 10, 10);
      }
      return;
    }
    if (block.type === "imageBanner" || block.type === "intro" || block.type === "imageText") {
      block.data = block.data || {};
      block.data.image = url;
      return;
    }
    // default: create freeCanvas with this image or set on selected
    // If not a canvas, still set image field if exists
    if (block.data && "image" in block.data) {
      block.data.image = url;
    } else {
      toast("Für freie Platzierung: Block „Freie Bildfläche“ nutzen", true);
    }
  }

  function addImageToCanvas(block, url, x, y) {
    block.data = block.data || {};
    block.data.items = Array.isArray(block.data.items) ? block.data.items : [];
    block.data.items.push({
      id: "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      type: "image",
      src: url,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      w: 28,
      h: 36,
      z: block.data.items.length + 1,
      objectFit: "cover"
    });
  }

  function wireDrag(item, canvas, block) {
    let startX, startY, origX, origY, dragging = false;
    item.addEventListener("pointerdown", (e) => {
      if (e.target.classList.contains("item-resize") || e.target.classList.contains("item-remove")) return;
      dragging = true;
      item.setPointerCapture(e.pointerId);
      const data = (block.data.items || []).find((i) => i.id === item.dataset.itemId);
      if (!data) return;
      startX = e.clientX;
      startY = e.clientY;
      origX = Number(data.x) || 0;
      origY = Number(data.y) || 0;
      e.preventDefault();
    });
    item.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const data = (block.data.items || []).find((i) => i.id === item.dataset.itemId);
      if (!data) return;
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      data.x = clamp(origX + dx, 0, 95);
      data.y = clamp(origY + dy, 0, 95);
      item.style.left = data.x + "%";
      item.style.top = data.y + "%";
    });
    item.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      markDirty();
    });
  }

  function wireResize(item, canvas, block) {
    const handle = item.querySelector(".item-resize");
    if (!handle) return;
    let resizing = false;
    let startX, startY, origW, origH;
    handle.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      resizing = true;
      handle.setPointerCapture(e.pointerId);
      const data = (block.data.items || []).find((i) => i.id === item.dataset.itemId);
      if (!data) return;
      startX = e.clientX;
      startY = e.clientY;
      origW = Number(data.w) || 25;
      origH = Number(data.h) || 30;
    });
    handle.addEventListener("pointermove", (e) => {
      if (!resizing) return;
      const data = (block.data.items || []).find((i) => i.id === item.dataset.itemId);
      if (!data) return;
      const rect = canvas.getBoundingClientRect();
      const dw = ((e.clientX - startX) / rect.width) * 100;
      const dh = ((e.clientY - startY) / rect.height) * 100;
      data.w = clamp(origW + dw, 8, 90);
      data.h = clamp(origH + dh, 8, 90);
      item.style.width = data.w + "%";
      item.style.height = data.h + "%";
    });
    handle.addEventListener("pointerup", () => {
      if (!resizing) return;
      resizing = false;
      markDirty();
    });
  }

  function reorderBlocks(page, fromId, toId) {
    const from = page.blocks.findIndex((b) => b.id === fromId);
    const to = page.blocks.findIndex((b) => b.id === toId);
    if (from < 0 || to < 0) return;
    const [item] = page.blocks.splice(from, 1);
    page.blocks.splice(to, 0, item);
  }

  function moveBlockById(page, id, dir) {
    const i = page.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= page.blocks.length) return;
    const t = page.blocks[i];
    page.blocks[i] = page.blocks[j];
    page.blocks[j] = t;
    markDirty();
    renderVisualPreview();
    if (typeof window.__adminRenderBuilderList === "function") window.__adminRenderBuilderList();
  }

  async function onUploadFiles(files) {
    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "same-origin",
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
    }
    await loadMedia();
    toast(files.length > 1 ? `${files.length} Bilder hochgeladen` : "Bild hochgeladen");
  }

  function setListMode(on) {
    listMode = on;
    const list = $("#builder-list");
    const preview = $("#visual-preview");
    const btn = $("#builder-view-toggle");
    if (list) list.hidden = !on;
    if (preview) preview.hidden = on;
    if (btn) btn.textContent = on ? "Vorschau" : "Liste";
    if (!on) renderVisualPreview();
  }

  function initVisualEditor() {
    const upload = $("#media-upload-input");
    upload?.addEventListener("change", async () => {
      if (!upload.files?.length) return;
      try {
        await onUploadFiles([...upload.files]);
        upload.value = "";
      } catch (ex) {
        toast(ex.message, true);
      }
    });

    $("#builder-view-toggle")?.addEventListener("click", () => setListMode(!listMode));

    $("#builder-add-canvas-btn")?.addEventListener("click", () => {
      if (!window.GS_BLOCKS) return;
      const page = ensurePage();
      if (!page) return;
      const block = window.GS_BLOCKS.createBlock("freeCanvas", () => "");
      page.blocks.push(block);
      selectedBlockId = block.id;
      markDirty();
      renderVisualPreview();
      if (typeof window.__adminRenderBuilderList === "function") window.__adminRenderBuilderList();
      toast("Freie Bildfläche hinzugefügt — Bilder aus Medien ablegen");
    });

    // drop files on media rail
    const rail = $(".media-rail");
    rail?.addEventListener("dragover", (e) => e.preventDefault());
    rail?.addEventListener("drop", async (e) => {
      e.preventDefault();
      const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith("image/"));
      if (files.length) {
        try {
          await onUploadFiles(files);
        } catch (ex) {
          toast(ex.message, true);
        }
      }
    });
  }

  window.GS_VISUAL = {
    refresh() {
      loadMedia();
      if (!listMode) renderVisualPreview();
    },
    renderVisualPreview,
    loadMedia,
    setListMode
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVisualEditor);
  } else {
    initVisualEditor();
  }
})();
