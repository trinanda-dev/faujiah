"""
Utility untuk Preprocessing Data - Persiapan Data untuk Training

Modul ini menyediakan fungsi-fungsi untuk:
1. Membersihkan dan menormalisasi data numerik
2. Memuat dan membersihkan data dari file Excel
3. Mengecek stasioneritas data (untuk ARIMAX)
4. Membagi data menjadi training dan test set
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller


def clean_numeric(col: pd.Series) -> pd.Series:
    """
    Membersihkan kolom numerik dengan menghapus koma, memperbaiki multiple dots, dan mengkonversi ke numerik.
    
    Fungsi ini menangani berbagai format angka yang mungkin ada di data:
    - Mengganti koma (,) dengan titik (.) sebagai pemisah desimal
    - Menghapus karakter non-numerik (kecuali titik dan minus)
    - Memperbaiki angka dengan multiple dots (contoh: "1.2.3" -> "1.23")
    
    Args:
        col: Pandas Series yang berisi data numerik (dalam format string atau campuran)

    Returns:
        Pandas Series yang sudah dibersihkan dan dikonversi ke numerik
    """
    # Konversi ke string dan hapus whitespace
    col = col.astype(str).str.strip()
    # Ganti koma dengan titik (format Eropa -> format standar)
    col = col.str.replace(',', '.', regex=False)
    # Hapus semua karakter selain angka, titik, dan minus
    col = col.str.replace(r'[^0-9\.\-]', '', regex=True)

    def fix_multi_dot(x: str) -> str:
        """
        Memperbaiki angka dengan multiple dots.
        
        Contoh:
        - "1.2.3" -> "1.23"
        - "1.2" -> "1.2" (tidak diubah)
        """
        if x.count('.') <= 1:
            return x
        # Jika ada lebih dari 1 titik, gabungkan bagian setelah titik pertama
        parts = x.split('.')
        return parts[0] + ''.join(parts[1:])

    col = col.apply(fix_multi_dot)
    # Konversi ke numerik, nilai yang tidak valid menjadi NaN
    return pd.to_numeric(col, errors='coerce')


def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """
    Memuat file Excel dan membersihkan data.
    
    Fungsi ini melakukan:
    1. Membaca file Excel dengan kolom timestamp, wave_height, wind_speed
    2. Membersihkan data numerik (menghapus koma, multiple dots, dll)
    3. Mengisi missing values dengan interpolasi berbasis waktu
    4. Mengurutkan data berdasarkan timestamp
    5. Menggunakan timestamp sebagai index
    
    Args:
        file_path: Path ke file Excel yang akan dimuat

    Returns:
        DataFrame yang sudah dibersihkan dengan timestamp sebagai index
    """
    # Baca file Excel dan parse kolom timestamp sebagai datetime
    df = pd.read_excel(file_path, parse_dates=['timestamp'])
    # Pastikan nama kolom sesuai (timestamp, wave_height, wind_speed)
    df.columns = ['timestamp', 'wave_height', 'wind_speed']
    # Konversi timestamp ke datetime (jika belum)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    # Urutkan berdasarkan timestamp dan gunakan sebagai index
    df = df.sort_values('timestamp').set_index('timestamp')

    # Bersihkan kolom numerik (menghapus koma, multiple dots, dll)
    df['wave_height'] = clean_numeric(df['wave_height'])
    df['wind_speed'] = clean_numeric(df['wind_speed'])

    # Isi missing values dengan interpolasi berbasis waktu
    # Interpolasi ini menggunakan nilai sebelum dan sesudah untuk mengisi nilai yang hilang
    df = df.interpolate(method='time')

    return df


def check_stationarity(series: pd.Series) -> dict:
    """
    Mengecek stasioneritas data menggunakan Augmented Dickey-Fuller (ADF) test.
    
    Data time series dikatakan stasioner jika:
    - Mean tidak berubah seiring waktu
    - Variance tidak berubah seiring waktu
    - Tidak ada trend atau pola musiman
    
    Model ARIMAX memerlukan data yang stasioner. Jika data tidak stasioner,
    perlu dilakukan differencing (d > 0).
    
    Args:
        series: Data time series yang akan dicek (Pandas Series)

    Returns:
        Dictionary berisi:
        - adf_statistic: Nilai statistik ADF
        - p_value: P-value dari test (jika < 0.05, data stasioner)
        - critical_values: Nilai kritis untuk berbagai tingkat signifikansi
        - is_stationary: Boolean, True jika data stasioner (p < 0.05)
    """
    # Lakukan ADF test (hapus NaN terlebih dahulu)
    adf_res = adfuller(series.dropna())
    return {
        'adf_statistic': float(adf_res[0]),  # Statistik ADF
        'p_value': float(adf_res[1]),  # P-value (jika < 0.05, data stasioner)
        'critical_values': {k: float(v) for k, v in adf_res[4].items()},  # Nilai kritis
        'is_stationary': adf_res[1] < 0.05,  # True jika stasioner (p < 0.05)
    }


def split_train_test(df: pd.DataFrame, train_ratio: float = 0.8) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Membagi data menjadi training set dan test set (berbasis waktu).
    
    Pembagian dilakukan secara time-based (bukan random) karena data time series
    harus mempertahankan urutan waktu. Data awal digunakan untuk training,
    data akhir digunakan untuk testing.
    
    Proporsi default 70:15:15 (training:validation:test) adalah standar dalam machine learning.
    
    Args:
        df: DataFrame yang akan dibagi
        train_ratio: Proporsi data training (default: 0.8 = 80%)

    Returns:
        Tuple berisi (train_df, test_df)
        - train_df: DataFrame untuk training (80% data awal)
        - test_df: DataFrame untuk testing (20% data akhir)
    """
    n = len(df)  # Total jumlah data
    train_size = int(train_ratio * n)  # Ukuran data training (80%)
    # Ambil data awal untuk training
    train = df.iloc[:train_size].copy()
    # Ambil data akhir untuk testing
    test = df.iloc[train_size:].copy()
    return train, test


def split_train_validation_test(
    df: pd.DataFrame,
    train_ratio: float = 0.7,
    validation_ratio: float = 0.15,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Membagi data menjadi training set, validation set, dan test set (berbasis waktu).
    
    Pembagian dilakukan secara time-based (bukan random) karena data time series
    harus mempertahankan urutan waktu. Data awal untuk training, data tengah untuk validation,
    data akhir untuk testing.
    
    Proporsi default 70:15:15 (training:validation:test) adalah standar dalam machine learning
    dengan data validasi untuk tuning hyperparameter dan early stopping.
    
    Args:
        df: DataFrame yang akan dibagi
        train_ratio: Proporsi data training (default: 0.7 = 70%)
        validation_ratio: Proporsi data validation (default: 0.15 = 15%)

    Returns:
        Tuple berisi (train_df, validation_df, test_df)
        - train_df: DataFrame untuk training (70% data awal)
        - validation_df: DataFrame untuk validation (15% data tengah)
        - test_df: DataFrame untuk testing (15% data akhir)
    """
    n = len(df)  # Total jumlah data
    train_size = int(train_ratio * n)  # Ukuran data training (70%)
    validation_size = int(validation_ratio * n)  # Ukuran data validation (15%)
    # Ambil data awal untuk training
    train = df.iloc[:train_size].copy()
    # Ambil data tengah untuk validation
    validation = df.iloc[train_size:train_size + validation_size].copy()
    # Ambil data akhir untuk testing
    test = df.iloc[train_size + validation_size:].copy()
    return train, validation, test
