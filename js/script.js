console.log("JAVA SCRIPT IS START");

const play = document.getElementById("play");
const previous = document.getElementById("previous");
const next = document.getElementById("next");

let currentsong = new Audio();
let songs = [];

// Format time mm:ss
function formatTime(seconds) {
  seconds = Math.round(seconds);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Fetch songs.json instead of reading folder
async function getsongs(folder = "songs/") {
  try {
    const res = await fetch(`${folder}songs.json`);
    const data = await res.json();
    songs = data.songs.map(name => `${folder}${name}`);
  } catch (err) {
    console.error(`❌ songs.json missing in ${folder}`, err);
    songs = [];
  }

  console.log("Songs found:", songs);

  let songUL = document.querySelector(".songlist ul");
  if (songUL) {
    songUL.innerHTML = "";
    for (const song of songs) {
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
    }

    Array.from(document.querySelectorAll(".songlist li")).forEach((e, i) => {
      e.addEventListener("click", () => playmusic(songs[i]));
    });
  }

  return songs;
}

// Play song
const playmusic = (track, pause = false) => {
  if (!track) return;

  currentsong.src = track;
  if (!pause) {
    currentsong.play();
    play.src = "img/pause.svg";
  } else {
    play.src = "img/play.svg";
  }

  let cleanName = decodeURI(track.split("/").pop());
  document.querySelector(".songinfo").innerHTML = cleanName;
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Display albums
async function displayalbums() {
  console.log("Loading albums from index.json...");

  try {
    const res = await fetch("songs/index.json");
    const data = await res.json();
    const albums = data.albums || [];

    const cardcontainer = document.querySelector(".cardcontainer");
    cardcontainer.innerHTML = "";

    for (const folder of albums) {
      try {
        const infoRes = await fetch(`songs/${folder}/info.json`);
        const info = await infoRes.json();

        cardcontainer.innerHTML += `
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
      } catch (err) {
        console.warn(`⚠️ Missing or broken info.json in songs/${folder}`);
      }
    }

    // Album click event
    Array.from(document.getElementsByClassName("card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        songs = await getsongs(`songs/${item.currentTarget.dataset.folder}/`);
        playmusic(songs[0]);
      });
    });

    // Auto load first album
    if (albums.length > 0) {
      let firstAlbum = albums[0];
      console.log("Auto loading first album:", firstAlbum);
      songs = await getsongs(`songs/${firstAlbum}/`);
      playmusic(songs[0], true);
    }
  } catch (err) {
    console.error("❌ Error loading index.json:", err);
  }
}

// Main function
async function main() {
  await displayalbums();

  // Play/Pause
  play.addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      play.src = "img/pause.svg";
    } else {
      currentsong.pause();
      play.src = "img/play.svg";
    }
  });

  // Time update and seekbar
  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML =
      `${formatTime(currentsong.currentTime)} / ${formatTime(currentsong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentsong.currentTime / currentsong.duration) * 100 + "%";
  });

  // Seekbar click
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentsong.currentTime = (currentsong.duration * percent) / 100;
  });

  // Sidebar toggle
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Previous
  previous.addEventListener("click", () => {
    if (!songs.length) return;
    let index = songs.findIndex(song => song.endsWith(currentsong.src.split("/").pop()));
    if (index > 0) {
      let shouldPlay = !currentsong.paused;
      playmusic(songs[index - 1], !shouldPlay);
    }
  });

  // Next
  next.addEventListener("click", () => {
    if (!songs.length) return;
    let index = songs.findIndex(song => song.endsWith(currentsong.src.split("/").pop()));
    if (index < songs.length - 1) {
      let shouldPlay = !currentsong.paused;
      playmusic(songs[index + 1], !shouldPlay);
    }
  });

  // Auto next
  currentsong.addEventListener("ended", () => {
    if (!songs.length) return;
    let index = songs.findIndex(song => song.endsWith(currentsong.src.split("/").pop()));
    if (index < songs.length - 1) playmusic(songs[index + 1]);
    else playmusic(songs[0]);
  });

  // Volume
  const volumeSlider = document.querySelector(".range input");
  const volumeIcon = document.querySelector(".volume > img");

  volumeSlider.addEventListener("input", (e) => {
    const volume = parseInt(e.target.value) / 100;
    currentsong.volume = volume;

    if (volume > 0 && volumeIcon.src.includes("mute.svg")) {
      volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
    }
    if (volume === 0 && volumeIcon.src.includes("volume.svg")) {
      volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
    }
  });

  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentsong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentsong.volume = 0.15;
      document.querySelector(".range input").value = 15;
    }
  });
}

main();
