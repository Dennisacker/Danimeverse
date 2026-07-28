import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ═══════════════════════════════════════════
   FIREBASE — real config from auth.js
═══════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQpDRNYQ4",
  authDomain: "danimeverse-c1fa3.firebaseapp.com",
  projectId: "danimeverse-c1fa3",
  storageBucket: "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId: "1:626679123848:web:dec7eeffb63885fa48343d"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ═══════════════════════════════════════════
   SITE CATALOGUE — sourced from search.js
═══════════════════════════════════════════ */
const SITE_CATALOG = [
  { title: "Naruto",                  slug: "naruto",                   keywords: ["naruto","uzumaki"],                            image: "https://cdn.myanimelist.net/images/anime/13/17405.jpg",     genres: "Action · Adventure" },
  { title: "Attack on Titan",         slug: "attack-on-titan",          keywords: ["aot","titan","shingeki","eren"],               image: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",     genres: "Action · Dark Fantasy" },
  { title: "Demon Slayer",            slug: "demon-slayer",             keywords: ["demon","kimetsu","tanjiro","yaiba"],           image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",   genres: "Action · Shonen" },
  { title: "Jujutsu Kaisen",          slug: "jujutsu-kaisen",           keywords: ["jjk","jujutsu","gojo","itadori"],              image: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",  genres: "Action · Supernatural" },
  { title: "Chainsaw Man",            slug: "chainsaw-man",             keywords: ["chainsaw","denji","power"],                    image: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg",  genres: "Action · Dark" },
  { title: "Fire Force",              slug: "fire-force",               keywords: ["fire","enen","shinra"],                        image: "https://cdn.myanimelist.net/images/anime/1715/100536.jpg",  genres: "Action · Sci-Fi" },
  { title: "Dr. Stone",               slug: "dr-stone",                 keywords: ["stone","senku","dr stone"],                    image: "https://cdn.myanimelist.net/images/anime/1613/102576.jpg",  genres: "Sci-Fi · Adventure" },
  { title: "Re:Zero",                 slug: "re-zero",                  keywords: ["rezero","re zero","subaru","emilia"],          image: "https://cdn.myanimelist.net/images/anime/1522/128039.jpg",  genres: "Fantasy · Drama" },
  { title: "Mushoku Tensei",          slug: "mushoku-tensei",           keywords: ["mushoku","rudeus","isekai"],                   image: "https://cdn.myanimelist.net/images/anime/1530/117776.jpg",  genres: "Fantasy · Isekai" },
  { title: "My Hero Academia",        slug: "my-hero-academia",         keywords: ["mha","bnha","boku no hero","deku","midoriya"], image: "https://cdn.myanimelist.net/images/anime/10/78745.jpg",     genres: "Action · School" },
  { title: "Assassination Classroom", slug: "assassination-classroom",  keywords: ["ansatsu","koro","korosensei"],                 image: "https://cdn.myanimelist.net/images/anime/5/75639.jpg",      genres: "Action · Comedy" },
  { title: "Fate/Strange Fake",       slug: "fate-strange-fake",        keywords: ["fate","strange fake"],                        image: "https://cdn.myanimelist.net/images/anime/1764/134379.jpg",  genres: "Action · Fantasy" },
  { title: "Frieren",                 slug: "frieren",                  keywords: ["sousou","frieren","journey"],                  image: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",  genres: "Adventure · Drama" },
  { title: "Hell's Paradise",         slug: "hells-paradise",           keywords: ["jigokuraku","hell paradise","gabimaru"],       image: "https://cdn.myanimelist.net/images/anime/1438/134581.jpg",  genres: "Action · Dark" },
  { title: "Oshi no Ko",              slug: "oshi-no-ko",               keywords: ["oshi","idol","aqua","ruby"],                   image: "https://cdn.myanimelist.net/images/anime/1812/134736.jpg",  genres: "Drama · Mystery" },
  { title: "Solo Leveling",           slug: "solo-leveling",            keywords: ["solo","jinwoo","level up","ore dake"],         image: "https://cdn.myanimelist.net/images/anime/1325/140390.jpg",  genres: "Action · Fantasy" },
  { title: "Tokyo Revengers",         slug: "tokyo-revengers",          keywords: ["tokyo rev","takemichi","mikey"],               image: "https://cdn.myanimelist.net/images/anime/1839/110491.jpg",  genres: "Action · Drama" },
  { title: "Witch Hat Atelier",       slug: "witch-hat-atelier",        keywords: ["tongari","witch hat","coco"],                  image: "https://cdn.myanimelist.net/images/anime/1826/139048.jpg",  genres: "Fantasy · Adventure" },
];

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let selectedAnime  = null;  // { title, slug, image, genres }
let loadedEpisodes = [];    // all episodes for selected anime
let editingEp      = null;  // episode number being edited (null = new)

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = "", 3000);
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(typeof ts === "number" ? ts : ts.toMillis ? ts.toMillis() : ts.seconds * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ═══════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════ */
const searchInput   = document.getElementById("animeSearch");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchResults.style.display = "none"; return; }

  const hits = SITE_CATALOG.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.keywords.some(k => k.includes(q) || q.includes(k))
  );

  if (!hits.length) { searchResults.style.display = "none"; return; }

  searchResults.innerHTML = hits.map(a => `
    <div class="search-result-item" data-slug="${a.slug}">
      <img src="${a.image}" alt="${a.title}" loading="lazy" />
      <div class="info">
        <h4>${a.title}</h4>
        <p>${a.genres}</p>
      </div>
    </div>`).join("");

  searchResults.style.display = "block";

  searchResults.querySelectorAll(".search-result-item").forEach(item => {
    item.addEventListener("click", () => {
      const slug = item.dataset.slug;
      const anime = SITE_CATALOG.find(a => a.slug === slug);
      selectAnime(anime);
    });
  });
});

// Close on outside click
document.addEventListener("click", e => {
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.style.display = "none";
  }
});

/* ═══════════════════════════════════════════
   SELECT ANIME
═══════════════════════════════════════════ */
function selectAnime(anime) {
  selectedAnime = anime;
  editingEp     = null;

  // Update search UI
  searchInput.value      = anime.title;
  searchResults.style.display = "none";

  // Show selected card
  const card = document.getElementById("selectedAnimeCard");
  card.style.display    = "flex";
  document.getElementById("selectedPoster").src  = anime.image;
  document.getElementById("selectedTitle").textContent  = anime.title;
  document.getElementById("selectedGenres").textContent = anime.genres;
  document.getElementById("selectedSlug").textContent   = anime.slug;

  loadEpisodes();
}

/* ═══════════════════════════════════════════
   LOAD EPISODES
═══════════════════════════════════════════ */
async function loadEpisodes() {
  if (!selectedAnime) return;

  const box = document.getElementById("episodeList");
  box.innerHTML = `<div class="empty">Loading…</div>`;

  const snap = await getDocs(collection(db, "videos"));
  loadedEpisodes = [];

  snap.forEach(d => {
    const data = d.data();
    if (data.animeSlug === selectedAnime.slug || data.anime === selectedAnime.slug) {
      loadedEpisodes.push({ ...data, _docId: d.id });
    }
  });

  loadedEpisodes.sort((a, b) => a.episode - b.episode);

  const count = loadedEpisodes.length;
  document.getElementById("epCount").textContent =
    count ? `${count} episode${count !== 1 ? "s" : ""}` : "No episodes yet";

  if (!count) {
    box.innerHTML = `<div class="empty">No episodes uploaded yet. Be the first!</div>`;
    suggestNextEp();
    return;
  }

  box.innerHTML = loadedEpisodes.map(ep => `
    <div class="ep-item ${editingEp === ep.episode ? 'active' : ''}"
         data-ep="${ep.episode}">
      <span class="ep-num">Ep ${ep.episode}</span>
      <span class="ep-title">${ep.title || 'Episode ' + ep.episode}</span>
      <span class="ep-date">${formatDate(ep.createdAt)}</span>
      <span class="ep-link ${ep.video ? 'link-ok' : 'link-miss'}">${ep.video ? '✔ Link' : '✘ No link'}</span>
    </div>`).join("");

  box.querySelectorAll(".ep-item").forEach(item => {
    item.addEventListener("click", () => loadEpIntoEditor(parseInt(item.dataset.ep)));
  });

  suggestNextEp();
}

function suggestNextEp() {
  if (editingEp !== null) return; // don't overwrite while editing
  const next = loadedEpisodes.length
    ? loadedEpisodes[loadedEpisodes.length - 1].episode + 1
    : 1;
  document.getElementById("epNumber").value = next;
}

/* ═══════════════════════════════════════════
   LOAD EPISODE INTO EDITOR
═══════════════════════════════════════════ */
function loadEpIntoEditor(epNum) {
  const ep = loadedEpisodes.find(e => e.episode === epNum);
  if (!ep) return;

  editingEp = epNum;

  document.getElementById("epNumber").value = ep.episode;
  document.getElementById("epTitle").value  = ep.title || "";
  document.getElementById("epVideo").value  = ep.video || "";

  // highlight active ep
  document.querySelectorAll(".ep-item").forEach(el => {
    el.classList.toggle("active", parseInt(el.dataset.ep) === epNum);
  });

  // scroll form into view
  document.getElementById("epNumber").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ═══════════════════════════════════════════
   UPLOAD / UPDATE
═══════════════════════════════════════════ */
document.getElementById("uploadBtn").addEventListener("click", async () => {
  if (!selectedAnime) {
    toast("Please select an anime first.", "error"); return;
  }

  const epNum  = parseInt(document.getElementById("epNumber").value);
  const title  = document.getElementById("epTitle").value.trim();
  const video  = document.getElementById("epVideo").value.trim();

  if (!epNum || epNum < 1) { toast("Enter a valid episode number.", "error"); return; }
  if (!video)              { toast("Paste the Febbox URL.", "error"); return; }

  const docId = `${selectedAnime.slug}_${epNum}`;

  await setDoc(doc(db, "videos", docId), {
    animeName:  selectedAnime.title,
    anime:      selectedAnime.slug,
    animeSlug:  selectedAnime.slug,
    episode:    epNum,
    title:      title || `Episode ${epNum}`,
    video:      video,
    createdAt:  Date.now()
  });

  // Save URL to history
  saveUrlHistory(video);

  toast(`✅ Episode ${epNum} of ${selectedAnime.title} uploaded!`);

  // Show success banner briefly
  const banner = document.getElementById("successBanner");
  banner.style.display = "flex";
  setTimeout(() => { banner.style.display = "none"; }, 3000);

  // Clear fields (keep ep number bumped)
  document.getElementById("epTitle").value = "";
  document.getElementById("epVideo").value = "";
  editingEp = null;

  // Refresh
  await loadEpisodes();
  await loadRecentUploads();
  loadStats();
});

/* ═══════════════════════════════════════════
   CLEAR BUTTON
═══════════════════════════════════════════ */
document.getElementById("clearBtn").addEventListener("click", () => {
  editingEp = null;
  document.getElementById("epTitle").value = "";
  document.getElementById("epVideo").value = "";
  document.querySelectorAll(".ep-item").forEach(el => el.classList.remove("active"));
  suggestNextEp();
});

/* ═══════════════════════════════════════════
   URL HISTORY (localStorage, last 10)
═══════════════════════════════════════════ */
const URL_HISTORY_KEY = "danimeverse_url_history";

function getUrlHistory() {
  try { return JSON.parse(localStorage.getItem(URL_HISTORY_KEY) || "[]"); }
  catch (_) { return []; }
}

function saveUrlHistory(url) {
  if (!url) return;
  let h = getUrlHistory().filter(u => u !== url); // remove duplicate
  h.unshift(url);
  h = h.slice(0, 10); // keep last 10
  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(h));
  renderUrlHistory();
}

function renderUrlHistory() {
  const box = document.getElementById("urlHistory");
  const h   = getUrlHistory();

  if (!h.length) {
    box.innerHTML = `<div class="empty">No URLs saved yet.</div>`;
    return;
  }

  box.innerHTML = h.map(url => `
    <div class="url-item" data-url="${url.replace(/"/g, '&quot;')}">
      <span class="url-text">${url}</span>
      <span class="url-use">Use ↗</span>
    </div>`).join("");

  box.querySelectorAll(".url-item").forEach(item => {
    item.addEventListener("click", () => {
      document.getElementById("epVideo").value = item.dataset.url;
      toast("URL pasted into field.");
    });
  });
}

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  localStorage.removeItem(URL_HISTORY_KEY);
  renderUrlHistory();
  toast("URL history cleared.");
});

/* ═══════════════════════════════════════════
   STATS
═══════════════════════════════════════════ */
async function loadStats() {
  const snap = await getDocs(collection(db, "videos"));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slugSet  = new Set();
  let totalEps   = 0;
  let addedToday = 0;

  snap.forEach(d => {
    const data = d.data();
    totalEps++;
    slugSet.add(data.animeSlug || data.anime || "");
    const ts = data.createdAt;
    const created = ts ? new Date(typeof ts === "number" ? ts : ts.seconds * 1000) : null;
    if (created && created >= today) addedToday++;
  });

  // Stats on the top cards
  document.getElementById("statTotalAnime").textContent = SITE_CATALOG.length;
  document.getElementById("statTotalEps").textContent   = totalEps;
  document.getElementById("statRecent").textContent     = addedToday;

  // Sidebar
  document.getElementById("sidebarTotalAnime").textContent = SITE_CATALOG.length;
  document.getElementById("sidebarTotalEps").textContent   = totalEps;
}

/* ═══════════════════════════════════════════
   RECENT UPLOADS
═══════════════════════════════════════════ */
async function loadRecentUploads() {
  const tbody = document.getElementById("recentUploads");
  tbody.innerHTML = `<tr><td colspan="5" class="empty">Loading…</td></tr>`;

  const snap = await getDocs(collection(db, "videos"));
  const all  = [];
  snap.forEach(d => all.push({ ...d.data(), _docId: d.id }));

  all.sort((a, b) => {
    const ta = a.createdAt || 0;
    const tb = b.createdAt || 0;
    const na = typeof ta === "number" ? ta : (ta.seconds || 0) * 1000;
    const nb = typeof tb === "number" ? tb : (tb.seconds || 0) * 1000;
    return nb - na;
  });

  const recent = all.slice(0, 20);

  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No episodes uploaded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(ep => {
    const animeEntry = SITE_CATALOG.find(a => a.slug === (ep.animeSlug || ep.anime));
    const displayName = ep.animeName || (animeEntry ? animeEntry.title : (ep.animeSlug || ep.anime || "—"));
    return `
      <tr class="recent-row" data-slug="${ep.animeSlug || ep.anime}" data-ep="${ep.episode}">
        <td style="font-weight:600">${displayName}</td>
        <td style="color:#ec4899;font-weight:700">Ep ${ep.episode}</td>
        <td style="color:#94a3b8">${ep.title || '—'}</td>
        <td style="color:#64748b;font-size:12px">${formatDate(ep.createdAt)}</td>
        <td><span class="${ep.video ? 'link-ok' : 'link-miss'}">${ep.video ? '✔ OK' : '✘ Missing'}</span></td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll(".recent-row").forEach(row => {
    row.addEventListener("click", () => {
      const slug = row.dataset.slug;
      const epNum = parseInt(row.dataset.ep);
      const animeEntry = SITE_CATALOG.find(a => a.slug === slug);
      if (animeEntry) {
        selectAnime(animeEntry);
        // Wait for episodes to load then open editor
        setTimeout(() => loadEpIntoEditor(epNum), 800);
      }
    });
  });
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
loadStats();
loadRecentUploads();
renderUrlHistory();
