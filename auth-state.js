import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQpDRNYQ4",
  authDomain: "danimeverse-c1fa3.firebaseapp.com",
  projectId: "danimeverse-c1fa3",
  storageBucket: "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId: "1:626679123848:web:dec7eeffb63885fa48343d",
  measurementId: "G-ZQC0SFQR4Q"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const MALE_ICON = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 21v-1c0-3.314 3.582-6 8-6s8 2.686 8 6v1H4z"/>
    <rect x="11" y="16" width="2" height="6" rx="1"/>
    <rect x="8" y="20" width="8" height="2" rx="1"/>
  </svg>`;

const FEMALE_ICON = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 21v-1c0-3.314 3.582-6 8-6s8 2.686 8 6v1H4z"/>
    <path d="M9.5 14.5c0 0-1 3 2.5 4s2.5-4 2.5-4" opacity="0.4"/>
  </svg>`;

onAuthStateChanged(auth, async (user) => {
  const userProfile = document.getElementById("userProfile");
  if (!userProfile) return;

  if (user) {
    const username = user.displayName || user.email.split("@")[0];

    let gender = "male";
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) gender = snap.data().gender || "male";
    } catch (_) {}

    const isMale = gender === "male";
    const avatarBg = isMale
      ? "background: linear-gradient(135deg, #3b82f6, #1d4ed8);"
      : "background: linear-gradient(135deg, #ec4899, #9333ea);";
    const icon = isMale ? MALE_ICON : FEMALE_ICON;

    userProfile.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="
          width: 34px; height: 34px; border-radius: 50%;
          ${avatarBg}
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
        ">
          ${icon}
        </div>
        <span style="font-size:13px; font-weight:600; color:#e2e8f0; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${username}
        </span>
        <button id="logoutBtn" style="
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,0.18);
          background: transparent;
          color: #f472b6;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        ">
          Logout
        </button>
      </div>
    `;

    document.getElementById("logoutBtn").addEventListener("mouseenter", e => {
      e.target.style.background = "rgba(255,255,255,0.08)";
    });
    document.getElementById("logoutBtn").addEventListener("mouseleave", e => {
      e.target.style.background = "transparent";
    });
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      location.reload();
    });

  } else {
    userProfile.innerHTML = `
      <a href="sign-in.html"
        class="px-4 py-2 text-sm rounded-full border border-white/20 hover:bg-white/10 transition">
        Sign In
      </a>
      <a href="sign-up.html"
        class="px-4 py-2 text-sm rounded-full bg-pink-500 hover:bg-pink-600 transition">
        Sign up
      </a>
    `;
  }
});
