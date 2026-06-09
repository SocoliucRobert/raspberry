import {
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  Wind,
  Cloud,
  Activity,
  Zap,
  Volume2,
  Waves,
  Cpu,
  CloudSun,
  ShieldCheck,
  Sprout,
  Camera,
  ToggleRight,
} from 'lucide-react'

// Metadate pentru metricile de senzori
export const METRICI = {
  temperatura: { eticheta: 'Temperatură', unitate: '°C', icon: Thermometer, culoare: '#ef4444' },
  umiditate: { eticheta: 'Umiditate', unitate: '%', icon: Droplets, culoare: '#3b82f6' },
  presiune: { eticheta: 'Presiune', unitate: 'hPa', icon: Gauge, culoare: '#8b5cf6' },
  luminozitate: { eticheta: 'Luminozitate', unitate: 'lx', icon: Sun, culoare: '#f59e0b' },
  viteza_vant: { eticheta: 'Viteză vânt', unitate: 'km/h', icon: Wind, culoare: '#06b6d4' },
  co2: { eticheta: 'CO₂', unitate: 'ppm', icon: Cloud, culoare: '#64748b' },
  nivel_apa: { eticheta: 'Nivel apă', unitate: '%', icon: Waves, culoare: '#0ea5e9' },
  tensiune: { eticheta: 'Tensiune', unitate: 'V', icon: Zap, culoare: '#eab308' },
  curent: { eticheta: 'Curent', unitate: 'A', icon: Zap, culoare: '#f97316' },
  putere: { eticheta: 'Putere', unitate: 'W', icon: Zap, culoare: '#22c55e' },
  zgomot: { eticheta: 'Zgomot', unitate: 'dB', icon: Volume2, culoare: '#a855f7' },
  calitate_aer: { eticheta: 'Calitate aer', unitate: 'AQI', icon: Cloud, culoare: '#14b8a6' },
}

export function metricaInfo(cheie) {
  return (
    METRICI[cheie] || {
      eticheta: cheie ? cheie.charAt(0).toUpperCase() + cheie.slice(1) : 'Necunoscut',
      unitate: '',
      icon: Activity,
      culoare: '#64748b',
    }
  )
}

// Tipuri de dispozitive
export const TIPURI_DISPOZITIV = {
  senzor: { eticheta: 'Senzor', icon: Cpu },
  senzor_climat: { eticheta: 'Senzor climat', icon: Thermometer },
  statie_meteo: { eticheta: 'Stație meteo', icon: CloudSun },
  monitorizare: { eticheta: 'Monitorizare', icon: ShieldCheck },
  agricultura: { eticheta: 'Agricultură', icon: Sprout },
  actuator: { eticheta: 'Actuator', icon: ToggleRight },
  camera: { eticheta: 'Cameră', icon: Camera },
  altul: { eticheta: 'Altul', icon: Cpu },
}

export function tipInfo(cheie) {
  return TIPURI_DISPOZITIV[cheie] || { eticheta: cheie || 'Dispozitiv', icon: Cpu }
}
