"""
Utility untuk Menyimpan dan Memuat Dataset

Modul ini menyediakan fungsi-fungsi untuk:
1. Mengelola direktori data dan model
2. Menyimpan dan memuat dataset dalam format CSV
3. Menyimpan file yang diupload dari Laravel
"""

import pandas as pd
import os
from pathlib import Path


def get_data_dir() -> Path:
    """
    Mendapatkan path direktori data.
    
    Direktori data digunakan untuk menyimpan:
    - Dataset yang diupload dari Laravel
    - Dataset yang sudah dibersihkan dan diproses
    
    Returns:
        Path object menuju direktori data (python-ml/data/)
    """
    return Path(__file__).parent.parent / 'data'


def get_models_dir() -> Path:
    """
    Mendapatkan path direktori model.
    
    Direktori model digunakan untuk menyimpan:
    - Model ARIMAX yang sudah dilatih (.pkl)
    - Model LSTM yang sudah dilatih (.h5)
    - Scaler untuk normalisasi (.save)
    
    Returns:
        Path object menuju direktori model (python-ml/models/)
    """
    return Path(__file__).parent.parent / 'models'


def save_dataset(df: pd.DataFrame, filename: str) -> str:
    """
    Menyimpan DataFrame ke file CSV di direktori data.
    
    Fungsi ini digunakan untuk menyimpan dataset yang sudah diproses
    ke dalam format CSV untuk digunakan dalam training model.
    
    Args:
        df: DataFrame pandas yang akan disimpan
        filename: Nama file (contoh: 'train_dataset.csv')

    Returns:
        Path lengkap ke file yang sudah disimpan
    """
    data_dir = get_data_dir()
    data_dir.mkdir(exist_ok=True)  # Buat direktori jika belum ada
    file_path = data_dir / filename
    df.to_csv(file_path)  # Simpan DataFrame ke CSV
    return str(file_path)


def load_dataset(filename: str) -> pd.DataFrame:
    """
    Memuat DataFrame dari file CSV di direktori data.
    
    Fungsi ini digunakan untuk memuat dataset yang sudah disimpan
    untuk digunakan dalam training atau evaluasi model.
    
    Args:
        filename: Nama file (contoh: 'train_dataset.csv')

    Returns:
        DataFrame yang sudah dimuat dari CSV
        
    Raises:
        FileNotFoundError: Jika file tidak ditemukan
    """
    data_dir = get_data_dir()
    file_path = data_dir / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    # Baca CSV dengan index_col=0 (gunakan kolom pertama sebagai index)
    # parse_dates=True untuk mengkonversi kolom tanggal ke datetime
    df = pd.read_csv(file_path, index_col=0, parse_dates=True)
    return df


def save_uploaded_file(file_content: bytes, filename: str = 'upload.xlsx') -> str:
    """
    Menyimpan file yang diupload dari Laravel ke direktori data.
    
    Fungsi ini digunakan saat Laravel mengupload file Excel ke FastAPI.
    File akan disimpan di direktori data untuk diproses lebih lanjut.
    
    Args:
        file_content: Konten file dalam format bytes (dari Laravel)
        filename: Nama file untuk disimpan (default: 'upload.xlsx')

    Returns:
        Path lengkap ke file yang sudah disimpan
    """
    data_dir = get_data_dir()
    data_dir.mkdir(exist_ok=True)  # Buat direktori jika belum ada
    file_path = data_dir / filename
    # Tulis file dalam mode binary ('wb')
    with open(file_path, 'wb') as f:
        f.write(file_content)
    return str(file_path)

