/**
 * 錯誤處理和回應格式
 * 提供統一的錯誤回應格式
 */

export function errorResponse(msg, statusCode = 500) {
  return {
    statusCode,
    body: {
      ok: false,
      msg: String(msg || "Internal Server Error"),
    },
  };
}

export function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    body: {
      ok: true,
      ...data,
    },
  };
}

export function respondJson(res, response) {
  res.status(response.statusCode).json(response.body);
}
