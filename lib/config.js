const getConfig = (config) => {
  const {
    weblateApiKey,
    weblateProjectUrl,
    weblateProject,
    weblateComponent,
    supportedLanguages,
    translationFunction,
    sourceDirectory,
    localesDirectory,
    temporaryDirectory,
  } = config;

  if (!weblateApiKey) throw new Error('weblateApiKey is required');
  if (!weblateProjectUrl) throw new Error('weblateProjectUrl is required');
  if (!weblateProject) throw new Error('weblateProject is required');
  if (!weblateComponent) throw new Error('weblateComponent is required');
  if (!supportedLanguages) throw new Error('supportedLanguages is required');
  if (!translationFunction) throw new Error('translationFunction is required');
  if (!sourceDirectory) throw new Error('sourceDirectory is required');
  if (!localesDirectory) throw new Error('localesDirectory is required');
  if (!temporaryDirectory) throw new Error('temporaryDirectory is required');

  return {
    weblateApiKey,
    weblateProjectUrl,
    weblateProject,
    weblateComponent,
    supportedLanguages,
    translationFunction,
    sourceDirectory,
    localesDirectory,
    temporaryDirectory,
  };
};

module.exports = getConfig;
