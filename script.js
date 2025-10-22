document.addEventListener('DOMContentLoaded', async () => {

    // --- VARIÁVEIS GLOBAIS ---
    // CORREÇÃO: Adicionado 'singles' ao DB
    let db = { artists: [], albums: [], singles: [], songs: [], players: [] };
    let currentPlayer = null;
    let albumTracklistSortable = null;
    let activeArtist = null; // Usado para páginas de discografia
    let currentFeatTarget = null; // Usado pelo modal de feat
    let viewHistory = []; // Para o botão "Voltar"

    // --- ELEMENTOS DO DOM (Definidos após o DOM carregar) ---
    let allViews, searchInput, studioView, loginPrompt, loggedInInfo, playerSelect,
        loginButton, logoutButton, studioLaunchWrapper, studioTabs, studioForms,
        newSingleForm, singleArtistSelect, newAlbumForm, albumArtistSelect,
        addTrackButton, albumTracklistEditor, featModal, featArtistSelect,
        featTypeSelect, confirmFeatBtn, cancelFeatBtn, participacoesList;

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
        newAlbumForm = document.getElementById('newAlbumForm');
        albumArtistSelect = document.getElementById('albumArtistSelect');
        addTrackButton = document.getElementById('addTrackButton');
        albumTracklistEditor = document.getElementById('albumTracklistEditor');
        featModal = document.getElementById('featModal');
        featArtistSelect = document.getElementById('featArtistSelect');
        featTypeSelect = document.getElementById('featTypeSelect');
        confirmFeatBtn = document.getElementById('confirmFeatBtn');
        cancelFeatBtn = document.getElementById('cancelFeatBtn');
        participacoesList = document.getElementById('participacoesList');

        // Check if essential elements exist
        if (!studioView || !loginPrompt || !playerSelect || !newSingleForm || !newAlbumForm || !featModal || !allViews || allViews.length === 0 || !participacoesList) {
            console.error("ERRO CRÍTICO: Elementos essenciais do HTML não foram encontrados! Verifique IDs: studioView, loginPrompt, playerSelect, newSingleForm, newAlbumForm, featModal, .page-view, participacoesList");
            document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Elementos essenciais da página não foram encontrados. Verifique o HTML e os IDs.</p></div>';
            return false; // Indicate failure
        }
        console.log("DOM elements initialized.");
        return true; // Indicate success
    }


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
                console.error("Falha ao carregar Airtable:", { artists: artistsResponse.status, albums: albumsResponse.status, musicas: musicasResponse.status, singles: singlesResponse.status, players: playersResponse.status });
                throw new Error('Falha ao carregar dados Airtable.');
            }
            const artistsData = await artistsResponse.json();
            const albumsData = await albumsResponse.json();
            const musicasData = await musicasResponse.json();
            const singlesData = await singlesResponse.json();
            const playersData = await playersResponse.json();

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

            const artistsMapById = new Map(); // Keep this map local to loadAllData
            const artistsList = (artistsData.records || []).map(record => {
                const artist = {
                    id: record.id, name: record.fields.Name || 'Nome Indisponível',
                    imageUrl: (record.fields['URL da Imagem'] && record.fields['URL da Imagem'][0]?.url) || 'https://i.imgur.com/AD3MbBi.png',
                    off: record.fields['Inspirações (Off)'] || [], RPGPoints: record.fields.RPGPoints || 0, LastActive: record.fields.LastActive || null
                };
                artistsMapById.set(artist.id, artist.name); // Populate local map
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
                    // Use the local map here
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

    /**
     * Coloca os dados carregados no banco de dados local 'db'
     * (VERSÃO CORRIGIDA - Separa Álbuns/Singles corretamente)
     */
    const initializeData = (data) => {
        try {
            // 1. Initialize Artists Map & db.artists LOCALLY
            const artistsMapById = new Map(); // Create map here
            db.artists = (data.allArtists || []).map(artist => {
                const artistEntry = {
                    ...artist,
                    img: artist.imageUrl || 'https://i.imgur.com/AD3MbBi.png',
                    albums: [], // Will be populated later
                    singles: []  // Will be populated later
                };
                artistsMapById.set(artist.id, artist.name); // Populate map here
                return artistEntry;
            });

            // 2. Initialize db.songs using the LOCAL artistsMapById
            db.songs = (data.musicas || []).map(song => ({
                ...song,
                streams: song.streams || Math.floor(Math.random() * 25000000) + 50000,
                cover: 'https://i.imgur.com/AD3MbBi.png', // Default cover initially
                // Use the LOCAL map to find the name
                artist: artistsMapById.get((song.artistIds || [])[0]) || 'Artista Desc.'
            }));

            // 3. Process Releases (Albums and Singles combined)
            db.albums = [];  // Reset/Initialize
            db.singles = []; // Reset/Initialize
            const allReleases = [...(data.albums || []), ...(data.singles || [])];
            const thirtyMinutesInSeconds = 30 * 60;

            allReleases.forEach(item => {
                // A. Update cover url in db.songs
                (item.tracks || []).forEach(trackInfo => {
                    const songInDb = db.songs.find(s => s.id === trackInfo.id);
                    if (songInDb) {
                        songInDb.cover = item.imageUrl;
                    } else {
                        console.warn(`Song ID ${trackInfo.id} listed in release "${item.title}" not found in db.songs.`);
                    }
                });

                // B. Link releases to artists AND populate db.albums/db.singles
                const artistEntry = db.artists.find(a => a.id === item.artistId);
                
                // Classifica como Álbum ou Single
                if ((item.totalDurationSeconds || 0) >= thirtyMinutesInSeconds) {
                    // É um Álbum
                    db.albums.push(item); // Adiciona ao db.albums global
                    if (artistEntry) {
                        if (!Array.isArray(artistEntry.albums)) artistEntry.albums = [];
                        artistEntry.albums.push(item);
                    }
                } else {
                    // É um Single/EP
                    db.singles.push(item); // Adiciona ao db.singles global
                    if (artistEntry) {
                        if (!Array.isArray(artistEntry.singles)) artistEntry.singles = [];
                        artistEntry.singles.push(item);
                    }
                }
                
                // Log de aviso se o artista do lançamento não for encontrado
                if (!artistEntry && item.artist !== "Artista Desconhecido") {
                     console.warn(`Artista "${item.artist}" (ID: ${item.artistId}) do lançamento "${item.title}" não encontrado em db.artists.`);
                }
            });

            // 4. Finalize db structure (players)
            db.players = data.players || [];

            // Verify data counts
            console.log(`DB Inicializado: Artists: ${db.artists.length}, Albums: ${db.albums.length}, Singles: ${db.singles.length}, Songs: ${db.songs.length}, Players: ${db.players.length}`);
            return true;
        } catch (error) {
            console.error("Erro CRÍTICO durante initializeData:", error);
            alert("Erro MUITO GRAVE ao inicializar dados. Verifique o console.");
            return false;
        }
    };


    /**
    * Recarrega todos os dados do Airtable e reinicia a UI
    */
    async function refreshAllData() {
        console.log("Atualizando todos os dados...");
        // Adicionar um 'loading' visual seria bom aqui
        const data = await loadAllData();
        if (data && data.allArtists) {
            if (initializeData(data)) {
                console.log("Dados atualizados e UI renderizada.");
                // Re-renderizar o que for visível
                renderRPGChart(); // Popula 'artistsGrid'
                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10)); // Popula 'homeGrid'
                renderChart('music');
                renderChart('album');
                renderParticipacoes();
                
                // Atualizar o estúdio se o usuário estiver logado
                if (currentPlayer) {
                    populateArtistSelector(currentPlayer.id);
                }
                return true;
            }
        }
        console.error("Falha ao atualizar os dados.");
        alert("Não foi possível atualizar os dados do servidor.");
        return false;
    }

    // --- 2. NAVEGAÇÃO E UI ---

    /**
     * Alterna a visualização principal (ex: da lista para o detalhe)
     */
    const switchView = (viewId, targetSectionId = null) => {
        console.log(`Switching view to: ${viewId}`);
        allViews.forEach(view => {
            view.classList.add('hidden');
        });

        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
            window.scrollTo(0, 0); // Rola para o topo

            // Se for a mainView, talvez queira ir para uma aba específica
            if (viewId === 'mainView' && targetSectionId) {
                switchTab(null, targetSectionId);
            }

            // Adiciona ao histórico APENAS se não for a mainView e não for a studioView
            if (viewId !== 'mainView' && viewId !== 'studioView') {
                viewHistory.push(viewId);
            } else if (viewId === 'mainView') {
                viewHistory = []; // Reseta o histórico ao voltar para a mainView
            }
            // Se for studioView, não mexe no histórico (é tratada como uma aba)

        } else {
            console.error(`View com ID "${viewId}" não encontrada.`);
        }
    };

    /**
     * Alterna entre as abas de conteúdo dentro da mainView
     */
    const switchTab = (event, forceTabId = null) => {
        let tabId;

        if (forceTabId) {
            tabId = forceTabId;
        } else if (event) {
            event.preventDefault();
            tabId = event.currentTarget.dataset.tab;
        } else {
            return; // Não faz nada se não tiver evento ou ID forçado
        }

        // Lógica especial para a aba 'studioSection'
        if (tabId === 'studioSection') {
            // Garante que a view do estúdio seja mostrada
            switchView('studioView');
            // Ativa os botões de navegação
            document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(button => {
                button.classList.remove('active');
            });
            document.querySelectorAll(`.nav-tab[data-tab="${tabId}"], .bottom-nav-item[data-tab="${tabId}"]`).forEach(button => {
                button.classList.add('active');
            });
            return; // Sai da função
        }
        
        // Garante que estamos na 'mainView' se não for o estúdio
        if (!document.getElementById('mainView').classList.contains('active')) {
             // Se não for 'studioSection' e não estivermos na mainView, vá para mainView
             if (viewHistory.length > 0 || !document.getElementById('mainView').classList.contains('active')) {
                switchView('mainView');
            }
        }

        // 1. Esconde todas as seções de conteúdo na mainView
        document.querySelectorAll('#mainView .content-section').forEach(section => {
            section.classList.remove('active');
        });

        // 2. Remove 'active' de todos os botões (top nav e bottom nav)
        document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(button => {
            button.classList.remove('active');
        });

        // 3. Mostra a seção de conteúdo correta
        const targetSection = document.getElementById(tabId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // 4. Adiciona 'active' aos botões correspondentes (top e bottom)
        document.querySelectorAll(`.nav-tab[data-tab="${tabId}"], .bottom-nav-item[data-tab="${tabId}"]`).forEach(button => {
            button.classList.add('active');
        });
    };

    /**
     * Manipula o clique no botão "Voltar"
     */
    const handleBack = () => {
        // Remove a view atual do histórico
        viewHistory.pop();
        
        // Pega a view anterior (ou mainView se o histórico estiver vazio)
        const previousViewId = viewHistory.pop() || 'mainView'; // .pop() de novo para pegar a anterior
        
        if (previousViewId === 'mainView') {
            switchView('mainView');
        } else {
            // Re-chama a função de detalhe para re-adicionar ao histórico
            // Solução mais simples: apenas vá para a view. A 'switchView' vai re-adicionar.
            // (Vamos testar se a view é re-adicionada)
            
            // Re-chamar a função original é complexo. Apenas mude a view.
            switchView(previousViewId);
        }
    };

    /**
     * Renderiza um grid de artistas em um container
     */
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

    /**
     * Formata a string de artistas com feats (ex: Artista 1 (feat. Artista 2))
     */
    function formatArtistString(artistIds, collabType) {
        if (!artistIds || artistIds.length === 0) return "Artista Desconhecido";
        
        const artistNames = artistIds.map(id => {
            const artist = db.artists.find(a => a.id === id);
            return artist ? artist.name : "Artista Desc.";
        });

        const mainArtist = artistNames[0];
        if (artistNames.length === 1) return mainArtist;

        const featArtists = artistNames.slice(1).join(', ');
        
        if (collabType === 'Dueto/Grupo') {
            return `${mainArtist} & ${featArtists}`;
        } else { // 'Feat.' ou padrão
            return `${mainArtist} (feat. ${featArtists})`;
        }
    }
    
    /**
     * Helper para buscar a URL da capa de um lançamento
     */
    function getCoverUrl(albumId) {
        if (!albumId) return 'https://i.imgur.com/AD3MbBi.png';
        const release = [...db.albums, ...db.singles].find(a => a.id === albumId);
        return (release ? release.imageUrl : 'https://i.imgur.com/AD3MbBi.png');
    }

    /**
     * Renderiza os charts de Músicas ou Álbuns
     */
    const renderChart = (type) => {
        let containerId, dataList;

        if (type === 'music') {
            containerId = 'musicChartsList';
            // Usar db.songs, classificar por 'streams'
            dataList = [...db.songs].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50);
        } else { // album
            containerId = 'albumChartsList';
            // Usar db.albums (NÃO db.singles), classificar por 'metascore'
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
                // Renderização de Música
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
                // Renderização de Álbum
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

    /**
     * Abre a página de detalhes do artista
     */
    const openArtistDetail = (artistName) => {
        const artist = db.artists.find(a => a.name === artistName);
        if (!artist) {
            console.error(`Artista "${artistName}" não encontrado.`);
            return;
        }

        // Armazenar artista ativo para `openDiscographyDetail`
        activeArtist = artist;

        // Preencher cabeçalho
        document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`;
        document.getElementById('detailName').textContent = artist.name;

        // Preencher Populares (Top 5 músicas)
        const popularSongs = [...db.songs]
            .filter(s => s.artistIds && s.artistIds.includes(artist.id))
            .sort((a, b) => (b.streams || 0) - (a.streams || 0))
            .slice(0, 5);

        const popularContainer = document.getElementById('popularSongsList');
        if (popularSongs.length > 0) {
            popularContainer.innerHTML = popularSongs.map((song, index) => `
                <div class="chart-item popular-song" data-song-id="${song.id}">
                    <span class="chart-rank">${index + 1}</span>
                    <img src="${song.cover || getCoverUrl(song.albumId)}" alt="${song.title}" class="chart-item-img">
                    <div class="chart-item-info">
                        <span class="chart-item-title">${song.title}</span>
                        <span class="chart-item-artist">${(song.streams || 0).toLocaleString('pt-BR')} streams</span>
                    </div>
                </div>
            `).join('');
        } else {
            popularContainer.innerHTML = '<p class="empty-state-small">Nenhuma música popular.</p>';
        }


        // Preencher Álbuns (scroll horizontal)
        const albumsContainer = document.getElementById('albumsList');
        albumsContainer.innerHTML = (artist.albums || []).map(album => `
            <div class="scroll-item" data-album-id="${album.id}">
                <img src="${album.imageUrl}" alt="${album.title}">
                <p>${album.title}</p>
            </div>
        `).join('') || '<p class="empty-state-small">Nenhum álbum.</p>';

        // Preencher Singles (scroll horizontal)
        const singlesContainer = document.getElementById('singlesList');
        singlesContainer.innerHTML = (artist.singles || []).map(single => `
            <div class="scroll-item" data-album-id="${single.id}">
                <img src="${single.imageUrl}" alt="${single.title}">
                <p>${single.title}</p>
            </div>
        `).join('') || '<p class="empty-state-small">Nenhum single.</p>';

        // Preencher Recomendados (outros artistas)
        const recommended = [...db.artists]
            .filter(a => a.id !== artist.id)
            .sort(() => 0.5 - Math.random()) // Aleatório
            .slice(0, 5);
        renderArtistsGrid('recommendedGrid', recommended);

        // Mudar a view
        switchView('artistDetail');
    };

    /**
     * Abre a página de detalhes do álbum
     */
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

        // Preencher Tracklist
        const tracklistContainer = document.getElementById('albumTracklist');
        tracklistContainer.innerHTML = (album.tracks || []).map(song => {
            const artistName = formatArtistString(song.artistIds, song.collabType);
            return `
                <div class="chart-item" data-song-id="${song.id}">
                    <span class="chart-rank">${song.trackNumber}</span>
                    <div class="chart-item-info">
                        <span class="chart-item-title">${song.title}</span>
                        <span class="chart-item-artist">${artistName}</span>
                    </div>
                    <span class="chart-item-duration">${song.duration}</span>
                </div>
            `;
        }).join('');

        switchView('albumDetail');
    };

    /**
     * Abre a página de discografia completa (Álbuns ou Singles)
     */
    const openDiscographyDetail = (type) => {
        if (!activeArtist) {
            console.error("Nenhum artista ativo para mostrar discografia.");
            handleBack(); // Volta
            return;
        }

        const data = (type === 'albums') ? activeArtist.albums : activeArtist.singles;
        const title = (type === 'albums') ? `Álbuns de ${activeArtist.name}` : `Singles & EPs de ${activeArtist.name}`;

        document.getElementById('discographyTypeTitle').textContent = title;
        const grid = document.getElementById('discographyGrid');
        
        grid.innerHTML = (data || []).map(item => `
            <div class="scroll-item" data-album-id="${item.id}">
                <img src="${item.imageUrl}" alt="${item.title}">
                <p>${item.title}</p>
                <span>${new Date(item.releaseDate).getFullYear()}</span>
            </div>
        `).join('') || '<p class="empty-state">Nenhum lançamento encontrado.</p>';

        switchView('discographyDetail');
    };
    
    /**
     * Filtra e exibe resultados da busca
     */
    const handleSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            // Se a busca estiver vazia, volta para a aba anterior (ou home)
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

        // Muda para a aba de busca
        switchTab(null, 'searchSection');
    };

    /**
     * Configura o timer de contagem regressiva
     */
    const setupCountdown = (timerId, callback) => {
        const timerElement = document.getElementById(timerId);
        if (!timerElement) return;

        const calculateTargetDate = () => {
            const now = new Date();
            const target = new Date(now);
            
            // Próxima Segunda-Feira, 00:00
            let daysToMonday = (1 + 7 - now.getDay()) % 7;
            if (daysToMonday === 0 && now.getHours() >= 0) {
                 // Se hoje é segunda, pula para a próxima
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
                // Recalcula o próximo alvo
                targetDate = calculateTargetDate();
                // Roda o callback de atualização
                if (callback) callback();
                // Continua o timer
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const f = (n) => (n < 10 ? '0' + n : n);
            timerElement.textContent = `${f(days)}d ${f(hours)}h ${f(minutes)}m ${f(seconds)}s`;
        };
        
        updateTimer(); // Run once
        setInterval(updateTimer, 1000); // Update every second
    };

    // --- 3. SISTEMA DE RPG (BRIGA DE CHARTS - APENAS VISUALIZAÇÃO) ---
    const CHART_TOP_N = 20;
    const STREAMS_PER_POINT = 10000;
    
    /**
     * Calcula streams simulados baseado em pontos e atividade
     */
    const calculateSimulatedStreams = (points, lastActiveISO) => {
        if (!lastActiveISO) return 0; // Se nunca esteve ativo, não tem streams
        const now = new Date();
        const lastActive = new Date(lastActiveISO);
        const diffHours = Math.abs(now - lastActive) / 3600000;
        
        // Fórmula: Cada ponto gera STREAMS_PER_POINT por dia.
        const streamsPerDay = (points || 0) * STREAMS_PER_POINT;
        const streamsPerHour = streamsPerDay / 24;
        return Math.floor(streamsPerHour * diffHours);
    };
    
    /**
     * Computa os dados do chart de RPG
     */
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
        }).sort((a, b) => b.streams - a.streams) // Classifica por streams
          .slice(0, CHART_TOP_N); // Pega o Top N
    };

    /**
     * Renderiza o chart de RPG (que vai na aba 'Artistas' -> 'artistsGrid')
     */
    function renderRPGChart() {
        const chartData = computeChartData(db.artists);
        const container = document.getElementById('artistsGrid'); // Popula o 'artistsGrid'
        
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

    // --- 4. SISTEMA DO ESTÚDIO (LOGIN E FORMULÁRIOS COM FEATS) ---
    
    /**
     * Popula os <select> de artista do jogador logado
     */
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

    /**
     * Loga o jogador no estúdio
     */
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

    /**
     * Desloga o jogador do estúdio
     */
    function logoutPlayer() {
        currentPlayer = null;
        document.getElementById('playerName').textContent = '';
        loginPrompt.classList.remove('hidden');
        loggedInInfo.classList.add('hidden');
        studioLaunchWrapper.classList.add('hidden');
    }
    
    /**
     * Popula o <select> de artistas no modal de feat
     */
    function populateFeatModalArtistSelect() {
        // Popula com TODOS os artistas, exceto o artista principal selecionado
        let currentMainArtistId = null;
        
        // Verifica qual formulário está ativo
        if (document.getElementById('newSingleForm').classList.contains('active')) {
            currentMainArtistId = singleArtistSelect.value;
        } else {
            currentMainArtistId = albumArtistSelect.value;
        }

        featArtistSelect.innerHTML = db.artists
            .filter(a => a.id !== currentMainArtistId) // Filtra o artista principal
            .sort((a,b) => a.name.localeCompare(b.name)) // Ordena por nome
            .map(a => `<option value="${a.id}">${a.name}</option>`)
            .join('');
    }

    /**
     * Abre o modal de feat
     */
    function openFeatModal(buttonElement) {
        // `buttonElement` é o botão "+ Adicionar Feat"
        const targetType = buttonElement.dataset.target;
        
        if (targetType === 'single') {
            currentFeatTarget = document.getElementById('singleFeatList');
        } else {
            // targetType é o ID do input da faixa (ex: 'track_uuid_123')
            currentFeatTarget = document.getElementById(targetType);
        }

        if (!currentFeatTarget) {
            console.error("Não foi possível encontrar o alvo do feat.");
            return;
        }
        
        populateFeatModalArtistSelect();
        featModal.classList.remove('hidden');
    }

    /**
     * Fecha o modal de feat
     */
    function closeFeatModal() {
        featModal.classList.add('hidden');
        currentFeatTarget = null;
    }

    /**
     * Confirma a adição do feat e cria o 'tag'
     */
    function confirmFeat() {
        const artistId = featArtistSelect.value;
        const artistName = featArtistSelect.options[featArtistSelect.selectedIndex].text;
        const featType = featTypeSelect.value; // "Feat." ou "Dueto/Grupo"

        if (!artistId || !currentFeatTarget) return;

        const featTag = document.createElement('span');
        featTag.className = 'feat-tag';
        featTag.textContent = `${featType} ${artistName}`;
        featTag.dataset.artistId = artistId;
        featTag.dataset.featType = featType;
        featTag.addEventListener('click', () => featTag.remove()); // Clica para remover

        if (currentFeatTarget.id === 'singleFeatList') {
            // É o formulário de single
            currentFeatTarget.appendChild(featTag);
        } else {
            // É um input de faixa de álbum, anexa ao lado
            currentFeatTarget.parentElement.querySelector('.feat-list-album').appendChild(featTag);
        }

        closeFeatModal();
    }
    
    /**
     * Inicializa todos os listeners do Estúdio
     */
    function initializeStudio() {
        // Popula o select de jogadores
        if (!playerSelect) return;
        playerSelect.innerHTML = '<option value="">Selecione...</option>' + 
            db.players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        // Listeners do Studio
        loginButton.addEventListener('click', () => loginPlayer(playerSelect.value));
        logoutButton.addEventListener('click', logoutPlayer);
        
        // Listeners das Abas do Studio
        studioTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                studioTabs.forEach(t => t.classList.remove('active'));
                studioForms.forEach(f => f.classList.remove('active'));
                
                e.currentTarget.classList.add('active');
                const formId = e.currentTarget.dataset.form;
                document.getElementById(formId === 'single' ? 'newSingleForm' : 'newAlbumForm').classList.add('active');
            });
        });
        
        // Listeners do Modal
        confirmFeatBtn.addEventListener('click', confirmFeat);
        cancelFeatBtn.addEventListener('click', closeFeatModal);

        // Listener para *abrir* o modal (delegado, pois botões são criados dinamicamente)
        studioLaunchWrapper.addEventListener('click', (e) => {
            if (e.target.closest('.add-feat-btn')) { // Usar closest para pegar o ícone
                openFeatModal(e.target.closest('.add-feat-btn'));
            }
        });

        // Listener do formulário de álbum
        addTrackButton.addEventListener('click', addNewTrackInput);
        initAlbumForm();
    }
    
    /**
     * Helper para criar um único registro no Airtable
     */
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
                console.error(`Erro ao criar registro em ${tableName}:`, errorData);
                throw new Error(`Airtable error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Falha na requisição para createAirtableRecord:", error);
            return null;
        }
    }
    
    // Helper para converter "3:45" para 225 segundos
    function parseDurationToSeconds(durationStr) {
        const parts = durationStr.split(':');
        if (parts.length !== 2) return 0;
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        return (minutes * 60) + seconds;
    }
    
    /**
     * Manipula o envio do formulário de Single
     */
    async function handleSingleSubmit(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submitNewSingle');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const artistId = singleArtistSelect.value;
            const singleTitle = document.getElementById('singleTitle').value;
            const coverUrl = document.getElementById('singleCoverUrl').value;
            const trackName = document.getElementById('trackName').value;
            const trackDurationStr = document.getElementById('trackDuration').value;
            const trackDurationSec = parseDurationToSeconds(trackDurationStr);

            // 1. Criar o 'Single/EP'
            const singleRecord = await createAirtableRecord('Singles e EPs', {
                "Nome do Single/EP": singleTitle,
                "Artista": [artistId],
                "Capa": [{ "url": coverUrl }],
                "Data de Lançamento": new Date().toISOString().split('T')[0] // Hoje
            });

            if (!singleRecord || !singleRecord.id) {
                throw new Error("Falha ao criar o registro do Single.");
            }

            // 2. Coletar Feats
            const featTags = document.querySelectorAll('#singleFeatList .feat-tag');
            const featArtistIds = Array.from(featTags).map(tag => tag.dataset.artistId);
            const allArtistIds = [artistId, ...featArtistIds];
            // Pega o tipo de collab do *primeiro* feat, se houver
            const collabType = featTags.length > 0 ? featTags[0].dataset.featType : null;

            // 3. Criar a 'Música'
            await createAirtableRecord('Músicas', {
                "Nome da Faixa": trackName,
                "Artista": allArtistIds,
                "Duração": trackDurationSec,
                "Nº da Faixa": 1,
                "Singles e EPs": [singleRecord.id],
                "Tipo de Colaboração": collabType
            });

            alert("Single lançado com sucesso!");
            newSingleForm.reset();
            document.getElementById('singleFeatList').innerHTML = '';
            await refreshAllData(); // Atualiza o DB local

        } catch (error) {
            alert("Erro ao lançar o single. Verifique o console.");
            console.error("Erro em handleSingleSubmit:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lançar Single';
        }
    }
    
    /**
     * Inicializa o formulário de álbum (adiciona 1ª faixa e Sortable)
     */
    function initAlbumForm() {
        addNewTrackInput(); // Adiciona a primeira faixa
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
    
    /**
     * Adiciona um novo campo de faixa ao formulário de álbum
     */
    function addNewTrackInput() {
        const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const trackCount = albumTracklistEditor.children.length + 1;
        
        const newTrackEl = document.createElement('div');
        newTrackEl.className = 'album-track-input';
        newTrackEl.innerHTML = `
            <i class="fas fa-bars drag-handle"></i>
            <span class="track-number">${trackCount}.</span>
            <div class="track-inputs">
                <input type="text" class="track-name-input" placeholder="Nome da Faixa" required>
                <input type="text" class="track-duration-input" placeholder="Duração (MM:SS)" pattern="\\d{1,2}:\\d{2}" required>
                <div class="feat-list-album"></div>
            </div>
            <button type="button" class="small-btn add-feat-btn" data-target="${trackId}"><i class="fas fa-plus"></i> Feat</button>
            <button type="button" class="small-btn remove-track-btn"><i class="fas fa-times"></i></button>
            <div id="${trackId}" class="feat-target-hidden"></div> 
        `;
        
        newTrackEl.querySelector('.remove-track-btn').addEventListener('click', () => {
            newTrackEl.remove();
            updateTrackNumbers();
        });
        
        albumTracklistEditor.appendChild(newTrackEl);
    }

    /**
     * Atualiza os números das faixas (usado pelo Sortable)
     */
    function updateTrackNumbers() {
        const tracks = albumTracklistEditor.querySelectorAll('.album-track-input');
        tracks.forEach((track, index) => {
            track.querySelector('.track-number').textContent = `${index + 1}.`;
        });
    }

    /**
     * Helper para criar múltiplos registros no Airtable em lote
     */
    async function batchCreateAirtableRecords(tableName, records) {
        // Airtable API permite 10 registros por vez no endpoint de 'create'
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;
        const chunks = [];
        
        for (let i = 0; i < records.length; i += 10) {
            chunks.push(records.slice(i, i + 10));
        }

        const results = [];
        for (const chunk of chunks) {
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
                    console.error(`Erro ao criar lote em ${tableName}:`, errorData);
                    throw new Error(`Airtable batch error: ${response.status}`);
                }
                const data = await response.json();
                results.push(...data.records);
                
            } catch (error) {
                console.error("Falha na requisição para batchCreateAirtableRecords:", error);
                return null; // Falha no lote
            }
        }
        return results; // Sucesso
    }

    /**
     * Manipula o envio do formulário de Álbum/EP
     */
    async function handleAlbumSubmit(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submitNewAlbum');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        try {
            const artistId = albumArtistSelect.value;
            const albumTitle = document.getElementById('albumTitle').value;
            const coverUrl = document.getElementById('albumCoverUrl').value;
            
            // 1. Criar o 'Álbum' (ou 'Single/EP' dependendo da duração total)
            const trackElements = albumTracklistEditor.querySelectorAll('.album-track-input');
            let totalDurationSec = 0;
            
            const musicRecordsToCreate = [];
            
            trackElements.forEach((trackEl, index) => {
                const trackName = trackEl.querySelector('.track-name-input').value;
                const durationStr = trackEl.querySelector('.track-duration-input').value;
                const durationSec = parseDurationToSeconds(durationStr);
                totalDurationSec += durationSec;
                
                const featTags = trackEl.querySelectorAll('.feat-tag');
                const featArtistIds = Array.from(featTags).map(tag => tag.dataset.artistId);
                const allArtistIds = [artistId, ...featArtistIds];
                const collabType = featTags.length > 0 ? featTags[0].dataset.featType : null;

                musicRecordsToCreate.push({
                    "Nome da Faixa": trackName,
                    "Artista": allArtistIds,
                    "Duração": durationSec,
                    "Nº da Faixa": index + 1,
                    "Tipo de Colaboração": collabType
                    // O link do álbum/single será adicionado depois
                });
            });
            
            if (musicRecordsToCreate.length === 0) {
                throw new Error("O álbum precisa de pelo menos uma faixa.");
            }

            // Decidir se é Álbum ou Single/EP
            const isAlbum = totalDurationSec >= (30 * 60); // 30 minutos
            const tableName = isAlbum ? 'Álbuns' : 'Singles e EPs';
            const nameField = isAlbum ? 'Nome do Álbum' : 'Nome do Single/EP';
            const coverField = isAlbum ? 'Capa do Álbum' : 'Capa';

            // 2. Criar o registro do Álbum/Single
            const releaseRecord = await createAirtableRecord(tableName, {
                [nameField]: albumTitle,
                "Artista": [artistId],
                [coverField]: [{ "url": coverUrl }],
                "Data de Lançamento": new Date().toISOString().split('T')[0]
            });
            
            if (!releaseRecord || !releaseRecord.id) {
                throw new Error("Falha ao criar o registro do álbum/EP.");
            }
            
            // 3. Adicionar o link do álbum/single a CADA faixa
            const releaseLinkField = isAlbum ? 'Álbuns' : 'Singles e EPs';
            musicRecordsToCreate.forEach(record => {
                record[releaseLinkField] = [releaseRecord.id];
            });

            // 4. Criar todas as 'Músicas' em lote
            const createdSongs = await batchCreateAirtableRecords('Músicas', musicRecordsToCreate);
            
            if (!createdSongs || createdSongs.length !== musicRecordsToCreate.length) {
                // TODO: Adicionar lógica para deletar o álbum se as músicas falharem (rollback)
                throw new Error("Falha ao criar as faixas no Airtable.");
            }
            
            alert("Álbum/EP lançado com sucesso!");
            newAlbumForm.reset();
            albumTracklistEditor.innerHTML = '';
            initAlbumForm(); // Adiciona a primeira faixa de volta
            await refreshAllData(); // Atualiza o DB local

        } catch (error) {
            alert("Erro ao lançar o álbum. Verifique o console.");
            console.error("Erro em handleAlbumSubmit:", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Lançar Álbum / EP';
        }
    }
    
    /**
     * Renderiza a lista de músicas com participações
     */
    function renderParticipacoes() {
        if (!participacoesList) {
             console.error("Elemento 'participacoesList' não encontrado.");
             return;
        }
        
        // Encontra músicas com mais de 1 artista
        const featSongs = db.songs.filter(s => s.artistIds && s.artistIds.length > 1)
                                  .sort((a,b) => (b.streams || 0) - (a.streams || 0)); // Ordena por streams
        
        if (featSongs.length === 0) {
            participacoesList.innerHTML = '<p class="empty-state">Nenhuma música com participação encontrada.</p>';
            return;
        }
        
        participacoesList.innerHTML = featSongs.map(item => `
            <div class="chart-item" data-song-id="${item.id}">
                <img src="${item.cover || getCoverUrl(item.albumId)}" alt="${item.title}" class="chart-item-img">
                <div class="chart-item-info">
                    <span class="chart-item-title">${item.title}</span>
                    <span class="chart-item-artist">${formatArtistString(item.artistIds, item.collabType)}</span>
                </div>
                <span class="chart-item-duration">${item.duration}</span>
            </div>
        `).join('');
    }

    // --- 5. INICIALIZAÇÃO GERAL ---
    
    /**
     * Inicializa o listener de clique global para elementos dinâmicos
     */
    function initializeBodyClickListener() {
        document.body.addEventListener('click', (e) => {
            // Procura pelos elementos mais próximos que têm os data-attributes
            const artistCard = e.target.closest('.artist-card[data-artist-name]');
            const albumCard = e.target.closest('[data-album-id]'); // Pega .scroll-item, .chart-item, etc.
            const artistLink = e.target.closest('.artist-link[data-artist-name]'); // Link de artista na pág de álbum
            const discogLink = e.target.closest('.see-all-btn[data-type]'); // Link "Ver Todos"

            if (discogLink) {
                openDiscographyDetail(discogLink.dataset.type);
                return;
            }
            
            if (albumCard) {
                openAlbumDetail(albumCard.dataset.albumId);
                return;
            }
            
            // Checa artistCard PRIMEIRO
            if (artistCard) {
                openArtistDetail(artistCard.dataset.artistName);
                return;
            }
            
            // Checa artistLink DEPOIS (menos prioritário)
            if (artistLink && !artistCard) {
                 openArtistDetail(artistLink.dataset.artistName);
                return;
            }
        });
        
        // Listener da Barra de Busca
        searchInput.addEventListener('input', handleSearch);
        // Também trata o 'Enter' como busca, embora 'input' já cubra
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // --- Ponto de Partida ---
    async function main() {
        console.log("Iniciando Aplicação...");
        if (!initializeDOMElements()) return; // Para se o DOM não carregar
        
        // Mostra um 'loading' global (opcional, mas recomendado)
        document.body.classList.add('loading'); 

        const data = await loadAllData();

        if (data && data.allArtists) {
            if (!initializeData(data)) return; // Para se o processamento de dados falhar

            try {
                initializeStudio();

                if (newSingleForm) newSingleForm.addEventListener('submit', handleSingleSubmit);
                if (newAlbumForm) newAlbumForm.addEventListener('submit', handleAlbumSubmit);

                // Renderiza os componentes principais
                renderRPGChart(); // Popula 'artistsGrid' com o chart de RPG
                
                const allNavs = [...document.querySelectorAll('.nav-tab'), ...document.querySelectorAll('.bottom-nav-item')];
                allNavs.forEach(nav => {
                    nav.removeEventListener('click', switchTab);
                    nav.addEventListener('click', switchTab);
                });

                // Popula 'homeGrid' com artistas aleatórios
                renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10)); 
                
                // ** CORREÇÃO: Linha abaixo removida pois 'renderRPGChart()' já popula 'artistsGrid' **
                // renderArtistsGrid('artistsGrid', db.artists || []); 
                
                renderChart('music');
                renderChart('album');
                renderParticipacoes();
                setupCountdown('musicCountdownTimer', () => renderChart('music'));
                setupCountdown('albumCountdownTimer', () => renderChart('album'));
                initializeBodyClickListener();
                document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', handleBack));

                switchTab(null, 'homeSection'); // Mostra a aba inicial

                console.log("Aplicação Iniciada e Configurada.");

            } catch (uiError) {
                console.error("Erro fatal durante a inicialização da UI:", uiError);
                document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro de Interface</h1><p>Ocorreu um erro ao configurar a interface. Verifique o console.</p></div>';
            }

        } else {
            document.body.innerHTML = '<div style="color: white; padding: 20px; text-align: center;"><h1>Erro Crítico</h1><p>Não foi possível carregar os dados essenciais do Airtable. Verifique sua conexão, a API Key e se as tabelas não estão vazias.</p></div>';
            console.error("Initialization failed due to critical data loading error.");
        }
        
        // Remove o 'loading'
        document.body.classList.remove('loading');
    }

    main(); // Run the initialization sequence

});
