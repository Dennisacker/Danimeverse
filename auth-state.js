import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

  const userProfile = document.getElementById("userProfile");

  if (user) {

    // 👤 show user email or name
    if (userProfile) {
      userProfile.innerHTML = `
        👤 ${user.email}
        <button id="logoutBtn" class="ml-3 text-pink-400">
          Logout
        </button>
      `;
    }

    // logout button
    setTimeout(() => {
      const logoutBtn = document.getElementById("logoutBtn");

      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          await signOut(auth);
          location.reload();
        });
      }
    }, 100);

  } else {

    if (userProfile) {
      userProfile.innerHTML = `
        <a href="signin.html" class="text-pink-400">Sign In</a>
      `;
    }

  }

});