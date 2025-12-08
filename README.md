# Sistem Prediksi Ketinggian Gelombang - Hybrid ARIMAX-LSTM

Sistem prediksi ketinggian gelombang laut menggunakan model gabungan ARIMAX dan LSTM. Aplikasi ini terdiri dari dua bagian utama:
- **Laravel** (Frontend + REST Client) - Port 8000
- **FastAPI Python** (ML Service) - Port 8001

## 📋 Requirements

### Laravel
- PHP >= 8.2.12
- Composer
- Node.js >= 18.x
- npm atau yarn
- SQLite (default) atau MySQL/PostgreSQL

### Python FastAPI
- Python >= 3.10
- pip
- Virtual environment (recommended)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd aplikasi_skripsi
```

### 2. Setup Laravel

#### Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

#### Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### Konfigurasi Database

Edit file `.env` dan sesuaikan konfigurasi database:

```env
DB_CONNECTION=sqlite
# atau untuk MySQL/PostgreSQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=nama_database
# DB_USERNAME=username
# DB_PASSWORD=password
```

#### Setup Database

```bash
# Untuk SQLite, buat file database
touch database/database.sqlite

# Jalankan migrations
php artisan migrate

# (Optional) Seed database
php artisan db:seed
```

#### Build Frontend Assets

```bash
# Development mode (dengan hot reload)
npm run dev

# Production mode
npm run build
```

### 3. Setup Python FastAPI

#### Masuk ke Direktori Python ML

```bash
cd python-ml
```

#### Buat Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

**Catatan:** Jika terjadi error dependency conflict (terutama dengan numpy), pastikan versi Python >= 3.10 dan coba install ulang:

```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

#### Buat Direktori yang Diperlukan

```bash
# Direktori akan dibuat otomatis saat pertama kali menjalankan FastAPI
# Tapi bisa juga dibuat manual:
mkdir -p data models
```

### 4. Konfigurasi FastAPI di Laravel

Pastikan file `.env` Laravel memiliki konfigurasi berikut:

```env
FASTAPI_URL=http://localhost:8001
FASTAPI_TIMEOUT=300
```

Atau edit `config/services.php` jika perlu.

## ▶️ Menjalankan Aplikasi

### Terminal 1: Laravel Server

```bash
# Pastikan berada di root directory project
php artisan serve
```

Laravel akan berjalan di `http://localhost:8000`

**Catatan:** Jika port 8000 sudah digunakan, gunakan port lain:
```bash
php artisan serve --port=8080
```

### Terminal 2: FastAPI Server

**Windows:**
```bash
cd python-ml
.\run.bat
```

**Linux/Mac:**
```bash
cd python-ml
./run.sh
```

**Manual:**
```bash
cd python-ml

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Jalankan server
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

FastAPI akan berjalan di `http://localhost:8001`

**Verifikasi FastAPI:**
- Buka `http://localhost:8001/` - harus return JSON
- Buka `http://localhost:8001/health` - harus return `{"status": "healthy"}`
- Buka `http://localhost:8001/docs` - Swagger UI documentation

### Terminal 3: Frontend Development (Optional)

Jika ingin development mode dengan hot reload:

```bash
npm run dev
```

## 📁 Struktur Project

```
aplikasi_skripsi/
├── app/                          # Laravel application
│   ├── Http/
│   │   ├── Controllers/         # Controllers
│   │   └── Requests/            # Form requests
│   ├── Models/                  # Eloquent models
│   └── Services/                # Business logic services
├── resources/
│   ├── js/                      # React/TypeScript frontend
│   │   ├── components/          # React components
│   │   ├── pages/               # Inertia pages
│   │   └── layouts/             # Layout components
│   └── css/                     # Styles
├── routes/                       # Laravel routes
├── database/
│   ├── migrations/              # Database migrations
│   └── factories/               # Model factories
├── python-ml/                   # FastAPI ML Service
│   ├── main.py                  # FastAPI application
│   ├── training/                # Training modules
│   │   ├── arimax_trainer.py
│   │   └── hybrid_trainer.py
│   ├── utils/                   # Utility modules
│   │   ├── preprocessing.py
│   │   ├── forecasting.py
│   │   ├── evaluation.py
│   │   └── dataset.py
│   ├── models/                  # Saved ML models
│   ├── data/                    # Dataset files
│   ├── requirements.txt         # Python dependencies
│   ├── run.bat                  # Windows run script
│   └── run.sh                   # Linux/Mac run script
└── tests/                       # PHPUnit/Pest tests
```

## 🔄 Workflow Aplikasi

1. **Upload Dataset** (Laravel → FastAPI)
   - User upload Excel file via Laravel
   - Laravel mengirim file ke FastAPI `/upload-dataset`
   - FastAPI menyimpan file ke `python-ml/data/upload.xlsx`

2. **Training ARIMAX** (FastAPI)
   - Laravel memanggil `POST /train/arimax/sync`
   - FastAPI: load data, split train/test (90/10), train SARIMAX
   - Simpan model: `arimax_model.pkl`, `train_dataset.csv`, `test_dataset.csv`, `residual_train.csv`

3. **Training Hybrid LSTM** (FastAPI)
   - Laravel memanggil `POST /train/hybrid/sync`
   - FastAPI: load residual, normalize, train LSTM
   - Simpan model: `lstm_residual_model.h5`, `residual_scaler.save`

4. **Evaluasi & Prediksi** (FastAPI)
   - Laravel memanggil `GET /evaluate`
   - FastAPI: prediksi ARIMAX + LSTM residual, combine untuk hybrid
   - Return metrics (MAPE, MAE, RMSE) dan detailed results

5. **Simpan Hasil** (Laravel)
   - Laravel menyimpan hasil prediksi ke database
   - Tampilkan di halaman Prediksi Hybrid dan Evaluasi

## 🧪 Testing

### Laravel Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/HybridIntegrationTest.php

# Run with filter
php artisan test --filter=testName
```

### FastAPI Tests

```bash
cd python-ml

# Aktifkan virtual environment
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Test endpoint (menggunakan curl atau browser)
curl http://localhost:8001/health
```

## 🐛 Troubleshooting

### Laravel

**Error: "FastAPI service tidak tersedia"**
- Pastikan FastAPI berjalan di port 8001
- Cek `config/services.php` atau `.env` untuk `FASTAPI_URL`
- Test dengan: `curl http://localhost:8001/health`

**Error: "Vite manifest not found"**
```bash
npm run build
# atau
npm run dev
```

**Error: Database connection**
- Pastikan file `database/database.sqlite` ada (untuk SQLite)
- Atau cek konfigurasi database di `.env`

### Python FastAPI

**Error: "Module not found"**
```bash
# Pastikan virtual environment aktif
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Install ulang dependencies
pip install -r requirements.txt
```

**Error: "Port 8001 already in use"**
```bash
# Cek process yang menggunakan port 8001
# Windows:
netstat -ano | findstr :8001
# Linux/Mac:
lsof -i :8001

# Kill process atau gunakan port lain
uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

**Error: "Could not deserialize keras.metrics.mse"**
- Model LSTM perlu di-retrain
- Hapus `python-ml/models/lstm_residual_model.h5`
- Jalankan training hybrid lagi dari Laravel

**Error: Dependency conflict (numpy/tensorflow)**
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

### Data Issues

**Error: "Data uji tidak tersedia"**
- Pastikan sudah upload dataset
- Data akan otomatis di-split 90% training, 10% test
- Cek halaman "Hasil Data Uji" untuk memastikan data ada

**Error: "Tidak ada hasil evaluasi"**
- Pastikan sudah menjalankan training ARIMAX dan Hybrid
- Pastikan FastAPI service berjalan
- Cek log Laravel di `storage/logs/laravel.log`

## 📝 Environment Variables

### Laravel (.env)

```env
APP_NAME="Sistem Prediksi Ketinggian Gelombang"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# atau
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=nama_database
# DB_USERNAME=username
# DB_PASSWORD=password

FASTAPI_URL=http://localhost:8001
FASTAPI_TIMEOUT=300
```

## 🔐 Default Credentials

Setelah menjalankan migrations dan seeders, default user:
- **Email:** `admin@example.com`
- **Password:** `password`

**Penting:** Ganti credentials ini di production!

## 📚 Dokumentasi Tambahan

- `HYBRID_PREDICTION_DOCUMENTATION.md` - Dokumentasi detail prediksi hybrid
- `INTEGRATION_FLOW.md` - Flow integrasi Laravel-FastAPI
- `python-ml/README.md` - Dokumentasi FastAPI service

## 🛠️ Development Commands

### Laravel

```bash
# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Run migrations
php artisan migrate
php artisan migrate:fresh  # Reset database

# Generate Wayfinder routes (jika ada perubahan routes)
php artisan wayfinder:generate

# Format code (Laravel Pint)
vendor/bin/pint
```

### Python

```bash
# Format code (Black)
black python-ml/

# Lint code (Flake8)
flake8 python-ml/

# Type checking (mypy)
mypy python-ml/
```

## 📞 Support

Jika mengalami masalah:
1. Cek log Laravel: `storage/logs/laravel.log`
2. Cek log FastAPI di terminal
3. Pastikan semua requirements terinstall dengan benar
4. Pastikan kedua server (Laravel dan FastAPI) berjalan

## 📄 License

[Your License Here]

## 👥 Authors

[Your Name/Team]

---

**Selamat menggunakan aplikasi! 🚀**

