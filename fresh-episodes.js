/* ================================================================
   fresh-episodes.js
   Reads the top-level `freshEpisodes` collection and renders
   a dynamic "Fresh Drops / Latest Episodes" section on the
   homepage.  Must be loaded as type="module".
================================================================ */
import { db } from "./firebase-config.js";
import {
  collection, getDocs, orderBy, query, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CACHE_KEY = "danimeverse_fresh_eps";
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch (_) { return null; }
}
function setCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function renderFreshEpisodes(episodes, container) {
  if (!episodes.length) {
    container.innerHTML = `
      <p class="text-slate-500 text-sm text-center py-8">
        No episodes uploaded yet. Check back soon!
      </p>`;
    return;
  }

  container.innerHTML = episodes.map(ep => `
    <article class="glass-card flex flex-col gap-4 rounded-[2rem] p-3 md:p-4 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div class="flex items-start gap-4">
        <img
          src="${ep.animeImage || ''}"
          alt="${ep.animeName || ''}"
          class="h-20 w-20 md:h-28 md:w-28 rounded-3xl object-cover flex-shrink-0"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/112x112?text=No+Image'"
        />
        <div class="flex-1 min-w-0">
          <p class="text-xs uppercase tracking-[0.3em] text-pink-400 font-semibold truncate">${ep.animeName || "Unknown Anime"}</p>
          <p class="text-xs text-slate-400 mt-0.5">Episode ${ep.episode}</p>
          <h3 class="mt-1 text-base md:text-lg font-semibold text-white leading-tight line-clamp-2">${ep.title || "Episode " + ep.episode}</h3>
          <p class="mt-1 text-xs text-slate-500">${timeAgo(ep.createdAt)}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-3">
        <a href="watch.html?malId=${ep.malId}&ep=${ep.episode}"
           class="bg-pink-700 text-white px-4 py-2 rounded-full hover:bg-pink-500 transition text-sm font-semibold">
          ▶ Watch
        </a>
        <a href="anime.html?malId=${ep.malId}"
           class="bg-transparent border border-white/20 text-white px-4 py-2 rounded-full hover:bg-white/10 transition text-sm">
          All Episodes
        </a>
      </div>
    </article>
  `).join("");
}

async function loadFreshEpisodes() {
  const container = document.getElementById("freshEpisodesContainer");
  if (!container) return;

  // Show loading skeletons
  container.innerHTML = Array(4).fill(`
    <article class="glass-card rounded-[2rem] p-4 animate-pulse">
      <div class="flex gap-4">
        <div class="h-28 w-28 rounded-3xl bg-white/10 flex-shrink-0"></div>
        <div class="flex-1 space-y-3 pt-2">
          <div class="h-3 bg-white/10 rounded w-2/3"></div>
          <div class="h-5 bg-white/10 rounded w-full"></div>
          <div class="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    </article>`).join("");

  // Try cache first
  const cached = getCached();
  if (cached) { renderFreshEpisodes(cached, container); return; }

  try {
    const q    = query(collection(db, "freshEpisodes"), orderBy("createdAt", "desc"), limit(8));
    const snap = await getDocs(q);
    const eps  = [];
    snap.forEach(d => eps.push(d.data()));
    setCache(eps);
    renderFreshEpisodes(eps, container);
  } catch (err) {
    console.error("Fresh episodes error:", err);
    container.innerHTML = `
      <p class="text-slate-500 text-sm text-center py-8 col-span-2">
        Could not load latest episodes right now.
      </p>`;
  }
}

loadFreshEpisodes();
