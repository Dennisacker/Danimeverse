/*
=========================================================
DANIMEVERSE UNIVERSAL ANIME API
/api/anime.js

SUPPORTED:

1. Search
   /api/anime?search=naruto

2. AniList ID
   /api/anime?id=21

3. MAL ID
   /api/anime?idMal=16498

SEARCH:
AniList → Kitsu → Jikan

SINGLE ANIME:
Kitsu → AniList → Jikan
=========================================================
*/


/*
=========================================================
MAIN HANDLER
=========================================================
*/

export default async function handler(req, res) {

  /*
  =======================================================
  CORS
  =======================================================
  */

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


  /*
  =======================================================
  OPTIONS REQUEST
  =======================================================
  */

  if (req.method === "OPTIONS") {

    return res
      .status(200)
      .end();

  }


  /*
  =======================================================
  ONLY GET ALLOWED
  =======================================================
  */

  if (req.method !== "GET") {

    return res
      .status(405)
      .json({
        success: false,
        error: "Method not allowed"
      });

  }


  /*
  =======================================================
  GET QUERY PARAMETERS
  =======================================================
  */

  const {
    id,
    idMal,
    search
  } = req.query;


  /*
  =======================================================
  VALIDATE REQUEST
  =======================================================
  */

  if (
    !id &&
    !idMal &&
    !search
  ) {

    return res
      .status(400)
      .json({
        success: false,
        error:
          "Missing id, idMal, or search parameter"
      });

  }


  /*
  =======================================================
  SEARCH MODE

  Example:

  /api/anime?search=naruto

  Returns MULTIPLE results.
  =======================================================
  */

  if (search) {

    try {

      console.log(
        "🔎 Anime search:",
        search
      );


      const results =
        await searchAniList(
          String(search).trim()
        );


      /*
      =====================================================
      RESULTS FOUND
      =====================================================
      */

      if (
        results &&
        results.length > 0
      ) {

        console.log(
          "✅ AniList search results:",
          results.length
        );


        return res
          .status(200)
          .json({
            success: true,
            provider: "anilist",
            data: results
          });

      }


      /*
      =====================================================
      NO RESULTS

      Return 200 instead of throwing 404.
      This makes the frontend easier to handle.
      =====================================================
      */

      return res
        .status(200)
        .json({
          success: true,
          provider: "anilist",
          data: []
        });


    } catch (error) {

      console.error(
        "❌ Search API error:",
        error
      );


      /*
      =====================================================
      FALLBACK TO JIKAN

      If AniList search fails, try Jikan.
      =====================================================
      */

      try {

        const jikanResults =
          await searchJikan(
            String(search).trim()
          );


        if (
          jikanResults &&
          jikanResults.length > 0
        ) {

          console.log(
            "✅ Jikan fallback results:",
            jikanResults.length
          );


          return res
            .status(200)
            .json({
              success: true,
              provider: "jikan",
              data: jikanResults
            });

        }


      } catch (jikanError) {

        console.error(
          "❌ Jikan search fallback error:",
          jikanError
        );

      }


      /*
      =====================================================
      BOTH SEARCH PROVIDERS FAILED

      IMPORTANT:
      Return JSON instead of allowing a Vercel
      unhandled 500 error.
      =====================================================
      */

      return res
        .status(200)
        .json({
          success: false,
          provider: null,
          data: [],
          error:
            "Search providers are temporarily unavailable."
        });

    }

  }


  /*
  =======================================================
  SINGLE ANIME MODE

  Used by:

  /api/anime?id=ANILIST_ID

  OR

  /api/anime?idMal=MAL_ID
  =======================================================
  */

  const errors = [];


  /*
  =======================================================
  KITSU
  =======================================================
  */

  try {

    console.log(
      "🔥 Trying Kitsu..."
    );


    const kitsu =
      await fetchFromKitsu({
        id,
        idMal
      });


    if (kitsu) {

      console.log(
        "✅ Anime found through Kitsu"
      );


      return res
        .status(200)
        .json({
          success: true,
          provider: "kitsu",
          data: kitsu
        });

    }

  } catch (error) {

    console.error(
      "❌ Kitsu error:",
      error.message
    );


    errors.push(
      "Kitsu: " +
      error.message
    );

  }


  /*
  =======================================================
  ANILIST
  =======================================================
  */

  try {

    console.log(
      "🔥 Trying AniList..."
    );


    const anilist =
      await fetchFromAniList({
        id,
        idMal
      });


    if (anilist) {

      console.log(
        "✅ Anime found through AniList"
      );


      return res
        .status(200)
        .json({
          success: true,
          provider: "anilist",
          data: anilist
        });

    }

  } catch (error) {

    console.error(
      "❌ AniList error:",
      error.message
    );


    errors.push(
      "AniList: " +
      error.message
    );

  }


  /*
  =======================================================
  JIKAN FALLBACK
  =======================================================
  */

  try {

    console.log(
      "🔥 Trying Jikan..."
    );


    const jikan =
      await fetchFromJikan({
        idMal
      });


    if (jikan) {

      console.log(
        "✅ Anime found through Jikan"
      );


      return res
        .status(200)
        .json({
          success: true,
          provider: "jikan",
          data: jikan
        });

    }

  } catch (error) {

    console.error(
      "❌ Jikan error:",
      error.message
    );


    errors.push(
      "Jikan: " +
      error.message
    );

  }


  /*
  =======================================================
  NOTHING FOUND
  =======================================================
  */

  return res
    .status(404)
    .json({
      success: false,
      error: "Anime not found",
      message:
        "No anime provider returned a usable result.",
      details: errors
    });

}


/*
=========================================================
ANILIST MULTI SEARCH

Returns up to 10 results.
=========================================================
*/

async function searchAniList(
  search
) {

  if (!search) {

    return [];

  }


  const query = `

    query (
      $search: String
    ) {

      Page(
        page: 1
        perPage: 10
      ) {

        media(
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

            medium

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

    }

  `;


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

            variables: {

              search:
                String(search)

            }

          })

      }
    );


  /*
  =======================================================
  HTTP ERROR
  =======================================================
  */

  if (!response.ok) {

    throw new Error(
      "AniList HTTP " +
      response.status
    );

  }


  const json =
    await response.json();


  /*
  =======================================================
  GRAPHQL ERROR
  =======================================================
  */

  if (
    json.errors &&
    json.errors.length > 0
  ) {

    throw new Error(
      json.errors[0].message ||
      "AniList GraphQL error"
    );

  }


  /*
  =======================================================
  GET RESULTS
  =======================================================
  */

  const media =
    json &&
    json.data &&
    json.data.Page &&
    json.data.Page.media;


  if (
    !media ||
    !Array.isArray(media)
  ) {

    return [];

  }


  /*
  =======================================================
  NORMALIZE RESULTS
  =======================================================
  */

  return media.map(
    anime => {

      const title =
        anime.title || {};


      const cover =
        anime.coverImage || {};


      return {

        /*
        AniList ID
        */

        id:
          anime.id ||
          null,


        anilistId:
          anime.id ||
          null,


        /*
        MAL ID

        This is important because your
        existing anime.html system uses:

        anime.html?malId=16498
        */

        malId:
          anime.idMal ||
          null,


        /*
        TITLES
        */

        title:
          title.english ||
          title.romaji ||
          title.native ||
          "Unknown Anime",


        nativeTitle:
          title.native ||
          "",


        /*
        POSTER
        */

        poster:
          cover.extraLarge ||
          cover.large ||
          cover.medium ||
          "",


        /*
        BANNER
        */

        banner:
          anime.bannerImage ||
          "",


        /*
        DESCRIPTION
        */

        description:
          anime.description ||
          "",


        /*
        RATING

        AniList uses 0-100.
        Your search page can display it
        however you want.
        */

        rating:
          anime.averageScore ||
          null,


        /*
        STATUS
        */

        status:
          anime.status ||
          null,


        /*
        YEAR
        */

        year:
          anime.seasonYear ||
          null,


        /*
        EPISODES
        */

        episodes:
          anime.episodes ||
          null,


        /*
        TYPE
        */

        type:
          anime.type ||
          null,


        /*
        FORMAT
        */

        format:
          anime.format ||
          null,


        /*
        SOURCE
        */

        source:
          anime.source ||
          null,


        /*
        GENRES
        */

        genres:
          Array.isArray(
            anime.genres
          )
            ? anime.genres
            : []

      };

    }
  );

}


/*
=========================================================
JIKAN MULTI SEARCH FALLBACK
=========================================================
*/

async function searchJikan(
  search
) {

  if (!search) {

    return [];

  }


  const url =
    "https://api.jikan.moe/v4/anime" +
    "?q=" +
    encodeURIComponent(
      search
    ) +
    "&limit=10";


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
      "Jikan HTTP " +
      response.status
    );

  }


  const json =
    await response.json();


  if (
    !json ||
    !Array.isArray(
      json.data
    )
  ) {

    return [];

  }


  return json.data.map(
    anime =>
      normalizeJikan(
        anime
      )
  );

}


/*
=========================================================
KITSU SINGLE ANIME
=========================================================
*/

async function fetchFromKitsu({
  id,
  idMal
}) {

  let url;


  /*
  =======================================================
  ANILIST ID

  Kitsu does not directly use AniList ID,
  so this only works if your id is a Kitsu ID.
  =======================================================
  */

  if (id) {

    url =
      "https://kitsu.io/api/edge/anime/" +
      encodeURIComponent(
        id
      );

  }

  /*
  =======================================================
  MAL ID
  =======================================================
  */

  else if (idMal) {

    url =
      "https://kitsu.io/api/edge/anime" +
      "?filter[malId]=" +
      encodeURIComponent(
        idMal
      ) +
      "&page[limit]=1";

  }

  else {

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
      "Kitsu HTTP " +
      response.status
    );

  }


  const json =
    await response.json();


  const anime =
    id
      ? json.data
      : (
          json.data &&
          json.data[0]
        );


  if (!anime) {

    return null;

  }


  return normalizeKitsu(
    anime,
    idMal
  );

}


/*
=========================================================
NORMALIZE KITSU
=========================================================
*/

function normalizeKitsu(
  anime,
  fallbackMalId
) {

  const attributes =
    anime.attributes ||
    {};


  const titles =
    attributes.titles ||
    {};


  const poster =
    attributes.posterImage ||
    {};


  const cover =
    attributes.coverImage ||
    {};


  let year =
    null;


  if (
    attributes.startDate
  ) {

    year =
      Number(
        String(
          attributes.startDate
        ).substring(
          0,
          4
        )
      );

  }


  return {

    id:
      anime.id ||
      null,


    anilistId:
      null,


    malId:
      attributes.malId ||
      fallbackMalId ||
      null,


    title:
      titles.en ||
      titles.en_jp ||
      titles.en_us ||
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
      year,


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


/*
=========================================================
ANILIST SINGLE ANIME
=========================================================
*/

async function fetchFromAniList({
  id,
  idMal
}) {

  let query;

  let variables;


  /*
  =======================================================
  BY ANILIST ID
  =======================================================
  */

  if (id) {

    query = `

      query (
        $id: Int
      ) {

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


  /*
  =======================================================
  BY MAL ID
  =======================================================
  */

  else if (idMal) {

    query = `

      query (
        $idMal: Int
      ) {

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


  else {

    return null;

  }


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


  if (!response.ok) {

    throw new Error(
      "AniList HTTP " +
      response.status
    );

  }


  const json =
    await response.json();


  if (
    json.errors &&
    json.errors.length > 0
  ) {

    throw new Error(
      json.errors[0].message ||
      "AniList GraphQL error"
    );

  }


  const anime =
    json &&
    json.data &&
    json.data.Media;


  if (!anime) {

    return null;

  }


  return {

    id:
      anime.id ||
      null,


    anilistId:
      anime.id ||
      null,


    malId:
      anime.idMal ||
      idMal ||
      null,


    title:
      anime.title &&
      (
        anime.title.english ||
        anime.title.romaji ||
        anime.title.native
      ) ||
      "Unknown Anime",


    nativeTitle:
      anime.title &&
      anime.title.native ||
      "",


    poster:
      anime.coverImage &&
      (
        anime.coverImage.extraLarge ||
        anime.coverImage.large
      ) ||
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
      Array.isArray(
        anime.genres
      )
        ? anime.genres
        : []

  };

}


/*
=========================================================
JIKAN SINGLE ANIME
=========================================================
*/

async function fetchFromJikan({
  idMal
}) {

  if (!idMal) {

    return null;

  }


  const url =
    "https://api.jikan.moe/v4/anime/" +
    encodeURIComponent(
      idMal
    );


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
      "Jikan HTTP " +
      response.status
    );

  }


  const json =
    await response.json();


  if (
    !json ||
    !json.data
  ) {

    return null;

  }


  return normalizeJikan(
    json.data
  );

}


/*
=========================================================
NORMALIZE JIKAN
=========================================================
*/

function normalizeJikan(
  anime
) {

  const images =
    anime.images &&
    anime.images.jpg
      ? anime.images.jpg
      : {};


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
      anime.title_english ||
      anime.title ||
      "Unknown Anime",


    nativeTitle:
      anime.title_japanese ||
      "",


    poster:
      images.large_image_url ||
      images.image_url ||
      "",


    banner:
      images.large_image_url ||
      images.image_url ||
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
      Array.isArray(
        anime.genres
      )
        ? anime.genres.map(
            genre =>
              genre.name
          )
        : []

  };

}