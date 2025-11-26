// ======================================================================
// SCRIPT.JS - Tableau de Bord Tesla (Final, MÉTÉO, NEWS, THÈME)
// ======================================================================

// AUCUNE CLÉ API NÉCESSAIRE POUR LES ACTUALITÉS (Utilisation de Flux RSS public)
// ======================================================================


// ----------------------------------------------------------------------
// Fonctions Utilitaires et Météo
// ----------------------------------------------------------------------

// Traduction du code météo (WMO) en description/emoji en français
function getWeatherDescription(code) {
    switch (code) {
        case 0: return '☀️ Ciel clair';
        case 1:
        case 2: return '🌤️ Partiellement nuageux';
        case 3: return '☁️ Très nuageux';
        case 45: 
        case 48: return '🌫️ Brouillard';
        case 51:
        case 53:
        case 55: return '🌧️ Bruine';
        case 61:
        case 63:
        case 65: return '🌧️ Pluie';
        case 71:
        case 73:
        case 75: return '❄️ Neige';
        case 80:
        case 81:
        case 82: return '🌧️ Averses';
        case 95:
        case 96:
        case 99: return '⛈️ Orage';
        default: return 'Météo inconnue';
    }
}

// 1. GÉOCODAGE INVERSE (Nominatim seulement)
async function fetchCityName(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) { throw new Error('Erreur de l\'API Nominatim'); }
        const data = await response.json();

        if (data.address.city) return data.address.city;
        if (data.address.town) return data.address.town;
        if (data.address.village) return data.address.village;
        if (data.address.country) return data.address.country;

        return `Inconnu (${lat.toFixed(2)}, ${lon.toFixed(2)})`;

    } catch (error) {
        console.error("Erreur de géocodage inverse :", error);
        return `Erreur de Géocodage (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    }
}


// 2. Fonction de Récupération des Données Météo
async function fetchWeather(lat, lon) {
    const cityName = await fetchCityName(lat, lon);
    document.getElementById('location').textContent = `Localisation : ${cityName}`;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`; 

    try {
        const response = await fetch(weatherUrl);
        if (!response.ok) { throw new Error('Erreur de l\'API météo'); }
        const data = await response.json();

        document.getElementById('temperature').textContent = `${Math.round(data.current.temperature_2m)}°C`;
        document.getElementById('description').textContent = getWeatherDescription(data.current.weather_code);
        
        const forecastContainer = document.getElementById('forecast');
        forecastContainer.innerHTML = ''; 

        for (let i = 1; i < data.daily.time.length; i++) {
            const dateStr = data.daily.time[i]; 
            const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
            const minTemp = Math.round(data.daily.temperature_2m_min[i]);
            const weatherCode = data.daily.weather_code[i];

            const date = new Date(dateStr);
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });

            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-forecast';
            dayDiv.innerHTML = `
                <h3>${dayName}</h3>
                <p class="temp-range">${minTemp}°C / ${maxTemp}°C</p>
                <p class="desc">${getWeatherDescription(weatherCode)}</p>
            `;
            forecastContainer.appendChild(dayDiv);
        }

        const now = new Date();
        document.getElementById('last-update-time').textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    } catch (error) {
        console.error("Erreur lors du chargement de la météo :", error);
        document.getElementById('description').textContent = "Erreur de chargement des données météo.";
    }
}


// ----------------------------------------------------------------------
// 3. ACTUALITÉS TESLA (Utilisation de RSS2JSON - Stable)
// ----------------------------------------------------------------------

async function fetchTeslaNews() {
    const newsContainer = document.getElementById('tesla-news');
    newsContainer.innerHTML = '<p class="loading-message">Chargement des actualités via RSS...</p>';

    // Flux RSS de Google News filtré sur 'Tesla' et la langue française
    const rssFeedUrl = encodeURIComponent('https://news.google.com/rss/search?q=Tesla&hl=fr&gl=FR&ceid=FR:fr');
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${rssFeedUrl}`; 

    try {
        const response = await fetch(url);
        
        if (!response.ok) { throw new Error(`Erreur API RSS2JSON (${response.status})`); }
        
        const data = await response.json();

        newsContainer.innerHTML = ''; 

        if (data.status === 'ok' && data.items.length > 0) {
            data.items.slice(0, 3).forEach(article => { 
                
                const publishedDate = new Date(article.pubDate);
                const formattedDate = publishedDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                }); 

                const articleDiv = document.createElement('a');
                articleDiv.className = 'news-item';
                articleDiv.href = article.link; 
                articleDiv.target = '_blank'; 
                
                articleDiv.innerHTML = `
                    <h3>${article.title}</h3>
                    <p class="news-source">${article.author || 'Google News'} - ${formattedDate}</p>
                `;
                newsContainer.appendChild(articleDiv);
            });
        } else {
            newsContainer.innerHTML = '<p class="loading-message">Aucune actualité Tesla récente trouvée via le flux RSS.</p>';
        }

    } catch (error) {
        console.error("Erreur lors du chargement des actualités Tesla :", error);
        newsContainer.innerHTML = `<p class="loading-message" style="color:red;">Erreur de connexion aux actualités (RSS).</p>`;
    }
}


// ----------------------------------------------------------------------
// 4. GÉOLOCALISATION GPS
// ----------------------------------------------------------------------

function getLocation() {
    document.getElementById('location').textContent = "Recherche de la position GPS...";
    
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeather(lat, lon); 
            },
            (error) => {
                let errorMessage = "Erreur GPS : Accès refusé ou position non trouvée.";
                document.getElementById('location').textContent = errorMessage;
                document.getElementById('temperature').textContent = "--°C";
                document.getElementById('description').textContent = "Météo indisponible.";
            },
            options
        );
    } else {
        document.getElementById('location').textContent = "Erreur : La géolocalisation n'est pas supportée.";
    }
}


// ----------------------------------------------------------------------
// 5. GESTION DU THÈME (Dark/Light Mode)
// ----------------------------------------------------------------------

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    }
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('dark');
    }
}


// ----------------------------------------------------------------------
// DÉMARRAGE ET RAFRAÎCHISSEMENT
// ----------------------------------------------------------------------

function initializeDashboard() {
    loadThemePreference();
    getLocation(); 
    fetchTeslaNews();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();

    // Gestion du bouton Rafraîchir
    const reloadButton = document.getElementById('reload-button');
    if (reloadButton) {
        reloadButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            getLocation(); 
            fetchTeslaNews(); 
        });
    }
    
    // Gestion des boutons de thème
    const themeDarkButton = document.getElementById('theme-dark');
    const themeLightButton = document.getElementById('theme-light');
    
    if (themeDarkButton) {
        themeDarkButton.addEventListener('click', (e) => {
            e.preventDefault();
            applyTheme('dark');
        });
    }

    if (themeLightButton) {
        themeLightButton.addEventListener('click', (e) => {
            e.preventDefault();
            applyTheme('light');
        });
    }
    
    // Rafraîchissement automatique
    setInterval(getLocation, 600000); 
    setInterval(fetchTeslaNews, 1800000); 
});
