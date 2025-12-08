# Flow Integrasi Laravel dengan FastAPI Python ML Service

## 📊 Diagram Flow Lengkap

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Frontend)                     │
│                    (React/Inertia Pages)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LARAVEL BACKEND                               │
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │ DataController   │      │ FastAPIController│                 │
│  │ (Upload ke DB)   │      │ (Integrasi ML)   │                 │
│  └──────────────────┘      └──────────────────┘                 │
│         │                            │                           │
│         │                            │                           │
│         ▼                            ▼                           │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  Database        │      │  FastAPIService   │                │
│  │  (MySQL/SQLite)  │      │  (HTTP Client)    │                │
│  └──────────────────┘      └──────────────────┘                │
│                                      │                           │
└──────────────────────────────────────┼───────────────────────────┘
                                       │ HTTP Request
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              FASTAPI PYTHON ML SERVICE                          │
│              (http://localhost:8000)                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Endpoints:                                              │   │
│  │  - POST /upload-dataset                                  │   │
│  │  - POST /train/arimax                                    │   │
│  │  - POST /train/hybrid                                     │   │
│  │  - GET  /evaluate                                         │   │
│  │  - POST /predict                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │ Training Modules │      │ Utils Modules    │                 │
│  │ - arimax_trainer │      │ - preprocessing  │                 │
│  │ - hybrid_trainer │      │ - forecasting    │                 │
│  └──────────────────┘      │ - evaluation     │                 │
│                             └──────────────────┘                 │
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │  Models Folder   │      │  Data Folder      │                 │
│  │  - arimax_model  │      │  - upload.xlsx   │                 │
│  │  - lstm_model    │      │  - train/test CSV │                 │
│  │  - scaler        │      │  - results CSV    │                 │
│  └──────────────────┘      └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flow Detail Step-by-Step

### **FLOW 1: Menggunakan FastAPI (Recommended - Baru)**

#### **Step 1: Upload Dataset ke FastAPI**
```
User → Frontend (Upload Excel)
  → POST /fastapi/upload-dataset
  → FastAPIController::uploadDataset()
  → FastAPIService::uploadDataset()
  → HTTP POST http://localhost:8000/upload-dataset
  → FastAPI menyimpan ke python-ml/data/upload.xlsx
  → Response: {status: "success", rows: 100, ...}
```

#### **Step 2: Train ARIMAX**
```
User → Frontend (Click "Train ARIMAX")
  → POST /fastapi/train/arimax?sync=true
  → FastAPIController::trainARIMAX()
  → FastAPIService::trainARIMAXSync()
  → HTTP POST http://localhost:8000/train/arimax/sync
  → FastAPI:
     - Load upload.xlsx
     - Clean & split (90/10)
     - Train ARIMAX model
     - Save: arimax_model.pkl, train_dataset.csv, test_dataset.csv, residual_train.csv
  → Response: {status: "success", arimax_mape: 12.33, ...}
```

#### **Step 3: Train Hybrid LSTM**
```
User → Frontend (Click "Train Hybrid")
  → POST /fastapi/train/hybrid?sync=true
  → FastAPIController::trainHybrid()
  → FastAPIService::trainHybridSync()
  → HTTP POST http://localhost:8000/train/hybrid/sync
  → FastAPI:
     - Load residual_train.csv
     - Normalize & create sequences
     - Train LSTM on residuals
     - Save: lstm_residual_model.h5, residual_scaler.save
  → Response: {status: "success", hybrid_mape: 8.44, ...}
```

#### **Step 4: Evaluate Models**
```
User → Frontend (Click "Evaluate")
  → GET /fastapi/evaluate
  → FastAPIController::evaluate()
  → FastAPIService::evaluate()
  → HTTP GET http://localhost:8000/evaluate
  → FastAPI:
     - Load test dataset
     - Predict ARIMAX
     - Predict LSTM residuals (iterative)
     - Combine: Hybrid = ARIMAX + Residual
     - Calculate metrics (MAPE, MAE, RMSE)
     - Save: hybrid_arimax_lstm_results.csv
  → Response: {
      arimax: {mape: 12.33, mae: 0.45, rmse: 0.52},
      hybrid: {mape: 8.44, mae: 0.32, rmse: 0.38}
    }
```

#### **Step 5: Make Predictions**
```
User → Frontend (Input wind_speed, n_steps)
  → POST /fastapi/predict
  → FastAPIController::predict()
  → FastAPIService::predict($windSpeed, $nSteps)
  → HTTP POST http://localhost:8000/predict
  → FastAPI:
     - Load models (ARIMAX + LSTM + Scaler)
     - Predict ARIMAX with wind_speed
     - Predict residuals iteratively
     - Combine predictions
  → Response: {
      predictions: [1.23, 1.45, 1.67],
      arimax_predictions: [1.10, 1.30, 1.50],
      residual_predictions: [0.13, 0.15, 0.17]
    }
```

---

### **FLOW 2: Menggunakan PHP Service (Lama - Masih Ada)**

#### **Step 1: Upload Dataset ke Database**
```
User → Frontend (Upload Excel)
  → POST /data/upload
  → DataController::store()
  → Parse Excel/CSV
  → Split 90/10 (training/test)
  → Save ke Database:
     - training_data table
     - test_data table
```

#### **Step 2: Generate Hybrid Predictions (PHP)**
```
User → Frontend (Click "Generate Prediction")
  → POST /hybrid/prediction
  → HybridController::store()
  → ARIMAXService::train() (PHP implementation)
  → PseudoLSTMService::train() (PHP implementation)
  → Calculate predictions
  → Save ke Database: hybrid_predictions table
```

---

## 🎯 Perbandingan 2 Flow

| Aspek | Flow 1 (FastAPI) | Flow 2 (PHP) |
|-------|------------------|--------------|
| **Dataset Storage** | File di `python-ml/data/` | Database Laravel |
| **Model Storage** | File di `python-ml/models/` | In-memory (tidak disimpan) |
| **Training** | Python (statsmodels, TensorFlow) | PHP (custom implementation) |
| **Akurasi** | ✅ Lebih akurat (library ML asli) | ⚠️ Approximation |
| **Performance** | ✅ Lebih cepat untuk ML | ⚠️ Lebih lambat |
| **Scalability** | ✅ Bisa di-deploy terpisah | ⚠️ Terikat dengan Laravel |
| **Maintenance** | ✅ Modular, mudah diupdate | ⚠️ Harus update PHP code |

---

## 📝 Workflow Lengkap (Recommended)

### **Scenario: Training & Prediction Baru**

1. **Start FastAPI Service**
   ```bash
   cd python-ml
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **User Upload Dataset via Laravel**
   - Buka: `/fastapi`
   - Upload Excel file
   - File dikirim ke FastAPI → disimpan di `python-ml/data/upload.xlsx`

3. **Train ARIMAX**
   - Click "Train ARIMAX" (sync mode)
   - Laravel → FastAPI → Training → Response dengan metrics

4. **Train Hybrid**
   - Click "Train Hybrid" (sync mode)
   - Laravel → FastAPI → Training LSTM → Response dengan metrics

5. **Evaluate**
   - Click "Evaluate"
   - Laravel → FastAPI → Evaluate on test set → Response dengan metrics

6. **Predict**
   - Input wind_speed dan n_steps
   - Laravel → FastAPI → Predict → Response dengan predictions

### **Scenario: Menggunakan Data dari Database Laravel**

Jika data sudah ada di database Laravel, bisa export ke Excel dulu:

```php
// Export dari database ke Excel
$trainingData = TrainingData::all();
$testData = TestData::all();

// Combine dan export ke Excel
// Lalu upload via FastAPI
```

---

## 🔗 Integrasi dengan Frontend

### **Frontend Routes:**
- `/fastapi` - Halaman utama FastAPI integration
- `/hybrid/prediction` - Halaman prediction (bisa pakai FastAPI atau PHP)
- `/data/input` - Upload data ke database

### **API Endpoints yang Tersedia:**

**FastAPI Integration:**
- `POST /fastapi/upload-dataset` - Upload ke FastAPI
- `POST /fastapi/train/arimax` - Train ARIMAX
- `POST /fastapi/train/hybrid` - Train Hybrid
- `GET /fastapi/evaluate` - Evaluate
- `POST /fastapi/predict` - Predict

**PHP Service (Lama):**
- `POST /data/upload` - Upload ke database
- `POST /hybrid/prediction` - Generate prediction (PHP)

---

## ⚙️ Konfigurasi

### **Environment Variables (.env):**
```env
# FastAPI Configuration
FASTAPI_URL=http://localhost:8000
FASTAPI_TIMEOUT=300
```

### **Service Config (config/services.php):**
```php
'fastapi' => [
    'url' => env('FASTAPI_URL', 'http://localhost:8000'),
    'timeout' => env('FASTAPI_TIMEOUT', 300),
],
```

---

## 🚀 Quick Start

1. **Jalankan FastAPI:**
   ```bash
   cd python-ml
   uvicorn main:app --reload
   ```

2. **Akses Laravel:**
   - Buka `/fastapi` untuk FastAPI integration
   - Atau `/hybrid/prediction` untuk PHP service

3. **Test Health Check:**
   ```php
   $service = new \App\Services\FastAPIService();
   $isHealthy = $service->healthCheck(); // true/false
   ```

---

## 📌 Catatan Penting

1. **FastAPI harus running** sebelum menggunakan endpoints FastAPI
2. **Dataset format** harus: `timestamp`, `wave_height`, `wind_speed`
3. **Training async** akan return immediately, **sync** akan wait
4. **Models disimpan** di `python-ml/models/` (tidak di database)
5. **Results disimpan** di `python-ml/data/` sebagai CSV

---

## 🔄 Migration dari PHP ke FastAPI

Jika ingin migrasi dari PHP service ke FastAPI:

1. Export data dari database ke Excel
2. Upload via FastAPI endpoint
3. Train models via FastAPI
4. Gunakan predictions dari FastAPI

Data di database Laravel tetap bisa digunakan untuk display/analytics, tapi training & prediction menggunakan FastAPI.

