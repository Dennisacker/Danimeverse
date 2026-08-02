
console.log("🔥 SEARCH.JS LOADED");

/* =========================================================
   DANIMEVERSE SEARCH — AniList GraphQL API

   Search flow:

   User searches
        ↓
   AniList GraphQL
        ↓
   Multiple anime results
        ↓
   Get MAL ID
        ↓
   anime.html?malId=123

   IMPORTANT:
   Your existing anime.html system uses MAL IDs.
   Therefore, we always pass AniList's idMal.
========================================================= */

const ANILIST_API =
  "https://graphql.anilist.co";


/* =========================================================
   SITE CATALOGUE

   Used only to show the "On Site" badge.

   This does NOT control whether an anime can
   be opened. It only controls the badge.
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

    if (
      t.includes(k) ||
      k.includes(t)
    ) {

      return true;

    }

  }


  return false;

}


/* =========================================================
   ANILIST SEARCH QUERY

   We request multiple results.

   idMal is extremely important because your
   anime.html page currently uses:

   anime.html?malId=123
========================================================= */

const ANILIST_SEARCH_QUERY = `

  query ($search: String!) {

    Page(
      page: 1
      perPage: 8
    ) {

      media(
        search: $search
        type: ANIME
        isAdult: false
        sort: SEARCH_MATCH
      ) {

        id

        idMal

        title {

          romaji

          english

          native

        }

        type

        format

        startDate {

          year

        }

        episodes

        coverImage {

          medium

          large

        }

      }

    }

  }

`;


/* =========================================================
   SEARCH ANIME USING ANILIST
========================================================= */

async function searchAnime(
  query
) {

  console.log(
    "🔎 Searching AniList:",
    query
  );


  /* =======================================================
     SEND GRAPHQL REQUEST
  ======================================================= */

  const response =
    await fetch(
      ANILIST_API,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            query:
              ANILIST_SEARCH_QUERY,

            variables: {

              search:
                query

            }

          })

      }
    );


  /* =======================================================
     CHECK HTTP STATUS
  ======================================================= */

  if (
    !response.ok
  ) {

    throw new Error(
      `AniList HTTP ${response.status}`
    );

  }


  /* =======================================================
     PARSE JSON
  ======================================================= */

  const result =
    await response.json();


  console.log(
    "📡 AniList response:",
    result
  );


  /* =======================================================
     CHECK GRAPHQL ERRORS
  ======================================================= */

  if (
    result.errors &&
    result.errors.length
  ) {

    throw new Error(
      result.errors[0]?.message ||
      "AniList search failed."
    );

  }


  /* =======================================================
     GET RESULTS
  ======================================================= */

  const results =
    result?.data?.Page?.media ||
    [];


  console.log(
    "✅ AniList results:",
    results.length
  );


  return results;

}


/* =========================================================
   ESCAPE HTML

   Prevents anime titles/images from breaking
   the search results HTML.
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value || ""
  )

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

}


/* =========================================================
   ESCAPE URL ATTRIBUTE
========================================================= */

function escapeAttribute(
  value
) {

  return String(
    value || ""
  )

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
       GET SEARCH ELEMENTS
    ===================================================== */

    const searchInput =
      document.getElementById(
        "searchInput"
      );


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
           CANCEL PREVIOUS DEBOUNCE
        ================================================= */

        clearTimeout(
          debounceTimer
        );


        /* =================================================
           GET SEARCH QUERY
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
           DEBOUNCE SEARCH

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
                  "🔎 Searching AniList:",
                  query
                );


                /* =========================================
                   SEARCH ANILIST
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
                   FILTER RESULTS

                   Your anime.html currently needs
                   a MAL ID.

                   Therefore, remove AniList results
                   that don't have an idMal.
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
                       FORMAT
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
                       CHECK IF AVAILABLE ON SITE
                    ===================================== */

                    const onSite =
                      isOnSite(title) ||
                      isOnSite(romajiTitle) ||
                      isOnSite(nativeTitle);


                    /* =====================================
                       CREATE ANIME PAGE LINK

                       Example:

                       anime.html?malId=20

                       Naruto:
                       anime.html?malId=20
                    ===================================== */

                    const href =
                      `anime.html?malId=${encodeURIComponent(
                        malId
                      )}`;


                    /* =====================================
                       BUILD RESULT CARD
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
                  "❌ AniList search error:",
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
          )

          &&

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



