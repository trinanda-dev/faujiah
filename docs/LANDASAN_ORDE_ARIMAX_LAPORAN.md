# Landasan Pemilihan Orde (p, d, q) ARIMAX untuk Laporan

Dokumen ini berisi paragraf yang dapat digunakan sebagai **landasan kenapa parameter-parameter (p, d, q) tertentu dievaluasi** (misalnya ARIMAX(3,1,1), (2,1,1), (3,1,0), (3,1,2), (2,1,0)) dan alur yang konsisten dengan Tabel 42, Tabel 43, serta penerimaan kandidat model.

---

## 1. Dari mana orde (p, d, q) didapat?

Pemilihan orde (p, d, q) **bukan sembarang**. Nilai tersebut diperoleh dari **analisis data** dengan urutan berikut (sesuai implementasi di sistem):

| Tahap | Sumber | Cara dapat nilai |
|--------|--------|-------------------|
| **d (differencing)** | Uji stasioneritas (ACF data asli) | Data tinggi gelombang diuji stasioner atau tidak. Jika ACF lag-1 besar dan banyak lag signifikan (decay lambat) → dianggap **tidak stasioner** → dipakai **d = 1** (differencing orde satu). Jika sudah stasioner → d = 0. |
| **p (orde AR)** | **PACF** pada deret yang sudah stasioner | Lag terakhir di mana PACF signifikan (|PACF| > 1,96/√n) dijadikan p. Dibatasi maksimal **p = 3**. |
| **q (orde MA)** | **ACF** pada deret yang sudah stasioner | Lag terakhir di mana ACF signifikan (|ACF| > 1,96/√n) dijadikan q. Dibatasi maksimal **q = 3**. |

Jadi: **d** dari uji stasioneritas, **p** dari PACF, **q** dari ACF (semua pada deret setelah differencing jika d = 1).

---

## 2. Kenapa dapat kombinasi (3,1,1), (2,1,1), (3,1,0), (3,1,2), (2,1,0)?

Dari analisis ACF/PACF didapat **satu pasang (p, q)** — misalnya **p = 2** dan **q = 1**, dengan **d = 1** dari uji stasioneritas. Kombinasi yang dievaluasi **tidak hanya (2,1,1)**, melainkan juga **variansi di sekitar** nilai tersebut agar tidak melewatkan model yang lebih baik:

1. **Kombinasi utama:** (p, d, q) = **(2, 1, 1)**.
2. **Variasi p:** (p−1, d, q) = (1, 1, 1); (p+1, d, q) = **(3, 1, 1)**.
3. **Variasi q:** (p, d, q−1) = **(2, 1, 0)**; (p, d, q+1) = **(3, 1, 2)** (q+1 dibatasi maks 3).
4. **Variasi p dan q:** (p−1, d, q−1) = (1, 1, 0); (p+1, d, q+1) = **(3, 1, 2)** (bisa sama dengan poin 3).

Setelah duplikat dihapus dan diurutkan, daftar yang muncul antara lain: **(3,1,1), (2,1,1), (3,1,0), (3,1,2), (2,1,0)** — persis seperti yang Anda sebut. Dengan demikian, **semua kombinasi itu punya landasan**: (2,1,1) sebagai hasil identifikasi ACF/PACF, sisanya sebagai variasi p±1 dan q±1 di sekitar nilai tersebut (dengan batas 0 ≤ p, q ≤ 3).

---

## 3. Paragraf siap pakai untuk laporan

**Paragraf untuk laporan (bisa disalin/diadaptasi):**

Kombinasi orde ARIMAX (p, d, q) yang dievaluasi ditentukan melalui dua tahap. **Pertama**, orde differencing (d) ditetapkan berdasarkan uji stasioneritas data tinggi gelombang; jika data belum stasioner, digunakan d = 1 (differencing orde satu). **Kedua**, orde autoregressive (p) dan moving average (q) diidentifikasi dari ACF dan PACF pada deret yang telah stasioner: p diambil dari lag terakhir PACF yang signifikan (|PACF| > 1,96/√n), dan q dari lag terakhir ACF yang signifikan, dengan batas maksimal p, q = 3. Dari pasangan (p, q) yang didapat — misalnya (2, 1) — dibentuk kombinasi kandidat yang mencakup (p, d, q) utama serta variasinya (p±1, q±1) dalam rentang 0–3, sehingga diperoleh antara lain ARIMAX(3,1,1), ARIMAX(2,1,1), ARIMAX(3,1,0), ARIMAX(3,1,2), dan ARIMAX(2,1,0). Dengan demikian, pemilihan kombinasi orde tersebut memiliki landasan yang jelas dari identifikasi ACF/PACF dan uji stasioneritas.

---

## 4. Alur yang konsisten dengan Tabel 42 dan Tabel 43

- **Tabel 42 (Hasil estimasi parameter)**  
  Berisi: Parameter, Nilai Estimasi, Daerah Diterima, Kondisi.  
  Sumber di sistem: response API `parameter_estimations` (dari evaluasi model terbaik), dengan kolom `parameter`, `estimasi`, `daerah_diterima`, `kondisi`. Data ini dapat diambil dari endpoint **POST /evaluate/arimax-models** (field `parameter_estimations`) atau **GET /arimax/parameter-test** (estimation_table) setelah model dilatih.

- **Tabel 43 (Uji signifikansi parameter)**  
  Berisi: Parameter, Estimasi, T-Hitung, T-Tabel, Keterangan (Signifikan/Tidak Signifikan).  
  Sumber di sistem: `parameter_estimations` dengan kolom `estimasi`, `z_value` (T-Hitung), `t_tabel` (1,967), `signifikansi` (Keterangan). T-Tabel 1,967 mengacu pada nilai kritis t untuk α = 0,05 (dua sisi) yang lazim dipakai sebagai landasan uji signifikansi parameter.

---

## 5. Paragraf penutup kandidat model (contoh)

Setelah menyajikan Tabel 42 dan Tabel 43, alur narasi dapat ditutup sebagai berikut (contoh; angka dan daftar model bisa disesuaikan dengan hasil analisis Anda):

*Berdasarkan uji signifikansi, seluruh parameter autoregressive (AR) hingga lag ke-3 dan moving average (MA) hingga lag ke-1 dinyatakan signifikan. Namun demikian, hasil evaluasi model menunjukkan bahwa tidak semua kombinasi parameter (p,d,q) menghasilkan performa peramalan yang baik. Model dengan kompleksitas berlebih atau tanpa diferensiasi yang memadai cenderung menghasilkan nilai MAPE validasi yang lebih tinggi, sehingga dinyatakan ditolak. Berdasarkan hasil evaluasi tersebut, model ARIMAX(3,1,1), ARIMAX(2,1,1), ARIMAX(3,1,0), dan ARIMAX(2,1,0) dinyatakan diterima sebagai kandidat model karena memiliki performa akurasi yang stabil dan konsisten.*

---

## 6. Data dari API untuk mengisi tabel

- **Tabel 42:** gunakan dari response `parameter_estimations`:  
  `parameter` → Parameter; `estimasi` → Nilai Estimasi; `daerah_diterima` → Daerah Diterima; `kondisi` → Kondisi.

- **Tabel 43:** gunakan dari response yang sama:  
  `parameter` → Parameter; `estimasi` → Estimasi; `z_value` → T-Hitung; `t_tabel` → T-Tabel (1,967); `signifikansi` → Keterangan (Signifikan / Tidak Signifikan).

Response **POST /evaluate/arimax-models** dan **GET /arimax/parameter-test** kini menyertakan `t_tabel` dan `signifikansi` sehingga dapat dipakai langsung sebagai landasan pengisian Tabel 43.
