// script.js
// ... (Gardez la fonction getWeatherDescription exactement comme précédemment) ...

function getWeatherDescription(code) {
    // Les codes sont basés sur la classification WMO (Organisation Météorologique Mondiale)
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


async function fetchWeather(lat, lon) {
    // 1. URL de l'API Open-Meteo (maintenant avec les prévisions quotidiennes 'daily')
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`; // 'forecast_days=4' car le premier jour est aujourd'hui
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erreur de l\'API météo');
        }
        const data = await response.json();

        // --- Météo Actuelle ---
        document.getElementById('location').textContent = `Localisation : ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
        document.getElementById('temperature').textContent = `${Math.round(data.current.temperature_2m)}°C`;
        document.getElementById('description').textContent = getWeatherDescription(data.current.weather_code);
        
        // --- Prévisions Journalières ---
        const forecastContainer = document.getElementById('forecast');
        forecastContainer.innerHTML = ''; // Vider le contenu précédent

        // On boucle à partir de l'index 1 (car l'index 0 est aujourd'hui, déjà affiché en actuel)
        for (let i = 1; i < data.daily.time.length; i++) {
            const dateStr = data.daily.time[i]; // ex: "2025-11-27"
            const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
            const minTemp = Math.round(data.daily.temperature_2m_min[i]);
            const weatherCode = data.daily.weather_code[i];

            // Formater la date (ex: Jeudi)
            const date = new Date(dateStr);
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });

            // Création de l'élément HTML pour le jour
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-forecast';
            dayDiv.innerHTML = `
                <h3>${dayName}</h3>
                <p class="temp-range">${minTemp}°C / ${maxTemp}°C</p>
                <p class="desc">${getWeatherDescription(weatherCode)}</p>
            `;
            forecastContainer.appendChild(dayDiv);
        }

        // --- Mise à jour de l'heure ---
        const now = new Date();
        document.getElementById('last-update-time').textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    } catch (error) {
        console.error("Erreur lors du chargement de la météo :", error);
        document.getElementById('description').textContent = "Erreur de chargement. Veuillez vérifier la connexion.";
    }
}

// ... (Gardez la fonction getLocation et les appels initiaux/intervalle exactement comme précédemment) ...

function getLocation() {
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
                document.getElementById('location').textContent = "Position GPS trouvée...";
                fetchWeather(lat, lon);
            },
            (error) => {
                let errorMessage = "Erreur GPS : ";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Accès refusé. Autorisez le partage de position.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Position non disponible.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Délai expiré.";
                        break;
                    default:
                        errorMessage += "Erreur inconnue.";
                }
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

// Lancement
getLocation(); 
setInterval(getLocation, 600000); // Rafraîchissement toutes les 10 minutes
