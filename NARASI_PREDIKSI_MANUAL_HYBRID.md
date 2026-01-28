# F. Prediksi Ketinggian Gelombang Menggunakan Model Hybrid ARIMAX-LSTM

## 1. Pendahuluan

Sistem prediksi ketinggian gelombang menggunakan model Hybrid ARIMAX-LSTM memungkinkan pengguna untuk melakukan prediksi secara manual dengan memilih periode prediksi dan input kecepatan angin sesuai kebutuhan. Prediksi dilakukan dengan menggabungkan kelebihan model ARIMAX untuk menangkap pola linear dan model LSTM untuk menangkap pola non-linear pada residual ARIMAX.

## 2. Konsep Prediksi Manual

Prediksi manual memberikan fleksibilitas kepada pengguna untuk menentukan:
- **Periode Prediksi**: Tanggal mulai dan tanggal akhir prediksi yang dapat dipilih secara bebas
- **Input Kecepatan Angin**: Dua mode input tersedia:
  - **Mode Konstan**: Satu nilai kecepatan angin digunakan untuk seluruh periode prediksi
  - **Mode Time-varying**: Kecepatan angin dapat diinput per time step sesuai dengan resolusi data model

### 2.1. Resolusi Data dan Time Step

Sistem menggunakan resolusi data **12 jam**, artinya prediksi dilakukan setiap 12 jam (pukul 00:00 dan 12:00). Perhitungan jumlah time step dilakukan sebagai berikut:

- **Jumlah hari** = (tanggal akhir - tanggal mulai) + 1
- **Jumlah time step (n_steps)** = jumlah hari × 2

**Contoh:**
- Jika user memilih prediksi dari 1 Januari 2025 sampai 3 Januari 2025 (3 hari)
- Maka jumlah time step = 3 hari × 2 = 6 time step
- Timestamps yang dihasilkan:
  1. 01/01/2025 00:00
  2. 01/01/2025 12:00
  3. 02/01/2025 00:00
  4. 02/01/2025 12:00
  5. 03/01/2025 00:00
  6. 03/01/2025 12:00

## 3. Proses Teknis Prediksi Hybrid

Prediksi menggunakan model Hybrid dilakukan melalui beberapa tahap yang saling terintegrasi:

### 3.1. Tahap 1: Persiapan Data Input

#### 3.1.1. Generate Timestamps
Sistem menghasilkan array timestamps untuk setiap time step berdasarkan periode yang dipilih:
- Mulai dari pukul 00:00 tanggal mulai
- Setiap time step berjarak 12 jam
- Berakhir pada pukul 23:59:59 tanggal akhir

#### 3.1.2. Persiapan Variabel Eksogen (Kecepatan Angin)

**Mode Konstan:**
- User menginput satu nilai kecepatan angin
- Sistem mereplikasi nilai tersebut menjadi array dengan panjang sesuai jumlah time step
- Contoh: Jika n_steps = 6 dan wind_speed = 5.5 m/s, maka array menjadi [5.5, 5.5, 5.5, 5.5, 5.5, 5.5]

**Mode Time-varying:**
- User menginput kecepatan angin untuk setiap time step
- Sistem memvalidasi bahwa jumlah input sesuai dengan jumlah time step
- Array kecepatan angin langsung digunakan sebagai variabel eksogen

### 3.2. Tahap 2: Prediksi ARIMAX

Model ARIMAX melakukan prediksi tinggi gelombang berdasarkan:
- **Data historis**: Pola dari data training yang sudah dilatih
- **Variabel eksogen**: Array kecepatan angin untuk setiap time step prediksi

**Proses:**
1. Model ARIMAX yang sudah dilatih dimuat dari storage
2. Prediksi dilakukan menggunakan metode `get_forecast()` dengan parameter:
   - `steps = n_steps` (jumlah time step yang akan diprediksi)
   - `exog = wind_speed_array` (array kecepatan angin untuk setiap time step)
3. Hasil prediksi ARIMAX (`arimax_pred`) diperoleh untuk setiap time step

**Formula:**
```
ARIMAX_pred[t] = f(historical_data, wind_speed[t], ARIMAX_parameters)
```

### 3.3. Tahap 3: Prediksi Residual dengan LSTM

Model LSTM memprediksi residual (selisih antara nilai aktual dan prediksi ARIMAX) menggunakan pendekatan sliding window.

#### 3.3.1. Konsep Window/Time Step LSTM

Sistem menggunakan **window size = 12** untuk model LSTM. Window size ini berarti:
- Model menggunakan **12 data residual sebelumnya** sebagai input untuk memprediksi residual berikutnya
- Window = 12 setara dengan **6 hari** data historis (karena resolusi data 12 jam)
- Window ini dipilih berdasarkan keseimbangan antara konteks temporal yang cukup dan kompleksitas komputasi

#### 3.3.2. Proses Prediksi Iteratif

Prediksi residual dilakukan secara iteratif menggunakan pendekatan sliding window:

**Langkah 1: Inisialisasi Seed**
- Ambil 12 residual terakhir dari data training sebagai seed
- Seed ini sudah dinormalisasi menggunakan MinMaxScaler
- Format seed: `(1, 12, 1)` - 1 batch, 12 timestep, 1 feature

**Langkah 2: Prediksi Iteratif**
Untuk setiap time step prediksi (dari 1 sampai n_steps):

1. **Input Sequence**: Gunakan 12 residual terakhir (termasuk prediksi sebelumnya) sebagai input
   - Step 1: `[r1, r2, r3, ..., r12]` → Prediksi `r13`
   - Step 2: `[r2, r3, r4, ..., r13]` → Prediksi `r14`
   - Step 3: `[r3, r4, r5, ..., r14]` → Prediksi `r15`
   - Dan seterusnya

2. **Prediksi**: Model LSTM memprediksi residual berikutnya berdasarkan sequence input

3. **Update Sequence**: Geser window ke kiri dan tambahkan prediksi baru di akhir
   - Sequence lama: `[r1, r2, ..., r12]`
   - Prediksi baru: `r13`
   - Sequence baru: `[r2, r3, ..., r12, r13]`

**Algoritma:**
```python
# Inisialisasi dengan seed (12 residual terakhir dari training)
current_seq = seed.copy().reshape(1, 12, 1)
predicted_resid_scaled = []

# Prediksi iteratif untuk n_steps
for step in range(n_steps):
    # Prediksi residual berikutnya
    predicted_resid = model_lstm.predict(current_seq)[0, 0]
    predicted_resid_scaled.append(predicted_resid)
    
    # Update sequence: geser ke kiri, tambahkan prediksi baru
    new_seq = [current_seq[1:], predicted_resid]
    current_seq = new_seq.reshape(1, 12, 1)

# Inverse transform untuk mendapatkan nilai dalam skala asli
predicted_resid = scaler.inverse_transform(predicted_resid_scaled)
```

#### 3.3.3. Normalisasi dan Denormalisasi

- **Normalisasi**: Residual training data dinormalisasi menggunakan MinMaxScaler sebelum training LSTM
- **Denormalisasi**: Hasil prediksi LSTM (yang masih dalam skala normalisasi) di-inverse transform kembali ke skala asli

### 3.4. Tahap 4: Kombinasi Prediksi Hybrid

Prediksi final diperoleh dengan menjumlahkan prediksi ARIMAX dan prediksi residual LSTM:

**Formula:**
```
Hybrid_pred[t] = ARIMAX_pred[t] + LSTM_residual_pred[t]
```

**Penjelasan:**
- ARIMAX menangkap pola linear dan tren dari data historis dan variabel eksogen
- LSTM menangkap pola non-linear yang tidak dapat ditangkap oleh ARIMAX (residual)
- Kombinasi keduanya menghasilkan prediksi yang lebih akurat

## 4. Alur Lengkap Prediksi Manual

Berikut adalah alur lengkap dari input user sampai hasil prediksi:

### 4.1. Input User
1. User memilih tanggal mulai dan tanggal akhir prediksi
2. User memilih mode input kecepatan angin (konstan atau time-varying)
3. User menginput nilai kecepatan angin sesuai mode yang dipilih

### 4.2. Validasi dan Persiapan (Backend Laravel)
1. Validasi tanggal (tanggal akhir harus setelah tanggal mulai)
2. Hitung jumlah hari dan time step (n_steps)
3. Generate timestamps untuk setiap time step (per 12 jam)
4. Validasi dan prepare array kecepatan angin:
   - Mode konstan: Replikasi nilai menjadi array panjang n_steps
   - Mode time-varying: Validasi jumlah input sesuai n_steps

### 4.3. Prediksi di FastAPI (Python)
1. **Load Models**: Memuat model ARIMAX dan LSTM yang sudah dilatih
2. **Prediksi ARIMAX**: 
   - Input: Array kecepatan angin (n_steps)
   - Output: Prediksi ARIMAX untuk setiap time step
3. **Prediksi Residual LSTM**:
   - Ambil seed: 12 residual terakhir dari training data
   - Prediksi iteratif menggunakan sliding window (window = 12)
   - Output: Prediksi residual untuk setiap time step
4. **Kombinasi Hybrid**:
   - Jumlahkan ARIMAX_pred + LSTM_residual_pred
   - Output: Prediksi Hybrid untuk setiap time step

### 4.4. Tampilan Hasil (Frontend)
1. Grafik prediksi ketinggian gelombang
2. Tabel detail prediksi dengan informasi:
   - Tanggal dan waktu
   - Prediksi Hybrid
   - Prediksi ARIMAX (opsional)
   - Residual LSTM (opsional)

## 5. Kelebihan Prediksi Manual

1. **Fleksibilitas Periode**: User dapat memilih periode prediksi sesuai kebutuhan
2. **Kontrol Input**: User dapat mengatur kecepatan angin untuk setiap time step
3. **Akurasi**: Menggabungkan kelebihan ARIMAX (pola linear) dan LSTM (pola non-linear)
4. **Transparansi**: User dapat melihat kontribusi ARIMAX dan LSTM terhadap prediksi final

## 6. Parameter Teknis

### 6.1. Window Size LSTM
- **Nilai**: 12 timestep
- **Makna**: 6 hari data historis (karena resolusi 12 jam)
- **Alasan**: Keseimbangan antara konteks temporal yang cukup dan kompleksitas komputasi

### 6.2. Resolusi Data
- **Frekuensi**: Setiap 12 jam
- **Waktu**: 00:00 dan 12:00
- **Jumlah prediksi per hari**: 2 prediksi

### 6.3. Proses Prediksi
- **Metode**: Iteratif dengan sliding window
- **Seed**: 12 residual terakhir dari training data
- **Normalisasi**: MinMaxScaler untuk residual
- **Kombinasi**: Penjumlahan ARIMAX_pred + LSTM_residual_pred

## 7. Contoh Perhitungan

**Skenario**: User memilih prediksi dari 1 Januari 2025 sampai 5 Januari 2025 dengan kecepatan angin konstan 5.5 m/s

**Perhitungan:**
- Jumlah hari = (5 - 1) + 1 = 5 hari
- Jumlah time step (n_steps) = 5 × 2 = 10 time step
- Array kecepatan angin = [5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5]

**Proses Prediksi:**
1. ARIMAX memprediksi 10 nilai tinggi gelombang menggunakan array kecepatan angin
2. LSTM memprediksi 10 nilai residual menggunakan sliding window (window = 12)
3. Hybrid prediksi = ARIMAX_pred + LSTM_residual_pred untuk setiap time step

**Hasil:**
- 10 prediksi tinggi gelombang untuk periode 1-5 Januari 2025
- Setiap prediksi mewakili waktu 00:00 atau 12:00

## 8. Kesimpulan

Prediksi manual menggunakan model Hybrid ARIMAX-LSTM memberikan fleksibilitas dan kontrol kepada pengguna untuk melakukan prediksi sesuai kebutuhan. Proses prediksi dilakukan dengan menggabungkan kelebihan ARIMAX untuk pola linear dan LSTM untuk pola non-linear, dengan menggunakan window size 12 untuk menangkap konteks temporal yang cukup dari data historis.




