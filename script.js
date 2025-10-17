// ==========================================================
// ============= CONFIGURAÇÃO SPOTIFY =======================
// ==========================================================
const CLIENT_ID = "4c1a5e5e8deb42c19d9b1b948717ea28"; // SEU CLIENT ID
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing"
];

let accessToken = null;
let spotifyPlayer = null;
let spotifyDeviceId = null;
let currentTrackAlbumId = null; // Para navegação
let currentContextUri = null;   // Para tocar o álbum/playlist inteiro
const spotifyUriCache = new Map();
let progressInterval = null;


document.addEventListener('DOMContentLoaded', () => {
    // A lógica do app agora começa dentro do fluxo de autenticação
    handleAuthentication();
});

// --- FUNÇÕES DE AUTENTICAÇÃO E INICIALIZAÇÃO ---

function handleAuthentication() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get("access_token");

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem("spotify_access_token", accessToken);
        window.location.hash = ""; // Limpa a URL
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
        window.onSpotifyWebPlaybackSDKReady = () => initSpotifyPlayer(accessToken);
        startApp(); // Inicia a lógica principal do seu aplicativo
    }
}

function initSpotifyPlayer(token) {
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

    spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.warn("Dispositivo desconectado", device_id);
    });
    
    spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication failed:', message);
        localStorage.removeItem('spotify_access_token');
        handleAuthentication(); // Tenta re-autenticar
    });

    spotifyPlayer.addListener("player_state_changed", state => {
        if (state) {
            updatePlayerUI(state);
            document.getElementById('spotifyPlayerBar').classList.add('active');
            document.body.style.setProperty('--player-height', '90px');
        } else {
            document.getElementById('spotifyPlayerBar').classList.remove('active');
            document.body.style.setProperty('--player-height', '0px');
            clearInterval(progressInterval);
        }
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
            const responses = await Promise.all(
                tables.map(table => fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`, fetchOptions))
            );
            for (const res of responses) {
                if (!res.ok) throw new Error('Falha ao carregar dados do Airtable.');
            }
            const [artistsData, albumsData, musicasData, singlesData] = await Promise.all(responses.map(res => res.json()));

            rawData.albums = albumsData.records.map(r => r.id);
            rawData.singles = singlesData.records.map(r => r.id);

            const musicasMap = new Map();
            musicasData.records.forEach(record => {
                musicasMap.set(record.id, {
                    recordId: record.id,
                    title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0,
                    streams: record.fields['Streams'] || 0,
                    weeklyStreams: record.fields['Streams Semanais'] || 0,
                    previousPosition: record.fields['Posição Anterior (Chart)'],
                    promotions: record.fields['Nº de Divulgações'] || 0,
                    playlists: record.fields['Nº de Playlists'] || 0,
                    singleType: record.fields['Tipo de Single'] || 'faixa-comum',
                    preSingleStreams: record.fields['Streams do Pre-Single'] || 0
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
                    recordId: record.id,
                    title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                    artist: artistId ? artistsMapById.get(artistId) : "Artista Desconhecido",
                    imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                    tracks: tracks,
                    previousPosition: fields['Posição Anterior (Chart)'],
                    spotifyUri: fields['Spotify URI'] || null // <<< CARREGA O URI DO ÁLBUM
                };
            });

            return {
                artists: artistsData.records.map(r => ({ id: r.id, name: r.fields.Name, imageUrl: (r.fields['URL da Imagem'] && r.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png' })),
                albums: formatReleases(albumsData.records),
                singles: formatReleases(singlesData.records)
            };
        } catch (error) {
            console.error("Falha ao carregar dados do Airtable:", error);
            return { artists: [], albums: [], singles: [] };
        }
    }
    
    // (Suas funções updateAirtableRecords e calculateStreamGrowth permanecem aqui, sem alterações)
    
    // ...
    // ... Suas outras funções do Airtable ...
    // ...

    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---

    const initializeData = (apiData) => {
        // ... (seu código de initializeData, sem alterações)
    };

    const renderChart = (type) => {
        // ... (seu código de renderChart, sem alterações)
    };

    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.recordId === albumId);
        if (!album) return;

        currentContextUri = album.spotifyUri; // <<< GUARDA O URI DO ÁLBUM ATUAL PARA O BOTÃO PLAY

        // ... (o resto da sua função openAlbumDetail continua aqui)
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) return;
        
        // Define o contexto de play como o álbum mais recente do artista
        if (artist.albums && artist.albums.length > 0) {
            const sortedAlbums = [...artist.albums].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
            currentContextUri = sortedAlbums[0].spotifyUri;
        } else {
            currentContextUri = null; // Limpa se o artista não tiver álbuns
        }

        activeArtist = artist;
        // ... (o resto da sua função openArtistDetail continua aqui)
    };
    
    // ...
    // ... Suas outras funções de UI (openDiscographyDetail, switchView, etc) ...
    // ...

    // --- EVENT LISTENER PRINCIPAL ---
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Prioridade 1: Botão de Play Principal (Toca o Contexto do Álbum/Artista)
        const mainPlayBtn = target.closest('.main-play-btn');
        if (mainPlayBtn && currentContextUri) {
            await playContext(currentContextUri);
            return; // Encerra o evento aqui
        }

        // Prioridade 2: Clicar em uma música individual para tocar
        const songRow = target.closest('.song-row, .chart-item, .track-row');
        if (songRow && accessToken) {
            let title, artist, albumId;
            albumId = songRow.dataset.albumId;

            if (songRow.querySelector('.chart-title')) { // Chart
                title = songRow.querySelector('.chart-title').textContent;
                artist = songRow.querySelector('.chart-artist').textContent;
            } else if (songRow.querySelector('.song-row-title')) { // Top Populares
                title = songRow.querySelector('.song-row-title').textContent;
                if (activeArtist) artist = activeArtist.name;
            } else if (songRow.querySelector('.track-title')) { // Tracklist do álbum
                title = songRow.querySelector('.track-title').textContent;
                artist = songRow.querySelector('.track-artist').textContent;
            }

            if (title && artist) {
                await searchAndPlayTrack(title, artist, albumId);
            }
            return;
        }

        // Outros cliques de navegação
        const albumCard = target.closest('[data-album-id]');
        if (albumCard) { openAlbumDetail(albumCard.dataset.albumId); return; }

        const clickableArtist = target.closest('.clickable-artist, .artist-card');
        if (clickableArtist) { openArtistDetail(clickableArtist.dataset.artistName); return; }

        const seeAllBtn = target.closest('.see-all-btn');
        if (seeAllBtn) { openDiscographyDetail(seeAllBtn.dataset.type); return; }
    });
    
    // --- CARREGAMENTO INICIAL DOS DADOS ---
    console.log("Carregando dados do Airtable...");
    const apiData = await loadAllData();
    console.log("Inicializando a interface...");
    initializeData(apiData);
    // ... (resto do seu código de carregamento inicial)
}


// ==========================================================
// =========== FUNÇÕES DO PLAYER SPOTIFY ====================
// ==========================================================

/**
 * Toca um contexto inteiro (álbum/playlist) a partir de um URI.
 */
async function playContext(contextUri) {
    if (!spotifyDeviceId) {
        alert("Nenhum dispositivo Spotify ativo encontrado.");
        return;
    }
    if (!contextUri) {
        alert("Este álbum/playlist não tem um link do Spotify cadastrado.");
        return;
    }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: contextUri }),
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
}

/**
 * Busca e toca uma faixa individual pelo nome e artista.
 */
async function searchAndPlayTrack(trackName, artistName, albumId) {
    if (!spotifyDeviceId) {
        alert("Nenhum dispositivo Spotify ativo encontrado. Abra o Spotify em um de seus aparelhos e tente novamente.");
        return;
    }
    
    currentTrackAlbumId = albumId;
    const cacheKey = `${trackName} - ${artistName}`.toLowerCase();
    let trackUri = spotifyUriCache.get(cacheKey);

    if (!trackUri) {
        const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            if (data.tracks.items.length > 0) {
                trackUri = data.tracks.items[0].uri;
                spotifyUriCache.set(cacheKey, trackUri);
            } else {
                alert(`Música não encontrada no Spotify: ${trackName}`);
                return;
            }
        } catch(error) {
            console.error("Falha ao buscar música:", error);
            if (error.message.includes('401')) { // Token expirado
                localStorage.removeItem('spotify_access_token');
                handleAuthentication();
            }
            return;
        }
    }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
}

/**
 * Atualiza a interface do player com base no estado atual do Spotify.
 */
function updatePlayerUI(state) {
    const track = state.track_window.current_track;
    if (!track) return;
    
    document.getElementById('playerCover').src = track.album.images[0].url;
    document.getElementById('playerTitle').textContent = track.name;
    document.getElementById('playerArtist').textContent = track.artists.map(a => a.name).join(', ');
    
    const playPauseIcon = document.getElementById('playPauseBtn').querySelector('i');
    playPauseIcon.className = state.paused ? 'fas fa-play' : 'fas fa-pause';
    document.querySelector('.player-track-info').classList.toggle('playing', !state.paused);

    document.getElementById('shuffleBtn').classList.toggle('active', state.shuffle);
    document.getElementById('repeatBtn').classList.toggle('active', state.repeat_mode !== 0);

    clearInterval(progressInterval);
    const updateProgress = () => {
        const position = state.paused ? state.position : state.position + (Date.now() - state.timestamp);
        const duration = state.duration;
        const progressPercent = (position / duration) * 100;
        document.getElementById('progressBar').style.width = `${progressPercent}%`;
        document.getElementById('currentTime').textContent = formatTime(position);
    };
    
    document.getElementById('totalTime').textContent = formatTime(state.duration);
    updateProgress();

    if (!state.paused) {
        progressInterval = setInterval(updateProgress, 500);
    }
}

/**
 * Adiciona os event listeners aos botões do player.
 */
function setupPlayerEventListeners() {
    document.getElementById('playPauseBtn').addEventListener('click', () => spotifyPlayer.togglePlay());
    document.getElementById('nextBtn').addEventListener('click', () => spotifyPlayer.nextTrack());
    document.getElementById('prevBtn').addEventListener('click', () => spotifyPlayer.previousTrack());
    document.getElementById('shuffleBtn').addEventListener('click', () => spotifyPlayer.setShuffle(!document.getElementById('shuffleBtn').classList.contains('active')));
    
    document.getElementById('playerTitle').addEventListener('click', () => {
        if(currentTrackAlbumId) {
             // Esta chamada requer que a função openAlbumDetail esteja acessível globalmente
             // ou dentro do escopo de startApp.
             // (A estrutura atual já permite isso)
             openAlbumDetail(currentTrackAlbumId);
        }
    });

    document.getElementById('progressContainer').addEventListener('click', function(e) {
        const bounds = this.getBoundingClientRect();
        const clickPosition = e.clientX - bounds.left;
        spotifyPlayer.getCurrentState().then(state => {
            if (state) {
                spotifyPlayer.seek(Math.round((clickPosition / bounds.width) * state.duration));
            }
        });
    });
}

/**
 * Formata milissegundos para o formato mm:ss.
 */
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
