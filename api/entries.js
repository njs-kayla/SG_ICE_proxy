import { setCorsHeaders, handlePreflightRequest } from "../lib/cors.js";
import { errorResponse, successResponse, respondJson } from "../lib/errors.js";
import { readRawBody, callGAS } from "../lib/gas-request.js";
import { filterAndPaginate } from "../lib/data-filters.js";

/**
 * GET /api/entries
 * 
 * 取得 Google Sheet 所有報名資料，支援分頁、搜尋、篩選
 * 
 * Query String:
 *   - all: 是否返回全部資料（true 時不做分頁）
 *   - page: 頁碼（預設 1）
 *   - pageSize: 每頁筆數（預設 20）
 *   - keyword: 搜尋關鍵字（搜尋 name, email, company, phone, message）
 *   - status: Email Status 篩選（如 "Pending", "Sent", "Failed"）
 * 
 * Response:
 *   {
 *     "ok": true,
 *     "total": 523,
 *     "page": 1,
 *     "pageSize": 20,
 *     "rows": [
 *       {
 *         "row": 2,
 *         "createdAt": "",
 *         "name": "",
 *         "email": "",
 *         "company": "",
 *         "phone": "",
 *         "message": "",
 *         "raffleCode": "",
 *         "messageId": "",
 *         "status": "Pending",
 *         "retry": 0,
 *         "lastSendTime": "",
 *         "lastError": ""
 *       }
 *     ]
 *   }
 */
export default async function handler(req, res) {
  // 設定 CORS
  setCorsHeaders(res);

  // 處理 preflight
  if (handlePreflightRequest(req, res)) return;

  // 只支援 GET
  if (req.method !== "GET") {
    const response = errorResponse("Method not allowed", 405);
    return respondJson(res, response);
  }

  try {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;
    if (!GAS_WEBAPP_URL) {
      const response = errorResponse("Missing GAS_WEBAPP_URL", 500);
      return respondJson(res, response);
    }

    // 解析查詢參數
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
    const keyword = url.searchParams.get("keyword") || "";
    const status = url.searchParams.get("status") || "";
    const all = url.searchParams.get("all") === "true";

    // 向 GAS 請求全部資料
    // GAS 端應該接收 action=getEntries 並返回 JSON 格式的所有記錄
    const body = new URLSearchParams();
    body.set("action", "getEntries");

    const gasData = await callGAS({
      gasUrl: GAS_WEBAPP_URL,
      body: body.toString(),
      contentType: "application/x-www-form-urlencoded",
    });

    // 檢查 GAS 回應
    if (!gasData || !gasData.ok) {
      const response = errorResponse(gasData?.msg || "Failed to fetch entries from GAS", 502);
      return respondJson(res, response);
    }

    // 提取資料行陣列
    let rows = gasData.rows || [];
    if (!Array.isArray(rows)) {
      rows = [];
    }

    if (all) {
      const filtered = filterAndPaginate(rows, { keyword, status, page: 1, pageSize: rows.length || 1 });

      const response = successResponse({
        total: filtered.total,
        page: 1,
        pageSize: filtered.total,
        rows: filtered.rows,
      });

      return respondJson(res, response);
    }

    // 應用分頁、搜尋、篩選
    const filtered = filterAndPaginate(rows, { keyword, status, page, pageSize });

    // 返回結果
    const response = successResponse({
      total: filtered.total,
      page: filtered.page,
      pageSize: filtered.pageSize,
      rows: filtered.rows,
    });

    return respondJson(res, response);
  } catch (err) {
    const response = errorResponse(err?.message || "Internal Server Error", 500);
    return respondJson(res, response);
  }
}
