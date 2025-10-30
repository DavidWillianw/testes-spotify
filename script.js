document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], singles: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null; // Sortable para o form NOVO
    let activeArtist = null;
    let currentFeatTarget = null;
    let viewHistory = [];
    let editingTrackItem = null; // Item da lista sendo editado no modal
    let previousMusicChartData = {};
    let previousAlbumChartData = {};
    let previousRpgChartData = {};
    let albumCountdownInterval = null;
    let existingTrackModalContext = 'album';

    // NOVAS VARIÁVEIS GLOBAIS PARA EDIÇÃO
    let editAlbumTracklistSortable = null; // Instância Sortable para o formulário de EDIÇÃO
    let activeTracklistEditor = null; // Referência para qual editor (novo ou edição) está ativo no momento

    // --- VARIÁVEIS DO PLAYER ---
    let audioElement = null;
    let musicPlayerView = null;
    let playerCloseBtn = null;
    let playerAlbumTitle = null;
    let playerCoverArt = null;
    let playerSongTitle = null;
    let playerArtistName = null;
    let playerSeekBar = null;
    let playerCurrentTime = null;
    let playerTotalTime = null;
    let playerShuffleBtn = null;
    let playerPrevBtn = null;
    let playerPlayPauseBtn = null;
    let playerNextBtn = null;
    let playerRepeatBtn = null;
    let currentSong = null;
    let currentQueue = [];
    let currentQueueIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 'none'; // 'none', 'all', 'one'

    // --- ELEMENTOS DO DOM ---
    let allViews, searchInput, studioView, loginPrompt, loggedInInfo, playerSelect,
        loginButton, logoutButton, studioLaunchWrapper, studioTabs, studioForms,
        newSingleForm, singleArtistSelect, singleReleaseDateInput, singleFeatList,
        newAlbumForm, albumArtistSelect, albumReleaseDateInput, albumIsDeluxeCheckbox, // <<< NOVO Deluxe
        albumTracklistEditor, // Editor do NOVO álbum
        featModal, featArtistSelect,
        featTypeSelect, confirmFeatBtn, cancelFeatBtn,
        trackTypeModal, trackTypeSelect, confirmTrackTypeBtn, cancelTrackTypeBtn,
        albumTrackModal, albumTrackModalTitle, openAddTrackModalBtn, // Botão do NOVO álbum
        albumTrackNameInput, albumTrackDurationInput, albumTrackTypeSelect, albumTrackIsBonusCheckbox, // <<< NOVO Bonus
        albumTrackFeatList, saveAlbumTrackBtn, cancelAlbumTrackBtn, editingTrackItemId,
        editingTrackExistingId,
        inlineFeatAdder, inlineFeatArtistSelect, inlineFeatTypeSelect,
        confirmInlineFeatBtn, cancelInlineFeatBtn, addInlineFeatBtn,
        editReleaseSection, editReleaseListContainer, editReleaseList, editReleaseForm,
        editReleaseId, editReleaseType, editReleaseTableName, editArtistNameDisplay,
        editReleaseTitle, editReleaseCoverUrl, editReleaseDate, editDeluxeGroup, editAlbumIsDeluxeCheckbox, // <<< NOVO Deluxe Edit
        cancelEditBtn, saveEditBtn,
        deleteConfirmModal, deleteReleaseName, deleteRecordId, deleteTableName,
        deleteTrackIds, cancelDeleteBtn, confirmDeleteBtn,
        toggleExistingSingle, newTrackInfoGroup, existingTrackGroup,
        existingTrackSelect, existingSingleTrackId, singleFeatSection,
        openExistingTrackModalBtn, // Botão do NOVO álbum
        existingTrackModal, existingTrackSearch,
        existingTrackResults, cancelExistingTrackBtn, editArtistFilterSelect,
        // NOVOS ELEMENTOS DO DOM PARA EDIÇÃO
        editAlbumTracklistEditor, // Editor do formulário de EDIÇÃO
        editTracklistActions, // Container dos botões de ação de EDIÇÃO
        openEditAddTrackModalBtn, // Botão Adicionar Nova Faixa (EDIÇÃO)
        openEditExistingTrackModalBtn; // Botão Usar Faixa Existente (EDIÇÃO)


    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70'; // Use sua chave real aqui

    const PREVIOUS_MUSIC_CHART_KEY = 'spotifyRpg_previousMusicChart';
    const PREVIOUS_ALBUM_CHART_KEY = 'spotifyRpg_previousAlbumChart';
    const PREVIOUS_RPG_CHART_KEY = 'spotifyRpg_previousRpgChart';

    // --- FUNÇÃO PARA INICIALIZAR ELEMENTOS DO DOM ---
    function initializeDOMElements() {
        console.log("Initializing DOM elements...");
        try {
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
            singleReleaseDateInput = document.getElementById('singleReleaseDate');
            singleFeatList = document.getElementById('singleFeatList');
            newAlbumForm = document.getElementById('newAlbumForm');
            albumArtistSelect = document.getElementById('albumArtistSelect');
            albumReleaseDateInput = document.getElementById('albumReleaseDate');
            albumIsDeluxeCheckbox = document.getElementById('albumIsDeluxe'); // <<< NOVO
            albumTracklistEditor = document.getElementById('albumTracklistEditor');
            featModal = document.getElementById('featModal');
            featArtistSelect = document.getElementById('featArtistSelect');
            featTypeSelect = document.getElementById('featTypeSelect');
            confirmFeatBtn = document.getElementById('confirmFeatBtn');
            cancelFeatBtn = document.getElementById('cancelFeatBtn');
            trackTypeModal = document.getElementById('trackTypeModal');
            trackTypeSelect = document.getElementById('trackTypeSelect');
            confirmTrackTypeBtn = document.getElementById('confirmTrackTypeBtn');
            cancelTrackTypeBtn = document.getElementById('cancelTrackTypeBtn');
            albumTrackModal = document.getElementById('albumTrackModal');
            albumTrackModalTitle = document.getElementById('albumTrackModalTitle');
            openAddTrackModalBtn = document.getElementById('openAddTrackModalBtn');
            albumTrackNameInput = document.getElementById('albumTrackNameInput');
            albumTrackDurationInput = document.getElementById('albumTrackDurationInput');
            albumTrackTypeSelect = document.getElementById('albumTrackTypeSelect');
            albumTrackIsBonusCheckbox = document.getElementById('albumTrackIsBonus'); // <<< NOVO
            albumTrackFeatList = document.getElementById('albumTrackFeatList');
            saveAlbumTrackBtn = document.getElementById('saveAlbumTrackBtn');
            cancelAlbumTrackBtn = document.getElementById('cancelAlbumTrackBtn');
            editingTrackItemId = document.getElementById('editingTrackItemId');
            editingTrackExistingId = document.getElementById('editingTrackExistingId');
            inlineFeatAdder = document.getElementById('inlineFeatAdder');
            inlineFeatArtistSelect = document.getElementById('inlineFeatArtistSelect');
            inlineFeatTypeSelect = document.getElementById('inlineFeatTypeSelect');
            confirmInlineFeatBtn = document.getElementById('confirmInlineFeatBtn');
            cancelInlineFeatBtn = document.getElementById('cancelInlineFeatBtn');
            addInlineFeatBtn = albumTrackModal?.querySelector('.add-inline-feat-btn');
            audioElement = document.getElementById('audioElement');
            musicPlayerView = document.getElementById('musicPlayer');
            playerCloseBtn = document.querySelector('.player-close-btn');
            playerAlbumTitle = document.getElementById('playerAlbumTitle');
            playerCoverArt = document.getElementById('playerCoverArt');
            playerSongTitle = document.getElementById('playerSongTitle');
            playerArtistName = document.getElementById('playerArtistName');
            playerSeekBar = document.getElementById('playerSeekBar');
            playerCurrentTime = document.getElementById('playerCurrentTime');
            playerTotalTime = document.getElementById('playerTotalTime');
            playerShuffleBtn = document.getElementById('playerShuffleBtn');
            playerPrevBtn = document.getElementById('playerPrevBtn');
            playerPlayPauseBtn = document.getElementById('playerPlayPauseBtn');
            playerNextBtn = document.getElementById('playerNextBtn');
            playerRepeatBtn = document.getElementById('playerRepeatBtn');
            editReleaseSection = document.getElementById('editReleaseSection');
            editReleaseListContainer = document.getElementById('editReleaseListContainer');
            editReleaseList = document.getElementById('editReleaseList');
            editReleaseForm = document.getElementById('editReleaseForm');
            editReleaseId = document.getElementById('editReleaseId');
            editReleaseType = document.getElementById('editReleaseType');
            editReleaseTableName = document.getElementById('editReleaseTableName');
            editArtistNameDisplay = document.getElementById('editArtistNameDisplay');
            editReleaseTitle = document.getElementById('editReleaseTitle');
            editReleaseCoverUrl = document.getElementById('editReleaseCoverUrl');
            editReleaseDate = document.getElementById('editReleaseDate');
            editDeluxeGroup = document.getElementById('editDeluxeGroup');             // <<< NOVO
            editAlbumIsDeluxeCheckbox = document.getElementById('editAlbumIsDeluxe'); // <<< NOVO
            cancelEditBtn = document.getElementById('cancelEditBtn');
            saveEditBtn = document.getElementById('saveEditBtn');
            deleteConfirmModal = document.getElementById('deleteConfirmModal');
            deleteReleaseName = document.getElementById('deleteReleaseName');
            deleteRecordId = document.getElementById('deleteRecordId');
            deleteTableName = document.getElementById('deleteTableName');
            deleteTrackIds = document.getElementById('deleteTrackIds');
            cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
            confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            toggleExistingSingle = document.getElementById('toggleExistingSingle');
            newTrackInfoGroup = document.getElementById('newTrackInfoGroup');
            existingTrackGroup = document.getElementById('existingTrackGroup');
            existingTrackSelect = document.getElementById('existingTrackSelect');
            existingSingleTrackId = document.getElementById('existingSingleTrackId');
            singleFeatSection = document.getElementById('singleFeatSection');
            openExistingTrackModalBtn = document.getElementById('openExistingTrackModalBtn');
            existingTrackModal = document.getElementById('existingTrackModal');
            existingTrackSearch = document.getElementById('existingTrackSearch');
            existingTrackResults = document.getElementById('existingTrackResults');
            cancelExistingTrackBtn = document.getElementById('cancelExistingTrackBtn');
            editArtistFilterSelect = document.getElementById('editArtistFilterSelect');

            // ADICIONAR NOVOS ELEMENTOS DE EDIÇÃO
            editAlbumTracklistEditor = document.getElementById('editAlbumTracklistEditor');
            editTracklistActions = document.getElementById('editTracklistActions');
            openEditAddTrackModalBtn = document.getElementById('openEditAddTrackModalBtn');
            openEditExistingTrackModalBtn = document.getElementById('openEditExistingTrackModalBtn');

            const playerElements = [audioElement, musicPlayerView, playerCloseBtn, playerPlayPauseBtn, playerSeekBar, playerNextBtn, playerPrevBtn];
            if (playerElements.some(el => !el)) {
                console.error("ERRO CRÍTICO: Elementos essenciais do PLAYER não foram encontrados!");
                return false;
            }

            // Checagem de elementos essenciais
            const essentialElements = [
                studioView, loginPrompt, newSingleForm, newAlbumForm, featModal,
                singleReleaseDateInput, albumReleaseDateInput, trackTypeModal,
                albumTrackModal, openAddTrackModalBtn, inlineFeatAdder, inlineFeatArtistSelect,
                confirmInlineFeatBtn, cancelInlineFeatBtn, addInlineFeatBtn,
                editReleaseSection, editReleaseListContainer, editReleaseList, editReleaseForm,
                cancelEditBtn, saveEditBtn,
                deleteConfirmModal, cancelDeleteBtn, confirmDeleteBtn,
                toggleExistingSingle, newTrackInfoGroup, existingTrackGroup, existingTrackSelect,
                openExistingTrackModalBtn, existingTrackModal, existingTrackSearch, existingTrackResults, cancelExistingTrackBtn, editArtistFilterSelect,
                editAlbumTracklistEditor, editTracklistActions, openEditAddTrackModalBtn, openEditExistingTrackModalBtn,
                albumIsDeluxeCheckbox, albumTrackIsBonusCheckbox, editDeluxeGroup, editAlbumIsDeluxeCheckbox // Checa novos elementos
            ];

            if (!allViews || allViews.length === 0 || essentialElements.some(el => !el)) {
                 const missingIds = essentialElements
                    .map((el, index) => el ? null : index) // Apenas para debug, pode remover
                    .filter(Boolean);
                console.error("ERRO CRÍTICO: Um ou mais elementos essenciais do HTML não foram encontrados!", { missingIds });
                document.body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Erro Interface</h1><p>Elementos essenciais não encontrados. Ver console.</p></div>';
                return false;
            }

            // Formata para datetime-local (YYYY-MM-DDTHH:MM)
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Ajusta para o fuso horário local
            now.setSeconds(0); // Zera segundos
            now.setMilliseconds(0); // Zera milissegundos
            const localISOTime = now.toISOString().slice(0, 16); // Pega "YYYY-MM-DDTHH:MM"

            if (singleReleaseDateInput) singleReleaseDateInput.value = localISOTime;
            if (albumReleaseDateInput) albumReleaseDateInput.value = localISOTime;

            console.log("DOM elements initialized.");
            return true;
        } catch (error) {
            console.error("Erro ao inicializar elementos do DOM:", error);
            document.body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Erro Interface</h1><p>Erro fatal ao buscar elementos da página. Verifique o console.</p></div>';
            return false;
        }
    }

    // --- 1. CARREGAMENTO DE DADOS ---
    async function fetchAllAirtablePages(baseUrl, fetchOptions) {
        let allRecords = [];
        let offset = null;
        do {
            const separator = baseUrl.includes('?') ? '&' : '?';
            const url = offset ? `${baseUrl}${separator}offset=${offset}` : baseUrl;
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Falha ao buscar ${url}: ${response.status} - ${errorText}`);
                throw new Error(`Falha na requisição para ${baseUrl}. Status: ${response.status}`);
            }
            const data = await response.json();
            if (data.records) {
                allRecords.push(...data.records);
            }
            offset = data.offset;
        } while (offset);
        return { records: allRecords };
    }

    async function loadAllData() {
        const artistsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists?filterByFormula=%7BArtista%20Principal%7D%3D1`;
        const albumsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Álbuns')}`;
        const musicasURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Músicas')}`;
        const singlesURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Singles e EPs')}`;
        const playersURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jogadores`;

        const fetchOptions = { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } };
        console.log("Carregando dados do Airtable...");
        try {
            const [artistsData, albumsData, musicasData, singlesData, playersData] = await Promise.all([
                fetchAllAirtablePages(artistsURL, fetchOptions),
                fetchAllAirtablePages(albumsURL, fetchOptions),
                fetchAllAirtablePages(musicasURL, fetchOptions),
                fetchAllAirtablePages(singlesURL, fetchOptions),
                fetchAllAirtablePages(playersURL, fetchOptions)
            ]);

            if (!playersData) console.warn("Falha ao carregar dados dos Jogadores. Continuando sem eles.");
            if (!artistsData || !albumsData || !musicasData || !singlesData) throw new Error('Falha ao carregar dados essenciais (Artistas, Álbuns, Músicas, Singles).');

            const musicasMap = new Map();
            (musicasData.records || []).forEach(record => {
                const fields = record.fields;
                const artistIds = Array.isArray(fields['Artista']) ? fields['Artista'] : [fields['Artista']].filter(Boolean);
                const albumLinks = fields['Álbuns'] || [];
                const singleLinks = fields['Singles e EPs'] || [];
                const parentReleaseId = (albumLinks.length > 0 ? albumLinks[0] : (singleLinks.length > 0 ? singleLinks[0] : null));

                musicasMap.set(record.id, {
                    id: record.id,
                    title: fields['Nome da Faixa'] || 'Faixa Desconhecida',
                    duration: fields['Duração'] ? new Date(fields['Duração'] * 1000).toISOString().substr(14, 5) : "0:00",
                    trackNumber: fields['Nº da Faixa'] || 0,
                    durationSeconds: fields['Duração'] || 0,
                    artistIds: artistIds,
                    collabType: fields['Tipo de Colaboração'],
                    albumId: parentReleaseId,
                    albumIds: albumLinks,
                    singleIds: singleLinks,
                    streams: fields.Streams || 0,
                    totalStreams: fields['Streams Totais'] || 0,
                    trackType: fields['Tipo de Faixa'] || 'B-side',
                    isBonusTrack: fields['Faixa Bônus?'] || false // <<< CARREGAR BONUS
                });
            });

            const artistsMapById = new Map();
            const artistsList = (artistsData.records || []).map(record => {
                const fields = record.fields;
                const artist = {
                    id: record.id,
                    name: fields.Name || 'Artista Desconhecido',
                    imageUrl: (fields['URL da Imagem']?.[0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: fields['Inspirações (Off)'] || [],
                    RPGPoints: fields.RPGPoints || 0,
                    LastActive: fields.LastActive || null
                };
                artistsMapById.set(artist.id, artist.name);
                return artist;
            });

            const formatReleases = (records, isAlbumTable) => {
                if (!records) return [];
                return records.map(record => {
                    const fields = record.fields;
                    const id = record.id;
                    const tracks = Array.from(musicasMap.values())
                        .filter(song => (isAlbumTable ? song.albumIds.includes(id) : song.singleIds.includes(id)))
                        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

                    const totalDuration = tracks.reduce((sum, track) => sum + (track.durationSeconds || 0), 0);
                    const totalAlbumStreams = tracks.reduce((sum, track) => sum + (track.totalStreams || 0), 0);

                    const artistId = Array.isArray(fields['Artista']) ? fields['Artista'][0] : (fields['Artista'] || null);
                    const artistName = artistId ? artistsMapById.get(artistId) : "Artista Desconhecido";
                    const imageFieldName = isAlbumTable ? 'Capa do Álbum' : 'Capa';
                    const imageUrl = (fields[imageFieldName]?.[0]?.url) || 'https://i.imgur.com/AD3MbBi.png';

                    const releaseDateISO = fields['Data de Lançamento'] || null;

                    let releaseType = 'single';
                    if (isAlbumTable) {
                        const IS_ALBUM_THRESHOLD_SECONDS = 30 * 60;
                        releaseType = totalDuration >= IS_ALBUM_THRESHOLD_SECONDS ? 'album' : 'single';
                    }

                    return {
                        id: id,
                        title: fields['Nome do Álbum'] || fields['Nome do Single/EP'] || 'Título Desconhecido',
                        artist: artistName,
                        artistId: artistId,
                        metascore: fields['Metascore'] || 0,
                        imageUrl: imageUrl,
                        releaseDate: releaseDateISO,
                        tracks: tracks,
                        trackIds: tracks.map(t => t.id),
                        totalDurationSeconds: totalDuration,
                        weeklyStreams: fields['Stream do album'] || 0,
                        totalStreams: totalAlbumStreams,
                        type: releaseType,
                        isDeluxe: fields['É Deluxe?'] || false, // <<< CARREGAR DELUXE
                        tableName: isAlbumTable ? 'Álbuns' : 'Singles e EPs'
                    };
                });
            };

            const formattedAlbums = formatReleases(albumsData.records, true);
            const formattedSingles = formatReleases(singlesData.records, false);

            const formattedPlayers = (playersData?.records || []).map(record => ({
                id: record.id,
                name: record.fields.Nome,
                password: record.fields.Senha,
                artists: record.fields.Artistas || []
            }));

            console.log("Dados do Airtable carregados e formatados.");
            return {
                allArtists: artistsList,
                albums: formattedAlbums,
                singles: formattedSingles,
                players: formattedPlayers,
                musicas: Array.from(musicasMap.values())
            };
        } catch (error) {
            console.error("Falha GERAL ao carregar dados do Airtable:", error);
            document.body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados. Tente recarregar a página ou contate o suporte.</p></div>';
            return null;
        }
    }

    const initializeData = (data) => {
        try {
            // Load previous chart data
            try {
                const prevMusic = localStorage.getItem(PREVIOUS_MUSIC_CHART_KEY);
                previousMusicChartData = prevMusic ? JSON.parse(prevMusic) : {};
                const prevAlbum = localStorage.getItem(PREVIOUS_ALBUM_CHART_KEY);
                previousAlbumChartData = prevAlbum ? JSON.parse(prevAlbum) : {};
                const prevRpg = localStorage.getItem(PREVIOUS_RPG_CHART_KEY);
                previousRpgChartData = prevRpg ? JSON.parse(prevRpg) : {};
                console.log("Dados de chart anteriores carregados do localStorage.");
            } catch (e) {
                console.warn("Erro ao carregar dados de chart anteriores do localStorage:", e);
                previousMusicChartData = {}; previousAlbumChartData = {}; previousRpgChartData = {};
            }

            // Map artists
            const artistsMapById = new Map();
            db.artists = (data.allArtists || []).map(artist => {
                const artistEntry = {
                    ...artist,
                    img: artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png',
                    albums: [],
                    singles: []
                };
                artistsMapById.set(artist.id, artist.name);
                return artistEntry;
            });

            // Map release dates
            const releaseDateMap = new Map();
            const allReleasesForDateMap = [...(data.albums || []), ...(data.singles || [])];
            allReleasesForDateMap.forEach(item => {
                if (item.id && item.releaseDate) {
                    releaseDateMap.set(item.id, item.releaseDate);
                }
            });

            // Process songs
            db.songs = (data.musicas || []).map(song => {
                const allLinkedIds = [...(song.albumIds || []), ...(song.singleIds || [])];
                let earliestDate = null;
                if (allLinkedIds.length > 0) {
                    const allDates = allLinkedIds.map(id => releaseDateMap.get(id)).filter(Boolean).map(dateStr => new Date(dateStr));
                    if (allDates.length > 0) {
                        const validDates = allDates.filter(d => !isNaN(d.getTime()));
                        if (validDates.length > 0) {
                            earliestDate = new Date(Math.min.apply(null, validDates));
                        }
                    }
                }
                const earliestDateString = earliestDate ? earliestDate.toISOString() : null;
                return {
                    ...song,
                    streams: song.streams || 0,
                    totalStreams: song.totalStreams || 0,
                    cover: 'https://i.imgur.com/AD3MbBi.png',
                    artist: artistsMapById.get((song.artistIds || [])[0]) || 'Artista Desconhecido',
                    parentReleaseDate: earliestDateString,
                    // isBonusTrack já vem do loadAllData
                };
            });

            // Process releases
            db.albums = [];
            db.singles = [];
            const allReleases = [...(data.albums || []), ...(data.singles || [])];
            allReleases.forEach(item => {
                (item.trackIds || []).forEach(trackId => {
                    const songInDb = db.songs.find(sDb => sDb.id === trackId);
                    if (songInDb) {
                        if (songInDb.albumId === item.id) {
                            songInDb.cover = item.imageUrl;
                        } else if (songInDb.cover === 'https://i.imgur.com/AD3MbBi.png' && (songInDb.albumIds.includes(item.id) || songInDb.singleIds.includes(item.id))) {
                            songInDb.cover = item.imageUrl;
                        }
                        if (!songInDb.albumId && (songInDb.albumIds.includes(item.id) || songInDb.singleIds.includes(item.id))) {
                            songInDb.albumId = item.id;
                        }
                        if (!songInDb.parentReleaseDate && item.releaseDate) {
                            console.warn(`Song ${songInDb.id} lacked parentReleaseDate, setting from ${item.id}`);
                            songInDb.parentReleaseDate = item.releaseDate;
                        }
                    }
                });

                const artistEntry = db.artists.find(a => a.id === item.artistId);
                if (item.type === 'album') {
                    db.albums.push(item);
                    if (artistEntry) { artistEntry.albums.push(item); }
                } else {
                    db.singles.push(item);
                    if (artistEntry) { artistEntry.singles.push(item); }
                }
                if (!artistEntry && item.artist !== "Artista Desconhecido") {
                    console.warn(`Artista ${item.artist} (ID: ${item.artistId}) para o lançamento ${item.title} (ID: ${item.id}) não encontrado na lista principal de artistas.`);
                }
            });

            // Assign players
            db.players = data.players || [];

            console.log(`DB Initialized: Artists: ${db.artists.length}, Albums: ${db.albums.length}, Singles/EPs: ${db.singles.length}, Songs: ${db.songs.length}, Players: ${db.players.length}`);
            return true;
        } catch (error) {
            console.error("ERRO CRÍTICO durante initializeData:", error);
            alert("Erro grave ao processar os dados carregados. A aplicação pode não funcionar corretamente.");
            return false;
        }
    };

    const saveChartDataToLocalStorage = (chartType) => {
        let currentChartData, storageKey, dataList;
        console.log(`Salvando dados do chart anterior para: ${chartType}`);
        const now = new Date();

        if (chartType === 'music') {
            storageKey = PREVIOUS_MUSIC_CHART_KEY;
            dataList = [...db.songs].filter(song => (song.streams || 0) > 0 && song.parentReleaseDate && new Date(song.parentReleaseDate) <= now).sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50);
            currentChartData = dataList.reduce((acc, item, index) => { acc[item.id] = index + 1; return acc; }, {});
            previousMusicChartData = currentChartData;
        } else if (chartType === 'album') {
            storageKey = PREVIOUS_ALBUM_CHART_KEY;
            dataList = [...db.albums, ...db.singles].filter(item => (item.weeklyStreams || 0) > 0 && item.releaseDate && new Date(item.releaseDate) <= now).sort((a, b) => (b.weeklyStreams || 0) - (a.weeklyStreams || 0)).slice(0, 50);
            currentChartData = dataList.reduce((acc, item, index) => { acc[item.id] = index + 1; return acc; }, {});
            previousAlbumChartData = currentChartData;
        } else if (chartType === 'rpg') {
            storageKey = PREVIOUS_RPG_CHART_KEY;
            dataList = computeChartData(db.artists);
            currentChartData = dataList.reduce((acc, item, index) => { acc[item.id] = index + 1; return acc; }, {});
            previousRpgChartData = currentChartData;
        } else {
            console.error("Tipo de chart inválido para salvar:", chartType);
            return;
        }
        try {
            localStorage.setItem(storageKey, JSON.stringify(currentChartData));
            console.log(`Chart ${chartType} salvo no localStorage.`);
        } catch (e) {
            console.error(`Erro ao salvar chart ${chartType} no localStorage:`, e);
        }
    };

    async function refreshAllData() {
        console.log("Atualizando todos os dados...");
        document.body.classList.add('loading');
        const data = await loadAllData();

        if (data && data.allArtists) {
            if (initializeData(data)) {
                console.log("Dados atualizados e processados localmente.");
                renderRPGChart();
                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10));
                renderChart('music');
                renderChart('album');

                if (currentPlayer) {
                    populateArtistSelector(currentPlayer.id);
                    if (document.querySelector('.studio-tab-btn[data-form="edit"]')?.classList.contains('active')) {
                        populateEditableReleases();
                        editReleaseForm?.classList.add('hidden');
                        editReleaseListContainer?.classList.remove('hidden');
                    }
                    if (toggleExistingSingle?.checked) {
                        populatePlayerTracks('existingTrackSelect');
                    }
                }

                const artistDetailView = document.getElementById('artistDetail');
                if (activeArtist && artistDetailView && !artistDetailView.classList.contains('hidden')) {
                    const refreshedArtistData = db.artists.find(a => a.id === activeArtist.id);
                    if (refreshedArtistData) {
                        openArtistDetail(refreshedArtistData.name);
                    } else {
                        console.warn("Artista ativo não encontrado após atualização, voltando.");
                        handleBack();
                    }
                }
                const albumDetailView = document.getElementById('albumDetail');
                const currentAlbumId = albumDetailView?.dataset.albumId;
                if (currentAlbumId && !albumDetailView.classList.contains('hidden')) {
                    const refreshedAlbumData = [...db.albums, ...db.singles].find(a => a.id === currentAlbumId);
                    if (refreshedAlbumData) {
                        openAlbumDetail(refreshedAlbumData.id);
                    } else {
                        console.warn("Álbum/Single ativo não encontrado após atualização, voltando.");
                        handleBack();
                    }
                }

                try {
                    attachNavigationListeners();
                } catch (listenerError) {
                    console.error("Erro ao reatribuir listeners de navegação após atualização:", listenerError);
                }

                document.body.classList.remove('loading');
                console.log("Atualização concluída.");
                return true;
            } else {
                console.error("Falha ao inicializar dados após atualização.");
                alert("Erro ao processar dados atualizados.");
                document.body.classList.remove('loading');
                return false;
            }
        } else {
            console.error("Falha ao carregar dados brutos durante a atualização.");
            alert("Não foi possível buscar as atualizações mais recentes.");
            document.body.classList.remove('loading');
            return false;
        }
    }


    // --- 2. NAVEGAÇÃO E UI ---
    const switchView = (viewId) => {
        console.log(`Switching to view: ${viewId}`);
        const currentView = document.querySelector('.page-view:not(.hidden)');
        const currentViewId = currentView ? currentView.id : null;

        if (currentViewId === 'albumDetail' && viewId !== 'albumDetail' && albumCountdownInterval) {
            console.log("Clearing album countdown interval.");
            clearInterval(albumCountdownInterval);
            albumCountdownInterval = null;
        }

        allViews.forEach(v => v.classList.add('hidden'));

        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0, 0);

            // --- Simplified History Management ---
            if (viewId === 'mainView') {
                console.log("Navigating to mainView, clearing history.");
                viewHistory = [];
            } else if (viewId !== 'studioView') {
                if (viewHistory.length === 0 || viewHistory[viewHistory.length - 1] !== viewId) {
                    console.log(`Pushing view to history: ${viewId}`);
                    viewHistory.push(viewId);
                } else {
                    console.log(`View ${viewId} is already the last in history, not pushing.`);
                }
            }
            console.log("Current view history after switch:", JSON.stringify(viewHistory));
            // --- End Simplified History Management ---

        } else {
            console.error(`View with ID "${viewId}" not found. Falling back to mainView.`);
            document.getElementById('mainView')?.classList.remove('hidden');
            viewHistory = [];
        }
    };

    function activateMainViewSection(sectionId) {
        document.querySelectorAll('#mainView .content-section').forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(sectionId);
        if (targetSection && document.getElementById('mainView')?.contains(targetSection)) {
            targetSection.classList.add('active');
            console.log(`Seção ativada em mainView: ${sectionId}`);
        } else {
            console.warn(`Seção com ID "${sectionId}" não encontrada dentro de mainView. Ativando homeSection como fallback.`);
            document.getElementById('homeSection')?.classList.add('active');
            return 'homeSection';
        }
        return sectionId;
    }

    const switchTab = (event, forceTabId = null) => {
        let targetTabId;
        if (forceTabId) {
            targetTabId = forceTabId;
            console.log(`Forcing switch to tab: ${targetTabId}`);
        } else if (event) {
            event.preventDefault();
            const clickedButton = event.target.closest('[data-tab]');
            if (!clickedButton) {
                console.log("switchTab: Clicked element lacks 'data-tab'.");
                return;
            }
            targetTabId = clickedButton.dataset.tab;
            console.log(`Switching to tab via click: ${targetTabId}`);
        } else {
            console.log("switchTab: Called without event or forceTabId.");
            return;
        }

        if (targetTabId === 'studioSection') {
            console.log("Switching to Studio view.");
            switchView('studioView');
            const activeStudioTabButton = document.querySelector('.studio-tab-btn.active');
            if (activeStudioTabButton?.dataset.form === 'edit') {
                populateEditableReleases();
                editReleaseListContainer?.classList.remove('hidden');
                editReleaseForm?.classList.add('hidden');
            } else {
                const currentlyActiveForm = document.querySelector('.studio-form-content.active');
                if (!currentlyActiveForm) {
                    document.getElementById('newSingleForm')?.classList.add('active');
                    document.querySelector('.studio-tab-btn[data-form="single"]')?.classList.add('active');
                }
            }
        } else {
            const mainViewElement = document.getElementById('mainView');
            if (mainViewElement?.classList.contains('hidden')) {
                console.log("Switching to Main view.");
                switchView('mainView');
            }
            console.log(`Activating section within Main view: ${targetTabId}`);
            targetTabId = activateMainViewSection(targetTabId);
        }

        console.log(`Updating active state for nav buttons [data-tab="${targetTabId}"]`);
        document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(button => button.classList.remove('active'));
        document.querySelectorAll(`.nav-tab[data-tab="${targetTabId}"], .bottom-nav-item[data-tab="${targetTabId}"]`).forEach(button => button.classList.add('active'));
    };

    const handleBack = () => {
        console.log("handleBack triggered. History before pop:", JSON.stringify(viewHistory));
        const currentViewElement = document.querySelector('.page-view:not(.hidden)');
        const currentViewId = currentViewElement ? currentViewElement.id : 'unknown';
        console.log(`Currently in view: ${currentViewId}`);

        if (currentViewId === 'albumDetail' && albumCountdownInterval) {
            console.log("Clearing album countdown.");
            clearInterval(albumCountdownInterval);
            albumCountdownInterval = null;
        }

        if (viewHistory.length > 0) {
            const poppedView = viewHistory.pop();
            console.log(`Popped current view (${poppedView}). History now: ${JSON.stringify(viewHistory)}`);
        } else {
            console.log("History was empty, cannot pop. Going to mainView.");
            switchView('mainView');
            return;
        }

        const previousViewId = viewHistory.length > 0 ? viewHistory[viewHistory.length - 1] : 'mainView';
        console.log(`Determined previous view ID (peek): ${previousViewId}.`);

        switchView(previousViewId);
    };

    const renderArtistsGrid = (containerId, artists) => {
        const container = document.getElementById(containerId);
        if (!container) { console.error(`Contêiner ${containerId} não encontrado.`); return; }
        if (!artists || artists.length === 0) { container.innerHTML = '<p class="empty-state">Nenhum artista.</p>'; return; }
        container.innerHTML = artists.map(artist => `
            <div class="artist-card" data-artist-name="${artist.name}">
                <img src="${artist.img || artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png'}" alt="${artist.name}" class="artist-card-img">
                <p class="artist-card-name">${artist.name}</p>
                <span class="artist-card-type">Artista</span>
            </div>`).join('');
    };

    function formatArtistString(artistIds, collabType) {
        if (!artistIds || artistIds.length === 0) return "Artista Desconhecido";
        const artistNames = artistIds.map(id => {
            const artist = db.artists.find(art => art.id === id);
            return artist ? artist.name : "Artista Desconhecido";
        });
        const mainArtist = artistNames[0];
        if (artistNames.length === 1) return mainArtist;
        const otherArtists = artistNames.slice(1).join(', ');
        return collabType === 'Dueto/Grupo' ? `${mainArtist} & ${otherArtists}` : `${mainArtist} (feat. ${otherArtists})`;
    }

    function getCoverUrl(parentReleaseId) {
        if (!parentReleaseId) return 'https://i.imgur.com/AD3MbBi.png';
        const release = [...db.albums, ...db.singles].find(r => r.id === parentReleaseId);
        return release ? release.imageUrl : 'https://i.imgur.com/AD3MbBi.png';
    }

    const renderChart = (type) => {
        let containerId, dataList, previousData;
        const now = new Date();

        if (type === 'music') {
            containerId = 'musicChartsList';
            dataList = [...db.songs].filter(song => (song.streams || 0) > 0 && song.parentReleaseDate && new Date(song.parentReleaseDate) <= now).sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50);
            previousData = previousMusicChartData;
        } else if (type === 'album') {
            containerId = 'albumChartsList';
            dataList = [...db.albums, ...db.singles].filter(item => (item.weeklyStreams || 0) > 0 && item.releaseDate && new Date(item.releaseDate) <= now).sort((a, b) => (b.weeklyStreams || 0) - (a.weeklyStreams || 0)).slice(0, 50);
            previousData = previousAlbumChartData;
        } else { console.error(`Tipo de chart inválido: ${type}`); return; }

        const container = document.getElementById(containerId);
        if (!container) { console.error(`Contêiner ${containerId} não encontrado.`); return; }
        if (!dataList || dataList.length === 0) { container.innerHTML = `<p class="empty-state">Nenhum item no chart.</p>`; return; }

        container.innerHTML = dataList.map((item, index) => {
            const currentRank = index + 1;
            const previousRank = previousData[item.id];
            let iconClass = 'fa-minus', trendClass = 'trend-stable';
            if (previousRank === undefined) { trendClass = 'trend-new'; }
            else if (currentRank < previousRank) { iconClass = 'fa-caret-up'; trendClass = 'trend-up'; }
            else if (currentRank > previousRank) { iconClass = 'fa-caret-down'; trendClass = 'trend-down'; }
            const indicatorHtml = `<span class="chart-rank-indicator ${trendClass}"><i class="fas ${iconClass}"></i></span>`;

            if (type === 'music') {
                const cover = item.cover !== 'https://i.imgur.com/AD3MbBi.png' ? item.cover : getCoverUrl(item.albumId);
                return `
                    <div class="chart-item" data-song-id="${item.id}">
                        ${indicatorHtml} <span class="chart-rank">${currentRank}</span>
                        <img src="${cover}" alt="${item.title}" class="chart-item-img">
                        <div class="chart-item-info">
                            <span class="chart-item-title">${item.title}</span>
                            <span class="chart-item-artist">${item.artist}</span>
                        </div>
                        <span class="chart-item-duration">${(item.streams || 0).toLocaleString('pt-BR')}</span>
                    </div>`;
            } else { // album
                return `
                    <div class="chart-item" data-album-id="${item.id}">
                        ${indicatorHtml} <span class="chart-rank">${currentRank}</span>
                        <img src="${item.imageUrl}" alt="${item.title}" class="chart-item-img">
                        <div class="chart-item-info">
                            <span class="chart-item-title">${item.title}</span>
                            <span class="chart-item-artist">${item.artist}</span>
                            <span class="release-type-badge ${item.type}" style="font-size: 9px; margin-left:0; margin-top: 3px;">${item.type === 'album' ? 'Álbum' : 'EP/Single'}</span>
                        </div>
                        <span class="chart-item-score">${(item.weeklyStreams || 0).toLocaleString('pt-BR')}</span>
                    </div>`;
            }
        }).join('');
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) { console.error(`Artista "${artistName}" não encontrado.`); handleBack(); return; }
        activeArtist = artist;
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;
        const now = new Date();
        const popularSongs = [...db.songs].filter(s => s.artistIds && s.artistIds.includes(artist.id) && (s.totalStreams || 0) > 0 && s.parentReleaseDate && new Date(s.parentReleaseDate) <= now).sort((a, b) => (b.totalStreams || 0) - (a.totalStreams || 0)).slice(0, 5);
        const popularContainer = document.getElementById('popularSongsList');
        popularContainer.innerHTML = popularSongs.length > 0 ? popularSongs.map((song, index) => `
            <div class="song-row" data-song-id="${song.id}">
                <span>${index + 1}</span>
                <div class="song-row-info">
                    <img src="${song.cover || getCoverUrl(song.albumId)}" alt="${song.title}" class="song-row-cover">
                    <span class="song-row-title">${song.title}</span>
                </div>
                <span class="song-streams">${(song.totalStreams || 0).toLocaleString('pt-BR')}</span>
            </div>`).join('') : '<p class="empty-state-small">Nenhuma música popular.</p>';

        const nowSort = new Date();
        const customSort = (a, b) => {
            const dateA = new Date(a.releaseDate);
            const dateB = new Date(b.releaseDate);
            const isAFuture = dateA > nowSort;
            const isBFuture = dateB > nowSort;
            if (isAFuture && isBFuture) { return dateA - dateB; }
            else if (isAFuture) { return -1; }
            else if (isBFuture) { return 1; }
            else { return dateB - dateA; }
        };

        const albumsContainer = document.getElementById('albumsList');
        const sortedAlbums = (artist.albums || []).sort(customSort);
        albumsContainer.innerHTML = sortedAlbums.map(album => {
            const titleDisplay = album.title + (album.isDeluxe ? " (Deluxe)" : ""); // <<< Deluxe Indicator
            return `
                <div class="scroll-item" data-album-id="${album.id}">
                    <img src="${album.imageUrl}" alt="${album.title}">
                    <p>${titleDisplay}</p>
                    <span>${new Date(album.releaseDate).getFullYear()}</span>
                </div>`;
        }).join('') || '<p class="empty-state-small">Nenhum álbum.</p>';

        const singlesContainer = document.getElementById('singlesList');
        const sortedSingles = (artist.singles || []).sort(customSort);
        singlesContainer.innerHTML = sortedSingles.map(single => `
            <div class="scroll-item" data-album-id="${single.id}">
                <img src="${single.imageUrl}" alt="${single.title}">
                <p>${single.title}</p>
                <span>${new Date(single.releaseDate).getFullYear()}</span>
            </div>`).join('') || '<p class="empty-state-small">Nenhum single/EP.</p>';

        const recommended = [...db.artists].filter(a => a.id !== artist.id).sort(() => 0.5 - Math.random()).slice(0, 5);
        renderArtistsGrid('recommendedGrid', recommended);
        switchView('artistDetail');
    };

    const openAlbumDetail = (albumId) => {
        const album = [...db.albums, ...db.singles].find(a => a.id === albumId);
        if (!album) { console.error(`Lançamento ID "${albumId}" não encontrado.`); handleBack(); return; }
        const albumDetailView = document.getElementById('albumDetail');
        if (albumDetailView) albumDetailView.dataset.albumId = albumId;
        if (albumCountdownInterval) { clearInterval(albumCountdownInterval); albumCountdownInterval = null; }

        const countdownContainer = document.getElementById('albumCountdownContainer');
        const normalInfoContainer = document.getElementById('albumNormalInfoContainer');
        const tracklistContainer = document.getElementById('albumTracklist');
        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;

        // <<< Deluxe Indicator in Title >>>
        let displayTitle = album.title;
        if (album.isDeluxe) {
            displayTitle += " (Deluxe Version)";
        }
        document.getElementById('albumDetailTitle').textContent = displayTitle;

        const releaseDate = new Date(album.releaseDate);
        const now = new Date();
        const isPreRelease = releaseDate > now;
        const artistObj = db.artists.find(a => a.id === album.artistId);

        if (isPreRelease) {
            normalInfoContainer?.classList.add('hidden');
            countdownContainer?.classList.remove('hidden');
            const releaseDateStr = releaseDate.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            document.getElementById('albumCountdownReleaseDate').textContent = releaseDateStr;
            startAlbumCountdown(album.releaseDate, 'albumCountdownTimer');
            tracklistContainer.innerHTML = (album.tracks || []).map(track => {
                const fullSong = db.songs.find(s => s.id === track.id);
                let isAvailable = false;
                const preReleaseAvailableTypes = ['Title Track', 'Pre-release Single'];
                if (fullSong) {
                    const hasSongReleased = fullSong.parentReleaseDate && new Date(fullSong.parentReleaseDate) <= now;
                    const isDesignatedPreRelease = preReleaseAvailableTypes.includes(fullSong.trackType);
                    isAvailable = hasSongReleased || isDesignatedPreRelease;
                }
                const artistName = formatArtistString(track.artistIds, track.collabType);
                const trackNumDisplay = track.trackNumber ? track.trackNumber : '?';
                const isBonus = fullSong ? fullSong.isBonusTrack : (track.isBonusTrack || false); // <<< Bonus Check
                let bonusIndicator = isBonus ? ' <span class="bonus-track-indicator">(Bonus Track)</span>' : ''; // <<< Bonus Indicator

                if (isAvailable) {
                    return `
                        <div class="track-row available ${isBonus ? 'bonus' : ''}" data-song-id="${track.id}">
                            <span class="track-number">${trackNumDisplay}</span>
                            <div class="track-info">
                                <span class="track-title">${track.title}${bonusIndicator}</span>
                                <span class="track-artist-feat">${artistName}</span>
                            </div>
                            <span class="track-duration">${track.duration}</span>
                        </div>`;
                } else {
                    return `
                        <div class="track-row unavailable ${isBonus ? 'bonus' : ''}">
                            <span class="track-number">${trackNumDisplay}</span>
                            <div class="track-info">
                                <span class="track-title">${track.title}${bonusIndicator}</span>
                                <span class="track-artist-feat">${artistName}</span>
                            </div>
                            <span class="track-duration"><i class="fas fa-lock"></i></span>
                        </div>`;
                }
            }).join('') || '<p class="empty-state-small">Tracklist não revelada.</p>';
        } else {
            normalInfoContainer?.classList.remove('hidden');
            countdownContainer?.classList.add('hidden');
            const releaseYear = releaseDate.getFullYear();
            const totalAlbumStreamsFormatted = (album.totalStreams || 0).toLocaleString('pt-BR');
            document.getElementById('albumDetailInfo').innerHTML = `Por <strong class="artist-link" data-artist-name="${artistObj ? artistObj.name : ''}">${album.artist}</strong> • ${releaseYear} • ${totalAlbumStreamsFormatted} streams totais`;
            tracklistContainer.innerHTML = (album.tracks || []).map(song => {
                const fullSong = db.songs.find(s => s.id === song.id);
                const isBonus = fullSong ? fullSong.isBonusTrack : (song.isBonusTrack || false);
                let bonusIndicator = isBonus ? ' <span class="bonus-track-indicator">(Bonus Track)</span>' : '';
                const artistName = formatArtistString(song.artistIds, song.collabType);
                const streams = (song.totalStreams || 0);
                const trackNumDisplay = song.trackNumber ? song.trackNumber : '?';
                return `
                    <div class="track-row ${isBonus ? 'bonus' : ''}" data-song-id="${song.id}">
                        <span class="track-number">${trackNumDisplay}</span>
                        <div class="track-info">
                            <span class="track-title">${song.title}${bonusIndicator}</span>
                            <span class="track-artist-feat">${artistName}</span>
                        </div>
                        <span class="track-duration">${streams.toLocaleString('pt-BR')}</span>
                    </div>`;
            }).join('') || '<p class="empty-state-small">Nenhuma faixa encontrada.</p>';
        }
        switchView('albumDetail');
    };

    const openDiscographyDetail = (type) => {
        if (!activeArtist) { console.error("Nenhum artista ativo."); handleBack(); return; }
        const nowSort = new Date();
        const customSort = (a, b) => {
            const dateA = new Date(a.releaseDate);
            const dateB = new Date(b.releaseDate);
            const isAFuture = dateA > nowSort;
            const isBFuture = dateB > nowSort;
            if (isAFuture && isBFuture) { return dateA - dateB; }
            else if (isAFuture) { return -1; }
            else if (isBFuture) { return 1; }
            else { return dateB - dateA; }
        };
        const data = (type === 'albums') ? (activeArtist.albums || []).sort(customSort) : (activeArtist.singles || []).sort(customSort);
        const title = (type === 'albums') ? `Álbuns de ${activeArtist.name}` : `Singles & EPs de ${activeArtist.name}`;
        document.getElementById('discographyTypeTitle').textContent = title;
        const grid = document.getElementById('discographyGrid');
        grid.innerHTML = data.map(item => {
            const isAlbum = item.type === 'album';
            const isDeluxe = isAlbum && item.isDeluxe;
            let titleDisplay = item.title + (isDeluxe ? " (Deluxe)" : ""); // <<< Deluxe Indicator
            return `
                <div class="scroll-item" data-album-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${item.title}">
                    <p>${titleDisplay}</p>
                    <span>${new Date(item.releaseDate).getFullYear()}</span>
                </div>`;
        }).join('') || '<p class="empty-state">Nenhum lançamento.</p>';
        switchView('discographyDetail');
    };

    const handleSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            switchTab(null, 'homeSection');
            return;
        }
        const resultsContainer = document.getElementById('searchResults');
        const noResultsElement = document.getElementById('noResults');
        if (!resultsContainer || !noResultsElement) {
            console.error("Elementos de resultados da busca não encontrados.");
            return;
        }
        const filteredArtists = db.artists.filter(a => a.name.toLowerCase().includes(query));
        const filteredAlbums = [...db.albums, ...db.singles].filter(a => a.title.toLowerCase().includes(query));
        let html = '';
        let resultCount = 0;
        if (filteredArtists.length > 0) {
            html += '<h3 class="section-title">Artistas</h3>';
            html += filteredArtists.map(a => {
                resultCount++;
                return `
                    <div class="artist-card" data-artist-name="${a.name}">
                        <img src="${a.img}" alt="${a.name}" class="artist-card-img">
                        <p class="artist-card-name">${a.name}</p>
                        <span class="artist-card-type">Artista</span>
                    </div>`;
            }).join('');
        }
        if (filteredAlbums.length > 0) {
            html += '<h3 class="section-title">Álbuns & Singles</h3>';
            html += filteredAlbums.map(al => {
                resultCount++;
                // <<< Deluxe Indicator for Search Results >>>
                const isAlbum = al.type === 'album';
                const isDeluxe = isAlbum && al.isDeluxe;
                let titleDisplay = al.title + (isDeluxe ? " (Deluxe)" : "");
                return `
                    <div class="artist-card" data-album-id="${al.id}">
                        <img src="${al.imageUrl}" alt="${al.title}" class="artist-card-img">
                        <p class="artist-card-name">${titleDisplay}</p>
                        <span class="artist-card-type">${al.artist}</span>
                    </div>`;
            }).join('');
        }
        resultsContainer.innerHTML = html;
        if (resultCount > 0) {
            noResultsElement.classList.add('hidden');
            resultsContainer.classList.remove('hidden');
        } else {
            noResultsElement.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
        }
        switchTab(null, 'searchSection');
    };

    const setupCountdown = (timerId, chartType) => {
        const timerElement = document.getElementById(timerId);
        if (!timerElement) {
            console.warn(`Elemento de timer com ID "${timerId}" não encontrado.`);
            return;
        }
        const calculateTargetDate = () => {
            const now = new Date();
            const target = new Date(now);
            if (chartType === 'rpg') {
                target.setUTCDate(now.getUTCDate() + 1);
                target.setUTCHours(0, 0, 0, 0);
            } else {
                let daysUntilMonday = (1 - now.getDay() + 7) % 7;
                if (daysUntilMonday === 0 && (now.getUTCHours() > 0 || now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0)) {
                    daysUntilMonday = 7;
                } else if (daysUntilMonday === 0 && now.getUTCHours() === 0 && now.getUTCMinutes() === 0 && now.getUTCSeconds() === 0) {
                    daysUntilMonday = 7;
                }
                target.setUTCDate(now.getUTCDate() + daysUntilMonday);
                target.setUTCHours(0, 0, 0, 0);
            }
            return target;
        };
        let targetDate = calculateTargetDate();
        const updateTimerDisplay = (distance) => {
            if (distance < 0) {
                timerElement.textContent = `Atualizando...`;
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            const format = (num) => (num < 10 ? '0' + num : num);
            if (chartType === 'rpg') {
                timerElement.textContent = `${format(hours)}h ${format(minutes)}m ${format(seconds)}s`;
            } else {
                timerElement.textContent = `${format(days)}d ${format(hours)}h ${format(minutes)}m ${format(seconds)}s`;
            }
        };
        const intervalId = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;
            if (distance < 0) {
                console.log(`Timer ${timerId} (Chart: ${chartType}) atingiu zero. Salvando dados anteriores e recalculando.`);
                saveChartDataToLocalStorage(chartType);
                targetDate = calculateTargetDate();
                if (chartType === 'music') renderChart('music');
                else if (chartType === 'album') renderChart('album');
                else if (chartType === 'rpg') renderRPGChart();
                updateTimerDisplay(targetDate.getTime() - new Date().getTime());
                return;
            }
            updateTimerDisplay(distance);
        }, 1000);
        updateTimerDisplay(targetDate.getTime() - new Date().getTime());
    };

    function startAlbumCountdown(targetDateISO, containerId) {
        if (albumCountdownInterval) {
            clearInterval(albumCountdownInterval);
            console.log("Intervalo de contagem regressiva do álbum anterior limpo antes de iniciar novo.");
        }
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contêiner de contagem regressiva com ID "${containerId}" não encontrado.`);
            return;
        }
        const targetTime = new Date(targetDateISO).getTime();
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetTime - now;
            if (distance < 0) {
                container.innerHTML = '<p style="color: var(--spotify-green); font-weight: bold;">Lançado!</p>';
                if (albumCountdownInterval) {
                    clearInterval(albumCountdownInterval);
                    albumCountdownInterval = null;
                }
                const currentAlbum = [...db.albums, ...db.singles].find(a => a.releaseDate === targetDateISO);
                const albumId = currentAlbum ? currentAlbum.id : null;
                const albumDetailView = document.getElementById('albumDetail');
                const isStillOnPage = albumId && albumDetailView && !albumDetailView.classList.contains('hidden') && albumDetailView.dataset.albumId === albumId;
                if (isStillOnPage) {
                    console.log("Contagem regressiva do álbum finalizada, atualizando a view...");
                    openAlbumDetail(albumId);
                } else {
                    console.log("Contagem regressiva do álbum finalizada, mas a view não pôde ser atualizada automaticamente.");
                }
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            const format = (num) => (num < 10 ? '0' + num : num);
            container.innerHTML = `
                <div class="countdown-item"><span>${format(days)}</span><label>Dias</label></div>
                <div class="countdown-item"><span>${format(hours)}</span><label>Horas</label></div>
                <div class="countdown-item"><span>${format(minutes)}</span><label>Minutos</label></div>
                <div class="countdown-item"><span>${format(seconds)}</span><label>Segundos</label></div>
            `;
        };
        updateTimer();
        albumCountdownInterval = setInterval(updateTimer, 1000);
        console.log("Novo intervalo de contagem regressiva do álbum iniciado:", albumCountdownInterval);
    }


    // --- 3. SISTEMA DE RPG ---
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;

    const calculateSimulatedStreams = (points, lastActiveISO) => {
        if (!lastActiveISO || !points || points <= 0) return 0;
        const now = new Date();
        const lastActiveDate = new Date(lastActiveISO);
        if (isNaN(lastActiveDate.getTime())) {
            console.warn(`Data 'LastActive' inválida encontrada: ${lastActiveISO}`);
            return 0;
        }
        const diffMilliseconds = Math.max(0, now - lastActiveDate);
        const diffHours = diffMilliseconds / (1000 * 60 * 60);
        const streamsPerDay = points * STREAMS_PER_POINT;
        const streamsPerHour = streamsPerDay / 24;
        return Math.floor(streamsPerHour * diffHours);
    };

    const computeChartData = (artistsArray) => {
        if (!artistsArray) return [];
        return artistsArray
            .map(artist => ({
                id: artist.id,
                name: artist.name,
                img: artist.img,
                streams: calculateSimulatedStreams(artist.RPGPoints, artist.LastActive),
                points: artist.RPGPoints || 0
            }))
            .sort((a, b) => (b.streams || 0) - (a.streams || 0))
            .slice(0, CHART_TOP_N);
    };

    function renderRPGChart() {
        const chartData = computeChartData(db.artists);
        const container = document.getElementById('artistsGrid');
        const previousData = previousRpgChartData;
        if (!container) {
            console.error("Contêiner 'artistsGrid' para o chart RPG não encontrado.");
            return;
        }
        if (chartData.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum artista no chart RPG no momento.</p>';
            return;
        }
        container.innerHTML = chartData.map((artist, index) => {
            const currentRank = index + 1;
            const previousRank = previousData[artist.id];
            let iconClass = 'fa-minus', trendClass = 'trend-stable';
            if (previousRank === undefined) { trendClass = 'trend-new'; }
            else if (currentRank < previousRank) { iconClass = 'fa-caret-up'; trendClass = 'trend-up'; }
            else if (currentRank > previousRank) { iconClass = 'fa-caret-down'; trendClass = 'trend-down'; }
            return `
                <div class="artist-card" data-artist-name="${artist.name}">
                    <span class="rpg-rank">#${currentRank}</span>
                    <span class="chart-rank-indicator rpg-indicator ${trendClass}">
                        <i class="fas ${iconClass}"></i>
                    </span>
                    <img src="${artist.img}" alt="${artist.name}" class="artist-card-img">
                    <p class="artist-card-name">${artist.name}</p>
                    <span class="artist-card-type">${(artist.streams || 0).toLocaleString('pt-BR')} streams</span>
                </div>`;
        }).join('');
    }


    // --- 4. SISTEMA DO ESTÚDIO ---
    function populateTracklistEditor(editorElement, tracks) {
        if (!editorElement) return;
        editorElement.innerHTML = '';
        if (!tracks || tracks.length === 0) { editorElement.innerHTML = '<p class="empty-state-small">Nenhuma faixa.</p>'; return; }
        const sortedTracks = [...tracks].sort((a, b) => (a.trackNumber || 99) - (b.trackNumber || 99));

        sortedTracks.forEach(track => {
            const fullSong = db.songs.find(s => s.id === track.id);
            if (!fullSong) { console.warn(`Dados completos não encontrados para faixa ${track.id}`); return; }
            const featsData = (fullSong.artistIds || []).slice(1).map(artistId => {
                const artist = db.artists.find(a => a.id === artistId);
                return { id: artistId, type: fullSong.collabType || 'Feat.', name: artist ? artist.name : '?' };
            });
            const newItem = document.createElement('div');
            newItem.className = 'track-list-item-display';
            newItem.dataset.itemId = `existing_${fullSong.id}`;
            newItem.dataset.existingSongId = fullSong.id;
            newItem.dataset.trackName = fullSong.title.replace(/ \(feat\. .+\)$/i, '');
            newItem.dataset.durationStr = fullSong.duration;
            newItem.dataset.trackType = fullSong.trackType;
            newItem.dataset.feats = JSON.stringify(featsData);
            newItem.dataset.isBonusTrack = fullSong.isBonusTrack; // <<< Store bonus status

            const isBonus = fullSong.isBonusTrack;
            let bonusIndicator = isBonus ? ' <span class="bonus-track-indicator">(Bônus)</span>' : '';
            const titleDisplay = `<span class="track-title-display" style="color: var(--spotify-green);">
                <i class="fas fa-link" style="font-size: 10px; margin-right: 5px;" title="Faixa Existente"></i>${fullSong.title}${bonusIndicator}
            </span>`;
            newItem.innerHTML = `
                <span class="track-number-display">${fullSong.trackNumber || '?'}</span>
                <i class="fas fa-bars drag-handle"></i>
                <div class="track-actions">
                    <button type="button" class="small-btn edit-track-btn" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button type="button" class="small-btn remove-track-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="track-info-display">
                    ${titleDisplay}
                    <div class="track-details-display">
                        <span class="duration">Duração: ${fullSong.duration}</span>
                        <span class="type">Tipo: ${fullSong.trackType}${isBonus ? ' (Bônus)' : ''}</span>
                    </div>
                    <div class="feat-list feat-list-display" style="margin-top:5px;">
                        ${featsData.map(f => `<span class="feat-tag-display">${f.type} ${f.name}</span>`).join('')}
                    </div>
                </div>`;
            editorElement.appendChild(newItem);
        });
        updateTrackNumbers(editorElement);
    }

    function initializeStudio() {
        console.log("Inicializando listeners do Estúdio...");
        loginButton?.addEventListener('click', () => {
            const username = document.getElementById('usernameInput')?.value;
            const password = document.getElementById('passwordInput')?.value;
            loginPlayer(username, password);
        });
        logoutButton?.addEventListener('click', logoutPlayer);
        studioTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const clickedTab = e.currentTarget;
                const formTarget = clickedTab.dataset.form;
                studioTabs.forEach(t => t.classList.remove('active'));
                studioForms.forEach(f => f.classList.remove('active'));
                clickedTab.classList.add('active');
                let targetElementId;
                if (formTarget === 'single') { targetElementId = 'newSingleForm'; }
                else if (formTarget === 'album') { targetElementId = 'newAlbumForm'; initAlbumForm(); }
                else if (formTarget === 'edit') {
                    targetElementId = 'editReleaseSection';
                    populateEditableReleases();
                    editReleaseListContainer?.classList.remove('hidden');
                    editReleaseForm?.classList.add('hidden');
                }
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) { targetElement.classList.add('active'); }
                else { console.error(`Elemento alvo ${targetElementId} não encontrado.`); }
            });
        });
        confirmFeatBtn?.addEventListener('click', confirmFeat);
        cancelFeatBtn?.addEventListener('click', closeFeatModal);
        newSingleForm?.addEventListener('click', (e) => {
            const addFeatButton = e.target.closest('.add-feat-btn[data-target="singleFeatList"]');
            if (addFeatButton) { openFeatModal(addFeatButton); }
        });
        saveAlbumTrackBtn?.addEventListener('click', saveAlbumTrack);
        cancelAlbumTrackBtn?.addEventListener('click', closeAlbumTrackModal);
        openAddTrackModalBtn?.addEventListener('click', () => {
            activeTracklistEditor = albumTracklistEditor;
            openAlbumTrackModal();
        });
        openExistingTrackModalBtn?.addEventListener('click', () => {
            activeTracklistEditor = albumTracklistEditor;
            openExistingTrackModal('album');
        });
        openEditAddTrackModalBtn?.addEventListener('click', () => {
            activeTracklistEditor = editAlbumTracklistEditor;
            openAlbumTrackModal();
        });
        openEditExistingTrackModalBtn?.addEventListener('click', () => {
            activeTracklistEditor = editAlbumTracklistEditor;
            openExistingTrackModal('album');
        });
        addInlineFeatBtn?.addEventListener('click', toggleInlineFeatAdder);
        confirmInlineFeatBtn?.addEventListener('click', confirmInlineFeat);
        cancelInlineFeatBtn?.addEventListener('click', cancelInlineFeat);
        albumTracklistEditor?.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-track-btn');
            const removeButton = e.target.closest('.remove-track-btn');
            const trackItem = e.target.closest('.track-list-item-display');
            if (editButton && trackItem) {
                activeTracklistEditor = albumTracklistEditor;
                openAlbumTrackModal(trackItem);
            } else if (removeButton && trackItem) {
                trackItem.remove();
                updateTrackNumbers(albumTracklistEditor);
            }
        });
        editAlbumTracklistEditor?.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-track-btn');
            const removeButton = e.target.closest('.remove-track-btn');
            const trackItem = e.target.closest('.track-list-item-display');
            if (editButton && trackItem) {
                activeTracklistEditor = editAlbumTracklistEditor;
                openAlbumTrackModal(trackItem);
            } else if (removeButton && trackItem) {
                trackItem.remove();
                updateTrackNumbers(editAlbumTracklistEditor);
            }
        });
        editReleaseList?.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-release-btn');
            const deleteButton = e.target.closest('.delete-release-btn');
            if (editButton) {
                const releaseId = editButton.dataset.releaseId;
                const releaseType = editButton.dataset.releaseType;
                openEditForm(releaseId, releaseType);
            } else if (deleteButton) {
                const releaseId = deleteButton.dataset.releaseId;
                const releaseType = deleteButton.dataset.releaseType;
                const tableName = deleteButton.dataset.releaseTable;
                const releaseTitle = deleteButton.closest('.edit-release-item')?.querySelector('.edit-release-title')?.textContent || 'este lançamento';
                const release = [...db.albums, ...db.singles].find(r => r.id === releaseId); // Find from combined list
                const trackIdsToDelete = release?.trackIds || [];
                openDeleteConfirmModal(releaseId, tableName, releaseTitle, trackIdsToDelete);
            }
        });
        editReleaseForm?.addEventListener('submit', handleUpdateRelease);
        cancelEditBtn?.addEventListener('click', () => {
            editReleaseForm?.classList.add('hidden');
            editReleaseListContainer?.classList.remove('hidden');
        });
        cancelDeleteBtn?.addEventListener('click', closeDeleteConfirmModal);
        confirmDeleteBtn?.addEventListener('click', handleDeleteRelease);
        editArtistFilterSelect?.addEventListener('change', populateEditableReleases);
        newSingleForm?.addEventListener('submit', handleSingleSubmit);
        newAlbumForm?.addEventListener('submit', handleAlbumSubmit);
        confirmTrackTypeBtn?.addEventListener('click', () => {
            const selectedType = trackTypeSelect.value;
            if (selectedType) { processSingleSubmission(selectedType); }
            else { alert("Selecione um tipo de faixa."); }
        });
        cancelTrackTypeBtn?.addEventListener('click', () => {
            trackTypeModal?.classList.add('hidden');
            const btn = document.getElementById('submitNewSingle');
            if (btn) { btn.disabled = false; btn.textContent = 'Lançar Single'; }
        });
        singleArtistSelect?.addEventListener('change', () => {
            if (toggleExistingSingle?.checked) { populatePlayerTracks('existingTrackSelect'); }
        });
        toggleExistingSingle?.addEventListener('change', () => toggleSingleFormMode(false));
        existingTrackSearch?.addEventListener('input', populateExistingTrackSearch);
        cancelExistingTrackBtn?.addEventListener('click', closeExistingTrackModal);
        existingTrackResults?.addEventListener('click', handleExistingTrackSelect);
        initAlbumForm();
        if (editAlbumTracklistEditor && typeof Sortable !== 'undefined') {
            if (editAlbumTracklistSortable) { editAlbumTracklistSortable.destroy(); }
            editAlbumTracklistSortable = Sortable.create(editAlbumTracklistEditor, {
                animation: 150, handle: '.drag-handle', onEnd: () => updateTrackNumbers(editAlbumTracklistEditor)
            });
        } else if (typeof Sortable === 'undefined') {
            console.warn("SortableJS não carregado para editor de edição.");
        }
        console.log("Listeners do Estúdio inicializados.");
    }

    function loginPlayer(username, password) {
        if (!username || !password) { alert("Insira usuário e senha."); return; }
        const foundPlayer = db.players.find(p => p.name.toLowerCase() === username.toLowerCase());
        if (foundPlayer && foundPlayer.password === password) {
            currentPlayer = foundPlayer;
            console.log(`Jogador ${currentPlayer.name} logado.`);
            document.getElementById('playerName').textContent = currentPlayer.name;
            loginPrompt?.classList.add('hidden');
            loggedInInfo?.classList.remove('hidden');
            studioLaunchWrapper?.classList.remove('hidden');
            populateArtistSelector(currentPlayer.id);
            if (document.querySelector('.studio-tab-btn[data-form="edit"]')?.classList.contains('active')) {
                populateEditableReleases();
            }
            populatePlayerTracks('existingTrackSelect');
        } else {
            alert("Usuário ou senha inválidos.");
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) passwordInput.value = '';
        }
    }

    function logoutPlayer() {
        console.log(`Jogador ${currentPlayer?.name} deslogado.`);
        currentPlayer = null;
        const playerNameElement = document.getElementById('playerName');
        if (playerNameElement) playerNameElement.textContent = '';
        loginPrompt?.classList.remove('hidden');
        loggedInInfo?.classList.add('hidden');
        studioLaunchWrapper?.classList.add('hidden');
        const usernameInput = document.getElementById('usernameInput');
        const passwordInput = document.getElementById('passwordInput');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (editReleaseList) editReleaseList.innerHTML = '<p class="empty-state-small">Faça login.</p>';
        if (editArtistFilterSelect) editArtistFilterSelect.innerHTML = '<option value="all">Todos</option>';
        if (singleArtistSelect) singleArtistSelect.innerHTML = '<option value="">Selecione...</option>';
        if (albumArtistSelect) albumArtistSelect.innerHTML = '<option value="">Selecione...</option>';
        if (existingTrackSelect) existingTrackSelect.innerHTML = '<option value="">Selecione Artista...</option>';
        editReleaseForm?.classList.add('hidden');
        editReleaseListContainer?.classList.remove('hidden');
        if (toggleExistingSingle) toggleExistingSingle.checked = false;
        toggleSingleFormMode(true);
        studioTabs.forEach(t => t.classList.remove('active'));
        studioForms.forEach(f => f.classList.remove('active'));
        document.querySelector('.studio-tab-btn[data-form="single"]')?.classList.add('active');
        document.getElementById('newSingleForm')?.classList.add('active');
    }

    function populateArtistSelector(playerId) {
        const player = db.players.find(p => p.id === playerId);
        if (!player) { console.warn(`Jogador ${playerId} não encontrado.`); return; }
        const playerArtistIds = player.artists || [];
        const optionsHtml = playerArtistIds.map(id => {
            const artist = db.artists.find(a => a.id === id);
            return artist ? `<option value="${artist.id}">${artist.name}</option>` : '';
        }).join('');
        if (singleArtistSelect) { singleArtistSelect.innerHTML = `<option value="">Selecione...</option>${optionsHtml}`; }
        if (albumArtistSelect) { albumArtistSelect.innerHTML = `<option value="">Selecione...</option>${optionsHtml}`; }
        if (editArtistFilterSelect) { editArtistFilterSelect.innerHTML = `<option value="all">Todos os Artistas</option>${optionsHtml}`; }
    }

    function populateArtistSelectForFeat(targetSelectElement) {
        let currentMainArtistId = null, selectElement = targetSelectElement;
        if (activeTracklistEditor === editAlbumTracklistEditor || editReleaseForm?.classList.contains('active')) {
            const artistName = document.getElementById('editArtistNameDisplay')?.textContent;
            const artist = db.artists.find(a => a.name === artistName);
            currentMainArtistId = artist ? artist.id : null;
            selectElement = inlineFeatArtistSelect;
        } else if (activeTracklistEditor === albumTracklistEditor || newAlbumForm?.classList.contains('active')) {
            currentMainArtistId = albumArtistSelect?.value;
            selectElement = inlineFeatArtistSelect;
        } else if (newSingleForm?.classList.contains('active')) {
            currentMainArtistId = singleArtistSelect?.value;
            selectElement = featArtistSelect;
        } else { selectElement = featArtistSelect; }

        if (!selectElement) { console.error("Select de feat não encontrado!"); return; }
        const featOptions = db.artists.filter(artist => artist.id !== currentMainArtistId).sort((a, b) => a.name.localeCompare(b.name)).map(artist => `<option value="${artist.id}">${artist.name}</option>`).join('');
        selectElement.innerHTML = featOptions || '<option value="">Nenhum outro artista</option>';
    }

    function openFeatModal(buttonElement) {
        const targetListId = buttonElement.dataset.target;
        currentFeatTarget = document.getElementById(targetListId);
        if (!currentFeatTarget) { console.error(`Alvo ${targetListId} não encontrado.`); return; }
        if (!featModal) { console.error("Modal Feat não encontrado."); return; }
        populateArtistSelectForFeat(featArtistSelect);
        featModal.classList.remove('hidden');
    }

    function closeFeatModal() {
        featModal?.classList.add('hidden');
        currentFeatTarget = null;
        if (featArtistSelect) featArtistSelect.innerHTML = '';
        if (featTypeSelect) featTypeSelect.value = 'Feat.';
    }

    function confirmFeat() {
        const artistId = featArtistSelect?.value;
        const selectedIndex = featArtistSelect?.selectedIndex;
        const artistName = (selectedIndex !== undefined && selectedIndex !== -1) ? featArtistSelect.options[selectedIndex].text : 'Desconhecido';
        const featType = featTypeSelect?.value;
        if (!artistId || !currentFeatTarget) { alert("Erro: Selecione um artista."); return; }
        const tag = document.createElement('span');
        tag.className = 'feat-tag';
        tag.textContent = `${featType} ${artistName}`;
        tag.dataset.artistId = artistId;
        tag.dataset.featType = featType;
        tag.dataset.artistName = artistName;
        tag.addEventListener('click', () => tag.remove());
        currentFeatTarget.appendChild(tag);
        closeFeatModal();
    }

    function toggleInlineFeatAdder() {
        if (!inlineFeatAdder || !addInlineFeatBtn) return;
        const isHidden = inlineFeatAdder.classList.contains('hidden');
        if (isHidden) {
            populateArtistSelectForFeat(inlineFeatArtistSelect);
            inlineFeatAdder.classList.remove('hidden');
            addInlineFeatBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar Feat';
        } else {
            inlineFeatAdder.classList.add('hidden');
            addInlineFeatBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Feat';
            if (inlineFeatArtistSelect) inlineFeatArtistSelect.innerHTML = '';
            if (inlineFeatTypeSelect) inlineFeatTypeSelect.value = 'Feat.';
        }
    }

    function confirmInlineFeat() {
        const artistId = inlineFeatArtistSelect?.value;
        const selectedIndex = inlineFeatArtistSelect?.selectedIndex;
        const artistName = (selectedIndex !== undefined && selectedIndex !== -1) ? inlineFeatArtistSelect.options[selectedIndex].text : 'Desconhecido';
        const featType = inlineFeatTypeSelect?.value;
        const targetList = albumTrackFeatList;
        if (!artistId || !targetList) { alert("Erro: Selecione um artista."); return; }
        const tag = document.createElement('span');
        tag.className = 'feat-tag';
        tag.textContent = `${featType} ${artistName}`;
        tag.dataset.artistId = artistId;
        tag.dataset.featType = featType;
        tag.dataset.artistName = artistName;
        tag.addEventListener('click', () => tag.remove());
        targetList.appendChild(tag);
        toggleInlineFeatAdder();
    }

    function cancelInlineFeat() {
        if (!inlineFeatAdder || !addInlineFeatBtn) return;
        inlineFeatAdder.classList.add('hidden');
        addInlineFeatBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Feat';
        if (inlineFeatArtistSelect) inlineFeatArtistSelect.innerHTML = '';
        if (inlineFeatTypeSelect) inlineFeatTypeSelect.value = 'Feat.';
    }

    function openAlbumTrackModal(itemToEdit = null) {
        if (!albumTrackModal || !albumTrackNameInput || !albumTrackDurationInput || !albumTrackTypeSelect || !albumTrackFeatList || !editingTrackItemId || !editingTrackExistingId || !albumTrackIsBonusCheckbox) {
            console.error("Elementos do modal de faixa não encontrados."); return;
        }
        albumTrackNameInput.value = '';
        albumTrackDurationInput.value = '';
        albumTrackTypeSelect.value = 'B-side';
        albumTrackFeatList.innerHTML = '';
        editingTrackItemId.value = '';
        editingTrackExistingId.value = '';
        albumTrackIsBonusCheckbox.checked = false; // <<< Reset Bonus
        editingTrackItem = null;
        inlineFeatAdder?.classList.add('hidden');
        if (addInlineFeatBtn) addInlineFeatBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Feat';
        albumTrackNameInput.disabled = false;
        albumTrackDurationInput.disabled = false;
        const featSectionElement = albumTrackFeatList.closest('.feat-section');
        if (featSectionElement) featSectionElement.classList.remove('hidden');

        if (itemToEdit) {
            editingTrackItem = itemToEdit;
            editingTrackItemId.value = itemToEdit.dataset.itemId || `temp_edit_${Date.now()}`;
            albumTrackNameInput.value = itemToEdit.dataset.trackName || '';
            albumTrackDurationInput.value = itemToEdit.dataset.durationStr || '';
            albumTrackTypeSelect.value = itemToEdit.dataset.trackType || 'B-side';
            albumTrackIsBonusCheckbox.checked = itemToEdit.dataset.isBonusTrack === 'true'; // <<< Populate Bonus
            const existingSongId = itemToEdit.dataset.existingSongId;
            const featsToPopulate = JSON.parse(itemToEdit.dataset.feats || '[]');
            if (!existingSongId) {
                albumTrackModalTitle.textContent = 'Editar Faixa (Nova)';
            } else {
                albumTrackModalTitle.textContent = 'Editar Faixa (Existente)';
                editingTrackExistingId.value = existingSongId;
            }
            try { featsToPopulate.forEach(f => { /* ... populate feat tags ... */ }); } catch (e) { console.error("Erro ao parsear feats:", e); }
        } else {
            albumTrackModalTitle.textContent = 'Adicionar Faixa (Nova)';
            editingTrackItemId.value = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            albumTrackIsBonusCheckbox.checked = false;
        }
        albumTrackModal.classList.remove('hidden');
    }

    function closeAlbumTrackModal() {
        albumTrackModal?.classList.add('hidden');
        editingTrackItem = null;
        if (editingTrackItemId) editingTrackItemId.value = '';
        if (editingTrackExistingId) editingTrackExistingId.value = '';
        inlineFeatAdder?.classList.add('hidden');
        if (addInlineFeatBtn) addInlineFeatBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Feat';
    }

    function saveAlbumTrack() {
        if (!activeTracklistEditor || !albumTrackNameInput || !albumTrackDurationInput || !albumTrackTypeSelect || !albumTrackFeatList || !editingTrackItemId || !editingTrackExistingId || !albumTrackIsBonusCheckbox) {
            console.error("Elementos para salvar faixa não encontrados."); return;
        }
        let existingSongId = editingTrackExistingId.value;
        const name = albumTrackNameInput.value.trim();
        const durationStr = albumTrackDurationInput.value.trim();
        const type = albumTrackTypeSelect.value;
        const isBonus = albumTrackIsBonusCheckbox.checked; // <<< Read Bonus
        const durationSec = parseDurationToSeconds(durationStr);
        const itemId = editingTrackItemId.value;
        const featTags = albumTrackFeatList.querySelectorAll('.feat-tag');
        const featsData = Array.from(featTags).map(tag => ({ id: tag.dataset.artistId, type: tag.dataset.featType, name: tag.dataset.artistName }));
        const featsJSON = JSON.stringify(featsData);

        if (!name || !durationStr || durationSec === 0) { alert("Nome e Duração (MM:SS) são obrigatórios."); return; }
        if (!type) { alert("Tipo de faixa é obrigatório."); return; }

        let targetElement = editingTrackItem || activeTracklistEditor.querySelector(`[data-item-id="${itemId}"]`);
        let linkBroken = false;
        if (existingSongId && editingTrackItem) {
            const originalName = editingTrackItem.dataset.trackName;
            const originalDuration = editingTrackItem.dataset.durationStr;
            const originalFeats = editingTrackItem.dataset.feats || '[]';
            if (name !== originalName || durationStr !== originalDuration || featsJSON !== originalFeats) {
                console.warn(`Modificação detectada em faixa existente (${existingSongId}). Quebrando vínculo.`);
                alert(`Atenção: Você modificou uma faixa existente. Ela será salva como uma NOVA faixa.`);
                existingSongId = null;
                linkBroken = true;
            }
        }

        if (targetElement) { // Editing
            console.log(`Editando item ${itemId}. Bônus: ${isBonus}`);
            targetElement.dataset.trackName = name;
            targetElement.dataset.durationStr = durationStr;
            targetElement.dataset.feats = featsJSON;
            targetElement.dataset.trackType = type;
            targetElement.dataset.isBonusTrack = isBonus; // <<< Update dataset
            if (linkBroken) { delete targetElement.dataset.existingSongId; }

            const titleSpan = targetElement.querySelector('.track-title-display');
            let bonusIndicator = isBonus ? ' <span class="bonus-track-indicator">(Bônus)</span>' : '';
            if (titleSpan) {
                titleSpan.innerHTML = name + bonusIndicator;
                if (existingSongId && !linkBroken) {
                    if (!titleSpan.querySelector('i.fa-link')) {
                        titleSpan.innerHTML = `<i class="fas fa-link" style="font-size: 10px; margin-right: 5px;" title="Faixa Existente"></i>${name}${bonusIndicator}`;
                    }
                    titleSpan.style.color = 'var(--spotify-green)';
                } else {
                    titleSpan.innerHTML = name + bonusIndicator;
                    titleSpan.style.color = '';
                }
            }
            const detailsDiv = targetElement.querySelector('.track-details-display');
            if (detailsDiv) {
                const durationSpan = detailsDiv.querySelector('.duration');
                const typeSpan = detailsDiv.querySelector('.type');
                if (durationSpan) durationSpan.textContent = `Duração: ${durationStr}`;
                if (typeSpan) typeSpan.textContent = `Tipo: ${type}${isBonus ? ' (Bônus)' : ''}`; // <<< Update type display
            }
            const featDisplay = targetElement.querySelector('.feat-list-display');
            if (featDisplay) { featDisplay.innerHTML = featsData.map(f => `<span class="feat-tag-display">${f.type} ${f.name}</span>`).join(''); }
            targetElement.classList.toggle('bonus', isBonus);

        } else { // Adding New
            console.log(`Adicionando novo item ${itemId}. Bônus: ${isBonus}`);
            const newItem = document.createElement('div');
            newItem.className = `track-list-item-display ${isBonus ? 'bonus' : ''}`; // <<< Add bonus class
            newItem.dataset.itemId = itemId;
            newItem.dataset.trackName = name;
            newItem.dataset.durationStr = durationStr;
            newItem.dataset.trackType = type;
            newItem.dataset.feats = featsJSON;
            newItem.dataset.isBonusTrack = isBonus; // <<< Set dataset

            let bonusIndicator = isBonus ? ' <span class="bonus-track-indicator">(Bônus)</span>' : '';
            newItem.innerHTML = `
                <span class="track-number-display"></span>
                <i class="fas fa-bars drag-handle"></i>
                <div class="track-actions">
                    <button type="button" class="small-btn edit-track-btn"><i class="fas fa-pencil-alt"></i></button>
                    <button type="button" class="small-btn remove-track-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="track-info-display">
                    <span class="track-title-display">${name}${bonusIndicator}</span>
                    <div class="track-details-display">
                        <span class="duration">Duração: ${durationStr}</span>
                        <span class="type">Tipo: ${type}${isBonus ? ' (Bônus)' : ''}</span>
                    </div>
                    <div class="feat-list feat-list-display" style="margin-top:5px;">
                        ${featsData.map(f => `<span class="feat-tag-display">${f.type} ${f.name}</span>`).join('')}
                    </div>
                </div>`;
            const emptyState = activeTracklistEditor.querySelector('.empty-state-small');
            if (emptyState) emptyState.remove();
            activeTracklistEditor.appendChild(newItem);
        }
        updateTrackNumbers(activeTracklistEditor);
        closeAlbumTrackModal();
    }

    function updateTrackNumbers(editorElement) {
        if (!editorElement) { console.warn("updateTrackNumbers: editorElement não encontrado"); return; }
        const trackItems = editorElement.querySelectorAll('.track-list-item-display');
        if (trackItems.length === 0) {
            if (!editorElement.querySelector('.empty-state-small')) {
                editorElement.innerHTML = '<p class="empty-state-small">Nenhuma faixa adicionada.</p>';
            }
        } else {
            const emptyState = editorElement.querySelector('.empty-state-small');
            if (emptyState) { emptyState.remove(); }
        }
        trackItems.forEach((item, index) => {
            let numberSpan = item.querySelector('.track-number-display');
            if (!numberSpan) {
                console.warn("Criando span de número ausente:", item.dataset.itemId);
                numberSpan = document.createElement('span');
                numberSpan.className = 'track-number-display';
                item.prepend(numberSpan); // Prepend for simplicity if handle missing
            }
            numberSpan.textContent = `${index + 1}.`;
        });
    }

    // --- Funções da API Airtable ---
    async function createAirtableRecord(tableName, fields) {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        console.log(`CREATE ${tableName}:`, fields);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: fields })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Erro Airtable CREATE ${tableName} [${response.status}]:`, JSON.stringify(errorData, null, 2));
                throw new Error(`Erro ${response.status} ao criar registro em ${tableName}: ${errorData?.error?.message || response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Falha na requisição CREATE para ${tableName}:`, error);
            return null;
        }
    }

    async function batchCreateAirtableRecords(tableName, recordsFields) {
        if (!recordsFields || recordsFields.length === 0) return [];
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        const MAX_RECORDS_PER_REQUEST = 10;
        const createdRecords = [];
        for (let i = 0; i < recordsFields.length; i += MAX_RECORDS_PER_REQUEST) {
            const chunk = recordsFields.slice(i, i + MAX_RECORDS_PER_REQUEST);
            const payload = { records: chunk.map(fields => ({ fields })) };
            console.log(`Enviando lote CREATE para ${tableName} (Tamanho: ${chunk.length})`);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Erro no lote CREATE para ${tableName} [${response.status}]:`, JSON.stringify(errorData, null, 2));
                    throw new Error(`Erro ${response.status} no lote CREATE para ${tableName}`);
                }
                const data = await response.json();
                if (data.records) { createdRecords.push(...data.records); }
            } catch (error) {
                console.error(`Falha na requisição do lote CREATE para ${tableName}:`, error);
                return null;
            }
        }
        console.log(`Lote CREATE para ${tableName} concluído. ${createdRecords.length} registros criados.`);
        return createdRecords;
    }

    async function updateAirtableRecord(tableName, recordId, fields) {
        if (!recordId) { console.error(`UPDATE ${tableName}: ID não fornecido.`); return null; }
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;
        console.log(`UPDATE ${tableName} ID ${recordId}:`, fields);
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: fields })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Erro Airtable UPDATE ${tableName} (ID: ${recordId}) [${response.status}]:`, JSON.stringify(errorData, null, 2));
                throw new Error(`Erro ${response.status} ao atualizar ${recordId} em ${tableName}: ${errorData?.error?.message || response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Falha na requisição UPDATE para ${tableName} (ID: ${recordId}):`, error);
            return null;
        }
    }

    async function batchUpdateAirtableRecords(tableName, recordsToUpdate) {
        if (!recordsToUpdate || recordsToUpdate.length === 0) return [];
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        const MAX_RECORDS_PER_REQUEST = 10;
        const updatedRecords = [];
        for (let i = 0; i < recordsToUpdate.length; i += MAX_RECORDS_PER_REQUEST) {
            const chunk = recordsToUpdate.slice(i, i + MAX_RECORDS_PER_REQUEST);
            const payload = { records: chunk };
            console.log(`Enviando lote UPDATE para ${tableName} (Tamanho: ${chunk.length})`);
            try {
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Erro no lote UPDATE para ${tableName} [${response.status}]:`, JSON.stringify(errorData, null, 2));
                    throw new Error(`Erro ${response.status} no lote UPDATE para ${tableName}`);
                }
                const data = await response.json();
                if (data.records) { updatedRecords.push(...data.records); }
            } catch (error) {
                console.error(`Falha na requisição do lote UPDATE para ${tableName}:`, error);
                return null;
            }
        }
        console.log(`Lote UPDATE para ${tableName} concluído. ${updatedRecords.length} registros atualizados.`);
        return updatedRecords;
    }

    async function deleteAirtableRecord(tableName, recordId) {
        if (!recordId) { console.error(`DELETE ${tableName}: ID não fornecido.`); return null; }
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;
        console.log(`DELETE ${tableName} ID ${recordId}`);
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Registro ${recordId} em ${tableName} não encontrado (já excluído?).`);
                    return { deleted: true, id: recordId };
                }
                try {
                    const errorData = await response.json();
                    console.error(`Erro Airtable DELETE ${tableName} (ID: ${recordId}) [${response.status}]:`, JSON.stringify(errorData, null, 2));
                    throw new Error(`Erro ${response.status} ao excluir ${recordId} em ${tableName}: ${errorData?.error?.message || response.statusText}`);
                } catch (parseError) {
                    console.error(`Erro Airtable DELETE ${tableName} (ID: ${recordId}), Status: ${response.status}, ${response.statusText}`);
                    throw new Error(`Erro ${response.status} ao excluir ${recordId} em ${tableName}`);
                }
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                console.log(`Registro ${recordId} em ${tableName} excluído (Status: ${response.status}).`);
                return { deleted: true, id: recordId };
            } else {
                try { return await response.json(); } catch (e) {
                    console.log(`Registro ${recordId} em ${tableName} excluído (Status: ${response.status}, no JSON body).`);
                    return { deleted: true, id: recordId };
                }
            }
        } catch (error) {
            console.error(`Falha na requisição DELETE para ${tableName} (ID: ${recordId}):`, error);
            return null;
        }
    }

    async function batchDeleteAirtableRecords(tableName, recordIds) {
        if (!recordIds || recordIds.length === 0) { console.log(`Nenhum registro para excluir ${tableName}.`); return { success: true, results: [] }; }
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        const MAX_RECORDS_PER_REQUEST = 10;
        const deletedResults = [];
        let allBatchesSucceeded = true;
        for (let i = 0; i < recordIds.length; i += MAX_RECORDS_PER_REQUEST) {
            const chunk = recordIds.slice(i, i + MAX_RECORDS_PER_REQUEST);
            const params = chunk.map(id => `records[]=${encodeURIComponent(id)}`).join('&');
            const batchUrl = `${url}?${params}`;
            console.log(`Enviando lote DELETE para ${tableName} (IDs: ${chunk.join(', ')})`);
            try {
                const response = await fetch(batchUrl, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
                });
                if (!response.ok) {
                    allBatchesSucceeded = false;
                    try {
                        const errorData = await response.json();
                        console.error(`Erro no lote DELETE para ${tableName} [${response.status}]:`, JSON.stringify(errorData, null, 2));
                        chunk.forEach(id => deletedResults.push({ id: id, deleted: false, error: errorData }));
                    } catch (parseError) {
                        console.error(`Erro no lote DELETE ${tableName}, Status: ${response.status}, ${response.statusText}`);
                        chunk.forEach(id => deletedResults.push({ id: id, deleted: false, error: `Status ${response.status}` }));
                    }
                } else {
                    const contentLength = response.headers.get("content-length");
                    if (response.status === 204 || contentLength === "0") {
                        console.log(`Lote DELETE ${tableName} (IDs: ${chunk.join(', ')}) OK (Status: ${response.status}).`);
                        chunk.forEach(id => deletedResults.push({ id: id, deleted: true }));
                    } else {
                        try {
                            const data = await response.json();
                            if (data.records) {
                                const resultMap = new Map(data.records.map(r => [r.id, r]));
                                chunk.forEach(id => deletedResults.push(resultMap.get(id) || { id: id, deleted: false, error: 'ID not in response' }));
                            } else {
                                console.warn("Formato inesperado resposta DELETE:", data);
                                chunk.forEach(id => deletedResults.push({ id: id, deleted: true, warning: 'Unexpected response' }));
                            }
                        } catch (e) {
                            console.warn(`Lote DELETE ${tableName} OK mas falha parse JSON:`, e);
                            chunk.forEach(id => deletedResults.push({ id: id, deleted: true, warning: 'Failed parse JSON' }));
                        }
                    }
                }
            } catch (error) {
                allBatchesSucceeded = false;
                console.error(`Falha requisição lote DELETE ${tableName}:`, error);
                chunk.forEach(id => deletedResults.push({ id: id, deleted: false, error: error.message }));
            }
        }
        console.log(`Lote DELETE ${tableName} concluído. Sucesso: ${allBatchesSucceeded}`);
        const overallSuccess = allBatchesSucceeded && deletedResults.every(r => r.deleted);
        return { success: overallSuccess, results: deletedResults };
    }

    function parseDurationToSeconds(durationStr) {
        if (!durationStr || typeof durationStr !== 'string') return 0;
        const parts = durationStr.split(':');
        if (parts.length !== 2) return 0;
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds > 59) { return 0; }
        return (minutes * 60) + seconds;
    }


    // --- FUNÇÕES DE UI (Estúdio) ---
    function populatePlayerTracks(selectElementId) {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement) { console.error(`Select ${selectElementId} não encontrado.`); return; }
        const selectedArtistId = singleArtistSelect?.value;
        if (!currentPlayer) { selectElement.innerHTML = '<option value="">Faça login</option>'; selectElement.disabled = true; return; }
        if (!selectedArtistId) { selectElement.innerHTML = '<option value="">Selecione Artista</option>'; selectElement.disabled = true; return; }
        const artistSongs = db.songs.filter(song => song.artistIds && song.artistIds.includes(selectedArtistId)).sort((a, b) => (b.totalStreams || 0) - (a.totalStreams || 0));
        if (artistSongs.length === 0) {
            selectElement.innerHTML = '<option value="">Nenhuma faixa encontrada</option>';
            selectElement.disabled = true;
        } else {
            selectElement.innerHTML = '<option value="">Selecione faixa...</option>';
            selectElement.innerHTML += artistSongs.map(song => {
                const primaryReleaseId = song.albumId;
                let releaseName = '(Avulsa)';
                if (primaryReleaseId) {
                    const release = [...db.albums, ...db.singles].find(r => r.id === primaryReleaseId);
                    if (release) releaseName = `(${release.title})`;
                }
                return `<option value="${song.id}">${song.title} ${releaseName}</option>`;
            }).join('');
            selectElement.disabled = false;
        }
    }

    function toggleSingleFormMode(isResetting = false) {
        if (!toggleExistingSingle || !newTrackInfoGroup || !existingTrackGroup || !singleFeatSection || !existingTrackSelect) {
            console.error("Elementos toggle single form não encontrados."); return;
        }
        const useExisting = isResetting ? false : toggleExistingSingle.checked;
        if (useExisting) {
            newTrackInfoGroup.classList.add('hidden');
            existingTrackGroup.classList.remove('hidden');
            singleFeatSection.classList.add('hidden');
            document.getElementById('trackName')?.removeAttribute('required');
            document.getElementById('trackDuration')?.removeAttribute('required');
            existingTrackSelect.setAttribute('required', 'required');
            if (existingTrackSelect.options.length <= 1 || existingTrackSelect.options[0]?.value === "") {
                populatePlayerTracks('existingTrackSelect');
            }
        } else {
            newTrackInfoGroup.classList.remove('hidden');
            existingTrackGroup.classList.add('hidden');
            singleFeatSection.classList.remove('hidden');
            document.getElementById('trackName')?.setAttribute('required', 'required');
            document.getElementById('trackDuration')?.setAttribute('required', 'required');
            existingTrackSelect.removeAttribute('required');
        }
        if (isResetting) {
            toggleExistingSingle.checked = false;
            existingTrackSelect.value = '';
            if (existingSingleTrackId) existingSingleTrackId.value = '';
            const trackNameInput = document.getElementById('trackName');
            const trackDurationInput = document.getElementById('trackDuration');
            if (trackNameInput) trackNameInput.value = '';
            if (trackDurationInput) trackDurationInput.value = '';
            const featList = document.getElementById('singleFeatList');
            if (featList) featList.innerHTML = '';
        }
    }

    function openExistingTrackModal(context) {
        if (!currentPlayer) { alert("Faça login."); return; }
        let activeArtistId = null;
        if (activeTracklistEditor === albumTracklistEditor) {
            activeArtistId = albumArtistSelect?.value;
        } else if (activeTracklistEditor === editAlbumTracklistEditor) {
            const artistName = document.getElementById('editArtistNameDisplay')?.textContent;
            const artist = db.artists.find(a => a.name === artistName);
            activeArtistId = artist ? artist.id : null;
        }
        if (!activeArtistId) { alert("Selecione o Artista Principal."); return; }
        existingTrackModalContext = context;
        if (existingTrackSearch) existingTrackSearch.value = '';
        populateExistingTrackSearch();
        existingTrackModal?.classList.remove('hidden');
    }

    function closeExistingTrackModal() {
        existingTrackModal?.classList.add('hidden');
        if (existingTrackSearch) existingTrackSearch.value = '';
        if (existingTrackResults) existingTrackResults.innerHTML = '<p class="empty-state-small">Busque por uma faixa.</p>';
    }

    function populateExistingTrackSearch() {
        if (!existingTrackResults) return;
        if (!currentPlayer) { existingTrackResults.innerHTML = '<p class="empty-state-small">Faça login.</p>'; return; }
        let selectedArtistId = null;
        if (activeTracklistEditor === albumTracklistEditor) {
            selectedArtistId = albumArtistSelect?.value;
        } else if (activeTracklistEditor === editAlbumTracklistEditor) {
            const artistName = document.getElementById('editArtistNameDisplay')?.textContent;
            const artist = db.artists.find(a => a.name === artistName);
            selectedArtistId = artist ? artist.id : null;
        }
        if (!selectedArtistId) { existingTrackResults.innerHTML = '<p class="empty-state-small">Selecione Artista.</p>'; return; }
        const query = existingTrackSearch?.value.toLowerCase().trim() || '';
        const filteredSongs = db.songs.filter(song => {
            const isArtistSong = song.artistIds && song.artistIds.includes(selectedArtistId);
            const matchesQuery = query === '' || song.title.toLowerCase().includes(query);
            return isArtistSong && matchesQuery;
        }).sort((a, b) => (b.totalStreams || 0) - (a.totalStreams || 0));

        if (filteredSongs.length === 0) {
            existingTrackResults.innerHTML = query ? '<p>Nenhuma faixa encontrada.</p>' : '<p>Nenhuma faixa para este artista.</p>';
        } else {
            existingTrackResults.innerHTML = filteredSongs.map(song => `
                <div class="existing-track-item" data-song-id="${song.id}" title="Adicionar '${song.title}'">
                    <img src="${song.cover || getCoverUrl(song.albumId)}" alt="${song.title}">
                    <div class="existing-track-item-info">
                        <span class="existing-track-item-title">${song.title}</span>
                        <span class="existing-track-item-artist">${song.artist}</span>
                    </div>
                    <i class="fas fa-plus add-icon"></i>
                </div>`).join('');
        }
    }

    function handleExistingTrackSelect(event) {
        const selectedItem = event.target.closest('.existing-track-item');
        if (!selectedItem) return;
        const songId = selectedItem.dataset.songId;
        if (!songId) return;
        if (existingTrackModalContext === 'album') {
            addExistingTrackToAlbum(songId);
        } else {
            console.warn(`Contexto não suportado: ${existingTrackModalContext}`);
        }
    }

    function addExistingTrackToAlbum(songId) {
        const song = db.songs.find(s => s.id === songId);
        if (!song || !activeTracklistEditor) { alert("Erro: Música não encontrada ou editor não ativo."); return; }
        if (activeTracklistEditor.querySelector(`[data-existing-song-id="${song.id}"]`)) { alert("Música já adicionada."); return; }

        const featsData = (song.artistIds || []).slice(1).map(artistId => {
            const artist = db.artists.find(a => a.id === artistId);
            return { id: artistId, type: song.collabType || 'Feat.', name: artist ? artist.name : '?' };
        });

        const newItem = document.createElement('div');
        newItem.className = `track-list-item-display ${song.isBonusTrack ? 'bonus' : ''}`; // <<< Add bonus class
        newItem.dataset.itemId = `existing_${song.id}`;
        newItem.dataset.existingSongId = song.id;
        newItem.dataset.trackName = song.title.replace(/ \(feat\. .+\)$/i, '');
        newItem.dataset.durationStr = song.duration;
        newItem.dataset.trackType = song.trackType;
        newItem.dataset.feats = JSON.stringify(featsData);
        newItem.dataset.isBonusTrack = song.isBonusTrack; // <<< Set bonus dataset

        let bonusIndicator = song.isBonusTrack ? ' <span class="bonus-track-indicator">(Bônus)</span>' : '';
        const titleDisplay = `<span class="track-title-display" style="color: var(--spotify-green);">
            <i class="fas fa-link" style="font-size: 10px; margin-right: 5px;" title="Faixa Existente"></i>${song.title}${bonusIndicator}
        </span>`;

        newItem.innerHTML = `
            <span class="track-number-display"></span>
            <i class="fas fa-bars drag-handle"></i>
            <div class="track-actions">
                <button type="button" class="small-btn edit-track-btn" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                <button type="button" class="small-btn remove-track-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="track-info-display">
                ${titleDisplay}
                <div class="track-details-display">
                    <span class="duration">Duração: ${song.duration}</span>
                    <span class="type">Tipo: ${song.trackType}${song.isBonusTrack ? ' (Bônus)' : ''}</span>
                </div>
                <div class="feat-list feat-list-display" style="margin-top:5px;">
                    ${featsData.map(f => `<span class="feat-tag-display">${f.type} ${f.name}</span>`).join('')}
                </div>
            </div>`;
        const emptyState = activeTracklistEditor.querySelector('.empty-state-small');
        if (emptyState) emptyState.remove();
        activeTracklistEditor.appendChild(newItem);
        updateTrackNumbers(activeTracklistEditor);
        closeExistingTrackModal();
    }


    // --- FUNÇÕES DE SUBMISSÃO ---
    async function handleSingleSubmit(event) {
        event.preventDefault();
        const submitButton = document.getElementById('submitNewSingle');
        if (!submitButton) return;
        const isExisting = toggleExistingSingle?.checked;
        const artistId = singleArtistSelect?.value;
        const title = document.getElementById('singleTitle')?.value;
        const coverUrl = document.getElementById('singleCoverUrl')?.value;
        const releaseDateTimeLocal = singleReleaseDateInput?.value;
        if (!artistId || !title || !coverUrl || !releaseDateTimeLocal) { alert("Preencha todos os campos do single."); return; }
        if (isExisting) {
            const existingSongId = existingTrackSelect?.value;
            if (!existingSongId) { alert("Selecione uma faixa existente."); return; }
            if (existingSingleTrackId) existingSingleTrackId.value = existingSongId;
        } else {
            const trackName = document.getElementById('trackName')?.value;
            const trackDuration = document.getElementById('trackDuration')?.value;
            if (!trackName || !trackDuration || parseDurationToSeconds(trackDuration) === 0) { alert("Preencha nome e duração válidos."); return; }
            if (existingSingleTrackId) existingSingleTrackId.value = '';
        }
        submitButton.disabled = true;
        submitButton.textContent = 'Aguardando Tipo...';
        trackTypeModal?.classList.remove('hidden');
    }

    async function processSingleSubmission(trackType) {
        const submitButton = document.getElementById('submitNewSingle');
        trackTypeModal?.classList.add('hidden');
        if (submitButton) submitButton.textContent = 'Enviando...';
        try {
            const artistId = singleArtistSelect.value;
            const title = document.getElementById('singleTitle').value;
            const coverUrl = document.getElementById('singleCoverUrl').value;
            const releaseDateTimeLocal = singleReleaseDateInput.value;
            const existingSongId = existingSingleTrackId.value;
            let releaseDateISO;
            try {
                const localDate = new Date(releaseDateTimeLocal);
                if (isNaN(localDate.getTime())) { throw new Error("Data/Hora inválida."); }
                releaseDateISO = localDate.toISOString();
            } catch (e) { throw new Error("Formato de Data/Hora inválido."); }

            const singleRecordFields = {
                "Nome do Single/EP": title,
                "Artista": [artistId],
                "Capa": [{ "url": coverUrl }],
                "Data de Lançamento": releaseDateISO
            };
            const singleResponse = await createAirtableRecord('Singles e EPs', singleRecordFields);
            if (!singleResponse || !singleResponse.id) { throw new Error("Falha ao criar registro do Single/EP."); }
            const newSingleId = singleResponse.id;
            console.log(`Single/EP criado: ${newSingleId}`);

            let musicRecordId = null;
            if (existingSongId) {
                console.log(`Atualizando faixa ${existingSongId} para single ${newSingleId}`);
                const songData = db.songs.find(s => s.id === existingSongId);
                const existingSingleLinks = songData?.singleIds || [];
                const updatedSingleLinks = [...new Set([...existingSingleLinks, newSingleId])];
                const musicUpdateFields = { "Singles e EPs": updatedSingleLinks, "Tipo de Faixa": trackType };
                const musicUpdateResponse = await updateAirtableRecord('Músicas', existingSongId, musicUpdateFields);
                if (!musicUpdateResponse || !musicUpdateResponse.id) {
                    console.error(`Falha ao ATUALIZAR música ${existingSongId}.`);
                    await deleteAirtableRecord('Singles e EPs', newSingleId); // Rollback
                    throw new Error("Falha ao atualizar música. Single removido.");
                }
                musicRecordId = musicUpdateResponse.id;
                console.log(`Música ${musicRecordId} atualizada.`);
            } else {
                console.log(`Criando nova faixa para single ${newSingleId}`);
                const trackName = document.getElementById('trackName').value;
                const trackDurationStr = document.getElementById('trackDuration').value;
                const trackDurationSec = parseDurationToSeconds(trackDurationStr);
                const featTags = document.querySelectorAll('#singleFeatList .feat-tag');
                let finalArtistIds = [artistId], collaborationType = null, finalTrackName = trackName, featNames = [];
                if (featTags.length > 0) {
                    collaborationType = featTags[0].dataset.featType;
                    featTags.forEach(tag => {
                        finalArtistIds.push(tag.dataset.artistId);
                        featNames.push(tag.dataset.artistName);
                    });
                    if (collaborationType === "Feat.") { finalTrackName = `${trackName} (feat. ${featNames.join(', ')})`; }
                }
                const musicCreateFields = {
                    "Nome da Faixa": finalTrackName, "Artista": finalArtistIds, "Duração": trackDurationSec,
                    "Nº da Faixa": 1, "Singles e EPs": [newSingleId], "Tipo de Faixa": trackType,
                    ...(collaborationType && { "Tipo de Colaboração": collaborationType })
                    // Bonus track is not relevant for a single-track single
                };
                const musicCreateResponse = await createAirtableRecord('Músicas', musicCreateFields);
                if (!musicCreateResponse || !musicCreateResponse.id) {
                    console.error(`Falha ao CRIAR música para single ${newSingleId}.`);
                    await deleteAirtableRecord('Singles e EPs', newSingleId); // Rollback
                    throw new Error("Falha ao criar música. Single removido.");
                }
                musicRecordId = musicCreateResponse.id;
                console.log(`Nova música ${musicRecordId} criada.`);
            }
            alert("Single lançado com sucesso!");
            newSingleForm?.reset();
            if (singleReleaseDateInput) { /* ... reset date ... */ }
            if (document.getElementById('singleFeatList')) document.getElementById('singleFeatList').innerHTML = '';
            toggleSingleFormMode(true);
            await refreshAllData();
        } catch (error) {
            alert(`Erro ao lançar single: ${error.message}.`);
            console.error("Erro processSingleSubmission:", error);
        } finally {
            if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Lançar Single'; }
            if (existingSingleTrackId) existingSingleTrackId.value = '';
        }
    }

    function initAlbumForm() {
        if (albumTracklistEditor) {
            albumTracklistEditor.innerHTML = '<p class="empty-state-small">Nenhuma faixa adicionada.</p>';
        }
        if (albumTracklistEditor && typeof Sortable !== 'undefined') {
            if (albumTracklistSortable) { albumTracklistSortable.destroy(); }
            albumTracklistSortable = Sortable.create(albumTracklistEditor, {
                animation: 150, handle: '.drag-handle', onEnd: () => updateTrackNumbers(albumTracklistEditor)
            });
            console.log("SortableJS initialized for NEW album form.");
        } else if (typeof Sortable === 'undefined') {
            console.warn("SortableJS não carregado.");
        }
        updateTrackNumbers(albumTracklistEditor);
    }

    async function handleAlbumSubmit(event) {
        event.preventDefault();
        const submitButton = document.getElementById('submitNewAlbum');
        if (!submitButton) return;
        submitButton.disabled = true;
        let isAlbum = false;
        let totalDurationSeconds = 0;

        try {
            const artistId = albumArtistSelect?.value;
            const title = document.getElementById('albumTitle')?.value;
            const coverUrl = document.getElementById('albumCoverUrl')?.value;
            const releaseDateTimeLocal = albumReleaseDateInput?.value;
            const isDeluxeVersion = albumIsDeluxeCheckbox?.checked || false; // <<< Read Deluxe

            if (!artistId || !title || !coverUrl || !releaseDateTimeLocal) throw new Error("Preencha campos do Álbum/EP.");
            let releaseDateISO;
            try {
                const localDate = new Date(releaseDateTimeLocal);
                if (isNaN(localDate.getTime())) { throw new Error("Data/Hora inválida."); }
                releaseDateISO = localDate.toISOString();
            } catch (e) { throw new Error("Formato de Data/Hora inválido."); }

            const trackItems = albumTracklistEditor?.querySelectorAll('.track-list-item-display');
            if (!trackItems || trackItems.length === 0) throw new Error("Adicione faixas.");

            const musicRecordsToCreate = [];
            const musicRecordsToUpdate = [];
            totalDurationSeconds = 0; // Reset duration calculation

            for (let i = 0; i < trackItems.length; i++) {
                const item = trackItems[i];
                const existingSongId = item.dataset.existingSongId;
                const name = item.dataset.trackName;
                const durationStr = item.dataset.durationStr;
                const type = item.dataset.trackType;
                const isBonus = item.dataset.isBonusTrack === 'true'; // <<< Get Bonus from dataset
                let feats = []; try { feats = JSON.parse(item.dataset.feats || '[]'); } catch (e) {}
                const durationSec = parseDurationToSeconds(durationStr);
                if (!name || (!existingSongId && durationSec === 0)) throw new Error(`Dados inválidos Faixa ${i + 1}.`);
                totalDurationSeconds += durationSec;

                if (existingSongId) {
                    musicRecordsToUpdate.push({
                        id: existingSongId,
                        fields: { "Nº da Faixa": i + 1, "Tipo de Faixa": type, "Faixa Bônus?": isBonus } // <<< Send Bonus
                    });
                } else {
                    let finalTrackName = name, finalArtistIds = [artistId], collabType = null;
                    if (feats.length > 0) {
                        collabType = feats[0].type;
                        finalArtistIds = [artistId, ...feats.map(f => f.id)];
                        if (collabType === "Feat.") { finalTrackName = `${name} (feat. ${feats.map(f => f.name).join(', ')})`; }
                    }
                    musicRecordsToCreate.push({
                        "Nome da Faixa": finalTrackName, "Artista": finalArtistIds, "Duração": durationSec,
                        "Nº da Faixa": i + 1, "Tipo de Faixa": type, "Faixa Bônus?": isBonus, // <<< Send Bonus
                        ...(collabType && { "Tipo de Colaboração": collabType })
                    });
                }
            }

            const IS_ALBUM_THRESHOLD_SECONDS = 30 * 60;
            isAlbum = totalDurationSeconds >= IS_ALBUM_THRESHOLD_SECONDS;
            const targetTableName = isAlbum ? 'Álbuns' : 'Singles e EPs';
            const nameFieldName = isAlbum ? 'Nome do Álbum' : 'Nome do Single/EP';
            const coverFieldName = isAlbum ? 'Capa do Álbum' : 'Capa';
            const linkFieldName = isAlbum ? 'Álbuns' : 'Singles e EPs';
            submitButton.textContent = `Lançando ${isAlbum ? 'Álbum' : 'EP'}...`;
            console.log(`Duração: ${totalDurationSeconds}s. Tipo: ${isAlbum ? 'Álbum' : 'EP'}. Tabela: ${targetTableName}`);

            const releaseRecordFields = {
                [nameFieldName]: title, "Artista": [artistId], [coverFieldName]: [{ "url": coverUrl }],
                "Data de Lançamento": releaseDateISO,
                ...(isAlbum && { "É Deluxe?": isDeluxeVersion }) // <<< Send Deluxe if Album
            };
            const releaseResponse = await createAirtableRecord(targetTableName, releaseRecordFields);
            if (!releaseResponse || !releaseResponse.id) throw new Error(`Falha ao criar ${isAlbum ? 'Álbum' : 'EP'}.`);
            const newReleaseId = releaseResponse.id;
            console.log(`${isAlbum ? 'Álbum' : 'EP'} criado: ${newReleaseId}`);

            musicRecordsToCreate.forEach(record => { record[linkFieldName] = [newReleaseId]; });
            musicRecordsToUpdate.forEach(record => {
                const originalSong = db.songs.find(s => s.id === record.id);
                const existingLinks = (isAlbum ? originalSong?.albumIds : originalSong?.singleIds) || [];
                record.fields[linkFieldName] = [...new Set([...existingLinks, newReleaseId])];
            });

            let allMusicOpsSucceeded = true;
            if (musicRecordsToCreate.length > 0) {
                const createdMusicResult = await batchCreateAirtableRecords('Músicas', musicRecordsToCreate);
                if (!createdMusicResult || createdMusicResult.length !== musicRecordsToCreate.length) { allMusicOpsSucceeded = false; console.error("Falha ao criar faixas."); }
                else { console.log("Novas faixas criadas."); }
            }
            if (musicRecordsToUpdate.length > 0) {
                const updatedMusicResult = await batchUpdateAirtableRecords('Músicas', musicRecordsToUpdate);
                if (!updatedMusicResult || updatedMusicResult.length !== musicRecordsToUpdate.length) { allMusicOpsSucceeded = false; console.error("Falha ao atualizar faixas."); }
                else { console.log("Faixas existentes atualizadas."); }
            }

            if (!allMusicOpsSucceeded) { alert(`${isAlbum ? 'Álbum' : 'EP'} lançado, mas erro nas faixas.`); }
            else { alert(`${isAlbum ? 'Álbum' : 'EP'} lançado com sucesso!`); }

            newAlbumForm?.reset();
            if (albumReleaseDateInput) {
                const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); now.setSeconds(0); now.setMilliseconds(0);
                albumReleaseDateInput.value = now.toISOString().slice(0, 16);
            }
            initAlbumForm();
            await refreshAllData();

        } catch (error) {
            alert(`Erro ao lançar ${isAlbum ? 'Álbum' : 'EP'}: ${error.message}.`);
            console.error(`Erro handleAlbumSubmit:`, error);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                const finalIsAlbum = totalDurationSeconds >= (30 * 60);
                submitButton.textContent = `Lançar ${finalIsAlbum ? 'Álbum' : 'EP'}`;
            }
        }
    }


    // --- FUNÇÕES DE EDIÇÃO/EXCLUSÃO ---
    function populateEditableReleases() {
        if (!editReleaseList) return;
        if (!currentPlayer) { editReleaseList.innerHTML = '<p class="empty-state-small">Faça login.</p>'; return; }
        const selectedArtistId = editArtistFilterSelect?.value;
        const playerArtistIds = currentPlayer.artists || [];
        let releasesToDisplay;
        if (selectedArtistId && selectedArtistId !== 'all') {
            releasesToDisplay = [...db.albums, ...db.singles].filter(release => release.artistId === selectedArtistId);
        } else {
            releasesToDisplay = [...db.albums, ...db.singles].filter(release => playerArtistIds.includes(release.artistId));
        }
        const sortedReleases = releasesToDisplay.sort((a, b) => (new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)));
        if (sortedReleases.length === 0) {
            editReleaseList.innerHTML = '<p class="empty-state-small">Nenhum lançamento encontrado.</p>';
        } else {
            editReleaseList.innerHTML = sortedReleases.map(release => {
                // <<< Deluxe Indicator for Edit List >>>
                const titleDisplay = release.title + (release.isDeluxe ? " (Deluxe)" : "");
                return `
                <div class="edit-release-item">
                    <img src="${release.imageUrl}" alt="${release.title}" class="edit-release-cover">
                    <div class="edit-release-info">
                        <span class="edit-release-title">${titleDisplay}</span>
                        <span class="edit-release-artist">
                            ${release.artist} - ${release.releaseDate ? new Date(release.releaseDate).getFullYear() : 'Sem Data'}
                            <span class="release-type-badge ${release.type}">${release.type === 'album' ? 'Álbum' : 'EP/Single'}</span>
                        </span>
                    </div>
                    <div class="action-buttons">
                        <button type="button" class="small-btn edit-release-btn" data-release-id="${release.id}" data-release-type="${release.type}" data-release-table="${release.tableName}"><i class="fas fa-pencil-alt"></i> Editar</button>
                        <button type="button" class="small-btn delete-release-btn" data-release-id="${release.id}" data-release-type="${release.type}" data-release-table="${release.tableName}" data-release-title="${release.title}"><i class="fas fa-trash-alt"></i> Apagar</button>
                    </div>
                </div>`;
            }).join('');
        }
    }

    function openEditForm(releaseId, releaseType) {
        const release = [...db.albums, ...db.singles].find(r => r.id === releaseId);
        if (!release || !editReleaseForm || !editReleaseId || !editReleaseType || !editReleaseTableName || !editArtistNameDisplay || !editReleaseTitle || !editReleaseCoverUrl || !editReleaseDate || !editDeluxeGroup || !editAlbumIsDeluxeCheckbox) {
            alert("Erro ao abrir edição."); console.error("Falha ao abrir form de edição."); return;
        }
        editReleaseId.value = release.id;
        editReleaseType.value = release.type;
        editReleaseTableName.value = release.tableName;
        editArtistNameDisplay.textContent = release.artist;
        editReleaseTitle.value = release.title;
        editReleaseCoverUrl.value = release.imageUrl;
        if (release.releaseDate) {
            try {
                const releaseDateObj = new Date(release.releaseDate);
                const localOffset = releaseDateObj.getTimezoneOffset() * 60000;
                const localISOTime = new Date(releaseDateObj.getTime() - localOffset).toISOString().slice(0, 16);
                editReleaseDate.value = localISOTime;
            } catch (e) {
                console.error("Erro ao formatar data/hora para edição:", e, "Data:", release.releaseDate);
                editReleaseDate.value = '';
            }
        } else {
            editReleaseDate.value = '';
        }

        // <<< Handle Deluxe Checkbox Visibility and State >>>
        if (release.tableName === 'Álbuns') {
            editDeluxeGroup.classList.remove('hidden');
            editAlbumIsDeluxeCheckbox.checked = release.isDeluxe || false;
        } else {
            editDeluxeGroup.classList.add('hidden');
            editAlbumIsDeluxeCheckbox.checked = false;
        }

        // Tracklist Logic
        if (!editAlbumTracklistEditor || !editTracklistActions) {
            console.warn("Editor de tracklist (edição) não encontrado.");
            if (editAlbumTracklistEditor) editAlbumTracklistEditor.classList.add('hidden');
            if (editTracklistActions) editTracklistActions.classList.add('hidden');
        } else {
            editAlbumTracklistEditor.classList.remove('hidden');
            editTracklistActions.classList.remove('hidden');
            populateTracklistEditor(editAlbumTracklistEditor, release.tracks);
            if (editAlbumTracklistEditor && typeof Sortable !== 'undefined') {
                if (editAlbumTracklistSortable) { editAlbumTracklistSortable.destroy(); }
                editAlbumTracklistSortable = Sortable.create(editAlbumTracklistEditor, {
                    animation: 150, handle: '.drag-handle', onEnd: () => updateTrackNumbers(editAlbumTracklistEditor)
                });
                console.log("SortableJS re-initialized for EDIT form.");
            }
        }
        editReleaseListContainer?.classList.add('hidden');
        editReleaseForm.classList.remove('hidden');
    }

    async function handleUpdateRelease(event) {
        event.preventDefault();
        if (!saveEditBtn || !editReleaseId || !editReleaseTableName || !editReleaseTitle || !editReleaseCoverUrl || !editReleaseDate || !editAlbumTracklistEditor || !editAlbumIsDeluxeCheckbox) {
            console.error("Elementos de edição faltando ao salvar."); return;
        }
        const recordId = editReleaseId.value;
        const tableName = editReleaseTableName.value;
        const updatedTitle = editReleaseTitle.value.trim();
        const updatedCoverUrl = editReleaseCoverUrl.value.trim();
        const updatedReleaseDateTimeLocal = editReleaseDate.value;
        const isNowDeluxe = editAlbumIsDeluxeCheckbox.checked; // <<< Read Deluxe
        const originalRelease = [...db.albums, ...db.singles].find(r => r.id === recordId);
        if (!originalRelease) { alert("Erro: Lançamento original não encontrado."); return; }
        const artistId = originalRelease.artistId;
        const originalTrackIds = new Set(originalRelease.trackIds || []);
        if (!recordId || !tableName || !updatedTitle || !updatedCoverUrl || !updatedReleaseDateTimeLocal) { alert("Dados inválidos."); return; }
        let updatedReleaseDateISO;
        try {
            const localDate = new Date(updatedReleaseDateTimeLocal);
            if (isNaN(localDate.getTime())) { throw new Error("Data/Hora inválida."); }
            updatedReleaseDateISO = localDate.toISOString();
        } catch (e) { alert("Data/Hora inválida."); return; }
        saveEditBtn.disabled = true; saveEditBtn.textContent = 'Salvando...';

        try {
            const titleFieldName = (tableName === 'Álbuns') ? 'Nome do Álbum' : 'Nome do Single/EP';
            const coverFieldName = (tableName === 'Álbuns') ? 'Capa do Álbum' : 'Capa';
            const fieldsToUpdate = {
                [titleFieldName]: updatedTitle,
                [coverFieldName]: [{ "url": updatedCoverUrl }],
                "Data de Lançamento": updatedReleaseDateISO,
                ...(tableName === 'Álbuns' && { "É Deluxe?": isNowDeluxe }) // <<< Send Deluxe if Album
            };
            const updateResult = await updateAirtableRecord(tableName, recordId, fieldsToUpdate);
            if (!updateResult || !updateResult.id) throw new Error("Falha ao atualizar lançamento.");
            console.log("Lançamento principal atualizado.");

            if (tableName === 'Álbuns' || tableName === 'Singles e EPs') {
                const trackItems = editAlbumTracklistEditor.querySelectorAll('.track-list-item-display');
                if (!editAlbumTracklistEditor.classList.contains('hidden')) {
                    console.log(`Processando tracklist para ${tableName} ID ${recordId}...`);
                    const musicRecordsToCreate = []; const musicRecordsToUpdate = []; const finalTrackIdsInEditor = new Set();
                    const linkField = tableName === 'Álbuns' ? 'Álbuns' : 'Singles e EPs';

                    for (let i = 0; i < trackItems.length; i++) {
                        const item = trackItems[i];
                        const existingSongId = item.dataset.existingSongId;
                        const name = item.dataset.trackName;
                        const durationStr = item.dataset.durationStr;
                        const type = item.dataset.trackType;
                        const isBonus = item.dataset.isBonusTrack === 'true'; // <<< Get Bonus
                        const durationSec = parseDurationToSeconds(durationStr);
                        let feats = []; try { feats = JSON.parse(item.dataset.feats || '[]'); } catch (e) {}
                        if (!name || (durationSec === 0 && !existingSongId)) throw new Error(`Dados inválidos Faixa ${i + 1}.`);

                        if (existingSongId) {
                            finalTrackIdsInEditor.add(existingSongId);
                            const originalSong = db.songs.find(s => s.id === existingSongId);
                            const existingLinks = (tableName === 'Álbuns' ? originalSong?.albumIds : originalSong?.singleIds) || [];
                            const updatedLinks = [...new Set([...existingLinks, recordId])];
                            musicRecordsToUpdate.push({
                                id: existingSongId, fields: { "Nº da Faixa": i + 1, "Tipo de Faixa": type, "Faixa Bônus?": isBonus, [linkField]: updatedLinks } // <<< Send Bonus
                            });
                        } else {
                            let finalTrackName = name, finalArtistIds = [artistId], collabType = null;
                            if (feats.length > 0) { /* ... feat name/id logic ... */ }
                            musicRecordsToCreate.push({
                                "Nome da Faixa": finalTrackName, "Artista": finalArtistIds, "Duração": durationSec,
                                "Nº da Faixa": i + 1, "Tipo de Faixa": type, "Faixa Bônus?": isBonus, [linkField]: [recordId], // <<< Send Bonus
                                ...(collabType && { "Tipo de Colaboração": collabType })
                            });
                        }
                    } // End track loop

                    if (musicRecordsToCreate.length > 0) {
                         const createResult = await batchCreateAirtableRecords('Músicas', musicRecordsToCreate);
                         if (!createResult || createResult.length !== musicRecordsToCreate.length) throw new Error("Falha ao criar faixas novas.");
                         createResult.forEach(record => finalTrackIdsInEditor.add(record.id));
                         console.log("Novas faixas criadas.");
                    }
                    const tracksToUnlinkIds = [...originalTrackIds].filter(id => !finalTrackIdsInEditor.has(id));
                    if (tracksToUnlinkIds.length > 0) {
                        console.log(`Desvinculando ${tracksToUnlinkIds.length} faixas...`);
                        const unlinkPayload = [];
                        for (const trackId of tracksToUnlinkIds) {
                            const originalSong = db.songs.find(s => s.id === trackId);
                            const existingLinks = (tableName === 'Álbuns' ? originalSong?.albumIds : originalSong?.singleIds) || [];
                            const updatedLinks = existingLinks.filter(linkId => linkId !== recordId);
                            unlinkPayload.push({ id: trackId, fields: { [linkField]: updatedLinks } });
                        }
                        const unlinkResult = await batchUpdateAirtableRecords('Músicas', unlinkPayload);
                        if (!unlinkResult || unlinkResult.length !== unlinkPayload.length) { console.warn("Falha ao desvincular faixas."); }
                        else { console.log("Faixas antigas desvinculadas."); }
                    }
                    if (musicRecordsToUpdate.length > 0) {
                        console.log(`Atualizando ${musicRecordsToUpdate.length} faixas...`);
                        const updateExistingResult = await batchUpdateAirtableRecords('Músicas', musicRecordsToUpdate);
                        if (!updateExistingResult || updateExistingResult.length !== musicRecordsToUpdate.length) { throw new Error("Falha ao atualizar faixas existentes."); }
                        console.log("Faixas existentes atualizadas.");
                    }
                }
            }
            alert("Lançamento atualizado!");
            editReleaseForm.classList.add('hidden');
            editReleaseListContainer?.classList.remove('hidden');
            await refreshAllData();
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}.`);
            console.error("Erro handleUpdateRelease:", error);
        } finally {
            saveEditBtn.disabled = false; saveEditBtn.textContent = 'Salvar Alterações';
        }
    }

    function openDeleteConfirmModal(recordId, tableName, releaseTitle, trackIds) {
        if (!deleteConfirmModal || !deleteRecordId || !deleteTableName || !deleteReleaseName || !deleteTrackIds) { console.error("Modal delete não encontrado."); return; }
        deleteRecordId.value = recordId;
        deleteTableName.value = tableName;
        deleteReleaseName.textContent = releaseTitle;
        deleteTrackIds.value = JSON.stringify(trackIds || []);
        deleteConfirmModal.classList.remove('hidden');
    }

    function closeDeleteConfirmModal() {
        if (!deleteConfirmModal || !deleteRecordId || !deleteTableName || !deleteReleaseName || !deleteTrackIds) return;
        deleteConfirmModal.classList.add('hidden');
        deleteRecordId.value = '';
        deleteTableName.value = '';
        deleteReleaseName.textContent = '';
        deleteTrackIds.value = '';
    }

    async function handleDeleteRelease() {
        if (!confirmDeleteBtn || !deleteRecordId || !deleteTableName || !deleteTrackIds) { console.error("Botão delete não encontrado."); return; }
        const recordId = deleteRecordId.value;
        const tableName = deleteTableName.value;
        const trackIdsString = deleteTrackIds.value;
        let associatedTrackIds = [];
        try { associatedTrackIds = JSON.parse(trackIdsString || '[]'); } catch (e) { console.error("Erro parsear track IDs:", e); }
        if (!recordId || !tableName) { alert("Erro: ID ou Tabela faltando."); closeDeleteConfirmModal(); return; }
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Apagando...';
        try {
            let tracksProcessedSuccessfully = true;
            if (associatedTrackIds.length > 0) {
                console.log(`Processando ${associatedTrackIds.length} músicas...`);
                const updates = [], deletes = [];
                for (const trackId of associatedTrackIds) {
                    const song = db.songs.find(s => s.id === trackId);
                    if (!song) { console.warn(`Música ${trackId} não encontrada.`); continue; }
                    const albumLinksCount = (song.albumIds || []).length;
                    const singleLinksCount = (song.singleIds || []).length;
                    const isOnlyLink = (tableName === 'Álbuns' && albumLinksCount === 1 && singleLinksCount === 0 && song.albumIds[0] === recordId) || (tableName === 'Singles e EPs' && singleLinksCount === 1 && albumLinksCount === 0 && song.singleIds[0] === recordId);
                    if (!isOnlyLink) {
                        console.log(`Desvinculando ${trackId} de ${recordId}`);
                        const isAlbumTable = tableName === 'Álbuns';
                        const linkField = isAlbumTable ? 'Álbuns' : 'Singles e EPs';
                        const currentLinks = (isAlbumTable ? song.albumIds : song.singleIds) || [];
                        const updatedLinks = currentLinks.filter(linkId => linkId !== recordId);
                        updates.push({ id: trackId, fields: { [linkField]: updatedLinks } });
                    } else {
                        console.log(`Marcando ${trackId} para exclusão.`);
                        deletes.push(trackId);
                    }
                }
                if (updates.length > 0) {
                    console.log(`Desvinculando ${updates.length} músicas...`);
                    const updateResult = await batchUpdateAirtableRecords('Músicas', updates);
                    if (!updateResult || updateResult.length !== updates.length) { tracksProcessedSuccessfully = false; console.error("Falha ao desvincular."); alert("Atenção: Falha ao desvincular faixas."); }
                    else { console.log("Músicas desvinculadas."); }
                }
                if (deletes.length > 0) {
                    console.log(`Excluindo ${deletes.length} músicas...`);
                    const deleteResult = await batchDeleteAirtableRecords('Músicas', deletes);
                    if (!deleteResult || !deleteResult.success) { tracksProcessedSuccessfully = false; console.error("Falha ao excluir faixas.", deleteResult); alert("Atenção: Falha ao excluir faixas."); }
                    else { console.log("Músicas excluídas."); }
                }
            }
            console.log(`Excluindo ${recordId} de ${tableName}...`);
            const releaseDeleteResult = await deleteAirtableRecord(tableName, recordId);
            if (releaseDeleteResult && releaseDeleteResult.deleted) {
                alert("Lançamento apagado!");
                closeDeleteConfirmModal();
                await refreshAllData();
            } else {
                if (!tracksProcessedSuccessfully) { throw new Error("Falha ao apagar lançamento E faixas."); }
                else { throw new Error("Falha ao apagar lançamento."); }
            }
        } catch (error) {
            alert(`Erro ao apagar: ${error.message}.`);
            console.error("Erro handleDeleteRelease:", error);
            closeDeleteConfirmModal();
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Sim, Apagar';
        }
    }


    // --- 5. LÓGICA DO PLAYER DE MÚSICA ---
    function openPlayer(songId, clickedElement) {
        const song = db.songs.find(s => s.id === songId);
        if (!song) { console.error(`Música ${songId} não encontrada.`); return; }
        console.log("Abrindo player:", song.title);
        const parentListContainer = clickedElement?.closest('.popular-songs-list, .tracklist-container, .chart-list');
        if (parentListContainer) {
            const songElements = parentListContainer.querySelectorAll('.song-row[data-song-id], .track-row[data-song-id].available, .chart-item[data-song-id]');
            currentQueue = Array.from(songElements).map(el => db.songs.find(s => s.id === el.dataset.songId)).filter(Boolean);
            console.log(`Fila criada: ${currentQueue.length} músicas.`);
        } else {
            currentQueue = [song];
            console.log("Fila criada com música única.");
        }
        currentQueueIndex = currentQueue.findIndex(s => s.id === songId);
        if (currentQueueIndex === -1) {
            console.warn("Música clicada não encontrada na fila. Tocando só ela.");
            currentQueue = [song];
            currentQueueIndex = 0;
        }
        loadSong(song);
        musicPlayerView?.classList.remove('hidden');
        document.body.classList.add('player-open');
        playAudio();
    }

    function closePlayer() {
        musicPlayerView?.classList.add('hidden');
        document.body.classList.remove('player-open');
        if (isPlaying) { pauseAudio(); console.log("Player fechado, áudio pausado."); }
        else { console.log("Player fechado."); }
    }

    function loadSong(song) {
        if (!song) { console.error("loadSong: música inválida."); return; }
        console.log("Carregando:", song.title);
        currentSong = song;
        if (playerSongTitle) playerSongTitle.textContent = song.title;
        if (playerArtistName) playerArtistName.textContent = formatArtistString(song.artistIds, song.collabType);
        const parentRelease = [...db.albums, ...db.singles].find(r => r.id === song.albumId);
        if (parentRelease) {
            if (playerCoverArt) playerCoverArt.src = parentRelease.imageUrl;
            if (playerAlbumTitle) playerAlbumTitle.textContent = parentRelease.title;
        } else {
            if (playerCoverArt) playerCoverArt.src = song.cover || 'https://i.imgur.com/AD3MbBi.png';
            if (playerAlbumTitle) playerAlbumTitle.textContent = 'Single Avulso';
        }
        const durationSeconds = song.durationSeconds || 0;
        if (playerSeekBar) { playerSeekBar.value = 0; playerSeekBar.max = durationSeconds; }
        if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0);
        if (playerTotalTime) playerTotalTime.textContent = formatTime(durationSeconds);
        if (isPlaying) { if (playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
        else { if (playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
        if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0);
    }

    function playAudio() {
        if (!currentSong) return;
        isPlaying = true;
        if (playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        console.log("Simulando Play:", currentSong.title);
        startSimulationTimer();
    }

    function pauseAudio() {
        isPlaying = false;
        if (playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        console.log("Simulando Pause:", currentSong?.title);
        stopSimulationTimer();
    }

    function togglePlay() { if (isPlaying) { pauseAudio(); } else { playAudio(); } }

    function playNext() {
        if (!currentQueue || currentQueue.length === 0 || !currentSong) { console.log("PlayNext: Fila vazia."); return; }
        console.log("PlayNext: Iniciando...");
        if (repeatMode === 'one') {
            console.log("PlayNext: Repeat One.");
            if (playerSeekBar) playerSeekBar.value = 0;
            if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0);
            playAudio();
            return;
        }
        if (isShuffle) {
            let randomIndex = currentQueueIndex;
            if (currentQueue.length > 1) { do { randomIndex = Math.floor(Math.random() * currentQueue.length); } while (randomIndex === currentQueueIndex); }
            currentQueueIndex = randomIndex;
            console.log(`PlayNext: Shuffle, novo índice ${currentQueueIndex}`);
        } else {
            currentQueueIndex++;
            console.log(`PlayNext: Normal, novo índice ${currentQueueIndex}`);
        }
        if (currentQueueIndex >= currentQueue.length) {
            if (repeatMode === 'all') {
                console.log("PlayNext: Fim da fila, Repeat All.");
                currentQueueIndex = 0;
            } else {
                console.log("PlayNext: Fim da fila, sem repeat. Parando.");
                currentQueueIndex = 0;
                const firstSong = currentQueue[currentQueueIndex];
                if (firstSong) loadSong(firstSong);
                pauseAudio();
                if (playerSeekBar) playerSeekBar.value = 0;
                if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0);
                return;
            }
        }
        const nextSong = currentQueue[currentQueueIndex];
        if (nextSong) {
            loadSong(nextSong);
            if (isPlaying) { playAudio(); }
        } else {
            console.error(`PlayNext: Música não encontrada no índice ${currentQueueIndex}`);
            pauseAudio();
        }
    }

    function playPrevious() {
        if (!currentQueue || currentQueue.length === 0 || !currentSong) { console.log("PlayPrevious: Fila vazia."); return; }
        console.log("PlayPrevious: Iniciando...");
        const currentTime = playerSeekBar ? parseFloat(playerSeekBar.value) : 0;
        if (currentTime > 3 || (currentQueueIndex === 0 && repeatMode !== 'all' && !isShuffle)) {
            console.log("PlayPrevious: Reiniciando música.");
            if (playerSeekBar) playerSeekBar.value = 0;
            if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0);
            if (isPlaying) playAudio();
            return;
        }
        if (isShuffle) {
            let randomIndex = currentQueueIndex;
            if (currentQueue.length > 1) { do { randomIndex = Math.floor(Math.random() * currentQueue.length); } while (randomIndex === currentQueueIndex); }
            currentQueueIndex = randomIndex;
            console.log(`PlayPrevious: Shuffle, novo índice ${currentQueueIndex}`);
        } else {
            currentQueueIndex--;
            console.log(`PlayPrevious: Normal, novo índice ${currentQueueIndex}`);
        }
        if (currentQueueIndex < 0) {
            if (repeatMode === 'all') {
                console.log("PlayPrevious: Início da fila, Repeat All.");
                currentQueueIndex = currentQueue.length - 1;
            } else {
                console.log("PlayPrevious: Início da fila, sem repeat, reiniciando.");
                currentQueueIndex = 0;
                if (playerSeekBar) playerSeekBar.value = 0;
                if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0);
                const firstSong = currentQueue[currentQueueIndex];
                if (firstSong) {
                    loadSong(firstSong);
                    if (isPlaying) playAudio();
                }
                return;
            }
        }
        const prevSong = currentQueue[currentQueueIndex];
        if (prevSong) {
            loadSong(prevSong);
            if (isPlaying) { playAudio(); }
        } else {
            console.error(`PlayPrevious: Música não encontrada ${currentQueueIndex}`);
            pauseAudio();
        }
    }

    function toggleShuffle() {
        isShuffle = !isShuffle;
        playerShuffleBtn?.classList.toggle('active', isShuffle);
        console.log("Shuffle:", isShuffle ? "Ativado" : "Desativado");
    }

    function toggleRepeat() {
        const repeatIcon = playerRepeatBtn?.querySelector('i');
        if (!repeatIcon) return;
        if (repeatMode === 'none') {
            repeatMode = 'all'; playerRepeatBtn?.classList.add('active'); repeatIcon.className = 'fas fa-repeat';
            console.log("Repeat Mode: All");
        } else if (repeatMode === 'all') {
            repeatMode = 'one'; playerRepeatBtn?.classList.add('active'); repeatIcon.className = 'fas fa-repeat-1';
            console.log("Repeat Mode: One");
        } else {
            repeatMode = 'none'; playerRepeatBtn?.classList.remove('active'); repeatIcon.className = 'fas fa-repeat';
            console.log("Repeat Mode: None");
        }
    }

    function formatTime(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    let simulationInterval = null;
    function startSimulationTimer() {
        stopSimulationTimer();
        console.log("Starting simulation timer.");
        simulationInterval = setInterval(() => {
            if (isPlaying && playerSeekBar && currentSong) {
                let currentValue = parseFloat(playerSeekBar.value);
                const maxValue = parseFloat(playerSeekBar.max);
                if (maxValue <= 0) return;
                if (currentValue < maxValue) {
                    currentValue += 1;
                    playerSeekBar.value = currentValue;
                    if (playerCurrentTime) playerCurrentTime.textContent = formatTime(currentValue);
                } else {
                    console.log(`Simulação: ${currentSong.title} terminou.`);
                    playNext();
                }
            }
        }, 1000);
    }

    function stopSimulationTimer() {
        if (simulationInterval) {
            console.log("Stopping simulation timer.");
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
    }

    function initializePlayerListeners() {
        playerCloseBtn?.addEventListener('click', closePlayer);
        playerPlayPauseBtn?.addEventListener('click', togglePlay);
        playerNextBtn?.addEventListener('click', playNext);
        playerPrevBtn?.addEventListener('click', playPrevious);
        playerShuffleBtn?.addEventListener('click', toggleShuffle);
        playerRepeatBtn?.addEventListener('click', toggleRepeat);
        playerSeekBar?.addEventListener('input', () => {
            if (playerCurrentTime && playerSeekBar) {
                playerCurrentTime.textContent = formatTime(playerSeekBar.value);
            }
            stopSimulationTimer();
        });
        playerSeekBar?.addEventListener('change', () => {
            const seekTime = playerSeekBar ? parseFloat(playerSeekBar.value) : 0;
            console.log(`Simulação: Usuário ajustou para ${formatTime(seekTime)}`);
            if (playerCurrentTime) playerCurrentTime.textContent = formatTime(seekTime);
            if (isPlaying) { startSimulationTimer(); }
        });
        console.log("Listeners do Player inicializados.");
    }



    // --- 6. INICIALIZAÇÃO GERAL ---
    function bodyClickHandler(event) {
        console.log("Body click detected. Target element:", event.target);

        // Back Buttons
        const backButton = event.target.closest('[data-action="back"]');
        if (backButton) {
            console.log("Back button action matched.");
            event.preventDefault();
            handleBack();
            return;
        }

        // Refresh Buttons
        const refreshButton = event.target.closest('[data-action="refresh"]');
        if (refreshButton) {
            console.log("Refresh button action matched.");
            event.preventDefault();
            const icon = refreshButton.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            refreshButton.disabled = true;
            console.log("Manual refresh initiated...");
            refreshAllData().finally(() => {
                if (icon) icon.classList.remove('fa-spin');
                refreshButton.disabled = false;
                console.log("Manual refresh complete.");
            });
            return;
        }

        // Artist Navigation
        const artistCard = event.target.closest('.artist-card[data-artist-name]');
        if (artistCard) {
            console.log("Artist card action matched:", artistCard.dataset.artistName);
            openArtistDetail(artistCard.dataset.artistName);
            return;
        }
        const artistLink = event.target.closest('.artist-link[data-artist-name]');
        if (artistLink) {
            console.log("Artist link action matched:", artistLink.dataset.artistName);
            event.preventDefault();
            openArtistDetail(artistLink.dataset.artistName);
            return;
        }

        // Album/Single Navigation
        const albumCard = event.target.closest('[data-album-id]');
        if (albumCard) {
            console.log("Album card potentially matched:", albumCard.dataset.albumId);
            if (event.target.closest('.action-buttons') || event.target.closest('.studio-form-content')) {
                console.log("Ignoring click inside edit list actions or studio form.");
            } else {
                console.log("Navigating to album detail:", albumCard.dataset.albumId);
                openAlbumDetail(albumCard.dataset.albumId);
                return;
            }
        }

        // Song Playback
        const songRow = event.target.closest('.song-row[data-song-id], .track-row[data-song-id].available, .chart-item[data-song-id]');
        if (songRow) {
            console.log("Song row potentially matched:", songRow.dataset.songId);
            if (event.target.closest('.track-actions button') || songRow.closest('.studio-form-content')) {
                console.log("Ignoring click inside studio track actions.");
            } else {
                console.log("Opening player for song:", songRow.dataset.songId);
                openPlayer(songRow.dataset.songId, songRow);
                return;
            }
        }

        // Discography Links
        const discogLink = event.target.closest('.discography-link[data-discog-type]');
        if (discogLink) {
            console.log("Discography link action matched:", discogLink.dataset.discogType);
            event.preventDefault();
            openDiscographyDetail(discogLink.dataset.discogType);
            return;
        }

        console.log("Body click detected, but no specific interactive action matched.");
    }

    function initializeBodyClickListener() {
        console.log("Attempting to attach body click listener...");
        document.body.removeEventListener('click', bodyClickHandler);
        document.body.addEventListener('click', bodyClickHandler);
        console.log("Body click listener attached.");
    }

    function attachNavigationListeners() {
        console.log("Atribuindo listeners de navegação (abas, busca)...");
        const navButtons = document.querySelectorAll('.nav-tab, .bottom-nav-item');
        navButtons.forEach(button => {
            button.removeEventListener('click', switchTab);
            button.addEventListener('click', switchTab);
        });
        if (searchInput) {
            searchInput.removeEventListener('input', handleSearch);
            searchInput.addEventListener('input', handleSearch);
        }
        console.log("Listeners de navegação atribuídos.");
    }

    // --- Função Principal de Inicialização ---
    async function main() {
        document.body.classList.add('loading');
        console.log("Aplicação iniciada.");
        if (!initializeDOMElements()) { console.error("Falha DOM."); document.body.classList.remove('loading'); return; }
        const data = await loadAllData();
        if (!data) { console.error("Falha Airtable."); document.body.classList.remove('loading'); return; }
        if (!initializeData(data)) { console.error("Falha processar dados."); document.body.classList.remove('loading'); return; }
        try {
            console.log("Renderizando componentes iniciais...");
            renderRPGChart();
            renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10));
            renderChart('music');
            renderChart('album');
        } catch (renderError) { console.error("Erro renderização:", renderError); }
        try {
            attachNavigationListeners();
            initializeBodyClickListener();
            initializeStudio();
            initializePlayerListeners();
        } catch (listenerError) { console.error("Erro listeners:", listenerError); }
        try {
            setupCountdown('rpgChartTimer', 'rpg');
            setupCountdown('musicChartTimer', 'music');
            setupCountdown('albumChartTimer', 'album');
        } catch (countdownError) { console.error("Erro countdowns:", countdownError); }
        switchView('mainView');
        activateMainViewSection('homeSection');
        document.body.classList.remove('loading');
        console.log("Aplicação pronta.");
    }

    main().catch(err => {
        console.error("Erro fatal main:", err);
        document.body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Erro Fatal</h1><p>Ver console.</p></div>';
        document.body.classList.remove('loading');
    });

});
