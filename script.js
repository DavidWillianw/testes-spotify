// ==========================================================
// ============= CONFIGURAÇÃO SPOTIFY (PKCE) ================
// ==========================================================
const CLIENT_ID = "4c1a5e5e8deb42c19d9b1b948717ea28"; // SEU CLIENT ID
const REDIRECT_URI = "https://davidwillianw.github.io/testes-spotify/"; 
const SCOPES = [
    "streaming", "user-read-email", "user-read-private",
    "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing"
];

let accessToken = null;
let spotifyPlayer = null;
let spotifyDeviceId = null;
let currentTrackAlbumId = null; 
let currentContextUri = null;   

// Esta função é chamada pelo script do Spotify quando ele carrega.
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("Spotify SDK está pronto para ser usado.");
    if (accessToken) {
        initSpotifyPlayer(accessToken);
    }
};

// O aplicativo começa a carregar imediatamente. A autenticação roda em paralelo.
document.addEventListener('DOMContentLoaded', () => {
    startApp(); 
    handleAuthentication(); 
});

// ==========================================================
// ============= LÓGICA DE AUTENTICAÇÃO (PKCE) ==============
// ==========================================================
async function handleAuthentication() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
        const token = await getAccessToken(code);
        if (token) {
            accessToken = token;
            if (window.Spotify && !spotifyPlayer) {
                initSpotifyPlayer(accessToken);
            }
        }
    } else {
        accessToken = localStorage.getItem('spotify_access_token');
        if (accessToken && window.Spotify && !spotifyPlayer) {
            initSpotifyPlayer(accessToken);
        }
    }
}

function promptLogin() {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('loginBtn').addEventListener('click', redirectToAuthCodeFlow, { once: true });
}

async function redirectToAuthCodeFlow() {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("spotify_verifier", verifier);
    const params = new URLSearchParams({
        client_id: CLIENT_ID, response_type: "code", redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(' '), code_challenge_method: "S256", code_challenge: challenge,
    });
    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function getAccessToken(code) {
    const verifier = localStorage.getItem("spotify_verifier");
    if (!verifier) { console.error("Code Verifier não encontrado."); return null; }
    const params = new URLSearchParams({
        client_id: CLIENT_ID, grant_type: "authorization_code", code: code,
        redirect_uri: REDIRECT_URI, code_verifier: verifier,
    });
    try {
        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params
        });
        const data = await result.json();
        if (!result.ok) throw new Error(data.error_description || "Erro na troca de token.");
        const { access_token, refresh_token } = data;
        if (access_token) {
            localStorage.setItem("spotify_access_token", access_token);
            localStorage.setItem("spotify_refresh_token", refresh_token);
            window.history.pushState({}, document.title, window.location.pathname);
            return access_token;
        }
    } catch (error) { console.error("Erro na função getAccessToken:", error); return null; }
}

function generateCodeVerifier(length) { let text = ''; let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for (let i = 0; i < length; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); } return text; }
async function generateCodeChallenge(codeVerifier) { const data = new TextEncoder().encode(codeVerifier); const digest = await window.crypto.subtle.digest('SHA-256', data); return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)])).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

// ==========================================================
// =========== FUNÇÕES DO PLAYER SPOTIFY ====================
// ==========================================================
function initSpotifyPlayer(token) {
    if (spotifyPlayer) return;
    console.log("Inicializando o Spotify Player...");
    spotifyPlayer = new Spotify.Player({ name: "Spotify RPG Player", getOAuthToken: cb => cb(token), volume: 0.5 });
    spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Dispositivo conectado:", device_id);
        spotifyDeviceId = device_id;
        document.getElementById('deviceName').textContent = "este navegador";
    });
    spotifyPlayer.addListener("not_ready", ({ device_id }) => console.warn("Dispositivo desconectado", device_id));
    spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error('Authentication failed:', message); localStorage.removeItem('spotify_access_token'); accessToken = null; });
    spotifyPlayer.addListener("player_state_changed", state => {
        if (!state) { document.getElementById('spotifyPlayerBar').classList.remove('active'); document.body.style.setProperty('--player-height', '0px'); clearInterval(progressInterval); return; }
        updatePlayerUI(state);
        document.getElementById('spotifyPlayerBar').classList.add('active');
        document.body.style.setProperty('--player-height', '90px');
    });
    spotifyPlayer.connect();
    setupPlayerEventListeners();
}

async function playContext(contextUri) {
    if (!spotifyDeviceId) { alert("Nenhum dispositivo Spotify ativo encontrado. Abra o Spotify e tente novamente."); return; }
    if (!contextUri) { alert("Este álbum/playlist não tem um link do Spotify cadastrado."); return; }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT', body: JSON.stringify({ context_uri: contextUri }),
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
}

async function playTrackByUri(trackUri, albumId) {
    if (!spotifyDeviceId) { alert("Nenhum dispositivo Spotify ativo encontrado. Abra o Spotify e tente novamente."); return; }
    currentTrackAlbumId = albumId;
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

function formatTime(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }

// ==========================================================
// ============= LÓGICA PRINCIPAL DO APLICATIVO =============
// ==========================================================
async function startApp() {
    // --- VARIÁVEIS DO APP ---
    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';
    let db = { artists: [], albums: [], songs: [] };
    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    let activeArtist = null;
    let viewHistory = ['mainView'];

    // --- FUNÇÕES DE DADOS (AIRTABLE) ---
    async function loadAllData() {
        const fetchOptions = { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } };
        const tables = {
            artists: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists?filterByFormula=%7BArtista%20Principal%7D%3D1`,
            albums: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Álbuns`,
            musicas: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Músicas`,
            singles: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Singles%20e%20EPs`
        };
        try {
            const [artistsRes, albumsRes, musicasRes, singlesRes] = await Promise.all(Object.values(tables).map(url => fetch(url, fetchOptions)));
            if (!artistsRes.ok || !albumsRes.ok || !musicasRes.ok || !singlesRes.ok) throw new Error('Falha ao carregar dados do Airtable.');
            
            const [artistsData, albumsData, musicasData, singlesData] = await Promise.all([artistsRes.json(), albumsRes.json(), musicasRes.json(), singlesRes.json()]);

            const musicasMap = new Map();
            musicasData.records.forEach(record => {
                musicasMap.set(record.id, {
                    id: record.id,
                    title: record.fields['Nome da Faixa'],
                    trackNumber: record.fields['Nº da Faixa'] || 0,
                    spotifyUri: record.fields['Spotify URI'] || null
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
                    id: record.id,
                    title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                    artist: artistId ? artistsMapById.get(artistId) : "Artista Desconhecido",
                    imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                    tracks: tracks,
                    spotifyUri: fields['Spotify URI'] || null
                };
            });
            
            return {
                artists: artistsData.records.map(r => ({ id: r.id, name: r.fields.Name, imageUrl: (r.fields['URL da Imagem'] && r.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png' })),
                albums: formatReleases(albumsData.records),
                singles: formatReleases(singlesData.records)
            };
        } catch (error) {
            console.error("FALHA CRÍTICA ao carregar dados do Airtable:", error);
            document.body.innerHTML = `<div style="color: white; text-align: center; padding: 50px;"><h1>Erro ao carregar dados</h1><p>Não foi possível conectar ao banco de dados. Verifique o console.</p></div>`;
            return null;
        }
    }

    // --- FUNÇÕES DE UI E NAVEGAÇÃO ---
    const initializeData = (apiData) => {
        const artistsMap = new Map();
        apiData.artists.forEach(artist => artistsMap.set(artist.name, { ...artist, img: artist.imageUrl, albums: [], singles: [] }));

        [...apiData.albums, ...apiData.singles].forEach(release => {
            release.tracks.forEach(track => {
                const songExists = db.songs.some(s => s.id === track.id);
                if (!songExists) {
                    db.songs.push({ ...track, albumId: release.id, artist: release.artist, cover: release.imageUrl });
                }
            });

            if (artistsMap.has(release.artist)) {
                const artistEntry = artistsMap.get(release.artist);
                const isAlbum = apiData.albums.some(a => a.id === release.id);
                const list = isAlbum ? 'albums' : 'singles';
                artistEntry[list].push(release);
            }
        });

        db.artists = Array.from(artistsMap.values());
        db.albums = [...apiData.albums, ...apiData.singles];
    };

    const switchView = (viewId) => {
        allViews.forEach(v => v.classList.toggle('hidden', v.id !== viewId));
        if (viewId !== viewHistory[viewHistory.length - 1]) { viewHistory.push(viewId); }
        window.scrollTo(0, 0);
    };

    const renderArtistsGrid = (containerId, artists) => {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = artists.map(artist => `<div class="artist-card" data-artist-name="${artist.name}"><img src="${artist.imageUrl}" alt="${artist.name}"><h3>${artist.name}</h3></div>`).join('');
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) return;
        activeArtist = artist;
        if (artist.albums.length > 0) {
            currentContextUri = [...artist.albums].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))[0].spotifyUri;
        } else { currentContextUri = null; }
        
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;
        
        const renderHorizontalList = (containerId, items) => { 
            document.getElementById(containerId).innerHTML = items.map(item => 
                `<div class="album-card" data-album-id="${item.id}"><img src="${item.imageUrl}" alt="${item.title}"><div class="album-title">${item.title}</div><div class="album-year">${new Date(item.releaseDate).getFullYear()}</div></div>`
            ).join(''); 
        };
        renderHorizontalList('albumsList', artist.albums);
        renderHorizontalList('singlesList', artist.singles);
        switchView('artistDetail');
    };

    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.id === albumId);
        if (!album) return;
        currentContextUri = album.spotifyUri;
        currentTrackAlbumId = albumId; // Define o ID do álbum para navegação no player

        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate).getFullYear()}`;
        
        const sortedTracks = [...album.tracks].sort((a, b) => a.trackNumber - b.trackNumber);
        document.getElementById('albumTracklist').innerHTML = sortedTracks.map(track =>
            `<div class="track-row" data-album-id="${album.id}" data-track-id="${track.id}">
                <div class="track-number">${track.trackNumber}</div>
                <div class="track-title-artist">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${album.artist}</div>
                </div>
            </div>`
        ).join('');
        switchView('albumDetail');
    };
    
    // --- EVENTOS DE CLIQUE ---
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        const playElement = target.closest('.main-play-btn, .track-row');

        if (playElement) {
            if (!accessToken) {
                promptLogin();
                return;
            }
            if (playElement.matches('.main-play-btn')) {
                if (currentContextUri) await playContext(currentContextUri);
            } else if (playElement.matches('.track-row')) {
                const trackId = playElement.dataset.trackId;
                const song = db.songs.find(s => s.id === trackId);
                if (song && song.spotifyUri) {
                    await playTrackByUri(song.spotifyUri, song.albumId);
                } else {
                    alert('Esta música não tem um link do Spotify cadastrado.');
                }
            }
            return;
        }

        const albumCard = target.closest('[data-album-id]');
        if (albumCard) { openAlbumDetail(albumCard.dataset.albumId); return; }

        const artistCard = target.closest('.artist-card, .clickable-artist');
        if (artistCard) { openArtistDetail(artistCard.dataset.artistName); return; }

        const backBtn = target.closest('.back-btn');
        if (backBtn) { if (viewHistory.length > 1) { viewHistory.pop(); switchView(viewHistory[viewHistory.length - 1]); } return; }
    });

    // --- CARREGAMENTO INICIAL ---
    console.log("Carregando dados do Airtable...");
    const apiData = await loadAllData();
    if (!apiData) return;
    
    console.log("Inicializando a interface...");
    initializeData(apiData);
    renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
}
