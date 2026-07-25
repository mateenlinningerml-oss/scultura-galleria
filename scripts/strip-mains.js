const fs = require("fs");

function stripMain(file, page) {
  let h = fs.readFileSync(file, "utf8");
  h = h.replace(
    /<main[\s\S]*?<\/main>/,
    `<main id="page-root" data-page-root="${page}">\n    <!-- Baukasten -->\n  </main>`
  );
  if (!h.includes("blocks.js")) {
    h = h.replace(
      '<script src="js/i18n.js"></script>',
      `<script src="js/i18n.js"></script>
  <script src="js/blocks.js"></script>
  <script src="js/page-renderer.js"></script>`
    );
  }
  if (!h.includes("content-loader.js")) {
    h = h.replace(
      '<script src="js/main.js"></script>',
      `<script src="js/content-loader.js"></script>
  <script src="js/main.js"></script>`
    );
  }
  fs.writeFileSync(file, h);
  console.log("ok", file);
}

stripMain("gallery.html", "gallery");
stripMain("about.html", "about");
stripMain("contact.html", "contact");
