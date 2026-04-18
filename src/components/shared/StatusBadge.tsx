import { statusBadge } from '@/lib/utils'

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${statusBadge(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
