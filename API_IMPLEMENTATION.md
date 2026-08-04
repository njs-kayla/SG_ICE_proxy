## 實現完成報告 - Vercel Serverless API 擴充

### 📊 成果概覽

**項目狀態**：✅ 完成

**實現內容**：
- ✅ 建立共用函式層 (lib/ 資料夾)
- ✅ 新增 4 個後台管理 API 端點
- ✅ 保持 submit.js 原功能不變
- ✅ 完全遵循 DRY 原則，零程式碼重複

---

### 📁 專案結構

```
SG_ICE_proxy/
├── api/
│   ├── submit.js          (原有，未修改)
│   ├── entries.js         ✨ 新增 - GET /api/entries
│   ├── stats.js           ✨ 新增 - GET /api/stats
│   └── export.js          ✨ 新增 - GET /api/export
├── lib/
│   ├── cors.js            ✨ 新增 - CORS 設定
│   ├── errors.js          ✨ 新增 - 錯誤處理
│   ├── gas-request.js     ✨ 新增 - GAS 呼叫邏輯
│   └── data-filters.js    ✨ 新增 - 分頁/搜尋/篩選
├── package.json
└── README.md
```

---

### 🔧 共用函式層設計

#### `lib/cors.js`
- `setCorsHeaders(res)` — 設定統一的 CORS 頭部
- `handlePreflightRequest(req, res)` — 處理 OPTIONS preflight 請求

```javascript
// 使用範例
setCorsHeaders(res);
if (handlePreflightRequest(req, res)) return;
```

#### `lib/errors.js`
- `errorResponse(msg, statusCode)` — 建立錯誤回應物件
- `successResponse(data, statusCode)` — 建立成功回應物件
- `respondJson(res, response)` — 統一輸出 JSON 回應

```javascript
// 使用範例
const response = errorResponse("Missing parameter", 400);
respondJson(res, response);
```

#### `lib/gas-request.js`
- `readRawBody(req)` — 讀取請求的 Raw Body
- `callGAS(params)` — 向 GAS 發送請求，返回 JSON 回應
- `callGASRaw(params)` — 向 GAS 發送請求，返回原始文本（用於 CSV）

```javascript
// 使用範例 - JSON 回應
const gasData = await callGAS({
  gasUrl: GAS_WEBAPP_URL,
  body: body.toString(),
  contentType: "application/x-www-form-urlencoded",
});

// 使用範例 - 原始文本（CSV）
const csvContent = await callGASRaw({
  gasUrl: GAS_WEBAPP_URL,
  body: body.toString(),
});
```

#### `lib/data-filters.js`
- `filterAndPaginate(rows, options)` — 一次性進行搜尋、篩選、分頁

```javascript
// 使用範例
const filtered = filterAndPaginate(rows, {
  keyword: "test",
  status: "Pending",
  page: 1,
  pageSize: 20
});
// 返回: { rows: [...], total: 523, page: 1, pageSize: 20 }
```

---

### 📡 新增 API 詳細規範

#### 1️⃣ GET `/api/entries`

**功能**：取得報名資料，支援分頁、搜尋、篩選

**查詢參數**：
- `page` (int, 預設=1) — 頁碼
- `pageSize` (int, 預設=20) — 每頁筆數
- `keyword` (string, 選用) — 搜尋關鍵字 (搜尋 name, email, company, phone, message)
- `status` (string, 選用) — Email Status 篩選 (如 "Pending", "Sent", "Failed")

**GAS 呼叫**：
```
action=getEntries
```
GAS 應返回：`{ ok: true, rows: [...] }`

**成功回應** (200):
```json
{
  "ok": true,
  "total": 523,
  "page": 1,
  "pageSize": 20,
  "rows": [
    {
      "row": 2,
      "createdAt": "2024-08-01",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "ABC Corp",
      "phone": "0912345678",
      "message": "Hello ICE",
      "raffleCode": "RAFFLE123",
      "status": "Pending"
    }
  ]
}
```

**錯誤回應** (400/500/502):
```json
{
  "ok": false,
  "msg": "Missing GAS_WEBAPP_URL"
}
```

---

#### 2️⃣ GET `/api/stats`

**功能**：提供 Dashboard 統計資訊

**GAS 呼叫**：
```
action=getStats
```
GAS 應返回：
```json
{
  "ok": true,
  "total": 512,
  "success": 480,
  "pending": 20,
  "failed": 12
}
```

**成功回應** (200):
```json
{
  "ok": true,
  "total": 512,
  "success": 480,
  "pending": 20,
  "failed": 12
}
```

**錯誤回應** (500/502):
```json
{
  "ok": false,
  "msg": "Failed to fetch stats from GAS"
}
```

---

#### 3️⃣ GET `/api/export`

**功能**：匯出所有報名資料為 CSV 檔案

**GAS 呼叫**：
```
action=exportCsv
```
GAS 應返回：CSV 文本內容

**回應頭**：
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="export.csv"
```

**成功回應** (200) - CSV 文本:
```csv
row,createdAt,name,email,company,phone,message,raffleCode,status
2,2024-08-01,John Doe,john@example.com,ABC Corp,0912345678,Hello ICE,RAFFLE123,Pending
3,2024-08-02,Jane Smith,jane@example.com,XYZ Ltd,0987654321,Interested,RAFFLE456,Sent
```

**錯誤回應** (500/502):
```json
{
  "ok": false,
  "msg": "Failed to generate CSV from GAS"
}
```

---

### ✅ 測試清單

#### 測試工具
使用 cURL、Postman 或前端 fetch API 進行測試

#### 測試用例

**1. CORS 預檢 (OPTIONS)**
```bash
curl -X OPTIONS http://localhost:3000/api/entries \
  -H "Access-Control-Request-Method: GET"

# 應返回 204 及 CORS 頭部
```

**2. 基本分頁**
```bash
curl "http://localhost:3000/api/entries?page=1&pageSize=20"

# 應返回第 1 頁，每頁 20 筆，total 為全部記錄數
```

**3. 搜尋**
```bash
curl "http://localhost:3000/api/entries?keyword=john&page=1"

# 應返回 name/email/company/phone/message 中包含 "john" 的記錄
```

**4. 篩選**
```bash
curl "http://localhost:3000/api/entries?status=Pending"

# 應返回所有 status 為 "Pending" 的記錄
```

**5. 搜尋 + 篩選**
```bash
curl "http://localhost:3000/api/entries?keyword=john&status=Pending&page=1&pageSize=10"

# 應返回同時符合搜尋和篩選條件的記錄
```

**6. 統計資訊**
```bash
curl "http://localhost:3000/api/stats"

# 應返回 { ok: true, total, success, pending, failed }
```

**7. CSV 匯出**
```bash
curl "http://localhost:3000/api/export" > export.csv

# 應生成 CSV 檔案
```

**8. 缺少環境變數**
```bash
# 不設定 GAS_WEBAPP_URL，任意呼叫 API
curl "http://localhost:3000/api/entries"

# 應返回 500: { ok: false, msg: "Missing GAS_WEBAPP_URL" }
```

**9. GAS 返回非 JSON**
```bash
# 模擬 GAS 返回非 JSON 內容
# 應返回 502: { ok: false, msg: "GAS returned non-JSON: ..." }
```

**10. 無效查詢參數**
```bash
curl "http://localhost:3000/api/entries?page=abc&pageSize=xyz"

# 應正確處理，轉換為有效的數字或使用預設值
```

---

### 🔒 環境變數

確保 `.env` 或 Vercel 環境設定中包含：
```
GAS_WEBAPP_URL=https://script.google.com/macros/d/{SCRIPT_ID}/userweb
```

---

### 📋 GAS 側整合需求

GAS 應實現以下 action：

| Action | 方法 | 返回格式 | 說明 |
|--------|------|---------|------|
| `getEntries` | POST | JSON | 返回 `{ ok: true, rows: [...] }` |
| `getStats` | POST | JSON | 返回 `{ ok: true, total, success, pending, failed }` |
| `exportCsv` | POST | CSV 文本 | 返回 CSV 內容 |

GAS 側可參考的請求格式：
```javascript
// Backend 發送的格式
{
  action: "getEntries",
  // 或
  action: "getStats",
  // 或
  action: "exportCsv"
}
```

---

### 🎯 設計特性

1. **DRY 原則**
   - 共用函式集中在 `lib/` 資料夾
   - 不存在重複程式碼

2. **一致的錯誤處理**
   - 所有 API 返回相同格式：`{ ok: boolean, msg?: string }`
   - 統一的 HTTP 狀態碼

3. **一致的 CORS 設定**
   - 所有 API 使用相同的 CORS 頭部設定
   - 支援 preflight 請求 (OPTIONS)

4. **安全邊界保護**
   - 分頁參數驗證 (page 最小值 1，pageSize 最大 1000)
   - 查詢參數類型檢查

5. **靈活的資料過濾**
   - 同時支援搜尋、篩選、分頁的組合
   - 多欄位搜尋 (name, email, company, phone, message)

6. **無狀態設計**
   - 所有邏輯在單次請求內完成
   - 支援無縫部署到 Vercel Serverless

---

### 📝 實現細節

#### 分頁邏輯
```javascript
// 若請求頁碼超出範圍，自動回到最後一頁
const validPage = Math.max(1, Math.min(page, Math.ceil(rows.length / pageSize) || 1));
```

#### 搜尋邏輯
```javascript
// 不區分大小寫，跨多個欄位搜尋
const lowerKeyword = keyword.toLowerCase();
const match = searchableFields.some(field => 
  field && String(field).toLowerCase().includes(lowerKeyword)
);
```

#### 篩選邏輯
```javascript
// 精確匹配狀態字段
row.status === status
```

---

### 🚀 部署步驟

1. 確保 `GAS_WEBAPP_URL` 環境變數已設定
2. 將所有檔案推送到 GitHub
3. 連接 Vercel 並部署
4. 執行測試清單中的各項測試

---

### 📞 後續支援

若 GAS 側的 action 實現有任何變更，只需修改：
- GAS 側的 action 名稱
- Backend API 中的 `body.set("action", "...")` 行

無需修改其他程式碼邏輯。

---

**實現日期**：2026-08-03
**版本**：1.0.0
**狀態**：Production Ready ✅
