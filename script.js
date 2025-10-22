document.addEventListener('DOMContentLoaded', async () => {

    async function loadAllData() {

        const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
        const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';
        // ------------------------------------

        // URLs para cada tabela da base
        const artistsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists?filterByFormula=%7BArtista%20Principal%7D%3D1`;
        const albumsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Álbuns`;
        const musicasURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Músicas`;
        const singlesURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Singles%20e%20EPs`;

        const fetchOptions = {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        };

        try {
            // Busca os dados das QUATRO tabelas ao mesmo tempo
            const [artistsResponse, albumsResponse, musicasResponse, singlesResponse] = await Promise.all([
                fetch(artistsURL, fetchOptions),
                fetch(albumsURL, fetchOptions),
                fetch(musicasURL, fetchOptions),
                fetch(singlesURL, fetchOptions) 
            ]);

            if (!artistsResponse.ok || !albumsResponse.ok || !musicasResponse.ok || !singlesResponse.ok) {
                throw new Error('Falha ao carregar dados de uma das tabelas do Airtable.');
            }

            const artistsData = await artistsResponse.json();
            const albumsData = await albumsResponse.json();
            const musicasData = await musicasResponse.json();
            const singlesData = await singlesResponse.json();

            // --- RECONSTRUÇÃO DOS DADOS ---

            const musicasMap = new Map();
            musicasData.records.forEach(record => {
                musicasMap.set(record.id, {
                    title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0 // <-- MUDANÇA 1: Adiciona o número da faixa aos dados da música
                });
            });

            const artistsMapById = new Map();
            artistsData.records.forEach(record => {
                artistsMapById.set(record.id, record.fields.Name);
            });
            
            const formatReleases = (records) => {
                return records.map(record => {
                    const fields = record.fields;
                    const trackIds = fields['Músicas'] || [];
                    const tracks = trackIds.map(trackId => musicasMap.get(trackId)).filter(Boolean);
                    const artistId = (fields['Artista'] && fields['Artista'][0]) || null;
                    const artistName = artistId ? artistsMapById.get(artistId) : "Artista Desconhecido";

                    return {
                        id: record.id,
                        title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                        artist: artistName,
                        metascore: fields['Metascore'] || 0,
                        imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                        releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                        tracks: tracks
                    };
                });
            };
            
            const formattedAlbums = formatReleases(albumsData.records);
            const formattedSingles = formatReleases(singlesData.records);

            const formattedArtists = artistsData.records.map(record => {
                return {
                    id: record.id,
                    name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || []
                };
            });
            
            return {
                albums: formattedAlbums,
                artists: formattedArtists,
                singles: formattedSingles
            };

        } catch (error) {
            console.error("Falha ao carregar e processar os dados do Airtable:", error);
            return { albums: [], artists: [], singles: [] };
        }
    }

    const { albums: albumsData, artists: artistsList, singles: singlesData } = await loadAllData();

    let db = { artists: [], albums: [], songs: [] };
    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    let activeArtist = null;
    let viewHistory = ['mainView'];

    const initializeData = () => {
        const artistsMap = new Map();

        artistsList.forEach(artist => {
            artistsMap.set(artist.name, {
                ...artist,
                img: artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png',
                albums: [],
                singles: []
            });
        });
        
        const processReleases = (releaseData, type) => {
            releaseData.forEach(item => {
                if (item.tracks && item.tracks.length > 0) {
                    item.totalDurationSeconds = item.tracks.reduce((total, track) => {
                        const parts = (track.duration || "0:0").split(':');
                        const seconds = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
                        return total + seconds;
                    }, 0);

                    item.tracks.forEach(track => {
                        db.songs.push({
                            ...track,
                            id: `${item.id}-${track.title.replace(/\s/g, '')}`,
                            albumId: item.id,
                            artist: item.artist,
                            cover: item.imageUrl,
                            streams: Math.floor(Math.random() * 25000000) + 50000
                        });
                    });
                }

                if (artistsMap.has(item.artist)) {
                    const artistEntry = artistsMap.get(item.artist);
                    if (artistEntry[type]) {
                        artistEntry[type].push(item);
                    }
                }
            });
        };

        processReleases(albumsData, 'albums');
        processReleases(singlesData, 'singles');

        db.artists = Array.from(artistsMap.values());
        db.albums = [...albumsData, ...singlesData]; 
    };

    const switchView = (viewId) => {
        allViews.forEach(v => v.classList.toggle('hidden', v.id !== viewId));
        if (viewId !== viewHistory[viewHistory.length - 1]) { viewHistory.push(viewId); }
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (viewHistory.length > 1) {
            viewHistory.pop();
            const previousViewId = viewHistory[viewHistory.length - 1];
            allViews.forEach(v => v.classList.toggle('hidden', v.id !== previousViewId));
            window.scrollTo(0, 0);
        }
    };

    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

    const renderArtistsGrid = (containerId, artists) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = artists.map(artist => `<div class="artist-card" data-artist-name="${artist.name}"><img src="${artist.img}" alt="${artist.name}"><h3>${artist.name}</h3></div>`).join('');
    };

    const renderChart = (type) => {
        const container = document.getElementById(`${type}ChartsList`);
        if (!container) return;
        const items = type === 'music' ? [...db.songs].sort((a, b) => b.streams - a.streams).slice(0, 50) : [...db.albums].sort((a, b) => (b.metascore || 0) - (a.metascore || 0)).slice(0, 50);
        container.innerHTML = items.map((item, index) => {
            const trends = ['up', 'down', 'new', 'same']; const trend = trends[Math.floor(Math.random() * trends.length)];
            let trendIcon = '';
            if (trend === 'up') trendIcon = `<i class="fas fa-caret-up trend-up"></i>`; else if (trend === 'down') trendIcon = `<i class="fas fa-caret-down trend-down"></i>`; else if (trend === 'new') trendIcon = `<span class="trend-new">NEW</span>`; else trendIcon = `<span>-</span>`;
            return `<div class="chart-item" data-id="${item.id}" data-type="${type}" data-artist-name="${item.artist}" data-album-id="${item.albumId || item.id}"><div class="chart-position">${index + 1}</div><img src="${item.cover || item.imageUrl}" class="chart-cover"><div class="chart-info"><div class="chart-title">${item.title}</div><div class="chart-artist">${item.artist}</div></div><div class="chart-stats"><div class="chart-streams">${(item.streams || (item.metascore || 0) * 10000).toLocaleString('pt-BR')}</div><div class="chart-trend">${trendIcon}</div></div></div>`;
        }).join('');
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) return;
        activeArtist = artist;
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;

        const allSongsByArtist = db.songs.filter(s => s.artist === artistName);
        const topSongs = allSongsByArtist.sort((a, b) => b.streams - a.streams).slice(0, 5);

        document.getElementById('popularSongsList').innerHTML = topSongs.map((song, index) => `<div class="song-row" data-album-id="${song.albumId}"><div style="color: var(--text-secondary);">${index + 1}</div><div class="song-row-info"><img class="song-row-cover" src="${song.cover}" alt="${song.title}"><div class="song-row-title">${song.title}</div></div><div class="song-streams">${song.streams.toLocaleString('pt-BR')}</div></div>`).join('');

        const renderHorizontalList = (containerId, items) => { document.getElementById(containerId).innerHTML = items.map(item => `<div class="album-card" data-album-id="${item.id}"><img src="${item.imageUrl}" alt="${item.title}"><div class="album-title">${item.title}</div><div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div></div>`).join(''); };
        renderHorizontalList('albumsList', artist.albums);
        renderHorizontalList('singlesList', artist.singles);
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
        switchView('artistDetail');
    };

    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.id === albumId);
        if (!album) return;

        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        const totalMinutes = Math.floor((album.totalDurationSeconds || 0) / 60);
        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate || '2024-01-01').getFullYear()} • ${(album.tracks || []).length} músicas, ${totalMinutes} min`;
        
        // <-- MUDANÇA 2: Ordena as faixas ANTES de criar o HTML
        const sortedTracks = [...(album.tracks || [])].sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
        
        document.getElementById('albumTracklist').innerHTML = sortedTracks.map(track => 
            `<div class="track-row">
                <div>${track.trackNumber}</div>
                <div class="track-title">${track.title}</div>
                <div class="track-duration">${track.duration}</div>
            </div>`
        ).join('');
        
        switchView('albumDetail');
    };

    const openDiscographyDetail = (type) => {
        if (!activeArtist) return;
        const items = type === 'albums' ? activeArtist.albums : activeArtist.singles;
        document.getElementById('discographyTypeTitle').textContent = type === 'albums' ? 'Todos os Álbuns' : 'Todos os Singles';
        const grid = document.getElementById('discographyGrid');

        grid.innerHTML = items.map(item => `
            <div class="album-card-grid" data-album-id="${item.id}">
                <img src="${item.imageUrl}" alt="${item.title}">
                <div class="album-title">${item.title}</div>
                <div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div>
            </div>`).join('');
        switchView('discographyDetail');
    };

    const handleSearch = () => {
        const query = searchInput.value.toLowerCase();
        switchTab(null, query ? 'searchSection' : 'homeSection');
        if (query) {
            const filtered = db.artists.filter(a => a.name.toLowerCase().includes(query));
            renderArtistsGrid('searchResults', filtered);
            document.getElementById('noResults').classList.toggle('hidden', filtered.length > 0);
        }
    };

    const switchTab = (event, forceTabId = null) => {
        const tabId = forceTabId || (event.currentTarget ? event.currentTarget.dataset.tab : 'homeSection');
        if (viewHistory[viewHistory.length - 1] !== 'mainView') {
            switchView('mainView');
            viewHistory = ['mainView'];
        }
        document.querySelectorAll('.content-section').forEach(s => s.classList.toggle('active', s.id === tabId));
        allNavs.forEach(nav => nav.classList.toggle('active', nav.dataset.tab === tabId));
    };

    const setupCountdown = (timerId, callback) => {
        let duration = 60;
        const timerDisplay = document.getElementById(timerId);
        if (!timerDisplay) return;
        const updateTimer = () => { duration = (duration - 1 + 60) % 60; if (duration === 59) callback(); timerDisplay.textContent = `00:${String(duration).padStart(2, '0')}`; };
        updateTimer();
        setInterval(updateTimer, 1000);
    };

    document.body.addEventListener('click', (e) => {
        const target = e.target;

        const chartItem = target.closest('.chart-item');
        if (chartItem) {
            const { type, artistName, albumId } = chartItem.dataset;
            if (type === 'music') openAlbumDetail(albumId);
            else openArtistDetail(artistName);
            return;
        }

        const clickableArtist = target.closest('.clickable-artist');
        if (clickableArtist) {
            openArtistDetail(clickableArtist.dataset.artistName);
            return;
        }

        const artistCard = target.closest('.artist-card');
        if (artistCard) {
            openArtistDetail(artistCard.dataset.artistName);
            return;
        }

        const albumCard = target.closest('[data-album-id]');
        if (albumCard) {
            openAlbumDetail(albumCard.dataset.albumId);
            return;
        }

        const seeAllBtn = target.closest('.see-all-btn');
        if (seeAllBtn) {
            openDiscographyDetail(seeAllBtn.dataset.type);
            return;
        }
    });

    initializeData();
    searchInput.addEventListener('input', handleSearch);
    allNavs.forEach(nav => nav.addEventListener('click', switchTab));

    renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
    renderArtistsGrid('artistsGrid', db.artists);
    renderChart('music');
    renderChart('album');
    setupCountdown('musicCountdownTimer', () => renderChart('music'));
    setupCountdown('albumCountdownTimer', () => renderChart('album'));
});
