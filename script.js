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

            // Simplified check, add new elements if strict checking is needed
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
                 albumIsDeluxeCheckbox, albumTrackIsBonusCheckbox, editDeluxeGroup, editAlbumIsDeluxeCheckbox // Check new ones
             ];


            if (!allViews || allViews.length === 0 || essentialElements.some(el => !el)) {
                console.error("ERRO CRÍTICO: Um ou mais elementos essenciais do HTML não foram encontrados!");
                // Optionally log which ones are missing
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
                    // isBonusTrack is already included from loadAllData
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
        const customSort = (a, b) => { /* ... (sort logic remains the same) ... */
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
                 const fullSong = db.songs.find(s => s.id === song.id); // Get full song for bonus status
                 const isBonus = fullSong ? fullSong.isBonusTrack : (song.isBonusTrack || false); // <<< Bonus Check
                 let bonusIndicator = isBonus ? ' <span class="bonus-track-indicator">(Bonus Track)</span>' : ''; // <<< Bonus Indicator
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
        const customSort = (a, b) => { /* ... (sort logic) ... */
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

    const handleSearch = () => { /* ... ( unchanged ) ... */
         const query = searchInput.value.toLowerCase().trim();
         if (!query) { switchTab(null, 'homeSection'); return; }
         const resultsContainer = document.getElementById('searchResults');
         const noResultsElement = document.getElementById('noResults');
         if (!resultsContainer || !noResultsElement) { console.error("Elementos de busca não encontrados."); return; }
         const filteredArtists = db.artists.filter(a => a.name.toLowerCase().includes(query));
         const filteredAlbums = [...db.albums, ...db.singles].filter(a => a.title.toLowerCase().includes(query));
         let html = '', resultCount = 0;
         if (filteredArtists.length > 0) {
             html += '<h3 class="section-title">Artistas</h3>';
             html += filteredArtists.map(a => { resultCount++; return `... (artist card HTML) ...`; }).join('');
         }
         if (filteredAlbums.length > 0) {
             html += '<h3 class="section-title">Álbuns & Singles</h3>';
             html += filteredAlbums.map(al => { resultCount++; return `... (album card HTML) ...`; }).join('');
         }
         resultsContainer.innerHTML = html;
         if (resultCount > 0) { noResultsElement.classList.add('hidden'); resultsContainer.classList.remove('hidden'); }
         else { noResultsElement.classList.remove('hidden'); resultsContainer.classList.add('hidden'); }
         switchTab(null, 'searchSection');
    };

    const setupCountdown = (timerId, chartType) => { /* ... ( unchanged ) ... */ };
    function startAlbumCountdown(targetDateISO, containerId) { /* ... ( unchanged ) ... */ }

    // --- 3. SISTEMA DE RPG ---
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;
    const calculateSimulatedStreams = (points, lastActiveISO) => { /* ... ( unchanged ) ... */ };
    const computeChartData = (artistsArray) => { /* ... ( unchanged ) ... */ };
    function renderRPGChart() { /* ... ( unchanged ) ... */ }

    // --- 4. SISTEMA DO ESTÚDIO ---
    function populateTracklistEditor(editorElement, tracks) { /* ... (unchanged, handles bonus display via dataset later) ... */
        if (!editorElement) return;
        editorElement.innerHTML = '';
        if (!tracks || tracks.length === 0) { editorElement.innerHTML = '<p class="empty-state-small">Nenhuma faixa.</p>'; return; }
        const sortedTracks = [...tracks].sort((a, b) => (a.trackNumber || 99) - (b.trackNumber || 99));
        sortedTracks.forEach(track => {
            const fullSong = db.songs.find(s => s.id === track.id);
            if (!fullSong) { console.warn(`Dados completos não encontrados para faixa ${track.id}`); return; }
            const featsData = (fullSong.artistIds || []).slice(1).map(artistId => { /* ... feat data logic ... */
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
                <div class="track-actions">...</div>
                <div class="track-info-display">
                    ${titleDisplay}
                    <div class="track-details-display">
                        <span class="duration">Duração: ${fullSong.duration}</span>
                        <span class="type">Tipo: ${fullSong.trackType}${isBonus ? ' (Bônus)' : ''}</span>
                    </div>
                    <div class="feat-list feat-list-display">...</div>
                </div>`;
            editorElement.appendChild(newItem);
        });
        updateTrackNumbers(editorElement);
     }

    function initializeStudio() { /* ... (unchanged) ... */ }
    function loginPlayer(username, password) { /* ... (unchanged) ... */ }
    function logoutPlayer() { /* ... (unchanged) ... */ }
    function populateArtistSelector(playerId) { /* ... (unchanged) ... */ }
    function populateArtistSelectForFeat(targetSelectElement) { /* ... (unchanged) ... */ }
    function openFeatModal(buttonElement) { /* ... (unchanged) ... */ }
    function closeFeatModal() { /* ... (unchanged) ... */ }
    function confirmFeat() { /* ... (unchanged) ... */ }
    function toggleInlineFeatAdder() { /* ... (unchanged) ... */ }
    function confirmInlineFeat() { /* ... (unchanged) ... */ }
    function cancelInlineFeat() { /* ... (unchanged) ... */ }

    function openAlbumTrackModal(itemToEdit = null) {
        if (!albumTrackModal || !albumTrackNameInput || !albumTrackDurationInput || !albumTrackTypeSelect || !albumTrackFeatList || !editingTrackItemId || !editingTrackExistingId || !albumTrackIsBonusCheckbox) { // Check bonus checkbox
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
                // Still allow editing name/duration/feats for existing tracks in this context
            }
            try { featsToPopulate.forEach(f => { /* ... populate feat tags ... */ }); } catch (e) { console.error("Erro ao parsear feats:", e); }
        } else {
            albumTrackModalTitle.textContent = 'Adicionar Faixa (Nova)';
            editingTrackItemId.value = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            albumTrackIsBonusCheckbox.checked = false; // Ensure unchecked for new
        }
        albumTrackModal.classList.remove('hidden');
    }

    function closeAlbumTrackModal() { /* ... (unchanged) ... */ }

    function saveAlbumTrack() {
        if (!activeTracklistEditor || !albumTrackNameInput || !albumTrackDurationInput || !albumTrackTypeSelect || !albumTrackFeatList || !editingTrackItemId || !editingTrackExistingId || !albumTrackIsBonusCheckbox) { // check bonus
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
        if (existingSongId && editingTrackItem) { /* ... (link breaking logic remains the same) ... */ }

        if (targetElement) { // Editing
            console.log(`Editando item ${itemId}. Bônus: ${isBonus}`);
            targetElement.dataset.trackName = name;
            targetElement.dataset.durationStr = durationStr;
            targetElement.dataset.feats = featsJSON;
            targetElement.dataset.trackType = type;
            targetElement.dataset.isBonusTrack = isBonus; // <<< Update dataset
            if (linkBroken) { delete targetElement.dataset.existingSongId; }

            const titleSpan = targetElement.querySelector('.track-title-display');
            if (titleSpan) { /* ... (update title visuals, including bonus indicator) ... */
                let bonusIndicator = isBonus ? ' <span class="bonus-track-indicator">(Bônus)</span>' : '';
                titleSpan.innerHTML = name + bonusIndicator; // Update text, add bonus indicator
                if (existingSongId && !linkBroken) {
                     if (!titleSpan.querySelector('i.fa-link')) { // Add link icon if missing
                         titleSpan.innerHTML = `<i class="fas fa-link" style="font-size: 10px; margin-right: 5px;" title="Faixa Existente"></i>${name}${bonusIndicator}`;
                     }
                     titleSpan.style.color = 'var(--spotify-green)';
                } else {
                     titleSpan.innerHTML = name + bonusIndicator; // Ensure link icon is removed if link broken
                     titleSpan.style.color = '';
                }
            }
            const detailsDiv = targetElement.querySelector('.track-details-display');
            if (detailsDiv) { /* ... (update duration and type visuals, including bonus indicator) ... */
                const durationSpan = detailsDiv.querySelector('.duration');
                const typeSpan = detailsDiv.querySelector('.type');
                if (durationSpan) durationSpan.textContent = `Duração: ${durationStr}`;
                if (typeSpan) typeSpan.textContent = `Tipo: ${type}${isBonus ? ' (Bônus)' : ''}`; // <<< Update type display
            }
            const featDisplay = targetElement.querySelector('.feat-list-display');
            if (featDisplay) { featDisplay.innerHTML = featsData.map(f => `<span class="feat-tag-display">${f.type} ${f.name}</span>`).join(''); }
            targetElement.classList.toggle('bonus', isBonus); // Optional class for styling

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

    function updateTrackNumbers(editorElement) { /* ... (unchanged) ... */ }

    // --- Funções da API Airtable ---
    async function createAirtableRecord(tableName, fields) { /* ... (unchanged) ... */ }
    async function batchCreateAirtableRecords(tableName, recordsFields) { /* ... (unchanged) ... */ }
    async function updateAirtableRecord(tableName, recordId, fields) { /* ... (unchanged) ... */ }
    async function batchUpdateAirtableRecords(tableName, recordsToUpdate) { /* ... (unchanged) ... */ }
    async function deleteAirtableRecord(tableName, recordId) { /* ... (unchanged) ... */ }
    async function batchDeleteAirtableRecords(tableName, recordIds) { /* ... (unchanged) ... */ }
    function parseDurationToSeconds(durationStr) { /* ... (unchanged) ... */ }

    // --- FUNÇÕES DE UI (Estúdio) ---
    function populatePlayerTracks(selectElementId) { /* ... (unchanged) ... */ }
    function toggleSingleFormMode(isResetting = false) { /* ... (unchanged) ... */ }
    function openExistingTrackModal(context) { /* ... (unchanged) ... */ }
    function closeExistingTrackModal() { /* ... (unchanged) ... */ }
    function populateExistingTrackSearch() { /* ... (unchanged) ... */ }
    function handleExistingTrackSelect(event) { /* ... (unchanged) ... */ }

    function addExistingTrackToAlbum(songId) {
        const song = db.songs.find(s => s.id === songId);
        if (!song || !activeTracklistEditor) { console.error("Falha ao adicionar faixa existente."); return; }
        if (activeTracklistEditor.querySelector(`[data-existing-song-id="${song.id}"]`)) { alert("Música já adicionada."); return; }
        const featsData = (song.artistIds || []).slice(1).map(artistId => { /* ... feat data logic ... */ });
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
        const titleDisplay = `<span class="track-title-display" style="color: var(--spotify-green);">...${song.title}${bonusIndicator}</span>`;
        newItem.innerHTML = `
            <span class="track-number-display"></span>
            <i class="fas fa-bars drag-handle"></i>
            <div class="track-actions">...</div>
            <div class="track-info-display">
                ${titleDisplay}
                <div class="track-details-display">
                    <span class="duration">Duração: ${song.duration}</span>
                    <span class="type">Tipo: ${song.trackType}${song.isBonusTrack ? ' (Bônus)' : ''}</span>
                </div>
                <div class="feat-list feat-list-display">...</div>
            </div>`;
        const emptyState = activeTracklistEditor.querySelector('.empty-state-small');
        if (emptyState) emptyState.remove();
        activeTracklistEditor.appendChild(newItem);
        updateTrackNumbers(activeTracklistEditor);
        closeExistingTrackModal();
    }

    // --- FUNÇÕES DE SUBMISSÃO ---
    async function handleSingleSubmit(event) { /* ... (unchanged) ... */ }
    async function processSingleSubmission(trackType) { /* ... (unchanged, bonus not relevant for single track submission) ... */ }
    function initAlbumForm() { /* ... (unchanged, bonus checkbox reset handled by form.reset()) ... */ }

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
            let releaseDateISO; try { /* ... date conversion ... */ } catch (e) { throw new Error("Data inválida."); }
            const trackItems = albumTracklistEditor?.querySelectorAll('.track-list-item-display');
            if (!trackItems || trackItems.length === 0) throw new Error("Adicione faixas.");

            const musicRecordsToCreate = [];
            const musicRecordsToUpdate = [];
            totalDurationSeconds = 0; // Recalculate duration

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
                    if (feats.length > 0) { /* ... feat name/id logic ... */ }
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
            musicRecordsToUpdate.forEach(record => { /* ... logic to add link, preserving existing links ... */ });

            let allMusicOpsSucceeded = true;
            if (musicRecordsToCreate.length > 0) { /* ... batch create, check result ... */ }
            if (musicRecordsToUpdate.length > 0) { /* ... batch update, check result ... */ }

            if (!allMusicOpsSucceeded) { alert(`${isAlbum ? 'Álbum' : 'EP'} lançado, mas erro nas faixas.`); }
            else { alert(`${isAlbum ? 'Álbum' : 'EP'} lançado com sucesso!`); }

            newAlbumForm?.reset(); // Resets deluxe checkbox too
            if (albumReleaseDateInput) { /* ... reset date ... */ }
            initAlbumForm();
            await refreshAllData();

        } catch (error) {
            alert(`Erro ao lançar ${isAlbum ? 'Álbum' : 'EP'}: ${error.message}.`);
            console.error(`Erro handleAlbumSubmit:`, error);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                const finalIsAlbum = totalDurationSeconds >= IS_ALBUM_THRESHOLD_SECONDS;
                submitButton.textContent = `Lançar ${finalIsAlbum ? 'Álbum' : 'EP'}`;
            }
        }
    }

    // --- FUNÇÕES DE EDIÇÃO/EXCLUSÃO ---
    function populateEditableReleases() { /* ... (unchanged) ... */ }

    function openEditForm(releaseId, releaseType) {
         // Use combined list to find the release correctly
         const release = [...db.albums, ...db.singles].find(r => r.id === releaseId);
         if (!release || !editReleaseForm /*... check other elements ...*/ || !editDeluxeGroup || !editAlbumIsDeluxeCheckbox) {
             alert("Erro ao abrir edição."); return;
         }
         editReleaseId.value = release.id;
         editReleaseType.value = release.type; // Use the type determined during data load
         editReleaseTableName.value = release.tableName;
         editArtistNameDisplay.textContent = release.artist;
         editReleaseTitle.value = release.title;
         editReleaseCoverUrl.value = release.imageUrl;
         if (release.releaseDate) { try { /* ... set date input value ... */ } catch (e) { /* ... handle error ... */ } }
         else { editReleaseDate.value = ''; }

         // <<< Handle Deluxe Checkbox Visibility and State >>>
         if (release.tableName === 'Álbuns') {
             editDeluxeGroup.classList.remove('hidden');
             editAlbumIsDeluxeCheckbox.checked = release.isDeluxe || false;
         } else {
             editDeluxeGroup.classList.add('hidden');
             editAlbumIsDeluxeCheckbox.checked = false;
         }

         // Tracklist Logic
         if (!editAlbumTracklistEditor || !editTracklistActions) { /* ... handle missing elements ... */ }
         else {
             editAlbumTracklistEditor.classList.remove('hidden');
             editTracklistActions.classList.remove('hidden');
             populateTracklistEditor(editAlbumTracklistEditor, release.tracks);
             if (editAlbumTracklistEditor && typeof Sortable !== 'undefined') { /* ... re-init sortable ... */ }
         }
         editReleaseListContainer?.classList.add('hidden');
         editReleaseForm.classList.remove('hidden');
    }

    async function handleUpdateRelease(event) {
        event.preventDefault();
        if (!saveEditBtn /*... check other elements ...*/ || !editAlbumIsDeluxeCheckbox) { console.error("Elementos de edição faltando."); return; }
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
        let updatedReleaseDateISO; try { /* ... date conversion ... */ } catch (e) { alert("Data inválida."); return; }
        saveEditBtn.disabled = true; saveEditBtn.textContent = 'Salvando...';

        try {
            const titleFieldName = (tableName === 'Álbuns') ? 'Nome do Álbum' : 'Nome do Single/EP';
            const coverFieldName = (tableName === 'Álbuns') ? 'Capa do Álbum' : 'Capa';
            const fieldsToUpdate = {
                [titleFieldName]: updatedTitle, [coverFieldName]: [{ "url": updatedCoverUrl }],
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

                     if (musicRecordsToCreate.length > 0) { /* ... batch create, check result, add ids to finalTrackIdsInEditor ... */ }
                     const tracksToUnlinkIds = [...originalTrackIds].filter(id => !finalTrackIdsInEditor.has(id));
                     if (tracksToUnlinkIds.length > 0) { /* ... prepare and batch update to unlink ... */ }
                     if (musicRecordsToUpdate.length > 0) { /* ... batch update existing tracks ... */ }

                 } // End if editor visible
             } // End if album or EP

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

    function openDeleteConfirmModal(recordId, tableName, releaseTitle, trackIds) { /* ... (unchanged) ... */ }
    function closeDeleteConfirmModal() { /* ... (unchanged) ... */ }
    async function handleDeleteRelease() { /* ... (unchanged, bonus/deluxe don't affect delete logic) ... */ }

    // --- 5. LÓGICA DO PLAYER DE MÚSICA ---
    function openPlayer(songId, clickedElement) { /* ... (unchanged) ... */ }
    function closePlayer() { /* ... (unchanged) ... */ }
    function loadSong(song) { /* ... (unchanged) ... */ }
    function playAudio() { /* ... (unchanged) ... */ }
    function pauseAudio() { /* ... (unchanged) ... */ }
    function togglePlay() { /* ... (unchanged) ... */ }
    function playNext() { /* ... (unchanged) ... */ }
    function playPrevious() { /* ... (unchanged) ... */ }
    function toggleShuffle() { /* ... (unchanged) ... */ }
    function toggleRepeat() { /* ... (unchanged) ... */ }
    function formatTime(totalSeconds) { /* ... (unchanged) ... */ }
    let simulationInterval = null;
    function startSimulationTimer() { /* ... (unchanged) ... */ }
    function stopSimulationTimer() { /* ... (unchanged) ... */ }
    function initializePlayerListeners() { /* ... (unchanged) ... */ }

    // --- 6. INICIALIZAÇÃO GERAL ---
    function bodyClickHandler(event) {
        console.log("Body click detected. Target element:", event.target);
        // Back Buttons
        const backButton = event.target.closest('[data-action="back"]');
        if (backButton) { console.log("Back button action matched."); event.preventDefault(); handleBack(); return; }
        // Refresh Buttons
        const refreshButton = event.target.closest('[data-action="refresh"]');
        if (refreshButton) { console.log("Refresh button action matched."); event.preventDefault(); /* ... refresh logic ... */ return; }
        // Artist Navigation
        const artistCard = event.target.closest('.artist-card[data-artist-name]');
        if (artistCard) { console.log("Artist card action matched:", artistCard.dataset.artistName); openArtistDetail(artistCard.dataset.artistName); return; }
        const artistLink = event.target.closest('.artist-link[data-artist-name]');
        if (artistLink) { console.log("Artist link action matched:", artistLink.dataset.artistName); event.preventDefault(); openArtistDetail(artistLink.dataset.artistName); return; }
        // Album/Single Navigation
        const albumCard = event.target.closest('[data-album-id]');
        if (albumCard) {
            console.log("Album card potentially matched:", albumCard.dataset.albumId);
            if (event.target.closest('.action-buttons') || event.target.closest('.studio-form-content')) { console.log("Ignoring click inside edit/studio."); }
            else { console.log("Navigating to album detail:", albumCard.dataset.albumId); openAlbumDetail(albumCard.dataset.albumId); return; }
        }
        // Song Playback
        const songRow = event.target.closest('.song-row[data-song-id], .track-row[data-song-id].available, .chart-item[data-song-id]');
        if (songRow) {
            console.log("Song row potentially matched:", songRow.dataset.songId);
            if (event.target.closest('.track-actions button') || songRow.closest('.studio-form-content')) { console.log("Ignoring click inside studio actions."); }
            else { console.log("Opening player for song:", songRow.dataset.songId); openPlayer(songRow.dataset.songId, songRow); return; }
        }
        // Discography Links
        const discogLink = event.target.closest('.discography-link[data-discog-type]');
        if (discogLink) { console.log("Discography link action matched:", discogLink.dataset.discogType); event.preventDefault(); openDiscographyDetail(discogLink.dataset.discogType); return; }
        // No match
        console.log("Body click detected, but no specific interactive action matched.");
    }

    function initializeBodyClickListener() { /* ... (unchanged) ... */ }
    function attachNavigationListeners() { /* ... (unchanged) ... */ }

    async function main() {
        document.body.classList.add('loading');
        console.log("Aplicação iniciada.");
        if (!initializeDOMElements()) { console.error("Falha DOM."); document.body.classList.remove('loading'); return; }
        const data = await loadAllData();
        if (!data) { console.error("Falha Airtable."); document.body.classList.remove('loading'); return; }
        if (!initializeData(data)) { console.error("Falha processar dados."); document.body.classList.remove('loading'); return; }
        try { /* ... render components ... */ } catch (renderError) { console.error("Erro renderização:", renderError); }
        try { /* ... attach listeners ... */ } catch (listenerError) { console.error("Erro listeners:", listenerError); }
        try { /* ... setup countdowns ... */ } catch (countdownError) { console.error("Erro countdowns:", countdownError); }
        switchView('mainView');
        activateMainViewSection('homeSection');
        document.body.classList.remove('loading');
        console.log("Aplicação pronta.");
    }

    main().catch(err => {
        console.error("Erro fatal main:", err);
        document.body.innerHTML = '<div><h1>Erro Fatal</h1><p>Ver console.</p></div>';
        document.body.classList.remove('loading');
    });

}); // End DOMContentLoaded
