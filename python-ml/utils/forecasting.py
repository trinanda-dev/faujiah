"""Forecasting utilities for ARIMAX and LSTM predictions."""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import joblib
from pathlib import Path
import tensorflow as tf


def get_models_dir() -> Path:
    """Get the models directory path."""
    return Path(__file__).parent.parent / 'models'


def create_sequences(arr: np.ndarray, window: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Create sequences for LSTM training.

    Args:
        arr: Array of shape (n_samples, 1)
        window: Window size

    Returns:
        Tuple of (X, y) arrays
    """
    X, y = [], []
    for i in range(len(arr) - window):
        X.append(arr[i:i+window, 0])
        y.append(arr[i+window, 0])
    X = np.array(X).reshape(-1, window, 1)
    y = np.array(y)
    return X, y


def predict_residuals_iterative(
    model_lstm: tf.keras.Model,
    scaler: MinMaxScaler,
    seed: np.ndarray,
    n_steps: int,
    window: int = 12,
) -> np.ndarray:
    """
    Predict residuals iteratively using LSTM.

    Args:
        model_lstm: Trained LSTM model
        scaler: Fitted scaler for residuals
        seed: Last WINDOW residuals from training (scaled)
        n_steps: Number of steps to predict
        window: Window size used in training

    Returns:
        Array of predicted residuals (unscaled)
    """
    current_seq = seed.copy().reshape(1, window, 1)
    predicted_resid_scaled = []

    # Batch prediction for better performance (predict all at once if possible)
    # For iterative prediction, we still need to do it step by step
    # but we can optimize by using predict_on_batch for single predictions
    for _ in range(n_steps):
        # Use predict_on_batch for slightly better performance
        p_scaled = model_lstm.predict_on_batch(current_seq)[0, 0]
        predicted_resid_scaled.append(p_scaled)
        # Update current_seq: shift left, append p_scaled
        new_seq = np.append(current_seq.flatten()[1:], p_scaled)
        current_seq = new_seq.reshape(1, window, 1)

    predicted_resid_scaled = np.array(predicted_resid_scaled).reshape(-1, 1)
    predicted_resid = scaler.inverse_transform(predicted_resid_scaled).flatten()
    return predicted_resid


def load_arimax_model() -> object:
    """
    Load ARIMAX model from disk.

    Returns:
        Loaded ARIMAX model (statsmodels SARIMAXResults object)
    """
    models_dir = get_models_dir()
    model_path = models_dir / 'arimax_model.pkl'
    if not model_path.exists():
        raise FileNotFoundError(f"ARIMAX model not found: {model_path}")
    # statsmodels .save() uses pickle, so joblib.load() works
    return joblib.load(model_path)


def load_lstm_model() -> tf.keras.Model:
    """
    Load LSTM model from disk.

    Returns:
        Loaded LSTM model
    """
    models_dir = get_models_dir()
    model_path = models_dir / 'lstm_residual_model.h5'
    if not model_path.exists():
        raise FileNotFoundError(f"LSTM model not found: {model_path}")
    # Use compile=False to avoid deserialization issues with metrics
    # We don't need compilation for inference/prediction
    return tf.keras.models.load_model(model_path, compile=False)


def load_residual_scaler() -> MinMaxScaler:
    """
    Load residual scaler from disk.

    Returns:
        Loaded scaler
    """
    models_dir = get_models_dir()
    scaler_path = models_dir / 'residual_scaler.save'
    if not scaler_path.exists():
        raise FileNotFoundError(f"Residual scaler not found: {scaler_path}")
    return joblib.load(scaler_path)

