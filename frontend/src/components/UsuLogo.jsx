// Sigla oficială a Universității „Ștefan cel Mare" din Suceava (USU)
// Imaginea se află în /public/usu-logo.png și este folosită în toată aplicația.

export default function UsuLogo({ className = 'h-10 w-10' }) {
  return (
    <img
      src="/usu-logo.png"
      alt="Sigla USU - Universitatea Ștefan cel Mare Suceava"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  )
}
