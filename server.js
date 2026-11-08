import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração para resolver caminhos ao usar ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Servir os arquivos estáticos da pasta "public" (HTML, CSS e JS)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Utilitário: Mapeia códigos WMO da Open-Meteo para descrições legíveis
 */
function getWeatherCondition(code) {
  const weatherCodes = {
    0: 'Céu limpo',
    1: 'Predominantemente limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Névoa',
    48: 'Névoa com geada',
    51: 'Garoa leve',
    53: 'Garoa moderada',
    55: 'Garoa densa',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    71: 'Neve leve',
    73: 'Neve moderada',
    75: 'Neve forte',
    80: 'Pancadas de chuva leves',
    81: 'Pancadas de chuva moderadas',
    82: 'Pancadas de chuva violentas',
    95: 'Trovoada leve/moderada',
    96: 'Trovoada com granizo leve',
    99: 'Trovoada com granizo forte'
  };

  return weatherCodes[code] || 'Condição desconhecida';
}

/**
 * Endpoint da API: GET /api/weather
 */
app.get('/api/weather', async (req, res) => {
  try {
    const { city, days = 3 } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'O parâmetro "city" é obrigatório.' });
    }

    // 1. Geocoding
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: `Cidade "${city}" não encontrada.` });
    }

    const { name, latitude, longitude, country, admin1 } = geoData.results[0];

    // 2. Previsão do tempo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=${days}&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    const current = weatherData.current_weather;
    const daily = weatherData.daily;

    const forecastList = daily.time.map((date, index) => ({
      date,
      max_temp: `${daily.temperature_2m_max[index]} °C`,
      min_temp: `${daily.temperature_2m_min[index]} °C`,
      condition: getWeatherCondition(daily.weathercode[index])
    }));

    res.json({
      location: {
        city: name,
        state: admin1 || null,
        country: country,
        coordinates: { latitude, longitude }
      },
      current: {
        temperature: `${current.temperature} °C`,
        windspeed: `${current.windspeed} km/h`,
        condition: getWeatherCondition(current.weathercode),
        time: current.time
      },
      forecast: forecastList
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno ao processar a solicitação do tempo.',
      details: error.message
    });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso!`);
  console.log(`📍 Acesse a interface em: http://localhost:${PORT}`);
});