# Setup untuk Windows

## 1. Buat Virtual Environment

```powershell
python -m venv venv
```

## 2. Aktifkan Virtual Environment

Di PowerShell:
```powershell
.\venv\Scripts\Activate.ps1
```

Atau jika ada error execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

Alternatif (menggunakan CMD):
```cmd
venv\Scripts\activate.bat
```

## 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

## 4. Jalankan Server

Menggunakan script:
```powershell
.\run.bat
```

Atau langsung:
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## Troubleshooting

### Error: "source is not recognized"
- Di Windows PowerShell, gunakan `.\venv\Scripts\Activate.ps1` bukan `source venv/bin/activate`
- Atau gunakan Command Prompt (CMD) dengan `venv\Scripts\activate.bat`

### Error: Execution Policy
Jika muncul error tentang execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: Module not found
Pastikan virtual environment sudah diaktifkan sebelum install:
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

