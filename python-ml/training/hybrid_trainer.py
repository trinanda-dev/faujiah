"""Modul untuk training model LSTM pada residual ARIMAX (bagian dari model Hybrid)."""

import random
import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import joblib
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping
from pathlib import Path
import json
from utils.forecasting import create_sequences
from utils.dataset import get_models_dir


def train_lstm_residual(
    residual_train: pd.Series,
    window: int = 12,
    lstm_units: int = 18,
    epochs: int = 10,
    batch_size: int = 16,
    patience: int = 5,
    seed: int = 42,
    residual_val: pd.Series | None = None,
    quick_eval: bool = False,  # Jika True, gunakan epochs lebih sedikit untuk evaluasi cepat
) -> tuple[tf.keras.Model, MinMaxScaler, dict]:
    """
    Melatih model LSTM pada residual dari model ARIMAX.
    
    Model Hybrid bekerja dengan cara:
    1. ARIMAX memprediksi tinggi gelombang
    2. LSTM memprediksi residual (error) dari ARIMAX
    3. Prediksi final = Prediksi ARIMAX + Prediksi Residual LSTM
    
    Pendekatan ini memanfaatkan kelebihan ARIMAX untuk pola linear dan LSTM untuk pola non-linear.

    Args:
        residual_train: Residual dari model ARIMAX (selisih aktual - prediksi ARIMAX)
        window: Ukuran window untuk sequence (berapa banyak data historis yang digunakan)
        lstm_units: Jumlah unit/neuron di layer LSTM
        epochs: Maksimum jumlah epoch untuk training
        batch_size: Ukuran batch untuk training (berapa banyak data diproses sekaligus)
        patience: Jumlah epoch tanpa improvement sebelum early stopping
        seed: Random seed untuk reproducibility
        residual_val: Residual validation data (opsional). Jika tersedia, digunakan untuk early stopping
        quick_eval: Jika True, gunakan epochs lebih sedikit (10) untuk evaluasi cepat saat seed search

    Returns:
        Tuple berisi (model_lstm_terlatih, scaler_yang_digunakan, training_history)
        - model_lstm_terlatih: Model LSTM yang sudah di-train untuk memprediksi residual
        - scaler: Scaler yang digunakan untuk normalisasi (diperlukan saat prediksi)
        - training_history: Dictionary berisi history training (loss, val_loss per epoch)
    """
    # Siapkan data residual: ubah ke format numpy array dengan shape (n_samples, 1)
    resid_vals = residual_train.values.reshape(-1, 1)

    # Normalisasi residual ke range [0, 1] menggunakan MinMaxScaler
    # Normalisasi penting untuk training neural network agar lebih stabil
    scaler = MinMaxScaler(feature_range=(0, 1))
    resid_scaled = scaler.fit_transform(resid_vals)

    # Buat sequence data untuk LSTM
    # LSTM membutuhkan data dalam bentuk sequence (X, y) dimana:
    # - X: window data sebelumnya
    # - y: nilai yang akan diprediksi
    X_train, y_train = create_sequences(resid_scaled, window)

    # Siapkan validation data jika tersedia
    X_val = None
    y_val = None
    validation_data = None
    monitor_metric = 'loss'  # Default monitor training loss
    
    if residual_val is not None and len(residual_val) > 0:
        # Normalisasi validation residual menggunakan scaler yang sama dengan training
        resid_val_vals = residual_val.values.reshape(-1, 1) if residual_val.ndim > 1 else residual_val.values.reshape(-1, 1)
        resid_val_scaled = scaler.transform(resid_val_vals)
        X_val, y_val = create_sequences(resid_val_scaled, window)
        validation_data = (X_val, y_val)
        monitor_metric = 'val_loss'  # Monitor validation loss jika validation data tersedia

    # Set ALL random seeds untuk reproducibility (PENTING: SEBELUM membuat model!)
    # Ini memastikan hasil training konsisten setiap kali dijalankan
    random.seed(seed)  # Python random seed
    np.random.seed(seed)  # NumPy random seed (untuk operasi NumPy)
    tf.random.set_seed(seed)  # TensorFlow random seed (untuk operasi TensorFlow)
    
    # Set environment variable untuk reproducibility
    os.environ['PYTHONHASHSEED'] = str(seed)
    
    # Enable TensorFlow determinism (jika tersedia)
    # Ini memastikan operasi TensorFlow deterministik
    try:
        tf.config.experimental.enable_op_determinism()
    except (AttributeError, ValueError):
        # TensorFlow determinism tidak tersedia di versi lama atau sudah di-set
        pass
    
    # Bangun arsitektur model LSTM
    model_lstm = Sequential([
        # Layer LSTM dengan lstm_units neuron
        # input_shape: (window_size, 1) - window data dengan 1 fitur
        LSTM(lstm_units, input_shape=(window, 1)),
        # Layer Dense output dengan 1 neuron (untuk prediksi 1 nilai residual)
        Dense(1),
    ])
    # Compile model dengan optimizer Adam dan loss function MSE (Mean Squared Error)
    model_lstm.compile(optimizer='adam', loss='mse')

    # Setup Early Stopping untuk mencegah overfitting
    # Akan berhenti training jika loss tidak membaik selama 'patience' epoch
    # Jika validation data tersedia, monitor validation loss (lebih efektif)
    es = EarlyStopping(
        monitor=monitor_metric,  # Monitor loss atau val_loss tergantung ketersediaan validation data
        patience=patience,  # Tunggu 'patience' epoch tanpa improvement
        restore_best_weights=True,  # Kembalikan ke weight terbaik saat early stopping
        verbose=0,  # Tidak tampilkan log
    )
    # Adjust epochs untuk quick evaluation (seed search)
    actual_epochs = 10 if quick_eval else epochs
    actual_patience = 5 if quick_eval else patience
    
    # Update early stopping patience untuk quick eval
    if quick_eval:
        es = EarlyStopping(
            monitor=monitor_metric,
            patience=actual_patience,
            restore_best_weights=True,
            verbose=0,
        )
    
    # Training model LSTM
    # Menggunakan history untuk menyimpan loss per epoch
    history = model_lstm.fit(
        X_train,  # Input features (sequences)
        y_train,  # Target values (nilai residual yang akan diprediksi)
        epochs=actual_epochs,  # Maksimum jumlah epoch (dikurangi untuk quick eval)
        batch_size=batch_size,  # Ukuran batch
        validation_data=validation_data,  # Validation data (jika tersedia)
        callbacks=[es],  # Gunakan early stopping callback
        verbose=0,  # Tidak tampilkan log training
    )

    # Simpan model dan scaler ke file
    models_dir = get_models_dir()
    models_dir.mkdir(exist_ok=True)  # Buat folder jika belum ada
    # Simpan model LSTM ke format .h5 (format Keras/TensorFlow)
    model_lstm.save(str(models_dir / 'lstm_residual_model.h5'))
    # Simpan scaler menggunakan joblib (diperlukan untuk denormalisasi saat prediksi)
    joblib.dump(scaler, str(models_dir / 'residual_scaler.save'))

    # Extract training history
    training_history = {
        'loss': [float(x) for x in history.history['loss']],
        'epochs_trained': len(history.history['loss']),
        'max_epochs': actual_epochs,
        'early_stopped': len(history.history['loss']) < actual_epochs,
    }
    
    # Add validation loss if available
    if 'val_loss' in history.history:
        training_history['val_loss'] = [float(x) for x in history.history['val_loss']]
    
    # Create detailed epoch-by-epoch data
    training_history['epochs'] = []
    for epoch in range(len(history.history['loss'])):
        epoch_data = {
            'epoch': epoch + 1,
            'loss': float(history.history['loss'][epoch]),
        }
        if 'val_loss' in history.history:
            epoch_data['val_loss'] = float(history.history['val_loss'][epoch])
        training_history['epochs'].append(epoch_data)
    
    # Save training history to JSON file
    history_path = models_dir / 'lstm_training_history.json'
    with open(history_path, 'w') as f:
        json.dump(training_history, f, indent=2)

    return model_lstm, scaler, training_history

