export default function StatCard({ title, value, icon: Icon, color, subtitle, trend }) {
  const colorMap = {
    blue: 'bg-pastel-primary/20 text-blue-600',
    green: 'bg-pastel-secondary/30 text-green-600',
    pink: 'bg-pastel-accent/30 text-red-500',
    purple: 'bg-pastel-purple/30 text-purple-600',
    orange: 'bg-pastel-orange/30 text-orange-600',
  };

  return (
    <div className="card flex items-start gap-4 hover:shadow-card transition-shadow duration-200">
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <span className={`text-xs font-medium mt-1 inline-block ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
          </span>
        )}
      </div>
    </div>
  );
}
