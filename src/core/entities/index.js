/**
 * Entities - Domain entities için index dosyası
 * 
 * Bu dosya tüm entity sınıflarını export eder
 */

const Anime = require('./Anime');
const Episode = require('./Episode');
const User = require('./User');

module.exports = {
    Anime,
    Episode,
    User
};
