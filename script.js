document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null; // Defined globally
    let currentFeatTarget = null;
    let viewHistory = ['mainView']; // Start with mainView

    // --- ELEMENTOS DO DOM ---
    let allViews, searchInput, studioView, loginPrompt, loggedInInfo, playerSelect,
        loginButton, logoutButton, studioLaunchWrapper, studioTabs, studioForms,
        newSingleForm, singleArtistSelect, newAlbumForm, albumArtistSelect,
        addTrackButton, albumTracklistEditor, featModal, featArtistSelect,
        featTypeSelect, confirmFeatBtn, cancelFeatBtn, participacoesList;

    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';

    function initializeDOMElements() {
        console.log("Initializing DOM elements...");
        allViews = document.querySelectorAll('.page-view');
        searchInput = document.getElementById('searchInput');
        studioView = document.getElementById('studioView');
        loginPrompt = document.getElementById('loginPrompt');
        loggedInInfo = document.getElementById('loggedInInfo');
        playerSelect = document.getElementById('playerSelect');
        loginButton = document.getElementById('loginButton');
        logoutButton = document.getElementById('logoutButton');
        studioLaunchWrapper = document.getElementById('studioLaunchWrapper');
        studioTabs = document.querySelectorAll('.studio-tab-btn');
        studioForms = document.querySelectorAll('.studio-form-content');
        newSingleForm = document.getElementById('newSingleForm');
        singleArtistSelect = document.getElementById('singleArtistSelect');
        newAlbumForm = document.getElementById('newAlbumForm');
        albumArtistSelect = document.getElementById('albumArtistSelect');
        addTrackButton = document.getElementById('addTrackButton');
        albumTracklistEditor = document.getElementById('albumTracklistEditor');
        featModal = document.getElementById('featModal');
        featArtistSelect = document.getElementById('featArtistSelect');
        featTypeSelect = document.getElementById('featTypeSelect');
        confirmFeatBtn = document.getElementById('confirmFeatBtn');
        cancelFeatBtn = document.getElementById('cancelFeatBtn');
        participacoesList = document.getElementById('participacoesList');
        if (!studioView || !loginPrompt || !playerSelect || !newSingleForm || !newAlbumForm || !featModal || !allViews || allViews.length === 0) {
             console.error("ERRO CRÍTICO: Elementos essenciais do HTML não foram encontrados!"); return false;
        }
        console.log("DOM elements initialized.");
        return true;
    }

    // --- 1. CARREGAMENTO DE DADOS ---
    async function loadAllData() {
        const artistsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists?filterByFormula=%7BArtista%20Principal%7D%3D1`;
        const albumsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Álbuns`;
        const musicasURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Músicas`;
        const singlesURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Singles%20e%20EPs`;
        const playersURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jogadores`;
        const fetchOptions = { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } };
        console.log("Iniciando carregamento de dados...");
        try {
            const [artistsResponse, albumsResponse, musicasResponse, singlesResponse, playersResponse] = await Promise.all([
                fetch(artistsURL, fetchOptions), fetch(albumsURL, fetchOptions),
                fetch(musicasURL, fetchOptions), fetch(singlesURL, fetchOptions),
                fetch(playersURL, fetchOptions)
            ]);
            if (!artistsResponse.ok || !albumsResponse.ok || !musicasResponse.ok || !singlesResponse.ok || !playersResponse.ok) {
                console.error("Falha ao carregar Airtable:", { artists: artistsResponse.status, albums: albumsResponse.status, musicas: musicasResponse.status, singles: singlesResponse.status, players: playersResponse.status });
                throw new Error('Falha ao carregar dados Airtable.');
            }
            const artistsData = await artistsResponse.json();
            const albumsData = await albumsResponse.json();
            const musicasData = await musicasResponse.json();
            const singlesData = await singlesResponse.json();
            const playersData = await playersResponse.json();

            // --- RECONSTRUÇÃO ---
            const musicasMap = new Map();
             (musicasData.records || []).forEach(record => {
                 const artistIdsFromServer = record.fields['Artista'] || [];
                 const artistIds = Array.isArray(artistIdsFromServer) ? artistIdsFromServer : [artistIdsFromServer];
                 const parentReleaseId = (record.fields['Álbuns'] && record.fields['Álbuns'][0]) || (record.fields['Singles e EPs'] && record.fields['Singles e EPs'][0]) || null;
                musicasMap.set(record.id, {
                    id: record.id, title: record.fields['Nome da Faixa'] || 'Faixa Sem Título',
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0, durationSeconds: record.fields['Duração'] || 0,
                    artistIds: artistIds, collabType: record.fields['Tipo de Colaboração'], albumId: parentReleaseId
                });
            });

            const artistsMapById = new Map();
             const artistsList = (artistsData.records || []).map(record => {
                const artist = {
                    id: record.id, name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || [], RPGPoints: record.fields.RPGPoints || 0, LastActive: record.fields.LastActive || null
                };
                 artistsMapById.set(artist.id, artist.name);
                return artist;
            });

            const formatReleases = (records, isAlbumTable) => {
                 if (!records) return [];
                return records.map(record => {
                    const fields = record.fields;
                    const recordId = record.id;
                    // Find tracks associated with this release ID
                    const tracks = Array.from(musicasMap.values()).filter(song => song.albumId === recordId)
                                       .sort((a,b)=> (a.trackNumber || 0) - (b.trackNumber || 0));
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    const mainArtistIdFromServer = fields['Artista'] || [];
                     // Ensure mainArtistId is a single ID string or null
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : (mainArtistIdFromServer || null);
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";
                    const imageUrlField = isAlbumTable ? 'Capa do Álbum' : 'Capa';
                    const imageUrl = (fields[imageUrlField] && fields[imageUrlField][0]?.url) || 'https://i.imgur.com/AD3MbBi.png';
                    return {
                        id: record.id, title: fields['Nome do Álbum'] || fields['Nome do Single/EP'] || 'Título Indisponível', artist: mainArtistName, artistId: mainArtistId,
                        metascore: fields['Metascore'] || 0, imageUrl: imageUrl, releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                        tracks: tracks, // Store the actual track objects found
                        totalDurationSeconds: totalDurationSeconds
                    };
                });
            };

            const formattedAlbums = formatReleases(albumsData.records, true);
            const formattedSingles = formatReleases(singlesData.records, false);
             const formattedPlayers = (playersData.records || []).map(record => ({
                id: record.id, name: record.fields.Nome, artists: record.fields.Artistas || []
            }));

            console.log("Dados carregados com sucesso.");
            return {
                allArtists: artistsList, albums: formattedAlbums, singles: formattedSingles,
                players: formattedPlayers, musicas: Array.from(musicasMap.values())
            };
        } catch (error) {
            console.error("Falha GERAL ao carregar dados:", error);
            return null;
        }
    }

    /**
     * Coloca os dados carregados no banco de dados local 'db'
     * (BASEADO NA VERSÃO ORIGINAL FUNCIONAL + FEATS)
     */
     const initializeData = (data) => {
         try {
            // 1. Initialize Artists Map & db.artists
            const artistsMap = new Map();
            db.artists = (data.allArtists || []).map(artist => {
                 const artistEntry = {
                    ...artist,
                    img: artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png',
                    albums: [],
                    singles: []
                 };
                 artistsMap.set(artist.name, artistEntry);
                 return artistEntry;
            });


            // 2. Initialize db.songs
            db.songs = (data.musicas || []).map(song => ({
                 ...song,
                 streams: song.streams || Math.floor(Math.random() * 25000000) + 50000,
                 cover: 'https://i.imgur.com/AD3MbBi.png', // Default cover initially
                 // Add placeholder for main artist name of the song itself
                 artist: artistsMapById.get((song.artistIds || [])[0]) || 'Artista Desc.'
            }));

            // 3. Process Releases (Albums and Singles combined)
             const allReleases = [...(data.albums || []), ...(data.singles || [])];
             db.albums = allReleases; // Assign combined list to db.albums

            allReleases.forEach(item => {
                // Update cover url in db.songs for tracks belonging to this release
                 (item.tracks || []).forEach(trackInfo => {
                    const songInDb = db.songs.find(s => s.id === trackInfo.id);
                     if (songInDb) {
                        songInDb.cover = item.imageUrl;
                        // Keep songInDb.artist as the primary artist of the song (already set)
                    }
                });

                 // Link releases to artists in db.artists array this time
                 const artistEntry = db.artists.find(a => a.id === item.artistId);
                 if (artistEntry) {
                    const thirtyMinutesInSeconds = 30 * 60;
                    if ((item.totalDurationSeconds || 0) >= thirtyMinutesInSeconds) {
                        artistEntry.albums.push(item);
                    } else {
                        artistEntry.singles.push(item);
                    }
                } else {
                     // Log warning if the main artist of the release wasn't found (might be filtered out)
                     if (item.artist !== "Artista Desconhecido") { // Avoid logging expected unknowns
                         console.warn(`Artista "${item.artist}" (ID: ${item.artistId}) do lançamento "${item.title}" não encontrado em db.artists.`);
                     }
                 }
            });

            // 4. Finalize db structure (players)
            db.players = data.players || [];

             // Verify data counts
             console.log(`DB Inicializado: Artists: ${db.artists.length}, Albums/Singles: ${db.albums.length}, Songs: ${db.songs.length}, Players: ${db.players.length}`);
            return true;
         } catch (error) {
             console.error("Erro CRÍTICO durante initializeData:", error);
             alert("Erro MUITO GRAVE ao inicializar dados. Verifique o console.");
             return false;
         }
    };


    async function refreshAllData() { /* ... sem mudanças ... */ }

    // --- 2. NAVEGAÇÃO E UI ---

    const switchView = (viewId, targetSectionId = null) => { /* ... sem mudanças (Usar Versão v3) ... */ };
    const switchTab = (event, forceTabId = null) => { /* ... sem mudanças (Usar Versão v3) ... */ };
    const handleBack = () => { /* ... sem mudanças (Usar Versão v3) ... */ };
    // Listeners attached later

    const renderArtistsGrid = (containerId, artists) => {
        // Use the debug version
        const container = document.getElementById(containerId);
        if (!container) { console.warn(`!!!! Container com ID "${containerId}" NÃO encontrado !!!!`); return; }
        if (!Array.isArray(artists)) { console.warn(`!!!! Tentando renderizar em "${containerId}" mas 'artists' não é array !!!!`, artists); container.innerHTML = '<p style="color: red;">Erro: Dados inválidos.</p>'; return; }
        console.log(`Renderizando ${artists.length} artistas em #${containerId}`);
        container.innerHTML = '';
        if (artists.length === 0) { container.innerHTML = '<p>Nenhum artista para exibir.</p>'; return; }
        artists.forEach(artist => {
            const card = document.createElement('div');
            card.className = 'artist-card'; // Let body listener handle click based on this class
            card.dataset.artistName = artist.name;
            const imageUrl = artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png';
            card.innerHTML = `<img src="${imageUrl}" alt="${artist.name || ''}"><h3>${artist.name || ''}</h3>`;
            container.appendChild(card);
        });
         console.log(`#${containerId} populado.`);
    };


    function formatArtistString(artistIds, collabType) { /* ... sem mudanças ... */ }
    function getCoverUrl(albumId) { /* ... sem mudanças ... */ }

    const renderChart = (type) => {
         // Uses corrected logic based on simplified initializeData
        const container = document.getElementById(`${type}ChartsList`);
        if (!container) return;

        const items = type === 'music'
            ? [...db.songs].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50)
            : [...db.albums].sort((a, b) => (b.metascore || 0) - (a.metascore || 0)).slice(0, 50);

        container.innerHTML = items.map((item, index) => {
            const trends = ['up', 'down', 'new', 'same']; const trend = trends[Math.floor(Math.random() * trends.length)];
            let trendIcon = '';
            if (trend === 'up') trendIcon = `<i class="fas fa-caret-up trend-up"></i>`; else if (trend === 'down') trendIcon = `<i class="fas fa-caret-down trend-down"></i>`; else if (trend === 'new') trendIcon = `<span class="trend-new">NEW</span>`; else trendIcon = `<span>-</span>`;

            const title = item.title || '?'; // Add default
            const artistString = type === 'music' ? formatArtistString(item.artistIds || [], item.collabType) : item.artist;
            // ** Use cover directly from song object if music **
            const cover = type === 'music' ? (item.cover || 'https://i.imgur.com/AD3MbBi.png') : item.imageUrl;
            const streams = type === 'music' ? (item.streams || 0) : (item.metascore || 0) * 10000;
            const albumId = type === 'music' ? item.albumId : item.id;
             // Ensure mainArtistName is valid
            const mainArtistName = type === 'music'
                 ? (db.artists.find(a => a.id === (item.artistIds || [])[0])?.name || item.artist || 'Artista Desc.')
                 : item.artist;

            return `<div class="chart-item" data-id="${item.id}" data-type="${type}" data-artist-name="${mainArtistName}" data-album-id="${albumId || ''}">
                        <div class="chart-position">${index + 1}</div>
                        <img src="${cover}" class="chart-cover">
                        <div class="chart-info">
                            <div class="chart-title">${title}</div>
                            <div class="chart-artist">${artistString}</div>
                        </div>
                        <div class="chart-stats">
                            <div class="chart-streams">${streams.toLocaleString('pt-BR')}</div>
                            <div class="chart-trend">${trendIcon}</div>
                        </div>
                   </div>`;
        }).join('');
    };


    const openArtistDetail = (artistName) => {
        // Uses corrected logic based on simplified initializeData
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) { console.error("Artista não encontrado:", artistName); return; }
        activeArtist = artist;
        switchView('artistDetail');
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.imageUrl})`;
        document.getElementById('detailName').textContent = artist.name;

        const topSongs = db.songs
            .filter(song => (song.artistIds || []).includes(artist.id))
            .sort((a, b) => (b.streams || 0) - (a.streams || 0))
            .slice(0, 5);

        document.getElementById('popularSongsList').innerHTML = topSongs.map((song, index) => {
             const artistString = formatArtistString(song.artistIds, song.collabType);
             return `<div class="song-row" data-album-id="${song.albumId || ''}">
                        <div style="color: var(--text-secondary);">${index + 1}</div>
                        <div class="song-row-info">
                            <img class="song-row-cover" src="${song.cover}" alt="${song.title}">
                            <div>
                               <div class="song-row-title">${song.title}</div>
                               <div class="track-artist-feat">${artistString}</div>
                            </div>
                        </div>
                        <div class="song-streams">${(song.streams || 0).toLocaleString('pt-BR')}</div>
                    </div>`;
            }).join('');

        const renderHorizontalList = (containerId, items) => { /* ... no change needed ... */ };
        // Use artist.albums and artist.singles populated by initializeData
        renderHorizontalList('albumsList', artist.albums || []);
        renderHorizontalList('singlesList', artist.singles || []);
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
    };


    const openAlbumDetail = (albumId) => {
         // Uses corrected logic based on simplified initializeData
        const album = db.albums.find(a => a.id === albumId);
        if (!album) { console.error("Álbum não encontrado:", albumId); return; }
        activeArtist = db.artists.find(a => a.id === album.artistId);
        switchView('albumDetail');
        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        const totalMinutes = Math.floor((album.totalDurationSeconds || 0) / 60);

        // Find tracks belonging to this album directly from db.songs
        const detailedTracks = db.songs.filter(song => song.albumId === albumId)
                                  .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate || '2024-01-01').getFullYear()} • ${detailedTracks.length} músicas, ${totalMinutes} min`;

        document.getElementById('albumTracklist').innerHTML = detailedTracks.map(track => {
            const artistString = formatArtistString(track.artistIds, track.collabType);
            return `<div class="track-row">
                        <div>${track.trackNumber}</div>
                        <div>
                           <div class="track-title">${track.title}</div>
                           <div class="track-artist-feat">${artistString}</div>
                        </div>
                        <div class="track-duration">${track.duration}</div>
                    </div>`;
           }).join('');
    };


    const openDiscographyDetail = (type) => { /* ... no change needed, uses artist.albums/singles ... */ };
    const handleSearch = () => { /* ... sem mudanças ... */ };
    const setupCountdown = (timerId, callback) => { /* ... sem mudanças ... */ };

    // --- 3. SISTEMA DE RPG (BRIGA DE CHARTS - APENAS VISUALIZAÇÃO) ---
    // --- (Code removed as per previous step) ---
     // --- 3. SISTEMA DE RPG (BRIGA DE CHARTS - APENAS VISUALIZAÇÃO) ---
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;
    const calculateSimulatedStreams = (points, lastActiveISO) => { /* ... sem mudanças ... */ };
    const computeChartData = (artistsArray) => { /* ... sem mudanças ... */ };
     function renderRPGChart() {
        let container = document.getElementById('rpgChartList');
        // Only try to create if it doesn't exist
        if (!container && document.getElementById('mainView')) {
            const wrapper = document.createElement('section');
            wrapper.id = 'rpgChartSection';
            wrapper.className = 'content-section'; // Initially hidden by default
            wrapper.innerHTML = `
                <div class="chart-header"><h3>🏆 RPG Spotify - Top ${CHART_TOP_N}</h3><p>Ranking baseado em pontos RPG</p></div>
                <div id="rpgChartList" class="chart-list"><p>Carregando ranking...</p></div>`;
            const mainEl = document.querySelector('#mainView .main-container');
            const homeSection = document.getElementById('homeSection');
             // Insert before homeSection if both exist
             if (mainEl && homeSection) {
                 mainEl.insertBefore(wrapper, homeSection);
                 container = document.getElementById('rpgChartList'); // Update container reference
                console.log("RPG Chart Section created.");
            } else {
                 console.error("Could not find main container or home section to insert RPG chart.");
                 return; // Stop if container cannot be created
            }

            // Add tab only once
            const nav = document.querySelector('.nav-tabs');
            if (nav && !nav.querySelector('[data-tab="rpgChartSection"]')) {
                const btn = document.createElement('button');
                btn.className = 'nav-tab';
                btn.dataset.tab = 'rpgChartSection';
                btn.textContent = 'Ranking RPG';
                 // Add listener directly here
                 btn.addEventListener('click', (e) => switchTab(e));
                nav.appendChild(btn);
                 console.log("RPG Chart Tab created.");
            }
        } else if (!container) {
             console.warn("RPG Chart container not found and mainView doesn't exist yet?");
             return; // Don't proceed if container can't be found/created
        }


        // Proceed with rendering only if container exists
        const artistsForChart = db.artists || []; // Use empty array as fallback
        const chart = computeChartData(artistsForChart);

        if (chart.length === 0) {
             container.innerHTML = "<p>Não há dados de artistas para exibir o ranking.</p>";
             return;
        }

        container.innerHTML = chart.map((item, idx) => `
            <div class="chart-item rpg-chart-item" data-id="${item.id}" data-artist-name="${item.name}">
                <div class="chart-position">${idx + 1}</div>
                <img src="${item.img}" class="chart-cover">
                <div class="chart-info">
                    <div class="chart-title">${item.name}</div>
                    <div class="chart-artist">${item.points} pts • ${item.simulatedStreams.toLocaleString('pt-BR')} plays</div>
                </div>
            </div>`).join('');
    }

    // --- 4. SISTEMA DO ESTÚDIO (LOGIN E FORMULÁRIOS COM FEATS) ---
    // --- (Functions remain the same as previous correct version) ---
    function populateArtistSelector(playerId) { /* ... */ }
    function loginPlayer(playerId) { /* ... */ }
    function logoutPlayer() { /* ... */ }
    function populateFeatModalArtistSelect() { /* ... */ }
    function openFeatModal(buttonElement) { /* ... */ }
    function closeFeatModal() { /* ... */ }
    function confirmFeat() { /* ... */ }
    function initializeStudio() { /* ... */ }
    async function createAirtableRecord(tableName, fields) { /* ... */ }
    async function handleSingleSubmit(event) { /* ... */ }
    function initAlbumForm() { /* ... */ }
    function addNewTrackInput() { /* ... */ }
    function updateTrackNumbers() { /* ... */ }
    async function handleAlbumSubmit(event) { /* ... */ }
    async function batchCreateAirtableRecords(tableName, records) { /* ... */ }
    function renderParticipacoes() { /* ... */ }


    // --- 5. INICIALIZAÇÃO GERAL ---
    function initializeBodyClickListener() { /* ... */ }

    // --- Ponto de Partida ---
    async function main() {
        console.log("Iniciando Aplicação...");
        if (!initializeDOMElements()) return; // Stop if essential elements missing
        const data = await loadAllData();

        if (data && data.allArtists) { // Check if core data loaded
             if (!initializeData(data)) return; // Stop if data processing fails

            try {
                initializeStudio();

                if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
                if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

                renderRPGChart(); // Creates section/tab if needed

                 // Setup Nav Listeners AFTER potential dynamic tab creation
                const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
                allNavs.forEach(nav => {
                    nav.removeEventListener('click', switchTab); // Prevent duplicates
                    nav.addEventListener('click', switchTab);
                 });

                // Initial render calls inside try-catch
                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10)); // Add safety []
                renderArtistsGrid('artistsGrid', db.artists || []); // Add safety []
                renderChart('music');
                renderChart('album');
                renderParticipacoes();
                setupCountdown('musicCountdownTimer', () => renderChart('music'));
                setupCountdown('albumCountdownTimer', () => renderChart('album'));
                initializeBodyClickListener();
                document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

                // Set initial view state explicitly using switchTab's logic
                 switchTab(null, 'homeSection');

                console.log("Aplicação Iniciada e Configurada.");

            } catch (uiError) {
                 console.error("Erro fatal durante a inicialização da UI:", uiError);
                 document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Ocorreu um erro ao configurar a interface. Verifique o console.</p></div>';
            }

        } else {
             document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão, a API Key e se as tabelas não estão vazias.</p></div>';
             console.error("Initialization failed due to critical data loading error.");
        }
    }

    main(); // Run the initialization sequence

});
