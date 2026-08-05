      /* =========================================================
         DANIMEVERSE - API.JS
         FAN FAVORITES + TOP PICKS + FRESH DROPS
         UNIVERSAL ANIME WATCH SYSTEM
      ========================================================= */


      /* =========================================================
         JIKAN API
      ========================================================= */

      const JIKAN_BASE = "https://api.jikan.moe/v4";



/* =========================================================
   UNIVERSAL ANIME OPEN FUNCTION

   HOMEPAGE ANIME CARD
        ↓
   WATCH BUTTON
        ↓
   /api/anime?idMal=...
        ↓
   Get AniList ID + MAL ID
        ↓
   anime.html
        ↓
   Anime details + background + episodes
        ↓
   Click episode
        ↓
   watch.html
        ↓
   Video player
========================================================= */

async function openAnime(anime) {

  if (!anime) {

    console.error(
      "❌ No anime data provided."
    );

    return;

  }


  /* =======================================================
     GET MAL ID
  ======================================================= */

  const malId =
    anime.mal_id ||
    anime.malId ||
    anime.idMal ||
    "";


  if (!malId) {

    console.error(
      "❌ Anime has no MAL ID:",
      anime
    );

    alert(
      "This anime could not be opened."
    );

    return;

  }


  /* =======================================================
     GET TITLE
  ======================================================= */

  const title =
    anime.title_english ||
    anime.title ||
    anime.nativeTitle ||
    "Unknown Anime";


  console.log(
    "🎬 Opening anime details:",
    title,
    "MAL ID:",
    malId
  );


  try {

    /* =====================================================
       CALL UNIVERSAL API GATEWAY

       /api/anime?idMal=...

       This finds the anime through:
       Kitsu → AniList → Jikan
    ===================================================== */

    const response =
      await fetch(
        `https://danimeverse.vercel.app/api/anime?idMal=${encodeURIComponent(
          malId
        )}`
      );


    if (!response.ok) {

      throw new Error(
        `API Gateway HTTP ${response.status}`
      );

    }


    const result =
      await response.json();


    console.log(
      "📡 Universal API response:",
      result
    );


    /* =====================================================
       CHECK API RESULT
    ===================================================== */

    if (
      !result.success ||
      !result.data
    ) {

      throw new Error(
        result.error ||
        "Could not find anime information."
      );

    }


    /* =====================================================
       NORMALIZED ANIME DATA
    ===================================================== */

    const animeData =
      result.data;


    console.log(
      "✅ Anime found using provider:",
      result.provider
    );


    console.log(
      "🎬 Anime data:",
      animeData
    );


    /* =====================================================
       GET IDs

       AniList ID:
       Used by anime.html if available.

       MAL ID:
       Used by Firebase episode system.
    ===================================================== */

    const anilistId =
      animeData.anilistId ||
      animeData.id ||
      anime.anilistId ||
      anime.id ||
      "";


    const returnedMalId =
      animeData.malId ||
      animeData.idMal ||
      malId ||
      "";


    const animeTitle =
      animeData.title ||
      title;


    console.log(
      "🆔 AniList ID:",
      anilistId || "Not available"
    );


    console.log(
      "🆔 MAL ID:",
      returnedMalId || "Not available"
    );


    console.log(
      "🎬 Title:",
      animeTitle
    );


    /* =====================================================
       BUILD ANIME DETAILS PAGE URL
    ===================================================== */

    const params =
      new URLSearchParams();


    /* -----------------------------------------------------
       AniList ID
    ----------------------------------------------------- */

    if (anilistId) {

      params.set(
        "anilistId",
        String(anilistId)
      );

    }


    /* -----------------------------------------------------
       MAL ID

       Important for your existing Firebase structure:

       animes
          └── MAL ID
               └── episodes
    ----------------------------------------------------- */

    if (returnedMalId) {

      params.set(
        "malId",
        String(returnedMalId)
      );

    }


    /* -----------------------------------------------------
       Anime title
    ----------------------------------------------------- */

    if (animeTitle) {

      params.set(
        "anime",
        animeTitle
      );

    }


    /* =====================================================
       OPEN ANIME DETAILS PAGE

       NOT watch.html

       The user will now see:

       Anime background
       Poster
       Title
       Genres
       Synopsis
       Episodes

       Then clicking an episode opens watch.html.
    ===================================================== */

    const animeUrl =
      `anime.html?${params.toString()}`;


    console.log(
      "🚀 Opening anime details page:",
      animeUrl
    );


    window.location.href =
      animeUrl;


  } catch (error) {

    console.error(
      "❌ Failed to open anime details:",
      error
    );


    alert(
      `Could not open ${title}. Please try again.`
    );

  }

}


      /* =========================================================
         GET HOMEPAGE CONTAINERS
      ========================================================= */

      const popularContainer =
        document.getElementById(
          "popularAnimeContainer"
        );


      const trendingContainer =
        document.getElementById(
          "trendingAnimeContainer"
        );


      const latestContainer =
        document.getElementById(
          "latestAnimeContainer"
        );


      console.log(
        "🔥 DANIMEVERSE API.JS LOADED"
      );


      console.log(
        "Popular:",
        popularContainer
      );


      console.log(
        "Trending:",
        trendingContainer
      );


      console.log(
        "Fresh Drops:",
        latestContainer
      );


      /* =========================================================
         LOADING SKELETON
      ========================================================= */

      function showLoading(
        container,
        count = 6
      ) {

        if (!container) return;


        container.innerHTML = "";


        for (
          let i = 0;
          i < count;
          i++
        ) {

          const skeleton =
            document.createElement(
              "article"
            );


          skeleton.className =
            "glass-card overflow-hidden rounded-[2rem] border border-white/10 p-4 shadow-soft animate-pulse";


          skeleton.innerHTML = `

            <div
              class="w-full h-[280px] rounded-2xl bg-white/10"
            ></div>

            <div class="mt-4 space-y-3">

              <div
                class="h-4 bg-white/10 rounded w-1/2"
              ></div>

              <div
                class="h-6 bg-white/10 rounded w-3/4"
              ></div>

              <div
                class="h-3 bg-white/10 rounded w-full"
              ></div>

              <div class="flex gap-2 pt-3">

                <div
                  class="h-10 w-20 bg-white/10 rounded-full"
                ></div>

                <div
                  class="h-10 w-24 bg-white/10 rounded-full"
                ></div>

              </div>

            </div>

          `;


          container.appendChild(
            skeleton
          );

        }

      }


      /* =========================================================
         ERROR MESSAGE
      ========================================================= */

      function showError(
        container,
        message
      ) {

        if (!container) return;


        container.innerHTML = `

          <div
            class="col-span-full text-center py-10"
          >

            <div
              class="glass-card rounded-[2rem] p-8"
            >

              <p
                class="text-red-400 text-lg font-semibold"
              >
                ${message}
              </p>

              <button
                onclick="location.reload()"
                class="mt-4 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 rounded-full transition"
              >
                Try Again
              </button>

            </div>

          </div>

        `;

      }


      /* =========================================================
         FETCH JIKAN API
      ========================================================= */

      async function fetchAnime(
        endpoint
      ) {

        try {

          console.log(
            "📡 Fetching:",
            `${JIKAN_BASE}${endpoint}`
          );


          const response =
            await fetch(
              `${JIKAN_BASE}${endpoint}`
            );


          console.log(
            "📡 Jikan Status:",
            response.status
          );


          if (!response.ok) {

            throw new Error(
              `Jikan API returned ${response.status}`
            );

          }


          const result =
            await response.json();


          console.log(
            "✅ Anime received:",
            result.data?.length
          );


          return (
            result.data || []
          );


        } catch (error) {

          console.error(
            "❌ JIKAN API ERROR:",
            error
          );


          return [];

        }

      }


      /* =========================================================
         GET GENRES
      ========================================================= */

      function getGenres(
        anime
      ) {

        if (
          !anime.genres ||
          anime.genres.length === 0
        ) {

          return "Anime";

        }


        return anime.genres
          .slice(
            0,
            3
          )
          .map(
            genre =>
              genre.name
          )
          .join(
            ", "
          );

      }


      /* =========================================================
         GET DESCRIPTION
      ========================================================= */

      function getDescription(
        anime
      ) {

        if (
          !anime.synopsis
        ) {

          return "No description available.";

        }


        return anime.synopsis.length > 120

          ? anime.synopsis.substring(
              0,
              120
            ) + "..."

          : anime.synopsis;

      }


      /* =========================================================
         CREATE ANIME CARD
      ========================================================= */

      function createAnimeCard(
        anime,
        isFreshDrop = false
      ) {

        const title =
          anime.title_english ||
          anime.title ||
          "Unknown Anime";


        const image =
          anime.images?.jpg?.large_image_url ||
          anime.images?.jpg?.image_url ||
          "https://via.placeholder.com/600x900?text=No+Image";


        const score =
          anime.score
            ? `${anime.score}/10`
            : "N/A";


        const genres =
          getGenres(
            anime
          );


        const description =
          getDescription(
            anime
          );


        const episodes =
          anime.episodes
            ? `${anime.episodes} Episodes`
            : "Ongoing";


        const type =
          anime.type ||
          "Anime";


        const card =
          document.createElement(
            "article"
          );
        if (!window.danimeverseAnimeData) {
          window.danimeverseAnimeData = [];
        }

        if (
          !window.danimeverseAnimeData.some(
            item => item.mal_id === anime.mal_id
          )
        ) {
          window.danimeverseAnimeData.push(anime);
        }

        card.className =
          "glass-card group overflow-hidden rounded-[2rem] border border-white/10 p-4 shadow-soft transition duration-500 hover:-translate-y-2 hover:shadow-glow";


        /* =========================================================
           FRESH DROPS
        ========================================================= */

        if (isFreshDrop) {

          card.innerHTML = `

            <div
              class="relative overflow-hidden rounded-2xl"
            >

              <img
                src="${image}"
                alt="${title}"
                class="w-full h-[320px] sm:h-[250px] md:h-[290px] object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              >

              <div
                class="absolute top-3 left-3"
              >

                <span
                  class="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                >
                  🟢 Still Airing
                </span>

              </div>


              <div
                class="absolute top-3 right-3"
              >

                <span
                  class="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full"
                >
                  ${type}
                </span>

              </div>

            </div>


            <div
              class="mt-4 space-y-3"
            >

              <h3
                class="text-xl font-bold text-white line-clamp-2"
              >
                ${title}
              </h3>


              <div
                class="flex items-center gap-2"
              >

                <span
                  class="text-xs font-semibold text-green-400"
                >
                  Currently Airing
                </span>

              </div>


              <div
                class="flex flex-wrap gap-3 pt-3"
              >

                <button
                  type="button"
                  class="watch-btn bg-pink-700 border border-black text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-black hover:text-white transition"
                >
                  WATCH
                </button>


                <button
                  type="button"
                  class="download-btn bg-transparent border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white hover:text-black transition"
                >
                  DOWNLOAD
                </button>

              </div>

            </div>

          `;

        }


        /* =========================================================
           FAN FAVORITES + TOP PICKS
        ========================================================= */

        else {

          card.innerHTML = `

            <div
              class="relative overflow-hidden rounded-2xl"
            >

              <img
                src="${image}"
                alt="${title}"
                class="w-full h-[320px] sm:h-[250px] md:h-[290px] object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              >


              <div
                class="absolute top-3 left-3"
              >

                <span
                  class="bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                >
                  ⭐ ${score}
                </span>

              </div>


              <div
                class="absolute top-3 right-3"
              >

                <span
                  class="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full"
                >
                  ${type}
                </span>

              </div>

            </div>


            <div
              class="mt-4 space-y-3"
            >

              <div>

                <span
                  class="inline-block bg-indigo-600 text-white text-xs px-3 py-1 rounded-full"
                >
                  ${genres}
                </span>

              </div>


              <h3
                class="text-xl font-bold text-white line-clamp-2"
              >
                ${title}
              </h3>


              <p
                class="text-xs text-pink-400 font-semibold"
              >
                ${episodes}
              </p>


              <p
                class="text-xs md:text-sm leading-6 text-slate-300 line-clamp-3"
              >
                ${description}
              </p>


              <div
                class="flex flex-wrap gap-3 pt-3"
              >

                <button
                  type="button"
                  class="watch-btn bg-pink-700 border border-black text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-black hover:text-white transition"
                >
                  WATCH
                </button>


                <button
                  type="button"
                  class="download-btn bg-transparent border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white hover:text-black transition"
                >
                  DOWNLOAD
                </button>

              </div>

            </div>

          `;

        }


        /* =========================================================
           WATCH BUTTON
        ========================================================= */

        const watchButton =
          card.querySelector(
            ".watch-btn"
          );


        if (watchButton) {

          watchButton.addEventListener(
            "click",
            function (event) {

              event.preventDefault();

              event.stopPropagation();

              openAnime(
                anime
              );

            }
          );

        }


        /* =========================================================
           DOWNLOAD BUTTON
        ========================================================= */

        const downloadButton =
          card.querySelector(
            ".download-btn"
          );


if (downloadButton) {

  downloadButton.addEventListener(
    "click",
    function (event) {

      event.preventDefault();
      event.stopPropagation();

      alert(
        `Download links for ${title} will be available when this anime is added to the Danimeverse watch system.`
      );

    }
  );

}

// Make the whole card clickable
card.style.cursor = "pointer";

card.addEventListener("click", function (e) {

  if (
    e.target.closest(".watch-btn") ||
    e.target.closest(".download-btn")
  ) {
    return;
  }

  openAnime(anime);

});

return card;

      /* =========================================================
         RENDER ANIME
         Maximum 12 cards per section
      ========================================================= */

      function renderAnime(
        container,
        animeList,
        isFreshDrop = false
      ) {

        if (!container) {

          console.error(
            "❌ RENDER ERROR: Container missing."
          );

          return;

        }


        container.innerHTML = "";


        if (
          !animeList ||
          animeList.length === 0
        ) {

          showError(
            container,
            "No anime could be loaded."
          );

          return;

        }


        animeList
          .slice(
            0,
            12
          )
          .forEach(
            anime => {

              const card =
                createAnimeCard(
                  anime,
                  isFreshDrop
                );


              container.appendChild(
                card
              );

            }
          );


        console.log(
          "✅ Rendered:",
          animeList
            .slice(
              0,
              12
            )
            .length,
          "anime"
        );

      }


      /* =========================================================
         FAN FAVORITES
      ========================================================= */

      async function loadPopularAnime() {

        if (!popularContainer) {

          console.error(
            "❌ popularAnimeContainer NOT FOUND"
          );

          return;

        }


        showLoading(
          popularContainer,
          6
        );


        const anime =
          await fetchAnime(
            "/top/anime?filter=bypopularity&limit=12"
          );


        renderAnime(
          popularContainer,
          anime
        );

      }


      /* =========================================================
         TOP PICKS
      ========================================================= */

      async function loadTrendingAnime() {

        if (!trendingContainer) {

          console.error(
            "❌ trendingAnimeContainer NOT FOUND"
          );

          return;

        }


        showLoading(
          trendingContainer,
          6
        );


        const anime =
          await fetchAnime(
            "/seasons/now?limit=12"
          );


        renderAnime(
          trendingContainer,
          anime
        );

      }


      /* =========================================================
         FRESH DROPS
      ========================================================= */

      async function loadLatestAnime() {

        if (!latestContainer) {

          console.error(
            "❌ latestAnimeContainer NOT FOUND"
          );

          return;

        }


        showLoading(
          latestContainer,
          6
        );


        const anime =
          await fetchAnime(
            "/top/anime?filter=airing&limit=12"
          );


        renderAnime(
          latestContainer,
          anime,
          true
        );

      }


      /* =========================================================
         START HOMEPAGE API

         All three sections load independently.
         This prevents one failed API request
         from stopping the remaining sections.
      ========================================================= */

        async function loadHomepageAnime() {

          console.log(
            "🚀 STARTING DANIMEVERSE API"
          );

          await loadPopularAnime();

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                1500
              )
          );

          await loadTrendingAnime();

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                1500
              )
          );

          await loadLatestAnime();

          console.log(
            "🎉 DANIMEVERSE HOMEPAGE COMPLETE"
          );

        }
      /* =========================================================
         RUN API
      ========================================================= */

      if (
        document.readyState ===
        "loading"
      ) {

        document.addEventListener(
          "DOMContentLoaded",
          loadHomepageAnime
        );

      }
      else {

        loadHomepageAnime();

      }
    
