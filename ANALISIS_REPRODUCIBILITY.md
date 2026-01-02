# Analisis Masalah Reproducibility (Hasil Berbeda Setiap Running)

## 🔍 **Penyebab Hasil Berbeda Setiap Running**

### **1. Sumber Randomness di Model LSTM (Neural Network)**

#### **A. Inisialisasi Bobot (Weights Initialization)**
- **Masalah**: Bobot awal LSTM diinisialisasi secara **random** setiap kali model dibuat
- **Dampak**: Meskipun seed di-set, jika tidak di-set dengan benar di semua level, bobot awal bisa berbeda
- **Lokasi**: `python-ml/training/hybrid_trainer.py` line 80-87

#### **B. Optimizer Adam (Internal State)**
- **Masalah**: Adam optimizer memiliki **internal state** (momentum, variance estimates) yang diinisialisasi random
- **Dampak**: State awal yang berbeda → konvergensi berbeda → hasil akhir berbeda
- **Lokasi**: `python-ml/training/hybrid_trainer.py` line 89

#### **C. Batch Shuffling (jika ada)**
- **Status**: ✅ **TIDAK ADA** - Data time series tidak di-shuffle (sudah benar)
- **Catatan**: Time series harus tetap urut, tidak boleh di-shuffle

#### **D. Early Stopping (Epoch yang Berbeda)**
- **Masalah**: Jika training loss sedikit berbeda, early stopping bisa berhenti di epoch berbeda
- **Dampak**: Model dengan epoch berbeda → bobot final berbeda → hasil prediksi berbeda

### **2. Sumber Randomness di Model ARIMAX**

#### **A. Optimasi L-BFGS (Numerical Optimization)**
- **Masalah**: Statsmodels menggunakan L-BFGS untuk optimasi parameter
- **Dampak**: Meskipun seed di-set, optimasi numerik bisa konvergen ke solusi yang sedikit berbeda
- **Lokasi**: `python-ml/training/arimax_trainer.py` line 42, 55

#### **B. Starting Values untuk Optimasi**
- **Masalah**: Starting values untuk optimasi bisa dipilih secara random
- **Dampak**: Starting point berbeda → hasil optimasi bisa berbeda

### **3. Sumber Randomness di TensorFlow/Keras**

#### **A. Multiple Random Seeds**
TensorFlow memiliki **3 level randomness** yang harus di-set:
1. **Python random seed** - untuk operasi Python
2. **NumPy random seed** - untuk operasi NumPy (sudah ada: `np.random.seed(42)`)
3. **TensorFlow random seed** - untuk operasi TensorFlow (sudah ada: `tf.random.set_seed(42)`)

#### **B. GPU Operations (jika menggunakan GPU)**
- **Masalah**: Operasi GPU bisa memiliki non-deterministic behavior
- **Dampak**: Hasil bisa berbeda meskipun seed sama
- **Solusi**: Set `tf.config.experimental.enable_op_determinism()` (jika tersedia)

#### **C. TensorFlow Operations Determinism**
- **Masalah**: Beberapa operasi TensorFlow secara default non-deterministic
- **Dampak**: Hasil bisa berbeda setiap run
- **Solusi**: Set determinism flags

## ✅ **Solusi yang Sudah Ada**

### **1. Seed di ARIMAX Training**
```python
# python-ml/training/arimax_trainer.py line 42
np.random.seed(42)
```
✅ **Sudah ada** - Tapi mungkin tidak cukup untuk statsmodels

### **2. Seed di LSTM Training**
```python
# python-ml/training/hybrid_trainer.py line 80
tf.random.set_seed(seed)  # seed=42 by default
```
✅ **Sudah ada** - Tapi hanya TensorFlow seed, belum Python random seed

### **3. Seed di Model Evaluation**
```python
# python-ml/main.py line 794
np.random.seed(42)
```
✅ **Sudah ada** - Untuk evaluasi model

## ❌ **Yang Masih Kurang**

### **1. Python Random Seed**
- **Status**: ❌ **BELUM ADA**
- **Dampak**: Operasi Python random (jika ada) bisa berbeda
- **Solusi**: Tambahkan `random.seed(42)` di awal training

### **2. TensorFlow Determinism**
- **Status**: ❌ **BELUM ADA**
- **Dampak**: Operasi TensorFlow bisa non-deterministic
- **Solusi**: Set determinism flags

### **3. Model Re-initialization**
- **Status**: ❌ **BELUM ADA**
- **Dampak**: Jika model dibuat ulang, bobot bisa berbeda
- **Solusi**: Pastikan seed di-set SEBELUM membuat model

### **4. Optimizer State Reset**
- **Status**: ❌ **BELUM ADA**
- **Dampak**: Jika optimizer digunakan ulang, state bisa berbeda
- **Solusi**: Buat optimizer baru setiap training (sudah dilakukan via `compile()`)

## 🔧 **Rekomendasi Perbaikan**

### **Prioritas 1: Fix TensorFlow/Keras Reproducibility**
Tambahkan di awal fungsi `train_lstm_residual`:

```python
import random
import os

# Set all random seeds
random.seed(seed)
np.random.seed(seed)
tf.random.set_seed(seed)

# Set TensorFlow determinism (if available)
try:
    tf.config.experimental.enable_op_determinism()
except:
    pass  # Not available in older TensorFlow versions

# Set environment variable for reproducibility
os.environ['PYTHONHASHSEED'] = str(seed)
```

### **Prioritas 2: Fix ARIMAX Reproducibility**
Pastikan seed di-set di semua tempat yang memanggil statsmodels:

```python
# Set seed SEBELUM membuat model
np.random.seed(42)
# ... buat dan fit model
```

### **Prioritas 3: Fix Model Initialization Order**
Pastikan seed di-set **SEBELUM** membuat model, bukan setelah:

```python
# ✅ BENAR
tf.random.set_seed(seed)
model = Sequential([...])

# ❌ SALAH
model = Sequential([...])
tf.random.set_seed(seed)  # Terlambat!
```

## 📊 **Perkiraan Dampak**

### **Jika Tidak Diperbaiki:**
- **Variasi MAPE**: ±0.5% - 2% (tergantung kompleksitas model)
- **Variasi Prediksi**: Bisa berbeda signifikan untuk beberapa data point
- **Masalah**: Sulit untuk reproduce hasil eksperimen

### **Jika Diperbaiki:**
- **Variasi MAPE**: <0.1% (hanya karena floating point precision)
- **Variasi Prediksi**: Minimal (hanya perbedaan numerik kecil)
- **Keuntungan**: Hasil dapat di-reproduce dengan sempurna

## 🎯 **Kesimpulan**

**Penyebab utama hasil berbeda:**
1. ✅ **Bobot awal LSTM** - diinisialisasi random (seed sudah ada tapi mungkin tidak cukup)
2. ✅ **Optimizer state** - Adam memiliki internal state yang random
3. ✅ **TensorFlow operations** - beberapa operasi non-deterministic
4. ✅ **Python random** - belum di-set seed
5. ✅ **ARIMAX optimization** - optimasi numerik bisa sedikit berbeda

**Solusi:**
- Set **SEMUA** random seeds (Python, NumPy, TensorFlow)
- Set TensorFlow determinism
- Pastikan seed di-set **SEBELUM** membuat model
- Test reproducibility dengan menjalankan training 2x dan bandingkan hasil

