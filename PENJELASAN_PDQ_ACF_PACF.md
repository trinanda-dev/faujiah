# Penjelasan Landasan Pemilihan p, d, q dari ACF/PACF

## 1. Pendahuluan

Parameter p, d, q dalam model ARIMAX tidak seharusnya dipilih secara random. Pemilihan yang benar harus didasarkan pada analisis ACF (Autocorrelation Function) dan PACF (Partial Autocorrelation Function).

## 2. Apa Itu ACF dan PACF?

### ACF (Autocorrelation Function)

ACF mengukur korelasi antara data pada waktu t dengan data pada waktu t-k (lag k).

ACF menunjukkan:
- Seberapa kuat hubungan antara nilai sekarang dengan nilai masa lalu
- Pola musiman atau periodik dalam data
- Digunakan untuk menentukan orde MA (q)

### PACF (Partial Autocorrelation Function)

PACF mengukur korelasi langsung antara data pada waktu t dengan data pada waktu t-k, setelah menghilangkan pengaruh dari data di antara keduanya.

PACF menunjukkan:
- Korelasi langsung antara nilai sekarang dengan nilai masa lalu tertentu
- Digunakan untuk menentukan orde AR (p)

## 3. Cara Membaca ACF dan PACF

### Pola ACF

1. ACF menurun secara eksponensial atau sinusoidal
   - Menunjukkan adanya komponen AR (Autoregressive)
   - Tidak langsung menunjukkan orde AR

2. ACF terpotong setelah lag tertentu
   - Jika terpotong setelah lag q, maka orde MA = q
   - Contoh: ACF terpotong setelah lag 1 → q = 1

### Pola PACF

1. PACF terpotong setelah lag tertentu
   - Jika terpotong setelah lag p, maka orde AR = p
   - Contoh: PACF terpotong setelah lag 1 → p = 1

2. PACF menurun secara eksponensial
   - Menunjukkan adanya komponen MA (Moving Average)
   - Tidak langsung menunjukkan orde MA

## 4. Penentuan Parameter d (Differencing)

Parameter d ditentukan dari uji stasioneritas data:

1. Jika data sudah stasioner (tidak ada trend)
   - d = 0 (tidak perlu differencing)

2. Jika data tidak stasioner (ada trend)
   - Lakukan first difference (d = 1)
   - Jika masih tidak stasioner, lakukan second difference (d = 2)
   - Biasanya d = 1 atau d = 2 sudah cukup

### Cara Mengecek Stasioneritas

- Uji ADF (Augmented Dickey-Fuller)
- Visual inspection: plot data, jika ada trend naik/turun berarti tidak stasioner
- ACF menurun perlahan menunjukkan data tidak stasioner

## 5. Prosedur Pemilihan p, d, q yang Benar

### Langkah 1: Cek Stasioneritas dan Tentukan d

1. Plot data asli
2. Jika ada trend, lakukan differencing (d = 1)
3. Plot data setelah differencing
4. Jika masih ada trend, lakukan differencing lagi (d = 2)
5. Setelah data stasioner, lanjut ke langkah 2

### Langkah 2: Analisis ACF dan PACF pada Data Stasioner

1. Hitung ACF dan PACF dari data yang sudah stasioner (setelah differencing)
2. Plot ACF dan PACF
3. Tentukan p dari PACF:
   - Lihat lag terakhir di mana PACF signifikan (melewati confidence interval)
   - p = lag terakhir yang signifikan
4. Tentukan q dari ACF:
   - Lihat lag terakhir di mana ACF signifikan (melewati confidence interval)
   - q = lag terakhir yang signifikan

### Langkah 3: Validasi dengan Kriteria Informasi

Setelah mendapatkan kandidat p, d, q dari ACF/PACF:
1. Uji beberapa kombinasi p, d, q di sekitar nilai yang didapat
2. Gunakan AIC (Akaike Information Criterion) atau BIC (Bayesian Information Criterion)
3. Pilih model dengan AIC/BIC terendah

## 6. Contoh Interpretasi ACF/PACF

### Contoh 1: AR(1) - p = 1, d = 0, q = 0

- ACF: Menurun secara eksponensial
- PACF: Terpotong setelah lag 1 (signifikan di lag 1, tidak signifikan setelahnya)
- Kesimpulan: p = 1, d = 0, q = 0

### Contoh 2: MA(1) - p = 0, d = 0, q = 1

- ACF: Terpotong setelah lag 1 (signifikan di lag 1, tidak signifikan setelahnya)
- PACF: Menurun secara eksponensial
- Kesimpulan: p = 0, d = 0, q = 1

### Contoh 3: ARIMA(1,1,0) - p = 1, d = 1, q = 0

- Data asli: Tidak stasioner (ada trend)
- Setelah differencing (d = 1): Data menjadi stasioner
- ACF (data stasioner): Menurun secara eksponensial
- PACF (data stasioner): Terpotong setelah lag 1
- Kesimpulan: p = 1, d = 1, q = 0

### Contoh 4: ARIMA(2,1,1) - p = 2, d = 1, q = 1

- Data asli: Tidak stasioner
- Setelah differencing (d = 1): Data menjadi stasioner
- ACF (data stasioner): Terpotong setelah lag 1
- PACF (data stasioner): Terpotong setelah lag 2
- Kesimpulan: p = 2, d = 1, q = 1

## 7. Masalah dengan Pendekatan Saat Ini

### Pendekatan Saat Ini

Sistem saat ini menggunakan kombinasi p, d, q yang sudah ditentukan sebelumnya:
- (1, 0, 0)
- (1, 1, 0)
- (0, 0, 1)
- (2, 1, 0)
- (1, 1, 1)
- (0, 1, 1)
- (2, 1, 1)

### Masalah

1. Kombinasi ini dipilih secara arbitrary (random)
2. Tidak didasarkan pada analisis ACF/PACF data aktual
3. Bisa jadi tidak optimal untuk data tinggi gelombang yang spesifik

### Solusi yang Seharusnya

1. Analisis ACF/PACF pada data training
2. Tentukan p, d, q berdasarkan pola ACF/PACF
3. Uji beberapa kombinasi di sekitar nilai yang didapat
4. Pilih model terbaik berdasarkan AIC/BIC dan MAPE testing

## 8. Implementasi yang Seharusnya

### Langkah 1: Analisis ACF/PACF

Sistem sudah memiliki fitur untuk menghitung ACF/PACF di halaman Analisis ACF/PACF. Fitur ini harus digunakan untuk menentukan p, d, q.

### Langkah 2: Tentukan Kandidat p, d, q

Berdasarkan hasil ACF/PACF:
- Tentukan d dari uji stasioneritas
- Tentukan p dari PACF (lag terakhir yang signifikan)
- Tentukan q dari ACF (lag terakhir yang signifikan)

### Langkah 3: Uji Kombinasi

Uji beberapa kombinasi:
- Kombinasi utama: (p, d, q) dari ACF/PACF
- Kombinasi alternatif: (p±1, d, q), (p, d, q±1), dll
- Pilih yang terbaik berdasarkan MAPE testing

## 9. Ringkasan

- p, d, q tidak seharusnya dipilih secara random
- Harus didasarkan pada analisis ACF/PACF data aktual
- d ditentukan dari uji stasioneritas
- p ditentukan dari PACF (lag terakhir yang signifikan)
- q ditentukan dari ACF (lag terakhir yang signifikan)
- Validasi dengan AIC/BIC dan MAPE testing
- Sistem saat ini menggunakan kombinasi yang sudah ditentukan, perlu diperbaiki untuk menggunakan ACF/PACF sebagai landasan

