console.log("ADMIN JS LOADED");

const ANILIST_API = "https://graphql.anilist.co";

const QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 10) {
    media(search: $search, type: ANIME) {
      idMal
      title {
        romaji
        english
        native
      }
      format
      startDate {
        year
      }
      episodes
      coverImage {
        medium
      }
    }
  }
}
`;

document.addEventListener("DOMContentLoaded", function () {

  console.log("ADMIN READY");

  const input = document.getElementById("animeSearch");
  const results = document.getElementById("searchResults");

  if (!input || !results) {
    console.error("ADMIN SEARCH ELEMENTS NOT FOUND");
    return;
  }

  console.log("ADMIN SEARCH FOUND");

  let timer;

  input.addEventListener("input", function () {

    clearTimeout(timer);

    const query = input.value.trim();

    if (!query) {
      results.innerHTML = "";
      results.style.display = "none";
      return;
    }

    results.style.display = "block";

    results.innerHTML = `
      <div style="padding:12px;text-align:center;color:#94a3b8">
        Searching AniList...
      </div>
    `;

    timer = setTimeout(async function () {

      console.log("SEARCHING:", query);

      try {

        const response = await fetch(
          ANILIST_API,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              query: QUERY,
              variables: {
                search: query
              }
            })
          }
        );

        const json = await response.json();

        console.log("ANILIST RESPONSE:", json);

        const animeList =
          json.data?.Page?.media || [];
        console.log("ANIME RESULTS:", animeList);
        console.log("ANIME COUNT:", animeList.length);

        if (!animeList.length) {

          results.innerHTML = `
            <div style="padding:12px;text-align:center;color:#94a3b8">
              No anime found.
            </div>
          `;

          return;
        }

        results.innerHTML = animeList
          .filter(function (anime) {
            return anime.idMal;
          })
          .map(function (anime) {

            const title =
              anime.title?.english ||
              anime.title?.romaji ||
              anime.title?.native ||
              "Unknown";

            const image =
              anime.coverImage?.medium ||
              "";

            const type =
              anime.format ||
              "Anime";

            const year =
              anime.startDate?.year ||
              "";

            const episodes =
              anime.episodes ||
              "?";

            return `
              <div
                class="search-result-item"
                data-mal-id="${anime.idMal}"
                data-title="${title.replace(/"/g, "&quot;")}"
                data-image="${image}"
                data-type="${type}"
                data-year="${year}"
              >

                <img
                  src="${image}"
                  alt="${title}"
                  style="
                    width:40px;
                    height:54px;
                    object-fit:cover;
                    border-radius:6px;
                  "
                >

                <div class="info">

                  <h4>${title}</h4>

                  <p>
                    ${type}
                    ${year ? " · " + year : ""}
                    ${episodes !== "?" ? " · " + episodes + " eps" : ""}
                  </p>

                  <span style="font-size:10px;color:#ec4899">
                    ▶ Select Anime
                  </span>

                </div>

              </div>
            `;

          })
          .join("");

      } catch (error) {

        console.error(
          "ANILIST SEARCH ERROR:",
          error
        );

        results.innerHTML = `
          <div style="padding:12px;text-align:center;color:#ef4444">
            Search failed.
          </div>
        `;

      }

    }, 400);

  });

  results.addEventListener("click", function (event) {

    const item =
      event.target.closest(".search-result-item");

    if (!item) {
      return;
    }

    const malId =
      item.dataset.malId;

    const title =
      item.dataset.title;

    const image =
      item.dataset.image;

    const type =
      item.dataset.type;

    const year =
      item.dataset.year;

    console.log(
      "SELECTED ANIME:",
      title,
      malId
    );

    window.selectedAnime = {
      malId: malId,
      title: title,
      image: image,
      type: type,
      year: year
    };

    const card =
      document.getElementById("selectedAnimeCard");

    const poster =
      document.getElementById("selectedPoster");

    const selectedTitle =
      document.getElementById("selectedTitle");

    const meta =
      document.getElementById("selectedMeta");

    const slug =
      document.getElementById("selectedSlug");

    if (card) {
      card.style.display = "flex";
    }

    if (poster) {
      poster.src = image;
    }

    if (selectedTitle) {
      selectedTitle.textContent = title;
    }

    if (meta) {
      meta.textContent =
        type +
        (year ? " · " + year : "") +
        " · MAL ID: " +
        malId;
    }

    if (slug) {
      slug.textContent =
        "MAL ID: " +
        malId;
    }

    results.style.display = "none";

    window.dispatchEvent(
      new CustomEvent(
        "danimeverseAnimeSelected",
        {
          detail: {
            malId: malId,
            title: title,
            image: image,
            type: type,
            year: year
          }
        }
      )
    );

  });

});