"""Modul untuk training model ARIMAX."""

import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import joblib
from pathlib import Path
from utils.dataset import save_dataset, get_models_dir


def train_arimax(
    train: pd.DataFrame,
    order: tuple[int, int, int] = (1, 0, 0),
    save_path: str | None = None,
) -> tuple[object, pd.Series, pd.Series]:
    """
    Melatih model ARIMAX pada data training.
    
    ARIMAX adalah model time series yang menggabungkan ARIMA dengan variabel eksogen (kecepatan angin).
    Model ini digunakan untuk memprediksi tinggi gelombang berdasarkan data historis dan kecepatan angin.

    Args:
        train: DataFrame training yang berisi kolom 'wave_height' (tinggi gelombang) dan 'wind_speed' (kecepatan angin)
        order: Orde ARIMA (p, d, q) dimana:
               - p: jumlah lag observasi (autoregressive)
               - d: derajat differencing (untuk membuat data stasioner)
               - q: jumlah lag error (moving average)
        save_path: Path opsional untuk menyimpan model (default: models/arimax_model.pkl)

    Returns:
        Tuple berisi (model_terlatih, nilai_fitted, residual)
        - model_terlatih: Model ARIMAX yang sudah di-fit
        - nilai_fitted: Nilai prediksi model pada data training
        - residual: Selisih antara nilai aktual dan prediksi (untuk training LSTM)
    """
    # Validasi: pastikan kolom yang diperlukan ada
    if 'wave_height' not in train.columns or 'wind_speed' not in train.columns:
        raise ValueError("Training data must contain 'wave_height' and 'wind_speed' columns")

    # Set seed untuk reproducibility (menggunakan numpy random seed)
    # Catatan: statsmodels menggunakan numpy random untuk optimasi, jadi set seed di sini
    np.random.seed(42)
    
    # Membuat dan melatih model SARIMAX
    # SARIMAX adalah versi ARIMAX yang mendukung seasonal patterns
    arimax = SARIMAX(
        train['wave_height'],  # Variabel dependen: tinggi gelombang
        order=order,  # Orde ARIMA (p, d, q)
        exog=train[['wind_speed']],  # Variabel eksogen: kecepatan angin
        enforce_stationarity=False,  # Tidak memaksa stasioneritas (sudah di-handle di preprocessing)
        enforce_invertibility=False,  # Tidak memaksa invertibility
    )
    # Fit model ke data training
    # Menggunakan method='lbfgs' dengan maxiter yang lebih tinggi untuk konsistensi
    arimax_res = arimax.fit(disp=False, method='lbfgs', maxiter=1000)

    # Menghitung nilai fitted (prediksi model pada data training)
    fitted_train = arimax_res.fittedvalues
    
    # Menghitung residual (selisih aktual - prediksi)
    # Residual ini akan digunakan untuk training model LSTM
    residual_train = train['wave_height'] - fitted_train
    residual_train = residual_train.dropna()  # Hapus nilai NaN

    # Menyimpan model ke file
    models_dir = get_models_dir()
    models_dir.mkdir(exist_ok=True)  # Buat folder jika belum ada
    if save_path is None:
        save_path = str(models_dir / 'arimax_model.pkl')
    # Simpan model menggunakan method .save() dari statsmodels (menggunakan pickle)
    arimax_res.save(save_path)
    
    # Simpan order model ke file metadata untuk referensi
    # Ini memungkinkan kita membandingkan order saat evaluasi
    import json
    metadata_path = models_dir / 'arimax_model_metadata.json'
    metadata = {
        'order': {
            'p': order[0],
            'd': order[1],
            'q': order[2],
        },
        'order_tuple': order,
    }
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f)

    return arimax_res, fitted_train, residual_train

