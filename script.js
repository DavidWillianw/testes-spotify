document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], singles: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null;
    let currentFeatTarget = null;
    let viewHistory = [];

    // --- ELEMENTOS DO DOM ---
    let allViews, searchInput, studioView, loginPrompt, loggedInInfo, playerSelect,
        loginButton, logoutButton, studioLaunchWrapper, studioTabs, studioForms,
        newSingleForm, singleArtistSelect, singleReleaseDateInput,
        newAlbumForm, albumArtistSelect, albumReleaseDateInput,
        addTrackButton, albumTracklistEditor, featModal, featArtistSelect,
        featTypeSelect, confirmFeatBtn, cancelFeatBtn;

    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';

    // --- FUNÇÃO PARA INICIALIZAR ELEMENTOS DO DOM ---
    function initializeDOMElements() {
        console.log("Initializing DOM elements...");
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
        newAlbumForm = document.getElementById('newAlbumForm');
        albumArtistSelect = document.getElementById('albumArtistSelect');
        albumReleaseDateInput = document.getElementById('albumReleaseDate');
        addTrackButton = document.getElementById('addTrackButton');
        albumTracklistEditor = document.getElementById('albumTracklistEditor');
        featModal = document.getElementById('featModal');
        featArtistSelect = document.getElementById('featArtistSelect');
        featTypeSelect = document.getElementById('featTypeSelect');
        confirmFeatBtn = document.getElementById('confirmFeatBtn');
        cancelFeatBtn = document.getElementById('cancelFeatBtn');

        if (!studioView || !loginPrompt || !playerSelect || !newSingleForm || !newAlbumForm || !featModal || !allViews || allViews.length === 0 || !singleReleaseDateInput || !albumReleaseDateInput) {
            console.error("ERRO CRÍTICO: Elementos essenciais do HTML não foram encontrados! Verifique IDs: studioView, loginPrompt, playerSelect, newSingleForm, newAlbumForm, featModal, .page-view, singleReleaseDate, albumReleaseDate");
            document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Elementos essenciais da página não foram encontrados. Verifique o HTML e os IDs.</p></div>';
            return false;
        }

        const today = new Date().toISOString().split('T')[0];
        singleReleaseDateInput.value = today;
        albumReleaseDateInput.value = today;

        console.log("DOM elements initialized.");
        return true;
    }


    // --- 1. CARREGAMENTO DE DADOS ---

    async function fetchAllAirtablePages(baseUrl, fetchOptions) {
        let allRecords = [];
        let offset = null;

        do {
            const separator = baseUrl.includes('?') ? '&' : '?';
            const fetchUrl = offset ? `${baseUrl}${separator}offset=${offset}` : baseUrl;

            const response = await fetch(fetchUrl, fetchOptions);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Falha ao carregar ${fetchUrl}: ${response.status} - ${errorText}`);
                throw new Error(`Airtable fetch failed for ${baseUrl}`);
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
        const albumsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Álbuns`;
        const musicasURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Músicas`;
        const singlesURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Singles%20e%20EPs`;
        const playersURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jogadores`;
        const fetchOptions = { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } };

        console.log("Iniciando carregamento de dados (com paginação)...");
        try {
            const [artistsData, albumsData, musicasData, singlesData, playersData] = await Promise.all([
                fetchAllAirtablePages(artistsURL, fetchOptions),
                fetchAllAirtablePages(albumsURL, fetchOptions),
                fetchAllAirtablePages(musicasURL, fetchOptions),
                fetchAllAirtablePages(singlesURL, fetchOptions),
                fetchAllAirtablePages(playersURL, fetchOptions)
            ]);

            if (!artistsData || !albumsData || !musicasData || !singlesData || !playersData) {
                 throw new Error('Falha ao carregar dados Airtable (paginação).');
            }

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
                    const tracks = Array.from(musicasMap.values()).filter(song => song.albumId === recordId)
                        .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
                    const totalDurationSeconds = tracks.reduce((total, track) => total + (track.durationSeconds || 0), 0);
                    const mainArtistIdFromServer = fields['Artista'] || [];
                    const mainArtistId = Array.isArray(mainArtistIdFromServer) ? mainArtistIdFromServer[0] : (mainArtistIdFromServer || null);
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

    const initializeData = (data) => {
        try {
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

            db.songs = (data.musicas || []).map(song => ({
                ...song,
                streams: song.streams || Math.floor(Math.random() * 25000000) + 50000,
                cover: 'https://i.imgur.com/AD3MbBi.png',
                artist: artistsMapById.get((song.artistIds || [])[0]) || 'Artista Desc.'
            }));

            db.albums = [];
            db.singles = [];
            const allReleases = [...(data.albums || []), ...(data.singles || [])];
            const thirtyMinutesInSeconds = 30 * 60;

            allReleases.forEach(item => {
                (item.tracks || []).forEach(trackInfo => {
                    const songInDb = db.songs.find(s => s.id === trackInfo.id);
                    if (songInDb) {
                        songInDb.cover = item.imageUrl;
                    } else {
                        console.warn(`Song ID ${trackInfo.id} (faixa "${trackInfo.title}") listada no lançamento "${item.title}" não foi encontrada em db.songs. Verifique se a música foi carregada.`);
                    }
                });

                const artistEntry = db.artists.find(a => a.id === item.artistId);

                if ((item.totalDurationSeconds || 0) >= thirtyMinutesInSeconds) {
                    db.albums.push(item);
                    if (artistEntry) {
                        artistEntry.albums.push(item);
                    }
                } else {
                    db.singles.push(item);
                    if (artistEntry) {
                        artistEntry.singles.push(item);
                    }
                }

                if (!artistEntry && item.artist !== "Artista Desconhecido") {
                     console.warn(`Artista "${item.artist}" (ID: ${item.artistId}) do lançamento "${item.title}" não encontrado em db.artists.`);
                }
            });

            db.players = data.players || [];

            console.log(`DB Inicializado: Artists: ${db.artists.length}, Albums: ${db.albums.length}, Singles: ${db.singles.length}, Songs: ${db.songs.length}, Players: ${db.players.length}`);
            return true;
        } catch (error) {
            console.error("Erro CRÍTICO durante initializeData:", error);
            alert("Erro MUITO GRAVE ao inicializar dados. Verifique o console.");
            return false;
        }
    };


    async function refreshAllData() {
        console.log("Atualizando todos os dados...");
        const data = await loadAllData();
        if (data && data.allArtists) {
            if (initializeData(data)) {
                console.log("Dados atualizados e UI renderizada.");

                renderRPGChart();
                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10));
                renderChart('music');
                renderChart('album');

                if (currentPlayer) {
                    populateArtistSelector(currentPlayer.id);
                }

                if (activeArtist && !document.getElementById('artistDetail').classList.contains('hidden')) {
                    console.log(`Atualizando detalhes para ${activeArtist.name} após refresh...`);
                    openArtistDetail(activeArtist.name);
                }

                return true;
            }
        }
        console.error("Falha ao atualizar os dados.");
        alert("Não foi possível atualizar os dados do servidor.");
        return false;
    }

    // --- 2. NAVEGAÇÃO E UI ---

    const switchView = (viewId, targetSectionId = null) => {
        console.log(`Switching view to: ${viewId}`);
        allViews.forEach(view => {
            view.classList.add('hidden');
        });

        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
            window.scrollTo(0, 0);

            if (viewId === 'mainView' && targetSectionId) {
                switchTab(null, targetSectionId);
            }

            if (viewId !== 'mainView' && viewId !== 'studioView') {
                 if (viewHistory.length === 0 || viewHistory[viewHistory.length - 1] !== viewId) {
                    viewHistory.push(viewId);
                 }
            } else if (viewId === 'mainView') {
                viewHistory = [];
            }

        } else {
            console.error(`View com ID "${viewId}" não encontrada.`);
        }
    };

    const switchTab = (event, forceTabId = null) => {
        let tabId;

        if (forceTabId) {
            tabId = forceTabId;
        } else if (event) {
            event.preventDefault();
            tabId = event.currentTarget.dataset.tab;
        } else {
            return;
        }

        if (tabId === 'studioSection') {
            switchView('studioView');
            document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(button => {
                button.classList.remove('active');
            });
            document.querySelectorAll(`.nav-tab[data-tab="${tabId}"], .bottom-nav-item[data-tab="${tabId}"]`).forEach(button => {
                button.classList.add('active');
            });
            return;
        }

        if (!document.getElementById('mainView').classList.contains('active')) {
             if (viewHistory.length > 0 || !document.getElementById('mainView').classList.contains('active')) {
                switchView('mainView');
            }
        }

        document.querySelectorAll('#mainView .content-section').forEach(section => {
            section.classList.remove('active');
        });

        document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(button => {
            button.classList.remove('active');
        });

        const targetSection = document.getElementById(tabId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        document.querySelectorAll(`.nav-tab[data-tab="${tabId}"], .bottom-nav-item[data-tab="${tabId}"]`).forEach(button => {
            button.classList.add('active');
        });
    };

    const handleBack = () => {
        viewHistory.pop();
        const previousViewId = viewHistory.pop() || 'mainView';

        switchView(previousViewId);
    };


    const renderArtistsGrid = (containerId, artists) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container de grid "${containerId}" não encontrado.`);
            return;
        }

        if (!artists || artists.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum artista encontrado.</p>';
            return;
        }

        container.innerHTML = artists.map(artist => `
            <div class="artist-card" data-artist-name="${artist.name}">
                <img src="${artist.img || artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png'}" alt="${artist.name}" class="artist-card-img">
                <p class="artist-card-name">${artist.name}</p>
                <span class="artist-card-type">Artista</span>
            </div>
        `).join('');
    };

    function formatArtistString(artistIds, collabType) {
        if (!artistIds || artistIds.length === 0) return "Artista Desconhecido";

        const artistNames = artistIds.map(id => {
            const artist = db.artists.find(a => a.id === id);
            return artist ? artist.name : "Artista Desc.";
        });

        const mainArtist = artistNames[0];
        if (artistNames.length === 1) return mainArtist;

        const otherArtists = artistNames.slice(1).join(', ');

        if (collabType === 'Dueto/Grupo') {
            return `${mainArtist} & ${otherArtists}`;
        } else {
            return mainArtist;
        }
    }

    function getCoverUrl(albumId) {
        if (!albumId) return 'https://i.imgur.com/AD3MbBi.png';
        const release = [...db.albums, ...db.singles].find(a => a.id === albumId);
        return (release ? release.imageUrl : 'https://i.imgur.com/AD3MbBi.png');
    }

    const renderChart = (type) => {
        let containerId, dataList;

        if (type === 'music') {
            containerId = 'musicChartsList';
            dataList = [...db.songs].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50);
        } else {
            containerId = 'albumChartsList';
            dataList = [...db.albums].sort((a, b) => (b.metascore || 0) - (a.metascore || 0)).slice(0, 50);
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        if (!dataList || dataList.length === 0) {
            container.innerHTML = `<p class="empty-state">Nenhum item no chart.</p>`;
            return;
        }

        container.innerHTML = dataList.map((item, index) => {
            if (type === 'music') {
                const artistName = formatArtistString(item.artistIds, item.collabType);
                return `
                    <div class="chart-item" data-song-id="${item.id}">
                        <span class="chart-rank">${index + 1}</span>
                        <img src="${item.cover || getCoverUrl(item.albumId)}" alt="${item.title}" class="chart-item-img">
                        <div class="chart-item-info">
                            <span class="chart-item-title">${item.title}</span>
                            <span class="chart-item-artist">${artistName}</span>
                        </div>
                        <span class="chart-item-duration">${item.duration}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="chart-item" data-album-id="${item.id}">
                        <span class="chart-rank">${index + 1}</span>
                        <img src="${item.imageUrl}" alt="${item.title}" class="chart-item-img">
                        <div class="chart-item-info">
                            <span class="chart-item-title">${item.title}</span>
                            <span class="chart-item-artist">${item.artist}</span>
                        </div>
                        <span class="chart-item-score">${item.metascore}</span>
                    </div>
                `;
            }
        }).join('');
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) {
            console.error(`Artista "${artistName}" não encontrado no DB atual.`);
            handleBack();
            return;
        }
        activeArtist = artist;

        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;

        const popularSongs = [...db.songs]
            .filter(s => s.artistIds && s.artistIds.includes(artist.id))
            .sort((a, b) => (b.streams || 0) - (a.streams || 0))
            .slice(0, 5);

        const popularContainer = document.getElementById('popularSongsList');
        if (popularSongs.length > 0) {
            popularContainer.innerHTML = popularSongs.map((song, index) => `
                <div class="song-row" data-song-id="${song.id}">
                    <span>${index + 1}</span>
                    <div class="song-row-info">
                        <img src="${song.cover || getCoverUrl(song.albumId)}" alt="${song.title}" class="song-row-cover">
                        <span class="song-row-title">${song.title}</span>
                    </div>
                    <span class="song-streams">${(song.streams || 0).toLocaleString('pt-BR')}</span>
                </div>
            `).join('');
        } else {
            popularContainer.innerHTML = '<p class="empty-state-small">Nenhuma música popular.</p>';
        }

        const albumsContainer = document.getElementById('albumsList');
        const sortedAlbums = (artist.albums || []).sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        albumsContainer.innerHTML = sortedAlbums.map(album => `
            <div class="scroll-item" data-album-id="${album.id}">
                <img src="${album.imageUrl}" alt="${album.title}">
                <p>${album.title}</p>
                <span>${new Date(album.releaseDate).getFullYear()}</span> </div>
        `).join('') || '<p class="empty-state-small">Nenhum álbum.</p>';

        const singlesContainer = document.getElementById('singlesList');
        const sortedSingles = (artist.singles || []).sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        singlesContainer.innerHTML = sortedSingles.map(single => `
            <div class="scroll-item" data-album-id="${single.id}">
                <img src="${single.imageUrl}" alt="${single.title}">
                <p>${single.title}</p>
                 <span>${new Date(single.releaseDate).getFullYear()}</span> </div>
        `).join('') || '<p class="empty-state-small">Nenhum single.</p>';

        const recommended = [...db.artists]
            .filter(a => a.id !== artist.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
        renderArtistsGrid('recommendedGrid', recommended);

        switchView('artistDetail');
    };


    const openAlbumDetail = (albumId) => {
        const album = [...db.albums, ...db.singles].find(a => a.id === albumId);
        if (!album) {
            console.error(`Álbum/Single ID "${albumId}" não encontrado.`);
            return;
        }

        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;

        const releaseDate = new Date(album.releaseDate).getFullYear();
        const artistObj = db.artists.find(a => a.id === album.artistId);

        document.getElementById('albumDetailInfo').innerHTML = `
            Por <strong class="artist-link" data-artist-name="${artistObj ? artistObj.name : ''}">${album.artist}</strong> • ${releaseDate}
        `;

        const tracklistContainer = document.getElementById('albumTracklist');
        tracklistContainer.innerHTML = (album.tracks || []).map(song => {
            const artistName = formatArtistString(song.artistIds, song.collabType);
            return `
                <div class="track-row" data-song-id="${song.id}">
                    <span class="track-number">${song.trackNumber}</span>
                    <div class="track-info">
                        <span class="track-title">${song.title}</span>
                        <span class="track-artist-feat">${artistName}</span>
                    </div>
                    <span class="track-duration">${song.duration}</span>
                </div>
            `;
        }).join('');

        switchView('albumDetail');
    };

    const openDiscographyDetail = (type) => {
        if (!activeArtist) {
            console.error("Nenhum artista ativo para mostrar discografia.");
            handleBack();
            return;
        }

        const data = (type === 'albums')
            ? (activeArtist.albums || []).sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
            : (activeArtist.singles || []).sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        const title = (type === 'albums') ? `Álbuns de ${activeArtist.name}` : `Singles & EPs de ${activeArtist.name}`;

        document.getElementById('discographyTypeTitle').textContent = title;
        const grid = document.getElementById('discographyGrid');

        grid.innerHTML = data.map(item => `
            <div class="scroll-item" data-album-id="${item.id}">
                <img src="${item.imageUrl}" alt="${item.title}">
                <p>${item.title}</p>
                <span>${new Date(item.releaseDate).getFullYear()}</span>
            </div>
        `).join('') || '<p class="empty-state">Nenhum lançamento encontrado.</p>';

        switchView('discographyDetail');
    };

    const handleSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            switchTab(null, 'homeSection');
            return;
        }

        const resultsContainer = document.getElementById('searchResults');
        const noResultsEl = document.getElementById('noResults');

        const filteredArtists = db.artists.filter(a => a.name.toLowerCase().includes(query));
        const filteredAlbums = [...db.albums, ...db.singles].filter(a => a.title.toLowerCase().includes(query));

        let html = '';
        let count = 0;

        if (filteredArtists.length > 0) {
            html += '<h3 class="section-title">Artistas</h3>';
            html += filteredArtists.map(artist => {
                count++;
                return `
                <div class="artist-card" data-artist-name="${artist.name}">
                    <img src="${artist.img}" alt="${artist.name}" class="artist-card-img">
                    <p class="artist-card-name">${artist.name}</p>
                    <span class="artist-card-type">Artista</span>
                </div>
            `}).join('');
        }

        if (filteredAlbums.length > 0) {
            html += '<h3 class="section-title">Álbuns & Singles</h3>';
            html += filteredAlbums.map(album => {
                count++;
                return `
                <div class="artist-card" data-album-id="${album.id}">
                    <img src="${album.imageUrl}" alt="${album.title}" class="artist-card-img">
                    <p class="artist-card-name">${album.title}</p>
                    <span class="artist-card-type">${album.artist}</span>
                </div>
            `}).join('');
        }

        resultsContainer.innerHTML = html;

        if (count > 0) {
            noResultsEl.classList.add('hidden');
            resultsContainer.classList.remove('hidden');
        } else {
            noResultsEl.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
        }

        switchTab(null, 'searchSection');
    };

    const setupCountdown = (timerId, callback) => {
        const timerElement = document.getElementById(timerId);
        if (!timerElement) return;

        const calculateTargetDate = () => {
            const now = new Date();
            const target = new Date(now);

            let daysToMonday = (1 + 7 - now.getDay()) % 7;
            if (daysToMonday === 0 && now.getHours() >= 0) {
                daysToMonday = 7;
            }
            target.setDate(now.getDate() + daysToMonday);
            target.setHours(0, 0, 0, 0);
            return target;
        };

        let targetDate = calculateTargetDate();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                targetDate = calculateTargetDate();
                if (callback) callback();
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const f = (n) => (n < 10 ? '0' + n : n);
            timerElement.textContent = `${f(days)}d ${f(hours)}h ${f(minutes)}m ${f(seconds)}s`;
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    };

    // --- 3. SISTEMA DE RPG ---
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;

    const calculateSimulatedStreams = (points, lastActiveISO) => {
        if (!lastActiveISO) return 0;
        const now = new Date();
        const lastActive = new Date(lastActiveISO);
        const diffHours = Math.abs(now - lastActive) / 3600000;

        const streamsPerDay = (points || 0) * STREAMS_PER_POINT;
        const streamsPerHour = streamsPerDay / 24;
        return Math.floor(streamsPerHour * diffHours);
    };

    const computeChartData = (artistsArray) => {
        return artistsArray.map(artist => {
            const simulatedStreams = calculateSimulatedStreams(artist.RPGPoints, artist.LastActive);
            return {
                id: artist.id,
                name: artist.name,
                img: artist.img,
                streams: simulatedStreams,
                points: artist.RPGPoints || 0
            };
        }).sort((a, b) => b.streams - a.streams)
          .slice(0, CHART_TOP_N);
    };

    function renderRPGChart() {
        const chartData = computeChartData(db.artists);
        const container = document.getElementById('artistsGrid');

         if (!container) {
            console.error("Container 'artistsGrid' não encontrado para o RPG Chart.");
            return;
        }

        if (chartData.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum artista no chart de RPG.</p>';
            return;
        }

        container.innerHTML = chartData.map((artist, index) => `
            <div class="artist-card" data-artist-name="${artist.name}">
                <span class="rpg-rank">#${index + 1}</span>
                <img src="${artist.img}" alt="${artist.name}" class="artist-card-img">
                <p class="artist-card-name">${artist.name}</p>
                <span class="artist-card-type">${(artist.streams || 0).toLocaleString('pt-BR')} streams</span>
            </div>
        `).join('');
    }

    // --- 4. SISTEMA DO ESTÚDIO ---

    function populateArtistSelector(playerId) {
        const player = db.players.find(p => p.id === playerId);
        if (!player) return;

        const artistIds = player.artists || [];
        const artistOptions = artistIds.map(id => {
            const artist = db.artists.find(a => a.id === id);
            return artist ? `<option value="${artist.id}">${artist.name}</option>` : '';
        }).join('');

        singleArtistSelect.innerHTML = `<option value="">Selecione...</option>${artistOptions}`;
        albumArtistSelect.innerHTML = `<option value="">Selecione...</option>${artistOptions}`;
    }

    function loginPlayer(playerId) {
        if (!playerId) {
            alert("Por favor, selecione um jogador.");
            return;
        }
        currentPlayer = db.players.find(p => p.id === playerId);
        if (currentPlayer) {
            document.getElementById('playerName').textContent = currentPlayer.name;
            loginPrompt.classList.add('hidden');
            loggedInInfo.classList.remove('hidden');
            studioLaunchWrapper.classList.remove('hidden');
            populateArtistSelector(currentPlayer.id);
        }
    }

    function logoutPlayer() {
        currentPlayer = null;
        document.getElementById('playerName').textContent = '';
        loginPrompt.classList.remove('hidden');
        loggedInInfo.classList.add('hidden');
        studioLaunchWrapper.classList.add('hidden');
    }

    function populateFeatModalArtistSelect() {
        let currentMainArtistId = null;

        if (document.getElementById('newSingleForm').classList.contains('active')) {
            currentMainArtistId = singleArtistSelect.value;
        } else {
            currentMainArtistId = albumArtistSelect.value;
        }

        featArtistSelect.innerHTML = db.artists
            .filter(a => a.id !== currentMainArtistId)
            .sort((a,b) => a.name.localeCompare(b.name))
            .map(a => `<option value="${a.id}">${a.name}</option>`)
            .join('');
    }

    function openFeatModal(buttonElement) {
        const targetType = buttonElement.dataset.target;

        if (targetType === 'single') {
            currentFeatTarget = document.getElementById('singleFeatList');
        } else {
            currentFeatTarget = document.getElementById(targetType);
        }

        if (!currentFeatTarget) {
            console.error("Não foi possível encontrar o alvo do feat (currentFeatTarget). Target ID:", targetType);
            return;
        }

        populateFeatModalArtistSelect();
        featModal.classList.remove('hidden');
    }


    function closeFeatModal() {
        featModal.classList.add('hidden');
        currentFeatTarget = null;
    }

    function confirmFeat() {
        const artistId = featArtistSelect.value;
        const artistName = featArtistSelect.options[featArtistSelect.selectedIndex].text;
        const featType = featTypeSelect.value;

        if (!artistId || !currentFeatTarget) return;

        const featTag = document.createElement('span');
        featTag.className = 'feat-tag';
        featTag.textContent = `${featType} ${artistName}`;
        featTag.dataset.artistId = artistId;
        featTag.dataset.featType = featType;
        featTag.dataset.artistName = artistName;
        featTag.addEventListener('click', () => featTag.remove());

        if (currentFeatTarget.id === 'singleFeatList') {
            currentFeatTarget.appendChild(featTag);
        } else {
            const trackListItem = currentFeatTarget.closest('.track-list-item');
            if (trackListItem) {
                 trackListItem.querySelector('.feat-list-album').appendChild(featTag);
            } else {
                console.error("Não foi possível encontrar o .track-list-item pai para anexar o feat tag.");
            }
        }

        closeFeatModal();
    }


    function initializeStudio() {
        if (!playerSelect) return;
        playerSelect.innerHTML = '<option value="">Selecione...</option>' +
            db.players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

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

        studioLaunchWrapper.addEventListener('click', (e) => {
            if (e.target.closest('.add-feat-btn')) {
                openFeatModal(e.target.closest('.add-feat-btn'));
            }
        });

        addTrackButton.addEventListener('click', addNewTrackInput);
        initAlbumForm();
    }

    async function createAirtableRecord(tableName, fields) {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: fields })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Erro ao criar registro em ${tableName}:`, JSON.stringify(errorData, null, 2));
                throw new Error(`Airtable error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Falha na requisição para createAirtableRecord:", error);
            return null;
        }
    }


    function parseDurationToSeconds(durationStr) {
        if (!durationStr) return 0;
        const parts = durationStr.split(':');
        if (parts.length !== 2) return 0;
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        return (minutes * 60) + seconds;
    }

    // =============================================================
    // VERSÃO COM O CONSOLE.LOG PARA DEBUG E CORREÇÃO DO LINK SINGLE
    // =============================================================
    async function handleSingleSubmit(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submitNewSingle');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const artistId = singleArtistSelect.value;
            const singleTitle = document.getElementById('singleTitle').value;
            const coverUrl = document.getElementById('singleCoverUrl').value;
            const releaseDate = singleReleaseDateInput.value;
            const trackName = document.getElementById('trackName').value;
            const trackDurationStr = document.getElementById('trackDuration').value;
            const trackDurationSec = parseDurationToSeconds(trackDurationStr);

             if (!artistId || !singleTitle || !coverUrl || !releaseDate || !trackName || !trackDurationStr) {
                alert("Por favor, preencha todos os campos obrigatórios do single.");
                throw new Error("Campos obrigatórios do single faltando.");
            }

            // Cria o registro do Single/EP primeiro
            const singleRecordResponse = await createAirtableRecord('Singles e EPs', {
                "Nome do Single/EP": singleTitle,
                "Artista": [artistId],
                "Capa": [{ "url": coverUrl }],
                "Data de Lançamento": releaseDate
            });

            // Pega o ID do registro criado
            if (!singleRecordResponse || !singleRecordResponse.id) {
                throw new Error("Falha ao criar o registro do Single/EP.");
            }
            const singleRecordId = singleRecordResponse.id; // <-- Pega o ID aqui

            // Processa feats para nome da faixa e artistas
            const featTags = document.querySelectorAll('#singleFeatList .feat-tag');
            let finalTrackName = trackName;
            let finalArtistIds = [artistId];
            let collabType = null;

            if (featTags.length > 0) {
                const featArtistIds = [];
                const featArtistNames = [];
                collabType = featTags[0].dataset.featType;

                featTags.forEach(tag => {
                    featArtistIds.push(tag.dataset.artistId);
                    featArtistNames.push(tag.dataset.artistName);
                });

                if (collabType === "Feat.") {
                    finalTrackName = `${trackName} (feat. ${featArtistNames.join(', ')})`;
                    finalArtistIds = [artistId]; // Apenas o artista principal na lista de artistas
                } else if (collabType === "Dueto/Grupo") {
                    finalTrackName = trackName;
                    finalArtistIds = [artistId, ...featArtistIds]; // Todos os artistas na lista
                }
            }

            // Cria o objeto de campos para a Música SEMPRE incluindo o link
            const musicRecordFields = {
                "Nome da Faixa": finalTrackName,
                "Artista": finalArtistIds,
                "Duração": trackDurationSec,
                "Nº da Faixa": 1,
                "Singles e EPs": [singleRecordId] // Linka ao Single/EP criado
            };

            // Adiciona o tipo de colaboração APENAS se existir
            if (collabType) {
                musicRecordFields["Tipo de Colaboração"] = collabType;
            }

            // Log para depuração
            console.log('--- DEBUG: Enviando para Músicas (Single) ---');
            console.log(JSON.stringify(musicRecordFields, null, 2));


            // Cria o registro da Música
            const musicRecordResponse = await createAirtableRecord('Músicas', musicRecordFields);

            if (!musicRecordResponse || !musicRecordResponse.id) {
                 console.error("Single/EP criado, mas falha ao criar a música vinculada.");
                 // Opcional: Implementar rollback (deletar o single/EP)
                 throw new Error("Falha ao criar o registro da música.");
            }

            alert("Single lançado com sucesso!");
            newSingleForm.reset();
            singleReleaseDateInput.value = new Date().toISOString().split('T')[0];
            document.getElementById('singleFeatList').innerHTML = '';
            await refreshAllData();

        } catch (error) {
            alert("Erro ao lançar o single. Verifique o console para mais detalhes.");
            console.error("Erro em handleSingleSubmit:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lançar Single';
        }
    }


    function initAlbumForm() {
        addNewTrackInput();
        if (albumTracklistEditor && typeof Sortable !== 'undefined') {
            albumTracklistSortable = Sortable.create(albumTracklistEditor, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: updateTrackNumbers
            });
        } else if (typeof Sortable === 'undefined') {
            console.warn("SortableJS não está carregado. Reordenação de faixas desabilitada.");
        }
    }

    function addNewTrackInput() {
        const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const trackCount = albumTracklistEditor.children.length + 1;

        const newTrackEl = document.createElement('div');
        newTrackEl.className = 'track-list-item';
        newTrackEl.innerHTML = `
            <div class="track-main-row">
                <i class="fas fa-bars drag-handle"></i>
                <div class="track-inputs">
                    <span class="track-number">${trackCount}.</span>
                    <input type="text" class="track-name-input" placeholder="Nome da Faixa" required>
                    <input type="text" class="track-duration-input" placeholder="MM:SS" pattern="\\d{1,2}:\\d{2}" required>
                </div>
                <button type="button" class="small-btn add-feat-btn" data-target="${trackId}"><i class="fas fa-plus"></i> Feat</button>
                <button type="button" class="small-btn remove-track-btn delete-track-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="feat-section">
                <div class="feat-list feat-list-album">
                    </div>
            </div>
            <div id="${trackId}" class="feat-target-hidden"></div>
        `;

        newTrackEl.querySelector('.remove-track-btn').addEventListener('click', () => {
            newTrackEl.remove();
            updateTrackNumbers();
        });

        albumTracklistEditor.appendChild(newTrackEl);
    }


    function updateTrackNumbers() {
        const tracks = albumTracklistEditor.querySelectorAll('.track-list-item');
        tracks.forEach((track, index) => {
            track.querySelector('.track-number').textContent = `${index + 1}.`;
        });
    }

    async function batchCreateAirtableRecords(tableName, records) {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;
        const chunks = [];

        for (let i = 0; i < records.length; i += 10) {
            chunks.push(records.slice(i, i + 10));
        }

        const results = [];
        for (const chunk of chunks) {
             console.log(`Enviando lote para ${tableName}:`, JSON.stringify(chunk.map(fields => ({ fields })), null, 2));
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "records": chunk.map(fields => ({ fields })) })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Erro ao criar lote em ${tableName}:`, JSON.stringify(errorData, null, 2));
                    throw new Error(`Airtable batch error: ${response.status}`);
                }
                const data = await response.json();
                results.push(...data.records);

            } catch (error) {
                console.error("Falha na requisição para batchCreateAirtableRecords:", error);
                return null;
            }
        }
        return results;
    }

    async function handleAlbumSubmit(event) { // Linha 1030 -> agora ~1034
        event.preventDefault();
        const submitBtn = document.getElementById('submitNewAlbum');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const artistId = albumArtistSelect.value;
            const albumTitle = document.getElementById('albumTitle').value;
            const coverUrl = document.getElementById('albumCoverUrl').value;
            const releaseDate = albumReleaseDateInput.value;

             if (!artistId || !albumTitle || !coverUrl || !releaseDate) {
                alert("Por favor, preencha Artista, Título, URL da Capa e Data do álbum/EP.");
                throw new Error("Campos obrigatórios do álbum faltando.");
            }

            const trackElements = albumTracklistEditor.querySelectorAll('.track-list-item');
            let totalDurationSec = 0;

            const musicRecordsToCreate = [];

            for (let index = 0; index < trackElements.length; index++) {
                const trackEl = trackElements[index];
                const trackNameInput = trackEl.querySelector('.track-name-input');
                const durationStrInput = trackEl.querySelector('.track-duration-input');

                if (!trackNameInput || !durationStrInput) continue;

                const trackName = trackNameInput.value;
                const durationStr = durationStrInput.value;

                if (!trackName || !durationStr) {
                    alert(`Por favor, preencha o Nome e a Duração da Faixa ${index + 1}.`);
                    throw new Error(`Campos obrigatórios da faixa ${index + 1} faltando.`);
                }

                const durationSec = parseDurationToSeconds(durationStr);
                totalDurationSec += durationSec;

                const featTags = trackEl.querySelectorAll('.feat-tag');
                let finalTrackName = trackName;
                let finalArtistIds = [artistId];
                let collabType = null;

                if (featTags.length > 0) {
                    const featArtistIds = [];
                    const featArtistNames = [];
                    collabType = featTags[0].dataset.featType;

                    featTags.forEach(tag => {
                        featArtistIds.push(tag.dataset.artistId);
                        featArtistNames.push(tag.dataset.artistName);
                    });

                    if (collabType === "Feat.") {
                        finalTrackName = `${trackName} (feat. ${featArtistNames.join(', ')})`;
                        finalArtistIds = [artistId];
                    } else if (collabType === "Dueto/Grupo") {
                        finalTrackName = trackName;
                        finalArtistIds = [artistId, ...featArtistIds];
                    }
                }

                const musicRecord = {
                    "Nome da Faixa": finalTrackName,
                    "Artista": finalArtistIds,
                    "Duração": durationSec,
                    "Nº da Faixa": index + 1
                    // O link para Álbum ou Single/EP será adicionado depois
                };

                if (collabType) {
                    musicRecord["Tipo de Colaboração"] = collabType;
                }

                musicRecordsToCreate.push(musicRecord);
            }

            if (musicRecordsToCreate.length === 0) {
                alert("O álbum/EP precisa de pelo menos uma faixa válida.");
                throw new Error("Nenhuma faixa válida encontrada.");
            }

            const isAlbum = totalDurationSec >= (30 * 60);
            const tableName = isAlbum ? 'Álbuns' : 'Singles e EPs';
            const nameField = isAlbum ? 'Nome do Álbum' : 'Nome do Single/EP';
            const coverField = isAlbum ? 'Capa do Álbum' : 'Capa';

            const releaseRecordResponse = await createAirtableRecord(tableName, {
                [nameField]: albumTitle,
                "Artista": [artistId],
                [coverField]: [{ "url": coverUrl }],
                "Data de Lançamento": releaseDate
            });

            if (!releaseRecordResponse || !releaseRecordResponse.id) {
                throw new Error("Falha ao criar o registro do álbum/EP.");
            }
            const releaseRecordId = releaseRecordResponse.id;

            // --- CORREÇÃO ERRO 422 ---
            // Define o nome EXATO do campo de link na tabela "Músicas"
            // !!! VERIFIQUE ESTES NOMES NO SEU AIRTABLE !!!
            const albumLinkFieldNameInMusicas = 'Álbuns'; // Nome do campo link para Álbuns em Músicas
            const singleLinkFieldNameInMusicas = 'Singles e EPs'; // Nome do campo link para Singles em Músicas

            // Escolhe o nome correto do campo de link a ser usado
            const correctLinkField = isAlbum ? albumLinkFieldNameInMusicas : singleLinkFieldNameInMusicas;

            // Adiciona o link usando o nome CORRETO do campo
            musicRecordsToCreate.forEach(record => {
                record[correctLinkField] = [releaseRecordId];
            });
            // --- FIM DA CORREÇÃO ---


            const createdSongs = await batchCreateAirtableRecords('Músicas', musicRecordsToCreate); // Linha ~1207

            if (!createdSongs || createdSongs.length !== musicRecordsToCreate.length) { // Linha ~1210
                console.error("Álbum/EP criado, mas falha ao criar as músicas vinculadas.");
                // Opcional: Implementar rollback (deletar o álbum/EP)
                throw new Error("Falha ao criar as faixas no Airtable."); // Linha ~1212
            }

            alert("Álbum/EP lançado com sucesso!");
            newAlbumForm.reset();
            albumReleaseDateInput.value = new Date().toISOString().split('T')[0];
            albumTracklistEditor.innerHTML = '';
            initAlbumForm();
            await refreshAllData();

        } catch (error) { // Linha ~1224
            alert("Erro ao lançar o álbum/EP. Verifique o console e os campos preenchidos.");
            console.error("Erro em handleAlbumSubmit:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lançar Álbum / EP';
        }
    }


    // --- 5. INICIALIZAÇÃO GERAL ---

    function initializeBodyClickListener() {
        document.body.addEventListener('click', (e) => {
            const artistCard = e.target.closest('.artist-card[data-artist-name]');
            const albumCard = e.target.closest('[data-album-id]');
            const songCard = e.target.closest('.song-row[data-song-id], .track-row[data-song-id], .chart-item[data-song-id]');
            const artistLink = e.target.closest('.artist-link[data-artist-name]');
            const discogLink = e.target.closest('.see-all-btn[data-type]');

            if (discogLink) {
                openDiscographyDetail(discogLink.dataset.type);
                return;
            }

            if (albumCard) {
                openAlbumDetail(albumCard.dataset.albumId);
                return;
            }

            if (artistCard) {
                openArtistDetail(artistCard.dataset.artistName);
                return;
            }

            if (artistLink) {
                 openArtistDetail(artistLink.dataset.artistName);
                return;
            }

            if (songCard) {
                console.log("Clicou na música ID:", songCard.dataset.songId);
                 // Adicionar lógica de player aqui se necessário
            }
        });

        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    async function main() { // Linha ~1279
        console.log("Iniciando Aplicação...");
        if (!initializeDOMElements()) return;

        document.body.classList.add('loading');

        const data = await loadAllData();

        if (data && data.allArtists) {
            if (!initializeData(data)) return;

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

                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10));

                renderChart('music');
                renderChart('album');
                setupCountdown('musicCountdownTimer', () => renderChart('music'));
                setupCountdown('albumCountdownTimer', () => renderChart('album'));
                initializeBodyClickListener();
                document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

                switchTab(null, 'homeSection');

                console.log("Aplicação Iniciada e Configurada.");

            } catch (uiError) {
                console.error("Erro fatal durante a inicialização da UI:", uiError);
                document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Ocorreu um erro ao configurar a interface. Verifique o console.</p></div>';
            }

        } else {
            document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão, a API Key e se as tabelas não estão vazias.</p></div>';
            console.error("Initialization failed due to critical data loading error.");
        }

        document.body.classList.remove('loading');
    } // Fim da função main - Linha ~1316

    main();

}); // Fim do EventListener DOMContentLoaded
