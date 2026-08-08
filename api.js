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
          "glass-card group relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827]/80 backdrop-blur-xl animate-pulse transition-all duration-500 hover:-translate-y-3 hover:border-pink-500/40 hover:shadow-[0_0_45px_rgba(236,72,153,0.25)]";


          skeleton.innerHTML = `

            <div
              class="w-full h-[280px] rounded-2xl bg-white/10"
            ></div>

           <div class="p-4 space-y-4">

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



function createAnimeCard(anime, isFreshDrop = false) {

    const card = document.createElement("div");

    /* =========================================================
       ANIME DATA
    ========================================================= */

    const title =
        anime.title?.english ||
        anime.title?.romaji ||
        anime.title ||
        "Unknown Anime";

    const image =
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        anime.coverImage?.large ||
        anime.coverImage?.medium ||
        "https://via.placeholder.com/300x450?text=No+Image";

    const type =
        anime.type ||
        "TV";

    const episodes =
        anime.episodes
            ? `${anime.episodes} Episodes`
            : "Episodes Unknown";

    const score =
        anime.score
            ? Number(anime.score).toFixed(1)
            : "N/A";

    const genres =
        anime.genres?.length
            ? anime.genres
                .slice(0, 2)
                .map(g => g.name)
                .join(" • ")
            : "Anime";

    const description =
        anime.synopsis ||
        anime.description ||
        "No description available.";

    const animeId =
        anime.mal_id ||
        anime.id ||
        anime.anilist_id ||
        "";


    /* =========================================================
       LOCAL STORAGE
    ========================================================= */

    const watchlist =
        JSON.parse(
            localStorage.getItem("watchlist")
        ) || [];

    const favourites =
        JSON.parse(
            localStorage.getItem("favourites")
        ) || [];

    const isInWatchlist =
        watchlist.some(
            item =>
                String(item.mal_id || item.id) ===
                String(animeId)
        );

    const isFavourite =
        favourites.some(
            item =>
                String(item.mal_id || item.id) ===
                String(animeId)
        );


    /* =========================================================
       FRESH DROPS
    ========================================================= */

    if (isFreshDrop) {

      card.className = `
          group
          relative
          shrink-0
          flex-none
          w-[180px]
          min-w-[180px]
          h-[270px]
          min-h-[270px]
          snap-start
          cursor-pointer
          overflow-hidden
          rounded-2xl
          bg-slate-900
          border
          border-white/10
          transition-all
          duration-500
          hover:-translate-y-2
          hover:border-pink-500/40
          hover:shadow-[0_0_35px_rgba(236,72,153,0.25)]
      `;
      card.style.width = "190px";
      card.style.minWidth = "190px";
      card.style.height = "285px";
      card.style.minHeight = "285px";
      card.style.flexShrink = "0";
        card.innerHTML = `

            <!-- POSTER -->

            <img
                src="${image}"
                alt="${title}"
                class="
                    absolute
                    inset-0
                    z-0
                    w-full
                    h-full
                    object-cover
                    transition-transform
                    duration-700
                    group-hover:scale-110
                "
                loading="lazy"
            >


            <!-- DARK OVERLAY -->

     <div
    class="
        absolute
        inset-0
        z-10
        bg-gradient-to-t
        from-black/95
        via-black/20
        to-transparent
        pointer-events-none
    "
></div>

            <!-- AIRING -->

            <span
                class="
                    absolute
                    top-3
                    left-3
                    z-30
                    bg-green-500
                    text-white
                    text-[10px]
                    font-bold
                    px-3
                    py-1
                    rounded-full
                "
            >
                🟢 AIRING
            </span>


            <!-- TYPE -->

            <span
                class="
                    absolute
                    top-3
                    right-3
                    z-30
                    bg-black/70
                    text-white
                    text-[10px]
                    px-3
                    py-1
                    rounded-full
                "
            >
                ${type}
            </span>


            <!-- WATCHLIST -->

            <button
                type="button"
                class="
                    watchlist-btn
                    absolute
                    right-3
                    bottom-24
                    z-[60]
                    w-10
                    h-10
                    rounded-full
                    bg-black/80
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    hover:bg-pink-500
                    hover:scale-110
                    transition-all
                "
                data-id="${animeId}"
                title="${
                    isInWatchlist
                        ? "Remove from Watchlist"
                        : "Add to Watchlist"
                }"
            >
                ${
                    isInWatchlist
                        ? "✅"
                        : "🔖"
                }
            </button>


            <!-- FAVOURITE -->

            <button
                type="button"
                class="
                    favourite-btn
                    absolute
                    right-3
                    bottom-12
                    z-[60]
                    w-10
                    h-10
                    rounded-full
                    bg-black/80
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    hover:bg-yellow-500
                    hover:text-black
                    hover:scale-110
                    transition-all
                "
                data-id="${animeId}"
                title="${
                    isFavourite
                        ? "Remove from Favourites"
                        : "Add to Favourites"
                }"
            >
                ${
                    isFavourite
                        ? "💛"
                        : "⭐"
                }
            </button>


            <!-- PLAY -->

            <button
                type="button"
                class="
                    watch-btn
                    absolute
                    inset-0
                    z-40
                    flex
                    items-center
                    justify-center
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    duration-300
                "
                aria-label="Watch ${title}"
            >

                <div
                    class="
                        w-14
                        h-14
                        rounded-full
                        bg-black/50
                        backdrop-blur-xl
                        border
                        border-white/40
                        flex
                        items-center
                        justify-center
                        shadow-[0_0_35px_rgba(236,72,153,.5)]
                    "
                >

                    <div
                        class="
                            w-10
                            h-10
                            rounded-full
                            bg-gradient-to-br
                            from-pink-500
                            to-fuchsia-600
                            flex
                            items-center
                            justify-center
                        "
                    >

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="white"
                            class="w-6 h-6 ml-1"
                        >
                            <path d="M8 5v14l11-7z"/>
                        </svg>

                    </div>

                </div>

            </button>


            <!-- BOTTOM INFORMATION -->

           <div
    class="
        absolute
        bottom-0
        left-0
        right-0
        p-4
        z-30
        bg-gradient-to-t
        from-black
        via-black/95
        to-black/40
        backdrop-blur-[2px]
        translate-y-full
        group-hover:translate-y-0
        transition-transform
        duration-500
    "
>

                <h3
                    class="
                        text-sm
                        font-bold
                        text-white
                        line-clamp-2
                    "
                >
                    ${title}
                </h3>

                <p
                    class="
                        text-green-400
                        text-xs
                        mt-1
                    "
                >
                    ${episodes}
                </p>

                <span
                    class="
                        inline-block
                        mt-2
                        bg-emerald-600
                        text-[9px]
                        text-white
                        px-2
                        py-1
                        rounded-full
                    "
                >
                    ${genres}
                </span>

            </div>

        `;

    }


    /* =========================================================
       FAN FAVORITES / TOP PICKS
    ========================================================= */

      else {

          card.className = `
              group
              relative
              cursor-pointer
              transition-all
              duration-500
              hover:-translate-y-2
              w-full
              max-w-[155px]
              mx-auto
          `;
        card.innerHTML = `

   <div
    class="
        relative
        aspect-[2/3]
        overflow-hidden
        rounded-xl
        bg-slate-900
        w-full
    "
>
                <img
                    src="${image}"
                    alt="${title}"
                    class="
                        w-full
                        h-full
                        object-cover
                        transition-transform
                        duration-700
                        group-hover:scale-110
                    "
                    loading="lazy"
                >

              <div
    class="
        absolute
        inset-0
        z-10
        bg-gradient-to-t
        from-black/95
        via-black/20
        to-transparent
        pointer-events-none
    "
></div>


                <span
                    class="
                        absolute
                        top-3
                        left-3
                        z-30
                        bg-pink-600
                        text-white
                        text-xs
                        font-bold
                        px-3
                        py-1
                        rounded-full
                    "
                >
                    ⭐ ${score}
                </span>


                <span
                    class="
                        absolute
                        top-3
                        right-3
                        z-30
                        bg-black/70
                        text-white
                        text-xs
                        px-3
                        py-1
                        rounded-full
                    "
                >
                    ${type}
                </span>


                <button
                    type="button"
                    class="
                        watchlist-btn
                        absolute
                        right-3
                        bottom-24
                        z-50
                        w-11
                        h-11
                        rounded-full
                        bg-black/70
                        flex
                        items-center
                        justify-center
                    "
                    data-id="${animeId}"
                >
                    ${
                        isInWatchlist
                            ? "✅"
                            : "🔖"
                    }
                </button>


                <button
                    type="button"
                    class="
                        favourite-btn
                        absolute
                        right-3
                        bottom-12
                        z-50
                        w-11
                        h-11
                        rounded-full
                        bg-black/70
                        flex
                        items-center
                        justify-center
                    "
                    data-id="${animeId}"
                >
                    ${
                        isFavourite
                            ? "💛"
                            : "⭐"
                    }
                </button>


                <button
                    type="button"
                    class="
                        watch-btn
                        absolute
                        inset-0
                        z-40
                        flex
                        items-center
                        justify-center
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                    "
                    aria-label="Watch ${title}"
                >

                    <div
                        class="
                            w-14
                            h-14
                            rounded-full
                            bg-pink-600
                            flex
                            items-center
                            justify-center
                            shadow-[0_0_40px_rgba(236,72,153,.5)]
                        "
                    >

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="white"
                            class="w-7 h-7 ml-1"
                        >
                            <path d="M8 5v14l11-7z"/>
                        </svg>

                    </div>

                </button>


               <div
    class="
        absolute
        bottom-0
        left-0
        right-0
        p-4
        z-30
        bg-gradient-to-t
        from-black
        via-black/95
        to-black/40
        backdrop-blur-[2px]
        translate-y-full
        group-hover:translate-y-0
        transition-transform
        duration-500
    "
>

                   <h3 class="text-sm sm:text-xl font-bold line-clamp-2">
                        ${title}
                    </h3>

                  <p class="text-pink-400 text-xs sm:text-sm mt-1">
                        ${episodes}
                    </p>

                    <div class="mt-2">

                        <span
                            class="
                                inline-block
                                bg-indigo-600
                                text-xs
                                px-3
                                py-1
                                rounded-full
                            "
                        >
                            ${genres}
                        </span>

                    </div>

                    <p
                        class="
                            mt-3
                            text-sm
                            text-slate-300
                            line-clamp-3
                        "
                    >
                        ${description}
                    </p>

                </div>

            </div>
        `;
    }


    /* =========================================================
       PLAY BUTTON
    ========================================================= */

    const watchButton =
        card.querySelector(".watch-btn");

    if (watchButton) {

        watchButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                openAnime(anime);

            }
        );

    }


    /* =========================================================
       WATCHLIST
    ========================================================= */

    const watchlistButton =
        card.querySelector(".watchlist-btn");

    if (watchlistButton) {

        watchlistButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                let currentWatchlist =
                    JSON.parse(
                        localStorage.getItem("watchlist")
                    ) || [];

                const existingIndex =
                    currentWatchlist.findIndex(
                        item =>
                            String(
                                item.mal_id || item.id
                            ) === String(animeId)
                    );

                if (existingIndex !== -1) {

                    currentWatchlist.splice(
                        existingIndex,
                        1
                    );

                    watchlistButton.textContent =
                        "🔖";

                    watchlistButton.title =
                        "Add to Watchlist";

                } else {

                    currentWatchlist.push(anime);

                    watchlistButton.textContent =
                        "✅";

                    watchlistButton.title =
                        "Remove from Watchlist";
                }

                localStorage.setItem(
                    "watchlist",
                    JSON.stringify(
                        currentWatchlist
                    )
                );

            }
        );

    }
/* =========================================================
       FAVOURITES
    ========================================================= */

    const favouriteButton =
        card.querySelector(".favourite-btn");

    if (favouriteButton) {

        favouriteButton.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            console.log("⭐ FAVOURITE BUTTON CLICKED:", anime);

            let currentFavourites = [];

            try {

                currentFavourites =
                    JSON.parse(
                        localStorage.getItem("favourites") || "[]"
                    );

                if (!Array.isArray(currentFavourites)) {
                    currentFavourites = [];
                }

            } catch (error) {

                console.error(
                    "❌ Could not read favourites:",
                    error
                );

                currentFavourites = [];

            }


            const existingIndex =
                currentFavourites.findIndex(item => {

                    const itemId =
                        item.mal_id ||
                        item.malId ||
                        item.idMal ||
                        item.id;

                    return String(itemId) === String(animeId);

                });


            /* ===============================================
               REMOVE
            =============================================== */

            if (existingIndex !== -1) {

                currentFavourites.splice(
                    existingIndex,
                    1
                );

                favouriteButton.textContent = "⭐";

                favouriteButton.title =
                    "Add to Favourites";

                console.log(
                    "💔 Removed from favourites:",
                    title
                );

            }

            /* ===============================================
               ADD
            =============================================== */

            else {

                currentFavourites.push(anime);

                favouriteButton.textContent = "💛";

                favouriteButton.title =
                    "Remove from Favourites";

                console.log(
                    "💛 Added to favourites:",
                    title
                );

            }


            /* ===============================================
               SAVE
            =============================================== */

            localStorage.setItem(
                "favourites",
                JSON.stringify(
                    currentFavourites
                )
            );


            console.log(
                "💾 FAVOURITES SAVED:",
                currentFavourites
            );

            console.log(
                "💾 RAW STORAGE:",
                localStorage.getItem("favourites")
            );

        });

    }
    /* =========================================================
       CARD CLICK
    ========================================================= */

    card.addEventListener(
        "click",
        function(event) {

            if (
                event.target.closest(".watch-btn") ||
                event.target.closest(".watchlist-btn") ||
                event.target.closest(".favourite-btn")
            ) {
                return;
            }

            openAnime(anime);

        }
    );


    return card;
}


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
            24
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
            24
            )
            .length,
          "anime"
        );

      }
  async function getAnimeBackdrop(anime){

      try {

          const response = await fetch(
              `/api/backdrop?anime=${encodeURIComponent(anime)}`
          );


          const data = await response.json();


          return data.backdrop;


      } catch(error){

          console.error("Backdrop error:", error);

          return null;

      }

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
            "/top/anime?filter=bypopularity&limit=24"
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
            "/seasons/now?limit=24"
          );


        renderAnime(
          trendingContainer,
          anime
        );

      }



/* =========================================================
   FRESH DROPS
========================================================= */

/* =========================================================
   FRESH DROPS
   HORIZONTAL SLIDER
========================================================= */

async function loadLatestAnime() {

    if (!latestContainer) {

        console.error(
            "❌ latestAnimeContainer NOT FOUND"
        );

        return;
    }

    console.log(
        "🔥 LOADING FRESH DROPS..."
    );


    /* =====================================================
       SLIDER CONTAINER
    ===================================================== */

    latestContainer.classList.remove(
        "grid",
        "grid-cols-1",
        "grid-cols-2",
        "md:grid-cols-3",
        "lg:grid-cols-4"
    );

    latestContainer.classList.add(
        "flex",
        "gap-5",
        "overflow-x-auto",
        "overflow-y-hidden",
        "scroll-smooth",
        "snap-x",
        "snap-mandatory",
        "pb-4",
        "no-scrollbar"
    );


    /* =====================================================
       LOADING
    ===================================================== */

    showLoading(
        latestContainer,
        6
    );


    /* =====================================================
       FETCH AIRING ANIME
    ===================================================== */

    console.log(
        "📡 Fetching Fresh Drops from Jikan..."
    );

  const anime = await fetchAnime(
      "/top/anime?filter=airing&limit=24"
  );


    console.log(
        "🔥 FRESH DROPS RESULT:",
        anime
    );


    /* =====================================================
       CHECK RESULT
    ===================================================== */

    if (
        !anime ||
        anime.length === 0
    ) {

        console.error(
            "❌ FRESH DROPS RETURNED NO ANIME"
        );

        showError(
            latestContainer,
            "Fresh Drops could not be loaded."
        );

        return;
    }


    /* =====================================================
       RENDER
    ===================================================== */

    renderAnime(
        latestContainer,
        anime,
        true
    );

  latestContainer.style.display = "flex";
  latestContainer.style.flexDirection = "row";
  latestContainer.style.flexWrap = "nowrap";
  latestContainer.style.overflowX = "auto";
    /* =====================================================
       DEBUG
    ===================================================== */

    console.log(
        "🧪 Fresh Drop DOM children:",
        latestContainer.children.length
    );


    const firstCard =
        latestContainer.firstElementChild;


    console.log(
        "🧪 First Fresh Drop:",
        firstCard
    );


    if (firstCard) {

        console.log(
            "🧪 CARD RECT:",
            firstCard.getBoundingClientRect()
        );


        console.log(
            "🧪 CARD STYLE:",
            getComputedStyle(firstCard)
        );


        const image =
            firstCard.querySelector("img");


        console.log(
            "🧪 IMAGE:",
            image
        );


        if (image) {

            console.log(
                "🧪 IMAGE RECT:",
                image.getBoundingClientRect()
            );

        }

    }

}


/* =========================================================
   START HOMEPAGE API
========================================================= */

async function loadHomepageAnime() {

    console.log(
        "🚀 STARTING DANIMEVERSE API"
    );


    /* =====================================================
       FAN FAVORITES
    ===================================================== */

    await loadPopularAnime();


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                1500
            )
    );


    /* =====================================================
       TOP PICKS
    ===================================================== */

    await loadTrendingAnime();


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                1500
            )
    );


    /* =====================================================
       FRESH DROPS
    ===================================================== */

    await loadLatestAnime();


    console.log(
        "🎉 DANIMEVERSE HOMEPAGE COMPLETE"
    );

}


/* =========================================================
   RUN HOMEPAGE API
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadHomepageAnime
    );

} else {

    loadHomepageAnime();

}


/* =========================================================
   HERO FEATURED ANIME
========================================================= */

window.featuredAnime = [

    {
        title: "Solo Leveling",
        malId: 52299,
        desc: "The weakest hunter rises to become humanity's strongest.",
        rating: "⭐ 9.4",
        genre: "Action • Fantasy"
    },

    {
        title: "Attack on Titan",
        malId: 16498,
        desc: "Humanity fights for survival against terrifying Titans.",
        rating: "⭐ 9.8",
        genre: "Action • Dark Fantasy"
    },

    {
        title: "Jujutsu Kaisen",
        malId: 40748,
        desc: "Sorcerers battle deadly curses threatening humanity.",
        rating: "⭐ 9.1",
        genre: "Action • Supernatural"
    },

    {
        title: "Naruto",
        malId: 20,
        desc: "A young ninja dreams of becoming Hokage.",
        rating: "⭐ 8.7",
        genre: "Adventure • Ninja"
    }

];
