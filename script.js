console.log("🔥 Danimeverse JS loaded");

/* =========================
   ANIME MODAL SYSTEM
========================= */

document.addEventListener("click", (e) => {
  const card = e.target.closest(".anime-card");
  if (!card) return;

  const modal = document.getElementById("animeModal");
  if (!modal) return;

  const modalImg   = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc  = document.getElementById("modalDesc");

  // Look up from the parent article/card, not the empty data div
  const article = card.closest("article") || card.parentElement;
  const img   = article ? article.querySelector("img")  : null;
  const title = article ? article.querySelector("h3")   : null;
  const desc  = article ? article.querySelector("p")    : null;

  if (img)   modalImg.src              = img.src;
  if (title) modalTitle.textContent    = title.textContent;
  if (desc)  modalDesc.textContent     = desc.textContent;

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
