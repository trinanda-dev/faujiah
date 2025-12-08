"""Hybrid LSTM residual training module."""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import joblib
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping
from pathlib import Path
from utils.forecasting import create_sequences
from utils.dataset import get_models_dir


def train_lstm_residual(
    residual_train: pd.Series,
    window: int = 12,
    lstm_units: int = 18,
    epochs: int = 200,
    batch_size: int = 16,
    patience: int = 10,
    seed: int = 42,
) -> tuple[tf.keras.Model, MinMaxScaler]:
    """
    Train LSTM model on ARIMAX residuals.

    Args:
        residual_train: Training residuals from ARIMAX
        window: Window size for sequences
        lstm_units: Number of LSTM units
        epochs: Maximum number of epochs
        batch_size: Batch size for training
        patience: Early stopping patience
        seed: Random seed

    Returns:
        Tuple of (trained_model, fitted_scaler)
    """
    # Prepare residual data
    resid_vals = residual_train.values.reshape(-1, 1)

    # Normalize residuals
    scaler = MinMaxScaler(feature_range=(0, 1))
    resid_scaled = scaler.fit_transform(resid_vals)

    # Create sequences
    X_train, y_train = create_sequences(resid_scaled, window)

    # Build LSTM model
    tf.random.set_seed(seed)
    model_lstm = Sequential([
        LSTM(lstm_units, input_shape=(window, 1)),
        Dense(1),
    ])
    model_lstm.compile(optimizer='adam', loss='mse')

    # Train with early stopping
    es = EarlyStopping(
        monitor='loss',
        patience=patience,
        restore_best_weights=True,
        verbose=0,
    )
    model_lstm.fit(
        X_train,
        y_train,
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[es],
        verbose=0,
    )

    # Save model and scaler
    models_dir = get_models_dir()
    models_dir.mkdir(exist_ok=True)
    model_lstm.save(str(models_dir / 'lstm_residual_model.h5'))
    joblib.dump(scaler, str(models_dir / 'residual_scaler.save'))

    return model_lstm, scaler

