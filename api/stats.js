import { setCorsHeaders, handlePreflightRequest } from "../lib/cors.js";
import { errorResponse, successResponse, respondJson } from "../lib/errors.js";
import { callGAS } from "../lib/gas-request.js";

/**
 * GET /api/stats
 * 
 * 提供 Dashboard 統計資訊
 * 
 * Response:
 *   {
 *     "ok": true,
 *     "total": 512,
 *     "success": 480,
 *     "pending": 20,
 *     "failed": 12,
 *     "retry": 8
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

    // 向 GAS 請求統計資料
    const body = new URLSearchParams();
    body.set("action", "getStats");

    const gasData = await callGAS({
      gasUrl: GAS_WEBAPP_URL,
      body: body.toString(),
      contentType: "application/x-www-form-urlencoded",
    });

    // 檢查 GAS 回應
    if (!gasData || !gasData.ok) {
      const response = errorResponse(gasData?.msg || "Failed to fetch stats from GAS", 502);
      return respondJson(res, response);
    }

    // 返回統計資料
    const response = successResponse({
      total: gasData.total || 0,
      success: gasData.success || 0,
      pending: gasData.pending || 0,
      failed: gasData.failed || 0,
      retry: gasData.retry || 0,
    });

    return respondJson(res, response);
  } catch (err) {
    const response = errorResponse(err?.message || "Internal Server Error", 500);
    return respondJson(res, response);
  }
}
