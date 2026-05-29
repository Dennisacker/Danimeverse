/* =========================
   JIKAN API — with localStorage cache (30-min TTL)
========================= */

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const STREAMTAPE_EMBED = "https://streamtape.com/e/GAgGMmwRlXi1k3D/";

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

/* =========================
   TOP ANIME
========================= */

async function loadTopAnime() {
  const container = document.getElementById("animeContainer");
  if (!container) return;

  const cached = getCached("jikan_top_anime");
  if (cached) { renderTopAnime(cached, container); return; }

  try {
    const response = await fetch("https://api.jikan.moe/v4/top/anime");
    if (!response.ok) throw new Error("Jikan API error: " + response.status);
    const data = await response.json();
    setCache("jikan_top_anime", data);
    renderTopAnime(data, container);
  } catch (error) {
    console.log("Top Anime API Error:", error);
  }
}

function renderTopAnime(data, container) {
  data.data.slice(0, 12).forEach(anime => {
    container.innerHTML += `
    <article class="glass-card group relative overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-glow">
      <img
        src="${anime.images.jpg.large_image_url}"
        alt="${anime.title}"
        class="w-full h-[320px] object-cover rounded-2xl"
        loading="lazy"
      />
      <div class="space-y-3 mt-4">
        <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
          ${anime.genres.slice(0,3).map(g => g.name).join(", ")}
        </span>
        <h3 class="text-xl font-semibold text-white">${anime.title}</h3>
        <p class="text-xs md:text-sm leading-6 text-slate-300">
          ${anime.synopsis ? anime.synopsis.substring(0, 120) + "..." : "No description available."}
        </p>
        <div class="flex flex-wrap gap-3 pt-3">
          <a href="watch.html?anime=${encodeURIComponent(anime.title)}&ep=1&title=${encodeURIComponent(anime.title + ' Episode 1')}&desc=${encodeURIComponent(anime.synopsis ? anime.synopsis.substring(0,120) : '')}&video=${encodeURIComponent(STREAMTAPE_EMBED)}" class="bg-pink-700 border border-black text-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition">▶ Watch</a>
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
    const response = await fetch("https://api.jikan.moe/v4/seasons/now");
    if (!response.ok) throw new Error("Jikan seasons error: " + response.status);
    const data = await response.json();
    setCache("jikan_seasons_now", data);
    renderTopPicks(data, container);
  } catch (error) {
    console.log("Top Picks API Error:", error);
  }
}

function renderTopPicks(data, container) {
  const blocked = ["re:zero", "dr. stone", "witch hat atelier"];

  function cleanTitle(title) {
    const t = (title || "").toLowerCase();
    if (t.includes("classroom of the elite")) return "Classroom of the Elite Season 4";
    if (t.includes("frieren")) return "Frieren";
    if (t.includes("shingeki no kyojin")) return "Attack on Titan";
    if (t.includes("re:zero")) return "Re:Zero";
    if (t.includes("dr. stone")) return "Dr Stone";
    return title;
  }

  const filteredAnime = data.data
    .filter(anime => {
      const title = (anime.title + " " + (anime.title_english || "")).toLowerCase();
      return !blocked.some(b => title.includes(b));
    })
    .slice(0, 6);

  filteredAnime.forEach(anime => {
    container.innerHTML += `
      <article class="glass-card overflow-hidden rounded-[2rem] p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">
        <img
          src="${anime.images.jpg.large_image_url}"
          alt="${anime.title}"
          class="mb-4 h-48 md:h-64 w-full rounded-[1.5rem] object-cover"
          loading="lazy"
        />
        <div class="bg-gray-900 rounded-xl shadow-lg p-3 md:p-4 text-white">
          <h3 class="text-xl md:text-2xl font-bold mb-2">
            ${cleanTitle(anime.title_english || anime.title)}
          </h3>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <span class="bg-pink-600 text-white text-sm font-bold px-3 py-1 rounded-full">${anime.score || "N/A"}/10</span>
            <span class="bg-purple-700 text-white text-xs px-3 py-1 rounded-full">${anime.status}</span>
            <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">${anime.genres?.slice(0,2).map(g => g.name).join(", ") || "Unknown"}</span>
          </div>
          <div class="flex space-x-4">
            <a href="watch.html?anime=${encodeURIComponent(anime.title_english || anime.title)}&ep=1&title=${encodeURIComponent((anime.title_english || anime.title) + ' Episode 1')}&desc=${encodeURIComponent(anime.synopsis ? anime.synopsis.substring(0,120) : '')}&video=${encodeURIComponent(STREAMTAPE_EMBED)}" class="bg-pink-700 border border-black text-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition">▶ Watch</a>
          </div>
        </div>
      </article>`;
  });
}

loadTopAnime();
loadTopPicks();
