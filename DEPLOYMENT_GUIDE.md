# SBC 2026 Event Registration Admin Panel

完整的事件註冊管理系統，包括前端儀表板、後端 API 和 Google Apps Script 整合。

## 🚀 快速開始

### 前置要求

- Node.js 16+ 和 npm 8+
- Google Apps Script 帳戶 (部署網址)
- Vercel 帳戶 (用於部署)
- Brevo API 密鑰 (郵件服務)

### 安裝步驟

1. **複製環境變數配置**
```bash
cp .env.example .env.local
```

2. **編輯環境變數** (`.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
```

3. **安裝依賴**
```bash
npm install
```

4. **啟動開發伺服器**
```bash
npm run dev
```

應用將在 `http://localhost:3000` 啟動

## 📁 專案結構

```
SG_ICE_proxy/
├── api/                          # Vercel Serverless 函式
│   ├── submit.js                # 表單提交 API
│   ├── entries.js               # 獲取註冊列表
│   ├── resend.js                # 重新寄送郵件
│   ├── stats.js                 # 獲取統計資料
│   └── export.js                # 匯出 CSV
├── lib/                         # 共享函式庫
│   ├── cors.js                  # CORS 設置
│   ├── errors.js                # 錯誤回應格式
│   ├── gas-request.js           # GAS 通訊層
│   ├── data-filters.js          # 數據篩選/分頁
│   └── api-client.ts            # Axios API 用戶端
├── app/
│   ├── page.tsx                 # 登錄頁面
│   ├── layout.tsx               # 全域版面配置
│   ├── globals.css              # 全域樣式
│   ├── api/auth/route.ts        # 認證 API
│   └── dashboard/
│       ├── page.tsx             # 儀表板主頁
│       ├── layout.tsx           # 儀表板版面配置
│       ├── entries/
│       │   └── page.tsx         # 註冊列表頁面
│       └── resend/
│           └── page.tsx         # 重新寄送頁面
├── components/
│   ├── Sidebar.tsx              # 側邊導航欄
│   └── Header.tsx               # 頁面標題欄
├── next.config.js               # Next.js 配置
├── postcss.config.js            # PostCSS 配置
├── tailwind.config.js           # Tailwind CSS 配置
├── tsconfig.json                # TypeScript 配置
├── next-env.d.ts                # Next.js 類型宣告
├── .env.example                 # 環境變數範例
├── GAS_backend.gs               # Google Apps Script 後端
├── package.json                 # 根專案配置
├── vercel.json                  # Vercel 配置
└── README.md                    # 本檔案
```

## 🔑 環境變數配置

### 前端 (`.env.local`)
- `NEXT_PUBLIC_API_BASE_URL` - API 基礎 URL (留空時使用同網域 `/api/*`；本機如需顯式指定可填 `http://localhost:3000`)
- `ADMIN_PASSWORD` - 管理員密碼
- `JWT_SECRET` - JWT 簽名密鑰

### 後端/Vercel
- `GAS_WEBAPP_URL` - Google Apps Script 網址
- `ADMIN_PASSWORD` - 管理員密碼 (與前端相同)
- `JWT_SECRET` - JWT 簽名密鑰 (與前端相同)
- `BREVO_API_KEY` - Brevo 郵件服務 API 密鑰

## 🔐 認證流程

1. 使用者在登錄頁面輸入密碼
2. 前端發送 POST `/api/auth` 請求
3. 伺服器驗證密碼，回傳 JWT 令牌
4. 前端儲存令牌至 localStorage
5. 後續所有 API 請求都在 Authorization 標題中附帶令牌

## 📊 API 端點

### 表單提交
```
POST /api/submit
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "ACME Corp",
  "phone": "+1234567890",
  "message": "Interested in the event"
}
```

### 獲取註冊列表
```
GET /api/entries?page=1&pageSize=20&keyword=john&status=Sent

回應:
{
  "ok": true,
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "rows": [...]
}
```

### 獲取統計資料
```
GET /api/stats

回應:
{
  "ok": true,
  "total": 100,
  "success": 95,
  "pending": 3,
  "failed": 2
}
```

### 匯出 CSV
```
GET /api/export

回應: CSV 檔案下載
```

## 🚀 部署指南

### 本機測試

1. 確保所有環境變數已設置
2. 執行開發伺服器: `npm run dev`
3. 訪問 `http://localhost:3000`

### Vercel 部署

1. **連接 GitHub 倉庫**
   - 推送程式碼到 GitHub
   - 在 Vercel 儀表板連接倉庫

2. **設置環境變數**
   在 Vercel 專案設置 → Environment Variables 添加:
   - `GAS_WEBAPP_URL`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - `BREVO_API_KEY`
  - `NEXT_PUBLIC_API_BASE_URL`（若留空，前端預設使用同網域 `/api/*`）

3. **部署**
   - Vercel 將自動構建並部署
  - Framework Preset 使用 Next.js
  - Root Directory 保持 `.`
  - 不需要自訂 Build Command
   - 訪問您的 Vercel URL

### Google Apps Script 部署

1. 在 Google Apps Script 編輯器中打開專案
2. 複製 `GAS_backend.gs` 的全部內容
3. 粘貼到編輯器並保存
4. 部署為 Web 應用:
   - 點擊 "部署" → "新部署"
   - 選擇 "Web 應用"
   - 執行身份: 您的帳戶
   - 誰有權訪問: 任何人
   - 複製部署網址設置為 `GAS_WEBAPP_URL`

## 📱 功能特性

### 儀表板
- 📊 即時統計卡 (總數、今日計數、郵件遞送率)
- 📈 日間分佈圖表
- 📋 最近註冊列表

### 註冊管理
- 🔍 關鍵字搜索 (名稱、郵件、公司、電話)
- 🏷️ 狀態篩選 (已寄送、待寄、失敗)
- 📄 分頁導航

### 郵件管理
- ♻️ 重新寄送郵件到失敗的收件人
- 📊 重試計數追蹤
- ❌ 錯誤記錄查看

### 資料導出
- 📥 匯出完整 CSV 檔案
- 📋 複製彩票代碼到剪貼板

## 🔧 故障排除

### 連接 GAS 失敗
- 檢查 `GAS_WEBAPP_URL` 是否正確
- 確認 GAS 部署為 Web 應用
- 檢查網路連接

### 郵件寄送失敗
- 驗證 `BREVO_API_KEY` 是否有效
- 檢查 GAS 中的 Brevo 整合設置
- 查看 GAS 執行日誌了解詳情

### 認證失敗
- 確認 `ADMIN_PASSWORD` 已正確設置
- 清除瀏覽器 localStorage 並重試登錄
- 檢查 `/api/auth` 端點是否可訪問

### API 響應空白
- 檢查 CORS 設置
- 驗證 GAS 已返回有效 JSON
- 檢查伺服器日誌了解詳情

## 📝 開發說明

### 添加新的 API 端點

1. 在 `api/` 文件夾中創建新檔案
2. 匯入 CORS、錯誤和 GAS 模組
3. 實現處理器函式
4. 導出為默認函式

### 自訂儀表板樣式

1. 編輯 `tailwind.config.js` 調整主題
2. 修改組件中的 Tailwind 類別
3. 添加自訂 CSS 到 `globals.css`

### 延擴展 GAS 功能

1. 在 `doPost()` 中添加新的操作
2. 實現處理函式
3. 更新前端 API 用戶端

## 🤝 貢獻

歡迎提交問題和改進建議！

## 📄 許可證

MIT License - 詳見 LICENSE 檔案

## 📞 支持

如有問題或需要幫助，請聯繫技術支持團隊。

---

**最後更新**: 2024年
