document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null; // Defined globally
    let currentFeatTarget = null;
    let viewHistory = ['mainView']; // Start with mainView

    // --- ELEMENTOS DO DOM ---
    // Defined within initializeDOMElements after DOM is ready
    let allViews, searchInput, studioView, loginPrompt, loggedInInfo, playerSelect,
        loginButton, logoutButton, studioLaunchWrapper, studioTabs, studioForms,
        newSingleForm, singleArtistSelect, newAlbumForm, albumArtistSelect,
        addTrackButton, albumTracklistEditor, featModal, featArtistSelect,
        featTypeSelect, confirmFeatBtn, cancelFeatBtn, participacoesList;

    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';

    function initializeDOMElements() {
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
             console.error("ERRO CRÍTICO: Elementos essenciais do HTML não encontrados!"); return false;
        } return true;
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
                    const tracks = Array.from(musicasMap.values()).filter(song => song.albumId === recordId)
                                       .sort((a,b)=> (a.trackNumber || 0) - (b.trackNumber || 0)); // Sort tracks here
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    const mainArtistIdFromServer = fields['Artista'] || [];
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : mainArtistIdFromServer;
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";
                    const imageUrlField = isAlbumTable ? 'Capa do Álbum' : 'Capa';
                    const imageUrl = (fields[imageUrlField] && fields[imageUrlField][0]?.url) || 'https://i.imgur.com/AD3MbBi.png';
                    return {
                        id: record.id, title: fields['Nome do Álbum'] || fields['Nome do Single/EP'] || 'Título Indisponível', artist: mainArtistName, artistId: mainArtistId,
                        metascore: fields['Metascore'] || 0, imageUrl: imageUrl, releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                        // Store detailed tracks directly here
                        tracks: tracks,
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
                players: formattedPlayers, musicas: Array.from(musicasMap.values()) // Keep sending raw music data
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
            // 1. Initialize Artists Map
            const artistsMap = new Map();
            (data.allArtists || []).forEach(artist => {
                artistsMap.set(artist.name, {
                    ...artist, // Includes id, name, imageUrl, RPGPoints, LastActive
                    img: artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png', // Keep alias for compatibility
                    // Initialize empty arrays; they will be populated by processReleases
                    albums: [],
                    singles: []
                });
            });

            // 2. Initialize db.songs with streams and cover placeholders
            db.songs = (data.musicas || []).map(song => ({
                 ...song, // Includes id, title, duration, trackNumber, durationSeconds, artistIds, collabType, albumId
                 streams: song.streams || Math.floor(Math.random() * 25000000) + 50000,
                 cover: 'https://i.imgur.com/AD3MbBi.png', // Default cover initially
                 artist: '' // Placeholder for main artist name
            }));

            // 3. Process Releases (Albums and Singles combined)
             const allReleases = [...(data.albums || []), ...(data.singles || [])];

            allReleases.forEach(item => {
                // Populate db.songs with cover and artist name
                 item.tracks.forEach(trackInfo => { // item.tracks comes from formatReleases
                    const songInDb = db.songs.find(s => s.id === trackInfo.id);
                     if (songInDb) {
                        songInDb.cover = item.imageUrl;
                        // Set the 'artist' field in db.songs to the main artist of the release
                        songInDb.artist = item.artist;
                    }
                });

                 // Link releases to artists in artistsMap
                 if (artistsMap.has(item.artist)) {
                    const artistEntry = artistsMap.get(item.artist);
                    const thirtyMinutesInSeconds = 30 * 60;
                    // Use totalDurationSeconds calculated in formatReleases
                    if ((item.totalDurationSeconds || 0) >= thirtyMinutesInSeconds) {
                        artistEntry.albums.push(item);
                    } else {
                        artistEntry.singles.push(item);
                    }
                } else {
                     console.warn(`Artista "${item.artist}" do lançamento "${item.title}" não encontrado no artistsMap.`);
                 }
            });

            // 4. Finalize db structure
            db.artists = Array.from(artistsMap.values());
            db.albums = allReleases; // db.albums now contains both types
            db.players = data.players || [];

             // Verify data
             if (db.artists.length === 0) console.warn("Nenhum artista processado.");
             if (db.albums.length === 0) console.warn("Nenhum álbum/single processado.");
             if (db.songs.length === 0) console.warn("Nenhuma música processada.");
             if (db.players.length === 0) console.warn("Nenhum jogador processado.");

            console.log("DB Inicializado (Estilo Original):", { artists: db.artists.length, albums: db.albums.length, songs: db.songs.length, players: db.players.length });
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
        // Use the debug version from previous response
        const container = document.getElementById(containerId);
        if (!container) { console.warn(`!!!! Container com ID "${containerId}" NÃO encontrado !!!!`); return; }
        if (!Array.isArray(artists)) { console.warn(`!!!! Tentando renderizar em "${containerId}" mas 'artists' não é array !!!!`, artists); container.innerHTML = '<p style="color: red;">Erro: Dados inválidos.</p>'; return; }
        console.log(`Renderizando ${artists.length} artistas em #${containerId}`);
        container.innerHTML = '';
        if (artists.length === 0) { container.innerHTML = '<p>Nenhum artista para exibir.</p>'; return; }
        artists.forEach(artist => {
            const card = document.createElement('div');
            card.className = 'artist-card';
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
        // Based on original working version + Feat display
        const container = document.getElementById(`${type}ChartsList`);
        if (!container) return;

        // ORIGINAL LOGIC: Use db.songs or db.albums + specific fields
        const items = type === 'music'
            ? [...db.songs].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50)
             // ORIGINAL LOGIC for albums: Use db.albums directly (contains both)
            : [...db.albums].sort((a, b) => (b.metascore || 0) - (a.metascore || 0)).slice(0, 50);


        container.innerHTML = items.map((item, index) => {
            const trends = ['up', 'down', 'new', 'same']; const trend = trends[Math.floor(Math.random() * trends.length)];
            let trendIcon = '';
            if (trend === 'up') trendIcon = `<i class="fas fa-caret-up trend-up"></i>`; else if (trend === 'down') trendIcon = `<i class="fas fa-caret-down trend-down"></i>`; else if (trend === 'new') trendIcon = `<span class="trend-new">NEW</span>`; else trendIcon = `<span>-</span>`;

            // Adjust based on type for correct data access
            const title = item.title;
            const artistString = type === 'music' ? formatArtistString(item.artistIds || [], item.collabType) : item.artist;
            const cover = type === 'music' ? item.cover : item.imageUrl; // Use pre-calculated cover for songs
            const streams = type === 'music' ? (item.streams || 0) : (item.metascore || 0) * 10000;
            const albumId = type === 'music' ? item.albumId : item.id;
            const mainArtistName = type === 'music'
                 ? (db.artists.find(a => a.id === (item.artistIds || [])[0])?.name || item.artist || 'Artista Desc.') // Use song.artist as fallback
                 : item.artist;

            return `<div class="chart-item" data-id="${item.id}" data-type="${type}" data-artist-name="${mainArtistName}" data-album-id="${albumId || ''}">
                        <div class="chart-position">${index + 1}</div>
                        <img src="${cover}" class="chart-cover">
                        <div class="chart-info">
                            <div class="chart-title">${title}</div>
                            <div class="chart-artist">${artistString}</div> {/* Artist below title */}
                        </div>
                        <div class="chart-stats">
                            <div class="chart-streams">${streams.toLocaleString('pt-BR')}</div>
                            <div class="chart-trend">${trendIcon}</div>
                        </div>
                   </div>`;
        }).join('');
    };


    const openArtistDetail = (artistName) => {
        // Based on original working version + Feat display
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) { console.error("Artista não encontrado:", artistName); return; }
        activeArtist = artist;
        switchView('artistDetail');
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.imageUrl})`;
        document.getElementById('detailName').textContent = artist.name;

        // ORIGINAL LOGIC for top songs + Feat display
        const topSongs = db.songs
            .filter(song => (song.artistIds || []).includes(artist.id)) // Check artistIds for feats
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

        const renderHorizontalList = (containerId, items) => { /* ... uses item.imageUrl ... */ };
        // ORIGINAL LOGIC: uses artist.albums and artist.singles populated by initializeData
        renderHorizontalList('albumsList', artist.albums || []);
        renderHorizontalList('singlesList', artist.singles || []);
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
    };


    const openAlbumDetail = (albumId) => {
        // Based on original working version + Feat display
        const album = db.albums.find(a => a.id === albumId);
        if (!album) { console.error("Álbum não encontrado:", albumId); return; }
        activeArtist = db.artists.find(a => a.id === album.artistId);
        switchView('albumDetail');
        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        const totalMinutes = Math.floor((album.totalDurationSeconds || 0) / 60);
        // ORIGINAL LOGIC: Find tracks associated with the album from the album object itself
         const tracksForAlbum = album.tracks || []; // Use tracks stored in the album object during formatReleases

        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate || '2024-01-01').getFullYear()} • ${tracksForAlbum.length} músicas, ${totalMinutes} min`;

         // Sort tracks based on trackNumber
         tracksForAlbum.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

        document.getElementById('albumTracklist').innerHTML = tracksForAlbum.map(track => {
            // Find the full song details from db.songs to get artistIds and collabType
            const fullSongData = db.songs.find(s => s.id === track.id);
            const artistString = fullSongData ? formatArtistString(fullSongData.artistIds, fullSongData.collabType) : album.artist; // Fallback to album artist

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


    const openDiscographyDetail = (type) => {
        // Based on original working version
        if (!activeArtist) return;
         // ORIGINAL LOGIC: Uses artist.albums / artist.singles
        const items = type === 'albums' ? (activeArtist.albums || []) : (activeArtist.singles || []);
        document.getElementById('discographyTypeTitle').textContent = type === 'albums' ? 'Todos os Álbuns' : 'Todos os Singles e EPs';
        const grid = document.getElementById('discographyGrid');
         if (!grid) return; // Safety check
        grid.innerHTML = items.map(item => `
            <div class="album-card-grid" data-album-id="${item.id}">
                <img src="${item.imageUrl}" alt="${item.title}">
                <div class="album-title">${item.title}</div>
                <div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div>
            </div>`).join('');
        switchView('discographyDetail');
    };

    const handleSearch = () => { /* ... sem mudanças ... */ };
    const setupCountdown = (timerId, callback) => { /* ... sem mudanças ... */ };

    // --- 3. SISTEMA DE RPG (BRIGA DE CHARTS - APENAS VISUALIZAÇÃO) ---
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;
    const calculateSimulatedStreams = (points, lastActiveISO) => { /* ... sem mudanças ... */ };
    const computeChartData = (artistsArray) => { /* ... sem mudanças ... */ };
    function renderRPGChart() { /* ... sem mudanças (já estava sem botões) ... */ }

    // --- 4. SISTEMA DO ESTÚDIO (LOGIN E FORMULÁRIOS COM FEATS) ---
    function populateArtistSelector(playerId) { /* ... sem mudanças ... */ }
    function loginPlayer(playerId) { /* ... sem mudanças ... */ }
    function logoutPlayer() { /* ... sem mudanças ... */ }
    function populateFeatModalArtistSelect() { /* ... sem mudanças ... */ }
    function openFeatModal(buttonElement) { /* ... sem mudanças ... */ }
    function closeFeatModal() { /* ... sem mudanças ... */ }
    function confirmFeat() { /* ... sem mudanças ... */ }
    function initializeStudio() { /* ... sem mudanças ... */ }
    async function createAirtableRecord(tableName, fields) { /* ... sem mudanças ... */ }
    async function handleSingleSubmit(event) { /* ... sem mudanças ... */ }
    function initAlbumForm() { /* ... sem mudanças ... */ }
    function addNewTrackInput() { /* ... sem mudanças ... */ }
    function updateTrackNumbers() { /* ... sem mudanças ... */ }
    async function handleAlbumSubmit(event) { /* ... sem mudanças ... */ }
    async function batchCreateAirtableRecords(tableName, records) { /* ... sem mudanças ... */ }

    // --- NOVA FUNÇÃO PARA RENDERIZAR PARTICIPAÇÕES ---
     function renderParticipacoes() { /* ... sem mudanças ... */ }


    // --- 5. INICIALIZAÇÃO GERAL ---

    function initializeBodyClickListener() { /* ... sem mudanças ... */ }

    // --- Ponto de Partida ---
    async function main() {
        console.log("Iniciando Aplicação...");
        if (!initializeDOMElements()) return;
        const data = await loadAllData();

        if (data && data.allArtists) {
             if (!initializeData(data)) return; // Stop if data processing fails

            try {
                initializeStudio();

                if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
                if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

                renderRPGChart();
                const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
                allNavs.forEach(nav => {
                    nav.removeEventListener('click', switchTab);
                    nav.addEventListener('click', switchTab);
                 });

                renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
                renderArtistsGrid('artistsGrid', db.artists);
                renderChart('music');
                renderChart('album');
                renderParticipacoes();
                setupCountdown('musicCountdownTimer', () => renderChart('music'));
                setupCountdown('albumCountdownTimer', () => renderChart('album'));
                initializeBodyClickListener();
                document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

                // Set initial view using the simplified switchTab logic from the original working code
                // Assuming switchTab handles setting the initial view and section correctly based on its logic
                 switchTab(null, 'homeSection'); // Call switchTab directly for initial setup

                // Ensure initial mainView visibility (redundant if switchTab works, but safe)
                 document.getElementById('mainView').classList.remove('hidden');
                 document.querySelector('.topbar').classList.remove('hidden');


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
