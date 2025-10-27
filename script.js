document.addEventListener("DOMContentLoaded", async () => {
  // --- VARIÁVEIS GLOBAIS ---
  let db = { artists: [], albums: [], singles: [], songs: [], players: [] };
  // ... (suas variáveis globais existentes) ...

  // --- VARIÁVEIS DO PLAYER ---
  let audioElement = null;
  let musicPlayerView = null;
  let playerCloseBtn = null;
  let playerAlbumTitle = null;
  let playerCoverArt = null;
  let playerSongTitle = null;
  let playerArtistName = null;
  let playerSeekBar = null;
  let playerCurrentTime = null;
  let playerTotalTime = null;
  let playerShuffleBtn = null;
  let playerPrevBtn = null;
  let playerPlayPauseBtn = null;
  let playerNextBtn = null;
  let playerRepeatBtn = null;

  let currentSong = null;
  let currentQueue = [];
  let currentQueueIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = "none"; // 'none', 'all', 'one'

  // --- ELEMENTOS DO DOM ---
  // ... (sua lista de elementos DOM existente) ...

  const AIRTABLE_BASE_ID = "appG5NOoblUmtSMVI";
  // ... (suas constantes existentes) ...

  // --- FUNÇÃO PARA INICIALIZAR ELEMENTOS DO DOM ---
  function initializeDOMElements() {
    console.log("Initializing DOM elements...");
    try {
      // ... (sua inicialização DOM existente) ...

      // --- INICIALIZAÇÃO DO PLAYER ---
      audioElement = document.getElementById("audioElement");
      musicPlayerView = document.getElementById("musicPlayer");
      playerCloseBtn = document.querySelector(".player-close-btn");
      playerAlbumTitle = document.getElementById("playerAlbumTitle");
      playerCoverArt = document.getElementById("playerCoverArt");
      playerSongTitle = document.getElementById("playerSongTitle");
      playerArtistName = document.getElementById("playerArtistName");
      playerSeekBar = document.getElementById("playerSeekBar");
      playerCurrentTime = document.getElementById("playerCurrentTime");
      playerTotalTime = document.getElementById("playerTotalTime");
      playerShuffleBtn = document.getElementById("playerShuffleBtn");
      playerPrevBtn = document.getElementById("playerPrevBtn");
      playerPlayPauseBtn = document.getElementById("playerPlayPauseBtn");
      playerNextBtn = document.getElementById("playerNextBtn");
      playerRepeatBtn = document.getElementById("playerRepeatBtn");

      const playerElements = [
        audioElement,
        musicPlayerView,
        playerCloseBtn,
        playerPlayPauseBtn,
        playerSeekBar,
        playerNextBtn,
        playerPrevBtn,
      ];
      if (playerElements.some((el) => !el)) {
        console.error(
          "ERRO CRÍTICO: Elementos essenciais do PLAYER não foram encontrados!"
        );
        return false;
      }
      // --- FIM DA INICIALIZAÇÃO DO PLAYER ---

      // ... (seu código existente) ...
      console.log("DOM elements initialized.");
      return true;
    } catch (error) {
      // ... (seu catch existente) ...
      return false;
    }
  }

  // --- 1. CARREGAMENTO DE DADOS ---
  // ... (todo o seu código de carregamento de dados existente) ...
  // ... (fetchAllAirtablePages, loadAllData, initializeData, etc) ...

  // --- 2. NAVEGAÇÃO E UI ---
  // ... (suas funções switchView, switchTab, handleBack, etc.) ...

  // ... (sua função renderChart) ...

  // ... (sua função openArtistDetail) ...

  // ... (sua função openAlbumDetail) ...

  // ... (suas funções de discografia, pesquisa, countdown) ...

  // --- 3. SISTEMA DE RPG ---
  // ... (seu código RPG existente) ...

  // --- 4. SISTEMA DO ESTÚDIO ---
  // ... (seu código do Estúdio existente) ...

  // --- 5. LÓGICA DO PLAYER DE MÚSICA ---

  function openPlayer(songId, clickedElement) {
    const song = db.songs.find((s) => s.id === songId);
    if (!song) {
      console.error(`Música com ID ${songId} não encontrada.`);
      return;
    }

    // Tenta construir a fila de reprodução a partir do contexto
    const parentList = clickedElement.closest(
      ".popular-songs-list, .tracklist-container, .chart-list"
    );
    if (parentList) {
      const songElements = parentList.querySelectorAll("[data-song-id]");
      currentQueue = Array.from(songElements)
        .map((el) => db.songs.find((s) => s.id === el.dataset.songId))
        .filter(Boolean); // Filtra músicas não encontradas
    } else {
      // Fila de fallback: apenas a música clicada
      currentQueue = [song];
    }

    currentQueueIndex = currentQueue.findIndex((s) => s.id === songId);
    if (currentQueueIndex === -1) {
      currentQueue = [song];
      currentQueueIndex = 0;
    }

    currentSong = song;
    loadSong(song);
    musicPlayerView.classList.remove("hidden");
    document.body.classList.add("player-open");
    playAudio();
  }

  function closePlayer() {
    musicPlayerView.classList.add("hidden");
    document.body.classList.remove("player-open");
    // Decidimos não parar a música ao fechar, mas você pode adicionar pauseAudio() aqui se preferir
    // pauseAudio();
  }

  function loadSong(song) {
    currentSong = song;

    // Atualiza a UI do Player
    playerSongTitle.textContent = song.title;
    playerArtistName.textContent = formatArtistString(
      song.artistIds,
      song.collabType
    );

    const parentRelease = [...db.albums, ...db.singles].find(
      (r) => r.id === song.albumId
    );
    if (parentRelease) {
      playerCoverArt.src = parentRelease.imageUrl;
      playerAlbumTitle.textContent = parentRelease.title;
    } else {
      playerCoverArt.src = "https://i.imgur.com/AD3MbBi.png"; // Fallback
      playerAlbumTitle.textContent = "Single";
    }

    // *** IMPORTANTE: SIMULAÇÃO DE ÁUDIO ***
    // No mundo real, você usaria song.audioUrl ou algo do seu DB
    audioElement.src =
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    audioElement.load();

    playerSeekBar.value = 0; // Reseta a barra
    playerCurrentTime.textContent = "0:00";
    playerTotalTime.textContent = "0:00";
  }

  function playAudio() {
    audioElement
      .play()
      .then(() => {
        isPlaying = true;
        playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      })
      .catch((error) => {
        console.error("Erro ao tocar áudio:", error);
        isPlaying = false;
      });
  }

  function pauseAudio() {
    audioElement.pause();
    isPlaying = false;
    playerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }

  function togglePlay() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  function playNext() {
    if (isShuffle) {
      currentQueueIndex = Math.floor(Math.random() * currentQueue.length);
    } else {
      currentQueueIndex++;
    }

    if (currentQueueIndex >= currentQueue.length) {
      if (repeatMode === "all") {
        currentQueueIndex = 0; // Volta ao início
      } else {
        currentQueueIndex = currentQueue.length - 1; // Para no final
        pauseAudio(); // Para de tocar
        return;
      }
    }

    loadSong(currentQueue[currentQueueIndex]);
    playAudio();
  }

  function playPrevious() {
    // Se a música estiver tocando por mais de 3 segundos, reinicie
    if (audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }

    if (isShuffle) {
      currentQueueIndex = Math.floor(Math.random() * currentQueue.length);
    } else {
      currentQueueIndex--;
    }

    if (currentQueueIndex < 0) {
      if (repeatMode === "all") {
        currentQueueIndex = currentQueue.length - 1; // Vai para o final
      } else {
        currentQueueIndex = 0; // Para no início
      }
    }

    loadSong(currentQueue[currentQueueIndex]);
    playAudio();
  }

  function toggleShuffle() {
    isShuffle = !isShuffle;
    playerShuffleBtn.classList.toggle("active", isShuffle);
    console.log("Shuffle:", isShuffle);
  }

  function toggleRepeat() {
    const icon = playerRepeatBtn.querySelector("i");
    if (repeatMode === "none") {
      repeatMode = "all";
      playerRepeatBtn.classList.add("active");
      icon.className = "fas fa-repeat";
    } else if (repeatMode === "all") {
      repeatMode = "one";
      playerRepeatBtn.classList.add("active");
      icon.className = "fas fa-repeat-1"; // FontAwesome 6+
    } else {
      // repeatMode === 'one'
      repeatMode = "none";
      playerRepeatBtn.classList.remove("active");
      icon.className = "fas fa-repeat";
    }
    console.log("Repeat Mode:", repeatMode);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function updateSeekBar() {
    if (!isNaN(audioElement.duration)) {
      playerSeekBar.value = audioElement.currentTime;
      playerCurrentTime.textContent = formatTime(audioElement.currentTime);
    }
  }

  function initializePlayerListeners() {
    playerCloseBtn.addEventListener("click", closePlayer);
    playerPlayPauseBtn.addEventListener("click", togglePlay);
    playerNextBtn.addEventListener("click", playNext);
    playerPrevBtn.addEventListener("click", playPrevious);
    playerShuffleBtn.addEventListener("click", toggleShuffle);
    playerRepeatBtn.addEventListener("click", toggleRepeat);

    audioElement.addEventListener("loadedmetadata", () => {
      playerSeekBar.max = audioElement.duration;
      playerTotalTime.textContent = formatTime(audioElement.duration);
    });

    audioElement.addEventListener("timeupdate", updateSeekBar);

    audioElement.addEventListener("ended", () => {
      if (repeatMode === "one") {
        audioElement.currentTime = 0;
        playAudio();
      } else {
        playNext();
      }
    });

    playerSeekBar.addEventListener("input", () => {
      audioElement.currentTime = playerSeekBar.value;
      playerCurrentTime.textContent = formatTime(playerSeekBar.value);
    });
  }

  // --- 6. INICIALIZAÇÃO GERAL ---

  function initializeBodyClickListener() {
    document.body.addEventListener("click", (e) => {
      const artistCard = e.target.closest(".artist-card[data-artist-name]");
      const albumCard = e.target.closest("[data-album-id]");

      // --- ATUALIZADO: Gatilho do Player ---
      const songCard = e.target.closest(
        ".song-row[data-song-id], .track-row[data-song-id], .chart-item[data-song-id]"
      );

      const artistLink = e.target.closest(".artist-link[data-artist-name]");
      const discogLink = e.target.closest(".see-all-btn[data-type]");

      if (discogLink) {
        openDiscographyDetail(discogLink.dataset.type);
        return;
      }
      if (albumCard) {
        openAlbumDetail(albumCard.dataset.albumId);
        return;
      }
      if (artistCard) {
        openArtistDetail(artistCard.dataset.artistName);
        return;
      }
      if (artistLink) {
        openArtistDetail(artistLink.dataset.artistName);
        return;
      }

      // --- ATUALIZADO: Ação do Player ---
      if (songCard) {
        // Verifica se a música está disponível (no caso de pré-lançamentos)
        if (!songCard.classList.contains("unavailable")) {
          console.log(
            "Abrindo player para música ID:",
            songCard.dataset.songId
          );
          openPlayer(songCard.dataset.songId, songCard);
        } else {
          console.log("Música indisponível.");
        }
        return;
      }
    });
    searchInput.addEventListener("input", handleSearch);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }

  async function main() {
    console.log("Iniciando Aplicação...");
    if (!initializeDOMElements()) return;

    document.body.classList.add("loading");
    const data = await loadAllData();

    if (data && data.allArtists) {
      if (!initializeData(data)) return;

      try {
        // ... (seu código de inicialização do main) ...

        initializePlayerListeners(); // <-- ADICIONA OS LISTENERS DO PLAYER

        // ... (o resto do seu código do main) ...

        initializeBodyClickListener(); // <-- Modificada para incluir o player

        // ... (o resto do seu código do main) ...
      } catch (uiError) {
        // ... (seu catch) ...
      }
    } else {
      // ... (seu else) ...
    }
    document.body.classList.remove("loading");
  }
  main();
}); // Fim DOMContentLoaded
