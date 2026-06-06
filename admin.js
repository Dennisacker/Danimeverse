import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "dennisckerman246@gmail.com";

onAuthStateChanged(auth, user => {

  if (!user) {
    location.href = "sign-in.html";
    return;
  }

  if (user.email !== ADMIN_EMAIL) {
    document.body.innerHTML =
      "<h1 style='color:white;text-align:center;margin-top:100px'>Access Denied</h1>";
  }

});

document.getElementById("saveBtn").addEventListener("click", async () => {

  const anime =
    document.getElementById("anime").value.trim();

  const episode =
    document.getElementById("episode").value.trim();

  const video =
    document.getElementById("video").value.trim();

  const status =
    document.getElementById("status");

  if (!anime || !episode || !video) {
    status.textContent = "Fill all fields";
    return;
  }

  try {

    const docId =
      `${anime.toLowerCase()}_${episode}`;

    await setDoc(
      doc(db, "videos", docId),
      {
        anime,
        episode,
        video,
        createdAt: Date.now()
      }
    );

    status.textContent = "✅ Saved successfully";

    document.getElementById("episode").value = "";
    document.getElementById("video").value = "";

  } catch (err) {

    console.error(err);

    status.textContent =
      "❌ Failed to save";

  }

});