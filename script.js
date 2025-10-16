document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';
    
    let db = { artists: [], albums: [], songs: [] };
    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    let activeArtist = null;
    let viewHistory = ['mainView'];

    // --- FUNÇÕES DE API ---

    /**
     * Busca todos os dados iniciais das tabelas do Airtable.
     */
    async function loadAllData() {
        const fetchOptions = { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } };
        const tables = ['Artists?filterByFormula=%7BArtista%20Principal%7D%3D1', 'Álbuns', 'Músicas', 'Singles%20e%20EPs'];
        
        try {
            const responses = await Promise.all(
                tables.map(table => fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`, fetchOptions))
            );
            for (const res of responses) {
                if (!res.ok) throw new Error('Falha ao carregar dados do Airtable.');
            }
            const [artistsData, albumsData, musicasData, singlesData] = await Promise.all(responses.map(res => res.json()));

            const musicasMap = new Map();
            musicasData.records.forEach(record => {
                musicasMap.set(record.id, {
                    recordId: record.id,
                    title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0,
                    streams: record.fields['Streams'] || 0,
                    previousPosition: record.fields['Posição Anterior (Chart)']
                });
            });

            const artistsMapById = new Map();
            artistsData.records.forEach(record => artistsMapById.set(record.id, record.fields.Name));

            const formatReleases = (records) => records.map(record => {
                const fields = record.fields;
                const trackIds = fields['Músicas'] || [];
                const tracks = trackIds.map(trackId => musicasMap.get(trackId)).filter(Boolean);
                const artistId = (fields['Artista'] && fields['Artista'][0]) || null;
                return {
                    recordId: record.id,
                    title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                    artist: artistId ? artistsMapById.get(artistId) : "Artista Desconhecido",
                    imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                    tracks: tracks,
                    previousPosition: fields['Posição Anterior (Chart)']
                };
            });

            return {
                artists: artistsData.records.map(r => ({ id: r.id, name: r.fields.Name, imageUrl: (r.fields['URL da Imagem'] && r.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png' })),
                albums: formatReleases(albumsData.records),
                singles: formatReleases(singlesData.records)
            };
        } catch (error) {
            console.error("Falha ao carregar dados do Airtable:", error);
            return { artists: [], albums: [], singles: [] };
        }
    }

    /**
     * Atualiza múltiplos registros no Airtable. A API só permite 10 por vez.
     * Esta função divide os registros em lotes de 10 e envia as requisições.
     */
    async function updateAirtableRecords(tableName, recordsToUpdate) {
        if (recordsToUpdate.length === 0) return; // Não faz nada se não houver registros para atualizar
        
        const updatePayloads = [];
        for (let i = 0; i < recordsToUpdate.length; i += 10) {
            updatePayloads.push(recordsToUpdate.slice(i, i + 10));
        }

        const fetchOptions = {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            await Promise.all(updatePayloads.map(payload => {
                return fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`, {
                    ...fetchOptions,
                    body: JSON.stringify({ records: payload })
                });
            }));
             console.log(`${tableName} atualizados com sucesso!`);
        } catch (error) {
            console.error(`Falha ao atualizar ${tableName}:`, error);
        }
    }
    
    /**
     * Calcula o crescimento dos streams e as novas posições, e envia para o Airtable.
     * Roda em segundo plano após a página carregar.
     */
    async function updateStreamsAndCharts() {
        // 1. Atualizar streams de músicas
        const musicRecordsToUpdate = db.songs.map(song => {
            const growth = Math.floor(Math.random() * 50000) + 10000;
            const newStreams = (song.streams || 0) + growth;
            return {
                id: song.recordId,
                fields: { Streams: newStreams }
            };
        });

        // 2. Calcular novas posições do chart de músicas
        const songsSorted = [...db.songs].map(s => ({...s, streams: (s.streams || 0)})).sort((a, b) => b.streams - a.streams);
        songsSorted.forEach((song, index) => {
            const record = musicRecordsToUpdate.find(r => r.id === song.recordId);
            if (record) {
                record.fields['Posição Anterior (Chart)'] = index + 1;
            }
        });
        
        await updateAirtableRecords('Músicas', musicRecordsToUpdate);

        // 3. Calcular novas posições do chart de álbuns
        const albumRecordsToUpdate = [];
        const albumsSorted = [...db.albums].map(album => {
             const totalStreams = (album.tracks || []).reduce((sum, track) => {
                const updatedSong = musicRecordsToUpdate.find(r => r.id === track.recordId);
                return sum + (updatedSong ? updatedSong.fields.Streams : track.streams);
            }, 0);
            return {...album, streams: totalStreams};
        }).sort((a, b) => b.streams - a.streams);
        
        const singlesToUpdate = [];
        const albumsToUpdate = [];

        albumsSorted.forEach((album, index) => {
            const isSingle = db.albums.find(a => a.recordId === album.recordId && a.tracks.length > 0 && !album.title.toLowerCase().includes('album'));
            const record = {
                id: album.recordId,
                fields: { 'Posição Anterior (Chart)': index + 1 }
            };
            if (isSingle) {
                singlesToUpdate.push(record);
            } else {
                albumsToUpdate.push(record);
            }
        });
        
        await updateAirtableRecords('Álbuns', albumsToUpdate);
        await updateAirtableRecords('Singles e EPs', singlesToUpdate);
    }


    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---

    const initializeData = (apiData) => {
        const { artists: artistsList, albums: albumsData, singles: singlesData } = apiData;
        const artistsMap = new Map();
        artistsList.forEach(artist => artistsMap.set(artist.name, { ...artist, img: artist.imageUrl, albums: [], singles: [] }));
    
        const addedSongIds = new Set();
        
        // 1. Processa os ÁLBUNS primeiro para dar prioridade a eles
        albumsData.forEach(album => {
            (album.tracks || []).forEach(track => {
                db.songs.push({
                    ...track,
                    albumId: album.recordId,
                    artist: album.artist,
                    cover: album.imageUrl
                });
                addedSongIds.add(track.recordId);
            });
        });
    
        // 2. Processa os SINGLES depois
        singlesData.forEach(single => {
            (single.tracks || []).forEach(track => {
                if (!addedSongIds.has(track.recordId)) {
                    db.songs.push({
                        ...track,
                        albumId: single.recordId,
                        artist: single.artist,
                        cover: single.imageUrl
                    });
                    addedSongIds.add(track.recordId);
                }
            });
        });
        
        // Associa os lançamentos completos (álbuns e singles) aos artistas
        const allReleases = [...albumsData, ...singlesData];
        allReleases.forEach(item => {
            if (artistsMap.has(item.artist)) {
                const artistEntry = artistsMap.get(item.artist);
                const isAlbum = albumsData.some(a => a.recordId === item.recordId);
                const releaseType = isAlbum ? 'albums' : 'singles';
                artistEntry[releaseType].push(item);
            }
        });
    
        db.artists = Array.from(artistsMap.values());
        db.albums = allReleases;
    };

    const renderChart = (type) => {
        const container = document.getElementById(`${type}ChartsList`);
        if (!container) return;

        let items;
        if (type === 'music') {
            items = [...db.songs].sort((a, b) => (b.streams || 0) - (a.streams || 0));
        } else {
            items = db.albums.map(album => ({
                ...album,
                streams: (album.tracks || []).reduce((sum, track) => sum + (db.songs.find(s => s.recordId === track.recordId)?.streams || 0), 0)
            })).sort((a, b) => b.streams - a.streams);
        }

        const top50 = items.slice(0, 50);
        container.innerHTML = top50.map((item, index) => {
            const currentPosition = index + 1;
            const previousPosition = item.previousPosition;
            let trendIcon = '';
            if (previousPosition === undefined || previousPosition === null) trendIcon = `<span class="trend-new">NEW</span>`;
            else if (currentPosition < previousPosition) trendIcon = `<i class="fas fa-caret-up trend-up"></i>`;
            else if (currentPosition > previousPosition) trendIcon = `<i class="fas fa-caret-down trend-down"></i>`;
            else trendIcon = `<span>-</span>`;
            
            return `<div class="chart-item" data-album-id="${item.albumId || item.recordId}"><div class="chart-position">${currentPosition}</div><img src="${item.cover || item.imageUrl}" class="chart-cover"><div class="chart-info"><div class="chart-title">${item.title}</div><div class="chart-artist">${item.artist}</div></div><div class="chart-stats"><div class="chart-streams">${(item.streams || 0).toLocaleString('pt-BR')}</div><div class="chart-trend">${trendIcon}</div></div></div>`;
        }).join('');
    };
    
    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.recordId === albumId);
        if (!album) return;

        const totalDurationSeconds = (album.tracks || []).reduce((total, track) => {
            const parts = (track.duration || "0:0").split(':');
            return total + (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
        }, 0);

        document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`;
        document.getElementById('albumDetailCover').src = album.imageUrl;
        document.getElementById('albumDetailTitle').textContent = album.title;
        const totalMinutes = Math.floor(totalDurationSeconds / 60);
        document.getElementById('albumDetailInfo').innerHTML = `<strong class="clickable-artist" data-artist-name="${album.artist}">${album.artist}</strong> • ${new Date(album.releaseDate || '2024-01-01').getFullYear()} • ${(album.tracks || []).length} músicas, ${totalMinutes} min`;
        
        const sortedTracks = [...(album.tracks || [])].map(track => {
            const fullSongData = db.songs.find(s => s.recordId === track.recordId);
            return fullSongData || track;
        }).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
        
        document.getElementById('albumTracklist').innerHTML = sortedTracks.map(track => 
            `<div class="track-row">
                <div class="track-number">${track.trackNumber}</div>
                <div class="track-title-artist">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${album.artist}</div>
                </div>
                <div class="track-streams">${(track.streams || 0).toLocaleString('pt-BR')}</div>
            </div>`
        ).join('');
        
        switchView('albumDetail');
    };

    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) return;
        activeArtist = artist;
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;

        const allSongsByArtist = db.songs.filter(s => s.artist === artistName);

        const totalStreams = allSongsByArtist.reduce((total, song) => total + (song.streams || 0), 0);

        const totalStreamsElement = document.getElementById('artistTotalStreams');
        if (totalStreamsElement) {
            totalStreamsElement.innerHTML = `<strong>${totalStreams.toLocaleString('pt-BR')}</strong> streams totais`;
        }

        const topSongs = allSongsByArtist
            .sort((a, b) => (b.streams || 0) - (a.streams || 0))
            .slice(0, 5);

        document.getElementById('popularSongsList').innerHTML = topSongs.map((song, index) => `<div class="song-row" data-album-id="${song.albumId}"><div style="color: var(--text-secondary);">${index + 1}</div><div class="song-row-info"><img class="song-row-cover" src="${song.cover}" alt="${song.title}"><div class="song-row-title">${song.title}</div></div><div class="song-streams">${(song.streams || 0).toLocaleString('pt-BR')}</div></div>`).join('');

        const renderHorizontalList = (containerId, items) => { document.getElementById(containerId).innerHTML = items.map(item => `<div class="album-card" data-album-id="${item.recordId}"><img src="${item.imageUrl}" alt="${item.title}"><div class="album-title">${item.title}</div><div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div></div>`).join(''); };
        renderHorizontalList('albumsList', artist.albums);
        renderHorizontalList('singlesList', artist.singles);
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
        
        switchView('artistDetail');
    };

    const openDiscographyDetail = (type) => {
        if (!activeArtist) return;
        const items = type === 'albums' ? activeArtist.albums : activeArtist.singles;
        document.getElementById('discographyTypeTitle').textContent = type === 'albums' ? 'Todos os Álbuns' : 'Todos os Singles';
        const grid = document.getElementById('discographyGrid');
        grid.innerHTML = items.map(item => `<div class="album-card-grid" data-album-id="${item.recordId}"><img src="${item.imageUrl}" alt="${item.title}"><div class="album-title">${item.title}</div><div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div></div>`).join('');
        switchView('discographyDetail');
    };

    // --- FUNÇÕES AUXILIARES E EVENT LISTENERS ---
    const switchView = (viewId) => {
        allViews.forEach(v => v.classList.toggle('hidden', v.id !== viewId));
        if (viewId !== viewHistory[viewHistory.length - 1]) {
            viewHistory.push(viewId);
        }
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

    const renderArtistsGrid = (containerId, artists) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = artists.map(artist => `<div class="artist-card" data-artist-name="${artist.name}"><img src="${artist.img}" alt="${artist.name}"><h3>${artist.name}</h3></div>`).join('');
        }
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
    
    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const albumCard = target.closest('[data-album-id]');
        if (albumCard) { openAlbumDetail(albumCard.dataset.albumId); return; }
        const clickableArtist = target.closest('.clickable-artist, .artist-card');
        if (clickableArtist) { openArtistDetail(clickableArtist.dataset.artistName); return; }
        const seeAllBtn = target.closest('.see-all-btn');
        if (seeAllBtn) { openDiscographyDetail(seeAllBtn.dataset.type); return; }
    });

    // --- INICIALIZAÇÃO DA APLICAÇÃO ---

    console.log("Carregando dados do Airtable...");
    const apiData = await loadAllData();
    
    console.log("Inicializando a interface...");
    initializeData(apiData);
    searchInput.addEventListener('input', handleSearch);
    allNavs.forEach(nav => nav.addEventListener('click', switchTab));

    console.log("Renderizando componentes...");
    renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
    renderArtistsGrid('artistsGrid', db.artists);
    renderChart('music');
    renderChart('album');

    const countdownTimers = document.querySelectorAll('#musicCountdownTimer, #albumCountdownTimer');
    countdownTimers.forEach(timer => {
        if (timer) {
            timer.innerHTML = 'Atualizado nesta sessão';
        }
    });

    console.log("Enviando atualizações para o Airtable em segundo plano...");
    updateStreamsAndCharts();
});
