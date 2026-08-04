console.log("🔥 NEW GENRE.JS IS RUNNING");
document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);

  const genre = params.get("genre");

  const genreTitle = document.getElementById("genreTitle");
  const animeContainer = document.getElementById("genreAnimeContainer");

  // =========================
  // CHECK GENRE
  // =========================

  if (!genre) {

    genreTitle.textContent = "Genre Not Found";

    animeContainer.innerHTML = `
      <p class="text-slate-400 col-span-full text-center">
        No genre was selected.
      </p>
    `;

    return;
  }


  
  // =========================
  // ANILIST GENRE MAPPING
  // =========================

  const genreMap = {
    action: "Action",
    adventure: "Adventure",
    fantasy: "Fantasy",
    "sci-fi": "Sci-Fi",
    supernatural: "Supernatural",
    thriller: "Thriller"
  };


  // =========================
  // SPECIAL GENRE / TAG MAPPING
  // =========================

  const tagMap = {
    isekai: "Isekai",
    superhero: "Super Power"
  };


  // =========================
  // FORMAT DISPLAY NAME
  // =========================

  const formattedGenre =
    genre === "sci-fi"
      ? "Sci-Fi"
      : genre
          .split("-")
          .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join(" ");


  genreTitle.textContent = `${formattedGenre} Anime`;


  // =========================
  // GET GENRE OR TAG
  // =========================

  const anilistGenre = genreMap[genre];
  const anilistTag = tagMap[genre];
  


  // =========================
  // PAGINATION
  // =========================

  let currentPage = 1;

  const limit = 24;

  let isLoading = false;

  let hasMore = true;


  // =========================
  // LOAD MORE BUTTON
  // =========================

  const loadMoreButton = document.createElement("button");

  loadMoreButton.textContent = "Load More";

  loadMoreButton.className = `
    mt-10
    px-6
    py-3
    rounded-full
    bg-pink-500
    hover:bg-pink-600
    text-white
    font-semibold
    transition
    duration-300
    hover:scale-105
  `;


  const buttonWrapper = document.createElement("div");

  buttonWrapper.className =
    "flex justify-center pb-16";

  buttonWrapper.appendChild(loadMoreButton);

  animeContainer.parentNode.appendChild(buttonWrapper);


  // =========================
  // ANILIST GRAPHQL QUERY
  // =========================

  const query = `
    query (
      $genre: String,
      $tag: String,
      $page: Int,
      $perPage: Int
    ) {

      Page(
        page: $page
        perPage: $perPage
      ) {

        pageInfo {
          hasNextPage
        }

        media(
          type: ANIME
          genre: $genre
          tag: $tag
          sort: SCORE_DESC
        ) {

          id

          idMal

          title {
            romaji
            english
            native
          }

          coverImage {
            large
            extraLarge
          }

          bannerImage

          description

          type

          averageScore

          episodes

          status

          genres

        }

      }

    }
  `;


  // =========================
  // LOAD ANIME
  // =========================

  async function loadAnime(page) {

    if (isLoading || !hasMore) return;

    isLoading = true;

    loadMoreButton.textContent = "Loading...";

    loadMoreButton.disabled = true;


    // =========================
    // FIRST PAGE LOADING
    // =========================

    if (page === 1) {

      animeContainer.innerHTML = `
        <p class="text-slate-400 col-span-full text-center">
          Loading ${formattedGenre} anime...
        </p>
      `;

    }


    try {

      console.log(
        `🔥 Loading ${formattedGenre} anime from AniList...`
      );


      // =========================
      // SEND GRAPHQL REQUEST
      // =========================

      const response = await fetch(
        "https://graphql.anilist.co",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },

          body: JSON.stringify({

            query: query,

             
            variables: {

              genre: anilistGenre || null,

              tag: anilistTag || null,

              page: page,

              perPage: limit

            }
            


          })

        }
      );


      // =========================
      // CHECK RESPONSE
      // =========================

      if (!response.ok) {

        throw new Error(
          `AniList API Error: ${response.status} ${response.statusText}`
        );

      }


      const result = await response.json();


      // =========================
      // CHECK GRAPHQL ERRORS
      // =========================

      if (result.errors) {

        console.error(
          "AniList GraphQL Error:",
          result.errors
        );

        throw new Error(
          "AniList returned an error"
        );

      }


      const pageData = result.data.Page;

      const animeList = pageData.media || [];


      // =========================
      // NO RESULTS
      // =========================

      if (
        page === 1 &&
        animeList.length === 0
      ) {

        animeContainer.innerHTML = `
          <p class="text-slate-400 col-span-full text-center">
            No anime found for this genre.
          </p>
        `;

        hasMore = false;

        buttonWrapper.remove();

        return;

      }


      // =========================
      // REMOVE LOADING MESSAGE
      // =========================

      if (page === 1) {

        animeContainer.innerHTML = "";

      }


      // =========================
      // CREATE ANIME CARDS
      // =========================

      animeList.forEach(anime => {

        const card = document.createElement("div");


        // SAME CARD STYLE
        card.className = `
          glass-card
          rounded-2xl
          overflow-hidden
          cursor-pointer
          transition
          duration-300
          hover:-translate-y-2
          hover:shadow-glow
        `;


        // =========================
        // ANIME TITLE
        // =========================

        const animeTitle =
          anime.title.english ||
          anime.title.romaji ||
          anime.title.native ||
          "Unknown Anime";


        // =========================
        // ANIME IMAGE
        // =========================

        const animeImage =
          anime.coverImage?.extraLarge ||
          anime.coverImage?.large ||
          "";


        // =========================
        // CREATE CARD
        // =========================

        card.innerHTML = `

          <img
            src="${animeImage}"
            alt="${animeTitle}"
            class="w-full h-64 object-cover"
            loading="lazy"
          >

          <div class="p-4">

            <h3 class="text-white font-semibold text-base line-clamp-2">
              ${animeTitle}
            </h3>

            <p class="text-sm text-slate-400 mt-2">

              ${anime.type || "Anime"}

              ${
                anime.averageScore
                  ? ` • ⭐ ${(anime.averageScore / 10).toFixed(1)}`
                  : ""
              }

            </p>

          </div>

        `;


        // =========================
        // CLICK ANIME
        // =========================

        card.addEventListener("click", () => {

          const animeTitle =
            anime.title.english ||
            anime.title.romaji ||
            anime.title.native ||
            "Unknown Anime";

          const params = new URLSearchParams();

          // AniList ID (used for anime details)
          if (anime.id) {
            params.set("anilistId", anime.id);
          }

          // MAL ID (used for Firebase episodes)
          if (anime.idMal) {
            params.set("malId", anime.idMal);
          }

          params.set("anime", animeTitle);

          window.location.href = `anime.html?${params.toString()}`;

        });

        // =========================
        // ADD CARD
        // =========================

        animeContainer.appendChild(card);

      });


      // =========================
      // CHECK MORE RESULTS
      // =========================

      if (
        !pageData.pageInfo ||
        !pageData.pageInfo.hasNextPage
      ) {

        hasMore = false;

        buttonWrapper.remove();

      } else {

        currentPage++;

        loadMoreButton.textContent =
          "Load More";

        loadMoreButton.disabled =
          false;

      }


    } catch (error) {

      console.error(
        "AniList API Error:",
        error
      );


      if (page === 1) {

        animeContainer.innerHTML = `

          <div class="col-span-full text-center">

            <p class="text-red-400">
              Failed to load anime.
            </p>

            <button
              id="retryGenre"
              class="mt-4 px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition"
            >
              Try Again
            </button>

          </div>

        `;


        const retryButton =
          document.getElementById("retryGenre");


        if (retryButton) {

          retryButton.addEventListener(
            "click",
            () => {

              hasMore = true;

              loadAnime(1);

            }
          );

        }

      }


      loadMoreButton.textContent =
        "Load More";

      loadMoreButton.disabled =
        false;

    }


    isLoading = false;

  }


  // =========================
  // LOAD MORE CLICK
  // =========================

  loadMoreButton.addEventListener(
    "click",
    () => {

      loadAnime(currentPage);

    }
  );


  // =========================
  // INITIAL LOAD
  // =========================

  loadAnime(currentPage);

});