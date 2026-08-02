export default async function handler(req, res) {
  try {
    // Allow only GET requests
    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const { id, idMal, search } = req.query;

    let query;
    let variables;

    // Search by AniList ID
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
    }

    // Search by MyAnimeList ID
    else if (idMal) {
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
    }

    // Search by anime title
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
    }

    // No search parameter
    else {
      return res.status(400).json({
        error: "Missing id, idMal, or search parameter"
      });
    }

    // Send request to AniList
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

    // Read AniList response
    const data = await response.json();

    console.log(
      "AniList response status:",
      response.status
    );

    // Return AniList response to browser
    return res
      .status(response.status)
      .json(data);

  } catch (error) {

    console.error(
      "AniList proxy error:",
      error
    );

    return res.status(500).json({
      error: "AniList proxy server error",
      message: error.message
    });
  }
}