import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9mOlwqobv6V8O50BWADbkhRNQpDRNYQ4",
  authDomain: "danimeverse-c1fa3.firebaseapp.com",
  projectId: "danimeverse-c1fa3",
  storageBucket: "danimeverse-c1fa3.firebasestorage.app",
  messagingSenderId: "626679123848",
  appId: "1:626679123848:web:dec7eeffb63885fa48343d"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function slugify(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function showToast(msg, success = true) {
  let toast = document.getElementById("wl-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "wl-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = success ? "wl-toast-success" : "wl-toast-remove";
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

async function getWatchlistSlugs(uid) {
  const snap = await getDocs(collection(db, "watchlists", uid, "items"));
  return new Set(snap.docs.map(d => d.id));
}

async function addItem(uid, anime) {
  const slug = slugify(anime.title);
  await setDoc(doc(db, "watchlists", uid, "items", slug), {
    ...anime,
    addedAt: Date.now()
  });
  return slug;
}

async function removeItem(uid, slug) {
  await deleteDoc(doc(db, "watchlists", uid, "items", slug));
}

function injectButtons(uid, slugs) {
  document.querySelectorAll("article.glass-card").forEach(card => {
    if (card.querySelector(".wl-btn")) return;

    const imgEl = card.querySelector("img");
    const h3 = card.querySelector("h3");
    const pEl = card.querySelector("p");
    const genreEl = card.querySelector("[data-genres]");
    const parentA = card.closest("a");

    if (!h3) return;

    const anime = {
      title: h3.textContent.trim(),
      img: imgEl?.src || "",
      desc: pEl?.textContent.trim() || "",
      href: parentA?.getAttribute("href") || "",
      genres: genreEl?.dataset.genres || ""
    };
    const slug = slugify(anime.title);
    const inList = slugs.has(slug);

    const btn = document.createElement("button");
    btn.className = "wl-btn" + (inList ? " in-list" : "");
    btn.dataset.slug = slug;
    btn.title = inList ? "Remove from My List" : "Add to My List";
    btn.innerHTML = inList
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    btn.addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;
      btn.disabled = true;

      try {
        if (btn.classList.contains("in-list")) {
          await removeItem(uid, btn.dataset.slug);
          btn.classList.remove("in-list");
          btn.title = "Add to My List";
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
          showToast("Removed from My List", false);
        } else {
          const newSlug = await addItem(uid, anime);
          btn.dataset.slug = newSlug;
          btn.classList.add("in-list");
          btn.title = "Remove from My List";
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
          showToast("Added to My List ✓");
        }
      } finally {
        btn.disabled = false;
      }
    });

    card.appendChild(btn);
  });
}

async function renderWatchlistPage(uid) {
  const grid = document.getElementById("watchlist-grid");
  const emptyState = document.getElementById("watchlist-empty");
  const loading = document.getElementById("watchlist-loading");
  const countEl = document.getElementById("watchlist-count");

  if (!grid) return;

  const snap = await getDocs(collection(db, "watchlists", uid, "items"));

  loading?.classList.add("hidden");

  if (snap.empty) {
    emptyState?.classList.remove("hidden");
    if (countEl) countEl.textContent = "0 titles";
    return;
  }

  if (countEl) countEl.textContent = `${snap.docs.length} title${snap.docs.length !== 1 ? "s" : ""}`;

  const items = snap.docs.map(d => ({ slug: d.id, ...d.data() }));
  items.sort((a, b) => b.addedAt - a.addedAt);

  grid.innerHTML = "";
  items.forEach(anime => {
    const card = document.createElement("div");
    card.className = "wl-card";
    card.innerHTML = `
      <img src="${anime.img}" alt="${anime.title}" loading="lazy" />
      <div class="wl-card-overlay">
        <p class="wl-card-genres">${anime.genres || ""}</p>
        <h3 class="wl-card-title">${anime.title}</h3>
        <div class="wl-card-actions">
          <a href="${anime.href || "#"}" class="wl-watch-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5,3 19,12 5,21"/></svg>
            Watch
          </a>
          <button class="wl-remove-btn" data-slug="${anime.slug}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            Remove
          </button>
        </div>
      </div>
      <button class="wl-remove-icon" data-slug="${anime.slug}" title="Remove">✕</button>
    `;

    card.querySelectorAll("[data-slug]").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.preventDefault();
        e.stopPropagation();
        await removeItem(uid, anime.slug);
        card.classList.add("removing");
        setTimeout(() => {
          card.remove();
          const remaining = grid.querySelectorAll(".wl-card").length;
          if (countEl) countEl.textContent = `${remaining} title${remaining !== 1 ? "s" : ""}`;
          if (!remaining) emptyState?.classList.remove("hidden");
        }, 350);
        showToast("Removed from My List", false);
      });
    });

    grid.appendChild(card);
  });
}

onAuthStateChanged(auth, async user => {
  const myListLink = document.getElementById("myListLink");
  if (myListLink) {
    myListLink.style.display = user ? "" : "none";
  }

  const notSignedIn = document.getElementById("watchlist-not-signed-in");
  const loading = document.getElementById("watchlist-loading");

  if (!user) {
    loading?.classList.add("hidden");
    notSignedIn?.classList.remove("hidden");
    return;
  }

  if (document.querySelector("article.glass-card")) {
    const slugs = await getWatchlistSlugs(user.uid);
    injectButtons(user.uid, slugs);
  }

  if (document.getElementById("watchlist-grid")) {
    renderWatchlistPage(user.uid);
  }
});
