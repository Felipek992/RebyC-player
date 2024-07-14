document.addEventListener('DOMContentLoaded', function () {
    const loadPlaylistButton = document.getElementById('loadPlaylist');
    const iptvUrlInput = document.getElementById('iptvUrl');
    const channelList = document.getElementById('channelList');
    const videoContainer = document.getElementById('videoContainer');
    const videoPlayer = videojs('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const closePlayerButton = document.getElementById('closePlayer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loadFileButton = document.getElementById('loadFile');
    const iptvFileInput = document.getElementById('iptvFile');
    const channelSearch = document.getElementById('channelSearch');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    const clearPlaylistButton = document.getElementById('clearPlaylist');
    const addFavoriteButton = document.getElementById('addFavorite');
    const removeFavoriteButton = document.getElementById('removeFavorite');
    const toggleDarkModeButton = document.getElementById('toggleDarkMode');
    const toast = document.getElementById('toast');

    const FAVORITES_KEY = 'favorites';
    const LAST_PLAYLIST_KEY = 'lastPlaylist';
    const LAST_PLAYED_KEY = 'lastPlayed';
    let currentChannel = null;

    function showLoadingSpinner() {
        loadingSpinner.style.display = 'block';
    }

    function hideLoadingSpinner() {
        loadingSpinner.style.display = 'none';
    }

    function showPlayer() {
        videoContainer.classList.add('show');
    }

    function closePlayer() {
        videoContainer.classList.remove('show');
        videoPlayer.pause();
    }

    function saveToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function loadFromLocalStorage(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    function showToast(message) {
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 3000);
    }

    async function loadPlaylist(url) {
        try {
            showLoadingSpinner();
            let playlist;
            const cachedPlaylist = loadFromLocalStorage(url);
            if (cachedPlaylist) {
                playlist = cachedPlaylist;
            } else {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                const m3uContent = await response.text();
                playlist = parseM3U(m3uContent);
                saveToLocalStorage(url, playlist);
            }
            displayChannels(playlist);
            saveToLocalStorage(LAST_PLAYLIST_KEY, url);
            showToast('Playlist loaded successfully!');
        } catch (error) {
            showToast(`Failed to fetch playlist from the URL. Details: ${error.message}`);
        } finally {
            hideLoadingSpinner();
        }
    }

    function displayChannels(playlist) {
        channelList.innerHTML = '';
        playlist.forEach(channel => {
            const li = document.createElement('li');
            li.textContent = channel.name;
            li.addEventListener('click', () => {
                currentChannel = channel;
                videoSource.src = channel.url;
                videoPlayer.src({ type: 'application/x-mpegURL', src: channel.url });
                showPlayer();
                videoPlayer.play();
                saveToLocalStorage(LAST_PLAYED_KEY, channel);
                updateFavoriteButton();
            });
            channelList.appendChild(li);
        });
    }

    function loadFavorites() {
        const favorites = loadFromLocalStorage(FAVORITES_KEY) || [];
        favorites.forEach(channel => {
            const li = document.createElement('li');
            li.textContent = channel.name;
            li.addEventListener('click', () => {
                currentChannel = channel;
                videoSource.src = channel.url;
                videoPlayer.src({ type: 'application/x-mpegURL', src: channel.url });
                showPlayer();
                videoPlayer.play();
                saveToLocalStorage(LAST_PLAYED_KEY, channel);
                updateFavoriteButton();
            });
            channelList.appendChild(li);
        });
    }

    function addChannelToFavorites() {
        if (currentChannel) {
            const favorites = loadFromLocalStorage(FAVORITES_KEY) || [];
            if (!favorites.some(channel => channel.url === currentChannel.url)) {
                favorites.push(currentChannel);
                saveToLocalStorage(FAVORITES_KEY, favorites);
                showToast(`${currentChannel.name} added to favorites!`);
            } else {
                showToast(`${currentChannel.name} is already in favorites!`);
            }
            updateFavoriteButton();
        }
    }

    function removeChannelFromFavorites() {
        if (currentChannel) {
            let favorites = loadFromLocalStorage(FAVORITES_KEY) || [];
            favorites = favorites.filter(channel => channel.url !== currentChannel.url);
            saveToLocalStorage(FAVORITES_KEY, favorites);
            showToast(`${currentChannel.name} removed from favorites!`);
            updateFavoriteButton();
        }
    }

    function updateFavoriteButton() {
        const favorites = loadFromLocalStorage(FAVORITES_KEY) || [];
        if (currentChannel && favorites.some(channel => channel.url === currentChannel.url)) {
            addFavoriteButton.style.display = 'none';
            removeFavoriteButton.style.display = 'block';
        } else {
            addFavoriteButton.style.display = 'block';
            removeFavoriteButton.style.display = 'none';
        }
    }

    loadPlaylistButton.addEventListener('click', () => {
        const url = iptvUrlInput.value.trim();
        if (url) {
            loadPlaylist(url);
        } else {
            showToast('Please enter a valid IPTV URL');
        }
    });

    loadFileButton.addEventListener('click', () => {
        iptvFileInput.click();
    });

    iptvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const playlist = parseM3U(content);
                displayChannels(playlist);
                saveToLocalStorage(LAST_PLAYLIST_KEY, URL.createObjectURL(file));
                showToast('Playlist loaded from file successfully!');
            };
            reader.readAsText(file);
        }
    });

    clearPlaylistButton.addEventListener('click', () => {
        channelList.innerHTML = '';
        localStorage.removeItem(LAST_PLAYLIST_KEY);
        showToast('Playlist cleared!');
    });

    closePlayerButton.addEventListener('click', closePlayer);

    channelSearch.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const channels = Array.from(channelList.children);
        channels.forEach(channel => {
            if (channel.textContent.toLowerCase().includes(searchTerm)) {
                channel.style.display = '';
            } else {
                channel.style.display = 'none';
            }
        });
    });

    fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                showToast(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    addFavoriteButton.addEventListener('click', addChannelToFavorites);
    removeFavoriteButton.addEventListener('click', removeChannelFromFavorites);

    toggleDarkModeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        saveToLocalStorage('darkMode', document.body.classList.contains('dark-mode'));
    });

    document.addEventListener('keydown', (event) => {
        if (videoContainer.classList.contains('show')) {
            switch (event.key) {
                case 'ArrowLeft':
                    videoPlayer.currentTime(videoPlayer.currentTime() - 10);
                    break;
                case 'ArrowRight':
                    videoPlayer.currentTime(videoPlayer.currentTime() + 10);
                    break;
                case 'ArrowUp':
                    videoPlayer.volume(Math.min(videoPlayer.volume() + 0.1, 1));
                    break;
                case 'ArrowDown':
                    videoPlayer.volume(Math.max(videoPlayer.volume() - 0.1, 0));
                    break;
                case ' ':
                    togglePlayPause();
                    break;
                case 'Escape':
                    closePlayer();
                    break;
            }
        }
    });

    function parseM3U(data) {
        const lines = data.split('\n');
        const channels = [];
        let currentChannel = {};
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#EXTINF')) {
                const nameMatch = line.match(/,(.+)$/);
                if (nameMatch) {
                    currentChannel.name = nameMatch[1];
                }
            } else if (line && !line.startsWith('#')) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = {};
            }
        });
        return channels;
    }

    function togglePlayPause() {
        if (videoPlayer.paused()) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    }

    const lastPlaylist = loadFromLocalStorage(LAST_PLAYLIST_KEY);
    if (lastPlaylist) {
        loadPlaylist(lastPlaylist);
    }

    const lastPlayed = loadFromLocalStorage(LAST_PLAYED_KEY);
    if (lastPlayed) {
        currentChannel = lastPlayed;
        videoSource.src = currentChannel.url;
        videoPlayer.src({ type: 'application/x-mpegURL', src: currentChannel.url });
        showPlayer();
        videoPlayer.play();
        updateFavoriteButton();
    }

    const darkMode = loadFromLocalStorage('darkMode');
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }

    loadFavorites();
});
