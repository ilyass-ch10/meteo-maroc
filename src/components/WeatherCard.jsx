import { useState, useEffect } from "react";
import { villes } from "../data/villes";

const API_KEY = "60bedd42da6e62dd5e959943ad369220";

export default function MeteoMaroc() {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [detailedWeather, setDetailedWeather] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [activeView, setActiveView] = useState("current");
  
  // Nouvelles fonctionnalités
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [theme, setTheme] = useState('auto');
  const [weatherStats, setWeatherStats] = useState({});
  const [weatherAdvice, setWeatherAdvice] = useState([]);

  const fetchWeather = async (city) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},MA&units=metric&appid=${API_KEY}&lang=fr`
      );
      
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      
      const data = await response.json();
      
      if (data.cod === 200) {
        const weather = {
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          feels_like: Math.round(data.main.feels_like),
          wind: data.wind.speed,
          pressure: data.main.pressure,
          visibility: data.visibility / 1000,
          sunrise: new Date(data.sys.sunrise * 1000),
          sunset: new Date(data.sys.sunset * 1000),
        };

        // Générer les statistiques et conseils
        generateWeatherStats(city, weather);
        generateWeatherAdvice(weather);

        return weather;
      }
      throw new Error(data.message);
    } catch (error) {
      console.error("Erreur météo pour", city, error);
      const mockWeather = getMockWeather(city);
      generateWeatherStats(city, mockWeather);
      generateWeatherAdvice(mockWeather);
      return mockWeather;
    }
  };

  // 1. Localisation Automatique
  const getUserLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
            );
            const data = await response.json();
            if (data.length > 0) {
              const cityName = data[0].name;
              setUserLocation(cityName);
              handleCityClick(cityName);
            }
          } catch (error) {
            console.error("Erreur géolocalisation:", error);
            alert("Impossible de déterminer votre position");
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
          alert("Veuillez autoriser la géolocalisation pour cette fonctionnalité");
          setLocationLoading(false);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      setLocationLoading(false);
    }
  };

  // 7. Statistiques Météo
  const generateWeatherStats = (city, weatherData) => {
    // Statistiques basées sur la ville et les données actuelles
    const cityStats = {
      "Casablanca": { heatRecord: "42°C", coldRecord: "-2°C", sunshine: "7h/jour", rainfall: "400mm/an" },
      "Marrakech": { heatRecord: "49°C", coldRecord: "-3°C", sunshine: "8.5h/jour", rainfall: "240mm/an" },
      "Rabat": { heatRecord: "40°C", coldRecord: "-1°C", sunshine: "7.5h/jour", rainfall: "550mm/an" },
      "Fès": { heatRecord: "45°C", coldRecord: "-4°C", sunshine: "8h/jour", rainfall: "500mm/an" },
      "Tanger": { heatRecord: "38°C", coldRecord: "0°C", sunshine: "7h/jour", rainfall: "800mm/an" },
      "Agadir": { heatRecord: "41°C", coldRecord: "2°C", sunshine: "8h/jour", rainfall: "250mm/an" },
    };

    const defaultStats = { heatRecord: "40°C", coldRecord: "0°C", sunshine: "7h/jour", rainfall: "400mm/an" };
    
    const stats = cityStats[city] || defaultStats;

    setWeatherStats({
      records: [
        { label: "Record chaleur", value: stats.heatRecord, icon: "🔥", current: weatherData.temperature },
        { label: "Record froid", value: stats.coldRecord, icon: "❄️", current: weatherData.temperature },
        { label: "Ensoleillement moyen", value: stats.sunshine, icon: "☀️" },
        { label: "Pluviométrie annuelle", value: stats.rainfall, icon: "💧" }
      ],
      current: [
        { label: "Température actuelle", value: `${weatherData.temperature}°C`, icon: "🌡️" },
        { label: "Ressenti", value: `${weatherData.feels_like}°C`, icon: "🤗" },
        { label: "Humidité", value: `${weatherData.humidity}%`, icon: "💦" },
        { label: "Vitesse vent", value: `${weatherData.wind} m/s`, icon: "💨" }
      ]
    });
  };

  // 8. Conseils Personnalisés
  const generateWeatherAdvice = (weatherData) => {
    const advice = [];
    
    if (weatherData.temperature > 30) {
      advice.push({
        icon: "💧",
        text: "Hydratez-vous régulièrement",
        type: "heat"
      });
      advice.push({
        icon: "☀️",
        text: "Évitez le soleil entre 12h et 16h",
        type: "heat"
      });
      advice.push({
        icon: "👒",
        text: "Portez un chapeau et des vêtements légers",
        type: "heat"
      });
    }
    
    if (weatherData.temperature < 10) {
      advice.push({
        icon: "🧥",
        text: "Habillez-vous chaudement en plusieurs couches",
        type: "cold"
      });
      advice.push({
        icon: "🍵",
        text: "Buvez des boissons chaudes",
        type: "cold"
      });
      advice.push({
        icon: "🏠",
        text: "Maintenez votre logement à 19°C",
        type: "cold"
      });
    }
    
    if (weatherData.description.includes('pluie') || weatherData.description.includes('pluvieux')) {
      advice.push({
        icon: "🌂",
        text: "Prenez un parapluie ou un imperméable",
        type: "rain"
      });
      advice.push({
        icon: "🚗",
        text: "Conduisez prudemment sur route mouillée",
        type: "rain"
      });
      advice.push({
        icon: "👟",
        text: "Chaussures imperméables recommandées",
        type: "rain"
      });
    }
    
    if (weatherData.wind > 8) {
      advice.push({
        icon: "💨",
        text: "Attention aux rafales de vent",
        type: "wind"
      });
      advice.push({
        icon: "🌳",
        text: "Évitez les zones boisées",
        type: "wind"
      });
    }

    if (weatherData.humidity > 70) {
      advice.push({
        icon: "🌫️",
        text: "Humidité élevée - aérez votre logement",
        type: "humidity"
      });
    }

    if (weatherData.visibility < 5) {
      advice.push({
        icon: "🚘",
        text: "Visibilité réduite - allumez vos feux",
        type: "visibility"
      });
    }

    // Conseils généraux basés sur l'heure
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) {
      advice.push({
        icon: "🌅",
        text: "Bon début de journée ! Vérifiez la météo pour planifier vos activités",
        type: "morning"
      });
    } else if (hour >= 18 && hour <= 22) {
      advice.push({
        icon: "🌇",
        text: "Bonne soirée ! Pensez à consulter les prévisions pour demain",
        type: "evening"
      });
    }

    setWeatherAdvice(advice);
  };

  // 9. Mode Sombre/Automatique
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    updateTheme();

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => {
      if (current === 'auto') return 'light';
      if (current === 'light') return 'dark';
      return 'auto';
    });
  };

  const getThemeIcon = () => {
    if (theme === 'auto') return '⚡';
    if (theme === 'light') return '☀️';
    return '🌙';
  };

  const getThemeText = () => {
    if (theme === 'auto') return 'Auto';
    if (theme === 'light') return 'Clair';
    return 'Sombre';
  };

  // Reste du code existant...
  const fetchForecast = async (city) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city},MA&units=metric&appid=${API_KEY}&lang=fr`
      );
      
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      
      const data = await response.json();
      
      if (data.cod === "200") {
        const dailyForecasts = {};
        
        data.list.forEach(item => {
          const date = new Date(item.dt * 1000);
          const dateKey = date.toLocaleDateString('fr-FR');
          
          if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = {
              date: date,
              temps: [],
              descriptions: [],
              icons: [],
              humidities: [],
              winds: [],
              pressures: []
            };
          }
          
          dailyForecasts[dateKey].temps.push(Math.round(item.main.temp));
          dailyForecasts[dateKey].descriptions.push(item.weather[0].description);
          dailyForecasts[dateKey].icons.push(item.weather[0].icon);
          dailyForecasts[dateKey].humidities.push(item.main.humidity);
          dailyForecasts[dateKey].winds.push(item.wind.speed);
          dailyForecasts[dateKey].pressures.push(item.main.pressure);
        });
        
        const forecasts = Object.values(dailyForecasts).map(day => {
          const avgTemp = Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length);
          const maxTemp = Math.max(...day.temps);
          const minTemp = Math.min(...day.temps);
          const mainDescription = day.descriptions[Math.floor(day.descriptions.length / 2)];
          const mainIcon = day.icons[Math.floor(day.icons.length / 2)];
          const avgHumidity = Math.round(day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length);
          const avgWind = (day.winds.reduce((a, b) => a + b, 0) / day.winds.length).toFixed(1);
          const avgPressure = Math.round(day.pressures.reduce((a, b) => a + b, 0) / day.pressures.length);
          
          return {
            date: day.date,
            temp: avgTemp,
            temp_min: minTemp,
            temp_max: maxTemp,
            description: mainDescription,
            icon: mainIcon,
            humidity: avgHumidity,
            wind: avgWind,
            pressure: avgPressure,
          };
        });
        
        const completeForecasts = [...forecasts];
        const startDate = new Date();
        
        while (completeForecasts.length < 15) {
          const nextDate = new Date(startDate);
          nextDate.setDate(startDate.getDate() + completeForecasts.length);
          
          const dateExists = completeForecasts.some(f => 
            f.date.toDateString() === nextDate.toDateString()
          );
          
          if (!dateExists) {
            completeForecasts.push(getMockForecastDay(nextDate));
          }
        }
        
        return completeForecasts.slice(0, 15);
      }
      throw new Error(data.message);
    } catch (error) {
      console.error("Erreur prévisions pour", city, error);
      return getMockForecast();
    }
  };

  const getMockWeather = (city) => ({
    temperature: Math.floor(Math.random() * 35) + 10,
    description: ["Ensoleillé", "Nuageux", "Pluvieux", "Partiellement nuageux"][Math.floor(Math.random() * 4)],
    icon: "01d",
    humidity: Math.floor(Math.random() * 50) + 30,
    feels_like: Math.floor(Math.random() * 35) + 10,
    wind: (Math.random() * 10).toFixed(1),
    pressure: Math.floor(Math.random() * 200) + 1000,
    visibility: (Math.random() * 10 + 5).toFixed(1),
    sunrise: new Date(),
    sunset: new Date(),
    isMock: true
  });

  const getMockForecastDay = (date) => ({
    date,
    temp: Math.floor(Math.random() * 35) + 10,
    temp_min: Math.floor(Math.random() * 25) + 5,
    temp_max: Math.floor(Math.random() * 40) + 15,
    description: ["Ensoleillé", "Nuageux", "Pluvieux", "Partiellement nuageux"][Math.floor(Math.random() * 4)],
    icon: ["01d", "02d", "03d", "04d", "09d", "10d", "11d", "13d"][Math.floor(Math.random() * 8)],
    humidity: Math.floor(Math.random() * 50) + 30,
    wind: (Math.random() * 10).toFixed(1),
    pressure: Math.floor(Math.random() * 200) + 1000,
    isMock: true
  });

  const getMockForecast = () => {
    const forecasts = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecasts.push(getMockForecastDay(date));
    }
    return forecasts;
  };

  const handleCityClick = async (city) => {
    setSelectedCity(city);
    setLoading(true);
    setActiveView("current");
    
    const [weather, forecast] = await Promise.all([
      fetchWeather(city),
      fetchForecast(city)
    ]);
    
    setDetailedWeather({ name: city, ...weather });
    setForecastData(forecast);
    setLoading(false);
  };

  useEffect(() => {
    const filterCities = () => {
      if (search.trim() === "") {
        setFiltered(villes.slice(0, 20));
        return;
      }
      const results = villes.filter(v =>
        v.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20);
      setFiltered(results);
    };
    filterCities();
  }, [search]);

  useEffect(() => {
    const loadWeatherData = async () => {
      if (filtered.length === 0) return;
      setLoading(true);
      const newWeatherData = {};
      for (const city of filtered) {
        const weather = await fetchWeather(city);
        newWeatherData[city] = weather;
      }
      setWeatherData(newWeatherData);
      setLoading(false);
    };
    loadWeatherData();
  }, [filtered]);

  const closeDetails = () => {
    setSelectedCity(null);
    setDetailedWeather(null);
    setForecastData(null);
  };

  // Informations personnelles pour le footer
  const personalInfo = {
    nom: "ilyass chnafa",
    titre: "Développeur Full Stack & Expert Digital",
    email: "ilyassmino1@gmail.com",
    telephone: "+212 605643047",
    ville: "oujda, Maroc",
    reseaux: {
      linkedin: "https://www.linkedin.com/in/ilyass-chnafa-42b946388/",
      github: "https://github.com/ilyass-ch10",
      
    }
  };

  return (
    <div className="meteo-container">
      {/* Header avec nouvelles fonctionnalités */}
      <header className="meteo-header">
        <div className="header-content">
          <div className="logo">
            <h1>🌤️ Météo Maroc</h1>
            <p>Prévisions météo en temps réel et sur 15 jours</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={getUserLocation} 
              className="action-btn"
              disabled={locationLoading}
            >
              {locationLoading ? "⏳" : "📍"} 
              {locationLoading ? "Localisation..." : "Ma position"}
            </button>
            <button 
              onClick={toggleTheme} 
              className="action-btn theme-toggle"
              title={`Mode ${getThemeText()}`}
            >
              {getThemeIcon()} {getThemeText()}
            </button>
          </div>
        </div>
      </header>

      {/* Indicateur de ville détectée */}
      {userLocation && (
        <div className="location-banner">
          <span>📍 Ville détectée: {userLocation}</span>
        </div>
      )}

      {/* Contenu principal */}
      <main className="meteo-main">
        <section className="meteo-section">
          <div className="section-header">
            <h2>Météo des Villes Marocaines</h2>
            <p>Consultez les conditions météo en temps réel et les prévisions sur 15 jours</p>
          </div>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Rechercher une ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              Chargement des données météo...
            </div>
          )}

          <div className="cities-grid">
            {filtered.map((ville, i) => (
              <div 
                key={i} 
                className="city-card"
                onClick={() => handleCityClick(ville)}
              >
                <h3 className="city-name">{ville}</h3>
                {weatherData[ville] && (
                  <div className="weather-preview">
                    <img 
                      src={`https://openweathermap.org/img/wn/${weatherData[ville].icon}.png`}
                      alt={weatherData[ville].description}
                      className="weather-icon"
                    />
                    <div className="weather-temp">
                      {weatherData[ville].temperature}°C
                    </div>
                    <div className="weather-desc">
                      {weatherData[ville].description}
                    </div>
                    <div className="weather-details-mini">
                      <span>💧 {weatherData[ville].humidity}%</span>
                      <span>💨 {weatherData[ville].wind} m/s</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal Météo avec nouvelles sections */}
      {selectedCity && detailedWeather && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDetails}>×</button>
            
            <div className="modal-header">
              <h2>{selectedCity}</h2>
              <div className="modal-badges">
                {detailedWeather.isMock && (
                  <div className="demo-badge">Mode Démo</div>
                )}
                {forecastData && forecastData.some(day => day.isMock) && (
                  <div className="demo-badge">Prévisions Étendues</div>
                )}
              </div>
              
              <div className="view-switcher">
                <button 
                  className={`view-btn ${activeView === "current" ? "active" : ""}`}
                  onClick={() => setActiveView("current")}
                >
                  📊 Actuel
                </button>
                <button 
                  className={`view-btn ${activeView === "forecast" ? "active" : ""}`}
                  onClick={() => setActiveView("forecast")}
                >
                  📅 15 Jours
                </button>
                <button 
                  className={`view-btn ${activeView === "stats" ? "active" : ""}`}
                  onClick={() => setActiveView("stats")}
                >
                  📈 Statistiques
                </button>
                <button 
                  className={`view-btn ${activeView === "advice" ? "active" : ""}`}
                  onClick={() => setActiveView("advice")}
                >
                  💡 Conseils
                </button>
              </div>
            </div>

            {activeView === "current" ? (
              <div className="current-weather-view">
                <div className="current-weather">
                  <div className="weather-main">
                    <img 
                      src={`https://openweathermap.org/img/wn/${detailedWeather.icon}@2x.png`}
                      alt={detailedWeather.description}
                      className="weather-icon-large"
                    />
                    <div className="temperature-section">
                      <div className="current-temp">{detailedWeather.temperature}°C</div>
                      <div className="feels-like">Ressenti {detailedWeather.feels_like}°C</div>
                      <div className="weather-description">{detailedWeather.description}</div>
                    </div>
                  </div>
                </div>

                <div className="weather-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">💧 Humidité</span>
                    <span className="detail-value">{detailedWeather.humidity}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">💨 Vent</span>
                    <span className="detail-value">{detailedWeather.wind} m/s</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📊 Pression</span>
                    <span className="detail-value">{detailedWeather.pressure} hPa</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">👁️ Visibilité</span>
                    <span className="detail-value">{detailedWeather.visibility} km</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🌅 Lever</span>
                    <span className="detail-value">
                      {detailedWeather.sunrise.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🌇 Coucher</span>
                    <span className="detail-value">
                      {detailedWeather.sunset.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              </div>
            ) : activeView === "forecast" ? (
              <div className="forecast-view">
                <h3 className="forecast-title">Prévisions sur 15 jours</h3>
                {forecastData && (
                  <div className="forecast-info">
                    <p className="forecast-subtitle">
                      {forecastData.filter(day => day.isMock).length > 0 
                        ? "Prévisions étendues avec données simulées au-delà de 5 jours"
                        : "Prévisions basées sur les données OpenWeather"
                      }
                    </p>
                    <div className="forecast-grid">
                      {forecastData.map((day, index) => (
                        <div key={index} className="forecast-day">
                          <div className="forecast-date">
                            {day.date.toLocaleDateString('fr-FR', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </div>
                          {day.isMock && <div className="mock-indicator">⚡</div>}
                          <img 
                            src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                            alt={day.description}
                            className="forecast-icon"
                          />
                          <div className="forecast-temps">
                            <span className="temp-max">{day.temp_max}°</span>
                            <span className="temp-min">{day.temp_min}°</span>
                          </div>
                          <div className="forecast-desc">{day.description}</div>
                          <div className="forecast-details">
                            <span>💧 {day.humidity}%</span>
                            <span>💨 {day.wind}m/s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeView === "stats" ? (
              <div className="stats-view">
                <h3 className="stats-title">📊 Statistiques Météo - {selectedCity}</h3>
                
                <div className="stats-section">
                  <h4>Records Historiques</h4>
                  <div className="stats-grid">
                    {weatherStats.records?.map((stat, index) => (
                      <div key={index} className="stat-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                          <div className="stat-label">{stat.label}</div>
                          <div className="stat-value">{stat.value}</div>
                          {stat.current && (
                            <div className="stat-comparison">
                              Actuel: {stat.current}°C
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stats-section">
                  <h4>Conditions Actuelles</h4>
                  <div className="stats-grid">
                    {weatherStats.current?.map((stat, index) => (
                      <div key={index} className="stat-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                          <div className="stat-label">{stat.label}</div>
                          <div className="stat-value">{stat.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="advice-view">
                <h3 className="advice-title">💡 Conseils Météo Personnalisés</h3>
                <p className="advice-subtitle">
                  Recommandations basées sur les conditions actuelles à {selectedCity}
                </p>
                
                {weatherAdvice.length > 0 ? (
                  <div className="advice-grid">
                    {weatherAdvice.map((advice, index) => (
                      <div key={index} className={`advice-card ${advice.type}`}>
                        <div className="advice-icon">{advice.icon}</div>
                        <div className="advice-text">{advice.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-advice">
                    <p>🌤️ Conditions météo normales - Aucun conseil spécifique nécessaire</p>
                    <p className="advice-tip">Profitez de votre journée !</p>
                  </div>
                )}

                <div className="general-advice">
                  <h4>💫 Conseils Généraux</h4>
                  <div className="general-tips">
                    <p>• Vérifiez régulièrement les prévisions météo</p>
                    <p>• Adaptez vos vêtements aux conditions</p>
                    <p>• Restez hydraté quelle que soit la température</p>
                    <p>• Planifiez vos activités en fonction de la météo</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer avec informations personnelles */}
      <footer className="personal-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-info">
              <h3>{personalInfo.nom}</h3>
              <p className="footer-title">{personalInfo.titre}</p>
              <div className="contact-info">
                <p>📧 {personalInfo.email}</p>
                <p>📱 {personalInfo.telephone}</p>
                <p>📍 {personalInfo.ville}</p>
              </div>
            </div>
            
            <div className="footer-social">
              <h4>Réseaux Professionnels</h4>
              <div className="social-links">
                <a href={personalInfo.reseaux.linkedin} target="_blank" rel="noopener noreferrer">
                  💼 LinkedIn
                </a>
                <a href={personalInfo.reseaux.github} target="_blank" rel="noopener noreferrer">
                  🐙 GitHub
                </a>
                <a href={personalInfo.reseaux.portfolio} target="_blank" rel="noopener noreferrer">
                  🌐 Portfolio
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 {personalInfo.nom}. Développé avec React.js & OpenWeather API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}