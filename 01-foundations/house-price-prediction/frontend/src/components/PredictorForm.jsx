import React from 'react';
import { Home, Bed, Bath, MapPin, Loader2 } from 'lucide-react';

export default function PredictorForm({ locations, inputs, onChange, onSubmit, loading, isMock }) {
  const handleSliderChange = (name, value) => {
    onChange(name, value);
  };

  return (
    <div className="glass-card predictor-form animate-fade-in">
      <div className="panel-header">
        <h2>
          <Home className="text-indigo-400" size={20} />
          Parameters
        </h2>
        {isMock ? (
          <span className="status-indicator mock">
            <span className="pulse-yellow"></span>
            Mock Engine
          </span>
        ) : (
          <span className="status-indicator active">
            <span className="pulse-green"></span>
            ML Active
          </span>
        )}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {/* Area Slider */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label">
              <Home size={15} style={{ color: '#818cf8' }} />
              Area (Sq. Ft.)
            </label>
            <span className="form-value">
              {inputs.total_sqft.toLocaleString()} sqft
            </span>
          </div>
          <input
            type="range"
            min="300"
            max="6000"
            step="50"
            value={inputs.total_sqft}
            onChange={(e) => handleSliderChange('total_sqft', parseFloat(e.target.value))}
          />
          <div className="range-limits">
            <span>300 sqft</span>
            <span>3,000 sqft</span>
            <span>6,000 sqft</span>
          </div>
        </div>

        {/* BHK Selector */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label">
              <Bed size={15} style={{ color: '#818cf8' }} />
              Bedrooms (BHK)
            </label>
            <span className="form-value">
              {inputs.bhk} BHK
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={inputs.bhk}
            onChange={(e) => handleSliderChange('bhk', parseInt(e.target.value))}
          />
          <div className="range-limits">
            <span>1 BHK</span>
            <span>4 BHK</span>
            <span>8 BHK</span>
          </div>
        </div>

        {/* Bathrooms Selector */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label">
              <Bath size={15} style={{ color: '#818cf8' }} />
              Bathrooms
            </label>
            <span className="form-value">
              {inputs.bath} {inputs.bath === 1 ? 'Bath' : 'Baths'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={inputs.bath}
            onChange={(e) => handleSliderChange('bath', parseInt(e.target.value))}
          />
          <div className="range-limits">
            <span>1 Bath</span>
            <span>4 Baths</span>
            <span>8 Baths</span>
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="form-group">
          <label className="form-label">
            <MapPin size={15} style={{ color: '#818cf8' }} />
            Neighborhood Location
          </label>
          <div className="select-wrapper">
            <select
              value={inputs.location}
              onChange={(e) => handleSliderChange('location', e.target.value)}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="other">Other Locations</option>
            </select>
            <div className="select-arrow">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" style={{ width: '1rem', height: '1rem' }}>
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ marginTop: '0.75rem' }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Evaluating...
            </>
          ) : (
            'Calculate Valuation'
          )}
        </button>
      </form>
    </div>
  );
}
