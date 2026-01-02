# Analisis Masalah MAPE: Validasi vs Test Set

## Ringkasan Masalah

**Fenomena yang Terjadi:**
- MAPE Validasi: ~10% (bagus) → Parameter (2,1,0) dipilih
- MAPE Test ARIMAX: ~32% (jelek) → 3x lebih buruk dari validasi
- MAPE Test Hybrid: ~32% (jelek) → LSTM tidak membantu, bahkan sedikit memperburuk

## Penjelasan Masalah

### 1. **Overfitting pada Validation Set**

**Apa yang Terjadi:**
- Model ARIMAX dengan parameter (2,1,0) **overfit** pada validation set
- Model "menghafal" pola di validation set, bukan belajar pola umum
- Ketika diterapkan ke test set (data baru), performa turun drastis

**Mengapa Bisa Terjadi:**
1. **Parameter terlalu kompleks**: (2,1,0) mungkin terlalu kompleks untuk ukuran dataset
2. **Validation set terlalu kecil**: 15% mungkin tidak cukup untuk validasi yang robust
3. **Data distribution berbeda**: Test set mungkin memiliki karakteristik yang berbeda dengan validation set

**Bukti dari Log:**
```
ARIMAX MAPE - Validation: 10.xx%, Test: 32.xx%
```
Selisih 3x menunjukkan overfitting yang signifikan.

### 2. **LSTM Memperburuk Prediksi (Bias Tinggi)**

**Mengapa LSTM Bisa "Mendongkrak" Akurasi dari 10% ke 30%:**

#### A. **Residual Training vs Test Set Berbeda**

**Proses Training LSTM:**
1. ARIMAX dilatih pada **training set** (70%)
2. Residual training = `actual_train - pred_arimax_train`
3. LSTM dilatih untuk memprediksi residual training ini
4. LSTM belajar pola residual dari **training set**

**Proses Prediksi Test Set:**
1. ARIMAX memprediksi test set → menghasilkan `pred_arimax_test`
2. Residual test aktual = `actual_test - pred_arimax_test`
3. LSTM harus memprediksi residual test ini
4. **MASALAH**: LSTM tidak pernah "melihat" residual test set saat training!

**Analogi:**
- LSTM dilatih untuk memprediksi pola residual di training set
- Tapi saat test, pola residual test set berbeda
- LSTM "bingung" karena pola yang dipelajari tidak cocok

#### B. **Error Akumulasi dalam Prediksi Iteratif**

**Cara LSTM Memprediksi:**
```python
# Prediksi iteratif (sliding window)
for i in range(n_steps):
    pred[i] = LSTM(seed[i-12:i])  # Prediksi menggunakan 12 nilai sebelumnya
    seed[i-12:i] = [seed[i-11:i], pred[i]]  # Update seed dengan prediksi
```

**Masalah:**
1. **Error terakumulasi**: Setiap prediksi menggunakan prediksi sebelumnya
2. **Error kecil di awal** → **Error besar di akhir**
3. Untuk 220 prediksi (test set), error bisa terakumulasi signifikan

**Contoh:**
- Prediksi ke-1: error 0.01
- Prediksi ke-2: error 0.02 (menggunakan prediksi ke-1 yang sudah error)
- Prediksi ke-3: error 0.03 (menggunakan prediksi ke-2 yang sudah error)
- ...dst
- Prediksi ke-220: error bisa sangat besar

#### C. **Domain Shift (Perubahan Distribusi Data)**

**Kemungkinan:**
- Training set: pola data tertentu (misalnya musim tertentu)
- Validation set: pola serupa dengan training
- Test set: pola berbeda (misalnya musim berbeda, kondisi cuaca berbeda)

**Dampak:**
- ARIMAX tidak generalize dengan baik → MAPE test tinggi
- Residual test set memiliki pola yang berbeda dengan residual training
- LSTM tidak bisa menangkap pola baru ini → prediksi residual jelek

### 3. **Mengapa LSTM Tidak Membantu (Bahkan Memperburuk)**

**Dari Log:**
```
ARIMAX Test MAPE: 32.91%
Hybrid Test MAPE: 32.56%
```

**Analisis:**
- LSTM hanya sedikit membantu (32.91% → 32.56%)
- Tapi masih jauh dari target (10% dari validasi)
- Ini menunjukkan LSTM **tidak efektif** untuk kasus ini

**Alasan LSTM Tidak Efektif:**

1. **Residual tidak memiliki pola yang kuat**
   - Jika residual ARIMAX sudah random/white noise, LSTM tidak bisa belajar pola
   - LSTM hanya menambahkan noise tambahan

2. **LSTM overfit pada residual training**
   - LSTM belajar pola spesifik residual training
   - Tapi pola ini tidak berlaku untuk test set

3. **Prediksi iteratif mengakumulasi error**
   - Error kecil di awal → error besar di akhir
   - Untuk 220 prediksi, akumulasi error signifikan

## Solusi dan Rekomendasi

### 1. **Perbaiki Model Selection**

**Masalah Saat Ini:**
- Model dipilih berdasarkan validation MAPE saja
- Tidak mempertimbangkan gap antara validation dan test MAPE

**Solusi:**
- Gunakan **cross-validation** atau **time-series cross-validation**
- Pilih model yang memiliki **gap kecil** antara validation dan test MAPE
- Pertimbangkan model yang lebih sederhana (misalnya (1,1,0) atau (0,1,1))

### 2. **Perbaiki LSTM Training**

**Masalah Saat Ini:**
- LSTM hanya dilatih pada residual training
- Tidak ada mekanisme untuk menangani domain shift

**Solusi:**
- **Gunakan residual validation untuk early stopping** (sudah dilakukan, bagus!)
- **Regularisasi lebih kuat**: dropout, L2 regularization
- **Ensemble**: Gabungkan beberapa model LSTM
- **Transfer learning**: Fine-tune LSTM pada residual validation

### 3. **Evaluasi Residual**

**Sebelum menggunakan LSTM, evaluasi:**
- Apakah residual ARIMAX sudah white noise? (jika ya, LSTM tidak akan membantu)
- Apakah residual memiliki pola yang kuat? (jika tidak, LSTM tidak efektif)
- Apakah residual training dan test set memiliki distribusi yang sama?

### 4. **Alternatif: Gunakan ARIMAX Saja**

**Jika LSTM tidak membantu:**
- Pertimbangkan menggunakan **ARIMAX saja** tanpa LSTM
- Fokus pada **tuning parameter ARIMAX** yang lebih baik
- Coba parameter yang lebih sederhana: (1,1,0), (0,1,1), (1,1,1)

### 5. **Perbaiki Data Split**

**Pertimbangkan:**
- Apakah 70:15:15 sudah optimal?
- Untuk time series, mungkin perlu **walk-forward validation**
- Pastikan test set mewakili kondisi real-world

## Kesimpulan

**Masalah Utama:**
1. **Overfitting**: Model (2,1,0) overfit pada validation set
2. **Domain Shift**: Test set memiliki karakteristik berbeda
3. **LSTM Tidak Efektif**: Residual test set berbeda dengan training, LSTM tidak bisa generalize

**Rekomendasi:**
1. Pilih model yang lebih sederhana dan robust
2. Evaluasi apakah LSTM benar-benar membantu
3. Pertimbangkan menggunakan ARIMAX saja jika LSTM tidak efektif
4. Perbaiki metodologi model selection

