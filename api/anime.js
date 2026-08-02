  // api/anime.js

  export default async function handler(req, res) {
    // =========================
    // CORS
    // =========================

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // =========================
    // OPTIONS
    // =========================

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // =========================
    // ONLY GET
    // =========================

    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed"
      });
    }

    try {
      const { id, idMal, search } = req.query;

      // =========================
      // VALIDATE REQUEST
      // =========================

      if (!id && !idMal && !search) {
        return res.status(400).json({
          success: false,
          error: "Missing id, idMal, or search parameter"
        });
      }

      console.log("=================================");
      console.log("🚀 DANIMEVERSE ANIME API");
      console.log("ID:", id || "none");
      console.log("MAL ID:", idMal || "none");
      console.log("SEARCH:", search || "none");
      console.log("=================================");

      // =====================================================
      // 1. ANILIST
      // =====================================================

      try {
        console.log("🔎 Trying AniList...");

        const anime = await fetchFromAniList({
          id,
          idMal,
          search
        });

        if (anime) {
          console.log(
            "✅ AniList found:",
            anime.title,
            "MAL ID:",
            anime.malId
          );

          // For title searches, we need a MAL ID
          // because the current anime.html system
          // uses anime.html?malId=123

          if (anime.malId || id || idMal) {
            return res.status(200).json({
              success: true,
              provider: "anilist",
              data: anime
            });
          }

          console.log(
            "⚠️ AniList found anime but no MAL ID"
          );
        } else {
          console.log(
            "⚠️ AniList returned no anime"
          );
        }

      } catch (error) {
        console.error(
          "❌ AniList failed:",
          error.message
        );
      }

      // =====================================================
      // 2. JIKAN
      // =====================================================

      try {
        console.log("🔎 Trying Jikan...");

        const anime = await fetchFromJikan({
          id,
          idMal,
          search
        });

        if (anime) {
          console.log(
            "✅ Jikan found:",
            anime.title,
            "MAL ID:",
            anime.malId
          );

          return res.status(200).json({
            success: true,
            provider: "jikan",
            data: anime
          });
        }

        console.log(
          "⚠️ Jikan returned no anime"
        );

      } catch (error) {
        console.error(
          "❌ Jikan failed:",
          error.message
        );
      }

      // =====================================================
      // 3. KITSU
      // =====================================================

      try {
        console.log("🔎 Trying Kitsu...");

        const anime = await fetchFromKitsu({
          id,
          idMal,
          search
        });

        if (anime) {
          console.log(
            "✅ Kitsu found:",
            anime.title,
            "MAL ID:",
            anime.malId
          );

          // If Kitsu does not have a MAL ID,
          // the existing anime.html?malId system
          // cannot use this result.

          if (anime.malId || idMal) {
            return res.status(200).json({
              success: true,
              provider: "kitsu",
              data: anime
            });
          }

          console.log(
            "⚠️ Kitsu found anime but no MAL ID"
          );
        } else {
          console.log(
            "⚠️ Kitsu returned no anime"
          );
        }

      } catch (error) {
        console.error(
          "❌ Kitsu failed:",
          error.message
        );
      }

      // =====================================================
      // NOTHING FOUND
      // =====================================================

      return res.status(404).json({
        success: false,
        error: "Anime not found",
        message:
          "AniList, Jikan, and Kitsu could not find a usable anime result."
      });

    } catch (error) {
      console.error(
        "❌ API Gateway Error:",
        error
      );

return res.status(500).json({
  success: false,
  error: "All anime APIs failed",
  debug: {
    message: "AniList, Jikan, and Kitsu did not return a usable result.",
    search: search || null,
    id: id || null,
    idMal: idMal || null
  }
});


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

    // =========================
    // SEARCH BY ANILIST ID
    // =========================

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
      `;

      variables = {
        id: Number(id)
      };
    }

    // =========================
    // SEARCH BY MAL ID
    // =========================

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
      `;

      variables = {
        idMal: Number(idMal)
      };
    }

    // =========================
    // SEARCH BY TITLE
    // =========================

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
      `;

      variables = {
        search: String(search)
      };
    }

    else {
      return null;
    }

    // =========================
    // REQUEST ANILIST
    // =========================

    const response = await fetch(
      "https://graphql.anilist.co",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify({
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

    const json = await response.json();

    // =========================
    // GRAPHQL ERRORS
    // =========================

    if (
      json.errors &&
      json.errors.length > 0
    ) {
      throw new Error(
        json.errors[0]?.message ||
        "AniList GraphQL error"
      );
    }

    const anime =
      json.data?.Media;

    if (!anime) {
      return null;
    }

    // =========================
    // NORMALIZE RESULT
    // =========================

    return {
      id: anime.id || null,

      anilistId:
        anime.id || null,

      malId:
        anime.idMal || null,

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
        anime.coverImage?.medium ||
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


  // =========================================================
  // JIKAN
  // =========================================================

  async function fetchFromJikan({
    id,
    idMal,
    search
  }) {
    let url;

    // =========================
    // SEARCH BY MAL ID
    // =========================

    if (idMal) {
      url =
        `https://api.jikan.moe/v4/anime/${encodeURIComponent(idMal)}`;
    }

    // =========================
    // JIKAN DOES NOT SUPPORT
    // ANILIST ID DIRECTLY
    // =========================

    else if (id) {
      return null;
    }

    // =========================
    // SEARCH BY TITLE
    // =========================

    else if (search) {
      url =
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(search)}&limit=1`;
    }

    else {
      return null;
    }

    // =========================
    // REQUEST JIKAN
    // =========================

    const response = await fetch(
      url,
      {
        headers: {
          "Accept": "application/json"
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

    // =========================
    // NORMALIZE RESULT
    // =========================

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
        anime.images?.jpg?.image_url ||
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
        anime.aired?.prop?.from?.year ||
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
        anime.genres?.map(
          genre => genre.name
        ) || []
    };
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

    // =========================
    // SEARCH BY KITSU ID
    // =========================

    if (id) {
      url =
        `https://kitsu.io/api/edge/anime/${encodeURIComponent(id)}`;
    }

    // =========================
    // SEARCH BY MAL ID
    // =========================

    else if (idMal) {
      url =
        `https://kitsu.io/api/edge/anime?filter[malId]=${encodeURIComponent(idMal)}&page[limit]=1`;
    }

    // =========================
    // SEARCH BY TITLE
    // =========================

    else if (search) {
      url =
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(search)}&page[limit]=1`;
    }

    else {
      return null;
    }

    // =========================
    // REQUEST KITSU
    // =========================

    const response = await fetch(
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

    const anime =
      id
        ? json.data
        : json.data?.[0];

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

    // =========================
    // NORMALIZE RESULT
    // =========================

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

      genres:
        []
    };
  }