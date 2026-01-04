# Penjelasan Tab Prediksi Otomatis dan Manual

## 📋 **Overview**

Halaman "Prediksi Satu Bulan ke Depan" memiliki **2 tab** yang memungkinkan pengguna untuk melakukan prediksi ketinggian gelombang dengan dua cara berbeda:

1. **Tab Prediksi Otomatis**: Prediksi fixed untuk periode tertentu tanpa input user
2. **Tab Prediksi Manual**: Prediksi custom dengan user dapat memilih tanggal dan kecepatan angin

Kedua tab menggunakan model **Hybrid ARIMAX-LSTM** yang sama untuk menghasilkan prediksi.

---

## 🔵 **Tab 1: Prediksi Otomatis**

### **Karakteristik**

- ✅ **Tanggal Fixed**: Selalu 1-31 Januari 2025 (tidak berubah)
- ✅ **Frekuensi**: Per 12 jam (2 prediksi per hari)
- ✅ **Total Prediksi**: 60 prediksi (30 hari × 2)
- ✅ **Kecepatan Angin**: Menggunakan kecepatan angin terakhir dari dataset

### **Cara Kerja**

1. **Otomatis saat halaman dimuat**:
   - Backend otomatis menghitung 60 prediksi untuk periode 1-31 Januari 2025
   - Menggunakan kecepatan angin terakhir dari data training
   - Menampilkan hasil tanpa perlu input dari user

2. **Tampilan yang ditampilkan**:
   - **Info Card**: Menampilkan periode prediksi dan kecepatan angin yang digunakan
   - **Grafik**: LineChart prediksi ketinggian gelombang
   - **Tabel**: Detail prediksi per 12 jam

### **Kapan Digunakan**

- ✅ Untuk melihat prediksi standar periode fixed
- ✅ Tidak perlu input tambahan
- ✅ Cocok untuk analisis cepat

### **Contoh Output**

```
Prediksi FIXED untuk periode 1-31 Januari 2025 (per 12 jam, total 60 prediksi)
Kecepatan angin terakhir yang digunakan: 5.50 m/s
```

---

## 🟢 **Tab 2: Prediksi Manual**

### **Karakteristik**

- ✅ **Tanggal**: User dapat memilih start date dan end date
- ✅ **Frekuensi**: Per 12 jam (2 prediksi per hari)
- ✅ **Maksimal**: 60 hari (120 prediksi)
- ✅ **Kecepatan Angin**: User input (konstan untuk semua prediksi)

### **Form Input**

#### **1. Tanggal Mulai (`start_date`)**
- **Type**: Date picker
- **Default**: 1 Januari 2025
- **Validasi**: Harus sebelum tanggal akhir

#### **2. Tanggal Akhir (`end_date`)**
- **Type**: Date picker
- **Default**: 31 Januari 2025
- **Validasi**: 
  - Harus setelah tanggal mulai
  - Maksimal 60 hari dari tanggal mulai

#### **3. Kecepatan Angin (`wind_speed`)**
- **Type**: Text input (mendukung koma dan titik sebagai separator desimal)
- **Default**: Kecepatan angin terakhir dari data training
- **Validasi**: 
  - Harus berupa angka positif
  - Mendukung format desimal (titik atau koma)
- **Format**: Mendukung `,` atau `.` sebagai separator (contoh: `5.5` atau `5,5`)

### **Cara Kerja**

1. **User mengisi form**:
   - Pilih tanggal mulai dan akhir
   - Input kecepatan angin (akan digunakan konstan untuk semua prediksi)

2. **Validasi**:
   - ✅ Semua field harus diisi
   - ✅ Tanggal mulai < tanggal akhir
   - ✅ Maksimal 60 hari (120 prediksi)
   - ✅ Kecepatan angin harus angka positif

3. **Submit**:
   - Mengirim POST request ke `/hybrid/manual-forecast`
   - Backend menghitung prediksi untuk periode yang dipilih
   - Menggunakan kecepatan angin yang diinput (konstan untuk semua langkah)
   - Menampilkan hasil di tab yang sama (tab tidak berubah)

4. **Tampilan hasil**:
   - **Grafik**: LineChart prediksi untuk periode yang dipilih
   - **Tabel**: Detail prediksi per 12 jam

### **Kapan Digunakan**

- ✅ Untuk periode spesifik di luar 1-31 Januari 2025
- ✅ Untuk skenario dengan kecepatan angin berbeda
- ✅ Untuk analisis what-if dengan parameter berbeda

### **Contoh Input**

```
Tanggal Mulai: 2025-02-01
Tanggal Akhir: 2025-02-15
Kecepatan Angin: 6.5 m/s
```

**Hasil**: 30 prediksi (15 hari × 2 prediksi per hari) dengan kecepatan angin konstan 6.5 m/s

---

## 📊 **Perbandingan**

| Aspek | Prediksi Otomatis | Prediksi Manual |
|-------|-------------------|-----------------|
| **Tanggal** | Fixed: 1-31 Jan 2025 | User-defined |
| **Kecepatan Angin** | Terakhir dari data | User input (konstan) |
| **Total Prediksi** | 60 (fixed) | Berdasarkan range (maks 120) |
| **Input User** | Tidak perlu | Perlu (tanggal + angin) |
| **Fleksibilitas** | Terbatas | Tinggi |
| **Use Case** | Analisis standar | Analisis custom |

---

## 🔧 **Detail Teknis**

### **Perhitungan Jumlah Prediksi**

```javascript
// Manual prediction
const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
const nSteps = diffDays * 2; // 2 prediksi per hari (per 12 jam)
```

### **Normalisasi Input Kecepatan Angin**

```javascript
// Mendukung koma dan titik sebagai separator
const windSpeedNormalized = formWindSpeed.replace(',', '.');
const windSpeedValue = parseFloat(windSpeedNormalized);
```

### **Tab Persistence**

- Setelah submit prediksi manual, tab tetap di "Manual"
- Backend mengirim `activeTab: 'manual'` untuk mempertahankan tab
- Menggunakan `useEffect` untuk sinkronisasi state dengan props

### **Backend Endpoints**

#### **Prediksi Otomatis**
- **Route**: `GET /hybrid/weekly-forecast`
- **Controller**: `HybridController@weeklyForecast`
- **Method**: Menghasilkan 60 prediksi untuk 1-31 Januari 2025

#### **Prediksi Manual**
- **Route**: `POST /hybrid/manual-forecast`
- **Controller**: `HybridController@manualForecast`
- **Method**: 
  - Menerima `start_date`, `end_date`, `wind_speed`
  - Menghitung `nSteps` berdasarkan range tanggal
  - Menghasilkan prediksi dengan kecepatan angin konstan

---

## ⚠️ **Catatan Penting**

1. **Prediksi Otomatis selalu fixed**:
   - Selalu untuk periode 1-31 Januari 2025
   - Tidak terpengaruh tanggal data terakhir
   - Tidak bisa diubah oleh user

2. **Prediksi Manual menggunakan kecepatan angin konstan**:
   - Kecepatan angin yang diinput digunakan untuk **semua** langkah prediksi
   - Tidak ada variasi kecepatan angin antar langkah

3. **Kedua tab menggunakan model yang sama**:
   - Model Hybrid ARIMAX-LSTM yang sama
   - Perbedaan hanya pada input (tanggal dan kecepatan angin)

4. **Frekuensi prediksi**:
   - Kedua tab menggunakan frekuensi **per 12 jam** (2 kali per hari)
   - Setiap hari menghasilkan 2 prediksi

5. **Maksimal prediksi manual**:
   - Maksimal 60 hari (120 prediksi)
   - Validasi dilakukan di frontend dan backend

---

## 📝 **Lokasi File**

- **Frontend**: `resources/js/pages/Hybrid/WeeklyForecast.tsx`
- **Backend Controller**: `app/Http/Controllers/HybridController.php`
  - Method `weeklyForecast()`: Prediksi otomatis
  - Method `manualForecast()`: Prediksi manual
- **Backend Service**: `app/Services/FastAPIService.php`
  - Method `predict()`: Memanggil FastAPI untuk prediksi

---

## 🎯 **Kesimpulan**

Kedua tab memberikan fleksibilitas berbeda:

- **Prediksi Otomatis**: Cocok untuk analisis cepat dengan periode standar
- **Prediksi Manual**: Cocok untuk analisis custom dengan parameter yang dapat disesuaikan

Kedua tab saling independen dan dapat digunakan sesuai kebutuhan analisis pengguna.




