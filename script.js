document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const iptvUrlInput = document.getElementById('iptvUrl');
    const loadPlaylistButton = document.getElementById('loadPlaylist');
    const iptvFileInput = document.getElementById('iptvFile');
    const loadFilePlaylistButton = document.getElementById('loadFilePlaylist');
    const channelListElement = document.getElementById('channelList');
    const videoContainer = document.getElementById('videoContainer');
    const videoPlayerElement = document.getElementById('videoPlayer');
    const closePlayerButton = document.getElementById('closePlayer');
    const searchInput = document.getElementById('searchInput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const showFavoritesButton = document.getElementById('showFavorites');
    const showHistoryButton = document.getElementById('showHistory');

    const player = videojs(videoPlayerElement);

    // Eventos
    loadPlaylistButton.addEventListener('click', handleUrlSubmit);
    loadFilePlaylistButton.addEventListener('click', handleFileSubmit);
    closePlayerButton.addEventListener('click', closePlayer);
    searchInput.addEventListener('input', filterChannels);
    showFavoritesButton.addEventListener('click', showFavorites);
    showHistoryButton.addEventListener('click', showHistory);

    // Função para carregar a playlist da URL
    function handleUrlSubmit() {
        const url = iptvUrlInput.value.trim();
        if (url) {
            localStorage.setItem('lastPlaylistUrl', url);
            loadingSpinner.style.display = 'block';

            fetch('loadPlaylist.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ 'url': url })
            })
            .then(response => response.json())
            .then(data => {
                loadingSpinner.style.display = 'none';
                if (data.success) {
                    localStorage.setItem('cachedPlaylist', data.content);
                    const channels = parseM3U(data.content);
                    displayChannels(channels);
                } else {
                    console.error('Error:', data.error);
                    alert(data.message + (data.error ? ' Details: ' + data.error : ''));
                }
            })
            .catch(error => {
                loadingSpinner.style.display = 'none';
                console.error('Error fetching playlist:', error);
                alert('Erro ao carregar a playlist. Verifique a URL e tente novamente.');
            });
        }
    }

    // Função para carregar a playlist do arquivo
    function handleFileSubmit() {
        const file = iptvFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                localStorage.setItem('cachedPlaylist', content);
                const channels = parseM3U(content);
                displayChannels(channels);
            };
            reader.readAsText(file);
        }
    }

    // Função para analisar o arquivo M3U
    function parseM3U(content) {
        const lines = content.split('\n').map(line => line.trim());
        const channels = [];
        let currentChannel = {};

        lines.forEach(line => {
            if (line.startsWith('#EXTINF')) {
                const parts = line.split(',');
                currentChannel.name = parts[1];
            } else if (line.startsWith('http')) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = {};
            }
        });

        return channels;
    }

    // Função para exibir os canais com lazy loading
    function displayChannels(channels) {
        channelListElement.innerHTML = '';

        const channelBatchSize = 50; // Ajustar o tamanho do lote conforme necessário
        let currentBatch = 0;

        function loadNextBatch() {
            const start = currentBatch * channelBatchSize;
            const end = start + channelBatchSize;
            const batch = channels.slice(start, end);

            batch.forEach(channel => {
                const li = document.createElement('li');
                li.textContent = channel.name;
                li.dataset.url = channel.url;
                li.addEventListener('click', () => playChannel(channel.url, channel.name));

                const favButton = document.createElement('button');
                favButton.className = 'favButton';
                favButton.innerHTML = '★';
                favButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(channel);
                });

                li.appendChild(favButton);
                channelListElement.appendChild(li);
            });

            currentBatch++;
        }

        loadNextBatch();
        channelListElement.addEventListener('scroll', () => {
            if (channelListElement.scrollTop + channelListElement.clientHeight >= channelListElement.scrollHeight) {
                loadNextBatch();
            }
        });
    }

    // Função para tocar um canal
    function playChannel(url, name) {
        player.src({ type: 'application/x-mpegURL', src: url });
        player.play();
        videoContainer.classList.add('show');

        // Atualizar histórico
        let history = JSON.parse(localStorage.getItem('channelHistory')) || [];
        history.push({ name, url, timestamp: new Date() });
        localStorage.setItem('channelHistory', JSON.stringify(history));
    }

    // Função para fechar o player
    function closePlayer() {
        player.pause();
        videoContainer.classList.remove('show');
    }

    // Função para filtrar canais
    function filterChannels() {
        const query = searchInput.value.toLowerCase();
        const items = channelListElement.getElementsByTagName('li');
        Array.from(items).forEach(item => {
            const channelName = item.firstChild.textContent.toLowerCase();
            if (channelName.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Função para alternar favoritos
    function toggleFavorite(channel) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const exists = favorites.some(fav => fav.url === channel.url);

        if (exists) {
            favorites = favorites.filter(fav => fav.url !== channel.url);
        } else {
            favorites.push(channel);
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    // Função para exibir favoritos
    function showFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        displayChannels(favorites);
    }

    // Função para exibir histórico
    function showHistory() {
        const history = JSON.parse(localStorage.getItem('channelHistory')) || [];
        displayChannels(history.map(item => ({ name: item.name, url: item.url })));
    }

    // Carregar a última playlist ou cache
    document.addEventListener('DOMContentLoaded', () => {
        const lastPlaylistUrl = localStorage.getItem('lastPlaylistUrl');
        const cachedPlaylist = localStorage.getItem('cachedPlaylist');

        if (lastPlaylistUrl && cachedPlaylist) {
            iptvUrlInput.value = lastPlaylistUrl;
            const channels = parseM3U(cachedPlaylist);
            displayChannels(channels);
        }
    });
});
