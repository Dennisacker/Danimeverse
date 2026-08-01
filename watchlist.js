import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQpDRNYQ4",
  authDomain: "danimeverse-c1fa3.firebaseapp.com",
  projectId: "danimeverse-c1fa3",
  storageBucket: "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId: "1:626679123848:web:dec7eeffb63885fa48343d"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   HELPERS
========================================================= */

function slugify(title) {

  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  success = true
) {

  let toast =
    document.getElementById(
      "wl-toast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );


    toast.id =
      "wl-toast";


    toast.style.position =
      "fixed";

    toast.style.bottom =
      "30px";

    toast.style.right =
      "30px";

    toast.style.zIndex =
      "9999";

    toast.style.padding =
      "14px 20px";

    toast.style.borderRadius =
      "10px";

    toast.style.color =
      "white";

    toast.style.fontWeight =
      "600";

    toast.style.fontSize =
      "14px";

    toast.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.4)";

    toast.style.transition =
      "opacity .3s ease";


    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.style.background =
    success
      ? "#ec4899"
      : "#dc2626";


  toast.style.opacity =
    "1";


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      () => {

        toast.style.opacity =
          "0";

      },
      2500
    );

}


/* =========================================================
   GET SAVED WATCHLIST SLUGS
========================================================= */

async function getWatchlistSlugs(
  uid
) {

  const snapshot =
    await getDocs(

      collection(
        db,
        "watchlists",
        uid,
        "items"
      )

    );


  return new Set(

    snapshot.docs.map(
      document =>
        document.id
    )

  );

}


/* =========================================================
   ADD ANIME
========================================================= */

async function addItem(
  uid,
  anime
) {

  const slug =
    slugify(
      anime.title
    );


  await setDoc(

    doc(
      db,
      "watchlists",
      uid,
      "items",
      slug
    ),

    {

      title:
        anime.title || "",

      img:
        anime.img || "",

      desc:
        anime.desc || "",

      genres:
        anime.genres || "",

      malId:
        anime.malId
          ? Number(anime.malId)
          : null,

      addedAt:
        Date.now()

    }

  );


  return slug;

}


/* =========================================================
   REMOVE ANIME
========================================================= */

async function removeItem(
  uid,
  slug
) {

  await deleteDoc(

    doc(
      db,
      "watchlists",
      uid,
      "items",
      slug
    )

  );

}


/* =========================================================
   OPEN ANIME FROM MY LIST
   Uses the same AniList system as api.js
========================================================= */

async function openSavedAnime(
  anime
) {

  if (
    !anime.malId
  ) {

    showToast(
      "This anime is missing its MAL ID.",
      false
    );

    return;

  }


  const malId =
    Number(
      anime.malId
    );


  const fallbackTitle =
    anime.title ||
    "Unknown Anime";


  try {

    console.log(
      "🎬 Opening saved anime:",
      fallbackTitle,
      "MAL ID:",
      malId
    );


    const query = `

      query ($malId: Int) {

        Media(
          idMal: $malId,
          type: ANIME
        ) {

          id

          idMal

          title {

            romaji

            english

            native

          }

        }

      }

    `;


    const response =
      await fetch(
        "https://graphql.anilist.co",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Accept":
              "application/json"

          },

          body:
            JSON.stringify({

              query,

              variables: {

                malId

              }

            })

        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `AniList API Error: ${response.status}`
      );

    }


    const result =
      await response.json();


    if (
      result.errors
    ) {

      throw new Error(
        "AniList returned an error"
      );

    }


    const anilistAnime =
      result.data?.Media;


    if (
      !anilistAnime
    ) {

      throw new Error(
        "Anime not found on AniList"
      );

    }


    const anilistId =
      anilistAnime.id;


    const animeTitle =

      anilistAnime.title?.english ||

      anilistAnime.title?.romaji ||

      anilistAnime.title?.native ||

      fallbackTitle;


    const params =
      new URLSearchParams({

        anilistId:
          String(
            anilistId
          ),

        anime:
          animeTitle,

        ep:
          "1",

        malId:
          String(
            malId
          )

      });


    window.location.href =
      `watch.html?${params.toString()}`;


  } catch (error) {

    console.error(
      "❌ Failed to open saved anime:",
      error
    );


    showToast(
      `Could not open ${fallbackTitle}. Please try again.`,
      false
    );

  }

}


/* =========================================================
   INJECT WATCHLIST BUTTONS INTO HOMEPAGE CARDS
========================================================= */

function injectButtons(
  uid,
  slugs
) {

  document
    .querySelectorAll(
      "article.glass-card"
    )
    .forEach(
      card => {

        if (
          card.querySelector(
            ".wl-btn"
          )
        ) {

          return;

        }


        const imgEl =
          card.querySelector(
            "img"
          );


        const h3 =
          card.querySelector(
            "h3"
          );


        const pEl =
          card.querySelector(
            "p"
          );


        const genreEl =
          card.querySelector(
            "[data-genres]"
          );


        if (
          !h3
        ) {

          return;

        }


        /* -------------------------------------------------
           GET JIKAN MAL ID
           api.js must expose the anime object
        ------------------------------------------------- */

        const title =
          h3.textContent.trim();


        const anime =
          window.danimeverseAnimeData?.find(
            item => {

              const itemTitle =
                item.title_english ||
                item.title ||
                "";

              return (
                itemTitle.trim() ===
                title
              );

            }
          );


        if (
          !anime
        ) {

          console.warn(
            "Could not find Jikan data for:",
            title
          );

          return;

        }


        const animeData = {

          title,

          img:
            imgEl?.src ||
            "",

          desc:
            pEl?.textContent.trim() ||
            "",

          genres:
            genreEl?.textContent.trim() ||
            "",

          malId:
            anime.mal_id

        };


        const slug =
          slugify(
            animeData.title
          );


        const inList =
          slugs.has(
            slug
          );


        const btn =
          document.createElement(
            "button"
          );


        btn.className =
          "wl-btn" +
          (
            inList
              ? " in-list"
              : ""
          );


        btn.dataset.slug =
          slug;


        btn.title =
          inList
            ? "Remove from My List"
            : "Add to My List";


        function setButtonIcon(
          saved
        ) {

          btn.innerHTML =

            saved

              ? `

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >

                  <polyline
                    points="20 6 9 17 4 12"
                  ></polyline>

                </svg>

              `

              : `

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >

                  <line
                    x1="12"
                    y1="5"
                    x2="12"
                    y2="19"
                  ></line>

                  <line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                  ></line>

                </svg>

              `;

        }


        setButtonIcon(
          inList
        );


        btn.addEventListener(
          "click",
          async e => {

            e.preventDefault();

            e.stopPropagation();


            if (
              btn.disabled
            ) {

              return;

            }


            btn.disabled =
              true;


            try {

              if (
                btn.classList.contains(
                  "in-list"
                )
              ) {

                await removeItem(
                  uid,
                  btn.dataset.slug
                );


                btn.classList.remove(
                  "in-list"
                );


                btn.title =
                  "Add to My List";


                setButtonIcon(
                  false
                );


                showToast(
                  "Removed from My List",
                  false
                );


              } else {

                const newSlug =
                  await addItem(
                    uid,
                    animeData
                  );


                btn.dataset.slug =
                  newSlug;


                btn.classList.add(
                  "in-list"
                );


                btn.title =
                  "Remove from My List";


                setButtonIcon(
                  true
                );


                showToast(
                  "Added to My List ✓"
                );

              }


            } catch (
              error
            ) {

              console.error(
                "Watchlist button error:",
                error
              );


              showToast(
                "Something went wrong. Please try again.",
                false
              );

            } finally {

              btn.disabled =
                false;

            }

          }
        );


        card.appendChild(
          btn
        );

      }
    );

}


/* =========================================================
   RENDER MY LIST PAGE
========================================================= */

async function renderWatchlistPage(
  uid
) {

  const grid =
    document.getElementById(
      "watchlist-grid"
    );


  const emptyState =
    document.getElementById(
      "watchlist-empty"
    );


  const loading =
    document.getElementById(
      "watchlist-loading"
    );


  const notSignedIn =
    document.getElementById(
      "watchlist-not-signed-in"
    );


  const countEl =
    document.getElementById(
      "watchlist-count"
    );


  if (
    !grid
  ) {

    return;

  }


  try {

    console.log(
      "📋 Loading watchlist for:",
      uid
    );


    const snapshot =
      await getDocs(

        collection(
          db,
          "watchlists",
          uid,
          "items"
        )

      );


    loading?.classList.add(
      "hidden"
    );


    notSignedIn?.classList.add(
      "hidden"
    );


    if (
      snapshot.empty
    ) {

      grid.innerHTML =
        "";


      emptyState?.classList.remove(
        "hidden"
      );


      if (
        countEl
      ) {

        countEl.textContent =
          "0 titles";

      }


      return;

    }


    emptyState?.classList.add(
      "hidden"
    );


    if (
      countEl
    ) {

      countEl.textContent =

        `${snapshot.size} title${
          snapshot.size !== 1
            ? "s"
            : ""
        }`;

    }


    const items =
      snapshot.docs.map(
        document => ({

          slug:
            document.id,

          ...document.data()

        })
      );


    items.sort(
      (
        a,
        b
      ) =>

        (
          b.addedAt ||
          0
        ) -

        (
          a.addedAt ||
          0
        )

    );


    grid.innerHTML =
      "";


    items.forEach(
      anime => {

        const card =
          document.createElement(
            "div"
          );


        card.className =
          "wl-card";


        card.innerHTML = `

          <img
            src="${anime.img || ""}"
            alt="${anime.title || "Anime"}"
            loading="lazy"
          />


          <div class="wl-card-overlay">

            <p class="wl-card-genres">
              ${anime.genres || ""}
            </p>


            <h3 class="wl-card-title">
              ${anime.title || "Unknown Anime"}
            </h3>


            <div class="wl-card-actions">

              <button
                class="wl-watch-btn"
                type="button"
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="14"
                  height="14"
                >

                  <polygon
                    points="5,3 19,12 5,21"
                  />

                </svg>

                Watch

              </button>


              <button
                class="wl-remove-btn"
                type="button"
              >

                Remove

              </button>

            </div>

          </div>


          <button
            class="wl-remove-icon"
            type="button"
            title="Remove"
          >

            ✕

          </button>

        `;


        /* =====================================================
           WATCH BUTTON
        ===================================================== */

        const watchButton =
          card.querySelector(
            ".wl-watch-btn"
          );


        watchButton?.addEventListener(
          "click",
          async e => {

            e.preventDefault();

            e.stopPropagation();


            watchButton.disabled =
              true;


            try {

              await openSavedAnime(
                anime
              );

            } finally {

              watchButton.disabled =
                false;

            }

          }
        );


        /* =====================================================
           REMOVE BUTTONS
        ===================================================== */

        const removeButtons =
          card.querySelectorAll(
            ".wl-remove-btn, .wl-remove-icon"
          );


        removeButtons.forEach(
          btn => {

            btn.addEventListener(
              "click",
              async e => {

                e.preventDefault();

                e.stopPropagation();


                if (
                  btn.disabled
                ) {

                  return;

                }


                btn.disabled =
                  true;


                try {

                  await removeItem(
                    uid,
                    anime.slug
                  );


                  card.classList.add(
                    "removing"
                  );


                  setTimeout(
                    () => {

                      card.remove();


                      const remaining =
                        grid.querySelectorAll(
                          ".wl-card"
                        ).length;


                      if (
                        countEl
                      ) {

                        countEl.textContent =

                          `${remaining} title${
                            remaining !== 1
                              ? "s"
                              : ""
                          }`;

                      }


                      if (
                        !remaining
                      ) {

                        emptyState?.classList.remove(
                          "hidden"
                        );

                      }

                    },
                    350
                  );


                  showToast(
                    "Removed from My List",
                    false
                  );


                } catch (
                  error
                ) {

                  console.error(
                    "Remove error:",
                    error
                  );


                  showToast(
                    "Could not remove anime.",
                    false
                  );


                  btn.disabled =
                    false;

                }

              }
            );

          }
        );


        grid.appendChild(
          card
        );

      }
    );


  } catch (
    error
  ) {

    console.error(
      "❌ WATCHLIST LOAD ERROR:",
      error
    );


    loading?.classList.add(
      "hidden"
    );


    grid.innerHTML = `

      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 80px 20px;
      ">

        <h2 style="
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 10px;
        ">

          Unable to load My List

        </h2>


        <p style="
          color: #888;
          margin-bottom: 20px;
        ">

          ${
            error.code === "permission-denied"

              ? "Your Firebase Firestore rules are blocking access to your watchlist."

              : "Please refresh the page and try again."

          }

        </p>

      </div>

    `;

  }

}


/* =========================================================
   HOMEPAGE WATCHLIST SETUP
========================================================= */

async function setupHomepageWatchlist(
  user
) {

  try {

    console.log(
      "❤️ Setting up homepage watchlist..."
    );


    const slugs =
      await getWatchlistSlugs(
        user.uid
      );


    function injectWhenReady() {

      const cards =
        document.querySelectorAll(
          "article.glass-card"
        );


      if (
        !cards.length
      ) {

        return false;

      }


      injectButtons(
        user.uid,
        slugs
      );


      return true;

    }


    if (
      injectWhenReady()
    ) {

      return;

    }


    const observer =
      new MutationObserver(
        () => {

          injectWhenReady();

        }
      );


    const containers = [

      document.getElementById(
        "popularAnimeContainer"
      ),

      document.getElementById(
        "trendingAnimeContainer"
      ),

      document.getElementById(
        "latestAnimeContainer"
      )

    ].filter(
      Boolean
    );


    containers.forEach(
      container => {

        observer.observe(
          container,
          {

            childList:
              true,

            subtree:
              true

          }

        );

      }
    );


    setTimeout(
      () => {

        observer.disconnect();

      },
      30000
    );


  } catch (
    error
  ) {

    console.error(
      "❌ Could not setup homepage watchlist:",
      error
    );

  }

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    console.log(
      "🔐 Auth state:",
      user
        ? user.email
        : "Not signed in"
    );


    /* =====================================================
       DESKTOP MY LIST LINK
    ===================================================== */

    const myListLink =
      document.getElementById(
        "myListLink"
      );


    if (
      myListLink
    ) {

      myListLink.style.display =
        user
          ? ""
          : "none";

    }


    /* =====================================================
       MOBILE MY LIST LINK
    ===================================================== */

    const mobileMyListLink =
      document.getElementById(
        "mobileMyListLink"
      );


    if (
      mobileMyListLink
    ) {

      mobileMyListLink.classList.toggle(
        "hidden",
        !user
      );

    }


    /* =====================================================
       MY LIST PAGE ELEMENTS
    ===================================================== */

    const notSignedIn =
      document.getElementById(
        "watchlist-not-signed-in"
      );


    const loading =
      document.getElementById(
        "watchlist-loading"
      );


    /* =====================================================
       USER NOT SIGNED IN
    ===================================================== */

    if (
      !user
    ) {

      console.log(
        "👤 User is not signed in."
      );


      loading?.classList.add(
        "hidden"
      );


      notSignedIn?.classList.remove(
        "hidden"
      );


      return;

    }


    /* =====================================================
       USER SIGNED IN
    ===================================================== */

    console.log(
      "👤 User signed in:",
      user.uid
    );


    /* =====================================================
       HOMEPAGE
    ===================================================== */

    if (
      document.querySelector(
        "#popularAnimeContainer, #trendingAnimeContainer, #latestAnimeContainer"
      )
    ) {

      setupHomepageWatchlist(
        user
      );

    }


    /* =====================================================
       MY LIST PAGE
    ===================================================== */

    if (
      document.getElementById(
        "watchlist-grid"
      )
    ) {

      await renderWatchlistPage(
        user.uid
      );

    }

  }
);