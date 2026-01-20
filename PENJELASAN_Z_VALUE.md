# Penjelasan Z-Value dan Hubungannya dengan P-Value

## 1. Apa Itu Z-Value?

Z-value (atau z-score) adalah statistik uji yang mengukur seberapa jauh nilai estimasi parameter dari nilai nol (0), dibandingkan dengan standard error-nya.

Formula Z-Value

```
z-value = (Estimasi Parameter) / (Standard Error)
```

Contoh Sederhana

Bayangkan Anda mengukur tinggi badan:
- Estimasi parameter = Tinggi badan Anda (misal: 170 cm)
- Standard error = Ketidakpastian pengukuran (misal: 2 cm)
- Z-value = 170 / 2 = 85

Semakin besar z-value, semakin jauh parameter dari nol, artinya parameter tersebut lebih signifikan.

---

## 2. Hubungan Z-Value dengan P-Value

Z-value dan P-value adalah dua cara berbeda untuk mengukur hal yang sama apakah parameter signifikan atau tidak.

Perbandingan

| Aspek | Z-Value | P-Value |
|-------|---------|---------|
| Apa yang diukur | Jarak parameter dari nol (dalam satuan standard error) | Probabilitas mendapatkan hasil sejauh ini jika parameter = 0 |
| Format | Angka (bisa negatif atau positif) | Angka antara 0-1 |
| Interpretasi | Semakin besar (mutlak), semakin signifikan | Semakin kecil, semakin signifikan |
| Threshold | |z-value| > 1.96 (untuk α = 0.05) | p-value < 0.05 (untuk α = 0.05) |

Hubungan Matematis

Z-value dan P-value saling terkait:

```
p-value = 2 × (1 - Φ(|z-value|))
```

Dimana:
- Φ = Fungsi distribusi normal standar (cumulative distribution function)
- 2 = Two-tailed test (uji dua arah)

Contoh Konversi

| Z-Value | P-Value | Interpretasi |
|---------|---------|--------------|
| 0.5 | 0.617 | Tidak signifikan p > 0.05 |
| 1.0 | 0.317 | Tidak signifikan p > 0.05 |
| 1.96 | 0.050 | Batas signifikan p = 0.05 |
| 2.0 | 0.046 | Signifikan p < 0.05 |
| 2.5 | 0.012 | Signifikan p < 0.05 |
| 3.0 | 0.003 | Sangat signifikan p < 0.05 |

---

## 3. Mengapa Menggunakan Z-Value > 1.96?

Distribusi Normal Standar

Z-value mengikuti distribusi normal standar (mean = 0, standard deviation = 1).

Kurva Distribusi Normal

```
       95% area
    ┌─────────────┐
    │             │
    │      ▲      │
    │     /|\     │
    │    / | \    │
    │   /  |  \   │
    │  /   |   \  │
    │ /    |    \ │
    │/     |     \│
-3  -2  -1  0  1  2  3
    │     │     │
    └─────┴─────┘
   -1.96      1.96
```

Mengapa 1.96?

- 95% area di bawah kurva normal berada antara -1.96 dan +1.96
- 5% area (2.5% di kiri, 2.5% di kanan) berada di luar range ini
- α = 0.05 berarti kita menerima 5% kemungkinan salah (Type I error)

Interpretasi

Jika |z-value| > 1.96:
- Parameter berada di daerah ekstrem (5% terluar)
- Kemungkinan parameter = 0 adalah < 5%
- Parameter signifikan secara statistik

Jika |z-value| ≤ 1.96:
- Parameter berada di daerah normal (95% tengah)
- Kemungkinan parameter = 0 adalah ≥ 5%
- Parameter tidak signifikan secara statistik

---

## 4. Implementasi di Sistem ARIMAX

Lokasi Kode

Python (FastAPI): python-ml/main.py (line 1082-1089)

```python
# Check significance: |z-value| > 1.96 for 95% confidence
significant_params = []
for param_name in z_values.index:
    if param_name.startswith('ar.') or param_name.startswith('ma.') or param_name.startswith('x'):
        significant_params.append(abs(z_values[param_name]) > 1.96)
is_significant = all(significant_params) if significant_params else True
```

PHP (Laravel): app/Http/Controllers/ArimaxController.php (line 529-537)

```php
private function checkSignificance(array $zValues, float $threshold = 1.96): bool
{
    foreach ($zValues as $zValue) {
        if (abs($zValue) < $threshold) {
            return false; // Parameter tidak signifikan jika |z| < threshold
        }
    }
    return true; // Semua parameter signifikan
}
```

Alur Pengecekan

1. Hitung z-value untuk setiap parameter:
   z-value = Parameter / Standard Error

2. Cek signifikansi:
   - Jika |z-value| > 1.96 berarti Parameter signifikan
   - Jika |z-value| ≤ 1.96 berarti Parameter tidak signifikan

3. Kesimpulan:
- Jika semua parameter signifikan berarti Model DITERIMA
- Jika ada parameter tidak signifikan berarti Model DITOLAK

---

## 5. Contoh Praktis

Contoh 1: Parameter Signifikan

Parameter AR(1) = 0.5
- Standard Error = 0.2
- Z-value = 0.5 / 0.2 = 2.5
- |z-value| = 2.5 > 1.96 berarti SIGNIFIKAN

Interpretasi:
- Parameter AR(1) memiliki pengaruh yang signifikan terhadap model
- Kemungkinan parameter = 0 adalah < 5%
- Parameter ini penting dan harus dipertahankan dalam model

Contoh 2: Parameter Tidak Signifikan

Parameter MA(1) = 0.1
- Standard Error = 0.15
- Z-value = 0.1 / 0.15 = 0.67
- |z-value| = 0.67 < 1.96 berarti TIDAK SIGNIFIKAN

Interpretasi:
- Parameter MA(1) tidak memiliki pengaruh signifikan terhadap model
- Kemungkinan parameter = 0 adalah ≥ 5%
- Parameter ini tidak penting dan model DITOLAK

---

## 6. Perbedaan Z-Value dan P-Value dalam Praktik

Kapan Menggunakan Z-Value?

1. Lebih intuitif untuk melihat seberapa jauh parameter dari nol
2. Langsung bisa dibandingkan dengan threshold (1.96)
3. Tidak perlu konversi untuk interpretasi cepat

Kapan Menggunakan P-Value?

1. Lebih umum digunakan dalam penelitian
2. Langsung menunjukkan probabilitas (0-1)
3. Lebih mudah diinterpretasi sebagai kemungkinan salah

Dalam Sistem Ini

Sistem menggunakan keduanya:
- Z-value untuk validasi cepat (|z| > 1.96)
- P-value untuk tampilan detail di frontend

Keduanya ekuivalen dan memberikan kesimpulan yang sama.

---

## 7. Ringkasan

Z-Value itu Apa?

Z-value adalah ukuran seberapa jauh parameter dari nol, dibandingkan dengan ketidakpastiannya (standard error).

Hubungan dengan P-Value

- Z-value dan P-value mengukur hal yang sama yaitu signifikansi
- Z-value > 1.96 = P-value < 0.05, keduanya berarti signifikan
- Z-value ≤ 1.96 = P-value ≥ 0.05, keduanya berarti tidak signifikan

Mengapa 1.96?

- 1.96 adalah nilai kritis untuk 95% confidence level dengan α = 0.05
- 95% area kurva normal berada antara -1.96 dan +1.96
- Jika |z-value| > 1.96, berarti parameter berada di 5% terluar dan signifikan

Dalam Sistem

- Sistem mengecek: |z-value| > 1.96
- Jika semua parameter memenuhi berarti Model DITERIMA
- Jika ada yang tidak berarti Model DITOLAK

Analogi Sederhana

Bayangkan ujian:
- Z-value = Berapa standar deviasi nilai Anda dari rata-rata
- P-value = Probabilitas mendapatkan nilai sejauh ini jika Anda tidak belajar
- |z-value| > 1.96 = Nilai Anda jauh di atas rata-rata dan signifikan
- P-value < 0.05 = Kemungkinan Anda tidak belajar tapi dapat nilai tinggi adalah < 5%

---

Dokumen ini menjelaskan z-value dengan bahasa yang mudah dipahami untuk membantu memahami konsep statistik dalam sistem ARIMAX.

