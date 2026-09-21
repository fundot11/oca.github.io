import { Waves, Wrench, ClipboardList, TrendingUp, Home } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b-2 border-gray-200 px-5 flex items-center justify-between h-[54px] shadow-xs" id="em-navigation-bar">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-rose-600 italic tracking-wider">EM</span>
        <span className="text-base font-bold text-slate-800 tracking-tight">海污緊急應變系統</span>
      </div>
      
      <div className="flex items-center gap-1 md:gap-4 h-full">
        <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-sky-50 rounded-md transition-colors h-[48px]" style={{ fontFamily: 'var(--font-sans)' }}>
          <Waves className="w-5 h-5 text-sky-500" />
          <span>污染事件</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-sky-50 rounded-md transition-colors h-[48px]">
          <Wrench className="w-5 h-5 text-sky-500" />
          <span>應變資源</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-bold text-sky-500 bg-sky-50 border border-sky-200 rounded-md h-[48px]">
          <ClipboardList className="w-5 h-5 text-[#29abe2]" />
          <span>應變資源</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-sky-50 rounded-md transition-colors h-[48px]">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <span>擴散模擬</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-sky-50 rounded-md transition-colors h-[48px]">
          <Home className="w-5 h-5 text-sky-500" />
          <span>返回首頁</span>
        </button>
      </div>
    </nav>
  );
}
