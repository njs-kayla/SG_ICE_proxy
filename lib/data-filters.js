/**
 * 資料過濾、搜尋、分頁處理
 * 提供統一的資料處理邏輯
 */

/**
 * 搜尋資料行
 * @param {Array<Object>} rows - 資料行陣列
 * @param {string} keyword - 搜尋關鍵字（未提供時為空字串）
 * @returns {Array<Object>} 過濾後的資料行
 */
function filterByKeyword(rows, keyword) {
  if (!keyword || keyword.trim() === "") {
    return rows;
  }

  const lowerKeyword = keyword.toLowerCase();
  return rows.filter((row) => {
    // 搜尋以下欄位：name, email, company, phone, message
    const searchableFields = [
      row.name,
      row.email,
      row.company,
      row.phone,
      row.message,
    ];

    return searchableFields.some(
      (field) => field && String(field).toLowerCase().includes(lowerKeyword)
    );
  });
}

/**
 * 根據狀態篩選資料
 * @param {Array<Object>} rows - 資料行陣列
 * @param {string} status - 要篩選的狀態（未提供時為空字串）
 * @returns {Array<Object>} 過濾後的資料行
 */
function filterByStatus(rows, status) {
  if (!status || status.trim() === "") {
    return rows;
  }

  return rows.filter((row) => row.status === status);
}

/**
 * 分頁資料
 * @param {Array<Object>} rows - 資料行陣列
 * @param {number} page - 頁碼（預設為 1）
 * @param {number} pageSize - 每頁筆數（預設為 20）
 * @returns {Object} { data: 該頁資料, total: 總筆數, page, pageSize }
 */
function paginateData(rows, page = 1, pageSize = 20) {
  const validPage = Math.max(1, Math.min(page, Math.ceil(rows.length / pageSize) || 1));
  const validPageSize = Math.max(1, Math.min(pageSize, 1000)); // 防止過大

  const start = (validPage - 1) * validPageSize;
  const end = start + validPageSize;
  const paginatedData = rows.slice(start, end);

  return {
    data: paginatedData,
    total: rows.length,
    page: validPage,
    pageSize: validPageSize,
  };
}

/**
 * 組合過濾、搜尋、分頁邏輯
 * @param {Array<Object>} rows - 原始資料行陣列
 * @param {Object} options - 過濾選項
 * @param {string} [options.keyword] - 搜尋關鍵字
 * @param {string} [options.status] - 狀態篩選
 * @param {number} [options.page] - 頁碼
 * @param {number} [options.pageSize] - 每頁筆數
 * @returns {Object} { rows: 過濾後的該頁資料, total: 總筆數, page, pageSize }
 */
export function filterAndPaginate(rows, options = {}) {
  if (!Array.isArray(rows)) {
    rows = [];
  }

  const { keyword = "", status = "", page = 1, pageSize = 20 } = options;

  // 先搜尋，再篩選
  let filtered = filterByKeyword(rows, keyword);
  filtered = filterByStatus(filtered, status);

  // 再分頁
  const paginated = paginateData(filtered, parseInt(page, 10), parseInt(pageSize, 10));

  return {
    rows: paginated.data,
    total: paginated.total,
    page: paginated.page,
    pageSize: paginated.pageSize,
  };
}
