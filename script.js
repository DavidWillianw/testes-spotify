// ==========================================================
// ============= CONFIGURAÇÃO SPOTIFY =======================
// ==========================================================
const CLIENT_ID = "4c1a5e5e8deb42c19d9b1b948717ea28"; // SEU CLIENT ID
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = [
    "streaming", "user-read-email", "user-read-private",
    "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing"
];

let accessToken = null;
let spotifyPlayer = null;
let spotifyDeviceId = null;
let currentTrackAlbumId = null; 
let currentContextUri = null;   
const spotifyUriCache = new Map();
let progressInterval = null;

// <<< CORREÇÃO 1: Definir a função globalmente
// Esta função será chamada pelo SDK do Spotify assim que ele estiver pronto.
window.onSpotifyWebPlaybackSDKReady = () => {
    // O SDK está pronto. Agora, só precisamos do token de acesso.
    // A função handleAuthentication() vai cuidar de chamar initSpotifyPlayer quando tiver o token.
    console.log("Spotify SDK está pronto.");
    // Se já tivermos um token, podemos tentar inicializar o player.
    if (accessToken) {
        initSpotifyPlayer(accessToken);
    }
};

document.addEventListener('DOMContentLoaded', handleAuthentication);

// --- FUNÇÕES DE AUTENTICAÇÃO E INICIALIZAÇÃO ---
function handleAuthentication() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get("access_token");

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem("spotify_access_token", accessToken);
        window.location.hash = "";
    } else {
        accessToken = localStorage.getItem("spotify_access_token");
    }

    if (!accessToken) {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('loginBtn').addEventListener('click', () => {
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES.join('%20')}`;
            window.location.href = authUrl;
        });
    } else {
        document.getElementById('loginOverlay').style.display = 'none';
        
        // <<< CORREÇÃO 2: Não definimos mais a função aqui.
        // Em vez disso, tentamos iniciar o player, pois agora temos o token.
        // A função global onSpotifyWebPlaybackSDKReady também pode chamar initSpotifyPlayer.
        // A verificação interna em initSpotifyPlayer garante que ele só rode uma vez.
        if (window.Spotify) { // Verifica se o SDK já carregou
             initSpotifyPlayer(accessToken);
        }
        
        startApp();
    }
}

function initSpotifyPlayer(token) {
    // <<< CORREÇÃO 3: Adicionar uma "guarda" para evitar inicializar o player mais de uma vez.
    if (spotifyPlayer) {
        return;
    }
    console.log("Inicializando o Spotify Player com o token.");

    spotifyPlayer = new Spotify.Player({
        name: "Spotify RPG Player",
        getOAuthToken: cb => cb(token),
        volume: 0.5,
    });
    spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Dispositivo conectado:", device_id);
        spotifyDeviceId = device_id;
        document.getElementById('deviceName').textContent = "este navegador";
    });
    spotifyPlayer.addListener("not_ready", ({ device_id }) => console.warn("Dispositivo desconectado", device_id));
    spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication failed:', message);
        localStorage.removeItem('spotify_access_token');
        window.location.reload(); // Recarrega a página para forçar o login
    });
    spotifyPlayer.addListener("player_state_changed", state => {
        if (!state) {
            document.getElementById('spotifyPlayerBar').classList.remove('active');
            document.body.style.setProperty('--player-height', '0px');
            clearInterval(progressInterval);
            return;
        }
        updatePlayerUI(state);
        document.getElementById('spotifyPlayerBar').classList.add('active');
        document.body.style.setProperty('--player-height', '90px');
    });
    spotifyPlayer.connect();
    setupPlayerEventListeners();
}

// --- LÓGICA PRINCIPAL DO APLICATIVO ---
async function startApp() {
    // --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS (AIRTABLE) ---
    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';
    let db = { artists: [], albums: [], songs: [] };
    let rawData = { albums: [], singles: [] };
    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    let activeArtist = null;
    let viewHistory = ['mainView'];

    // --- FUNÇÕES DE API (AIRTABLE) ---
    async function loadAllData() {
        const fetchOptions = { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } };
        const tables = ['Artists?filterByFormula=%7BArtista%20Principal%7D%3D1', 'Álbuns', 'Músicas', 'Singles%20e%20EPs'];
        try {
            const responses = await Promise.all(tables.map(table => fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`, fetchOptions)));
            for (const res of responses) { if (!res.ok) throw new Error('Falha ao carregar dados do Airtable.'); }
            const [artistsData, albumsData, musicasData, singlesData] = await Promise.all(responses.map(res => res.json()));
            rawData.albums = albumsData.records.map(r => r.id);
            rawData.singles = singlesData.records.map(r => r.id);
            const musicasMap = new Map();
            musicasData.records.forEach(record => {
                musicasMap.set(record.id, {
                    recordId: record.id, title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0, streams: record.fields['Streams'] || 0,
                    weeklyStreams: record.fields['Streams Semanais'] || 0, previousPosition: record.fields['Posição Anterior (Chart)'],
                });
            });
            const artistsMapById = new Map();
            artistsData.records.forEach(record => artistsMapById.set(record.id, record.fields.Name));
            const formatReleases = (records) => records.map(record => {
                const fields = record.fields;
                const trackIds = fields['Músicas'] || [];
                const tracks = trackIds.map(trackId => musicasMap.get(trackId)).filter(Boolean);
                const artistId = (fields['Artista'] && fields['Artista'][0]) || null;
                return {
                    recordId: record.id, title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                    artist: artistId ? artistsMapById.get(artistId) : "Artista Desconhecido",
                    imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    releaseDate: fields['Data de Lançamento'] || '2024-01-01', tracks: tracks,
                    spotifyUri: fields['Spotify URI'] || null
                };
            });
            return {
                artists: artistsData.records.map(r => ({ id: r.id, name: r.fields.Name, imageUrl: (r.fields['URL da Imagem'] && r.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png' })),
                albums: formatReleases(albumsData.records), singles: formatReleases(singlesData.records)
            };
        } catch (error) {
            console.error("Falha ao carregar dados do Airtable:", error);
            return { artists: [], albums: [], singles: [] };
        }
    }
    
    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---
    // (A partir daqui, o código do seu app continua o mesmo, sem alterações)
    
    const initializeData = (apiData) => {
        const { artists: artistsList, albums: albumsData, singles: singlesData } = apiData;
        const artistsMap = new Map();
        artistsList.forEach(artist => artistsMap.set(artist.name, { ...artist, img: artist.imageUrl, albums: [], singles: [] }));
        const addedSongIds = new Set();
        [...albumsData, ...singlesData].forEach(release => {
            (release.tracks || []).forEach(track => {
                if (!addedSongIds.has(track.recordId)) {
                    db.songs.push({ ...track, albumId: release.recordId, artist: release.artist, cover: release.imageUrl });
                    addedSongIds.add(track.recordId);
                }
            });
        });
        const allReleases = [...albumsData, ...singlesData];
        allReleases.forEach(item => {
            if (artistsMap.has(item.artist)) {
                const artistEntry = artistsMap.get(item.artist);
                if (rawData.albums.includes(item.recordId)) { artistEntry.albums.push(item); } 
                else if (rawData.singles.includes(item.recordId)) { artistEntry.singles.push(item); }
            }
        });
        db.artists = Array.from(artistsMap.values());
        db.albums = allReleases;
    };

    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.recordId === albumId);
        if (!album) return;
        currentContextUri = album.spotifyUri;
        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        const totalMinutes = Math.floor((album.tracks || []).reduce((total, track) => total + (parseInt((track.duration || "0:0").split(':')[0], 10) * 60) + parseInt((track.duration || "0:0").split(':')[1], 10), 0) / 60);
        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate || '2024-01-01').getFullYear()} • ${(album.tracks || []).length} músicas, ${totalMinutes} min`;
        const sortedTracks = [...(album.tracks || [])].map(track => db.songs.find(s => s.recordId === track.recordId) || track).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
        document.getElementById('albumTracklist').innerHTML = sortedTracks.map(track =>
            `<div class="track-row" data-album-id="${album.recordId}">
                <div class="track-number">${track.trackNumber}</div>
                <div class="track-title-artist">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${album.artist}</div>
                </div>
            </div>`
        ).join('');
        switchView('albumDetail');
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) return;
        if (artist.albums && artist.albums.length > 0) {
            currentContextUri = [...artist.albums].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))[0].spotifyUri;
        } else { currentContextUri = null; }
        activeArtist = artist;
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;
        const allSongsByArtist = db.songs.filter(s => s.artist === artistName);
        const topSongs = allSongsByArtist.sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 5);
        document.getElementById('popularSongsList').innerHTML = topSongs.map((song, index) => `<div class="song-row" data-album-id="${song.albumId}"><div style="color: var(--text-secondary);">${index + 1}</div><div class="song-row-info"><img class="song-row-cover" src="${song.cover}" alt="${song.title}"><div class="song-row-title">${song.title}</div></div></div>`).join('');
        const renderHorizontalList = (containerId, items) => { document.getElementById(containerId).innerHTML = items.map(item => `<div class="album-card" data-album-id="${item.recordId}"><img src="${item.imageUrl}" alt="${item.title}"><div class="album-title">${item.title}</div><div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div></div>`).join(''); };
        renderHorizontalList('albumsList', artist.albums);
        renderHorizontalList('singlesList', artist.singles);
        switchView('artistDetail');
    };

    const switchView = (viewId) => {
        allViews.forEach(v => v.classList.toggle('hidden', v.id !== viewId));
        if (viewId !== viewHistory[viewHistory.length - 1]) { viewHistory.push(viewId); }
        window.scrollTo(0, 0);
    };

    // --- EVENT LISTENERS ---
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        const mainPlayBtn = target.closest('.main-play-btn');
        if (mainPlayBtn && currentContextUri) { await playContext(currentContextUri); return; }
        const songRow = target.closest('.song-row, .chart-item, .track-row');
        if (songRow && accessToken) {
            let title, artist, albumId = songRow.dataset.albumId;
            if (songRow.querySelector('.chart-title')) { title = song.querySelector('.chart-title').textContent; artist = song.querySelector('.chart-artist').textContent; } 
            else if (songRow.querySelector('.song-row-title')) { title = song.querySelector('.song-row-title').textContent; if (activeArtist) artist = activeArtist.name; } 
            else if (songRow.querySelector('.track-title')) { title = song.querySelector('.track-title').textContent; artist = song.querySelector('.track-artist').textContent; }
            if (title && artist) { await searchAndPlayTrack(title, artist, albumId); }
            return;
        }
        const albumCard = target.closest('[data-album-id]');
        if (albumCard) { openAlbumDetail(albumCard.dataset.albumId); return; }
        const clickableArtist = target.closest('.clickable-artist, .artist-card');
        if (clickableArtist) { openArtistDetail(clickableArtist.dataset.artistName); return; }
    });
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => { if (viewHistory.length > 1) { viewHistory.pop(); switchView(viewHistory[viewHistory.length - 1]); } }));
    
    // --- CARREGAMENTO INICIAL DOS DADOS ---
    console.log("Carregando dados do Airtable...");
    const apiData = await loadAllData();
    console.log("Inicializando a interface...");
    initializeData(apiData);
    allNavs.forEach(nav => nav.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        if (viewHistory[viewHistory.length - 1] !== 'mainView') { switchView('mainView'); viewHistory = ['mainView']; }
        document.querySelectorAll('.content-section').forEach(s => s.classList.toggle('active', s.id === tabId));
        allNavs.forEach(n => n.classList.toggle('active', n.dataset.tab === tabId));
    }));
}

// ==========================================================
// =========== FUNÇÕES DO PLAYER SPOTIFY ====================
// ==========================================================
async function playContext(contextUri) {
    if (!spotifyDeviceId) { alert("Nenhum dispositivo Spotify ativo encontrado."); return; }
    if (!contextUri) { alert("Este álbum/playlist não tem um link do Spotify cadastrado."); return; }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT', body: JSON.stringify({ context_uri: contextUri }),
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
}

async function searchAndPlayTrack(trackName, artistName, albumId) {
    if (!spotifyDeviceId) { alert("Nenhum dispositivo Spotify ativo encontrado."); return; }
    currentTrackAlbumId = albumId;
    const cacheKey = `${trackName} - ${artistName}`.toLowerCase();
    let trackUri = spotifyUriCache.get(cacheKey);
    if (!trackUri) {
        const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            if (data.tracks.items.length > 0) {
                trackUri = data.tracks.items[0].uri;
                spotifyUriCache.set(cacheKey, trackUri);
            } else { alert(`Música não encontrada no Spotify: ${trackName}`); return; }
        } catch(error) {
            console.error("Falha ao buscar música:", error);
            if (error.message.includes('401')) { localStorage.removeItem('spotify_access_token'); handleAuthentication(); }
            return;
        }
    }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT', body: JSON.stringify({ uris: [trackUri] }),
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
}

function updatePlayerUI(state) {
    const track = state.track_window.current_track;
    if (!track) return;
    document.getElementById('playerCover').src = track.album.images[0].url;
    document.getElementById('playerTitle').textContent = track.name;
    document.getElementById('playerArtist').textContent = track.artists.map(a => a.name).join(', ');
    document.getElementById('playPauseBtn').querySelector('i').className = state.paused ? 'fas fa-play' : 'fas fa-pause';
    clearInterval(progressInterval);
    const updateProgress = () => {
        const position = state.paused ? state.position : state.position + (Date.now() - state.timestamp);
        const progressPercent = (position / state.duration) * 100;
        document.getElementById('progressBar').style.width = `${progressPercent}%`;
        document.getElementById('currentTime').textContent = formatTime(position);
    };
    document.getElementById('totalTime').textContent = formatTime(state.duration);
    updateProgress();
    if (!state.paused) { progressInterval = setInterval(updateProgress, 500); }
}

function setupPlayerEventListeners() {
    document.getElementById('playPauseBtn').addEventListener('click', () => spotifyPlayer.togglePlay());
    document.getElementById('nextBtn').addEventListener('click', () => spotifyPlayer.nextTrack());
    document.getElementById('prevBtn').addEventListener('click', () => spotifyPlayer.previousTrack());
    document.getElementById('playerTitle').addEventListener('click', () => { if(currentTrackAlbumId) openAlbumDetail(currentTrackAlbumId); });
    document.getElementById('progressContainer').addEventListener('click', function(e) {
        const bounds = this.getBoundingClientRect();
        spotifyPlayer.getCurrentState().then(state => {
            if (state) spotifyPlayer.seek(Math.round(((e.clientX - bounds.left) / bounds.width) * state.duration));
        });
    });
}

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
