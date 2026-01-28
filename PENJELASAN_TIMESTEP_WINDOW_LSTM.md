# Penjelasan Timestep/Window LSTM dalam Prediksi Hybrid

## 1. Apa Itu Timestep/Window?

Timestep (atau window size) adalah jumlah data historis yang digunakan oleh model LSTM sebagai input untuk memprediksi nilai berikutnya.

Dalam sistem ini, **window = 12** digunakan untuk semua prediksi LSTM.

## 2. Implementasi Window = 12 di Sistem

### Lokasi Kode

- **Training**: `python-ml/training/hybrid_trainer.py`
- **Prediction**: `python-ml/utils/forecasting.py`
- **Main API**: `python-ml/main.py`

### Cara Kerja

Model LSTM menggunakan **12 data residual sebelumnya** untuk memprediksi residual berikutnya.

**Contoh:**
- Jika kita punya data residual: `[r1, r2, r3, ..., r20]`
- Dengan window = 12:
  - Input X[0] = `[r1, r2, r3, ..., r12]` → Target y[0] = `r13`
  - Input X[1] = `[r2, r3, r4, ..., r13]` → Target y[1] = `r14`
  - Input X[2] = `[r3, r4, r5, ..., r14]` → Target y[2] = `r15`
  - Dan seterusnya

## 3. Mengapa Window = 12?

Window = 12 dipilih karena beberapa alasan:

### 3.1. Pola Temporal Data

Data tinggi gelombang memiliki pola temporal yang kompleks:
- **Pola harian**: Gelombang cenderung berubah setiap 12 jam (00:00 dan 12:00)
- **Pola jangka pendek**: Pola gelombang dalam beberapa hari terakhir mempengaruhi prediksi
- **Pola musiman**: Gelombang memiliki pola musiman yang perlu ditangkap

### 3.2. Keseimbangan antara Konteks dan Kompleksitas

- **12 timestep memberikan konteks yang cukup** untuk mempelajari pola jangka pendek (6 hari jika data per 12 jam)
- **Tidak terlalu panjang** sehingga tidak membebani komputasi dan menghindari overfitting
- **Tidak terlalu pendek** sehingga model masih bisa menangkap pola temporal yang penting

### 3.3. Konsistensi dengan Frekuensi Data

Data tinggi gelombang diambil setiap 12 jam (00:00 dan 12:00):
- 12 timestep = 12 × 12 jam = 144 jam = 6 hari
- Ini memberikan konteks 6 hari terakhir untuk memprediksi nilai berikutnya
- Pola gelombang dalam 6 hari biasanya cukup untuk prediksi jangka pendek

### 3.4. Hasil Eksperimen

Window = 12 dipilih berdasarkan eksperimen dan evaluasi performa model. Window ini memberikan keseimbangan terbaik antara:
- Akurasi prediksi
- Waktu komputasi
- Kemampuan model untuk generalisasi

## 4. Prediksi Iteratif dengan Sliding Window

### 4.1. Proses Prediksi

Prediksi dilakukan secara iteratif menggunakan sliding window:

1. **Inisialisasi**: Ambil 12 residual terakhir dari data training sebagai seed
   ```python
   seed = resid_scaled[-12:].reshape(1, 12, 1)
   ```

2. **Prediksi Iteratif**: Untuk setiap step prediksi:
   - Gunakan 12 residual terakhir (termasuk prediksi sebelumnya) sebagai input
   - Prediksi residual berikutnya
   - Update sequence: geser ke kiri, tambahkan prediksi baru di akhir
   
   **Contoh:**
   - Step 1: Input `[r1, r2, ..., r12]` → Prediksi `r13`
   - Step 2: Input `[r2, r3, ..., r13]` → Prediksi `r14`
   - Step 3: Input `[r3, r4, ..., r14]` → Prediksi `r15`
   - Dan seterusnya

3. **Inverse Transform**: Konversi hasil prediksi kembali ke skala asli

### 4.2. Implementasi di Kode

```python
def predict_residuals_iterative(
    model_lstm: tf.keras.Model,
    scaler: MinMaxScaler,
    seed: np.ndarray,
    n_steps: int,
    window: int = 12,  # Window = 12
) -> np.ndarray:
    # Inisialisasi sequence dengan seed (12 timestep terakhir)
    current_seq = seed.copy().reshape(1, window, 1)
    predicted_resid_scaled = []

    # Prediksi iteratif: setiap prediksi menggunakan hasil prediksi sebelumnya
    for _ in range(n_steps):
        # Prediksi residual berikutnya menggunakan sequence saat ini
        p_scaled = model_lstm.predict_on_batch(current_seq)[0, 0]
        predicted_resid_scaled.append(p_scaled)
        
        # Update sequence: geser ke kiri, tambahkan prediksi baru di akhir
        # [1,2,3,...,12] -> [2,3,4,...,12,prediksi_baru]
        new_seq = np.append(current_seq.flatten()[1:], p_scaled)
        current_seq = new_seq.reshape(1, window, 1)

    # Inverse transform untuk mendapatkan nilai residual dalam skala asli
    predicted_resid = scaler.inverse_transform(
        np.array(predicted_resid_scaled).reshape(-1, 1)
    ).flatten()
    return predicted_resid
```

## 5. Prediksi Tidak Dibatasi Satu Bulan

Sistem ini **tidak membatasi prediksi hanya satu bulan**. Prediksi dapat dilakukan untuk berbagai periode sesuai kebutuhan.

### 5.1. Prediksi Otomatis

- **Dinamis**: Mulai dari tanggal setelah data terakhir + 1 hari
- **Default**: 30 hari ke depan (60 prediksi: 30 hari × 2 per hari)
- **Frekuensi**: Setiap 12 jam (00:00 dan 12:00)

### 5.2. Prediksi Manual

- **Fleksibel**: User dapat memilih tanggal mulai dan akhir
- **Maksimal**: Dapat diprediksi untuk periode yang lebih panjang jika diperlukan
- **Frekuensi**: Setiap 12 jam (00:00 dan 12:00)

### 5.3. Contoh Perhitungan

Jika user memilih prediksi untuk 30 hari:
- Jumlah hari = 30 hari
- Jumlah prediksi = 30 × 2 = 60 prediksi
- Setiap prediksi menggunakan 12 timestep sebelumnya (sliding window)

## 6. Hubungan Window dengan Training

### 6.1. Training LSTM

Saat training, model LSTM belajar dari sequence data dengan window = 12:

```python
# Membuat sequence untuk training
X_train, y_train = create_sequences(resid_scaled, window=12)
# X_train shape: (n_sequences, 12, 1)
# y_train shape: (n_sequences,)
```

### 6.2. Konsistensi Window

Window yang digunakan saat training **harus sama** dengan window yang digunakan saat prediksi:
- Training: window = 12
- Prediction: window = 12

Ini memastikan bahwa model yang dilatih dapat digunakan untuk prediksi dengan benar.

## 7. Ringkasan

- **Window = 12**: Model menggunakan 12 data historis untuk prediksi
- **Alasan**: Keseimbangan antara konteks temporal, kompleksitas komputasi, dan akurasi prediksi
- **Sliding Window**: Setiap prediksi menggunakan hasil prediksi sebelumnya sebagai bagian dari input
- **Prediksi Dinamis**: Tidak dibatasi satu bulan, dapat diprediksi untuk berbagai periode
- **Frekuensi**: Setiap 12 jam (00:00 dan 12:00)
- **Konsistensi**: Window yang sama digunakan untuk training dan prediction

