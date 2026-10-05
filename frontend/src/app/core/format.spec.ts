import { dayLabel, typingLabel } from './format';

describe('typingLabel', () => {
  it('reads naturally from one to many people', () => {
    expect(typingLabel([])).toBeNull();
    expect(typingLabel(['ada'])).toBe('ada écrit…');
    expect(typingLabel(['ada', 'grace'])).toBe('ada et grace écrivent…');
    expect(typingLabel(['ada', 'grace', 'linus'])).toBe('ada, grace et 1 autre écrivent…');
    expect(typingLabel(['ada', 'grace', 'linus', 'margot'])).toBe(
      'ada, grace et 2 autres écrivent…',
    );
  });
});

describe('dayLabel', () => {
  const now = new Date('2026-10-05T12:00:00');

  it('names recent days and spells out older ones', () => {
    expect(dayLabel(new Date('2026-10-05T00:10:00'), now)).toBe("Aujourd'hui");
    expect(dayLabel(new Date('2026-10-04T23:50:00'), now)).toBe('Hier');
    expect(dayLabel(new Date('2026-10-02T10:00:00'), now)).toBe('Vendredi 2 octobre');
    expect(dayLabel(new Date('2025-03-03T10:00:00'), now)).toBe('3 mars 2025');
  });
});
