/** Règles d'un indicatif, miroir de Nicknames.java. */

export const NICKNAME_RULE = '2 à 24 caractères : lettres sans accent, chiffres, _ ou -.';
const NICKNAME = /^[A-Za-z0-9_-]{2,24}$/;

/** Message d'erreur à afficher, ou null si l'indicatif est valide. */
export function nicknameError(value: string): string | null {
  const nickname = value.trim();
  if (!nickname) {
    return 'Choisissez un indicatif.';
  }
  return NICKNAME.test(nickname) ? null : NICKNAME_RULE;
}

export function nicknameKey(nickname: string): string {
  return nickname.trim().toLowerCase();
}

/** Nom de canal à partir d'une saisie libre : « Angular Signals ! » → « angular-signals ». */
export function toRoomName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 32);
}

export function roomNameError(name: string): string | null {
  const trimmed = name.replace(/-+$/, '');
  if (trimmed.length < 2) {
    return 'Au moins 2 caractères.';
  }
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed) ? null : 'Minuscules, chiffres et tirets.';
}
