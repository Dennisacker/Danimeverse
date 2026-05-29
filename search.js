/* =========================
   SEARCH SYSTEM API
========================= */

document.addEventListener("DOMContentLoaded", () => {

  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  if (!searchInput || !searchResults) return;

  searchInput.addEventListener("input", async () => {

    const query = searchInput.value.trim();

    if (!query) {
      searchResults.classList.add("hidden");
      searchResults.innerHTML = "";
      return;
    }

    try {

      const response = await fetch(
        `https://api.jikan.moe/v4/anime?q=${query}&limit=8`
      );

      const data = await response.json();

      searchResults.classList.remove("hidden");

      if (!data.data || data.data.length === 0) {

        searchResults.innerHTML = `
          <p class="p-3 text-gray-300">
            No anime found
          </p>
        `;

        return;
      }

      searchResults.innerHTML = "";

      data.data.forEach(anime => {

        searchResults.innerHTML += `

          <a
            href="#"
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition"
          >

            <img
              src="${anime.images.jpg.image_url}"
              class="w-12 h-16 object-cover rounded-lg"
            />

            <div>

              <h4 class="text-sm font-semibold text-white">
                ${anime.title}
              </h4>

              <p class="text-xs text-slate-400">
                ${anime.type || "Anime"}
              </p>

            </div>

          </a>

        `;

      });

    } catch (error) {

      console.log("Search API Error:", error);

    }

  });

});