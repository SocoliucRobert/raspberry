export default function StatusBadge({ stare }) {
  const online = stare === 'online'
  return (
    <span
      className={`badge ${
        online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-400'} ${
          online ? 'animate-pulse' : ''
        }`}
      />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}
