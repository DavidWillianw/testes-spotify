document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], singles: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null;
    let currentFeatTarget = null;
    let viewHistory = [];
    let editingTrackItem = null;
    // Dados dos charts anteriores
    let previousMusicChartData = {};
    let previousAlbumChartData = {};
    let previousRpgChartData = {};
    let albumCountdownInterval = null; // Timer do pré-lançamento

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
        newAlbumForm, albumArtistSelect, albumReleaseDateInput,
        albumTracklistEditor,
        featModal, featArtistSelect,
        featTypeSelect, confirmFeatBtn, cancelFeatBtn,
        trackTypeModal, trackTypeSelect, confirmTrackTypeBtn, cancelTrackTypeBtn,
        albumTrackModal, albumTrackModalTitle, openAddTrackModalBtn,
        albumTrackNameInput, albumTrackDurationInput, albumTrackTypeSelect,
        albumTrackFeatList, saveAlbumTrackBtn, cancelAlbumTrackBtn, editingTrackItemId,
        inlineFeatAdder, inlineFeatArtistSelect, inlineFeatTypeSelect,
        confirmInlineFeatBtn, cancelInlineFeatBtn, addInlineFeatBtn;


    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';

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
            albumTrackFeatList = document.getElementById('albumTrackFeatList');
            saveAlbumTrackBtn = document.getElementById('saveAlbumTrackBtn');
            cancelAlbumTrackBtn = document.getElementById('cancelAlbumTrackBtn');
            editingTrackItemId = document.getElementById('editingTrackItemId');

            inlineFeatAdder = document.getElementById('inlineFeatAdder');
            inlineFeatArtistSelect = document.getElementById('inlineFeatArtistSelect');
            inlineFeatTypeSelect = document.getElementById('inlineFeatTypeSelect');
            confirmInlineFeatBtn = document.getElementById('confirmInlineFeatBtn');
            cancelInlineFeatBtn = document.getElementById('cancelInlineFeatBtn');
            addInlineFeatBtn = albumTrackModal.querySelector('.add-inline-feat-btn');

            // --- INICIALIZAÇÃO DO PLAYER ---
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

            const playerElements = [audioElement, musicPlayerView, playerCloseBtn, playerPlayPauseBtn, playerSeekBar, playerNextBtn, playerPrevBtn];
            if (playerElements.some(el => !el)) {
                 console.error("ERRO CRÍTICO: Elementos essenciais do PLAYER não foram encontrados!");
                 return false;
            }
            // --- FIM DA INICIALIZAÇÃO DO PLAYER ---


            const essentialElements = [ studioView, loginPrompt, playerSelect, newSingleForm, newAlbumForm, featModal, singleReleaseDateInput, albumReleaseDateInput, trackTypeModal, albumTrackModal, openAddTrackModalBtn, inlineFeatAdder, inlineFeatArtistSelect, confirmInlineFeatBtn, addInlineFeatBtn ];
            if (!allViews || allViews.length === 0 || essentialElements.some(el => !el)) {
                 console.error("ERRO CRÍTICO: Elementos essenciais do HTML não foram encontrados!", { missing: essentialElements.map((el, i) => el ? null : `Index ${i}`).filter(Boolean) });
                document.body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Erro Interface</h1><p>Elementos não encontrados.</p></div>';
                return false;
            }

            const today = new Date().toISOString().split('T')[0];
            singleReleaseDateInput.value = today;
            albumReleaseDateInput.value = today;

            console.log("DOM elements initialized.");
            return true;
        } catch(error) {
             console.error("Erro ao inicializar elementos do DOM:", error);
             document.body.innerHTML = '<div style="color: red; padding: 20px;"><h1>Erro Interface</h1><p>Erro ao buscar elementos. Ver console.</p></div>';
             return false;
        }
    }

    // --- 1. CARREGAMENTO DE DADOS ---
    async function fetchAllAirtablePages(baseUrl, fetchOptions) {
        let allRecords = []; let offset = null;
        do { const sep = baseUrl.includes('?')?'&':'?'; const url = offset?`${baseUrl}${sep}offset=${offset}`:baseUrl; const res = await fetch(url, fetchOptions); if (!res.ok) { const txt = await res.text(); console.error(`Falha ${url}: ${res.status}-${txt}`); throw new Error(`Fetch fail ${baseUrl}`); } const data = await res.json(); if (data.records) { allRecords.push(...data.records); } offset = data.offset; } while (offset); return { records: allRecords };
    }
    
    async function loadAllData() {
        const artistsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists?filterByFormula=%7BArtista%20Principal%7D%3D1`;
        const albumsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Álbuns')}`;
        const musicasURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Músicas')}`;
        const singlesURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Singles e EPs')}`;
        const playersURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jogadores`;
        
        const fetchOptions = { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } };
        console.log("Carregando dados...");
        try {
            const [artistsData, albumsData, musicasData, singlesData, playersData] = await Promise.all([
                fetchAllAirtablePages(artistsURL, fetchOptions),
                fetchAllAirtablePages(albumsURL, fetchOptions),
                fetchAllAirtablePages(musicasURL, fetchOptions),
                fetchAllAirtablePages(singlesURL, fetchOptions),
                fetchAllAirtablePages(playersURL, fetchOptions)
            ]);

            if (!playersData) {
                console.error("Falha ao carregar dados dos Jogadores.");
            }

            if (!artistsData || !albumsData || !musicasData || !singlesData) {
                throw new Error('Falha ao carregar dados essenciais.');
            }

            const musicasMap = new Map();
            (musicasData.records || []).forEach(r => {
                const artistIds = Array.isArray(r.fields['Artista']) ? r.fields['Artista'] : [r.fields['Artista']].filter(Boolean);
                const pId = (r.fields['Álbuns']?.[0]) || (r.fields['Singles e EPs']?.[0]) || null;
                musicasMap.set(r.id, {
                    id: r.id,
                    title: r.fields['Nome da Faixa']||'?',
                    duration: r.fields['Duração']?new Date(r.fields['Duração']*1000).toISOString().substr(14,5):"0:00",
                    trackNumber: r.fields['Nº da Faixa']||0,
                    durationSeconds: r.fields['Duração']||0,
                    artistIds: artistIds,
                    collabType: r.fields['Tipo de Colaboração'],
                    albumId: pId,
                    streams: r.fields.Streams||0,
                    totalStreams: r.fields['Streams Totais']||0,
                    trackType: r.fields['Tipo de Faixa'] || 'Album Track'
                });
            });

            const artistsMapById = new Map();
            const artistsList = (artistsData.records || []).map(r => {
                const a = {
                    id: r.id,
                    name: r.fields.Name||'?',
                    imageUrl: (r.fields['URL da Imagem']?.[0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: r.fields['Inspirações (Off)']||[],
                    RPGPoints: r.fields.RPGPoints||0,
                    LastActive: r.fields.LastActive||null
                };
                artistsMapById.set(a.id, a.name);
                return a;
            });

            const formatReleases = (records, isAlbum) => {
                if (!records) return [];
                return records.map(r => {
                    const f=r.fields; const id=r.id;
                    const tracks = Array.from(musicasMap.values()).filter(s => s.albumId===id).sort((a,b)=>(a.trackNumber||0)-(b.trackNumber||0));
                    
                    const dur = tracks.reduce((t, tr) => t+(tr.durationSeconds||0), 0);
                    const totalAlbumStreams = tracks.reduce((t, tr) => t + (tr.totalStreams || 0), 0);
                    
                    const artId = Array.isArray(f['Artista']) ? f['Artista'][0] : (f['Artista']||null);
                    const artName = artId ? artistsMapById.get(artId) : "?";
                    const imgF = isAlbum?'Capa do Álbum':'Capa';
                    const imgUrl = (f[imgF]?.[0]?.url)||'https://i.imgur.com/AD3MbBi.png';
                    
                    return {
                        id: id,
                        title: f['Nome do Álbum']||f['Nome do Single/EP']||'?',
                        artist: artName,
                        artistId: artId,
                        metascore: f['Metascore']||0,
                        imageUrl: imgUrl,
                        releaseDate: f['Data de Lançamento']||'?',
                        tracks: tracks,
                        totalDurationSeconds: dur,
                        weeklyStreams: f['Stream do album'] || 0,
                        totalStreams: totalAlbumStreams
                    };
                });
            };

            const formattedAlbums = formatReleases(albumsData.records, true);
            const formattedSingles = formatReleases(singlesData.records, false);
            const formattedPlayers = (playersData?.records||[]).map(r => ({ id: r.id, name: r.fields.Nome, artists: r.fields.Artistas||[] }));
            
            console.log("Dados carregados.");
            return {
                allArtists: artistsList,
                albums: formattedAlbums,
                singles: formattedSingles,
                players: formattedPlayers,
                musicas: Array.from(musicasMap.values())
            };
        } catch (error) {
            console.error("Falha GERAL loadAllData:", error);
            return null;
        }
    }
    
    const initializeData = (data) => {
        try {
            try {
                const prevMusic = localStorage.getItem(PREVIOUS_MUSIC_CHART_KEY);
                previousMusicChartData = prevMusic ? JSON.parse(prevMusic) : {};
                const prevAlbum = localStorage.getItem(PREVIOUS_ALBUM_CHART_KEY);
                previousAlbumChartData = prevAlbum ? JSON.parse(prevAlbum) : {};
                const prevRpg = localStorage.getItem(PREVIOUS_RPG_CHART_KEY);
                previousRpgChartData = prevRpg ? JSON.parse(prevRpg) : {};
                console.log("Previous chart data loaded.");
            } catch (e) {
                console.error("Error loading previous chart data:", e);
                previousMusicChartData = {}; previousAlbumChartData = {}; previousRpgChartData = {};
            }

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

            const releaseDateMap = new Map();
            const allReleasesForDateMap = [...(data.albums || []), ...(data.singles || [])];
            allReleasesForDateMap.forEach(item => {
                releaseDateMap.set(item.id, item.releaseDate);
            });

            db.songs = (data.musicas || []).map(song => ({
                ...song,
                streams: song.streams || 0,
                totalStreams: song.totalStreams || 0,
                cover: 'https://i.imgur.com/AD3MbBi.png',
                artist: artistsMapById.get((song.artistIds || [])[0]) || '?',
                parentReleaseDate: releaseDateMap.get(song.albumId) || null
            }));

            db.albums = [];
            db.singles = [];

            const allReleases = [...(data.albums || []), ...(data.singles || [])];
            const thirtyMinSec = 30 * 60;
            
            allReleases.forEach(item => {
                (item.tracks || []).forEach(tInfo => {
                    const s = db.songs.find(sDb => sDb.id === tInfo.id);
                    if (s) { s.cover = item.imageUrl; } 
                    else { console.warn(`Song ${tInfo.id} not found.`); }
                });

                const artistEntry = db.artists.find(a => a.id === item.artistId);

                if ((item.totalDurationSeconds || 0) >= thirtyMinSec) {
                    db.albums.push(item);
                    if (artistEntry) { artistEntry.albums.push(item); }
                } else {
                    db.singles.push(item);
                    if (artistEntry) { artistEntry.singles.push(item); }
                }

                if (!artistEntry && item.artist !== "?") {
                    console.warn(`Artist ${item.artist} not found.`);
                }
            });

            db.players = data.players || [];

            console.log(`DB Init: A${db.artists.length}, B${db.albums.length}, S${db.singles.length}, M${db.songs.length}, P${db.players.length}`);
            return true;
        } catch (error) {
            console.error("CRITICAL initializeData:", error);
            alert("Erro GRAVE init data.");
            return false;
        }
    };
    
    const saveChartDataToLocalStorage = (chartType) => {
        let currentChartData; let storageKey; let dataList;
        console.log(`Saving previous chart data for: ${chartType}`);
        
        if (chartType === 'music') {
            storageKey = PREVIOUS_MUSIC_CHART_KEY;
            dataList = [...db.songs].sort((a,b)=>(b.streams||0)-(a.streams||0)).slice(0,50); 
            currentChartData = dataList.reduce((acc,item,index)=>{ acc[item.id]=index+1; return acc; },{});
            previousMusicChartData=currentChartData;
        
        } else if (chartType === 'album') {
            storageKey = PREVIOUS_ALBUM_CHART_KEY;
            dataList = [...db.albums].sort((a,b)=>(b.weeklyStreams||0)-(a.weeklyStreams||0)).slice(0,50); 
            currentChartData = dataList.reduce((acc,item,index)=>{ acc[item.id]=index+1; return acc; },{});
            previousAlbumChartData=currentChartData;
        
        } else if (chartType === 'rpg') {
            storageKey = PREVIOUS_RPG_CHART_KEY;
            dataList = computeChartData(db.artists);
            currentChartData = dataList.reduce((acc,item,index)=>{ acc[item.id]=index+1; return acc; },{});
            previousRpgChartData=currentChartData;
        
        } else {
            console.error("Invalid chartType:", chartType);
            return;
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(currentChartData));
            console.log(`${chartType} chart saved.`);
        } catch (e) {
            console.error(`Error saving ${chartType} chart:`, e);
        }
    };

    async function refreshAllData() { console.log("Atualizando dados..."); const data = await loadAllData(); if (data && data.allArtists) { if (initializeData(data)) { console.log("Dados atualizados."); renderRPGChart(); renderArtistsGrid('homeGrid', [...(db.artists||[])].sort(()=>0.5-Math.random()).slice(0,10)); renderChart('music'); renderChart('album'); if (currentPlayer) { populateArtistSelector(currentPlayer.id); } if (activeArtist && !document.getElementById('artistDetail').classList.contains('hidden')) { const refreshed = db.artists.find(a=>a.id===activeArtist.id); if(refreshed){ openArtistDetail(refreshed.name); } else { handleBack(); } } return true; } } console.error("Falha ao atualizar."); alert("Não foi possível atualizar."); return false; }

    // --- 2. NAVEGAÇÃO E UI ---
    const switchView = (viewId, targetSectionId = null) => {
        if (albumCountdownInterval) { clearInterval(albumCountdownInterval); albumCountdownInterval = null; }
        console.log(`Switching view: ${viewId}`);
        allViews.forEach(v => v.classList.add('hidden'));
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0,0);
            if (viewId==='mainView'&&targetSectionId) {
                switchTab(null, targetSectionId);
            }
            if (viewId!=='mainView'&&viewId!=='studioView') {
                if (viewHistory.length===0||viewHistory[viewHistory.length-1]!==viewId) {
                    viewHistory.push(viewId);
                }
            } else if (viewId==='mainView') {
                viewHistory=[];
            }
        } else {
            console.error(`View ${viewId} not found.`);
        }
    };

    const switchTab = (event, forceTabId = null) => { let tabId; if (forceTabId) { tabId = forceTabId; } else if (event) { event.preventDefault(); tabId = event.currentTarget.dataset.tab; } else { return; } if (tabId === 'studioSection') { switchView('studioView'); document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(b => b.classList.remove('active')); document.querySelectorAll(`.nav-tab[data-tab="${tabId}"], .bottom-nav-item[data-tab="${tabId}"]`).forEach(b => b.classList.add('active')); return; } if (!document.getElementById('mainView').classList.contains('active')) { if (viewHistory.length>0||!document.getElementById('mainView').classList.contains('active')) { switchView('mainView'); } } document.querySelectorAll('#mainView .content-section').forEach(s => s.classList.remove('active')); document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(b => b.classList.remove('active')); const target = document.getElementById(tabId); if (target) { target.classList.add('active'); } document.querySelectorAll(`.nav-tab[data-tab="${tabId}"], .bottom-nav-item[data-tab="${tabId}"]`).forEach(b => b.classList.add('active')); };
    
    const handleBack = () => {
        if (albumCountdownInterval) { clearInterval(albumCountdownInterval); albumCountdownInterval = null; }
        viewHistory.pop();
        const prevId = viewHistory.pop() || 'mainView';
        switchView(prevId);
    };

    const renderArtistsGrid = (containerId, artists) => { const c = document.getElementById(containerId); if(!c){console.error(`Grid ${containerId} not found.`); return;} if(!artists||artists.length===0){c.innerHTML='<p class="empty-state">Nenhum artista.</p>'; return;} c.innerHTML = artists.map(a => `<div class="artist-card" data-artist-name="${a.name}"><img src="${a.img||a.imageUrl||'https://i.imgur.com/AD3MbBi.png'}" alt="${a.name}" class="artist-card-img"><p class="artist-card-name">${a.name}</p><span class="artist-card-type">Artista</span></div>`).join(''); };
    function formatArtistString(artistIds, collabType) { if (!artistIds || artistIds.length === 0) return "?"; const names = artistIds.map(id => { const a = db.artists.find(art => art.id === id); return a ? a.name : "?"; }); const main = names[0]; if (names.length === 1) return main; const others = names.slice(1).join(', '); if (collabType === 'Dueto/Grupo') { return `${main} & ${others}`; } else { return main; } }
    function getCoverUrl(albumId) { if (!albumId) return 'https://i.imgur.com/AD3MbBi.png'; const r = [...db.albums, ...db.singles].find(a => a.id === albumId); return (r ? r.imageUrl : 'https://i.imgur.com/AD3MbBi.png'); }

const renderChart = (type) => {
        let containerId, dataList, previousData;

        if (type === 'music') {
            containerId = 'musicChartsList';
            dataList = [...db.songs].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50);
            previousData = previousMusicChartData;
        } else { // type === 'album'
            containerId = 'albumChartsList';
            dataList = [...db.albums].sort((a, b) => (b.weeklyStreams || 0) - (a.weeklyStreams || 0)).slice(0, 50);
            previousData = previousAlbumChartData;
        }

        const container = document.getElementById(containerId);
        if (!container) { console.error(`Chart ${containerId} not found.`); return; }
        if (!dataList || dataList.length === 0) { container.innerHTML = `<p class="empty-state">Nenhum item.</p>`; return; }

        container.innerHTML = dataList.map((item, index) => {
            const currentRank = index + 1;
            const previousRank = previousData[item.id];
            let iconClass = 'fa-minus';
            let trendClass = 'trend-stable';
            if (previousRank === undefined) { trendClass = 'trend-new'; }
            else if (currentRank < previousRank) { iconClass = 'fa-caret-up'; trendClass = 'trend-up'; }
            else if (currentRank > previousRank) { iconClass = 'fa-caret-down'; trendClass = 'trend-down'; }
            const indicatorHtml = `<span class="chart-rank-indicator ${trendClass}"><i class="fas ${iconClass}"></i></span>`;

            if (type === 'music') {
                const artistName = formatArtistString(item.artistIds, item.collabType);
                return `<div class="chart-item" data-song-id="${item.id}">${indicatorHtml}<span class="chart-rank">${currentRank}</span><img src="${item.cover || getCoverUrl(item.albumId)}" alt="${item.title}" class="chart-item-img"><div class="chart-item-info"><span class="chart-item-title">${item.title}</span><span class="chart-item-artist">${artistName}</span></div><span class="chart-item-duration">${(item.streams || 0).toLocaleString('pt-BR')}</span></div>`;
            } else { // type === 'album'
                return `<div class="chart-item" data-album-id="${item.id}">${indicatorHtml}<span class="chart-rank">${currentRank}</span><img src="${item.imageUrl}" alt="${item.title}" class="chart-item-img"><div class="chart-item-info"><span class="chart-item-title">${item.title}</span><span class="chart-item-artist">${item.artist}</span></div><span class="chart-item-score">${(item.weeklyStreams || 0).toLocaleString('pt-BR')}</span></div>`;
            }
        }).join('');
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) { console.error(`Artista "${artistName}" não encontrado.`); handleBack(); return; }
        
        activeArtist = artist;
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;

        const popularSongs = [...db.songs]
            .filter(s => s.artistIds && s.artistIds.includes(artist.id))
            .sort( (a, b) => (b.totalStreams || 0) - (a.totalStreams || 0))
            .slice(0, 5);

        const popularContainer = document.getElementById('popularSongsList');
        if (popularSongs.length > 0) {
            popularContainer.innerHTML = popularSongs.map( (song, index) => 
                `<div class="song-row" data-song-id="${song.id}"><span>${index + 1}</span><div class="song-row-info"><img src="${song.cover || getCoverUrl(song.albumId)}" alt="${song.title}" class="song-row-cover"><span class="song-row-title">${song.title}</span></div><span class="song-streams">${(song.totalStreams || 0).toLocaleString('pt-BR')}</span></div>`
            ).join('');
        } else {
            popularContainer.innerHTML = '<p class="empty-state-small">Nenhuma música popular.</p>';
        }

        const albumsContainer = document.getElementById('albumsList');
        const sortedAlbums = (artist.albums || []).sort( (a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        albumsContainer.innerHTML = sortedAlbums.map(album => `<div class="scroll-item" data-album-id="${album.id}"><img src="${album.imageUrl}" alt="${album.title}"><p>${album.title}</p><span>${new Date(album.releaseDate).getFullYear()}</span></div>`).join('') || '<p class="empty-state-small">Nenhum álbum.</p>';

        const singlesContainer = document.getElementById('singlesList');
        const sortedSingles = (artist.singles || []).sort( (a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        singlesContainer.innerHTML = sortedSingles.map(single => `<div class="scroll-item" data-album-id="${single.id}"><img src="${single.imageUrl}" alt="${single.title}"><p>${single.title}</p><span>${new Date(single.releaseDate).getFullYear()}</span></div>`).join('') || '<p class="empty-state-small">Nenhum single.</p>';

        const recommended = [...db.artists].filter(a => a.id !== artist.id).sort( () => 0.5 - Math.random()).slice(0, 5);
        renderArtistsGrid('recommendedGrid', recommended);
        switchView('artistDetail');
    };

    const openAlbumDetail = (albumId) => {
        const album = [...db.albums, ...db.singles].find(a => a.id === albumId);
        if (!album) { console.error(`Álbum/Single ID "${albumId}" não encontrado.`); return; }

        if (albumCountdownInterval) { clearInterval(albumCountdownInterval); albumCountdownInterval = null; }

        const countdownContainer = document.getElementById('albumCountdownContainer');
        const normalInfoContainer = document.getElementById('albumNormalInfoContainer');
        const tracklistContainer = document.getElementById('albumTracklist');

        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;

        const releaseDate = new Date(album.releaseDate);
        const now = new Date();
        const isPreRelease = releaseDate > now;
        const artistObj = db.artists.find(a => a.id === album.artistId);

        if (isPreRelease) {
            normalInfoContainer.classList.add('hidden');
            countdownContainer.classList.remove('hidden');

            const releaseDateStr = releaseDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            document.getElementById('albumCountdownReleaseDate').textContent = releaseDateStr;
            startAlbumCountdown(album.releaseDate, 'albumCountdownTimer');

            tracklistContainer.innerHTML = (album.tracks || []).map(track => {
                const fullSong = db.songs.find(s => s.id === track.id);
                
                let isAvailable = false;
                if (fullSong && fullSong.parentReleaseDate) {
                    isAvailable = new Date(fullSong.parentReleaseDate) <= now;
                }
                
                const artistName = formatArtistString(track.artistIds, track.collabType);

                if (isAvailable) {
                    return `<div class="track-row available" data-song-id="${track.id}">
                                <span class="track-number"><i class="fas fa-play"></i></span>
                                <div class="track-info">
                                    <span class="track-title">${track.title}</span>
                                    <span class="track-artist-feat">${artistName}</span>
                                </div>
                                <span class="track-duration">${track.duration}</span>
                            </div>`;
                } else {
                    return `<div class="track-row unavailable">
                                <span class="track-number">${track.trackNumber}</span>
                                <div class="track-info">
                                    <span class="track-title">${track.title}</span>
                                    <span class="track-artist-feat">${artistName}</span>
                                </div>
                                <span class="track-duration"><i class="fas fa-lock"></i></span>
                            </div>`;
                }
            }).join('');

        } else {
            normalInfoContainer.classList.remove('hidden');
            countdownContainer.classList.add('hidden');

            const releaseYear = releaseDate.getFullYear();
            const totalAlbumStreamsFormatted = (album.totalStreams || 0).toLocaleString('pt-BR');
            document.getElementById('albumDetailInfo').innerHTML = `Por <strong class="artist-link" data-artist-name="${artistObj ? artistObj.name : ''}">${album.artist}</strong> • ${releaseYear} • ${totalAlbumStreamsFormatted} streams totais`;

            tracklistContainer.innerHTML = (album.tracks || []).map(song => {
                const artistName = formatArtistString(song.artistIds, song.collabType);
                const streams = (song.totalStreams || 0);
                
                return `<div class="track-row" data-song-id="${song.id}">
                            <span class="track-number">${song.trackNumber}</span>
                            <div class="track-info">
                                <span class="track-title">${song.title}</span>
                                <span class="track-artist-feat">${artistName}</span>
                            </div>
                            <span class="track-duration">${streams.toLocaleString('pt-BR')}</span>
                        </div>`;
            }).join('');
        }
        
        switchView('albumDetail');
    };

    const openDiscographyDetail = (type) => { if (!activeArtist) { console.error("Nenhum artista ativo."); handleBack(); return; } const data = (type==='albums')?(activeArtist.albums||[]).sort((a,b)=>new Date(b.releaseDate)-new Date(a.releaseDate)):(activeArtist.singles||[]).sort((a,b)=>new Date(b.releaseDate)-new Date(a.releaseDate)); const title = (type==='albums')?`Álbuns de ${activeArtist.name}`:`Singles & EPs de ${activeArtist.name}`; document.getElementById('discographyTypeTitle').textContent = title; const grid = document.getElementById('discographyGrid'); grid.innerHTML = data.map(item => `<div class="scroll-item" data-album-id="${item.id}"><img src="${item.imageUrl}" alt="${item.title}"><p>${item.title}</p><span>${new Date(item.releaseDate).getFullYear()}</span></div>`).join('') || '<p class="empty-state">Nenhum lançamento.</p>'; switchView('discographyDetail'); };
    const handleSearch = () => { const query = searchInput.value.toLowerCase().trim(); if (!query) { switchTab(null, 'homeSection'); return; } const resultsContainer = document.getElementById('searchResults'); const noResultsEl = document.getElementById('noResults'); const filteredArtists = db.artists.filter(a => a.name.toLowerCase().includes(query)); const filteredAlbums = [...db.albums, ...db.singles].filter(a => a.title.toLowerCase().includes(query)); let html = ''; let count = 0; if (filteredArtists.length > 0) { html += '<h3 class="section-title">Artistas</h3>'; html += filteredArtists.map(a => { count++; return `<div class="artist-card" data-artist-name="${a.name}"><img src="${a.img}" alt="${a.name}" class="artist-card-img"><p class="artist-card-name">${a.name}</p><span class="artist-card-type">Artista</span></div>`; }).join(''); } if (filteredAlbums.length > 0) { html += '<h3 class="section-title">Álbuns & Singles</h3>'; html += filteredAlbums.map(al => { count++; return `<div class="artist-card" data-album-id="${al.id}"><img src="${al.imageUrl}" alt="${al.title}" class="artist-card-img"><p class="artist-card-name">${al.title}</p><span class="artist-card-type">${al.artist}</span></div>`; }).join(''); } resultsContainer.innerHTML = html; if (count > 0) { noResultsEl.classList.add('hidden'); resultsContainer.classList.remove('hidden'); } else { noResultsEl.classList.remove('hidden'); resultsContainer.classList.add('hidden'); } switchTab(null, 'searchSection'); };
    
    const setupCountdown = (timerId, chartType) => { const timerElement = document.getElementById(timerId); if (!timerElement) return; const calculateTargetDate = () => { const now = new Date(); const target = new Date(now); let daysToMonday = (1 + 7 - now.getDay()) % 7; if (daysToMonday === 0 && now.getHours() >= 0) { daysToMonday = 7; } target.setDate(now.getDate() + daysToMonday); target.setHours(0, 0, 0, 0); return target; }; let targetDate = calculateTargetDate(); const updateTimerDisplay = (distance) => { const days = Math.floor(distance / 864e5); const hours = Math.floor((distance % 864e5) / 36e5); const minutes = Math.floor((distance % 36e5) / 6e4); const seconds = Math.floor((distance % 6e4) / 1e3); const f = (n) => (n < 10 ? '0' + n : n); timerElement.textContent = distance < 0 ? `00d 00h 00m 00s` : `${f(days)}d ${f(hours)}h ${f(minutes)}m ${f(seconds)}s`; }; const updateTimer = () => { const now = new Date().getTime(); const distance = targetDate.getTime() - now; if (distance < 0) { console.log(`Timer ${timerId} finished. Saving ${chartType} chart.`); saveChartDataToLocalStorage(chartType); targetDate = calculateTargetDate(); if (chartType === 'music') renderChart('music'); else if (chartType === 'album') renderChart('album'); else if (chartType === 'rpg') renderRPGChart(); updateTimerDisplay(targetDate.getTime() - new Date().getTime()); return; } updateTimerDisplay(distance); }; updateTimer(); setInterval(updateTimer, 1000); };

    function startAlbumCountdown(targetDateISO, containerId) {
        const container = document.getElementById(containerId);
        if (!container) { console.error(`Countdown container ${containerId} not found.`); return; }
        const targetTime = new Date(targetDateISO).getTime();
        const updateTimer = () => {
            const now = new Date().getTime(); const distance = targetTime - now;
            if (distance < 0) { container.innerHTML = '<p>Lançado!</p>'; if (albumCountdownInterval) clearInterval(albumCountdownInterval); return; }
            const d = Math.floor(distance / 864e5); const h = Math.floor((distance % 864e5) / 36e5); const m = Math.floor((distance % 36e5) / 6e4); const s = Math.floor((distance % 6e4) / 1e3);
            container.innerHTML = `<div class="countdown-item"><span>${d}</span><label>Dias</label></div><div class="countdown-item"><span>${h}</span><label>Horas</label></div><div class="countdown-item"><span>${m}</span><label>Minutos</label></div><div class="countdown-item"><span>${s}</span><label>Segundos</label></div>`;
        };
        if (albumCountdownInterval) { clearInterval(albumCountdownInterval); }
        updateTimer(); albumCountdownInterval = setInterval(updateTimer, 1000);
    }

    // --- 3. SISTEMA DE RPG ---
    const CHART_TOP_N = 20; const STREAMS_PER_POINT = 10000;
    const calculateSimulatedStreams = (points, lastActiveISO) => { if (!lastActiveISO) return 0; const now = new Date(); const last = new Date(lastActiveISO); const diffH = Math.abs(now - last) / 36e5; const streamDay = (points||0)*STREAMS_PER_POINT; const streamH = streamDay/24; return Math.floor(streamH*diffH); };
    const computeChartData = (artistsArray) => { return artistsArray.map(a => ({ id: a.id, name: a.name, img: a.img, streams: calculateSimulatedStreams(a.RPGPoints, a.LastActive), points: a.RPGPoints||0 })).sort((a,b) => b.streams - a.streams).slice(0, CHART_TOP_N); };
    function renderRPGChart() { const chartData = computeChartData(db.artists); const container = document.getElementById('artistsGrid'); const previousData = previousRpgChartData; if (!container) { console.error("Container 'artistsGrid' não encontrado."); return; } if (chartData.length === 0) { container.innerHTML = '<p class="empty-state">Nenhum artista no chart RPG.</p>'; return; } container.innerHTML = chartData.map((artist, index) => { const currentRank = index + 1; const previousRank = previousData[artist.id]; let iconClass = 'fa-minus'; let trendClass = 'trend-stable'; if (previousRank === undefined) { trendClass = 'trend-new'; } else if (currentRank < previousRank) { iconClass = 'fa-caret-up'; trendClass = 'trend-up'; } else if (currentRank > previousRank) { iconClass = 'fa-caret-down'; trendClass = 'trend-down'; } return `<div class="artist-card" data-artist-name="${artist.name}"><span class="rpg-rank">#${currentRank}</span><span class="chart-rank-indicator rpg-indicator ${trendClass}"><i class="fas ${iconClass}"></i></span><img src="${artist.img}" alt="${artist.name}" class="artist-card-img"><p class="artist-card-name">${artist.name}</p><span class="artist-card-type">${(artist.streams || 0).toLocaleString('pt-BR')} streams</span></div>`; }).join(''); }

    // --- 4. SISTEMA DO ESTÚDIO ---
    console.log("Defining initializeStudio function...");

    function initializeStudio() {
        console.log("Running initializeStudio..."); 
        if (!playerSelect) { console.error("initializeStudio failed: playerSelect element not found."); return; }

        if (db.players && db.players.length > 0) {
            playerSelect.innerHTML = '<option value="">Selecione...</option>' + db.players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        } else {
            playerSelect.innerHTML = '<option value="">Nenhum jogador encontrado</option>';
            console.warn("Nenhum jogador carregado para o estúdio.");
        }

        loginButton.addEventListener('click', () => loginPlayer(playerSelect.value));
        logoutButton.addEventListener('click', logoutPlayer);

        studioTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                studioTabs.forEach(t => t.classList.remove('active'));
                studioForms.forEach(f => f.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const formId = e.currentTarget.dataset.form;
                document.getElementById(formId === 'single' ? 'newSingleForm' : 'newAlbumForm').classList.add('active');
            });
        });

        confirmFeatBtn.addEventListener('click', confirmFeat);
        cancelFeatBtn.addEventListener('click', closeFeatModal);

        if (newSingleForm) {
            newSingleForm.addEventListener('click', (e) => {
                const addFeatButton = e.target.closest('.add-feat-btn[data-target="singleFeatList"]');
                if (addFeatButton) {
                    openFeatModal(addFeatButton);
                }
            });
        }

        if (openAddTrackModalBtn) {
            openAddTrackModalBtn.addEventListener('click', () => openAlbumTrackModal());
        }

        if (saveAlbumTrackBtn) saveAlbumTrackBtn.addEventListener('click', saveAlbumTrack);
        if (cancelAlbumTrackBtn) cancelAlbumTrackBtn.addEventListener('click', closeAlbumTrackModal);

        if (addInlineFeatBtn) { addInlineFeatBtn.addEventListener('click', toggleInlineFeatAdder); }
        if (confirmInlineFeatBtn) confirmInlineFeatBtn.addEventListener('click', confirmInlineFeat);
        if (cancelInlineFeatBtn) cancelInlineFeatBtn.addEventListener('click', cancelInlineFeat);

        if (albumTracklistEditor) {
            albumTracklistEditor.addEventListener('click', (e) => {
                const editButton = e.target.closest('.edit-track-btn');
                const removeButton = e.target.closest('.remove-track-btn');
                if (editButton) { const item = editButton.closest('.track-list-item-display'); if (item) { openAlbumTrackModal(item); } }
                else if (removeButton) { const item = removeButton.closest('.track-list-item-display'); if (item) { item.remove(); updateTrackNumbers(); } }
            });
        }

        initAlbumForm();
        console.log("initializeStudio finished.");
    }

    function populateArtistSelector(playerId) { const p=db.players.find(pl=>pl.id===playerId); if(!p)return; const ids=p.artists||[]; const opts=ids.map(id=>{const a=db.artists.find(ar=>ar.id===id); return a?`<option value="${a.id}">${a.name}</option>`:'';}).join(''); singleArtistSelect.innerHTML=`<option value="">Selecione...</option>${opts}`; albumArtistSelect.innerHTML=`<option value="">Selecione...</option>${opts}`; }
    function loginPlayer(playerId) { if(!playerId){alert("Selecione.");return;} currentPlayer=db.players.find(p=>p.id===playerId); if(currentPlayer){document.getElementById('playerName').textContent=currentPlayer.name; loginPrompt.classList.add('hidden'); loggedInInfo.classList.remove('hidden'); studioLaunchWrapper.classList.remove('hidden'); populateArtistSelector(currentPlayer.id);} }
    function logoutPlayer() { currentPlayer=null; document.getElementById('playerName').textContent=''; loginPrompt.classList.remove('hidden'); loggedInInfo.classList.add('hidden'); studioLaunchWrapper.classList.add('hidden'); }
    function populateArtistSelectForFeat(targetSelectElement) { let currentMainId=null; let selectEl=targetSelectElement; if(document.getElementById('newSingleForm').classList.contains('active')){currentMainId=singleArtistSelect.value; selectEl=featArtistSelect;} else if(document.getElementById('newAlbumForm').classList.contains('active')){currentMainId=albumArtistSelect.value; selectEl=inlineFeatArtistSelect;} else {selectEl=featArtistSelect;} if(!selectEl){console.error("Select feats não encontrado!"); return;} selectEl.innerHTML = db.artists.filter(a=>a.id!==currentMainId).sort((a,b)=>a.name.localeCompare(b.name)).map(a=>`<option value="${a.id}">${a.name}</option>`).join(''); if(selectEl.innerHTML===''){selectEl.innerHTML='<option value="">Nenhum outro</option>';} }
    function openFeatModal(buttonElement) { const targetId=buttonElement.dataset.target; currentFeatTarget=document.getElementById(targetId); if(!currentFeatTarget){console.error("Alvo feat não encontrado:", targetId); return;} populateArtistSelectForFeat(featArtistSelect); featModal.classList.remove('hidden'); }
    function closeFeatModal() { featModal.classList.add('hidden'); currentFeatTarget=null; }
    function confirmFeat() { const artistId=featArtistSelect.value; const artistName=featArtistSelect.options[featArtistSelect.selectedIndex].text; const featType=featTypeSelect.value; if(!artistId||!currentFeatTarget){console.error("Confirm feat sem ID ou alvo."); return;} const tag=document.createElement('span'); tag.className='feat-tag'; tag.textContent=`${featType} ${artistName}`; tag.dataset.artistId=artistId; tag.dataset.featType=featType; tag.dataset.artistName=artistName; tag.addEventListener('click',()=>tag.remove()); currentFeatTarget.appendChild(tag); closeFeatModal(); }
    function toggleInlineFeatAdder() { if(!inlineFeatAdder)return; const hidden=inlineFeatAdder.classList.contains('hidden'); if(hidden){populateArtistSelectForFeat(inlineFeatArtistSelect); inlineFeatAdder.classList.remove('hidden'); if(addInlineFeatBtn)addInlineFeatBtn.innerHTML='<i class="fas fa-times"></i> Cancelar Feat';} else {inlineFeatAdder.classList.add('hidden'); if(addInlineFeatBtn)addInlineFeatBtn.innerHTML='<i class="fas fa-plus"></i> Adicionar Feat';} }
    function confirmInlineFeat() { const artistId=inlineFeatArtistSelect.value; const artistName=inlineFeatArtistSelect.options[inlineFeatArtistSelect.selectedIndex].text; const featType=inlineFeatTypeSelect.value; if(!artistId||!albumTrackFeatList){console.error("Confirm inline feat sem ID ou alvo."); return;} const tag=document.createElement('span'); tag.className='feat-tag'; tag.textContent=`${featType} ${artistName}`; tag.dataset.artistId=artistId; tag.dataset.featType=featType; tag.dataset.artistName=artistName; tag.addEventListener('click',()=>tag.remove()); albumTrackFeatList.appendChild(tag); inlineFeatAdder.classList.add('hidden'); if(addInlineFeatBtn)addInlineFeatBtn.innerHTML='<i class="fas fa-plus"></i> Adicionar Feat'; }
    function cancelInlineFeat() { inlineFeatAdder.classList.add('hidden'); if(addInlineFeatBtn)addInlineFeatBtn.innerHTML='<i class="fas fa-plus"></i> Adicionar Feat'; }
    function openAlbumTrackModal(itemToEdit=null) { albumTrackNameInput.value=''; albumTrackDurationInput.value=''; albumTrackTypeSelect.value='Album Track'; albumTrackFeatList.innerHTML=''; editingTrackItemId.value=''; editingTrackItem=null; inlineFeatAdder.classList.add('hidden'); if(addInlineFeatBtn)addInlineFeatBtn.innerHTML='<i class="fas fa-plus"></i> Adicionar Feat'; if(itemToEdit){albumTrackModalTitle.textContent='Editar Faixa'; editingTrackItemId.value=itemToEdit.id||itemToEdit.dataset.itemId; editingTrackItem=itemToEdit; albumTrackNameInput.value=itemToEdit.dataset.trackName||''; albumTrackDurationInput.value=itemToEdit.dataset.durationStr||''; albumTrackTypeSelect.value=itemToEdit.dataset.trackType||'Album Track'; const feats=JSON.parse(itemToEdit.dataset.feats||'[]'); feats.forEach(f=>{const tag=document.createElement('span'); tag.className='feat-tag'; tag.textContent=`${f.type} ${f.name}`; tag.dataset.artistId=f.id; tag.dataset.featType=f.type; tag.dataset.artistName=f.name; tag.addEventListener('click',()=>tag.remove()); albumTrackFeatList.appendChild(tag);}); } else {albumTrackModalTitle.textContent='Adicionar Faixa'; editingTrackItemId.value=`temp_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;} albumTrackModal.classList.remove('hidden'); }
    function closeAlbumTrackModal() { albumTrackModal.classList.add('hidden'); editingTrackItem=null; editingTrackItemId.value=''; inlineFeatAdder.classList.add('hidden'); if(addInlineFeatBtn)addInlineFeatBtn.innerHTML='<i class="fas fa-plus"></i> Adicionar Feat'; }
    function saveAlbumTrack() { const name=albumTrackNameInput.value.trim(); const durStr=albumTrackDurationInput.value.trim(); const type=albumTrackTypeSelect.value; const durSec=parseDurationToSeconds(durStr); const itemId=editingTrackItemId.value; if(!name||!durStr||durSec===0){alert("Nome e Duração (MM:SS) válidos.");return;} const featTags=albumTrackFeatList.querySelectorAll('.feat-tag'); const featsData=Array.from(featTags).map(t=>({id:t.dataset.artistId, type:t.dataset.featType, name:t.dataset.artistName})); let target=editingTrackItem||albumTracklistEditor.querySelector(`[data-item-id="${itemId}"]`); if(target){target.dataset.trackName=name; target.dataset.durationStr=durStr; target.dataset.trackType=type; target.dataset.feats=JSON.stringify(featsData); target.querySelector('.track-title-display').textContent=name; target.querySelector('.track-details-display .duration').textContent=`Duração: ${durStr}`; target.querySelector('.track-details-display .type').textContent=`Tipo: ${type}`; const featDisp=target.querySelector('.feat-list-display'); if(featDisp){featDisp.innerHTML=featsData.map(f=>`<span class="feat-tag-display">${f.type} ${f.name}</span>`).join('');}} else {const newItem=document.createElement('div'); newItem.className='track-list-item-display'; newItem.dataset.itemId=itemId; newItem.dataset.trackName=name; newItem.dataset.durationStr=durStr; newItem.dataset.trackType=type; newItem.dataset.feats=JSON.stringify(featsData); newItem.innerHTML=`<span class="track-number-display"></span><i class="fas fa-bars drag-handle"></i><div class="track-info-display"><span class="track-title-display">${name}</span><div class="track-details-display"><span class="duration">Duração: ${durStr}</span><span class="type">Tipo: ${type}</span></div><div class="feat-list feat-list-display" style="margin-top:5px;">${featsData.map(f=>`<span class="feat-tag-display">${f.type} ${f.name}</span>`).join('')}</div></div><div class="track-actions"><button type="button" class="small-btn edit-track-btn"><i class="fas fa-pencil-alt"></i></button><button type="button" class="small-btn remove-track-btn"><i class="fas fa-times"></i></button></div>`; const empty=albumTracklistEditor.querySelector('.empty-state-small'); if(empty)empty.remove(); albumTracklistEditor.appendChild(newItem);} updateTrackNumbers(); closeAlbumTrackModal(); }
    function updateTrackNumbers() { const tracks=albumTracklistEditor.querySelectorAll('.track-list-item-display'); if(tracks.length===0&&!albumTracklistEditor.querySelector('.empty-state-small')){if(!albumTracklistEditor.querySelector('.empty-state-small')){albumTracklistEditor.innerHTML='<p class="empty-state-small">Nenhuma faixa.</p>';}} else if(tracks.length>0){const empty=albumTracklistEditor.querySelector('.empty-state-small'); if(empty){empty.remove();}} tracks.forEach((t, i)=>{let num=t.querySelector('.track-number-display'); if(!num){num=document.createElement('span'); num.className='track-number-display'; t.insertBefore(num, t.querySelector('.drag-handle'));} num.textContent=`${i+1}.`; num.style.fontWeight='700'; num.style.color='var(--text-secondary)'; num.style.width='25px'; num.style.textAlign='right'; num.style.marginRight='5px';}); }
    async function createAirtableRecord(tableName, fields) { const url=`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`; try{const r=await fetch(url,{method:'POST',headers:{'Authorization':`Bearer ${AIRTABLE_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({fields:fields})}); if(!r.ok){const e=await r.json(); console.error(`Erro Airtable ${tableName}:`,JSON.stringify(e,null,2)); throw new Error(`Airtable error: ${r.status}`);} return await r.json();} catch(e){console.error(`Falha req ${tableName}:`,e); return null;} }
    function parseDurationToSeconds(durationStr) { if(!durationStr)return 0; const p=durationStr.split(':'); if(p.length!==2)return 0; const m=parseInt(p[0],10); const s=parseInt(p[1],10); if(isNaN(m)||isNaN(s)||s<0||s>59||m<0){return 0;} return (m*60)+s; }
    
    // *** FUNÇÃO handleSingleSubmit SIMPLIFICADA ***
    async function handleSingleSubmit(event) {
        event.preventDefault();
        const btn = document.getElementById('submitNewSingle');
        
        // Validação
        const artistId = singleArtistSelect.value;
        const title = document.getElementById('singleTitle').value;
        const cover = document.getElementById('singleCoverUrl').value;
        const date = singleReleaseDateInput.value;
        const track = document.getElementById('trackName').value;
        const dur = document.getElementById('trackDuration').value;
        
        if (!artistId || !title || !cover || !date || !track || !dur || parseDurationToSeconds(dur) === 0) {
            alert("Preencha todos os campos do single, incluindo nome e duração (MM:SS) da nova faixa.");
            return;
        }
        
        btn.disabled = true;
        btn.textContent = 'Aguardando...';
        
        // Sempre mostra o modal para nova faixa
        trackTypeModal.classList.remove('hidden');
    }

    // *** FUNÇÃO processSingleSubmission SIMPLIFICADA ***
    async function processSingleSubmission(trackType) {
        const btn = document.getElementById('submitNewSingle');
        trackTypeModal.classList.add('hidden');
        btn.textContent = 'Enviando...';
        try {
            const artistId = singleArtistSelect.value; // Artista Principal
            const title = document.getElementById('singleTitle').value;
            const cover = document.getElementById('singleCoverUrl').value;
            const date = singleReleaseDateInput.value;

            // 1. Criar o registro do "Single/EP"
            // --- ATUALIZADO: Garante que "Artista" aqui é SÓ o principal ---
            const singleRes = await createAirtableRecord('Singles e EPs', {
                "Nome do Single/EP": title,
                "Artista": [artistId], // <-- CORRETO: Envia APENAS o artista principal
                "Capa": [{"url": cover}],
                "Data de Lançamento": date
            });

            if (!singleRes || !singleRes.id) {
                throw new Error("Falha ao criar o registro do Single/EP.");
            }
            const singleId = singleRes.id;

            // 2. Preparar os dados da "Música" (sempre nova faixa)
            let musicFields = {};
            const featTags = document.querySelectorAll('#singleFeatList .feat-tag');
            let fArtists = [artistId]; // Começa com o principal
            let collab = null;
            let fTrackName = document.getElementById('trackName').value; // Nome base
            let featNames = [];
            
            if (featTags.length > 0) {
                const fIds = [];
                collab = featTags[0].dataset.featType;
                featTags.forEach(t => { fIds.push(t.dataset.artistId); featNames.push(t.dataset.artistName); });
                
                // --- ATUALIZADO ---
                // O campo 'Artista' na tabela 'Músicas' DEVE conter TODOS os artistas
                // para o site de Ações (Briga de Charts) funcionar.
                fArtists = [artistId, ...fIds]; 
                
                // Formata o NOME DA FAIXA apenas se for "Feat."
                if (collab === "Feat.") {
                    fTrackName = `${fTrackName} (feat. ${featNames.join(', ')})`;
                }
                // Se for Dueto/Grupo, o nome da faixa é o original, mas fArtists tem todos
            }

            // --- Lógica apenas para Nova Faixa ---
            const durStr = document.getElementById('trackDuration').value;
            const durSec = parseDurationToSeconds(durStr);

            // fTrackName e fArtists já foram definidos acima
            musicFields = {
                "Nome da Faixa": fTrackName,
                "Artista": fArtists, // <-- CORRETO: Envia TODOS os artistas para a tabela Músicas
                "Duração": durSec,
                "Nº da Faixa": 1,
                "Singles e EPs": [singleId],
                "Tipo de Faixa": trackType, // Veio do Modal
            };
            if (collab) {
                musicFields["Tipo de Colaboração"] = collab;
            }
            // --- Fim da lógica apenas para Nova Faixa ---

            // 3. Criar o registro da "Música"
            console.log('Enviando Música para Airtable:', musicFields);
            const musicRes = await createAirtableRecord('Músicas', musicFields);

            if (!musicRes || !musicRes.id) {
                console.error("Single criado, mas falha ao criar registro da Música.");
                throw new Error("Falha ao criar a música.");
            }

            alert("Single lançado com sucesso!");
            newSingleForm.reset(); // Limpa o formulário
            singleReleaseDateInput.value = new Date().toISOString().split('T')[0]; // Reseta data
            document.getElementById('singleFeatList').innerHTML = ''; // Limpa feats

            await refreshAllData();

        } catch (e) {
            alert("Erro ao lançar o single. Verifique o console.");
            console.error("Erro em processSingleSubmission:", e);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Lançar Single';
        }
    }

    function initAlbumForm() { albumTracklistEditor.innerHTML=''; updateTrackNumbers(); if(albumTracklistEditor&&typeof Sortable!=='undefined'){if(albumTracklistSortable){albumTracklistSortable.destroy();} albumTracklistSortable=Sortable.create(albumTracklistEditor,{animation:150, handle:'.drag-handle', onEnd:updateTrackNumbers});} else if(typeof Sortable==='undefined'){console.warn("SortableJS não carregado.");} }
    async function batchCreateAirtableRecords(tableName, records) { const url=`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`; const chunks=[]; for(let i=0; i<records.length; i+=10){chunks.push(records.slice(i, i+10));} const results=[]; for(const chunk of chunks){console.log(`Enviando lote ${tableName}:`, chunk); try{const res=await fetch(url,{method:'POST',headers:{'Authorization':`Bearer ${AIRTABLE_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({"records":chunk.map(fields=>({fields}))})}); if(!res.ok){const e=await res.json(); console.error(`Erro lote ${tableName}:`,JSON.stringify(e,null,2)); throw new Error(`Airtable batch error: ${res.status}`);} const data=await res.json(); results.push(...data.records);} catch(e){console.error(`Falha req batch ${tableName}:`,e); return null;}} return results; }
    
    async function handleAlbumSubmit(event) { 
        event.preventDefault(); 
        const btn=document.getElementById('submitNewAlbum'); 
        btn.disabled=true; 
        btn.textContent='Enviando...'; 
        try {
            const artistId=albumArtistSelect.value; // Artista Principal
            const title=document.getElementById('albumTitle').value; 
            const cover=document.getElementById('albumCoverUrl').value; 
            const date=albumReleaseDateInput.value; 
            
            if(!artistId||!title||!cover||!date){alert("Preencha Álbum/EP."); throw new Error("Campos Álbum faltando.");} 
            
            const items=albumTracklistEditor.querySelectorAll('.track-list-item-display'); 
            if(items.length===0){alert("Pelo menos uma faixa."); throw new Error("Nenhuma faixa.");} 
            
            let totalDur=0; 
            const musicRecs=[]; 
            
            for(let i=0; i<items.length; i++){
                const item=items[i]; 
                const name=item.dataset.trackName; 
                const durStr=item.dataset.durationStr; 
                const type=item.dataset.trackType; 
                const feats=JSON.parse(item.dataset.feats||'[]'); 
                const durSec=parseDurationToSeconds(durStr); 
                
                if(!name||!durStr||durSec===0){alert(`Dados inválidos Faixa ${i+1}.`); throw new Error(`Dados inválidos ${i+1}.`);} 
                
                totalDur+=durSec; 
                let fName=name; 
                let fArts=[artistId]; // Começa com o principal
                let collab=null; 
                
                if(feats.length>0){
                    collab=feats[0].type; 
                    const fIds=feats.map(f=>f.id); 
                    const fNames=feats.map(f=>f.name); 
                    
                    // --- ATUALIZADO ---
                    // O campo 'Artista' na tabela 'Músicas' DEVE conter TODOS os artistas
                    fArts=[artistId,...fIds];
                    
                    if(collab==="Feat."){
                        fName=`${name} (feat. ${fNames.join(', ')})`; 
                    } 
                    // Se for Dueto/Grupo, fName é o original e fArts tem todos (correto)
                } 
                
                const rec={"Nome da Faixa":fName, "Artista":fArts, "Duração":durSec, "Nº da Faixa":i+1, "Tipo de Faixa":type}; 
                if(collab){rec["Tipo de Colaboração"]=collab;} 
                musicRecs.push(rec);
            } 
            
            const isAlbum=totalDur>=(30*60); 
            const tName=isAlbum?'Álbuns':'Singles e EPs'; 
            const nFld=isAlbum?'Nome do Álbum':'Nome do Single/EP'; 
            const cFld=isAlbum?'Capa do Álbum':'Capa'; 
            
            // --- ATUALIZADO: Garante que "Artista" aqui é SÓ o principal ---
            const relRes=await createAirtableRecord(tName,{
                [nFld]:title, 
                "Artista":[artistId], // <-- CORRETO: Envia APENAS o artista principal
                [cFld]:[{"url":cover}], 
                "Data de Lançamento":date
            }); 
            
            if(!relRes||!relRes.id){throw new Error("Falha criar Álbum/EP.");} 
            
            const relId=relRes.id; 
            const albLink='Álbuns'; 
            const sngLink='Singles e EPs'; 
            const linkFld=isAlbum?albLink:sngLink; 
            musicRecs.forEach(rec=>{rec[linkFld]=[relId];}); 
            
            // Envia as Músicas (com todos os artistas)
            const created=await batchCreateAirtableRecords('Músicas',musicRecs); 
            
            if(!created||created.length!==musicRecs.length){console.error("Álbum/EP criado, músicas falharam."); throw new Error("Falha criar faixas.");} 
            
            alert("Álbum/EP lançado!"); 
            newAlbumForm.reset(); 
            albumReleaseDateInput.value=new Date().toISOString().split('T')[0]; 
            initAlbumForm(); 
            await refreshAllData();
        } catch(e){
            alert("Erro lançar álbum/EP."); 
            console.error("Erro handleAlbumSubmit:", e);
        } finally {
            btn.disabled=false; 
            btn.textContent='Lançar Álbum / EP';
        } 
    }


    // --- 5. LÓGICA DO PLAYER DE MÚSICA ---
    
    function openPlayer(songId, clickedElement) {
        const song = db.songs.find(s => s.id === songId);
        if (!song) {
            console.error(`Música com ID ${songId} não encontrada.`);
            return;
        }

        // Tenta construir a fila de reprodução a partir do contexto
        const parentList = clickedElement.closest('.popular-songs-list, .tracklist-container, .chart-list');
        if (parentList) {
            const songElements = parentList.querySelectorAll('[data-song-id]');
            currentQueue = Array.from(songElements)
                .map(el => db.songs.find(s => s.id === el.dataset.songId))
                .filter(Boolean); // Filtra músicas não encontradas
        } else {
            // Fila de fallback: apenas a música clicada
            currentQueue = [song];
        }

        currentQueueIndex = currentQueue.findIndex(s => s.id === songId);
        if (currentQueueIndex === -1) {
            currentQueue = [song];
            currentQueueIndex = 0;
        }

        currentSong = song;
        loadSong(song);
        musicPlayerView.classList.remove('hidden');
        document.body.classList.add('player-open');
        playAudio();
    }

    function closePlayer() {
        musicPlayerView.classList.add('hidden');
        document.body.classList.remove('player-open');
        // Decidimos não parar a música ao fechar, mas você pode adicionar pauseAudio() aqui se preferir
        // pauseAudio(); 
    }

    function loadSong(song) {
        currentSong = song;
        
        // Atualiza a UI do Player
        playerSongTitle.textContent = song.title;
        playerArtistName.textContent = formatArtistString(song.artistIds, song.collabType);
        
        const parentRelease = [...db.albums, ...db.singles].find(r => r.id === song.albumId);
        if (parentRelease) {
            playerCoverArt.src = parentRelease.imageUrl;
            playerAlbumTitle.textContent = parentRelease.title;
        } else {
            playerCoverArt.src = 'https://i.imgur.com/AD3MbBi.png'; // Fallback
            playerAlbumTitle.textContent = 'Single';
        }

        // *** IMPORTANTE: SIMULAÇÃO DE ÁUDIO ***
        // No mundo real, você usaria song.audioUrl ou algo do seu DB
        audioElement.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        audioElement.load();
        
        playerSeekBar.value = 0; // Reseta a barra
        playerCurrentTime.textContent = "0:00";
        playerTotalTime.textContent = "0:00";
    }

    function playAudio() {
        audioElement.play().then(() => {
            isPlaying = true;
            playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(error => {
            console.error("Erro ao tocar áudio:", error);
            isPlaying = false;
        });
    }

    function pauseAudio() {
        audioElement.pause();
        isPlaying = false;
        playerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    function togglePlay() {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    }

    function playNext() {
        if (isShuffle) {
            currentQueueIndex = Math.floor(Math.random() * currentQueue.length);
        } else {
            currentQueueIndex++;
        }

        if (currentQueueIndex >= currentQueue.length) {
            if (repeatMode === 'all') {
                currentQueueIndex = 0; // Volta ao início
            } else {
                currentQueueIndex = currentQueue.length - 1; // Para no final
                pauseAudio(); // Para de tocar
                return;
            }
        }
        
        loadSong(currentQueue[currentQueueIndex]);
        playAudio();
    }

    function playPrevious() {
        // Se a música estiver tocando por mais de 3 segundos, reinicie
        if (audioElement.currentTime > 3) {
            audioElement.currentTime = 0;
            return;
        }

        if (isShuffle) {
            currentQueueIndex = Math.floor(Math.random() * currentQueue.length);
        } else {
            currentQueueIndex--;
        }

        if (currentQueueIndex < 0) {
            if (repeatMode === 'all') {
                currentQueueIndex = currentQueue.length - 1; // Vai para o final
            } else {
                currentQueueIndex = 0; // Para no início
            }
        }

        loadSong(currentQueue[currentQueueIndex]);
        playAudio();
    }

    function toggleShuffle() {
        isShuffle = !isShuffle;
        playerShuffleBtn.classList.toggle('active', isShuffle);
        console.log("Shuffle:", isShuffle);
    }

    function toggleRepeat() {
        const icon = playerRepeatBtn.querySelector('i');
        if (repeatMode === 'none') {
            repeatMode = 'all';
            playerRepeatBtn.classList.add('active');
            icon.className = 'fas fa-repeat';
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            playerRepeatBtn.classList.add('active');
            icon.className = 'fas fa-repeat-1'; // FontAwesome 6+
        } else { // repeatMode === 'one'
            repeatMode = 'none';
            playerRepeatBtn.classList.remove('active');
            icon.className = 'fas fa-repeat';
        }
        console.log("Repeat Mode:", repeatMode);
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateSeekBar() {
        if (!isNaN(audioElement.duration)) {
            playerSeekBar.value = audioElement.currentTime;
            playerCurrentTime.textContent = formatTime(audioElement.currentTime);
        }
    }
    
    function initializePlayerListeners() {
        playerCloseBtn.addEventListener('click', closePlayer);
        playerPlayPauseBtn.addEventListener('click', togglePlay);
        playerNextBtn.addEventListener('click', playNext);
        playerPrevBtn.addEventListener('click', playPrevious);
        playerShuffleBtn.addEventListener('click', toggleShuffle);
        playerRepeatBtn.addEventListener('click', toggleRepeat);

        audioElement.addEventListener('loadedmetadata', () => {
            playerSeekBar.max = audioElement.duration;
            playerTotalTime.textContent = formatTime(audioElement.duration);
        });

        audioElement.addEventListener('timeupdate', updateSeekBar);

        audioElement.addEventListener('ended', () => {
            if (repeatMode === 'one') {
                audioElement.currentTime = 0;
                playAudio();
            } else {
                playNext();
            }
        });
        
        playerSeekBar.addEventListener('input', () => {
             audioElement.currentTime = playerSeekBar.value;
             playerCurrentTime.textContent = formatTime(playerSeekBar.value);
        });
    }


    // --- 6. INICIALIZAÇÃO GERAL ---

    function initializeBodyClickListener() { 
        document.body.addEventListener('click', (e) => { 
            const artistCard = e.target.closest('.artist-card[data-artist-name]'); 
            const albumCard = e.target.closest('[data-album-id]'); 
            
            // --- ATUALIZADO: Gatilho do Player ---
            const songCard = e.target.closest('.song-row[data-song-id], .track-row[data-song-id], .chart-item[data-song-id]'); 
            
            const artistLink = e.target.closest('.artist-link[data-artist-name]'); 
            const discogLink = e.target.closest('.see-all-btn[data-type]'); 
            
            if (discogLink) { openDiscographyDetail(discogLink.dataset.type); return; } 
            if (albumCard) { openAlbumDetail(albumCard.dataset.albumId); return; } 
            if (artistCard) { openArtistDetail(artistCard.dataset.artistName); return; } 
            if (artistLink) { openArtistDetail(artistLink.dataset.artistName); return; } 
            
            // --- ATUALIZADO: Ação do Player ---
            if (songCard) { 
                // Verifica se a música está disponível (no caso de pré-lançamentos)
                if (!songCard.classList.contains('unavailable')) {
                    console.log("Abrindo player para música ID:", songCard.dataset.songId);
                    openPlayer(songCard.dataset.songId, songCard);
                } else {
                    console.log("Música indisponível.");
                }
                return; 
            }
        }); 
        searchInput.addEventListener('input', handleSearch); 
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleSearch(); } }); 
    }

    async function main() {
        console.log("Iniciando Aplicação...");
        if (!initializeDOMElements()) return;

        document.body.classList.add('loading');
        const data = await loadAllData(); // <-- Esta linha agora vai funcionar

        if (data && data.allArtists) {
            if (!initializeData(data)) return;

            try {
                console.log("Calling initializeStudio function...");
                initializeStudio();

                if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
                if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

                if (confirmTrackTypeBtn) { confirmTrackTypeBtn.addEventListener('click', () => { processSingleSubmission(trackTypeSelect.value); }); }
                if (cancelTrackTypeBtn) { cancelTrackTypeBtn.addEventListener('click', () => { trackTypeModal.classList.add('hidden'); const btn = document.getElementById('submitNewSingle'); btn.disabled = false; btn.textContent = 'Lançar Single'; }); }
                
                initializePlayerListeners(); // <-- ADICIONA OS LISTENERS DO PLAYER
                
                renderRPGChart();
                renderChart('music'); 
                renderChart('album');

                const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
                allNavs.forEach(nav => { nav.removeEventListener('click', switchTab); nav.addEventListener('click', switchTab); });
                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10));

                setupCountdown('musicCountdownTimer', 'music');
                setupCountdown('albumCountdownTimer', 'album');

                initializeBodyClickListener(); // <-- Modificada para incluir o player
                document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));
                switchTab(null, 'homeSection');
                console.log("Aplicação Iniciada.");

            } catch (uiError) {
                console.error("Erro UI init:", uiError); 
                document.body.innerHTML = '<div style="color: white; padding: 20px;"><h1>Erro Interface</h1><p>Ver console.</p></div>';
            }
        } else {
            document.body.innerHTML = '<div style="color: white; padding: 20px;"><h1>Erro Crítico</h1><p>Dados Airtable não carregados.</p></div>';
            console.error("Initialization failed: Data load error.");
        }
        document.body.classList.remove('loading');
    }
    main();

}); // Fim DOMContentLoaded
