import { useState, useEffect } from 'react';

export function useWeather(location = 'Durame,ET') {
  const [weather, setWeather] = useState({ temp: "24°", desc: "Sunny" });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        if (!apiKey) return;
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`);
        const data = await res.json();
        if (data && data.main) {
          setWeather({
            temp: `${Math.round(data.main.temp)}°`,
            desc: data.weather[0]?.main || "Clear"
          });
        }
      } catch (err) {
        // Suppressed to console.warn to prevent Next.js dev overlay from interrupting the UI
        console.warn("Weather API unreachable or blocked", err);
      }
    };
    fetchWeather();
  }, [location]);

  return weather;
}
