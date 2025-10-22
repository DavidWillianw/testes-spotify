document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null;
    let currentFeatTarget = null; // Guarda o botão/track que abriu o modal de feat

    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const studioView = document.getElementById('studioView');
    let viewHistory = ['mainView'];

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
                musicasMap.set(record.id, {
                    id: record.id, // Guarda o ID da música
                    title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0,
                    durationSeconds: record.fields['Duração'] || 0,
                    // Armazena array de IDs de artistas e o tipo
                    artistIds: record.fields['Artista'] || [], // <-- Array de IDs
                    collabType: record.fields['Tipo de Colaboração'] // <-- Novo campo
                });
            });

            const artistsMapById = new Map();
             const artistsList = artistsData.records.map(record => { // Guarda a lista completa também
                const artist = {
                    id: record.id,
                    name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || [],
                    RPGPoints: record.fields.RPGPoints || 0,
                    LastActive: record.fields.LastActive || null
                };
                 artistsMapById.set(artist.id, artist.name); // Mapa ID -> Nome
                return artist;
            });


            const formatReleases = (records) => {
                return records.map(record => {
                    const fields = record.fields;
                    const trackIds = fields['Músicas'] || [];
                    const tracks = trackIds.map(trackId => musicasMap.get(trackId)).filter(Boolean);
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    
                    // Pega o PRIMEIRO artista listado no Airtable como "artista principal" do álbum/single
                    const mainArtistId = (fields['Artista'] && fields['Artista'][0]) || null;
                    const mainArtistName = mainArtistId ? artistsMapById.get(mainArtistId) : "Artista Desconhecido";

                    return {
                        id: record.id,
                        title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                        artist: mainArtistName, // Mantém o artista principal aqui
                        artistId: mainArtistId, // Guarda o ID do principal
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
                // Retorna a lista completa de artistas também
                allArtists: artistsList,
                albums: formattedAlbums,
                singles: formattedSingles,
                players: formattedPlayers,
                musicas: Array.from(musicasMap.values()) // Retorna a lista completa de músicas
            };

        } catch (error) {
            console.error("Falha GERAL ao carregar dados:", error);
            return { allArtists: [], albums: [], singles: [], players: [], musicas: [] };
        }
    }

    /**
     * Coloca os dados carregados no banco de dados local 'db'
     */
    const initializeData = (data) => {
         try {
            db.artists = data.allArtists || []; // Guarda todos os artistas
            db.albums = [...(data.albums || []), ...(data.singles || [])]; // Combina releases
            db.players = data.players || [];
            db.songs = data.musicas || []; // Guarda todas as músicas detalhadas

            console.log("DB Inicializado:", db);
         } catch (error) {
             console.error("Erro durante initializeData:", error);
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
        // Repopula o modal de feats com a lista atualizada
        populateFeatModalArtistSelect();

        console.log("Atualização concluída.");
    }


    // --- 2. NAVEGAÇÃO E UI (sem alterações significativas, exceto Participações) ---

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

    const handleBack = () => { /* ... sem mudanças ... */ };
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));
    const renderArtistsGrid = (containerId, artists) => { /* ... sem mudanças ... */ };

    /** Formata string de artistas baseado nos IDs e tipo */
    function formatArtistString(artistIds, collabType) {
        const artistNames = artistIds.map(id => db.artists.find(a => a.id === id)?.name || 'Artista Desc.').filter(Boolean);
        if (artistNames.length === 0) return "Artista Desconhecido";
        if (artistNames.length === 1) return artistNames[0];

        // Se tipo for "Feat." e tiver 2+ artistas, assume o primeiro como principal
        if (collabType === 'Feat.' && artistNames.length >= 2) {
            return `${artistNames[0]} feat. ${artistNames.slice(1).join(', ')}`;
        }
        // Caso contrário (ou "Dueto/Grupo"), usa "&"
        return artistNames.join(' & ');
    }


    const renderChart = (type) => {
        const container = document.getElementById(`${type}ChartsList`);
        if (!container) return;

        const items = type === 'music'
            ? [...db.songs].sort((a, b) => b.streams - a.streams).slice(0, 50)
            : [...db.albums].sort((a, b) => (b.metascore || 0) - (a.metascore || 0)).slice(0, 50);

        container.innerHTML = items.map((item, index) => {
            const trends = ['up', 'down', 'new', 'same']; const trend = trends[Math.floor(Math.random() * trends.length)];
            let trendIcon = '';
            if (trend === 'up') trendIcon = `<i class="fas fa-caret-up trend-up"></i>`; else if (trend === 'down') trendIcon = `<i class="fas fa-caret-down trend-down"></i>`; else if (trend === 'new') trendIcon = `<span class="trend-new">NEW</span>`; else trendIcon = `<span>-</span>`;

            // --- ATUALIZADO PARA FEATS ---
            const title = item.title;
            const artistString = type === 'music' ? formatArtistString(item.artistIds || [], item.collabType) : item.artist; // Mostra feats na lista de músicas
            const cover = type === 'music' ? db.albums.find(a => a.id === item.albumId)?.imageUrl || 'https://i.imgur.com/AD3MbBi.png' : item.imageUrl; // Busca capa do álbum para a música
            const streams = type === 'music' ? item.streams : (item.metascore || 0) * 10000;
            const albumId = type === 'music' ? item.albumId : item.id;
            const mainArtistName = type === 'music' ? (db.artists.find(a=>a.id === item.artistIds[0])?.name || 'Artista Desc.') : item.artist; // Pega o primeiro artista para data-artist-name

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
        if (!artist) return;
        activeArtist = artist;
        switchView('artistDetail');
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;

        // --- ATUALIZADO PARA FEATS (Populares) ---
        const topSongs = db.songs
            // Inclui músicas onde o artista é UM DOS listados
            .filter(song => (song.artistIds || []).includes(artist.id))
            .sort((a, b) => b.streams - a.streams)
            .slice(0, 5);

        document.getElementById('popularSongsList').innerHTML = topSongs.map((song, index) => {
             const artistString = formatArtistString(song.artistIds, song.collabType);
             const cover = db.albums.find(a => a.id === song.albumId)?.imageUrl || 'https://i.imgur.com/AD3MbBi.png';
             return `<div class="song-row" data-album-id="${song.albumId}">
                        <div style="color: var(--text-secondary);">${index + 1}</div>
                        <div class="song-row-info">
                            <img class="song-row-cover" src="${cover}" alt="${song.title}">
                            <div>
                               <div class="song-row-title">${song.title}</div>
                               <div class="track-artist-feat">${artistString}</div>  
                            </div>
                        </div>
                        <div class="song-streams">${song.streams.toLocaleString('pt-BR')}</div>
                    </div>`;
            }).join('');


        const renderHorizontalList = (containerId, items) => { /* ... sem mudanças ... */ };
        const artistReleases = db.albums.filter(a => a.artistId === artist.id); // Filtra pelo artistId principal do release
        const thirtyMinutesInSeconds = 30 * 60;
        renderHorizontalList('albumsList', artistReleases.filter(a => a.totalDurationSeconds >= thirtyMinutesInSeconds));
        renderHorizontalList('singlesList', artistReleases.filter(a => a.totalDurationSeconds < thirtyMinutesInSeconds));
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
    };

    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.id === albumId);
        if (!album) return;
        activeArtist = db.artists.find(a => a.id === album.artistId); // Usa artistId principal
        switchView('albumDetail');
        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        const totalMinutes = Math.floor((album.totalDurationSeconds || 0) / 60);
        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate || '2024-01-01').getFullYear()} • ${(album.tracks || []).length} músicas, ${totalMinutes} min`;

        // --- ATUALIZADO PARA FEATS (Tracklist do Álbum) ---
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

    const openDiscographyDetail = (type) => { /* ... sem mudanças na lógica principal, usa a nova regra de 30min ... */ };
    const handleSearch = () => { /* ... sem mudanças ... */ };
    const switchTab = (event, forceTabId = null) => { /* ... sem mudanças ... */ };
    const setupCountdown = (timerId, callback) => { /* ... sem mudanças ... */ };


    // --- 3. SISTEMA DE RPG (BRIGA DE CHARTS - APENAS VISUALIZAÇÃO) ---

    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;
    const calculateSimulatedStreams = (points, lastActiveISO) => { /* ... sem mudanças ... */ };
    const computeChartData = (artistsArray) => { /* ... sem mudanças ... */ };
    function renderRPGChart() { /* ... sem mudanças (já estava sem botões) ... */ }
    // --- Funções handleRPGAction, performRPGAction, isOnCooldown REMOVIDAS ---


    // --- 4. SISTEMA DO ESTÚDIO (LOGIN E FORMULÁRIOS COM FEATS) ---

    function populateArtistSelector(playerId) { /* ... sem mudanças ... */ }
    function loginPlayer(playerId) { /* ... sem mudanças ... */ }
    function logoutPlayer() { /* ... sem mudanças ... */ }

     /** Preenche o dropdown do MODAL de Feat com todos os artistas */
     function populateFeatModalArtistSelect() {
        featArtistSelect.innerHTML = '<option value="" disabled selected>Selecione o artista...</option>';
        // Filtra para não incluir o artista principal (se já estiver selecionado no form)
        const mainArtistIdSingle = singleArtistSelect.value;
        const mainArtistIdAlbum = albumArtistSelect.value;
        
        db.artists.forEach(artist => {
            // Não deixa selecionar o mesmo artista do form principal
             if (artist.id !== mainArtistIdSingle && artist.id !== mainArtistIdAlbum) {
                const option = document.createElement('option');
                option.value = artist.id;
                option.textContent = artist.name;
                featArtistSelect.appendChild(option);
            }
        });
    }

    /** Abre o Modal de Feat */
    function openFeatModal(buttonElement) {
        currentFeatTarget = buttonElement; // Guarda qual botão/track chamou
        populateFeatModalArtistSelect(); // Repopula a lista
        featArtistSelect.value = ""; // Reseta seleção
        featTypeSelect.value = "Feat."; // Reseta tipo
        featModal.classList.remove('hidden');
    }

    /** Fecha o Modal de Feat */
    function closeFeatModal() {
        featModal.classList.add('hidden');
        currentFeatTarget = null;
    }

     /** Confirma a seleção do Feat e adiciona ao formulário */
     function confirmFeat() {
        const selectedArtistId = featArtistSelect.value;
        const selectedArtistName = featArtistSelect.options[featArtistSelect.selectedIndex].text;
        const selectedType = featTypeSelect.value;

        if (!selectedArtistId || !currentFeatTarget) {
            closeFeatModal();
            return;
        }

        const featListContainer = currentFeatTarget.dataset.target === 'single'
            ? document.getElementById('singleFeatList')
            : currentFeatTarget.closest('.track-list-item').querySelector('.feat-list');

        // Verifica se o artista já foi adicionado
        if (featListContainer.querySelector(`.feat-tag[data-artist-id="${selectedArtistId}"]`)) {
            alert(`${selectedArtistName} já foi adicionado como participação.`);
            closeFeatModal();
            return;
        }

        // Cria o "tag" visual do feat
        const featTag = document.createElement('div');
        featTag.className = 'feat-tag';
        featTag.dataset.artistId = selectedArtistId;
        featTag.dataset.collabType = selectedType; // Guarda o tipo selecionado
        featTag.innerHTML = `
            <span class="feat-type">${selectedType}</span>
            <span>${selectedArtistName}</span>
            <button type="button" class="remove-feat-btn"><i class="fas fa-times"></i></button>
        `;

        // Adiciona listener para remover o tag
        featTag.querySelector('.remove-feat-btn').addEventListener('click', () => {
            featTag.remove();
        });

        featListContainer.appendChild(featTag);
        closeFeatModal();
    }


    function initializeStudio() {
        // Popula dropdown de jogadores
        playerSelect.innerHTML = '<option value="" disabled selected>Selecione seu nome...</option>';
        db.players.forEach(player => { /* ... sem mudanças ... */ });

        // Login/Logout listeners
        loginButton.addEventListener('click', () => { /* ... sem mudanças ... */ });
        logoutButton.addEventListener('click', logoutPlayer);

        // Verifica login anterior
        const storedPlayerId = localStorage.getItem('spotifyRpg_playerId');
        if (storedPlayerId) loginPlayer(storedPlayerId);

        // Listeners das abas
        studioTabs.forEach(tab => { /* ... sem mudanças ... */ });

        // --- ATUALIZADO: Listeners para abrir o MODAL de Feat ---
        // Delegação de evento para os botões "+ Add Feat" que podem ser criados dinamicamente
        document.getElementById('studioView').addEventListener('click', (e) => {
            if (e.target.classList.contains('add-feat-btn') || e.target.closest('.add-feat-btn')) {
                 openFeatModal(e.target.closest('.add-feat-btn'));
            }
        });

        // Listeners do Modal
        confirmFeatBtn.addEventListener('click', confirmFeat);
        cancelFeatBtn.addEventListener('click', closeFeatModal);
        featModal.addEventListener('click', (e) => { // Fechar ao clicar fora
            if (e.target === featModal) closeFeatModal();
        });


        // Configura o formulário de Álbum/EP (Drag-and-Drop)
        initAlbumForm();
    }

    async function createAirtableRecord(tableName, fields) { /* ... sem mudanças ... */ }

    /** Processa o envio do formulário de NOVO SINGLE (ATUALIZADO COM FEATS) */
    async function handleSingleSubmit(event) {
        event.preventDefault();
        const submitButton = document.getElementById('submitNewSingle');
        submitButton.disabled = true;
        submitButton.textContent = 'Lançando...';

        try {
            const artistId = singleArtistSelect.value; // Artista Principal
            const singleTitle = document.getElementById('singleTitle').value;
            const singleCoverUrl = document.getElementById('singleCoverUrl').value;
            const trackName = document.getElementById('trackName').value;
            const trackDurationStr = document.getElementById('trackDuration').value;

            if (!artistId) throw new Error("Selecione um artista principal.");

            // --- PEGA OS FEATS ADICIONADOS ---
            const featTags = document.querySelectorAll('#singleFeatList .feat-tag');
            const featArtistIds = Array.from(featTags).map(tag => tag.dataset.artistId);
            // Pega o tipo do PRIMEIRO feat adicionado (ou default)
            const collabType = featTags.length > 0 ? featTags[0].dataset.collabType : "Principal";

            // Combina artista principal com feats
            const allArtistIds = [artistId, ...featArtistIds];
            // --- FIM FEATS ---

            const parts = trackDurationStr.split(':');
            const durationInSeconds = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
            if (isNaN(durationInSeconds)) throw new Error("Formato de duração inválido.");

            // 1. Criar a Música (com múltiplos artistas e tipo)
            const musicFields = {
                "Nome da Faixa": trackName, "Duração": durationInSeconds,
                "Nº da Faixa": 1,
                "Artista": allArtistIds, // <-- Array de IDs
                "Tipo de Colaboração": collabType // <-- Novo campo
            };
            const newSong = await createAirtableRecord('Músicas', musicFields);
            if (!newSong || !newSong.id) throw new Error("Falha ao criar a música.");

            // 2. Criar o Single (Artista principal ainda é só o primeiro)
            const singleFields = {
                "Nome do Single/EP": singleTitle,
                "Capa": [{ "url": singleCoverUrl }],
                "Músicas": [newSong.id],
                "Artista": [artistId], // <-- Mantém só o principal aqui
                "Data de Lançamento": new Date().toISOString().split('T')[0]
            };
            const newSingle = await createAirtableRecord('Singles e EPs', singleFields);
            if (!newSingle || !newSingle.id) throw new Error("Falha ao criar o single.");

            alert("Single lançado com sucesso! Atualizando...");
            newSingleForm.reset();
            document.getElementById('singleFeatList').innerHTML = ''; // Limpa feats
            await refreshAllData();

        } catch (error) {
            alert(`Erro ao lançar single: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Lançar Single';
        }
    }

    function initAlbumForm() { /* ... sem mudanças na inicialização do Sortable ... */ }

    /** Adiciona uma nova linha de input de faixa (ATUALIZADO COM FEAT) */
    function addNewTrackInput() {
        const trackCount = albumTracklistEditor.children.length + 1;
        const trackItem = document.createElement('div');
        trackItem.className = 'track-list-item';
        // Adiciona um ID único para cada track item para referenciar no modal
        trackItem.id = `track-item-${Date.now()}-${trackCount}`;

        // Inclui a seção de feat DENTRO de cada track-list-item
        trackItem.innerHTML = `
            <div class="track-main-row">
                <i class="fas fa-bars drag-handle"></i>
                <div class="track-inputs">
                    <span class="track-number">${trackCount}.</span>
                    <input type="text" class="album-track-name" placeholder="Nome da Faixa" required>
                    <input type="text" class="album-track-duration" placeholder="MM:SS" pattern="\\d{1,2}:\\d{2}" required>
                </div>
                <button type="button" class="delete-track-btn"><i class="fas fa-trash"></i></button>
            </div>
            <div class="feat-section">
                <div class="feat-list">
                    </div>
                 <button type="button" class="small-btn add-feat-btn" data-target="${trackItem.id}"><i class="fas fa-plus"></i> Add Feat</button>
            </div>
        `;
        albumTracklistEditor.appendChild(trackItem);
    }


    function updateTrackNumbers() { /* ... sem mudanças ... */ }

    /** Processa o envio do formulário de NOVO ÁLBUM/EP (ATUALIZADO COM FEATS) */
    async function handleAlbumSubmit(event) {
        event.preventDefault();
        const submitButton = document.getElementById('submitNewAlbum');
        submitButton.disabled = true;
        submitButton.textContent = 'Lançando...';

        try {
            const artistId = albumArtistSelect.value; // Artista Principal do Álbum
            const albumTitle = document.getElementById('albumTitle').value;
            const albumCoverUrl = document.getElementById('albumCoverUrl').value;

            if (!artistId) throw new Error("Selecione um artista principal.");

            const trackInputs = albumTracklistEditor.querySelectorAll('.track-list-item');
            if (trackInputs.length === 0) throw new Error("Adicione pelo menos uma faixa.");

            let trackPayloads = [];
            for (let i = 0; i < trackInputs.length; i++) {
                const trackEl = trackInputs[i];
                const trackName = trackEl.querySelector('.album-track-name').value;
                const durationStr = trackEl.querySelector('.album-track-duration').value;

                // --- PEGA OS FEATS DA FAIXA ---
                const featTags = trackEl.querySelectorAll('.feat-list .feat-tag');
                const featArtistIds = Array.from(featTags).map(tag => tag.dataset.artistId);
                const collabType = featTags.length > 0 ? featTags[0].dataset.collabType : "Principal";
                const allArtistIds = [artistId, ...featArtistIds]; // Combina principal + feats PARA A MÚSICA
                // --- FIM FEATS ---

                if (!trackName || !durationStr) throw new Error(`Preencha Nome e Duração da Faixa ${i + 1}.`);

                const parts = durationStr.split(':');
                const durationInSeconds = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
                if (isNaN(durationInSeconds)) throw new Error(`Duração inválida na Faixa ${i + 1}.`);

                trackPayloads.push({
                    "fields": {
                        "Nome da Faixa": trackName,
                        "Duração": durationInSeconds,
                        "Nº da Faixa": i + 1,
                        "Artista": allArtistIds, // <-- Array de IDs
                        "Tipo de Colaboração": collabType // <-- Tipo
                    }
                });
            }

            // 3. Criar todas as músicas (Batch)
            console.log("Criando músicas...", trackPayloads);
            const newSongs = await batchCreateAirtableRecords('Músicas', trackPayloads);
            if (!newSongs || newSongs.length === 0) throw new Error("Falha ao criar músicas.");
            const newSongIds = newSongs.map(song => song.id);

            // 4. Criar o Álbum (Artista principal ainda é só o primeiro)
            const albumFields = {
                "Nome do Álbum": albumTitle,
                "Capa do Álbum": [{ "url": albumCoverUrl }],
                "Músicas": newSongIds,
                "Artista": [artistId], // <-- Mantém só o principal aqui
                "Data de Lançamento": new Date().toISOString().split('T')[0]
            };
            console.log("Criando álbum...", albumFields);
            const newAlbum = await createAirtableRecord('Álbuns', albumFields);
            if (!newAlbum || !newAlbum.id) throw new Error("Falha ao criar o álbum.");

            alert("Álbum lançado com sucesso! Atualizando...");
            newAlbumForm.reset();
            albumTracklistEditor.innerHTML = '';
            addNewTrackInput();
            await refreshAllData();

        } catch (error) {
            alert(`Erro ao lançar álbum: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Lançar Álbum / EP';
        }
    }


    async function batchCreateAirtableRecords(tableName, records) { /* ... sem mudanças ... */ }

    // --- NOVA FUNÇÃO PARA RENDERIZAR PARTICIPAÇÕES ---
     function renderParticipacoes() {
        if (!participacoesList) return;

        const colaboracoes = db.songs.filter(song => (song.artistIds || []).length > 1);

        if (colaboracoes.length === 0) {
            participacoesList.innerHTML = "<p>Nenhuma música com participação encontrada.</p>";
            return;
        }

        // Ordena por streams (opcional)
        colaboracoes.sort((a,b) => b.streams - a.streams);

        participacoesList.innerHTML = colaboracoes.map((song, index) => {
             const artistString = formatArtistString(song.artistIds, song.collabType);
             const cover = db.albums.find(a => a.id === song.albumId)?.imageUrl || 'https://i.imgur.com/AD3MbBi.png';
             // Pega o nome do artista principal para data attribute
             const mainArtistName = db.artists.find(a => a.id === song.artistIds[0])?.name || '';

            return `<div class="chart-item" data-id="${song.id}" data-type="music" data-artist-name="${mainArtistName}" data-album-id="${song.albumId}">
                        <div class="chart-position">${index + 1}</div>
                        <img src="${cover}" class="chart-cover">
                        <div class="chart-info">
                            <div class="chart-title">${song.title}</div>
                            <div class="chart-artist">${artistString}</div>
                        </div>
                        <div class="chart-stats">
                            <div class="chart-streams">${song.streams.toLocaleString('pt-BR')}</div>
                        </div>
                   </div>`;
        }).join('');
    }


    // --- 5. INICIALIZAÇÃO GERAL ---

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const chartItem = target.closest('.chart-item');
        if (chartItem && !target.closest('.btn-action')) {
            const { type, artistName, albumId, id } = chartItem.dataset;
            if (chartItem.classList.contains('rpg-chart-item')) {
                 openArtistDetail(artistName); return;
            }
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
    const data = await loadAllData();
    initializeData(data);
    initializeStudio(); // Configura login, forms, modal

    if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
    if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

    renderRPGChart(); // Cria a seção e a tab do ranking
    setInterval(() => { renderRPGChart(); }, 30 * 1000);

    searchInput.addEventListener('input', handleSearch);

    // Adiciona listener DEPOIS que todas as tabs (incluindo RPG) foram criadas
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    allNavs.forEach(nav => nav.addEventListener('click', switchTab));

    // Renderiza conteúdo inicial
    renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
    renderArtistsGrid('artistsGrid', db.artists);
    renderChart('music');
    renderChart('album');
    renderParticipacoes(); // Renderiza a nova aba
    setupCountdown('musicCountdownTimer', () => renderChart('music'));
    setupCountdown('albumCountdownTimer', () => renderChart('album'));

    // Ajuste final da view inicial
    document.getElementById('mainView').classList.remove('hidden');
    document.querySelector('.topbar').classList.remove('hidden');
    switchTab(null, 'homeSection');

});
