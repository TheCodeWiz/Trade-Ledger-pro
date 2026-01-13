interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  color?: 'green' | 'red' | 'yellow' | 'default';
}

export default function StatsCard({ title, value, icon, color = 'default' }: StatsCardProps) {
  const colorConfig = {
    green: {
      text: 'text-emerald-400',
      bg: 'from-emerald-500/10 to-emerald-500/5',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
    },
    red: {
      text: 'text-red-400',
      bg: 'from-red-500/10 to-red-500/5',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/15',
    },
    yellow: {
      text: 'text-yellow-400',
      bg: 'from-yellow-500/10 to-yellow-500/5',
      border: 'border-yellow-500/20',
      iconBg: 'bg-yellow-500/15',
    },
    default: {
      text: 'text-white',
      bg: 'from-gray-800/50 to-gray-900/50',
      border: 'border-gray-700/50',
      iconBg: 'bg-gray-700/50',
    },
  };

  const config = colorConfig[color];

  return (
    <div className={`bg-gradient-to-br ${config.bg} backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-6 border ${config.border} shadow-xl shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-gray-400 text-[10px] sm:text-sm font-medium truncate pr-2">{title}</span>
        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${config.iconBg} flex-shrink-0`}>
          <span className="text-base sm:text-xl">{icon}</span>
        </div>
      </div>
      <p className={`text-xl sm:text-3xl font-bold ${config.text} tracking-tight truncate`}>{value}</p>
    </div>
  );
}
