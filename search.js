
console.log("SEARCH.JS LOADED");


function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function isOnSite(title) {

  var siteTitles = [
    "naruto",
    "attack on titan",
    "shingeki no kyojin",
    "demon slayer",
    "kimetsu no yaiba",
    "jujutsu kaisen",
    "chainsaw man",
    "fire force",
    "dr. stone",
    "re:zero",
    "mushoku tensei",
    "my hero academia",
    "assassination classroom",
    "fate/strange fake",
    "frieren",
    "hell's paradise",
    "oshi no ko",
    "solo leveling",
    "tokyo revengers",
    "witch hat atelier"
  ];

  var text = String(title || "")
    .toLowerCase()
    .trim();

  if (!text) {
    return false;
  }

  for (var i = 0; i < siteTitles.length; i++) {

    if (
      text === siteTitles[i] ||
      text.indexOf(siteTitles[i]) !== -1 ||
      siteTitles[i].indexOf(text) !== -1
    ) {
      return true;
    }

  }

  return false;
}


async function searchAnime(query) {

  console.log(
    "SEARCHING:",
    query
  );

  var url =
    "/api/anime?search=" +
    encodeURIComponent(query);

  var response =
    await fetch(url);

  console.log(
    "API STATUS:",
    response.status
  );

  if (!response.ok) {

    throw new Error(
      "API HTTP " +
      response.status
    );

  }

  var result =
    await response.json();

  console.log(
    "API RESULT:",
    result
  );

  if (
    !result.success ||
    !result.data
  ) {

    throw new Error(
      result.error ||
      "Search failed"
    );

  }

  return result.data;

}


function normalizeResults(data) {

  if (Array.isArray(data)) {
    return data;
  }

  if (data) {
    return [data];
  }

  return [];

}


function createResult(anime) {

  var title =
    anime.title ||
    "Unknown Anime";

  var nativeTitle =
    anime.nativeTitle ||
    "";

  var poster =
    anime.poster ||
    "";

  var year =
    anime.year ||
    "";

  var type =
    anime.format ||
    anime.type ||
    "Anime";

  var malId =
    anime.malId ||
    anime.idMal ||
    "";

  var anilistId =
    anime.anilistId ||
    "";


  /*
  =========================================================
  IMPORTANT

  ALWAYS OPEN THE SAME ANIME PAGE AS HOMEPAGE SEARCH/CARDS

  We use AniList ID as the primary identifier.
  MAL ID is also included for Firebase episode matching.
  =========================================================
  */

  var href =
    "watch.html?anilistId=" +
    encodeURIComponent(anilistId) +
    "&malId=" +
    encodeURIComponent(malId) +
    "&anime=" +
    encodeURIComponent(title);


  var badge =
    isOnSite(title)
      ? "ON SITE"
      : "VIEW";


  return (

    '<a href="' +
    href +
    '" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition">' +

      (
        poster

        ?

        '<img src="' +
        escapeHtml(poster) +
        '" alt="' +
        escapeHtml(title) +
        '" class="w-12 h-16 object-cover rounded-lg flex-shrink-0" loading="lazy">'

        :

        '<div class="w-12 h-16 rounded-lg bg-white/5 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">N/A</div>'
      )

      +

      '<div class="min-w-0 flex-1">' +

        '<h4 class="text-sm font-semibold text-white truncate">' +
        escapeHtml(title) +
        '</h4>' +

        (
          nativeTitle

          ?

          '<p class="text-[11px] text-slate-500 truncate">' +
          escapeHtml(nativeTitle) +
          '</p>'

          :

          ''
        )

        +

        '<p class="text-xs text-slate-400 mt-1">' +
        escapeHtml(type) +

        (
          year
            ? " · " + escapeHtml(year)
            : ""
        )

        +

        '</p>' +

        '<span class="inline-block mt-1 text-[10px] bg-pink-600 text-white px-2 py-0.5 rounded-full">' +
        badge +
        '</span>' +

      '</div>' +

    '</a>'

  );

}

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "INITIALIZING SEARCH"
    );


    var searchInput =
      document.getElementById(
        "searchInput"
      );


    var searchResults =
      document.getElementById(
        "searchResults"
      );


    if (
      !searchInput ||
      !searchResults
    ) {

      console.error(
        "SEARCH ELEMENTS NOT FOUND"
      );

      return;

    }


    console.log(
      "SEARCH ELEMENTS FOUND"
    );


    var timer = null;

    var requestNumber = 0;


    searchInput.addEventListener(
      "input",
      function() {

        clearTimeout(timer);


        var query =
          searchInput.value.trim();


        if (!query) {

          searchResults.innerHTML =
            "";

          searchResults.classList.add(
            "hidden"
          );

          return;

        }


        if (query.length < 2) {

          searchResults.innerHTML =
            '<p class="text-xs text-slate-400 text-center p-4">Type at least 2 characters...</p>';

          searchResults.classList.remove(
            "hidden"
          );

          return;

        }


        searchResults.innerHTML =
          '<p class="text-xs text-slate-400 text-center p-4">Searching...</p>';


        searchResults.classList.remove(
          "hidden"
        );


        timer =
          setTimeout(
            async function() {

              var currentRequest =
                ++requestNumber;


              try {

                var data =
                  await searchAnime(
                    query
                  );


                if (
                  currentRequest !==
                  requestNumber
                ) {

                  return;

                }


                var results =
                  normalizeResults(
                    data
                  );


                console.log(
                  "NORMALIZED RESULTS:",
                  results
                );


                if (
                  results.length === 0
                ) {

                  searchResults.innerHTML =
                    '<p class="text-sm text-slate-400 text-center p-5">No anime found.</p>';

                  return;

                }


                var html =
                  '<div class="px-3 pt-3 pb-1">' +
                  '<p class="text-[10px] font-bold uppercase tracking-widest text-pink-500">' +
                  "SEARCH RESULTS" +
                  "</p>" +
                  "</div>";


                for (
                  var i = 0;
                  i < results.length;
                  i++
                ) {

                  html +=
                    createResult(
                      results[i]
                    );

                }


                searchResults.innerHTML =
                  html;


                searchResults.classList.remove(
                  "hidden"
                );


                console.log(
                  "SEARCH DISPLAYED:",
                  results.length
                );


              } catch (error) {

                console.error(
                  "SEARCH ERROR:",
                  error
                );


                searchResults.innerHTML =
                  '<p class="text-xs text-red-400 text-center p-4">Search is temporarily unavailable.</p>';

              }

            },
            400
          );

      }
    );


    document.addEventListener(
      "click",
      function(event) {

        if (
          !searchResults.contains(
            event.target
          ) &&
          event.target !==
            searchInput
        ) {

          searchResults.classList.add(
            "hidden"
          );

        }

      }
    );


    searchInput.addEventListener(
      "focus",
      function() {

        if (
          searchInput.value.trim()
        ) {

          searchResults.classList.remove(
            "hidden"
          );

        }

      }
    );

  }
);

