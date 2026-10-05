/**
 * Accès au stockage du navigateur qui ne casse jamais l'application : navigation privée, stockage bloqué
 * ou quota plein se traduisent par « rien de stocké ».
 */
export function readStored<T>(storage: () => Storage, key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStored(storage: () => Storage, key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) {
      storage().removeItem(key);
    } else {
      storage().setItem(key, JSON.stringify(value));
    }
  } catch {
    // Stockage indisponible : la session vivra le temps de l'onglet.
  }
}

export const local = (): Storage => localStorage;
export const perTab = (): Storage => sessionStorage;
