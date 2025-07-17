const path = require('path');
const FileManager = require('../../infrastructure/services/FileManager');
const Config = require('./Config');

// Test için temp bir FileManager instance'ı oluştur
const baseDir = path.join(__dirname, '../../../test-temp');
const fileManager = new FileManager(baseDir);

// Test config dosya yolu: test-temp/config.json
const config = new Config(fileManager);

console.log('Başlangıç config:', config.getAll());

// Set ve get testleri
test('set/get', () => {
    config.set('app.debug', true);
    const debug = config.get('app.debug');
    if (debug !== true) throw new Error('set/get başarısız');
});

test('env config', () => {
    const envConfig = config.getEnv('app.debug');
    if (typeof envConfig === 'undefined') throw new Error('getEnv başarısız');
});

test('delete', () => {
    config.set('test.customKey', 'foo');
    config.delete('test.customKey');
    if (config.get('test.customKey', undefined) !== undefined) throw new Error('delete başarısız');
});

test('validate', () => {
    const schema = {
        'app.debug': { required: true, type: 'boolean' },
        'window.width': { required: true, type: 'number', min: 100, max: 2000 }
    };
    const result = config.validate(schema);
    if (!result.valid) throw new Error('validate başarısız: ' + JSON.stringify(result.errors));
});

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
    } catch (e) {
        console.error(`✗ ${name}:`, e.message);
    }
}

// Temizlik: testten sonra config dosyasını silmek isterseniz fileManager ile silebilirsiniz.
