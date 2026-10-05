import type { RoomId, UserId, UserRef } from '../../../core/models';

import { TYPING_TTL_MS, TypingStore } from './typing.store';

const ROOM = 'room-1' as RoomId;
const ada: UserRef = { id: 'u-ada' as UserId, nickname: 'ada', color: 'lilas', bot: true };
const grace: UserRef = { id: 'u-grace' as UserId, nickname: 'grace', color: 'corail', bot: true };

describe('TypingStore', () => {
  let store: TypingStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new TypingStore();
  });

  afterEach(() => {
    store.clear();
    vi.useRealTimers();
  });

  it('lists who is typing, once each, and forgets them after the TTL', () => {
    store.add(ROOM, ada);
    store.add(ROOM, grace);
    store.add(ROOM, ada);
    expect(store.typers(ROOM).map((u) => u.nickname)).toEqual(['grace', 'ada']);

    vi.advanceTimersByTime(TYPING_TTL_MS + 1_000);
    expect(store.typers(ROOM)).toEqual([]);
  });

  it('a renewed signal keeps the indicator alive', () => {
    store.add(ROOM, ada);
    vi.advanceTimersByTime(TYPING_TTL_MS - 1_000);
    store.add(ROOM, ada);
    vi.advanceTimersByTime(2_000);
    expect(store.typers(ROOM)).toHaveLength(1);
  });

  it('stops immediately when the message arrives', () => {
    store.add(ROOM, ada);
    store.remove(ROOM, ada.id);
    expect(store.typers(ROOM)).toEqual([]);
  });
});
