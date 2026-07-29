// =====================================================
// DANIMEVERSE — GENRE PAGE
// Only runs on genre.html
// =====================================================

// Make sure this script does NOT run on index.html
const title = document.getElementById("genreTitle");
const container = document.getElementById("genreAnimeContainer");

// Stop immediately if this is not the genre page
if (!title || !container) {
  console.log("Genre page not detected. genre.js stopped.");
} else {

  // Get genre information from URL
  const params = new URLSearchParams(window.location.search);

  const genreName = params.get("genre");
  const genreId = params.get("id");

  // Format genre name
  const formattedGenre = genreName
    ? genreName
        .replace(/-/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase())
    : "Anime";


  // Set page title
  title.textContent = `${formattedGenre} Anime`;


  // Load anime
  async function loadGenreAnime() {

    if (!genreId) {

      container.innerHTML = `
        <p class="col-span-full text-center text-red-400">
          Genre not found.
        </p>
      `;

      return;
    }


    container.innerHTML = `
      <div class="col-span-full text-center py-16">
        <p class="text-slate-400 animate-pulse">
          Loading ${formattedGenre} anime...
        </p>
      </div>
    `;


    try {

      const response = await fetch(
        `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&limit=12`
      );


      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }


      const data = await response.json();

      const animeList = data.data || [];


      if (!animeList.length) {

        container.innerHTML = `
          <p class="col-span-full text-center text-slate-400">
            No anime found in this genre.
          </p>
        `;

        return;
      }


      container.innerHTML = animeList.map(anime => {

        const animeTitle =
          anime.title_english ||
          anime.title ||
          "Unknown Anime";


        const image =
          anime.images?.jpg?.large_image_url ||
          anime.images?.jpg?.image_url ||
          "https://via.placeholder.com/400x600?text=No+Image";


        const score =
          anime.score
            ? anime.score.toFixed(1)
            : "N/A";


        const genres =
          anime.genres
            ?.slice(0, 3)
            .map(g => g.name)
            .join(", ") ||
          "Unknown";


        return `
          <article
            class="glass-card group overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-glow"
          >

            <img
              src="${image}"
              alt="${animeTitle}"
              class="w-full h-[320px] object-cover rounded-2xl"
              loading="lazy"
            />


            <div class="space-y-3 mt-4">

              <div class="flex flex-wrap gap-2">

                <span class="bg-pink-600 text-white text-xs px-3 py-1 rounded-full">
                  ⭐ ${score}
                </span>

                <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                  ${genres}
                </span>

              </div>


              <h3 class="text-xl font-semibold text-white">
                ${animeTitle}
              </h3>


              <div class="pt-3">

                <a
                  href="anime.html?malId=${anime.mal_id}"
                  class="inline-block bg-pink-700 text-white px-5 py-2 rounded-full hover:bg-pink-500 transition text-sm font-semibold"
                >
                  ▶ Episodes
                </a>

              </div>

            </div>

          </article>
        `;

      }).join("");


    } catch (error) {

      console.error("Genre API Error:", error);

      container.innerHTML = `
        <div class="col-span-full text-center py-16">

          <p class="text-red-400">
            ⚠️ Unable to load anime right now.
          </p>

          <button
            onclick="location.reload()"
            class="mt-4 bg-pink-600 text-white px-5 py-2 rounded-full"
          >
            Try Again
          </button>

        </div>
      `;

    }

  }


  // Start loading
  loadGenreAnime();

}