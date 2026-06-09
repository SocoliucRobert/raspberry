import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'

function _parse(iso) {
  if (!iso) return null
  try {
    return typeof iso === 'string' ? parseISO(iso) : iso
  } catch {
    return null
  }
}

export function dataOra(iso) {
  const d = _parse(iso)
  return d ? format(d, 'dd MMM yyyy, HH:mm', { locale: ro }) : '—'
}

export function doarOra(iso) {
  const d = _parse(iso)
  return d ? format(d, 'HH:mm', { locale: ro }) : '—'
}

export function candva(iso) {
  const d = _parse(iso)
  return d ? formatDistanceToNow(d, { locale: ro, addSuffix: true }) : '—'
}

export function numar(valoare, zecimale = 1) {
  if (valoare === null || valoare === undefined || Number.isNaN(valoare)) return '—'
  return Number(valoare).toLocaleString('ro-RO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: zecimale,
  })
}
