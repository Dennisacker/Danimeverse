/* =========================================================
   DANIMEVERSE - API.JS
   FAN FAVORITES + TOP PICKS + FRESH DROPS
========================================================= */

const JIKAN_BASE =
  "https://api.jikan.moe/v4";


/* =========================================================
   GET CONTAINERS
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
   ERROR
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
      endpoint
    );

    const response =
      await fetch(
        `${JIKAN_BASE}${endpoint}`
      );

    console.log(
      "📡 Status:",
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
   GENRES
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
   DESCRIPTION
========================================================= */

function getDescription(
  anime
) {

  if (!anime.synopsis) {

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
   LOCAL ANIME PAGES
========================================================= */

function getAnimePage(
  anime
) {

  const title =
    (
      anime.title_english ||
      anime.title ||
      ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9\s-]/g,
        ""
      )
      .trim()
      .replace(
        /\s+/g,
        "-"
      );


  const animePages = {

    "naruto":
      "naruto.html",

    "attack-on-titan":
      "aot.html",

    "assassination-classroom":
      "assassination-classroom.html",

    "jujutsu-kaisen":
      "jujutsu-kaisen.html",

    "frieren-beyond-journeys-end":
      "frieren.html",

    "witch-hat-atelier":
      "witch-hat-atelier.html"

  };


  return (
    animePages[title] ||
    null
  );

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


  const localPage =
    getAnimePage(
      anime
    );


  const card =
    document.createElement(
      "article"
    );


  card.className =
    "glass-card group overflow-hidden rounded-[2rem] border border-white/10 p-4 shadow-soft transition duration-500 hover:-translate-y-2 hover:shadow-glow";


  /* =========================================================
     FRESH DROPS CARD
     Only Fresh Drops uses this simplified version
========================================================= */

  if (isFreshDrop) {

    card.innerHTML = `

      <!-- IMAGE -->

      <div
        class="relative overflow-hidden rounded-2xl"
      >

        <img
  src="${image}"
  alt="${title}"
  class="w-full h-[320px] sm:h-[250px] md:h-[290px] object-cover transition duration-500 group-hover:scale-105"
  loading="lazy"
>


        <!-- STILL AIRING -->

        <div
          class="absolute top-3 left-3"
        >

          <span
            class="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
          >
            🟢 Still Airing
          </span>

        </div>


        <!-- TYPE -->

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


      <!-- FRESH DROPS CONTENT -->

      <div
        class="mt-4 space-y-3"
      >

        <!-- TITLE -->

        <h3
          class="text-xl font-bold text-white line-clamp-2"
        >
          ${title}
        </h3>


        <!-- STILL AIRING STATUS -->

        <div
          class="flex items-center gap-2"
        >

          <span
            class="text-xs font-semibold text-green-400"
          >
            Currently Airing
          </span>

        </div>


        <!-- BUTTONS -->

        <div
          class="flex flex-wrap gap-3 pt-3"
        >

          <button
            class="watch-btn bg-pink-700 border border-black text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            WATCH
          </button>


          <button
            class="download-btn bg-transparent border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white hover:text-black transition"
          >
            DOWNLOAD
          </button>

        </div>

      </div>

    `;

  } else {


    /* =========================================================
       FAN FAVORITES + TOP PICKS CARD
========================================================= */

    card.innerHTML = `

      <!-- IMAGE -->

      <div
        class="relative overflow-hidden rounded-2xl"
      >

       <img
  src="${image}"
  alt="${title}"
  class="w-full h-[320px] sm:h-[250px] md:h-[290px] object-cover transition duration-500 group-hover:scale-105"
  loading="lazy"
>


        <!-- RATING -->

        <div
          class="absolute top-3 left-3"
        >

          <span
            class="bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
          >

            ⭐ ${score}

          </span>

        </div>


        <!-- TYPE -->

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


      <!-- CONTENT -->

      <div
        class="mt-4 space-y-3"
      >


        <!-- GENRES -->

        <div>

          <span
            class="inline-block bg-indigo-600 text-white text-xs px-3 py-1 rounded-full"
          >

            ${genres}

          </span>

        </div>


        <!-- TITLE -->

        <h3
          class="text-xl font-bold text-white line-clamp-2"
        >

          ${title}

        </h3>


        <!-- EPISODES -->

        <p
          class="text-xs text-pink-400 font-semibold"
        >

          ${episodes}

        </p>


        <!-- DESCRIPTION -->

        <p
          class="text-xs md:text-sm leading-6 text-slate-300 line-clamp-3"
        >

          ${description}

        </p>


        <!-- BUTTONS -->

        <div
          class="flex flex-wrap gap-3 pt-3"
        >

          <button
            class="watch-btn bg-pink-700 border border-black text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-black hover:text-white transition"
          >
            WATCH
          </button>


          <button
            class="download-btn bg-transparent border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white hover:text-black transition"
          >
            DOWNLOAD
          </button>

        </div>

      </div>

    `;

  }


  /* =========================================================
     WATCH
========================================================= */

  const watchButton =
    card.querySelector(
      ".watch-btn"
    );


  watchButton.addEventListener(
    "click",
    function () {

      if (localPage) {

        window.location.href =
          localPage;

      } else {

        alert(
          `${title} has not been added to the Danimeverse watch system yet.`
        );

      }

    }
  );


  /* =========================================================
     DOWNLOAD
========================================================= */

  const downloadButton =
    card.querySelector(
      ".download-btn"
    );


  downloadButton.addEventListener(
    "click",
    function () {

      alert(
        `Download links for ${title} will be available when this anime is added to the Danimeverse watch system.`
      );

    }
  );


  return card;

}


/* =========================================================
   RENDER 12 ANIME
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


  container.innerHTML =
    "";


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
   START
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
   RUN
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    loadHomepageAnime
  );

} else {

  loadHomepageAnime();

}