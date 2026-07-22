import { QuillIcon } from "../shared/icons/QuillIcon.tsx";
import { BookIcon, ShieldIcon, CompassIcon, ScrollIcon, CoinIcon } from "../shared/icons/GameIcons.tsx";

const TABS = [
  { href: "/", label: "Diario", key: "diario", Icon: QuillIcon },
  { href: "/relatos", label: "Relatos", key: "relatos", Icon: BookIcon },
  { href: "#", label: "Personaje", key: "personaje", Icon: ShieldIcon },
  { href: "#", label: "Mundo", key: "mundo", Icon: CompassIcon },
  { href: "#", label: "Misiones", key: "misiones", Icon: ScrollIcon },
  { href: "#", label: "Mercado", key: "mercado", Icon: CoinIcon }
];

export function BottomNav({ active }: { active: string }) {
  return <nav className="bottom-nav">{TABS.map(({ href, label, key, Icon }) =>
    <a key={key} href={href} data-active={key === active ? "true" : undefined}><Icon width={20} height={20} />{label}</a>
  )}</nav>;
}
