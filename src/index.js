const getConfig = require('../lib/config');
const { forEachSeries } = require('p-iteration');

const { retrievePoFiles, sendPoFiles } = require('../lib/weblateUtils');
const {
  getUsedKeys,
  addMissingTranslations,
  removeMissingTranslations,
  writeJSCatalog,
} = require('../lib/translations');
const { readFile, writeFile, removeDirectory } = require('../lib/fileUtils');

const sync = async (config) => {
  const gettextParser = await import('gettext-parser');
  const usedKeys = await getUsedKeys(
    [config.sourceDirectory],
    config.translationFunction
  );

  await retrievePoFiles(config);
  const updatedPo = [];
  let newKeyCount = 0;

  await forEachSeries(config.supportedLanguages, async (lang) => {
    const poFilename = `${config.weblateProject}/${config.weblateComponent}/${lang}.po`;
    console.log(`Processing ${lang}`);
    let poFile;
    try {
      poFile = readFile(config.temporaryDirectory, poFilename);
    } catch (e) {
      console.log(`Lang ${lang} not found`, poFilename);
      return;
    }
    const po = gettextParser.po.parse(poFile);

    console.log('Adding missing translations');
    const count = addMissingTranslations(po, usedKeys);

    if (count > 0) {
      newKeyCount = Math.max(newKeyCount, count);
      updatedPo.push(lang);
      writeFile(config.tmpDirectory, poFilename, gettextParser.po.compile(po));
    }

    if (config.supportedLanguages.includes(lang)) {
      console.log(`Generating catalog`);
      await removeMissingTranslations(po, usedKeys);
      await writeJSCatalog(config.localesDirectory, po, lang, 'js');
    }
  });

  if (updatedPo.length > 0) {
    await sendPoFiles(updatedPo, config);
    console.log(`${newKeyCount} keys added to Weblate.`);
  }

  // Clean up the temporary directory
  removeDirectory(config.temporaryDirectory);
};

const main = async (userConfig) => {
  const config = getConfig(userConfig);
  await sync(config);
};

module.exports = main;
