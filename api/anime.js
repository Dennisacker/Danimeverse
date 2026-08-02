```js
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

  Search is handled separately because a search should
  return MULTIPLE anime results.

  Example:

  /api/anime?search=Attack%20on%20Titan

  Returns:

  data: [
    anime 1,
    anime 2,
    anime 3,
    ...
  ]
  =========================================================
  */

  if (search) {
    try {
      const results =
        await searchAnimeAcrossProviders(search);

      if (results.length > 0) {
        return res.status(200).json({
          success: true,
          provider: "multi",
          data: results
        });
      }

      return res.status(404).json({
        success: false,
        error: "Anime not found",
        message: "No anime search results were found."
      });

    } catch (error) {
      console.error(
        "❌ Search error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        error: "Anime search failed",
        message: error.message
      });
    }
  }


  /*
  =========================================================
  SINGLE ANIME MODE

  This keeps your existing system:

  id
    ↓
  Kitsu → AniList → Jikan

  idMal
    ↓
  Kitsu → AniList → Jikan

  This is used by watch.html and anime.html.
  =========================================================
  */

  const errors = [];

  try {
    const kitsu =
      await fetchFromKitsu({
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
      "Kitsu: " +
      error.message
    );
  }


  try {
    const anilist =
      await fetchFromAniList({
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
      "AniList: " +
      error.message
    );
  }


  try {
    const jikan =
      await fetchFromJikan({
        id,
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
      "Jikan: " +
      error.message
    );
  }


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
MULTI-PROVIDER SEARCH
=========================================================

Priority:

1. Kitsu
2. AniList
3. Jikan

The first provider that returns usable results is used.

This prevents duplicate results from all three APIs.
=========================================================
*/

async function searchAnimeAcrossProviders(
  search
) {

  /*
  =========================================================
  TRY KITSU
  =========================================================
  */

  try {

    const kitsuResults =
      await searchKitsu(search);

    if (
      kitsuResults &&
      kitsuResults.length > 0
    ) {

      return kitsuResults;

    }

  } catch (error) {

    console.error(
      "Kitsu search error:",
      error.message
    );

  }


  /*
  =========================================================
  TRY ANILIST
  =========================================================
  */

  try {

    const anilistResults =
      await searchAniList(search);

    if (
      anilistResults &&
      anilistResults.length > 0
    ) {

      return anilistResults;

    }

  } catch (error) {

    console.error(
      "AniList search error:",
      error.message
    );

  }


  /*
  =========================================================
  TRY JIKAN
  =========================================================
  */

  try {

    const jikanResults =
      await searchJikan(search);

    if (
      jikanResults &&
      jikanResults.length > 0
    ) {

      return jikanResults;

    }

  } catch (error) {

    console.error(
      "Jikan search error:",
      error.message
    );

  }


  return [];
}


/*
=========================================================
KITSU SEARCH

IMPORTANT:

Old:

page[limit]=1

New:

page[limit]=10

This allows multiple search suggestions.
=========================================================
*/

async function searchKitsu(
  search
) {

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

  const animeList =
    json.data || [];

  const results = [];

  for (
    const anime of animeList
  ) {

    if (!anime) {
      continue;
    }

    const attributes =
      anime.attributes || {};

    const titles =
      attributes.titles || {};

    const poster =
      attributes.posterImage || {};

    const startDate =
      attributes.startDate || "";

    /*
    Kitsu may not always provide MAL ID.

    Try to find it from AniList if necessary.
    */

    let malId =
      attributes.malId ||
      null;

    if (
      !malId
    ) {

      try {

        malId =
          await findMalIdFromAniList(
            titles.en ||
            titles.en_jp ||
            titles.en_us ||
            attributes.canonicalTitle ||
            search
          );

      } catch (error) {

        console.warn(
          "Could not find MAL ID:",
          error.message
        );

      }

    }


    /*
    Skip results without MAL IDs.

    Your current search.js requires idMal.
    */

    if (
      !malId
    ) {

      continue;

    }


    results.push({

      id:
        anime.id ||
        null,

      anilistId:
        null,

      malId:
        malId,

      title:
        titles.en ||
        titles.en_jp ||
        titles.en_us ||
        attributes.canonicalTitle ||
        "Unknown Anime",

      nativeTitle:
        titles.ja_jp ||
        attributes.canonicalTitle ||
        "",

      poster:
        poster.large ||
        poster.medium ||
        poster.small ||
        "",

      banner:
        "",

      description:
        attributes.synopsis ||
        attributes.description ||
        "",

      rating:
        attributes.averageRating
          ? Number(
              attributes.averageRating
            ) / 10
          : null,

      status:
        attributes.status ||
        "",

      year:
        startDate
          ? Number(
              startDate.substring(
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
        "ANIME",

      format:
        attributes.subtype ||
        "TV",

      source:
        "",

      genres:
        []

    });

  }


  return results;

}


/*
=========================================================
ANILIST SEARCH
=========================================================
*/

async function searchAniList(
  search
) {

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
            medium
            large
          }

          format

          episodes

          seasonYear

          status

          averageScore

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


  const animeList =
    json.data?.Page?.media ||
    [];


  return animeList

    .filter(
      anime =>
        anime.idMal
    )

    .map(
      anime => ({

        id:
          anime.id,

        anilistId:
          anime.id,

        malId:
          anime.idMal,

        title:
          anime.title?.english ||
          anime.title?.romaji ||
          anime.title?.native ||
          "Unknown Anime",

        nativeTitle:
          anime.title?.native ||
          "",

        poster:
          anime.coverImage?.large ||
          anime.coverImage?.medium ||
          "",

        banner:
          "",

        description:
          "",

        rating:
          anime.averageScore
            ? anime.averageScore /
              10
            : null,

        status:
          anime.status ||
          "",

        year:
          anime.seasonYear ||
          null,

        episodes:
          anime.episodes ||
          null,

        type:
          anime.format ||
          "ANIME",

        format:
          anime.format ||
          "TV",

        source:
          "",

        genres:
          []

      })

    );

}


/*
=========================================================
JIKAN SEARCH
=========================================================
*/

async function searchJikan(
  search
) {

  const url =
    "https://api.jikan.moe/v4/anime" +
    "?q=" +
    encodeURIComponent(search) +
    "&limit=10";

  const response =
    await fetch(
      url
    );

  if (!response.ok) {

    throw new Error(
      "Jikan HTTP " +
      response.status
    );

  }

  const json =
    await response.json();


  const animeList =
    json.data ||
    [];


  return animeList

    .filter(
      anime =>
        anime.mal_id
    )

    .map(
      anime => ({

        id:
          anime.mal_id,

        anilistId:
          null,

        malId:
          anime.mal_id,

        title:
          anime.title_english ||
          anime.title ||
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
          "",

        year:
          anime.year ||
          null,

        episodes:
          anime.episodes ||
          null,

        type:
          anime.type ||
          "ANIME",

        format:
          anime.type ||
          "TV",

        source:
          anime.source ||
          "",

        genres:
          anime.genres
            ? anime.genres.map(
                genre =>
                  genre.name
              )
            : []

      })

    );

}


/*
=========================================================
SINGLE KITSU LOOKUP
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


  if (!url) {

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


  let malIdValue =
    attributes.malId ||
    idMal ||
    null;


  if (
    !malIdValue
  ) {

    malIdValue =
      await findMalIdFromAniList(
        titles.en ||
        titles.en_jp ||
        titles.en_us ||
        attributes.canonicalTitle ||
        ""
      );

  }


  return {

    id:
      anime.id ||
      null,

    anilistId:
      null,

    malId:
      malIdValue,

    title:
      titles.en ||
      titles.en_jp ||
      titles.en_us ||
      attributes.canonicalTitle ||
      "Unknown Anime",

    nativeTitle:
      titles.ja_jp ||
      attributes.canonicalTitle ||
      "",

    poster:
      poster.large ||
      poster.medium ||
      poster.small ||
      "",

    banner:
      cover.large ||
      cover.medium ||
      "",

    description:
      attributes.synopsis ||
      attributes.description ||
      "",

    rating:
      attributes.averageRating
        ? Number(
            attributes.averageRating
          ) / 10
        : null,

    status:
      attributes.status ||
      "",

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
      "ANIME",

    format:
      attributes.subtype ||
      "TV",

    source:
      "",

    genres:
      []

  };

}


/*
=========================================================
SINGLE ANILIST LOOKUP
=========================================================
*/

async function fetchFromAniList({
  id,
  idMal
}) {

  const query = `
    query (
      $id: Int,
      $idMal: Int
    ) {

      Media(
        id: $id
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

        description

        coverImage {
          medium
          large
        }

        bannerImage

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


  const variables = {};


  if (id) {

    variables.id =
      Number(id);

  }


  if (idMal) {

    variables.idMal =
      Number(idMal);

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


  const anime =
    json.data?.Media;


  if (!anime) {

    return null;

  }


  return {

    id:
      anime.id,

    anilistId:
      anime.id,

    malId:
      anime.idMal ||
      idMal ||
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
      anime.coverImage?.large ||
      anime.coverImage?.medium ||
      "",

    banner:
      anime.bannerImage ||
      "",

    description:
      anime.description ||
      "",

    rating:
      anime.averageScore
        ? anime.averageScore /
          10
        : null,

    status:
      anime.status ||
      "",

    year:
      anime.seasonYear ||
      null,

    episodes:
      anime.episodes ||
      null,

    type:
      anime.format ||
      "ANIME",

    format:
      anime.format ||
      "TV",

    source:
      anime.source ||
      "",

    genres:
      anime.genres ||
      []

  };

}


/*
=========================================================
SINGLE JIKAN LOOKUP
=========================================================
*/

async function fetchFromJikan({
  idMal
}) {

  if (!idMal) {

    return null;

  }


  const response =
    await fetch(
      "https://api.jikan.moe/v4/anime/" +
      encodeURIComponent(idMal) +
      "/full"
    );


  if (!response.ok) {

    throw new Error(
      "Jikan HTTP " +
      response.status
    );

  }


  const json =
    await response.json();


  const anime =
    json.data;


  if (!anime) {

    return null;

  }


  return {

    id:
      anime.mal_id,

    anilistId:
      null,

    malId:
      anime.mal_id,

    title:
      anime.title_english ||
      anime.title ||
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
      "",

    year:
      anime.year ||
      null,

    episodes:
      anime.episodes ||
      null,

    type:
      anime.type ||
      "ANIME",

    format:
      anime.type ||
      "TV",

    source:
      anime.source ||
      "",

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
FIND MAL ID FROM ANILIST
=========================================================
*/

async function findMalIdFromAniList(
  search
) {

  if (
    !search
  ) {

    return null;

  }


  const query = `
    query (
      $search: String
    ) {

      Media(
        search: $search
        type: ANIME
      ) {

        id

        idMal

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
      }
    );


  if (!response.ok) {

    return null;

  }


  const json =
    await response.json();


  return (
    json.data?.Media?.idMal ||
    null
  );

}
```
