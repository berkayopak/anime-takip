// FileManager.js
// Advanced file, asset and config management service

const fs = require('fs');
const path = require('path');

class FileManager {
  // Create a directory (recursive)
  mkdir(relDir, options = { recursive: true }) {
    const dirPath = path.isAbsolute(relDir) ? relDir : path.join(this.baseDir, relDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, options);
    }
  }

  // Watch a file for changes (callback: (curr, prev) => {})
  watchFile(relPath, callback) {
    const filePath = path.isAbsolute(relPath) ? relPath : path.join(this.baseDir, relPath);
    if (fs.existsSync(filePath)) {
      fs.watchFile(filePath, callback);
    }
  }
  constructor(baseDir = path.join(__dirname, '../../../assets')) {
    this.baseDir = baseDir;
  }

  // Read a file (returns string or Buffer)
  readFile(relPath, encoding = 'utf-8') {
    const filePath = path.isAbsolute(relPath) ? relPath : path.join(this.baseDir, relPath);
    return fs.readFileSync(filePath, encoding);
  }

  // Write data to a file
  writeFile(relPath, data, encoding = 'utf-8') {
    const filePath = path.isAbsolute(relPath) ? relPath : path.join(this.baseDir, relPath);
    fs.writeFileSync(filePath, data, encoding);
  }

  // Delete a file
  deleteFile(relPath) {
    const filePath = path.isAbsolute(relPath) ? relPath : path.join(this.baseDir, relPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  // Copy a file
  copyFile(srcRelPath, destRelPath) {
    const src = path.isAbsolute(srcRelPath) ? srcRelPath : path.join(this.baseDir, srcRelPath);
    const dest = path.isAbsolute(destRelPath) ? destRelPath : path.join(this.baseDir, destRelPath);
    fs.copyFileSync(src, dest);
  }

  // List files in a directory
  listFiles(relDir = '') {
    const dirPath = path.isAbsolute(relDir) ? relDir : path.join(this.baseDir, relDir);
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath);
  }

  // Check if file exists
  exists(relPath) {
    const filePath = path.isAbsolute(relPath) ? relPath : path.join(this.baseDir, relPath);
    return fs.existsSync(filePath);
  }
}

module.exports = FileManager;
