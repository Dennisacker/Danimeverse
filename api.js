/* =========================
   JIKAN API — localStorage cache (30-min TTL)
========================= */

const CACHE_TTL = 30 * 60 * 1000;

/* ─── cache helpers ─── */
function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch (_) { return null; }
}
function setCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
}

/* All anime cards now link to anime.html?malId=X */
function getAnimeLink(anime) {
  return `anime.html?malId=${anime.mal_id}`;
}

/* =========================
   TOP ANIME
========================= */
async function loadTopAnime() {
  const container = document.getElementById("animeContainer");
  if (!container) return;
  const cached = getCached("jikan_top_anime");
  if (cached) { renderTopAnime(cached, container); return; }
  try {
    const res = await fetch("https://api.jikan.moe/v4/top/anime");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    setCache("jikan_top_anime", data);
    renderTopAnime(data, container);
  } catch (e) { console.log("Top Anime API Error:", e); }
}

function renderTopAnime(data, container) {
  data.data.slice(0, 12).forEach(anime => {
    const link  = getAnimeLink(anime);
    const title = anime.title_english || anime.title;
    container.innerHTML += `
    <article class="glass-card group relative overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-glow">
      <img src="${anime.images.jpg.large_image_url}" alt="${title}"
           class="w-full h-[320px] object-cover rounded-2xl" loading="lazy" />
      <div class="space-y-3 mt-4">
        <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
          ${anime.genres.slice(0,3).map(g => g.name).join(", ")}
        </span>
        <h3 class="text-xl font-semibold text-white">${title}</h3>
        <p class="text-xs md:text-sm leading-6 text-slate-300">
          ${anime.synopsis ? anime.synopsis.substring(0, 120) + "..." : "No description available."}
        </p>
        <div class="flex flex-wrap gap-3 pt-3">
          <a href="${link}"
             class="bg-pink-700 text-white px-4 py-2 rounded-full hover:bg-pink-500 transition text-sm font-semibold">
            ▶ Episodes
          </a>
        </div>
      </div>
    </article>`;
  });
}

/* =========================
   TOP PICKS (seasonal)
========================= */
async function loadTopPicks() {
  const container = document.getElementById("topPicksAPI");
  if (!container) return;
  const cached = getCached("jikan_seasons_now");
  if (cached) { renderTopPicks(cached, container); return; }
  try {
    const res = await fetch("https://api.jikan.moe/v4/seasons/now");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    setCache("jikan_seasons_now", data);
    renderTopPicks(data, container);
  } catch (e) { console.log("Top Picks API Error:", e); }
}

function renderTopPicks(data, container) {
  const items = data.data.slice(0, 6);
  items.forEach(anime => {
    const title = anime.title_english || anime.title;
    const link  = getAnimeLink(anime);
    container.innerHTML += `
      <article class="glass-card overflow-hidden rounded-[2rem] p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">
        <img src="${anime.images.jpg.large_image_url}" alt="${title}"
             class="mb-4 h-48 md:h-64 w-full rounded-[1.5rem] object-cover" loading="lazy" />
        <div class="bg-gray-900 rounded-xl shadow-lg p-3 md:p-4 text-white">
          <h3 class="text-xl md:text-2xl font-bold mb-2">${title}</h3>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <span class="bg-pink-600 text-white text-sm font-bold px-3 py-1 rounded-full">${anime.score || "N/A"}/10</span>
            <span class="bg-purple-700 text-white text-xs px-3 py-1 rounded-full">${anime.status}</span>
            <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">${anime.genres?.slice(0,2).map(g => g.name).join(", ") || "Unknown"}</span>
          </div>
          <a href="${link}"
             class="inline-block bg-pink-700 text-white px-5 py-2 rounded-full hover:bg-pink-500 transition text-sm font-semibold">
            ▶ Episodes
          </a>
        </div>
      </article>`;
  });
}

loadTopAnime();
loadTopPicks();
