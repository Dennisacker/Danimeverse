/* =========================================================
   DANIMEVERSE - UNIVERSAL ANIME NAVIGATION
   Works with:
   - AniList anime objects
   - Jikan / MyAnimeList anime objects
   - Homepage API cards
   - Search results
   - Genre pages
   - Watchlist
   - Fresh Episodes
========================================================= */

function openAnime(anime) {

  if (!anime) {
    console.error("❌ Cannot open anime: Anime data is missing.");
    return;
  }

  /*
  =========================================================
  GET ANILIST ID
  =========================================================
  AniList:
    anime.id

  Jikan:
    anime.anilist_id (if available)
  */

  const anilistId =
    anime.id ||
    anime.anilist_id ||
    null;


  /*
  =========================================================
  GET MAL ID
  =========================================================
  AniList:
    anime.idMal

  Jikan:
    anime.mal_id
  */

  const malId =
    anime.idMal ||
    anime.mal_id ||
    null;


  /*
  =========================================================
  GET ANIME TITLE
  =========================================================
  AniList:
    anime.title.english
    anime.title.romaji
    anime.title.native

  Jikan:
    anime.title_english
    anime.title
  */

  const animeTitle =
    anime.title?.english ||
    anime.title_english ||
    anime.title?.romaji ||
    anime.title?.native ||
    anime.title ||
    "Unknown Anime";


  /*
  =========================================================
  VALIDATION
  =========================================================
  We need at least one usable ID.

  AniList anime:
    anilistId available

  Jikan anime:
    malId available
  */

  if (!anilistId && !malId) {

    console.error(
      "❌ Cannot open anime: Missing AniList ID and MAL ID.",
      anime
    );

    alert(
      `${animeTitle} could not be opened because its anime ID is missing.`
    );

    return;

  }


  /*
  =========================================================
  CREATE WATCH PAGE URL
  =========================================================
  Universal destination:

  watch.html

  Example:

  watch.html?anilistId=123&malId=456&anime=Naruto&ep=1
  */

  const params =
    new URLSearchParams();


  /*
  Add AniList ID
  */

  if (anilistId) {

    params.set(
      "anilistId",
      anilistId
    );

  }


  /*
  Add MAL ID
  */

  if (malId) {

    params.set(
      "malId",
      malId
    );

  }


  /*
  Add anime title
  */

  params.set(
    "anime",
    animeTitle
  );


  /*
  Always start at Episode 1
  */

  params.set(
    "ep",
    "1"
  );


  /*
  =========================================================
  NAVIGATE
  =========================================================
  Every anime card across Danimeverse
  eventually comes here.
  */

  console.log(
    "🎬 Opening anime:",
    {
      title: animeTitle,
      anilistId: anilistId,
      malId: malId
    }
  );


  window.location.href =
    `watch.html?${params.toString()}`;

}