/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Eye,
  Trash2, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  CheckCircle,
  HelpCircle,
  Waves, 
  Wrench, 
  ClipboardList, 
  TrendingUp, 
  Home,
  Mail,
  AtSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';
import { Responder, FilterCriteria, ToastMessage, IdentityType, TrainingType, TrainingLevel, QualificationStatus, GenderType, TrainingSession, LocationType, OverseasCategory } from './types';
import { INITIAL_RESPONDERS } from './data/initialRecords';
import { 
  getTrainStartDate, 
  getTrainEndDate, 
  getReTrainDate, 
  formatTrainingPeriod, 
  calculateRetrainDate,
  isReTrainDue,
  toRocDate,
  getTrainingSessions,
  getLatestSession,
  getLatestLocationType,
  getLatestOverseasCategory,
  getLatestOverseasNote
} from './utils/dateUtils';

// Preset configuration for data consistency under Edit/Add rosters
const CENTRAL_ORGS = [
  '海洋委員會海洋保育署',
  '海洋委員會海巡署',
  '國防部資源規劃司',
  '環境部化學物質管理署',
  '內政部國家公園署',
  '經濟部觀塘工業專用港管理小組',
  '交通部航港局',
  '農業部漁業署'
];

const LOCAL_ORGS = [
  '宜蘭縣政府環境保護局',
  '臺南市政府環境保護局',
  '花蓮縣環境保護局',
  '臺東縣環境保護局',
  '金門縣環境保護局',
  '連江縣環境資源局'
];

const PRIVATE_ORGS = [
  '國立高雄科技大學',
  '永康船舶股份有限公司'
];

const getPresetOrgs = (ident: IdentityType): string[] => {
  if (ident === '中央') return CENTRAL_ORGS;
  if (ident === '地方') return LOCAL_ORGS;
  return PRIVATE_ORGS;
};

const getPresetUnits = (org: string): string[] => {
  if (org === '海洋委員會海巡署') {
    return ['艦隊分署', '金馬澎分署', '教育訓練測考中心', '無特定單位'];
  }
  if (org === '國立高雄科技大學') {
    return ['南區毒災應變諮詢中心', '環境與安全衛生工程系', '無特定單位'];
  }
  if (org.includes('環境保護局') || org.includes('環境資源局') || org === '宜蘭縣政府環境保護局') {
    return ['無特定單位', '技士', '約用人員', '空氣噪音防制科', '水質保護科'];
  }
  return ['無特定單位'];
};

const PRESET_TITLES = [
  '署長',
  '副司長',
  '專門委員',
  '科長',
  '股長',
  '科員',
  '教官',
  '技士',
  '隊長',
  '稽查員',
  '約用人員',
  '專任助理',
  '資深經理',
  '副教授',
  '特聘教授',
  '經理',
  '秘書',
  '簡任視察'
];

interface RocDateInputProps {
  value: string;
  onChange: (isoDateStr: string) => void;
  className?: string;
  placeholder?: string;
}

function RocDateInput({ value, onChange, className = '', placeholder = '例如：114.05.14' }: RocDateInputProps) {
  const rocDisplay = useMemo(() => {
    if (!value) return '';
    return toRocDate(value);
  }, [value]);

  const [displayValue, setDisplayValue] = useState(rocDisplay);

  useEffect(() => {
    setDisplayValue(rocDisplay);
  }, [rocDisplay]);

  const parseToIso = (text: string): string => {
    if (!text) return '';
    const cleaned = text.trim().replace(/\//g, '.').replace(/-/g, '.');
    const parts = cleaned.split('.');
    if (parts.length === 3) {
      let y = parseInt(parts[0], 10);
      const m = String(parseInt(parts[1], 10)).padStart(2, '0');
      const d = String(parseInt(parts[2], 10)).padStart(2, '0');
      if (!isNaN(y) && !isNaN(parseInt(m, 10)) && !isNaN(parseInt(d, 10))) {
        if (y < 1900) y = y + 1911;
        return `${y}-${m}-${d}`;
      }
    }
    return text;
  };

  const hiddenDateRef = useRef<HTMLInputElement>(null);

  const isoForHiddenPicker = useMemo(() => {
    const parsed = parseToIso(value);
    if (parsed && parsed.length === 10) return parsed;
    return '';
  }, [value]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          setDisplayValue(raw);
          const iso = parseToIso(raw);
          if (iso && iso.length === 10) {
            onChange(iso);
          }
        }}
        onBlur={() => {
          const iso = parseToIso(displayValue);
          if (iso && iso.length === 10) {
            onChange(iso);
            setDisplayValue(toRocDate(iso));
          } else if (!displayValue.trim()) {
            onChange('');
            setDisplayValue('');
          }
        }}
        className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:border-[#E35D22] bg-white font-mono font-bold text-slate-800 pr-7"
      />
      <button
        type="button"
        onClick={() => {
          if (hiddenDateRef.current) {
            try {
              if (typeof hiddenDateRef.current.showPicker === 'function') {
                hiddenDateRef.current.showPicker();
              } else {
                hiddenDateRef.current.focus();
                hiddenDateRef.current.click();
              }
            } catch {
              hiddenDateRef.current.focus();
            }
          }
        }}
        className="absolute right-1 text-slate-400 hover:text-[#E35D22] p-1 cursor-pointer transition-colors"
        title="選擇日期"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>
      <input
        ref={hiddenDateRef}
        type="date"
        value={isoForHiddenPicker}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
            setDisplayValue(toRocDate(e.target.value));
          }
        }}
        className="sr-only absolute pointer-events-none opacity-0 w-0 h-0"
        tabIndex={-1}
      />
    </div>
  );
}

export default function App() {
  // --- Persistent Storage ---
  const [responders, setResponders] = useState<Responder[]>(() => {
    const saved = localStorage.getItem('em_responders_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse saved responders', err);
      }
    }
    return INITIAL_RESPONDERS;
  });

  useEffect(() => {
    localStorage.setItem('em_responders_v2', JSON.stringify(responders));
  }, [responders]);

  // --- Filter State ---
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    year: '115', // Default preset to 115 as specified
    type: '',
    level: '',
    ident: '',
    genders: ['男', '女'], // Default to both selected
    locations: ['國內', 'CEDRE', 'MDPC', '其他'], // Default all selected
    status: '',
    keyword: ''
  });

  // State applied during clicking "搜尋" or live updates
  const [appliedCriteria, setAppliedCriteria] = useState<FilterCriteria>({
    year: '115',
    type: '',
    level: '',
    ident: '',
    genders: ['男', '女'],
    locations: ['國內', 'CEDRE', 'MDPC', '其他'],
    status: '',
    keyword: ''
  });

  // Handle keyword live update vs action search button search:
  // To make it very responsive, we'll let selections filter instantly, while keyword can be processed by pressing Enter or clicking Search.
  const handleFilterSelectChange = (key: keyof FilterCriteria, value: string) => {
    const nextCriteria = { ...filterCriteria, [key]: value };
    setFilterCriteria(nextCriteria);
    // Instant update for select fields to feel smooth
    setAppliedCriteria(prev => ({ ...prev, [key]: value }));
  };

  const handleGenderToggle = (genderVal: '男' | '女') => {
    setAppliedCriteria(prev => {
      const current = prev.genders || ['男', '女'];
      let updated: string[];
      if (current.includes(genderVal)) {
        updated = current.filter(g => g !== genderVal);
        if (updated.length === 0) {
          updated = ['男', '女']; // Reset to both if all deselected
        }
      } else {
        updated = [...current, genderVal];
      }
      setFilterCriteria(f => ({ ...f, genders: updated }));
      setSelectedId(null);
      setPage(1);
      return { ...prev, genders: updated };
    });
  };

  const handleLocationToggle = (locKey: string) => {
    setAppliedCriteria(prev => {
      const current = prev.locations || ['國內', 'CEDRE', 'MDPC', '其他'];
      let updated: string[];
      if (current.includes(locKey)) {
        updated = current.filter(l => l !== locKey);
        if (updated.length === 0) {
          updated = ['國內', 'CEDRE', 'MDPC', '其他'];
        }
      } else {
        updated = [...current, locKey];
      }
      setFilterCriteria(f => ({ ...f, locations: updated }));
      setSelectedId(null);
      setPage(1);
      return { ...prev, locations: updated };
    });
  };

  const executeSearch = () => {
    setAppliedCriteria({ ...filterCriteria });
    setSelectedId(null);
    setPage(1);
    addToast('已套用篩選條件', 'success');
  };

  const handleTabChange = (typeVal: string) => {
    setFilterCriteria(prev => ({ ...prev, type: typeVal }));
    setAppliedCriteria(prev => ({ ...prev, type: typeVal }));
    setSelectedId(null);
    setPage(1);
  };

  const tabCounts = useMemo(() => {
    const baseList = responders.filter(r => {
      if (appliedCriteria.year && r.year !== appliedCriteria.year) return false;
      if (appliedCriteria.status && (r.status || '有效') !== appliedCriteria.status) return false;
      if (appliedCriteria.level && r.level !== appliedCriteria.level) return false;
      if (appliedCriteria.ident && r.ident !== appliedCriteria.ident) return false;
      if (appliedCriteria.genders && appliedCriteria.genders.length > 0 && appliedCriteria.genders.length < 2) {
        if (!appliedCriteria.genders.includes(r.gender || '男')) return false;
      }
      if (appliedCriteria.locations && appliedCriteria.locations.length > 0 && appliedCriteria.locations.length < 4) {
        const locType = getLatestLocationType(r);
        if (locType === '國內') {
          if (!appliedCriteria.locations.includes('國內')) return false;
        } else {
          const cat = getLatestOverseasCategory(r) || '其他';
          if (!appliedCriteria.locations.includes(cat)) return false;
        }
      }
      if (appliedCriteria.keyword.trim()) {
        const kw = appliedCriteria.keyword.trim().toLowerCase();
        const orgMatch = r.org ? r.org.toLowerCase().includes(kw) : false;
        const unitMatch = r.unit ? r.unit.toLowerCase().includes(kw) : false;
        const nameMatch = r.name ? r.name.toLowerCase().includes(kw) : false;
        const titleMatch = r.title ? r.title.toLowerCase().includes(kw) : false;
        const primaryEmailMatch = r.primaryEmail ? r.primaryEmail.toLowerCase().includes(kw) : false;
        const secondaryEmailMatch = r.secondaryEmail ? r.secondaryEmail.toLowerCase().includes(kw) : false;
        if (!orgMatch && !unitMatch && !nameMatch && !titleMatch && !primaryEmailMatch && !secondaryEmailMatch) return false;
      }
      return true;
    });

    return {
      all: baseList.length,
      oil: baseList.filter(r => r.type === '油污染訓').length,
      chem: baseList.filter(r => r.type === '化學訓').length,
    };
  }, [responders, appliedCriteria]);

  const handleResetFilter = () => {
    const defaultFilter = {
      year: '115', // Clears all filters and restores default year
      type: '',
      level: '',
      ident: '',
      genders: ['男', '女'],
      locations: ['國內', 'CEDRE', 'MDPC', '其他'],
      status: '',
      keyword: ''
    };
    setFilterCriteria(defaultFilter);
    setAppliedCriteria(defaultFilter);
    setSelectedId(null);
    setPage(1);
    addToast('篩選條件已重設', 'success');
  };

  // --- Filtering Evaluation ---
  const filteredResponders = useMemo(() => {
    return responders.filter(r => {
      // Year check
      if (appliedCriteria.year && r.year !== appliedCriteria.year) {
        return false;
      }
      // Training Type check
      if (appliedCriteria.type && r.type !== appliedCriteria.type) {
        return false;
      }
      // Qualification Status check
      if (appliedCriteria.status && (r.status || '有效') !== appliedCriteria.status) {
        return false;
      }
      // Training Level check
      if (appliedCriteria.level && r.level !== appliedCriteria.level) {
        return false;
      }
      // Identity check
      if (appliedCriteria.ident && r.ident !== appliedCriteria.ident) {
        return false;
      }
      // Gender check (multi-select)
      if (appliedCriteria.genders && appliedCriteria.genders.length > 0 && appliedCriteria.genders.length < 2) {
        if (!appliedCriteria.genders.includes(r.gender || '男')) {
          return false;
        }
      }
      // Location check (multi-select filter)
      if (appliedCriteria.locations && appliedCriteria.locations.length > 0 && appliedCriteria.locations.length < 4) {
        const locType = getLatestLocationType(r);
        if (locType === '國內') {
          if (!appliedCriteria.locations.includes('國內')) return false;
        } else {
          const cat = getLatestOverseasCategory(r) || '其他';
          if (!appliedCriteria.locations.includes(cat)) return false;
        }
      }
      // Keyword check (matches org, unit, name, title, primaryEmail, secondaryEmail)
      if (appliedCriteria.keyword.trim()) {
        const kw = appliedCriteria.keyword.trim().toLowerCase();
        const orgMatch = r.org ? r.org.toLowerCase().includes(kw) : false;
        const unitMatch = r.unit ? r.unit.toLowerCase().includes(kw) : false;
        const nameMatch = r.name ? r.name.toLowerCase().includes(kw) : false;
        const titleMatch = r.title ? r.title.toLowerCase().includes(kw) : false;
        const primaryEmailMatch = r.primaryEmail ? r.primaryEmail.toLowerCase().includes(kw) : false;
        const secondaryEmailMatch = r.secondaryEmail ? r.secondaryEmail.toLowerCase().includes(kw) : false;
        if (!orgMatch && !unitMatch && !nameMatch && !titleMatch && !primaryEmailMatch && !secondaryEmailMatch) {
          return false;
        }
      }
      return true;
    });
  }, [responders, appliedCriteria]);

  // --- Real-time Stats ---
  const stats = useMemo(() => {
    const total = filteredResponders.length;
    const oil = filteredResponders.filter(r => r.type === '油污染訓').length;
    const chem = filteredResponders.filter(r => r.type === '化學訓').length;
    return { total, oil, chem };
  }, [filteredResponders]);

  // --- Sorting State ---
  type SortField = 'id' | 'ident' | 'org' | 'name' | 'title' | 'type' | 'level' | 'location' | 'trainStartDate' | 'reTrainDate';
  type SortOrder = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedResponders = useMemo(() => {
    if (!sortField) return filteredResponders;

    const list = [...filteredResponders];
    list.sort((a, b) => {
      let res = 0;
      switch (sortField) {
        case 'id':
          res = a.id - b.id;
          break;
        case 'ident':
          res = a.ident.localeCompare(b.ident, 'zh-TW');
          break;
        case 'org':
          res = (a.org + (a.unit || '')).localeCompare(b.org + (b.unit || ''), 'zh-TW');
          break;
        case 'name':
          res = a.name.localeCompare(b.name, 'zh-TW');
          break;
        case 'title':
          res = (a.title || '').localeCompare(b.title || '', 'zh-TW');
          break;
        case 'type':
          res = a.type.localeCompare(b.type, 'zh-TW');
          break;
        case 'level':
          res = a.level.localeCompare(b.level);
          break;
        case 'location': {
          const locA = getLatestLocationType(a) === '國外' ? `國外_${getLatestOverseasCategory(a) || ''}` : '國內';
          const locB = getLatestLocationType(b) === '國外' ? `國外_${getLatestOverseasCategory(b) || ''}` : '國內';
          res = locA.localeCompare(locB, 'zh-TW');
          break;
        }
        case 'trainStartDate':
          res = getTrainStartDate(a).localeCompare(getTrainStartDate(b));
          break;
        case 'reTrainDate':
          res = getReTrainDate(a).localeCompare(getReTrainDate(b));
          break;
      }
      return sortOrder === 'asc' ? res : -res;
    });
    return list;
  }, [filteredResponders, sortField, sortOrder]);

  // --- Table & Row Selection ---
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const paginatedResponders = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedResponders.slice(startIndex, startIndex + pageSize);
  }, [sortedResponders, page]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedResponders.length / pageSize));
  }, [sortedResponders]);

  const renderSortableHeader = (field: SortField, label: string, className: string = '') => {
    const isActive = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className={`p-2.5 border border-[#CCDCE6] font-semibold cursor-pointer select-none hover:bg-[#337ab7] transition-colors group ${className}`}
        title={`點擊依「${label}」進行${isActive ? (sortOrder === 'asc' ? '降冪' : '取消') : '升冪'}排序`}
      >
        <div className={`flex items-center gap-1 ${className.includes('text-left') ? 'justify-start' : 'justify-center'}`}>
          <span>{label}</span>
          <span className="shrink-0 transition-opacity">
            {isActive ? (
              sortOrder === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-amber-300 font-bold" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-amber-300 font-bold" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 text-white/50 group-hover:text-white" />
            )}
          </span>
        </div>
      </th>
    );
  };

  const selectedResponder = useMemo(() => {
    if (selectedId === null) return null;
    return responders.find(r => r.id === selectedId) || null;
  }, [selectedId, responders]);

  // --- Modals State ---
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete' | 'import' | 'view' | null>(null);
  
  // Handlers for Add/Edit Form fields in Modal
  const [formOrg, setFormOrg] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<GenderType>('男');
  const [formTitle, setFormTitle] = useState('');
  const [formPrimaryEmail, setFormPrimaryEmail] = useState('');
  const [formSecondaryEmail, setFormSecondaryEmail] = useState('');
  const [formIdent, setFormIdent] = useState<IdentityType>('中央');
  const [formType, setFormType] = useState<TrainingType>('油污染訓');
  const [formLevel, setFormLevel] = useState<TrainingLevel>('L1');
  const [formYear, setFormYear] = useState('115');
  const [formStatus, setFormStatus] = useState<QualificationStatus>('有效');
  const [formLocationType, setFormLocationType] = useState<LocationType>('國內');
  const [formOverseasCategory, setFormOverseasCategory] = useState<OverseasCategory>('CEDRE');
  const [formOverseasNote, setFormOverseasNote] = useState('');
  const [formSessions, setFormSessions] = useState<TrainingSession[]>([]);

  // Session Field change handler with auto-calculation of reTrainDate (endDate + 3 years)
  const handleSessionChange = (id: string, field: keyof TrainingSession, value: any) => {
    setFormSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === 'startDate') {
        let endToUse = updated.endDate;
        if (!updated.endDate || updated.endDate < value) {
          endToUse = value;
          updated.endDate = value;
        }
        if (endToUse) {
          updated.reTrainDate = calculateRetrainDate(endToUse);
        }
      } else if (field === 'endDate') {
        if (value) {
          updated.reTrainDate = calculateRetrainDate(value);
        }
      }
      return updated;
    }));
  };

  // Add a new training session entry to form
  const handleAddSession = () => {
    const count = formSessions.length;
    const lastSession = count > 0 ? formSessions[count - 1] : null;

    let nextStart = '';
    let nextEnd = '';
    let nextReTrain = '';

    if (lastSession && lastSession.reTrainDate) {
      nextStart = lastSession.reTrainDate;
      nextEnd = lastSession.reTrainDate;
      nextReTrain = calculateRetrainDate(nextEnd);
    } else {
      const today = new Date().toISOString().split('T')[0];
      nextStart = today;
      nextEnd = today;
      nextReTrain = calculateRetrainDate(today);
    }

    const noteLabel = count === 0 ? '初訓' : count === 1 ? '第 1 次複訓' : `第 ${count} 次複訓`;

    const newSession: TrainingSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      startDate: nextStart,
      endDate: nextEnd,
      reTrainDate: nextReTrain,
      locationType: lastSession?.locationType || formLocationType || '國內',
      overseasCategory: lastSession?.overseasCategory || formOverseasCategory || 'CEDRE',
      overseasNote: lastSession?.overseasNote || formOverseasNote || '',
      note: noteLabel
    };

    setFormSessions(prev => [...prev, newSession]);
  };

  // Remove a session entry
  const handleDeleteSession = (id: string) => {
    if (formSessions.length <= 1) {
      addToast('請至少保留一筆受訓紀錄', 'danger');
      return;
    }
    setFormSessions(prev => prev.filter(s => s.id !== id));
  };

  // --- Toast Messages ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextToastId = useRef(0);

  const addToast = (message: string, type: 'success' | 'danger') => {
    const id = `toast-${nextToastId.current++}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Pre-fill Add Form
  const openAddModal = () => {
    setFormOrg('海洋委員會海洋保育署');
    setFormUnit('無特定單位');
    setFormName('');
    setFormGender('男');
    setFormTitle('');
    setFormPrimaryEmail('');
    setFormSecondaryEmail('');
    setFormIdent('中央');
    setFormType('油污染訓');
    setFormLevel('L1');
    setFormYear('115');
    setFormStatus('有效');
    setFormLocationType('國內');
    setFormOverseasCategory('CEDRE');
    setFormOverseasNote('');
    
    const defaultSession: TrainingSession = {
      id: `sess-${Date.now()}`,
      startDate: '',
      endDate: '',
      reTrainDate: '',
      locationType: '國內',
      overseasCategory: 'CEDRE',
      overseasNote: '',
      note: '初訓'
    };
    setFormSessions([defaultSession]);
    setModalType('add');
  };

  // Pre-fill Edit Form
  const openEditModal = () => {
    if (!selectedResponder) return;
    setFormOrg(selectedResponder.org);
    setFormUnit(selectedResponder.unit);
    setFormName(selectedResponder.name);
    setFormGender(selectedResponder.gender || '男');
    setFormTitle(selectedResponder.title || '');
    setFormPrimaryEmail(selectedResponder.primaryEmail || '');
    setFormSecondaryEmail(selectedResponder.secondaryEmail || '');
    setFormIdent(selectedResponder.ident);
    setFormType(selectedResponder.type);
    setFormLevel(selectedResponder.level);
    setFormYear(selectedResponder.year);
    setFormStatus(selectedResponder.status || '有效');
    setFormLocationType(selectedResponder.locationType || '國內');
    setFormOverseasCategory(selectedResponder.overseasCategory || 'CEDRE');
    setFormOverseasNote(selectedResponder.overseasNote || '');
    
    const sessions = getTrainingSessions(selectedResponder);
    setFormSessions(sessions.length > 0 ? sessions : [{
      id: `sess-${Date.now()}`,
      startDate: getTrainStartDate(selectedResponder),
      endDate: getTrainEndDate(selectedResponder),
      reTrainDate: getReTrainDate(selectedResponder),
      note: '受訓紀錄'
    }]);
    setModalType('edit');
  };

  // Open View Detail Modal
  const openViewModal = (responder?: Responder) => {
    const target = responder || selectedResponder;
    if (!target) return;
    setSelectedId(target.id);
    setModalType('view');
  };

  // Save Add Resource
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrg.trim() || !formUnit.trim() || !formName.trim()) {
      addToast('請填寫機關名稱、單位名稱及姓名', 'danger');
      return;
    }

    for (const sess of formSessions) {
      if (sess.locationType === '國外' && sess.overseasCategory === '其他' && !sess.overseasNote?.trim()) {
        addToast('請輸入受訓紀錄中「國外訓練 - 其他」之說明內容', 'danger');
        return;
      }
    }

    const sortedSessions = [...formSessions].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const latestSession = sortedSessions.length > 0 ? sortedSessions[sortedSessions.length - 1] : null;

    const effectiveLocType = latestSession?.locationType || formLocationType || '國內';
    const effectiveOverseasCategory = effectiveLocType === '國外' ? (latestSession?.overseasCategory || formOverseasCategory) : undefined;
    const effectiveOverseasNote = (effectiveLocType === '國外' && effectiveOverseasCategory === '其他') ? (latestSession?.overseasNote || formOverseasNote) : undefined;

    const newResponder: Responder = {
      id: Date.now() + Math.floor(Math.random() * 100),
      org: formOrg.trim(),
      unit: formUnit.trim(),
      name: formName.trim(),
      gender: formGender,
      title: formTitle.trim(),
      primaryEmail: formPrimaryEmail.trim() || undefined,
      secondaryEmail: formSecondaryEmail.trim() || undefined,
      ident: formIdent,
      type: formType,
      level: formLevel,
      year: formYear,
      status: formStatus,
      locationType: effectiveLocType,
      overseasCategory: effectiveOverseasCategory,
      overseasNote: effectiveOverseasNote,
      trainStartDate: latestSession?.startDate || undefined,
      trainEndDate: latestSession?.endDate || undefined,
      reTrainDate: latestSession?.reTrainDate || undefined,
      trainingSessions: sortedSessions
    };

    setResponders(prev => [newResponder, ...prev]);
    setModalType(null);
    addToast('新增成功', 'success');
    
    // Automatically set applied status/criteria to view new entry if needed
    setPage(1);
  };

  // Save Edit Resource
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    if (!formOrg.trim() || !formUnit.trim() || !formName.trim()) {
      addToast('請填寫機關名稱、單位名稱及姓名', 'danger');
      return;
    }

    for (const sess of formSessions) {
      if (sess.locationType === '國外' && sess.overseasCategory === '其他' && !sess.overseasNote?.trim()) {
        addToast('請輸入受訓紀錄中「國外訓練 - 其他」之說明內容', 'danger');
        return;
      }
    }

    const sortedSessions = [...formSessions].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const latestSession = sortedSessions.length > 0 ? sortedSessions[sortedSessions.length - 1] : null;

    const effectiveLocType = latestSession?.locationType || formLocationType || '國內';
    const effectiveOverseasCategory = effectiveLocType === '國外' ? (latestSession?.overseasCategory || formOverseasCategory) : undefined;
    const effectiveOverseasNote = (effectiveLocType === '國外' && effectiveOverseasCategory === '其他') ? (latestSession?.overseasNote || formOverseasNote) : undefined;

    setResponders(prev => prev.map(r => {
      if (r.id === selectedId) {
        return {
          ...r,
          org: formOrg.trim(),
          unit: formUnit.trim(),
          name: formName.trim(),
          gender: formGender,
          title: formTitle.trim(),
          primaryEmail: formPrimaryEmail.trim() || undefined,
          secondaryEmail: formSecondaryEmail.trim() || undefined,
          ident: formIdent,
          type: formType,
          level: formLevel,
          year: formYear,
          status: formStatus,
          locationType: effectiveLocType,
          overseasCategory: effectiveOverseasCategory,
          overseasNote: effectiveOverseasNote,
          trainStartDate: latestSession?.startDate || undefined,
          trainEndDate: latestSession?.endDate || undefined,
          reTrainDate: latestSession?.reTrainDate || undefined,
          trainingSessions: sortedSessions
        };
      }
      return r;
    }));

    setModalType(null);
    addToast('儲存成功', 'success');
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (selectedId === null) return;
    setResponders(prev => prev.filter(r => r.id !== selectedId));
    setSelectedId(null);
    setModalType(null);
    addToast('已刪除', 'success');
  };

  // --- CSV Export Handler ---
  const handleExportCSV = () => {
    if (filteredResponders.length === 0) {
      addToast('無符合目前條件之資料可供匯出', 'danger');
      return;
    }

    const headers = ['年度', '訓練類別', '訓練等級', '身分別', '機關名稱', '單位名稱', '姓名', '性別', '職稱', '主要信箱(公司帳號)', '備用信箱(非公司外部帳號)', '受訓地點分類', '國外訓別子分類', '國外訓練說明', '受訓開始日', '受訓結束日', '回訓日', '資格狀態'];
    
    const csvContent = filteredResponders.map(r => {
      const row = [
        r.year || '',
        r.type || '',
        r.level || '',
        r.ident || '',
        r.org || '',
        r.unit || '',
        r.name || '',
        r.gender || '',
        r.title || '',
        r.primaryEmail || '',
        r.secondaryEmail || '',
        getLatestLocationType(r),
        getLatestOverseasCategory(r) || '',
        getLatestOverseasNote(r) || '',
        getTrainStartDate(r),
        getTrainEndDate(r),
        getReTrainDate(r),
        r.status || '有效'
      ];
      return row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const bom = '\uFEFF'; // Excel UTF-8 display prefix
    const csvString = bom + [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `應變人員清冊_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('匯出成功', 'success');
  };

  // --- Template Download Handler ---
  const handleDownloadTemplate = () => {
    const headers = ['年度', '訓練類別', '訓練等級', '身分別', '機關名稱', '單位名稱', '姓名', '性別', '職稱', '主要信箱(公司帳號)', '備用信箱(非公司外部帳號)', '受訓地點分類', '國外訓別子分類', '國外訓練說明', '受訓開始日', '受訓結束日', '回訓日', '資格狀態'];
    const sampleRow = ['115', '油污染訓', 'L2', '地方', '宜蘭縣政府', '環境保護局', '王小明', '男', '技士', 'wang@ilepb.gov.tw', 'wang.backup@gmail.com', '國內', '', '', '2026-03-01', '2026-03-03', '2029-03-03', '有效'];
    
    const bom = '\uFEFF';
    const csvString = bom + [headers.join(','), sampleRow.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = '應變人員清冊_匯入範本.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('範本下載成功', 'success');
  };

  // --- Safe Import Preview Parser ---
  const [importPreviewData, setImportPreviewData] = useState<{
    rawRow: Record<string, string>;
    isValid: boolean;
    errors: string[];
  }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSVData = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) {
      addToast('CSV 檔案規格不符或內容空洞', 'danger');
      return;
    }

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const expectedHeaders = ['年度', '訓練類別', '訓練等級', '身分別', '機關名稱', '單位名稱', '姓名', '性別', '職稱', '主要信箱(公司帳號)', '備用信箱(非公司外部帳號)', '受訓地點分類', '國外訓別子分類', '國外訓練說明', '受訓開始日', '受訓結束日', '回訓日', '資格狀態'];

    // If headers aren't in standard order, let's log info but build index mappings safely
    const previewList = lines.slice(1).map(line => {
      // Custom split with comma to respect quotes
      const values: string[] = [];
      let currentVal = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      const rowObj: Record<string, string> = {};
      expectedHeaders.forEach((eh, index) => {
        // Fallback map by index first
        rowObj[eh] = values[index] !== undefined ? values[index].replace(/^"|"$/g, '') : '';
      });

      // Validation
      const errors: string[] = [];
      if (!rowObj['機關名稱']) errors.push('缺少機關名稱');
      if (!rowObj['單位名稱']) errors.push('缺少單位名稱');
      if (!rowObj['姓名']) errors.push('缺少姓名');
      if (!rowObj['訓練類別']) errors.push('缺少訓練類別');
      if (!rowObj['訓練等級']) errors.push('缺少訓練等級');

      const isValid = errors.length === 0;

      return {
        rawRow: rowObj,
        isValid,
        errors
      };
    });

    setImportPreviewData(previewList);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      handleImportCSVData(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        handleImportCSVData(text);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const executeConfirmImport = () => {
    const validRows = importPreviewData.filter(x => x.isValid);
    if (validRows.length === 0) {
      addToast('未發現任何有效數據列，匯入終止', 'danger');
      return;
    }

    const importedResponders: Responder[] = validRows.map((pv, idx) => {
      const r = pv.rawRow;
      // map standard string value securely to corresponding union values
      const identVal: IdentityType = (r['身分別'] === '地方政府' || r['身分別'] === '地方') ? '地方' : 
                                   (r['身分別'] === '民間單位' || r['身分別'] === '民間') ? '民間' : '中央';
      const typeVal: TrainingType = r['訓練類別'].includes('化學') ? '化學訓' : '油污染訓';
      
      let levelVal: TrainingLevel = 'L1';
      if (r['訓練等級'].includes('L2') || r['訓練等級'].includes('操作')) levelVal = 'L2';
      if (r['訓練等級'].includes('L3') || r['訓練等級'].includes('指揮')) levelVal = 'L3';

      let statusVal: QualificationStatus = '有效';
      if (r['資格狀態'] && (r['資格狀態'].includes('過期') || r['資格狀態'].includes('失效'))) statusVal = '已過期';
      if (r['資格狀態'] && r['資格狀態'].includes('待複')) statusVal = '待複訓';

      const genderVal: GenderType = (r['性別'] === '女' || r['性別'] === 'F') ? '女' : '男';

      const locTypeVal: LocationType = (r['受訓地點分類'] === '國外' || r['受訓地點分類'] === '國外訓練') ? '國外' : '國內';
      let overseasCatVal: OverseasCategory | undefined = undefined;
      if (locTypeVal === '國外') {
        if (r['國外訓別子分類'] === 'CEDRE') overseasCatVal = 'CEDRE';
        else if (r['國外訓別子分類'] === 'MDPC') overseasCatVal = 'MDPC';
        else overseasCatVal = '其他';
      }
      const overseasNoteVal = r['國外訓練說明'] || undefined;

      const trainStart = r['受訓開始日'] || r['受訓日期'] || '';
      const trainEnd = r['受訓結束日'] || r['受訓日期'] || '';
      const reTrain = r['回訓日'] || r['到期日'] || (trainEnd ? calculateRetrainDate(trainEnd) : '');

      return {
        id: Date.now() + idx + Math.floor(Math.random() * 1000),
        year: r['年度'] || '115',
        type: typeVal,
        level: levelVal,
        ident: identVal,
        org: r['機關名稱'],
        unit: r['單位名稱'],
        name: r['姓名'],
        gender: genderVal,
        title: r['職稱'] || '',
        primaryEmail: r['主要信箱(公司帳號)'] || r['主要信箱'] || undefined,
        secondaryEmail: r['備用信箱(非公司外部帳號)'] || r['備用信箱'] || undefined,
        status: statusVal,
        locationType: locTypeVal,
        overseasCategory: overseasCatVal,
        overseasNote: overseasNoteVal,
        trainStartDate: trainStart || undefined,
        trainEndDate: trainEnd || undefined,
        reTrainDate: reTrain || undefined
      };
    });

    setResponders(prev => [...importedResponders, ...prev]);
    addToast(`匯入 成功數: ${importedResponders.length} 筆`, 'success');
    setImportPreviewData([]);
    setModalType(null);
    setPage(1);
  };

  // Evaluate form presets dynamically inside Component for dropdown controls
  const ALL_PRESET_ORGS = useMemo(() => [...CENTRAL_ORGS, ...LOCAL_ORGS, ...PRIVATE_ORGS], []);
  const isOrgPreset = ALL_PRESET_ORGS.includes(formOrg);
  const orgSelectValue = isOrgPreset ? (formOrg === '' ? ALL_PRESET_ORGS[0] : formOrg) : '其他';

  const currentPresetUnits = getPresetUnits(formOrg);
  const isUnitPreset = currentPresetUnits.includes(formUnit);
  const unitSelectValue = isUnitPreset ? (formUnit === '' ? currentPresetUnits[0] : formUnit) : '其他';

  const isTitlePreset = PRESET_TITLES.includes(formTitle) || formTitle === '';
  const titleSelectValue = isTitlePreset ? (formTitle === '' ? '' : formTitle) : '其他';

  return (
    <div className="w-full min-h-screen bg-[#F2EFE8] flex flex-col text-[#1F1A17] selection:bg-[#8B1C3F] selection:text-white">
      
      {/* Toast Overlay System */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 animate-[fadeIn_0.2s_ease-out] ${
              toast.type === 'success' 
              ? 'bg-emerald-600 text-white border-l-emerald-800' 
              : 'bg-rose-605 text-white border-l-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{toast.type === 'success' ? '✓' : '⚠'}</span>
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Rose/Pink Bar (From exact visual guide) */}
      <div className="bg-[#E63F7A] text-white px-6 md:px-16 lg:px-24 py-1.5 flex justify-between items-center text-xs font-semibold shrink-0 select-none">
        <div>民間單位/方達科技，您好</div>
        <div className="flex gap-4">
          <span className="cursor-pointer hover:underline">操作影音</span>
          <span>|</span>
          <span className="cursor-pointer hover:underline">提醒訊息</span>
          <span>|</span>
          <span className="cursor-pointer hover:underline">返回O-in首頁</span>
        </div>
      </div>

      {/* Main Brand Header (From exact visual guide) */}
      <header className="bg-white px-6 md:px-16 lg:px-24 py-3 w-full border-b border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all">
        <div className="flex items-center space-x-3">
          <span className="text-4xl font-extrabold italic text-[#8B1C3F] tracking-tighter shrink-0 select-none">EM</span>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-widest text-slate-500 leading-none mb-0.5">海洋委員會海洋保育署</span>
            <span className="text-2xl font-bold tracking-normal text-[#8B1C3F]">海污緊急應變系統</span>
          </div>
        </div>

        {/* Navigation Items (Grid of Columns to match screenshot icons) */}
        <div className="flex items-center gap-1 sm:gap-4 md:gap-6 shrink-0 text-slate-700">
          <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 bg-transparent hover:text-[#8B1C3F] transition-all select-none cursor-pointer">
            <Waves className="w-7 h-7 text-slate-700 hover:text-[#8B1C3F]" strokeWidth={1.5} />
            <span className="text-xs font-semibold mt-1">污染事件</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 bg-transparent hover:text-[#8B1C3F] transition-all select-none cursor-pointer">
            <Wrench className="w-7 h-7 text-slate-700 hover:text-[#8B1C3F]" strokeWidth={1.5} />
            <span className="text-xs font-semibold mt-1">應變資源</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-[#8B1C3F] font-bold select-none cursor-pointer relative">
            <ClipboardList className="w-7 h-7 text-[#8B1C3F]" strokeWidth={2} />
            <span className="text-xs font-bold mt-1">應變資源</span>
            <div className="absolute top-1.5 right-2 w-2 h-2 bg-red-550 rounded-full" />
          </button>
          <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 bg-transparent hover:text-[#8B1C3F] transition-all select-none cursor-pointer">
            <TrendingUp className="w-7 h-7 text-slate-700 hover:text-[#8B1C3F]" strokeWidth={1.5} />
            <span className="text-xs font-semibold mt-1">擴散模擬</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 bg-transparent hover:text-[#8B1C3F] transition-all select-none cursor-pointer">
            <Home className="w-7 h-7 text-slate-700 hover:text-[#8B1C3F]" strokeWidth={1.5} />
            <span className="text-xs font-semibold mt-1">返回首頁</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col px-6 md:px-16 lg:px-24 py-5 space-y-5 w-full mx-auto max-w-[1600px]">
        
        {/* Breadcrumb & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0" id="em-breadcrumb-zone">
          <div className="flex flex-col gap-1">
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold" id="em-breadcrumb">
              <span className="hover:text-[#8B1C3F] cursor-pointer">首頁</span>
              <span className="text-slate-300">/</span>
              <span className="hover:text-[#8B1C3F] cursor-pointer">應變資源</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#8B1C3F] font-bold">應變人員受訓紀錄清冊</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1.5">應變人員受訓紀錄清冊</h1>
          </div>
        </div>



        {/* Filter Criteria Section */}
        <section className="bg-white rounded border border-[#CCDCE6] shadow-xs overflow-hidden">
          <div className="bg-[#FAF9F6] border-b border-[#CCDCE6] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center border-[#D94F00] border-l-[4px] pl-3">
              <h2 className="text-base font-bold text-[#993300] tracking-wider">應變資材機關</h2>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            {/* Form Inputs Grid (Proportional Grid Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter Year */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-700">受訓年度</label>
                <select 
                  value={filterCriteria.year} 
                  onChange={(e) => handleFilterSelectChange('year', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:border-[#E35D22] outline-none transition-colors font-mono"
                  id="f_year_select"
                >
                  <option value="">全部年度</option>
                  <option value="115">115 年度</option>
                  <option value="114">114 年度</option>
                  <option value="113">113 年度</option>
                </select>
              </div>

              {/* Filter Level */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-700">訓練等級</label>
                <select 
                  value={filterCriteria.level} 
                  onChange={(e) => handleFilterSelectChange('level', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:border-[#E35D22] outline-none transition-colors"
                  id="f_level_select"
                >
                  <option value="">全部等級</option>
                  <option value="L1">L1 通識級</option>
                  <option value="L2">L2 操作級</option>
                  <option value="L3">L3 指揮級</option>
                </select>
              </div>

              {/* Filter Ident */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-700">身分別</label>
                <select 
                  value={filterCriteria.ident} 
                  onChange={(e) => handleFilterSelectChange('ident', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:border-[#E35D22] outline-none transition-colors"
                  id="f_ident_select"
                >
                  <option value="">全部身分</option>
                  <option value="中央">中央機關</option>
                  <option value="地方">地方政府</option>
                  <option value="民間">民間單位</option>
                </select>
              </div>

              {/* Filter Gender (Checkbox Mode) */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/90 py-1.5 px-2.5 rounded border border-slate-200/90 sm:col-span-2 lg:col-span-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0">
                    性別：
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleGenderToggle('男')}
                      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                        appliedCriteria.genders.includes('男')
                          ? 'border-[#3D7A6B] bg-[#3D7A6B]/15 text-[#3D7A6B] ring-1 ring-[#3D7A6B]/30'
                          : 'border-slate-300 bg-white/80 text-slate-400 line-through opacity-60'
                      }`}
                      id="f_gender_male"
                    >
                      <input 
                        type="checkbox" 
                        checked={appliedCriteria.genders.includes('男')} 
                        onChange={() => {}} 
                        className="w-3.5 h-3.5 cursor-pointer accent-[#3D7A6B]" 
                      />
                      <span>男性</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenderToggle('女')}
                      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                        appliedCriteria.genders.includes('女')
                          ? 'border-[#A67C52] bg-[#A67C52]/15 text-[#A67C52] ring-1 ring-[#A67C52]/30'
                          : 'border-slate-300 bg-white/80 text-slate-400 line-through opacity-60'
                      }`}
                      id="f_gender_female"
                    >
                      <input 
                        type="checkbox" 
                        checked={appliedCriteria.genders.includes('女')} 
                        onChange={() => {}} 
                        className="w-3.5 h-3.5 cursor-pointer accent-[#A67C52]" 
                      />
                      <span>女性</span>
                    </button>
                  </div>
                </div>
                <span className="text-[10.5px] text-slate-500 font-medium hidden sm:inline">點擊按鈕可切換選擇</span>
              </div>

              {/* Filter Location (Checkbox Mode) */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/90 py-1.5 px-2.5 rounded border border-slate-200/90 sm:col-span-2 lg:col-span-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0">
                    受訓地點：
                  </label>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* 國內 */}
                    <button
                      type="button"
                      onClick={() => handleLocationToggle('國內')}
                      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                        appliedCriteria.locations.includes('國內')
                          ? 'border-blue-600 bg-blue-50/90 text-blue-800 ring-1 ring-blue-400/30'
                          : 'border-slate-300 bg-white/80 text-slate-400 line-through opacity-60'
                      }`}
                      id="f_loc_domestic"
                    >
                      <input 
                        type="checkbox" 
                        checked={appliedCriteria.locations.includes('國內')} 
                        onChange={() => {}} 
                        className="w-3.5 h-3.5 cursor-pointer accent-blue-600" 
                      />
                      <span>國內訓練</span>
                    </button>

                    {/* 國外 - CEDRE */}
                    <button
                      type="button"
                      onClick={() => handleLocationToggle('CEDRE')}
                      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                        appliedCriteria.locations.includes('CEDRE')
                          ? 'border-purple-600 bg-purple-50/90 text-purple-900 ring-1 ring-purple-400/30'
                          : 'border-slate-300 bg-white/80 text-slate-400 line-through opacity-60'
                      }`}
                      id="f_loc_cedre"
                    >
                      <input 
                        type="checkbox" 
                        checked={appliedCriteria.locations.includes('CEDRE')} 
                        onChange={() => {}} 
                        className="w-3.5 h-3.5 cursor-pointer accent-purple-600" 
                      />
                      <span>國外 - CEDRE</span>
                    </button>

                    {/* 國外 - MDPC */}
                    <button
                      type="button"
                      onClick={() => handleLocationToggle('MDPC')}
                      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                        appliedCriteria.locations.includes('MDPC')
                          ? 'border-indigo-600 bg-indigo-50/90 text-indigo-900 ring-1 ring-indigo-400/30'
                          : 'border-slate-300 bg-white/80 text-slate-400 line-through opacity-60'
                      }`}
                      id="f_loc_mdpc"
                    >
                      <input 
                        type="checkbox" 
                        checked={appliedCriteria.locations.includes('MDPC')} 
                        onChange={() => {}} 
                        className="w-3.5 h-3.5 cursor-pointer accent-indigo-600" 
                      />
                      <span>國外 - MDPC</span>
                    </button>

                    {/* 國外 - 其他 */}
                    <button
                      type="button"
                      onClick={() => handleLocationToggle('其他')}
                      className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                        appliedCriteria.locations.includes('其他')
                          ? 'border-amber-600 bg-amber-50/90 text-amber-900 ring-1 ring-amber-400/30'
                          : 'border-slate-300 bg-white/80 text-slate-400 line-through opacity-60'
                      }`}
                      id="f_loc_other"
                    >
                      <input 
                        type="checkbox" 
                        checked={appliedCriteria.locations.includes('其他')} 
                        onChange={() => {}} 
                        className="w-3.5 h-3.5 cursor-pointer accent-amber-600" 
                      />
                      <span>國外 - 其他</span>
                    </button>
                  </div>
                </div>
                <span className="text-[10.5px] text-slate-500 font-medium hidden sm:inline">點擊按鈕可複選地點與訓別</span>
              </div>
            </div>

            {/* Keyword block & Orange Search Action Button (matching query screen) */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-3 border-t border-dashed border-gray-205">
              <div className="flex-1 max-w-xl">
                <label className="text-xs font-bold text-slate-750 block mb-1">單位 / 姓名關鍵字搜尋</label>
                <input 
                  type="text" 
                  value={filterCriteria.keyword}
                  onChange={(e) => setFilterCriteria(prev => ({ ...prev, keyword: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                  placeholder="請輸入關鍵字（例如：機關名稱、單位名稱、姓名或職稱）" 
                  className="w-full border border-gray-300 bg-white rounded px-3 py-2 text-xs outline-none focus:border-[#E35D22]"
                  id="f_keyword_input"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={executeSearch}
                  className="bg-[#E35D22] hover:bg-[#c94a15] text-white px-8 py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer select-none"
                  id="search-action-btn"
                >
                  <Search className="w-4 h-4" />
                  <span>查詢</span>
                </button>
                
                <button 
                  onClick={handleResetFilter}
                  className="bg-white hover:bg-slate-50 border border-gray-300 text-slate-700 px-5 py-2 rounded text-xs font-bold flex items-center justify-center cursor-pointer select-none"
                  id="reset-action-btn"
                >
                  重設條件
                </button>
              </div>
            </div>
          </div>
        </section>



        {/* Unified Table Card Section */}
        <section className="bg-white rounded border border-[#CCDCE6] shadow-xs overflow-hidden flex flex-col">
          {/* Header Action Row (matching screenshot 2 layout) */}
          <div className="bg-[#FAF9F6] border-b border-[#CCDCE6] px-5 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border-[#D94F00] border-l-[4px] pl-3">
                <h2 className="text-sm md:text-base font-bold text-[#993300] tracking-wider">單位聯絡人</h2>
              </div>
              
              {/* Compact, clean inline stats tags (prevents vertical space waste & feels integrated) */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5 text-xs text-slate-600 select-none">
                <div className="bg-rose-50/70 text-[#8B1C3F] border border-rose-200/50 px-2 py-0.5 rounded text-[10.5px] font-bold flex items-center gap-1">
                  <span>查詢人數：</span>
                  <span className="font-mono text-xs">{stats.total}</span>
                </div>
                <div className="bg-amber-50/70 text-[#D95F02] border border-amber-200/50 px-2 py-0.5 rounded text-[10.5px] font-bold flex items-center gap-1">
                  <span>油污染：</span>
                  <span className="font-mono text-xs">{stats.oil}</span>
                </div>
                <div className="bg-orange-50/70 text-[#D94F00] border border-orange-200/50 px-2 py-0.5 rounded text-[10.5px] font-bold flex items-center gap-1">
                  <span>化學訓：</span>
                  <span className="font-mono text-xs">{stats.chem}</span>
                </div>
              </div>
            </div>

            {/* Action Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={openAddModal}
                className="bg-[#E35D22] hover:bg-[#c94a15] text-white px-4 py-1.5 rounded text-xs font-bold flex items-center shadow-xs transition-colors cursor-pointer select-none"
                id="toolbar-add-rec"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                新增
              </button>
              
              <div className="w-[1px] h-6 bg-slate-200 mx-1 hidden sm:block" />

              <button 
                onClick={() => setModalType('import')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-300 px-3 py-1.5 rounded text-xs font-bold shadow-xs transition-all flex items-center cursor-pointer"
                id="toolbar-import"
              >
                <Upload className="w-3.5 h-3.5 mr-1 text-[#E35D22]" />
                匯入 CSV
              </button>

              <button 
                onClick={handleDownloadTemplate}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-300 px-3 py-1.5 rounded text-xs font-bold shadow-xs transition-all flex items-center cursor-pointer"
                id="toolbar-download-tpl"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                下載範本
              </button>

              <button 
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-xs font-bold shadow-xs flex items-center transition-colors cursor-pointer"
                id="toolbar-export"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                匯出 CSV
              </button>
            </div>
          </div>

          {/* Big Tab Menu for Training Categories */}
          <div className="bg-[#EAE7DF] border-b border-[#CCDCE6] px-5 pt-2.5 pb-0 flex flex-wrap items-end justify-between gap-2 select-none">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTabChange('')}
                className={`px-5 py-2.5 text-xs font-bold rounded-t-lg border-t-4 border-x transition-all flex items-center gap-2 cursor-pointer ${
                  appliedCriteria.type === ''
                    ? 'bg-white border-t-[#8B1C3F] border-x-[#CCDCE6] text-[#8B1C3F] shadow-xs font-black translate-y-[1px] z-10'
                    : 'bg-[#DCD8CC] border-t-transparent border-x-transparent text-slate-600 hover:bg-[#D2CDBE] hover:text-slate-900'
                }`}
                id="tab-training-all"
              >
                <span className="text-sm tracking-wide">全部人員</span>
                <span className={`px-2 py-0.5 text-[10.5px] rounded-full font-mono font-bold ${
                  appliedCriteria.type === '' ? 'bg-[#8B1C3F]/10 text-[#8B1C3F]' : 'bg-slate-300/80 text-slate-700'
                }`}>
                  {tabCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('油污染訓')}
                className={`px-5 py-2.5 text-xs font-bold rounded-t-lg border-t-4 border-x transition-all flex items-center gap-2 cursor-pointer ${
                  appliedCriteria.type === '油污染訓'
                    ? 'bg-white border-t-[#D95F02] border-x-[#CCDCE6] text-[#D95F02] shadow-xs font-black translate-y-[1px] z-10'
                    : 'bg-[#DCD8CC] border-t-transparent border-x-transparent text-slate-600 hover:bg-[#D2CDBE] hover:text-slate-900'
                }`}
                id="tab-training-oil"
              >
                <span className="text-sm tracking-wide">油污染訓</span>
                <span className={`px-2 py-0.5 text-[10.5px] rounded-full font-mono font-bold ${
                  appliedCriteria.type === '油污染訓' ? 'bg-[#D95F02]/10 text-[#D95F02]' : 'bg-slate-300/80 text-slate-700'
                }`}>
                  {tabCounts.oil}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('化學訓')}
                className={`px-5 py-2.5 text-xs font-bold rounded-t-lg border-t-4 border-x transition-all flex items-center gap-2 cursor-pointer ${
                  appliedCriteria.type === '化學訓'
                    ? 'bg-white border-t-[#D94F00] border-x-[#CCDCE6] text-[#D94F00] shadow-xs font-black translate-y-[1px] z-10'
                    : 'bg-[#DCD8CC] border-t-transparent border-x-transparent text-slate-600 hover:bg-[#D2CDBE] hover:text-slate-900'
                }`}
                id="tab-training-chem"
              >
                <span className="text-sm tracking-wide">化學品訓</span>
                <span className={`px-2 py-0.5 text-[10.5px] rounded-full font-mono font-bold ${
                  appliedCriteria.type === '化學訓' ? 'bg-[#D94F00]/10 text-[#D94F00]' : 'bg-slate-300/80 text-slate-700'
                }`}>
                  {tabCounts.chem}
                </span>
              </button>
            </div>
            
            <div className="text-[11px] text-slate-500 font-medium pb-1.5 hidden sm:block">
              目前檢視類別：<strong className="text-slate-800">{appliedCriteria.type === '' ? '全部人員' : appliedCriteria.type === '油污染訓' ? '油污染訓' : '化學品訓'}</strong>
            </div>
          </div>


        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-[#4095C2] text-white">
              <tr className="divide-x divide-white/20 select-none">
                {renderSortableHeader('id', '序號', 'w-10 text-center')}
                {renderSortableHeader('ident', '身分別', 'w-20 text-center')}
                {renderSortableHeader('org', '機關 / 單位', 'text-left px-3 min-w-[220px]')}
                {renderSortableHeader('name', '姓名', 'w-24 text-center')}
                {renderSortableHeader('title', '職稱', 'w-28 text-center')}
                {renderSortableHeader('level', '訓練等級', 'w-24 text-center')}
                {renderSortableHeader('location', '受訓地點', 'w-22 text-center')}
                {renderSortableHeader('trainStartDate', '受訓期間', 'w-36 text-center')}
                {renderSortableHeader('reTrainDate', '回訓日', 'w-28 text-center')}
                <th className="p-2.5 border border-[#CCDCE6] w-20 font-semibold text-center select-none">檢視/編輯</th>
                <th className="p-2.5 border border-[#CCDCE6] w-12 font-semibold text-center select-none">刪除</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedResponders.length > 0 ? (
                paginatedResponders.map((r, itemIndex) => {
                  const sequenceNum = (page - 1) * pageSize + itemIndex + 1;
                  const isSelected = r.id === selectedId;
                  
                  // Ident mapping status matching screenshot colors
                  const identClass = r.ident === '中央' 
                    ? 'text-blue-600 font-bold' 
                    : r.ident === '地方' 
                      ? 'text-amber-700 font-bold' 
                      : 'text-slate-600 font-medium';
                  
                  const levelMapped = r.level === 'L1' ? 'L1 通識級' : r.level === 'L2' ? 'L2 操作級' : 'L3 指揮級';
                  const isFemale = r.gender === '女';
                  const genderColor = isFemale ? '#A67C52' : '#3D7A6B';

                  return (
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedId(isSelected ? null : r.id)}
                      className={`transition-colors cursor-pointer select-none divide-x divide-gray-200 ${
                        isSelected 
                        ? 'bg-amber-50 hover:bg-amber-100/70' 
                        : 'bg-white hover:bg-[#FAF9F5]'
                      }`}
                      id={`responder-row-${r.id}`}
                    >
                      {/* Sequence No */}
                      <td className="p-2 border border-gray-200 font-mono text-slate-500 font-semibold text-center">
                        {sequenceNum}
                      </td>

                      {/* Ident */}
                      <td className={`p-2 border border-gray-200 text-center ${identClass}`}>
                        {r.ident === '中央' ? '中央機關' : r.ident === '地方' ? '地方政府' : '民間單位'}
                      </td>

                      {/* Agency Name */}
                      <td className="p-2 border border-gray-200 text-left px-3 font-medium text-slate-800">
                        <div>{r.org}</div>
                        {r.unit && <div className="text-[10.5px] text-slate-400 mt-0.5">{r.unit}</div>}
                      </td>

                      {/* Name */}
                      <td className="p-2 border border-gray-200 text-center font-semibold">
                        <span 
                          style={{ color: genderColor }} 
                          className="font-black text-sm tracking-wide"
                        >
                          {r.name}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="p-2 border border-gray-200 text-center font-medium text-slate-700">
                        {r.title || '—'}
                      </td>

                      {/* Training level */}
                      <td className="p-2 border border-gray-200 text-slate-700 font-medium text-center">
                        {levelMapped}
                      </td>

                      {/* Location */}
                      <td className="p-2 border border-gray-200 text-center text-xs font-medium">
                        {getLatestLocationType(r) === '國外' ? (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              國外
                            </span>
                            <span className="text-[11px] font-bold text-purple-800 font-mono">
                              {getLatestOverseasCategory(r) === 'CEDRE' && '(CEDRE)'}
                              {getLatestOverseasCategory(r) === 'MDPC' && '(MDPC)'}
                              {getLatestOverseasCategory(r) === '其他' && `(${getLatestOverseasNote(r) || '其他'})`}
                              {!getLatestOverseasCategory(r) && getLatestOverseasNote(r) && `(${getLatestOverseasNote(r)})`}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            國內
                          </span>
                        )}
                      </td>

                      {/* Training Period */}
                      <td className="p-2 border border-gray-200 font-mono text-[11.5px] text-slate-700 text-center font-medium">
                        {(() => {
                          const start = getTrainStartDate(r);
                          const end = getTrainEndDate(r);
                          if (!start && !end) return '—';
                          const rocStart = toRocDate(start);
                          const rocEnd = toRocDate(end);
                          if (!end || start === end) return rocStart;
                          return (
                            <div className="flex flex-col items-center justify-center leading-snug">
                              <span>{rocStart}</span>
                              <span className="text-slate-500 text-[10.5px]">至 {rocEnd}</span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Retraining Date */}
                      <td className="p-2 border border-gray-200 font-mono text-[11.5px] text-[#D95F02] text-center font-bold">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span>{toRocDate(getReTrainDate(r)) || '—'}</span>
                          {isReTrainDue(getReTrainDate(r)) && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-[#8B1C3F] border border-rose-300 font-bold tracking-tight">
                              待回訓
                            </span>
                          )}
                        </div>
                      </td>

                      {/* View control */}
                      <td className="p-2 border border-gray-200 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => openViewModal(r)}
                          className="bg-[#4095C2] hover:bg-[#337ab7] text-white w-7 h-7 rounded flex items-center justify-center mx-auto cursor-pointer transition-all active:scale-95 shadow-xs"
                          title="檢視詳細資料"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </button>
                      </td>

                      {/* Delete control */}
                      <td className="p-2 border border-gray-200 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => { setSelectedId(r.id); setTimeout(() => setModalType('delete'), 40); }}
                          className="bg-[#D9534F] hover:bg-[#d43f3a] text-white w-7 h-7 rounded flex items-center justify-center mx-auto cursor-pointer transition-all active:scale-95 shadow-xs"
                          title="刪除資料"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2 select-none">
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                      <span className="font-semibold text-sm">無符合現行篩選條件之受訓人員。</span>
                      <span className="text-xs text-slate-400">請確認是否切換了不同的篩選年度或模糊關鍵字。</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination Footer (Government style from screenshot 2) */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-[#FAF9F5] border-t border-gray-201 gap-4 text-xs text-slate-600 font-semibold select-none">
          {/* Summary */}
          <div className="flex items-center space-x-3 text-[13px]">
            <span>第 <strong className="text-[#994F00] font-mono">{page}</strong> / <strong className="text-slate-700 font-mono">{totalPages}</strong> 頁</span>
            <span>共計 <strong className="text-slate-750 font-mono">{filteredResponders.length}</strong> 筆資料</span>
          </div>

          {/* Controller Group */}
          <div className="flex flex-wrap items-center gap-4 text-[13px]">
            
            {/* Jump to page */}
            <div className="flex items-center space-x-1.5">
              <span>跳至</span>
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:border-[#E35D22] outline-none cursor-pointer"
              >
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>{idx + 1}</option>
                ))}
              </select>
              <span>頁</span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-350 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold cursor-pointer rounded-xs"
              >
                上一頁
              </button>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs border border-gray-350 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold cursor-pointer rounded-xs"
              >
                下一頁
              </button>
            </div>

            {/* Page Size selector */}
            <div className="flex items-center space-x-1.5">
              <span>每頁顯示</span>
              <select
                value={pageSize}
                disabled
                className="border border-gray-300 rounded px-1.5 py-1 text-xs bg-slate-50 text-slate-400 outline-none select-none"
              >
                <option value="10">10</option>
              </select>
              <span>筆</span>
            </div>

          </div>
        </div>
      </section>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-4 text-xs text-slate-400 shrink-0 border-t border-slate-200 bg-white mt-auto select-none">
        <div>EM 海污緊急應變系統 © 2026 應變資源維護單元 — 方達科技 系統規劃部門</div>
      </footer>

      {/* --- VIEW DETAIL MODAL --- */}
      {modalType === 'view' && selectedResponder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-40 p-4 transition-all duration-300">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-[fadeInUp_0.25s_ease-out]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-3.5 border-b-2 border-b-[#4095C2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#4095C2]" />
                <span className="font-bold text-slate-800 tracking-tight text-sm">
                  受訓人員詳細資訊 — ID#{selectedResponder.id}
                </span>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer hover:bg-slate-200/50"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto max-h-[80vh] space-y-4">
              {/* Highlight Summary Header Card (Consolidates Name, Title, Gender, Identity, Org, Unit, Training Level, and Status) */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-lg p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        style={{ color: selectedResponder.gender === '女' ? '#A67C52' : '#3D7A6B' }}
                        className="text-base font-black tracking-wide"
                      >
                        {selectedResponder.name}
                      </span>
                      {selectedResponder.title && (
                        <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                          {selectedResponder.title}
                        </span>
                      )}
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-200/70 text-slate-700">
                        {selectedResponder.gender === '女' ? '女性' : '男性'}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                        selectedResponder.ident === '中央'
                          ? 'bg-blue-100 text-blue-700'
                          : selectedResponder.ident === '地方'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                      }`}>
                        {selectedResponder.ident === '中央' ? '中央機關' : selectedResponder.ident === '地方' ? '地方政府' : '民間單位'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1.5 flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">{selectedResponder.org}</span>
                      <span>—</span>
                      <span>{selectedResponder.unit || '無指定單位'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[#E35D22]/10 text-[#E35D22] border border-[#E35D22]/30">
                      {selectedResponder.type} ({selectedResponder.level}) — {selectedResponder.year}年度
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: 聯絡電子信箱 */}
              <div className="space-y-2">
                <div className="text-[11px] font-black text-[#4095C2] pb-1 border-b border-blue-100 flex items-center gap-1">
                  <span>聯絡電子信箱</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50/80 p-2.5 rounded border border-slate-150 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10.5px]">主要信箱 (公司 / 單位帳號)</span>
                      <span className="font-mono font-medium text-slate-800 text-xs">{selectedResponder.primaryEmail || '（未填寫）'}</span>
                    </div>
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded border border-slate-150 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10.5px]">備用信箱 (非公司外部帳號)</span>
                      <span className="font-mono font-medium text-slate-800 text-xs">{selectedResponder.secondaryEmail || '（未填寫）'}</span>
                    </div>
                    <AtSign className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Section 2: 歷次受訓與回訓履歷 */}
              <div className="space-y-2">
                <div className="text-[11px] font-black text-[#4095C2] pb-1 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>歷次受訓與回訓履歷 ({getTrainingSessions(selectedResponder).length} 次)</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {getTrainingSessions(selectedResponder).map((sess, idx, arr) => (
                    <div key={sess.id || idx} className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800">
                            #{idx + 1} {sess.note || '受訓紀錄'}
                          </span>
                          {sess.locationType === '國外' ? (
                            <span className="font-bold text-purple-900 bg-purple-100 px-1.5 py-0.2 rounded text-[10px] inline-flex items-center gap-0.5 border border-purple-200">
                              <span>國外</span>
                              <span>
                                {sess.overseasCategory === 'CEDRE' && '(CEDRE)'}
                                {sess.overseasCategory === 'MDPC' && '(MDPC)'}
                                {sess.overseasCategory === '其他' && `(${sess.overseasNote || '其他'})`}
                                {!sess.overseasCategory && sess.overseasNote && `(${sess.overseasNote})`}
                              </span>
                            </span>
                          ) : (
                            <span className="font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded text-[10px] inline-block border border-slate-300">
                              國內訓練
                            </span>
                          )}
                          {idx === arr.length - 1 && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                              最新紀錄
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          受訓期間: {toRocDate(sess.startDate)} 至 {toRocDate(sess.endDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">應回訓日</span>
                        <span className="font-mono font-bold text-[#D95F02] text-xs">
                          {toRocDate(sess.reTrainDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: 同人員跨訓練項目關聯檔 */}
              {(() => {
                const otherRecords = responders.filter(
                  r => r.name === selectedResponder.name && r.id !== selectedResponder.id
                );
                if (otherRecords.length === 0) return null;
                return (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-black text-[#D95F02] pb-1 border-b border-amber-100 flex items-center gap-1">
                      <span>此人員於其他訓練項目之資格檔案 ({otherRecords.length} 筆)</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {otherRecords.map(other => (
                        <div key={other.id} className="bg-amber-50/60 p-2.5 rounded border border-amber-200/80 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">
                              {other.type} ({other.level})
                            </span>
                            <span className="text-[11px] text-slate-600 ml-2 font-mono">
                              {other.year}年度 / 回訓日: <strong className="text-[#D95F02]">{toRocDate(getReTrainDate(other))}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openViewModal(other)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded cursor-pointer transition-colors"
                          >
                            切換檢視此紀錄
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-150 flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setModalType(null)}
                className="bg-white border border-gray-300 hover:bg-slate-100 text-slate-700 px-4 py-1.5 rounded text-xs font-bold select-none cursor-pointer transition-colors"
              >
                關閉
              </button>
              <button 
                type="button"
                onClick={() => openEditModal()}
                className="bg-[#5CB85C] hover:bg-[#4cae4c] text-white px-5 py-1.5 rounded text-xs font-bold shadow-xs select-none cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-white" />
                <span>編輯資料</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD / EDIT POPUP MODAL --- */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-40 p-4 transition-all duration-300">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-[fadeInUp_0.25s_ease-out]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-3.5 border-b-2 border-b-[#E35D22] flex items-center justify-between">
              <span className="font-bold text-slate-800 tracking-tight text-sm">
                {modalType === 'add' ? '新增應變受訓人員' : `編輯受訓人員資料 — ID#${selectedId}`}
              </span>
              <button 
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer hover:bg-slate-200/50"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={modalType === 'add' ? handleSaveAdd : handleSaveEdit}>
              <div className="p-5 overflow-y-auto max-h-[80vh] space-y-4">
                
                <div className="text-[11px] font-black text-[#E35D22] pb-1 border-b border-orange-100 flex items-center gap-1">
                  <span>基本人事資料</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* 1. 身分辨識屬性 - MUST occupy the absolute top, updating automatically or with select if custom */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      身分屬性分類 <span className="text-red-500 font-bold">*</span>
                    </label>
                    {orgSelectValue !== '其他' ? (
                      <div className="bg-slate-50 border border-slate-200/70 rounded-md px-3 py-2.5 flex items-center justify-between shadow-xs">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">機關屬性自動識別</span>
                          <span className="text-xs font-black text-slate-700 mt-0.5">
                            {formIdent === '中央' && '🏛️ 中央政府行政機關人員'}
                            {formIdent === '地方' && '🏝️ 地方政府環境保護局人員'}
                            {formIdent === '民間' && '🤝 簽約民間港口或學術機構團隊'}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide ${
                          formIdent === '中央' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' :
                          formIdent === '地方' ? 'bg-amber-50 text-[#D95F02] border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {formIdent}機關
                        </span>
                      </div>
                    ) : (
                      <div className="bg-orange-50/20 border border-orange-200/50 rounded-md p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">🔎 自定義機關 — 請指定其資料夾屬性</span>
                          <span className="text-[10px] text-orange-500 font-bold">非預設清單</span>
                        </div>
                        <select
                          value={formIdent}
                          onChange={(e) => setFormIdent(e.target.value as IdentityType)}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#E35D22] transition-colors bg-white cursor-pointer font-bold text-slate-800"
                        >
                          <option value="中央">🏛️ 中央機關級 (Central Corp)</option>
                          <option value="地方">🏝️ 地方政府級 (Local Bureau)</option>
                          <option value="民間">🤝 民間/學術單位 (Enterprise/School)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 2. 機關名稱 Dropdown */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      機關名稱 <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      value={orgSelectValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '其他') {
                          setFormOrg('');
                          setFormUnit('無特定單位');
                          setFormIdent('中央');
                        } else {
                          setFormOrg(val);
                          // Auto detect identity type for clean RD DB alignment
                          if (CENTRAL_ORGS.includes(val)) {
                            setFormIdent('中央');
                          } else if (LOCAL_ORGS.includes(val)) {
                            setFormIdent('地方');
                          } else if (PRIVATE_ORGS.includes(val)) {
                            setFormIdent('民間');
                          }
                          const unitPresets = getPresetUnits(val);
                          setFormUnit(unitPresets[0]);
                        }
                      }}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#E35D22] transition-colors bg-white cursor-pointer font-bold text-slate-700 animate-[fadeIn_0.12s_ease-out]"
                    >
                      <optgroup label="🏢 ── 中央政府機關 (Central) ──">
                        {CENTRAL_ORGS.map(org => (
                          <option key={org} value={org}>{org}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏝️ ── 地方政府環境保護局 (Local) ──">
                        {LOCAL_ORGS.map(org => (
                          <option key={org} value={org}>{org}</option>
                        ))}
                      </optgroup>
                      <optgroup label="🤝 ── 特約與合作民間學校 (Private/Academic) ──">
                        {PRIVATE_ORGS.map(org => (
                          <option key={org} value={org}>{org}</option>
                        ))}
                      </optgroup>
                      <option value="其他">🔍 其他機關 (手動填寫/非清單預設)</option>
                    </select>

                    {/* Custom Org text input */}
                    {orgSelectValue === '其他' && (
                      <div className="mt-2 animate-[fadeIn_0.15s_ease-out]">
                        <input 
                          type="text"
                          required
                          value={formOrg}
                          onChange={(e) => {
                            setFormOrg(e.target.value);
                          }}
                          placeholder="請手動輸入全名 (例如：交通部台中港務分公司)"
                          className="w-full border border-[#E35D22] rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#E35D22] bg-orange-50/10 font-bold text-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. 單位名稱 Dropdown */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      單位名稱 <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      value={unitSelectValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '其他') {
                          setFormUnit('');
                        } else {
                          setFormUnit(val);
                        }
                      }}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#E35D22] transition-colors bg-white cursor-pointer font-semibold text-slate-700"
                    >
                      {currentPresetUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                      <option value="其他">🔍 其他單位 (手動填寫/非清單預設)</option>
                    </select>

                    {/* Custom Unit text input */}
                    {unitSelectValue === '其他' && (
                      <div className="mt-2 animate-[fadeIn_0.15s_ease-out]">
                        <input 
                          type="text"
                          required
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                          placeholder="請手動輸入單位名稱 (例如：港區安全維護組)"
                          className="w-full border border-[#E35D22] rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#E35D22] bg-orange-50/10 font-bold text-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* 4. 人員姓名 Input & 生理解性別 Radio Button & 職稱 Dropdown */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      人員姓名 <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="請輸入姓名"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs outline-none focus:border-[#E35D22] transition-colors bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      性別 <span className="text-red-500 font-bold">*</span> <span className="text-[10px] text-slate-400 font-normal">(單選)</span>
                    </label>
                    <div className="flex items-center gap-4 py-1 bg-slate-50 px-3 rounded border border-slate-200 h-[34px]">
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none" style={{ color: formGender === '男' ? '#3D7A6B' : '#64748B' }}>
                        <input 
                          type="radio"
                          name="genderRadio"
                          value="男"
                          checked={formGender === '男'}
                          onChange={() => setFormGender('男')}
                          className="w-3.5 h-3.5 accent-[#3D7A6B] cursor-pointer"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#3D7A6B' }} />
                          男
                        </span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none" style={{ color: formGender === '女' ? '#A67C52' : '#64748B' }}>
                        <input 
                          type="radio"
                          name="genderRadio"
                          value="女"
                          checked={formGender === '女'}
                          onChange={() => setFormGender('女')}
                          className="w-3.5 h-3.5 accent-[#A67C52] cursor-pointer"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#A67C52' }} />
                          女
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      職用官稱
                    </label>
                    <select
                      value={titleSelectValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '其他') {
                          setFormTitle('');
                        } else {
                          setFormTitle(val);
                        }
                      }}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#E35D22] transition-colors bg-white cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="">(無職稱/請選擇)</option>
                      {PRESET_TITLES.map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                      <option value="其他">其他 (手動填寫...)</option>
                    </select>
                  </div>

                  {/* Custom Title text input */}
                  {titleSelectValue === '其他' && (
                    <div className="col-span-2 animate-[fadeIn_0.15s_ease-out]">
                      <label className="text-xs font-bold text-orange-600 block mb-1">
                        手動輸入職稱
                      </label>
                      <input 
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="請手動輸入詳細職稱 (例如：聘書專家、隨團翻譯)"
                        className="w-full border border-[#E35D22] rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#E35D22] bg-orange-50/10 font-medium"
                      />
                    </div>
                  )}

                  {/* Section 2: 聯絡電子信箱 */}
                  <div className="col-span-2 pt-2">
                    <div className="text-[11px] font-black text-[#E35D22] pb-1 border-b border-orange-100 mb-2 flex items-center justify-between">
                      <span>聯絡電子信箱</span>
                      <span className="text-[10px] text-slate-400 font-normal">(選填)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          主要信箱 (公司 / 單位帳號)
                        </label>
                        <input 
                          type="email"
                          value={formPrimaryEmail}
                          onChange={(e) => setFormPrimaryEmail(e.target.value)}
                          placeholder="範例：name@oac.gov.tw"
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs outline-none focus:border-[#E35D22] transition-colors bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          備用信箱 (非公司外部帳號)
                        </label>
                        <input 
                          type="email"
                          value={formSecondaryEmail}
                          onChange={(e) => setFormSecondaryEmail(e.target.value)}
                          placeholder="範例：name@gmail.com"
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs outline-none focus:border-[#E35D22] transition-colors bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: 訓練類別與資格等級 */}
                  <div className="col-span-2 pt-2">
                    <div className="text-[11px] font-black text-[#E35D22] pb-1 border-b border-orange-100 mb-2">
                      <span>訓練類別與資格等級</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          訓練項目 <span className="text-red-500 font-bold">*</span>
                        </label>
                        {modalType === 'edit' ? (
                          <div className="w-full border border-slate-200 bg-slate-100 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 flex items-center">
                            <span className="flex items-center gap-1.5">
                              <span className={`inline-block w-2 h-2 rounded-full ${formType === '油污染訓' ? 'bg-[#E35D22]' : 'bg-teal-600'}`}></span>
                              {formType}
                            </span>
                          </div>
                        ) : (
                          <select
                            value={formType}
                            onChange={(e) => setFormType(e.target.value as TrainingType)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-[#E35D22] bg-white font-bold text-slate-800 cursor-pointer"
                          >
                            <option value="油污染訓">油污染訓</option>
                            <option value="化學訓">化學品訓</option>
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          合格級數 <span className="text-red-500 font-bold">*</span>
                        </label>
                        <select
                          value={formLevel}
                          onChange={(e) => setFormLevel(e.target.value as TrainingLevel)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-[#E35D22] bg-white font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="L1">L1 (通識級)</option>
                          <option value="L2">L2 (操作級)</option>
                          <option value="L3">L3 (指揮級)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          受訓年度 <span className="text-red-500 font-bold">*</span>
                        </label>
                        <select
                          value={formYear}
                          onChange={(e) => setFormYear(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-[#E35D22] bg-white font-bold font-mono text-slate-800 cursor-pointer"
                        >
                          {['115', '114', '113', '112', '111', '110', '109', '108'].map(yr => (
                            <option key={yr} value={yr}>{yr} 年度</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 歷次受訓與回訓時間紀錄 (多筆受訓機制) */}
                  <div className="col-span-2 space-y-3 pt-1">
                    <div className="flex items-center justify-between border-b border-orange-200/80 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">受訓與回訓時間紀錄履歷</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">
                          共 {formSessions.length} 次紀錄
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSession}
                        className="bg-[#E35D22] hover:bg-[#c94a15] text-white px-2.5 py-1 rounded text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>＋ 新增受訓/回訓時間紀錄</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formSessions.map((sess, idx) => (
                        <div 
                          key={sess.id} 
                          className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5 relative transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#E35D22] text-white text-[10px] font-black px-2 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                              <input 
                                type="text"
                                value={sess.note || ''}
                                onChange={(e) => handleSessionChange(sess.id, 'note', e.target.value)}
                                placeholder="說明 (如：初訓、第1次複訓)"
                                className="border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-700 bg-white focus:border-[#E35D22] outline-none w-48"
                              />
                            </div>
                            {formSessions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(sess.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                                title="刪除此筆受訓紀錄"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>移除紀錄</span>
                              </button>
                            )}
                          </div>

                          {/* Location Binder for this specific session */}
                          <div className="bg-white p-2.5 rounded border border-slate-200/90 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                此梯次受訓地點：
                              </span>
                              <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-1 text-xs cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`sessLoc_${sess.id}`}
                                    value="國內"
                                    checked={(sess.locationType || '國內') === '國內'}
                                    onChange={() => handleSessionChange(sess.id, 'locationType', '國內')}
                                    className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                                  />
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${(sess.locationType || '國內') === '國內' ? 'bg-blue-100 text-blue-800' : 'text-slate-500'}`}>
                                    國內訓練
                                  </span>
                                </label>
                                <label className="inline-flex items-center gap-1 text-xs cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`sessLoc_${sess.id}`}
                                    value="國外"
                                    checked={sess.locationType === '國外'}
                                    onChange={() => {
                                      handleSessionChange(sess.id, 'locationType', '國外');
                                      if (!sess.overseasCategory) {
                                        handleSessionChange(sess.id, 'overseasCategory', 'CEDRE');
                                      }
                                    }}
                                    className="w-3.5 h-3.5 accent-purple-600 cursor-pointer"
                                  />
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${sess.locationType === '國外' ? 'bg-purple-100 text-purple-900' : 'text-slate-500'}`}>
                                    國外訓練
                                  </span>
                                </label>
                              </div>
                            </div>

                            {sess.locationType === '國外' && (
                              <div className="pt-1.5 border-t border-slate-100 space-y-1.5 animate-[fadeIn_0.12s_ease-out]">
                                <div className="flex items-center gap-3 text-xs flex-wrap">
                                  <span className="text-[10.5px] font-bold text-purple-900">國外訓別子分類：</span>
                                  <label className="inline-flex items-center gap-1 cursor-pointer select-none font-bold text-slate-700">
                                    <input
                                      type="radio"
                                      name={`sessOverseasCat_${sess.id}`}
                                      value="CEDRE"
                                      checked={sess.overseasCategory === 'CEDRE' || !sess.overseasCategory}
                                      onChange={() => handleSessionChange(sess.id, 'overseasCategory', 'CEDRE')}
                                      className="w-3.5 h-3.5 accent-purple-600 cursor-pointer"
                                    />
                                    <span className="text-[11px]">CEDRE</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1 cursor-pointer select-none font-bold text-slate-700">
                                    <input
                                      type="radio"
                                      name={`sessOverseasCat_${sess.id}`}
                                      value="MDPC"
                                      checked={sess.overseasCategory === 'MDPC'}
                                      onChange={() => handleSessionChange(sess.id, 'overseasCategory', 'MDPC')}
                                      className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px]">MDPC</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1 cursor-pointer select-none font-bold text-slate-700">
                                    <input
                                      type="radio"
                                      name={`sessOverseasCat_${sess.id}`}
                                      value="其他"
                                      checked={sess.overseasCategory === '其他'}
                                      onChange={() => handleSessionChange(sess.id, 'overseasCategory', '其他')}
                                      className="w-3.5 h-3.5 accent-amber-600 cursor-pointer"
                                    />
                                    <span className="text-[11px]">其他 (手動說明)</span>
                                  </label>
                                </div>

                                {sess.overseasCategory === '其他' && (
                                  <div>
                                    <input
                                      type="text"
                                      value={sess.overseasNote || ''}
                                      onChange={(e) => handleSessionChange(sess.id, 'overseasNote', e.target.value)}
                                      placeholder="請輸入此梯次國外受訓說明 (如：法國海事應變機構、IMO國際課程)"
                                      className="w-full border border-amber-300 rounded px-2.5 py-1 text-xs outline-none focus:border-[#E35D22] bg-amber-50/20 font-medium text-slate-800"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[10.5px] text-slate-500 font-bold block mb-1">受訓開始日 (民國年)</label>
                              <RocDateInput 
                                value={sess.startDate}
                                onChange={(val) => handleSessionChange(sess.id, 'startDate', val)}
                                placeholder="例：114.05.14"
                              />
                            </div>
                            <div>
                              <label className="text-[10.5px] text-slate-500 font-bold block mb-1">受訓結束日 (民國年)</label>
                              <RocDateInput 
                                value={sess.endDate}
                                onChange={(val) => handleSessionChange(sess.id, 'endDate', val)}
                                placeholder="例：114.05.16"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-700">回訓日</span>
                              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ⚡ 結束日 + 3年自動計算
                              </span>
                            </div>
                            <RocDateInput 
                              value={sess.reTrainDate}
                              onChange={(val) => handleSessionChange(sess.id, 'reTrainDate', val)}
                              className="w-36"
                              placeholder="例：117.05.16"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-150 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setModalType(null)}
                  className="bg-white border border-gray-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-xs font-bold select-none cursor-pointer"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="bg-[#E35D22] hover:bg-[#c94a15] text-white px-5 py-1.5 rounded text-xs font-bold shadow-xs select-none cursor-pointer"
                >
                  ✓ 儲存紀錄
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {modalType === 'delete' && selectedResponder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-40 p-4 transition-all duration-300">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-[fadeInUp_0.2s_ease-out] text-center">
            
            <div className="p-6">
              <div className="w-12 h-12 bg-red-150 text-[#D63031] rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-3.5 select-none animate-bounce">
                ⚠
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">確認刪除受訓紀錄？</h3>
              
              <div className="bg-slate-50 border border-slate-150 rounded p-3 text-left text-xs text-slate-600 mb-4 space-y-1">
                <div>• 人員姓名：<strong className="text-slate-800">{selectedResponder.name}</strong></div>
                <div>• 現任職機關：<strong>{selectedResponder.org} — {selectedResponder.unit}</strong></div>
                <div>• 受訓種類：{selectedResponder.year}年度 / {selectedResponder.type} ({selectedResponder.level})</div>
              </div>

              <p className="text-xs text-[#D63031] font-bold mb-5 flex items-center justify-center gap-1">
                <span>☠ 警示：</span>
                <span>此項刪除作業將無法挽回，確認執行？</span>
              </p>

              <div className="flex justify-center space-x-3">
                <button 
                  onClick={() => setModalType(null)}
                  className="bg-white border border-gray-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-xs font-bold select-none cursor-pointer"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="bg-[#D63031] hover:bg-red-700 text-white px-5 py-1.5 rounded text-xs font-bold shadow-xs select-none cursor-pointer"
                >
                  確認刪除
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- CSV IMPORT WORKFLOW MODAL --- */}
      {modalType === 'import' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-40 p-4 transition-all duration-300">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-[fadeInUp_0.22s_ease-out]">
            
            <div className="bg-slate-50 px-5 py-3.5 border-b-2 border-b-[#E35D22] flex items-center justify-between">
              <span className="font-bold text-slate-800 tracking-tight text-sm">
                批量自動匯入 CSV 應變特修人員名冊資料
              </span>
              <button 
                onClick={() => { setModalType(null); setImportPreviewData([]); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer hover:bg-slate-200/50"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Drag-and-drop zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 bg-amber-50/5 ${
                  dragActive 
                  ? 'border-[#E35D22] bg-amber-50/30 scale-[0.99]' 
                  : 'border-slate-300 hover:border-[#E35D22] hover:bg-amber-50/10'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                
                <div className="text-3xl mb-2 text-[#E35D22] select-none">📁</div>
                <div className="text-xs font-bold text-slate-800 mb-1">
                  點擊此區域選擇本機 CSV 檔案，或拖放檔案至此。
                </div>
                <p className="text-[10.5px] text-slate-400 max-w-md mx-auto leading-relaxed">
                  系統將依序校對下列必填屬性大綱：<strong>年度, 訓練類別, 訓練等級, 身分別, 機關名稱, 單位名稱, 姓名, 職稱, 資格狀態, 受訓日期, 到期日</strong>
                </p>
              </div>

              {/* Data Verification Previews */}
              {importPreviewData.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center bg-orange-50 border border-orange-100 p-2.5 rounded text-xs">
                    <span className="text-[#994F00] font-bold">✓ 分析診斷回報：</span>
                    <span className="text-slate-600">
                      本次共讀取 <strong className="text-slate-850 font-mono font-bold">{importPreviewData.length}</strong> 筆記錄，其中 
                      <strong className="text-emerald-600 font-mono font-bold"> {importPreviewData.filter(x => x.isValid).length} </strong> 筆符合規格、
                      <strong className="text-rose-600 font-mono font-bold"> {importPreviewData.filter(x => !x.isValid).length} </strong> 筆缺件
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse bg-white">
                      <thead className="bg-[#FAF9F5] text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-center w-10">列號</th>
                          <th className="p-2">姓名</th>
                          <th className="p-2">機關單位</th>
                          <th className="p-2 w-28 text-center">受訓類別</th>
                          <th className="p-2 w-20 text-center">檢核狀態</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewData.map((pv, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800">{pv.rawRow['姓名'] || '—'}</td>
                            <td className="p-2">
                              <span className="text-slate-700">{pv.rawRow['機關名稱'] || '—'}</span>
                              <span className="text-slate-400"> ( {pv.rawRow['單位名稱'] || '—'} )</span>
                            </td>
                            <td className="p-2 text-center text-slate-500 font-medium">
                              {pv.rawRow['訓練類別'] || '—'} ({pv.rawRow['訓練等級'] || '—'})
                            </td>
                            <td className="p-2 text-center font-bold">
                              {pv.isValid ? (
                                <span className="text-emerald-600">✔ 有效</span>
                              ) : (
                                <span className="text-rose-600" title={pv.errors.join(', ')}>✘ 缺漏</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-amber-600 font-semibold leading-relaxed">
                    * 點選「確認匯入」後，系統將自動過濾並【僅匯入合格有效】項目。
                  </p>
                </div>
              )}

            </div>

            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-150 flex justify-between space-x-2">
              <button 
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-white border border-gray-300 hover:bg-slate-50 text-[#FAFAFA] bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                下載規範範本
              </button>

              <div className="flex space-x-2">
                <button 
                  type="button"
                  onClick={() => { setModalType(null); setImportPreviewData([]); }}
                  className="bg-white border border-gray-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-xs font-bold select-none cursor-pointer"
                >
                  取消
                </button>
                <button 
                  type="button"
                  onClick={executeConfirmImport}
                  disabled={importPreviewData.filter(x => x.isValid).length === 0}
                  className={`px-5 py-1.5 rounded text-xs font-bold shadow-xs select-none ${
                    importPreviewData.filter(x => x.isValid).length > 0 
                    ? 'bg-[#E35D22] hover:bg-[#c94a15] text-white cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  ✓ 確認匯入
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
