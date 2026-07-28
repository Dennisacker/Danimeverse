/* ================================================================
   admin.js — Danimeverse Admin Dashboard
   Jikan API → search anime → browse Jikan episodes →
   paste Febbox URL → save to Firestore
================================================================ */
import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, getDocs,
  collection, orderBy, query, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const JIKAN = "https://api.jikan.moe/v4";

/* ── STATE ── */
let selectedAnime    = null;   // { malId, title, image, type, year, totalEps }
let jikanEpPage      = 1;      // current Jikan episode page (100 per page)
let jikanEpLastPage  = 1;
let uploadedEpNums   = new Set(); // episode numbers already in Firestore
let formEp           = null;   // episode number currently loaded in form

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ""; }, 3000);
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function formatDate(ts) {
  if (!ts) return "—";
  const n = typeof ts === "number" ? ts : (ts.seconds ? ts.seconds * 1000 : ts);
  return new Date(n).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function jikanFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1200 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 600));
    }
  }
}

/* ═══════════════════════════════════════════════════════
   ANIME SEARCH (Jikan)
═══════════════════════════════════════════════════════ */
const searchInput   = document.getElementById("animeSearch");
const searchResults = document.getElementById("searchResults");

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (q.length < 2) { searchResults.style.display = "none"; return; }
  searchTimer = setTimeout(() => runSearch(q), 500);
});

async function runSearch(q) {
  searchResults.innerHTML = `<div style="padding:14px;text-align:center;color:#94a3b8;font-size:13px">Searching…</div>`;
  searchResults.style.display = "block";
  try {
    const data = await jikanFetch(`${JIKAN}/anime?q=${encodeURIComponent(q)}&limit=10&sfw=false`);
    const items = data.data || [];
    if (!items.length) {
      searchResults.innerHTML = `<div style="padding:14px;text-align:center;color:#64748b;font-size:13px">No results found.</div>`;
      return;
    }
    searchResults.innerHTML = items.map(a => {
      const title = a.title_english || a.title;
      const year  = a.aired?.prop?.from?.year || a.year || "?";
      const eps   = a.episodes ? `${a.episodes} eps` : "? eps";
      const img   = a.images?.jpg?.image_url || "";
      return `
        <div class="search-result-item" data-mal="${a.mal_id}">
          <img src="${img}" alt="${title}" loading="lazy"/>
          <div class="info">
            <h4>${title}</h4>
            <p>${a.type || "Anime"} · ${year} · ${eps}</p>
          </div>
        </div>`;
    }).join("");

    searchResults.querySelectorAll(".search-result-item").forEach(el => {
      el.addEventListener("click", () => {
        const item = items.find(a => String(a.mal_id) === el.dataset.mal);
        if (item) selectAnime(item);
      });
    });
  } catch (err) {
    searchResults.innerHTML = `<div style="padding:14px;color:#f87171;font-size:13px">Search failed: ${err.message}</div>`;
  }
}

document.addEventListener("click", e => {
  if (!searchResults.contains(e.target) && e.target !== searchInput)
    searchResults.style.display = "none";
});

/* ═══════════════════════════════════════════════════════
   SELECT ANIME
═══════════════════════════════════════════════════════ */
async function selectAnime(a) {
  const title = a.title_english || a.title;
  const image = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";
  const year  = a.aired?.prop?.from?.year || a.year || "";

  selectedAnime = {
    malId:     a.mal_id,
    title,
    image,
    type:      a.type || "TV",
    year,
    totalEps:  a.episodes || null
  };
  jikanEpPage     = 1;
  jikanEpLastPage = 1;
  formEp          = null;

  // Update search UI
  searchInput.value = title;
  searchResults.style.display = "none";

  // Show selected card
  const card = document.getElementById("selectedAnimeCard");
  card.style.display = "flex";
  document.getElementById("selectedPoster").src   = image;
  document.getElementById("selectedTitle").textContent   = title;
  document.getElementById("selectedMeta").textContent    =
    [a.type, year, a.episodes ? `${a.episodes} episodes` : null].filter(Boolean).join(" · ");
  document.getElementById("selectedSlug").textContent    = `MAL ID: ${a.mal_id}`;

  // Clear form
  clearForm();

  // Load in parallel: Jikan episodes + Firestore uploaded episodes
  document.getElementById("jikanEpSection").style.display = "block";
  await Promise.all([ loadJikanEpisodes(), loadUploadedEpisodes() ]);
}

/* ═══════════════════════════════════════════════════════
   JIKAN EPISODES (with pagination)
═══════════════════════════════════════════════════════ */
async function loadJikanEpisodes() {
  if (!selectedAnime) return;

  const listEl   = document.getElementById("jikanEpList");
  const prevBtn  = document.getElementById("prevEpPage");
  const nextBtn  = document.getElementById("nextEpPage");
  const pageInfo = document.getElementById("epPageInfo");

  listEl.innerHTML = `<div class="empty">Loading episodes from Jikan…</div>`;
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  try {
    const data = await jikanFetch(
      `${JIKAN}/anime/${selectedAnime.malId}/episodes?page=${jikanEpPage}`
    );

    const eps      = data.data || [];
    const pagination = data.pagination || {};
    jikanEpLastPage = pagination.last_visible_page || 1;
    const totalEps  = pagination.items?.total || eps.length;

    pageInfo.textContent = `Page ${jikanEpPage} of ${jikanEpLastPage}  (${totalEps} episodes)`;

    prevBtn.disabled = jikanEpPage <= 1;
    nextBtn.disabled = jikanEpPage >= jikanEpLastPage;

    if (!eps.length) {
      listEl.innerHTML = `<div class="empty">No episode data from Jikan.</div>`;
      return;
    }

    listEl.innerHTML = eps.map(ep => {
      const num       = ep.mal_id; // episode number (not MAL ID — Jikan's ep.mal_id IS the number for this endpoint)
      // Actually Jikan /anime/{id}/episodes returns: { mal_id: <ep_number>, ... }
      const epNum     = ep.mal_id;  // Jikan uses mal_id as episode number here
      const epTitle   = ep.title || `Episode ${epNum}`;
      const uploaded  = uploadedEpNums.has(epNum);
      return `
        <div class="jikan-ep-item ${uploaded ? "uploaded" : ""}" data-epnum="${epNum}" data-eptitle="${epTitle.replace(/"/g,'&quot;')}">
          <span class="jep-num">Ep ${epNum}</span>
          <span class="jep-title">${epTitle}</span>
          ${uploaded ? '<span class="jep-status">✔ Uploaded</span>' : '<span class="jep-status empty-status">+ Add</span>'}
        </div>`;
    }).join("");

    listEl.querySelectorAll(".jikan-ep-item").forEach(el => {
      el.addEventListener("click", () => {
        const epNum   = parseInt(el.dataset.epnum);
        const epTitle = el.getAttribute("data-eptitle");
        loadEpisodeIntoForm(epNum, epTitle);
        // highlight
        listEl.querySelectorAll(".jikan-ep-item").forEach(x => x.classList.remove("active"));
        el.classList.add("active");
      });
    });

  } catch (err) {
    listEl.innerHTML = `<div class="empty" style="color:#f87171">Failed to load episodes: ${err.message}</div>`;
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }
}

document.getElementById("prevEpPage").addEventListener("click", () => {
  if (jikanEpPage > 1) { jikanEpPage--; loadJikanEpisodes(); }
});
document.getElementById("nextEpPage").addEventListener("click", () => {
  if (jikanEpPage < jikanEpLastPage) { jikanEpPage++; loadJikanEpisodes(); }
});

/* ═══════════════════════════════════════════════════════
   LOAD ALREADY-UPLOADED EPISODES FROM FIRESTORE
═══════════════════════════════════════════════════════ */
async function loadUploadedEpisodes() {
  if (!selectedAnime) return;

  const box = document.getElementById("uploadedEpList");
  box.innerHTML = `<div class="empty">Loading…</div>`;

  try {
    const snap = await getDocs(
      collection(db, "animes", String(selectedAnime.malId), "episodes")
    );
    uploadedEpNums.clear();
    const all = [];
    snap.forEach(d => { const data = d.data(); uploadedEpNums.add(data.episode); all.push(data); });
    all.sort((a, b) => a.episode - b.episode);

    document.getElementById("uploadedCount").textContent =
      all.length ? `${all.length} uploaded` : "None yet";

    if (!all.length) {
      box.innerHTML = `<div class="empty">No episodes uploaded yet.</div>`;
    } else {
      box.innerHTML = all.map(ep => `
        <div class="ep-item" data-ep="${ep.episode}">
          <span class="ep-num">Ep ${ep.episode}</span>
          <span class="ep-title">${ep.title || "Episode " + ep.episode}</span>
          <span class="ep-date">${formatDate(ep.createdAt)}</span>
          <span class="ep-link ${ep.febboxUrl ? '' : 'missing'}">${ep.febboxUrl ? '✔' : '✘'}</span>
        </div>`).join("");

      box.querySelectorAll(".ep-item").forEach(el => {
        el.addEventListener("click", () => {
          const epNum = parseInt(el.dataset.ep);
          const epData = all.find(e => e.episode === epNum);
          if (epData) {
            loadEpisodeIntoForm(epNum, epData.title || "");
            document.getElementById("epVideo").value = epData.febboxUrl || epData.video || "";
          }
        });
      });
    }
  } catch (err) {
    box.innerHTML = `<div class="empty" style="color:#f87171">Error: ${err.message}</div>`;
  }
}

/* ═══════════════════════════════════════════════════════
   LOAD EPISODE INTO FORM
═══════════════════════════════════════════════════════ */
function loadEpisodeIntoForm(epNum, epTitle) {
  formEp = epNum;
  document.getElementById("epNumber").value = epNum;
  document.getElementById("epTitle").value  = epTitle || "";
  // Keep existing Febbox URL if already uploaded and user didn't change it
  const alreadyUploaded = uploadedEpNums.has(epNum);
  if (!alreadyUploaded) {
    // Clear video field for a fresh upload
    if (!document.getElementById("epVideo").value.trim()) {
      document.getElementById("epVideo").value = "";
    }
  }
  document.getElementById("epVideo").focus();
}

/* ═══════════════════════════════════════════════════════
   UPLOAD EPISODE
═══════════════════════════════════════════════════════ */
document.getElementById("uploadBtn").addEventListener("click", async () => {
  if (!selectedAnime) { toast("Select an anime first.", "error"); return; }

  const epNum  = parseInt(document.getElementById("epNumber").value);
  const title  = document.getElementById("epTitle").value.trim();
  const febbox = document.getElementById("epVideo").value.trim();

  if (!epNum || epNum < 1) { toast("Enter a valid episode number.", "error"); return; }
  if (!febbox)             { toast("Paste the Febbox URL.", "error"); return; }

  const malIdStr = String(selectedAnime.malId);
  const now = Date.now();

  // 1. Upsert anime document (metadata cache)
  await setDoc(doc(db, "animes", malIdStr), {
    malId:    selectedAnime.malId,
    title:    selectedAnime.title,
    image:    selectedAnime.image,
    type:     selectedAnime.type,
    year:     selectedAnime.year || null,
    updatedAt: now
  }, { merge: true });

  // 2. Save episode to subcollection
  const isNew = !uploadedEpNums.has(epNum);
  await setDoc(
    doc(db, "animes", malIdStr, "episodes", String(epNum)),
    {
      episode:   epNum,
      title:     title || `Episode ${epNum}`,
      febboxUrl: febbox,
      createdAt: isNew ? now : undefined,
      updatedAt: now
    },
    { merge: true }
  );

  // 3. Write/update freshEpisodes entry for homepage
  await setDoc(doc(db, "freshEpisodes", `${malIdStr}_${epNum}`), {
    malId:       selectedAnime.malId,
    episode:     epNum,
    title:       title || `Episode ${epNum}`,
    animeName:   selectedAnime.title,
    animeImage:  selectedAnime.image,
    febboxUrl:   febbox,
    createdAt:   isNew ? now : (await getDoc(doc(db, "freshEpisodes", `${malIdStr}_${epNum}`))).data()?.createdAt || now,
    updatedAt:   now
  });

  // 4. Save URL to history
  saveUrlHistory(febbox);

  toast(`✅ Episode ${epNum} of "${selectedAnime.title}" ${isNew ? "uploaded" : "updated"}!`);

  // Show success banner
  const banner = document.getElementById("successBanner");
  banner.style.display = "flex";
  setTimeout(() => { banner.style.display = "none"; }, 3000);

  // Clear video + title (bump episode for next upload)
  document.getElementById("epTitle").value = "";
  document.getElementById("epVideo").value = "";
  formEp = null;

  // Refresh
  await loadUploadedEpisodes();
  // Re-render Jikan list to update ✔ badges
  await loadJikanEpisodes();
  loadStats();
  loadRecentUploads();
});

/* ═══════════════════════════════════════════════════════
   CLEAR BUTTON
═══════════════════════════════════════════════════════ */
document.getElementById("clearBtn").addEventListener("click", () => {
  clearForm();
  document.querySelectorAll(".jikan-ep-item").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".ep-item").forEach(el => el.classList.remove("active"));
});
function clearForm() {
  formEp = null;
  document.getElementById("epNumber").value = "";
  document.getElementById("epTitle").value  = "";
  document.getElementById("epVideo").value  = "";
}

/* ═══════════════════════════════════════════════════════
   URL HISTORY (localStorage)
═══════════════════════════════════════════════════════ */
const URL_HISTORY_KEY = "danimeverse_url_history";

function getUrlHistory() {
  try { return JSON.parse(localStorage.getItem(URL_HISTORY_KEY) || "[]"); }
  catch (_) { return []; }
}
function saveUrlHistory(url) {
  if (!url) return;
  let h = getUrlHistory().filter(u => u !== url);
  h.unshift(url);
  h = h.slice(0, 10);
  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(h));
  renderUrlHistory();
}
function renderUrlHistory() {
  const box = document.getElementById("urlHistory");
  const h   = getUrlHistory();
  if (!h.length) { box.innerHTML = `<div class="empty">No URLs saved yet.</div>`; return; }
  box.innerHTML = h.map(url => `
    <div class="url-item" data-url="${url.replace(/"/g,"&quot;")}">
      <span class="url-text">${url}</span>
      <span class="url-use">Use ↗</span>
    </div>`).join("");
  box.querySelectorAll(".url-item").forEach(el => {
    el.addEventListener("click", () => {
      document.getElementById("epVideo").value = el.dataset.url;
      toast("URL pasted into field.");
    });
  });
}
document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  localStorage.removeItem(URL_HISTORY_KEY);
  renderUrlHistory();
  toast("URL history cleared.");
});

/* ═══════════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════════ */
async function loadStats() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const snap  = await getDocs(collection(db, "freshEpisodes"));
    let total = 0, addedToday = 0;
    const animeSet = new Set();
    snap.forEach(d => {
      const data = d.data();
      total++;
      animeSet.add(data.malId);
      const ts = data.createdAt;
      if (ts && new Date(ts) >= today) addedToday++;
    });
    document.getElementById("statTotalAnime").textContent  = animeSet.size;
    document.getElementById("statTotalEps").textContent    = total;
    document.getElementById("statRecent").textContent      = addedToday;
    document.getElementById("sidebarTotalAnime").textContent = animeSet.size;
    document.getElementById("sidebarTotalEps").textContent   = total;
  } catch (_) {}
}

/* ═══════════════════════════════════════════════════════
   RECENT UPLOADS
═══════════════════════════════════════════════════════ */
async function loadRecentUploads() {
  const tbody = document.getElementById("recentUploads");
  tbody.innerHTML = `<tr><td colspan="5" class="empty">Loading…</td></tr>`;
  try {
    const q    = query(collection(db, "freshEpisodes"), orderBy("createdAt", "desc"), limit(20));
    const snap = await getDocs(q);
    const all  = [];
    snap.forEach(d => all.push({ ...d.data(), _id: d.id }));

    if (!all.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">No episodes uploaded yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = all.map(ep => `
      <tr class="recent-row" data-malid="${ep.malId}" data-ep="${ep.episode}" style="cursor:pointer">
        <td style="font-weight:600">${ep.animeName || "—"}</td>
        <td style="color:#ec4899;font-weight:700">Ep ${ep.episode}</td>
        <td style="color:#94a3b8">${ep.title || "—"}</td>
        <td style="color:#64748b;font-size:12px">${formatDate(ep.createdAt)}</td>
        <td><span class="${ep.febboxUrl ? "link-ok" : "link-miss"}">${ep.febboxUrl ? "✔ OK" : "✘ Missing"}</span></td>
      </tr>`).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty" style="color:#f87171">Error: ${err.message}</td></tr>`;
  }
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
loadStats();
loadRecentUploads();
renderUrlHistory();
