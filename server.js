/**
 * Emanuele “Willy” Bellemo — website server
 * Serves the public site + admin API (texts, sculptures, uploads)
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");

const ROOT = __dirname;
const SEED_DATA_DIR = path.join(ROOT, "data");
const SEED_UPLOAD_DIR = path.join(ROOT, "uploads");

// On Render, set STORAGE_DIR=/var/data and mount a Persistent Disk at /var/data.
// Locally, the project directory remains the storage location.
const STORAGE_ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : ROOT;
const DATA_DIR = path.join(STORAGE_ROOT, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const UPLOAD_DIR = path.join(STORAGE_ROOT, "uploads");
const SEED_CONTENT_FILE = path.join(SEED_DATA_DIR, "content.json");
const SEED_CONFIG_FILE = path.join(SEED_DATA_DIR, "config.json");
const SESSIONS = new Map();
const RELEASE_ID = (() => {
  try {
    return String(require(path.join(ROOT, "package.json")).version || "1.0.0");
  } catch {
    return "1.0.0";
  }
})();
const RELEASE_MARKER = path.join(DATA_DIR, ".repository-release");

function loadConfig() {
  const defaults = {
    adminPassword: "museo2026",
    sessionSecret: "cambia-questa-chiave-segreta",
    port: 3847
  };
  try {
    const fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    return {
      ...defaults,
      ...fileConfig,
      adminPassword: process.env.ADMIN_PASSWORD || fileConfig.adminPassword || defaults.adminPassword,
      sessionSecret: process.env.SESSION_SECRET || fileConfig.sessionSecret || defaults.sessionSecret
    };
  } catch {
    return {
      ...defaults,
      adminPassword: process.env.ADMIN_PASSWORD || defaults.adminPassword,
      sessionSecret: process.env.SESSION_SECRET || defaults.sessionSecret
    };
  }
}

function loadContent() {
  if (!fs.existsSync(CONTENT_FILE)) {
    throw new Error("data/content.json missing — run seed or restore the file.");
  }
  return JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
}

function saveContent(content) {
  const tempFile = `${CONTENT_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(content, null, 2), "utf8");
  fs.renameSync(tempFile, CONTENT_FILE);
}

function copyIfMissing(source, target) {
  if (!fs.existsSync(target) && fs.existsSync(source)) {
    fs.copyFileSync(source, target);
  }
}

function copyAtomic(source, target) {
  const temp = `${target}.tmp`;
  fs.copyFileSync(source, temp);
  fs.renameSync(temp, target);
}

function repositoryReleaseOnDisk() {
  try {
    return fs.readFileSync(RELEASE_MARKER, "utf8").trim();
  } catch {
    return "";
  }
}

function syncRepositoryRelease() {
  // Render serves CMS data from the Persistent Disk. Without this release sync,
  // a deploy can run new HTML/CSS while still serving an old content.json.
  // Sync once per package version so production matches the tested localhost build.
  if (!process.env.STORAGE_DIR) return;
  if (repositoryReleaseOnDisk() === RELEASE_ID) return;

  // This release intentionally makes production identical to the tested localhost build.
  // The repository content.json is copied over the Persistent Disk once per package version.
  copyAtomic(SEED_CONTENT_FILE, CONTENT_FILE);

  if (fs.existsSync(SEED_UPLOAD_DIR)) {
    for (const filename of fs.readdirSync(SEED_UPLOAD_DIR)) {
      if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(filename)) continue;
      copyAtomic(path.join(SEED_UPLOAD_DIR, filename), path.join(UPLOAD_DIR, filename));
    }
  }

  fs.writeFileSync(RELEASE_MARKER, `${RELEASE_ID}\n`, "utf8");
  console.log(`  Release-Sync:   Repository ${RELEASE_ID} → Persistent Disk`);
}

function ensureDirs() {
  for (const dir of [DATA_DIR, UPLOAD_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // First boot with a fresh Persistent Disk: seed it from the repository.
  copyIfMissing(SEED_CONTENT_FILE, CONTENT_FILE);
  copyIfMissing(SEED_CONFIG_FILE, CONFIG_FILE);

  if (fs.existsSync(SEED_UPLOAD_DIR)) {
    for (const filename of fs.readdirSync(SEED_UPLOAD_DIR)) {
      if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(filename)) continue;
      copyIfMissing(path.join(SEED_UPLOAD_DIR, filename), path.join(UPLOAD_DIR, filename));
    }
  }

  syncRepositoryRelease();
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.gs_admin || req.headers["x-admin-token"];
  if (!token || !SESSIONS.has(token)) {
    return res.status(401).json({ error: "Non autorizzato" });
  }
  // refresh TTL
  SESSIONS.set(token, Date.now());
  next();
}

// Clean old sessions every hour
setInterval(() => {
  const maxAge = 1000 * 60 * 60 * 12;
  const now = Date.now();
  for (const [token, ts] of SESSIONS) {
    if (now - ts > maxAge) SESSIONS.delete(token);
  }
}, 60 * 60 * 1000);

ensureDirs();

// One-time v2 branding migration. Keeps artworks and uploaded media intact.
function migrateToWillyV2() {
  try {
    const current = loadContent();
    if (Number(current.settings?.siteVersion || 0) >= 2) return;
    const seed = JSON.parse(fs.readFileSync(SEED_CONTENT_FILE, "utf8"));
    const migrated = {
      ...current,
      settings: { ...current.settings, ...seed.settings, siteVersion: 2 },
      texts: seed.texts,
      pages: seed.pages,
      sculptures: current.sculptures || seed.sculptures,
      media: current.media || seed.media || []
    };
    saveContent(migrated);
    console.log("  Migrazione:     Willy Bellemo v2 applicata");
  } catch (err) {
    console.error("  Migrazione v2 non riuscita:", err.message);
  }
}

migrateToWillyV2();
const config = loadConfig();
const app = express();

app.use(express.json({ limit: "4mb" }));
app.use(cookieParser(config.sessionSecret));

// Avoid old HTML/CSS/JS surviving a deploy in browser or proxy caches.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || /\.(?:html|css|js|json)$/i.test(req.path) || req.path === "/") {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
  next();
});

app.use("/uploads", express.static(UPLOAD_DIR, { etag: true, maxAge: 0 }));
app.use("/admin", express.static(path.join(ROOT, "admin"), { etag: true, maxAge: 0 }));
app.use(express.static(ROOT, { etag: true, maxAge: 0 }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif|avif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Solo immagini (jpg, png, webp, gif)"), ok);
  }
});

// ---------- Public API ----------
app.get("/api/content", (_req, res) => {
  try {
    res.json(loadContent());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Auth ----------
app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");
  const expected = String(config.adminPassword || "");
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  const ok = crypto.timingSafeEqual(a, b);
  if (!ok) {
    return res.status(401).json({ error: "Password errata" });
  }
  const token = createToken();
  SESSIONS.set(token, Date.now());
  res.cookie("gs_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 12,
    path: "/"
  });
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  const token = req.cookies?.gs_admin;
  if (token) SESSIONS.delete(token);
  res.clearCookie("gs_admin");
  res.json({ ok: true });
});

app.get("/api/admin/me", (req, res) => {
  const token = req.cookies?.gs_admin;
  res.json({ authenticated: Boolean(token && SESSIONS.has(token)) });
});

// ---------- Admin content ----------
app.get("/api/admin/content", authMiddleware, (_req, res) => {
  try {
    res.json(loadContent());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/content", authMiddleware, (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Contenuto non valido" });
    }
    if (!body.texts || !body.sculptures) {
      return res.status(400).json({ error: "Struttura incompleta (texts, sculptures)" });
    }
    saveContent(body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/texts", authMiddleware, (req, res) => {
  try {
    const content = loadContent();
    const { lang, texts } = req.body || {};
    if ((lang !== "it" && lang !== "en") || !texts || typeof texts !== "object") {
      return res.status(400).json({ error: "lang (it|en) e texts richiesti" });
    }
    content.texts = content.texts || {};
    content.texts[lang] = { ...content.texts[lang], ...texts };
    saveContent(content);
    res.json({ ok: true, texts: content.texts[lang] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/settings", authMiddleware, (req, res) => {
  try {
    const content = loadContent();
    content.settings = { ...content.settings, ...(req.body || {}) };
    saveContent(content);
    res.json({ ok: true, settings: content.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/sculptures", authMiddleware, (req, res) => {
  try {
    const content = loadContent();
    if (!Array.isArray(req.body?.sculptures)) {
      return res.status(400).json({ error: "sculptures array richiesto" });
    }
    content.sculptures = req.body.sculptures;
    // keep stats.works in sync
    if (content.settings?.stats) {
      content.settings.stats.works = String(content.sculptures.length);
    }
    saveContent(content);
    res.json({ ok: true, sculptures: content.sculptures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/media", authMiddleware, (_req, res) => {
  try {
    const files = fs
      .readdirSync(UPLOAD_DIR)
      .filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
      .map((filename) => {
        const full = path.join(UPLOAD_DIR, filename);
        const st = fs.statSync(full);
        return {
          filename,
          url: `/uploads/${filename}`,
          size: st.size,
          mtime: st.mtimeMs
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json({ media: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/upload", authMiddleware, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload fallito" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Nessun file" });
    }
    const url = `/uploads/${req.file.filename}`;
    // track in content.media for convenience
    try {
      const content = loadContent();
      content.media = Array.isArray(content.media) ? content.media : [];
      content.media.unshift({
        url,
        filename: req.file.filename,
        addedAt: Date.now()
      });
      // keep last 200
      content.media = content.media.slice(0, 200);
      saveContent(content);
    } catch {
      /* ignore */
    }
    res.json({ ok: true, url, filename: req.file.filename });
  });
});

app.delete("/api/admin/upload", authMiddleware, (req, res) => {
  try {
    const filename = path.basename(String(req.body?.filename || req.body?.url || ""));
    const base = filename.includes("/") ? path.basename(filename) : filename;
    if (!base) return res.status(400).json({ error: "filename richiesto" });
    const full = path.join(UPLOAD_DIR, base);
    if (fs.existsSync(full)) fs.unlinkSync(full);
    try {
      const content = loadContent();
      content.media = (content.media || []).filter(
        (m) => m.filename !== base && m.url !== `/uploads/${base}`
      );
      saveContent(content);
    } catch {
      /* ignore */
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA-ish admin entry
app.get("/admin", (_req, res) => {
  res.sendFile(path.join(ROOT, "admin", "index.html"));
});

const PORT = Number(process.env.PORT) || config.port || 3847;
app.listen(PORT, () => {
  console.log("");
  console.log("  Emanuele “Willy” Bellemo — Chioggia");
  console.log(`  Sito pubblico:  http://localhost:${PORT}/`);
  console.log(`  Admin:          http://localhost:${PORT}/admin/`);
  console.log(`  Speicher:       ${STORAGE_ROOT}`);
  console.log(`  Password:       ADMIN_PASSWORD oder data/config.json`);
  console.log("");
});
