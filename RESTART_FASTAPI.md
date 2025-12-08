# Cara Restart FastAPI di Port 8001

## Masalah
FastAPI masih berjalan di port 8000 (konflik dengan Laravel), perlu diubah ke port 8001.

## Solusi

### 1. Stop FastAPI yang sedang berjalan
Di terminal tempat FastAPI berjalan, tekan:
```
Ctrl + C
```

### 2. Restart FastAPI di port 8001

**Opsi A: Menggunakan run.bat (Windows)**
```bash
cd python-ml
.\run.bat
```

**Opsi B: Manual command**
```bash
cd python-ml
# Aktifkan virtual environment
call venv\Scripts\activate.bat

# Jalankan server di port 8001
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 3. Verifikasi FastAPI berjalan

Buka browser atau gunakan curl:
- `http://localhost:8001/` → Harus return JSON: `{"message": "Hybrid ARIMAX-LSTM Wave Height Prediction API"}`
- `http://localhost:8001/health` → Harus return JSON: `{"status": "healthy"}`

### 4. Test dari Laravel

Setelah FastAPI berjalan di port 8001, coba generate prediksi hybrid dari Laravel. Seharusnya sudah bisa terhubung.

## Catatan
- Pastikan tidak ada aplikasi lain yang menggunakan port 8001
- Jika masih error, cek log Laravel di `storage/logs/laravel.log`

