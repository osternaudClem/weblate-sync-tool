# Weblate Sync Locales

A tool to synchronize translation files with Weblate.

## Installation

```sh
npm install weblate-sync-tool
```

or

```sh
yarn add weblate-sync-tool
```

## Config sample

```
{
  "weblateApiKey": "your_api_key",
  "weblateProjectUrl": "https://weblate.example.com/api",
  "weblateProject": "my-project",
  "weblateComponent": "my-component",
  "supportedLanguages": ["en", "fr"],
  "translationFunction": "t"
  "sourceDirectory": "src",
  "localesDirectory": "src/locales",
  "temporaryDirectory": "tmp",
}
```

### Configuration Parameters

- `weblateApiKey`: Your Weblate API key. This is required to authenticate with the Weblate server.
- `weblateProjectUrl`: The base URL of your Weblate project API.
- `weblateProject`: The name of your Weblate project.
- `weblateComponent`: The name of the component within your Weblate project.
- `supportedLanguages`: An array of languages you want to synchronize.
- `translationFunction`: The name of the function used for translations in your code (e.g., t).
- `sourceDirectory`: The root directory of your project where source files are located.
- `localesDirectory`: The local path where translation files are stored.
- `temporaryDirectory`: A temporary directory to store intermediate files. This directory will be cleaned up after the process completes.

## How to use it

```sh
mkdir -p src/locales
touch src/locales/template.tpl
```

### Template

You need to create a `locales` folder in your poject and create a `template.tpl` file.
The part with `#MESSAGES#` will be replaced by the translations.

```
const translations = {
  messages: "#MESSAGES#"
};

export default translations;
```

### Create a runtfile

```sh
touch runfile.js
```

```js
const weblateSyncLocal = require('translation-sync-tool');

const config = {
  weblateApiKey: 'MY KEY',
  weblateProjectUrl: 'https://weblate.example.com/api',
  weblateProject: 'my-project',
  weblateComponent: 'my-component',
  supportedLanguages: ['en', 'fr'],
  translationFunction: 't',
  sourceDirectory: 'src',
  localesDirectory: 'src/locales',
  temporaryDirectory: 'locales_tmp',
};

weblateSyncLocal(config);
```

Create a new script in your `package.json`

```json
"scripts": {
  "sync:locales": "node runfile.js"
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.
