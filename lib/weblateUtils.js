const fs = require('fs');
const axios = require('axios');
const { extractZip, writeFile } = require('./fileUtils');

const retrievePoFiles = async (config) => {
  const url = `${config.weblateProjectUrl}/components/${config.weblateProject}/${config.weblateComponent}/file/`;
  const zipFilePath = `${config.temporaryDirectory}/po.zip`;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { Authorization: `Token ${config.weblateApiKey}` },
    });

    if (!fs.existsSync(config.temporaryDirectory)) {
      fs.mkdirSync(config.temporaryDirectory, { recursive: true });
    }

    writeFile(config.temporaryDirectory, 'po.zip', response.data);
    extractZip(zipFilePath, config.temporaryDirectory);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

const sendPoFiles = async (langs, config) => {
  console.log('Uploading PO files to Weblate');
  for (const lang of langs) {
    try {
      const url = `${config.weblateProjectUrl}/translations/${config.weblateProject}/${config.weblateComponent}/${lang}/file/`;
      const poFilename = `${config.temporaryDirectory}/${config.weblateProject}/${config.weblateComponent}/${lang}.po`;
      const content = fs.readFileSync(poFilename).toString();
      const formData = new FormData();

      formData.append(
        'file',
        new Blob([content], { type: 'text/plain' }),
        `${lang}.po`
      );
      formData.append('method', 'replace');

      await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Token ${config.weblateApiKey}`,
        },
      });

      console.info('File uploaded to Weblate:', lang);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
};

module.exports = {
  retrievePoFiles,
  sendPoFiles,
};
