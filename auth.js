console.log("🔥 AUTH.JS LOADED");
/* =========================================================
   FIREBASE AUTHENTICATION
========================================================= */

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQpDRNYQ4",

  authDomain:
    "danimeverse-c1fa3.firebaseapp.com",

  projectId:
    "danimeverse-c1fa3",

  storageBucket:
    "danimeverse-c1fa3.firebasestorage.app",

  messagingSenderId:
    "626679123848",

  appId:
    "1:626679123848:web:dec7eeffb63885fa48343d",

  measurementId:
    "G-ZQC0SFQR4Q"

};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app =
  getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);


const auth =
  getAuth(app);


const db =
  getFirestore(app);


/* =========================================================
   ADMIN EMAIL
========================================================= */

const ADMIN_EMAIL =
  "dennisackerman246@gmail.com";


/* =========================================================
   SIGN IN
========================================================= */

const signInForm =
  document.getElementById(
    "signInForm"
  );


if (signInForm) {

  signInForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();


      const email =
        document
          .getElementById("loginEmail")
          .value
          .trim();


      const password =
        document
          .getElementById("loginPassword")
          .value;


      const rememberMe =
        document
          .getElementById("rememberMe")
          ?.checked;


      /* ==========================================
         CHECK EMPTY FIELDS
      ========================================== */

      if (
        !email ||
        !password
      ) {

        alert(
          "Please enter your email and password."
        );

        return;

      }


      try {

        /* ========================================
           SET LOGIN PERSISTENCE
        ======================================== */

        await setPersistence(

          auth,

          rememberMe
            ? browserLocalPersistence
            : browserSessionPersistence

        );


        /* ========================================
           SIGN IN
        ======================================== */

        const userCredential =

          await signInWithEmailAndPassword(

            auth,

            email,

            password

          );


        const user =
          userCredential.user;


        console.log(
          "✅ USER SIGNED IN:",
          user.email
        );


        /* ========================================
           CHECK IF USER IS ADMIN
        ======================================== */

        if (

          user.email?.toLowerCase() ===

          ADMIN_EMAIL.toLowerCase()

        ) {

          console.log(
            "🔓 ADMIN LOGIN DETECTED"
          );


          /*
            Admin goes to admin dashboard
          */

          window.location.href =
            "admin.html";


          return;

        }


        /* ========================================
           NORMAL USER
        ======================================== */

        console.log(
          "👤 NORMAL USER LOGIN"
        );


        /*
          Normal users go to homepage
        */

        window.location.href =
          "index.html";


      } catch (error) {

        console.error(
          "❌ SIGN IN ERROR:",
          error
        );


        let message =
          "Login failed. Please check your email and password.";


        if (
          error.code ===
          "auth/invalid-credential"
        ) {

          message =
            "Incorrect email or password.";

        }


        if (
          error.code ===
          "auth/user-not-found"
        ) {

          message =
            "No account exists with this email.";

        }


        if (
          error.code ===
          "auth/wrong-password"
        ) {

          message =
            "Incorrect password.";

        }


        if (
          error.code ===
          "auth/too-many-requests"
        ) {

          message =
            "Too many login attempts. Please try again later.";

        }


        alert(
          message
        );

      }

    }

  );

}


/* =========================================================
   SIGN UP
========================================================= */

const signUpForm =
  document.getElementById(
    "signUpForm"
  );


if (signUpForm) {

  signUpForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();


      const username =
        document
          .getElementById(
            "signupUsername"
          )
          .value
          .trim();


      const email =
        document
          .getElementById(
            "email"
          )
          .value
          .trim();


      const password =
        document
          .getElementById(
            "password"
          )
          .value;


      const genderInput =
        document.querySelector(
          'input[name="gender"]:checked'
        );


      const gender =
        genderInput
          ? genderInput.value
          : "male";


      if (!username) {

        alert(
          "Please enter a username."
        );

        return;

      }


      try {

        const {
          user
        } =

          await createUserWithEmailAndPassword(

            auth,

            email,

            password

          );


        await updateProfile(

          user,

          {
            displayName:
              username
          }

        );


        await setDoc(

          doc(
            db,
            "users",
            user.uid
          ),

          {

            username,

            gender,

            email,

            createdAt:
              Date.now()

          }

        );


        console.log(
          "✅ ACCOUNT CREATED:",
          email
        );


        window.location.href =
          "sign-in.html";


      } catch (error) {

        console.error(
          "❌ SIGN UP ERROR:",
          error
        );


        alert(
          error.message
        );

      }

    }

  );

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

const forgotPassword =
  document.getElementById(
    "forgotPassword"
  );


if (forgotPassword) {

  forgotPassword.addEventListener(
    "click",
    async function (e) {

      e.preventDefault();


      const email =
        document
          .getElementById(
            "loginEmail"
          )
          .value
          .trim();


      if (!email) {

        alert(
          "Enter your email first."
        );

        return;

      }


      try {

        await sendPasswordResetEmail(

          auth,

          email

        );


        alert(
          "Password reset email sent!"
        );


      } catch (error) {

        console.error(
          "❌ PASSWORD RESET ERROR:",
          error
        );


        alert(
          error.message
        );

      }

    }

  );

};