import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

      // 🔐 Set persistence
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      await signInWithEmailAndPassword(auth, email, password);

      alert("Signed in successfully!");

      window.location.href = "index.html";

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

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

      await createUserWithEmailAndPassword(auth, email, password);

      alert("Account created successfully!");

      window.location.href = "signin.html";

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
