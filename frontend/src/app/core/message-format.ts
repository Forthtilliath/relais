/**
 * Découpe un message en segments affichables sans jamais passer par innerHTML : texte brut, mentions
 * (même règle que Mentions.java) et liens http(s). Le template rend chaque segment avec l'élément adapté.
 */

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'mention'; text: string; nickname: string; self: boolean }
  | { kind: 'link'; text: string; href: string };

const TOKENS = /(?<![\w@])@([A-Za-z0-9_-]{2,24})(?![A-Za-z0-9_-])|\bhttps?:\/\/[^\s<>"']+/g;
/** Ponctuation qui termine une phrase plutôt qu'une URL : « voir https://angular.dev. » */
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

export function parseMessage(content: string, myNickname: string | null): Segment[] {
  const me = myNickname?.toLowerCase() ?? null;
  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of content.matchAll(TOKENS)) {
    const [raw, nickname] = match;
    const start = match.index;
    if (start > cursor) {
      segments.push({ kind: 'text', text: content.slice(cursor, start) });
    }
    if (nickname === undefined) {
      const href = raw.replace(TRAILING_PUNCTUATION, '');
      segments.push({ kind: 'link', text: href, href });
      cursor = start + href.length;
    } else {
      segments.push({ kind: 'mention', text: raw, nickname, self: nickname.toLowerCase() === me });
      cursor = start + raw.length;
    }
  }
  if (cursor < content.length) {
    segments.push({ kind: 'text', text: content.slice(cursor) });
  }
  return segments;
}

export function mentions(content: string, nickname: string): boolean {
  return parseMessage(content, nickname).some((s) => s.kind === 'mention' && s.self);
}
