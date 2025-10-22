document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS tentativa2---
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

        if (!studioView || !loginPrompt || !playerSelect || !newSingleForm || !newAlbumForm || !featModal) {
             console.error("ERRO CRÍTICO: Elementos essenciais do HTML não foram encontrados!");
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
                 // ** GUARDA O ID DO ALBUM/SINGLE PAI DIRETAMENTE NA MUSICA **
                 const parentReleaseId = (record.fields['Álbuns'] && record.fields['Álbuns'][0]) || (record.fields['Singles e EPs'] && record.fields['Singles e EPs'][0]) || null;

                musicasMap.set(record.id, {
                    id: record.id, title: record.fields['Nome da Faixa'] || 'Faixa Sem Título', // Add default title
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0, durationSeconds: record.fields['Duração'] || 0,
                    artistIds: artistIds, collabType: record.fields['Tipo de Colaboração'],
                    albumId: parentReleaseId // <-- Guarda o ID do pai aqui
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

            const formatReleases = (records, isAlbumTable) => { // Added flag
                 if (!records) return [];
                return records.map(record => {
                    const fields = record.fields;
                    // ** MUDANÇA: PEGA TRACK IDS DIRETAMENTE DO MAPA DE MUSICAS PELO PARENT ID **
                    const recordId = record.id;
                    const tracks = Array.from(musicasMap.values()).filter(song => song.albumId === recordId);

                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    const mainArtistIdFromServer = fields['Artista'] || [];
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : mainArtistIdFromServer;
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";

                    // Determina a URL da capa baseado na tabela
                    const imageUrlField = isAlbumTable ? 'Capa do Álbum' : 'Capa';
                    const imageUrl = (fields[imageUrlField] && fields[imageUrlField][0]?.url) || 'https://i.imgur.com/AD3MbBi.png';


                    return {
                        id: record.id, title: fields['Nome do Álbum'] || fields['Nome do Single/EP'] || 'Título Indisponível', // Add default
                        artist: mainArtistName, artistId: mainArtistId,
                        metascore: fields['Metascore'] || 0, imageUrl: imageUrl,
                        releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                        // tracks: tracks, // Não precisa mais guardar os objetos track aqui
                        track_ids: tracks.map(t => t.id), // Guarda apenas os IDs se precisar
                        totalDurationSeconds: totalDurationSeconds
                    };
                });
            };

            const formattedAlbums = formatReleases(albumsData.records, true); // Passa true para álbuns
            const formattedSingles = formatReleases(singlesData.records, false); // Passa false para singles

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
     * (VERSÃO SIMPLIFICADA SEM LOOKUP INTERNO)
     */
    const initializeData = (data) => {
         try {
            db.artists = data.allArtists || [];
            db.albums = [...(data.albums || []), ...(data.singles || [])]; // Combina releases
            db.players = data.players || [];
            db.songs = data.musicas || []; // Usa a lista completa de músicas diretamente

             if (db.artists.length === 0) console.warn("Nenhum artista carregado.");
             if (db.albums.length === 0) console.warn("Nenhum álbum/single carregado.");
             if (db.songs.length === 0) console.warn("Nenhuma música carregada.");
             if (db.players.length === 0) console.warn("Nenhum jogador carregado.");

            // Adiciona streams aleatórios e garante artistIds array
            db.songs.forEach(song => {
                if (!song.streams) song.streams = Math.floor(Math.random() * 25000000) + 50000;
                if (!Array.isArray(song.artistIds)) song.artistIds = song.artistIds ? [song.artistIds] : [];
                // *** REMOVIDO: Busca de albumId e cover - será feita dinamicamente ***
            });

            // Adiciona referência aos álbuns/singles dentro de cada artista
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
             throw error; // Interrompe a execução
         }
    };


    async function refreshAllData() { /* ... sem mudanças ... */ }

    // --- 2. NAVEGAÇÃO E UI ---

    const switchView = (viewId, targetSectionId = null) => { /* ... sem mudanças ... */ };
    const switchTab = (event, forceTabId = null) => { /* ... sem mudanças ... */ };
    const handleBack = () => { /* ... sem mudanças ... */ };
    // Event listener for back buttons attached later

    const renderArtistsGrid = (containerId, artists) => { /* ... sem mudanças ... */ };
    function formatArtistString(artistIds, collabType) { /* ... sem mudanças ... */ }

    /** Busca a URL da capa de um álbum/single pelo ID */
    function getCoverUrl(albumId) {
        if (!albumId) return 'https://i.imgur.com/AD3MbBi.png';
        const album = db.albums.find(a => a.id === albumId);
        return album ? album.imageUrl : 'https://i.imgur.com/AD3MbBi.png';
    }


    const renderChart = (type) => {
        const container = document.getElementById(`${type}ChartsList`);
        if (!container) return;

        const items = type === 'music'
            ? [...db.songs].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50)
            : [...db.albums].sort((a, b) => (b.metascore || 0) - (a.metascore || 0)).slice(0, 50);

        container.innerHTML = items.map((item, index) => {
            const trends = ['up', 'down', 'new', 'same']; const trend = trends[Math.floor(Math.random() * trends.length)];
            let trendIcon = '';
            if (trend === 'up') trendIcon = `<i class="fas fa-caret-up trend-up"></i>`; else if (trend === 'down') trendIcon = `<i class="fas fa-caret-down trend-down"></i>`; else if (trend === 'new') trendIcon = `<span class="trend-new">NEW</span>`; else trendIcon = `<span>-</span>`;

            const title = item.title;
            const artistString = type === 'music' ? formatArtistString(item.artistIds || [], item.collabType) : item.artist;
            // ** CORREÇÃO: Busca a capa dinamicamente **
            const cover = type === 'music' ? getCoverUrl(item.albumId) : item.imageUrl;
            const streams = type === 'music' ? (item.streams || 0) : (item.metascore || 0) * 10000;
            const albumId = type === 'music' ? item.albumId : item.id;
            const mainArtistName = type === 'music'
                 ? (db.artists.find(a => a.id === (item.artistIds || [])[0])?.name || 'Artista Desc.')
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
             // ** CORREÇÃO: Busca a capa dinamicamente **
             const coverUrl = getCoverUrl(song.albumId);
             return `<div class="song-row" data-album-id="${song.albumId || ''}">
                        <div style="color: var(--text-secondary);">${index + 1}</div>
                        <div class="song-row-info">
                            <img class="song-row-cover" src="${coverUrl}" alt="${song.title}">
                            <div>
                               <div class="song-row-title">${song.title}</div>
                               <div class="track-artist-feat">${artistString}</div>
                            </div>
                        </div>
                        <div class="song-streams">${(song.streams || 0).toLocaleString('pt-BR')}</div>
                    </div>`;
            }).join('');

        const renderHorizontalList = (containerId, items) => { /* ... sem mudanças ... */ };
        // Usa os álbuns/singles já associados ao artista em initializeData
        renderHorizontalList('albumsList', artist.albums || []);
        renderHorizontalList('singlesList', artist.singles || []);
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
    };

    const openAlbumDetail = (albumId) => { /* ... sem mudanças significativas, já usava db.songs ... */ };
    const openDiscographyDetail = (type) => { /* ... sem mudanças significativas, usa artist.albums/singles ... */ };
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

    // --- NOVA FUNÇÃO PARA RENDERIZAR PARTICIPAÇÕES ---
     function renderParticipacoes() {
        if (!participacoesList) return;
        const colaboracoes = db.songs.filter(song => Array.isArray(song.artistIds) && song.artistIds.length > 1);
        if (colaboracoes.length === 0) {
            participacoesList.innerHTML = "<p>Nenhuma música com participação encontrada.</p>"; return;
        }
        colaboracoes.sort((a,b) => (b.streams || 0) - (a.streams || 0));
        participacoesList.innerHTML = colaboracoes.map((song, index) => {
             const artistString = formatArtistString(song.artistIds, song.collabType);
             // ** CORREÇÃO: Busca a capa dinamicamente **
             const coverUrl = getCoverUrl(song.albumId);
             const mainArtistName = db.artists.find(a => a.id === song.artistIds[0])?.name || '';
            return `<div class="chart-item" data-id="${song.id}" data-type="music" data-artist-name="${mainArtistName}" data-album-id="${song.albumId || ''}">
                        <div class="chart-position">${index + 1}</div>
                        <img src="${coverUrl}" class="chart-cover">
                        <div class="chart-info">
                            <div class="chart-title">${song.title}</div>
                            <div class="chart-artist">${artistString}</div>
                        </div>
                        <div class="chart-stats">
                            <div class="chart-streams">${(song.streams || 0).toLocaleString('pt-BR')}</div>
                        </div>
                   </div>`;
        }).join('');
    }

    // --- 5. INICIALIZAÇÃO GERAL ---

    function initializeBodyClickListener() { /* ... sem mudanças ... */ }

    // --- Ponto de Partida ---
    async function main() {
        console.log("Iniciando Aplicação...");
        initializeDOMElements();
        const data = await loadAllData();

        if (data && data.allArtists) {
            try { // Wrap initialization in try-catch
                initializeData(data);
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

                switchView('mainView', 'homeSection');
                allNavs.forEach(nav => {
                    nav.classList.toggle('active', nav.dataset.tab === 'homeSection');
                });

                console.log("Aplicação Iniciada e Configurada.");
            } catch (initError) {
                 console.error("Erro fatal durante a inicialização da UI:", initError);
                 document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Ocorreu um erro ao processar os dados e inicializar a interface. Verifique o console.</p></div>';
            }

        } else {
             document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão, a configuração da API Key e se as tabelas não estão vazias.</p></div>';
             console.error("Initialization failed due to critical data loading error.");
        }
    }

    main(); // Executa a inicialização

});
