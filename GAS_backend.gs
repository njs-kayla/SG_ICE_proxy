/**********************
 * Config
 **********************/
const SHEET_NAME = 'SBC 2026 客戶抽獎資料';

// 你要寄出的主旨
const EMAIL_SUBJECT = 'Fortune Wheel Entry Confirmed 🎁';

// 回覆信箱
const REPLY_TO = 'marketing@fast-spin.com';

// ✅ Brevo Sender（必須是 Brevo 後台已驗證的寄件者）
const SENDER_EMAIL = 'fastspinsg@gmail.com';
const SENDER_NAME = 'FASTSPIN';

// ✅ Brevo API Key
const BREVO_API_KEY_FALLBACK = '';

// 欄位順序：可自行調整（建議加 timestamp）
const HEADER = [
  'CreatedAt',
  'Name',
  'Email',
  'Company',
  'Contact Number',
  'Message',
  'Raffle Code',
  'Email Status'
];

const LEGACY_REMOVED_HEADERS = [
  'Message ID',
  'Retry Count',
  'Last Send Time',
  'Last Error'
];

// Brevo Endpoint
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// ✅ 欄位位置對應（1-based index）
const COLUMN_MAP = {
  createdAt: 1,
  name: 2,
  email: 3,
  company: 4,
  phone: 5,
  message: 6,
  raffleCode: 7,
  status: 8
};


/**********************
 * Entry Point
 **********************/
function doPost(e) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) return json({ ok: false, msg: 'sheet not found' });

  ensureHeader_(sh);

  const p = getPayload_(e);
  const action = String(p.action || '').trim();

  // ✅ 路由到對應的 action handler
  if (action === 'getEntries') {
    return handleGetEntries_(sh, p);
  }
  if (action === 'getStats') {
    return handleGetStats_(sh, p);
  }
  if (action === 'exportCsv') {
    return handleExportCsv_(sh, p);
  }

  // ✅ 預設：表單提交（原有邏輯）
  return handleFormSubmit_(sh, p);
}

function doGet() {
  return json({ ok: true });
}


/**********************
 * Action Handlers
 **********************/

/**
 * 取得所有報名資料
 */
function handleGetEntries_(sh, p) {
  try {
    const lastRow = sh.getLastRow();
    if (lastRow < 2) {
      return json({ ok: true, rows: [] });
    }

    const data = sh.getRange(2, 1, lastRow - 1, HEADER.length).getValues();
    const rows = data.map((row, idx) => ({
      row: idx + 2, // 1-based row number (因為第一列是 header)
      createdAt: formatDate_(row[COLUMN_MAP.createdAt - 1]),
      name: String(row[COLUMN_MAP.name - 1] || '').trim(),
      email: String(row[COLUMN_MAP.email - 1] || '').trim(),
      company: String(row[COLUMN_MAP.company - 1] || '').trim(),
      phone: String(row[COLUMN_MAP.phone - 1] || '').trim(),
      message: String(row[COLUMN_MAP.message - 1] || '').trim(),
      raffleCode: String(row[COLUMN_MAP.raffleCode - 1] || '').trim(),
      status: String(row[COLUMN_MAP.status - 1] || 'Pending').trim()
    }));

    return json({ ok: true, rows });
  } catch (err) {
    return json({ ok: false, msg: safeMsg_(err) });
  }
}

/**
 * 取得統計資料
 */
function handleGetStats_(sh, p) {
  try {
    const lastRow = sh.getLastRow();
    if (lastRow < 2) {
      return json({
        ok: true,
        total: 0,
        success: 0,
        pending: 0,
        failed: 0
      });
    }

    const data = sh.getRange(2, COLUMN_MAP.status, lastRow - 1, 1).getValues();

    let success = 0;
    let pending = 0;
    let failed = 0;

    for (let i = 0; i < data.length; i++) {
      const status = String(data[i][0] || 'Pending').trim();

      if (status === 'Sent') success++;
      else if (status === 'Failed') failed++;
      else if (status === 'Pending') pending++;
    }

    return json({
      ok: true,
      total: data.length,
      success,
      pending,
      failed
    });
  } catch (err) {
    return json({ ok: false, msg: safeMsg_(err) });
  }
}

/**
 * 匯出 CSV
 */
function handleExportCsv_(sh, p) {
  try {
    const lastRow = sh.getLastRow();
    if (lastRow < 1) {
      return csvText(''); // 空 CSV
    }

    // ✅ 取得所有資料（含 header）
    const data = sh.getRange(1, 1, lastRow, HEADER.length).getValues();

    // ✅ 轉換成 CSV（處理逗號、引號、換行）
    const csvLines = data.map(row =>
      row.map(cell => {
        const val = String(cell || '').trim();
        // 如果包含逗號、引號或換行，需要用雙引號包起來
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return '"' + val.replaceAll('"', '""') + '"';
        }
        return val;
      }).join(',')
    );

      const csv = csvLines.join('\r\n');
    return csvText(csv);
  } catch (err) {
    return json({ ok: false, msg: safeMsg_(err) });
  }
}

/**
 * 表單提交（原有邏輯）
 */
function handleFormSubmit_(sh, p) {
  const name = String(p.name || '').trim();
  const emailRaw = String(p.email || '').trim();
  const company = String(p.company || '').trim();
  const phone = String(p.phone || '').trim();
  const message = String(p.message || '').trim();
  const raffle_code = String(p.raffle_code || '').trim();

  // 必填檢查
  if (!name || !emailRaw || !company || !raffle_code) {
    return json({ ok: false, existed: false, msg: 'missing fields' });
  }

  // Email 格式檢查
  if (!isValidEmail_(emailRaw)) {
    return json({ ok: false, existed: false, msg: 'invalid email' });
  }

  const emailKey = emailRaw.toLowerCase();

  // ✅ 避免同時多人送出造成重複
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // Email 唯一檢查
    const existed = isEmailExists_(sh, emailKey);
    if (existed) {
      return json({ ok: true, existed: true, msg: 'email exists' });
    }

    // ✅ 先寄信（寄失敗就不寫入）
    let mailResult = null;

    try {
      const htmlBody = buildEmailHtml_(raffle_code);
      const plainBody = buildEmailText_(raffle_code);

      mailResult = sendBrevoEmail_({
        toEmail: emailRaw,
        toName: name,
        subject: EMAIL_SUBJECT,
        htmlContent: htmlBody,
        textContent: plainBody,
      });

      if (!mailResult.ok) {
        return json({
          ok: false,
          existed: false,
          msg: `email send failed: ${mailResult.error || "unknown error"}`
        });
      }

    } catch (mailErr) {
      return json({
        ok: false,
        existed: false,
        msg: `email send failed: ${safeMsg_(mailErr)}`
      });
    }

    // ✅ 寄信成功才寫入
    const createdAt = new Date();
    const phoneText = phone ? "'" + phone : "";
    sh.appendRow([
      createdAt,
      name,
      emailRaw,
      company,
      phoneText,
      message,
      raffle_code,
      "Sent"
    ]);

    return json({ ok: true, existed: false, msg: 'saved and emailed' });

  } finally {
    lock.releaseLock();
  }
}


/**********************
 * Brevo Email Sender
 **********************/
function sendBrevoEmail_({ toEmail, toName, subject, htmlContent, textContent }) {
  const apiKey = getBrevoApiKey_();
  if (!apiKey) {
    return { ok: false, error: 'missing Brevo API Key (set Script Properties: BREVO_API_KEY)' };
  }

  const payload = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: toEmail, name: toName || undefined }],
    subject,
    htmlContent,
    textContent,
    replyTo: { email: REPLY_TO },
  };

  const resp = UrlFetchApp.fetch(BREVO_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'api-key': apiKey,
      'accept': 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = resp.getResponseCode();
  const text = resp.getContentText();
  Logger.log(text)
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (_) { }

  if (code >= 200 && code < 300) {
    return { ok: true };
  }

  // 失敗：Brevo 常見會回傳 message / code
  const errMsg = (body && (body.message || body.error || body.code)) ? (body.message || body.error || body.code) : text;
  return { ok: false, error: `HTTP ${code} - ${errMsg}` };
}

function getBrevoApiKey_() {
  const fromProps = PropertiesService.getScriptProperties().getProperty('BREVO_API_KEY');
  if (fromProps) return String(fromProps).trim();
  if (BREVO_API_KEY_FALLBACK) return String(BREVO_API_KEY_FALLBACK).trim();
  return '';
}


/**********************
 * Helpers
 **********************/
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function csvText(text) {
  return ContentService
     .createTextOutput('\uFEFF' + text)
    .setMimeType(ContentService.MimeType.CSV);
}

function getPayload_(e) {
  // 1) form-urlencoded
  if (e && e.parameter && Object.keys(e.parameter).length) {
    return e.parameter;
  }

  // 2) raw json
  try {
    const ct = e && e.postData && e.postData.type ? String(e.postData.type) : '';
    const raw = e && e.postData && e.postData.contents ? String(e.postData.contents) : '';
    if (raw && ct.includes('application/json')) {
      return JSON.parse(raw);
    }
  } catch (_) { }

  // fallback
  return {};
}

function isValidEmail_(email) {
  const s = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

function ensureHeader_(sh) {
  // ✅ 空表：直接補 header
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    return;
  }

  // ✅ 如果第一列是空的，也補上 header
  const lastColumn = Math.max(sh.getLastColumn(), HEADER.length);
  const firstRow = sh.getRange(1, 1, 1, lastColumn).getValues()[0];
  const hasAny = firstRow.some(v => String(v || '').trim() !== '');
  if (!hasAny) {
    sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    return;
  }

  const legacyColumnsToDelete = [];
  for (let i = firstRow.length - 1; i >= 0; i--) {
    const headerValue = String(firstRow[i] || '').trim();
    if (LEGACY_REMOVED_HEADERS.includes(headerValue)) {
      legacyColumnsToDelete.push(i + 1);
    }
  }

  legacyColumnsToDelete.forEach((columnIndex) => {
    sh.deleteColumn(columnIndex);
  });

  sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
}

function isEmailExists_(sh, emailKey) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return false;

  // Email 欄位置：COLUMN_MAP.email
  const values = sh.getRange(2, COLUMN_MAP.email, lastRow - 1, 1).getValues();
  return values.some(r => String(r[0] || '').trim().toLowerCase() === emailKey);
}

function safeMsg_(err) {
  try {
    return (err && err.message) ? String(err.message) : String(err);
  } catch (_) {
    return 'unknown error';
  }
}

/**
 * 格式化日期顯示
 */
function formatDate_(date) {
  if (!date) return '';
  try {
    if (typeof date === 'string') return date;
    if (typeof date === 'number') date = new Date(date);
    if (!(date instanceof Date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (_) {
    return '';
  }
}


/**********************
 * Email Template
 **********************/
function buildEmailHtml_(raffle_code) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border-collapse:collapse; width:100%; background:#ffffff;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!-- Content Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="border-collapse:collapse; width:100%; max-width:600px;">
          <tr>
            <td align="center" style="font-family: Arial, Helvetica, sans-serif; line-height:1.6; color:#111; text-align:center;">

              <div style="margin-bottom: 30px;">
                <img
                  src="https://fast-spin.com/dark.png"
                  alt="FASTSPIN"
                  width="200"
                  style="display:block; margin:0 auto;"
                />
              </div>
              <h2 style="margin:0 0 14px; font-size:22px; font-weight:700;">
                Fortune Wheel Entry Confirmed 🎁
              </h2>

              <p style="margin:0 0 14px;">
                Thank you for joining Spin to Win – your entry has been successfully confirmed!
              </p>

              <p style="margin:24px 0;">
                <strong>Your Unique Entry Code</strong><br/>
                <div style="padding:16px 30px; border: 1px solid #DADCE0; background: #F7F8FA; border-radius: 10px;">
                  <span style="display:inline-block; color: #101216; font-size:20px; font-weight:700; font-size: 24px;">
                    ${escapeHtml_(raffle_code)}
                  </span>
                </div>
              </p>

              <p style="margin:0 0 16px;">
                Please keep this code safe.<br/>
                You'll need to present it on the spot to claim your prize if you're selected as a winner. 
              </p>

              <p style="margin:0 0 10px;">
                <strong>Booth Location:</strong><br/>
                Booth A445, SBC Summit Lisbon 2026
              </p>

              <p style="margin:0 0 10px;">
                <strong>⏰ Daily Grand Draw Schedule:</strong><br/>
                Please arrive on time to witness the draw and secure your chance to win:
              </p>

              <!-- schedule (centered list) -->
              <div style="margin:0 0 16px; text-align:center;">
                <div style="margin:4px 0;">29 Sep – 4:00 PM</div>
                <div style="margin:4px 0;">30 Sep – 4:00 PM</div>
                <div style="margin:4px 0;">1 Oct – 4:00 PM</div>
              </div>

              <p style="margin:0 0 16px;">
                We look forward to seeing you there and wish you the best of luck! 
              </p>

              <p style="margin:0 0 18px;">
                For more information, please contact us or email 
                <a href="mailto:marketing@fast-spin.com" style="color:#111; text-decoration:underline;">
                  marketing@fast-spin.com
                </a>
              </p>

              <p style="margin:18px 0 0; font-size:12px; color:#666;">
                Copyright © 2026 by FASTSPIN
              </p>

            </td>
          </tr>
        </table>
        <!-- /Content Card -->
      </td>
    </tr>
  </table>`;
}

function buildEmailText_(raffle_code) {
  return (
    `Spin to Win Entry Confirmed 🎁

Thank you for joining Spin to Win – your entry has been successfully confirmed!

Your Unique Entry Code: ${raffle_code}

Please keep this code safe.
You'll need to present it on the spot to claim your prize if you're selected as a winner.

Booth Location:
Booth A445, SBC Summit Lisbon 2026

⏰ Daily Grand Draw Schedule:
Please arrive on time to witness the draw and secure your chance to win:
29 Sep – 4:00 PM
30 Sep – 4:00 PM
1 Oct – 4:00 PM

We look forward to seeing you there and wish you the best of luck!

For more information, please contact us or email marketing@fast-spin.com

Copyright © 2026 by FASTSPIN`
  );
}

function escapeHtml_(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function testExternalRequestAuth() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('BREVO_API_KEY');
  if (!apiKey) throw new Error("Missing BREVO_API_KEY");

  const resp = UrlFetchApp.fetch("https://api.brevo.com/v3/smtp/email", {
    method: "post",
    contentType: "application/json",
    headers: { "api-key": apiKey, "accept": "application/json" },
    payload: JSON.stringify({
      sender: { email: "info@spadegaming.com", name: "SPADEGAMING" },
      to: [{ email: "test@example.com" }],
      subject: "Auth Test",
      htmlContent: "<p>test</p>",
      headers: { "X-Sib-Sandbox": "drop" } // ✅ 不真的寄出
    }),
    muteHttpExceptions: true,
  });

  Logger.log(resp.getResponseCode());
  Logger.log(resp.getContentText());
}
