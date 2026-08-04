# 快速參考和故障排除指南

## 🚀 快速開始 (5 分鐘)

### 一行指令安裝和啟動
```bash
# 安裝依賴
npm install

# 啟動前端開發伺服器
npm run dev
```

## 📁 關鍵檔案位置速查

| 功能 | 檔案路徑 |
|------|---------|
| 登錄頁面 | `app/page.tsx` |
| 儀表板 | `app/dashboard/page.tsx` |
| 註冊列表 | `app/dashboard/entries/page.tsx` |
| 認證 API | `app/api/auth/route.ts` |
| API 用戶端 | `lib/api-client.ts` |
| Entries API | `api/entries.js` |
| Stats API | `api/stats.js` |
| Export API | `api/export.js` |
| GAS 後端 | `GAS_backend.gs` |

## 🔑 環境變數速查

### 必須設置的變數

| 變數名 | 說明 | 位置 |
|--------|------|------|
| `ADMIN_PASSWORD` | 管理員登錄密碼 | 本機 .env.local + Vercel |
| `JWT_SECRET` | JWT 簽名密鑰 | 本機 .env.local + Vercel |
| `GAS_WEBAPP_URL` | Google Apps Script 部署網址 | Vercel |
| `BREVO_API_KEY` | 郵件服務 API 密鑰 | Vercel |
| `NEXT_PUBLIC_API_BASE_URL` | API 基礎 URL（可留空使用同網域） | 本機 .env.local |

## 🔧 API 端點速查

### 認證
```bash
POST /api/auth
Content-Type: application/json
{"password": "your-password"}
```
回應: `{ok: true, token: "jwt-token"}`

### 獲取註冊
```bash
GET /api/entries?page=1&pageSize=20&keyword=john&status=Sent
Authorization: Bearer {token}
```
回應: `{ok: true, total: 100, rows: [...]}`

### 統計資料
```bash
GET /api/stats
Authorization: Bearer {token}
```
回應: `{ok: true, total: 100, success: 95, pending: 3, failed: 2}`

### 導出 CSV
```bash
GET /api/export
Authorization: Bearer {token}
```
回應: CSV 檔案下載

## 🐛 故障排除

### 1. 登錄失敗

**症狀:** "Invalid credentials" 錯誤

**檢查項目:**
- [ ] ADMIN_PASSWORD 環境變數已設置
- [ ] 密碼輸入正確
- [ ] 根目錄 .env.local 已保存
- [ ] 開發伺服器已重啟

**解決方案:**
```bash
# 清除快取並重啟
rm -rf .next
npm run dev
```

---

### 2. API 返回 502 錯誤

**症狀:** "Bad Gateway" 或無法連接到 GAS

**檢查項目:**
- [ ] GAS_WEBAPP_URL 正確且無誤
- [ ] GAS 部署為 Web 應用
- [ ] GAS 指令碼沒有語法錯誤
- [ ] 網路連接正常

**解決方案:**
```bash
# 測試 GAS 連接
curl -X POST "GAS_WEBAPP_URL" \
  -d "action=getStats" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

---

### 3. 未出現在儀表板上的資料

**症狀:** 統計卡或表格為空

**檢查項目:**
- [ ] GAS 中有數據
- [ ] 認證令牌有效
- [ ] API 端點返回正確的 JSON
- [ ] 前端控制台無錯誤

**解決方案:**
```bash
# 檢查 API 回應
curl http://localhost:3000/api/entries \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .

# 檢查 GAS 執行日誌
# 訪問 Google Apps Script 編輯器 → Executions
```

---

### 4. 郵件未寄送

**症狀:** Email Status 顯示 "Failed"

**檢查項目:**
- [ ] BREVO_API_KEY 正確
- [ ] 郵件地址格式正確
- [ ] Brevo 帳戶有效
- [ ] 查詢限制未達到

**解決方案:**
```javascript
// 在 GAS 中測試 Brevo
const response = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'post',
  headers: {'api-key': BREVO_API_KEY},
  payload: JSON.stringify({/* 郵件內容 */})
});
Logger.log(response.getContentText());
```

---

### 5. CORS 錯誤

**症狀:** 瀏覽器控制台出現 "Cross-Origin" 錯誤

**檢查項目:**
- [ ] 所有 API 端點都設置了 CORS 標題
- [ ] `lib/cors.js` 正確導入
- [ ] `setCorsHeaders(res)` 在每個處理器中首先調用

**解決方案:**
```javascript
// 確保每個 API 端點都有
import { setCorsHeaders, handlePreflightRequest } from '../lib/cors';

export default async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest(req, res);
  }
  // ... 您的代碼
};
```

---

### 6. JWT 令牌過期

**症狀:** 一段時間後需要重新登錄

**檢查項目:**
- [ ] JWT_SECRET 正確
- [ ] 令牌過期時間設置正確 (7 天)
- [ ] localStorage 中的令牌有效

**解決方案:**
```javascript
// 前端自動重新登錄
localStorage.removeItem('token');
// 頁面會自動重定向到登錄頁面
```

---

### 7. 前端白屏或崩潰

**症狀:** 頁面無法加載，控制台有 JavaScript 錯誤

**檢查項目:**
- [ ] 所有依賴已安裝
- [ ] Node 版本 16+
- [ ] 沒有語法錯誤
- [ ] 環境變數已設置

**解決方案:**
```bash
# 完全重新安裝
rm -rf node_modules package-lock.json
npm install
npm run dev

# 檢查編譯錯誤
npm run build
```

---

### 8. 表格分頁不工作

**症狀:** Next/Previous 按鈕無反應

**檢查項目:**
- [ ] 分頁邏輯正確
- [ ] 總數值正確計算
- [ ] Page 狀態正確更新

**解決方案:**
```typescript
// 在 entries/page.tsx 中檢查
const totalPages = Math.ceil(total / pageSize);
// 確保分頁值在有效範圍內
```

---

### 9. CSV 匯出為空

**症狀:** 下載的 CSV 檔案為空或格式錯誤

**檢查項目:**
- [ ] GAS `handleExportCsv_()` 正確實現
- [ ] 資料行從第 2 行開始 (跳過標題)
- [ ] 特殊字符已正確轉義

**解決方案:**
```javascript
// 在 GAS 中測試
const csv = handleExportCsv_(sh, {});
Logger.log(csv.substring(0, 200)); // 檢查前 200 字符
```

---

### 10. 部署到 Vercel 後無法工作

**症狀:** 本機運行正常，但 Vercel 上無法工作

**檢查項目:**
- [ ] 所有環境變數已在 Vercel 設置
- [ ] 構建日誌無錯誤
- [ ] Git 推送了正確的分支
- [ ] Vercel 構建文件配置正確

**解決方案:**
```bash
# 檢查 Vercel 構建日誌
# 在 Vercel 儀表板查看 Deployments → 選擇部署 → Build Logs

# 本機測試生產構建
npm run build
npm run start
```

---

## 💡 提示和技巧

### 快速重啟開發伺服器
```bash
# 強制重新安裝依賴
npm ci

# 清除快取和重新啟動
rm -rf .next && npm run dev
```

### 檢查端口使用情況
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

### 測試特定 API 端點
```bash
# 使用 curl 測試
curl -X GET "http://localhost:3000/api/stats" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"

# 使用 node-fetch 測試
node -e "
fetch('http://localhost:3000/api/stats', {
  headers: {'Authorization': 'Bearer YOUR_TOKEN'}
}).then(r => r.json()).then(d => console.log(d))
"
```

### 查看完整 GAS 執行日誌
```
Google Apps Script 編輯器 → 執行 → 查看執行日誌
```

### 重置前端狀態
```bash
# 清除所有快取和 localStorage
localStorage.clear();
sessionStorage.clear();
// 重新載入頁面
location.reload();
```

---

## 📞 聯繫支持

如果您的問題未在上面列出，請:

1. 檢查 Google Apps Script 執行日誌
2. 檢查瀏覽器開發者工具控制台
3. 查閱 [部署指南](./DEPLOYMENT_GUIDE.md)
4. 查閱 [API 實現文檔](./API_IMPLEMENTATION.md)

---

**最後更新**: 2024年
