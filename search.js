console.log("🔥 SEARCH.JS LOADED");

const SITE_CATALOG_TITLES = new Set([
"naruto",
"attack on titan",
"shingeki no kyojin",
"demon slayer",
"kimetsu no yaiba",
"jujutsu kaisen",
"chainsaw man",
"fire force",
"enen no shouboutai",
"dr. stone",
"re:zero",
"mushoku tensei",
"my hero academia",
"boku no hero academia",
"assassination classroom",
"ansatsu kyoushitsu",
"fate/strange fake",
"frieren",
"sousou no frieren",
"hell's paradise",
"jigokuraku",
"oshi no ko",
"solo leveling",
"ore dake level up na ken",
"tokyo revengers",
"witch hat atelier",
"tongari booshi no atelier"
]);

function isOnSite(title) {
const t = String(title || "").toLowerCase().trim();

if (!t) {
return false;
}

if (SITE_CATALOG_TITLES.has(t)) {
return true;
}

for (const k of SITE_CATALOG_TITLES) {
if (t.includes(k) || k.includes(t)) {
return true;
}
}

return false;
}

function escapeHtml(value) {
return String(value || "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function escapeAttribute(value) {
return String(value || "")
.replace(/&/g, "&")
.replace(/"/g, """)
.replace(/</g, "<")
.replace(/>/g, ">");
}

async function searchAnime(query) {
console.log("🔎 Searching Danimeverse API Gateway:", query);

const response = await fetch(
`/api/anime?search=${encodeURIComponent(query)}`
);

if (!response.ok) {
throw new Error(`API Gateway HTTP ${response.status}`);
}

const result = await response.json();

console.log("📡 Search API response:", result);

if (!result.success || !result.data) {
throw new Error(
result.error || "Anime search failed"
);
}

const anime = result.data;

const normalizedAnime = {
id: anime.anilistId || anime.id || null,

```
idMal: anime.malId || null,

title: {
  english: anime.title || "",
  romaji: anime.title || "",
  native: anime.nativeTitle || ""
},

type: anime.type || "ANIME",

format: anime.format || anime.type || "TV",

startDate: {
  year: anime.year || null
},

episodes: anime.episodes || null,

coverImage: {
  medium: anime.poster || "",
  large: anime.poster || ""
}


};

console.log(
"✅ Normalized search result:",
normalizedAnime
);

return [normalizedAnime];
}

document.addEventListener(
"DOMContentLoaded",
() => {
console.log(
"🔎 Initializing Danimeverse search..."
);


const searchInput =
  document.getElementById("searchInput");

const searchResults =
  document.getElementById("searchResults");

if (!searchInput || !searchResults) {
  console.warn(
    "⚠️ Search elements not found."
  );
  return;
}

console.log(
  "✅ Search elements found."
);

let debounceTimer = null;
let searchRequestId = 0;

searchInput.addEventListener(
  "input",
  () => {
    clearTimeout(debounceTimer);

    const query =
      searchInput.value.trim();

    if (!query) {
      searchResults.classList.add("hidden");
      searchResults.innerHTML = "";
      return;
    }

    searchResults.innerHTML = `
      <p
        style="
          font-size:12px;
          color:#94a3b8;
          padding:12px 14px;
          text-align:center;
        "
      >
        Searching...
      </p>
    `;

    searchResults.classList.remove("hidden");

    debounceTimer = setTimeout(
      async () => {
        const requestId =
          ++searchRequestId;

        try {
          console.log(
            "🔎 Searching through API Gateway:",
            query
          );

          const items =
            await searchAnime(query);

          if (
            requestId !==
            searchRequestId
          ) {
            return;
          }

          const validItems =
            items.filter(
              anime =>
                anime &&
                anime.idMal
            );

          if (!validItems.length) {
            searchResults.innerHTML = `
              <p
                style="
                  font-size:13px;
                  color:#94a3b8;
                  padding:12px 14px;
                  text-align:center;
                "
              >
                No results found.
              </p>
            `;

            return;
          }

          let html = `
            <p
              style="
                font-size:10px;
                font-weight:700;
                letter-spacing:.08em;
                color:#ec4899;
                padding:8px 12px 2px;
                text-transform:uppercase;
              "
            >
              Search Results
            </p>
          `;

          validItems.forEach(
            anime => {
              const title =
                anime.title?.english ||
                anime.title?.romaji ||
                anime.title?.native ||
                "Unknown Anime";

              const romajiTitle =
                anime.title?.romaji ||
                "";

              const nativeTitle =
                anime.title?.native ||
                "";

              const year =
                anime.startDate?.year ||
                "";

              const type =
                anime.format ||
                anime.type ||
                "Anime";

              const image =
                anime.coverImage?.medium ||
                anime.coverImage?.large ||
                "";

              const malId =
                anime.idMal;

              const onSite =
                isOnSite(title) ||
                isOnSite(romajiTitle) ||
                isOnSite(nativeTitle);

              const href =
                `anime.html?malId=${encodeURIComponent(
                  malId
                )}`;

              html += `
                <a
                  href="${escapeAttribute(href)}"
                  class="
                    flex
                    items-center
                    gap-3
                    p-3
                    rounded-xl
                    hover:bg-white/10
                    transition
                  "
                >
                  ${
                    image
                      ? `
                        <img
                          src="${escapeAttribute(image)}"
                          alt="${escapeHtml(title)}"
                          class="
                            w-12
                            h-16
                            object-cover
                            rounded-lg
                            flex-shrink-0
                          "
                          loading="lazy"
                          onerror="
                            this.style.display='none'
                          "
                        >
                      `
                      : `
                        <div
                          class="
                            w-12
                            h-16
                            rounded-lg
                            flex-shrink-0
                            bg-white/5
                            flex
                            items-center
                            justify-center
                            text-xs
                            text-slate-500
                          "
                        >
                          N/A
                        </div>
                      `
                  }

                  <div class="min-w-0">
                    <h4
                      class="
                        text-sm
                        font-semibold
                        text-white
                        truncate
                      "
                    >
                      ${escapeHtml(title)}
                    </h4>

                    <p
                      class="
                        text-xs
                        text-slate-400
                      "
                    >
                      ${escapeHtml(type)}
                      ${
                        year
                          ? ` · ${escapeHtml(year)}`
                          : ""
                      }
                    </p>

                    ${
                      onSite
                        ? `
                          <span
                            style="
                              font-size:10px;
                              background:#ec4899;
                              color:white;
                              padding:1px 7px;
                              border-radius:999px;
                            "
                          >
                            ▶ On Site
                          </span>
                        `
                        : `
                          <span
                            style="
                              font-size:10px;
                              background:rgba(255,255,255,.1);
                              color:#94a3b8;
                              padding:1px 7px;
                              border-radius:999px;
                            "
                          >
                            ▶ View
                          </span>
                        `
                    }
                  </div>
                </a>
              `;
            }
          );

          searchResults.innerHTML = html;

          searchResults.classList.remove(
            "hidden"
          );

          console.log(
            "✅ Search results displayed"
          );
        } catch (error) {
          console.error(
            "❌ Search error:",
            error
          );

          if (
            requestId !==
            searchRequestId
          ) {
            return;
          }

          searchResults.innerHTML = `
            <p
              style="
                font-size:12px;
                color:#f87171;
                padding:12px 14px;
                text-align:center;
              "
            >
              Search is temporarily unavailable.
            </p>
          `;
        }
      },
      400
    );
  }
);

document.addEventListener(
  "click",
  event => {
    if (
      !searchResults.contains(
        event.target
      ) &&
      event.target !== searchInput
    ) {
      searchResults.classList.add(
        "hidden"
      );
    }
  }
);


}
);
