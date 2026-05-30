/* =========================
   SEARCH — Site Catalogue First, Jikan Fallback
========================= */

const SITE_CATALOG = [
  { title: "Naruto",            keywords: ["naruto","uzumaki"],                          page: "naruto.html",                 image: "https://cdn.myanimelist.net/images/anime/13/17405.jpg",     genres: "Action · Adventure" },
  { title: "Attack on Titan",   keywords: ["aot","titan","shingeki","eren"],             page: "aot.html",                    image: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",     genres: "Action · Dark Fantasy" },
  { title: "Demon Slayer",      keywords: ["demon","kimetsu","tanjiro","yaiba"],         page: "demon-slayer.html",           image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",   genres: "Action · Shonen" },
  { title: "Jujutsu Kaisen",    keywords: ["jjk","jujutsu","gojo","itadori"],            page: "jujutsu-kaisen.html",         image: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",  genres: "Action · Supernatural" },
  { title: "Chainsaw Man",      keywords: ["chainsaw","denji","power"],                  page: "chainsaw-man.html",           image: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg",  genres: "Action · Dark" },
  { title: "Fire Force",        keywords: ["fire","enen","shinra"],                      page: "fire-force.html",             image: "https://cdn.myanimelist.net/images/anime/1715/100536.jpg",  genres: "Action · Sci-Fi" },
  { title: "Dr. Stone",         keywords: ["stone","senku","dr stone"],                  page: "dr-stone.html",               image: "https://cdn.myanimelist.net/images/anime/1613/102576.jpg",  genres: "Sci-Fi · Adventure" },
  { title: "Re:Zero",           keywords: ["rezero","re zero","subaru","emilia"],        page: "rezero.html",                 image: "https://cdn.myanimelist.net/images/anime/1522/128039.jpg",  genres: "Fantasy · Drama" },
  { title: "Mushoku Tensei",    keywords: ["mushoku","rudeus","isekai"],                 page: "mushoku-tensei.html",         image: "https://cdn.myanimelist.net/images/anime/1530/117776.jpg",  genres: "Fantasy · Isekai" },
  { title: "My Hero Academia",  keywords: ["mha","bnha","boku no hero","deku","midoriya"],page: "my-hero-academia.html",      image: "https://cdn.myanimelist.net/images/anime/10/78745.jpg",     genres: "Action · School" },
  { title: "Assassination Classroom", keywords: ["ansatsu","koro","korosensei"],         page: "assassination-classroom.html",image: "https://cdn.myanimelist.net/images/anime/5/75639.jpg",     genres: "Action · Comedy" },
  { title: "Fate/Strange Fake", keywords: ["fate","strange fake"],                       page: "fate-strange-fake.html",      image: "https://cdn.myanimelist.net/images/anime/1764/134379.jpg",  genres: "Action · Fantasy" },
  { title: "Frieren",           keywords: ["sousou","frieren","journey"],                page: "frieren.html",                image: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",  genres: "Adventure · Drama" },
  { title: "Hell's Paradise",   keywords: ["jigokuraku","hell paradise","gabimaru"],     page: "hells-paradise.html",         image: "https://cdn.myanimelist.net/images/anime/1438/134581.jpg",  genres: "Action · Dark" },
  { title: "Oshi no Ko",        keywords: ["oshi","idol","aqua","ruby"],                 page: "oshi-no-ko.html",             image: "https://cdn.myanimelist.net/images/anime/1812/134736.jpg",  genres: "Drama · Mystery" },
  { title: "Solo Leveling",     keywords: ["solo","jinwoo","level up","ore dake"],       page: "solo-leveling.html",          image: "https://cdn.myanimelist.net/images/anime/1325/140390.jpg",  genres: "Action · Fantasy" },
  { title: "Tokyo Revengers",   keywords: ["tokyo rev","takemichi","mikey"],             page: "tokyo-revengers.html",        image: "https://cdn.myanimelist.net/images/anime/1839/110491.jpg",  genres: "Action · Drama" },
  { title: "Witch Hat Atelier", keywords: ["tongari","witch hat","coco"],                page: "witch-hat-atelier.html",      image: "https://cdn.myanimelist.net/images/anime/1826/139048.jpg",  genres: "Fantasy · Adventure" },
];

function matchSite(query) {
  const q = query.toLowerCase();
  return SITE_CATALOG.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.keywords.some(k => k.includes(q) || q.includes(k))
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput   = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  if (!searchInput || !searchResults) return;

  let debounceTimer;

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (!query) {
      searchResults.classList.add("hidden");
      searchResults.innerHTML = "";
      return;
    }

    // — instant site-catalogue results (no network) —
    const siteMatches = matchSite(query);
    let html = "";

    if (siteMatches.length) {
      html += `<p style="font-size:10px;font-weight:700;letter-spacing:.08em;color:#ec4899;padding:8px 12px 2px;text-transform:uppercase;">On Danimeverse</p>`;
      siteMatches.forEach(a => {
        html += `
          <a href="${a.page}"
             class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition">
            <img src="${a.image}" class="w-12 h-16 object-cover rounded-lg" loading="lazy" />
            <div>
              <h4 class="text-sm font-semibold text-white">${a.title}</h4>
              <p class="text-xs text-slate-400">${a.genres}</p>
              <span style="font-size:10px;background:#ec4899;color:white;padding:1px 7px;border-radius:999px;">▶ Watch</span>
            </div>
          </a>`;
      });
    }

    searchResults.innerHTML = html || "";
    searchResults.classList.remove("hidden");

    // — Jikan fallback after 350 ms debounce —
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=6`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.data?.length) return;

        // filter out titles already shown from site
        const siteNames = new Set(siteMatches.map(a => a.title.toLowerCase()));
        const external = data.data.filter(a =>
          !siteNames.has((a.title_english || a.title).toLowerCase())
        ).slice(0, 5);

        if (!external.length) return;

        let jikanHtml = `<p style="font-size:10px;font-weight:700;letter-spacing:.08em;color:#94a3b8;padding:8px 12px 2px;text-transform:uppercase;">More Anime</p>`;
        external.forEach(a => {
          const siteHit = matchSite(a.title_english || a.title)[0];
          const href = siteHit ? siteHit.page : "#";
          jikanHtml += `
            <a href="${href}"
               class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition">
              <img src="${a.images.jpg.image_url}" class="w-12 h-16 object-cover rounded-lg" loading="lazy" />
              <div>
                <h4 class="text-sm font-semibold text-white">${a.title_english || a.title}</h4>
                <p class="text-xs text-slate-400">${a.type || "Anime"}</p>
                ${siteHit ? '<span style="font-size:10px;background:#ec4899;color:white;padding:1px 7px;border-radius:999px;">▶ On Site</span>' : ""}
              </div>
            </a>`;
        });

        searchResults.innerHTML = html + jikanHtml;
      } catch (_) {}
    }, 350);
  });

  // close on outside click
  document.addEventListener("click", e => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.add("hidden");
    }
  });
});
