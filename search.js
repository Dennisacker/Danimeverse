console.log("🔥 SEARCH.JS LOADED");

/* =========================================================
DANIMEVERSE SEARCH

Browser
↓
/api/anime?search=naruto
↓
Vercel API Gateway
↓
Kitsu → AniList → Jikan

IMPORTANT:
AniList is NOT called directly from this file.
========================================================= */

/* =========================================================
SITE CATALOGUE
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
CHECK IF ANIME IS ON SITE
========================================================= */

function isOnSite(title) {

const t =
(title || "")
.toLowerCase()
.trim();

if (!t) {
return false;
}

/* Exact match */

if (
SITE_CATALOG_TITLES.has(t)
) {
return true;
}

/* Partial / alternate title match */

for (
const k of SITE_CATALOG_TITLES
) {

```
if (
  t.includes(k) ||
  k.includes(t)
) {
  return true;
}
```

}

return false;

}

/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHtml(value) {

return String(
value || ""
)

```
.replace(
  /&/g,
  "&amp;"
)

.replace(
  /</g,
  "&lt;"
)

.replace(
  />/g,
  "&gt;"
)

.replace(
  /"/g,
  "&quot;"
)

.replace(
  /'/g,
  "&#039;"
);
```

}

/* =========================================================
ESCAPE URL ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

return String(
value || ""
)

```
.replace(
  /&/g,
  "&amp;"
)

.replace(
  /"/g,
  "&quot;"
)

.replace(
  /</g,
  "&lt;"
)

.replace(
  />/g,
  "&gt;"
);
```

}

/* =========================================================
SEARCH ANIME

This function ONLY calls your own API Gateway.

It does NOT call AniList directly.

Your API Gateway handles:

Kitsu
↓
AniList
↓
Jikan
========================================================= */

async function searchAnime(query) {

console.log(
"🔎 Searching Danimeverse API Gateway:",
query
);

/* =======================================================
CALL YOUR API GATEWAY
======================================================= */

const response =
await fetch(
`/api/anime?search=${encodeURIComponent(query)}`
);

/* =======================================================
CHECK HTTP RESPONSE
======================================================= */

if (
!response.ok
) {


throw new Error(
  `API Gateway HTTP ${response.status}`
);


}

/* =======================================================
PARSE RESPONSE
======================================================= */

const result =
await response.json();

console.log(
"📡 Search API response:",
result
);

/* =======================================================
CHECK API SUCCESS
======================================================= */

if (
!result.success ||
!result.data
) {

```
throw new Error(
  result.error ||
  "Anime search failed"
);
```

}

/* =======================================================
GET API DATA
======================================================= */

const anime =
result.data;

/* =======================================================
NORMALIZE RESULT

```
 Your API returns something like:

 {
   success: true,
   provider: "kitsu",
   data: {
     id,
     anilistId,
     malId,
     title,
     nativeTitle,
     poster,
     banner,
     description,
     rating,
     status,
     year,
     episodes,
     type,
     format,
     source,
     genres
   }
 }

 We convert it to the structure
 your existing renderer expects.
```

======================================================= */

const normalizedAnime = {


id:
  anime.anilistId ||
  anime.id ||
  null,


idMal:
  anime.malId ||
  null,


title: {

  english:
    anime.title ||
    "",

  romaji:
    anime.title ||
    "",

  native:
    anime.nativeTitle ||
    ""

},


type:
  anime.type ||
  "ANIME",


format:
  anime.format ||
  anime.type ||
  "TV",


startDate: {

  year:
    anime.year ||
    null

},


episodes:
  anime.episodes ||
  null,


coverImage: {

  medium:
    anime.poster ||
    "",

  large:
    anime.poster ||
    ""

}


};

console.log(
"✅ Normalized search result:",
normalizedAnime
);

/* =======================================================
RETURN ARRAY

```
 Your existing renderer uses forEach(),
 so return the single API result
 inside an array.
```

======================================================= */

return [
normalizedAnime
];

}

/* =========================================================
START SEARCH
========================================================= */

document.addEventListener(
"DOMContentLoaded",
() => {


console.log(
  "🔎 Initializing Danimeverse search..."
);


/* =====================================================
   GET SEARCH INPUT
===================================================== */

const searchInput =
  document.getElementById(
    "searchInput"
  );


/* =====================================================
   GET SEARCH RESULTS CONTAINER
===================================================== */

const searchResults =
  document.getElementById(
    "searchResults"
  );


/* =====================================================
   CHECK SEARCH ELEMENTS
===================================================== */

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


/* =====================================================
   SEARCH STATE
===================================================== */

let debounceTimer;

let searchRequestId = 0;


/* =====================================================
   SEARCH INPUT
===================================================== */

searchInput.addEventListener(
  "input",
  () => {

    /* =================================================
       CANCEL PREVIOUS TIMER
    ================================================= */

    clearTimeout(
      debounceTimer
    );


    /* =================================================
       GET QUERY
    ================================================= */

    const query =
      searchInput.value.trim();


    /* =================================================
       EMPTY SEARCH
    ================================================= */

    if (
      !query
    ) {

      searchResults.classList.add(
        "hidden"
      );

      searchResults.innerHTML =
        "";

      return;

    }


    /* =================================================
       SHOW LOADING
    ================================================= */

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


    searchResults.classList.remove(
      "hidden"
    );


    /* =================================================
       DEBOUNCE

       Wait 400ms after typing stops.
    ================================================= */

    debounceTimer =
      setTimeout(
        async () => {

          /* =========================================
             CREATE REQUEST ID
          ========================================= */

          const requestId =
            ++searchRequestId;


          try {

            console.log(
              "🔎 Searching through API Gateway:",
              query
            );


            /* =========================================
               SEARCH API
            ========================================= */

            const items =
              await searchAnime(
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


            /* =========================================
               FILTER RESULTS WITHOUT MAL ID
            ========================================= */

            const validItems =
              items.filter(
                anime =>
                  anime &&
                  anime.idMal
              );


            /* =========================================
               NO RESULTS
            ========================================= */

            if (
              !validItems.length
            ) {

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


            /* =========================================
               RESULTS HEADER
            ========================================= */

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


            /* =========================================
               BUILD RESULTS
            ========================================= */

            validItems.forEach(
              anime => {

                /* =====================================
                   TITLE
                ===================================== */

                const title =
                  anime.title?.english ||
                  anime.title?.romaji ||
                  anime.title?.native ||
                  "Unknown Anime";


                /* =====================================
                   ROMAJI TITLE
                ===================================== */

                const romajiTitle =
                  anime.title?.romaji ||
                  "";


                /* =====================================
                   NATIVE TITLE
                ===================================== */

                const nativeTitle =
                  anime.title?.native ||
                  "";


                /* =====================================
                   YEAR
                ===================================== */

                const year =
                  anime.startDate?.year ||
                  "";


                /* =====================================
                   TYPE
                ===================================== */

                const type =
                  anime.format ||
                  anime.type ||
                  "Anime";


                /* =====================================
                   IMAGE
                ===================================== */

                const image =
                  anime.coverImage?.medium ||
                  anime.coverImage?.large ||
                  "";


                /* =====================================
                   MAL ID
                ===================================== */

                const malId =
                  anime.idMal;


                /* =====================================
                   ON SITE
                ===================================== */

                const onSite =
                  isOnSite(title) ||
                  isOnSite(romajiTitle) ||
                  isOnSite(nativeTitle);


                /* =====================================
                   ANIME PAGE LINK
                ===================================== */

                const href =
                  `anime.html?malId=${encodeURIComponent(
                    malId
                  )}`;


                /* =====================================
                   BUILD CARD
                ===================================== */

                html += `

                  <a
                    href="${escapeAttribute(
                      href
                    )}"
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
                            src="${escapeAttribute(
                              image
                            )}"
                            alt="${escapeHtml(
                              title
                            )}"
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


                    <div
                      class="min-w-0"
                    >

                      <h4
                        class="
                          text-sm
                          font-semibold
                          text-white
                          truncate
                        "
                      >
                        ${escapeHtml(
                          title
                        )}
                      </h4>


                      <p
                        class="
                          text-xs
                          text-slate-400
                        "
                      >
                        ${escapeHtml(
                          type
                        )}

                        ${
                          year
                            ? ` · ${year}`
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


            /* =========================================
               DISPLAY RESULTS
            ========================================= */

            searchResults.innerHTML =
              html;


            searchResults.classList.remove(
              "hidden"
            );


            console.log(
              "✅ Search results displayed"
            );


          } catch (
            error
          ) {

            console.error(
              "❌ Search error:",
              error
            );


            /* =========================================
               IGNORE OLD REQUEST ERRORS
            ========================================= */

            if (
              requestId !==
              searchRequestId
            ) {

              return;

            }


            /* =========================================
               SHOW ERROR
            ========================================= */

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


}
);
