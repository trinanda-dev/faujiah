"""
Utility untuk Evaluasi Model - Menghitung Metrik Akurasi

Modul ini menyediakan fungsi-fungsi untuk menghitung metrik evaluasi
yang digunakan untuk mengukur akurasi model prediksi.
"""

import numpy as np


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Menghitung MAPE (Mean Absolute Percentage Error).
    
    MAPE mengukur rata-rata persentase error antara nilai aktual dan prediksi.
    Semakin kecil MAPE, semakin baik model.
    
    Formula: MAPE = (1/n) * Σ |(aktual - prediksi) / aktual| * 100
    
    Args:
        y_true: Array nilai aktual (ground truth)
        y_pred: Array nilai prediksi dari model

    Returns:
        Nilai MAPE dalam persen (float)
        Mengembalikan infinity jika semua nilai aktual adalah 0
    """
    # Buat mask untuk menghindari pembagian nol (hanya hitung jika nilai aktual != 0)
    mask = y_true != 0
    if mask.sum() == 0:  # Jika semua nilai aktual adalah 0
        return float('inf')
    # Hitung MAPE hanya untuk nilai yang tidak nol
    # Formula: mean dari |(aktual - prediksi) / aktual| * 100
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Menghitung metrik evaluasi (MAPE saja).
    
    Fungsi ini menghitung semua metrik evaluasi yang digunakan dalam aplikasi.
    Saat ini hanya menghitung MAPE, tetapi dapat ditambahkan metrik lain
    seperti MAE, RMSE, dll.
    
    Args:
        y_true: Array nilai aktual (ground truth)
        y_pred: Array nilai prediksi dari model

    Returns:
        Dictionary berisi metrik evaluasi (saat ini hanya 'mape')
    """
    return {
        'mape': mape(y_true, y_pred),  # Mean Absolute Percentage Error
    }

