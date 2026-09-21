import { motion } from 'motion/react';
import { Users, Droplet, FlaskConical } from 'lucide-react';
import { Responder } from '../types';

interface StatsRowProps {
  filteredResponders: Responder[];
}

export default function StatsRow({ filteredResponders }: StatsRowProps) {
  const queryCount = filteredResponders.length;
  const oilCount = filteredResponders.filter(r => r.type === '油污染訓').length;
  const chemCount = filteredResponders.filter(r => r.type === '化學訓').length;

  const cards = [
    {
      id: 'query',
      label: '查詢人數',
      value: queryCount,
      icon: Users,
      colorClass: 'text-[#29abe2]',
      bgClass: 'bg-sky-50',
      borderClass: 'border-l-4 border-l-[#29abe2]',
    },
    {
      id: 'oil',
      label: '油污染訓人員',
      value: oilCount,
      icon: Droplet,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      borderClass: 'border-l-4 border-l-amber-500',
    },
    {
      id: 'chem',
      label: '化學訓人員',
      value: chemCount,
      icon: FlaskConical,
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-50',
      borderClass: 'border-l-4 border-l-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4.5" id="stats-row-container">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs ${card.borderClass}`}
            id={`stat-card-${card.id}`}
          >
            <div>
              <div className="text-[11px] font-bold text-gray-500 mb-0.5 tracking-wider uppercase">
                {card.label}
              </div>
              <div className="text-2xl font-black text-slate-800 font-mono tracking-tight">
                {card.value}
              </div>
            </div>
            <div className={`p-2.5 rounded-lg ${card.bgClass} ${card.colorClass}`}>
              <Icon className="w-5 h-5 stroke-[2.25]" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
