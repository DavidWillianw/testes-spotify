document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null;
    let currentFeatTarget = null;
    let viewHistory = [];

    // --- ELEMENTOS DO DOM (Definidos após o DOM carregar) ---
    let allViews, searchInput, studioView, loginPrompt, loggedInInfo, playerSelect,
        loginButton, logoutButton, studioLaunchWrapper, studioTabs, studioForms,
        newSingleForm, singleArtistSelect, newAlbumForm, albumArtistSelect,
        addTrackButton, albumTracklistEditor, featModal, featArtistSelect,
        featTypeSelect, confirmFeatBtn, cancelFeatBtn, participacoesList;

    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';

    // --- FUNÇÃO PARA INICIALIZAR ELEMENTOS DO DOM ---
    function initializeDOMElements() {
        console.log("Initializing DOM elements..."); // Log added
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

        // Check if essential elements exist
        if (!studioView || !loginPrompt || !playerSelect || !newSingleForm || !newAlbumForm || !featModal || !allViews || allViews.length === 0) {
             console.error("ERRO CRÍTICO: Elementos essenciais do HTML não foram encontrados! Verifique IDs: studioView, loginPrompt, playerSelect, newSingleForm, newAlbumForm, featModal, .page-view");
             document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Elementos essenciais da página não foram encontrados. Verifique o HTML e os IDs.</p></div>';
             return false; // Indicate failure
        }
        console.log("DOM elements initialized.");
        return true; // Indicate success
    }


    // --- 1. CARREGAMENTO DE DADOS ---
    async function loadAllData() {
        // ... (loadAllData function remains the same as the previous version) ...
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

            const artistsMapById = new Map(); // Keep this map local to loadAllData
             const artistsList = (artistsData.records || []).map(record => {
                const artist = {
                    id: record.id, name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || [], RPGPoints: record.fields.RPGPoints || 0, LastActive: record.fields.LastActive || null
                };
                 artistsMapById.set(artist.id, artist.name); // Populate local map
                return artist;
            });

            const formatReleases = (records, isAlbumTable) => {
                 if (!records) return [];
                return records.map(record => {
                    const fields = record.fields;
                    const recordId = record.id;
                    const tracks = Array.from(musicasMap.values()).filter(song => song.albumId === recordId)
                                       .sort((a,b)=> (a.trackNumber || 0) - (b.trackNumber || 0));
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    const mainArtistIdFromServer = fields['Artista'] || [];
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : (mainArtistIdFromServer || null);
                    // Use the local map here
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";
                    const imageUrlField = isAlbumTable ? 'Capa do Álbum' : 'Capa';
                    const imageUrl = (fields[imageUrlField] && fields[imageUrlField][0]?.url) || 'https://i.imgur.com/AD3MbBi.png';
                    return {
                        id: record.id, title: fields['Nome do Álbum'] || fields['Nome do Single/EP'] || 'Título Indisponível', artist: mainArtistName, artistId: mainArtistId,
                        metascore: fields['Metascore'] || 0, imageUrl: imageUrl, releaseDate: fields['Data de Lançamento'] || '2024-01-01',
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
                players: formattedPlayers, musicas: Array.from(musicasMap.values())
            };
        } catch (error) {
            console.error("Falha GERAL ao carregar dados:", error);
            return null;
        }
    }

    /**
     * Coloca os dados carregados no banco de dados local 'db'
     * (VERSÃO CORRIGIDA - artistsMapById LOCAL)
     */
     const initializeData = (data) => {
         try {
            // 1. Initialize Artists Map & db.artists LOCALLY
            const artistsMapById = new Map(); // Create map here
            db.artists = (data.allArtists || []).map(artist => {
                 const artistEntry = {
                    ...artist,
                    img: artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png',
                    albums: [], // Will be populated later
                    singles: []  // Will be populated later
                 };
                 artistsMapById.set(artist.id, artist.name); // Populate map here
                 return artistEntry;
            });

            // 2. Initialize db.songs using the LOCAL artistsMapById
            db.songs = (data.musicas || []).map(song => ({
                 ...song,
                 streams: song.streams || Math.floor(Math.random() * 25000000) + 50000,
                 cover: 'https://i.imgur.com/AD3MbBi.png', // Default cover initially
                 // Use the LOCAL map to find the name
                 artist: artistsMapById.get((song.artistIds || [])[0]) || 'Artista Desc.'
            }));

            // 3. Process Releases (Albums and Singles combined)
             const allReleases = [...(data.albums || []), ...(data.singles || [])];
             db.albums = allReleases;

            allReleases.forEach(item => {
                // Update cover url in db.songs
                 (item.tracks || []).forEach(trackInfo => {
                    // Find the song in db.songs using the ID from the track object within the release
                    const songInDb = db.songs.find(s => s.id === trackInfo.id);
                     if (songInDb) {
                        songInDb.cover = item.imageUrl;
                        // songInDb.artist is already set based on song's primary artist
                    } else {
                         // This case might happen if a song exists in an album's track list
                         // but wasn't successfully loaded/mapped initially.
                         console.warn(`Song ID ${trackInfo.id} listed in release "${item.title}" not found in db.songs.`);
                     }
                });

                 // Link releases to artists in db.artists array
                 const artistEntry = db.artists.find(a => a.id === item.artistId);
                 if (artistEntry) {
                    const thirtyMinutesInSeconds = 30 * 60;
                    if ((item.totalDurationSeconds || 0) >= thirtyMinutesInSeconds) {
                        // Ensure albums array exists
                        if (!Array.isArray(artistEntry.albums)) artistEntry.albums = [];
                        artistEntry.albums.push(item);
                    } else {
                         // Ensure singles array exists
                         if (!Array.isArray(artistEntry.singles)) artistEntry.singles = [];
                        artistEntry.singles.push(item);
                    }
                } else {
                     if (item.artist !== "Artista Desconhecido") {
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

    const renderArtistsGrid = (containerId, artists) => { /* ... sem mudanças (Usar Versão Debug) ... */ };
    function formatArtistString(artistIds, collabType) { /* ... sem mudanças ... */ }
    function getCoverUrl(albumId) { /* ... sem mudanças ... */ }
    const renderChart = (type) => { /* ... sem mudanças ... */ };
    const openArtistDetail = (artistName) => { /* ... sem mudanças ... */ };
    const openAlbumDetail = (albumId) => { /* ... sem mudanças ... */ };
    const openDiscographyDetail = (type) => { /* ... sem mudanças ... */ };
    const handleSearch = () => { /* ... sem mudanças ... */ };
    const setupCountdown = (timerId, callback) => { /* ... sem mudanças ... */ };

    // --- 3. SISTEMA DE RPG (BRIGA DE CHARTS - APENAS VISUALIZAÇÃO) ---
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;
    const calculateSimulatedStreams = (points, lastActiveISO) => { /* ... sem mudanças ... */ };
    const computeChartData = (artistsArray) => { /* ... sem mudanças ... */ };
    function renderRPGChart() { /* ... sem mudanças ... */ }

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

                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10)); // Safety []
                renderArtistsGrid('artistsGrid', db.artists || []); // Safety []
                renderChart('music');
                renderChart('album');
                renderParticipacoes();
                setupCountdown('musicCountdownTimer', () => renderChart('music'));
                setupCountdown('albumCountdownTimer', () => renderChart('album'));
                initializeBodyClickListener();
                document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

                switchTab(null, 'homeSection'); // Use switchTab for initial state

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
