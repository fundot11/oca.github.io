# 海洋委員會海洋保育署 — 受訓人員清冊管理系統
## 軟體開發技術規格書 (System Technical Specification)
> **版本：** 1.1 (PM 稽查精進版 — 專防開發偷懶與防呆設計)  
> **制定日期：** 民國 115 年 6 月  
> **適用對象：** 全端工程師 (RD) / 系統架構師 (Architect)

---

## 1　系統概述與目標
本系統為海洋委員會海洋保育署建置之「受訓人員清冊管理系統」，用於追蹤、彙整與管理「油污染訓」與「化學訓」兩大範疇受訓人員。
為防範系統上線後因工程師「實作省力」而導致資料錯亂、垃圾資料、防呆失效等維護惡夢，本規格書特別在**資料庫約束、批次匯入驗證、防重複機制、與資料稽核軌跡**上加入強制實作規範，承商開發團隊必須對照本規格書逐項落實，不可自行刪減。

---

## 2　資料庫 Schema 與防呆約束 (Anti-Slack DB Design)
原 1.0 版資料庫漏失了防止重複寫入、缺乏完整的修改稽核與防毒防呆，現於 1.1 版全面補正。

### 2.1 人員清冊主表（`roster_person`）擴充欄位與約束
| 欄位名稱 | 資料型別 | 限制條件 | 說明與防呆機制 |
| :--- | :--- | :--- | :--- |
| **person_id** | `INT` | `PK, IDENTITY(1,1)` | 系統自增流水號 |
| **year** | `SMALLINT` | `NOT NULL` | 受訓年度（民國年，如 115） |
| **train_type** | `NVARCHAR(20)`| `NOT NULL` | 僅限限制值：`油污染訓`、`化學訓` |
| **train_level** | `CHAR(2)` | `NOT NULL` | 僅限限制值：`L1`、`L2`、`L3` |
| **identity_type**| `NVARCHAR(10)`| `NOT NULL` | 僅限限制值：`中央`、`地方`、`民間` |
| **org_name** | `NVARCHAR(100)`| `NOT NULL` | 機關/代表單位名稱（**系統寫入API時必須自動執行 Trim() 清除前後空白**） |
| **unit_name** | `NVARCHAR(100)`| `NULL` | 單位或處室名稱（**系統寫入API時自動執行 Trim()**） |
| **person_name** | `NVARCHAR(50)` | `NOT NULL` | 姓名（**禁止輸入中英文以外之特殊字元，自動 Trim()**） |
| **title** | `NVARCHAR(50)` | `NULL` | 職稱（如：署長、少將副司長、科員） |
| **train_date** | `DATE` | `NULL` | 受訓開始日期 |
| **expire_date** | `DATE` | `NULL` | 受訓失效日期（**商業邏輯校驗：expire_date 必須大於 train_date，且系統後端有邏輯檢查其有效性：有效、待複訓、已過期**） |
| **row_version** | `ROWVERSION` | `NOT NULL` | **【防止覆蓋防呆】** SQL Server 封裝計數戳記。用於實作**樂觀鎖 (Optimistic Concurrency Control)**，防止多位管理員同時編輯同一筆資料時發生相互覆蓋。 |
| **created_at** | `DATETIME2` | `DEFAULT GETDATE()`| 建立時間 |
| **created_by** | `NVARCHAR(50)` | `NULL` | 建立人員帳號（若使用 AD / JWT 登入，必須確實記錄） |
| **updated_at** | `DATETIME2` | `DEFAULT GETDATE()`| 最後更新時間 |
| **updated_by** | `NVARCHAR(50)` | `NULL` | **【增設】** 最後更新者帳號（**不允許空值，強迫 RD 實作 Session 或 JWT 紀錄追蹤**）|
| **deleted_at** | `DATETIME2` | `NULL` | 軟刪除時間 |
| **deleted_by** | `NVARCHAR(50)` | `NULL` | **【增設】** 執行刪除之人員帳號 |
| **is_deleted** | `BIT` | `NOT NULL DEFAULT 0`| 軟刪除旗標；`0` 為正常，`1` 為已刪除 |

### 2.2 強制防重複與索引限制 (Strict Constraints)
RD 經常忽略重複按鈕點擊或重複上傳導致資料異常，本版本指定建立以下**複合唯一索引**：
```sql
-- 1. 建立軟刪除之過濾唯一性索引：若同一年度、同姓名、同機關、同訓練類別的記錄未被軟刪除，則禁止重複寫入！
-- (此約束能完全阻斷 RD 偷懶不做後端查重，直接塞入垃圾髒資料的情況)
CREATE UNIQUE INDEX UX_roster_person_prevent_duplicate 
    ON [dbo].[roster_person] ([year], [org_name], [person_name], [train_type], [train_level]) 
    WHERE [is_deleted] = 0;

-- 2. 建立常用查詢的高效欄位組合索引
CREATE INDEX IX_roster_search_compound
    ON [dbo].[roster_person] ([year], [train_type], [train_level], [identity_type])
    WHERE [is_deleted] = 0;
```

---

## 3　API 規格精進與防呆規則 (API Fail-Safe Design)

為了讓前後端驗證不脫節，所有 API 必須強制回傳標準包裝格式，且後端必須進行 strict validation。

### 3.1 基礎防呆中介層 (Validation Middleware)
1. **輸入值不允許前後空白：** 
   - 後端專案必須針對 `POST /roster/persons` 及 `PUT /roster/persons/{id}` 註冊一個全域 Middleware。只要是 `string` 屬性，在 Bind Model 時後端自動執行 `.Trim()` 處理，不可讓資料庫存入帶尾隨空白字元的髒字串。
2. **級群交叉防呆 (Grade Cross Validation)：**
   - 經核對本屆 (115年) 受訓名單特修人員多達 26 筆（含工作人員、隨團翻譯及機關精英），身分別應與其主責機關一致，如：
     - `身分別：中央` → 其 `org_name` 必須包含 `海洋委員會`、`國防部`、`環境部`、`內政部`、`經濟部`、`交通部`、`農業部`、`國立高雄科技大學` 等關鍵字。
     - `身分別：地方` → 其 `org_name` 必須包含 `政府` 或 `環境保護局`（如：宜蘭縣環境保護局、臺南市政府環境保護局）。
     - 後端若偵測到當 `identity_type` 為 `地方`，但 `org_name` 卻輸入 `海洋委員會`，後端 API 必須主動阻斷，並回傳 `VALIDATION_ERROR` 錯誤碼，禁止低級人為選誤。

### 3.2 標準回傳包裝
所有 API 一律回傳以下一致性格式，**RD 不可自創自訂回傳結構**：
```json
{
  "success": true,
  "data": {},
  "message": "描述字串",
  "errorCode": "驗證失敗或錯誤代碼"
}
```

---

## 4　CSV 批次上傳規格 (Anti-Skipping CSV Engine)
> **重要警告：這是 RD 最容易省略「預覽診斷」直接暴力匯入的模組！**
> 本規格強制採取「雙階段預覽認證」制度：上傳 CSV → 回傳逐列診斷報告（不寫入 DB） → 管理員確認預覽無誤點擊確定 → 啟動 DB 資料庫交易批次寫入（任一列出錯則 Rollback 全案回滾）。

### 4.1 CSV 格式與預驗證規則
- **編碼：** 強制要求 `UTF-8 with BOM` 編碼，避免在 Excel 中顯示中文字亂碼。
- **欄位格式校驗：**
  - **年度：** 必須為大於 100 且小於 130 之間之整數
  - **訓練類別：** 僅能是「油污染訓」、「化學訓」才核可
  - **訓練等級：** 僅能是「L1」、「L2」、「L3」（中文如「L1 通識級」在後端應自動 parses 為對應 Enum 代碼）
  - **身分別：** 僅能是「中央」、「地方」、「民間」

### 4.2 POST `/api/v1/roster/import` (階段 1：上傳診斷 API)
後端接收到檔案後，**絕對禁止**立即存檔，必須逐列（Row-by-Row）進行 TryParse 與 Validate，並回傳如下詳細逐列診斷結果：

#### 診斷回傳範例 (Response)：
```json
{
  "success": true,
  "data": {
    "importSessionId": "UUID_A1B2C3D4",
    "totalCount": 26,
    "validCount": 24,
    "invalidCount": 2,
    "previewItems": [
      {
        "rowNumber": 1,
        "name": "陸曉筠",
        "org": "海洋委員會海洋保育署",
        "isValid": true,
        "errorMessage": null
      },
      {
        "rowNumber": 11,
        "name": "劉黎涵",
        "org": "經濟部觀塘工業專用港管理小組",
        "isValid": false,
        "errorMessage": "【訓練等級欄位無效】僅可輸入 L1/L2/L3 代碼，不可為空白"
      },
      {
        "rowNumber": 22,
        "name": "孫廷宇",
        "org": "國立高雄科技大學",
        "isValid": true,
        "errorMessage": null
      }
    ]
  },
  "message": "試解析診斷完成，發現 2 筆規格不符之異常記錄，請參照提示修正後重新匯入。"
}
```
*註：這份診斷回報格式強制規定了 `rowNumber` 與 `errorMessage`，RD 必須據此在前端網頁中將錯誤行「染成紅色」警示管理員，拒絕讓一知半解的維運人員上傳錯誤格式。*

### 4.3 POST `/api/v1/roster/import/confirm` (階段 2：交易確認 API)
當管理員在確認預覽介面看到零錯誤或勾選「略過異常，排除並僅匯入有效記錄」後，傳送 `importSessionId` 呼叫此端點。
- **後端必須開啟 SQL Transaction**。
- 寫入過程如遇不可抗力、網路中斷或唯一索引衝突（如 2.2 所述之 `UX_roster_person_prevent_duplicate`），必須立刻執行 **Rollback**。整個 API 回傳：
```json
{
  "success": false,
  "data": null,
  "message": "批次寫入遭遇衝突，可能因重複匯入相同年度、姓名及單位的受訓名冊。寫入動作已自動全案還原(Rollback)。",
  "errorCode": "IMPORT_PARTIAL_FAIL"
}
```

---

## 5　核心業務邏輯與 GIS (GIS Boundaries and Rules)
系統中附帶 GeoServer / PostgreSQL 地圖，是為呈現全台各受訓學員所屬「縣市分布與動態足跡統計」。

### 5.1 GIS 地空間資料同步任務 (PostgreSQL Sync)
- 為防止 RD 忘記更新 GIS 資料，本系統規範：只要使用端點對受訓人數、所屬縣市進行新增、修改、軟刪除時，後端必須同步使用微服務 / EF 整合觸發器（Trigger 或 SaveChanges 重寫），即時更新 PostgreSQL `roster_location` 縣市幾何表中的受訓總人數計數（`responder_count`）。
- **嚴厲禁止偷懶：** 不容許採用「定時排程 (Chrome Task)」於深夜才累計，地圖的人數數據必須是**毫秒級即時更新**，讓長官點選縣市時，人數即刻完美吻合主表。

---

## 6　錯誤代碼防範總覽 (Defense Coding HTTP Mapping)
必須強制將以下例外狀態 (Exceptions) 捕捉並正確傳遞：
1. **`DUPLICATE_ENTRY` (409 Conflict):** 當資料庫拋出 `UX_roster_person_prevent_duplicate` 複合唯一鍵衝突時，後端必須捕捉此例外，並轉譯為 readable 提示：「該學員已登錄於此年度 training 名冊中，無需重複建檔。」
2. **`CONCURRENCY_ERROR` (412 Precondition Failed):** 樂觀鎖（樂觀併發約束）失效。若資料已被其他同事搶先修改成功，後端透過 `row_version` 比對時會拋出此錯誤，應退回並提示：「該筆受訓資料已被其他專員更動，請刷頁重新編輯。」

---
*海洋委員會海洋保育署專案管理暨品質管制小組 — 對對本系統之開發準則無上堅持*
