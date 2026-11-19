import React from 'react';
import { Cpu } from 'lucide-react';

export default function EquationBreakdown({ breakdown, inputs }) {
  if (!breakdown) return null;

  const {
    intercept = 0,
    sqft_contribution = 0,
    bath_contribution = 0,
    bhk_contribution = 0,
    location_contribution = 0,
    sqft_coeff = 0,
    bath_coeff = 0,
    bhk_coeff = 0,
    location_coeff = 0
  } = breakdown;

  const total = intercept + sqft_contribution + bath_contribution + bhk_contribution + location_contribution;
  
  const formatVal = (val) => val.toFixed(2);
  const formatPercentage = (val) => {
    if (total === 0) return '0%';
    const pct = (val / total) * 100;
    return `${pct.toFixed(1)}%`;
  };

  const items = [
    { label: 'Base Intercept (β₀)', val: intercept, coeff: null, input: null, color: '#6b7280', textClass: 'positive' },
    { label: 'Area Adjustment (β₁ × Sqft)', val: sqft_contribution, coeff: sqft_coeff, input: `${inputs.total_sqft} sqft`, color: '#6366f1', textClass: 'positive' },
    { label: 'Bedrooms Weight (β₂ × BHK)', val: bhk_contribution, coeff: bhk_coeff, input: `${inputs.bhk} BHK`, color: '#a855f7', textClass: bhk_contribution >= 0 ? 'positive' : 'negative' },
    { label: 'Bathrooms Weight (β₃ × Bath)', val: bath_contribution, coeff: bath_coeff, input: `${inputs.bath} Bath`, color: '#06b6d4', textClass: bath_contribution >= 0 ? 'positive' : 'negative' },
    { label: 'Neighborhood Location Premium (β₄ × Loc)', val: location_contribution, coeff: location_coeff, input: inputs.location, color: location_contribution >= 0 ? '#10b981' : '#ef4444', textClass: location_contribution >= 0 ? 'positive' : 'negative' },
  ];

  return (
    <div className="glass-card predictor-form animate-fade-in" style={{ padding: '1.5rem' }}>
      <h2 className="panel-header" style={{ marginBottom: '1rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
          <Cpu className="text-indigo-400" size={20} />
          Valuation Breakdown & Math
        </span>
      </h2>
      
      {/* Mathematical equation block */}
      <div className="math-equation">
        <div className="math-title">Regression Equation:</div>
        <div>
          Price = β₀ + (β₁ × Sqft) + (β₂ × BHK) + (β₃ × Bath) + (β₄ × Location)
        </div>
        <div className="math-divider"></div>
        <div className="math-title" style={{ color: '#a855f7' }}>Calculated Expansion:</div>
        <div>
          Price = {formatVal(intercept)}
          {' '} + ({formatVal(sqft_coeff)} × {inputs.total_sqft})
          {' '} + ({formatVal(bhk_coeff)} × {inputs.bhk})
          {' '} + ({formatVal(bath_coeff)} × {inputs.bath})
          {' '} + ({formatVal(location_coeff)} × {inputs.location === 'other' ? '0' : '1'})
        </div>
        <div className="math-result">
          Valuation = <span>{formatVal(total)} Lakhs</span>
        </div>
      </div>

      {/* Breakdown progress list */}
      <div className="breakdown-list">
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Parameter Weights
        </h3>
        
        {items.map((item, idx) => {
          const isNegative = item.val < 0;
          const percentageWidth = Math.min(100, Math.max(0, (Math.abs(item.val) / Math.abs(total)) * 100));
          
          return (
            <div key={idx} className="breakdown-item">
              <div className="breakdown-item-header">
                <div className="breakdown-item-label">
                  <span>{item.label}</span>
                  {item.coeff !== null && (
                    <span className="breakdown-item-coeff">
                      β = {formatVal(item.coeff)} × {item.input}
                    </span>
                  )}
                </div>
                <div className="breakdown-item-value-col">
                  <span className={`breakdown-item-price ${item.textClass}`}>
                    {isNegative ? '-' : '+'}{formatVal(Math.abs(item.val))} Lakhs
                  </span>
                  <span className="breakdown-item-pct">
                    {formatPercentage(item.val)}
                  </span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${percentageWidth}%`, 
                    backgroundColor: item.color 
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
