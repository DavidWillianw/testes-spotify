document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null;
    let currentFeatTarget = null;
    let viewHistory = []; // Initialize as empty, switchView will handle 'mainView' start

    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const studioView = document.getElementById('studioView'); // Keep reference

    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';

    // --- ELEMENTOS DO ESTÚDIO ---
    const loginPrompt = document.getElementById('loginPrompt');
    const loggedInInfo = document.getElementById('loggedInInfo');
    const playerSelect = document.getElementById('playerSelect');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const studioLaunchWrapper = document.getElementById('studioLaunchWrapper');
    const studioTabs = document.querySelectorAll('.studio-tab-btn');
    const studioForms = document.querySelectorAll('.studio-form-content');
    const newSingleForm = document.getElementById('newSingleForm');
    const singleArtistSelect = document.getElementById('singleArtistSelect');
    const newAlbumForm = document.getElementById('newAlbumForm');
    const albumArtistSelect = document.getElementById('albumArtistSelect');
    const addTrackButton = document.getElementById('addTrackButton');
    const albumTracklistEditor = document.getElementById('albumTracklistEditor');

    // --- ELEMENTOS DO MODAL FEAT ---
    const featModal = document.getElementById('featModal');
    const featArtistSelect = document.getElementById('featArtistSelect');
    const featTypeSelect = document.getElementById('featTypeSelect');
    const confirmFeatBtn = document.getElementById('confirmFeatBtn');
    const cancelFeatBtn = document.getElementById('cancelFeatBtn');

    // --- ELEMENTOS DA ABA PARTICIPAÇÕES ---
    const participacoesList = document.getElementById('participacoesList');


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
             (musicasData.records || []).forEach(record => { // Add safety check
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
             const artistsList = (artistsData.records || []).map(record => { // Add safety check
                const artist = {
                    id: record.id, name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || [], RPGPoints: record.fields.RPGPoints || 0, LastActive: record.fields.LastActive || null
                };
                 artistsMapById.set(artist.id, artist.name);
                return artist;
            });

            const formatReleases = (records) => {
                 if (!records) return []; // Add safety check
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

             const formattedPlayers = (playersData.records || []).map(record => ({ // Add safety check
                id: record.id, name: record.fields.Nome, artists: record.fields.Artistas || []
            }));

            console.log("Dados carregados com sucesso.");
            return {
                allArtists: artistsList, albums: formattedAlbums, singles: formattedSingles,
                players: formattedPlayers, musicas: Array.from(musicasMap.values())
            };
        } catch (error) {
            console.error("Falha GERAL ao carregar dados:", error);
            return { allArtists: [], albums: [], singles: [], players: [], musicas: [] };
        }
    }

    const initializeData = (data) => {
         try {
            db.artists = data.allArtists || [];
            db.albums = [...(data.albums || []), ...(data.singles || [])];
            db.players = data.players || [];
            db.songs = data.musicas || [];

            db.songs.forEach(song => {
                if (!song.streams) song.streams = Math.floor(Math.random() * 25000000) + 50000;
                if (!Array.isArray(song.artistIds)) song.artistIds = song.artistIds ? [song.artistIds] : [];
                 const parentAlbum = db.albums.find(a => a.tracks.some(t => t.id === song.id));
                 song.albumId = parentAlbum ? parentAlbum.id : null;
                 song.cover = parentAlbum ? parentAlbum.imageUrl : 'https://i.imgur.com/AD3MbBi.png';
            });

             db.artists.forEach(artist => {
                const artistReleases = db.albums.filter(a => a.artistId === artist.id);
                const thirtyMinutesInSeconds = 30 * 60;
                artist.albums = artistReleases.filter(a => a.totalDurationSeconds >= thirtyMinutesInSeconds);
                artist.singles = artistReleases.filter(a => a.totalDurationSeconds < thirtyMinutesInSeconds);
            });
            console.log("DB Inicializado."); // Shorter log
         } catch (error) {
             console.error("Erro durante initializeData:", error);
             alert("Ocorreu um erro ao inicializar os dados. Verifique o console.");
         }
    };

    async function refreshAllData() { /* ... sem mudanças ... */ }

    // --- 2. NAVEGAÇÃO E UI ---

    /**
     * Handles showing/hiding the main page views (.page-view divs).
     * Also manages view history, top bar visibility, and content section activation.
     * (VERSÃO CORRIGIDA E CENTRALIZADA)
     */
     const switchView = (viewId, targetSectionId = null) => {
        console.log(`Switching view to: ${viewId}, Target Section: ${targetSectionId}`);

        // 1. Hide all page views
        allViews.forEach(v => v.classList.add('hidden'));

        // 2. Show the target view
        const targetViewElement = document.getElementById(viewId);
        if (targetViewElement) {
            targetViewElement.classList.remove('hidden');

            // 3. Manage Top Bar
            const topBar = document.querySelector('.topbar');
            if (topBar) topBar.classList.toggle('hidden', viewId !== 'mainView');

            // 4. Update History (only add if different from last)
            if (!viewHistory.length || viewHistory[viewHistory.length - 1] !== viewId) {
                viewHistory.push(viewId);
            }

            // 5. Activate Content Section *if* target is mainView and sectionId is provided
            if (viewId === 'mainView' && targetSectionId) {
                 console.log(`Activating section #${targetSectionId} in mainView`);
                const mainViewElement = document.getElementById('mainView');
                // Deactivate all sections first
                mainViewElement.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                // Activate the target section
                const sectionToActivate = mainViewElement.querySelector(`#${targetSectionId}`);
                if (sectionToActivate && sectionToActivate.classList.contains('content-section')) {
                    sectionToActivate.classList.add('active');
                } else {
                    console.warn(`Section #${targetSectionId} not found in mainView. Activating homeSection.`);
                    document.getElementById('homeSection')?.classList.add('active'); // Fallback
                }
            } else if (viewId === 'mainView' && !targetSectionId) {
                 // If switching back to mainView without a specific section, default to home
                 console.log("Switching back to mainView, defaulting to homeSection.");
                 document.querySelectorAll('#mainView .content-section').forEach(s => s.classList.remove('active'));
                 document.getElementById('homeSection')?.classList.add('active');
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
     * (VERSÃO SIMPLIFICADA)
     */
    const switchTab = (event, forceTabId = null) => {
        const tabId = forceTabId || (event?.currentTarget ? event.currentTarget.dataset.tab : 'homeSection');
        const isTargetingStudio = (tabId === 'studioSection');

        console.log(`Tab clicked: ${tabId}`);

        // 1. Determine target view and section
        let targetViewId = 'mainView';
        let targetSectionId = tabId; // The section inside mainView to activate

        if (isTargetingStudio) {
            targetViewId = 'studioView';
            targetSectionId = null; // No content section activation needed for studioView
        }
        // Add other direct view targets here if needed

        // 2. Call switchView to handle the transition and section activation
        switchView(targetViewId, targetSectionId);

        // 3. Update button active states (always do this)
        const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        dynamicAllNavs.forEach(nav => {
            nav.classList.toggle('active', nav.dataset.tab === tabId);
        });
    };


    const handleBack = () => {
        if (!Array.isArray(viewHistory)) viewHistory = ['mainView'];
        if (viewHistory.length > 1) {
            viewHistory.pop(); // Remove current view
            const previousViewId = viewHistory[viewHistory.length - 1]; // Get the one before that
            // Determine default section if returning to mainView
             const previousSectionId = previousViewId === 'mainView' ? 'homeSection' : null;
             // Call switchView to handle showing the correct view and potentially section
             switchView(previousViewId, previousSectionId);

             // Update nav highlights based on the view we returned to
            const activeTabId = previousViewId === 'studioView' ? 'studioSection' : (previousSectionId || 'homeSection');
             const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
            dynamicAllNavs.forEach(nav => {
                nav.classList.toggle('active', nav.dataset.tab === activeTabId);
            });

        } else {
             console.log("Cannot go back further.");
        }
    };
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

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
    // --- Funções handleRPGAction, performRPGAction, isOnCooldown REMOVIDAS ---


    // --- 4. SISTEMA DO ESTÚDIO (LOGIN E FORMULÁRIOS COM FEATS) ---

    function populateArtistSelector(playerId) { /* ... sem mudanças ... */ }
    function loginPlayer(playerId) { /* ... sem mudanças ... */ }
    function logoutPlayer() { /* ... sem mudanças ... */ }
    function populateFeatModalArtistSelect() { /* ... sem mudanças ... */ }
    function openFeatModal(buttonElement) { /* ... sem mudanças ... */ }
    function closeFeatModal() { /* ... sem mudanças ... */ }
    function confirmFeat() { /* ... sem mudanças ... */ }

    function initializeStudio() {
        console.log("Initializing Studio..."); // Log added
        // Popula o dropdown de jogadores
        playerSelect.innerHTML = '<option value="" disabled selected>Selecione seu nome...</option>';
         if(db.players && db.players.length > 0){ // Check if players exist
            db.players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = player.name;
                playerSelect.appendChild(option);
            });
            console.log("Player dropdown populated.");
        } else {
             playerSelect.innerHTML = '<option value="" disabled>Nenhum jogador encontrado.</option>';
             console.warn("No players found in db to populate dropdown.");
        }


        // Adiciona listeners de login/logout
        loginButton.addEventListener('click', () => {
            const selectedPlayerId = playerSelect.value;
            if (selectedPlayerId) {
                loginPlayer(selectedPlayerId);
            } else {
                 alert("Por favor, selecione um jogador.");
            }
        });
        logoutButton.addEventListener('click', logoutPlayer);

        // Verifica se o jogador já estava logado no localStorage
        const storedPlayerId = localStorage.getItem('spotifyRpg_playerId');
        if (storedPlayerId) {
             console.log("Found stored player ID:", storedPlayerId);
            loginPlayer(storedPlayerId); // Tenta logar
        } else {
             console.log("No stored player ID found.");
             // Garante que a UI esteja no estado de logout
              logoutPlayer(); // Chama logout para garantir estado inicial correto
        }

        // Listeners para as abas do estúdio (Single, Álbum)
        studioTabs.forEach(tab => {
            tab.addEventListener('click', (e) => { // Added event 'e'
                e.preventDefault(); // Prevent potential default behavior
                studioTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                studioForms.forEach(form => form.classList.remove('active'));
                 const targetFormId = tab.dataset.form === 'single' ? 'newSingleForm' : 'newAlbumForm';
                 const targetForm = document.getElementById(targetFormId);
                 if (targetForm) {
                     targetForm.classList.add('active');
                 } else {
                     console.error(`Form with ID "${targetFormId}" not found.`);
                 }
            });
        });


        // Listeners para abrir o MODAL de Feat
        document.getElementById('studioView').addEventListener('click', (e) => {
            const addFeatButton = e.target.closest('.add-feat-btn');
            if (addFeatButton) {
                 openFeatModal(addFeatButton);
            }
        });

        // Listeners do Modal
        confirmFeatBtn.addEventListener('click', confirmFeat);
        cancelFeatBtn.addEventListener('click', closeFeatModal);
        featModal.addEventListener('click', (e) => { if (e.target === featModal) closeFeatModal(); });

        initAlbumForm();
        console.log("Studio Initialized.");
    }


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

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const chartItem = target.closest('.chart-item');
        if (chartItem && !target.closest('.btn-action') && !target.closest('.add-feat-btn') && !target.closest('.remove-feat-btn') && !target.closest('.delete-track-btn')) { // Adiciona mais exclusões
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


    // --- Ponto de Partida ---
    console.log("Iniciando Aplicação...");
    const data = await loadAllData();

    if (data && data.allArtists && data.allArtists.length >= 0) { // Permite zero artistas
        initializeData(data);
        initializeStudio(); // Chama ANTES de add listeners dos forms

        if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
        if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

        renderRPGChart(); // Cria a seção/tab se não existir
        setInterval(() => { renderRPGChart(); }, 30 * 1000);

        searchInput.addEventListener('input', handleSearch);

        // Adiciona listeners DEPOIS que todas as tabs (incluindo RPG) foram criadas
        const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        allNavs.forEach(nav => {
            nav.removeEventListener('click', switchTab); // Remove antigos
            nav.addEventListener('click', switchTab); // Adiciona novos
         });


        // Renderiza conteúdo inicial
        renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
        renderArtistsGrid('artistsGrid', db.artists);
        renderChart('music');
        renderChart('album');
        renderParticipacoes();
        setupCountdown('musicCountdownTimer', () => renderChart('music'));
        setupCountdown('albumCountdownTimer', () => renderChart('album'));

        // Ajuste final da view inicial - Chama switchView diretamente
        switchView('mainView', 'homeSection'); // Ativa mainView e homeSection
        // Highlight correct nav buttons after initial setup
        allNavs.forEach(nav => {
            nav.classList.toggle('active', nav.dataset.tab === 'homeSection');
        });


    } else {
         document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão, a configuração da API Key e se as tabelas não estão vazias.</p></div>';
    }
     console.log("Aplicação Iniciada e Configurada.");
});
