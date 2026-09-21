import { Plus, Edit3, Trash2, Upload, Download, FileSpreadsheet } from 'lucide-react';

interface ControlToolbarProps {
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onDownloadTemplate: () => void;
  hasSelection: boolean;
  selectedName: string | null;
}

export default function ControlToolbar({
  onAdd,
  onEdit,
  onDelete,
  onImportClick,
  onExportClick,
  onDownloadTemplate,
  hasSelection,
  selectedName
}: ControlToolbarProps) {
  return (
    <div className="border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-2 bg-white" id="control-toolbar">
      {/* CRUD Action Buttons */}
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#29abe2] hover:bg-[#1d90c5] px-3 py-1.5 h-8 rounded shadow-xs transition-colors cursor-pointer"
        id="toolbar-add-btn"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        新增人員
      </button>

      <button
        onClick={onEdit}
        disabled={!hasSelection}
        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 h-8 rounded border transition-all cursor-pointer ${
          hasSelection
            ? 'bg-white border-[#29abe2] text-[#29abe2] hover:bg-sky-50'
            : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        id="toolbar-edit-btn"
      >
        <Edit3 className="w-3.5 h-3.5" />
        編輯
      </button>

      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 h-8 rounded border transition-all cursor-pointer ${
          hasSelection
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100/70'
            : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        id="toolbar-delete-btn"
      >
        <Trash2 className="w-3.5 h-3.5" />
        刪除
      </button>

      <div className="w-[1px] h-5 bg-gray-200 mx-1.5 hidden sm:block" />

      {/* CSV Actions */}
      <button
        onClick={onImportClick}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 h-8 rounded shadow-xs transition-colors cursor-pointer"
        id="toolbar-import-btn"
      >
        <Upload className="w-3.5 h-3.5" />
        匯入 CSV
      </button>

      <button
        onClick={onExportClick}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 h-8 rounded shadow-xs transition-colors cursor-pointer"
        id="toolbar-export-btn"
      >
        <Download className="w-3.5 h-3.5" />
        匯出 CSV
      </button>

      <button
        onClick={onDownloadTemplate}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 h-8 rounded shadow-xs transition-colors cursor-pointer"
        id="toolbar-template-btn"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        下載範本
      </button>

      {/* Selected Indicator */}
      {hasSelection && (
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[#29abe2] font-semibold bg-sky-50 px-2.5 py-1 rounded border border-sky-100" id="selection-indicator">
          <span className="w-1.5 h-1.5 bg-[#29abe2] rounded-full animate-pulse" />
          <span>已選取人員：{selectedName}</span>
        </div>
      )}
    </div>
  );
}
