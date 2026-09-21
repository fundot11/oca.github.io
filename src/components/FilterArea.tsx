import React from 'react';
import { Search } from 'lucide-react';
import { FilterCriteria } from '../types';

interface FilterAreaProps {
  criteria: FilterCriteria;
  onChange: (key: keyof FilterCriteria, value: string) => void;
  onReset: () => void;
  onSearch: () => void;
}

export default function FilterArea({ criteria, onChange, onReset, onSearch }: FilterAreaProps) {
  const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-slate-50 border-b border-gray-200 px-4 py-3" id="filter-area-form">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-3.5 bg-[#e07820] rounded-xs" />
          篩選條件：
        </span>

        {/* Year Dropdown */}
        <div className="flex items-center gap-1">
          <select
            value={criteria.year}
            onChange={(e) => onChange('year', e.target.value)}
            className="text-xs font-medium border border-gray-300 rounded bg-white px-2 py-1.5 h-8 text-slate-700 outline-none focus:border-[#29abe2] focus:ring-1 focus:ring-sky-100 transition-all cursor-pointer min-w-[90px]"
            id="filter-year-select"
          >
            <option value="">全部年度</option>
            <option value="115">115年度</option>
            <option value="114">114年度</option>
            <option value="113">113年度</option>
          </select>
        </div>

        {/* Training Type Dropdown */}
        <div className="flex items-center gap-1">
          <select
            value={criteria.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="text-xs font-medium border border-gray-300 rounded bg-white px-2 py-1.5 h-8 text-slate-700 outline-none focus:border-[#29abe2] focus:ring-1 focus:ring-sky-100 transition-all cursor-pointer min-w-[100px]"
            id="filter-type-select"
          >
            <option value="">全部類別</option>
            <option value="油污染訓">油污染訓</option>
            <option value="化學訓">化學訓</option>
          </select>
        </div>

        {/* Training Level Dropdown */}
        <div className="flex items-center gap-1">
          <select
            value={criteria.level}
            onChange={(e) => onChange('level', e.target.value)}
            className="text-xs font-medium border border-gray-300 rounded bg-white px-2 py-1.5 h-8 text-slate-700 outline-none focus:border-[#29abe2] focus:ring-1 focus:ring-sky-100 transition-all cursor-pointer min-w-[110px]"
            id="filter-level-select"
          >
            <option value="">全部等級</option>
            <option value="L1">L1 通識級</option>
            <option value="L2">L2 操作級</option>
            <option value="L3">L3 指揮級</option>
          </select>
        </div>

        {/* Identity Dropdown */}
        <div className="flex items-center gap-1">
          <select
            value={criteria.ident}
            onChange={(e) => onChange('ident', e.target.value)}
            className="text-xs font-medium border border-gray-300 rounded bg-white px-2 py-1.5 h-8 text-slate-700 outline-none focus:border-[#29abe2] focus:ring-1 focus:ring-sky-100 transition-all cursor-pointer min-w-[110px]"
            id="filter-ident-select"
          >
            <option value="">全部身分</option>
            <option value="中央">中央機關</option>
            <option value="地方">地方政府</option>
            <option value="民間">民間單位</option>
          </select>
        </div>

        {/* Qualification Status Dropdown */}
        <div className="flex items-center gap-1">
          <select
            value={criteria.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="text-xs font-medium border border-gray-300 rounded bg-white px-2 py-1.5 h-8 text-slate-700 outline-none focus:border-[#29abe2] focus:ring-1 focus:ring-sky-100 transition-all cursor-pointer min-w-[100px]"
            id="filter-status-select"
          >
            <option value="">全部狀態</option>
            <option value="有效">有效</option>
            <option value="待複訓">待複訓</option>
            <option value="已過期">已過期</option>
          </select>
        </div>

        {/* Keyword Text Field */}
        <div className="flex items-center gap-1 flex-1 min-w-[150px]">
          <input
            type="text"
            value={criteria.keyword}
            onChange={(e) => onChange('keyword', e.target.value)}
            onKeyDown={handleKeydown}
            placeholder="搜尋機關、單位或姓名..."
            className="text-xs font-medium border border-gray-300 rounded bg-white px-2.5 py-1.5 h-8 text-slate-700 outline-none focus:border-[#29abe2] focus:ring-1 focus:ring-sky-100 transition-all w-full placeholder-gray-400"
            id="filter-keyword-input"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSearch}
            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#29abe2] hover:bg-[#1d90c5] px-4 py-1.5 h-8 rounded shadow-xs focus:outline-none transition-all cursor-pointer"
            id="search-btn"
          >
            <Search className="w-3.5 h-3.5" />
            搜尋
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center text-xs font-bold text-slate-600 bg-white border border-gray-300 hover:bg-gray-50 px-3.5 py-1.5 h-8 rounded shadow-xs focus:outline-none transition-all cursor-pointer"
            id="reset-btn"
          >
            重設
          </button>
        </div>
      </div>
    </div>
  );
}
