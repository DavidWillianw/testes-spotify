document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null; // <-- BUG CORRIGIDO: Esta linha estava faltando
    let currentFeatTarget = null; // Guarda o botão/track que abriu o modal de feat

    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const studioView = document.getElementById('studioView');
    let viewHistory = ['mainView'];

    // IDs da sua base (já que loadAllData não está no escopo global)
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
                console.error("Falha ao carregar Airtable:", {
                    artists: artistsResponse.statusText, albums: albumsResponse.statusText,
                    musicas: musicasResponse.statusText, singles: singlesResponse.statusText,
                    players: playersResponse.statusText
                });
                throw new Error('Falha ao carregar dados Airtable.');
            }

            const artistsData = await artistsResponse.json();
            const albumsData = await albumsResponse.json();
            const musicasData = await musicasResponse.json();
            const singlesData = await singlesResponse.json();
            const playersData = await playersResponse.json();

            // --- RECONSTRUÇÃO ---
            const musicasMap = new Map();
            musicasData.records.forEach(record => {
                 // ** IMPORTANTE: Garante que artistIds seja sempre um array **
                 const artistIdsFromServer = record.fields['Artista'] || [];
                 const artistIds = Array.isArray(artistIdsFromServer) ? artistIdsFromServer : [artistIdsFromServer];

                musicasMap.set(record.id, {
                    id: record.id,
                    title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0,
                    durationSeconds: record.fields['Duração'] || 0,
                    artistIds: artistIds, // <-- Garante Array
                    collabType: record.fields['Tipo de Colaboração']
                });
            });


            const artistsMapById = new Map();
             const artistsList = artistsData.records.map(record => {
                const artist = {
                    id: record.id,
                    name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || [],
                    RPGPoints: record.fields.RPGPoints || 0,
                    LastActive: record.fields.LastActive || null
                };
                 artistsMapById.set(artist.id, artist.name);
                return artist;
            });


            const formatReleases = (records) => {
                return records.map(record => {
                    const fields = record.fields;
                    const trackIds = fields['Músicas'] || [];
                    const tracks = trackIds.map(trackId => musicasMap.get(trackId)).filter(Boolean);
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);

                    const mainArtistIdFromServer = fields['Artista'] || [];
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : mainArtistIdFromServer;
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";


                    return {
                        id: record.id,
                        title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                        artist: mainArtistName,
                        artistId: mainArtistId,
                        metascore: fields['Metascore'] || 0,
                        imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                        releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                        tracks: tracks, // Contém IDs e tipos de colaboração
                        totalDurationSeconds: totalDurationSeconds
                    };
                });
            };

            const formattedAlbums = formatReleases(albumsData.records);
            const formattedSingles = formatReleases(singlesData.records);

            const formattedPlayers = playersData.records.map(record => ({
                id: record.id, name: record.fields.Nome, artists: record.fields.Artistas || []
            }));

            console.log("Dados carregados com sucesso.");
            return {
                allArtists: artistsList,
                albums: formattedAlbums,
                singles: formattedSingles,
                players: formattedPlayers,
                musicas: Array.from(musicasMap.values())
            };

        } catch (error) {
            console.error("Falha GERAL ao carregar dados:", error);
            return { allArtists: [], albums: [], singles: [], players: [], musicas: [] };
        }
    }

    /**
     * Coloca os dados carregados no banco de dados local 'db'
     * (VERSÃO CORRIGIDA E SIMPLIFICADA)
     */
    const initializeData = (data) => {
         try {
            // Popula diretamente com os dados formatados do loadAllData
            db.artists = data.allArtists || [];
            db.albums = [...(data.albums || []), ...(data.singles || [])]; // Combina releases
            db.players = data.players || [];
            db.songs = data.musicas || []; // Usa a lista completa de músicas diretamente

            // Adiciona streams aleatórios às músicas (se já não tiverem)
            // e garante que artistIds seja um array
            // Busca a capa do álbum correspondente e adiciona à música
            db.songs.forEach(song => {
                if (!song.streams) {
                    song.streams = Math.floor(Math.random() * 25000000) + 50000;
                }
                // Garante que artistIds é um array
                if (!Array.isArray(song.artistIds)) {
                     song.artistIds = song.artistIds ? [song.artistIds] : [];
                }

                // Encontra o álbum/single pai desta música
                 const parentAlbum = db.albums.find(a => a.tracks.some(t => t.id === song.id));
                 song.albumId = parentAlbum ? parentAlbum.id : null; // Define albumId
                 song.cover = parentAlbum ? parentAlbum.imageUrl : 'https://i.imgur.com/AD3MbBi.png'; // Define cover
            });

            // Adiciona referência aos álbuns/singles dentro de cada artista (para openArtistDetail)
             db.artists.forEach(artist => {
                const artistReleases = db.albums.filter(a => a.artistId === artist.id);
                const thirtyMinutesInSeconds = 30 * 60;
                artist.albums = artistReleases.filter(a => a.totalDurationSeconds >= thirtyMinutesInSeconds);
                artist.singles = artistReleases.filter(a => a.totalDurationSeconds < thirtyMinutesInSeconds);
            });


            console.log("DB Inicializado:", db); // Log para verificar o db
         } catch (error) {
             console.error("Erro durante initializeData:", error);
             alert("Ocorreu um erro ao inicializar os dados. Verifique o console para detalhes.");
         }
    };


    /**
     * Recarrega todos os dados do Airtable e atualiza a UI
     */
    async function refreshAllData() {
        console.log("Atualizando dados...");
        const data = await loadAllData();
        initializeData(data);

        // Re-renderiza partes da UI
        renderRPGChart();
        renderChart('music');
        renderChart('album');
        renderParticipacoes(); // Atualiza a nova aba

        if (currentPlayer) {
            populateArtistSelector(currentPlayer.id);
        }
        populateFeatModalArtistSelect();

        console.log("Atualização concluída.");
    }


    // --- 2. NAVEGAÇÃO E UI ---

    const switchView = (viewId) => {
        allViews.forEach(v => v.classList.add('hidden'));

        if (viewId === 'studioView') {
            studioView.classList.remove('hidden');
            document.querySelector('.topbar').classList.add('hidden');
        } else if (viewId === 'mainView') {
            document.getElementById('mainView').classList.remove('hidden');
            document.querySelector('.topbar').classList.remove('hidden');
        } else {
            const viewToShow = document.getElementById(viewId);
            if(viewToShow) viewToShow.classList.remove('hidden');
            document.querySelector('.topbar').classList.add('hidden');
        }

        if (viewId !== viewHistory[viewHistory.length - 1]) {
             viewHistory.push(viewId);
        }
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (viewHistory.length > 1) {
            viewHistory.pop();
            const previousViewId = viewHistory[viewHistory.length - 1];
            switchView(previousViewId);
        }
    };
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

    const renderArtistsGrid = (containerId, artists) => {
        const container = document.getElementById(containerId);
        if (!container || !artists) return; // Checa se artists existe
        container.innerHTML = artists.map(artist => `<div class="artist-card" data-artist-name="${artist.name}"><img src="${artist.img || artist.imageUrl}" alt="${artist.name}"><h3>${artist.name}</h3></div>`).join('');
    };


    /** Formata string de artistas baseado nos IDs e tipo */
    function formatArtistString(artistIds, collabType) {
        if (!Array.isArray(artistIds)) return "Artista Desconhecido"; // Segurança
        const artistNames = artistIds.map(id => db.artists.find(a => a.id === id)?.name || null).filter(Boolean);
        if (artistNames.length === 0) return "Artista Desconhecido";
        if (artistNames.length === 1) return artistNames[0];

        if (collabType === 'Feat.' && artistNames.length >= 2) {
            return `${artistNames[0]} feat. ${artistNames.slice(1).join(', ')}`;
        }
        return artistNames.join(' & ');
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
            const cover = item.cover || item.imageUrl || 'https://i.imgur.com/AD3MbBi.png'; // Usa song.cover ou album.imageUrl
            const streams = type === 'music' ? (item.streams || 0) : (item.metascore || 0) * 10000;
            const albumId = type === 'music' ? item.albumId : item.id;
            // Usa o primeiro artista da lista para data-artist-name ou o artista do álbum
            const mainArtistName = type === 'music'
                 ? (db.artists.find(a => a.id === (item.artistIds || [])[0])?.name || 'Artista Desc.')
                 : item.artist;

            return `<div class="chart-item" data-id="${item.id}" data-type="${type}" data-artist-name="${mainArtistName}" data-album-id="${albumId}">
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
        if (!artist) {
            console.error("Artista não encontrado:", artistName);
            return;
        }
        activeArtist = artist;
        switchView('artistDetail');
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.imageUrl})`; // Usa imageUrl
        document.getElementById('detailName').textContent = artist.name;

        const topSongs = db.songs
            .filter(song => (song.artistIds || []).includes(artist.id))
            .sort((a, b) => (b.streams || 0) - (a.streams || 0))
            .slice(0, 5);

        document.getElementById('popularSongsList').innerHTML = topSongs.map((song, index) => {
             const artistString = formatArtistString(song.artistIds, song.collabType);
             return `<div class="song-row" data-album-id="${song.albumId}">
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


        const renderHorizontalList = (containerId, items) => {
            const listContainer = document.getElementById(containerId);
             if (!listContainer || !items) return;
            listContainer.innerHTML = items.map(item =>
                `<div class="album-card" data-album-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${item.title}">
                    <div class="album-title">${item.title}</div>
                    <div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div>
                </div>`
            ).join('');
        };

        const artistReleases = db.albums.filter(a => a.artistId === artist.id); // Usa artistId principal
        const thirtyMinutesInSeconds = 30 * 60;
        renderHorizontalList('albumsList', artistReleases.filter(a => a.totalDurationSeconds >= thirtyMinutesInSeconds));
        renderHorizontalList('singlesList', artistReleases.filter(a => a.totalDurationSeconds < thirtyMinutesInSeconds));
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
    };

    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.id === albumId);
        if (!album) {
            console.error("Álbum não encontrado:", albumId);
            return;
        }
        activeArtist = db.artists.find(a => a.id === album.artistId); // Usa artistId principal
        switchView('albumDetail');
        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        const totalMinutes = Math.floor((album.totalDurationSeconds || 0) / 60);
        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate || '2024-01-01').getFullYear()} • ${(album.tracks || []).length} músicas, ${totalMinutes} min`;

        const detailedTracks = db.songs.filter(song => song.albumId === albumId)
                                  .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

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


    const openDiscographyDetail = (type) => {
        if (!activeArtist) return;
        const artist = db.artists.find(a => a.name === activeArtist.name);
        if (!artist) return;

        const artistReleases = db.albums.filter(a => a.artistId === artist.id); // Usa artistId
        const thirtyMinutesInSeconds = 30 * 60;
        const items = type === 'albums'
            ? artistReleases.filter(a => a.totalDurationSeconds >= thirtyMinutesInSeconds)
            : artistReleases.filter(a => a.totalDurationSeconds < thirtyMinutesInSeconds);

        document.getElementById('discographyTypeTitle').textContent = type === 'albums' ? 'Todos os Álbuns' : 'Todos os Singles e EPs';
        const grid = document.getElementById('discographyGrid');
        grid.innerHTML = items.map(item => `
            <div class="album-card-grid" data-album-id="${item.id}">
                <img src="${item.imageUrl}" alt="${item.title}">
                <div class="album-title">${item.title}</div>
                <div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div>
            </div>`).join('');
        switchView('discographyDetail');
    };

    const handleSearch = () => { /* ... sem mudanças ... */ };
    const switchTab = (event, forceTabId = null) => { /* ... sem mudanças ... */ };
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

        // Filtra músicas que TEM artistIds e têm mais de 1 artista
        const colaboracoes = db.songs.filter(song => Array.isArray(song.artistIds) && song.artistIds.length > 1);


        if (colaboracoes.length === 0) {
            participacoesList.innerHTML = "<p>Nenhuma música com participação encontrada.</p>";
            return;
        }

        colaboracoes.sort((a,b) => (b.streams || 0) - (a.streams || 0));

        participacoesList.innerHTML = colaboracoes.map((song, index) => {
             const artistString = formatArtistString(song.artistIds, song.collabType);
             // Pega o nome do artista principal para data attribute
             const mainArtistName = db.artists.find(a => a.id === song.artistIds[0])?.name || '';

            return `<div class="chart-item" data-id="${song.id}" data-type="music" data-artist-name="${mainArtistName}" data-album-id="${song.albumId}">
                        <div class="chart-position">${index + 1}</div>
                        <img src="${song.cover}" class="chart-cover">
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

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const chartItem = target.closest('.chart-item');
        if (chartItem && !target.closest('.btn-action')) { // Verifica se não é botão de ação
             const { type, artistName, albumId, id } = chartItem.dataset;

             // Tratamento para clique em item da lista de participações
             if(chartItem.closest('#participacoesList')) {
                 openAlbumDetail(albumId); // Abre o álbum da música de participação
                 return;
             }
             // Tratamento para clique em item do Ranking RPG
             if (chartItem.classList.contains('rpg-chart-item')) {
                 openArtistDetail(artistName); return;
             }
             // Tratamento para Charts normais
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

    if (data) { // Só continua se os dados foram carregados
        initializeData(data);
        initializeStudio();

        if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
        if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

        renderRPGChart();
        setInterval(() => { renderRPGChart(); }, 30 * 1000);

        searchInput.addEventListener('input', handleSearch);

        const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        allNavs.forEach(nav => nav.addEventListener('click', switchTab));

        // Renderiza conteúdo inicial
        renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
        renderArtistsGrid('artistsGrid', db.artists);
        renderChart('music');
        renderChart('album');
        renderParticipacoes();
        setupCountdown('musicCountdownTimer', () => renderChart('music'));
        setupCountdown('albumCountdownTimer', () => renderChart('album'));

        document.getElementById('mainView').classList.remove('hidden');
        document.querySelector('.topbar').classList.remove('hidden');
        switchTab(null, 'homeSection');
    } else {
         // Exibe uma mensagem de erro se o loadAllData falhar completamente
         document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão e a configuração da API Key.</p></div>';
    }
     console.log("Aplicação Iniciada.");
});
