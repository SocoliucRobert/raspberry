const STIL = {
  critic: 'bg-red-100 text-red-700',
  avertisment: 'bg-amber-100 text-amber-700',
  info: 'bg-brand-100 text-brand-700',
}

const ETICHETA = {
  critic: 'Critic',
  avertisment: 'Avertisment',
  info: 'Informativ',
}

export default function SeverityBadge({ severitate }) {
  return (
    <span className={`badge ${STIL[severitate] || STIL.info}`}>
      {ETICHETA[severitate] || severitate}
    </span>
  )
}
