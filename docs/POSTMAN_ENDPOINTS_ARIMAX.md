# Endpoint untuk Postman – ARIMAX & Identifikasi Model

Base URL FastAPI: **`http://localhost:8002`** (atau nilai `FASTAPI_URL` di `.env`).  
Pastikan service Python sudah jalan (mis. `.\run.bat` atau `uvicorn` di folder `python-ml`).

---

## 1. Lihat semuanya (evaluasi + model terbaik + parameter + test results)

**POST** `http://localhost:8002/evaluate/arimax-models`

**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "orders": [
    [1, 1, 0],
    [2, 1, 0],
    [0, 1, 1],
    [2, 1, 1],
    [3, 1, 0],
    [3, 1, 1]
  ]
}
```

**Response:** JSON berisi:
- `parameter_evaluations` – tabel evaluasi tiap kombinasi (p,d,q), status Diterima/Ditolak, MAPE train/val
- `parameter_estimations` – parameter model terbaik (AR, MA, eksogen, σ²) + daerah diterima + kondisi
- `model_summary` – AIC, BIC, log likelihood, sigma2, total observasi
- `test_results` – per baris data uji: nomor, ketinggian_gelombang, prediksi tiap model (arimax_0_1_1, arimax_2_1_1, dll.)
- `model_metrics` – per model: model, mape_train, mape_val, mape (test), gap_val_test, complexity
- `best_model_summary` – model terbaik, mape train/val/test, gap, complexity, description

Ini satu endpoint yang mengembalikan **semua** data yang dipakai di halaman Identifikasi Model.

---

## 2. Parameter & uji kondisi (model yang sudah dilatih)

**GET** `http://localhost:8002/arimax/parameter-test`

Tidak perlu body. Menggunakan **model ARIMAX yang saat ini tersimpan** (hasil training terakhir).

**Response:** JSON berisi:
- `estimation_table` – tiap parameter: model (nama param), daerah_diterima, range_info, kondisi (Diterima/Tidak Diterima)
- `significance_table` – parameter, estimasi, t_hitung, t_tabel, signifikansi, keterangan
- `model_summary` – AIC, BIC, order

Berguna untuk cek parameter (AR/MA/eksogen) + daerah diterima + kondisi tanpa jalankan evaluasi penuh.

---

## 3. Residual training ARIMAX

**GET** `http://localhost:8002/arimax/training-residuals`

Tidak perlu body.

**Response:** JSON berisi array `data`:
- `nomor`, `tanggal`, `actual`, `fitted`, `residual` (per observasi data latih)

Berguna untuk cek residual yang dipakai untuk training LSTM (Hybrid).

---

## 4. Health check

**GET** `http://localhost:8002/health`

Cek apakah service FastAPI hidup.

---

## 5. Root

**GET** `http://localhost:8002/`

Info singkat tentang API.

---

## Catatan

- **Port:** Jika pakai port lain, ganti `8002` dengan nilai `FASTAPI_URL` di `.env` (tanpa trailing slash).
- **Data:** `evaluate/arimax-models` memakai dataset yang sudah di-upload ke FastAPI (biasanya lewat Laravel saat buka halaman Identifikasi Model). Kalau belum ada data, bisa dapat 404 atau error.
- **Orders:** Daftar `orders` di body bisa disesuaikan (mis. tambah [1,0,1], [3,1,0], dll.) sesuai kombinasi yang ingin diuji.
