import React from 'react';
import { BarChart3, TrendingUp, GitCommit, ShieldAlert } from 'lucide-react';

export default function ModelMetrics({ metrics, coefficients, locations }) {
  if (!metrics) {
    return (
      <div className="glass-card predictor-form animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', textAlign: 'center', gap: '1rem', padding: '2rem' }}>
        <ShieldAlert className="text-amber-500" size={40} style={{ color: '#f59e0b' }} />
        <h2 className="panel-header" style={{ margin: 0 }}><span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>Diagnostics Unavailable</span></h2>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', maxWidth: '320px' }}>
          Valuation is currently served by the placeholder mock engine. No regression metrics are available.
        </p>
      </div>
    );
  }

  const r2 = metrics.r2_score || 0;
  const mse = metrics.mse || 0;

  const sortedLocationCoeffs = Object.entries(coefficients || {})
    .filter(([key]) => key !== 'total_sqft' && key !== 'bath' && key !== 'bhk')
    .sort((a, b) => b[1] - a[1]);

  const topPremium = sortedLocationCoeffs.slice(0, 3);
  const topBudget = sortedLocationCoeffs.slice(-3).reverse();

  return (
    <div className="glass-card predictor-form animate-fade-in" style={{ padding: '1.5rem' }}>
      <h2 className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
          <BarChart3 className="text-indigo-400" size={20} />
          Model Diagnostics
        </span>
      </h2>

      {/* R2 and MSE Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">R² Score (Fit)</span>
          <span className="metric-value indigo">{(r2 * 100).toFixed(1)}%</span>
          <span className="metric-desc">Variance explained</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Mean Sq. Error</span>
          <span className="metric-value purple">{mse.toFixed(1)}</span>
          <span className="metric-desc">Average squared delta</span>
        </div>
      </div>

      {/* Feature Weights (Coefficients) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="diagnostics-header">
          <GitCommit size={14} />
          Primary Feature Weights
        </span>
        <div className="features-list">
          <div className="feature-item">
            <span>Area Coefficient (β₁)</span>
            <span className="feature-weight-pos">+{coefficients?.total_sqft?.toFixed(4)}</span>
          </div>
          <div className="feature-item">
            <span>Bedrooms Coefficient (β₂)</span>
            <span className="feature-weight-neg">{coefficients?.bhk?.toFixed(4)}</span>
          </div>
          <div className="feature-item">
            <span>Bathrooms Coefficient (β₃)</span>
            <span className="feature-weight-pos">+{coefficients?.bath?.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Neighborhood Premiums */}
      {sortedLocationCoeffs.length > 0 && (
        <div>
          <span className="diagnostics-header">
            <TrendingUp size={14} />
            Location Impact Coefficients (β₄)
          </span>
          <div className="neighborhood-grid">
            <div className="neighborhood-column">
              <span className="neighborhood-header premium">Premium Areas</span>
              {topPremium.map(([loc, val], i) => (
                <div key={i} className="neighborhood-item">
                  <span title={loc}>{loc}</span>
                  <span className="pos">+{val.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="neighborhood-column">
              <span className="neighborhood-header budget">Budget Areas</span>
              {topBudget.map(([loc, val], i) => (
                <div key={i} className="neighborhood-item">
                  <span title={loc}>{loc}</span>
                  <span className="neg">{val.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
