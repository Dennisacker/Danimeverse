export default async function handler(req, res) {
  try {
    const { id, idMal, search } = req.query;

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
    }

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
        search
      };
    }

    else {
      return res.status(400).json({
        error: "Missing id, idMal, or search parameter"
      });
    }

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "AniList API request failed",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("AniList API error:", error);

    return res.status(500).json({
      error: "Failed to fetch AniList data",
      message: error.message
    });
  }
}