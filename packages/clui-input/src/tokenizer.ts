export type TokenKind = 'KEYWORD' | 'KEYWORD_QUOTED' | 'WHITESPACE';

export interface IToken {
  kind: TokenKind;
  start: number;
  end: number;
  value: string;
}

export type Tokens = Array<IToken>;

const whitespace = /^\s+/;

export const tokenize = (input: string) => {
  const tokens: Tokens = [];
  let openQuote: null | '"' | "'" = null;
  let prevCtx: null | TokenKind = null;
  let i = 0;
  let value = '';

  while (i < input.length) {
    const char = input[i];
    const isWhitespace = whitespace.test(char) && !openQuote;
    const ctx = isWhitespace ? 'WHITESPACE' : 'KEYWORD';

    if (char === '"' || char === "'") {
      openQuote = openQuote ? null : char;
    }

    if (!prevCtx || prevCtx === ctx) {
      value += char;
    } else if (prevCtx && prevCtx !== ctx) {
      tokens.push({
        value,
        kind: prevCtx,
        start: i - value.length,
        end: i,
      });
      value = char;
    }

    prevCtx = ctx;
    i++;
  }

  // grab last token
  if (value && prevCtx) {
    tokens.push({
      value,
      kind: prevCtx,
      start: i - value.length,
      end: i,
    });
  }

  return tokens;
};
