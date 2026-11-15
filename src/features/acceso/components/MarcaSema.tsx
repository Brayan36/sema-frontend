export default function MarcaSema({ pequena = false }: { pequena?: boolean }) {
  return <span className={`ac-marca ${pequena ? 'ac-marca-pequena' : ''}`}>
    <svg viewBox="0 0 64 64" width="58" height="58" aria-hidden="true"><path d="M8 44C5 18 25 8 53 12 49 38 31 57 8 44Z" fill="#60a52e" /><path d="M11 43C26 45 44 34 53 12 47 36 29 58 11 43Z" fill="#2b751f" /><path d="M5 52c14-20 24-27 48-35" fill="none" stroke="#fff" strokeWidth="4" /><path d="M8 31C9 7 37 2 54 12" fill="none" stroke="#1496ba" strokeWidth="4" strokeLinecap="round" /></svg>
    <span>SEMA<small>Sistema Espacial de Monitoreo Agrícola</small></span>
  </span>;
}
