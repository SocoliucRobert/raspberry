// Sigla Universității „Ștefan cel Mare" din Suceava (USU)
// Reconstituire SVG a coroanei stilizate cu text opțional.

export default function UsuLogo({ className = 'h-10 w-10', cuText = false, alb = false }) {
  const inchis = alb ? '#ffffff' : '#1f4a8f'
  const deschis = alb ? 'rgba(255,255,255,0.55)' : '#8ec5e8'
  const textColor = alb ? '#ffffff' : '#1f4a8f'

  return (
    <div className="flex flex-col items-center">
      <svg
        className={className}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Sigla USU"
      >
        {/* Petală exterioară stânga - deschis */}
        <path
          d="M30 24 C 40 40, 44 58, 42 80 C 30 78, 20 70, 16 56 C 14 44, 20 32, 30 24 Z"
          fill={deschis}
        />
        {/* Petală exterioară dreapta - deschis */}
        <path
          d="M90 24 C 80 40, 76 58, 78 80 C 90 78, 100 70, 104 56 C 106 44, 100 32, 90 24 Z"
          fill={deschis}
        />
        {/* Petală interioară stânga - inchis */}
        <path
          d="M48 20 C 56 38, 58 58, 56 82 C 46 80, 38 70, 36 54 C 35 40, 40 28, 48 20 Z"
          fill={inchis}
        />
        {/* Petală interioară dreapta - inchis */}
        <path
          d="M72 20 C 64 38, 62 58, 64 82 C 74 80, 82 70, 84 54 C 85 40, 80 28, 72 20 Z"
          fill={inchis}
        />
        {/* Vârf central în formă de V - inchis */}
        <path
          d="M50 22 L 60 78 L 70 22 L 62 22 L 60 56 L 58 22 Z"
          fill={inchis}
        />
      </svg>
      {cuText && (
        <div className="mt-1 text-center leading-tight">
          <p className="text-xl font-extrabold tracking-wide" style={{ color: textColor }}>
            USU
          </p>
        </div>
      )}
    </div>
  )
}
