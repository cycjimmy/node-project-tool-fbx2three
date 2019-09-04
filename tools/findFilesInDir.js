const fs = require('fs');
const path = require('path');

/**
 * findFilesInDir
 * @param dirPath
 * @param filter
 * @returns {Promise<void | never>}
 */
module.exports = (dirPath, filter) => Promise.resolve()
  .then(() => {
    if (!fs.existsSync(dirPath)) {
      console.log("no dir ", dirPath);
      return Promise.reject();
    }

    const allFiles = fs.readdirSync(dirPath);
    const filterFiles = [];

    allFiles.forEach(file => {
      const filename = path.join(dirPath, file);
      if (filter.test(filename)) {
        filterFiles.push(filename);
      }
    });

    return Promise.resolve(filterFiles);
  });
