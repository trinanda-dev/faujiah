# Menggunakan image Python 3.11 slim sebagai base
FROM python:3.11-slim

# Mengatur direktori kerja di dalam container
WORKDIR /app

# Menginstall dependensi sistem yang diperlukan
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Menyalin file requirements dan menginstall dependensi Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Menyalin kode aplikasi
COPY . .

# Mengekspos port 8000
EXPOSE 8000

# Menjalankan aplikasi FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

