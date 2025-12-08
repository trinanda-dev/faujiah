"""FastAPI application for Hybrid ARIMAX-LSTM wave height prediction."""

import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np

import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils.preprocessing import load_and_clean_data, split_train_test
from utils.dataset import save_uploaded_file, save_dataset, load_dataset, get_data_dir, get_models_dir
from utils.evaluation import calculate_metrics
from utils.forecasting import (
    predict_residuals_iterative,
    load_arimax_model,
    load_lstm_model,
    load_residual_scaler,
    create_sequences,
)
from training.arimax_trainer import train_arimax
from training.hybrid_trainer import train_lstm_residual

app = FastAPI(title='Hybrid ARIMAX-LSTM Wave Height Prediction API')

# Ensure directories exist
get_data_dir().mkdir(exist_ok=True)
get_models_dir().mkdir(exist_ok=True)


class PredictionRequest(BaseModel):
    """Request model for prediction endpoint."""
    wind_speed: list[float] | None = None
    n_steps: int = 1


class PredictionResponse(BaseModel):
    """Response model for prediction endpoint."""
    predictions: list[float]
    arimax_predictions: list[float]
    residual_predictions: list[float]


@app.get('/')
async def root():
    """Root endpoint."""
    return {'message': 'Hybrid ARIMAX-LSTM Wave Height Prediction API'}


@app.post('/upload-dataset')
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload dataset Excel file.

    Expected columns: timestamp, wave_height, wind_speed
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail='File must be Excel format (.xlsx or .xls)')

    try:
        content = await file.read()
        file_path = save_uploaded_file(content, 'upload.xlsx')

        # Validate file by trying to load it
        df = load_and_clean_data(file_path)

        if len(df) == 0:
            raise HTTPException(status_code=400, detail='Dataset is empty')

        if 'wave_height' not in df.columns or 'wind_speed' not in df.columns:
            raise HTTPException(
                status_code=400,
                detail='Dataset must contain columns: timestamp, wave_height, wind_speed',
            )

        return {
            'status': 'success',
            'message': 'Dataset uploaded successfully',
            'file_path': file_path,
            'rows': len(df),
            'date_range': {
                'start': str(df.index.min()),
                'end': str(df.index.max()),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error processing file: {str(e)}')


def _train_arimax_task():
    """Background task for ARIMAX training."""
    try:
        # Load uploaded dataset
        data_dir = get_data_dir()
        upload_path = data_dir / 'upload.xlsx'
        if not upload_path.exists():
            raise FileNotFoundError('Uploaded dataset not found. Please upload dataset first.')

        # Load and clean data
        df = load_and_clean_data(str(upload_path))

        # Split train/test
        train, test = split_train_test(df, train_ratio=0.9)

        # Save train/test datasets
        save_dataset(train, 'train_dataset.csv')
        save_dataset(test, 'test_dataset.csv')

        # Train ARIMAX
        arimax_res, fitted_train, residual_train = train_arimax(train, order=(1, 0, 0))

        # Save residual training data
        residual_train.to_csv(str(data_dir / 'residual_train.csv'))

        # Calculate ARIMAX metrics on training set
        arimax_pred_train = fitted_train.values
        y_true_train = train['wave_height'].values[:len(arimax_pred_train)]
        arimax_metrics = calculate_metrics(y_true_train, arimax_pred_train)

        return {
            'status': 'success',
            'arimax_mape': arimax_metrics['mape'],
            'arimax_mae': arimax_metrics['mae'],
            'arimax_rmse': arimax_metrics['rmse'],
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
        }


@app.post('/train/arimax')
async def train_arimax_endpoint(background_tasks: BackgroundTasks):
    """
    Train ARIMAX model on uploaded dataset.

    This endpoint runs training in the background.
    """
    # Check if dataset exists
    data_dir = get_data_dir()
    upload_path = data_dir / 'upload.xlsx'
    if not upload_path.exists():
        raise HTTPException(
            status_code=400,
            detail='Dataset not found. Please upload dataset first using /upload-dataset',
        )

    # Start background task
    background_tasks.add_task(_train_arimax_task)

    return {
        'status': 'success',
        'message': 'ARIMAX training started in background',
    }


@app.post('/train/arimax/sync')
async def train_arimax_sync():
    """
    Train ARIMAX model synchronously (for testing/debugging).

    Returns training metrics.
    """
    result = _train_arimax_task()
    if result['status'] == 'error':
        raise HTTPException(status_code=500, detail=result.get('message', 'Training failed'))
    return result


def _train_hybrid_task():
    """Background task for Hybrid LSTM training."""
    try:
        # Load residual training data
        data_dir = get_data_dir()
        residual_path = data_dir / 'residual_train.csv'
        if not residual_path.exists():
            raise FileNotFoundError(
                'Residual training data not found. Please train ARIMAX first using /train/arimax',
            )

        residual_train = pd.read_csv(residual_path, index_col=0, parse_dates=True)
        if len(residual_train) == 0:
            raise ValueError('Residual training data is empty')

        # Train LSTM on residuals
        model_lstm, scaler = train_lstm_residual(
            residual_train.iloc[:, 0] if residual_train.ndim > 1 else residual_train,
            window=12,
            lstm_units=18,
            epochs=200,
            batch_size=16,
            patience=10,
        )

        # Calculate training metrics (optional - can be removed for production)
        resid_vals = residual_train.values.reshape(-1, 1) if residual_train.ndim > 1 else residual_train.values.reshape(-1, 1)
        resid_scaled = scaler.transform(resid_vals)
        X_train, y_train = create_sequences(resid_scaled, window=12)

        # Predict on training set
        y_pred_scaled = model_lstm.predict(X_train, verbose=0)
        y_pred = scaler.inverse_transform(y_pred_scaled).flatten()
        y_true = scaler.inverse_transform(y_train.reshape(-1, 1)).flatten()

        lstm_metrics = calculate_metrics(y_true, y_pred)

        return {
            'status': 'success',
            'hybrid_mape': lstm_metrics['mape'],
            'hybrid_mae': lstm_metrics['mae'],
            'hybrid_rmse': lstm_metrics['rmse'],
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
        }


@app.post('/train/hybrid')
async def train_hybrid_endpoint(background_tasks: BackgroundTasks):
    """
    Train Hybrid LSTM model on ARIMAX residuals.

    This endpoint runs training in the background.
    Requires ARIMAX to be trained first.
    """
    # Check if residual data exists
    data_dir = get_data_dir()
    residual_path = data_dir / 'residual_train.csv'
    if not residual_path.exists():
        raise HTTPException(
            status_code=400,
            detail='Residual training data not found. Please train ARIMAX first using /train/arimax',
        )

    # Start background task
    background_tasks.add_task(_train_hybrid_task)

    return {
        'status': 'success',
        'message': 'Hybrid LSTM training started in background',
    }


@app.post('/train/hybrid/sync')
async def train_hybrid_sync():
    """
    Train Hybrid LSTM model synchronously (for testing/debugging).

    Returns training metrics.
    """
    result = _train_hybrid_task()
    if result['status'] == 'error':
        raise HTTPException(status_code=500, detail=result.get('message', 'Training failed'))
    return result


@app.get('/evaluate')
async def evaluate():
    """
    Evaluate both ARIMAX and Hybrid models on test set.

    Returns metrics for both models.
    """
    try:
        # Load test dataset
        test = load_dataset('test_dataset.csv')

        # Load ARIMAX model
        arimax_res = load_arimax_model()

        # Predict ARIMAX on test set
        arimax_forecast = arimax_res.get_forecast(steps=len(test), exog=test[['wind_speed']])
        arimax_pred = arimax_forecast.predicted_mean.values

        # Load LSTM model and scaler
        model_lstm = load_lstm_model()
        scaler = load_residual_scaler()

        # Get seed from residual training data
        data_dir = get_data_dir()
        residual_train = pd.read_csv(data_dir / 'residual_train.csv', index_col=0, parse_dates=True)
        resid_vals = residual_train.values.reshape(-1, 1) if residual_train.ndim > 1 else residual_train.values.reshape(-1, 1)
        resid_scaled = scaler.transform(resid_vals)
        seed = resid_scaled[-12:].reshape(1, 12, 1)

        # Predict residuals iteratively
        predicted_resid = predict_residuals_iterative(
            model_lstm,
            scaler,
            seed,
            n_steps=len(test),
            window=12,
        )

        # Hybrid prediction
        hybrid_pred = arimax_pred + predicted_resid

        # Calculate metrics
        y_true = test['wave_height'].values
        arimax_metrics = calculate_metrics(y_true, arimax_pred)
        hybrid_metrics = calculate_metrics(y_true, hybrid_pred)

        # Save results
        results = test.copy()
        results['pred_arimax'] = arimax_pred
        results['pred_hybrid'] = hybrid_pred
        results['residual_pred'] = predicted_resid
        save_dataset(results, 'hybrid_arimax_lstm_results.csv')

        # Prepare detailed results for response
        results_detail = []
        for i in range(len(test)):
            results_detail.append({
                'timestamp': str(test.index[i]),
                'actual': float(y_true[i]),
                'arimax_pred': float(arimax_pred[i]),
                'residual_pred': float(predicted_resid[i]),
                'hybrid_pred': float(hybrid_pred[i]),
            })

        return {
            'status': 'success',
            'arimax': {
                'mape': arimax_metrics['mape'],
                'mae': arimax_metrics['mae'],
                'rmse': arimax_metrics['rmse'],
            },
            'hybrid': {
                'mape': hybrid_metrics['mape'],
                'mae': hybrid_metrics['mae'],
                'rmse': hybrid_metrics['rmse'],
            },
            'results': results_detail,  # Add detailed results
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Evaluation error: {str(e)}')


@app.post('/predict', response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Make predictions using trained models.

    Args:
        request: Prediction request with wind_speed and n_steps

    Returns:
        Predictions for wave height
    """
    try:
        # Load models
        arimax_res = load_arimax_model()
        model_lstm = load_lstm_model()
        scaler = load_residual_scaler()

        # Get seed from residual training data
        data_dir = get_data_dir()
        residual_train = pd.read_csv(data_dir / 'residual_train.csv', index_col=0, parse_dates=True)
        resid_vals = residual_train.values.reshape(-1, 1) if residual_train.ndim > 1 else residual_train.values.reshape(-1, 1)
        resid_scaled = scaler.transform(resid_vals)
        seed = resid_scaled[-12:].reshape(1, 12, 1)

        n_steps = request.n_steps

        # Prepare exogenous variables
        if request.wind_speed is None:
            # Use last wind_speed from training data if not provided
            train = load_dataset('train_dataset.csv')
            last_wind_speed = train['wind_speed'].iloc[-1]
            wind_speed = [last_wind_speed] * n_steps
        else:
            if len(request.wind_speed) != n_steps:
                raise HTTPException(
                    status_code=400,
                    detail=f'wind_speed length ({len(request.wind_speed)}) must match n_steps ({n_steps})',
                )
            wind_speed = request.wind_speed

        # Predict ARIMAX
        exog = pd.DataFrame({'wind_speed': wind_speed})
        arimax_forecast = arimax_res.get_forecast(steps=n_steps, exog=exog)
        arimax_pred = arimax_forecast.predicted_mean.values

        # Predict residuals
        predicted_resid = predict_residuals_iterative(
            model_lstm,
            scaler,
            seed,
            n_steps=n_steps,
            window=12,
        )

        # Hybrid prediction
        hybrid_pred = arimax_pred + predicted_resid

        return PredictionResponse(
            predictions=hybrid_pred.tolist(),
            arimax_predictions=arimax_pred.tolist(),
            residual_predictions=predicted_resid.tolist(),
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Prediction error: {str(e)}')


@app.get('/health')
async def health():
    """Health check endpoint."""
    return {'status': 'healthy'}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)

