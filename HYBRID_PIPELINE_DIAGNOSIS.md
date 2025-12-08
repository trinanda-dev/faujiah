# Diagnosis & Perbaikan Pipeline Hybrid ARIMAX-LSTM

## A. Diagnosis - Daftar Penyebab Residual LSTM Ekstrem

### 1. **Masalah Inverse MinMax Scaling**
   - **Penyebab**: Jika residual training memiliki range besar (misal [-50, 50]), dan LSTM memprediksi nilai mendekati 1.0, maka inverse transform menghasilkan nilai mendekati 50.
   - **Contoh**: 
     - Residual training: min=-50, max=50
     - LSTM prediction (scaled): 0.95
     - Inverse transform: 0.95 * (50 - (-50)) + (-50) = 0.95 * 100 - 50 = 45
   - **Dampak**: Residual LSTM menjadi sangat besar, menyebabkan hybrid prediction menjadi ekstrem.

### 2. **LSTM Simulation Tidak Stabil**
   - **Penyebab**: Hyperparameter saat ini (decay_rate=0.15, tanh_multiplier=0.8) tidak cukup untuk mencegah exploding predictions.
   - **Masalah**: 
     - Mean reversion terlalu lemah (0.3)
     - Drift damping terlalu cepat (0.95)
     - Tanh scaling terlalu agresif (0.9)
   - **Dampak**: LSTM predictions bisa drift jauh dari mean training residuals.

### 3. **Tidak Ada Clipping yang Cukup Ketat**
   - **Penyebab**: Inverse transform tidak memiliki safety clipping berdasarkan statistik training residuals.
   - **Masalah**: Nilai yang di-inverse transform bisa melebihi range training residuals.
   - **Dampak**: Residual LSTM bisa lebih ekstrem dari residual training.

### 4. **Alignment Issues**
   - **Penyebab**: Mismatch panjang array antara ARIMAX predictions, LSTM residuals, dan test data.
   - **Dampak**: Index mismatch menyebabkan nilai yang salah digabungkan.

### 5. **Residual ARIMAX Ekstrem**
   - **Penyebab**: Jika ARIMAX model tidak fit dengan baik, residual training bisa sangat besar.
   - **Dampak**: Scaling menjadi tidak efektif, dan LSTM harus memprediksi residual yang sangat besar.

---

## B. Pemeriksaan - Kode Diagnostik (PHP Equivalent)

Kode diagnostik telah diimplementasikan dalam method `diagnosePipeline()` di `HybridController.php`. Method ini memeriksa:

### 1. **Statistik Residual ARIMAX**
```php
$residualStats = $this->calculateResidualStats($residualTrain);
// Returns: min, max, mean, std, count
// Checks: outliers beyond 3*std
```

### 2. **MinMaxScaler Parameters**
```php
[$residualScaled, $scalerParams] = $this->minMaxScale($residualTrain);
// Checks: scaler min, max, range
// Validates: scaled data in [0, 1] range
```

### 3. **LSTM Seed (Window)**
```php
$window = min(12, count($residualScaled));
$lstmSeed = array_slice($residualScaled, -$window);
// Checks: window size, seed values, seed min/max/mean
// Validates: seed values in [0, 1] range
```

### 4. **LSTM Output (Scaled)**
```php
$lstmPredictions = $this->predictLSTMResidual($residualScaled, $window, $forecastSteps);
// Checks: prediction count, stats, first/last 5 values
// Validates: predictions in [0, 1] range
```

### 5. **Inverse Transform Result**
```php
$lstmUnscaled = $this->inverseMinMaxScale($lstmPredictions, $scalerParams, $residualStats);
// Checks: unscaled stats, range ratio vs training range
// Validates: no extreme values (>50)
```

### 6. **Alignment Check**
```php
// Checks: yTest count, ARIMAX count, LSTM count
// Validates: all arrays have same length
```

### Cara Menggunakan Diagnostik

Diagnostik otomatis dijalankan sebelum processing di method `store()`. Hasilnya di-log ke Laravel log:

```php
Log::info('Hybrid Pipeline Pre-Processing Diagnostics', $diagnostics);
```

Untuk melihat hasil diagnostik, cek file `storage/logs/laravel.log`.

---

## C. Assert & Safety Checks

### Assert Checks yang Telah Diimplementasikan

1. **Data Alignment**
   ```php
   if ($minLength === 0) {
       throw new \Exception('Tidak ada data yang cocok antara yTrain dan fittedTrain.');
   }
   if (abs(count($yTrain) - count($fittedTrain)) > 5) {
       throw new \Exception('Length mismatch terlalu besar');
   }
   ```

2. **Residual Calculation**
   ```php
   if (empty($residualTrain)) {
       throw new \Exception('Tidak dapat menghitung residual dari data latih.');
   }
   // Warning jika residual ekstrem
   if ($maxResidual > 100) {
       Log::warning('Extreme residual detected');
   }
   ```

3. **Scaler Validation**
   ```php
   if ($scalerParams === null) {
       throw new \Exception('Scaler parameters tidak dapat dihitung.');
   }
   if ($scaledMin < -0.01 || $scaledMax > 1.01) {
       // Fallback to StandardScaler
   }
   ```

4. **LSTM Output Validation**
   ```php
   if (empty($lstmResidualPredictions)) {
       throw new \Exception('Gagal menghasilkan prediksi residual LSTM.');
   }
   if (count($lstmResidualPredictions) !== count($yTest)) {
       throw new \Exception('Length mismatch');
   }
   if ($lstmMin < -0.01 || $lstmMax > 1.01) {
       // Clip to [0, 1]
   }
   ```

5. **Inverse Transform Safety**
   ```php
   // Clipping berdasarkan training residual stats
   $clipMin = $residualStats['min'] - ($residualStats['std'] * 1.5);
   $clipMax = $residualStats['max'] + ($residualStats['std'] * 1.5);
   // Final clipping: mean ± 4*std
   ```

6. **Hybrid Prediction Validation**
   ```php
   if (count($arimaxPredictions) !== count($lstmResidualUnscaled)) {
       throw new \Exception('Panjang array tidak sama');
   }
   if (abs($hybrid) > 100) {
       Log::warning('Extreme hybrid prediction detected');
   }
   ```

---

## D. Perbaikan Kode

### 1. **Perbaikan `predictLSTMResidual()` - Hyperparameter Stabil**

**Sebelum:**
- `decay_rate = 0.15`
- `tanh_multiplier = 0.8`
- `tanh_scale = 0.9`
- `mean_reversion_weight = 0.3`
- `drift_damping = 0.95`

**Sesudah:**
- `decay_rate = 0.2` (lebih banyak weight pada recent values)
- `tanh_multiplier = 0.6` (lebih konservatif)
- `tanh_scale = 0.85` (lebih ketat)
- `mean_reversion_weight = 0.4` (lebih kuat mean reversion)
- `drift_damping = 0.98` (lebih lambat adaptasi mean)

**Perubahan:**
- Menggunakan `initialMean` (mean dari seluruh training residuals) untuk mean reversion, bukan mean dari window terakhir
- Clipping lebih ketat: `max(0.01, min(0.99, $pred))` untuk menghindari edge cases

### 2. **Perbaikan `inverseMinMaxScale()` - Safety Clipping**

**Sebelum:**
```php
return $value * ($max - $min) + $min;
```

**Sesudah:**
```php
// Apply safety clipping if original stats provided
if ($originalStats !== null) {
    $range = $max - $min;
    $mean = $originalStats['mean'] ?? (($min + $max) / 2);
    $std = $originalStats['std'] ?? ($range / 6);
    
    // Clip to mean ± 3*std, but at minimum use original min/max ± 20% range
    $clipMin = min($min, $mean - max(3 * $std, $range * 0.2));
    $clipMax = max($max, $mean + max(3 * $std, $range * 0.2));
    
    $unscaled = array_map(function ($value) use ($clipMin, $clipMax) {
        return max($clipMin, min($clipMax, $value));
    }, $unscaled);
}
```

### 3. **Perbaikan Clipping di `store()` Method**

**Sebelum:**
```php
if (abs($residualStats['max'] - $residualStats['min']) * 10 < $unscaledStats['max'] - $unscaledStats['min']) {
    // Clipping
}
```

**Sesudah:**
```php
// Multiple layers of clipping:
// 1. In inverseMinMaxScale() with original stats
// 2. If unscaled range > 2x training range, apply stricter clipping
// 3. Final clipping: mean ± 4*std
```

### 4. **Penambahan Method `diagnosePipeline()`**

Method baru yang melakukan comprehensive diagnostics pada setiap langkah pipeline, mengidentifikasi anomalies dan logging untuk debugging.

---

## E. Validasi & Contoh Data Normal

### Contoh Output Normal

#### 1. **Residual ARIMAX Training (Normal)**
```
min: -2.5
max: 2.8
mean: 0.02
std: 0.85
count: 365
```

#### 2. **Scaler Parameters (Normal)**
```
min: -2.5
max: 2.8
range: 5.3
```

#### 3. **Residual Scaled (Normal)**
```
min: 0.0
max: 1.0
mean: 0.48
std: 0.16
```

#### 4. **LSTM Seed (Normal)**
```
window_size: 12
seed_values: [0.45, 0.52, 0.48, 0.51, 0.49, 0.47, 0.50, 0.48, 0.52, 0.49, 0.51, 0.48]
seed_min: 0.45
seed_max: 0.52
seed_mean: 0.49
```

#### 5. **LSTM Predictions Scaled (Normal)**
```
min: 0.35
max: 0.65
mean: 0.48
std: 0.08
first_5: [0.48, 0.49, 0.47, 0.50, 0.48]
```

#### 6. **LSTM Residuals Unscaled (Normal)**
```
min: -1.2
max: 1.5
mean: 0.05
std: 0.42
range_ratio: 0.51 (should be < 2.0)
```

#### 7. **Hybrid Predictions (Normal)**
```
Index 0:
  actual: 0.6
  arimax_pred: 0.55
  residual_lstm: 0.08
  hybrid: 0.63
  error: -0.03

Index 1:
  actual: 0.7
  arimax_pred: 0.65
  residual_lstm: 0.12
  hybrid: 0.77
  error: -0.07
```

### Contoh Output Abnormal (Masalah)

#### 1. **Residual ARIMAX Ekstrem (Abnormal)**
```
min: -50.0
max: 50.0
mean: 0.0
std: 15.0
```
**Tindakan**: Periksa ARIMAX model fit, mungkin perlu tuning parameter.

#### 2. **LSTM Predictions Ekstrem (Abnormal)**
```
min: -0.1
max: 1.2
```
**Tindakan**: Clipping otomatis diterapkan, periksa hyperparameter LSTM.

#### 3. **Unscaled Residuals Ekstrem (Abnormal)**
```
min: -45.0
max: 48.0
range_ratio: 17.5 (should be < 2.0)
```
**Tindakan**: Multiple layers of clipping diterapkan, periksa scaler parameters.

### Validasi Metrics Normal

Untuk pipeline yang sehat, metrics seharusnya:
- **MAPE**: < 20% (untuk tinggi gelombang)
- **MAE**: < 0.5 meter
- **RMSE**: < 0.7 meter
- **Residual LSTM range**: < 2x training residual range
- **Hybrid predictions**: Tidak ada nilai negatif atau > 10 meter

---

## Rekomendasi Hyperparameter LSTM

### Hyperparameter Optimal (Setelah Tuning)

```php
$decayRate = 0.2;              // Controls weight decay (0.15-0.25)
$tanhMultiplier = 0.6;          // Controls non-linearity (0.5-0.7)
$tanhScale = 0.85;              // Controls output scale (0.8-0.9)
$meanReversionWeight = 0.4;     // Controls mean reversion (0.3-0.5)
$driftDamping = 0.98;           // Controls mean adaptation (0.95-0.99)
```

### Tuning Guidelines

1. **Jika LSTM predictions terlalu konservatif** (selalu dekat mean):
   - Kurangi `meanReversionWeight` (0.3-0.35)
   - Tingkatkan `tanhMultiplier` (0.7-0.8)

2. **Jika LSTM predictions terlalu ekstrem**:
   - Tingkatkan `meanReversionWeight` (0.45-0.5)
   - Kurangi `tanhMultiplier` (0.5-0.6)
   - Tingkatkan `driftDamping` (0.99)

3. **Jika LSTM predictions drift**:
   - Gunakan `initialMean` (mean dari seluruh training) untuk mean reversion
   - Tingkatkan `driftDamping` (0.98-0.99)

---

## Cara Menggunakan

1. **Jalankan prediksi** seperti biasa melalui UI
2. **Cek log** di `storage/logs/laravel.log` untuk melihat diagnostics
3. **Jika ada anomalies**, periksa bagian yang di-flag
4. **Jika residual LSTM masih ekstrem**, pertimbangkan:
   - Tuning hyperparameter LSTM
   - Periksa ARIMAX model fit
   - Periksa data training quality

---

## Testing

Test file telah dibuat di `tests/Feature/HybridPredictionDiagnosticsTest.php` untuk memverifikasi:
- Residual calculation correctness
- Scaler validation
- LSTM output bounds
- Inverse transform safety
- Alignment checks
- Hybrid prediction validation

Jalankan test dengan:
```bash
php artisan test --filter=HybridPredictionDiagnosticsTest
```


