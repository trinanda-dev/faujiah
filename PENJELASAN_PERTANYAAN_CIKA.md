# Penjelasan Sistem Hybrid ARIMAX-LSTM untuk Prediksi Tinggi Gelombang

## 1. Bagaimana Hybrid LSTM Memanggil Residual ARIMAX?

Alur Kerja Model Hybrid

Model Hybrid bekerja dengan 2 tahap prediksi yang digabungkan:

```
┌─────────────────┐
│   Data Input    │ (Tinggi gelombang + Kecepatan angin)
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│  Model ARIMAX   │                  │  Model LSTM     │
│                 │                  │                 │
│ Prediksi tinggi │                  │ Prediksi error │
│ gelombang       │                  │ (residual)      │
└────────┬────────┘                  └────────┬────────┘
         │                                     │
         │ arimax_pred                         │ residual_pred
         │                                     │
         └──────────────┬──────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Prediksi Final │
              │  Hybrid =       │
              │  ARIMAX + LSTM  │
              └─────────────────┘
```

Implementasi di Kode

Lokasi: python-ml/main.py (line 1469-1482)

```python
# 1. ARIMAX memprediksi tinggi gelombang
arimax_pred = arimax_forecast.predicted_mean.values

# 2. LSTM memprediksi residual (error dari ARIMAX)
predicted_resid = predict_residuals_iterative(
    model_lstm,
    scaler,
    seed,
    n_steps=n_steps,
    window=12,
)

# 3. Gabungkan: Prediksi Hybrid = ARIMAX + Residual LSTM
hybrid_pred = arimax_pred + predicted_resid
```

Penjelasan Konsep

1. ARIMAX memprediksi tinggi gelombang berdasarkan:
   - Data historis tinggi gelombang
   - Kecepatan angin (variabel eksternal)
   - Pola linear dan trend

2. LSTM memprediksi residual (selisih antara nilai aktual dan prediksi ARIMAX):
   - Residual = Nilai Aktual - Prediksi ARIMAX
   - LSTM menangkap pola non-linear yang tidak bisa ditangkap ARIMAX
   - Residual ini dihitung dari data training

3. Prediksi Final Hybrid = Prediksi ARIMAX + Prediksi Residual LSTM
   - Menggabungkan kelebihan kedua model
   - ARIMAX untuk pola linear
   - LSTM untuk pola non-linear (error)

---

## 2. Apa Itu Learning Rate?

Definisi

Learning Rate adalah kecepatan pembelajaran model neural network (LSTM). Ini menentukan seberapa besar langkah yang diambil model saat belajar dari data.

Analogi Sederhana

Bayangkan Anda sedang belajar menembak sasaran:
- Learning rate tinggi = Langkah besar → Cepat sampai, tapi mungkin melewati target
- Learning rate rendah = Langkah kecil → Lambat, tapi lebih akurat

Implementasi di Sistem

Lokasi: python-ml/training/hybrid_trainer.py (line 111)

```python
model_lstm.compile(optimizer='adam', loss='mse')
```

Penjelasan:
- Sistem menggunakan optimizer Adam (default learning rate = 0.001)
- Adam adalah optimizer adaptif yang otomatis menyesuaikan learning rate selama training
- Tidak perlu set manual karena Adam sudah optimal untuk kebanyakan kasus

Mengapa Tidak Diatur Manual?

1. Adam optimizer sudah memiliki learning rate default yang baik (0.001)
2. Adaptive learning rate: Adam menyesuaikan sendiri berdasarkan kondisi training
3. Best practice: Untuk time series forecasting, default Adam sudah cukup baik

---

## 3. Apa Itu Epoch?

Definisi

Epoch adalah satu kali putaran lengkap model melihat semua data training.

Contoh Sederhana

Jika Anda punya 1000 data training:
- 1 epoch = Model melihat semua 1000 data sekali
- 10 epoch = Model melihat semua 1000 data sebanyak 10 kali
- 200 epoch = Model melihat semua 1000 data sebanyak 200 kali

Implementasi di Sistem

Lokasi: python-ml/main.py (line 337, 683, 700)

```python
epochs=200  # Maksimum 200 epoch
```

Penjelasan:
- Sistem menggunakan maksimum 200 epoch
- Model akan berhenti lebih cepat jika sudah optimal (early stopping)
- Tidak selalu sampai 200 epoch

Mengapa 200 Epoch?

1. Cukup untuk konvergensi: Model biasanya sudah optimal sebelum 200 epoch
2. Mencegah overfitting: Tidak terlalu banyak sehingga model tidak menghafal data
3. Balance waktu dan akurasi: Cukup untuk hasil baik tanpa terlalu lama

---

## 4. Apa Itu Patience?

Definisi

Patience adalah jumlah epoch yang ditunggu sebelum training dihentikan jika tidak ada perbaikan.

Contoh Sederhana

Bayangkan Anda sedang belajar:
- Setiap epoch = Satu kali ujian
- Patience = 25 berarti: Jika nilai tidak naik selama 25 ujian berturut-turut, berhenti belajar
- Jika di epoch 10 nilai terbaik, lalu 25 epoch berikutnya tidak ada perbaikan → berhenti di epoch 35

Implementasi di Sistem

Lokasi: python-ml/main.py (line 339, 685, 702)

```python
patience=25  # Tunggu 25 epoch tanpa improvement
```

**Early Stopping Logic:**
```python
# Jika validation loss tidak membaik selama 25 epoch berturut-turut
# → Hentikan training dan gunakan model terbaik
EarlyStopping(
    monitor='val_loss',
    patience=25,
    restore_best_weights=True  # Kembalikan ke weight terbaik
)
```

Mengapa Patience = 25?

1. Memberi kesempatan: Model punya waktu cukup untuk menemukan perbaikan
2. Mencegah overfitting: Jika tidak membaik 25 epoch, kemungkinan sudah optimal
3. Efisiensi waktu: Tidak menunggu terlalu lama jika memang tidak ada perbaikan

Perbandingan Patience

- Patience rendah (5-10): Berhenti cepat, mungkin terlalu cepat
- Patience sedang (25): Balance antara kesempatan dan efisiensi (yang digunakan)
- Patience tinggi (50+): Menunggu lama, risiko overfitting

---

## 5. Implementasi di Sistem

Alur Lengkap Training Hybrid

```
1. Upload Dataset
   ↓
2. Split Data (70% train, 15% validation, 15% test)
   ↓
3. Train ARIMAX Model
   - Identifikasi parameter (p, d, q)
   - Evaluasi berbagai kombinasi
   - Pilih model terbaik
   ↓
4. Hitung Residual ARIMAX
   - Residual = Aktual - Prediksi ARIMAX
   - Simpan ke residual_train.csv
   ↓
5. Train LSTM pada Residual
   - Input: Residual ARIMAX
   - Window: 12 (menggunakan 12 data sebelumnya)
   - LSTM Units: 18 neuron
   - Epochs: 200 (maksimum)
   - Patience: 25
   - Optimizer: Adam (learning rate adaptif)
   ↓
6. Evaluasi Model Hybrid
   - Prediksi Hybrid = ARIMAX + LSTM Residual
   - Hitung MAPE, MAE, RMSE
   ↓
7. Simpan Model
   - ARIMAX model
   - LSTM model
   - Scaler (untuk normalisasi)
```

File-File Penting

1. python-ml/main.py
   - Endpoint training dan prediksi
   - Logika gabungan ARIMAX + LSTM

2. python-ml/training/hybrid_trainer.py
   - Fungsi training LSTM
   - Early stopping logic
   - Simpan training history

3. app/Http/Controllers/HybridController.php
   - Controller Laravel
   - Komunikasi dengan FastAPI
   - Tampilkan hasil ke frontend

---

## 6. Identifikasi Model dan Status "Diterima"

Apa Itu Identifikasi Model?

Identifikasi model adalah proses mencari parameter terbaik untuk model ARIMAX (p, d, q).

Proses Identifikasi

1. Uji berbagai kombinasi (p, d, q):
   - p = 0-3 (AutoRegressive)
   - d = 0-2 (Differencing)
   - q = 0-3 (Moving Average)

2. Evaluasi setiap kombinasi berdasarkan:
   - Stabilitas: Parameter AR harus stabil (|φ| < 1)
   - Invertibility: Parameter MA harus invertible (|θ| < 1)
   - Signifikansi: Parameter harus signifikan (|z-value| > 1.96)

3. Hitung metrik evaluasi:
   - AIC (Akaike Information Criterion)
   - BIC (Bayesian Information Criterion)
   - MAPE (Mean Absolute Percentage Error)

Status "Diterima" vs "Ditolak"

Lokasi: python-ml/main.py (line 1092-1102)

```python
status = 'Diterima'  # Default

# Cek stabilitas
if not is_stable:
    status = 'Ditolak'
    alasan.append('Parameter AR tidak stabil (|φ| ≥ 1)')

# Cek invertibility
if not is_invertible:
    status = 'Ditolak'
    alasan.append('Parameter MA tidak invertible (|θ| ≥ 1)')

# Cek signifikansi
if not is_significant:
    status = 'Ditolak'
    alasan.append('Parameter tidak signifikan (|z| < 1.96)')
```

Kriteria "Diterima"

Model DITERIMA jika memenuhi SEMUA kriteria:

1. Stabil: Semua parameter AR berada di dalam unit circle (|φ| < 1)
2. Invertible: Semua parameter MA berada di dalam unit circle (|θ| < 1)
3. Signifikan: Semua parameter signifikan secara statistik (|z-value| > 1.96)

Kriteria "Ditolak"

Model DITOLAK jika SALAH SATU tidak terpenuhi:

1. Parameter AR tidak stabil
2. Parameter MA tidak invertible
3. Parameter tidak signifikan

Mengapa Penting?

- Model yang diterima = Model yang valid secara statistik
- Model yang ditolak = Model yang tidak valid, tidak boleh digunakan
- Hanya model diterima yang dipertimbangkan untuk dipilih sebagai model terbaik

---

## 7. Parameter: Ditentukan Manual atau Otomatis?

Parameter yang Ditentukan Manual (Oleh Developer)

Parameter berikut ditetapkan berdasarkan best practice dan pengujian:

A. Parameter ARIMAX
- Range pencarian (p, d, q): 0-3 (standar untuk time series)
- Metode evaluasi: AIC, BIC, MAPE (standar statistik)

B. Parameter LSTM
- Window size: 12 (menggunakan 12 data sebelumnya)
  - Alasan: Pola musiman atau siklus dalam data
- LSTM Units: 18 neuron
  - Alasan: Balance antara kompleksitas dan overfitting
- Batch Size: 16
  - Alasan: Optimal untuk ukuran dataset
- Epochs: 200 (maksimum)
  - Alasan: Cukup untuk konvergensi tanpa overfitting
- Patience: 25
  - Alasan: Memberi kesempatan improvement tanpa menunggu terlalu lama
- Optimizer: Adam (default learning rate 0.001)
  - Alasan: Best practice untuk neural network

Parameter yang Ditentukan Otomatis (Oleh Sistem)

A. Parameter ARIMAX Terbaik (p, d, q)
- Otomatis dicari dari berbagai kombinasi
- Dipilih berdasarkan MAPE terendah dari model yang diterima
- Tidak manual, sistem yang memilih

B. Learning Rate
- Otomatis diatur oleh Adam optimizer
- Adaptif: Berubah selama training
- Tidak perlu set manual

C. Early Stopping
- Otomatis berhenti jika tidak ada perbaikan selama 25 epoch
- Mengembalikan ke model terbaik (best weights)
- Tidak perlu intervensi manual

Kesimpulan

| Parameter | Cara Penentuan | Penjelasan |
|-----------|----------------|------------|
| Window (12) | Manual (best practice) | Berdasarkan pola data |
| LSTM Units (18) | Manual (best practice) | Balance kompleksitas |
| Epochs (200) | Manual (best practice) | Maksimum, bisa early stop |
| Patience (25) | Manual (best practice) | Balance kesempatan & efisiensi |
| Optimizer (Adam) | Manual (best practice) | Standar untuk neural network |
| Learning Rate | Otomatis (Adam) | Diatur oleh optimizer |
| ARIMAX (p,d,q) | Otomatis (sistem) | Dicari dari berbagai kombinasi |
| Early Stopping | Otomatis (sistem) | Berhenti jika tidak membaik |

Catatan Penting

Parameter manual (window, units, epochs, patience) ditentukan berdasarkan:
1. Best practice dari penelitian time series forecasting
2. Pengujian pada dataset serupa
3. Balance antara akurasi dan efisiensi

Parameter otomatis (learning rate, p/d/q terbaik) ditentukan oleh:
1. Algoritma yang sudah teruji
2. Optimasi berdasarkan data aktual
3. Kriteria statistik yang valid

---

## Ringkasan untuk Client

1. Hybrid Model
- ARIMAX prediksi tinggi gelombang
- LSTM prediksi error (residual)
- Gabungan = Prediksi lebih akurat

2. Learning Rate
- Kecepatan belajar model
- Otomatis diatur oleh Adam optimizer
- Tidak perlu khawatir

3. Epoch
- Berapa kali model melihat semua data
- Maksimum 200, bisa berhenti lebih cepat jika sudah optimal

4. Patience
- Menunggu 25 epoch tanpa perbaikan sebelum berhenti
- Balance antara kesempatan dan efisiensi

5. Identifikasi Model
- Sistem otomatis mencari parameter terbaik (p, d, q)
- Status "Diterima" = Model valid secara statistik
- Status "Ditolak" = Model tidak valid, tidak digunakan

6. Parameter
- Manual: Window, units, epochs, patience (best practice)
- Otomatis: Learning rate, parameter ARIMAX terbaik, early stopping

---

Dokumen ini dibuat untuk menjelaskan sistem kepada client dengan bahasa yang mudah dipahami.

