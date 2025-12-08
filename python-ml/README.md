# Hybrid ARIMAX-LSTM Wave Height Prediction API

FastAPI service for training and predicting wave height using Hybrid ARIMAX-LSTM model.

## Structure

```
python-ml/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── utils/              # Utility modules
│   ├── preprocessing.py
│   ├── dataset.py
│   ├── forecasting.py
│   └── evaluation.py
├── training/           # Training modules
│   ├── arimax_trainer.py
│   └── hybrid_trainer.py
├── models/            # Saved models (gitignored)
├── data/              # Datasets (gitignored)
└── docker-compose.yaml
```

## Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

### Development (with auto-reload):
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Using Docker:
```bash
docker-compose up
```

## API Endpoints

### 1. Upload Dataset
```bash
POST /upload-dataset
Content-Type: multipart/form-data

file: <excel_file>
```

### 2. Train ARIMAX
```bash
POST /train/arimax
```

### 3. Train Hybrid (LSTM)
```bash
POST /train/hybrid
```

### 4. Evaluate Models
```bash
GET /evaluate
```

### 5. Make Predictions
```bash
POST /predict
Content-Type: application/json

{
  "wind_speed": [10.5, 11.2, 12.0],
  "n_steps": 3
}
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Workflow

1. Upload dataset (Excel with columns: timestamp, wave_height, wind_speed)
2. Train ARIMAX model: `POST /train/arimax`
3. Train Hybrid LSTM: `POST /train/hybrid`
4. Evaluate: `GET /evaluate`
5. Make predictions: `POST /predict`

