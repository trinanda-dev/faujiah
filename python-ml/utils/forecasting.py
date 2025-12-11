"""Forecasting utilities for ARIMAX and LSTM predictions."""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import joblib
from pathlib import Path
import tensorflow as tf


def get_models_dir() -> Path:
    """
    Mendapatkan path direktori models.
    
    Returns:
        Path ke direktori models
    """
    return Path(__file__).parent.parent / 'models'


def create_sequences(arr: np.ndarray, window: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Membuat sequence untuk training LSTM.
    
    Fungsi ini mengubah array data time series menjadi sequence (window) yang digunakan
    untuk training model LSTM. Setiap sequence terdiri dari window data sebagai input (X)
    dan nilai berikutnya sebagai target (y).
    
    Contoh:
        Jika window = 12 dan arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
        Maka:
        - X[0] = [1, 2, 3, ..., 12]  -> y[0] = 13
        - X[1] = [2, 3, 4, ..., 13]  -> y[1] = 14
    
    Args:
        arr: Array dengan shape (n_samples, 1) berisi data time series
        window: Ukuran window (jumlah data sebelumnya yang digunakan untuk prediksi)
    
    Returns:
        Tuple berisi (X, y) dimana:
        - X: Array sequence input dengan shape (n_sequences, window, 1)
        - y: Array target dengan shape (n_sequences,)
    """
    X, y = [], []
    # Loop untuk membuat setiap sequence
    for i in range(len(arr) - window):
        # Ambil window data sebagai input (X)
        X.append(arr[i:i+window, 0])
        # Ambil nilai berikutnya sebagai target (y)
        y.append(arr[i+window, 0])
    # Reshape X menjadi format (n_sequences, window, 1) untuk LSTM
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
    Memprediksi residual secara iteratif menggunakan model LSTM.
    
    Fungsi ini melakukan prediksi residual untuk n_steps ke depan dengan cara iteratif.
    Setiap prediksi menggunakan hasil prediksi sebelumnya sebagai bagian dari input
    untuk prediksi berikutnya (sliding window approach).
    
    Proses:
    1. Mulai dengan seed (window residual terakhir dari training data)
    2. Untuk setiap step:
       - Prediksi residual berikutnya menggunakan current_seq
       - Update current_seq: geser ke kiri, tambahkan prediksi baru di akhir
    3. Inverse transform hasil prediksi (unscale) untuk mendapatkan nilai asli
    
    Args:
        model_lstm: Model LSTM yang sudah dilatih
        scaler: Scaler yang sudah di-fit untuk residual (untuk inverse transform)
        seed: Window residual terakhir dari training data (sudah di-scale)
        n_steps: Jumlah step yang akan diprediksi
        window: Ukuran window yang digunakan saat training (default: 12)
    
    Returns:
        Array residual yang diprediksi (sudah di-unscale, dalam skala asli)
    """
    # Inisialisasi sequence saat ini dengan seed (window terakhir)
    current_seq = seed.copy().reshape(1, window, 1)
    predicted_resid_scaled = []

    # Prediksi iteratif: setiap prediksi menggunakan hasil prediksi sebelumnya
    # Menggunakan predict_on_batch untuk performa yang lebih baik
    for _ in range(n_steps):
        # Prediksi residual berikutnya menggunakan sequence saat ini
        p_scaled = model_lstm.predict_on_batch(current_seq)[0, 0]
        predicted_resid_scaled.append(p_scaled)
        
        # Update sequence: geser ke kiri, tambahkan prediksi baru di akhir
        # Contoh: [1,2,3,4,5,6,7,8,9,10,11,12] -> [2,3,4,5,6,7,8,9,10,11,12,prediksi_baru]
        new_seq = np.append(current_seq.flatten()[1:], p_scaled)
        current_seq = new_seq.reshape(1, window, 1)

    # Convert ke array dan reshape untuk inverse transform
    predicted_resid_scaled = np.array(predicted_resid_scaled).reshape(-1, 1)
    # Inverse transform untuk mendapatkan nilai residual dalam skala asli
    predicted_resid = scaler.inverse_transform(predicted_resid_scaled).flatten()
    return predicted_resid


def load_arimax_model() -> object:
    """
    Memuat model ARIMAX dari disk.
    
    Model ARIMAX disimpan menggunakan statsmodels .save() yang menggunakan pickle,
    sehingga dapat dimuat menggunakan joblib.load().
    
    Returns:
        Model ARIMAX yang sudah dimuat (statsmodels SARIMAXResults object)
    
    Raises:
        FileNotFoundError: Jika file model tidak ditemukan
    """
    models_dir = get_models_dir()
    model_path = models_dir / 'arimax_model.pkl'
    if not model_path.exists():
        raise FileNotFoundError(f"ARIMAX model not found: {model_path}")
    # statsmodels .save() menggunakan pickle, jadi joblib.load() bisa digunakan
    return joblib.load(model_path)


def load_lstm_model() -> tf.keras.Model:
    """
    Memuat model LSTM dari disk.
    
    Model LSTM disimpan dalam format H5 (Keras format).
    Menggunakan compile=False untuk menghindari masalah deserialization dengan metrics.
    Untuk inference/prediction, kompilasi tidak diperlukan.
    
    Returns:
        Model LSTM yang sudah dimuat
    
    Raises:
        FileNotFoundError: Jika file model tidak ditemukan
    """
    models_dir = get_models_dir()
    model_path = models_dir / 'lstm_residual_model.h5'
    if not model_path.exists():
        raise FileNotFoundError(f"LSTM model not found: {model_path}")
    # Gunakan compile=False untuk menghindari masalah deserialization dengan metrics
    # Kompilasi tidak diperlukan untuk inference/prediction
    return tf.keras.models.load_model(model_path, compile=False)


def load_residual_scaler() -> MinMaxScaler:
    """
    Memuat scaler untuk residual dari disk.
    
    Scaler digunakan untuk normalisasi data residual sebelum training LSTM
    dan untuk inverse transform setelah prediksi.
    
    Returns:
        Scaler yang sudah dimuat (MinMaxScaler)
    
    Raises:
        FileNotFoundError: Jika file scaler tidak ditemukan
    """
    models_dir = get_models_dir()
    scaler_path = models_dir / 'residual_scaler.save'
    if not scaler_path.exists():
        raise FileNotFoundError(f"Residual scaler not found: {scaler_path}")
    return joblib.load(scaler_path)

