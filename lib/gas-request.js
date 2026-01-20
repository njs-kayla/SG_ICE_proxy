/**
 * Google Apps Script (GAS) 統一請求處理
 * 提供統一的 GAS 呼叫邏輯、body 讀取、錯誤處理
 */

/**
 * 讀取請求的 Raw Body
 * @param {Object} req - Node.js request 物件
 * @returns {Promise<string>} Raw body 字串
 */
export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/**
 * 向 GAS 發送請求
 * @param {Object} params - 參數物件
 * @param {string} params.gasUrl - GAS WebApp URL
 * @param {string} params.body - 請求體（URLSearchParams 字串或 JSON）
 * @param {string} [params.contentType] - Content-Type 頭部，預設為 application/x-www-form-urlencoded
 * @returns {Promise<Object>} 解析後的 JSON 回應
 * @throws {Error} 如果 GAS 返回非 JSON 或網路錯誤
 */
export async function callGAS(params) {
  const { gasUrl, body, contentType = "application/x-www-form-urlencoded" } = params;

  if (!gasUrl) {
    throw new Error("Missing GAS_WEBAPP_URL");
  }

  const forwardResp = await fetch(gasUrl, {
    method: "POST",
    headers: { "content-type": contentType },
    body,
    redirect: "follow",
  });

  const text = await forwardResp.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = null;
  }

  if (!data) {
    throw new Error(`GAS returned non-JSON: ${text?.slice?.(0, 200) || ""}`);
  }

  return data;
}

/**
 * 代理 GAS 的原始回應（用於 CSV 等二進位/文字內容）
 * @param {Object} params - 參數物件
 * @param {string} params.gasUrl - GAS WebApp URL
 * @param {string} params.body - 請求體
 * @param {string} [params.contentType] - Content-Type 頭部
 * @returns {Promise<string>} 原始回應文本
 * @throws {Error} 如果網路或 GAS 端錯誤
 */
export async function callGASRaw(params) {
  const { gasUrl, body, contentType = "application/x-www-form-urlencoded" } = params;

  if (!gasUrl) {
    throw new Error("Missing GAS_WEBAPP_URL");
  }

  const forwardResp = await fetch(gasUrl, {
    method: "POST",
    headers: { "content-type": contentType },
    body,
    redirect: "follow",
  });

  return await forwardResp.text();
}
