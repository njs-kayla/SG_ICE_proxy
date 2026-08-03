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
  setCorsHeaders(res);

  if (handlePreflightRequest(req, res)) return;

  if (req.method !== "GET") {
    return respondJson(res, errorResponse("Method not allowed", 405));
  }

  try {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;

    if (!GAS_WEBAPP_URL) {
      return respondJson(
        res,
        errorResponse("Missing GAS_WEBAPP_URL", 500),
      );
    }

    const body = new URLSearchParams();
    body.set("action", "exportCsv");

    const csvContent = await callGASRaw({
      gasUrl: GAS_WEBAPP_URL,
      body: body.toString(),
      contentType: "application/x-www-form-urlencoded",
    });

    if (!csvContent?.trim()) {
      return respondJson(
        res,
        errorResponse("Failed to generate CSV from GAS", 502),
      );
    }

    // GAS 若回傳 JSON 錯誤
    try {
      const parsed = JSON.parse(csvContent);

      if (!parsed.ok) {
        return respondJson(
          res,
          errorResponse(parsed.msg || "Failed to export CSV", 502),
        );
      }
    } catch (_) {
      // CSV，略過
    }

    // Excel UTF-8 BOM
    const csv = "\uFEFF" + csvContent;

    res.status(200);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="export.csv"',
    );
    res.setHeader("Cache-Control", "no-store");

    return res.send(csv);
  } catch (err) {
    return respondJson(
      res,
      errorResponse(err?.message || "Internal Server Error", 500),
    );
  }
}
