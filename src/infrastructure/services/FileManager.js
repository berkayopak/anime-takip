// FileManager.js
// Advanced file, asset and config management service

const fs = require('fs');
const path = require('path');

class FileManager {
  // DRY helper: resolve path (optionally under assets/)
  _resolvePath(relPath, isAsset = false) {
    const base = isAsset ? path.join(this.baseDir, 'assets') : this.baseDir;
    return path.isAbsolute(relPath) ? relPath : path.join(base, relPath);
  }

  // Asset wrappers (use file methods)
  getAssetPath(assetName) {
    return this._resolvePath(assetName, true);
  }
  copyAsset(srcPath, assetName) {
    const dest = this.getAssetPath(assetName);
    this.mkdir(path.dirname(dest));
    this.copyFile(srcPath, dest);
    return dest;
  }
  deleteAsset(assetName) {
    return this.deleteFile(this.getAssetPath(assetName));
  }
  listAssets() {
    return this.listFiles('assets');
  }
  // Create a directory (recursive)
  mkdir(relDir, options = { recursive: true }) {
    const dirPath = this._resolvePath(relDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, options);
    }
  }

  // Watch a file for changes (callback: (curr, prev) => {})
  watchFile(relPath, callback) {
    const filePath = this._resolvePath(relPath);
    if (fs.existsSync(filePath)) {
      fs.watchFile(filePath, callback);
    }
  }
  constructor(baseDir = path.join(__dirname, '../../../assets')) {
    this.baseDir = baseDir;
  }

  // Read a file (returns string or Buffer)
  readFile(relPath, encoding = 'utf-8') {
    const filePath = this._resolvePath(relPath);
    return fs.readFileSync(filePath, encoding);
  }

  // Write data to a file
  writeFile(relPath, data, encoding = 'utf-8') {
    const filePath = this._resolvePath(relPath);
    fs.writeFileSync(filePath, data, encoding);
  }

  // Delete a file
  deleteFile(relPath) {
    const filePath = this._resolvePath(relPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  // Copy a file
  copyFile(srcRelPath, destRelPath) {
    const src = this._resolvePath(srcRelPath);
    const dest = this._resolvePath(destRelPath);
    fs.copyFileSync(src, dest);
  }

  // List files in a directory
  listFiles(relDir = '') {
    const dirPath = this._resolvePath(relDir);
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath);
  }

  // Check if file exists
  exists(relPath) {
    const filePath = this._resolvePath(relPath);
    return fs.existsSync(filePath);
  }
}

module.exports = FileManager;
