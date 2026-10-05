import { mentions, parseMessage } from './message-format';

describe('parseMessage', () => {
  it('splits text, mentions and links in order', () => {
    expect(parseMessage('Salut @ada, voir https://angular.dev.', 'grace')).toEqual([
      { kind: 'text', text: 'Salut ' },
      { kind: 'mention', text: '@ada', nickname: 'ada', self: false },
      { kind: 'text', text: ', voir ' },
      { kind: 'link', text: 'https://angular.dev', href: 'https://angular.dev' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('flags mentions of the reader, case-insensitively', () => {
    const [mention] = parseMessage('@Margot tu es là ?', 'margot');
    expect(mention).toEqual({ kind: 'mention', text: '@Margot', nickname: 'Margot', self: true });
  });

  it('follows the server rules: no mention inside an e-mail address', () => {
    expect(parseMessage('ada@example.com', 'ada')).toEqual([
      { kind: 'text', text: 'ada@example.com' },
    ]);
  });

  it('never produces markup from user content', () => {
    expect(parseMessage('<img src=x onerror=alert(1)>', null)).toEqual([
      { kind: 'text', text: '<img src=x onerror=alert(1)>' },
    ]);
  });
});

describe('mentions', () => {
  it('tells whether a message calls the given nickname', () => {
    expect(mentions('ping @linus', 'linus')).toBe(true);
    expect(mentions('ping @linuss', 'linus')).toBe(false);
  });
});
