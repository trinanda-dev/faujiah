"""FastAPI application for Hybrid ARIMAX-LSTM wave height prediction."""

import os
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query, Body
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
    load_arimax_order_metadata,
    create_sequences,
)
from training.arimax_trainer import train_arimax
from training.hybrid_trainer import train_lstm_residual

# Global cache for models and data
_model_cache = {
    'arimax': None,
    'lstm': None,
    'scaler': None,
    'residual_seed': None,
    'last_wind_speed': None,
    'train_dataset': None,
}


def load_models_to_cache():
    """Load all models and cache data into memory."""
    try:
        print("Loading models into cache...")
        
        # Load models
        _model_cache['arimax'] = load_arimax_model()
        _model_cache['lstm'] = load_lstm_model()
        _model_cache['scaler'] = load_residual_scaler()
        
        # Load and cache residual seed
        data_dir = get_data_dir()
        residual_path = data_dir / 'residual_train.csv'
        if residual_path.exists():
            residual_train = pd.read_csv(residual_path, index_col=0, parse_dates=True)
            resid_vals = residual_train.values.reshape(-1, 1) if residual_train.ndim > 1 else residual_train.values.reshape(-1, 1)
            resid_scaled = _model_cache['scaler'].transform(resid_vals)
            _model_cache['residual_seed'] = resid_scaled[-12:].reshape(1, 12, 1)
        
        # Load and cache train dataset for last wind speed
        train_path = data_dir / 'train_dataset.csv'
        if train_path.exists():
            _model_cache['train_dataset'] = load_dataset('train_dataset.csv')
            _model_cache['last_wind_speed'] = float(_model_cache['train_dataset']['wind_speed'].iloc[-1])
        
        print("Models loaded successfully!")
    except FileNotFoundError as e:
        print(f"Models not found yet: {e}. Will load on first prediction request.")
    except Exception as e:
        print(f"Error loading models: {e}. Will load on first prediction request.")


def clear_model_cache():
    """Clear model cache (useful when models are retrained)."""
    global _model_cache
    _model_cache = {
        'arimax': None,
        'lstm': None,
        'scaler': None,
        'residual_seed': None,
        'last_wind_speed': None,
        'train_dataset': None,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    # Startup: Load models into cache
    load_models_to_cache()
    yield
    # Shutdown: Clear cache
    clear_model_cache()


app = FastAPI(
    title='Hybrid ARIMAX-LSTM Wave Height Prediction API',
    lifespan=lifespan,
)

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

        # Split data into train and test sets (80% train, 20% test)
        train, test = split_train_test(df, train_ratio=0.8)
        
        # Save train and test datasets to CSV files
        # This ensures that evaluate/arimax-models always uses the latest data
        save_dataset(train, 'train_dataset.csv')
        save_dataset(test, 'test_dataset.csv')
        
        # Clear model cache since dataset has changed
        clear_model_cache()

        return {
            'status': 'success',
            'message': 'Dataset uploaded successfully',
            'file_path': file_path,
            'rows': len(df),
            'train_rows': len(train),
            'test_rows': len(test),
            'date_range': {
                'start': str(df.index.min()),
                'end': str(df.index.max()),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error processing file: {str(e)}')


def _train_arimax_task(order: tuple[int, int, int] = (1, 0, 0)):
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
        train, test = split_train_test(df, train_ratio=0.8)

        # Save train/test datasets
        save_dataset(train, 'train_dataset.csv')
        save_dataset(test, 'test_dataset.csv')

        # Train ARIMAX with specified order
        arimax_res, fitted_train, residual_train = train_arimax(train, order=order)

        # Save residual training data
        residual_train.to_csv(str(data_dir / 'residual_train.csv'))

        # Clear model cache since models have been retrained
        clear_model_cache()
        
        # Reload models to cache
        load_models_to_cache()

        # Calculate ARIMAX metrics on training set
        arimax_pred_train = fitted_train.values
        y_true_train = train['wave_height'].values[:len(arimax_pred_train)]
        arimax_metrics = calculate_metrics(y_true_train, arimax_pred_train)

        return {
            'status': 'success',
            'arimax_mape': arimax_metrics['mape'],
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
        }


@app.post('/train/arimax')
async def train_arimax_endpoint(
    background_tasks: BackgroundTasks,
    p: int = Query(1, description='AR order'),
    d: int = Query(0, description='Differencing order'),
    q: int = Query(0, description='MA order'),
):
    """
    Train ARIMAX model on uploaded dataset.

    This endpoint runs training in the background.
    
    Args:
        p: AR order (default: 1)
        d: Differencing order (default: 0)
        q: MA order (default: 0)
    """
    # Check if dataset exists
    data_dir = get_data_dir()
    upload_path = data_dir / 'upload.xlsx'
    if not upload_path.exists():
        raise HTTPException(
            status_code=400,
            detail='Dataset not found. Please upload dataset first using /upload-dataset',
        )

    # Validate order parameters
    if p < 0 or d < 0 or q < 0:
        raise HTTPException(
            status_code=400,
            detail='Order parameters (p, d, q) must be non-negative integers',
        )

    order = (p, d, q)

    # Start background task
    background_tasks.add_task(_train_arimax_task, order=order)

    return {
        'status': 'success',
        'message': f'ARIMAX training started in background with order {order}',
        'order': order,
    }


@app.post('/train/arimax/sync')
async def train_arimax_sync(
    p: int = Query(1, description='AR order'),
    d: int = Query(0, description='Differencing order'),
    q: int = Query(0, description='MA order'),
):
    """
    Train ARIMAX model synchronously (for testing/debugging).

    Returns training metrics.
    
    Args:
        p: AR order (default: 1)
        d: Differencing order (default: 0)
        q: MA order (default: 0)
    """
    # Validate order parameters
    if p < 0 or d < 0 or q < 0:
        raise HTTPException(
            status_code=400,
            detail='Order parameters (p, d, q) must be non-negative integers',
        )

    order = (p, d, q)
    result = _train_arimax_task(order=order)
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

        # Train LSTM on residuals (model is saved inside train_lstm_residual)
        model_lstm, scaler = train_lstm_residual(
            residual_train.iloc[:, 0] if residual_train.ndim > 1 else residual_train,
            window=12,
            lstm_units=18,
            epochs=200,
            batch_size=16,
            patience=10,
        )

        # Clear model cache since models have been retrained
        clear_model_cache()
        
        # Reload models to cache
        load_models_to_cache()

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


class HybridTrainRequest(BaseModel):
    """Request model untuk training Hybrid (ARIMAX + LSTM)."""
    p: int | None = None
    d: int | None = None
    q: int | None = None


@app.post('/train/hybrid/sync')
async def train_hybrid_sync(request: HybridTrainRequest = Body(default=None)):
    """
    Train ARIMAX and Hybrid LSTM model synchronously.
    
    This is the SINGLE SOURCE OF TRUTH for training both ARIMAX and Hybrid models.
    
    Process:
    1. Train ARIMAX with specified order (or use saved order/default)
    2. Calculate ARIMAX MAPE on test set
    3. Train LSTM on ARIMAX residuals
    4. Return both ARIMAX MAPE and Hybrid metrics
    
    Args:
        request: Optional request with p, d, q order. If not provided, uses saved order or default (1,1,0)
    
    Returns:
        Dictionary with status, arimax_mape, and hybrid_mape
    """
    try:
        # Load train and test datasets
        data_dir = get_data_dir()
        train_path = data_dir / 'train_dataset.csv'
        test_path = data_dir / 'test_dataset.csv'
        
        if not train_path.exists() or not test_path.exists():
            raise HTTPException(
                status_code=404,
                detail='Train or test dataset not found. Please upload dataset first.',
            )
        
        train = load_dataset('train_dataset.csv')
        test = load_dataset('test_dataset.csv')
        
        # Determine ARIMAX order
        # Priority: 1) Request order, 2) Saved order, 3) Default (1,1,0)
        order = None
        if request is not None and request.p is not None and request.d is not None and request.q is not None:
            order = (request.p, request.d, request.q)
        else:
            # Try to load saved order
            saved_order = load_arimax_order_metadata()
            if saved_order:
                order = saved_order
            else:
                # Default order
                order = (1, 1, 0)
        
        # Validate order
        if order[0] < 0 or order[1] < 0 or order[2] < 0:
            raise HTTPException(
                status_code=400,
                detail='Order parameters (p, d, q) must be non-negative integers',
            )
        
        # Step 1: Train ARIMAX
        arimax_res, fitted_train, residual_train = train_arimax(train, order=order)
        
        # Save residual for LSTM training
        residual_train = residual_train.dropna()
        residual_train.to_csv(str(data_dir / 'residual_train.csv'))
        
        # Step 2: Calculate ARIMAX MAPE on test set
        y_true_test = test['wave_height'].values
        arimax_forecast = arimax_res.get_forecast(steps=len(test), exog=test[['wind_speed']])
        arimax_pred_test = arimax_forecast.predicted_mean.values
        arimax_metrics = calculate_metrics(y_true_test, arimax_pred_test)
        arimax_mape = arimax_metrics['mape']
        
        # Step 3: Train LSTM on residuals
        if len(residual_train) == 0:
            raise ValueError('Residual training data is empty')
        
        model_lstm, scaler = train_lstm_residual(
            residual_train.iloc[:, 0] if residual_train.ndim > 1 else residual_train,
            window=12,
            lstm_units=18,
            epochs=200,
            batch_size=16,
            patience=10,
        )
        
        # Clear model cache since models have been retrained
        clear_model_cache()
        
        # Reload models to cache
        load_models_to_cache()
        
        # Calculate LSTM training metrics (optional)
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
            'arimax_mape': float(arimax_mape),
            'hybrid_mape': float(lstm_metrics['mape']),
            'order': {
                'p': order[0],
                'd': order[1],
                'q': order[2],
            },
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f'Training error: {str(e)}\nTraceback: {traceback.format_exc()}'
        raise HTTPException(status_code=500, detail=error_detail)


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
            },
            'hybrid': {
                'mape': hybrid_metrics['mape'],
            },
            'results': results_detail,  # Add detailed results
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Evaluation error: {str(e)}')


class ARIMAXOrderRequest(BaseModel):
    """Request model for ARIMAX order evaluation."""
    orders: list[list[int]]  # List of [p, d, q] lists


@app.post('/evaluate/arimax-models')
async def evaluate_arimax_models(request: ARIMAXOrderRequest):
    """
    Evaluate multiple ARIMAX models with different (p, d, q) orders on test set.
    
    This endpoint trains and evaluates multiple ARIMAX models to compare their performance.
    Returns predictions and MAPE for each model.
    
    Args:
        request: Request body with list of [p, d, q] orders to evaluate
        
    Returns:
        Dictionary with results for each model including predictions and MAPE
    """
    try:
        # Load train and test datasets
        data_dir = get_data_dir()
        train_path = data_dir / 'train_dataset.csv'
        test_path = data_dir / 'test_dataset.csv'
        
        if not train_path.exists() or not test_path.exists():
            raise HTTPException(
                status_code=404,
                detail='Train or test dataset not found. Please upload dataset first.',
            )
        
        train = load_dataset('train_dataset.csv')
        test = load_dataset('test_dataset.csv')
        
        y_true = test['wave_height'].values
        
        results = {}
        
        # Evaluate each model combination
        parameter_evaluations = []
        all_model_results = {}
        
        # Set seed untuk reproducibility
        np.random.seed(42)
        
        for order_list in request.orders:
            if len(order_list) != 3:
                continue
            p, d, q = order_list
            order = (p, d, q)
            model_name = f'ARIMAX({p},{d},{q})'
            
            try:
                # Train ARIMAX model with this order
                arimax_res, _, _ = train_arimax(train, order=order)
                
                # Get model summary for parameter evaluation
                summary = arimax_res.summary()
                
                # Extract parameters from model
                params = arimax_res.params
                std_errors = arimax_res.bse
                z_values = arimax_res.tvalues
                p_values = arimax_res.pvalues
                
                # Check stability (AR parameters)
                # Get AR parameters (ar.L1, ar.L2, etc.)
                ar_params = []
                for i in range(1, p + 1):
                    param_name = f'ar.L{i}'
                    if param_name in params.index:
                        ar_params.append(float(params[param_name]))
                
                # Check invertibility (MA parameters)
                # Get MA parameters (ma.L1, ma.L2, etc.)
                ma_params = []
                for i in range(1, q + 1):
                    param_name = f'ma.L{i}'
                    if param_name in params.index:
                        ma_params.append(float(params[param_name]))
                
                # Check stability: all AR roots should be inside unit circle
                # For simple case, check if |param| < 1
                is_stable = all(abs(param) < 1 for param in ar_params) if ar_params else True
                
                # Check invertibility: all MA roots should be inside unit circle
                # For simple case, check if |param| < 1
                is_invertible = all(abs(param) < 1 for param in ma_params) if ma_params else True
                
                # Check significance: |z-value| > 1.96 for 95% confidence
                # Only check AR, MA, and exogenous parameters (not constant/intercept)
                significant_params = []
                for param_name in z_values.index:
                    # Check AR, MA, and exogenous parameters (skip constant/intercept)
                    if param_name.startswith('ar.') or param_name.startswith('ma.') or param_name.startswith('x'):
                        significant_params.append(abs(z_values[param_name]) > 1.96)
                is_significant = all(significant_params) if significant_params else True
                
                # Determine status
                status = 'Diterima'
                alasan = []
                if not is_stable:
                    status = 'Ditolak'
                    alasan.append('Parameter AR tidak stabil (|φ| ≥ 1)')
                if not is_invertible:
                    status = 'Ditolak'
                    alasan.append('Parameter MA tidak invertible (|θ| ≥ 1)')
                if not is_significant:
                    status = 'Ditolak'
                    alasan.append('Parameter tidak signifikan (|z| < 1.96)')
                
                # Get AIC and BIC
                aic = float(arimax_res.aic) if hasattr(arimax_res, 'aic') else None
                bic = float(arimax_res.bic) if hasattr(arimax_res, 'bic') else None
                
                # Store parameter evaluation
                parameter_evaluations.append({
                    'model': model_name,
                    'p': p,
                    'd': d,
                    'q': q,
                    'stability': is_stable,
                    'invertibility': is_invertible,
                    'significance': is_significant,
                    'aic': round(aic, 2) if aic is not None else None,
                    'bic': round(bic, 2) if bic is not None else None,
                    'status': status,
                    'alasan': 'Semua kriteria terpenuhi' if not alasan else '; '.join(alasan),
                })
                
                # Store model result for later use
                all_model_results[model_name] = {
                    'model': arimax_res,
                    'params': params,
                    'std_errors': std_errors,
                    'z_values': z_values,
                    'p_values': p_values,
                    'aic': aic,
                    'bic': bic,
                    'log_likelihood': float(arimax_res.llf) if hasattr(arimax_res, 'llf') else None,
                    'sigma2': float(arimax_res.sigma2) if hasattr(arimax_res, 'sigma2') else None,
                    'n_obs': int(arimax_res.nobs) if hasattr(arimax_res, 'nobs') else None,
                }
                
                # Predict on test set
                arimax_forecast = arimax_res.get_forecast(steps=len(test), exog=test[['wind_speed']])
                arimax_pred = arimax_forecast.predicted_mean.values
                
                # Calculate metrics
                metrics = calculate_metrics(y_true, arimax_pred)
                
                # Store results
                results[model_name] = {
                    'mape': float(metrics['mape']),
                    'predictions': [float(pred) for pred in arimax_pred],
                }
            except Exception as e:
                # If model training/prediction fails, skip this model
                parameter_evaluations.append({
                    'model': model_name,
                    'p': p,
                    'd': d,
                    'q': q,
                    'stability': False,
                    'invertibility': False,
                    'significance': False,
                    'aic': None,
                    'bic': None,
                    'status': 'Ditolak',
                    'alasan': str(e),
                })
                results[model_name] = {
                    'mape': float('inf'),
                    'predictions': [],
                    'error': str(e),
                }
        
        # Format results for response
        # Get actual values
        actual_values = [float(val) for val in y_true]
        
        # Prepare test results table data
        test_results = []
        # Find max length, handling case when no predictions exist
        prediction_lengths = [len(r['predictions']) for r in results.values() if r['predictions']]
        max_length = max(len(actual_values), max(prediction_lengths) if prediction_lengths else 0)
        
        for i in range(max_length):
            row = {
                'nomor': i + 1,
                'ketinggian_gelombang': actual_values[i] if i < len(actual_values) else None,
            }
            
            # Add predictions for each model
            for model_name, model_result in results.items():
                if model_result['predictions'] and i < len(model_result['predictions']):
                    # Convert model name to key format: ARIMAX(0,1,1) -> arimax_0_1_1
                    key = model_name.lower().replace('(', '_').replace(')', '').replace(',', '_')
                    row[key] = model_result['predictions'][i]
            
            test_results.append(row)
        
        # Prepare model metrics - ONLY include accepted models
        # Filter parameter evaluations to get only accepted models
        accepted_models = {
            eval['model']: eval
            for eval in parameter_evaluations
            if eval.get('status') == 'Diterima'
        }
        
        model_metrics = [
            {
                'model': model_name,
                'mape': result['mape'],
            }
            for model_name, result in results.items()
            if model_name in accepted_models  # Only include accepted models
        ]
        
        # Find best model based on MAPE - ONLY from accepted models
        best_model = min(model_metrics, key=lambda x: x['mape']) if model_metrics else None
        best_model_summary = None
        parameter_estimations = []
        model_summary = None
        
        if best_model and best_model['model'] in all_model_results:
            best_model_name = best_model['model']
            best_model_result = all_model_results[best_model_name]
            
            # Create best model summary
            best_model_summary = {
                'model': best_model_name,
                'mape': best_model['mape'],
                'description': f"Model {best_model_name} menunjukkan performa terbaik dengan MAPE terendah ({best_model['mape']:.2f}%). Model ini memiliki akurasi prediksi yang tinggi dan cocok untuk digunakan dalam prediksi tinggi gelombang laut.",
            }
            
            # Extract parameter estimations for best model
            params = best_model_result['params']
            std_errors = best_model_result['std_errors']
            z_values = best_model_result['z_values']
            p_values = best_model_result['p_values']
            
            for param_name in params.index:
                parameter_estimations.append({
                    'parameter': param_name,
                    'estimasi': round(float(params[param_name]), 4),
                    'std_error': round(float(std_errors[param_name]) if param_name in std_errors.index else 0, 4),
                    'z_value': round(float(z_values[param_name]) if param_name in z_values.index else 0, 2),
                    'p_value': round(float(p_values[param_name]) if param_name in p_values.index else 1, 4),
                })
            
            # Create model summary
            model_summary = {
                'model': best_model_name,
                'aic': round(best_model_result['aic'], 2) if best_model_result['aic'] is not None else 0,
                'bic': round(best_model_result['bic'], 2) if best_model_result['bic'] is not None else 0,
                'log_likelihood': round(best_model_result['log_likelihood'], 2) if best_model_result['log_likelihood'] is not None else 0,
                'sigma2': round(best_model_result['sigma2'], 4) if best_model_result['sigma2'] is not None else 0,
                'total_observations': best_model_result['n_obs'] if best_model_result['n_obs'] is not None else 0,
            }
        
        return {
            'status': 'success',
            'parameter_evaluations': parameter_evaluations,
            'parameter_estimations': parameter_estimations,
            'model_summary': model_summary,
            'test_results': test_results,
            'model_metrics': model_metrics,
            'best_model_summary': best_model_summary,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Evaluation error: {str(e)}')


@app.post('/predict', response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Make predictions using trained models (with caching for performance).

    Args:
        request: Prediction request with wind_speed and n_steps

    Returns:
        Predictions for wave height
    """
    try:
        # Try to use cached models, fallback to loading if not cached
        arimax_res = _model_cache['arimax']
        model_lstm = _model_cache['lstm']
        scaler = _model_cache['scaler']
        seed = _model_cache['residual_seed']
        
        # If models not cached, load them
        if arimax_res is None or model_lstm is None or scaler is None:
            arimax_res = load_arimax_model()
            model_lstm = load_lstm_model()
            scaler = load_residual_scaler()
            
            # Cache them
            _model_cache['arimax'] = arimax_res
            _model_cache['lstm'] = model_lstm
            _model_cache['scaler'] = scaler
            
            # Load and cache residual seed
            data_dir = get_data_dir()
            residual_path = data_dir / 'residual_train.csv'
            if residual_path.exists():
                residual_train = pd.read_csv(residual_path, index_col=0, parse_dates=True)
                resid_vals = residual_train.values.reshape(-1, 1) if residual_train.ndim > 1 else residual_train.values.reshape(-1, 1)
                resid_scaled = scaler.transform(resid_vals)
                seed = resid_scaled[-12:].reshape(1, 12, 1)
                _model_cache['residual_seed'] = seed
        
        # Use cached seed if available
        if seed is None:
            data_dir = get_data_dir()
            residual_path = data_dir / 'residual_train.csv'
            if not residual_path.exists():
                raise FileNotFoundError(f"Residual training data not found: {residual_path}")
            residual_train = pd.read_csv(residual_path, index_col=0, parse_dates=True)
            resid_vals = residual_train.values.reshape(-1, 1) if residual_train.ndim > 1 else residual_train.values.reshape(-1, 1)
            resid_scaled = scaler.transform(resid_vals)
            seed = resid_scaled[-12:].reshape(1, 12, 1)
            _model_cache['residual_seed'] = seed

        n_steps = request.n_steps

        # Prepare exogenous variables
        if request.wind_speed is None:
            # Use cached last wind speed if available
            if _model_cache['last_wind_speed'] is not None:
                last_wind_speed = _model_cache['last_wind_speed']
            else:
                # Load train dataset and cache
                train = load_dataset('train_dataset.csv')
                _model_cache['train_dataset'] = train
                last_wind_speed = float(train['wind_speed'].iloc[-1])
                _model_cache['last_wind_speed'] = last_wind_speed
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

