// Íconos de navegación en estilo line-art, a juego con QuillIcon.
// viewBox 24x24, stroke currentColor, sin relleno.

// Personaje — escudo con crestón rúnico
export function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3l7 2.5v5.5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V5.5L12 3z" /><path d="M12 8v5" /><path d="M9.5 10.5h5" /></svg>;
}

// Mundo — rosa de los vientos / compás
export function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></svg>;
}

// Misiones — pergamino enrollado
export function ScrollIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 4h9a2 2 0 0 1 2 2v11a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V4z" /><path d="M6 4a2 2 0 0 0-2 2v1h3" /><path d="M9 9h5" /><path d="M9 12.5h5" /></svg>;
}

// Mercado — monedas apiladas
export function CoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.66 3.13 3 7 3s7-1.34 7-3V7" /><path d="M5 12v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" /></svg>;
}

// Relatos — libro abierto (el códice)
export function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 6.5C10.3 5.3 7.8 4.7 5 4.7V17c2.8 0 5.3.6 7 1.8 1.7-1.2 4.2-1.8 7-1.8V4.7c-2.8 0-5.3.6-7 1.8z" /><path d="M12 6.5V18.8" /></svg>;
}
