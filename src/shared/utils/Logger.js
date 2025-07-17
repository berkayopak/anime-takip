/**
 * Logger - Advanced Logging System
 * Multi-level, multi-transport logging with rotation
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.options = {
            level: options.level || 'info',
            console: options.console !== false,
            file: options.file !== false,
            filename: options.filename || 'app.log',
            maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
            maxFiles: options.maxFiles || 5,
            datePattern: options.datePattern || 'YYYY-MM-DD',
            format: options.format || 'detailed',
            ...options
        };

        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            verbose: 4,
            debug: 5,
            silly: 6
        };

        this.colors = {
            error: '\x1b[31m',   // Red
            warn: '\x1b[33m',    // Yellow
            info: '\x1b[36m',    // Cyan
            http: '\x1b[35m',    // Magenta
            verbose: '\x1b[34m', // Blue
            debug: '\x1b[32m',   // Green
            silly: '\x1b[37m',   // White
            reset: '\x1b[0m'
        };

        this.logPath = this._getLogPath();
        this.currentLogFile = null;
        this.logStreams = new Map();

        this._ensureLogDirectory();
        this._initializeLogFile();
    }

    /**
     * Error level log
     */
    error(message, meta = {}) {
        this._log('error', message, meta);
    }

    /**
     * Warning level log
     */
    warn(message, meta = {}) {
        this._log('warn', message, meta);
    }

    /**
     * Info level log
     */
    info(message, meta = {}) {
        this._log('info', message, meta);
    }

    /**
     * HTTP level log
     */
    http(message, meta = {}) {
        this._log('http', message, meta);
    }

    /**
     * Verbose level log
     */
    verbose(message, meta = {}) {
        this._log('verbose', message, meta);
    }

    /**
     * Debug level log
     */
    debug(message, meta = {}) {
        this._log('debug', message, meta);
    }

    /**
     * Silly level log
     */
    silly(message, meta = {}) {
        this._log('silly', message, meta);
    }

    /**
     * Generic log method
     */
    log(level, message, meta = {}) {
        this._log(level, message, meta);
    }

    /**
     * Child logger oluştur (context ile)
     */
    child(defaultMeta = {}) {
        return new ChildLogger(this, defaultMeta);
    }

    /**
     * Log seviyesini değiştir
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.options.level = level;
        }
    }

    /**
     * Log dosyalarını temizle
     */
    clearLogs() {
        try {
            const files = fs.readdirSync(this.logPath);
            for (const file of files) {
                if (file.endsWith('.log')) {
                    fs.unlinkSync(path.join(this.logPath, file));
                }
            }
        } catch (error) {
            console.error('Error clearing logs:', error);
        }
    }

    /**
     * Log istatistikleri
     */
    getStats() {
        const stats = {
            logPath: this.logPath,
            currentFile: this.currentLogFile,
            level: this.options.level,
            transports: {
                console: this.options.console,
                file: this.options.file
            }
        };

        // Log dosya boyutları
        if (this.options.file) {
            try {
                const files = fs.readdirSync(this.logPath);
                stats.files = files
                    .filter(file => file.endsWith('.log'))
                    .map(file => {
                        const filePath = path.join(this.logPath, file);
                        const stat = fs.statSync(filePath);
                        return {
                            name: file,
                            size: stat.size,
                            created: stat.birthtime,
                            modified: stat.mtime
                        };
                    });
            } catch (error) {
                stats.filesError = error.message;
            }
        }

        return stats;
    }

    // ============ PRIVATE METHODS ============

    /**
     * Ana log metodu
     */
    _log(level, message, meta) {
        // Level kontrolü
        if (this.levels[level] > this.levels[this.options.level]) {
            return;
        }

        const logEntry = this._createLogEntry(level, message, meta);

        // Console transport
        if (this.options.console) {
            this._logToConsole(logEntry);
        }

        // File transport
        if (this.options.file) {
            this._logToFile(logEntry);
        }
    }

    /**
     * Log entry oluştur
     */
    _createLogEntry(level, message, meta) {
        const timestamp = new Date().toISOString();
        
        return {
            timestamp,
            level: level.toUpperCase(),
            message,
            meta: meta || {},
            pid: process.pid,
            hostname: require('os').hostname(),
            service: 'anime-takip'
        };
    }

    /**
     * Console'a log
     */
    _logToConsole(entry) {
        const color = this.colors[entry.level.toLowerCase()] || '';
        const reset = this.colors.reset;
        
        let output;
        
        switch (this.options.format) {
            case 'simple':
                output = `${color}[${entry.level}]${reset} ${entry.message}`;
                break;
            case 'detailed':
                output = `${color}${entry.timestamp} [${entry.level}]${reset} ${entry.message}`;
                if (Object.keys(entry.meta).length > 0) {
                    output += `\n${JSON.stringify(entry.meta, null, 2)}`;
                }
                break;
            case 'json':
                output = JSON.stringify(entry);
                break;
            default:
                output = `${color}${entry.timestamp} [${entry.level}]${reset} ${entry.message}`;
        }

        console.log(output);
    }

    /**
     * Dosyaya log
     */
    _logToFile(entry) {
        try {
            this._checkLogRotation();
            
            const logLine = JSON.stringify(entry) + '\n';
            
            if (this.currentLogFile) {
                fs.appendFileSync(this.currentLogFile, logLine);
            }
        } catch (error) {
            console.error('File logging error:', error);
        }
    }

    /**
     * Log path al
     */
    _getLogPath() {
        try {
            const { app } = require('electron');
            if (app && app.getPath) {
                return path.join(app.getPath('userData'), 'logs');
            }
        } catch (error) {
            // Electron yoksa
        }
        
        // Fallback
        const os = require('os');
        return path.join(os.homedir(), '.anime-takip', 'logs');
    }

    /**
     * Log dizinini oluştur
     */
    _ensureLogDirectory() {
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }
    }

    /**
     * Log dosyasını initialize et
     */
    _initializeLogFile() {
        if (!this.options.file) return;

        const today = new Date().toISOString().split('T')[0];
        this.currentLogFile = path.join(this.logPath, `${today}-${this.options.filename}`);
    }

    /**
     * Log rotation kontrolü
     */
    _checkLogRotation() {
        if (!this.currentLogFile) return;

        // Tarih değişimi kontrolü
        const today = new Date().toISOString().split('T')[0];
        const expectedFile = path.join(this.logPath, `${today}-${this.options.filename}`);
        
        if (this.currentLogFile !== expectedFile) {
            this.currentLogFile = expectedFile;
        }

        // Dosya boyutu kontrolü
        if (fs.existsSync(this.currentLogFile)) {
            const stats = fs.statSync(this.currentLogFile);
            if (stats.size > this.options.maxSize) {
                this._rotateLogFile();
            }
        }

        // Eski dosyaları temizle
        this._cleanupOldLogs();
    }

    /**
     * Log dosyasını rotate et
     */
    _rotateLogFile() {
        const timestamp = Date.now();
        const ext = path.extname(this.currentLogFile);
        const base = path.basename(this.currentLogFile, ext);
        const dir = path.dirname(this.currentLogFile);
        
        const rotatedFile = path.join(dir, `${base}-${timestamp}${ext}`);
        
        try {
            fs.renameSync(this.currentLogFile, rotatedFile);
        } catch (error) {
            console.error('Log rotation error:', error);
        }
    }

    /**
     * Eski log dosyalarını temizle
     */
    _cleanupOldLogs() {
        try {
            const files = fs.readdirSync(this.logPath)
                .filter(file => file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logPath, file),
                    stat: fs.statSync(path.join(this.logPath, file))
                }))
                .sort((a, b) => b.stat.mtime - a.stat.mtime);

            // Fazla dosyaları sil
            if (files.length > this.options.maxFiles) {
                const filesToDelete = files.slice(this.options.maxFiles);
                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                }
            }
        } catch (error) {
            console.error('Log cleanup error:', error);
        }
    }
}

/**
 * Child Logger - Context ile logging
 */
class ChildLogger {
    constructor(parentLogger, defaultMeta) {
        this.parent = parentLogger;
        this.defaultMeta = defaultMeta;
    }

    error(message, meta = {}) {
        this.parent.error(message, { ...this.defaultMeta, ...meta });
    }

    warn(message, meta = {}) {
        this.parent.warn(message, { ...this.defaultMeta, ...meta });
    }

    info(message, meta = {}) {
        this.parent.info(message, { ...this.defaultMeta, ...meta });
    }

    http(message, meta = {}) {
        this.parent.http(message, { ...this.defaultMeta, ...meta });
    }

    verbose(message, meta = {}) {
        this.parent.verbose(message, { ...this.defaultMeta, ...meta });
    }

    debug(message, meta = {}) {
        this.parent.debug(message, { ...this.defaultMeta, ...meta });
    }

    silly(message, meta = {}) {
        this.parent.silly(message, { ...this.defaultMeta, ...meta });
    }

    log(level, message, meta = {}) {
        this.parent.log(level, message, { ...this.defaultMeta, ...meta });
    }

    child(additionalMeta = {}) {
        return new ChildLogger(this.parent, { ...this.defaultMeta, ...additionalMeta });
    }
}

// Singleton instance
const logger = new Logger();

module.exports = { Logger, logger };
