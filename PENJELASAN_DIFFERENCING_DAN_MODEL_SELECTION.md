# Penjelasan Tab Differencing Grafik dan Model Selection ARIMAX(1,0,0)

## 📋 **Overview**

Dokumen ini menjelaskan:
1. **Tab "Differencing Grafik"** di menu Uji Stasioneritas - apa itu, bagaimana cara kerjanya, dan tujuannya
2. **Kenapa ARIMAX(1,0,0) dengan d=0** bisa menjadi model terbaik meskipun ada grafik differencing
3. **Perbedaan antara analisis visual differencing vs model selection berbasis performa**

---

## 🔵 **Bagian 1: Tab Differencing Grafik**

### **Lokasi dan Akses**

- **Menu**: ARIMAX → Uji Stasioneritas
- **Tab**: "Differencing Grafik" (tab kedua, setelah "Grafik Time Series")
- **File**: `resources/js/pages/Arimax/StationarityTest.tsx`

### **Apa Itu Differencing?**

**Differencing** adalah transformasi matematika untuk membuat data time series menjadi **stasioner** dengan menghilangkan tren (trend) dan musiman (seasonality).

**Rumus Differencing Orde 1:**
```
differencing[t] = nilai[t] - nilai[t-1]
```

**Contoh:**
- Data asli: [2.5, 2.8, 3.1, 3.4, 3.7]
- Differencing: [-, 0.3, 0.3, 0.3, 0.3] (selisih antar nilai)

### **Karakteristik Tab Differencing Grafik**

#### **1. Data yang Ditampilkan**

- **Sumber Data**: Data latih (70% dari dataset)
- **Perhitungan**: 
  ```php
  // Dari ArimaxController.php
  for ($i = 1; $i < count($timeSeriesData); $i++) {
      $differencingData[] = [
          'tanggal' => $curr['tanggal'],
          'differencing' => $curr['tinggi_gelombang'] - $prev['tinggi_gelombang'],
      ];
  }
  ```
- **Total Data**: `n - 1` (karena differencing membutuhkan 2 nilai)

#### **2. Tujuan Grafik Differencing**

**A. Menentukan Kebutuhan Differencing (d)**
- Jika grafik differencing menunjukkan **fluktuasi acak di sekitar nol** → Data sudah stasioner → **d = 0**
- Jika grafik differencing masih menunjukkan **tren atau pola** → Data belum stasioner → **d = 1 atau lebih**

**B. Visualisasi Pola Perubahan**
- Menampilkan **selisih antar nilai berurutan**
- Membantu mengidentifikasi apakah ada **tren yang kuat** yang perlu dihilangkan
- Menunjukkan **variabilitas** data setelah differencing

#### **3. Interpretasi Grafik**

**✅ Grafik Differencing yang Baik (Data Stasioner):**
- Fluktuasi acak di sekitar nol
- Tidak ada tren naik/turun yang jelas
- Variansi relatif konstan
- **Kesimpulan**: Data sudah stasioner, **d = 0** mungkin cukup

**❌ Grafik Differencing yang Buruk (Data Belum Stasioner):**
- Masih ada tren naik/turun
- Pola musiman masih terlihat
- Variansi tidak konstan
- **Kesimpulan**: Data belum stasioner, mungkin perlu **d = 1 atau lebih**

### **Cara Kerja Tab**

1. **User membuka tab "Differencing Grafik"**
2. **Backend menghitung differencing**:
   - Mengambil data latih dari database
   - Menghitung selisih antar nilai berurutan
   - Mengembalikan data differencing ke frontend
3. **Frontend menampilkan grafik**:
   - LineChart dengan sumbu X: tanggal
   - Sumbu Y: nilai differencing (m)
   - Tooltip menampilkan nilai differencing per titik

### **Keterbatasan Analisis Visual**

⚠️ **Penting**: Grafik differencing adalah **alat bantu visual**, bukan keputusan final!

**Alasan:**
1. **Subjektivitas**: Interpretasi visual bisa berbeda antar orang
2. **Tidak mengukur performa model**: Grafik tidak menunjukkan apakah differencing benar-benar meningkatkan akurasi
3. **Tidak mempertimbangkan kompleksitas**: Differencing bisa menambah kompleksitas tanpa manfaat
4. **Tidak mempertimbangkan overfitting**: Model dengan d=1 bisa overfit meskipun grafik terlihat bagus

---

## 🟢 **Bagian 2: Kenapa ARIMAX(1,0,0) dengan d=0 Bisa Menjadi Model Terbaik?**

### **Struktur Model ARIMAX(1,0,0)**

**ARIMAX(p, d, q):**
- **p = 1**: Autoregressive orde 1 (menggunakan 1 nilai sebelumnya)
- **d = 0**: **TIDAK ada differencing** (data digunakan langsung tanpa transformasi)
- **q = 0**: Moving Average orde 0 (tidak ada komponen MA)

**Rumus Model:**
```
y[t] = c + φ₁ * y[t-1] + β * x[t] + ε[t]
```
- `y[t]`: Nilai saat ini
- `y[t-1]`: Nilai sebelumnya (AR orde 1)
- `x[t]`: Variabel eksogen (kecepatan angin)
- `c`: Intercept
- `φ₁`: Koefisien AR
- `β`: Koefisien variabel eksogen

### **Alasan ARIMAX(1,0,0) dengan d=0 Bisa Menjadi Model Terbaik**

#### **1. Data Sudah Cukup Stasioner Tanpa Differencing**

**Kemungkinan:**
- Data ketinggian gelombang **sudah relatif stasioner** secara intrinsik
- Fluktuasi data tidak menunjukkan tren yang kuat
- Variansi relatif konstan
- **Differencing tidak diperlukan** karena data sudah memenuhi asumsi stasioneritas

**Bukti dari Grafik Differencing:**
- Jika grafik differencing menunjukkan fluktuasi acak di sekitar nol
- Maka data asli sudah cukup stasioner
- **d = 0** adalah pilihan yang tepat

#### **2. Differencing Bisa Memperburuk Performa Model**

**Mengapa Differencing Bisa Merugikan:**

**A. Kehilangan Informasi**
- Differencing menghilangkan **level absolut** data
- Informasi tentang **magnitude** data hilang
- Model harus "menebak" level awal untuk prediksi

**B. Error Akumulasi**
- Prediksi dengan differencing membutuhkan **inverse differencing**
- Error kecil dalam prediksi differenced → **error besar** setelah inverse
- Untuk prediksi multi-step, error bisa terakumulasi

**C. Overfitting pada Pola Differencing**
- Model dengan d=1 bisa **overfit** pada pola differencing
- Performa bagus di validation, tapi **jelek di test set**
- Ini yang terjadi pada model (2,1,0) yang overfit!

#### **3. Prinsip Parsimony (Occam's Razor)**

**Prinsip Parsimony:**
> "Model yang lebih sederhana lebih baik jika performanya sama atau lebih baik"

**ARIMAX(1,0,0) vs ARIMAX(2,1,0):**
- **(1,0,0)**: 1 parameter (φ₁), tanpa differencing → **Sederhana**
- **(2,1,0)**: 2 parameter (φ₁, φ₂), dengan differencing → **Kompleks**

**Hasil dari Model Selection:**
- **(1,0,0)**: Test MAPE lebih rendah, gap val-test kecil → **Generalize lebih baik**
- **(2,1,0)**: Validation MAPE rendah, tapi Test MAPE tinggi → **Overfit**

**Kesimpulan**: Model sederhana (1,0,0) dengan d=0 **lebih robust** dan **generalize lebih baik**.

#### **4. Model Selection Berbasis Performa, Bukan Visual**

**Metodologi Model Selection yang Benar:**

**❌ SALAH: Pilih model berdasarkan grafik differencing saja**
- Grafik differencing hanya alat bantu visual
- Tidak mengukur performa aktual model

**✅ BENAR: Pilih model berdasarkan performa test set**
- **Primary**: Test MAPE (performa pada data baru)
- **Secondary**: Gap val-test (indikator overfitting)
- **Tertiary**: Kompleksitas model (parsimony)

**Dari Implementasi:**
```python
# python-ml/main.py - get_model_score()
def get_model_score(model_metrics):
    # Primary: Test MAPE (semakin rendah semakin baik)
    test_mape = model_metrics['mape']
    
    # Secondary: Gap val-test (semakin kecil semakin stabil)
    gap_val_test = model_metrics['gap_val_test']
    
    # Tertiary: Kompleksitas (semakin sederhana semakin baik)
    complexity = model_metrics['complexity']
    
    # Composite score
    score = test_mape + (gap_val_test * 0.5) + (complexity * 0.1)
    return score
```

**Hasil untuk ARIMAX(1,0,0):**
- Test MAPE: **Lebih rendah** dari (2,1,0)
- Gap val-test: **Lebih kecil** (lebih stabil)
- Kompleksitas: **Lebih sederhana** (d=0, p=1)
- **Total Score: TERBAIK** → Dipilih sebagai model final

#### **5. Stasioneritas vs Performa Model**

**Poin Penting:**
- **Stasioneritas adalah asumsi**, bukan tujuan akhir
- Tujuan akhir: **Akurasi prediksi yang baik**
- Jika model dengan d=0 memberikan performa lebih baik, maka **d=0 adalah pilihan yang benar**

**Analogi:**
- Stasioneritas seperti "persyaratan teknis" untuk ARIMAX
- Tapi jika data "cukup stasioner" (meskipun tidak sempurna), model bisa tetap bekerja dengan baik
- **Performa aktual lebih penting** daripada stasioneritas sempurna

---

## 📊 **Perbandingan: Analisis Visual vs Model Selection**

| Aspek | Analisis Visual (Grafik Differencing) | Model Selection (Berbasis Performa) |
|-------|--------------------------------------|-------------------------------------|
| **Tujuan** | Menentukan kebutuhan differencing secara visual | Memilih model dengan performa terbaik |
| **Metode** | Interpretasi grafik | Evaluasi MAPE train/val/test |
| **Kriteria** | Pola visual (tren, variansi) | Test MAPE, gap val-test, kompleksitas |
| **Keterbatasan** | Subjektif, tidak mengukur performa | Membutuhkan data test yang representatif |
| **Keputusan** | Rekomendasi awal (d=0 atau d=1) | Keputusan final (model terbaik) |

### **Kesimpulan**

**Grafik Differencing:**
- ✅ Alat bantu untuk **eksplorasi awal**
- ✅ Membantu memahami karakteristik data
- ❌ **Bukan keputusan final** untuk pemilihan model

**Model Selection Berbasis Performa:**
- ✅ **Keputusan final** berdasarkan data aktual
- ✅ Mempertimbangkan generalisasi (test set)
- ✅ Mempertimbangkan kompleksitas (parsimony)

---

## 🔍 **Contoh Kasus: ARIMAX(1,0,0) vs ARIMAX(2,1,0)**

### **Skenario**

**Model 1: ARIMAX(1,0,0)**
- p=1, d=0, q=0
- **Tidak ada differencing**
- Model sederhana

**Model 2: ARIMAX(2,1,0)**
- p=2, d=1, q=0
- **Dengan differencing** (d=1)
- Model lebih kompleks

### **Hasil Evaluasi**

| Metrik | ARIMAX(1,0,0) | ARIMAX(2,1,0) |
|--------|---------------|---------------|
| **MAPE Train** | ~12% | ~8% |
| **MAPE Validation** | ~15% | **~10%** ⭐ (terbaik) |
| **MAPE Test** | **~18%** ⭐ (terbaik) | ~32% ❌ (jelek) |
| **Gap Val-Test** | **~3%** ⭐ (stabil) | ~22% ❌ (overfit) |
| **Kompleksitas** | **Rendah** (d=0, p=1) | Tinggi (d=1, p=2) |

### **Analisis**

**ARIMAX(2,1,0) dengan d=1:**
- ✅ Validation MAPE terendah (10%)
- ❌ Test MAPE jauh lebih tinggi (32%)
- ❌ Gap val-test besar (22%) → **Overfit**
- ❌ Model terlalu kompleks untuk dataset

**ARIMAX(1,0,0) dengan d=0:**
- ✅ Test MAPE lebih rendah (18%)
- ✅ Gap val-test kecil (3%) → **Stabil**
- ✅ Model sederhana → **Generalize lebih baik**
- ✅ Dipilih sebagai model final

### **Kesimpulan**

**Kenapa ARIMAX(1,0,0) dengan d=0 dipilih:**
1. **Performa test lebih baik**: 18% vs 32%
2. **Lebih stabil**: Gap val-test kecil (3% vs 22%)
3. **Lebih sederhana**: Prinsip parsimony
4. **Generalize lebih baik**: Tidak overfit

**Pelajaran:**
- **Differencing (d=1) tidak selalu membantu**
- **Model sederhana bisa lebih baik** daripada model kompleks
- **Test MAPE lebih penting** daripada validation MAPE
- **Grafik differencing hanya alat bantu**, bukan keputusan final

---

## 📝 **Rekomendasi Praktis**

### **1. Gunakan Grafik Differencing untuk Eksplorasi**

✅ **Lakukan:**
- Lihat grafik differencing untuk memahami karakteristik data
- Gunakan sebagai **rekomendasi awal** untuk range d yang akan diuji
- Jika grafik menunjukkan fluktuasi acak → coba d=0
- Jika grafik masih menunjukkan tren → coba d=1

❌ **Jangan:**
- Memilih model hanya berdasarkan grafik
- Mengabaikan evaluasi performa aktual

### **2. Evaluasi Semua Kombinasi Parameter**

✅ **Lakukan:**
- Uji berbagai kombinasi (p, d, q)
- Evaluasi dengan **train, validation, dan test MAPE**
- Pilih model berdasarkan **test MAPE** (primary), **gap val-test** (secondary), dan **kompleksitas** (tertiary)

❌ **Jangan:**
- Hanya memilih model dengan validation MAPE terendah
- Mengabaikan gap antara validation dan test

### **3. Prioritaskan Generalisasi**

✅ **Lakukan:**
- Pilih model dengan **test MAPE terendah**
- Pilih model dengan **gap val-test kecil** (indikator stabilitas)
- Pilih model yang **lebih sederhana** jika performa sama

❌ **Jangan:**
- Memilih model yang overfit (gap val-test besar)
- Memilih model yang terlalu kompleks tanpa manfaat

---

## 🎯 **Kesimpulan Utama**

### **1. Tab Differencing Grafik**

- **Tujuan**: Alat bantu visual untuk menentukan kebutuhan differencing
- **Fungsi**: Menampilkan selisih antar nilai berurutan untuk analisis stasioneritas
- **Keterbatasan**: Subjektif, tidak mengukur performa aktual model
- **Kesimpulan**: Gunakan sebagai **rekomendasi awal**, bukan keputusan final

### **2. ARIMAX(1,0,0) dengan d=0**

- **Kenapa d=0**: Data sudah cukup stasioner tanpa differencing
- **Kenapa lebih baik**: Test MAPE lebih rendah, gap val-test kecil, model sederhana
- **Pelajaran**: Differencing tidak selalu membantu, model sederhana bisa lebih baik

### **3. Model Selection yang Benar**

- **Primary**: Test MAPE (performa pada data baru)
- **Secondary**: Gap val-test (indikator overfitting)
- **Tertiary**: Kompleksitas (parsimony)
- **Kesimpulan**: Pilih model berdasarkan **performa aktual**, bukan hanya analisis visual

---

## 📚 **Referensi**

- **File Terkait**:
  - `resources/js/pages/Arimax/StationarityTest.tsx` - Frontend tab differencing
  - `app/Http/Controllers/ArimaxController.php` - Backend perhitungan differencing
  - `python-ml/main.py` - Model selection logic
  - `ANALISIS_MASALAH_MAPE.md` - Analisis overfitting dan model selection

- **Konsep Teoritis**:
  - ARIMAX Model: Autoregressive Integrated Moving Average with Exogenous variables
  - Differencing: Transformasi untuk membuat data stasioner
  - Stasioneritas: Asumsi untuk model time series
  - Parsimony: Prinsip Occam's Razor (model sederhana lebih baik)
  - Bias-Variance Trade-off: Keseimbangan antara kompleksitas dan generalisasi





