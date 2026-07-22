const DAY_NAMES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

// Fechas calendario fijas aproximadas (no el cálculo astronómico exacto, que varía ±1 día por año).
// Suficiente para uso personal; no es precisión de observatorio.
const CELESTIAL_MARKERS: Record<string, string> = {
  "03-20": "EQUINOCCIO DE PRIMAVERA",
  "06-21": "SOLSTICIO DE VERANO",
  "09-22": "EQUINOCCIO DE OTOÑO",
  "12-21": "SOLSTICIO DE INVIERNO"
};

export function formatAdventurerTimestamp(date: Date): { dateLine: string; timeLine: string; celestialEvent?: string } {
  const dayName = capitalize(DAY_NAMES[date.getDay()]);
  const month = capitalize(MONTH_NAMES[date.getMonth()]);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const key = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return {
    dateLine: `Día ${dayName}, ${date.getDate()} de ${month} de la Edad ${date.getFullYear()}`,
    timeLine: `las ${hours}:${minutes} hrs`,
    celestialEvent: CELESTIAL_MARKERS[key]
  };
}

export function monthName(monthIndex: number): string {
  return capitalize(MONTH_NAMES[monthIndex]);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
