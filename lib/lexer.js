const alwaysTrue = () => true;

const lexer = {
  addRule: (prevRules, regex, type, predicate = alwaysTrue) => [
    ...prevRules,
    { regex, type, predicate },
  ],
  ize: (rules, line) => {
    // Discard edge case right away:

    // Falsy or not a string -> []
    if (!line || typeof line !== 'string') {
      return [];
    }

    // A 1 character string -> [ 1 element ]
    if (line.length === 1) {
      return [{ type: null, value: line }];
    }

    // We assume that the string is greater or equal then 2 characters.

    // The token list to return.
    const tokens = [];
    // The current leftover buffer (offset to i)
    let raw = '';
    // The current buffer to match (i to end of string)
    let buffer = '';
    // The offset index to which the leftover ends.
    let offset = 0;
    // The index from which the buffer starts.
    for (let i = 0; i < line.length; i += 1) {
      // Update the unmatch and to be tested sub-strings.
      raw = line.substring(offset, i);
      buffer = line.substring(i);

      // Iterate on evert rules to find which matches or not the line.
      for (let ri = 0; ri < rules.length; ri += 1) {
        // Check current rule on current offset buffer.
        const match = rules[ri].predicate(tokens)
          ? buffer.match(rules[ri].regex)
          : null;

        if (match) {
          // Add previous unmatch sub-string as a raw token.
          if (raw.length > 0) {
            tokens.push({ type: null, value: line.substring(offset, i) });
          }

          // Add match buffer with correct type.
          const { type } = rules[ri];
          const value = match[0];
          tokens.push({ type, value });

          // Skip the current match and reset the previously unmatch sub-string offset.
          i += match[0].length - 1;
          offset = i + 1;

          // Do not match other rules, you must add rules with the most important first.
          break;
        }
      }
    }

    // If a leading string does not match, save it as an unmatch sub-string.
    raw = line.substring(offset);
    if (raw.length > 0) {
      tokens.push({ type: null, value: raw });
    }

    return tokens;
  },
};

class Lexer {
  constructor() {
    this.rules = [];
  }

  addRule(regex, type, predicate = alwaysTrue) {
    this.rules = lexer.addRule(this.rules, regex, type, predicate);
  }

  ize(line) {
    return lexer.ize(this.rules, line);
  }
}

module.exports = {
  lexer,
  Lexer,
};
