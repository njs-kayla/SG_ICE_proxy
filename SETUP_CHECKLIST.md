# 完整部署檢查清單

## ✅ 前端設置

### 檔案結構驗證
- [x] `app/page.tsx` - 登錄頁面 ✓
- [x] `app/layout.tsx` - 全域版面配置 ✓
- [x] `app/globals.css` - 全域樣式 ✓
- [x] `app/api/auth/route.ts` - 認證 API ✓
- [x] `app/dashboard/page.tsx` - 儀表板主頁 ✓
- [x] `app/dashboard/layout.tsx` - 儀表板版面配置 ✓
- [x] `app/dashboard/entries/page.tsx` - 註冊列表頁面 ✓
- [x] `app/dashboard/resend/page.tsx` - 重新寄送頁面 ✓
- [x] `components/Sidebar.tsx` - 側邊導航欄 ✓
- [x] `components/Header.tsx` - 頁面標題欄 ✓
- [x] `lib/api-client.ts` - Axios API 用戶端 ✓
- [x] `package.json` - 依賴宣告 ✓
- [x] `tsconfig.json` - TypeScript 配置 ✓
- [x] `tailwind.config.js` - Tailwind CSS 配置 ✓
- [x] `next.config.js` - Next.js 配置 ✓
- [x] `postcss.config.js` - PostCSS 配置 ✓
- [x] `.env.example` - 環境變數範例 ✓

### 依賴安裝
```bash
npm install
```

### 環境變數設置 (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=                       # 留空時使用同網域 /api/*
ADMIN_PASSWORD=your-secure-password              # 必須設置
JWT_SECRET=your-jwt-secret-key                   # 必須設置
```

### 本機開發測試
```bash
# 終端 1 - 前端開發伺服器
npm run dev
# 訪問 http://localhost:3000

# 終端 2 - 後端測試
# 測試 API 端點
curl http://localhost:3000/api/stats
```

## ✅ 後端設置

### Vercel API 結構
- [x] `api/submit.js` - 表單提交 (已存在) ✓
- [x] `api/entries.js` - 獲取註冊列表 ✓
- [x] `api/resend.js` - 重新寄送郵件 ✓
- [x] `api/stats.js` - 獲取統計資料 ✓
- [x] `api/export.js` - 匯出 CSV ✓

### 共享函式庫
- [x] `lib/cors.js` - CORS 設置 ✓
- [x] `lib/errors.js` - 錯誤回應格式 ✓
- [x] `lib/gas-request.js` - GAS 通訊層 ✓
- [x] `lib/data-filters.js` - 數據篩選/分頁 ✓

### 根目錄配置
- [x] `package.json` - 根專案配置 ✓
- [x] `.gitignore` - Git 忽略規則 ✓

## ✅ Google Apps Script 設置

### 後端實現
- [x] `GAS_backend.gs` - 完整後端 (500+ 行) ✓
  - [x] `doPost(e)` - 主入口
  - [x] `handleGetEntries_()` - 獲取列表
  - [x] `handleResendEmail_()` - 重新寄送
  - [x] `handleGetStats_()` - 統計資料
  - [x] `handleExportCsv_()` - CSV 匯出
  - [x] `handleFormSubmit_()` - 表單提交
  - [x] `sendBrevoEmail_()` - Brevo 郵件

### 部署步驟
1. 打開 Google Apps Script 編輯器
2. 複製 `GAS_backend.gs` 全部內容
3. 粘貼到編輯器
4. 點擊 "部署" → "新部署"
5. 選擇 "Web 應用"
6. 執行身份: 您的帳戶
7. 誰有權訪問: 任何人
8. 複製部署網址

## ✅ 環境變數配置

### Vercel 儀表板設置
導航至 Project Settings → Environment Variables 添加:

```
GAS_WEBAPP_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercache
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key
BREVO_API_KEY=your-brevo-api-key
```

### 本機開發 (.env 檔案)

**根目錄 (.env)**
```
GAS_WEBAPP_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercache
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key
BREVO_API_KEY=your-brevo-api-key
```

**前端 (.env.local)**
```
NEXT_PUBLIC_API_BASE_URL=
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key
```

## 🧪 本機測試

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動前端開發伺服器
```bash
npm run dev
```

### 3. 測試登錄流程
- 訪問 `http://localhost:3000`
- 輸入 ADMIN_PASSWORD
- 應該看到儀表板

### 4. 測試 API 端點

**測試 Stats 端點:**
```bash
curl http://localhost:3000/api/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**測試 Entries 端點:**
```bash
curl "http://localhost:3000/api/entries?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**測試 Export 端點:**
```bash
curl http://localhost:3000/api/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o export.csv
```

## 🚀 生產部署

### 1. GitHub 倉庫設置
```bash
git init
git add .
git commit -m "Initial commit: Complete SBC 2026 admin system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/SG_ICE_proxy.git
git push -u origin main
```

### 2. Vercel 部署
1. 訪問 https://vercel.com
2. 點擊 "New Project"
3. 選擇您的 GitHub 倉庫
4. Framework Preset 確認為 Next.js
5. Root Directory 保持 `.`
6. 在項目設置中添加環境變數
7. 點擊 "Deploy"

### 3. 驗證部署
- 訪問您的 Vercel URL
- 測試登錄頁面
- 驗證儀表板功能
- 測試所有 API 端點

## ⚠️ 安全檢查清單

- [ ] ADMIN_PASSWORD 已設置為強密碼
- [ ] JWT_SECRET 已設置為安全令牌
- [ ] BREVO_API_KEY 已正確配置
- [ ] GAS_WEBAPP_URL 指向正確的部署
- [ ] .env 檔案已添加到 .gitignore
- [ ] 敏感資訊未提交到 Git
- [ ] CORS 設置正確
- [ ] API 端點受到認證保護

## 📝 常見問題排查

### 問題: 無法連接到 GAS
**解決方案:**
- 驗證 GAS_WEBAPP_URL 是否正確
- 確認 GAS 部署為 Web 應用
- 檢查網路連接

### 問題: 登錄頁面白屏
**解決方案:**
- 清除瀏覽器快取
- 檢查瀏覽器控制台錯誤
- 重啟開發伺服器

### 問題: API 返回 401 未授權
**解決方案:**
- 檢查 JWT 令牌是否有效
- 驗證 ADMIN_PASSWORD 正確
- 清除 localStorage 並重新登錄

### 問題: 郵件未寄送
**解決方案:**
- 驗證 BREVO_API_KEY 有效
- 檢查 GAS 執行日誌
- 查看收件人郵箱地址是否正確

## 📚 文檔索引

- [部署指南](./DEPLOYMENT_GUIDE.md) - 詳細部署步驟
- [API 實現文檔](./API_IMPLEMENTATION.md) - API 規範
- [根 README](./README.md) - 專案概述

## ✨ 完成

所有元件已準備就緒！您可以開始本機開發或部署到生產環境。

---

**最後更新**: 2024年
**狀態**: ✅ 完全完成
