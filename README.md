# Galleria Scultura — Museo

Online-Museum für Skulpturen (Italienisch / Englisch) mit **Admin-Bereich** für Texte und Bilder.

## Starten

Voraussetzung: [Node.js](https://nodejs.org/) (v18+)

```bash
cd scultura-galleria
npm install
npm start
```

Dann im Browser:

| | URL |
|--|-----|
| **Website** | http://localhost:3847/ |
| **Admin** | http://localhost:3847/admin/ |
| **Passwort** | `museo2026` |

Passwort ändern in `data/config.json` → `adminPassword`.

## Admin-Funktionen

- **Werke & Bilder:** Skulpturen anlegen/bearbeiten/löschen, Fotos hochladen, „Auf Startseite zeigen“
- **Baukasten:** Seiten aus Bausteinen aufbauen (hinzufügen, sortieren, ein/aus, bearbeiten, IT/EN)
- **Texte (IT / EN):** alle Website-Texte in Italienisch und Englisch
- **Sektionen:** grobes Ein-/Ausblenden (ergänzend zum Baukasten)
- **Einstellungen:** Logo-Name, E-Mail, Statistiken

Nach dem Speichern die öffentliche Seite neu laden (F5).

### Baukasten-Bausteine

Entrance/Hero, Besucher-Streifen, Intro, Werke (Auswahl/Galerie), Prozess, Zitat, Kontakt, Seiten-Kopf, freier Text, Bild+Text, CTA, Material-Karten, Abstand.

## Projektstruktur

```
scultura-galleria/
├── admin/           # Admin-UI
├── data/
│   ├── content.json # Alle Texte + Werke (CMS-Daten)
│   └── config.json  # Passwort & Port
├── uploads/         # Hochgeladene Bilder
├── css/ js/         # Öffentliche Website
├── server.js        # Express-Server
└── index.html …
```

## Hinweis

Ohne `npm start` funktioniert die statische Seite weiterhin, aber **ohne** CMS-API (Standard-Texte aus `js/i18n.js`, keine Admin-Uploads).
