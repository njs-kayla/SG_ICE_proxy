import { setCorsHeaders, handlePreflightRequest } from "../lib/cors.js";
import { errorResponse, respondJson } from "../lib/errors.js";
import { callGASRaw } from "../lib/gas-request.js";

/**
 * GET /api/export
 * 
 * 匯出 Google Sheet 為 CSV
 * 
 * Response Header:
 *   Content-Type: text/csv
 * 
 * Response Body:
 *   CSV 文本內容
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

    // 向 GAS 請求 CSV 匯出
    const body = new URLSearchParams();
    body.set("action", "exportCsv");

    // 使用 callGASRaw 取得原始回應（不進行 JSON 解析）
    const csvContent = await callGASRaw({
      gasUrl: GAS_WEBAPP_URL,
      body: body.toString(),
      contentType: "application/x-www-form-urlencoded",
    });

    if (!csvContent || csvContent.trim() === "") {
      const response = errorResponse("Failed to generate CSV from GAS", 502);
      return respondJson(res, response);
    }

    // 檢查是否為 JSON 錯誤回應（如果 GAS 返回錯誤）
    try {
      const parsed = JSON.parse(csvContent);
      if (!parsed.ok) {
        const response = errorResponse(parsed.msg || "Failed to export CSV", 502);
        return respondJson(res, response);
      }
    } catch (_) {
      // 不是 JSON，應該是 CSV 內容，繼續處理
    }

    // 設定 CSV 回應頭
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="export.csv"');

    // 直接返回 CSV 內容
    return res.status(200).send(csvContent);
  } catch (err) {
    const response = errorResponse(err?.message || "Internal Server Error", 500);
    return respondJson(res, response);
  }
}
