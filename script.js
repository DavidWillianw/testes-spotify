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
    // ** MODIFICAÇÃO AQUI: Adiciona a nova view do estúdio **
    const studioView = document.getElementById('studioView'); 
    // ** Adiciona os botões de navegação (serão encontrados pelo switchTab) **
    let activeArtist = null;
    let viewHistory = ['mainView'];
    
    const AIRTABLE_BASE_ID = 'appG5NOoblUmtSMVI';
    const AIRTABLE_API_KEY = 'pat5T28kjmJ4t6TQG.69bf34509e687fff6a3f76bd52e64518d6c92be8b1ee0a53bcc9f50fedcb5c70';
    
    // ** MODIFICAÇÃO AQUI: Adiciona o formulário **
    const newSingleForm = document.getElementById('newSingleForm');


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
        // ** MODIFICAÇÃO AQUI: Garante que a view do estúdio seja tratada **
        // Oculta todas as views
        allViews.forEach(v => v.classList.add('hidden'));

        // Mostra a view correta
        if (viewId === 'studioView') {
            studioView.classList.remove('hidden');
            // Como studioView não é 'mainView', esconde o topbar e mostra o conteúdo
            document.querySelector('.topbar').classList.add('hidden');
            // studioView tem seu próprio main-container, então está ok.
        } else if (viewId === 'mainView') {
            document.getElementById('mainView').classList.remove('hidden');
            document.querySelector('.topbar').classList.remove('hidden');
        } else {
            // Para 'artistDetail', 'albumDetail', etc.
            document.getElementById(viewId).classList.remove('hidden');
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
            // Re-chama switchView para tratar corretamente a lógica de mostrar/esconder
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
        
        // ** MODIFICAÇÃO AQUI: Trata a troca para a nova aba 'studioSection' **
        if (tabId === 'studioSection') {
            switchView('studioView');
        } else if (viewHistory[viewHistory.length - 1] !== 'mainView') {
            switchView('mainView');
        }
        
        // Atualiza os botões de navegação
        const dynamicAllNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
        dynamicAllNavs.forEach(nav => nav.classList.toggle('active', nav.dataset.tab === tabId));

        // Ativa a seção de conteúdo correta APENAS se estivermos na mainView
        if (viewHistory[viewHistory.length - 1] === 'mainView') {
            document.querySelectorAll('.content-section').forEach(s => s.classList.toggle('active', s.id === tabId));
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

    // ----------------- (CÓDIGO DE RPG / BRIGA DE CHARTS) -----------------
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
          
          // Chama a nova função handler
          await handleRPGAction(action, artistId); 
          
          // O re-render só acontece se a ação não for 'launch_single'
          if (action !== 'launch_single') {
              renderRPGChart(); // atualiza UI
          }
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

    // --- NOVA FUNÇÃO HANDLER ---
    // Esta função decide o que fazer com base na ação
    async function handleRPGAction(action, artistId) {
        // const notionLink = "https://www.notion.so/Lance-sua-m-sica-294bdee35f0580caafbffb28ae61f3a8"; // Seu link do Notion

        if (action === 'launch_single') {
            // Ação: Lançar Single
            // ** MODIFICAÇÃO AQUI: Em vez de abrir o Notion, troca para a aba Estúdio **
            alert("Vá para a aba 'Meu Estúdio' para lançar sua música!");
            switchTab(null, 'studioSection'); // Força a troca para a aba Estúdio
        } else {
            // Ação: Divulgar (ou qualquer outra)
            // Chama a função original que salva os pontos no Airtable
            await performRPGAction(action, artistId);
        }
    }


    // MODIFICADA: A lógica de 'launch_single' foi movida para o 'handleRPGAction'
    async function performRPGAction(action, artistId) {
        // action: 'launch_single', 'promo', 'remix', 'event_win', 'collab'
        // define pontos por ação (mesma sugestão de regras)
        const actionPointsMap = {
          // 'launch_single' foi removido daqui, pois não dá mais pontos diretamente
          promo: 30,
          remix: 70,
          event: 40,
          event_win: 120,
          collab: 20
        };
        const cooldownMapSec = { 
            // 'launch_single' removido
            promo: 60 * 2, 
            remix: 60 * 5, 
            event_win: 60 * 10, 
            collab: 60 * 4 
        };

        const points = actionPointsMap[action] || 0;
        const cooldownSec = cooldownMapSec[action] || 60 * 2;

        // Se a ação não estiver no mapa (ex: 'launch_single'), não faz nada
        if (points === 0) {
            console.warn(`Ação '${action}' não configurada para dar pontos.`);
            return;
        }

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

        // feedback pro jogador (função addLog não existe, usando console.log)
        console.log(`Jogador aplicou ${points} pts em ${artistEntry.name} (ação ${action})`);
    }
    // ----------------- FIM DO CÓDIGO RPG -----------------
    

    // ----------------- NOVAS FUNÇÕES DO ESTÚDIO -----------------
    
    /**
     * Popula o dropdown <select> no formulário do estúdio com os artistas do db.
     */
    function populateArtistSelector() {
        const selectEl = document.getElementById('studioArtistSelect');
        if (!selectEl) return;

        // Limpa opções antigas (exceto a primeira "Selecione...")
        selectEl.innerHTML = '<option value="" disabled selected>Selecione seu artista...</option>';
        
        // Adiciona cada artista do banco de dados
        db.artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist.id; // Salva o Record ID do Airtable
            option.textContent = artist.name;
            selectEl.appendChild(option);
        });
    }

    /**
     * Função genérica para criar um novo registro em qualquer tabela do Airtable.
     * @param {string} tableName - O nome da tabela (ex: "Músicas", "Singles e EPs")
     * @param {object} fields - O objeto 'fields' para enviar.
     */
    async function createAirtableRecord(tableName, fields) {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro do Airtable: ${errorData.error.message}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`Falha ao criar registro na tabela ${tableName}:`, error);
            return null;
        }
    }

    /**
     * Processa o envio do formulário de novo single.
     */
    async function handleSingleSubmit(event) {
        event.preventDefault(); // Impede o recarregamento da página
        
        const submitButton = document.getElementById('submitNewSingle');
        submitButton.disabled = true;
        submitButton.textContent = 'Lançando...';

        try {
            // --- 1. Coletar dados do formulário ---
            const artistId = document.getElementById('studioArtistSelect').value;
            const singleTitle = document.getElementById('singleTitle').value;
            const singleCoverUrl = document.getElementById('singleCoverUrl').value;
            const trackName = document.getElementById('trackName').value;
            const trackDurationStr = document.getElementById('trackDuration').value;

            // --- 2. Validar e formatar dados ---
            if (!artistId || !singleTitle || !singleCoverUrl || !trackName || !trackDurationStr) {
                throw new Error("Por favor, preencha todos os campos.");
            }

            // Converter duração "MM:SS" para segundos
            const parts = trackDurationStr.split(':');
            const durationInSeconds = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
            if (isNaN(durationInSeconds)) {
                throw new Error("Formato de duração inválido. Use MM:SS");
            }

            // --- 3. Criar o registro da Música ---
            const musicFields = {
                "Nome da Faixa": trackName,
                "Duração": durationInSeconds,
                "Nº da Faixa": 1,
                "Artista": [artistId] // Link para o artista
            };
            
            console.log("Criando música...", musicFields);
            const newSong = await createAirtableRecord('Músicas', musicFields);
            if (!newSong || !newSong.id) {
                throw new Error("Falha ao criar o registro da música no Airtable.");
            }
            const newSongId = newSong.id;
            console.log("Música criada:", newSongId);

            // --- 4. Criar o registro do Single/EP, lincando a música ---
            const singleFields = {
                "Nome do Single/EP": singleTitle,
                "Capa": [{ "url": singleCoverUrl }], // Formato de anexo do Airtable
                "Músicas": [newSongId], // Link para a música
                "Artista": [artistId], // Link para o artista
                "Data de Lançamento": new Date().toISOString().split('T')[0] // Data de hoje
            };

            console.log("Criando single...", singleFields);
            const newSingle = await createAirtableRecord('Singles e EPs', singleFields);
            if (!newSingle || !newSingle.id) {
                // Idealmente, deveríamos deletar a música órfã, mas vamos simplificar por enquanto
                throw new Error("Falha ao criar o registro do single no Airtable.");
            }
            console.log("Single criado:", newSingle.id);

            // --- 5. Sucesso ---
            alert("Single lançado com sucesso! A página será recarregada para atualizar os dados.");
            window.location.reload(); // Recarrega a página para ver as mudanças

        } catch (error) {
            alert(`Erro ao lançar single: ${error.message}`);
            submitButton.disabled = false;
            submitButton.textContent = 'Lançar Single';
        }
    }
    // ----------------- FIM DAS NOVAS FUNÇÕES -----------------


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

    // --- INICIALIZAÇÃO ---
    initializeData();

    // ** MODIFICAÇÃO AQUI: Popula o dropdown do estúdio **
    populateArtistSelector();

    // ** MODIFICAÇÃO AQUI: Adiciona o listener para o novo formulário **
    if (newSingleForm) {
        newSingleForm.addEventListener('submit', handleSingleSubmit);
    }
    
    // Inicializa o RPG Chart
    renderRPGChart();
    setInterval(() => {
      // recalc e re-render a cada 30s (ou 60s)
      renderRPGChart();
    }, 30 * 1000);
    
    searchInput.addEventListener('input', handleSearch);
    
    // ** MODIFICAÇÃO AQUI: Garante que todos os botões de navegação funcionem **
    const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
    allNavs.forEach(nav => nav.addEventListener('click', switchTab));

    // Renderiza o conteúdo inicial
    renderArtistsGrid('homeGrid', [...db.artists].sort(() => 0.5 - Math.random()).slice(0, 10));
    renderArtistsGrid('artistsGrid', db.artists);
    renderChart('music');
    renderChart('album');
    setupCountdown('musicCountdownTimer', () => renderChart('music'));
    setupCountdown('albumCountdownTimer', () => renderChart('album'));

    // ** AJUSTE FINAL: Corrige a view inicial **
    // Assegura que a mainView e o topbar estejam visíveis no início
    document.getElementById('mainView').classList.remove('hidden');
    document.querySelector('.topbar').classList.remove('hidden');
});
