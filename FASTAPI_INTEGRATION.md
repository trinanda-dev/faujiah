# Integrasi Laravel dengan FastAPI Python ML Service

Dokumentasi integrasi Laravel dengan FastAPI service untuk Hybrid ARIMAX-LSTM prediction.

## Struktur Integrasi

```
Laravel (Frontend + REST Client)
    ↓ HTTP Requests
FastAPI (Python ML Service)
    ↓ Processing
Python ML Models (ARIMAX + LSTM)
```

## Konfigurasi

### 1. Environment Variables

Tambahkan ke `.env`:

```env
FASTAPI_URL=http://localhost:8000
FASTAPI_TIMEOUT=300
```

### 2. Service Configuration

Konfigurasi sudah ditambahkan di `config/services.php`:

```php
'fastapi' => [
    'url' => env('FASTAPI_URL', 'http://localhost:8000'),
    'timeout' => env('FASTAPI_TIMEOUT', 300),
],
```

## Komponen yang Dibuat

### 1. FastAPIService (`app/Services/FastAPIService.php`)

Service class untuk komunikasi HTTP dengan FastAPI. Methods:

- `healthCheck()` - Cek status FastAPI service
- `uploadDataset($filePath)` - Upload dataset Excel
- `trainARIMAX()` - Train ARIMAX (async)
- `trainARIMAXSync()` - Train ARIMAX (sync, wait for completion)
- `trainHybrid()` - Train Hybrid LSTM (async)
- `trainHybridSync()` - Train Hybrid LSTM (sync)
- `evaluate()` - Evaluate both models
- `predict($windSpeed, $nSteps)` - Make predictions

### 2. FastAPIController (`app/Http/Controllers/FastAPIController.php`)

Controller untuk handle requests dari frontend. Routes:

- `GET /fastapi` - Index page
- `POST /fastapi/upload-dataset` - Upload dataset
- `POST /fastapi/train/arimax` - Train ARIMAX
- `POST /fastapi/train/hybrid` - Train Hybrid
- `GET /fastapi/evaluate` - Evaluate models
- `POST /fastapi/predict` - Make predictions

## Cara Menggunakan

### 1. Pastikan FastAPI Service Berjalan

```bash
cd python-ml
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Cek Health Status

```php
$fastAPIService = new \App\Services\FastAPIService();
$isHealthy = $fastAPIService->healthCheck();
```

### 3. Upload Dataset

```php
$result = $fastAPIService->uploadDataset('/path/to/dataset.xlsx');
if ($result['success']) {
    // Dataset uploaded successfully
}
```

### 4. Train Models

```php
// Train ARIMAX (async)
$result = $fastAPIService->trainARIMAX();

// Train ARIMAX (sync - wait for completion)
$result = $fastAPIService->trainARIMAXSync();

// Train Hybrid (async)
$result = $fastAPIService->trainHybrid();

// Train Hybrid (sync)
$result = $fastAPIService->trainHybridSync();
```

### 5. Evaluate Models

```php
$result = $fastAPIService->evaluate();
if ($result['success']) {
    $data = $result['data'];
    $arimaxMape = $data['arimax']['mape'];
    $hybridMape = $data['hybrid']['mape'];
}
```

### 6. Make Predictions

```php
$windSpeed = [10.5, 11.2, 12.0];
$nSteps = 3;

$result = $fastAPIService->predict($windSpeed, $nSteps);
if ($result['success']) {
    $predictions = $result['data']['predictions'];
    $arimaxPred = $result['data']['arimax_predictions'];
    $residualPred = $result['data']['residual_predictions'];
}
```

## Workflow Lengkap

1. **Start FastAPI Service**
   ```bash
   cd python-ml
   uvicorn main:app --reload
   ```

2. **Upload Dataset via Laravel**
   - POST `/fastapi/upload-dataset` dengan file Excel

3. **Train ARIMAX**
   - POST `/fastapi/train/arimax?sync=true` (sync) atau tanpa sync (async)

4. **Train Hybrid LSTM**
   - POST `/fastapi/train/hybrid?sync=true` (sync) atau tanpa sync (async)

5. **Evaluate**
   - GET `/fastapi/evaluate`

6. **Predict**
   - POST `/fastapi/predict` dengan `wind_speed` dan `n_steps`

## Error Handling

Semua methods di `FastAPIService` mengembalikan array dengan format:

```php
[
    'success' => true/false,
    'data' => [...], // jika success
    'error' => 'error message', // jika failed
    'status' => 200, // HTTP status code (jika failed)
]
```

## Testing

Untuk test integrasi, pastikan:
1. FastAPI service running di `http://localhost:8000`
2. Health check endpoint accessible
3. Dataset format sesuai (timestamp, wave_height, wind_speed)

## Catatan Penting

- FastAPI service harus running sebelum menggunakan Laravel endpoints
- Timeout default adalah 300 detik (5 menit) untuk training
- Async training akan return immediately, sync training akan wait
- Semua error akan di-log ke Laravel log

