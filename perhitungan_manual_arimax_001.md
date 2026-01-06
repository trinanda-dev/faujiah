# Perhitungan Manual ARIMAX(0,0,1) - Sesuai Hasil Program

## Catatan Penting
Dokumen ini merupakan perhitungan manual yang disesuaikan dengan hasil program yang menggunakan **ARIMAX(0,0,1)** dengan MAPE Hybrid = **14.3046%** (berdasarkan log program).

**Perbedaan dengan perhitungan sebelumnya:**
- **Perhitungan sebelumnya**: ARIMAX(1,0,0) dengan MAPE Hybrid = 12.04266%
- **Perhitungan ini**: ARIMAX(0,0,1) dengan MAPE Hybrid = 14.3046% (sesuai program)

---

## 1. Identifikasi Model ARIMAX (0,0,1)

Model ARIMAX (0,0,1) memiliki bentuk:
```
Z_t = a + θ₁·e_{t-1} + φ·X_t + e_t
```

**Keterangan:**
- `Z_t` = Nilai variabel endogen pada waktu ke-t (ketinggian gelombang)
- `e_{t-1}` = Residual/error pada periode sebelumnya (t-1)
- `X_t` = Variabel eksogen (kecepatan angin)
- `θ₁` = Koefisien moving average orde ke-1
- `φ` = Koefisien regresi untuk variabel eksogen
- `e_t` = Error atau residual pada waktu ke-t
- `a` = Intersep atau konstanta model

**Perbedaan dengan ARIMAX(1,0,0):**
- **ARIMAX(1,0,0)**: Menggunakan nilai lag dari Z (Z_{t-1})
- **ARIMAX(0,0,1)**: Menggunakan residual lag (e_{t-1}) - komponen Moving Average

---

## 2. Data yang Digunakan

**Tabel 1. Sampel Data Latih (Training Data)**
| Tanggal, Jam | Ketinggian Gelombang (m) | Kecepatan Angin (m/s) |
|--------------|---------------------------|----------------------|
| 2024-12-01 00:00:00 | 1.8 | 4.5 |
| 2024-12-01 12:00:00 | 1.6 | 4.5 |
| 2024-12-02 00:00:00 | 1.6 | 4.8 |
| 2024-12-02 12:00:00 | 1.5 | 4.8 |
| 2024-12-03 00:00:00 | 1.5 | 5.1 |
| 2024-12-03 12:00:00 | 1.4 | 5.1 |
| 2024-12-04 00:00:00 | 1.3 | 4.8 |
| 2024-12-04 12:00:00 | 1.4 | 5.8 |
| 2024-12-05 00:00:00 | 1.2 | 4.0 |
| 2024-12-05 12:00:00 | 1.1 | 3.8 |
| 2024-12-06 00:00:00 | 1.1 | 3.8 |
| 2024-12-06 12:00:00 | 1.2 | 4.0 |
| 2024-12-07 00:00:00 | 1.2 | 4.8 |
| 2024-12-07 12:00:00 | 1.3 | 5.8 |
| 2024-12-08 00:00:00 | 1.6 | 6.9 |
| 2024-12-08 12:00:00 | 1.8 | 7.1 |
| 2024-12-09 00:00:00 | 2.0 | 6.0 |
| 2024-12-09 12:00:00 | 2.2 | 6.0 |
| 2024-12-10 00:00:00 | 2.2 | 5.8 |
| 2024-12-10 12:00:00 | 2.2 | 6.5 |
| 2024-12-11 00:00:00 | 2.1 | 5.1 |
| 2024-12-11 12:00:00 | 1.8 | 4.8 |
| 2024-12-12 00:00:00 | 1.5 | 4.8 |
| 2024-12-12 12:00:00 | 1.2 | 4.8 |
| 2024-12-13 00:00:00 | 1.2 | 5.0 |
| 2024-12-13 12:00:00 | 1.2 | 4.4 |
| 2024-12-14 00:00:00 | 1.4 | 4.3 |
| 2024-12-14 12:00:00 | 1.4 | 4.3 |

**Total Data Training: 28 data point (14 hari × 2 prediksi per hari)**

**Tabel 2. Data Validasi (Validation Data)** // tidak digunakan saat perhitungan manual

---

**Tabel 3. Data Uji (Testing Data)**
| Tanggal, Jam | Ketinggian Gelombang (m) | Kecepatan Angin (m/s) |
|--------------|---------------------------|----------------------|
| 2024-12-18 00:00:00 | 2.20 | 6.20 |
| 2024-12-18 12:00:00 | 2.30 | 6.50 |
| 2024-12-19 00:00:00 | 2.70 | 9.80 |
| 2024-12-19 12:00:00 | 3.00 | 9.30 |
| 2024-12-20 00:00:00 | 3.10 | 12.40 |
| 2024-12-20 12:00:00 | 2.80 | 11.60 |

**Total Data Testing: 6 data point (18-20 Desember 2024)**

---

## 3. Estimasi Parameter ARIMAX(0,0,1)

### 3.1. Metode Estimasi

Untuk model ARIMAX(0,0,1), estimasi parameter menggunakan **Maximum Likelihood Estimation (MLE)** atau **iterative least squares**. 

**Model:**
```
Z_t = a + θ₁·e_{t-1} + φ·X_t + e_t
```

**Proses estimasi:**
1. Inisialisasi residual awal (biasanya e₀ = 0)
2. Hitung residual secara iteratif: e_t = Z_t - (a + θ₁·e_{t-1} + φ·X_t)
3. Estimasi parameter menggunakan metode iteratif (Newton-Raphson, atau OLS dengan transformasi)

### 3.2. Rumus Likelihood Function (MLE)

Untuk model MA(1), likelihood function didefinisikan sebagai:

```
L(θ) = ∏_{t=1}^n f(e_t | θ)
```

Dimana:
- `f(e_t | θ)` adalah probability density function dari error
- Untuk error yang berdistribusi normal: `e_t ~ N(0, σ²)`

**Log-Likelihood:**
```
log L(θ) = -n/2 · log(2πσ²) - 1/(2σ²) · Σ e_t²
```

**Catatan:** Perhitungan manual MLE sangat kompleks karena melibatkan:
- Inversi matriks kovarians
- Optimasi non-linear
- Iterasi numerik

**Oleh karena itu, untuk perhitungan manual, parameter diambil dari output program.**

### 3.3. Perhitungan Manual (Menggunakan Parameter dari Program)

**Langkah-langkah:**
1. **Ambil parameter dari program:**
   - `a` (const) = [dari program]
   - `θ₁` (ma.L1) = [dari program]
   - `φ` (x1) = [dari program]

2. **Hitung residual training secara iteratif:**
   - Inisialisasi: e₀ = 0
   - Untuk t = 1, 2, ..., n:
     ```
     Ẑ_t = a + θ₁·e_{t-1} + φ·X_t
     e_t = Z_t - Ẑ_t
     ```

3. **Tabel Perhitungan Residual Training:**

**Catatan:** Data training sekarang sampai 14 Desember 2024 (28 data point: 14 hari × 2 prediksi per hari).

| t | Z_t | X_t | e_{t-1} | Ẑ_t = a + θ₁·e_{t-1} + φ·X_t | e_t = Z_t - Ẑ_t |
|---|-----|-----|---------|------------------------------|------------------|
| 1 | 1.8 | 4.5 | 0.0000 | [dihitung] | [dihitung] |
| 2 | 1.6 | 4.5 | [e₁] | [dihitung] | [dihitung] |
| 3 | 1.6 | 4.8 | [e₂] | [dihitung] | [dihitung] |
| ... | ... | ... | ... | ... | ... |
| 28 | 1.4 | 4.3 | [e₂₇] | [dihitung] | [e₂₈] |

**Contoh Perhitungan (dengan parameter contoh):**

**Asumsi parameter:**
- `a` = 0.5
- `θ₁` = 0.3
- `φ` = 0.2

**t = 1:**
```
e₀ = 0 (inisialisasi)
Ẑ₁ = 0.5 + 0.3·0 + 0.2·4.5
   = 0.5 + 0 + 0.9
   = 1.4
e₁ = 1.8 - 1.4 = 0.4
```

**t = 2:**
```
Ẑ₂ = 0.5 + 0.3·0.4 + 0.2·4.5
   = 0.5 + 0.12 + 0.9
   = 1.52
e₂ = 1.6 - 1.52 = 0.08
```

**t = 3:**
```
Ẑ₃ = 0.5 + 0.3·0.08 + 0.2·4.8
   = 0.5 + 0.024 + 0.96
   = 1.484
e₃ = 1.6 - 1.484 = 0.116
```

**Dan seterusnya sampai t = 28 (data training terakhir pada 14 Desember 2024 12:00:00)...**

---

## 4. Prediksi ARIMAX(0,0,1)

### 4.1. Rumus Prediksi

```
Ẑ_t = a + θ₁·e_{t-1} + φ·X_t
```

**Keterangan:**
- `Ẑ_t` = Nilai prediksi tinggi gelombang
- `e_{t-1}` = Residual pada periode sebelumnya
- `X_t` = Kecepatan angin saat ini
- `a` = Intercept
- `θ₁` = Koefisien MA
- `φ` = Koefisien variabel eksogen

### 4.2. Perhitungan Prediksi pada Data Training

**Catatan:** Untuk perhitungan manual yang akurat, kita perlu:
1. Parameter yang sudah diestimasi dari program (a, θ₁, φ)
2. Residual dari data training
3. Prediksi iteratif untuk data test

**Tabel 3. Contoh Perhitungan Prediksi (dengan parameter dari program)**

| t | Z_t (Aktual) | X_t | e_{t-1} | Ẑ_t (Prediksi) | e_t (Residual) |
|---|--------------|-----|---------|-----------------|----------------|
| 1 | 1.8 | 4.5 | 0.0000 | [dihitung] | [dihitung] |
| 2 | 1.6 | 4.5 | [e₁] | [dihitung] | [dihitung] |
| ... | ... | ... | ... | ... | ... |

---

## 5. Pembentukan Model LSTM untuk Residual

### 5.1. Normalisasi Residual

Setelah mendapatkan semua residual dari data training, langkah selanjutnya adalah normalisasi.

**Rumus Normalisasi (Min-Max Scaling):**
```
e'_t = (e_t - min(e)) / (max(e) - min(e))
```

**Keterangan:**
- `e'_t` = Residual yang sudah dinormalisasi
- `e_t` = Residual asli
- `min(e)` = Nilai minimum dari semua residual training
- `max(e)` = Nilai maksimum dari semua residual training

**Langkah Perhitungan:**
1. Hitung `min(e)` dan `max(e)` dari semua residual training
2. Hitung range: `range = max(e) - min(e)`
3. Normalisasi setiap residual: `e'_t = (e_t - min(e)) / range`

**Contoh Perhitungan:**

**Asumsi:**
- `min(e)` = -0.33611
- `max(e)` = 0.37398
- `range` = 0.37398 - (-0.33611) = 0.71009

**Untuk t = 2 (e₂ = -0.0129):**
```
e'_2 = (-0.0129 - (-0.33611)) / 0.71009
    = (-0.0129 + 0.33611) / 0.71009
    = 0.32321 / 0.71009
    = 0.455147
```

**Untuk t = 3 (e₃ = 0.1054):**
```
e'_3 = (0.1054 - (-0.33611)) / 0.71009
    = (0.1054 + 0.33611) / 0.71009
    = 0.44151 / 0.71009
    = 0.621743
```

**Tabel Normalisasi Residual:**

| t | e_t (Residual) | e'_t (Normalisasi) |
|---|----------------|---------------------|
| 2 | -0.0129 | 0.455147 |
| 3 | 0.1054 | 0.621743 |
| 4 | 0.0054 | 0.480918 |
| ... | ... | ... |
| 28 | [e₂₈] | [normalisasi] |

### 5.2. Rumus Denormalisasi

**Rumus Denormalisasi:**
```
e_t = e'_t · (max(e) - min(e)) + min(e)
```

**Atau:**
```
e_t = e'_t · range + min(e)
```

**Contoh:**
```
Jika e'_t = 0.455147, maka:
e_t = 0.455147 · 0.71009 + (-0.33611)
   = 0.32321 - 0.33611
   = -0.0129
```

### 5.3. Training LSTM

Proses training LSTM menggunakan arsitektur LSTM dengan:
- **Window size**: 12 (menggunakan 12 residual sebelumnya untuk prediksi)
- **LSTM units**: 18 (jumlah neuron di layer LSTM)
- **Epochs**: 50 (quick evaluation) atau 200 (full training)
- **Batch size**: 16
- **Patience**: 5 (quick) atau 10 (full)
- **Seed**: 123 (optimal untuk order ini berdasarkan program)

**Catatan:** Untuk perhitungan manual, bobot LSTM diambil dari model yang sudah di-train. Perhitungan manual LSTM sangat kompleks karena melibatkan matriks dan operasi non-linear.

---

## 6. Prediksi Hybrid ARIMAX-LSTM

### 6.1. Rumus Prediksi Hybrid

```
Hybrid_t = ARIMAX_t + LSTM_residual_t
```

Dimana:
- `ARIMAX_t` = Prediksi dari model ARIMAX(0,0,1)
- `LSTM_residual_t` = Prediksi residual dari model LSTM (sudah denormalisasi)

### 6.2. Perhitungan MAPE

**Rumus MAPE (Mean Absolute Percentage Error):**
```
MAPE = (1/n) · Σ_{t=1}^n |(Z_t - Ẑ_t) / Z_t| · 100%
```

**Atau:**
```
MAPE = (1/n) · Σ_{t=1}^n |(Aktual_t - Prediksi_t) / Aktual_t| · 100%
```

**MAPE ARIMAX:**
```
MAPE_ARIMAX = (1/n) · Σ_{t=1}^n |(Z_t - Ẑ_ARIMAX_t) / Z_t| · 100%
```

**MAPE Hybrid:**
```
MAPE_Hybrid = (1/n) · Σ_{t=1}^n |(Z_t - Ẑ_Hybrid_t) / Z_t| · 100%
```

**Contoh Perhitungan MAPE untuk Data Test (n = 6):**

**Tabel Perhitungan MAPE ARIMAX:**

| No. | t | Tanggal, Jam | Z_t (Aktual) | Ẑ_ARIMAX_t | |Z_t - Ẑ_ARIMAX_t| | |(Z_t - Ẑ_ARIMAX_t) / Z_t| · 100% |
|-----|---|--------------|--------------|------------|-------------------|----------------------------------|
| 1 | 1 | 2024-12-18 00:00:00 | 2.20 | [hitung] | [hitung] | [hitung]% |
| 2 | 2 | 2024-12-18 12:00:00 | 2.30 | [hitung] | [hitung] | [hitung]% |
| 3 | 3 | 2024-12-19 00:00:00 | 2.70 | [hitung] | [hitung] | [hitung]% |
| 4 | 4 | 2024-12-19 12:00:00 | 3.00 | [hitung] | [hitung] | [hitung]% |
| 5 | 5 | 2024-12-20 00:00:00 | 3.10 | [hitung] | [hitung] | [hitung]% |
| 6 | 6 | 2024-12-20 12:00:00 | 2.80 | [hitung] | [hitung] | [hitung]% |
| **Total** | | | | | | **[jumlahkan]** |

**MAPE ARIMAX:**
```
MAPE_ARIMAX = Total Persentase Error / 6
```

**Tabel Perhitungan MAPE Hybrid:**

| No. | t | Tanggal, Jam | Z_t (Aktual) | Ẑ_Hybrid_t | |Z_t - Ẑ_Hybrid_t| | |(Z_t - Ẑ_Hybrid_t) / Z_t| · 100% |
|-----|---|--------------|--------------|------------|-------------------|----------------------------------|
| 1 | 1 | 2024-12-18 00:00:00 | 2.20 | [hitung] | [hitung] | [hitung]% |
| 2 | 2 | 2024-12-18 12:00:00 | 2.30 | [hitung] | [hitung] | [hitung]% |
| 3 | 3 | 2024-12-19 00:00:00 | 2.70 | [hitung] | [hitung] | [hitung]% |
| 4 | 4 | 2024-12-19 12:00:00 | 3.00 | [hitung] | [hitung] | [hitung]% |
| 5 | 5 | 2024-12-20 00:00:00 | 3.10 | [hitung] | [hitung] | [hitung]% |
| 6 | 6 | 2024-12-20 12:00:00 | 2.80 | [hitung] | [hitung] | [hitung]% |
| **Total** | | | | | | **[jumlahkan]** |

**MAPE Hybrid:**
```
MAPE_Hybrid = Total Persentase Error / 6
```

**Catatan:** Nilai di atas adalah contoh. Nilai aktual dari program adalah:
- MAPE ARIMAX = 14.6791%
- MAPE Hybrid = 14.3046%

---

## 7. Hasil yang Diharapkan (Sesuai Program)

Berdasarkan log program:
- **ARIMAX MAPE (Test)**: 14.6791%
- **Hybrid MAPE (Test)**: 14.3046%
- **Order**: (0, 0, 1)
- **Seed LSTM**: 123
- **LSTM Helping**: True (Hybrid MAPE < ARIMAX MAPE)

**Perbandingan dengan Perhitungan Sebelumnya:**
- **ARIMAX(1,0,0)**: MAPE Hybrid = 12.04266%
- **ARIMAX(0,0,1)**: MAPE Hybrid = 14.3046%

**Catatan:** Meskipun ARIMAX(1,0,0) menghasilkan MAPE lebih rendah pada perhitungan manual sebelumnya, program memilih ARIMAX(0,0,1) berdasarkan kriteria model selection yang mempertimbangkan:
1. Test MAPE
2. Gap validation-test (stabilitas)
3. Kompleksitas model (parsimony)

---

## 8. Ringkasan Rumus-Rumus Lengkap

### 8.1. Model ARIMAX(0,0,1)

**Rumus Model:**
```
Z_t = a + θ₁·e_{t-1} + φ·X_t + e_t
```

**Rumus Prediksi:**
```
Ẑ_t = a + θ₁·e_{t-1} + φ·X_t
```

**Rumus Residual:**
```
e_t = Z_t - Ẑ_t
```

### 8.2. Normalisasi dan Denormalisasi

**Normalisasi (Min-Max Scaling):**
```
e'_t = (e_t - min(e)) / (max(e) - min(e))
```

**Denormalisasi:**
```
e_t = e'_t · (max(e) - min(e)) + min(e)
```

### 8.3. Model Hybrid

**Rumus Prediksi Hybrid:**
```
Ẑ_Hybrid_t = Ẑ_ARIMAX_t + Ẑ_LSTM_t
```

Dimana:
- `Ẑ_ARIMAX_t` = Prediksi dari model ARIMAX(0,0,1)
- `Ẑ_LSTM_t` = Prediksi residual dari model LSTM (sudah denormalisasi)

### 8.4. Evaluasi MAPE

**Rumus MAPE:**
```
MAPE = (1/n) · Σ_{t=1}^n |(Z_t - Ẑ_t) / Z_t| · 100%
```

**MAPE ARIMAX:**
```
MAPE_ARIMAX = (1/n) · Σ_{t=1}^n |(Z_t - Ẑ_ARIMAX_t) / Z_t| · 100%
```

**MAPE Hybrid:**
```
MAPE_Hybrid = (1/n) · Σ_{t=1}^n |(Z_t - Ẑ_Hybrid_t) / Z_t| · 100%
```

---

## 9. Kesimpulan

Perhitungan manual untuk ARIMAX(0,0,1) lebih kompleks dibanding ARIMAX(1,0,0) karena:
1. **Komponen MA**: Memerlukan residual yang tidak terobservasi langsung
2. **Estimasi Parameter**: Memerlukan metode iteratif (MLE) bukan OLS sederhana
3. **Prediksi**: Memerlukan residual dari periode sebelumnya yang harus dihitung iteratif

**Rekomendasi:**
- Untuk perhitungan manual yang akurat, gunakan parameter dari output program
- Fokus pada pemahaman konsep model dan interpretasi hasil
- Verifikasi hasil perhitungan manual dengan hasil program
