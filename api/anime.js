// api/anime.js

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      id,
      idMal,
      search
    } = req.query;

    // =====================================================
    // VALIDATE REQUEST
    // =====================================================

    if (!id && !idMal && !search) {
      return res.status(400).json({
        error: "Missing id, idMal, or search parameter"
      });
    }

    // =====================================================
    // 1. TRY KITSU FIRST
    // =====================================================

    try {
      const kitsuResult = await fetchFromKitsu({
        id,
        idMal,
        search
      });

      if (kitsuResult) {
        console.log("✅ Anime data loaded from Kitsu");

        return res.status(200).json({
          success: true,
          provider: "kitsu",
          data: kitsuResult
        });
      }

      console.log("⚠️ Kitsu returned no result");

    } catch (error) {
      console.error(
        "❌ Kitsu failed:",
        error.message
      );
    }


    // =====================================================
    // 2. TRY ANILIST SECOND
    // =====================================================

    try {
      const anilistResult = await fetchFromAniList({
        id,
        idMal,
        search
      });

      if (anilistResult) {
        console.log("✅ Anime data loaded from AniList");

        return res.status(200).json({
          success: true,
          provider: "anilist",
          data: anilistResult
        });
      }

      console.log("⚠️ AniList returned no result");

    } catch (error) {
      console.error(
        "❌ AniList failed:",
        error.message
      );
    }


    // =====================================================
    // 3. TRY JIKAN LAST
    // =====================================================

    try {
      const jikanResult = await fetchFromJikan({
        id,
        idMal,
        search
      });

      if (jikanResult) {
        console.log("✅ Anime data loaded from Jikan");

        return res.status(200).json({
          success: true,
          provider: "jikan",
          data: jikanResult
        });
      }

      console.log("⚠️ Jikan returned no result");

    } catch (error) {
      console.error(
        "❌ Jikan failed:",
        error.message
      );
    }


    // =====================================================
    // NO API FOUND THE ANIME
    // =====================================================

    return res.status(404).json({
      success: false,
      error: "Anime not found",
      message: "All anime APIs failed or returned no results."
    });


  } catch (error) {

    console.error(
      "❌ API Gateway Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });

  }
}



// =========================================================
// KITSU
// =========================================================

async function fetchFromKitsu({
  id,
  idMal,
  search
}) {

  let url;


  // -------------------------------------------------------
  // Search by Kitsu ID
  // -------------------------------------------------------

  if (id) {

    url =
      `https://kitsu.io/api/edge/anime/${encodeURIComponent(id)}`;

  }


  // -------------------------------------------------------
  // Search by MAL ID
  // -------------------------------------------------------

  else if (idMal) {

    url =
      `https://kitsu.io/api/edge/anime?filter[malId]=${encodeURIComponent(idMal)}`;

  }


  // -------------------------------------------------------
  // Search by title
  // -------------------------------------------------------

  else if (search) {

    url =
      `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(search)}&page[limit]=1`;

  }


  const response =
    await fetch(url, {
      headers: {
        "Accept": "application/vnd.api+json"
      }
    });


  if (!response.ok) {

    throw new Error(
      `Kitsu HTTP ${response.status}`
    );

  }


  const json =
    await response.json();


  let anime;


  // Single anime response
  if (id) {

    anime =
      json.data;

  }

  // Filtered collection response
  else {

    anime =
      json.data?.[0];

  }


  if (!anime) {

    return null;

  }


  const attributes =
    anime.attributes || {};


  const titles =
    attributes.titles || {};


  const poster =
    attributes.posterImage || {};


  const cover =
    attributes.coverImage || {};


  const genres =
    attributes.genres || [];


  // =======================================================
  // RETURN NORMALIZED FORMAT
  // =======================================================

  return {

    // IDs
    id:
      anime.id || null,

    anilistId:
      null,

    malId:
      attributes.malId || idMal || null,


    // Titles
    title:
      titles.en ||
      titles.en_jp ||
      titles.ja_jp ||
      attributes.canonicalTitle ||
      "Unknown Anime",

    nativeTitle:
      titles.ja_jp ||
      "",


    // Images
    poster:
      poster.original ||
      poster.large ||
      poster.medium ||
      "",

    banner:
      cover.original ||
      cover.large ||
      cover.medium ||
      "",


    // Information
    description:
      attributes.description ||
      "",

    rating:
      attributes.averageRating
        ? Number(attributes.averageRating)
        : null,

    status:
      attributes.status ||
      null,

    year:
      attributes.startDate
        ? Number(
            attributes.startDate.substring(0, 4)
          )
        : null,

    episodes:
      attributes.episodeCount ||
      null,

    type:
      attributes.subtype ||
      null,

    format:
      attributes.subtype ||
      null,

    source:
      null,


    // Genres
    genres:
      genres
        .map(
          genre =>
            genre.attributes?.name
        )
        .filter(Boolean)

  };

}



// =========================================================
// ANILIST
// =========================================================

async function fetchFromAniList({
  id,
  idMal,
  search
}) {

  let query;
  let variables;


  // -------------------------------------------------------
  // Search by AniList ID
  // -------------------------------------------------------

  if (id) {

    query = `
      query ($id: Int) {

        Media(
          id: $id
          type: ANIME
        ) {

          id
          idMal

          title {
            romaji
            english
            native
          }

          coverImage {
            extraLarge
            large
          }

          bannerImage

          description(
            asHtml: false
          )

          type
          format
          status
          averageScore
          episodes
          seasonYear
          source
          genres

        }

      }
    `;

    variables = {
      id: Number(id)
    };

  }


  // -------------------------------------------------------
  // Search by MAL ID
  // -------------------------------------------------------

  else if (idMal) {

    query = `
      query ($idMal: Int) {

        Media(
          idMal: $idMal
          type: ANIME
        ) {

          id
          idMal

          title {
            romaji
            english
            native
          }

          coverImage {
            extraLarge
            large
          }

          bannerImage

          description(
            asHtml: false
          )

          type
          format
          status
          averageScore
          episodes
          seasonYear
          source
          genres

        }

      }
    `;

    variables = {
      idMal: Number(idMal)
    };

  }


  // -------------------------------------------------------
  // Search by title
  // -------------------------------------------------------

  else {

    query = `
      query ($search: String) {

        Media(
          search: $search
          type: ANIME
          sort: SEARCH_MATCH
        ) {

          id
          idMal

          title {
            romaji
            english
            native
          }

          coverImage {
            extraLarge
            large
          }

          bannerImage

          description(
            asHtml: false
          )

          type
          format
          status
          averageScore
          episodes
          seasonYear
          source
          genres

        }

      }
    `;

    variables = {
      search
    };

  }


  const response =
    await fetch(
      "https://graphql.anilist.co",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Accept":
            "application/json"
        },

        body:
          JSON.stringify({
            query,
            variables
          })
      }
    );


  if (!response.ok) {

    throw new Error(
      `AniList HTTP ${response.status}`
    );

  }


  const json =
    await response.json();


  if (json.errors) {

    throw new Error(
      json.errors[0]?.message ||
      "AniList API error"
    );

  }


  const anime =
    json.data?.Media;


  if (!anime) {

    return null;

  }


  // =======================================================
  // RETURN NORMALIZED FORMAT
  // =======================================================

  return {

    // IDs
    id:
      anime.id || null,

    anilistId:
      anime.id || null,

    malId:
      anime.idMal || null,


    // Titles
    title:
      anime.title?.english ||
      anime.title?.romaji ||
      anime.title?.native ||
      "Unknown Anime",

    nativeTitle:
      anime.title?.native ||
      "",


    // Images
    poster:
      anime.coverImage?.extraLarge ||
      anime.coverImage?.large ||
      "",

    banner:
      anime.bannerImage ||
      "",


    // Information
    description:
      anime.description ||
      "",

    rating:
      anime.averageScore ||
      null,

    status:
      anime.status ||
      null,

    year:
      anime.seasonYear ||
      null,

    episodes:
      anime.episodes ||
      null,

    type:
      anime.type ||
      null,

    format:
      anime.format ||
      null,

    source:
      anime.source ||
      null,


    // Genres
    genres:
      anime.genres ||
      []

  };

}



// =========================================================
// JIKAN
// =========================================================

async function fetchFromJikan({
  id,
  idMal,
  search
}) {

  let url;


  // -------------------------------------------------------
  // Search by MAL ID
  // -------------------------------------------------------

  if (idMal) {

    url =
      `https://api.jikan.moe/v4/anime/${encodeURIComponent(idMal)}`;

  }


  // -------------------------------------------------------
  // Search by AniList ID
  //
  // Jikan cannot directly search by AniList ID,
  // so we use the title fallback below.
  // -------------------------------------------------------

  else if (id) {

    return null;

  }


  // -------------------------------------------------------
  // Search by title
  // -------------------------------------------------------

  else if (search) {

    url =
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(search)}&limit=1`;

  }


  if (!url) {

    return null;

  }


  const response =
    await fetch(url, {
      headers: {
        "Accept":
          "application/json"
      }
    });


  if (!response.ok) {

    throw new Error(
      `Jikan HTTP ${response.status}`
    );

  }


  const json =
    await response.json();


  const anime =
    idMal
      ? json.data
      : json.data?.[0];


  if (!anime) {

    return null;

  }


  // =======================================================
  // RETURN NORMALIZED FORMAT
  // =======================================================

  return {

    // IDs
    id:
      anime.mal_id ||
      null,

    anilistId:
      null,

    malId:
      anime.mal_id ||
      null,


    // Titles
    title:
      anime.title ||
      anime.title_english ||
      "Unknown Anime",

    nativeTitle:
      anime.title_japanese ||
      "",


    // Images
    poster:
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      "",

    banner:
      anime.images?.jpg?.large_image_url ||
      "",


    // Information
    description:
      anime.synopsis ||
      "",

    rating:
      anime.score ||
      null,

    status:
      anime.status ||
      null,

    year:
      anime.year ||
      null,

    episodes:
      anime.episodes ||
      null,

    type:
      anime.type ||
      null,

    format:
      anime.type ||
      null,

    source:
      anime.source ||
      null,


    // Genres
    genres:
      anime.genres
        ?.map(
          genre =>
            genre.name
        ) ||
      []

  };

}