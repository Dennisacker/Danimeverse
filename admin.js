console.log("🎬 ADMIN JS LOADED");

import { db, auth } from "./firebase-config.js";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
/* =========================================================
   ADMIN AUTHENTICATION CHECK
========================================================= */

const ADMIN_EMAIL = "dennisackerman246@gmail.com";

const adminDashboard =
  document.querySelector(".main");

onAuthStateChanged(auth, function (user) {

  if (!user) {

    console.log("🔒 NOT LOGGED IN");

    window.location.href =
      "login.html";

    return;

  }

  if (user.email !== ADMIN_EMAIL) {

    console.log(
      "⛔ UNAUTHORIZED USER:",
      user.email
    );

    signOut(auth);

    window.location.href =
      "login.html";

    return;

  }

  console.log(
    "✅ ADMIN AUTHENTICATED:",
    user.email
  );

  if (adminDashboard) {

    adminDashboard.style.display =
      "flex";

  }

});

/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const email =
        loginEmail.value.trim();

      const password =
        loginPassword.value;


      if (!email || !password) {

        showLoginError(
          "Please enter your email and password."
        );

        return;

      }


      try {

        loginBtn.disabled =
          true;

        loginBtn.textContent =
          "⏳ Signing in...";


        const userCredential =
          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );


        const user =
          userCredential.user;
        /* =========================================================
           LOGOUT
        ========================================================= */

        const logoutBtn =
          document.getElementById(
            "logoutBtn"
          );


        if (logoutBtn) {

          logoutBtn.addEventListener(
            "click",
            async function () {

              try {

                await signOut(auth);

                console.log(
                  "👋 ADMIN LOGGED OUT"
                );

              } catch (error) {

                console.error(
                  "❌ LOGOUT ERROR:",
                  error
                );

                showToast(
                  "Failed to logout.",
                  "error"
                );

              }

            }
          );

        }

        /* =================================================
           CHECK ADMIN EMAIL
        ================================================= */

        if (
          user.email?.toLowerCase() !==
          ADMIN_EMAIL.toLowerCase()
        ) {

          await signOut(auth);

          showLoginError(
            "Access denied. This account is not an admin."
          );

          return;

        }


        console.log(
          "✅ ADMIN LOGIN SUCCESS:",
          user.email
        );


        loginError.style.display =
          "none";


      } catch (error) {

        console.error(
          "❌ LOGIN ERROR:",
          error
        );


        let message =
          "Login failed. Check your email and password.";


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


        showLoginError(
          message
        );


      } finally {

        loginBtn.disabled =
          false;

        loginBtn.textContent =
          "🔐 Sign In";

      }

    }
  );

}


/* =========================================================
   AUTH STATE CHECK
========================================================= */

onAuthStateChanged(
  auth,
  user => {

    if (
      user &&
      user.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
    ) {

      console.log(
        "🔓 ADMIN AUTHENTICATED:",
        user.email
      );


      if (loginScreen) {

        loginScreen.style.display =
          "none";

      }


      if (adminDashboard) {

        adminDashboard.style.display =
          "flex";

      }


    } else {

      console.log(
        "🔒 ADMIN NOT AUTHENTICATED"
      );


      if (loginScreen) {

        loginScreen.style.display =
          "flex";

      }


      if (adminDashboard) {

        adminDashboard.style.display =
          "none";

      }

    }

  }
);


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(
  message
) {

  if (!loginError) {

    return;

  }


  loginError.textContent =
    message;

  loginError.style.display =
    "block";

}

/* =========================================================
   ANILIST
========================================================= */

const ANILIST_API =
  "https://graphql.anilist.co";


const QUERY = `
query ($search: String) {

  Page(
    page: 1
    perPage: 10
  ) {

    media(
      search: $search
      type: ANIME
      isAdult: false
      sort: SEARCH_MATCH
    ) {

      idMal

      title {
        romaji
        english
        native
      }

      format

      startDate {
        year
      }

      episodes

      coverImage {
        medium
      }

    }

  }

}
`;


/* =========================================================
   STATE
========================================================= */

let selectedAnime = null;

let searchTimer = null;

let searchRequestId = 0;


/* =========================================================
   ELEMENTS
========================================================= */

const input =
  document.getElementById(
    "animeSearch"
  );

const results =
  document.getElementById(
    "searchResults"
  );

const selectedCard =
  document.getElementById(
    "selectedAnimeCard"
  );

const selectedPoster =
  document.getElementById(
    "selectedPoster"
  );

const selectedTitle =
  document.getElementById(
    "selectedTitle"
  );

const selectedMeta =
  document.getElementById(
    "selectedMeta"
  );

const selectedSlug =
  document.getElementById(
    "selectedSlug"
  );

const epNumber =
  document.getElementById(
    "epNumber"
  );

const epTitle =
  document.getElementById(
    "epTitle"
  );

const epVideo =
  document.getElementById(
    "epVideo"
  );

const uploadBtn =
  document.getElementById(
    "uploadBtn"
  );

const clearBtn =
  document.getElementById(
    "clearBtn"
  );

const uploadedEpList =
  document.getElementById(
    "uploadedEpList"
  );

const uploadedCount =
  document.getElementById(
    "uploadedCount"
  );

const successBanner =
  document.getElementById(
    "successBanner"
  );

const toast =
  document.getElementById(
    "toast"
  );

const urlHistory =
  document.getElementById(
    "urlHistory"
  );

const clearHistoryBtn =
  document.getElementById(
    "clearHistoryBtn"
  );


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value || "")

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = ""
) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.className =
    "";

  toast.classList.add(
    "show"
  );

  if (type) {

    toast.classList.add(
      type
    );

  }

  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    3000
  );

}


/* =========================================================
   SEARCH ANILIST
========================================================= */

async function searchAniList(
  queryText
) {

  const response =
    await fetch(
      ANILIST_API,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            query:
              QUERY,

            variables: {

              search:
                queryText

            }

          })

      }
    );


  if (!response.ok) {

    throw new Error(
      `AniList HTTP ${response.status}`
    );

  }


  const json =
    await response.json();


  if (json.errors) {

    throw new Error(
      json.errors[0]?.message ||
      "AniList search failed"
    );

  }


  return (
    json.data?.Page?.media ||
    []
  );

}


/* =========================================================
   RENDER SEARCH RESULTS
========================================================= */

function renderSearchResults(
  animeList
) {

  const validAnime =
    animeList.filter(
      anime =>
        anime.idMal
    );


  if (!validAnime.length) {

    results.innerHTML = `

      <div
        style="
          padding:12px;
          text-align:center;
          color:#94a3b8;
        "
      >
        No compatible anime found.
      </div>

    `;

    return;

  }


  results.innerHTML =
    validAnime

      .map(
        anime => {

          const title =

            anime.title?.english ||

            anime.title?.romaji ||

            anime.title?.native ||

            "Unknown Anime";


          const image =

            anime.coverImage?.medium ||

            "";


          const type =

            anime.format ||

            "Anime";


          const year =

            anime.startDate?.year ||

            "";


          const episodes =

            anime.episodes ||

            "?";


          return `

            <div

              class="search-result-item"

              data-mal-id="${anime.idMal}"

              data-title="${escapeHtml(title)}"

              data-image="${escapeHtml(image)}"

              data-type="${escapeHtml(type)}"

              data-year="${year}"

            >

              ${
                image

                  ? `

                    <img

                      src="${escapeHtml(image)}"

                      alt="${escapeHtml(title)}"

                    >

                  `

                  : `

                    <div

                      style="
                        width:40px;
                        height:54px;
                        background:#1e293b;
                        border-radius:6px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:9px;
                        color:#64748b;
                      "
                    >
                      N/A
                    </div>

                  `
              }


              <div class="info">

                <h4>
                  ${escapeHtml(title)}
                </h4>


                <p>

                  ${escapeHtml(type)}

                  ${
                    year
                      ? " · " + year
                      : ""
                  }

                  ${
                    episodes !== "?"
                      ? " · " +
                        episodes +
                        " eps"
                      : ""
                  }

                </p>


                <span
                  style="
                    font-size:10px;
                    color:#ec4899;
                  "
                >
                  ▶ Select Anime
                </span>

              </div>

            </div>

          `;

        }
      )

      .join("");

}


/* =========================================================
   SELECT ANIME
========================================================= */

async function selectAnime(
  element
) {

  const malId =
    element.dataset.malId;

  const title =
    element.dataset.title;

  const image =
    element.dataset.image;

  const type =
    element.dataset.type;

  const year =
    element.dataset.year;


  selectedAnime = {

    malId,

    title,

    image,

    type,

    year

  };


  window.selectedAnime =
    selectedAnime;


  console.log(
    "✅ SELECTED ANIME:",
    selectedAnime
  );


  /* UPDATE CARD */

  if (selectedCard) {

    selectedCard.style.display =
      "flex";

  }


  if (selectedPoster) {

    selectedPoster.src =
      image || "";

  }


  if (selectedTitle) {

    selectedTitle.textContent =
      title;

  }


  if (selectedMeta) {

    selectedMeta.textContent =

      `${type}${year ? " · " + year : ""} · MAL ID: ${malId}`;

  }


  if (selectedSlug) {

    selectedSlug.textContent =

      `MAL ID: ${malId}`;

  }


  /* CLOSE SEARCH */

  results.style.display =
    "none";


  /* CLEAR FORM */

  clearForm();


  /* LOAD UPLOADED EPISODES */

  await loadUploadedEpisodes();


  /* EVENT */

  window.dispatchEvent(

    new CustomEvent(

      "danimeverseAnimeSelected",

      {

        detail:
          selectedAnime

      }

    )

  );

}


/* =========================================================
   SEARCH INPUT
========================================================= */

if (input && results) {

  input.addEventListener(
    "input",
    function () {

      clearTimeout(
        searchTimer
      );


      const queryText =
        input.value.trim();


      if (!queryText) {

        results.innerHTML =
          "";

        results.style.display =
          "none";

        return;

      }


      results.style.display =
        "block";


      results.innerHTML = `

        <div
          style="
            padding:12px;
            text-align:center;
            color:#94a3b8;
          "
        >
          Searching AniList...
        </div>

      `;


      searchTimer =

        setTimeout(

          async function () {

            const requestId =

              ++searchRequestId;


            try {

              console.log(

                "🔎 SEARCHING ANILIST:",

                queryText

              );


              const animeList =

                await searchAniList(

                  queryText

                );


              if (

                requestId !==

                searchRequestId

              ) {

                return;

              }


              console.log(

                "✅ ANIME RESULTS:",

                animeList

              );


              renderSearchResults(

                animeList

              );


            } catch (error) {

              console.error(

                "❌ ANILIST SEARCH ERROR:",

                error

              );


              results.innerHTML = `

                <div

                  style="
                    padding:12px;
                    text-align:center;
                    color:#ef4444;
                  "
                >
                  Search failed.
                </div>

              `;

            }

          },

          400

        );

    }

  );


  /* SELECT SEARCH RESULT */

  results.addEventListener(

    "click",

    function (event) {

      const item =

        event.target.closest(

          ".search-result-item"

        );


      if (!item) {

        return;

      }


      selectAnime(

        item

      );

    }

  );

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearForm() {

  if (epNumber) {

    epNumber.value =
      "";

  }


  if (epTitle) {

    epTitle.value =
      "";

  }


  if (epVideo) {

    epVideo.value =
      "";

  }


  if (successBanner) {

    successBanner.style.display =
      "none";

  }

}


/* =========================================================
   SAVE ANIME DOCUMENT
========================================================= */

async function saveAnimeDocument() {

  if (!selectedAnime) {

    throw new Error(
      "Please select an anime first."
    );

  }


  const animeRef =

    doc(

      db,

      "animes",

      String(
        selectedAnime.malId
      )

    );


  await setDoc(

    animeRef,

    {

      title:
        selectedAnime.title,

      image:
        selectedAnime.image,

      malId:
        selectedAnime.malId,

      type:
        selectedAnime.type,

      year:
        selectedAnime.year,

      updatedAt:
        new Date()

    },

    {

      merge:
        true

    }

  );

}


/* =========================================================
   UPLOAD EPISODE
========================================================= */

async function uploadEpisode() {

  if (!selectedAnime) {

    showToast(

      "Please select an anime first.",

      "error"

    );

    return;

  }


  const episodeNumber =

    Number(

      epNumber.value

    );


  const title =

    epTitle.value.trim();


  const videoUrl =

    epVideo.value.trim();


  if (

    !episodeNumber ||

    episodeNumber < 1

  ) {

    showToast(

      "Enter a valid episode number.",

      "error"

    );

    return;

  }


  if (!videoUrl) {

    showToast(

      "Paste the Febbox URL.",

      "error"

    );

    return;

  }


  if (

    !videoUrl.startsWith(

      "http"

    )

  ) {

    showToast(

      "Enter a valid video URL.",

      "error"

    );

    return;

  }


  try {

    uploadBtn.disabled =
      true;


    uploadBtn.textContent =
      "⏳ Saving...";


    /* SAVE ANIME */

    await saveAnimeDocument();


    /* EPISODE DOCUMENT */

    const episodeRef =

      doc(

        db,

        "animes",

        String(

          selectedAnime.malId

        ),

        "episodes",

        `ep_${episodeNumber}`

      );


    await setDoc(

      episodeRef,

      {

        episode:
          episodeNumber,

        title:

          title ||

          `Episode ${episodeNumber}`,

        febboxUrl:
          videoUrl,

        updatedAt:
          new Date(),

        animeTitle:
          selectedAnime.title

      },

      {

        merge:
          true

      }

    );


    console.log(

      "✅ EPISODE SAVED:",

      episodeNumber

    );


    showToast(

      `Episode ${episodeNumber} uploaded successfully!`,

      "success"

    );


    if (successBanner) {

      successBanner.style.display =
        "flex";

    }


    /* SAVE URL HISTORY */

    saveUrlToHistory(

      videoUrl

    );


    /* REFRESH EPISODES */

    await loadUploadedEpisodes();


    /* CLEAR FORM */

    epNumber.value =
      "";

    epTitle.value =
      "";

    epVideo.value =
      "";


  } catch (error) {

    console.error(

      "❌ UPLOAD ERROR:",

      error

    );


    showToast(

      error.message ||

      "Failed to upload episode.",

      "error"

    );

  } finally {

    uploadBtn.disabled =
      false;


    uploadBtn.textContent =
      "▶ Upload Episode";

  }

}


/* =========================================================
   UPLOAD BUTTON
========================================================= */

if (uploadBtn) {

  uploadBtn.addEventListener(

    "click",

    uploadEpisode

  );

}


/* =========================================================
   LOAD UPLOADED EPISODES
========================================================= */

async function loadUploadedEpisodes() {

  if (

    !selectedAnime ||

    !uploadedEpList

  ) {

    return;

  }


  uploadedEpList.innerHTML = `

    <div class="empty">

      Loading episodes...

    </div>

  `;


  try {

    const episodesRef =

      collection(

        db,

        "animes",

        String(

          selectedAnime.malId

        ),

        "episodes"

      );


    const snapshot =

      await getDocs(

        episodesRef

      );


    const episodes = [];


    snapshot.forEach(

      episodeDoc => {

        const data =

          episodeDoc.data();


        episodes.push({

          id:
            episodeDoc.id,

          episode:
            Number(

              data.episode

            ),

          title:

            data.title ||

            "Untitled Episode",

          video:

            data.febboxUrl ||

            data.video ||

            ""

        });

      }

    );


    episodes.sort(

      (a, b) =>

        a.episode -

        b.episode

    );


    uploadedCount.textContent =

      `${episodes.length} episode${episodes.length === 1 ? "" : "s"}`;


    if (!episodes.length) {

      uploadedEpList.innerHTML = `

        <div class="empty">

          No episodes uploaded yet.

        </div>

      `;

      return;

    }


    uploadedEpList.innerHTML =

      episodes

        .map(

          episode => `

            <div

              class="ep-item"

              data-episode="${episode.episode}"

            >

              <span class="ep-num">

                EP ${episode.episode}

              </span>


              <span class="ep-title">

                ${escapeHtml(

                  episode.title

                )}

              </span>


              <span

                class="${
                  episode.video

                    ? "ep-link"

                    : "ep-link missing"
                }"

              >

                ${
                  episode.video

                    ? "✓ Link"

                    : "✕ Missing"
                }

              </span>

            </div>

          `

        )

        .join("");


    /* CLICK EPISODE TO EDIT */

    uploadedEpList

      .querySelectorAll(

        ".ep-item"

      )

      .forEach(

        item => {

          item.addEventListener(

            "click",

            () => {

              const episodeNumber =

                Number(

                  item.dataset.episode

                );


              const episode =

                episodes.find(

                  ep =>

                    ep.episode ===

                    episodeNumber

                );


              if (!episode) {

                return;

              }


              epNumber.value =

                episode.episode;


              epTitle.value =

                episode.title;


              epVideo.value =

                episode.video;


              showToast(

                `Episode ${episodeNumber} loaded for editing.`

              );

            }

          );

        }

      );


  } catch (error) {

    console.error(

      "❌ LOAD EPISODES ERROR:",

      error

    );


    uploadedEpList.innerHTML = `

      <div class="empty">

        Failed to load episodes.

      </div>

    `;

  }

}


/* =========================================================
   CLEAR BUTTON
========================================================= */

if (clearBtn) {

  clearBtn.addEventListener(

    "click",

    clearForm

  );

}


/* =========================================================
   URL HISTORY
========================================================= */

function getUrlHistory() {

  try {

    return JSON.parse(

      localStorage.getItem(

        "danimeverseFebboxHistory"

      ) ||

      "[]"

    );

  } catch {

    return [];

  }

}


function saveUrlToHistory(

  url

) {

  let history =

    getUrlHistory();


  history =

    [

      url,

      ...history.filter(

        item =>

          item !== url

      )

    ]

    .slice(

      0,

      10

    );


  localStorage.setItem(

    "danimeverseFebboxHistory",

    JSON.stringify(

      history

    )

  );


  renderUrlHistory();

}


function renderUrlHistory() {

  if (!urlHistory) {

    return;

  }


  const history =

    getUrlHistory();


  if (!history.length) {

    urlHistory.innerHTML = `

      <div class="empty">

        No URLs saved yet.

      </div>

    `;

    return;

  }


  urlHistory.innerHTML =

    history

      .map(

        url => `

          <div

            class="url-item"

            data-url="${escapeHtml(url)}"

          >

            <span class="url-text">

              ${escapeHtml(url)}

            </span>


            <span class="url-use">

              USE

            </span>

          </div>

        `

      )

      .join("");


  urlHistory

    .querySelectorAll(

      ".url-item"

    )

    .forEach(

      item => {

        item.addEventListener(

          "click",

          () => {

            epVideo.value =

              item.dataset.url;


            showToast(

              "Febbox URL added to form."

            );

          }

        );

      }

    );

}


if (clearHistoryBtn) {

  clearHistoryBtn.addEventListener(

    "click",

    () => {

      localStorage.removeItem(

        "danimeverseFebboxHistory"

      );

      renderUrlHistory();

    }

  );

}


/* =========================================================
   CLEAR SEARCH WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(

  "click",

  event => {

    if (

      results &&

      input &&

      !results.contains(

        event.target

      ) &&

      event.target !== input

    ) {

      results.style.display =
        "none";

    }

  }

);


/* =========================================================
   INITIALIZE
========================================================= */

renderUrlHistory();


console.log(
  "✅ ADMIN READY"
);