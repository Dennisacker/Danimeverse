console.log("🔥 Anime script is running");
document.addEventListener("click", (e) => {
  const card = e.target.closest(".anime-card");
  if (!card) return;

  const modal = document.getElementById("animeModal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");

  const img = card.querySelector("img");
  const title = card.querySelector("h3");
  const desc = card.querySelector("p");

  if (img) modalImg.src = img.src;
  if (title) modalTitle.textContent = title.textContent;
  if (desc) modalDesc.textContent = desc.textContent;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
});

// close button
document.addEventListener("click", (e) => {
  if (e.target.id === "closeModal") {
    const modal = document.getElementById("animeModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
});

// click outside modal
document.addEventListener("click", (e) => {
  const modal = document.getElementById("animeModal");

  if (e.target === modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
});