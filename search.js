
console.log("SEARCH.JS LOADED");


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
   SEARCH ANIME
========================================================= */

async function searchAnime(query) {

  console.log(
    "SEARCHING:",
    query
  );


  const url =
    "/api/anime?search=" +
    encodeURIComponent(query);


  const response =
    await fetch(url);


  console.log(
    "API STATUS:",
    response.status
  );


  if (!response.ok) {

    throw new Error(
      "API HTTP " +
      response.status
    );

  }


  const result =
    await response.json();


  console.log(
    "API RESULT:",
    result
  );


  if (
    !result.success ||
    !result.data
  ) {

    throw new Error(
      result.error ||
      "Search failed"
    );

  }


  return result.data;

}


/* =========================================================
   NORMALIZE RESULTS
========================================================= */

function normalizeResults(data) {

  if (Array.isArray(data)) {

    return data;

  }


  if (data) {

    return [data];

  }


  return [];

}


/* =========================================================
   CREATE SEARCH RESULT
========================================================= */

function createResult(anime) {

  const title =
    anime.title ||
    "Unknown Anime";


  const nativeTitle =
    anime.nativeTitle ||
    "";


  const poster =
    anime.poster ||
    "";


  const year =
    anime.year ||
    "";


  const type =
    anime.format ||
    anime.type ||
    "Anime";


  /*
    IMPORTANT:

    We keep BOTH IDs.

    The search result itself does NOT directly
    open anime.html anymore.

    Instead, we store the anime information
    inside the result element.

    When clicked, we use the SAME openAnime()
    function used by the homepage WATCH button.
  */

  const malId =
    anime.malId ||
    anime.idMal ||
    "";


  const anilistId =
    anime.anilistId ||
    anime.id ||
    "";


  const resultElement =
    document.createElement("button");


  resultElement.type =
    "button";


  resultElement.className =
    "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition text-left";


  resultElement.innerHTML =

    (
      poster

      ?

      `
      <img
        src="${escapeHtml(poster)}"
        alt="${escapeHtml(title)}"
        class="w-12 h-16 object-cover rounded-lg flex-shrink-0"
        loading="lazy"
      >
      `

      :

      `
      <div
        class="w-12 h-16 rounded-lg bg-white/5 flex items-center justify-center text-xs text-slate-500 flex-shrink-0"
      >
        N/A
      </div>
      `

    )

    +

    `

    <div class="min-w-0 flex-1">

      <h4
        class="text-sm font-semibold text-white truncate"
      >
        ${escapeHtml(title)}
      </h4>


      ${
        nativeTitle

        ?

        `
        <p
          class="text-[11px] text-slate-500 truncate"
        >
          ${escapeHtml(nativeTitle)}
        </p>
        `

        :

        ""
      }


      <p
        class="text-xs text-slate-400 mt-1"
      >

        ${escapeHtml(type)}

        ${
          year
            ? " · " + escapeHtml(year)
            : ""
        }

      </p>


      <span
        class="inline-block mt-1 text-[10px] bg-pink-600 text-white px-2 py-0.5 rounded-full"
      >
        VIEW
      </span>

    </div>

    `;


  /* =========================================================
     CLICK RESULT

     USE THE SAME FLOW AS HOMEPAGE WATCH BUTTON

     Search
       ↓
     Search Result
       ↓
     /api/anime?idMal=...
       ↓
     openAnime()
       ↓
     watch.html
========================================================= */

  resultElement.addEventListener(
    "click",
    async function(event) {

      event.preventDefault();


      console.log(
        "🎬 SEARCH RESULT CLICKED:",
        anime
      );


      /*
        IMPORTANT:

        openAnime() already exists in api.js.

        We use that exact function.

        This means homepage and search now
        open the watch page through the same
        system.
      */

      if (
        typeof window.openAnime ===
        "function"
      ) {

        await window.openAnime(
          {
            mal_id:
              malId,

            title:
              title,

            title_english:
              title
          }
        );

      }

      else {

        console.error(
          "❌ openAnime() is not available."
        );


        /*
          FALLBACK

          If api.js hasn't loaded correctly,
          at least open the watch page using
          the MAL ID.

          This is only a fallback.
        */

        if (malId) {

          window.location.href =
            `watch.html?malId=${encodeURIComponent(
              malId
            )}&anime=${encodeURIComponent(
              title
            )}&ep=1`;

        }

      }

    }
  );


  return resultElement;

}


/* =========================================================
   INITIALIZE SEARCH
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "INITIALIZING SEARCH"
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

      console.error(
        "❌ SEARCH ELEMENTS NOT FOUND"
      );

      return;

    }


    console.log(
      "✅ SEARCH ELEMENTS FOUND"
    );


    let timer =
      null;


    let requestNumber =
      0;


    /* =====================================================
       SEARCH INPUT
    ===================================================== */

    searchInput.addEventListener(
      "input",
      function() {

        clearTimeout(
          timer
        );


        const query =
          searchInput.value.trim();


        /* ===============================================
           EMPTY SEARCH
        =============================================== */

        if (!query) {

          searchResults.innerHTML =
            "";


          searchResults.classList.add(
            "hidden"
          );


          return;

        }


        /* ===============================================
           TOO SHORT
        =============================================== */

        if (
          query.length < 2
        ) {

          searchResults.innerHTML =
            `
            <p
              class="text-xs text-slate-400 text-center p-4"
            >
              Type at least 2 characters...
            </p>
            `;


          searchResults.classList.remove(
            "hidden"
          );


          return;

        }


        /* ===============================================
           LOADING
        =============================================== */

        searchResults.innerHTML =
          `
          <p
            class="text-xs text-slate-400 text-center p-4"
          >
            Searching...
          </p>
          `;


        searchResults.classList.remove(
          "hidden"
        );


        /* ===============================================
           DELAY SEARCH
        =============================================== */

        timer =
          setTimeout(
            async function() {

              const currentRequest =
                ++requestNumber;


              try {

                const data =
                  await searchAnime(
                    query
                  );


                /*
                  Ignore old requests.

                  Example:

                  User types:

                  Naruto
                  Naruto Sh
                  Naruto Shi

                  We only show the newest result.
                */

                if (
                  currentRequest !==
                  requestNumber
                ) {

                  return;

                }


                const results =
                  normalizeResults(
                    data
                  );


                console.log(
                  "NORMALIZED RESULTS:",
                  results
                );


                /* =========================================
                   NO RESULTS
                ========================================= */

                if (
                  results.length === 0
                ) {

                  searchResults.innerHTML =
                    `
                    <p
                      class="text-sm text-slate-400 text-center p-5"
                    >
                      No anime found.
                    </p>
                    `;


                  return;

                }


                /* =========================================
                   SEARCH HEADER
                ========================================= */

                searchResults.innerHTML =
                  `
                  <div
                    class="px-3 pt-3 pb-1"
                  >

                    <p
                      class="text-[10px] font-bold uppercase tracking-widest text-pink-500"
                    >
                      SEARCH RESULTS
                    </p>

                  </div>
                  `;


                /* =========================================
                   ADD RESULTS
                ========================================= */

                for (
                  let i = 0;
                  i < results.length;
                  i++
                ) {

                  const resultElement =
                    createResult(
                      results[i]
                    );


                  searchResults.appendChild(
                    resultElement
                  );

                }


                searchResults.classList.remove(
                  "hidden"
                );


                console.log(
                  "SEARCH DISPLAYED:",
                  results.length
                );

              }


              catch (
                error
              ) {

                console.error(
                  "❌ SEARCH ERROR:",
                  error
                );


                searchResults.innerHTML =
                  `
                  <p
                    class="text-xs text-red-400 text-center p-4"
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
      function(event) {

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


    /* =====================================================
       REOPEN RESULTS ON FOCUS
    ===================================================== */

    searchInput.addEventListener(
      "focus",
      function() {

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

