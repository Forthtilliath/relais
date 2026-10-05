import { formatRelativeTime, isSameDay } from '@forthtilliath/ts-kit';

const CLOCK = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const DAY_WITH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** « 14:02 » */
export function clockTime(iso: string): string {
  return CLOCK.format(new Date(iso));
}

/** Séparateur de jour : « Aujourd'hui », « Hier », « lundi 5 octobre », « 3 mars 2025 ». */
export function dayLabel(date: Date, now: Date): string {
  if (isSameDay(date, now)) {
    return "Aujourd'hui";
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Hier';
  }
  const label = (date.getFullYear() === now.getFullYear() ? DAY : DAY_WITH_YEAR).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** « vu il y a 3 heures » / « jamais vu » */
export function lastSeenLabel(iso: string | null, now: Date): string {
  return iso ? `vu ${formatRelativeTime(new Date(iso), now, 'fr')}` : 'hors ligne';
}

/** « ada écrit… », « ada et grace écrivent… », « ada, grace et 2 autres écrivent… » */
export function typingLabel(names: readonly string[]): string | null {
  const [first, second] = names;
  if (first === undefined) {
    return null;
  }
  if (second === undefined) {
    return `${first} écrit…`;
  }
  if (names.length === 2) {
    return `${first} et ${second} écrivent…`;
  }
  const others = names.length - 2;
  return `${first}, ${second} et ${others} ${others > 1 ? 'autres' : 'autre'} écrivent…`;
}
