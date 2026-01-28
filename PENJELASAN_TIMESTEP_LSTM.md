# Penjelasan Timestep dalam Prediksi LSTM

## 1. Apa Itu Timestep?

Timestep (atau window size) adalah jumlah data historis yang digunakan oleh model LSTM untuk memprediksi nilai berikutnya.

Dalam sistem ini, timestep yang digunakan adalah 12.

## 2. Implementasi Timestep di Sistem

### Lokasi Kode

Python: python-ml/training/hybrid_trainer.py dan python-ml/utils/forecasting.py

```python
window: int = 12  # Timestep yang digunakan
```

### Cara Kerja

Model LSTM menggunakan 12 data residual sebelumnya untuk memprediksi residual berikutnya.

Contoh:
- Jika kita punya data residual: [r1, r2, r3, ..., r20]
- Dengan timestep = 12:
  - Input X[0] = [r1, r2, r3, ..., r12] → Target y[0] = r13
  - Input X[1] = [r2, r3, r4, ..., r13] → Target y[1] = r14
  - Input X[2] = [r3, r4, r5, ..., r14] → Target y[2] = r15
  - Dan seterusnya

## 3. Mengapa Timestep = 12?

Timestep 12 dipilih karena:

1. Data time series tinggi gelombang memiliki pola harian dan musiman
2. 12 timestep memberikan konteks yang cukup untuk mempelajari pola jangka pendek
3. Tidak terlalu panjang sehingga tidak membebani komputasi
4. Tidak terlalu pendek sehingga model masih bisa menangkap pola temporal

## 4. Prediksi Tidak Dibatasi Satu Bulan

Sistem ini tidak membatasi prediksi hanya satu bulan. Prediksi dapat dilakukan untuk berbagai periode sesuai kebutuhan.

### Frekuensi Prediksi

Prediksi dilakukan setiap 12 jam:
- 00:00 (tengah malam)
- 12:00 (siang)

Jadi dalam 1 hari ada 2 prediksi.

### Contoh Perhitungan

Jika user memilih tanggal 1-31 Januari 2025:
- Jumlah hari = 31 hari
- Jumlah prediksi = 31 × 2 = 62 prediksi
- Setiap prediksi menggunakan 12 timestep sebelumnya

## 5. Alur Prediksi dengan Timestep

1. Ambil 12 residual terakhir dari data training sebagai seed
2. Untuk setiap step prediksi:
   - Gunakan 12 residual terakhir (termasuk prediksi sebelumnya) sebagai input
   - Prediksi residual berikutnya
   - Update sequence: geser ke kiri, tambahkan prediksi baru di akhir
3. Ulangi sampai jumlah step yang diinginkan tercapai

## 6. Implementasi di Kode

### Training

```python
# Membuat sequence untuk training
X_train, y_train = create_sequences(resid_scaled, window=12)
# X_train shape: (n_sequences, 12, 1)
# y_train shape: (n_sequences,)
```

### Prediction

```python
# Prediksi iteratif menggunakan sliding window
current_seq = seed.copy().reshape(1, 12, 1)  # 12 timestep
for _ in range(n_steps):
    pred = model_lstm.predict_on_batch(current_seq)
    # Update sequence: geser ke kiri, tambahkan prediksi baru
    new_seq = np.append(current_seq.flatten()[1:], pred)
    current_seq = new_seq.reshape(1, 12, 1)
```

## 7. Ringkasan

- Timestep = 12: Model menggunakan 12 data historis untuk prediksi
- Prediksi tidak dibatasi satu bulan: Dapat dilakukan untuk berbagai periode
- Frekuensi prediksi: Setiap 12 jam (2 prediksi per hari)
- Sliding window: Setiap prediksi menggunakan hasil prediksi sebelumnya sebagai bagian dari input





