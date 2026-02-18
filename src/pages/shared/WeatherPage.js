import React, { useState, useEffect } from 'react';
import { Droplets, Navigation, Cloud } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * WeatherPage Component
 * Displays mock weather data with current conditions and 5-day forecast
 * Shared view accessible to all roles
 */
const WeatherPage = () => {
  const { colors } = useTheme();
  const [weatherData, setWeatherData] = useState(null);

  // Load mock weather data on mount
  useEffect(() => {
    setWeatherData({
      temp: 72,
      conditions: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 8,
      precipitation: 0,
      forecast: [
        { day: 'Mon', high: 75, low: 55, conditions: 'sunny' },
        { day: 'Tue', high: 78, low: 58, conditions: 'cloudy' },
        { day: 'Wed', high: 72, low: 54, conditions: 'rain' },
        { day: 'Thu', high: 70, low: 52, conditions: 'partly-cloudy' },
        { day: 'Fri', high: 76, low: 56, conditions: 'sunny' }
      ]
    });
  }, []);

  const getWeatherEmoji = (conditions) => {
    switch (conditions) {
      case 'sunny':
        return '☀️';
      case 'cloudy':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'partly-cloudy':
        return '⛅';
      default:
        return '🌤️';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
        Weather
      </h2>

      {weatherData && (
        <>
          {/* Current Conditions Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold" style={{ color: colors.textPrimary }}>
                  {weatherData.temp}°F
                </p>
                <p className="text-lg" style={{ color: colors.textSecondary }}>
                  {weatherData.conditions}
                </p>
              </div>
              <span className="text-6xl">⛅</span>
            </div>

            {/* Weather Stats */}
            <div
              className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t"
              style={{ borderColor: colors.border }}
            >
              <div className="text-center">
                <Droplets
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: colors.water }}
                />
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {weatherData.humidity}%
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Humidity
                </p>
              </div>
              <div className="text-center">
                <Navigation
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: colors.primary }}
                />
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {weatherData.windSpeed} mph
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Wind
                </p>
              </div>
              <div className="text-center">
                <Cloud className="w-5 h-5 mx-auto mb-1" style={{ color: colors.sky }} />
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {weatherData.precipitation}%
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Precip
                </p>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
              5-Day Forecast
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {weatherData.forecast.map((day, index) => (
                <div
                  key={index}
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: colors.background }}
                >
                  <p className="text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    {day.day}
                  </p>
                  <span className="text-2xl">{getWeatherEmoji(day.conditions)}</span>
                  <div className="mt-2">
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {day.high}°
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {day.low}°
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherPage;
