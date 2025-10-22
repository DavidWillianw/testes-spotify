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
                    trackNumber: record.fields['Nº da Faixa'] || 0
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

            // ***** MODIFICAÇÃO AQUI *****
            // Adicionado RPGPoints e LastActive para o novo sistema de RPG
            const formattedArtists = artistsData.records.map(record => {
                return {
                    id: record.id, // ID do Registro do Airtable, essencial para o PATCH
                    name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || [],
                    // --- NOVOS CAMPOS DO RPG ---
                    RPGPoints: record.fields.RPGPoints || 0,
                    LastActive: record.fields.LastActive || null
                };
            });
            // ***** FIM DA MODIFICAÇÃO *****

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

    // Constantes Globais
    const { albums: albumsData, artists: artistsList, singles: singlesData } = await loadAllData();
    let db = { artists: [], albums: [], songs: [] };
    const allViews = document.querySelectorAll('.page-view');
    const searchInput = document.getElementById('searchInput');
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    let activeArtist = null;
    let viewHistory = ['mainView'];
    
    // As constantes AIRTABLE_BASE_ID e AIRTABLE_API_KEY são definidas
    // dentro de loadAllData() e performRPGAction() usa as que estão
    // definidas no escopo da primeira função. Vamos declará-las aqui
    // para que a performRPGAction também possa acessá-las.
    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';


    const initializeData = () => {
        const artistsMap = new Map();

        artistsList.forEach(artist => {
            artistsMap.set(artist.name, {
                ...artist, // Isso irá incluir id, RPGPoints, LastActive, etc.
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
        
        // Esta é a única parte do seu código que precisa ser adaptada
        // para encontrar os botões de navegação corretos, já que allNavs
        // é definido no topo, antes do botão 'rpgChartSection' existir.
        const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        
        if (viewHistory[viewHistory.length - 1] !== 'mainView') {
            switchView('mainView');
            viewHistory = ['mainView'];
        }
        document.querySelectorAll('.content-section').forEach(s => s.classList.toggle('active', s.id === tabId));
        dynamicAllNavs.forEach(nav => nav.classList.toggle('active', nav.dataset.tab === tabId));
    };

    const setupCountdown = (timerId, callback) => {
        let duration = 60;
        const timerDisplay = document.getElementById(timerId);
        if (!timerDisplay) return;
        const updateTimer = () => { duration = (duration - 1 + 60) % 60; if (duration === 59) callback(); timerDisplay.textContent = `00:${String(duration).padStart(2, '0')}`; };
        updateTimer();
        setInterval(updateTimer, 1000);
    };

    // ----- TODO O CÓDIGO DA BRIGA DE CHARTS ANTERIOR FOI REMOVIDO -----


    document.body.addEventListener('click', (e) => {
        const target = e.target;

        const chartItem = target.closest('.chart-item');
        // Impede que os cliques nos botões de ação do RPG abram o artista
        if (chartItem && !target.closest('.btn-action')) {
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

    // ----------------- RPG SPOTIFY CHARTS (TOP 20) -----------------
    // (Este é o bloco de código que você forneceu, colado aqui)

    // Config
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000; // ajuste se quiser números maiores

    // Util: calcula streams simulados a partir de pontos e lastActive (ISO string ou null)
    function calculateSimulatedStreams(points, lastActiveISO) {
      // base
      const base = points * STREAMS_PER_POINT; // digit-by-digit: points * STREAMS_PER_POINT
      // activity factor (recency): se ativo nos últimos 3 dias => +20%, 7 dias => +10%, 14 dias => 0, mais velho => -10%
      let activityFactor = 0;
      if (lastActiveISO) {
        const last = new Date(lastActiveISO);
        const now = new Date();
        const diffMs = now - last;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) activityFactor = 0.20;
        else if (diffDays <= 7) activityFactor = 0.10;
        else if (diffDays <= 14) activityFactor = 0.00;
        else activityFactor = -0.10;
      }
      const activityBonus = Math.floor(base * activityFactor); // inteiro
      // randomness até 15%
      const randomness = Math.floor(base * (Math.random() * 0.15));
      const total = Math.max(0, base + activityBonus + randomness);
      return total;
    }

    // Constrói o array com score e simulatedStreams para o chart
    function computeChartData(artistsArray) {
      // artistsArray deve ter: { id, name, RPGPoints, LastActive, img, ... }
      return artistsArray.map(art => {
        const points = Number(art.RPGPoints || 0);
        const lastActive = art.LastActive || null;
        const simulatedStreams = calculateSimulatedStreams(points, lastActive);
        const chartScore = points; // se quiser, pode misturar outros fatores
        return {
          id: art.id,
          name: art.name,
          img: art.img || art.imageUrl || 'https://i.imgur.com/AD3MbBi.png',
          points,
          lastActive,
          simulatedStreams,
          chartScore
        };
      }).sort((a, b) => b.chartScore - a.chartScore).slice(0, CHART_TOP_N);
    }

    // Render do Top 20 na UI (cria uma nova seção ou reusa #musicChartsList)
    function renderRPGChart() {
      // cria container se não existir
      let container = document.getElementById('rpgChartList');
      if (!container) {
        // cria coluna nova na interface (coloca antes de musicChartsList por exemplo)
        const wrapper = document.createElement('section');
        wrapper.id = 'rpgChartSection';
        wrapper.className = 'content-section';
        wrapper.innerHTML = `
          <div class="chart-header"><h3>🏆 RPG Spotify - Top ${CHART_TOP_N}</h3><p>Atualiza automaticamente</p></div>
          <div id="rpgChartList" class="chart-list"></div>
        `;
        const mainEl = document.querySelector('.main-container') || document.querySelector('main');
        mainEl.insertBefore(wrapper, document.getElementById('homeSection')); // Coloca antes da home
        container = document.getElementById('rpgChartList');
        
        // adiciona tab no nav se quiser
        const nav = document.querySelector('.nav-tabs');
        if (nav && !nav.querySelector('[data-tab="rpgChartSection"]')) {
          const btn = document.createElement('button');
          btn.className = 'nav-tab';
          btn.dataset.tab = 'rpgChartSection';
          btn.textContent = 'Briga de Charts';
          nav.appendChild(btn);
          btn.addEventListener('click', (e) => switchTab(e));
        }
      }

      // computa
      // db.artists já tem id, name, img, RPGPoints, e LastActive
      // graças às modificações em loadAllData e initializeData
      const artistsForChart = db.artists;

      const chart = computeChartData(artistsForChart);

      container.innerHTML = chart.map((item, idx) => `
        <div class="chart-item rpg-chart-item" data-id="${item.id}">
          <div class="chart-position">${idx + 1}</div>
          <img src="${item.img}" class="chart-cover">
          <div class="chart-info">
            <div class="chart-title">${item.name}</div>
            <div class="chart-artist">${item.points} pts • ${item.simulatedStreams.toLocaleString('pt-BR')} plays</div>
          </div>
          <div class="chart-stats">
            <button class="small-btn btn-action" data-action="launch_single" data-artist-id="${item.id}">Lançar Single</button>
            <button class="small-btn btn-action" data-action="promo" data-artist-id="${item.id}">Divulgar</button>
          </div>
        </div>
      `).join('');

      // adiciona event listeners nos botões
      document.querySelectorAll('.btn-action').forEach(b => {
        b.addEventListener('click', async (e) => {
          e.stopPropagation(); // Impede que o clique no botão acione o clique no .chart-item
          const action = e.currentTarget.dataset.action;
          const artistId = e.currentTarget.dataset.artistId;
          await performRPGAction(action, artistId);
          renderRPGChart(); // atualiza UI
        });
      });
    }

    // ----------------- AÇÃO RPG (aplica pontos e salva) -----------------

    // cooldowns locais rápidos pra UX; se quiser persistir, armazena no Airtable (campo Cooldowns)
    const localActionCooldowns = {}; // artistId_action -> timestamp

    function isOnCooldown(artistId, actionKey, cooldownSeconds = 60) {
      const key = `${artistId}_${actionKey}`;
      const now = Date.now();
      if (!localActionCooldowns[key] || (now - localActionCooldowns[key]) > (cooldownSeconds * 1000)) {
        return false;
      }
      return true;
    }

    async function performRPGAction(action, artistId) {
      // action: 'launch_single', 'promo', 'remix', 'event_win', 'collab'
      // define pontos por ação (mesma sugestão de regras)
      const actionPointsMap = {
        launch_single: 50,
        promo: 30,
        remix: 70,
        event: 40,
        event_win: 120,
        collab: 20
      };
      const cooldownMapSec = { launch_single: 60 * 3, promo: 60 * 2, remix: 60 * 5, event_win: 60 * 10, collab: 60 * 4 };

      const points = actionPointsMap[action] || 0;
      const cooldownSec = cooldownMapSec[action] || 60 * 2;

      if (isOnCooldown(artistId, action, cooldownSec)) {
        alert('Ação em cooldown para este artista — espere um pouco.');
        return;
      }

      // atualiza localActionCooldowns
      localActionCooldowns[`${artistId}_${action}`] = Date.now();

      // atualiza objeto local db.artists
      const artistEntry = db.artists.find(a => (a.id === artistId)); // Busca pelo ID do Airtable
      if (!artistEntry) {
        console.warn('Artista não encontrado', artistId);
        return;
      }
      artistEntry.RPGPoints = Number(artistEntry.RPGPoints || 0) + points;
      artistEntry.LastActive = new Date().toISOString();

      // opcional: salvar no Airtable (recomendado para multi-user)
      // As constantes AIRTABLE_BASE_ID e AIRTABLE_API_KEY estão definidas no escopo global do DOMContentLoaded
      if (typeof AIRTABLE_BASE_ID !== 'undefined' && typeof AIRTABLE_API_KEY !== 'undefined') {
        try {
          // artistEntry.id é o recordId do Airtable
          const recordId = artistEntry.id; 
          if (recordId) {
            const patchBody = { fields: { 'RPGPoints': artistEntry.RPGPoints, 'LastActive': artistEntry.LastActive } };
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists/${recordId}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(patchBody)
            }).then(r => r.json()).then(res => {
              // opcional log
              console.log('Airtable updated', res);
            }).catch(err => {
              console.warn('Falha ao salvar no Airtable (ignorado):', err);
            });
          }
        } catch (err) {
          console.warn('Erro ao tentar persistir no Airtable:', err);
        }
      } else {
        // se sem Airtable, salva local (localStorage)
        localStorage.setItem('rpg_artists_snapshot', JSON.stringify(db.artists));
      }

      // feedback pro jogador (função addLog não existe, usando alert)
      // addLog && addLog(`Jogador aplicou ${points} pts em ${artistEntry.name} (ação ${action})`);
      console.log(`Jogador aplicou ${points} pts em ${artistEntry.name} (ação ${action})`);
    }

    // inicializa o chart e atualiza periodicamente
    renderRPGChart();
    setInterval(() => {
      // recalc e re-render a cada 30s (ou 60s)
      renderRPGChart();
    }, 30 * 1000);

    // ----------------- FIM DO CÓDIGO RPG -----------------
    

    searchInput.addEventListener('input', handleSearch);
    
    // Modifica o 'allNavs' para pegar os botões dinâmicos também
    // A função switchTab foi ajustada para fazer isso
    const initialNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    initialNavs.forEach(nav => nav.addEventListener('click', switchTab));

    renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
    renderArtistsGrid('artistsGrid', db.artists);
    renderChart('music');
    renderChart('album');
    setupCountdown('musicCountdownTimer', () => renderChart('music'));
    setupCountdown('albumCountdownTimer', () => renderChart('album'));
});
