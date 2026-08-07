require("dotenv").config();

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { anime } = req.query;

  if (!anime) {
    return res.status(400).json({
      error: "Anime name missing",
    });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(
        anime
      )}`
    );

    if (!response.ok) {
      throw new Error(`TMDB returned ${response.status}`);
    }

    const data = await response.json();

    const result = data.results?.[0];

    return res.status(200).json({
      backdrop: result?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${result.backdrop_path}`
        : null,
    });
  } catch (error) {
    console.error("Backdrop API Error:", error);

    return res.status(500).json({
      error: "TMDB request failed",
    });
  }
};