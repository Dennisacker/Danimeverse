import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQpDRNYQ4",
  authDomain: "danimeverse-c1fa3.firebaseapp.com",
  projectId: "danimeverse-c1fa3",
  storageBucket: "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId: "1:626679123848:web:dec7eeffb63885fa48343d",
  measurementId: "G-ZQC0SFQR4Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const userProfile = document.getElementById("userProfile");
  if (!userProfile) return;

  if (user) {
    userProfile.innerHTML = `
      <span class="text-sm text-slate-300">👤 ${user.email}</span>
      <button id="logoutBtn" class="px-4 py-2 text-sm rounded-full border border-white/20 hover:bg-white/10 transition text-pink-400">
        Logout
      </button>
    `;

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
