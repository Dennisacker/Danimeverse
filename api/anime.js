
// api/anime.js

export default async function handler(req, res) {

  /* =====================================================
     CORS
  ===================================================== */

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  /* =====================================================
     HANDLE OPTIONS
  ===================================================== */

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  /* =====================================================
     ONLY ALLOW GET
  ===================================================== */

  if (req.method !== "GET") {

    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });

  }


  try {

    const {
      id,
      idMal,
      search
    } = req.query;


    /* =====================================================
       VALIDATE REQUEST
    ===================================================== */

    if (!id && !idMal && !search) {

      return res.status(400).json({
        success: false,
        error: "Missing id, idMal, or search parameter"
      });

    }


    /* =====================================================
       1. TRY KITSU

       IMPORTANT:
       For SEARCH requests, Kitsu may return an anime
       without a MAL ID.

       We MUST NOT return that result immediately.

       If we need a MAL ID, we continue to AniList.
    ===================================================== */

    try {

      const kitsuResult =
        await fetchFromKitsu({
          id,
          idMal,
          search
        });


      if (kitsuResult) {

        console.log(
          "📡 Kitsu result:",
          kitsuResult.title,
          "MAL ID:",
          kitsuResult.malId
        );


        /* =================================================
           RETURN KITSU ONLY IF:

           1. We already have a MAL ID request
           OR
           2. Kitsu actually provided a MAL ID

           If searching by title and Kitsu has no MAL ID,
           continue to AniList.
        ================================================= */

        if (
          kitsuResult.malId ||
          id ||
          idMal
        ) {

          console.log(
            "✅ Anime data loaded from Kitsu"
          );

          return res.status(200).json({
            success: true,
            provider: "kitsu",
            data: kitsuResult
          });

        }


        console.log(
          "⚠️ Kitsu found anime but has no MAL ID."
        );

        console.log(
          "➡️ Continuing to AniList..."
        );

      } else {

        console.log(
          "⚠️ Kitsu returned no result"
        );

      }

    } catch (error) {

      console.error(
        "❌ Kitsu failed:",
        error.message
      );

    }


    /* =====================================================
       2. TRY ANILIST

       AniList is especially important for SEARCH because
       it gives us both:

       anilistId
       idMal

       We need idMal because the current anime.html system
       uses:

       anime.html?malId=123
    ===================================================== */

    try {

      const anilistResult =
        await fetchFromAniList({
          id,
          idMal,
          search
        });


      if (anilistResult) {

        console.log(
          "📡 AniList result:",
          anilistResult.title,
          "AniList ID:",
          anilistResult.anilistId,
          "MAL ID:",
          anilistResult.malId
        );


        /* =================================================
           For SEARCH:

           We need MAL ID because search.js filters
           results without one.

           If AniList has no MAL ID, continue to Jikan.
        ================================================= */

        if (
          anilistResult.malId ||
          id ||
          idMal
        ) {

          console.log(
            "✅ Anime data loaded from AniList"
          );

          return res.status(200).json({
            success: true,
            provider: "anilist",
            data: anilistResult
          });

        }


        console.log(
          "⚠️ AniList found anime but has no MAL ID."
        );

        console.log(
          "➡️ Continuing to Jikan..."
        );

      } else {

        console.log(
          "⚠️ AniList returned no result"
        );

      }

    } catch (error) {

      console.error(
        "❌ AniList failed:",
        error.message
      );

    }


    /* =====================================================
       3. TRY JIKAN

       Jikan uses MAL IDs natively.

       This is our final fallback.
    ===================================================== */

    try {

      const jikanResult =
        await fetchFromJikan({
          id,
          idMal,
          search
        });


      if (jikanResult) {

        console.log(
          "✅ Anime data loaded from Jikan"
        );

        return res.status(200).json({
          success: true,
          provider: "jikan",
          data: jikanResult
        });

      }


      console.log(
        "⚠️ Jikan returned no result"
      );

    } catch (error) {

      console.error(
        "❌ Jikan failed:",
        error.message
      );

    }


    /* =====================================================
       NO API FOUND THE ANIME
    ===================================================== */

    return res.status(404).json({

      success: false,

      error: "Anime not found",

      message:
        "All anime APIs failed or returned no usable result."

    });


  } catch (error) {

    console.error(
      "❌ API Gateway Error:",
      error
    );


    return res.status(500).json({

      success: false,

      error: "Internal server error",

      message:
        error.message

    });

  }

}



/* =========================================================
   KITSU
========================================================= */

async function fetchFromKitsu({
  id,
  idMal,
  search
}) {

  let url;


  /* =====================================================
     SEARCH BY KITSU ID
  ===================================================== */

  if (id) {

    url =
      `https://kitsu.io/api/edge/anime/${encodeURIComponent(id)}`;

  }


  /* =====================================================
     SEARCH BY MAL ID
  ===================================================== */

  else if (idMal) {

    url =
      `https://kitsu.io/api/edge/anime?filter[malId]=${encodeURIComponent(idMal)}`;

  }


  /* =====================================================
     SEARCH BY TITLE
  ===================================================== */

  else if (search) {

    url =
      `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(search)}&page[limit]=1`;

  }


  if (!url) {

    return null;

  }


  const response =
    await fetch(
      url,
      {
        headers: {
          "Accept":
            "application/vnd.api+json"
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `Kitsu HTTP ${response.status}`
    );

  }


  const json =
    await response.json();


  let anime;


  /* =====================================================
     SINGLE ANIME
  ===================================================== */

  if (id) {

    anime =
      json.data;

  }


  /* =====================================================
     SEARCH / FILTER RESULT
  ===================================================== */

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


  /* =====================================================
     NORMALIZED RESULT
  ===================================================== */

  return {

    id:
      anime.id ||
      null,

    anilistId:
      null,

    malId:
      attributes.malId ||
      idMal ||
      null,


    title:
      titles.en ||
      titles.en_jp ||
      titles.ja_jp ||
      attributes.canonicalTitle ||
      "Unknown Anime",


    nativeTitle:
      titles.ja_jp ||
      "",


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


    description:
      attributes.description ||
      "",


    rating:
      attributes.averageRating
        ? Number(
            attributes.averageRating
          )
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


    genres:
      []

  };

}



/* =========================================================
   ANILIST
========================================================= */

async function fetchFromAniList({
  id,
  idMal,
  search
}) {

  let query;

  let variables;


  /* =====================================================
     SEARCH BY ANILIST ID
  ===================================================== */

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
      id:
        Number(id)
    };

  }


  /* =====================================================
     SEARCH BY MAL ID
  ===================================================== */

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
      idMal:
        Number(idMal)
    };

  }


  /* =====================================================
     SEARCH BY TITLE
  ===================================================== */

  else if (search) {

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


  /* =====================================================
     NO VALID SEARCH PARAMETER
  ===================================================== */

  else {

    return null;

  }


  /* =====================================================
     SEND SERVER-SIDE REQUEST TO ANILIST
  ===================================================== */

  const response =
    await fetch(
      "https://graphql.anilist.co",
      {

        method:
          "POST",

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


  /* =====================================================
     CHECK HTTP STATUS
  ===================================================== */

  if (!response.ok) {

    throw new Error(
      `AniList HTTP ${response.status}`
    );

  }


  /* =====================================================
     PARSE RESPONSE
  ===================================================== */

  const json =
    await response.json();


  /* =====================================================
     CHECK GRAPHQL ERRORS
  ===================================================== */

  if (
    json.errors &&
    json.errors.length
  ) {

    throw new Error(
      json.errors[0]?.message ||
      "AniList API error"
    );

  }


  /* =====================================================
     GET ANIME
  ===================================================== */

  const anime =
    json.data?.Media;


  if (!anime) {

    return null;

  }


  /* =====================================================
     NORMALIZED RESULT
  ===================================================== */

  return {

    id:
      anime.id ||
      null,


    anilistId:
      anime.id ||
      null,


    malId:
      anime.idMal ||
      null,


    title:
      anime.title?.english ||
      anime.title?.romaji ||
      anime.title?.native ||
      "Unknown Anime",


    nativeTitle:
      anime.title?.native ||
      "",


    poster:
      anime.coverImage?.extraLarge ||
      anime.coverImage?.large ||
      "",


    banner:
      anime.bannerImage ||
      "",


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


    genres:
      anime.genres ||
      []

  };

}



/* =========================================================
   JIKAN
========================================================= */

async function fetchFromJikan({
  id,
  idMal,
  search
}) {

  let url;


  /* =====================================================
     SEARCH BY MAL ID
  ===================================================== */

  if (idMal) {

    url =
      `https://api.jikan.moe/v4/anime/${encodeURIComponent(idMal)}`;

  }


  /* =====================================================
     SEARCH BY ANILIST ID

     Jikan cannot directly search by AniList ID.
  ===================================================== */

  else if (id) {

    return null;

  }


  /* =====================================================
     SEARCH BY TITLE
  ===================================================== */

  else if (search) {

    url =
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(search)}&limit=1`;

  }


  if (!url) {

    return null;

  }


  /* =====================================================
     REQUEST
  ===================================================== */

  const response =
    await fetch(
      url,
      {
        headers: {
          "Accept":
            "application/json"
        }
      }
    );


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


  /* =====================================================
     NORMALIZED RESULT
  ===================================================== */

  return {

    id:
      anime.mal_id ||
      null,


    anilistId:
      null,


    malId:
      anime.mal_id ||
      null,


    title:
      anime.title ||
      anime.title_english ||
      "Unknown Anime",


    nativeTitle:
      anime.title_japanese ||
      "",


    poster:
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      "",


    banner:
      anime.images?.jpg?.large_image_url ||
      "",


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


    genres:
      anime.genres
        ?.map(
          genre =>
            genre.name
        ) ||
      []

  };

}

