export default function Breadcrumb() {
  return (
    <div className="bg-slate-50 border-b border-gray-100 px-5 py-2 text-[12px] text-gray-500 font-medium flex items-center gap-1.5" id="em-breadcrumb">
      <a href="#" className="hover:text-sky-500 transition-colors">首頁</a>
      <span className="text-gray-300">/</span>
      <a href="#" className="hover:text-sky-500 transition-colors">應變資源</a>
      <span className="text-gray-300">/</span>
      <span className="text-gray-700 font-bold">應變人員清冊</span>
    </div>
  );
}
