import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import { app } from "./firebase-config.js";


const auth = getAuth(app);
const db = getFirestore(app);


const favouritesContainer =
document.getElementById(
  "favouritesContainer"
);



onAuthStateChanged(auth, async(user)=>{


if(!user){

favouritesContainer.innerHTML =
`
<p class="text-white text-center">
Login to see favourites
</p>
`;

return;

}



loadFavourites(user.uid);



});



async function loadFavourites(uid){


const favRef =
collection(
db,
"users",
uid,
"favourites"
);



const snapshot =
await getDocs(favRef);



favouritesContainer.innerHTML="";



snapshot.forEach((item)=>{


const anime =
item.data();



const card =
document.createElement("article");


card.className=
`
glass-card
rounded-3xl
overflow-hidden
cursor-pointer
transition
hover:-translate-y-2
`;



card.innerHTML=

`

<img
src="${anime.image}"
class="
w-full
h-[350px]
object-cover
">


<div class="p-4">


<h2 class="
text-white
font-bold
text-xl
">
${anime.title}
</h2>


<p class="text-yellow-400 mt-2">
⭐ ${anime.score}
</p>


<button
class="
remove-fav
mt-4
bg-red-600
px-4
py-2
rounded-full
text-white
"
data-id="${item.id}"
>
Remove
</button>


</div>

`;



card.onclick=(e)=>{


if(e.target.classList.contains(
"remove-fav"
))
return;



window.location.href =
`
anime.html?malId=${anime.mal_id}
`;

};



card.querySelector(
".remove-fav"
)
.onclick=async()=>{


await deleteDoc(
doc(
db,
"users",
uid,
"favourites",
item.id
)
);


card.remove();



};



favouritesContainer.appendChild(card);



});


}