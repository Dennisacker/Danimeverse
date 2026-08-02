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

  const errors = [];

  try {
    const kitsu = await fetchFromKitsu({
      id,
      idMal,
      search
    });

    if (kitsu) {
      return res.status(200).json({
        success: true,
        provider: "kitsu",
        data: kitsu
      });
    }
  } catch (error) {
    console.error("Kitsu error:", error.message);
    errors.push("Kitsu: " + error.message);
  }

  try {
    const anilist = await fetchFromAniList({
      id,
      idMal,
      search
    });

    if (anilist) {
      return res.status(200).json({
        success: true,
        provider: "anilist",
        data: anilist
      });
    }
  } catch (error) {
    console.error("AniList error:", error.message);
    errors.push("AniList: " + error.message);
  }

  try {
    const jikan = await fetchFromJikan({
      id,
      idMal,
      search
    });

    if (jikan) {
      return res.status(200).json({
        success: true,
        provider: "jikan",
        data: jikan
      });
    }
  } catch (error) {
    console.error("Jikan error:", error.message);
    errors.push("Jikan: " + error.message);
  }

  return res.status(404).json({
    success: false,
    error: "Anime not found",
    message: "No anime provider returned a usable result.",
    details: errors
  });
}

async function fetchFromKitsu({ id, idMal, search }) {
  let url;

  if (id) {
    url =
      "https://kitsu.io/api/edge/anime/" +
      encodeURIComponent(id);
  } else if (idMal) {
    url =
      "https://kitsu.io/api/edge/anime?filter[malId]=" +
      encodeURIComponent(idMal) +
      "&page[limit]=1";
  } else if (search) {
    url =
      "https://kitsu.io/api/edge/anime?filter[text]=" +
      encodeURIComponent(search) +
      "&page[limit]=1";
  }

  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json"
    }
  });

  if (!response.ok) {
    throw new Error("Kitsu HTTP " + response.status);
  }

  const json = await response.json();

  const anime = id
    ? json.data
    : json.data && json.data[0];

  if (!anime) {
    return null;
  }

  const attributes = anime.attributes || {};
  const titles = attributes.titles || {};
  const poster = attributes.posterImage || {};
  const cover = attributes.coverImage || {};

  let malIdValue = attributes.malId || idMal || null;

  if (!malIdValue && search) {
    malIdValue = await findMalIdFromAniList(
      titles.en ||
      titles.en_jp ||
      titles.en_us ||
      attributes.canonicalTitle ||
      search
    );
  }

  return {
    id: anime.id || null,

    anilistId: null,

    malId: malIdValue,

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
      attributes.synopsis ||
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
        ? Number(attributes.startDate.substring(0, 4))
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

    source: null,

    genres: []
  };
}

async function fetchFromAniList({ id, idMal, search }) {
  let query;
  let variables;

  if (id) {
    query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
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
      id: Number(id)
    };
  } else if (idMal) {
    query = `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
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
      idMal: Number(idMal)
    };
  } else if (search) {
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
      search: search
    };
  } else {
    return null;
  }

  const response = await fetch(
    "https://graphql.anilist.co",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        query: query,
        variables: variables
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      "AniList HTTP " + response.status
    );
  }

  const json = await response.json();

  if (json.errors && json.errors.length) {
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

async function fetchFromJikan({ id, idMal, search }) {
  let url;

  if (idMal) {
    url =
      "https://api.jikan.moe/v4/anime/" +
      encodeURIComponent(idMal);
  } else if (search) {
    url =
      "https://api.jikan.moe/v4/anime?q=" +
      encodeURIComponent(search) +
      "&limit=1";
  } else {
    return null;
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      "Jikan HTTP " + response.status
    );
  }

  const json = await response.json();

  const anime = idMal
    ? json.data
    : json.data && json.data[0];

  if (!anime) {
    return null;
  }

  return {
    id:
      anime.mal_id ||
      null,

    anilistId: null,

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
            genre => genre.name
          )
        : []
  };
}

async function findMalIdFromAniList(search) {
  if (!search) {
    return null;
  }

  try {
    const query = `
      query ($search: String) {
        Media(
          search: $search
          type: ANIME
          sort: SEARCH_MATCH
        ) {
          id
          idMal
        }
      }
    `;

    const response = await fetch(
      "https://graphql.anilist.co",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          query: query,
          variables: {
            search: search
          }
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    return (
      json.data &&
      json.data.Media &&
      json.data.Media.idMal
    ) || null;
  } catch (error) {
    console.error(
      "Failed to find MAL ID:",
      error.message
    );

    return null;
  }
}