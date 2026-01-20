import { setCorsHeaders, handlePreflightRequest } from "../lib/cors.js";
import { errorResponse, successResponse, respondJson } from "../lib/errors.js";
import { readRawBody, callGAS } from "../lib/gas-request.js";

/**
 * POST /api/resend
 * 
 * 重新寄送該筆 Email
 * 
 * Request Body:
 *   {
 *     "row": 15
 *   }
 * 
 * 成功後更新：
 *   - Message ID
 *   - Email Status
 *   - Retry Count +1
 *   - Last Send Time
 *   - Last Error
 * 
 * Response:
 *   {
 *     "ok": true,
 *     "messageId": "..."
 *   }
 */
export default async function handler(req, res) {
  // 設定 CORS
  setCorsHeaders(res);

  // 處理 preflight
  if (handlePreflightRequest(req, res)) return;

  // 只支援 POST
  if (req.method !== "POST") {
    const response = errorResponse("Method not allowed", 405);
    return respondJson(res, response);
  }

  try {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;
    if (!GAS_WEBAPP_URL) {
      const response = errorResponse("Missing GAS_WEBAPP_URL", 500);
      return respondJson(res, response);
    }

    // 讀取請求體
    const rawBody = await readRawBody(req);
    const contentType = req.headers["content-type"] || "application/x-www-form-urlencoded";

    let requestData = {};

    // 解析請求體（支援 JSON 和 form-encoded）
    if (contentType.includes("application/json")) {
      try {
        requestData = JSON.parse(rawBody);
      } catch (_) {
        const response = errorResponse("Invalid JSON in request body", 400);
        return respondJson(res, response);
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      requestData = Object.fromEntries(params);
    }

    // 驗證必要參數
    const row = requestData.row;
    if (!row || row === "") {
      const response = errorResponse("Missing required parameter: row", 400);
      return respondJson(res, response);
    }

    // 向 GAS 發送重新寄送請求
    const body = new URLSearchParams();
    body.set("action", "resendEmail");
    body.set("row", String(row));

    const gasData = await callGAS({
      gasUrl: GAS_WEBAPP_URL,
      body: body.toString(),
      contentType: "application/x-www-form-urlencoded",
    });

    // 檢查 GAS 回應
    if (!gasData || !gasData.ok) {
      const response = errorResponse(gasData?.msg || "Failed to resend email", 502);
      return respondJson(res, response);
    }

    // 返回成功回應
    const response = successResponse({
      messageId: gasData.messageId || "",
    });

    return respondJson(res, response);
  } catch (err) {
    const response = errorResponse(err?.message || "Internal Server Error", 500);
    return respondJson(res, response);
  }
}
