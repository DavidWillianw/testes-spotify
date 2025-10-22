document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    let db = { artists: [], albums: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null; // <-- BUG CORRIGIDO: Esta linha estava faltando

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
    
    // Formulário de Single
    const newSingleForm = document.getElementById('newSingleForm');
    const singleArtistSelect = document.getElementById('singleArtistSelect');

    // Formulário de Álbum/EP
    const newAlbumForm = document.getElementById('newAlbumForm');
    const albumArtistSelect = document.getElementById('albumArtistSelect');
    const addTrackButton = document.getElementById('addTrackButton');
    const albumTracklistEditor = document.getElementById('albumTracklistEditor');
    

    // --- 1. CARREGAMENTO DE DADOS ---
    
    /**
     * Carrega TODOS os dados de TODAS as 5 tabelas do Airtable.
     */
    async function loadAllData() {
        // IDs já estão no escopo global, não precisa repetir

        // URLs para cada tabela da base (AGORA INCLUINDO JOGADORES)
        const artistsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists?filterByFormula=%7BArtista%20Principal%7D%3D1`;
        const albumsURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Álbuns`;
        const musicasURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Músicas`;
        const singlesURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Singles%20e%20EPs`;
        const playersURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jogadores`; // NOVA TABELA

        const fetchOptions = {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        };

        console.log("Iniciando carregamento de dados do Airtable...");

        try {
            // Busca os dados das CINCO tabelas ao mesmo tempo
            const [artistsResponse, albumsResponse, musicasResponse, singlesResponse, playersResponse] = await Promise.all([
                fetch(artistsURL, fetchOptions),
                fetch(albumsURL, fetchOptions),
                fetch(musicasURL, fetchOptions),
                fetch(singlesURL, fetchOptions),
                fetch(playersURL, fetchOptions) // NOVA REQUISIÇÃO
            ]);

            if (!artistsResponse.ok || !albumsResponse.ok || !musicasResponse.ok || !singlesResponse.ok || !playersResponse.ok) {
                console.error("Falha ao carregar dados de uma das tabelas do Airtable.");
                console.error("Artists:", artistsResponse.statusText);
                console.error("Albums:", albumsResponse.statusText);
                console.error("Musicas:", musicasResponse.statusText);
                console.error("Singles:", singlesResponse.statusText);
                console.error("Players:", playersResponse.statusText);
                throw new Error('Falha ao carregar dados de uma das tabelas do Airtable.');
            }

            const artistsData = await artistsResponse.json();
            const albumsData = await albumsResponse.json();
            const musicasData = await musicasResponse.json();
            const singlesData = await singlesResponse.json();
            const playersData = await playersResponse.json(); // NOVOS DADOS

            // --- RECONSTRUÇÃO DOS DADOS ---

            const musicasMap = new Map();
            musicasData.records.forEach(record => {
                musicasMap.set(record.id, {
                    title: record.fields['Nome da Faixa'],
                    duration: record.fields['Duração'] ? new Date(record.fields['Duração'] * 1000).toISOString().substr(14, 5) : "00:00",
                    trackNumber: record.fields['Nº da Faixa'] || 0,
                    // Adiciona duração em segundos para a lógica do álbum
                    durationSeconds: record.fields['Duração'] || 0 
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
                    
                    // Calcula a duração total
                    const totalDurationSeconds = tracks.reduce((total, track) => {
                        return total + track.durationSeconds;
                    }, 0);
                    
                    const artistId = (fields['Artista'] && fields['Artista'][0]) || null;
                    const artistName = artistId ? artistsMapById.get(artistId) : "Artista Desconhecido";

                    return {
                        id: record.id,
                        title: fields['Nome do Álbum'] || fields['Nome do Single/EP'],
                        artist: artistName,
                        metascore: fields['Metascore'] || 0,
                        imageUrl: (fields['Capa do Álbum'] && fields['Capa do Álbum'][0]?.url) || (fields['Capa'] && fields['Capa'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                        releaseDate: fields['Data de Lançamento'] || '2024-01-01',
                        tracks: tracks,
                        totalDurationSeconds: totalDurationSeconds // Salva o total
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
                    off: record.fields['Inspirações (Off)'] || [],
                    RPGPoints: record.fields.RPGPoints || 0,
                    LastActive: record.fields.LastActive || null
                };
            });
            
            // NOVO: Formata dados dos jogadores
            const formattedPlayers = playersData.records.map(record => {
                return {
                    id: record.id,
                    name: record.fields.Nome,
                    artists: record.fields.Artistas || [] // Array de IDs de artistas
                };
            });

            console.log("Dados carregados com sucesso.");

            return {
                albums: formattedAlbums,
                artists: formattedArtists,
                singles: formattedSingles,
                players: formattedPlayers // Retorna os jogadores
            };

        } catch (error) {
            console.error("Falha ao carregar e processar os dados do Airtable:", error);
            return { albums: [], artists: [], singles: [], players: [] };
        }
    }

    /**
     * Coloca os dados carregados no banco de dados local 'db'
     */
    const initializeData = (data) => {
        const artistsMap = new Map();

        (data.artists || []).forEach(artist => {
            artistsMap.set(artist.name, {
                ...artist,
                img: artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png',
                albums: [],
                singles: []
            });
        });

        const processReleases = (releaseData, type) => {
            (releaseData || []).forEach(item => {
                // A duração total já é calculada em `formatReleases`
                // e já está no `item.totalDurationSeconds`
                
                // Adiciona músicas ao db.songs
                if (item.tracks && item.tracks.length > 0) {
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

        db.songs = []; // Limpa as músicas antigas antes de re-processar
        
        // Combina álbuns e singles em um único array `db.albums`
        db.albums = [...(data.albums || []), ...(data.singles || [])];
        db.artists = Array.from(artistsMap.values());
        db.players = data.players || [];
        
        // Não é mais necessário processar 'albums' e 'singles' separadamente
        // pois `db.albums` já contém tudo.
    };


    /**
     * [NOVO] Recarrega todos os dados do Airtable e atualiza a UI
     * Isso corrige o bug de "desaparecer" do estúdio.
     */
    async function refreshAllData() {
        console.log("Atualizando dados...");
        const data = await loadAllData();
        initializeData(data);
        
        // Re-renderiza partes da UI que dependem dos novos dados
        renderRPGChart();
        renderChart('music');
        renderChart('album');
        
        // Atualiza os dropdowns do estúdio com os artistas do jogador logado
        if (currentPlayer) {
            populateArtistSelector(currentPlayer.id);
        }
        
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
        activeArtist = artist; // Define o artista ativo
        switchView('artistDetail'); 
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;
        const allSongsByArtist = db.songs.filter(s => s.artist === artistName);
        const topSongs = allSongsByArtist.sort((a, b) => b.streams - a.streams).slice(0, 5);
        document.getElementById('popularSongsList').innerHTML = topSongs.map((song, index) => `<div class="song-row" data-album-id="${song.albumId}"><div style="color: var(--text-secondary);">${index + 1}</div><div class="song-row-info"><img class="song-row-cover" src="${song.cover}" alt="${song.title}"><div class="song-row-title">${song.title}</div></div><div class="song-streams">${song.streams.toLocaleString('pt-BR')}</div></div>`).join('');
        
        const renderHorizontalList = (containerId, items) => { 
            document.getElementById(containerId).innerHTML = items.map(item => `<div class="album-card" data-album-id="${item.id}"><img src="${item.imageUrl}" alt="${item.title}"><div class="album-title">${item.title}</div><div class="album-year">${new Date(item.releaseDate || '2024-01-01').getFullYear()}</div></div>`).join(''); 
        };
        
        // --- LÓGICA DE ÁLBUM/EP ATUALIZADA ---
        const artistReleases = db.albums.filter(a => a.artist === artist.name);
        const thirtyMinutesInSeconds = 30 * 60;
        
        // Álbuns = 30 min ou mais
        renderHorizontalList('albumsList', artistReleases.filter(a => a.totalDurationSeconds >= thirtyMinutesInSeconds)); 
        // Singles/EPs = Menos de 30 min
        renderHorizontalList('singlesList', artistReleases.filter(a => a.totalDurationSeconds < thirtyMinutesInSeconds)); 
        
        renderArtistsGrid('recommendedGrid', db.artists.filter(a => a.name !== artistName).sort(() => 0.5 - Math.random()).slice(0, 4));
    };

    const openAlbumDetail = (albumId) => {
        const album = db.albums.find(a => a.id === albumId);
        if (!album) return;
        activeArtist = db.artists.find(a => a.name === album.artist); // Define o artista ativo
        switchView('albumDetail'); 
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
    };

    const openDiscographyDetail = (type) => {
        // 'activeArtist' já foi definido por openArtistDetail
        if (!activeArtist) return; 

        const artist = db.artists.find(a => a.name === activeArtist.name);
        if (!artist) return;
        
        // --- LÓGICA DE ÁLBUM/EP ATUALIZADA ---
        const artistReleases = db.albums.filter(a => a.artist === artist.name);
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
        
        if (tabId === 'studioSection') {
            switchView('studioView');
        } else if (viewHistory[viewHistory.length - 1] !== 'mainView' && tabId !== 'mainView') {
            switchView('mainView');
        }
        
        const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        dynamicAllNavs.forEach(nav => nav.classList.toggle('active', nav.dataset.tab === tabId));

        if (viewHistory[viewHistory.length - 1] === 'mainView') {
            document.querySelectorAll('#mainView .content-section').forEach(s => s.classList.toggle('active', s.id === tabId));
        }
    };

    const setupCountdown = (timerId, callback) => {
        let duration = 60;
        const timerDisplay = document.getElementById(timerId);
        if (!timerDisplay) return;
        const updateTimer = () => { duration = (duration - 1 + 60) % 60; if (duration === 59) callback(); timerDisplay.textContent = `00:${String(duration).padStart(2, '0')}`; };
        updateTimer();
        setInterval(updateTimer, 1000);
    };

    
    // --- 3. SISTEMA DE RPG (BRIGA DE CHARTS) ---

    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;

    function calculateSimulatedStreams(points, lastActiveISO) {
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
      const base = points * STREAMS_PER_POINT;
      const activityBonus = Math.floor(base * activityFactor);
      const randomness = Math.floor(base * (Math.random() * 0.15));
      const total = Math.max(0, base + activityBonus + randomness);
      return total;
    }

    function computeChartData(artistsArray) {
      return artistsArray.map(art => {
        const points = Number(art.RPGPoints || 0);
        const lastActive = art.LastActive || null;
        const simulatedStreams = calculateSimulatedStreams(points, lastActive);
        const chartScore = points;
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

    function renderRPGChart() {
      let container = document.getElementById('rpgChartList');
      if (!container) {
        const wrapper = document.createElement('section');
        wrapper.id = 'rpgChartSection';
        wrapper.className = 'content-section';
        wrapper.innerHTML = `
          <div class="chart-header"><h3>🏆 RPG Spotify - Top ${CHART_TOP_N}</h3><p>Atualiza automaticamente</p></div>
          <div id="rpgChartList" class="chart-list"></div>
        `;
        const mainEl = document.querySelector('#mainView .main-container');
        if(mainEl) mainEl.insertBefore(wrapper, document.getElementById('homeSection'));
        container = document.getElementById('rpgChartList');
        
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

      const artistsForChart = db.artists;
      const chart = computeChartData(artistsForChart);

      container.innerHTML = chart.map((item, idx) => `
        <div class="chart-item rpg-chart-item" data-id="${item.id}" data-artist-name="${item.name}">
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

      document.querySelectorAll('.btn-action').forEach(b => {
        b.addEventListener('click', async (e) => {
          e.stopPropagation();
          const action = e.currentTarget.dataset.action;
          const artistId = e.currentTarget.dataset.artistId;
          await handleRPGAction(action, artistId); 
          if (action !== 'launch_single') {
              renderRPGChart();
          }
        });
      });
    }

    const localActionCooldowns = {};

    function isOnCooldown(artistId, actionKey, cooldownSeconds = 60) {
      const key = `${artistId}_${actionKey}`;
      const now = Date.now();
      if (!localActionCooldowns[key] || (now - localActionCooldowns[key]) > (cooldownSeconds * 1000)) {
        return false;
      }
      return true;
    }

    async function handleRPGAction(action, artistId) {
        if (action === 'launch_single') {
            alert("Vá para a aba 'Meu Estúdio' para lançar sua música!");
            switchTab(null, 'studioSection');
        } else {
            await performRPGAction(action, artistId);
        }
    }

    async function performRPGAction(action, artistId) {
        // --- PROTEÇÃO DE LOGIN ---
        if (!currentPlayer) {
            alert("Você precisa estar logado no 'Meu Estúdio' para realizar ações.");
            switchTab(null, 'studioSection');
            return;
        }
        // --- PROTEÇÃO DE PROPRIEDADE ---
        if (!currentPlayer.artists.includes(artistId)) {
            alert("Você não pode divulgar ou gerenciar um artista que não é seu!");
            return;
        }

        const actionPointsMap = { promo: 30, remix: 70, event: 40, event_win: 120, collab: 20 };
        const cooldownMapSec = { promo: 60 * 2, remix: 60 * 5, event_win: 60 * 10, collab: 60 * 4 };
        const points = actionPointsMap[action] || 0;
        const cooldownSec = cooldownMapSec[action] || 60 * 2;
        
        if (points === 0) return;

        if (isOnCooldown(artistId, action, cooldownSec)) {
          alert('Ação em cooldown para este artista — espere um pouco.');
          return;
        }
        localActionCooldowns[`${artistId}_${action}`] = Date.now();

        const artistEntry = db.artists.find(a => (a.id === artistId));
        if (!artistEntry) return;
        
        artistEntry.RPGPoints = Number(artistEntry.RPGPoints || 0) + points;
        artistEntry.LastActive = new Date().toISOString();

        try {
          const recordId = artistEntry.id; 
          const patchBody = { fields: { 'RPGPoints': artistEntry.RPGPoints, 'LastActive': artistEntry.LastActive } };
          const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Artists/${recordId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(patchBody)
          });
          if (!response.ok) throw new Error('Falha ao salvar no Airtable');
          console.log(`Ação '${action}' de ${artistEntry.name} salva no Airtable.`);
        } catch (err) {
          console.warn('Erro ao tentar persistir no Airtable:', err);
        }
    }
    

    // --- 4. SISTEMA DO ESTÚDIO (LOGIN E FORMULÁRIOS) ---

    /**
     * Preenche os dropdowns de artista (ambos os formulários)
     * APENAS com os artistas que o jogador logado possui.
     */
    function populateArtistSelector(playerId) {
        const player = db.players.find(p => p.id === playerId);
        if (!player) return;

        const artistOptions = player.artists
            .map(artistId => db.artists.find(a => a.id === artistId))
            .filter(Boolean); // Remove artistas não encontrados (se houver)

        // Limpa ambos os dropdowns
        singleArtistSelect.innerHTML = '<option value="" disabled selected>Selecione seu artista...</option>';
        albumArtistSelect.innerHTML = '<option value="" disabled selected>Selecione seu artista...</option>';

        if (artistOptions.length === 0) {
            singleArtistSelect.innerHTML = '<option value="" disabled>Você não possui artistas.</option>';
            albumArtistSelect.innerHTML = '<option value="" disabled>Você não possui artistas.</option>';
            return;
        }

        artistOptions.forEach(artist => {
            const option1 = document.createElement('option');
            option1.value = artist.id;
            option1.textContent = artist.name;
            
            const option2 = option1.cloneNode(true);
            
            singleArtistSelect.appendChild(option1);
            albumArtistSelect.appendChild(option2);
        });
    }

    /**
     * Define o jogador logado, salva no localStorage e atualiza a UI
     */
    function loginPlayer(playerId) {
        currentPlayer = db.players.find(p => p.id === playerId);
        if (!currentPlayer) return;

        localStorage.setItem('spotifyRpg_playerId', playerId);
        
        document.getElementById('playerName').textContent = currentPlayer.name;
        loginPrompt.classList.add('hidden');
        loggedInInfo.classList.remove('hidden');
        studioLaunchWrapper.classList.remove('hidden');

        // Popula os dropdowns de artista com os artistas do jogador
        populateArtistSelector(playerId);
    }

    /**
     * Desloga o jogador
     */
    function logoutPlayer() {
        currentPlayer = null;
        localStorage.removeItem('spotifyRpg_playerId');

        loginPrompt.classList.remove('hidden');
        loggedInInfo.classList.add('hidden');
        studioLaunchWrapper.classList.add('hidden');
    }

    /**
     * Preenche o dropdown de login e verifica se o usuário já estava logado
     */
    function initializeStudio() {
        // Popula o dropdown de jogadores
        playerSelect.innerHTML = '<option value="" disabled selected>Selecione seu nome...</option>';
        db.players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            playerSelect.appendChild(option);
        });

        // Adiciona listeners de login/logout
        loginButton.addEventListener('click', () => {
            const selectedPlayerId = playerSelect.value;
            if (selectedPlayerId) {
                loginPlayer(selectedPlayerId);
            }
        });
        logoutButton.addEventListener('click', logoutPlayer);

        // Verifica se o jogador já estava logado no localStorage
        const storedPlayerId = localStorage.getItem('spotifyRpg_playerId');
        if (storedPlayerId) {
            loginPlayer(storedPlayerId);
        }
        
        // Listeners para as abas do estúdio (Single, Álbum)
        studioTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                studioTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                studioForms.forEach(form => form.classList.remove('active'));
                document.getElementById(tab.dataset.form === 'single' ? 'newSingleForm' : 'newAlbumForm').classList.add('active');
            });
        });

        // Configura o formulário de Álbum/EP
        initAlbumForm();
    }
    
    /**
     * Função genérica para criar um novo registro no Airtable.
     * (VERSÃO CORRIGIDA)
     */
    async function createAirtableRecord(tableName, fields) {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
                // CORREÇÃO: Removido o array "records", pois estamos criando apenas um.
                body: JSON.stringify({ fields }) 
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro do Airtable: ${JSON.stringify(errorData.error)}`);
            }
            const data = await response.json();
            return data; // Retorna o registro criado (que contém o .id)
        } catch (error) {
            console.error(`Falha ao criar registro na tabela ${tableName}:`, error);
            return null;
        }
    }


    /**
     * Processa o envio do formulário de NOVO SINGLE.
     */
    async function handleSingleSubmit(event) {
        event.preventDefault();
        const submitButton = document.getElementById('submitNewSingle');
        submitButton.disabled = true;
        submitButton.textContent = 'Lançando...';

        try {
            const artistId = singleArtistSelect.value;
            const singleTitle = document.getElementById('singleTitle').value;
            const singleCoverUrl = document.getElementById('singleCoverUrl').value;
            const trackName = document.getElementById('trackName').value;
            const trackDurationStr = document.getElementById('trackDuration').value;

            if (!artistId) throw new Error("Selecione um artista.");
            
            const parts = trackDurationStr.split(':');
            const durationInSeconds = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
            if (isNaN(durationInSeconds)) throw new Error("Formato de duração inválido. Use MM:SS");

            // 1. Criar a Música
            const musicFields = {
                "Nome da Faixa": trackName, "Duração": durationInSeconds,
                "Nº da Faixa": 1, "Artista": [artistId]
            };
            const newSong = await createAirtableRecord('Músicas', musicFields);
            if (!newSong || !newSong.id) throw new Error("Falha ao criar a música.");

            // 2. Criar o Single e lincar a música
            const singleFields = {
                "Nome do Single/EP": singleTitle,
                "Capa": [{ "url": singleCoverUrl }],
                "Músicas": [newSong.id],
                "Artista": [artistId],
                "Data de Lançamento": new Date().toISOString().split('T')[0]
            };
            const newSingle = await createAirtableRecord('Singles e EPs', singleFields);
            if (!newSingle || !newSingle.id) throw new Error("Falha ao criar o single.");

            alert("Single lançado com sucesso! Atualizando os dados...");
            newSingleForm.reset();
            await refreshAllData(); // Recarrega os dados sem dar reload na página

        } catch (error) {
            alert(`Erro ao lançar single: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Lançar Single';
        }
    }
    
    /**
     * [NOVO] Configura o formulário de Álbum/EP (Drag-and-Drop)
     */
    function initAlbumForm() {
        if (!albumTracklistEditor) return;
        
        // 1. Inicia o Sortable.js
        albumTracklistSortable = Sortable.create(albumTracklistEditor, {
            handle: '.drag-handle', // Define qual elemento pode ser usado para arrastar
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: updateTrackNumbers // Chama a função para re-numerar as faixas
        });

        // 2. Listener para adicionar faixa
        addTrackButton.addEventListener('click', addNewTrackInput);

        // 3. Listener para deletar faixa (usando delegação de evento)
        albumTracklistEditor.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-track-btn') || e.target.closest('.delete-track-btn')) {
                e.target.closest('.track-list-item').remove();
                updateTrackNumbers();
            }
        });
        
        // 4. Adiciona a primeira faixa automaticamente
        addNewTrackInput();
    }
    
    /**
     * [NOVO] Adiciona uma nova linha de input de faixa no formulário de álbum
     */
    function addNewTrackInput() {
        const trackCount = albumTracklistEditor.children.length + 1;
        const trackItem = document.createElement('div');
        trackItem.className = 'track-list-item';
        
        trackItem.innerHTML = `
            <i class="fas fa-bars drag-handle"></i>
            <div class="track-inputs">
                <span class="track-number">${trackCount}.</span>
                <input type="text" class="album-track-name" placeholder="Nome da Faixa" required>
                <input type="text" class="album-track-duration" placeholder="MM:SS" pattern="\\d{1,2}:\\d{2}" required>
            </div>
            <button type="button" class="delete-track-btn"><i class="fas fa-trash"></i></button>
        `;
        albumTracklistEditor.appendChild(trackItem);
    }
    
    /**
     * [NOVO] Atualiza os números das faixas (ex: 1., 2., 3.) após arrastar ou deletar
     */
    function updateTrackNumbers() {
        const tracks = albumTracklistEditor.querySelectorAll('.track-list-item');
        tracks.forEach((track, index) => {
            track.querySelector('.track-number').textContent = `${index + 1}.`;
        });
    }
    
    /**
     * [NOVO] Processa o envio do formulário de NOVO ÁLBUM/EP.
     * (VERSÃO CORRIGIDA)
     */
    async function handleAlbumSubmit(event) {
        event.preventDefault();
        const submitButton = document.getElementById('submitNewAlbum');
        submitButton.disabled = true;
        submitButton.textContent = 'Lançando...';

        try {
            // 1. Coletar dados do álbum
            const artistId = albumArtistSelect.value;
            const albumTitle = document.getElementById('albumTitle').value;
            const albumCoverUrl = document.getElementById('albumCoverUrl').value;

            if (!artistId) throw new Error("Selecione um artista.");

            // 2. Coletar dados das faixas (NA ORDEM CORRETA)
            const trackInputs = albumTracklistEditor.querySelectorAll('.track-list-item');
            if (trackInputs.length === 0) throw new Error("Adicione pelo menos uma faixa.");
            
            let trackPayloads = [];
            for (let i = 0; i < trackInputs.length; i++) {
                const trackEl = trackInputs[i];
                const trackName = trackEl.querySelector('.album-track-name').value;
                const durationStr = trackEl.querySelector('.album-track-duration').value;
                
                if (!trackName || !durationStr) throw new Error(`Preencha todos os campos da Faixa ${i + 1}.`);
                
                const parts = durationStr.split(':');
                const durationInSeconds = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
                if (isNaN(durationInSeconds)) throw new Error(`Formato de duração inválido na Faixa ${i + 1}. Use MM:SS`);

                trackPayloads.push({
                    "fields": {
                        "Nome da Faixa": trackName,
                        "Duração": durationInSeconds,
                        "Nº da Faixa": i + 1,
                        "Artista": [artistId]
                    }
                });
            }

            // 3. Criar todas as músicas de uma vez (Batch Create)
            console.log("Criando músicas...", trackPayloads);
            const newSongs = await batchCreateAirtableRecords('Músicas', trackPayloads);
            if (!newSongs || newSongs.length === 0) throw new Error("Falha ao criar as músicas no Airtable.");
            
            const newSongIds = newSongs.map(song => song.id);

            // 4. Determinar se é Álbum ou EP
            
            // --- CORREÇÃO AQUI ---
            const albumFields = {
                "Nome do Álbum": albumTitle,
                "Capa do Álbum": [{ "url": albumCoverUrl }], // Nome correto do campo
                "Músicas": newSongIds,
                "Artista": [artistId],
                "Data de Lançamento": new Date().toISOString().split('T')[0]
            };
            // --- FIM DA CORREÇÃO ---
            
            // 5. Criar o Álbum e lincar as músicas
            console.log("Criando álbum...", albumFields);
            const newAlbum = await createAirtableRecord('Álbuns', albumFields); // Agora usa a função createAirtableRecord corrigida
            if (!newAlbum || !newAlbum.id) throw new Error("Falha ao criar o álbum."); // Este era o seu erro

            alert("Álbum lançado com sucesso! Atualizando os dados...");
            newAlbumForm.reset();
            albumTracklistEditor.innerHTML = ''; // Limpa as faixas
            addNewTrackInput(); // Adiciona uma faixa nova
            await refreshAllData(); // Recarrega tudo

        } catch (error) {
            alert(`Erro ao lançar álbum: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Lançar Álbum / EP';
        }
    }
    
    /**
     * [NOVO] Função para criar múltiplos registros de uma vez (Batch)
     */
    async function batchCreateAirtableRecords(tableName, records) {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ records }) // Envia o array de records
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro do Airtable: ${JSON.stringify(errorData.error)}`);
            }
            const data = await response.json();
            return data.records; // Retorna o array de registros criados
        } catch (error) {
            console.error(`Falha ao criar registros em batch na tabela ${tableName}:`, error);
            return null;
        }
    }


    // --- 5. INICIALIZAÇÃO GERAL ---

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const chartItem = target.closest('.chart-item');
        // Impede que os cliques nos botões de ação do RPG abram o artista
        if (chartItem && !target.closest('.btn-action')) {
            const { type, artistName, albumId, id } = chartItem.dataset;
            // Se for do RPG chart, abre o artista
            if (chartItem.classList.contains('rpg-chart-item')) {
                 openArtistDetail(artistName); 
                 return;
            }
            // Se for chart de música, abre o álbum
            if (type === 'music') openAlbumDetail(albumId);
            // Se for chart de álbum, abre o álbum
            else if (type === 'album') openAlbumDetail(albumId || id); // Usa albumId se disponível, senão o id do item
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
            // 'activeArtist' é definido quando 'openArtistDetail' é chamado
            if(activeArtist) { 
                openDiscographyDetail(seeAllBtn.dataset.type);
            }
            return;
        }
    });

    // --- Ponto de Partida ---
    
    // 1. Carrega todos os dados
    const data = await loadAllData();
    
    // 2. Coloca os dados no 'db' local
    initializeData(data);

    // 3. Configura o Estúdio (Login, Formulários, etc.)
    initializeStudio();
    
    // 4. Adiciona listeners aos formulários
    if (newSingleForm) {
        newSingleForm.addEventListener('submit', handleSingleSubmit);
    }
    if (newAlbumForm) {
        newAlbumForm.addEventListener('submit', handleAlbumSubmit);
    }
    
    // 5. Inicializa o RPG Chart (que cria sua própria aba)
    renderRPGChart();
    setInterval(() => {
      renderRPGChart();
    }, 30 * 1000);
    
    // 6. Adiciona listeners de busca e navegação
    searchInput.addEventListener('input', handleSearch);
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    allNavs.forEach(nav => nav.addEventListener('click', switchTab));

    // 7. Renderiza o conteúdo inicial
    renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
    renderArtistsGrid('artistsGrid', db.artists);
    renderChart('music');
    renderChart('album');
    setupCountdown('musicCountdownTimer', () => renderChart('music'));
    setupCountdown('albumCountdownTimer', () => renderChart('album'));

    // 8. Ajuste final da view inicial
    document.getElementById('mainView').classList.remove('hidden');
    document.querySelector('.topbar').classList.remove('hidden');
});
