E. Analisis Data
Data yang digunakan adalah data deret waktu (time-series) dari ketinggian
gelombang laun dan kecepatan angin per 12 jam di wilayah laut Natuna Utara.
Rentang waktu data mencakup periode 1 Januari 2023 – 31 Desember 2024 yang
peneliti peroleh dari Badan Meterologi, Klimatologi, dan Geofisika (BMKG) Kota
Tanjungpinang.
Untuk keperluan analisis manual, peneliti menggunakan sampel data dari
tanggal 1 hingga 4 Desember 2024 sebagaimana disajikan pada Tabel 2 dan Tabel
3. Data yang digunakan untuk peramalan dibagi menjadi dua yaitu 80% data
pelatihan dan 20% data pengujian.
Tabel 21. Sampel Data Latih
Tanggal, Jam Ketinggian
Gelombang (m)
Kecepatan Angin
(m/s)
2024-12-01 00:00:00 1.8 4.5
2024-12-01 12:00:00 1.6 4.5
2024-12-02 00:00:00 1.6 4.8
2024-12-02 12:00:00 1.5 4.8
2024-12-03 00:00:00 1.5 5.1
2024-12-03 12:00:00 1.4 5.1
2024-12-04 00:00:00 1.3 4.8
2024-12-04 12:00:00 1.4 5.8
2024-12-05 00:00:00 1.2 4.0
2024-12-05 12:00:00 1.1 3.8
2024-12-06 00:00:00 1.1 3.8
2024-12-06 12:00:00 1.2 4
2024-12-07 00:00:00 1.2 4.8
2024-12-07 12:00:00 1.3 5.8
2024-12-08 00:00:00 1.6 6.9
2024-12-08 12:00:00 1.8 7.1
2024-12-09 00:00:00 2.0 6.0
2024-12-09 12:00:00 2.2 6.0
2024-12-10 00:00:00 2.2 5.8
2024-12-10 12:00:00 2.2 6.5
2024-12-11 00:00:00 2.1 5.1
2024-12-11 12:00:00 1.8 4.8
2024-12-12 00:00:00 1.5 4.8
2024-12-12 12:00:00 1.2 4.8
2024-12-13 00:00:00 1.2 5.0
2024-12-13 12:00:00 1.2 4.4
2024-12-14 00:00:00 1.4 4.3
2024-12-14 12:00:00 1.4 4.3
2024-12-15 00:00:00 1.5 5.6
66
Tanggal, Jam Ketinggian
Gelombang (m)
Kecepatan Angin
(m/s)
2024-12-15 12:00:00 1.7 6.8
2024-12-16 00:00:00 1.9 7.8
2024-12-16 12:00:00 2.0 7.5
Tabel 22. Data Uji
Tanggal, Jam
Ketinggian
Gelombang (m)
Kecepatan Angin
(m/s)
2024-12-17 00:00:00 2.2 6.4
2024-12-17 12:00:00 2.3 6.7
2024-12-18 00:00:00 2.2 6.2
2024-12-18 12:00:00 2.3 6.5
2024-12-19 00:00:00 2.7 9.8
2024-12-19 12:00:00 3.0 9.3
2024-12-20 00:00:00 3.1 12.4
2024-12-20 12:00:00 2.8 11.6
Langkah selanjutnya adalah melakukan perhitungan secara manual dengan
menggunakan data yang tersedia, sesuai dengan prosedur yang telah dijabarkan
dalam literatur sebagai berikut:
1. Uji Stationer Berdasarkan Metode Grafik Dan Uji Correlogram (ACF
dan PACF).
1) Uji Stationer menggunakan metode grafik
Gambar 45. Uji Metode Grafik
Berdasarkan grafik time series ketinggian gelombang pada periode 1 hingga
16 Desember 2024 dengan interval waktu 12 jam, terlihat bahwa tinggi gelombang
mengalami fluktuasi yang cukup signifikan dari waktu ke waktu. Pada awal
0.8
1.0
1.2
1.4
1.6
1.8
1 2 3 4 5 6 7 8
2024m1
GELOMBANG
67
periode, ketinggian gelombang berada di sekitar 1,8 meter dan mengalami
penurunan bertahap hingga mencapai titik terendah sekitar 1,1 meter pada tanggal
5 hingga 6 Desember. Setelah itu, terjadi peningkatan yang cukup tajam hingga
mencapai puncaknya sekitar 2,2 meter pada tanggal 9 hingga 10 Desember,
sebelum kembali menurun dengan cepat menuju kisaran 1,2 meter pada tanggal 12
hingga 13 Desember. Menjelang akhir periode, gelombang kembali menunjukkan
tren kenaikan hingga mencapai sekitar 2,0 meter pada tanggal 16 Desember. Pola
naik-turun yang berulang ini menggambarkan adanya dinamika laut yang aktif dan
tidak stabil, menunjukkan bahwa data ketinggian gelombang bersifat tidak stasioner
karena terdapat variasi tren dan amplitudo yang berubah sepanjang periode
pengamatan.
2) Uji Stasioner berdasarkan Uji Correlogram (ACF dan PACF)
Setelah sebelumnya dilakukan pengamatan melalui grafik deret waktu (time
series), tahap selanjutnya adalah memeriksa data dengan menerapkan uji
Correlogram. Pengujian Correlogram dilakukan dengan menghitung nilai
autokorelasi (ACF) dan autokorelasi parsial (PACF) pada data tersebut. Dalam
penghitungan ini diawali dengan menghitung nilai rata-rata pada data jumlah
ketinggian gelombang laut Natuna Utara melalui suatu persamaan 3.
𝑍̅=
1
𝑛
∑ 𝑧𝑡
𝑛
𝑡=1
𝑍̅=
1
32
(1.8 + 1.6 + 1.6 + ⋯ + 2.0)
𝑍̅= 1.565625 𝑚
Langkah selanjutnya menghitung ACF Lag 1 (k=1) menggunakan persamaan 2.
𝜌𝑘 =
∑ (𝑍𝑡 − 𝑍̅)(𝑍𝑡+𝑘 − 𝑍̅)
𝑛−𝑘
𝑡=1
∑ (𝑍𝑡 − 𝑍̅)
𝑛 2
𝑡=1
𝜌1
=
(1.8 − 1.565625)(1.6 − 1.565625) + ⋯ + (1.9 − 1.565625)(2.0 − 1.565625)
(1.8 − 1.565625)
2 + (1.6 − 1.565625)
2 + ⋯ + (2.0 − 1.565625)
2
𝜌1 =
3.160380859375001
3.6721875 = 0.8606262233001448
𝜌2 =
2.2788867187500013
3.6721875 = 0.62058016339035
68
Selanjutnya menghitung manual nilai PACF (Partial Autocorrelation
Function) berdasarkan persamaan 6.
PACF Lag 1 : ∅11 = 𝜌1 = 0.8606262233001448
PACF Lag 2 :
𝜙22 =
𝜌2 − ∙ 𝜌1
2
1 − 𝜌1
2
∅22 =
0.62058016339035 − (0.8606262233001448)
2
1 − (0.8606262233001448)
2
∅22 =
0.62058016339035 − 0.7406773741904976
1 − 0.7406773741904976
=
−0.1200972108001476
0.2593226258095024 = −0.4631195946993648
Berikut hasil perhitungan manual autokorelasi (ACF) dan autokorelasi parsial
(PACF)
Lag k ACF PACF
1 0.8606262233001448 0.8606262233001448
2 0.62058016339035 -0.4631195946993648
3 0.31432697217258126 -0.33644134989792424
4 0.002712535103395456 -0.1664323186665721
5 -0.2861804314526423 -0.20773613823677592
6 -0.5115043400561655 -0.1390392579812475
7 -0.6005845247213004 0.19104873574375533
Adapun plot time series dari ACF dan PACF sebegai berikut:
69
Gambar 46. Plot time series ACF dan PACF
Berikut hasil uji Augmented Dickey Fuller
Gambar 47. Augmented Dickey Fuller
Berdasarkan kombinasi analisis visual dan statistik (ACF, PACF, dan ADF),
data sudah stasioner dan tidak perlu dilakukan differencing. Meskipun grafik
menunjukkan ketidakstationeran tetapi uji Augmented Dickey-Fuller (ADF)
menunjukkan bahwa nilai probabilitas (p-value) < 0.05, maka ini adalah bukti kuat
secara statistik bahwa data sudah stasioner.
2. Menentukan Order ARIMAX (p,d,q)
Berdasarkan hasil analisis uji stasioneritas dan korelogram, dapat
disimpulkan bahwa data ketinggian gelombang per 12 jam telah memenuhi asumsi
stasioneritas. Hal ini ditunjukkan oleh hasil uji Augmented Dickey-Fuller (ADF)
dengan nilai statistik sebesar −3.386439 dan probabilitas 0.0199, yang lebih kecil
dari taraf signifikansi 5% serta lebih rendah dari nilai kritis pada tingkat 5%
(−2.967767). Dengan demikian, hipotesis nol (adanya akar unit) ditolak dan data
dinyatakan stasioner pada tingkat level, sehingga orde differencing ditetapkan d =
0. Selanjutnya, hasil analisis Autocorrelation Function (ACF) dan Partial
70
Autocorrelation Function (PACF) memperlihatkan bahwa nilai ACF tertinggi
terdapat pada lag ke-1 sebesar 0.861 dan nilai PACF juga signifikan pada lag ke-1
sebesar 0.861, kemudian menurun drastis pada lag berikutnya. Pola tersebut
mengindikasikan bahwa model yang paling sesuai adalah model autoregressive
orde satu atau AR(1), sedangkan komponen moving average tidak signifikan
sehingga ditetapkan q = 0. Dengan mempertimbangkan variabel eksogen berupa
kecepatan angin, model yang direkomendasikan adalah ARIMAX(1,0,0).
3. Identifikasi Model ARIMAX (1,0,0)
Model ARIMAX (1,0,0) memiliki bentuk:
𝑍𝑡 = 𝑎 + 𝜙1𝑍𝑡−1 + 𝜑𝑋𝑡 + 𝑒𝑡
Keterangan :
𝑍𝑡
 = Nilai variabel endogen pada waktu ke-t (ketinggian gelombang)
𝑍𝑡−1 = Nilai lag (t−1) dari ketinggian gelombang
𝑋𝑡
 = variabel eksogen (kecepatan angin)
𝜙1 = Koefisien autoregresif orde ke-1
𝑒𝑡
 = error atau residual
𝑎 = Intersep atau konstanta model
𝜑 = Koefisien regresi untuk variabel eksogen
4. Estimasi Parameter 𝝓𝟏dan 𝝋
Selanjutnya melakukan estimasi parameter 𝜙1dan 𝜑 menggunakan
pendekatan regresi linear berganda:
𝑍𝑡 = 𝑎 + 𝜙1𝑍𝑡−1 + 𝜑𝑋𝑡 + 𝑒𝑡
Dimana:
𝑍𝑡−1 = gelombang sebelumnya
𝑋𝑡
 = kecepatan angin
𝑎 = intercapt
Tabel 23. Perhitungan Estimasi Parameter
71
t 𝒁𝒕 𝒁𝒕−𝟏 𝑿𝒕
2 1.6 1.8 4.5
3 1.6 1.6 4.5
4 1.5 1.6 4.8
5 1.5 1.5 4.8
6 1.4 1.5 5.1
7 1.3 1.4 5.1
8 1.4 1.3 4.8
9 1.2 1.4 5.8
10 1.1 1.2 4
11 1.1 1.1 3.8
12 1.2 1.1 3.8
13 1.2 1.2 4
14 1.3 1.2 4.8
15 1.6 1.3 5.8
16 1.8 1.6 6.9
17 2.0 1.8 7.1
18 2.2 2.0 6
19 2.2 2.2 6
20 2.2 2.2 5.8
21 2.1 2.2 6.5
22 1.8 2.1 5.1
23 1.5 1.8 4.8
24 1.2 1.5 4.8
25 1.2 1.2 4.8
26 1.2 1.2 5
27 1.4 1.2 4.4
28 1.4 1.4 4.3
29 1.5 1.4 4.3
30 1.7 1.5 5.6
31 1.9 1.7 6.8
32 2.0 1.9 7.8
Selanjutnya menghitung rata-rata 𝑍̅dan 𝑋̅
𝑍̅
𝑡 =
1.6 + 1.6 + ⋯ + 2.0
31 = 1.5580645161
𝑍̅
𝑡−1 =
1.8 + 1.6 + ⋯ + 1.9
31 = 1.5516129032
𝑋̅
𝑡 =
4.5 + 4.5 + ⋯ + 7.8
31 = 5.3096774194
Langkah berikutnya adalah menghitung koefisien regresi sebagai berikut:
72
Tabel 24. Perhitungan koefisien regresi
t 𝒁𝒕 − 𝒁̅𝒕 𝒁𝒕−𝟏 − 𝒁̅𝒕−𝟏 (𝒁𝒕−𝟏 − 𝒁̅𝒕−𝟏)(𝒁𝒕 − 𝒁̅𝒕) 𝑿𝒕 − 𝑿̅𝒕 (𝑿𝒕 − 𝑿̅𝒕)(𝒁𝒕 − 𝒁̅𝒕)
2 0.0419 0.2484 0.0104 -0.8097 -0.0339
3 0.0419 0.0484 0.0020 -0.5097 -0.0214
4 -0.0581 0.0484 -0.0028 -0.5097 0.0296
5 -0.0581 -0.0516 0.0030 -0.2097 0.0122
6 -0.1581 -0.0516 0.0082 -0.2097 0.0332
7 -0.2581 -0.1516 0.0391 -0.5097 0.1315
8 -0.1581 -0.2516 0.0398 0.4903 -0.0775
9 -0.3581 -0.1516 0.0543 -1.3097 0.4691
10 -0.4581 -0.3516 0.1610 -1.5097 0.6912
11 -0.4581 -0.4516 0.2069 -1.5097 0.6912
12 -0.3581 -0.4516 0.1619 -1.3097 0.4691
13 -0.3581 -0.3516 0.1260 -0.5097 0.1826
14 -0.2581 -0.3516 0.0908 0.4903 -0.1265
15 0.0419 -0.2516 -0.0105 1.5903 0.0666
16 0.2419 0.0484 0.0117 1.7903 0.4334
17 0.4419 0.2484 0.1098 0.6903 0.3055
18 0.6419 0.4484 0.2878 0.6903 0.4431
19 0.6419 0.6484 0.4166 0.4903 0.3150
20 0.6419 0.6484 0.4166 1.1903 0.7638
21 0.5419 0.6484 0.3514 -0.2097 -0.1137
22 0.2419 0.5484 0.1328 -0.5097 -0.1233
23 -0.0581 0.2484 -0.0144 -0.5097 0.0296
24 -0.3581 -0.0516 0.0185 -0.5097 0.1826
25 -0.3581 -0.3516 0.1260 -0.3097 0.1109
26 -0.3581 -0.3516 0.1260 -0.9097 0.3260
27 -0.1581 -0.3516 0.0556 -1.0097 0.1598
28 -0.1581 -0.1516 0.0240 -1.0097 0.1598
29 -0.0581 -0.1516 0.0088 0.2903 -0.0169
30 0.1419 -0.0516 -0.0073 1.4903 0.2116
31 0.3419 0.1484 0.0508 2.4903 0.8524
32 0.4419 0.3484 0.1540 2.1903 0.9689
Total 0.000 0.000 3.1571 0.000 7.5226
𝜙1 =
∑(𝑍𝑡−1 − 𝑍̅
𝑡−1
)(𝑍𝑡 − 𝑍̅
𝑡
)
∑(𝑍𝑡−1 − 𝑍̅
𝑡−1
)
2
=
3.1571
3.4774
= 0.9079
𝜑 =
∑(𝑋𝑡−1 − 𝑋̅
𝑡−1
)(𝑍𝑡 − 𝑍̅
𝑡
)
∑(𝑋𝑡−1 − 𝑋̅
𝑡−1
)
2
73
=
7.5226
35.6871
= 0.2108
Selanjutnya menghitung intercept sebagai berikut.
𝑎 = 𝑍̅
𝑡 − 𝜙1 ∙ 𝑍̅
𝑡−1 − 𝜑 ∙ 𝑋̅
𝑡
= 1.5581 − (0.9079 ∙ 1.5516) − (0.2108 ∙ 5.3097)
= −0.9699
Maka hasil akhir model regresi ARIMAX adalah sebagai berikut:
𝑍𝑡 = 𝑎 + 𝜙1𝑍𝑡−1 + 𝜑𝑋𝑡 + 𝑒𝑡
𝑍̅
𝑡 = −0.9699 + 0.9079𝑍𝑡−1 + 0.2108𝑋𝑡
5. Prediksi
Rumus ARIMAX(1,0,0) :
𝑍̅
𝑡 = −0.9699 + 0.9079𝑍𝑡−1 + 0.2108𝑋𝑡
Keterangan :
𝑍̅
𝑡
 = nilai prediksi tinggi gelombang
𝑍𝑡−1= tinggi gelombang pada periode sebelumnya
𝑋𝑡
 = kecepatan angin saat ini
𝑎 = −0.9699, 𝜙1 = 0.9079, dan 𝜙 = 0.2108
Tabel 25. Perhitungan prediksi
t 𝒁𝒕−𝟏 𝑿𝒕 𝒁𝒕
(Aktual)
2 1.8 4.5 1.6
3 1.6 4.5 1.6
4 1.6 4.8 1.5
5 1.5 4.8 1.5
6 1.5 5.1 1.4
7 1.4 5.1 1.3
8 1.3 4.8 1.4
9 1.4 5.8 1.2
10 1.2 4 1.1
11 1.1 3.8 1.1
12 1.1 3.8 1.2
13 1.2 4 1.2
14 1.2 4.8 1.3
15 1.3 5.8 1.6
16 1.6 6.9 1.8
17 1.8 7.1 2.0
18 2.0 6 2.2
74
t 𝒁𝒕−𝟏 𝑿𝒕 𝒁𝒕
(Aktual)
19 2.2 6 2.2
20 2.2 5.8 2.2
21 2.2 6.5 2.1
22 2.1 5.1 1.8
23 1.8 4.8 1.5
24 1.5 4.8 1.2
25 1.2 4.8 1.2
26 1.2 5 1.2
27 1.2 4.4 1.4
28 1.4 4.3 1.4
29 1.4 4.3 1.5
30 1.5 5.6 1.7
31 1.7 6.8 1.9
32 1.9 7.8 2.0
𝑍̅
𝑡 = −0.9699 + 0.9079𝑍𝑡−1 + 0.2108𝑋𝑡
Residual : 𝑅𝑒 = 𝐷𝑜𝑏 − 𝐷𝐿−𝑒𝑠𝑡
Residual = 𝑍𝑡 − 𝑍̅
𝑡
Selanjutnya menghitung prediksi dan residual menggunakan persamaan 13.
• t=2
𝑍̅
𝑡 = −0.9699 + 0.9079𝑍𝑡−1 + 0.2108𝑋𝑡
𝑍̅
2 = −0.9699 + 0.9079 ∙ 1.8 + 0.2108 ∙ 4.5
= −0.9699 + 1.63422 + 0.9486
= 1.6129
Residual = 1.6 − 1.61292 = −0.0129
• t=3
𝑍̅
𝑡 = 0.9699 + 0.9079𝑍𝑡−1 + 0.2108𝑋𝑡
𝑍̅
2 = −0.9699 + 0.9079 ∙ 1.6 + 0.2108 ∙ 4.8
= −0.9699 + 1.45264 + 1.01184
= 1.4946
Residual = 1.6−1.49458=0.1054
Tabel 26. Prdiksi dan Residual
t 𝒁𝒕
(Aktual) 𝒁̅𝒕
(Prediksi) Residual (𝒆 = 𝒁𝒕 − 𝒁̅𝒕
)
2 1.6 1.6129 -0.0129
3 1.6 1.4946 0.1054
4 1.5 1.4946 0.0054
5 1.5 1.4670 0.0330
75
t 𝒁𝒕
(Aktual) 𝒁̅𝒕
(Prediksi) Residual (𝒆 = 𝒁𝒕 − 𝒁̅𝒕
)
6 1.4 1.4670 -0.0670
7 1.3 1.3130 -0.0130
8 1.4 1.4330 -0.0330
9 1.2 1.1444 0.0556
10 1.1 0.9206 0.1794
11 1.1 0.8298 0.2702
12 1.2 0.8720 0.3280
13 1.2 1.1314 0.0686
14 1.3 1.3422 -0.0422
15 1.6 1.6649 -0.0649
16 1.8 1.9794 -0.1794
17 2.0 1.9291 0.0709
18 2.2 2.1107 0.0893
19 2.2 2.2501 -0.0501
20 2.2 2.3977 -0.1977
21 2.1 2.1026 -0.0026
22 1.8 1.9485 -0.1485
23 1.5 1.6762 -0.1762
24 1.2 1.4038 -0.2038
25 1.2 1.1736 0.0264
26 1.2 1.0471 0.1529
27 1.4 1.0260 0.3740
28 1.4 1.2076 0.1924
29 1.5 1.4816 0.0184
30 1.7 1.8254 -0.1254
31 1.9 2.2178 -0.3178
32 2.0 2.3361 -0.3361
6. Pembentukan Model LSTM
1) Normalisasi Residual
Selanjutnya melakukan normalisasi menggunakan persamaan 1.
𝑥𝑡
′ = (
𝑥𝑡 − min(𝑥)
max(𝑥) − min(𝑥)
)
𝑥𝑚𝑖𝑛 = −0.33611
𝑥𝑚𝑎𝑥 = 0.37398
Untuk t =2, et
′ = -0.01292
e2
′ =
−0.01292 − (−0.33611)
0.71009 =
0.32319
0.71009 = 0.455147
76
Tabel 27. Normalisasi residual
t Residual Normalisasi (et
′
)
2 -0.0129 0.455147
3 0.1054 0.621743
4 0.0054 0.480918
5 0.0330 0.519786
6 -0.0670 0.378961
7 -0.0130 0.455006
8 -0.0330 0.426841
9 0.0556 0.551612
10 0.1794 0.725954
11 0.2702 0.853823
12 0.3280 0.935220
13 0.0686 0.569920
14 -0.0422 0.413885
15 -0.0649 0.381918
16 -0.1794 0.220673
17 0.0709 0.573159
18 0.0893 0.599071
19 -0.0501 0.402760
20 -0.1977 0.194902
21 -0.0026 0.469652
22 -0.1485 0.264188
23 -0.1762 0.225180
24 -0.2038 0.186312
25 0.0264 0.510491
26 0.1529 0.688635
27 0.3740 1.000000
28 0.1924 0.744261
29 0.0184 0.499225
30 -0.1254 0.296719
31 -0.3178 0.025771
32 -0.3361 0.000000
2) Single-Stap LSTM (Permodelan LSTM)
Berikut arsitektur LSTM satu unit dengan bobot yang digunakan dalam
perhitungan :
𝑊𝑓 = 0.4, 𝑊𝑖 = 0.5, 𝑊𝑜 = 0.3, 𝑊𝑐 = 0.6
𝑏𝑓 = 𝑏𝑖 = 𝑏𝑜 = 𝑏𝑐 = 0.1
Selanjutnya perhitungan waktu t = 2, redisual e2
′ = 0.455147 menggunakan
persamaan 11:
77
1. Forget gate
𝑓2 = 𝜎(𝑊𝑓 ∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑓)
= 𝜎(0.4 ⋅ 0.4551 + 0.1) = 𝜎(0.2820) = 0.5700
2. Input gate
𝑖2 = 𝜎(𝑊𝑖
∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑖
)
= 𝜎(0.5 ⋅ 0.4551 + 0.1) = 𝜎(0.3276) = 0.5811
3. Cell candidate
𝐶̅
2 = 𝑡𝑎𝑛ℎ(𝑊𝑐
∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑐
)
= 𝑡𝑎𝑛ℎ(0.6 ⋅ 0.4551 + 0.1) = 𝑡𝑎𝑛ℎ(0.3731) = 0.3565
4. Cell state
𝐶2 = 𝑓2 ∙ 𝐶1 + 𝑖2 ∙ 𝐶̅
2
= 0 + 0.5811 ⋅ 0.3565 = 0.2072
5. Output gate:
𝑜2 = 𝜎(𝑊𝑜 ∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑜
)
= σ(0.3 ⋅ 0.4551 + 0.1) = σ(0.2365) = 0.5589
6. Hidden state (ℎ3) (prediksi residual):
ℎ2 = 𝑜2 ∙ tanh(𝐶2
)
= 0.5607 ⋅ 𝑡𝑎𝑛ℎ(0.4372) = 0.5607 ⋅ 0.4106 = 0.2303
Selanjutnya perhitungan waktu t = 32, residual e32
′ = 0.000000,
1. Forget gate
𝑓32 = 𝜎(𝑊𝑓 ∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑓)
= 𝜎(0.4 ⋅ 0.000000 + 0.1) = 𝜎(0.100000) = 0.524979
2. Input gate
𝑖32 = 𝜎(𝑊𝑖
∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑖
)
= 𝜎(0.5 ⋅ 0.000000 + 0.1) = 𝜎(0.100000) = 0.524979
3. Cell candidate :
𝐶̅
32 = 𝑡𝑎𝑛ℎ(𝑊𝑐
∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑐
)
= 𝑡𝑎𝑛ℎ(0.6 ⋅ 0.000000 + 0.1) = 𝑡𝑎𝑛ℎ(0.100000) = 0.099668
4. Cell state :
𝐶32 = 𝑓32 ∙ 𝐶31 + 𝑖32 ∙ 𝐶̅
32
= 0.524979 ⋅ 0.329642 + 0.524979 ⋅ 0.099668
= 0.225379
78
5. Output gate :
𝑜32 = 𝜎(𝑊𝑜 ∙ [ℎ𝑡−1, 𝑥𝑡
] + 𝑏𝑜
)
= 𝜎(0.3 ⋅ 0.000000 + 0.1) = 𝜎(0.100000) = 0.524979
6. Hidden state (ℎ32) (prediksi residual):
ℎ32 = 𝑜32 ∙ tanh(𝐶32) = 0.524979 ⋅ 𝑡𝑎𝑛ℎ(0.225379) = 0.524979 ⋅
0.2218
= 0.116356
Tabel 28. Hasil perhitungan nilai gate dan state
t 𝒆𝒕
′ 𝒇𝒕
𝒊𝒕 𝑪̅𝒕 𝑪𝒕 𝒐𝒕 𝒉𝒕
2 0.455147 0.570051 0.581169 0.356690 0.207297 0.558862 0.114219
3 0.621743 0.586302 0.601297 0.440657 0.386504 0.571145 0.210377
4 0.480918 0.572576 0.584302 0.370110 0.437559 0.560767 0.230822
5 0.519786 0.576376 0.589015 0.390061 0.481950 0.563637 0.252399
6 0.378961 0.562566 0.571869 0.316162 0.451932 0.55322 0.234281
7 0.455006 0.570037 0.581152 0.356616 0.464866 0.558851 0.242565
8 0.426841 0.567274 0.577720 0.341778 0.461158 0.556767 0.239982
9 0.551612 0.579481 0.592861 0.406129 0.508011 0.565984 0.265103
10 0.725954 0.596375 0.613720 0.489629 0.603460 0.578785 0.312258
11 0.853823 0.608623 0.628762 0.545740 0.710421 0.588107 0.359299
12 0.935220 0.616351 0.638212 0.579116 0.807467 0.594010 0.396912
13 0.569920 0.581265 0.595069 0.415261 0.716461 0.567332 0.348746
14 0.413885 0.566001 0.576139 0.334895 0.598464 0.555808 0.297888
15 0.381918 0.562857 0.572231 0.317758 0.518680 0.553439 0.263814
16 0.220673 0.546929 0.552391 0.228308 0.409797 0.541455 0.210247
17 0.573159 0.581580 0.595459 0.416868 0.486557 0.567571 0.256247
18 0.599071 0.584100 0.598576 0.429630 0.541364 0.569478 0.281334
19 0.402760 0.564908 0.574780 0.328955 0.494898 0.554984 0.254235
20 0.194902 0.544373 0.549203 0.213601 0.386719 0.539535 0.198834
21 0.469652 0.571472 0.582933 0.364262 0.433340 0.559934 0.228514
22 0.264188 0.551238 0.557764 0.252904 0.379934 0.544694 0.197534
23 0.225180 0.547375 0.552948 0.230870 0.335626 0.541791 0.175305
24 0.186312 0.543521 0.548139 0.208677 0.296803 0.538895 0.155409
25 0.510491 0.575468 0.587889 0.385322 0.397327 0.562951 0.212604
26 0.688635 0.592776 0.609287 0.472420 0.523366 0.576053 0.276674
27 1.000000 0.622459 0.645656 0.604368 0.715988 0.598688 0.367844
28 0.744261 0.598136 0.615888 0.497935 0.734930 0.580123 0.363199
29 0.499225 0.574367 0.586524 0.379551 0.644735 0.562119 0.319348
30 0.296719 0.554455 0.561773 0.271082 0.509763 0.547114 0.257012
31 0.025771 0.527549 0.528191 0.114952 0.329642 0.526907 0.167661
32 0.000000 0.524979 0.524979 0.099668 0.225379 0.524979 0.116356
Hasil Denormalisasi dari output LSTM menggunakan persamaan 12:
𝑥𝑚𝑖𝑛 = −0.33611
𝑥𝑚𝑎𝑥 = 0.37398
𝑥𝑚𝑎𝑥 − 𝑥𝑚𝑖𝑛 = 0.71009
𝑥𝑡 = 𝑌(𝑥𝑚𝑎𝑥 − 𝑥𝑚𝑖𝑛) + 𝑥𝑚𝑖𝑛
79
𝑥2 = 0.114219 ∙ 0.71009 − 0.33611 = 0.081106 − 0.33611 = −0.255004
……
𝑥32 = 0.116356 ∙ 0.71009 − 0.33611
= 0.08262323204 − 0.33611 = −0.253487
Tabel 29. Normalisasi dan Denormalisasi
t Normalisasi Denormalisasi
2 0.114219 -0.255004
3 0.210377 -0.186723
4 0.230822 -0.172206
5 0.252399 -0.156884
6 0.234281 -0.169749
7 0.242565 -0.163867
8 0.239982 -0.165701
9 0.265103 -0.147863
10 0.312258 -0.114379
11 0.359299 -0.080975
12 0.396912 -0.054267
13 0.348746 -0.088469
14 0.297888 -0.124583
15 0.263814 -0.148778
16 0.210247 -0.186816
17 0.256247 -0.154152
18 0.281334 -0.136338
19 0.254235 -0.155580
20 0.198834 -0.194920
21 0.228514 -0.173844
22 0.197534 -0.195843
23 0.175305 -0.211628
24 0.155409 -0.225756
25 0.212604 -0.185142
26 0.276674 -0.139647
27 0.367844 -0.074908
28 0.363199 -0.078206
29 0.319348 -0.109344
30 0.257012 -0.153608
31 0.167661 -0.217056
32 0.116356 -0.253487
3). Prediksi Hybrid ARIMA-LSTM
1. Prediksi ARIMAX
𝑍̅
𝑡 = −0.9699 + 0.9079𝑍𝑡−1 + 0.2108𝑋𝑡
• Prediksi t=33 (2024-12-17 00:00:00)
80
Data yang digunakan:
𝑍32 = 2.0
𝑋33 = 6.4
𝑍33 = 2.0 (aktual)
𝑍̅
33 = −0.9699 + 0.9079 ⋅ 2.0 + 0.2108 ⋅ 6.4
= −0.9699 + 1.8158 + 1.34912 = 2.19502
......
• Prediksi t=40 (2024-12-20 12:00:00)
Data yang digunakan:
𝑍39 = 3.100
𝑋40 = 11.600
𝑍40 = 2.800 (aktual)
𝑍̅
10 = −0.9699 + 0.9079(3.1) + 0.2108(11.6) = 4.2899
Selanjutnya menghitung residual ARIMAX pada data testing.
Tabel 30. Perhitungan Residual ARIMAX
t Aktual Prediksi ARIMAX Residual
33 2.2000 2.195020 0.004980
34 2.3000 2.439840 -0.139840
35 2.2000 2.425230 -0.225230
36 2.3000 2.397680 -0.097680
37 2.7000 3.184110 -0.484110
38 3.0000 3.441870 -0.441870
39 3.1000 4.367720 -1.267720
40 2.8000 4.289870 -1.489870
Selanjutnya melakukan normalisasi Residual menggunakan persamaan 1.
• t=33 :
𝑥33 =
0.00498 − (−0.33611)
0.71009 =
0.34109
0.71009 = 0.480348
……
• t=40
𝑥40 =
−1.4899 − (−0.33611)
0.71009 =
−1.15379
0.71009 = −1.6248
81
2. LSTM Single-step
Diketahui:
𝑊𝑖 = 0.5, 𝑊𝑓 = 0.4, 𝑊𝑜 = 0.3, 𝑊𝑐 = 0.6, 𝑏𝑓 = 𝑏𝑖 = 𝑏𝑐 = 𝑏𝑜 = 0.1
Selanjutnya menghitung gate, candidate cell state, cell state, hidden state
menggunakan persamaan 11.
• t=33
ℎ32 = 0.116356
𝐶32 = 0.225379
1. Forget gate
𝑓33 = 𝜎(0.4 ⋅ 0.480348 + 0.1) = 𝜎(0.292139) = 0.572520
2. Input gate
𝑖33 = 𝜎(0.5 ⋅ 0.480348 + 0.1) = 𝜎(0.340174) = 0.584233
3. Cell candidate :
𝐶̅
33 = 𝑡𝑎𝑛ℎ(0.6 ⋅ 0.480348 + 0.1) = 𝑡𝑎𝑛ℎ(0.388209) = 0.369815
4. Cell state :
𝐶33 = 𝑓33 ∙ 𝐶32 + 𝑖33 ∙ 𝐶̅
33
= 0.572520 ⋅ 0.225379 + 0.584233 ⋅ 0.369815 = 0.345092
5. Output gate :
𝑜33 = 𝜎(0.3 ⋅ 0.480348 + 0.1) = 𝜎(0.244104) = 0.560725
6. Hidden state (ℎ33) (prediksi residual):
ℎ33 = 𝑜33 ∙ tanh(𝐶33)
= 0.560725 ⋅ tanh(0.345092)
= 0.560725 ⋅ 0.178854 = 0.186169
……
• t=40
ℎ39 = −0.077964
𝐶39 = −0.184601
1. Forget gate
𝑓40 = 𝜎(0.4 ⋅ (−1.6248) + 0.1) = 𝜎(−0.5499) = 0.3659
2. Input gate
𝑖40 = 𝜎(0.5 ⋅ (−1.6248) + 0.1) = 𝜎(−0.7124) = 0.3291
3). Cell candidate :
82
𝐶̅
40 = 𝑡𝑎𝑛ℎ(0.6 ⋅ (−1.6248) + 0.1) = 𝑡𝑎𝑛ℎ(−0.8749) = −0.7038
4. Cell state :
𝐶40 = 𝑓40 ∙ 𝐶39 + 𝑖40 ∙ 𝐶̅
40
= 0.3659(−0.1846) + 0.3291(−0.7038) = −0.0677 − 0.2315
= −0.2992
5. Output gate :
𝑜40 = 𝜎(0.3 ⋅ (−1.6248) + 0.1) = 𝜎(−0.3874) = 0.4043
6. Hidden state (ℎ40) (prediksi residual):
ℎ40 = 𝑜40 ∙ tanh(𝐶40)
= 0.4043 ⋅ 𝑡𝑎𝑛ℎ(−0.2992)
= 0.4043 ⋅ (−0.2903) = −0.1175
Tabel 31. Hasil Perhitungan LSTM Single-step
t 𝒇𝒕
𝒊𝒕 𝑪̅𝒕 𝑪𝒕 𝒐𝒕 𝒉𝒕
33 0.572520 0.584233 0.369815 0.345092 0.560725 0.186169
34 0.552447 0.559270 0.259751 0.335916 0.545603 0.176681
35 0.540526 0.544401 0.191303 0.285717 0.536645 0.149288
36 0.558311 0.566574 0.292652 0.325328 0.550015 0.172879
37 0.504157 0.498947 -0.025049 0.151518 0.509367 0.076593
38 0.510105 0.506382 0.010636 0.082676 0.513826 0.042385
39 0.395373 0.364478 -0.596165 -0.184601 0.427126 -0.077964
40 0.365882 0.329068 -0.703848 -0.299156 0.404333 -0.117475
Selanjutnya melakukan denormalisasi output dari LSTM menggunakan persamaan
12.
• t=33
𝑥33 = ℎ33 ∙ (𝑥𝑚𝑎𝑥 − 𝑥𝑚𝑖𝑛) + 𝑥𝑚𝑎𝑥
= 0.186169 ⋅ 0.71009 + (−0.33611)
= −0.203913
……
• t=40
𝑥40 = ℎ40 ∙ (𝑥𝑚𝑎𝑥 − 𝑥𝑚𝑖𝑛) + 𝑥𝑚𝑎𝑥
= (−0.1175)(0.71009) + (−0.33611)
= −0.419528
83
Tabel 32. Denormalisasi output LSTM
t Denormalisasi
33 -0.203913
34 -0.210651
35 -0.230102
36 -0.213350
37 -0.281722
38 -0.306013
39 -0.391472
40 -0.419528
1. Prediksi Hybrid ARIMAX-LSTM
Selanjutnya melakukan prediksi Hybrid ARIMAX-LSTM menggunakan
persamaan 14.
𝑦
′
𝑡 = 𝐿
′
𝑡 + 𝑁′
𝑡
• t=33
𝐻𝑦𝑏𝑟𝑖𝑑 = 𝐴𝑅𝐼𝑀𝐴𝑋 + 𝐿𝑆𝑇𝑀(𝑟𝑒𝑠𝑖𝑑𝑢𝑎𝑙 𝐿𝑆𝑇𝑀 𝑑𝑒𝑛𝑜𝑟𝑚𝑎𝑙𝑖𝑠𝑎𝑠𝑖)
= 2.19502 + (−0.203913) = 1.991107
……
• t=40
𝐻𝑦𝑏𝑟𝑖𝑑 = 𝐴𝑅𝐼𝑀𝐴𝑋 + 𝐿𝑆𝑇𝑀(𝑟𝑒𝑠𝑖𝑑𝑢𝑎𝑙 𝐿𝑆𝑇𝑀 𝑑𝑒𝑛𝑜𝑟𝑚𝑎𝑙𝑖𝑠𝑎𝑠𝑖)
= 4.2899 + (−0.419528) = 3.870342
84
Tabel 33. Hasil perhitungan Hybrid ARIMACX-LSTM
t Hybrid ARIMAX-LSTM
33 1.991107
34 2.229189
35 2.195128
36 2.184330
37 2.902388
38 3.135857
39 3.976248
40 3.870342
\
4). Evaluasi MAPE (Mean Absolute Percentage Error)
Langkah selanjutnya adalah menghitung MAPE dengan menggunakan
persamaan 15.
𝑀𝐴𝑃𝐸 =
1
𝑛
∑ |
𝐴𝑖−𝐹𝑖
𝐴𝑖
|
𝑛
𝑖=1 × 100%
t=33:
|
2.2000 − 2.195020
2.2000 | ∙ 100% = 0.22636%
t=34 :
|
2.3000 − 2.439840
2.3000 | ∙ 100% = 6.08000%
t=35 :
|
2.2000 − 2.425230
2.2000 | ∙ 100% = 10.23773%
t=36 :
|
2.3000 − 2.397680
2.3000 | ∙ 100% = 4.24739%
t=37 :
|
2.7000 − 3.184110
2.7000 | ∙ 100% = 17.93010%
t=38 :
|
3.0000 − 3.441870
3.0000 | ∙ 100% = 14.72900%
t=39 :
|
3.1000 − 4.367720
3.1000 | ∙ 100% = 40.92590%
85
t=40 :
|
2.8000 − 4.289870
2.8000 | ∙ 100% = 53.13810%
Jumlah persentase ARIMAX:
0.22636 + 6.08000 + 10.23773 + 4.24739 + 17.93010 + 14.72900 + 40.92590 +
53.13810 = 147.51458 %
Maka didapatkan MAPE ARIMAX :
𝑀𝐴𝑃𝐸𝐴𝑅𝐼𝑀𝐴𝑋 =
147.51458
8
= 18.4393225%
Hasil perhitungan Hybrid ARIMAX-LSTM (ARIMAX + LSTM residual
denormalisasi):
t=33:
|
2.2000 − 1.991107
2.2000 | ∙ 100% = 9.49514%
t=34 :
|
2.3000 − 2.229189
2.3000 | ∙ 100% = 3.07878%
t=35 :
|
2.2000 − 2.195128
2.2000 | ∙ 100% = 0.22145%
t=36 :
|
2.3000 − 2.184330
2.3000 | ∙ 100% = 5.02948%
t=37 :
|
2.7000 − 2.902388
2.7000 | ∙ 100% = 7.49556%
t=38 :
|
3.0000 − 3.135857
3.0000 | ∙ 100% = 4.52857%
t=39 :
|
3.1000 − 3.976248
3.1000 | ∙ 100% = 28.26610%
t=40 :
|
2.8000 − 3.870342
2.8000 | ∙ 100% = 38.22620%
Jumlah persentase Hybrid:
86
9.49514 + 3.07878 + 0.22145 + 5.02948 + 7.49556 + 4.52857 + 28.26610 +
38.22620= 96.34128 %
Maka didapatkan MAPE :
𝑀𝐴𝑃𝐸𝐻𝑌𝐵𝑅𝐼𝐷 =
96.34128
8
= 12.04266%
Dari hasil perhitungan manual didapatkan MAPE Hybrid ARIMAX-LSTM
sebesar 12.04266% yang berarti model baik daripada model ARIMAX tunggal
sebesar 18.4393225% dalam memprediksi ketinggian gelombang laut Natuna
Utara. 