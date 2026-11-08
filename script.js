document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const cityInput = document.getElementById('cityInput');
  const weatherResult = document.getElementById('weatherResult');

  searchBtn.addEventListener('click', () => {
    const cityName = cityInput.value.trim();
    
    if (!cityName) {
      alert('Por favor, digite o nome de uma cidade.');
      return;
    }

    // Exemplo de integração simples com a rota da sua API
    fetchWeather(cityName);
  });

  async function fetchWeather(city) {
    try {
      weatherResult.innerHTML = '<p>Buscando informações...</p>';

      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await response.json();

      if (!response.ok) {
        weatherResult.innerHTML = `<p>${data.error}</p>`;
        return;
      }

      // Renderiza os dados retornados no elemento
      weatherResult.innerHTML = `
        <div style="margin-top: 10px;">
          <h2>${data.location.city}, ${data.location.country}</h2>
          <h3 style="font-size: 2.5rem; margin: 10px 0;">${data.current.temperature}</h3>
          <p><strong>Condição:</strong> ${data.current.condition}</p>
          <p><strong>Vento:</strong> ${data.current.windspeed}</p>
        </div>
      `;
    } catch (error) {
      weatherResult.innerHTML = '<p>Erro ao conectar com o servidor.</p>';
    }
  }
});