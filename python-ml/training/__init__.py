"""
Modul Training untuk Model ARIMAX dan Hybrid

Modul ini mengekspor fungsi-fungsi untuk melatih model machine learning:
1. train_arimax - Melatih model ARIMAX untuk memprediksi tinggi gelombang
2. train_lstm_residual - Melatih model LSTM untuk memprediksi residual dari ARIMAX

Model Hybrid menggabungkan ARIMAX dan LSTM untuk meningkatkan akurasi prediksi.
"""

from .arimax_trainer import train_arimax
from .hybrid_trainer import train_lstm_residual

# Ekspor fungsi-fungsi yang dapat digunakan dari modul ini
__all__ = ['train_arimax', 'train_lstm_residual']

