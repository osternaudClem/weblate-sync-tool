const { reduce } = require('p-iteration');
const { readFile, writeFile, listFilesRecursive } = require('./fileUtils');
const { Lexer } = require('./lexer');

const formatKey = (key) =>
  key
    .replace(/^'(.+)'$/g, '$1')
    .replace(/^"(.+)"$/g, '$1')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\\\d/g, '\\d');

const parseLine = (lexer, line) =>
  lexer.ize(line).reduce(
    ({ result, state }, token) => {
      const newState = { ...state };
      if (token.type === 'FUNCTION_START') {
        newState.inFunc = true;
      } else if (token.type === 'FUNCTION_END') {
        newState.inFunc = false;
        const firstParam = newState.tokens[0];
        const thirdParam =
          newState.tokens.length === 3 &&
          newState.tokens[2].type === 'FUNCTION_ARG' &&
          newState.tokens[2];
        if (firstParam && firstParam.type === 'FUNCTION_ARG') {
          result.push({
            key: formatKey(firstParam.value),
            plural: thirdParam ? formatKey(thirdParam.value) : '',
          });
        }
        newState.tokens = [];
      } else if (newState.inFunc) {
        newState.tokens.push(token);
      }
      return { result, state: newState };
    },
    { result: [], state: { inFunc: false, tokens: [] } }
  ).result;

const getTranslationsFromFile = (lexer, filePath) => {
  const lines = readFile(filePath).split('\n');
  return lines.reduce((keys, line, lineno) => {
    const foundKeys = parseLine(lexer, line);
    const newKeys = foundKeys.map((entry) => ({
      ...entry,
      lineno,
      file: filePath,
    }));
    return [...keys, ...newKeys];
  }, []);
};

const getUsedKeys = async (srcPath, translationFunctionName) => {
  const lexer = new Lexer();
  lexer.addRule(new RegExp(`^${translationFunctionName}\\(`), 'FUNCTION_START');
  lexer.addRule(
    /^(,\s)?\[.*?\],?\s?/,
    'FUNCTION_ARRAY',
    (tokens) =>
      tokens.reduce(
        (result, token) =>
          token.type === 'FUNCTION_START'
            ? result + 1
            : token.type === 'FUNCTION_END'
            ? result - 1
            : result,
        0
      ) > 0
  );
  lexer.addRule(
    /^'(?:[^'\\]|\\.)*'/,
    'FUNCTION_ARG',
    (tokens) =>
      tokens.reduce(
        (result, token) =>
          token.type === 'FUNCTION_START'
            ? result + 1
            : token.type === 'FUNCTION_END'
            ? result - 1
            : result,
        0
      ) > 0
  );
  lexer.addRule(
    /^"(?:[^"\\]|\\.)*"/,
    'FUNCTION_ARG',
    (tokens) =>
      tokens.reduce(
        (result, token) =>
          token.type === 'FUNCTION_START'
            ? result + 1
            : token.type === 'FUNCTION_END'
            ? result - 1
            : result,
        0
      ) > 0
  );
  lexer.addRule(
    /^\)/,
    'FUNCTION_END',
    (tokens) =>
      tokens.reduce(
        (result, token) =>
          token.type === 'FUNCTION_START'
            ? result + 1
            : token.type === 'FUNCTION_END'
            ? result - 1
            : result,
        0
      ) > 0
  );

  const filePaths = await listFilesRecursive(srcPath, [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
  ]);

  return reduce(
    filePaths,
    async (result, filePath) => {
      const translations = await getTranslationsFromFile(lexer, filePath);
      translations.forEach((entry) => {
        if (!result[entry.key]) {
          entry.locations = [];
          result[entry.key] = entry;
        }
        result[entry.key].locations.push(
          `${entry.file.replace(/\\/g, '/')}:${entry.lineno}`
        );
      });
      return result;
    },
    {}
  );
};

const addMissingTranslations = (po, usedKeys) => {
  const poKeys = Object.keys(po.translations).reduce(
    (result, context) => Object.assign(result, po.translations[context]),
    {}
  );
  let count = 0;

  Object.keys(usedKeys)
    .filter((key) => !poKeys[key])
    .map((key) => usedKeys[key])
    .forEach((entry) => {
      const poEntry = {
        msgid: entry.key,
        msgstr: [''],
        comments: { reference: entry.locations.join('\n') },
      };
      if (entry.plural) {
        poEntry.msgid_plural = entry.plural;
        poEntry.msgstr[1] = '';
      }
      po.translations[''][poEntry.msgid] = poEntry;
      count++;
      console.log(`Adding new key: '${poEntry.msgid}'`);
    });

  return count;
};

const removeMissingTranslations = async (po, usedKeys) => {
  const removed = {};
  const translationKeys = Object.keys(po.translations);

  for (const context of translationKeys) {
    const entries = Object.keys(po.translations[context]).filter(
      (key) => key === '' || usedKeys[key]
    );
    po.translations[context] = entries.map(
      (key) => po.translations[context][key]
    );
    Object.keys(po.translations[context]).forEach((key) => {
      if (!usedKeys[key]) removed[key] = po.translations[context][key];
    });
  }

  return Object.keys(removed).length > 0 ? removed : null;
};

const transformToJedFormat = (poData) => {
  const jedData = {
    domain: 'messages',
    locale_data: {
      messages: {
        '': {
          domain: 'messages',
          plural_forms: poData.headers['plural-forms'],
        },
      },
    },
  };

  for (const key in poData.translations) {
    const context = poData.translations[key];
    for (const msgid in context) {
      if (msgid === '') continue; // Skip the headers entry

      const translation = context[msgid];
      const msgid_plural = translation.msgid_plural;

      jedData.locale_data.messages[translation.msgid] = [
        translation.msgstr[1],
        translation.msgstr[0],
      ];
    }
  }

  return jedData;
};

const writeJSCatalog = async (localesPath, po, lang, fileExt = 'js') => {
  const catalog = transformToJedFormat(po);

  const { messages } = catalog.locale_data;

  const orderedMessages = Object.keys(messages)
    .filter((key) => key !== '')
    .sort()
    .reduce((acc, key) => {
      acc[key] = messages[key];
      return acc;
    }, {});

  const file = await readFile(localesPath, 'template.tpl');
  const content = file.replace(
    '"#MESSAGES#"',
    JSON.stringify(orderedMessages, null, 2)
  );
  writeFile(localesPath, `${lang}.${fileExt}`, content);
};

module.exports = {
  getUsedKeys,
  addMissingTranslations,
  removeMissingTranslations,
  writeJSCatalog,
};
