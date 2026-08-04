document.addEventListener("DOMContentLoaded", async () => {

    const footer = document.getElementById("footer");

    if (!footer) return;

    const response = await fetch("footer.html");

    footer.innerHTML = await response.text();

    const button = document.getElementById("backToTop");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 400) {

            button.classList.remove("hidden");

        } else {

            button.classList.add("hidden");

        }

    });

    button.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

});