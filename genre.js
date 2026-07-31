document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);

  const genre = params.get("genre");
  const genreId = params.get("id");

  const genreTitle = document.getElementById("genreTitle");
  const animeContainer = document.getElementById("genreAnimeContainer");

  // Check if genre exists
  if (!genre || !genreId) {

    genreTitle.textContent = "Genre Not Found";

    animeContainer.innerHTML = `
      <p class="text-slate-400 col-span-full text-center">
        No genre was selected.
      </p>
    `;

    return;
  }

  // Format genre name
  const formattedGenre =
    genre.charAt(0).toUpperCase() + genre.slice(1).replace("-", " ");

  // Update page title
  genreTitle.textContent = `${formattedGenre} Anime`;

  // =========================
  // PAGINATION SETTINGS
  // =========================

  let currentPage = 1;

  const limit = 24;

  let isLoading = false;

  let hasMore = true;


  // =========================
  // CREATE LOAD MORE BUTTON
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

  // Put button below the anime grid
  const buttonWrapper = document.createElement("div");

  buttonWrapper.className =
    "flex justify-center pb-16";

  buttonWrapper.appendChild(loadMoreButton);

  animeContainer.parentNode.appendChild(buttonWrapper);


  // =========================
  // LOAD ANIME
  // =========================

  async function loadAnime(page) {

    if (isLoading || !hasMore) return;

    isLoading = true;

    loadMoreButton.textContent = "Loading...";
    loadMoreButton.disabled = true;


    // Show loading message only on first load
    if (page === 1) {

      animeContainer.innerHTML = `
        <p class="text-slate-400 col-span-full text-center">
          Loading ${formattedGenre} anime...
        </p>
      `;

    }


    try {

      const apiUrl =
        `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&page=${page}&limit=${limit}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch anime");
      }

      const result = await response.json();

      const animeList = result.data || [];


      // =========================
      // CHECK IF RESULTS EXIST
      // =========================

      if (page === 1 && animeList.length === 0) {

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
      // ADD ANIME CARDS
      // =========================

      animeList.forEach(anime => {

        const card = document.createElement("div");

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


        card.innerHTML = `

          <img
            src="${
              anime.images?.jpg?.large_image_url ||
              anime.images?.jpg?.image_url ||
              ""
            }"
            alt="${anime.title}"
            class="w-full h-64 object-cover"
            loading="lazy"
          >

          <div class="p-4">

            <h3 class="text-white font-semibold text-base line-clamp-2">
              ${anime.title}
            </h3>

            <p class="text-sm text-slate-400 mt-2">
              ${anime.type || "Anime"}
              ${anime.score ? ` • ⭐ ${anime.score}` : ""}
            </p>

          </div>

        `;


        // =========================
        // CLICK ANIME
        // =========================

        card.addEventListener("click", () => {

          window.location.href =
            `watch.html?id=${anime.mal_id}`;

        });


        animeContainer.appendChild(card);

      });


      // =========================
      // CHECK FOR MORE RESULTS
      // =========================

      if (
        !result.pagination ||
        !result.pagination.has_next_page ||
        animeList.length < limit
      ) {

        hasMore = false;

        buttonWrapper.remove();

      } else {

        currentPage++;

        loadMoreButton.textContent = "Load More";

        loadMoreButton.disabled = false;

      }


    } catch (error) {

      console.error("Genre API Error:", error);


      if (page === 1) {

        animeContainer.innerHTML = `
          <p class="text-red-400 col-span-full text-center">
            Failed to load anime.
            Please refresh the page and try again.
          </p>
        `;

      }


      loadMoreButton.textContent = "Load More";

      loadMoreButton.disabled = false;

    }


    isLoading = false;

  }


  // =========================
  // LOAD MORE CLICK
  // =========================

  loadMoreButton.addEventListener("click", () => {

    loadAnime(currentPage);

  });


  // =========================
  // INITIAL LOAD
  // =========================

  loadAnime(currentPage);

});