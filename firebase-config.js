/* ================================================================
   firebase-config.js — Single shared Firebase initialisation
   Import this in every module that needs Firebase.
================================================================ */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }                 from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }            from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQpDRNYQ4",
  authDomain:        "danimeverse-c1fa3.firebaseapp.com",
  projectId:         "danimeverse-c1fa3",
  storageBucket:     "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId:             "1:626679123848:web:dec7eeffb63885fa48343d",
  measurementId:     "G-ZQC0SFQR4Q"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };
