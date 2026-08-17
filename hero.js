console.log("🔥 HERO JS LOADED");

let currentHeroAnime = null;


document.addEventListener("DOMContentLoaded", () => {

    let currentHero = 0;
    let activeBg = "A";


    const bgA =
        document.getElementById("heroBgA");

    const bgB =
        document.getElementById("heroBgB");

    const welcomeBg =
        document.getElementById("welcomeBg");

    const title =
        document.getElementById("animeTitle");

    const desc =
        document.getElementById("animeDesc");

    const rating =
        document.getElementById("rating");

    const genre =
        document.getElementById("genre");

    const animeContent =
        document.getElementById("animeContent");

    const dots =
        document.getElementById("heroDots");


    const heroWatchBtn =
        document.getElementById("heroWatchBtn");

    const heroWatchlistBtn =
        document.getElementById("heroWatchlistBtn");

    const heroWatchlistText =
        document.getElementById("heroWatchlistText");


    if (!bgA || !bgB) {

        console.log(
            "❌ Hero elements missing"
        );

        return;

    }


    /* =========================================================
       HERO WATCHLIST BUTTON
    ========================================================= */

    async function updateHeroWatchlistButton() {

        if (
            !currentHeroAnime ||
            !heroWatchlistBtn ||
            !heroWatchlistText
        ) {

            return;

        }


        if (
            !window.danimeverseWatchlist
        ) {

            heroWatchlistText.textContent =
                "Add to Watchlist";

            return;

        }


        try {

            const inWatchlist =
                await window.danimeverseWatchlist.isInWatchlist(
                    currentHeroAnime
                );


            heroWatchlistText.textContent =
                inWatchlist
                    ? "✓ In Watchlist"
                    : "Add to Watchlist";


        } catch (error) {

            console.error(
                "❌ Hero watchlist check failed:",
                error
            );

        }

    }
    /* =========================================================
       HERO WATCH NOW
    ========================================================= */

    if (heroWatchBtn) {

        heroWatchBtn.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();


                if (!currentHeroAnime) {

                    console.error(
                        "❌ No featured anime selected."
                    );

                    return;

                }


                console.log(
                    "🎬 Hero Watch Now:",
                    currentHeroAnime.title
                );


                openAnime(
                    currentHeroAnime
                );

            }
        );

    }


        /* =========================================================
           HERO ADD TO WATCHLIST
        ========================================================= */

        if (heroWatchlistBtn) {

            heroWatchlistBtn.addEventListener(
                "click",
                async function(event) {

                    event.preventDefault();
                    event.stopPropagation();


                    if (!currentHeroAnime) {

                        console.error(
                            "❌ No hero anime selected."
                        );

                        return;

                    }


                    if (
                        !window.danimeverseWatchlist
                    ) {

                        console.error(
                            "❌ Firebase Watchlist system is not available."
                        );

                        return;

                    }


                    try {

                        heroWatchlistBtn.disabled =
                            true;


                        const result =
                            await window.danimeverseWatchlist.addOrRemove(
                                currentHeroAnime
                            );


                        if (
                            result.success
                        ) {

                            heroWatchlistText.textContent =
                                result.inWatchlist
                                    ? "✓ In Watchlist"
                                    : "Add to Watchlist";

                        }


                    } catch (error) {

                        console.error(
                            "❌ Hero Watchlist error:",
                            error
                        );

                    } finally {

                        heroWatchlistBtn.disabled =
                            false;

                    }

                }
            );

        }
    /* =========================================================
       CREATE HERO DOTS
    ========================================================= */

    featuredAnime.forEach(
        (anime, index) => {

            const dot =
                document.createElement(
                    "button"
                );


            dot.className =
                "w-3 h-3 rounded-full bg-white/50 transition";


            dot.onclick = () => {

                currentHero = index;

                changeHero();

            };


            dots.appendChild(dot);

        }
    );


    /* =========================================================
       CHANGE HERO
    ========================================================= */

    async function changeHero() {

        const anime =
            featuredAnime[currentHero];


        /* =====================================================
           SAVE CURRENT HERO
        ===================================================== */

        currentHeroAnime =
            anime;


        console.log(
            "Current anime:",
            anime.title
        );


        /* =====================================================
           UPDATE WATCHLIST BUTTON
        ===================================================== */

        await updateHeroWatchlistButton();


        const next =
            activeBg === "A"
                ? bgB
                : bgA;


        const current =
            activeBg === "A"
                ? bgA
                : bgB;


        const backdrop =
            await getAnimeBackdrop(
                anime.title
            );


        console.log(
            "Backdrop URL:",
            backdrop
        );


        if (backdrop) {

            next.style.backgroundImage =
                `url('${backdrop}')`;

        }


        next.style.opacity =
            "1";

        current.style.opacity =
            "0";


        /* =====================================================
           RESTART TEXT ANIMATION
        ===================================================== */

        animeContent.classList.remove(
            "hero-text"
        );


        void animeContent.offsetWidth;


        animeContent.classList.add(
            "hero-text"
        );


        title.textContent =
            anime.title;


        desc.textContent =
            anime.desc;


        rating.textContent =
            anime.rating;


        genre.textContent =
            anime.genre;


        console.log({

            title: anime.title,

            desc: anime.desc,

            rating: anime.rating,

            genre: anime.genre

        });


        activeBg =
            activeBg === "A"
                ? "B"
                : "A";


        currentHero++;


        if (
            currentHero >=
            featuredAnime.length
        ) {

            currentHero = 0;

        }

    }


    /* =========================================================
       FIRST LOAD
    ========================================================= */

    setTimeout(
        () => {

            document
                .getElementById(
                    "welcomeContent"
                )
                .classList.add(
                    "hidden"
                );


            animeContent.classList.remove(
                "hidden"
            );


            animeContent.classList.add(
                "hero-text"
            );


            changeHero();


            setInterval(
                () => {

                    changeHero();

                },
                6000
            );

        },
        5000
    );

});
/* =========================================================
   HERO WATCHLIST BRIDGE
========================================================= */

window.danimeverseWatchlist = {

    async addOrRemove(anime) {

        const user =
            auth.currentUser;


        if (!user) {

            showToast(
                "Please sign in first.",
                false
            );

            return {
                success: false,
                reason: "not-signed-in"
            };

        }


        const title =
            anime?.title ||
            "Unknown Anime";


        const slug =
            slugify(title);


        const snapshot =
            await getDoc(
                doc(
                    db,
                    "watchlists",
                    user.uid,
                    "items",
                    slug
                )
            );


        if (snapshot.exists()) {

            await removeItem(
                user.uid,
                slug
            );


            showToast(
                "Removed from My List",
                false
            );


            return {
                success: true,
                inWatchlist: false
            };

        }


        await addItem(
            user.uid,
            anime
        );


        showToast(
            "Added to My List ✓"
        );


        return {
            success: true,
            inWatchlist: true
        };

    },


    async isInWatchlist(anime) {

        const user =
            auth.currentUser;


        if (!user) {

            return false;

        }


        const title =
            anime?.title ||
            "Unknown Anime";


        const slug =
            slugify(title);


        const snapshot =
            await getDoc(
                doc(
                    db,
                    "watchlists",
                    user.uid,
                    "items",
                    slug
                )
            );


        return snapshot.exists();

    }

};