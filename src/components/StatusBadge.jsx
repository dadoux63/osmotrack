import { STATUS_CONFIG } from '../utils/maintenance'

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  const classes = size === 'lg'
    ? config.className.replace('text-xs', 'text-sm') + ' px-3 py-1'
    : config.className

  return <span className={classes}>{config.label}</span>
}
