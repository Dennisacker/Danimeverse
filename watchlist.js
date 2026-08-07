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
  getDocs,
  getDoc,
  increment
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
console.log("🔥 injectButtons() called");
function injectButtons(
  uid,
  slugs
) {

        document.querySelectorAll(".glass-card")
    .forEach(
      card => {console.log("Card found:", card);

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
   DANIMEVERSE USER PROFILE + XP SYSTEM
========================================================= */

async function updateUserActivity(uid) {

  const userRef = doc(
    db,
    "users",
    uid
  );

  try {

    await setDoc(
      userRef,
      {
        visitCount: increment(1),
        xp: increment(5),
        lastVisit: Date.now()
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.error(
      "❌ Could not update user activity:",
      error
    );

  }

}


/* =========================================================
   GET USER PROFILE
========================================================= */

async function getUserProfile(uid) {

  const userRef =
    doc(
      db,
      "users",
      uid
    );

  const snapshot =
    await getDoc(userRef);

  if (!snapshot.exists()) {

    await setDoc(
      userRef,
      {
        xp: 5,
        visitCount: 1,
        createdAt: Date.now(),
        lastVisit: Date.now()
      },
      {
        merge: true
      }
    );

    return {
      xp: 5,
      visitCount: 1
    };

  }

  return snapshot.data();

}


/* =========================================================
   USER RANK
========================================================= */

function getUserRank(xp) {

  if (xp >= 5000) {

    return {
      name: "Danimeverse Legend",
      icon: "👑",
      next: null,
      current: 5000
    };

  }

  if (xp >= 2500) {

    return {
      name: "Anime Master",
      icon: "🔥",
      next: 5000,
      current: 2500
    };

  }

  if (xp >= 1200) {

    return {
      name: "Hardcore Otaku",
      icon: "⚡",
      next: 2500,
      current: 1200
    };

  }

  if (xp >= 600) {

    return {
      name: "Anime Fan",
      icon: "⭐",
      next: 1200,
      current: 600
    };

  }

  if (xp >= 250) {

    return {
      name: "Otaku",
      icon: "🍥",
      next: 600,
      current: 250
    };

  }

  return {
    name: "Anime Newbie",
    icon: "🌱",
    next: 250,
    current: 0
  };

}


/* =========================================================
   CREATE PROFILE DASHBOARD
========================================================= */

async function renderUserDashboard(
  user,
  watchlistCount,
  favouriteCount
) {

  let dashboard =
    document.getElementById(
      "danimeverse-user-dashboard"
    );

  if (!dashboard) {

    dashboard =
      document.createElement("section");

    dashboard.id =
      "danimeverse-user-dashboard";

    const main =
      document.querySelector(".wl-main");

    if (main) {

      main.prepend(
        dashboard
      );

    } else {

      document.body.prepend(
        dashboard
      );

    }

  }


  const profile =
    await getUserProfile(
      user.uid
    );


  const xp =
    Number(profile.xp || 0);


  const visits =
    Number(
      profile.visitCount || 0
    );


  const rank =
    getUserRank(xp);


  let progress = 100;


  if (rank.next) {

    progress =
      Math.min(
        100,
        Math.max(
          0,
          ((xp - rank.current) /
            (rank.next - rank.current)) *
            100
        )
      );

  }


  const displayName =
    user.displayName ||
    user.email?.split("@")[0] ||
    "Anime Fan";


  const email =
    user.email ||
    "";


  const avatar =
    user.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=ec4899&color=fff&size=200`;


  dashboard.innerHTML = `

    <div class="dv-profile-card">

      <div class="dv-profile-main">

        <img
          src="${escapeHTML(avatar)}"
          class="dv-profile-avatar"
          alt="Profile"
        >

        <div class="dv-profile-info">

          <div class="dv-profile-name">
            ${escapeHTML(displayName)}
          </div>

          <div class="dv-profile-email">
            ${escapeHTML(email)}
          </div>

          <div class="dv-profile-rank">

            <span>
              ${rank.icon}
            </span>

            ${rank.name}

          </div>

        </div>

      </div>


      <div class="dv-xp-section">

        <div class="dv-xp-top">

          <span>
            Danimeverse Rating
          </span>

          <strong>
            ${xp} XP
          </strong>

        </div>


        <div class="dv-xp-bar">

          <div
            class="dv-xp-progress"
            style="width:${progress}%"
          ></div>

        </div>


        <div class="dv-xp-bottom">

          <span>
            ${xp} XP
          </span>

          <span>
            ${
              rank.next
                ? `${rank.next} XP to next rank`
                : "MAX RANK"
            }
          </span>

        </div>

      </div>


      <div class="dv-user-stats">

        <div class="dv-stat">

          <span class="dv-stat-icon">
            📋
          </span>

          <strong>
            ${watchlistCount}
          </strong>

          <small>
            My List
          </small>

        </div>


        <div class="dv-stat">

          <span class="dv-stat-icon">
            ⭐
          </span>

          <strong>
            ${favouriteCount}
          </strong>

          <small>
            Favourites
          </small>

        </div>


        <div class="dv-stat">

          <span class="dv-stat-icon">
            👀
          </span>

          <strong>
            ${visits}
          </strong>

          <small>
            Visits
          </small>

        </div>


        <div class="dv-stat">

          <span class="dv-stat-icon">
            🏆
          </span>

          <strong>
            ${xp}
          </strong>

          <small>
            Rating XP
          </small>

        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   FAVOURITES
========================================================= */

async function getFavouriteItems(uid) {

  const snapshot =
    await getDocs(
      collection(
        db,
        "favourites",
        uid,
        "items"
      )
    );


  return snapshot.docs.map(
    document => ({
      id: document.id,
      ...document.data()
    })
  );

}


/* =========================================================
   ADD FAVOURITE
========================================================= */

async function addFavourite(
  uid,
  anime
) {

  const title =
    anime.title ||
    "Unknown Anime";


  const slug =
    slugify(title);


  await setDoc(
    doc(
      db,
      "favourites",
      uid,
      "items",
      slug
    ),
    {
      title: title,
      img: anime.img || "",
      genres: anime.genres || "",
      desc: anime.desc || "",
      malId: anime.malId
        ? Number(anime.malId)
        : null,
      anilistId: anime.anilistId
        ? Number(anime.anilistId)
        : null,
      addedAt: Date.now()
    },
    {
      merge: true
    }
  );


  await setDoc(
    doc(
      db,
      "users",
      uid
    ),
    {
      xp: increment(25)
    },
    {
      merge: true
    }
  );

}


/* =========================================================
   REMOVE FAVOURITE
========================================================= */

async function removeFavourite(
  uid,
  slug
) {

  await deleteDoc(
    doc(
      db,
      "favourites",
      uid,
      "items",
      slug
    )
  );

}


/* =========================================================
   RENDER FAVOURITES
========================================================= */

async function renderFavourites(
  uid
) {

  const favourites =
    await getFavouriteItems(
      uid
    );


  let section =
    document.getElementById(
      "danimeverse-favourites-section"
    );


  if (!section) {

    section =
      document.createElement(
        "section"
      );

    section.id =
      "danimeverse-favourites-section";

    const grid =
      document.getElementById(
        "watchlist-grid"
      );

    if (grid?.parentElement) {

      grid.parentElement.insertBefore(
        section,
        grid
      );

    }

  }


  section.innerHTML = `

    <div class="dv-section-heading">

      <div>

        <span class="dv-section-eyebrow">
          YOUR COLLECTION
        </span>

        <h2>
          ⭐ My Favourites
        </h2>

      </div>

      <span class="dv-section-count">
        ${favourites.length} ${
          favourites.length === 1
            ? "title"
            : "titles"
        }
      </span>

    </div>


    <div
      id="dv-favourites-grid"
      class="dv-favourites-grid"
    ></div>

  `;


  const favouriteGrid =
    document.getElementById(
      "dv-favourites-grid"
    );


  if (!favourites.length) {

    favouriteGrid.innerHTML = `

      <div class="dv-empty-favourites">

        <div>
          ⭐
        </div>

        <h3>
          No favourites yet
        </h3>

        <p>
          Tap the ⭐ on any anime you love
          and it will appear here.
        </p>

      </div>

    `;

    return;

  }


  favourites.sort(
    (a, b) =>
      (b.addedAt || 0) -
      (a.addedAt || 0)
  );


  favourites.forEach(
    anime => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "dv-favourite-card";


      card.innerHTML = `

        <img
          src="${escapeHTML(anime.img || "")}"
          alt="${escapeHTML(anime.title)}"
          loading="lazy"
        >


        <div class="dv-favourite-overlay">

          <div class="dv-favourite-title">
            ${escapeHTML(anime.title)}
          </div>

          <div class="dv-favourite-actions">

            <button
              class="dv-favourite-watch"
            >
              ▶ Watch
            </button>

            <button
              class="dv-favourite-remove"
            >
              ✕
            </button>

          </div>

        </div>

      `;


      const watchButton =
        card.querySelector(
          ".dv-favourite-watch"
        );


      const removeButton =
        card.querySelector(
          ".dv-favourite-remove"
        );


      watchButton?.addEventListener(
        "click",
        async e => {

          e.stopPropagation();

          await openWatchlistAnime(
            anime
          );

        }
      );


      removeButton?.addEventListener(
        "click",
        async e => {

          e.stopPropagation();

          await removeFavourite(
            uid,
            anime.id
          );

          card.remove();

          showToast(
            "Removed from favourites",
            false
          );

          await refreshUserDashboard(
            uid
          );

        }
      );


      card.addEventListener(
        "click",
        () => {

          openWatchlistAnime(
            anime
          );

        }
      );


      favouriteGrid.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   REFRESH PROFILE + FAVOURITES
========================================================= */

async function refreshUserDashboard(
  uid
) {

  const watchlistSnapshot =
    await getDocs(
      collection(
        db,
        "watchlists",
        uid,
        "items"
      )
    );


  const favouriteSnapshot =
    await getDocs(
      collection(
        db,
        "favourites",
        uid,
        "items"
      )
    );


  const user =
    auth.currentUser;


  if (!user) return;


  await renderUserDashboard(
    user,
    watchlistSnapshot.size,
    favouriteSnapshot.size
  );


  await renderFavourites(
    uid
  );

}


/* =========================================================
   FAVOURITE BUTTONS ON ANIME CARDS
========================================================= */

function injectFavouriteButtons(
  uid
) {

  document
    .querySelectorAll(
      ".favourite-btn"
    )
    .forEach(
      button => {

        if (
          button.dataset.favouriteReady ===
          "true"
        ) {
          return;
        }


        button.dataset.favouriteReady =
          "true";


        const malId =
          button.dataset.id;


        button.addEventListener(
          "click",
          async e => {

            e.preventDefault();
            e.stopPropagation();


            const anime =
              window.danimeverseAnimeData
                ?.find(
                  item =>
                    String(
                      item.mal_id
                    ) ===
                    String(
                      malId
                    )
                );


            if (!anime) {

              showToast(
                "Anime information unavailable.",
                false
              );

              return;

            }


            const favouriteData = {

              title:
                anime.title_english ||
                anime.title ||
                "Unknown Anime",

              img:
                anime.images?.jpg?.large_image_url ||
                anime.images?.jpg?.image_url ||
                "",

              genres:
                anime.genres
                  ?.slice(0, 3)
                  ?.map(
                    g => g.name
                  )
                  ?.join(", ") ||
                "Anime",

              desc:
                anime.synopsis ||
                "",

              malId:
                anime.mal_id,

              anilistId:
                anime.anilist_id ||

                anime.anilistId ||

                null

            };


            const slug =
              slugify(
                favouriteData.title
              );


            const favouriteRef =
              doc(
                db,
                "favourites",
                uid,
                "items",
                slug
              );


            const existing =
              await getDoc(
                favouriteRef
              );


            if (
              existing.exists()
            ) {

              await deleteDoc(
                favouriteRef
              );


              button.classList.remove(
                "favourite-active"
              );


              button.innerHTML =
                "⭐";


              showToast(
                "Removed from favourites",
                false
              );

            } else {

              await addFavourite(
                uid,
                favouriteData
              );


              button.classList.add(
                "favourite-active"
              );


              button.innerHTML =
                "★";


              showToast(
                "Added to favourites ⭐"
              );

            }


            await refreshUserDashboard(
              uid
            );

          }

        );

      }
    );

}


/* =========================================================
   ADD FAVOURITE BUTTON STYLING
========================================================= */

function injectDashboardStyles() {

  if (document.getElementById("danimeverse-dashboard-styles")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "danimeverse-dashboard-styles";

  style.textContent = `

    /* =====================================================
       PROFILE DASHBOARD
    ===================================================== */

    #danimeverse-user-dashboard {
      width: 100%;
      margin: 0 0 55px;
    }

    .dv-profile-card {
      position: relative;
      overflow: hidden;

      padding: 30px;

      border-radius: 22px;

      background:
        linear-gradient(
          135deg,
          rgba(236,72,153,.13),
          rgba(139,92,246,.08) 50%,
          rgba(20,20,20,.96)
        );

      border: 1px solid rgba(255,255,255,.08);

      box-shadow:
        0 20px 60px rgba(0,0,0,.35);
    }

    .dv-profile-card::before {
      content: "";

      position: absolute;

      width: 280px;
      height: 280px;

      top: -150px;
      right: -100px;

      background: rgba(236,72,153,.13);

      filter: blur(70px);

      border-radius: 50%;

      pointer-events: none;
    }

    .dv-profile-main {
      position: relative;

      display: flex;
      align-items: center;

      gap: 18px;

      margin-bottom: 28px;
    }

    .dv-profile-avatar {
      width: 78px;
      height: 78px;

      flex-shrink: 0;

      border-radius: 50%;

      object-fit: cover;

      border: 3px solid rgba(236,72,153,.75);

      box-shadow:
        0 0 0 5px rgba(236,72,153,.08),
        0 0 30px rgba(236,72,153,.25);
    }

    .dv-profile-name {
      font-size: 25px;

      line-height: 1.1;

      font-weight: 900;

      color: white;
    }

    .dv-profile-email {
      margin-top: 5px;

      color: #888;

      font-size: 13px;
    }

    .dv-profile-rank {
      display: inline-flex;

      align-items: center;

      gap: 6px;

      margin-top: 10px;

      padding: 5px 11px;

      border-radius: 999px;

      background: rgba(236,72,153,.12);

      border: 1px solid rgba(236,72,153,.18);

      color: #f9a8d4;

      font-size: 11px;

      font-weight: 800;
    }


    /* XP */

    .dv-xp-section {
      position: relative;

      margin-bottom: 25px;
    }

    .dv-xp-top,
    .dv-xp-bottom {
      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 15px;

      font-size: 12px;

      color: #888;
    }

    .dv-xp-top span {
      color: #aaa;

      font-weight: 700;
    }

    .dv-xp-top strong {
      color: #f9a8d4;

      font-size: 13px;
    }

    .dv-xp-bar {
      height: 8px;

      margin: 10px 0;

      overflow: hidden;

      border-radius: 999px;

      background: rgba(255,255,255,.07);
    }

    .dv-xp-progress {
      height: 100%;

      border-radius: inherit;

      background:
        linear-gradient(
          90deg,
          #ec4899,
          #8b5cf6
        );

      box-shadow:
        0 0 15px rgba(236,72,153,.35);

      transition: width .7s ease;
    }


    /* STATS */

    .dv-user-stats {
      position: relative;

      display: grid;

      grid-template-columns:
        repeat(4, 1fr);

      gap: 10px;
    }

    .dv-stat {
      min-width: 0;

      padding: 14px 10px;

      text-align: center;

      border-radius: 14px;

      background: rgba(0,0,0,.20);

      border: 1px solid rgba(255,255,255,.055);

      transition:
        background .2s ease,
        transform .2s ease;
    }

    .dv-stat:hover {
      background: rgba(255,255,255,.055);

      transform: translateY(-2px);
    }

    .dv-stat-icon {
      display: block;

      margin-bottom: 5px;

      font-size: 18px;
    }

    .dv-stat strong {
      display: block;

      color: white;

      font-size: 20px;

      font-weight: 900;
    }

    .dv-stat small {
      display: block;

      margin-top: 2px;

      color: #777;

      font-size: 10px;

      font-weight: 600;
    }


    /* =====================================================
       SECTION HEADERS
    ===================================================== */

    .dv-section-heading {
      display: flex;

      align-items: flex-end;

      justify-content: space-between;

      gap: 20px;

      margin-bottom: 18px;

      padding-bottom: 10px;

      border-bottom:
        1px solid rgba(255,255,255,.07);
    }

    .dv-section-eyebrow {
      display: block;

      margin-bottom: 4px;

      color: #ec4899;

      font-size: 9px;

      font-weight: 900;

      letter-spacing: .18em;
    }

    .dv-section-heading h2 {
      margin: 0;

      color: white;

      font-size: 25px;

      line-height: 1.1;

      font-weight: 900;
    }

    .dv-section-count {
      flex-shrink: 0;

      color: #777;

      font-size: 12px;
    }


    /* =====================================================
       FAVOURITES
    ===================================================== */

    #danimeverse-favourites-section {
      width: 100%;

      margin-bottom: 55px;
    }

    .dv-favourites-grid {
      display: grid;

      grid-template-columns:
        repeat(6, 1fr);

      gap: 8px;
    }

    .dv-favourite-card {
      position: relative;

      overflow: hidden;

      aspect-ratio: 2 / 3;

      border-radius: 6px;

      background: #1c1c2e;

      cursor: pointer;

      transition:
        transform .25s ease,
        box-shadow .25s ease;
    }

    .dv-favourite-card:hover {
      z-index: 5;

      transform: scale(1.06);

      box-shadow:
        0 24px 48px rgba(0,0,0,.85);
    }

    .dv-favourite-card img {
      display: block;

      width: 100%;
      height: 100%;

      object-fit: cover;
    }

    .dv-favourite-overlay {
      position: absolute;

      right: 0;
      bottom: 0;
      left: 0;

      padding: 45px 9px 9px;

      background:
        linear-gradient(
          to top,
          rgba(0,0,0,.97),
          rgba(0,0,0,.55) 55%,
          transparent
        );
    }

    .dv-favourite-title {
      margin-bottom: 7px;

      color: white;

      font-size: 12px;

      line-height: 1.3;

      font-weight: 800;
    }

    .dv-favourite-actions {
      display: flex;

      gap: 5px;
    }

    .dv-favourite-watch {
      flex: 1;

      padding: 6px;

      border: 0;

      border-radius: 4px;

      background: white;

      color: black;

      font-size: 10px;

      font-weight: 800;

      cursor: pointer;
    }

    .dv-favourite-remove {
      width: 30px;

      padding: 0;

      border: 0;

      border-radius: 4px;

      background: rgba(255,255,255,.13);

      color: white;

      cursor: pointer;
    }

    .dv-favourite-remove:hover {
      background: #e50914;
    }


    /* EMPTY FAVOURITES */

    .dv-empty-favourites {
      grid-column: 1 / -1;

      padding: 60px 20px;

      text-align: center;

      border:
        1px dashed rgba(255,255,255,.10);

      border-radius: 16px;

      background: rgba(255,255,255,.015);
    }

    .dv-empty-favourites div {
      margin-bottom: 8px;

      font-size: 40px;

      opacity: .35;
    }

    .dv-empty-favourites h3 {
      margin: 0;

      color: #ddd;

      font-size: 17px;

      font-weight: 800;
    }

    .dv-empty-favourites p {
      max-width: 350px;

      margin: 7px auto 0;

      color: #777;

      font-size: 12px;

      line-height: 1.5;
    }


    /* =====================================================
       FAVOURITE BUTTON
    ===================================================== */

    .favourite-btn.favourite-active {
      background: #facc15 !important;

      color: #111 !important;

      border-color: #facc15 !important;

      box-shadow:
        0 0 22px rgba(250,204,21,.45);

      transform: scale(1.08);
    }


    /* =====================================================
       RESPONSIVE
    ===================================================== */

    @media (max-width: 1280px) {

      .dv-favourites-grid {
        grid-template-columns:
          repeat(5, 1fr);
      }

    }

    @media (max-width: 1024px) {

      .dv-favourites-grid {
        grid-template-columns:
          repeat(4, 1fr);
      }

    }

    @media (max-width: 768px) {

      .dv-profile-card {
        padding: 22px;
      }

      .dv-favourites-grid {
        grid-template-columns:
          repeat(3, 1fr);
      }

      .dv-user-stats {
        grid-template-columns:
          repeat(2, 1fr);
      }

    }

    @media (max-width: 480px) {

      .dv-profile-main {
        gap: 13px;
      }

      .dv-profile-avatar {
        width: 60px;
        height: 60px;
      }

      .dv-profile-name {
        font-size: 20px;
      }

      .dv-profile-email {
        font-size: 11px;
      }

      .dv-profile-card {
        padding: 18px;
        border-radius: 18px;
      }

      .dv-section-heading h2 {
        font-size: 21px;
      }

      .dv-favourites-grid {
        grid-template-columns:
          repeat(2, 1fr);
      }

    }

  `;

  document.head.appendChild(style);
}

/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

async function initializeDanimeverseDashboard(
  user
) {

  if (!user) return;


  injectDashboardStyles();


  await updateUserActivity(
    user.uid
  );


  const watchlistSnapshot =
    await getDocs(
      collection(
        db,
        "watchlists",
        user.uid,
        "items"
      )
    );


  const favouriteSnapshot =
    await getDocs(
      collection(
        db,
        "favourites",
        user.uid,
        "items"
      )
    );


  await renderUserDashboard(
    user,
    watchlistSnapshot.size,
    favouriteSnapshot.size
  );


  await renderFavourites(
    user.uid
  );


  injectFavouriteButtons(
    user.uid
  );

}
/* =========================================================
   INITIALIZE WATCHLIST
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    console.log(
      "🔥 Auth state changed:",
      user
    );


    if (!user) {

      console.log(
        "❌ No user signed in."
      );

      return;

    }


    try {

      const slugs =
        await getWatchlistSlugs(
          user.uid
        );


      console.log(
        "📚 Watchlist loaded:",
        slugs
      );


      injectButtons(
        user.uid,
        slugs
      );


      await renderWatchlistPage(
        user.uid
      );


      await initializeDanimeverseDashboard(
        user
      );


      /*
        Homepage cards are sometimes
        rendered asynchronously.

        Run this again after they appear.
      */

      setTimeout(
        () => {

          injectFavouriteButtons(
            user.uid
          );

        },
        1500
      );


      setTimeout(
        () => {

          injectFavouriteButtons(
            user.uid
          );

        },
        3500
      );


    } catch (error) {

      console.error(
        "❌ Danimeverse dashboard initialization failed:",
        error
      );

    }

  }
);