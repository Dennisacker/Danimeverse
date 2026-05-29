fetch("https://api.jikan.moe/v4/top/anime")

.then(response => response.json())

.then(data => {

  const container = document.getElementById("animeContainer");

  data.data.slice(0, 12).forEach(anime => {

    container.innerHTML += `

    <article class="glass-card group relative overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-glow">

      <img
        src="${anime.images.jpg.large_image_url}"
        alt="${anime.title}"
        class="w-full h-[320px] object-cover rounded-2xl"
      />

      <div class="space-y-3 mt-4">

        <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
          ${anime.genres.slice(0,3).map(g => g.name).join(", ")}
        </span>

        <h3 class="text-xl font-semibold text-white">
          ${anime.title}
        </h3>

        <p class="text-xs md:text-sm leading-6 text-slate-300">
          ${
            anime.synopsis
            ? anime.synopsis.substring(0, 120) + "..."
            : "No description available."
          }
        </p>

        <div class="flex flex-wrap gap-3 pt-3">

          <!-- WATCH -->
          <button class="bg-pink-700 border border-black text-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition">
            WATCH
          </button>

          <!-- DOWNLOAD -->
          <button class="bg-transparent border border-black text-black px-4 py-2 rounded-full hover:bg-white hover:text-black transition">
            DOWNLOAD
          </button>

        </div>

      </div>

    </article>

    `;

  });

})

.catch(error => {
  console.log("API Error:", error);
});
/* =========================
   TOP PICKS API
========================= */

fetch("https://api.jikan.moe/v4/seasons/now")

.then(response => response.json())

.then(data => {

  const container = document.getElementById("topPicksAPI");

  const excludedAnime = [
    "Naruto",
    "Attack on Titan",
    "Frieren: Beyond Journey's End",
    "Assassination Classroom",
    "Jujutsu Kaisen",
    "Witch Hat Atelier"
  ];

 data.data
  .filter(anime =>
    !anime.title.toLowerCase().includes("re:zero") &&
    !anime.title.toLowerCase().includes("dr. stone")
  )
  .slice(0, 6)
  .forEach(anime => {

      container.innerHTML += `

      <article class="glass-card overflow-hidden rounded-[2rem] p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow">

        <img
          src="${anime.images.jpg.large_image_url}"
          alt="${anime.title_english}"
          class="mb-4 h-48 md:h-64 w-full rounded-[1.5rem] object-cover"
        />

        <div class="bg-gray-900 rounded-xl shadow-lg p-3 md:p-4 text-white">

          <!-- TITLE -->
          <h3 class="text-xl md:text-2xl font-bold mb-2">
            ${anime.title_english
             .replace("Season 4: The Second Year at Tokyo Metropolitan Advanced Nurturing High School", "Season 4")
      .replace("2nd Season Part 2", "Season 2 Part 2")
      .replace("Shingeki no Kyojin", "Attack on Titan")
      .replace("Sousou no Frieren", "Frieren")
      .replace("Re:Zero kara Hajimeru Isekai Seikatsu", "Re:Zero")
      .replace("Dr. Stone", "Dr Stone")
  }
          </h3>

          <!-- TAGS -->
          <div class="flex flex-wrap items-center gap-3 mb-4">

            <span class="bg-pink-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              ${anime.score || "N/A"}/10
            </span>

            <span class="bg-purple-700 text-white text-xs px-3 py-1 rounded-full">
              ${anime.status}
            </span>

            <span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
              ${anime.genres.slice(0,2).map(g => g.name).join(", ")}
            </span>

          </div>

          <!-- BUTTONS -->
          <div class="flex space-x-4">

            <button class="bg-pink-700 border border-black text-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition">
              WATCH
            </button>

            <button class="bg-transparent border border-black text-black px-4 py-2 rounded-full hover:bg-white hover:text-black transition">
              DOWNLOAD
            </button>

          </div>

        </div>

      </article>

      `;

    });

})

.catch(error => {
  console.log("Top Picks API Error:", error);
});