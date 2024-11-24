import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import './App.css';

function App() {
  const [countries, setCountries] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [chartType, setChartType] = useState('line'); // State to toggle chart type

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [countriesRes, populationRes] = await Promise.all([
        fetch('http://localhost:5000/api/countries'),
        fetch('http://localhost:5000/api/population'),
      ]);

      const countriesData = await countriesRes.json();
      const populationData = await populationRes.json();

      // Add flag data to countries
      const countriesWithFlags = await Promise.all(
        countriesData.map(async (country) => {
          const flagRes = await fetch('http://localhost:5000/api/flag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: country.name }),
          });
          const flagData = await flagRes.json();
          return { ...country, flag: flagData.flag };
        })
      );

      setCountries(countriesWithFlags);
      setPopulationData(populationData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm) ||
      country.capital.toLowerCase().includes(searchTerm)
  );

  const getPopulationForCapital = (capital) => {
    const cityData = populationData.find(
      (city) => city.city.toLowerCase() === capital.toLowerCase()
    );
    return cityData?.populationCounts[0]?.value || 0;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const chartData = countries
    .map((country) => ({
      name: country.name,
      population: getPopulationForCapital(country.capital),
    }))
    .filter((data) => data.population > 0) // Filter valid data
    .sort((a, b) => b.population - a.population) // Sort by population descending
    .slice(0, 20); // Display only the top 20 most populated countries

  return (
    <div className="app">
      <header className="header">
        <img src="https://png.pngtree.com/png-vector/20230728/ourmid/pngtree-globe-clipart-an-illustration-of-a-cartoon-earth-globe-with-clouds-vector-png-image_6814849.png"></img>
        <h1>Census Sphere</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search countries or capitals..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </header>

      <div className="main-content">
        <div className="countries-grid">
          {filteredCountries.map((country, index) => (
            <div
              key={index}
              className={`country-card ${
                selectedCountry === country ? 'selected' : ''
              }`}
              onClick={() => setSelectedCountry(country)}
            >
              <div className="flag-container">
                <img
                  src={country.flag || '/placeholder.png'}
                  alt={`${country.name} flag`}
                  className="country-flag"
                />
              </div>
              <div className="country-info">
                <h3>{country.name}</h3>
                <p>Capital: {country.capital}</p>
                <p>
                  Population: {getPopulationForCapital(country.capital).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="chart-container">
          <h2>Population Distribution</h2>

          {/* Button to toggle between chart types */}
          <button onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}>
            Switch to {chartType === 'line' ? 'Bar Chart' : 'Line Chart'}
          </button>

          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="population"
                  stroke="#2196F3"
                  name="Population"
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="population" fill="#2196F3" name="Population" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
