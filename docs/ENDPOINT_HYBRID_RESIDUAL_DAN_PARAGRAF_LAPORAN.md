# Endpoint Hybrid untuk Data Residual & Paragraf Laporan

Base URL FastAPI: **`http://localhost:8002`** (atau nilai `FASTAPI_URL` di `.env`).

---

## 1. Kenapa GET /evaluate di Postman beda dengan Laravel log (28,38% vs 33,49%)?

**GET /evaluate** memakai **model yang saat ini tersimpan di disk**. Hasilnya tidak “tetap”:

- Setelah **Generate Prediksi** di aplikasi, Laravel memanggil **POST /train/hybrid/sync** (latih + simpan model), lalu **GET /evaluate**. Saat itu model yang baru disimpan dipakai → hybrid 28,38%, lstm.mape_residual ikut run itu.
- Kalau setelah itu Anda memanggil **POST /evaluate/arimax-models** (atau training lain), model di disk **bisa tergantikan** (orde/seed lain). Lalu saat Anda **GET /evaluate** di Postman, yang dipakai model terakhir itu → hybrid 33,49%, lstm.mape_residual 110,42%.

Jadi: **angka di Postman GET /evaluate = angka dari model yang terakhir disimpan.** Agar dapat **Hybrid 28,38%** dan **MAPE LSTM (Residual)** yang sesuai run itu, jangan mengandalkan GET /evaluate saja; pakai run yang sama (sync) dan ambil dari response sync atau dari GET /evaluate **tepat setelah** sync.

---

## 2. Endpoint yang harus di-hit agar dapat residual & MAPE LSTM (konsisten 28,38%)

### Opsi A (disarankan): Satu kali panggil sync — Hybrid + MAPE LSTM Residual dari run yang sama

**POST** `http://localhost:8002/train/hybrid/sync`

**Body (opsional):**  
- Kosong (pakai default orde dari evaluasi ARIMAX), atau  
- `{"order": {"p": 2, "d": 1, "q": 0}, "seed": 123}` jika ingin orde yang memberi 28,38%.

Response berisi **hybrid_mape** dan **lstm_mape_residual** dari **satu run yang sama** (model yang baru saja dilatih), jadi cocok untuk laporan (mis. Hybrid 28,38% dan MAPE residual LSTM yang sesuai).

Contoh response:

```json
{
  "status": "success",
  "arimax_mape": 32.91,
  "hybrid_mape": 28.38,
  "lstm_mape_residual": 110.42,
  "order": { "p": 2, "d": 1, "q": 0 },
  "seed_search_logs": [...],
  "training_history": {...},
  "diagnostics": {
    "hybrid_test_mape": 28.38,
    "lstm_mape_residual": 110.42,
    ...
  }
}
```

Gunakan **`hybrid_mape`** dan **`lstm_mape_residual`** dari response ini untuk laporan (tanpa perlu GET /evaluate).

### Opsi B: GET /evaluate (harus setelah sync, tanpa training lain)

**GET** `http://localhost:8002/evaluate`

- Dipanggil **tepat setelah POST /train/hybrid/sync**, **tanpa** memanggil **POST /evaluate/arimax-models** atau training lain di antara keduanya.
- Response: `arimax.mape`, `hybrid.mape`, `lstm.mape_residual`, dan `results[]` (per baris: `residual_actual`, `residual_pred`, `residual_error`, dll.).

Kalau Anda memanggil GET /evaluate **tanpa** baru saja sync (atau setelah endpoint lain yang menimpa model), angka hybrid dan lstm.mape_residual bisa berbeda (mis. 33,49% dan 110,42% dari run lain).

### Dari frontend (aplikasi)

1. User klik **Generate Prediksi** → Laravel: **POST /train/hybrid/sync** lalu **GET /evaluate**.
2. Hasil disimpan ke DB; halaman **Prediksi Hybrid** menampilkan MAPE Hybrid, **MAPE LSTM (Residual)**, dan besaran error per horizon (dihitung dari data tersimpan).

---

## 2. Paragraf siap pakai untuk laporan (Hybrid 28,38%)

Gunakan nilai **MAPE LSTM (Residual)** dari response **GET** `/evaluate` (field `lstm.mape_residual`) atau dari kartu **MAPE LSTM (Residual)** di halaman Prediksi Hybrid. Ganti **[X]** di bawah dengan nilai tersebut (dalam bentuk desimal, mis. 45,2 untuk 45,2%).

---

**Paragraf:**

Fenomena nilai residual LSTM yang semakin stabil juga dapat dilihat dari hasil evaluasi error model. Berdasarkan perhitungan pada data pengujian diperoleh nilai Mean Absolute Percentage Error (MAPE) residual LSTM sebesar **[X]%**, sedangkan MAPE Hybrid sebesar **28,38%**. Nilai error residual LSTM yang cukup besar ini terjadi karena nilai residual aktual dari model ARIMAX relatif kecil dan mendekati nol sehingga selisih kecil antara residual aktual dan residual prediksi dapat menghasilkan nilai error relatif yang tinggi. Selain itu, pada proses prediksi multi-step yang dilakukan secara rekursif, yaitu menggunakan hasil prediksi residual sebelumnya sebagai input pada langkah berikutnya, error yang terjadi pada setiap langkah dapat terakumulasi. Kondisi ini menyebabkan variasi informasi yang diterima model semakin terbatas sehingga model cenderung menghasilkan nilai residual yang semakin stabil atau mendekati konstan (sintesis) pada langkah prediksi selanjutnya.

---

**Cara isi [X]:**

- **Dari aplikasi:** Setelah Generate Prediksi, buka **Prediksi Hybrid** → ambil angka dari kartu **MAPE LSTM (Residual)** (mis. 110,42 → tulis **110,42%**).
- **Dari API (konsisten dengan Hybrid 28,38%):** Panggil **POST** `http://localhost:8002/train/hybrid/sync` (body kosong atau `{"p": 2, "d": 1, "q": 0}`) → gunakan **`lstm_mape_residual`** dari response (satu run dengan `hybrid_mape` 28,38).
- **Dari API (GET /evaluate):** Hanya konsisten jika dipanggil **tepat setelah** sync, tanpa panggil training lain. Gunakan **`lstm.mape_residual`** dari response.
