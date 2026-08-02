export default async function handler(req, res) {
try {
if (req.method !== "GET") {
return res.status(405).json({
success: false,
error: "Method not allowed"
});
}

```
const search = req.query.search;

if (!search) {
  return res.status(400).json({
    success: false,
    error: "Missing search parameter"
  });
}

console.log("Searching Kitsu for:", search);

const url =
  "https://kitsu.io/api/edge/anime?filter[text]=" +
  encodeURIComponent(search) +
  "&page[limit]=1";

const response = await fetch(url);

if (!response.ok) {
  throw new Error(
    "Kitsu HTTP " + response.status
  );
}

const json = await response.json();

const anime =
  json.data &&
  json.data.length > 0
    ? json.data[0]
    : null;

if (!anime) {
  return res.status(404).json({
    success: false,
    error: "Anime not found"
  });
}

const attributes =
  anime.attributes || {};

const titles =
  attributes.titles || {};

const poster =
  attributes.posterImage || {};

const cover =
  attributes.coverImage || {};

const result = {
  id:
    anime.id || null,

  anilistId:
    null,

  malId:
    attributes.malId || null,

  title:
    titles.en ||
    titles.en_us ||
    titles.en_jp ||
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
      ? Number(
          attributes.startDate.substring(0, 4)
        )
      : null,

  episodes:
    attributes.episodeCount ||
    null,

  type:
    attributes.subtype ||
    attributes.showType ||
    null,

  format:
    attributes.subtype ||
    attributes.showType ||
    null,

  source:
    null,

  genres:
    []
};

console.log(
  "Kitsu result:",
  result.title
);

return res.status(200).json({
  success: true,
  provider: "kitsu",
  data: result
});
```

} catch (error) {
console.error(
"API ERROR:",
error
);

```
return res.status(500).json({
  success: false,
  error: "Internal server error",
  message:
    error.message ||
    "Unknown server error"
});
```

}
}
