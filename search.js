```javascript
console.log("🔎 DANIMEVERSE SEARCH.JS LOADED");


/* =========================================================
   DANIMEVERSE SEARCH SYSTEM

   Uses:
   /api/anime?search=QUERY

   API Gateway:
   Kitsu → AniList → Jikan

   Returns multiple AniList search results.
========================================================= */


/* =========================================================
   SITE CATALOG
========================================================= */

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


/* =========================================================
   CHECK IF ANIME IS ON DANIMEVERSE
========================================================= */

function isOnSite(title) {

  const t =
    String(title || "")
      .toLowerCase()
      .trim();

  if (!t) {
    return false;
  }

  if (SITE_CATALOG_TITLES.has(t)) {
    return true;
  }

  for (const item of SITE_CATALOG_TITLES) {

    if (
      t.includes(item) ||
      item.includes(t)
    ) {
      return true;
    }

  }

  return false;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

}


/* =========================================================
   SEARCH ANIME THROUGH API GATEWAY
========================================================= */

async function searchAnime(query) {

  console.log(
    "🔎 Searching Danimeverse API Gateway:",
    query
  );


  const response = await fetch(
    `/api/anime?search=${encodeURIComponent(query)}`
  );


  if (!response.ok) {

    throw new Error(
      `API Gateway HTTP ${response.status}`
    );

  }


  const result =
    await response.json();


  console.log(
    "📡 Search API response:",
    result
  );


  if (
    !result.success ||
    !result.data
  ) {

    throw new Error(
      result.error ||
      "Anime search failed"
    );

  }


  return result.data;

}


/* =========================================================
   GET SEARCH RESULTS

   Your current API returns ONE anime result.
   This function converts it into an array.

   If your API gateway is later changed to return
   multiple results, it will also support that.
========================================================= */

async function getSearchResults(query) {

  const data =
    await searchAnime(query);


  /* =======================================================
     IF API RETURNS AN ARRAY
  ======================================================= */

  if (Array.isArray(data)) {

    return data;

  }


  /* =======================================================
     IF API RETURNS A SINGLE ANIME
  ======================================================= */

  if (data) {

    return [data];

  }


  return [];

}


/* =========================================================
   CREATE SEARCH RESULT HTML
========================================================= */

function createSearchResult(anime) {

  const title =
    anime.title ||
    anime.title_english ||
    anime.title_romaji ||
    "Unknown Anime";


  const nativeTitle =
    anime.nativeTitle ||
    "";


  const image =
    anime.poster ||
    anime.coverImage ||
    anime.image ||
    "";


  const year =
    anime.year ||
    "";


  const type =
    anime.format ||
    anime.type ||
    "Anime";


  const malId =
    anime.malId ||
    anime.idMal ||
    "";


  const anilistId =
    anime.anilistId ||
    anime.id ||
    "";


  const onSite =
    isOnSite(title) ||
    isOnSite(nativeTitle);


  /* =======================================================
     ANIME PAGE URL

     Your existing anime.html uses MAL ID.
  ======================================================= */

  let href = "#";


  if (malId) {

    href =
      `anime.html?malId=${encodeURIComponent(malId)}`;

  }


  /* =======================================================
     RESULT HTML
  ======================================================= */

  return `

    <a
      href="${escapeAttribute(href)}"
      class="
        search-anime-result
        flex
        items-center
        gap-3
        p-3
        rounded-xl
        hover:bg-white/10
        transition
        cursor-pointer
      "
      data-mal-id="${escapeAttribute(malId)}"
      data-anilist-id="${escapeAttribute(anilistId)}"
    >

      ${
        image

          ? `

            <img
              src="${escapeAttribute(image)}"
              alt="${escapeAttribute(title)}"
              class="
                w-12
                h-16
                object-cover
                rounded-lg
                flex-shrink-0
                bg-white/5
              "
              loading="lazy"
              onerror="this.style.display='none'"
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


      <div
        class="
          min-w-0
          flex-1
        "
      >

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


        ${
          nativeTitle

            ? `

              <p
                class="
                  text-[11px]
                  text-slate-500
                  truncate
                  mt-0.5
                "
              >
                ${escapeHtml(nativeTitle)}
              </p>

            `

            : ""
        }


        <p
          class="
            text-xs
            text-slate-400
            mt-1
          "
        >
          ${escapeHtml(type)}

          ${
            year
              ? ` · ${escapeHtml(year)}`
              : ""
          }

        </p>


        <div
          class="
            mt-1
          "
        >

          ${
            onSite

              ? `

                <span
                  class="
                    inline-block
                    text-[10px]
                    bg-pink-600
                    text-white
                    px-2
                    py-0.5
                    rounded-full
                  "
                >
                  ▶ On Site
                </span>

              `

              : `

                <span
                  class="
                    inline-block
                    text-[10px]
                    bg-white/10
                    text-slate-400
                    px-2
                    py-0.5
                    rounded-full
                  "
                >
                  ▶ View
                </span>

              `
          }

        </div>

      </div>

    </a>

  `;

}


/* =========================================================
   INITIALIZE SEARCH
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "🔎 Initializing Danimeverse search..."
    );


    const searchInput =
      document.getElementById(
        "searchInput"
      );


    const searchResults =
      document.getElementById(
        "searchResults"
      );


    if (
      !searchInput ||
      !searchResults
    ) {

      console.warn(
        "⚠️ Search elements not found."
      );

      return;

    }


    console.log(
      "✅ Search elements found."
    );


    let debounceTimer =
      null;


    let searchRequestId =
      0;


    /* =====================================================
       SEARCH INPUT
    ===================================================== */

    searchInput.addEventListener(
      "input",
      () => {

        clearTimeout(
          debounceTimer
        );


        const query =
          searchInput.value
            .trim();


        /* =================================================
           EMPTY SEARCH
        ================================================= */

        if (!query) {

          searchResults.innerHTML =
            "";

          searchResults.classList.add(
            "hidden"
          );

          return;

        }


        /* =================================================
           MINIMUM SEARCH LENGTH
        ================================================= */

        if (query.length < 2) {

          searchResults.innerHTML = `

            <p
              class="
                text-xs
                text-slate-400
                text-center
                p-4
              "
            >
              Type at least 2 characters...
            </p>

          `;

          searchResults.classList.remove(
            "hidden"
          );

          return;

        }


        /* =================================================
           SHOW LOADING
        ================================================= */

        searchResults.innerHTML = `

          <p
            class="
              text-xs
              text-slate-400
              text-center
              p-4
            "
          >
            🔎 Searching for
            <span class="text-pink-400">
              ${escapeHtml(query)}
            </span>
            ...
          </p>

        `;


        searchResults.classList.remove(
          "hidden"
        );


        /* =================================================
           DEBOUNCE
        ================================================= */

        debounceTimer =
          setTimeout(
            async () => {

              const requestId =
                ++searchRequestId;


              try {

                console.log(
                  "🔎 Running search:",
                  query
                );


                const items =
                  await getSearchResults(
                    query
                  );


                /* =========================================
                   IGNORE OLD REQUEST
                ========================================= */

                if (
                  requestId !==
                  searchRequestId
                ) {

                  return;

                }


                console.log(
                  "✅ Search results:",
                  items
                );


                /* =========================================
                   FILTER RESULTS

                   Keep results with either MAL ID
                   or AniList ID.
                ========================================= */

                const validItems =
                  items.filter(
                    anime => {

                      return (
                        anime &&
                        (
                          anime.malId ||
                          anime.idMal ||
                          anime.anilistId ||
                          anime.id
                        )
                      );

                    }
                  );


                /* =========================================
                   NO RESULTS
                ========================================= */

                if (
                  !validItems.length
                ) {

                  searchResults.innerHTML = `

                    <p
                      class="
                        text-sm
                        text-slate-400
                        text-center
                        p-5
                      "
                    >
                      No anime found for
                      "<span class="text-white">
                        ${escapeHtml(query)}
                      </span>"
                    </p>

                  `;

                  return;

                }


                /* =========================================
                   BUILD RESULTS
                ========================================= */

                let html = `

                  <div
                    class="
                      px-3
                      pt-3
                      pb-1
                    "
                  >

                    <p
                      class="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-widest
                        text-pink-500
                      "
                    >
                      Search Results
                    </p>

                  </div>

                `;


                validItems.forEach(
                  anime => {

                    html +=
                      createSearchResult(
                        anime
                      );

                  }
                );


                /* =========================================
                   SHOW RESULTS
                ========================================= */

                searchResults.innerHTML =
                  html;


                searchResults.classList.remove(
                  "hidden"
                );


                console.log(
                  "✅ Search results displayed:",
                  validItems.length
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
                    class="
                      text-xs
                      text-red-400
                      text-center
                      p-4
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


    /* =====================================================
       CLOSE SEARCH WHEN CLICKING OUTSIDE
    ===================================================== */

    document.addEventListener(
      "click",
      event => {

        if (
          !searchResults.contains(
            event.target
          ) &&
          event.target !==
            searchInput
        ) {

          searchResults.classList.add(
            "hidden"
          );

        }

      }
    );


    /* =====================================================
       KEEP SEARCH OPEN WHEN CLICKING INPUT
    ===================================================== */

    searchInput.addEventListener(
      "focus",
      () => {

        if (
          searchInput.value.trim()
        ) {

          searchResults.classList.remove(
            "hidden"
          );

        }

      }
    );


  }
);
```
