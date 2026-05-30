/* =========================
   JIKAN API — localStorage cache (30-min TTL)
========================= */

const CACHE_TTL = 30 * 60 * 1000;
const VIDEO_EMBED = "https://player.mediadelivery.net/embed/673018/35592cb4-0c78-4267-bab2-45d9723b8955";

/* Site catalogue — maps Jikan titles to existing anime pages */
const SITE_PAGES = {
  "naruto":                  "naruto.html",
  "attack on titan":         "aot.html",
  "shingeki no kyojin":      "aot.html",
  "demon slayer":            "demon-slayer.html",
  "kimetsu no yaiba":        "demon-slayer.html",
  "jujutsu kaisen":          "jujutsu-kaisen.html",
  "chainsaw man":            "chainsaw-man.html",
  "fire force":              "fire-force.html",
  "enen no shouboutai":      "fire-force.html",
  "dr. stone":               "dr-stone.html",
  "re:zero":                 "rezero.html",
  "mushoku tensei":          "mushoku-tensei.html",
  "my hero academia":        "my-hero-academia.html",
  "boku no hero academia":   "my-hero-academia.html",
  "assassination classroom": "assassination-classroom.html",
  "ansatsu kyoushitsu":      "assassination-classroom.html",
  "fate/strange fake":       "fate-strange-fake.html",
  "frieren":                 "frieren.html",
  "sousou no frieren":       "frieren.html",
  "hell's paradise":         "hells-paradise.html",
  "jigokuraku":              "hells-paradise.html",
  "oshi no ko":              "oshi-no-ko.html",
  "solo leveling":           "solo-leveling.html",
  "tokyo revengers":         "tokyo-revengers.html",
  "witch hat atelier":       "witch-hat-atelier.html",
  "tongari booshi no atelier":"witch-hat-atelier.html",
};

function getSitePage(animeTitle) {
  const key = (animeTitle || "").toLowerCase().trim();
  if (SITE_PAGES[key]) return SITE_PAGES[key];
  for (const k in SITE_PAGES) {
    if (key.includes(k) || k.includes(key)) return SITE_PAGES[k];
  }
  return null;
}

function getWatchLink(anime) {
  const title = anime.title_english || anime.title;
  const sitePage = getSitePage(title) || getSitePage(anime.title);
  if (sitePage) return sitePage;
  const desc  = anime.synopsis ? anime.synopsis.substring(0, 120) : "";
  return `watch.html?anime=${encodeURIComponent(title)}&ep=1&title=${encodeURIComponent(title + " Episode 1")}&desc=${encodeURIComponent(desc)}&video=${encodeURIComponent(VIDEO_EMBED)}`;
}

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
    const link  = getWatchLink(anime);
    const label = getSitePage(anime.title_english || anime.title) || getSitePage(anime.title)
      ? "▶ Episodes"
      : "▶ Watch";
    container.innerHTML += `
    <article class="glass-card group relative overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-glow">
      <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}"
           class="w-full h-[320px] object-cover rounded-2xl" loading="lazy" />
      <div class="space-y-3 mt-4">
        <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
          ${anime.genres.slice(0,3).map(g => g.name).join(", ")}
        </span>
        <h3 class="text-xl font-semibold text-white">${anime.title}</h3>
        <p class="text-xs md:text-sm leading-6 text-slate-300">
          ${anime.synopsis ? anime.synopsis.substring(0, 120) + "..." : "No description available."}
        </p>
        <div class="flex flex-wrap gap-3 pt-3">
          <a href="${link}"
             class="bg-pink-700 text-white px-4 py-2 rounded-full hover:bg-pink-500 transition text-sm font-semibold">
            ${label}
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
  const blocked = ["re:zero", "dr. stone", "witch hat atelier"];
  function cleanTitle(t) {
    const l = (t || "").toLowerCase();
    if (l.includes("classroom of the elite")) return "Classroom of the Elite";
    if (l.includes("frieren"))     return "Frieren";
    if (l.includes("shingeki"))    return "Attack on Titan";
    if (l.includes("re:zero"))     return "Re:Zero";
    if (l.includes("dr. stone"))   return "Dr. Stone";
    return t;
  }

  const filtered = data.data
    .filter(a => {
      const t = (a.title + " " + (a.title_english || "")).toLowerCase();
      return !blocked.some(b => t.includes(b));
    })
    .slice(0, 6);

  filtered.forEach(anime => {
    const title = cleanTitle(anime.title_english || anime.title);
    const link  = getWatchLink({ ...anime, title_english: title });
    const label = getSitePage(title) || getSitePage(anime.title) ? "▶ Episodes" : "▶ Watch";

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
            ${label}
          </a>
        </div>
      </article>`;
  });
}

loadTopAnime();
loadTopPicks();
