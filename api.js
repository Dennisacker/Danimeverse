/* =====================================================
   DANIMEVERSE — Jikan API loader
   All sections use clear-then-render to prevent
   duplicate cards if the script runs more than once.
   localStorage cache (30-min TTL) reduces API calls.
===================================================== */

const CACHE_TTL = 30 * 60 * 1000;
const FALLBACK_IMG = "https://via.placeholder.com/400x600?text=No+Image";

/* ── cache helpers ── */
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

/* ── shared helpers ── */
function animeLink(anime) {
  return `anime.html?malId=${anime.mal_id}`;
}
function safeImg(anime) {
  return anime?.images?.jpg?.large_image_url || FALLBACK_IMG;
}
function safeTitle(anime) {
  return anime.title_english || anime.title || "Unknown Title";
}
function safeGenres(anime, max) {
  return anime.genres?.slice(0, max).map(g => g.name).join(", ") || "—";
}
function safeSynopsis(anime, len) {
  return anime.synopsis ? anime.synopsis.substring(0, len) + "…" : "No description available.";
}
function showError(container, msg) {
  container.innerHTML = `<p class="col-span-full text-center text-slate-400 py-10">${msg}</p>`;
}

/* =====================================================
   1. FAN FAVORITES — /v4/top/anime
      Container: #animeContainer
===================================================== */
async function loadTopAnime() {
  const container = document.getElementById("animeContainer");
  if (!container) return;

  const cached = getCached("jikan_top_anime");
  if (cached) { renderTopAnime(cached, container); return; }

  try {
    const res = await fetch("https://api.jikan.moe/v4/top/anime");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setCache("jikan_top_anime", data);
    renderTopAnime(data, container);
  } catch (e) {
    console.error("Top Anime API Error:", e);
    showError(container, "⚠️ Could not load popular anime. Please try again later.");
  }
}

function renderTopAnime(data, container) {
  const items = (data.data || []).slice(0, 12);
  if (!items.length) { showError(container, "No anime found."); return; }

  container.innerHTML = items.map(anime => `
    <a href="${animeLink(anime)}" class="block">
      <article class="glass-card group relative overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-glow">
        <img src="${safeImg(anime)}"
             alt="${safeTitle(anime)}"
             class="w-full h-[320px] object-cover rounded-2xl"
             loading="eager" />
        <div class="space-y-3 mt-4">
          <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
            ${safeGenres(anime, 3) || "Anime"}
          </span>
          <h3 class="text-xl font-semibold text-white">${safeTitle(anime)}</h3>
          <p class="text-xs md:text-sm leading-6 text-slate-300">
            ${safeSynopsis(anime, 120)}
          </p>
          <div class="flex flex-wrap gap-3 pt-3">
            <span class="bg-pink-700 text-white px-4 py-2 rounded-full text-sm font-semibold">
              ${anime.score ? `⭐ ${anime.score}` : "Unrated"}
            </span>
            <span class="bg-white/10 text-white px-4 py-2 rounded-full text-sm">
              ▶ Episodes
            </span>
          </div>
        </div>
      </article>
    </a>`).join("");
}

/* =====================================================
   2. TOP PICKS RIGHT NOW — /v4/seasons/now
      Container: #topPicksAPI
===================================================== */
async function loadTopPicks() {
  const container = document.getElementById("topPicksAPI");
  if (!container) return;

  const cached = getCached("jikan_seasons_now");
  if (cached) { renderTopPicks(cached, container); return; }

  try {
    const res = await fetch("https://api.jikan.moe/v4/seasons/now");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setCache("jikan_seasons_now", data);
    renderTopPicks(data, container);
  } catch (e) {
    console.error("Top Picks API Error:", e);
    showError(container, "⚠️ Could not load top picks. Please try again later.");
  }
}

function renderTopPicks(data, container) {
  const items = (data.data || []).slice(0, 6);
  if (!items.length) { showError(container, "No top picks found."); return; }

  container.innerHTML = items.map(anime => `
    <a href="${animeLink(anime)}" class="block no-underline">
      <article class="glass-card overflow-hidden rounded-[2rem] p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">
        <img src="${safeImg(anime)}"
             alt="${safeTitle(anime)}"
             class="mb-4 h-48 md:h-64 w-full rounded-[1.5rem] object-cover"
             loading="eager" />
        <div class="bg-gray-900 rounded-xl shadow-lg p-3 md:p-4 text-white">
          <h3 class="text-xl md:text-2xl font-bold mb-2">${safeTitle(anime)}</h3>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <span class="bg-pink-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              ${anime.score ? `${anime.score}/10` : "N/A"}
            </span>
            <span class="bg-purple-700 text-white text-xs px-3 py-1 rounded-full">
              ${anime.status || "Airing"}
            </span>
            <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
              ${safeGenres(anime, 2)}
            </span>
          </div>
          <span class="inline-block bg-pink-700 text-white px-5 py-2 rounded-full text-sm font-semibold">
            ▶ Episodes
          </span>
        </div>
      </article>
    </a>`).join("");
}

/* =====================================================
   3. TRENDING ANIME'S — /v4/top/anime?filter=airing
      Container: #trendingAnimeContainer
===================================================== */
async function loadTrendingAnime() {
  const container = document.getElementById("trendingAnimeContainer");
  if (!container) return;

  const cached = getCached("jikan_trending_airing");
  if (cached) { renderTrendingAnime(cached, container); return; }

  try {
    const res = await fetch("https://api.jikan.moe/v4/top/anime?filter=airing");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setCache("jikan_trending_airing", data);
    renderTrendingAnime(data, container);
  } catch (e) {
    console.error("Trending Anime API Error:", e);
    showError(container, "⚠️ Could not load trending anime. Please try again later.");
  }
}

function renderTrendingAnime(data, container) {
  const items = (data.data || []).slice(0, 6);
  if (!items.length) { showError(container, "No trending anime found."); return; }

  container.innerHTML = items.map(anime => `
    <a href="${animeLink(anime)}" class="block no-underline">
      <article class="glass-card overflow-hidden rounded-[2rem] p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">
        <img src="${safeImg(anime)}"
             alt="${safeTitle(anime)}"
             class="mb-4 h-48 md:h-64 w-full rounded-[1.5rem] object-cover"
             loading="eager" />
        <div class="bg-gray-900 rounded-xl shadow-lg p-3 md:p-4 text-white">
          <h3 class="text-xl md:text-2xl font-bold mb-2">${safeTitle(anime)}</h3>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <span class="bg-pink-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              ${anime.score ? `${anime.score}/10` : "N/A"}
            </span>
            <span class="bg-green-700 text-white text-xs px-3 py-1 rounded-full">
              🔴 Airing
            </span>
            <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
              ${safeGenres(anime, 2)}
            </span>
          </div>
          <span class="inline-block bg-pink-700 text-white px-5 py-2 rounded-full text-sm font-semibold">
            ▶ Episodes
          </span>
        </div>
      </article>
    </a>`).join("");
}

/* =====================================================
   4. LATEST EPISODES — reuses /v4/seasons/now data
      (shares cache key with loadTopPicks to avoid a
       second identical request and prevent 429 errors)
      Container: #latestEpisodesContainer
===================================================== */
async function loadLatestEpisodes() {
  const container = document.getElementById("latestEpisodesContainer");
  if (!container) return;

  /* reuse the seasons/now cache that loadTopPicks already populated */
  let data = getCached("jikan_seasons_now");
  if (!data) {
    try {
      const res = await fetch("https://api.jikan.moe/v4/seasons/now");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      setCache("jikan_seasons_now", data);
    } catch (e) {
      console.error("Latest Episodes API Error:", e);
      showError(container, "⚠️ Could not load latest episodes. Please try again later.");
      return;
    }
  }
  renderLatestEpisodes(data, container);
}

function renderLatestEpisodes(data, container) {
  const items = (data.data || []).slice(0, 8);
  if (!items.length) { showError(container, "No episodes found."); return; }

  container.innerHTML = items.map(anime => `
    <a href="${animeLink(anime)}" class="block no-underline">
      <article class="glass-card overflow-hidden rounded-[2rem] p-4 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">
        <div class="flex gap-4">
          <img src="${safeImg(anime)}"
               alt="${safeTitle(anime)}"
               class="w-28 h-28 rounded-[1.5rem] object-cover flex-shrink-0"
               loading="eager" />
          <div class="flex flex-col justify-center gap-2 min-w-0">
            <span class="text-xs text-pink-400 font-semibold uppercase tracking-wide">
              ${safeGenres(anime, 2)}
            </span>
            <h3 class="text-base md:text-lg font-bold text-white leading-snug truncate">
              ${safeTitle(anime)}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span class="bg-purple-700 text-white text-xs px-2 py-0.5 rounded-full">
                ${anime.episodes ? `${anime.episodes} eps` : "Ongoing"}
              </span>
              <span class="bg-white/10 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                ${anime.status || "Airing"}
              </span>
              ${anime.score ? `<span class="bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full">⭐ ${anime.score}</span>` : ""}
            </div>
          </div>
        </div>
      </article>
    </a>`).join("");
}

/* ── kick everything off with stagger to respect Jikan's 3 req/sec limit ── */
(async () => {
  loadTopAnime();
  await new Promise(r => setTimeout(r, 400));
  loadTopPicks();
  await new Promise(r => setTimeout(r, 400));
  loadTrendingAnime();
  /* loadLatestEpisodes reuses the seasons/now cache from loadTopPicks,
     so wait until that cache is likely populated */
  await new Promise(r => setTimeout(r, 800));
  loadLatestEpisodes();
})();
