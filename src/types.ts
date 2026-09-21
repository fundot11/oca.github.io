/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IdentityType = '中央' | '地方' | '民間';
export type TrainingType = '油污染訓' | '化學訓';
export type TrainingLevel = 'L1' | 'L2' | 'L3';
export type QualificationStatus = '有效' | '待複訓' | '已過期';
export type GenderType = '男' | '女';
export type LocationType = '國內' | '國外';
export type OverseasCategory = 'CEDRE' | 'MDPC' | '其他';

export interface TrainingSession {
  id: string;
  startDate: string;   // 受訓開始日 YYYY-MM-DD
  endDate: string;     // 受訓結束日 YYYY-MM-DD
  reTrainDate: string; // 回訓日 YYYY-MM-DD (自動推算為 endDate + 3年)
  locationType?: LocationType;         // 受訓地點: 國內 / 國外 (預設為國內)
  overseasCategory?: OverseasCategory; // 國外訓別子分類: CEDRE / MDPC / 其他
  overseasNote?: string;               // 國外訓別「其他」之手動輸入說明
  note?: string;       // 備註 / 訓期說明，例如：初訓、第一次回訓、第二次回訓
}

export interface Responder {
  id: number;
  year: string; // 113, 114, 115
  type: TrainingType;
  level: TrainingLevel;
  ident: IdentityType;
  org: string;     // 機關名稱
  unit: string;    // 單位名稱
  name: string;    // 姓名
  gender?: GenderType; // 性別: 男 / 女
  title: string;   // 職稱
  primaryEmail?: string;   // 主要信箱帳號 (公司帳號)
  secondaryEmail?: string; // 備用信箱帳號 (非公司之外部帳號)
  status?: QualificationStatus;
  locationType?: LocationType;         // 受訓地點: 國內 / 國外 (預設為國內)
  overseasCategory?: OverseasCategory; // 國外訓別子分類: CEDRE / MDPC / 其他
  overseasNote?: string;               // 國外訓別「其他」之手動輸入說明
  trainStartDate?: string; // 受訓開始日 YYYY-MM-DD
  trainEndDate?: string;   // 受訓結束日 YYYY-MM-DD
  reTrainDate?: string;    // 回訓日 YYYY-MM-DD (單一日期，自動計算為受訓結束日 + 3年)
  trainingSessions?: TrainingSession[]; // 歷次受訓與回訓紀錄列表
  trainDate?: string;      // 舊相容欄位 YYYY-MM-DD
  expireDate?: string;     // 舊相容欄位 YYYY-MM-DD
}

export interface FilterCriteria {
  year: string;
  type: string;
  level: string;
  ident: string;
  genders: string[];
  locations: string[]; // ['國內', 'CEDRE', 'MDPC', '其他']
  status: string;
  keyword: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'danger';
}
