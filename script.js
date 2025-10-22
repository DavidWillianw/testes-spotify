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
        if (!studioView || !loginPrompt || !playerSelect || !newSingleForm || !newAlbumForm || !featModal) {
             console.error("ERRO CRÍTICO: Elementos essenciais do HTML não foram encontrados!");
             // Optionally display an error message to the user here
        }
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
                musicasMap.set(record.id, {
                    id: record.id, title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0, durationSeconds: record.fields['Duração'] || 0,
                    artistIds: artistIds, collabType: record.fields['Tipo de Colaboração']
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

            const formatReleases = (records) => {
                 if (!records) return [];
                return records.map(record => {
                    const fields = record.fields;
                    const trackIds = fields['Músicas'] || [];
                    const tracks = trackIds.map(trackId => musicasMap.get(trackId)).filter(Boolean);
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    const mainArtistIdFromServer = fields['Artista'] || [];
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : mainArtistIdFromServer;
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";
                    return {
                        id: record.id, title: fields['Nome do Álbum'] || fields['Nome do Single/EP'], artist: mainArtistName, artistId: mainArtistId,
                        metascore: fields['Metascore'] || 0, imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                        releaseDate: fields['Data de Lançamento'] || '2024-01-01', tracks: tracks, totalDurationSeconds: totalDurationSeconds
                    };
                });
            };

            const formattedAlbums = formatReleases(albumsData.records);
            const formattedSingles = formatReleases(singlesData.records);
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
            return null; // Return null on critical failure
        }
    }

    /**
     * Coloca os dados carregados no banco de dados local 'db'
     * (VERSÃO COM MAIS CHECAGENS)
     */
    const initializeData = (data) => {
         try {
            db.artists = data.allArtists || [];
            db.albums = [...(data.albums || []), ...(data.singles || [])];
            db.players = data.players || [];
            db.songs = data.musicas || [];

             if (db.artists.length === 0) console.warn("Nenhum artista carregado.");
             if (db.albums.length === 0) console.warn("Nenhum álbum/single carregado.");
             if (db.songs.length === 0) console.warn("Nenhuma música carregada.");
             if (db.players.length === 0) console.warn("Nenhum jogador carregado.");

            db.songs.forEach(song => {
                if (!song.streams) song.streams = Math.floor(Math.random() * 25000000) + 50000;
                if (!Array.isArray(song.artistIds)) song.artistIds = song.artistIds ? [song.artistIds] : [];
                 // Encontra o álbum pai USANDO OS TRACKS DELE (mais seguro que song.id)
                 const parentAlbum = db.albums.find(a => Array.isArray(a.tracks) && a.tracks.some(t => t.id === song.id));
                 song.albumId = parentAlbum ? parentAlbum.id : null;
                 song.cover = parentAlbum ? parentAlbum.imageUrl : 'https://i.imgur.com/AD3MbBi.png';
                 if (!parentAlbum) console.warn(`Música "${song.title}" (ID: ${song.id}) não encontrou álbum pai.`);
            });

             db.artists.forEach(artist => {
                const artistReleases = db.albums.filter(a => a.artistId === artist.id);
                const thirtyMinutesInSeconds = 30 * 60;
                artist.albums = artistReleases.filter(a => (a.totalDurationSeconds || 0) >= thirtyMinutesInSeconds);
                artist.singles = artistReleases.filter(a => (a.totalDurationSeconds || 0) < thirtyMinutesInSeconds);
            });
            console.log("DB Inicializado.");
         } catch (error) {
             console.error("Erro CRÍTICO durante initializeData:", error);
             alert("Ocorreu um erro MUITO GRAVE ao inicializar os dados. A aplicação pode não funcionar. Verifique o console.");
             // Prevent further execution if critical data is broken
             throw error;
         }
    };


    async function refreshAllData() { /* ... sem mudanças ... */ }

    // --- 2. NAVEGAÇÃO E UI ---

    /**
     * Handles showing/hiding the main page views (.page-view divs).
     * Also manages view history, top bar visibility, and content section activation.
     * (VERSÃO CORRIGIDA E CENTRALIZADA v2)
     */
    const switchView = (viewId, targetSectionId = null) => {
        console.log(`Switching view to: ${viewId}, Target Section: ${targetSectionId}`);
        if (!allViews) { console.error("allViews not initialized!"); return; } // Safety check

        // 1. Hide all page views
        allViews.forEach(v => v.classList.add('hidden'));

        // 2. Find and show the target view
        const targetViewElement = document.getElementById(viewId);
        if (targetViewElement) {
            targetViewElement.classList.remove('hidden');

            // 3. Manage Top Bar
            const topBar = document.querySelector('.topbar');
            if (topBar) topBar.classList.toggle('hidden', viewId !== 'mainView');

            // 4. Update History
             if (!Array.isArray(viewHistory)) viewHistory = [];
            if (viewHistory.length === 0 || viewHistory[viewHistory.length - 1] !== viewId) {
                viewHistory.push(viewId);
            }

            // 5. Activate Content Section *if* target is mainView
            if (viewId === 'mainView') {
                 const mainViewElement = document.getElementById('mainView');
                 const sectionIdToActivate = targetSectionId || 'homeSection'; // Default to home
                 console.log(`Activating section #${sectionIdToActivate} in mainView`);
                // Deactivate all sections first
                mainViewElement.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                // Activate the target section
                const sectionToActivate = mainViewElement.querySelector(`#${sectionIdToActivate}`);
                if (sectionToActivate && sectionToActivate.classList.contains('content-section')) {
                    sectionToActivate.classList.add('active');
                } else {
                    console.warn(`Section #${sectionIdToActivate} not found in mainView. Activating homeSection.`);
                    document.getElementById('homeSection')?.classList.add('active'); // Fallback
                }
            }
            window.scrollTo(0, 0);
        } else {
            console.error(`View element with ID "${viewId}" not found! Falling back to mainView.`);
            switchView('mainView', 'homeSection'); // Fallback explicitly
        }
         console.log("View history:", viewHistory);
    };


    /**
     * Handles clicks on navigation tabs (top and bottom).
     * Determines the target view and section, then calls switchView.
     * (VERSÃO SIMPLIFICADA v2)
     */
    const switchTab = (event, forceTabId = null) => {
        const tabId = forceTabId || (event?.currentTarget ? event.currentTarget.dataset.tab : 'homeSection');
        const isTargetingStudio = (tabId === 'studioSection');
        console.log(`Tab clicked: ${tabId}`);

        // 1. Determine target view and section
        let targetViewId = 'mainView';
        let targetSectionId = tabId;

        if (isTargetingStudio) {
            targetViewId = 'studioView';
            targetSectionId = null; // No content section activation needed for studioView
        }
        // Add other direct view targets here if needed (e.g., profile)

        // 2. Call switchView to handle the transition and section activation
        switchView(targetViewId, targetSectionId);

        // 3. Update button active states
        const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        dynamicAllNavs.forEach(nav => {
            nav.classList.toggle('active', nav.dataset.tab === tabId);
        });
    };


    const handleBack = () => { /* ... sem mudanças ... */ };
    // Event listener for back buttons attached later in initialization

    const renderArtistsGrid = (containerId, artists) => { /* ... sem mudanças ... */ };
    function formatArtistString(artistIds, collabType) { /* ... sem mudanças ... */ }
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

    // Moved Body Click Listener Setup Here
    function initializeBodyClickListener() {
        document.body.addEventListener('click', (e) => {
            const target = e.target;
            // Prevent clicks inside modal from triggering background actions
            if (target.closest('.modal-overlay') && !target.closest('.modal-content')) {
                 closeFeatModal(); // Close modal if clicking outside content
                 return;
            }
             if (target.closest('.modal-content')) return; // Ignore clicks inside modal content


            const chartItem = target.closest('.chart-item');
            if (chartItem && !target.closest('.btn-action') && !target.closest('.add-feat-btn') && !target.closest('.remove-feat-btn') && !target.closest('.delete-track-btn')) {
                 const { type, artistName, albumId, id } = chartItem.dataset;
                 if(chartItem.closest('#participacoesList')) { openAlbumDetail(albumId); return; }
                 if (chartItem.classList.contains('rpg-chart-item')) { openArtistDetail(artistName); return; }
                 if (type === 'music') openAlbumDetail(albumId);
                 else if (type === 'album') openAlbumDetail(albumId || id);
                 else openArtistDetail(artistName);
                 return;
            }
            const clickableArtist = target.closest('.clickable-artist');
            if (clickableArtist) { openArtistDetail(clickableArtist.dataset.artistName); return; }
            const artistCard = target.closest('.artist-card');
            if (artistCard) { openArtistDetail(artistCard.dataset.artistName); return; }
            const albumCard = target.closest('[data-album-id]');
            if (albumCard) { openAlbumDetail(albumCard.dataset.albumId); return; }
            const seeAllBtn = target.closest('.see-all-btn');
            if (seeAllBtn) { if(activeArtist) { openDiscographyDetail(seeAllBtn.dataset.type); } return; }
        });
        console.log("Body click listener initialized.");
    }


    // --- Ponto de Partida ---
    async function main() { // Wrap initialization in an async function
        console.log("Iniciando Aplicação...");
        initializeDOMElements(); // Find DOM elements first

        const data = await loadAllData();

        if (data && data.allArtists) { // Check if core data loaded
            initializeData(data);
            initializeStudio();

            if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
            if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

            renderRPGChart(); // Creates section/tab
             // Recalculate allNavs *after* renderRPGChart might add a tab
            const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
            allNavs.forEach(nav => {
                nav.removeEventListener('click', switchTab);
                nav.addEventListener('click', switchTab);
             });

            // Initial render calls
            renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
            renderArtistsGrid('artistsGrid', db.artists);
            renderChart('music');
            renderChart('album');
            renderParticipacoes();
            setupCountdown('musicCountdownTimer', () => renderChart('music'));
            setupCountdown('albumCountdownTimer', () => renderChart('album'));
            initializeBodyClickListener(); // Add body listener after elements rendered
            document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack)); // Attach back button listeners


            // Set initial view state
            switchView('mainView', 'homeSection');
             // Ensure correct nav buttons are highlighted initially
            allNavs.forEach(nav => {
                nav.classList.toggle('active', nav.dataset.tab === 'homeSection');
            });


            console.log("Aplicação Iniciada e Configurada.");

        } else {
             document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão, a configuração da API Key e se as tabelas não estão vazias.</p></div>';
             console.error("Initialization failed due to critical data loading error.");
        }
    }

    main(); // Run the initialization sequence

});
