import { NICKNAME_RULE, nicknameError, roomNameError, toRoomName } from './nickname';

describe('nicknameError', () => {
  it('mirrors the server rules', () => {
    expect(nicknameError('margot')).toBeNull();
    expect(nicknameError('  Dev_42-x ')).toBeNull();
    expect(nicknameError('')).toBe('Choisissez un indicatif.');
    expect(nicknameError('a')).toBe(NICKNAME_RULE);
    expect(nicknameError('élodie')).toBe(NICKNAME_RULE);
    expect(nicknameError('x'.repeat(25))).toBe(NICKNAME_RULE);
  });
});

describe('toRoomName', () => {
  it('turns free text into a channel slug while typing', () => {
    expect(toRoomName('Café Angular !')).toBe('cafe-angular-');
    expect(toRoomName('--Spring  Boot')).toBe('spring-boot');
  });
});

describe('roomNameError', () => {
  it('accepts slugs, tolerates a trailing dash while typing', () => {
    expect(roomNameError('angular-signals')).toBeNull();
    expect(roomNameError('angular-')).toBeNull();
    expect(roomNameError('a')).toBe('Au moins 2 caractères.');
  });
});
