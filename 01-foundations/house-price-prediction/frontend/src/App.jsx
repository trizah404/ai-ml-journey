import React, { useState, useEffect, useRef } from 'react';
import PredictorForm from './components/PredictorForm';
import EquationBreakdown from './components/EquationBreakdown';
import ModelMetrics from './components/ModelMetrics';
import { Home, LineChart, Cpu, Sparkles, History, RefreshCw } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8001';

export default function App() {
  const [locations, setLocations] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [inputs, setInputs] = useState({
    total_sqft: 1500,
    bhk: 3,
    bath: 3,
    location: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('math'); // 'math' or 'diagnostics'

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/model-info`);
      const data = await response.json();
      
      if (data.status === 'loaded' || data.status === 'not_trained') {
        setModelInfo(data);
        const locList = data.locations || [];
        setLocations(locList);
        
        if (locList.length > 0) {
          setInputs(prev => ({
            ...prev,
            location: locList.includes('Whitefield') ? 'Whitefield' : locList[0]
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching model metadata:', err);
      setError('Could not connect to FastAPI server. Please ensure the backend is running on port 8001.');
    }
  };

  const predictPrice = async (currentInputs = inputs) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInputs)
      });
      if (!response.ok) {
        throw new Error('Server returned an error');
      }
      const data = await response.json();
      setPrediction(data);
      
      setHistory(prev => {
        const item = {
          id: Date.now(),
          inputs: { ...currentInputs },
          price: data.predicted_price,
          isMock: data.is_mock
        };
        return [item, ...prev.slice(0, 4)];
      });
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Valuation request failed. Check your network or backend console.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    predictPrice();
  };

  const debounceRef = useRef(null);
  const handleInputChange = (name, value) => {
    const nextInputs = { ...inputs, [name]: value };
    setInputs(nextInputs);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      predictPrice(nextInputs);
    }, 450);
  };

  useEffect(() => {
    if (inputs.location) {
      predictPrice();
    }
  }, [inputs.location]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-logo">
              <Home size={20} />
            </div>
            <div className="brand-text">
              <h1>HomeVal AI</h1>
              <span>Multiple Linear Regression Engine (Initialise)</span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={fetchModelInfo}
              className="icon-btn"
              title="Refresh Engine Status"
            >
              <RefreshCw size={16} />
            </button>
            <span className="badge">
              API Port: <span>8001</span>
            </span>
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Left Column: Form & History */}
        <div className="sidebar-panel">
          <PredictorForm
            locations={locations}
            inputs={inputs}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
            isMock={prediction?.is_mock ?? true}
          />
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {history.length > 0 && (
            <div className="glass-card history-card animate-fade-in">
              <h3>
                <History size={14} />
                Query History
              </h3>
              <div className="history-list">
                {history.map((h) => (
                  <div key={h.id} className="history-item">
                    <div className="history-item-details">
                      <span>{h.inputs.total_sqft} sqft | {h.inputs.bhk} BHK | {h.inputs.bath} Bath</span>
                      <span>{h.inputs.location}</span>
                    </div>
                    <div className="history-item-value">
                      <span className="history-item-price">{h.price.toFixed(2)} Lakhs</span>
                      <span className={`history-item-tag ${h.isMock ? 'mock' : 'active'}`}>
                        {h.isMock ? 'fallback mock' : 'active ml model'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Output & Tabs */}
        <div className="main-panel">
          {/* Valuations Card */}
          <div className="glass-card value-card">
            <div className="card-glow-1"></div>
            <div className="card-glow-2"></div>
            <div>
              <span className="card-tag">
                <Sparkles size={14} />
                Algorithmic Valuation
              </span>
              <h2 className="card-title">Estimated Property Value</h2>
            </div>
            
            <div className="price-display">
              {loading && !prediction ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9ca3af' }}>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Evaluating regression model...</span>
                </div>
              ) : prediction ? (
                <>
                  <span className="price-value">
                    ₹{prediction.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="price-unit">Lakhs</span>
                </>
              ) : (
                <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.875rem' }}>
                  Adjust parameters to calculate prediction
                </span>
              )}
            </div>

            <div className="card-footer">
              <div>
                Location: <strong style={{ color: '#f3f4f6' }}>{inputs.location || 'N/A'}</strong>
              </div>
              <div>
                INR Valuation: <span className="footer-highlight">
                  {prediction ? `₹${(prediction.predicted_price * 100000).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs-container">
            <button
              onClick={() => setActiveTab('math')}
              className={`tab-button ${activeTab === 'math' ? 'active' : ''}`}
            >
              <Cpu size={14} />
              Mathematical Formula
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`tab-button ${activeTab === 'diagnostics' ? 'active' : ''}`}
            >
              <LineChart size={14} />
              Model Diagnostics
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'math' ? (
            <EquationBreakdown
              breakdown={prediction?.formula_breakdown}
              inputs={inputs}
            />
          ) : (
            <ModelMetrics
              metrics={modelInfo?.metrics}
              coefficients={modelInfo?.coefficients}
              locations={locations}
            />
          )}
        </div>
      </main>
    </div>
  );
}
