```js
console.log("🔥 Danimeverse JS loaded");

/* =========================
   ANIME MODAL SYSTEM
========================= */

document.addEventListener("click", (e) => {
  const card = e.target.closest(".anime-card");
  if (!card) return;

  const modal = document.getElementById("animeModal");
  if (!modal) return;

  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");

  // Look up from the parent article/card
  const article = card.closest("article") || card.parentElement;
  const img = article ? article.querySelector("img") : null;
  const title = article ? article.querySelector("h3") : null;
  const desc = article ? article.querySelector("p") : null;

  if (img) modalImg.src = img.src;
  if (title) modalTitle.textContent = title.textContent;
  if (desc) modalDesc.textContent = desc.textContent;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
});


/* =========================
   CLOSE MODAL
========================= */

document.addEventListener("click", (e) => {
  const modal = document.getElementById("animeModal");
  if (!modal) return;

  if (e.target.id === "closeModal" || e.target === modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
});


/* =========================
   NAVBAR SCROLL EFFECT
========================= */

const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });
}


/* =========================
   GENRE CARD NAVIGATION
   AND UNDERLINE ANIMATION
========================= */

document.addEventListener("DOMContentLoaded", () => {

  const genreCards = document.querySelectorAll(".genre-card");
  const underline = document.getElementById("genreUnderline");

  if (!genreCards.length) return;

  // Jikan API genre IDs
  const genreIds = {
    action: 1,
    adventure: 2,
    fantasy: 10,
    "sci-fi": 24,
    supernatural: 37,
    thriller: 41,
    isekai: 62,
    superhero: 74
  };


  /* =========================
     GENRE CARD CLICK
  ========================= */

  genreCards.forEach(card => {

    card.addEventListener("click", () => {

      const genre = card.dataset.genre;

      if (!genre) {
        console.error("❌ No data-genre found on card");
        return;
      }

      const genreId = genreIds[genre];

      if (!genreId) {
        console.error("❌ Genre ID not found:", genre);
        return;
      }


      /* =========================
         ACTIVE CARD ANIMATION
      ========================= */

      genreCards.forEach(c => {
        c.classList.remove(
          "ring-2",
          "ring-pink-500",
          "scale-105"
        );
      });

      card.classList.add(
        "ring-2",
        "ring-pink-500",
        "scale-105"
      );


      /* =========================
         UNDERLINE ANIMATION
      ========================= */

      if (underline) {

        underline.style.width =
          `${card.offsetWidth}px`;

        underline.style.transform =
          `translateX(${card.offsetLeft}px)`;

      }


      /* =========================
         SAVE SELECTED GENRE
      ========================= */

      localStorage.setItem(
        "selectedGenre",
        genre
      );


      /* =========================
         GO TO GENRE PAGE
      ========================= */

     window.location.assign(
  `genre.html?genre=${encodeURIComponent(genre)}&id=${genreId}`
);
  });


  /* =========================
     RESTORE LAST GENRE

     IMPORTANT:
     We DON'T automatically click
     the card anymore because that
     was causing the homepage to
     redirect to Action.
  ========================= */

  const savedGenre =
    localStorage.getItem("selectedGenre");

  if (savedGenre) {

    const savedCard =
      [...genreCards].find(
        card => card.dataset.genre === savedGenre
      );

    if (savedCard && underline) {

      underline.style.width =
        `${savedCard.offsetWidth}px`;

      underline.style.transform =
        `translateX(${savedCard.offsetLeft}px)`;

    }

  }

});
```
