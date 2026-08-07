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

    card.className =
        "group relative cursor-pointer transition-all duration-500 hover:-translate-y-2";

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
        anime.genres?.slice(0, 2).join(" • ") ||
        "Anime";

    const description =
        anime.synopsis ||
        anime.description ||
        "No description available.";

    const animeId =
        anime.mal_id ||
        anime.id ||
        anime.anilist_id;

    /* =========================================================
       LOCAL STORAGE
    ========================================================= */

    let watchlist =
        JSON.parse(
            localStorage.getItem("watchlist")
        ) || [];

    let favourites =
        JSON.parse(
            localStorage.getItem("favourites")
        ) || [];


    const isInWatchlist =
        watchlist.some(
            item =>
                String(
                    item.mal_id || item.id
                ) === String(animeId)
        );

    const isFavourite =
        favourites.some(
            item =>
                String(
                    item.mal_id || item.id
                ) === String(animeId)
        );


    /* =========================================================
       FRESH DROPS
    ========================================================= */

    if (isFreshDrop) {

        card.innerHTML = `

        <div class="relative aspect-[2/3] overflow-hidden rounded-2xl">

            <!-- Poster -->

            <img
                src="${image}"
                alt="${title}"
                class="
                    w-full
                    h-full
                    object-cover
                    transition-all
                    duration-700
                    group-hover:scale-110
                "
                loading="lazy"
            >


            <!-- Dark Overlay -->

            <div
                class="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black
                    via-black/30
                    to-transparent
                    pointer-events-none
                "
            ></div>


            <!-- Airing -->

            <span
                class="
                    absolute
                    top-3
                    left-3
                    z-30
                    bg-gradient-to-r
                    from-green-500
                    to-emerald-600
                    text-white
                    text-xs
                    font-bold
                    px-3
                    py-1
                    rounded-full
                    shadow-lg
                "
            >
                🟢 AIRING
            </span>


            <!-- Type -->

            <span
                class="
                    absolute
                    top-3
                    right-3
                    z-30
                    bg-black/70
                    backdrop-blur
                    text-white
                    text-xs
                    px-3
                    py-1
                    rounded-full
                "
            >
                ${type}
            </span>


            <!-- WATCHLIST -->

            <button
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
                    backdrop-blur
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    text-lg
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
                    backdrop-blur
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    text-lg
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
                    transition-all
                    duration-500
                "
                aria-label="Watch ${title}"
            >

                <div
                    class="
                        w-14
                        h-14
                        rounded-full
                        bg-white/10
                        backdrop-blur-2xl
                        border
                        border-white/40
                        shadow-[0_0_40px_rgba(236,72,153,.45)]
                        flex
                        items-center
                        justify-center
                        group-hover:scale-110
                        transition-all
                        duration-300
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
                            shadow-xl
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

                </div>

            </button>


            <!-- Bottom Info -->

            <div
                class="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    p-4
                    z-30
                    translate-y-full
                    group-hover:translate-y-0
                    transition-all
                    duration-500
                "
            >

                <h3
                    class="
                        text-xl
                        font-bold
                        line-clamp-2
                    "
                >
                    ${title}
                </h3>

                <p
                    class="
                        text-green-400
                        text-sm
                        mt-1
                    "
                >
                    ${episodes}
                </p>

                <div class="mt-2">

                    <span
                        class="
                            inline-block
                            bg-emerald-600
                            text-xs
                            px-3
                            py-1
                            rounded-full
                        "
                    >
                        ${genres}
                    </span>

                </div>

            </div>

        </div>

        `;

    }


    /* =========================================================
       FAN FAVORITES + TOP PICKS
    ========================================================= */

    else {

        card.innerHTML = `

        <div class="relative aspect-[2/3] overflow-hidden rounded-2xl">

            <!-- Poster -->

            <img
                src="${image}"
                alt="${title}"
                class="
                    w-full
                    h-full
                    object-cover
                    transition-all
                    duration-700
                    group-hover:scale-110
                "
                loading="lazy"
            >


            <!-- Dark Overlay -->

            <div
                class="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black
                    via-black/55
                    to-transparent
                    opacity-80
                    pointer-events-none
                "
            ></div>


            <!-- Score -->

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
                    shadow-lg
                "
            >
                ⭐ ${score}
            </span>


            <!-- Type -->

            <span
                class="
                    absolute
                    top-3
                    right-3
                    z-30
                    bg-black/70
                    backdrop-blur
                    text-white
                    text-xs
                    px-3
                    py-1
                    rounded-full
                "
            >
                ${type}
            </span>


            <!-- WATCHLIST -->

            <button
                class="
                    watchlist-btn
                    absolute
                    right-3
                    bottom-24
                    z-50
                    w-11
                    h-11
                    rounded-full
                    bg-black/60
                    backdrop-blur
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    text-lg
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
                class="
                    favourite-btn
                    absolute
                    right-3
                    bottom-12
                    z-50
                    w-11
                    h-11
                    rounded-full
                    bg-black/60
                    backdrop-blur
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    text-lg
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
                    transition-all
                    duration-500
                "
                aria-label="Watch ${title}"
            >

                <div
                    class="
                        w-14
                        h-14
                        rounded-full
                        bg-white/10
                        backdrop-blur-2xl
                        border
                        border-white/40
                        shadow-[0_0_40px_rgba(236,72,153,.45)]
                        flex
                        items-center
                        justify-center
                        group-hover:scale-110
                        transition-all
                        duration-300
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
                            shadow-xl
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

                </div>

            </button>


            <!-- Bottom Info -->

            <div
                class="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    p-4
                    z-30
                    translate-y-full
                    group-hover:translate-y-0
                    transition-all
                    duration-500
                "
            >

                <h3
                    class="
                        text-xl
                        font-bold
                        line-clamp-2
                    "
                >
                    ${title}
                </h3>

                <p
                    class="
                        text-pink-400
                        text-sm
                        mt-1
                    "
                >
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
       PLAY / WATCH BUTTON
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
       WATCHLIST BUTTON
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


                /* =========================
                   REMOVE
                ========================= */

                if (existingIndex !== -1) {

                    currentWatchlist.splice(
                        existingIndex,
                        1
                    );

                    watchlistButton.textContent =
                        "🔖";

                    watchlistButton.title =
                        "Add to Watchlist";

                }


                /* =========================
                   ADD
                ========================= */

                else {

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
       FAVOURITE BUTTON
    ========================================================= */

    const favouriteButton =
        card.querySelector(".favourite-btn");

    if (favouriteButton) {

        favouriteButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();


                let currentFavourites =
                    JSON.parse(
                        localStorage.getItem("favourites")
                    ) || [];


                const existingIndex =
                    currentFavourites.findIndex(
                        item =>
                            String(
                                item.mal_id || item.id
                            ) === String(animeId)
                    );


                /* =========================
                   REMOVE
                ========================= */

                if (existingIndex !== -1) {

                    currentFavourites.splice(
                        existingIndex,
                        1
                    );

                    favouriteButton.textContent =
                        "⭐";

                    favouriteButton.title =
                        "Add to Favourites";

                }


                /* =========================
                   ADD
                ========================= */

                else {

                    currentFavourites.push(anime);

                    favouriteButton.textContent =
                        "💛";

                    favouriteButton.title =
                        "Remove from Favourites";

                }


                localStorage.setItem(
                    "favourites",
                    JSON.stringify(
                        currentFavourites
                    )
                );

            }
        );

    }


    /* =========================================================
       CARD CLICK
    ========================================================= */

    card.style.cursor = "pointer";

    card.addEventListener(
        "click",
        function(event) {

            /*
             * If user clicked ANY interactive button,
             * do NOT open the watch page.
             */

            if (
                event.target.closest(".watch-btn") ||
                event.target.closest(".watchlist-btn") ||
                event.target.closest(".favourite-btn")
            ) {

                return;

            }


            /*
             * Otherwise clicking the card
             * opens the anime watch page.
             */

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
          setTimeout(() => {
            injectFavouriteButtons(user.uid);
          }, 6000);
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
    
  window.featuredAnime = [

{
title:"Solo Leveling",
desc:"The weakest hunter rises to become humanity's strongest.",
rating:"⭐ 9.4",
genre:"Action • Fantasy"
},

{
title:"Attack on Titan",
desc:"Humanity fights for survival against terrifying Titans.",
rating:"⭐ 9.8",
genre:"Action • Dark Fantasy"
},

{
title:"Jujutsu Kaisen",
desc:"Sorcerers battle deadly curses threatening humanity.",
rating:"⭐ 9.1",
genre:"Action • Supernatural"
},

{
title:"Naruto",
desc:"A young ninja dreams of becoming Hokage.",
rating:"⭐ 8.7",
genre:"Adventure • Ninja"
}

];