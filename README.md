# WebUI Lab

Web Programming課程實作專案。

## 學號
114321030 

## 本機執行
```bash
npm install
npm run dev
```

## Google 登入本機設定

1. 在 Google Cloud 建立 Web OAuth Client ID，將 `http://localhost:5500` 加入 Authorized JavaScript origins。
2. 在 PowerShell 設定 Client ID 並啟動 FastAPI：

```powershell
$env:GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
python -m pip install -r requirements.txt
python -m uvicorn server:app --reload --host 127.0.0.1 --port 5500
```

會員和 session 儲存在本機 `members.sqlite3`，不會提交到 Git。正式部署時設定 `APP_ENV=production` 以啟用 Secure session cookie，並將正式網址加入 Google OAuth 的 Authorized JavaScript origins。

