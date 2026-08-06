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
  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, success = true) {

  let toast =
    document.getElementById("wl-toast");


  if (!toast) {

    toast =
      document.createElement("div");

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
   GET WATCHLIST SLUGS
========================================================= */

async function getWatchlistSlugs(uid){

 const snapshot =
   await getDocs(
     collection(
       db,
       "watchlists",
       uid,
       "items"
     )
   );


 const slugs = new Set();


 snapshot.forEach(doc=>{
    slugs.add(doc.id);
 });


 return slugs;

}

/* =========================================================
   ADD ANIME
========================================================= */

async function addItem(uid, anime) {

  const title =
    anime.title || "Unknown Anime";


  const slug =
    slugify(title);


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
        title,

      img:
        anime.img || "",

      desc:
        anime.desc || "",

      href:
        anime.href || "",

      genres:
        anime.genres || "",

      /* NEW ID DATA */

      malId:
        anime.malId
          ? Number(anime.malId)
          : null,

      anilistId:
        anime.anilistId
          ? Number(anime.anilistId)
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
   OPEN ANIME WATCH PAGE
========================================================= */

async function openWatchlistAnime(
  anime
) {

  const title =
    anime.title ||
    "Unknown Anime";


  /* =======================================================
     IF WE ALREADY HAVE ANILIST ID
  ======================================================= */

  if (anime.anilistId) {

    const params =
      new URLSearchParams({

        anilistId:
          String(anime.anilistId),

        anime:
          title,

        ep:
          "1",

        ...(anime.malId
          ? {
              malId:
                String(anime.malId)
            }
          
          : {})

      });


    window.location.href =
      `watch.html?${params.toString()}`;


    return;

  }


  /* =======================================================
     IF WE ONLY HAVE MAL ID
     FIND ANILIST ID
  ======================================================= */

  if (anime.malId) {

    try {

      showToast(
        "Opening anime..."
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

                query:

                  query,

                variables: {

                  malId:
                    Number(
                      anime.malId
                    )

                }

              })

          }
        );


      if (!response.ok) {

        throw new Error(
          `AniList HTTP ${response.status}`
        );

      }


      const result =
        await response.json();


      const media =
        result.data?.Media;


      if (!media) {

        throw new Error(
          "Anime not found on AniList"
        );

      }


      const animeTitle =

        media.title?.english ||

        media.title?.romaji ||

        media.title?.native ||

        title;


      const params =
        new URLSearchParams({

          anilistId:
            String(media.id),

          anime:
            animeTitle,

          ep:
            "1",

          malId:
            String(
              anime.malId
            )

        });


      window.location.href =
        `watch.html?${params.toString()}`;


      return;


    } catch (error) {

      console.error(
        "❌ Failed to open anime:",
        error
      );


      showToast(
        "Could not open this anime. Please try again.",
        false
      );


      return;

    }

  }


  /* =======================================================
     OLD WATCHLIST ITEM
     NO MAL ID / NO ANILIST ID

     SEARCH ANILIST BY TITLE
  ======================================================= */

  try {

    showToast(
      "Finding anime..."
    );


    const query = `

      query ($search: String) {

        Media(
          search: $search,
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

              query:

                query,

              variables: {

                search:
                  title

              }

            })

        }
      );


    if (!response.ok) {

      throw new Error(
        `AniList HTTP ${response.status}`
      );

    }


    const result =
      await response.json();


    const media =
      result.data?.Media;


    if (!media) {

      throw new Error(
        "Anime not found"
      );

    }


    const animeTitle =

      media.title?.english ||

      media.title?.romaji ||

      media.title?.native ||

      title;


    /* =====================================================
       UPDATE OLD FIREBASE DOCUMENT
       SO NEXT TIME IT OPENS INSTANTLY
    ===================================================== */

    if (auth.currentUser) {

      await setDoc(

        doc(
          db,
          "watchlists",
          auth.currentUser.uid,
          "items",
          slugify(title)
        ),

        {

          anilistId:
            media.id,

          malId:
            media.idMal || null

        },

        {
          merge:
            true
        }

      );

    }


    const params =
      new URLSearchParams({

        anilistId:
          String(media.id),

        anime:
          animeTitle,

        ep:
          "1",

        ...(media.idMal
          ? {
              malId:
                String(
                  media.idMal
                )
            }
          : {})

      });


    window.location.href =
      `watch.html?${params.toString()}`;


  } catch (error) {

    console.error(
      "❌ Failed to find anime on AniList:",
      error
    );


    showToast(
      `Could not open ${title}. Please try again.`,
      false
    );

  }

}


/* =========================================================
   INJECT WATCHLIST BUTTONS ON HOMEPAGE
========================================================= */

function injectButtons(
  uid,
  slugs
) {

      document
      .querySelectorAll(
        "article.group.relative.overflow-hidden"
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


        if (!h3) {

          return;

        }


        /* =====================================================
           GET ORIGINAL ANIME DATA
        ===================================================== */

        const title =
          h3.textContent.trim();


        const image =
          imgEl?.src || "";


        const desc =
          pEl?.textContent.trim() || "";


        const genres =
          genreEl?.dataset.genres || "";


        /* =====================================================
           FIND MAL ID FROM API DATA
        ===================================================== */

        let originalAnime =
          null;


        if (
          window.danimeverseAnimeData
        ) {

          originalAnime =
            window.danimeverseAnimeData
              .find(
                item =>
                  item.mal_id &&
                  (
                    item.title_english ===
                      title ||

                    item.title ===
                      title
                  )
              );

        }


        const anime = {

          title:
            title,

          img:
            image,

          desc:
            desc,

          genres:
            genres,

          malId:
            originalAnime?.mal_id ||
            null,

          anilistId:
            originalAnime?.anilist_id ||
            null

        };


        const slug =
          slugify(
            title
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
          `
          wl-btn
          absolute
          left-3
          bottom-24
          z-50
          w-10
          h-10
          rounded-full
          bg-black/60
          backdrop-blur
          border
          border-white/20
          flex
          items-center
          justify-center
          text-white
          hover:bg-pink-600
          hover:scale-110
          transition-all
          duration-300
          `
          +
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


        function updateButton(
          isInList
        ) {

          btn.innerHTML =
            isInList

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


        updateButton(
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


                updateButton(
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
                    anime
                  );


                btn.dataset.slug =
                  newSlug;


                btn.classList.add(
                  "in-list"
                );


                btn.title =
                  "Remove from My List";


                updateButton(
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
   RENDER WATCHLIST PAGE
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


  if (!grid) {

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


      if (countEl) {

        countEl.textContent =
          "0 titles";

      }


      return;

    }


    emptyState?.classList.add(
      "hidden"
    );


    if (countEl) {

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
      (a, b) =>

        (b.addedAt || 0) -

        (a.addedAt || 0)

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
            src="${escapeHTML(anime.img)}"
            alt="${escapeHTML(anime.title || "Anime")}"
            loading="lazy"
          >

          <div class="wl-card-overlay">

            <p class="wl-card-genres">
              ${escapeHTML(anime.genres || "Anime")}
            </p>

            <h3 class="wl-card-title">
              ${escapeHTML(anime.title || "Unknown Anime")}
            </h3>

            <div class="wl-card-actions">

              <button
                type="button"
                class="wl-watch-btn"
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
                type="button"
                class="wl-remove-btn"
              >

                Remove

              </button>

            </div>

          </div>


          <button
            type="button"
            class="wl-remove-icon"
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


            if (
              watchButton.disabled
            ) {

              return;

            }


            watchButton.disabled =
              true;


            const originalText =
              watchButton.innerHTML;


            watchButton.innerHTML =
              "Opening...";


            try {

              await openWatchlistAnime(
                anime
              );

            } finally {

              watchButton.disabled =
                false;

              watchButton.innerHTML =
                originalText;

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


                      if (countEl) {

                        countEl.textContent =

                          `${remaining} title${
                            remaining !== 1
                              ? "s"
                              : ""
                          }`;

                      }


                      if (
                        remaining === 0
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


    if (
      error.code ===
      "permission-denied"
    ) {

      grid.innerHTML = `

        <div
          style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 80px 20px;
          "
        >

          <h2
            style="
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 10px;
            "
          >
            Watchlist Access Denied
          </h2>

          <p
            style="
              color: #888;
              margin-bottom: 20px;
            "
          >
            Your Firebase Firestore rules are blocking access to your watchlist.
          </p>

        </div>

      `;

    } else {

      grid.innerHTML = `

        <div
          style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 80px 20px;
          "
        >

          <h2
            style="
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 10px;
            "
          >
            Unable to load My List
          </h2>

          <p
            style="
              color: #888;
            "
          >
            Please refresh the page and try again.
          </p>

        </div>

      `;

    }

  }

}



/* =========================================================
   WATCHLIST BUTTON CLICK HANDLER
========================================================= */

document.addEventListener(
  "click",
  async (e) => {

    const button =
      e.target.closest(
        ".watchlist-btn"
      );


    if (!button) return;


    const user =
      auth.currentUser;


    if (!user) {

      alert(
        "Please login to add anime to your watchlist."
      );

      return;

    }


    const anime = {

      mal_id:
        Number(
          button.dataset.id
        ),

      title:
        button.dataset.title,

      image:
        button.dataset.image,

      score:
        button.dataset.score || null,

      type:
        button.dataset.type || null,

      episodes:
        button.dataset.episodes || null,

      genres:
        button.dataset.genres
          ? button.dataset.genres.split(",")
          : [],

      addedAt:
        serverTimestamp()

    };


    const ref =
      doc(
        db,
        "users",
        user.uid,
        "watchlist",
        String(anime.mal_id)
      );


    try {


      const snap =
        await getDoc(ref);



      if (
        snap.exists()
      ) {

        // REMOVE

        await deleteDoc(
          ref
        );


        button.innerHTML =
          "🤍";


        button.classList.remove(
          "bg-pink-600"
        );


        showToast(
          "Removed from Watchlist"
        );


      } else {


        // ADD

        await setDoc(
          ref,
          anime
        );


        button.innerHTML =
          "❤️";


        button.classList.add(
          "bg-pink-600"
        );


        showToast(
          "Added to Watchlist ❤️"
        );

      }


    } catch(error) {

      console.error(
        "Watchlist error:",
        error
      );

    }


  }
);