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
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
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
   GOOGLE AUTH PROVIDER
========================================================= */

const googleProvider =
  new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});


/* =========================================================
   ADMIN EMAIL
========================================================= */

const ADMIN_EMAIL =
  "dennisackerman246@gmail.com";


/* =========================================================
   REDIRECT USER
========================================================= */

async function redirectUser(user) {

  if (
    user.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  ) {

    console.log("🔓 ADMIN LOGIN DETECTED");

    window.location.href =
      "admin.html";

    return;
  }

  console.log("👤 NORMAL USER LOGIN");

  window.location.href =
    "index.html";
}


/* =========================================================
   SIGN IN WITH EMAIL + PASSWORD
========================================================= */

const signInForm =
  document.getElementById("signInForm");

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


      if (!email || !password) {

        alert(
          "Please enter your email and password."
        );

        return;
      }


      try {

        /* LOGIN PERSISTENCE */

        await setPersistence(
          auth,
          rememberMe
            ? browserLocalPersistence
            : browserSessionPersistence
        );


        /* SIGN IN */

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


        await redirectUser(user);


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


        alert(message);

      }

    }
  );

}


/* =========================================================
   GOOGLE SIGN-IN
========================================================= */

const googleSignInButton =
  document.getElementById(
    "googleSignInButton"
  );


if (googleSignInButton) {

  googleSignInButton.addEventListener(
    "click",
    async function () {

      try {

        googleSignInButton.disabled =
          true;

        googleSignInButton.innerHTML =
          `
          <span class="google-spinner"></span>
          Signing in with Google...
          `;


        /* =========================================
           GOOGLE POPUP
        ========================================= */

        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );


        const user =
          result.user;


        console.log(
          "✅ GOOGLE LOGIN:",
          user.email
        );


        /* =========================================
           CHECK IF USER PROFILE EXISTS
        ========================================= */

        const userRef =
          doc(
            db,
            "users",
            user.uid
          );

        const userSnapshot =
          await getDoc(userRef);


        /* =========================================
           CREATE PROFILE FOR NEW GOOGLE USER
        ========================================= */

        if (!userSnapshot.exists()) {

          await setDoc(
            userRef,
            {

              username:
                user.displayName ||
                user.email
                  ?.split("@")[0] ||
                "Anime Fan",

              email:
                user.email || "",

              gender:
                "not-specified",

              photoURL:
                user.photoURL || "",

              provider:
                "google",

              createdAt:
                Date.now()

            }
          );

          console.log(
            "✅ GOOGLE USER PROFILE CREATED"
          );

        }


        /* =========================================
           REDIRECT
        ========================================= */

        await redirectUser(user);


      } catch (error) {

        console.error(
          "❌ GOOGLE SIGN-IN ERROR:",
          error
        );


        googleSignInButton.disabled =
          false;

        googleSignInButton.innerHTML =
          `
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
            />
            <path
              fill="#34A853"
              d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75z"
            />
            <path
              fill="#FBBC05"
              d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.63H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.37l3.24-2.53z"
            />
            <path
              fill="#EA4335"
              d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.18 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03z"
            />
          </svg>

          Continue with Google
          `;


        if (
          error.code ===
          "auth/popup-closed-by-user"
        ) {

          alert(
            "Google sign-in was cancelled."
          );

          return;
        }


        if (
          error.code ===
          "auth/popup-blocked"
        ) {

          alert(
            "Your browser blocked the Google sign-in popup. Please allow popups for Danimeverse."
          );

          return;
        }


        if (
          error.code ===
          "auth/unauthorized-domain"
        ) {

          alert(
            "This website domain is not authorized in Firebase Authentication."
          );

          return;
        }


        if (
          error.code ===
          "auth/operation-not-allowed"
        ) {

          alert(
            "Google Sign-In is not enabled in Firebase. Enable Google under Authentication → Sign-in method."
          );

          return;
        }


        alert(
          "Google Sign-In failed: " +
          error.message
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

            photoURL:
              "",

            provider:
              "password",

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


        let message =
          error.message;


        if (
          error.code ===
          "auth/email-already-in-use"
        ) {

          message =
            "An account already exists with this email.";

        }


        if (
          error.code ===
          "auth/weak-password"
        ) {

          message =
            "Password must be at least 6 characters.";

        }


        if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "Please enter a valid email address.";

        }


        alert(message);

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
          "Enter your email first, then click Forgot Password."
        );

        document
          .getElementById(
            "loginEmail"
          )
          .focus();

        return;
      }


      try {

        await sendPasswordResetEmail(
          auth,
          email
        );


        alert(
          "Password reset email sent! Check your inbox."
        );


      } catch (error) {

        console.error(
          "❌ PASSWORD RESET ERROR:",
          error
        );


        let message =
          "Could not send password reset email.";


        if (
          error.code ===
          "auth/user-not-found"
        ) {

          message =
            "No account exists with this email.";

        }


        if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "Please enter a valid email address.";

        }


        alert(message);

      }

    }
  );

}