/* =========================
   SEARCH — Jikan API (any anime) + Site Catalogue highlight
========================= */

/* Site catalogue — used to badge "On Site" but all links go to anime.html?malId=X */
const SITE_CATALOG_TITLES = new Set([
  "naruto", "attack on titan", "shingeki no kyojin",
  "demon slayer", "kimetsu no yaiba",
  "jujutsu kaisen", "chainsaw man", "fire force",
  "enen no shouboutai", "dr. stone", "re:zero",
  "mushoku tensei", "my hero academia", "boku no hero academia",
  "assassination classroom", "ansatsu kyoushitsu",
  "fate/strange fake", "frieren", "sousou no frieren",
  "hell's paradise", "jigokuraku", "oshi no ko",
  "solo leveling", "ore dake level up na ken",
  "tokyo revengers", "witch hat atelier",
  "tongari booshi no atelier",
]);

function isOnSite(title) {
  const t = (title || "").toLowerCase().trim();
  if (SITE_CATALOG_TITLES.has(t)) return true;
  for (const k of SITE_CATALOG_TITLES) {
    if (t.includes(k) || k.includes(t)) return true;
  }
  return false;
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput   = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  if (!searchInput || !searchResults) return;

  let debounceTimer;

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (!query) {
      searchResults.classList.add("hidden");
      searchResults.innerHTML = "";
      return;
    }

    // Show loading state immediately
    searchResults.innerHTML = `
      <p style="font-size:12px;color:#94a3b8;padding:12px 14px;text-align:center">Searching…</p>`;
    searchResults.classList.remove("hidden");

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw=false`
        );
        if (!res.ok) { searchResults.classList.add("hidden"); return; }
        const data = await res.json();
        const items = data.data || [];

        if (!items.length) {
          searchResults.innerHTML = `
            <p style="font-size:13px;color:#64748b;padding:12px 14px;text-align:center">No results found.</p>`;
          return;
        }

        let html = `<p style="font-size:10px;font-weight:700;letter-spacing:.08em;color:#ec4899;padding:8px 12px 2px;text-transform:uppercase;">Search Results</p>`;

        items.forEach(a => {
          const title   = a.title_english || a.title;
          const year    = a.aired?.prop?.from?.year || a.year || "";
          const type    = a.type || "Anime";
          const onSite  = isOnSite(title) || isOnSite(a.title);
          const href    = `anime.html?malId=${a.mal_id}`;
          const img     = a.images?.jpg?.image_url || "";

          html += `
            <a href="${href}"
               class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition">
              <img src="${img}" class="w-12 h-16 object-cover rounded-lg flex-shrink-0" loading="lazy"
                   onerror="this.style.display='none'"/>
              <div class="min-w-0">
                <h4 class="text-sm font-semibold text-white truncate">${title}</h4>
                <p class="text-xs text-slate-400">${type}${year ? " · " + year : ""}</p>
                ${onSite
                  ? `<span style="font-size:10px;background:#ec4899;color:white;padding:1px 7px;border-radius:999px;">▶ On Site</span>`
                  : `<span style="font-size:10px;background:rgba(255,255,255,.1);color:#94a3b8;padding:1px 7px;border-radius:999px;">▶ View</span>`
                }
              </div>
            </a>`;
        });

        searchResults.innerHTML = html;
        searchResults.classList.remove("hidden");

      } catch (_) {
        searchResults.classList.add("hidden");
      }
    }, 400);
  });

  // Close on outside click
  document.addEventListener("click", e => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.add("hidden");
    }
  });
});
