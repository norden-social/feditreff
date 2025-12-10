// About dialog
const aboutDialog = document.getElementById('aboutDialog');
const aboutBtn = document.getElementById('aboutBtn');
const closeBtn = document.getElementById('closeDialog');

aboutBtn.addEventListener('click', () => aboutDialog.showModal());
closeBtn.addEventListener('click', () => aboutDialog.close());
aboutDialog.addEventListener('click', (e) => {
    if (e.target === aboutDialog) aboutDialog.close();
});

// Submit dialog elements
const submitDialog = document.getElementById('submitDialog');
const addMeetupBtn = document.getElementById('addMeetupBtn');
const closeSubmitBtn = document.getElementById('closeSubmit');
const copyBtn = document.getElementById('copyBtn');
const form = document.getElementById('meetupForm');
const submitBtn = document.getElementById('submitBtn');
const statusBox = document.getElementById('status');
const ortInput = document.getElementById('ort');
const hashtagInput = document.getElementById('hashtag');
const beschreibungInput = document.getElementById('beschreibung');
const titleInput = document.getElementById('title');

// Map instances
const map = L.map('map').setView([51.1657, 10.4515], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let previewMap = null;
let previewMarker = null;
let lastCoords = null;
let geocodeDebounce;

// Load meetups
fetch('meetups.json')
    .then(response => response.json())
    .then(data => {
        const markerBounds = [];
        data.forEach(treffen => {
            const mastodonUrl = `https://${treffen.mastodon_server}/tags/${treffen.hashtag.substring(1)}`;
            const marker = L.marker([treffen.lat, treffen.lng]).addTo(map)
                .bindPopup(`
                    <b>${treffen.hashtag}</b><br>
                    ${treffen.ort}<br>
                    <a href="${mastodonUrl}" target="_blank">Zum Mastodon-Feed</a>
                `);
            markerBounds.push([treffen.lat, treffen.lng]);
        });
        if (markerBounds.length > 0) {
            map.fitBounds(markerBounds, { padding: [50, 50] });
        }
    });

// Helper UI functions
function setStatus(message, type = 'info') {
    statusBox.textContent = message;
    statusBox.className = `status show ${type}`;
}

function clearStatus() {
    statusBox.textContent = '';
    statusBox.className = 'status';
}

function ensurePreviewMap() {
    if (previewMap) return;
    previewMap = L.map('previewMap').setView([51.1657, 10.4515], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap-Mitwirkende'
    }).addTo(previewMap);
}

function placePreviewMarker(lat, lng, label) {
    ensurePreviewMap();
    if (!previewMarker) {
        previewMarker = L.marker([lat, lng]).addTo(previewMap);
    } else {
        previewMarker.setLatLng([lat, lng]);
    }
    previewMarker.bindPopup(label || 'Gefundener Ort').openPopup();
    previewMap.setView([lat, lng], 13);
}

async function geocodeLocation(ort) {
    setStatus('Koordinaten werden ermittelt …', 'info');
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ort)}`);
    if (!response.ok) {
        throw new Error('Geocoding fehlgeschlagen. Bitte später erneut versuchen.');
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Ort nicht gefunden. Bitte gib einen klaren Ortsnamen ein (z. B. "Berlin" oder "München, Marienplatz").');
    }
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('Koordinaten konnten nicht gelesen werden. Bitte versuche es erneut.');
    }
    lastCoords = { lat, lng };
    placePreviewMarker(lat, lng, ort);
    setStatus(`Gefunden: ${ort}`, 'success');
    return lastCoords;
}

function scheduleGeocode() {
    clearTimeout(geocodeDebounce);
    const ort = ortInput.value.trim();
    if (ort.length < 3) {
        clearStatus();
        return;
    }
    geocodeDebounce = setTimeout(() => geocodeLocation(ort).catch(() => {}), 750);
}

// Submit dialog interactions
addMeetupBtn.addEventListener('click', () => {
    submitDialog.showModal();
    ensurePreviewMap();
    setTimeout(() => previewMap?.invalidateSize(), 50);
});

closeSubmitBtn.addEventListener('click', () => submitDialog.close());
submitDialog.addEventListener('click', (e) => {
    if (e.target === submitDialog) submitDialog.close();
});

ortInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const ort = ortInput.value.trim();
        if (ort) {
            geocodeLocation(ort).catch(() => {});
        }
    }
});

ortInput.addEventListener('input', scheduleGeocode);

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatus();

    if (!form.reportValidity()) {
        setStatus('Bitte fülle die Pflichtfelder aus.', 'error');
        return;
    }

    const ort = ortInput.value.trim();
    const hashtag = hashtagInput.value.trim();
    const beschreibung = beschreibungInput.value.trim();

    try {
        const coords = await geocodeLocation(ort);
        const { issueUrl } = buildIssueData({ hashtag, ort, beschreibung, coords });
        window.open(issueUrl, '_blank', 'noopener,noreferrer');
        setStatus('Öffne GitHub-Issue-Formular mit deinen Daten. Bitte dort absenden.', 'success');
    } catch (err) {
        setStatus(`❌ Fehler: ${err.message}`, 'error');
    }
});

copyBtn.addEventListener('click', async () => {
    clearStatus();
    if (!form.reportValidity()) {
        setStatus('Bitte fülle die Pflichtfelder aus.', 'error');
        return;
    }
    const ort = ortInput.value.trim();
    const hashtag = hashtagInput.value.trim();
    const beschreibung = beschreibungInput.value.trim();
    try {
        const coords = lastCoords || await geocodeLocation(ort);
        const { bodyText } = buildIssueData({ hashtag, ort, beschreibung, coords });
        await navigator.clipboard.writeText(bodyText);
        setStatus('Daten wurden in die Zwischenablage kopiert. Du kannst sie in Mail oder Messenger einfügen.', 'success');
    } catch (err) {
        setStatus(`❌ Fehler: ${err.message}`, 'error');
    }
});

function buildIssueData({ hashtag, ort, beschreibung, coords }) {
    const bodyText = `**Hashtag:** ${hashtag}
**Ort:** ${ort}
**Breitengrad:** ${coords.lat}
**Längengrad:** ${coords.lng}
**Beschreibung:** ${beschreibung || '—'}`;
    const customTitle = titleInput.value.trim();
    const title = customTitle || `Neues Treffen: ${ort}`;
    const issueUrl = `https://github.com/norden-social/feditreff/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(bodyText)}&labels=${encodeURIComponent('neues treffen')}`;
    return { bodyText, issueUrl };
}

