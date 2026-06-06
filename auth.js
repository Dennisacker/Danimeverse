import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

/* =========================
   SIGN IN
========================= */

const signInForm = document.getElementById("signInForm");

if (signInForm) {
  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe")?.checked;

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, password);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } catch (error) {
      alert(error.message);
    }
  });
}

/* =========================
   SIGN UP
========================= */

const signUpForm = document.getElementById("signUpForm");

if (signUpForm) {
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const gender = genderInput ? genderInput.value : "male";

    if (!username) {
      alert("Please enter a username.");
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(user, { displayName: username });

      await setDoc(doc(db, "users", user.uid), {
        username,
        gender,
        email,
        createdAt: Date.now()
      });

      window.location.href = "sign-in.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

/* =========================
   FORGOT PASSWORD
========================= */

const forgotPassword = document.getElementById("forgotPassword");

if (forgotPassword) {
  forgotPassword.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;

    if (!email) {
      alert("Enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (error) {
      alert(error.message);
    }
  });
}
