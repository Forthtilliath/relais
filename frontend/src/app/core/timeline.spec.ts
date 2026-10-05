import type { ChatMessage, MessageView, RoomId, UserId, UserRef } from './models';
import { buildTimeline, mergeIncoming, prependOlder } from './timeline';

const ROOM = 'room-1' as RoomId;
const ada: UserRef = { id: 'u-ada' as UserId, nickname: 'ada', color: 'lilas', bot: true };
const me: UserRef = { id: 'u-me' as UserId, nickname: 'margot', color: 'azur', bot: false };

function view(id: number, author: UserRef, sentAt: string, clientId?: string): MessageView {
  return { id, roomId: ROOM, author, content: `#${id}`, sentAt, ...(clientId ? { clientId } : {}) };
}

function sent(id: number, author: UserRef, sentAt: string): ChatMessage {
  return {
    key: `m${id}`,
    id,
    clientId: null,
    roomId: ROOM,
    author,
    content: `#${id}`,
    sentAt,
    state: 'sent',
  };
}

describe('buildTimeline', () => {
  const now = new Date('2026-10-05T12:00:00');

  it('adds day separators and groups close messages from the same author', () => {
    const items = buildTimeline(
      [
        sent(1, ada, '2026-10-04T18:00:00'),
        sent(2, ada, '2026-10-05T09:00:00'),
        sent(3, ada, '2026-10-05T09:03:00'),
        sent(4, ada, '2026-10-05T09:30:00'),
      ],
      { meId: me.id, readUpTo: null },
      now,
    );
    expect(
      items.map((i) => (i.kind === 'message' ? `${i.key}${i.continued ? '+' : ''}` : i.kind)),
    ).toEqual(['day', 'm1', 'day', 'm2', 'm3+', 'm4']);
    expect(items[0]).toMatchObject({ label: 'Hier' });
    expect(items[2]).toMatchObject({ label: "Aujourd'hui" });
  });

  it('places the unread marker before the first message from someone else after the bookmark', () => {
    const items = buildTimeline(
      [
        sent(1, ada, '2026-10-05T09:00:00'),
        sent(2, me, '2026-10-05T09:01:00'),
        sent(3, ada, '2026-10-05T09:02:00'),
      ],
      { meId: me.id, readUpTo: 1 },
      now,
    );
    expect(items.map((i) => i.key)).toEqual(['day-m1', 'm1', 'm2', 'unread', 'm3']);
    expect(items.at(-1)).toMatchObject({ continued: false });
  });
});

describe('mergeIncoming', () => {
  it('confirms a pending message in place, keeping its key', () => {
    const pending: ChatMessage = {
      ...sent(0, me, '2026-10-05T09:00:00'),
      key: 'c-1',
      id: null,
      clientId: 'c-1',
      state: 'pending',
    };
    const merged = mergeIncoming(
      [sent(1, ada, '2026-10-05T08:00:00'), pending],
      view(7, me, '2026-10-05T09:00:01', 'c-1'),
    );
    expect(merged.map((m) => [m.key, m.id, m.state])).toEqual([
      ['m1', 1, 'sent'],
      ['c-1', 7, 'sent'],
    ]);
  });

  it('ignores duplicates and keeps confirmed messages ordered before pending ones', () => {
    const pending: ChatMessage = {
      ...sent(0, me, '2026-10-05T09:00:00'),
      key: 'c-2',
      id: null,
      state: 'pending',
    };
    const list = [sent(5, ada, '2026-10-05T08:00:00'), pending];
    expect(mergeIncoming(list, view(5, ada, '2026-10-05T08:00:00'))).toEqual(list);
    expect(mergeIncoming(list, view(6, ada, '2026-10-05T09:00:00')).map((m) => m.key)).toEqual([
      'm5',
      'm6',
      'c-2',
    ]);
  });
});

describe('prependOlder', () => {
  it('adds an older page above without duplicates', () => {
    const list = [sent(3, ada, '2026-10-05T09:00:00'), sent(4, ada, '2026-10-05T09:01:00')];
    const page = [view(2, ada, '2026-10-05T08:00:00'), view(3, ada, '2026-10-05T09:00:00')];
    expect(prependOlder(list, page).map((m) => m.id)).toEqual([2, 3, 4]);
  });
});
