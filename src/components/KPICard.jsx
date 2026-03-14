export default function KPICard({ label, value, unit, sub, accent, icon: Icon, className = '' }) {
  const accentColors = {
    blue:   'border-l-brand',
    green:  'border-l-emerald-500',
    orange: 'border-l-amber-500',
    red:    'border-l-red-500',
    gray:   'border-l-stone-300',
  }
  const border = accentColors[accent] || accentColors.blue

  return (
    <div className={`card border-l-4 ${border} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="kpi-label">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="kpi-value">{value ?? '—'}</span>
            {unit && <span className="kpi-unit">{unit}</span>}
          </div>
          {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center flex-shrink-0 ml-2">
            <Icon size={16} className="text-stone-400" />
          </div>
        )}
      </div>
    </div>
  )
}
