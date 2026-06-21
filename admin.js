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
  apiKey: "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQ4",
  authDomain: "danimeverse-c1fa3.firebaseapp.com",
  projectId: "danimeverse-c1fa3",
  storageBucket: "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId: "1:626679123848:web:dec7eeffb63885fa48343d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* STATE */
let currentAnime = "";
let episodes = [];

/* SLUG */
const slug = (t) =>
  t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

/* AUTO DETECT OR CREATE ANIME */
document.getElementById("loadAnime").onclick = async () => {

  const input = document.getElementById("animeSearch").value.trim();
  if (!input) return alert("Type anime name");

  currentAnime = slug(input);

  document.getElementById("animeTitle").innerText = input;
  document.getElementById("animeSlug").innerText = currentAnime;

  loadEpisodes();
};

/* LOAD EPISODES */
async function loadEpisodes() {

  const box = document.getElementById("episodeList");
  box.innerHTML = "Loading...";

  const snap = await getDocs(collection(db, "videos"));

  episodes = [];

  snap.forEach(d => {
    const data = d.data();

    if (data.anime === currentAnime) {
      episodes.push(data);
    }
  });

  episodes.sort((a, b) => a.episode - b.episode);

  box.innerHTML = "";

  if (!episodes.length) {
    box.innerHTML = "No episodes yet";
    return;
  }

  episodes.forEach(ep => {

    const div = document.createElement("div");
    div.className = "ep";
    div.innerText = `Ep ${ep.episode} — ${ep.title}`;

    div.onclick = () => {
      document.getElementById("episode").value = ep.episode;
      document.getElementById("title").value = ep.title;
      document.getElementById("video").value = ep.video;
    };

    box.appendChild(div);
  });
}

/* AUTO EPISODE NUMBER */
function getNextEpisode() {
  if (!episodes.length) return 1;
  return episodes[episodes.length - 1].episode + 1;
}

/* UPLOAD (NETFLIX STYLE AUTO) */
document.getElementById("uploadBtn").onclick = async () => {

  const title = document.getElementById("title").value.trim();
  const video = document.getElementById("video").value.trim();

  if (!currentAnime || !video) {
    alert("Load anime + paste video");
    return;
  }

  const nextEp = getNextEpisode();
  const docId = `${currentAnime}_${nextEp}`;

  await setDoc(doc(db, "videos", docId), {
    anime: currentAnime,
    episode: nextEp,
    title: title || `Episode ${nextEp}`,
    video,
    createdAt: Date.now()
  });

  alert(`Episode ${nextEp} uploaded ✅`);

  document.getElementById("title").value = "";
  document.getElementById("video").value = "";

  loadEpisodes();
};