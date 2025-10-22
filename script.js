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
             // Display error prominently if core elements are missing
             document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Elementos essenciais da página não foram encontrados. Verifique o HTML e os IDs.</p></div>';
             return false; // Indicate failure
        }
        console.log("DOM elements initialized.");
        return true; // Indicate success
    }


    // --- 1. CARREGAMENTO DE DADOS ---
    async function loadAllData() {
        // ... (loadAllData function remains the same) ...
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
                    const tracks = Array.from(musicasMap.values()).filter(song => song.albumId === recordId); // Find tracks by parent ID
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    const mainArtistIdFromServer = fields['Artista'] || [];
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : mainArtistIdFromServer;
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";
                    const imageUrlField = isAlbumTable ? 'Capa do Álbum' : 'Capa';
                    const imageUrl = (fields[imageUrlField] && fields[imageUrlField][0]?.url) || 'https://i.imgur.com/AD3MbBi.png';
                    return {
                        id: record.id, title: fields['Nome do Álbum'] || fields['Nome do Single/EP'] || 'Título Indisponível', artist: mainArtistName, artistId: mainArtistId,
                        metascore: fields['Metascore'] || 0, imageUrl: imageUrl, releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                        track_ids: tracks.map(t => t.id), totalDurationSeconds: totalDurationSeconds
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
     * (VERSÃO SIMPLIFICADA SEM LOOKUP INTERNO v2)
     */
    const initializeData = (data) => {
         try {
            db.artists = data.allArtists || [];
            db.albums = [...(data.albums || []), ...(data.singles || [])];
            db.players = data.players || [];
            db.songs = data.musicas || [];

             if (!db.artists || db.artists.length === 0) console.warn("Nenhum artista carregado/processado.");
             if (!db.albums || db.albums.length === 0) console.warn("Nenhum álbum/single carregado/processado.");
             if (!db.songs || db.songs.length === 0) console.warn("Nenhuma música carregada/processada.");
             if (!db.players || db.players.length === 0) console.warn("Nenhum jogador carregado/processado.");

            // Add streams and ensure artistIds array (Cover lookup moved to render functions)
            db.songs.forEach(song => {
                if (!song.streams) song.streams = Math.floor(Math.random() * 25000000) + 50000;
                if (!Array.isArray(song.artistIds)) song.artistIds = song.artistIds ? [song.artistIds] : [];
                 // ** REMOVED: Album lookup removed from here **
            });

             // Add album/single references to artist objects
             db.artists.forEach(artist => {
                const artistReleases = db.albums.filter(a => a.artistId === artist.id);
                const thirtyMinutesInSeconds = 30 * 60;
                artist.albums = artistReleases.filter(a => (a.totalDurationSeconds || 0) >= thirtyMinutesInSeconds);
                artist.singles = artistReleases.filter(a => (a.totalDurationSeconds || 0) < thirtyMinutesInSeconds);
            });

            console.log("DB Inicializado.");
            return true; // Indicate success
         } catch (error) {
             console.error("Erro CRÍTICO durante initializeData:", error);
             alert("Ocorreu um erro MUITO GRAVE ao inicializar os dados. A aplicação pode não funcionar. Verifique o console.");
             return false; // Indicate failure
         }
    };


    async function refreshAllData() { /* ... sem mudanças ... */ }

    // --- 2. NAVEGAÇÃO E UI ---

    /**
     * Handles showing/hiding the main page views (.page-view divs).
     * Also manages view history, top bar visibility, and content section activation.
     * (VERSÃO CORRIGIDA E CENTRALIZADA v3 - Simplified History)
     */
     const switchView = (viewId, targetSectionId = null) => {
        console.log(`Switching view to: ${viewId}, Target Section: ${targetSectionId}`);
        if (!allViews || allViews.length === 0) { console.error("allViews not initialized or empty!"); return; }

        // 1. Hide all page views
        allViews.forEach(v => v.classList.add('hidden'));

        // 2. Find and show the target view
        const targetViewElement = document.getElementById(viewId);
        if (targetViewElement) {
            targetViewElement.classList.remove('hidden');

            // 3. Manage Top Bar
            const topBar = document.querySelector('.topbar');
            if (topBar) topBar.classList.toggle('hidden', viewId !== 'mainView');

            // 4. Update History (Simple push, handleBack manages popping)
             if (!Array.isArray(viewHistory)) viewHistory = [];
            viewHistory.push(viewId); // Always push, back button will handle duplicates

            // 5. Activate Content Section *if* target is mainView
            if (viewId === 'mainView') {
                 const mainViewElement = document.getElementById('mainView');
                 const sectionIdToActivate = targetSectionId || viewHistory[viewHistory.length-2] || 'homeSection'; // Try previous, default home
                 console.log(`Activating section #${sectionIdToActivate} in mainView`);
                mainViewElement.querySelectorAll('.content-section').forEach(s => s.classList.remove('active')); // Deactivate all
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
            // Explicitly push mainView to history before calling switchView to prevent infinite loop
             if (!Array.isArray(viewHistory)) viewHistory = [];
             viewHistory.push('mainView');
            switchView('mainView', 'homeSection');
        }
         console.log("View history:", viewHistory);
    };

    /**
     * Handles clicks on navigation tabs (top and bottom).
     * Determines the target view and section, then calls switchView.
     * (VERSÃO SIMPLIFICADA v3)
     */
    const switchTab = (event, forceTabId = null) => {
        const tabId = forceTabId || (event?.currentTarget ? event.currentTarget.dataset.tab : 'homeSection');
        const isTargetingStudio = (tabId === 'studioSection');
        console.log(`Tab clicked: ${tabId}`);

        let targetViewId = 'mainView';
        let targetSectionId = tabId;

        if (isTargetingStudio) {
            targetViewId = 'studioView';
            targetSectionId = null;
        }

        // Call switchView which handles everything
        switchView(targetViewId, targetSectionId);

        // Update button active states
        const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        dynamicAllNavs.forEach(nav => {
            nav.classList.toggle('active', nav.dataset.tab === tabId);
        });
    };


    const handleBack = () => {
         if (!Array.isArray(viewHistory)) viewHistory = []; // Safety check
        if (viewHistory.length > 1) {
             viewHistory.pop(); // Remove the current view from history
             const previousViewId = viewHistory[viewHistory.length - 1]; // Get the view to return to
            // switchView will handle showing the view and activating default section if it's mainView
            switchView(previousViewId);

             // Update nav highlights based on the view we returned to
            const activeTabId = previousViewId === 'studioView' ? 'studioSection' : (document.querySelector('#mainView .content-section.active')?.id || 'homeSection');
             const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
            dynamicAllNavs.forEach(nav => {
                nav.classList.toggle('active', nav.dataset.tab === activeTabId);
            });

        } else {
             console.log("Cannot go back further.");
        }
    };
    // Back button listeners attached in main()

    const renderArtistsGrid = (containerId, artists) => {
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
        // Initialize DOM elements MUST happen first
        if (!initializeDOMElements()) return; // Stop if essential elements missing

        const data = await loadAllData();

        if (data && data.allArtists) {
            if (!initializeData(data)) return; // Stop if data processing fails critically

            try { // Wrap UI initialization in try-catch
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
                renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
                renderArtistsGrid('artistsGrid', db.artists);
                renderChart('music');
                renderChart('album');
                renderParticipacoes();
                setupCountdown('musicCountdownTimer', () => renderChart('music'));
                setupCountdown('albumCountdownTimer', () => renderChart('album'));
                initializeBodyClickListener();
                document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

                // Set initial view state explicitly using the updated switchView
                switchView('mainView', 'homeSection');

                 // Ensure correct nav buttons are highlighted
                allNavs.forEach(nav => {
                    nav.classList.toggle('active', nav.dataset.tab === 'homeSection');
                });

                console.log("Aplicação Iniciada e Configurada.");

            } catch (uiError) {
                 console.error("Erro fatal durante a inicialização da UI:", uiError);
                 document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Ocorreu um erro ao configurar a interface. Verifique o console.</p></div>';
            }

        } else {
             document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão, a configuração da API Key e se as tabelas não estão vazias.</p></div>';
             console.error("Initialization failed due to critical data loading error.");
        }
    }

    main(); // Run the initialization sequence

});
