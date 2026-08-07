console.log("🔥 HERO JS LOADED");
document.addEventListener("DOMContentLoaded", () => {

    let currentHero = 0;
    let activeBg = "A";


    const bgA = document.getElementById("heroBgA");
    const bgB = document.getElementById("heroBgB");
    const welcomeBg = document.getElementById("welcomeBg");
    const title = document.getElementById("animeTitle");
    const desc = document.getElementById("animeDesc");
    const rating = document.getElementById("rating");
    const genre = document.getElementById("genre");
    const animeContent = document.getElementById("animeContent");
    const dots = document.getElementById("heroDots");


    if(!bgA || !bgB){
        console.log("Hero elements missing");
        return;
    }



    // create dots

    featuredAnime.forEach((anime,index)=>{

        const dot=document.createElement("button");

        dot.className =
        "w-3 h-3 rounded-full bg-white/50 transition";

        dot.onclick=()=>{

            currentHero=index;
            changeHero();

        };

        dots.appendChild(dot);

    });


    async function changeHero(){

        const anime = featuredAnime[currentHero];

        console.log("Current anime:", anime.title);


        const next =
        activeBg === "A" ? bgB : bgA;


        const current =
        activeBg === "A" ? bgA : bgB;



        const backdrop = await getAnimeBackdrop(anime.title);

        console.log("Backdrop URL:", backdrop);



        if(backdrop){

            next.style.backgroundImage =
            `url('${backdrop}')`;

        }


        next.style.opacity = "1";

        current.style.opacity = "0";



        // restart text animation

        animeContent.classList.remove("hero-text");

        void animeContent.offsetWidth;

        animeContent.classList.add("hero-text");


        title.textContent = anime.title;

        desc.textContent = anime.desc;

        rating.textContent = anime.rating;

        genre.textContent = anime.genre;
        console.log({
            title: anime.title,
            desc: anime.desc,
            rating: anime.rating,
            genre: anime.genre
        });


        activeBg =
        activeBg === "A" ? "B" : "A";


        currentHero++;


        if(currentHero >= featuredAnime.length){

            currentHero = 0;

        }

    }

    // first load

    setTimeout(() => {
         welcomeBg.style.opacity = "0";
        document.getElementById("welcomeContent")
            .classList.add("hidden");

        animeContent.classList.remove("hidden");
        animeContent.classList.add("hero-text");

        changeHero();

        setInterval(() => {
            changeHero();
        }, 6000);

    }, 5000);

    }); // <-- THIS IS MISSING