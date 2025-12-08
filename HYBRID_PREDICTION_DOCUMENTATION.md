# Dokumentasi Teknis Prediksi Hybrid ARIMAX-LSTM

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Arsitektur Pipeline](#arsitektur-pipeline)
3. [Parameter Model](#parameter-model)
4. [Algoritma Detail](#algoritma-detail)
5. [Metrik Evaluasi](#metrik-evaluasi)
6. [Implementasi Teknis](#implementasi-teknis)
7. [Contoh Penggunaan](#contoh-penggunaan)

---

## Overview

Prediksi Hybrid ARIMAX-LSTM adalah model gabungan yang mengkombinasikan kelebihan model statistik (ARIMAX) dengan model deep learning (LSTM) untuk meningkatkan akurasi prediksi tinggi gelombang laut.

### Konsep Dasar

- **ARIMAX**: Menangkap pola linear dan tren dalam data time series dengan variabel eksogen (kecepatan angin)
- **LSTM (GRU)**: Menangkap pola non-linear dalam residual ARIMAX yang tidak dapat ditangkap oleh model linear
- **Hybrid**: Kombinasi prediksi ARIMAX + residual LSTM untuk hasil prediksi yang lebih akurat

### Pipeline Alur

```
Data Training → ARIMAX Training → Residual Calculation → LSTM Training
                                                                  ↓
Data Test → ARIMAX Forecast → LSTM Residual Forecast → Hybrid Prediction
```

---

## Arsitektur Pipeline

### Step 1: Training ARIMAX Model

**Input:**
- `yTrain`: Array tinggi gelombang (data latih)
- `xTrain`: Array kecepatan angin (variabel eksogen, data latih)

**Proses:**
1. **Differencing**: Menerapkan differencing order `d=1` untuk membuat data stasioner
2. **OLS Training**: Menyelesaikan persamaan linear menggunakan Ordinary Least Squares
   - Formula: `b = (XᵀX)⁻¹ Xᵀy`
   - Design matrix X: `[1, y_{t-1}, ..., y_{t-p}, x_t]`
3. **Fitted Values**: Menghasilkan nilai fitted untuk data training

**Output:**
- `phi`: Koefisien AR (Autoregressive)
- `betaX`: Koefisien variabel eksogen
- `intercept`: Intersep model
- `fitted`: Nilai fitted untuk data training
- `order`: Order ARIMAX `[p, d, q]`

### Step 2: Calculate Residuals

**Proses:**
```
residual_t = actual_t - arimax_fitted_t
```

**Output:**
- `residualTrain`: Array residual dari data training
- Statistik residual: min, max, mean, std, count

### Step 3: Scale Residuals (StandardScaler)

**Metode:** Z-score normalization (StandardScaler)

**Formula:**
```
scaled = (value - mean) / std
```

**Output:**
- `residualScaled`: Residual yang sudah dinormalisasi
- `scalerParams`: Parameter scaler `{mean, std}`

**Alasan:** Residual perlu dinormalisasi untuk stabilitas training LSTM

### Step 4: Train LSTM (GRU) on Scaled Residuals

**Arsitektur GRU:**
- **Update Gate**: `z_t = σ(Wz * x_t + Uz * h_{t-1} + bz)`
- **Reset Gate**: `r_t = σ(Wr * x_t + Ur * h_{t-1} + br)`
- **Candidate**: `h̃_t = tanh(Wh * x_t + Uh * (r_t ⊙ h_{t-1}) + bh)`
- **Hidden State**: `h_t = (1 - z_t) ⊙ h̃_t + z_t ⊙ h_{t-1}`
- **Output**: `y_t = Wo * h_t + bo`

**Training Method:** Stochastic Gradient Descent (SGD) dengan momentum

**Output:**
- Model parameters: `Wz`, `Uz`, `bz`, `Wr`, `Ur`, `br`, `Wh`, `Uh`, `bh`, `Wo`, `bo`
- Training losses: Array loss per epoch
- Final loss: Loss akhir setelah training

### Step 5: Forecast ARIMAX on Test Data

**Input:**
- Model parameters dari Step 1
- `yTrain`: Data training (untuk inisialisasi)
- `xTest`: Kecepatan angin data uji

**Proses:**
1. Menggunakan parameter yang sudah ditraining
2. Menerapkan differencing yang sama
3. Forecasting iteratif untuk setiap timestep

**Output:**
- `arimaxForecast`: Prediksi ARIMAX untuk data uji

### Step 6: Forecast LSTM Residuals Iteratively

**Proses:**
1. Inisialisasi window dengan 24 residual terakhir dari training data
2. Untuk setiap timestep di test data:
   - Predict residual berikutnya menggunakan LSTM
   - Tambahkan noise kecil (0.05) untuk mencegah konvergensi ke nilai tunggal
   - Update window: shift left, append prediction

**Output:**
- `lstmResidualScaled`: Prediksi residual LSTM (masih dalam skala normalized)

### Step 7: Inverse Scale LSTM Residuals

**Formula:**
```
unscaled = (scaled * std) + mean
```

**Output:**
- `lstmResidualUnscaled`: Residual LSTM dalam skala original

### Step 8: Combine ARIMAX + LSTM = Hybrid

**Formula Dasar:**
```
hybrid = arimax_forecast + lstm_residual
```

**Optimisasi:**
- Jika residual mean < -0.3 dan residual < 0:
  - Hitung z-score residual
  - Jika z-score > 2.5: gunakan weight 0.5
  - Jika z-score ≤ 2.5: gunakan weight 0.8
  - Formula: `hybrid = arimax + (lstm_residual * weight)`
- Jika hasil hybrid < 0:
  - Gunakan blend: `hybrid = max(0, arimax * 0.95 + lstm_residual * 0.3)`
- Clipping: `hybrid = max(0.0, min(10.0, hybrid))`

**Output:**
- `hybridPredictions`: Prediksi final hybrid

### Step 9: Calculate Metrics and Save

**Metrik yang Dihitung:**
- **MAPE** (Mean Absolute Percentage Error)
- **MAE** (Mean Absolute Error)
- **RMSE** (Root Mean Squared Error)

**Penyimpanan:**
- Semua prediksi disimpan ke database `hybrid_predictions`

---

## Parameter Model

### ARIMAX Parameters

| Parameter | Nilai | Deskripsi |
|-----------|-------|-----------|
| `p` | 1 | Order Autoregressive (AR) |
| `d` | 1 | Order Differencing |
| `q` | 0 | Order Moving Average (MA) - tidak digunakan dalam versi simplified |

**Penjelasan:**
- `p=1`: Model menggunakan 1 lag dari nilai sebelumnya
- `d=1`: Menerapkan first-order differencing untuk stasioneritas
- `q=0`: MA component tidak digunakan (simplified ARIMAX)

### LSTM (GRU) Parameters

| Parameter | Nilai | Deskripsi |
|-----------|-------|-----------|
| `inputSize` | 24 | Ukuran window input (timesteps) |
| `hiddenSize` | 8 | Ukuran hidden state GRU |
| `dropoutRate` | 0.25 | Dropout rate untuk regularisasi |
| `window` | 24 | Window size untuk training dan forecasting |
| `epochs` | 30 | Jumlah epoch training |
| `learningRate` | 0.008 | Learning rate untuk SGD |

**Penjelasan:**
- **Window 24**: Dipilih karena pola gelombang laut memiliki siklus harian (24 jam = 12 data points jika sampling per 12 jam)
- **Hidden Size 8**: Ukuran yang cukup untuk menangkap pola non-linear tanpa overfitting
- **Dropout 0.25**: Regularisasi untuk mencegah overfitting
- **Epochs 30**: Jumlah iterasi yang cukup untuk konvergensi tanpa overfitting
- **Learning Rate 0.008**: Learning rate yang stabil untuk SGD dengan momentum

### Scaler Parameters

| Parameter | Deskripsi |
|-----------|-----------|
| `mean` | Mean dari residual training data |
| `std` | Standard deviation dari residual training data |

### Noise Parameters

| Parameter | Nilai | Deskripsi |
|-----------|-------|-----------|
| `noiseScale` | 0.05 | Skala noise untuk mencegah konvergensi LSTM ke nilai tunggal |

### Hybrid Combination Parameters

| Parameter | Nilai | Deskripsi |
|-----------|-------|-----------|
| `residualMeanThreshold` | -0.3 | Threshold untuk deteksi bias negatif |
| `zScoreThreshold` | 2.5 | Threshold untuk extreme values |
| `residualWeightHigh` | 0.8 | Weight untuk residual normal |
| `residualWeightLow` | 0.5 | Weight untuk extreme negative residual |
| `negativeBlendArimax` | 0.95 | Weight ARIMAX saat hybrid negatif |
| `negativeBlendResidual` | 0.3 | Weight residual saat hybrid negatif |
| `minValue` | 0.0 | Minimum value untuk clipping |
| `maxValue` | 10.0 | Maximum value untuk clipping (tinggi gelombang maksimal) |

---

## Algoritma Detail

### ARIMAX Training (OLS)

**Design Matrix Construction:**
```php
X = [
    [1, y_{t-1}, y_{t-2}, ..., y_{t-p}, x_t],
    [1, y_{t-2}, y_{t-3}, ..., y_{t-p-1}, x_{t+1}],
    ...
]
```

**OLS Solution:**
```php
b = (X^T * X)^(-1) * X^T * y
```

**Parameters:**
- `phi`: Koefisien AR `[φ₁, φ₂, ..., φₚ]`
- `betaX`: Koefisien variabel eksogen
- `intercept`: Intersep model

### GRU Forward Pass

**Update Gate:**
```php
z_t = sigmoid(Wz * x_t + Uz * h_{t-1} + bz)
```

**Reset Gate:**
```php
r_t = sigmoid(Wr * x_t + Ur * h_{t-1} + br)
```

**Candidate Hidden State:**
```php
h̃_t = tanh(Wh * x_t + Uh * (r_t ⊙ h_{t-1}) + bh)
```

**Hidden State:**
```php
h_t = (1 - z_t) ⊙ h̃_t + z_t ⊙ h_{t-1}
```

**Output:**
```php
y_t = Wo * h_t + bo
```

### GRU Backward Pass (SGD with Momentum)

**Gradient Calculation:**
- Backpropagation through time (BPTT)
- Gradient clipping untuk stabilitas

**Weight Update:**
```php
momentum = 0.9 * momentum + learningRate * gradient
weight = weight - momentum
```

**Initialization:**
- Xavier/Glorot initialization: `scale = sqrt(1 / (fan_in + fan_out))`
- Weights: `random * 2 * scale - scale`

### StandardScaler

**Fit & Transform:**
```php
mean = sum(data) / count(data)
std = sqrt(sum((data - mean)^2) / count(data))
scaled = (data - mean) / std
```

**Inverse Transform:**
```php
unscaled = (scaled * std) + mean
```

---

## Metrik Evaluasi

### MAPE (Mean Absolute Percentage Error)

**Formula:**
```
MAPE = (1/n) * Σ |(actual - predicted) / actual| * 100
```

**Implementasi:**
```php
if (abs(actual) > 0.0001) {
    mape += abs((actual - predicted) / actual) * 100;
}
```

**Interpretasi:**
- Semakin kecil semakin baik
- Nilai dalam persentase (%)
- Menghindari division by zero dengan threshold 0.0001

### MAE (Mean Absolute Error)

**Formula:**
```
MAE = (1/n) * Σ |actual - predicted|
```

**Interpretasi:**
- Semakin kecil semakin baik
- Nilai dalam satuan yang sama dengan data (meter)

### RMSE (Root Mean Squared Error)

**Formula:**
```
RMSE = sqrt((1/n) * Σ (actual - predicted)²)
```

**Interpretasi:**
- Semakin kecil semakin baik
- Lebih sensitif terhadap outlier dibanding MAE
- Nilai dalam satuan yang sama dengan data (meter)

---

## Implementasi Teknis

### File Structure

```
app/
├── Http/
│   └── Controllers/
│       └── HybridController.php      # Main controller
├── Services/
│   ├── ARIMAXService.php             # ARIMAX implementation
│   ├── PseudoLSTMService.php         # GRU/LSTM implementation
│   └── ScalerService.php             # StandardScaler implementation
└── Models/
    └── HybridPrediction.php          # Database model
```

### Key Classes

#### HybridController

**Methods:**
- `store()`: Generate hybrid predictions
- `index()`: Display prediction page
- `evaluation()`: Display evaluation page
- `calculateMAPE()`: Calculate MAPE metric
- `calculateMAE()`: Calculate MAE metric
- `calculateRMSE()`: Calculate RMSE metric

#### ARIMAXService

**Methods:**
- `train()`: Train ARIMAX model using OLS
- `forecast()`: Forecast future values
- `difference()`: Apply differencing
- `inverseDifference()`: Reverse differencing
- `matrixMultiply()`: Matrix multiplication
- `matrixInverse()`: Matrix inversion (Gaussian elimination)

#### PseudoLSTMService

**Methods:**
- `train()`: Train GRU model using SGD
- `predict()`: Predict next value
- `forward()`: Forward pass through GRU
- `backward()`: Backward pass (backpropagation)
- `sigmoid()`: Sigmoid activation
- `tanhActivation()`: Tanh activation

#### ScalerService

**Methods:**
- `fitTransformStandard()`: Fit and transform using z-score
- `transformStandard()`: Transform using fitted parameters
- `inverseTransformStandard()`: Inverse transform to original scale

### Database Schema

**Table: `hybrid_predictions`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `tanggal` | datetime | Timestamp prediksi |
| `tinggi_gelombang_aktual` | decimal(8,4) | Nilai aktual |
| `tinggi_gelombang_arimax` | decimal(8,4) | Prediksi ARIMAX |
| `residual_lstm` | decimal(8,4) | Residual LSTM |
| `tinggi_gelombang_hybrid` | decimal(8,4) | Prediksi hybrid final |
| `mape` | decimal(8,4) | MAPE per data point |
| `mae` | decimal(8,4) | MAE per data point |
| `rmse` | decimal(8,4) | RMSE per data point |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

---

## Contoh Penggunaan

### 1. Generate Predictions

**Endpoint:** `POST /hybrid/prediction`

**Request:**
```http
POST /hybrid/prediction
Content-Type: application/json
```

**Response:**
```json
{
    "success": true,
    "message": "Prediksi Hybrid ARIMAX-LSTM berhasil dihasilkan untuk 292 data uji."
}
```

### 2. View Predictions

**Endpoint:** `GET /hybrid/prediction`

**Response:**
```json
{
    "predictions": [
        {
            "nomor": 1,
            "tanggal": "2023-01-01",
            "tinggi_gelombang_aktual": 4.2000,
            "tinggi_gelombang_arimax": 0.6513,
            "residual_lstm": -1.4800,
            "tinggi_gelombang_hybrid": 0.1747,
            "mape": 95.84,
            "mae": 4.0253,
            "rmse": 4.0253
        }
    ],
    "totalData": 292,
    "overallMetrics": {
        "mape": 92.89,
        "mae": 1.1196,
        "rmse": 1.2606
    }
}
```

### 3. View Evaluation

**Endpoint:** `GET /hybrid/evaluation`

**Response:**
```json
{
    "chartData": [...],
    "tableData": [...],
    "metrics": {
        "mape_arimax": 14.35,
        "mape_hybrid": 72.06,
        "total_data": 292
    }
}
```

### 4. Code Example (PHP)

```php
// Initialize services
$arimaxService = new ARIMAXService();
$lstmService = new PseudoLSTMService(
    inputSize: 24,
    hiddenSize: 8,
    dropoutRate: 0.25
);
$scalerService = new ScalerService();

// Step 1: Train ARIMAX
$arimaxModel = $arimaxService->train(
    $yTrain,
    $xTrain,
    p: 1,
    d: 1,
    q: 0
);

// Step 2: Calculate residuals
$residuals = [];
for ($i = 0; $i < count($yTrain); $i++) {
    $residuals[] = $yTrain[$i] - $arimaxModel['fitted'][$i];
}

// Step 3: Scale residuals
[$residualScaled, $scalerParams] = $scalerService->fitTransformStandard($residuals);

// Step 4: Train LSTM
$lstmTraining = $lstmService->train(
    $residualScaled,
    window: 24,
    epochs: 30,
    learningRate: 0.008
);

// Step 5: Forecast ARIMAX
$arimaxForecast = $arimaxService->forecast(
    $arimaxModel['phi'],
    $arimaxModel['betaX'],
    $arimaxModel['intercept'],
    $yTrain,
    $xTrain,
    $xTest,
    p: 1,
    d: 1
);

// Step 6: Forecast LSTM residuals
$lstmResidualScaled = [];
$window = array_slice($residualScaled, -24);
for ($i = 0; $i < count($yTest); $i++) {
    $pred = $lstmService->predict($window);
    $lstmResidualScaled[] = $pred;
    array_shift($window);
    $window[] = $pred;
}

// Step 7: Inverse scale
$lstmResidualUnscaled = $scalerService->inverseTransformStandard(
    $lstmResidualScaled,
    $scalerParams
);

// Step 8: Combine
$hybridPredictions = [];
for ($i = 0; $i < count($arimaxForecast); $i++) {
    $hybrid = $arimaxForecast[$i] + $lstmResidualUnscaled[$i];
    $hybrid = max(0.0, min(10.0, $hybrid)); // Clip to [0, 10]
    $hybridPredictions[] = $hybrid;
}
```

---

## Catatan Penting

### Data Requirements

1. **Training Data**: Minimal 90% dari total data
2. **Test Data**: 10% dari total data
3. **Data Split**: Otomatis dilakukan saat upload (90/10)
4. **Format Data**: CSV/Excel dengan kolom:
   - `tanggal` atau `timestamp` atau `date`
   - `tinggi_gelombang` atau `wave_height`
   - `kecepatan_angin` atau `wind_speed`

### Performance Considerations

1. **Training Time**: 
   - ARIMAX: ~1 detik
   - LSTM: ~30-40 detik (30 epochs)
   - Total: ~40-50 detik untuk 1170 data training

2. **Memory Usage**:
   - ARIMAX: Minimal
   - LSTM: Moderate (depends on window size)
   - Total: ~50-100 MB

3. **Optimization**:
   - Window size 24 optimal untuk pola gelombang laut
   - Hidden size 8 balance antara akurasi dan performa
   - Epochs 30 cukup untuk konvergensi

### Limitations

1. **ARIMAX Simplified**: MA component (q) tidak digunakan
2. **LSTM Simplified**: Menggunakan GRU bukan full LSTM
3. **Iterative Forecasting**: LSTM menggunakan iterative forecasting yang dapat menyebabkan error accumulation
4. **Noise Addition**: Noise ditambahkan untuk mencegah konvergensi, tetapi dapat mengurangi akurasi

### Future Improvements

1. Implementasi full ARIMAX dengan MA component
2. Implementasi full LSTM dengan forget gate
3. Sequence-to-sequence forecasting untuk LSTM
4. Hyperparameter tuning otomatis
5. Cross-validation untuk evaluasi model

---

## Referensi

- **ARIMAX**: Box-Jenkins methodology dengan variabel eksogen
- **GRU**: Cho et al., "Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation" (2014)
- **StandardScaler**: Z-score normalization untuk normalisasi data
- **SGD with Momentum**: Polyak momentum untuk optimisasi

---

**Dokumen ini dibuat untuk dokumentasi teknis sistem Prediksi Hybrid ARIMAX-LSTM.**

**Versi:** 1.0  
**Terakhir Diupdate:** 2025-12-07



