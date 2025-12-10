# Fediverse Meetup Map

An interactive map displaying Mastodon community meetups with hashtags. Each marker links directly to the Mastodon feed for the respective hashtag.

---

## 📂 Project Structure
```
feditreff/
├── index.html            # Karte
├── meetups.json          # Meetup-Daten
├── assets/
│   ├── css/
│   │   └── index.css
│   └── js/
│       └── index.js
└── README.md
```

---

## 🚀 Local Usage

1. **Clone the repository or download the files.**
2. **Start locally:**
   ```bash
   npx http-server
   ```
3. Open http://localhost:8080 in your browser.

## ✍️ Treffen vorschlagen

- In `index.html` ist ein Popup-Formular (Button „Meetup vorschlagen“). Hashtag, Ort und optional Titel/Beschreibung eingeben; Koordinaten werden automatisch per Nominatim (OpenStreetMap) ermittelt und in der Kartenvorschau angezeigt.
- Beim Absenden öffnet sich ein vorbefülltes GitHub-Issue (Label `neues treffen`); Nutzer:innen reichen es dort ein. Alternativ können sie die Daten kopieren (Button „Daten kopieren“) und per Mail/Messenger schicken.
