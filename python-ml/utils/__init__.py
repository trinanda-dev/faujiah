"""
Modul Utility untuk Preprocessing, Forecasting, dan Evaluasi

Modul ini mengekspor semua fungsi utility yang digunakan dalam aplikasi ML:
1. Preprocessing - pembersihan data, pengecekan stasioneritas, pembagian data
2. Dataset - penyimpanan dan pemuatan dataset
3. Forecasting - prediksi menggunakan model yang sudah dilatih
4. Evaluation - perhitungan metrik akurasi model

Dengan mengimpor dari modul ini, semua fungsi utility dapat diakses dengan mudah.
"""

# Import fungsi-fungsi dari modul preprocessing
# - load_and_clean_data: Memuat dan membersihkan data dari Excel
# - split_train_test: Membagi data menjadi training dan test set
# - check_stationarity: Mengecek stasioneritas data dengan ADF test
from .preprocessing import load_and_clean_data, split_train_test, check_stationarity

# Import fungsi-fungsi dari modul dataset
# - save_dataset: Menyimpan DataFrame ke CSV
# - load_dataset: Memuat DataFrame dari CSV
# - save_uploaded_file: Menyimpan file yang diupload dari Laravel
from .dataset import save_dataset, load_dataset, save_uploaded_file

# Import fungsi-fungsi dari modul forecasting
# - create_sequences: Membuat sequence data untuk LSTM
# - predict_residuals_iterative: Prediksi residual secara iteratif
# - load_arimax_model: Memuat model ARIMAX yang sudah dilatih
# - load_lstm_model: Memuat model LSTM yang sudah dilatih
# - load_residual_scaler: Memuat scaler untuk normalisasi residual
from .forecasting import (
    create_sequences,
    predict_residuals_iterative,
    load_arimax_model,
    load_lstm_model,
    load_residual_scaler,
)

# Import fungsi-fungsi dari modul evaluation
# - mape: Menghitung Mean Absolute Percentage Error
# - calculate_metrics: Menghitung semua metrik evaluasi
from .evaluation import mape, calculate_metrics

# Daftar semua fungsi yang dapat diimpor dari modul ini
# __all__ menentukan apa yang akan di-export saat menggunakan "from utils import *"
__all__ = [
    # Preprocessing functions
    'load_and_clean_data',      # Memuat dan membersihkan data
    'split_train_test',          # Membagi data training dan test
    'check_stationarity',        # Mengecek stasioneritas data
    
    # Dataset functions
    'save_dataset',              # Menyimpan dataset ke CSV
    'load_dataset',              # Memuat dataset dari CSV
    'save_uploaded_file',        # Menyimpan file yang diupload
    
    # Forecasting functions
    'create_sequences',          # Membuat sequence untuk LSTM
    'predict_residuals_iterative',  # Prediksi residual iteratif
    'load_arimax_model',         # Memuat model ARIMAX
    'load_lstm_model',           # Memuat model LSTM
    'load_residual_scaler',      # Memuat scaler residual
    
    # Evaluation functions
    'mape',                      # Menghitung MAPE
    'calculate_metrics',         # Menghitung metrik evaluasi
]

