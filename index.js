// Base: https://github.com/mrdoob/three.js/blob/master/utils/converters/fbx2three.js

const fs = require('fs');
const path = require('path');
const findFilesInDir = require('./tools/findFilesInDir');

if (process.argv.length <= 2) {
  console.log(`Usage: ${path.basename(__filename)} model.fbx`);
  process.exit(-1);
}

global.THREE = require('three/build/three.js');
require('three/examples/js/curves/NURBSCurve.js');
require('three/examples/js/curves/NURBSUtils.js');
require('three/examples/js/loaders/FBXLoader.js');
global.Zlib = require('three/examples/js/libs/inflate.min.js').Zlib;

const PRECISION = 6;
const DIST_DIR_NAME = 'dist';

const parseNumber = (key, value) => typeof value === 'number'
  ? parseFloat(value.toFixed(PRECISION))
  : value;

global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  URL: {
    createObjectURL: function () {
      throw new Error('fbx2three: Images in binary format not yet supported.');
    }
  }
};

// HTML Images are not available, so use a Buffer instead.
THREE.ImageLoader.prototype.load = function (url, onLoad) {
  if (this.path !== undefined) url = this.path + url;
  // If image isn't found, try to ignore it.
  if (!fs.existsSync(url)) {
    onLoad(new Buffer(''));
    return;
  }

  onLoad(fs.readFileSync(url));
};

// Convert image buffer to data URL.
THREE.ImageUtils.getDataURL = function (image) {
  if (!(image instanceof Buffer)) {
    throw new Error('fbx2three: Image should be loaded as Buffer.');
  }
  let dataURL = 'data:';
  dataURL += this.format === THREE.RGBAFormat ? 'image/png' : 'image/jpeg';
  dataURL += ';base64,';
  dataURL += image.toString('base64');
  return dataURL;
};

const dir = process.argv[2];
const loader = new THREE.FBXLoader();

findFilesInDir(dir, /\.fbx$/)
  .then(files => {
    const tasks = files.map(fileName => {
      const resourceDirectory = THREE.LoaderUtils.extractUrlBase(fileName);
      const arraybuffer = fs.readFileSync(fileName).buffer;
      const object = loader.parse(
        arraybuffer,
        resourceDirectory,
      );
      const content = JSON.stringify(object.toJSON(), parseNumber);

      return new Promise(resolve => {
        fs.readdir(DIST_DIR_NAME, (error) => {
          if (error) {
            fs.mkdirSync(DIST_DIR_NAME);
          }

          fs.writeFileSync(DIST_DIR_NAME + '/' + path.basename(fileName, '.fbx') + '.json', content, 'utf8');
          resolve();
        });
      });
    });

    return Promise.all(tasks);
  });

