import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  ,
  authDomain: "danimeverse-c1fa3.firebaseapp.com",
  projectId: "danimeverse-c1fa3",
  storageBucket: "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId: "1:626679123848:web:dec7eeffb63885fa48343d",
  measurementId: "G-ZQC0SFQR4Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* STATE */
let animeTitle = "";
let animeId = null;
let currentPage = 1;
let selectedEpisode = null;

/* SEARCH ANIME */
document.getElementById("loadAnime").onclick = async () => {

  const query = document.getElementById("animeSearch").value.trim();

  if (!query) {
    alert("Type anime name");
    return;
  }

  document.getElementById("episodeList").innerHTML =
    "Searching anime...";

  try {

    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`
    );

    const data = await res.json();

    if (!data.data.length) {
      document.getElementById("episodeList").innerHTML =
        "Anime not found";
      return;
    }

    const anime = data.data[0];

    animeTitle = anime.title;
    animeId = anime.mal_id;

    currentPage = 1;

    loadEpisodes();

  } catch (err) {
    console.log(err);
    document.getElementById("episodeList").innerHTML =
      "API error";
  }
};

/* LOAD EPISODES */
async function loadEpisodes() {

  const box = document.getElementById("episodeList");

  box.innerHTML = "Loading episodes...";

  try {

    const res = await fetch(
      `https://api.jikan.moe/v4/anime/${animeId}/episodes?page=${currentPage}`
    );

    const data = await res.json();

    box.innerHTML = "";

    if (!data.data.length) {
      box.innerHTML = "No episodes found.";
      return;
    }

    data.data.forEach(ep => {

      const div = document.createElement("div");

      div.className = "ep";

      div.innerHTML =
        `Episode ${ep.mal_id} — ${ep.title || "No title"}`;

      div.onclick = () => {

        selectedEpisode = {
          number: ep.mal_id,
          title: ep.title || `Episode ${ep.mal_id}`
        };

        document.getElementById(
          "selectedEpisode"
        ).value =
          `Episode ${selectedEpisode.number} - ${selectedEpisode.title}`;
      };

      box.appendChild(div);

    });

    /* NEXT PAGE */
    const nextBtn = document.createElement("button");

    nextBtn.innerText = "Next Episodes →";

    nextBtn.style.marginTop = "10px";

    nextBtn.onclick = () => {
      currentPage++;
      loadEpisodes();
    };

    box.appendChild(nextBtn);

  } catch (err) {
    console.log(err);
    box.innerHTML = "Failed to load episodes.";
  }
}

/* UPLOAD */
document.getElementById("uploadBtn").onclick = async () => {

  const video =
    document.getElementById("video").value.trim();

  if (!animeTitle || !selectedEpisode || !video) {
    alert("Choose an episode and paste video.");
    return;
  }

  const docId =
    `${animeTitle.toLowerCase()}_${selectedEpisode.number}`;

  await setDoc(
    doc(db, "videos", docId),
    {
      anime: animeTitle,
      episode: selectedEpisode.number,
      title: selectedEpisode.title,
      video: video,
      createdAt: Date.now()
    }
  );

  document.getElementById("video").value = "";

  alert(
    `Episode ${selectedEpisode.number} uploaded successfully ✅`
  );
};