console.log("JAVASCRIPT IS START");

const play = document.getElementById("play");
const previous = document.getElementById("previous");
const next = document.getElementById("next");

let currentSong = new Audio();
let songs = [];
let currentIndex = 0;

//  Format mm:ss
function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  let minutes = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

//  Fetch songs from songs.json
async function getSongs(folder = "songs/") {
  try {
    const res = await fetch(`${folder}songs.json`);
    const data = await res.json();
    songs = data.songs.map(name => `${folder}${name}`);
  } catch (err) {
    console.error(` songs.json missing in ${folder}`, err);
    songs = [];
  }

  console.log(" Songs Found:", songs);

  let songUL = document.querySelector(".songlist ul");
  if (songUL) {
    songUL.innerHTML = "";
    songs.forEach((song, index) => {
      let displayName = decodeURI(song.split("/").pop().replace(".mp3", ""));
      songUL.innerHTML += `
        <li>
          <img class="invert" src="img/music.svg" alt="">
          <div class="info">
            <div>${displayName}</div>
            <div>Prince</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="img/play.svg" alt="">
          </div>
        </li>`;
    });

    // Add click event
    Array.from(document.querySelectorAll(".songlist li")).forEach((e, i) => {
      e.addEventListener("click", () => {
        currentIndex = i;
        playMusic(songs[i]);
      });
    });
  }
  return songs;
}

// 🔹 Play specific song
function playMusic(track, pause = false) {
  if (!track) return;

  currentSong.src = track;
  if (!pause) {
    currentSong.play();
    play.src = "img/pause.svg";
  } else {
    play.src = "img/play.svg";
  }

  let cleanName = decodeURI(track.split("/").pop().replace(".mp3", ""));
  document.querySelector(".songinfo").innerHTML = cleanName;
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

  highlightCurrentSong();
}

//  Highlight playing song
function highlightCurrentSong() {
  let lis = document.querySelectorAll(".songlist li");
  lis.forEach((li, i) => {
    if (i === currentIndex) {
      li.style.background = "#1db954";
      li.style.color = "black";
    } else {
      li.style.background = "";
      li.style.color = "white";
    }
  });
}

//  Display albums from index.json
async function displayAlbums() {
  try {
    const res = await fetch("songs/index.json");
    const data = await res.json();
    const albums = data.albums || [];

    const cardContainer = document.querySelector(".cardcontainer");
    cardContainer.innerHTML = "";

    for (const folder of albums) {
      try {
        const infoRes = await fetch(`songs/${folder}/info.json`);
        const info = await infoRes.json();

        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#1DB954" />
                <path d="M10.2 8.5L10.2 15.5L16.2 12Z" fill="#ffffff" />
              </svg>
            </div>
            <img src="songs/${folder}/cover.jpg" alt="">
            <h2>${info.title}</h2>
            <p>${info.description}</p>
          </div>`;
      } catch {
        console.warn(` info.json missing in songs/${folder}`);
      }
    }

    // Click to open album
    Array.from(document.getElementsByClassName("card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        songs = await getSongs(`songs/${item.currentTarget.dataset.folder}/`);
        currentIndex = 0;
        playMusic(songs[currentIndex]);
      });
    });

    // Auto-load first album
    if (albums.length > 0) {
      let first = albums[0];
      songs = await getSongs(`songs/${first}/`);
      playMusic(songs[0], true);
    }
  } catch (err) {
    console.error(" Error loading index.json:", err);
  }
}

// Main Function
async function main() {
  await displayAlbums();

  // Play / Pause
  play.addEventListener("click", () => {
    if (!currentSong.src) return;
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  // Time + Seekbar
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML =
      `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Seekbar click
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    if (!currentSong.duration) return;
    let percent = (e.offsetX / e.target.clientWidth);
    currentSong.currentTime = currentSong.duration * percent;
  });

  // Sidebar open/close
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Previous
  previous.addEventListener("click", () => {
    if (!songs.length) return;
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playMusic(songs[currentIndex]);
  });

  // Next
  next.addEventListener("click", () => {
    if (!songs.length) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex]);
  });

  // Auto play next when current ends
  currentSong.addEventListener("ended", () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex]);
  });

  // Volume control
  const volumeSlider = document.querySelector(".range input");
  const volumeIcon = document.querySelector(".volume > img");

  volumeSlider.addEventListener("input", (e) => {
    const vol = parseInt(e.target.value) / 100;
    currentSong.volume = vol;

    if (vol === 0) {
      volumeIcon.src = "img/mute.svg";
    } else {
      volumeIcon.src = "img/volume.svg";
    }
  });

  volumeIcon.addEventListener("click", () => {
    if (volumeIcon.src.includes("volume.svg")) {
      volumeIcon.src = "img/mute.svg";
      currentSong.volume = 0;
      volumeSlider.value = 0;
    } else {
      volumeIcon.src = "img/volume.svg";
      currentSong.volume = 0.15;
      volumeSlider.value = 15;
    }
  });

  // Button highlight animation
  const buttons = [previous, play, next];
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

main();

