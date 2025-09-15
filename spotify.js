// This class fetches the currently playing Spotify track from a server-side API endpoint.
class SpotifyNowPlaying {
    constructor() {
        this.apiEndpoint = '/api/spotify';
        this.trackInfoElement = document.getElementById('spotify-track-info');
        this.init();
    }

    async init() {
        this.getCurrentTrack();
        // Refresh every 30 seconds to get the latest track
        setInterval(() => this.getCurrentTrack(), 30000);
    }

    async getCurrentTrack() {
        try {
            const response = await fetch(this.apiEndpoint);
            if (!response.ok) {
                // Don't show an error, just gracefully stop.
                return;
            }

            const data = await response.json();
            if (data.isPlaying) {
                this.displayTrack(data);
            } else {
                this.showNotPlaying();
            }
        } catch (error) {
            // Log the error for debugging but don't show a broken state to the user.
            console.error('Error fetching Spotify track:', error);
        }
    }

    displayTrack(data) {
        const trackTitle = data.songUrl 
            ? `<a href="${data.songUrl}" target="_blank" rel="noopener noreferrer">${data.title}</a>`
            : data.title;

        const trackHtml = `
            <div class="track-display">
                <div class="album-art">
                    <img src="${data.albumImageUrl}" alt="${data.album}" />
                    <div class="play-indicator playing">▶️</div>
                </div>
                <div class="track-details">
                    <div class="track-name">${trackTitle}</div>
                    <div class="artist-name">${data.artist}</div>
                    <div class="album-name">${data.album}</div>
                </div>
            </div>
        `;
        this.trackInfoElement.innerHTML = trackHtml;
    }

    showNotPlaying() {
        this.trackInfoElement.innerHTML = `
            <div class="not-playing">
                <div class="spotify-icon">🎵</div>
                <div class="message">No track currently playing</div>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpotifyNowPlaying();
});