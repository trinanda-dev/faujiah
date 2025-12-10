"""Modul untuk training model LSTM pada residual ARIMAX (bagian dari model Hybrid)."""

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

    Returns:
        Tuple berisi (model_lstm_terlatih, scaler_yang_digunakan)
        - model_lstm_terlatih: Model LSTM yang sudah di-train untuk memprediksi residual
        - scaler: Scaler yang digunakan untuk normalisasi (diperlukan saat prediksi)
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

    # Bangun arsitektur model LSTM
    tf.random.set_seed(seed)  # Set random seed untuk reproducibility
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
    es = EarlyStopping(
        monitor='loss',  # Monitor loss function
        patience=patience,  # Tunggu 'patience' epoch tanpa improvement
        restore_best_weights=True,  # Kembalikan ke weight terbaik saat early stopping
        verbose=0,  # Tidak tampilkan log
    )
    # Training model LSTM
    model_lstm.fit(
        X_train,  # Input features (sequences)
        y_train,  # Target values (nilai residual yang akan diprediksi)
        epochs=epochs,  # Maksimum jumlah epoch
        batch_size=batch_size,  # Ukuran batch
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

    return model_lstm, scaler

