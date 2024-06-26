const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const readdirRecursive = require('recursive-readdir');
const { reduce } = require('p-iteration');

const readFile = (directory, filename = '') => {
  return fs.readFileSync(path.join(directory, filename), 'utf-8');
};

const writeFile = (directory, filename, content) => {
  fs.writeFileSync(path.join(directory, filename), content);
};

const extractZip = (zipFilePath, outputDir) => {
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(outputDir, true);
};

const listFilesRecursive = async (srcPath, extensions) => {
  return await reduce(
    srcPath,
    async (result, entryPoint) => {
      const files = await readdirRecursive(entryPoint, [
        (file, stats) =>
          stats.isDirectory()
            ? false
            : !extensions.includes(path.extname(file)),
      ]);
      return [...result, ...files];
    },
    []
  );
};

const removeDirectory = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeDirectory(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
};

module.exports = {
  readFile,
  writeFile,
  extractZip,
  listFilesRecursive,
  removeDirectory,
};
