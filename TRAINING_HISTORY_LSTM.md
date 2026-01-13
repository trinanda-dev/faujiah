# Training History LSTM - Loss per Epoch

## 📋 **Overview**

Dokumen ini menjelaskan cara mendapatkan data training loss dan validation loss untuk setiap epoch selama training model LSTM.

---

## 🔧 **Fitur yang Tersedia**

### **1. Training History per Epoch**

Setelah training model LSTM selesai, sistem akan menyimpan:
- **Training Loss**: Loss pada setiap epoch untuk data training
- **Validation Loss**: Loss pada setiap epoch untuk data validation (jika tersedia)
- **Epoch Number**: Nomor epoch (1, 2, 3, ..., sampai training selesai)
- **Early Stopping Info**: Apakah training berhenti karena early stopping

### **2. Format Data**

Data training history disimpan dalam format JSON dengan struktur:
```json
{
  "loss": [0.1234, 0.0987, 0.0876, ...],
  "val_loss": [0.1456, 0.1123, 0.1023, ...],
  "epochs_trained": 85,
  "max_epochs": 200,
  "early_stopped": true,
  "epochs": [
    {
      "epoch": 1,
      "loss": 0.1234,
      "val_loss": 0.1456
    },
    {
      "epoch": 2,
      "loss": 0.0987,
      "val_loss": 0.1123
    },
    ...
  ]
}
```

---

## 📊 **Cara Mengakses Training History**

### **Metode 1: Endpoint API `/training-history`**

**URL**: `http://localhost:8001/training-history`

**Method**: `GET`

**Response**:
```json
{
  "status": "success",
  "training_history": {
    "loss": [0.1234, 0.0987, 0.0876, ...],
    "val_loss": [0.1456, 0.1123, 0.1023, ...],
    "epochs_trained": 85,
    "max_epochs": 200,
    "early_stopped": true,
    "epochs": [
      {
        "epoch": 1,
        "loss": 0.1234,
        "val_loss": 0.1456
      },
      {
        "epoch": 2,
        "loss": 0.0987,
        "val_loss": 0.1123
      },
      ...
    ]
  }
}
```

**Cara Mengakses**:
1. Pastikan FastAPI server berjalan di `http://localhost:8001`
2. Pastikan model LSTM sudah dilatih (melalui `/train/hybrid/sync`)
3. Akses: `http://localhost:8001/training-history`
4. Response akan berisi semua data loss per epoch

---

### **Metode 2: File JSON yang Tersimpan**

Setelah training selesai, history akan tersimpan dalam file JSON:

**Lokasi File**: `python-ml/models/lstm_training_history.json`

**Isi File**:
- Semua data training history dalam format JSON
- Dapat dibuka dengan text editor atau program JSON viewer
- Dapat di-import ke Excel atau tools analisis lainnya

**Cara Mengakses**:
1. Buka file `python-ml/models/lstm_training_history.json`
2. File ini berisi semua data loss per epoch

---

### **Metode 3: Response dari Endpoint `/train/hybrid/sync`**

Endpoint training juga mengembalikan training history dalam response:

**Response Field**: `training_history`

**Catatan**: 
- Training history hanya tersedia jika melakukan **full training** (bukan quick eval)
- Jika menggunakan model dari seed search (quick eval), training_history akan `null`

---

## 📈 **Contoh Data Training History**

### **Contoh untuk Epoch 10, 25, 50, 75, 100, 150, 200:**

```json
{
  "epochs": [
    {
      "epoch": 10,
      "loss": 0.0123,
      "val_loss": 0.0145
    },
    {
      "epoch": 25,
      "loss": 0.0087,
      "val_loss": 0.0102
    },
    {
      "epoch": 50,
      "loss": 0.0065,
      "val_loss": 0.0089
    },
    {
      "epoch": 75,
      "loss": 0.0054,
      "val_loss": 0.0078
    },
    {
      "epoch": 100,
      "loss": 0.0048,
      "val_loss": 0.0072
    },
    {
      "epoch": 150,
      "loss": 0.0042,
      "val_loss": 0.0068
    },
    {
      "epoch": 200,
      "loss": 0.0039,
      "val_loss": 0.0065
    }
  ]
}
```

**Catatan**: 
- Jika early stopping aktif, training mungkin berhenti sebelum mencapai 200 epoch
- Contoh: Jika training berhenti di epoch 85, maka data hanya sampai epoch 85

---

## 💻 **Contoh Penggunaan dengan cURL**

```bash
# Mengambil training history
curl http://localhost:8001/training-history
```

---

## 💻 **Contoh Penggunaan dengan Python**

```python
import requests
import json

# Mengambil training history
response = requests.get('http://localhost:8001/training-history')
data = response.json()

training_history = data['training_history']

# Akses loss per epoch
losses = training_history['loss']
val_losses = training_history.get('val_loss', [])

# Print loss untuk epoch tertentu
epochs_to_check = [10, 25, 50, 75, 100, 150, 200]
for epoch_num in epochs_to_check:
    if epoch_num <= len(losses):
        idx = epoch_num - 1  # Index 0-based
        print(f"Epoch {epoch_num}:")
        print(f"  Training Loss: {losses[idx]:.6f}")
        if val_losses:
            print(f"  Validation Loss: {val_losses[idx]:.6f}")
        print()

# Print semua epoch
print("\n=== All Epochs ===")
for epoch_data in training_history['epochs']:
    print(f"Epoch {epoch_data['epoch']}: Loss={epoch_data['loss']:.6f}", end="")
    if 'val_loss' in epoch_data:
        print(f", Val Loss={epoch_data['val_loss']:.6f}")
    else:
        print()
```

---

## 📝 **Informasi yang Tersedia**

### **1. Loss per Epoch**
- **Training Loss**: Loss pada setiap epoch untuk data training
- **Validation Loss**: Loss pada setiap epoch untuk data validation (jika tersedia)
- **Format**: Array of float, satu nilai per epoch

### **2. Metadata Training**
- **epochs_trained**: Jumlah epoch yang benar-benar dijalankan
- **max_epochs**: Maksimum epoch yang di-set (200 untuk full training, 50 untuk quick eval)
- **early_stopped**: Boolean, apakah training berhenti karena early stopping

### **3. Detailed Epoch Data**
- **epoch**: Nomor epoch (1, 2, 3, ...)
- **loss**: Training loss untuk epoch tersebut
- **val_loss**: Validation loss untuk epoch tersebut (jika tersedia)

---

## ⚠️ **Catatan Penting**

1. **Training History Hanya untuk Full Training**: 
   - History lengkap hanya tersedia untuk full training (200 epochs)
   - Quick evaluation (seed search) tidak menyimpan history lengkap

2. **Early Stopping**: 
   - Jika early stopping aktif, training mungkin berhenti sebelum mencapai max epochs
   - Contoh: Jika patience=10 dan loss tidak membaik selama 10 epoch, training akan berhenti

3. **Validation Loss**: 
   - Validation loss hanya tersedia jika validation data disediakan saat training
   - Jika tidak ada validation data, hanya training loss yang tersedia

4. **File History**: 
   - File history akan di-overwrite setiap kali training baru dilakukan
   - Untuk menyimpan history lama, backup file sebelum training baru

---

## 🔗 **Referensi**

- Endpoint: `python-ml/main.py` - `/training-history`
- Fungsi training: `python-ml/training/hybrid_trainer.py` - `train_lstm_residual()`
- File JSON: `python-ml/models/lstm_training_history.json`



