
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const { id, idMal, search } = req.query;

  if (!id && !idMal && !search) {
    return res.status(400).json({
      success: false,
      error: "Missing id, idMal, or search parameter"
    });
  }

  /*
  =========================================================
  SEARCH MODE

  Search must return MULTIPLE results.

  We use AniList first because it supports
  multiple search results properly.

  /api/anime?search=naruto
  =========================================================
  */

  if (search) {
    return handleSearch(req, res, search);
  }

  /*
  =========================================================
  SINGLE ANIME MODE

  Used by:

  /api/anime?id=ANILIST_ID

  or

  /api/anime?idMal=MAL_ID

  This keeps your existing watch system working.
  =========================================================
  */

  const errors = [];

  /*
  =========================================================
  KITSU
  =========================================================
  */

  try {
    const kitsu = await fetchFromKitsu({
      id,
      idMal
    });

    if (kitsu) {
      return res.status(200).json({
        success: true,
        provider: "kitsu",
        data: kitsu
      });
    }
  } catch (error) {
    console.error(
      "Kitsu error:",
      error.message
    );

    errors.push(
      "Kitsu: " + error.message
    );
  }

  /*
  =========================================================
  ANILIST
  =========================================================
  */

  try {
    const anilist = await fetchFromAniList({
      id,
      idMal
    });

    if (anilist) {
      return res.status(200).json({
        success: true,
        provider: "anilist",
        data: anilist
      });
    }
  } catch (error) {
    console.error(
      "AniList error:",
      error.message
    );

    errors.push(
      "AniList: " + error.message
    );
  }

  /*
  =========================================================
  JIKAN FALLBACK
  =========================================================
  */

  try {
    const jikan = await fetchFromJikan({
      idMal
    });

    if (jikan) {
      return res.status(200).json({
        success: true,
        provider: "jikan",
        data: jikan
      });
    }
  } catch (error) {
    console.error(
      "Jikan error:",
      error.message
    );

    errors.push(
      "Jikan: " + error.message
    );
  }

  /*
  =========================================================
  NOTHING FOUND
  =========================================================
  */

  return res.status(404).json({
    success: false,
    error: "Anime not found",
    message:
      "No anime provider returned a usable result.",
    details: errors
  });
}


/*
=========================================================
SEARCH HANDLER

Returns multiple anime results.

Example:

/api/anime?search=naruto

Response:

{
  success: true,
  provider: "anilist",
  data: [...]
}
=========================================================
*/

async function handleSearch(req, res, search) {

  const errors = [];

  /*
  =======================================================
  ANILIST SEARCH
  =======================================================
  */

  try {

    const results =
      await searchAniList(search);

    if (
      results &&
      results.length > 0
    ) {

      return res.status(200).json({
        success: true,
        provider: "anilist",
        data: results
      });

    }

  } catch (error) {

    console.error(
      "AniList search error:",
      error.message
    );

    errors.push(
      "AniList: " + error.message
    );

  }


  /*
  =======================================================
  KITSU SEARCH FALLBACK
  =======================================================
  */

  try {

    const results =
      await searchKitsu(search);

    if (
      results &&
      results.length > 0
    ) {

      return res.status(200).json({
        success: true,
        provider: "kitsu",
        data: results
      });

    }

  } catch (error) {

    console.error(
      "Kitsu search error:",
      error.message
    );

    errors.push(
      "Kitsu: " + error.message
    );

  }


  /*
  =======================================================
  JIKAN SEARCH FALLBACK
  =======================================================
  */

  try {

    const results =
      await searchJikan(search);

    if (
      results &&
      results.length > 0
    ) {

      return res.status(200).json({
        success: true,
        provider: "jikan",
        data: results
      });

    }

  } catch (error) {

    console.error(
      "Jikan search error:",
      error.message
    );

    errors.push(
      "Jikan: " + error.message
    );

  }


  return res.status(404).json({
    success: false,
    error: "Anime not found",
    data: [],
    details: errors
  });

}


/*
=========================================================
ANILIST MULTI SEARCH
=========================================================
*/

async function searchAniList(search) {

  const query = `
    query ($search: String) {

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

          description(asHtml: false)

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

          Accept:
            "application/json"
        },

        body:
          JSON.stringify({
            query,

            variables: {
              search
            }
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
    json.errors.length
  ) {

    throw new Error(
      json.errors[0].message ||
      "AniList GraphQL error"
    );

  }


  const media =
    json.data &&
    json.data.Page &&
    json.data.Page.media;


  if (
    !media ||
    !media.length
  ) {

    return [];

  }


  return media.map(
    anime => {

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
            anime.coverImage.large ||
            anime.coverImage.medium
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
          anime.genres ||
          []

      };

    }
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


  if (id) {

    url =
      "https://kitsu.io/api/edge/anime/" +
      encodeURIComponent(id);

  }

  else if (idMal) {

    url =
      "https://kitsu.io/api/edge/anime" +
      "?filter[malId]=" +
      encodeURIComponent(idMal) +
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
          Accept:
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
      : json.data &&
        json.data[0];


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
KITSU MULTI SEARCH
=========================================================
*/

async function searchKitsu(search) {

  const url =
    "https://kitsu.io/api/edge/anime" +
    "?filter[text]=" +
    encodeURIComponent(search) +
    "&page[limit]=10";


  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
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


  if (
    !json.data ||
    !json.data.length
  ) {

    return [];

  }


  return json.data.map(
    anime =>
      normalizeKitsu(
        anime,
        null
      )
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
      attributes.startDate
        ? Number(
            attributes.startDate.substring(
              0,
              4
            )
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
    encodeURIComponent(idMal);


  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
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


  if (!json.data) {

    return null;

  }


  return normalizeJikan(
    json.data
  );

}


/*
=========================================================
JIKAN MULTI SEARCH
=========================================================
*/

async function searchJikan(search) {

  const url =
    "https://api.jikan.moe/v4/anime" +
    "?q=" +
    encodeURIComponent(search) +
    "&limit=10";


  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
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
    !json.data ||
    !json.data.length
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
NORMALIZE JIKAN
=========================================================
*/

function normalizeJikan(anime) {

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
      anime.images &&
      anime.images.jpg &&
      (
        anime.images.jpg.large_image_url ||
        anime.images.jpg.image_url
      ) ||
      "",

    banner:
      anime.images &&
      anime.images.jpg &&
      (
        anime.images.jpg.large_image_url ||
        anime.images.jpg.image_url
      ) ||
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
        ? anime.genres.map(
            genre =>
              genre.name
          )
        : []

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

          description(asHtml: false)

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

          description(asHtml: false)

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
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
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
    json.errors.length
  ) {

    throw new Error(
      json.errors[0].message ||
      "AniList GraphQL error"
    );

  }


  const anime =
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
      anime.genres ||
      []

  };

}

