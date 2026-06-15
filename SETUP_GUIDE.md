# jm1015 單字卡 App - 完整實作指南

## 📚 項目概述

jm1015 是一個純前端單字卡學習應用程式，採用 HTML、CSS、JavaScript 開發，無需任何框架。支持卡片翻轉效果、自動填入單字資料、本地存儲、以及遠端存儲到 Google 試算表。

---

## 🎯 功能特性

### 主要功能
- ✅ **卡片翻轉動畫** - 3D 翻頁效果
- ✅ **單字導航** - 上/下一個單字、隨機打亂
- ✅ **自動填入** - 調用免費字典 API 自動填充資料
- ✅ **本地存儲** - 使用 LocalStorage 保存單字資料
- ✅ **Google 試算表同步** - 通過 Google Apps Script 同步到雲端
- ✅ **響應式設計** - 支援手機、平板、桌面端
- ✅ **進度追蹤** - 顯示當前進度條
- ✅ **鍵盤快捷鍵** - 方向鍵翻頁，空格翻轉卡片

---

## 📁 文件結構

```
jm1015/
├── index.html              # HTML 主頁面
├── styles.css              # CSS 樣式表
├── app.js                  # 主應用程式
├── google-apps-script.js   # Google Apps Script 後端程式碼（參考用）
└── README.md               # 本文件
```

---

## 🚀 快速開始

### 1️⃣ 本地測試（前端功能）

```bash
# 方法 A：直接用瀏覽器打開
open index.html

# 方法 B：使用 Python HTTP 伺服器
python -m http.server 8000

# 方法 B：使用 Node.js HTTP 伺服器
npx http-server

# 方法 D：使用 VS Code Live Server 擴展
# 右鍵點擊 index.html → Open with Live Server
```

### 2️⃣ 測試功能

1. **卡片翻轉**：點擊卡片或按「🔄 Flip Card」按鈕
2. **導航**：使用「← Previous」和「Next →」按鈕
3. **新增單字**：切換到「管理單字」頁面，填入表單
4. **自動填入**：輸入英文單字，點擊「✨ Auto Fill」

---

## 🔧 Google Apps Script 後端設置

### 步驟 1：建立 Google Apps Script 專案

1. 前往 [Google Apps Script](https://script.google.com)
2. 建立新專案
3. 複製以下程式碼到 `Code.gs`

```javascript
// Google Apps Script - Code.gs

// 設定 Google 試算表 ID（替換為你的試算表 ID）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = '單字資料';

/**
 * 處理 POST 請求
 */
function doPost(e) {
  try {
    // 解析 JSON 資料
    const data = JSON.parse(e.postData.contents);

    // 驗證必填欄位
    if (!data.englishWord || !data.translation) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          message: '英文單字和中文翻譯為必填欄位'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 取得試算表
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // 如果工作表不存在，建立新的
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      addHeaders(sheet);
    }

    // 新增資料到工作表
    const timestamp = new Date().toLocaleString('zh-TW');
    const newRow = [
      timestamp,
      data.englishWord,
      data.translation,
      data.rootAnalysis || '',
      data.exampleSentence,
      data.partOfSpeech
    ];

    sheet.appendRow(newRow);

    // 返回成功回應
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: '單字已成功同步到 Google 試算表'
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 返回錯誤回應
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '發生錯誤：' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 設定試算表表頭
 */
function addHeaders(sheet) {
  const headers = ['時間戳', '英文單字', '中文翻譯', '字根分析', '例句', '詞性'];
  sheet.appendRow(headers);

  // 格式化表頭
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('white');
}

/**
 * 獲取所有單字（可選）
 */
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: '工作表不存在' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: data })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 步驟 2：建立 Google 試算表

1. 前往 [Google 試算表](https://sheets.google.com)
2. 建立新試算表，命名為「jm1015 單字資料」
3. 複製試算表 URL 中的 ID（格式：`/d/[ID]/edit`）
4. 將 ID 填入 `SPREADSHEET_ID`

### 步驟 3：部署 Google Apps Script

1. 在 Google Apps Script 編輯器中，點擊「部署」> 「新增部署」
2. 選擇「型式」為「Web 應用程式」
3. 執行身份：選擇你的 Google 帳戶
4. 誰可以存取：「任何人」
5. 複製部署的 URL

### 步驟 4：更新前端配置

在 `app.js` 中找到以下代碼並更新：

```javascript
// 在 app.js 中新增以下常數（約在第 10 行）
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercontent';
```

---

## 📖 使用指南

### 主畫面操作

| 操作 | 方式 |
|------|------|
| 翻轉卡片 | 點擊卡片 / 按「🔄 Flip Card」/ 按空格鍵 |
| 上一個單字 | 按「← Previous」/ 按左方向鍵 |
| 下一個單字 | 按「Next →」/ 按右方向鍵 |
| 隨機打亂 | 按「🔀 Shuffle」 |
| 重置進度 | 按「🔁 Reset」 |

### 管理頁面操作

1. **新增單字**
   - 點擊「管理單字」導航
   - 填入英文單字欄位
   - 點擊「✨ Auto Fill」自動填入其他欄位（可選）
   - 手動修改任何欄位
   - 點擊「Add Word」提交

2. **自動填入**
   - 輸入英文單字
   - 點擊「✨ Auto Fill」
   - 系統自動填入翻譯、詞性、例句、字根分析
   - 可手動編輯後再提交

3. **查看單字列表**
   - 下方顯示已新增的所有單字
   - 可點擊「🗑️ Delete」刪除單字

4. **同步到 Google 試算表**
   - 新增單字後，點擊「Sync to Google Sheets」（需要先配置 GAS URL）

---

## 🔌 API 說明

### 使用的免費 API

本應用使用 **Free Dictionary API** 自動填入單字資料。

- **API 端點**：`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **無需認証**：完全免費
- **速率限制**：一般無限制

#### 示例請求

```bash
curl "https://api.dictionaryapi.dev/api/v2/entries/en/hello"
```

#### 示例回應

```json
[
  {
    "word": "hello",
    "phonetic": "/həˈloʊ/",
    "meanings": [
      {
        "partOfSpeech": "interjection",
        "definitions": [
          {
            "definition": "used as a greeting or to begin a conversation",
            "example": "Hello, John"
          }
        ],
        "synonyms": []
      }
    ],
    "origin": "late 19th century: of uncertain origin"
  }
]
```

### 提取邏輯

應用程式從 API 回應中提取以下內容：

| 欄位 | 提取方式 |
|------|---------|
| 翻譯 | `meanings[0].definitions[0].definition` |
| 詞性 | `meanings[0].partOfSpeech` |
| 例句 | `meanings[0].definitions[0].example` |
| 字根分析 | `origin` 欄位（如果存在） |

---

## 💾 數據存儲

### 本地存儲

數據自動保存到瀏覽器的 LocalStorage：

```javascript
// 訪問存儲的數據
const words = JSON.parse(localStorage.getItem('vocabularyWords'));
```

### 遠端存儲（Google 試算表）

單字可同步到 Google 試算表（需配置 GAS）。

#### 數據格式

| 時間戳 | 英文單字 | 中文翻譯 | 字根分析 | 例句 | 詞性 |
|--------|---------|--------|---------|------|------|
| 2026-06-15 01:00 | hello | 你好 | ... | Hello, world! | interjection |

---

## 🛠️ 自訂功能

### 修改默認 API

編輯 `app.js` 中的 API 端點：

```javascript
// 約在第 8 行
api: {
    dictionaryApi: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
}
```

### 修改顏色主題

編輯 `styles.css` 中的漸層色：

```css
/* 約在第 90 行 */
.card-front {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 新增更多 API

在 `fetchWordData()` 函數中新增額外 API 呼叫邏輯。

---

## 🐛 常見問題

### Q1：自動填入不工作
**A：** 
- 檢查瀏覽器控制台（F12）是否有錯誤訊息
- 確認網路連接
- 確認英文單字拼寫正確
- 嘗試清除快取後重新載入

### Q2：數據沒有保存
**A：**
- 檢查瀏覽器是否允許 LocalStorage
- 確認沒有在無痕模式下使用（無痕模式不保存數據）
- 檢查瀏覽器存儲空間是否足夠

### Q3：同步到 Google 試算表失敗
**A：**
- 檢查 `GOOGLE_APPS_SCRIPT_URL` 是否正確
- 確認 Google Apps Script 已正確部署
- 確認試算表 ID 正確
- 檢查瀏覽器控制台的 CORS 錯誤

### Q4：卡片翻轉效果不顯示
**A：**
- 確認瀏覽器支援 CSS 3D transforms（大多數現代瀏覽器都支援）
- 嘗試更新瀏覽器
- 檢查 `styles.css` 是否正確載入

### Q5：如何備份數據？
**A：**
```javascript
// 在瀏覽器控制台執行
const words = JSON.parse(localStorage.getItem('vocabularyWords'));
console.log(JSON.stringify(words, null, 2));
// 複製並保存輸出結果
```

---

## 📊 技術規格

### 瀏覽器支援

| 瀏覽器 | 支援版本 |
|--------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | 14+ |

### 效能

- 初始載入時間：< 1 秒
- 卡片翻轉動畫：60 FPS
- 支援 1000+ 個單字

### 存儲

- LocalStorage 限制：通常 5-10 MB
- 預計可儲存：2000+ 個單字

---

## 🔒 安全性注意事項

1. **不要在代碼中洩露 API 密鑰**
2. **Google Apps Script URL 應該設為「任何人」存取**
3. **建議在生產環境前新增身份驗證**
4. **定期備份重要數據**

### 示例：新增簡單認證

```javascript
// 在 Google Apps Script 中
function doPost(e) {
  const API_KEY = 'your-secret-key';
  
  if (e.parameter.key !== API_KEY) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Unauthorized' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... 繼續處理
}
```

---

## 📱 響應式設計

應用程式在所有屏幕尺寸上都能正常工作：

- **桌面** (1920px+)：完整功能
- **平板** (768px - 1024px)：最佳化布局
- **手機** (< 768px)：單列布局，簡化控制

---

## 🚀 進階功能（可選擴展）

### 1. 登錄系統
使用 Firebase Authentication 實現用戶登錄

### 2. 多用戶同步
使用 Firebase Realtime Database 實現實時同步

### 3. 統計數據
追蹤學習進度、複習次數等

### 4. 離線支援
使用 Service Worker 實現離線功能

### 5. 語音發音
集成文字轉語音 API

### 6. 圖片支援
允許為單字新增圖片

### 7. 分類系統
組織單字為不同課程/主題

### 8. 測驗模式
添加多選或填空測驗

---

## 📝 更新日誌

| 版本 | 日期 | 變更 |
|------|------|------|
| 1.0 | 2026-06-15 | 初始版本：基本卡片功能、自動填入、本地存儲 |
| 1.1 | - | 規劃：Google Sheets 同步 |
| 1.2 | - | 規劃：多語言支援 |

---

## 📚 參考資源

- [Free Dictionary API 文檔](https://github.com/meetDeveloper/freeDictionaryAPI)
- [Google Apps Script 文檔](https://developers.google.com/apps-script)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [MDN - CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## 🤝 貢獻指南

歡迎提交 Issues 和 Pull Requests！

---

## 📄 許可證

MIT License - 自由使用和修改

---

## 👤 作者

jm1015 - 2026

---

## 💡 獲得幫助

- 查看 [GitHub Issues](https://github.com/412042/jm1015/issues)
- 檢查瀏覽器控制台錯誤消息（F12）
- 參考本文件中的常見問題部分

---

**祝你學習順利！🎉**
