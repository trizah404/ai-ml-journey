import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd
from app.schemas import PredictionRequest, PredictionResponse

app = FastAPI(title="Real Estate Predictor - Model Server")

# Allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
metadata = None

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts"))
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.joblib")
METADATA_PATH = os.path.join(ARTIFACTS_DIR, "model_metadata.json")


def load_model_artifacts():
    """Load the trained model + its metadata (features, coefficients, metrics)."""
    global model, metadata
    if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
        model = joblib.load(MODEL_PATH)
        with open(METADATA_PATH) as f:
            metadata = json.load(f)
        print("Model and metadata loaded.")
    else:
        print("Warning: model artifacts not found. Run train.py first.")
        model, metadata = None, None


@app.on_event("startup")
def startup_event():
    load_model_artifacts()


@app.get("/api/model-info")
def get_model_info():
    if model is None:
        load_model_artifacts()

    if model is not None and metadata is not None:
        return {
            "status": "loaded",
            "metrics": metadata.get("metrics", {}),
            "locations": metadata.get("locations", []),
            "features_count": len(metadata.get("features", [])),
            "intercept": metadata.get("intercept", 0.0),
            "coefficients": metadata.get("coefficients", {}),
            "is_mock": False,
        }
    return {
        "status": "not_trained",
        "message": "Model artifacts not found. Run train.py to train and export the model.",
        "locations": ["Indiranagar", "1st Phase JP Nagar", "Whitefield", "Yelahanka",
                      "Electronic City", "Thanisandra", "Kanakpura Road", "Sarjapur Road"],
        "is_mock": True,
    }


@app.post("/api/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    if model is None:
        load_model_artifacts()

    if model is not None and metadata is not None:
        features = metadata["features"]
        coefs = metadata["coefficients"]

        # One input row, in EXACTLY the column order the model was trained on
        x = np.zeros(len(features))
        x[features.index("total_sqft")] = request.total_sqft
        x[features.index("bath")] = request.bath
        x[features.index("bhk")] = request.bhk

        # One-hot encode the location (unknown / 'other' -> all zeros)
        if request.location != "other" and request.location not in metadata["locations"]:
            raise HTTPException(status_code=422, detail=f"Unknown location '{request.location}'. See /api/model-info for valid locations.")
        loc_coeff = 0.0
        if request.location in features:
            x[features.index(request.location)] = 1.0
            loc_coeff = coefs[request.location]

        row = pd.DataFrame([x], columns=features)
        predicted_price = float(model.predict(row)[0])

        formula_breakdown = {
            "intercept": metadata["intercept"],
            "sqft_contribution": request.total_sqft * coefs["total_sqft"],
            "bath_contribution": request.bath * coefs["bath"],
            "bhk_contribution": request.bhk * coefs["bhk"],
            "location_contribution": loc_coeff,
            "sqft_coeff": coefs["total_sqft"],
            "bath_coeff": coefs["bath"],
            "bhk_coeff": coefs["bhk"],
            "location_coeff": loc_coeff,
        }
        return PredictionResponse(
            predicted_price=max(0.0, predicted_price),
            formula_breakdown=formula_breakdown,
            is_mock=False,
        )

    # No trained model yet: refuse instead of inventing a price
    raise HTTPException(status_code=503, detail="Model not trained yet. Run train.py first.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
