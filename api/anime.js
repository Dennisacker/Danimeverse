    
      // api/anime.js

      export default async function handler(req, res) {
        // =========================================
        // CORS
        // =========================================

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        // =========================================
        // OPTIONS
        // =========================================

        if (req.method === "OPTIONS") {
          return res.status(200).end();
        }

        // =========================================
        // ONLY GET
        // =========================================

        if (req.method !== "GET") {
          return res.status(405).json({
            success: false,
            error: "Method not allowed"
          });
        }

        try {
          const { id, idMal, search } = req.query;

          // =========================================
          // VALIDATE
          // =========================================

          if (!id && !idMal && !search) {
            return res.status(400).json({
              success: false,
              error: "Missing id, idMal, or search parameter"
            });
          }

          // =========================================
          // 1. KITSU
          // =========================================

          try {
            console.log("🔎 Trying Kitsu...");

            const kitsuResult = await fetchFromKitsu({
              id,
              idMal,
              search
            });

            if (kitsuResult) {
              console.log(
                "📡 Kitsu result:",
                kitsuResult.title,
                "MAL:",
                kitsuResult.malId
              );

              // For search requests, only return Kitsu
              // if it has a MAL ID.
              if (kitsuResult.malId) {
                console.log("✅ Returning Kitsu result");

                return res.status(200).json({
                  success: true,
                  provider: "kitsu",
                  data: kitsuResult
                });
              }

              console.log(
                "⚠️ Kitsu result has no MAL ID. Trying AniList..."
              );
            } else {
              console.log("⚠️ Kitsu found nothing");
            }
          } catch (error) {
            console.error(
              "❌ Kitsu error:",
              error.message
            );
          }

          // =========================================
          // 2. ANILIST
          // =========================================

          try {
            console.log("🔎 Trying AniList...");

            const anilistResult = await fetchFromAniList({
              id,
              idMal,
              search
            });

            if (anilistResult) {
              console.log(
                "📡 AniList result:",
                anilistResult.title,
                "MAL:",
                anilistResult.malId
              );

              if (anilistResult.malId) {
                console.log("✅ Returning AniList result");

                return res.status(200).json({
                  success: true,
                  provider: "anilist",
                  data: anilistResult
                });
              }

              console.log(
                "⚠️ AniList result has no MAL ID. Trying Jikan..."
              );
            } else {
              console.log("⚠️ AniList found nothing");
            }
          } catch (error) {
            console.error(
              "❌ AniList error:",
              error.message
            );
          }

          // =========================================
          // 3. JIKAN
          // =========================================

          try {
            console.log("🔎 Trying Jikan...");

            const jikanResult = await fetchFromJikan({
              id,
              idMal,
              search
            });

            if (jikanResult) {
              console.log(
                "📡 Jikan result:",
                jikanResult.title,
                "MAL:",
                jikanResult.malId
              );

              if (jikanResult.malId) {
                console.log("✅ Returning Jikan result");

                return res.status(200).json({
                  success: true,
                  provider: "jikan",
                  data: jikanResult
                });
              }
            }

            console.log("⚠️ Jikan found nothing");
          } catch (error) {
            console.error(
              "❌ Jikan error:",
              error.message
            );
          }

          // =========================================
          // NOTHING FOUND
          // =========================================

          return res.status(404).json({
            success: false,
            error: "Anime not found",
            message:
              "AniList, Jikan, and Kitsu could not find a usable anime result."
          });

        } catch (error) {
          console.error(
            "❌ API Gateway crashed:",
            error
          );

          return res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error.message
          });
        }
      }


      // =====================================================
      // KITSU
      // =====================================================

      async function fetchFromKitsu({ id, idMal, search }) {
        let url = "";

        // Kitsu ID
        if (id) {
          url =
            "https://kitsu.io/api/edge/anime/" +
            encodeURIComponent(id);
        }

        // MAL ID
        else if (idMal) {
          url =
            "https://kitsu.io/api/edge/anime?filter[malId]=" +
            encodeURIComponent(idMal);
        }

        // Search title
        else if (search) {
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
          throw new Error(
            "Kitsu HTTP " + response.status
          );
        }

        const json = await response.json();

        let anime = null;

        if (id) {
          anime = json.data;
        } else {
          anime = json.data && json.data[0];
        }

        if (!anime) {
          return null;
        }

        const attributes = anime.attributes || {};
        const titles = attributes.titles || {};
        const poster = attributes.posterImage || {};
        const cover = attributes.coverImage || {};

        return {
          id: anime.id || null,

          anilistId: null,

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

          source: null,

          genres: []
        };
      }


      // =====================================================
      // ANILIST
      // =====================================================

      async function fetchFromAniList({
        id,
        idMal,
        search
      }) {
        let query = "";
        let variables = {};

        // =========================================
        // BY ANILIST ID
        // =========================================

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
            id: Number(id)
          };
        }

        // =========================================
        // BY MAL ID
        // =========================================

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
            idMal: Number(idMal)
          };
        }

        // =========================================
        // BY TITLE
        // =========================================

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

        // =========================================
        // CALL ANILIST
        // =========================================

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

        if (
          json.errors &&
          json.errors.length
        ) {
          throw new Error(
            json.errors[0].message ||
            "AniList API error"
          );
        }

        const anime =
          json.data &&
          json.data.Media;

        if (!anime) {
          return null;
        }

        return {
          id: anime.id || null,

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


      // =====================================================
      // JIKAN
      // =====================================================

      async function fetchFromJikan({
        id,
        idMal,
        search
      }) {
        let url = "";

        // =========================================
        // BY MAL ID
        // =========================================

        if (idMal) {
          url =
            "https://api.jikan.moe/v4/anime/" +
            encodeURIComponent(idMal);
        }

        // =========================================
        // ANILIST ID
        // Jikan cannot search by AniList ID
        // =========================================

        else if (id) {
          return null;
        }

        // =========================================
        // BY TITLE
        // =========================================

        else if (search) {
          url =
            "https://api.jikan.moe/v4/anime?q=" +
            encodeURIComponent(search) +
            "&limit=1";
        }

        if (!url) {
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
            anime.title ||
            anime.title_english ||
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
                  function (genre) {
                    return genre.name;
                  }
                )
              : []
        };
      }
    
