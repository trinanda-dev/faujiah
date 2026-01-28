# Penjelasan Mengapa MAPE Testing Digunakan untuk Pemilihan Model ARIMAX

## 1. Apa Itu MAPE?

MAPE (Mean Absolute Percentage Error) adalah metrik untuk mengukur akurasi prediksi dalam bentuk persentase error.

Formula MAPE:
```
MAPE = (1/n) × Σ |(Aktual - Prediksi) / Aktual| × 100%
```

Dimana:
- Aktual = Nilai sebenarnya
- Prediksi = Nilai yang diprediksi model
- n = Jumlah data

## 2. Mengapa MAPE Testing Digunakan?

### Kriteria Utama: Generalization Ability

MAPE testing digunakan sebagai kriteria utama karena mengukur kemampuan model untuk memprediksi data baru yang belum pernah dilihat sebelumnya.

### Alasan Menggunakan MAPE Testing

1. Generalization Ability
   - MAPE testing mengukur performa pada data test (15% dari dataset)
   - Data test tidak digunakan saat training, sehingga representatif untuk data baru
   - Model dengan MAPE testing rendah berarti mampu memprediksi data baru dengan baik

2. Mencegah Overfitting
   - Model dengan MAPE training rendah tapi MAPE testing tinggi berarti overfitting
   - Overfitting: Model terlalu baik mempelajari data training, tapi buruk pada data baru
   - MAPE testing membantu memilih model yang tidak overfitting

3. Interpretasi Mudah
   - MAPE dalam bentuk persentase, mudah dipahami
   - Contoh: MAPE 5% berarti rata-rata error 5% dari nilai aktual
   - Lebih intuitif dibanding metrik lain seperti RMSE atau MAE

4. Skala Invariant
   - MAPE tidak terpengaruh oleh skala data
   - Dapat membandingkan performa model pada data dengan skala berbeda

## 3. Kriteria Pemilihan Model di Sistem

### Prioritas Kriteria (dari python-ml/main.py)

1. Test MAPE (PRIMARY) - Generalization ability
2. Gap antara validation dan test (SECONDARY) - Stability, mencegah overfitting
3. Model complexity (TERTIARY) - Parsimony principle (model sederhana lebih baik)
4. Validation MAPE (Hanya jika test MAPE mirip)

### Scoring Function

```python
def get_model_score(metric):
    # Base score: test MAPE (primary criterion)
    score = test_mape
    
    # Penalty untuk gap besar (indikator overfitting)
    if gap_val_test > 50% dari test MAPE:
        score += gap_val_test * 0.5
    
    # Penalty kecil untuk complexity (parsimony)
    score += complexity * 0.1
    
    return score
```

## 4. Perbedaan MAPE Training, Validation, dan Testing

### MAPE Training

- Dihitung pada data training (70% dari dataset)
- Mengukur seberapa baik model mempelajari data training
- Bisa sangat rendah jika model overfitting
- Tidak digunakan sebagai kriteria utama

### MAPE Validation

- Dihitung pada data validation (15% dari dataset)
- Digunakan untuk tuning parameter model
- Membantu memilih model terbaik saat training
- Tidak digunakan sebagai kriteria utama pemilihan final

### MAPE Testing (PRIMARY)

- Dihitung pada data test (15% dari dataset)
- Data test tidak pernah digunakan saat training atau tuning
- Mengukur kemampuan model pada data baru
- Digunakan sebagai kriteria utama untuk pemilihan model final

## 5. Mengapa Tidak Menggunakan MAPE Training?

### Masalah dengan MAPE Training

1. Overfitting Risk
   - Model bisa memiliki MAPE training sangat rendah tapi MAPE testing tinggi
   - Model terlalu baik mempelajari pola spesifik di data training
   - Tidak generalisasi dengan baik pada data baru

2. Tidak Representatif
   - Data training sudah digunakan untuk belajar
   - Tidak mengukur kemampuan prediksi pada data baru
   - Bisa menyesatkan dalam pemilihan model

### Contoh Overfitting

Model A:
- MAPE Training: 2%
- MAPE Testing: 15%
- Kesimpulan: Overfitting, tidak baik

Model B:
- MAPE Training: 5%
- MAPE Testing: 6%
- Kesimpulan: Tidak overfitting, lebih baik

## 6. Mengapa Tidak Menggunakan MAPE Validation?

### Peran MAPE Validation

MAPE validation digunakan untuk:
- Memilih model terbaik saat training
- Tuning hyperparameter
- Early stopping

### Mengapa Bukan Kriteria Utama

1. Sudah Digunakan untuk Tuning
   - Data validation sudah digunakan untuk memilih model
   - Bisa terjadi "data leakage" jika digunakan lagi untuk pemilihan final
   - Tidak sepenuhnya independen

2. Test Set Lebih Independen
   - Data test benar-benar tidak pernah disentuh saat training
   - Lebih representatif untuk data baru
   - Lebih adil untuk perbandingan model

## 7. Gap Validation-Test sebagai Kriteria Sekunder

### Mengapa Penting?

Gap antara MAPE validation dan MAPE testing menunjukkan stabilitas model:

1. Gap Kecil (< 50% dari test MAPE)
   - Model stabil, tidak overfitting
   - Performa konsisten antara validation dan test

2. Gap Besar (> 50% dari test MAPE)
   - Indikator overfitting
   - Model terlalu baik di validation tapi buruk di test
   - Diberikan penalty dalam scoring

### Contoh

Model A:
- MAPE Validation: 3%
- MAPE Testing: 12%
- Gap: 9% (75% dari test MAPE)
- Kesimpulan: Overfitting, dapat penalty

Model B:
- MAPE Validation: 5%
- MAPE Testing: 6%
- Gap: 1% (17% dari test MAPE)
- Kesimpulan: Stabil, tidak dapat penalty

## 8. Model Complexity sebagai Kriteria Tersier

### Parsimony Principle

Model yang lebih sederhana (p, d, q lebih kecil) lebih disukai jika performa mirip.

Alasan:
1. Lebih mudah diinterpretasi
2. Lebih cepat dalam komputasi
3. Lebih robust (kurang rentan overfitting)
4. Lebih mudah dijelaskan ke stakeholder

### Contoh

Jika dua model memiliki MAPE testing mirip:
- Model A: (2, 1, 1) - Complexity = 4
- Model B: (1, 1, 0) - Complexity = 2
- Pilih Model B karena lebih sederhana

## 9. Implementasi di Sistem

### Lokasi Kode

Python: python-ml/main.py (line 1282-1316)

```python
# CRITERIA (in priority order):
# 1. Test MAPE (generalization) - PRIMARY criterion
# 2. Gap between validation and test (stability) - SECONDARY criterion
# 3. Model complexity (parsimony) - TERTIARY criterion

def get_model_score(metric):
    test_mape = metric.get('mape', float('inf'))
    gap_val_test = metric.get('gap_val_test', float('inf'))
    complexity = metric.get('complexity', 999)
    
    # Base score: test MAPE (primary criterion)
    score = test_mape
    
    # Penalty for large gap (overfitting indicator)
    if gap_val_test > 50% of test MAPE:
        score += gap_val_test * 0.5
    
    # Small penalty for complexity (parsimony principle)
    score += complexity * 0.1
    
    return score
```

## 10. Ringkasan

- MAPE testing digunakan sebagai kriteria utama karena mengukur generalization ability
- Mencegah overfitting dengan memilih model yang performa baik pada data baru
- Interpretasi mudah dalam bentuk persentase
- Gap validation-test sebagai kriteria sekunder untuk deteksi overfitting
- Model complexity sebagai kriteria tersier (parsimony principle)
- Sistem menggunakan composite scoring yang mempertimbangkan ketiga kriteria dengan prioritas yang jelas


