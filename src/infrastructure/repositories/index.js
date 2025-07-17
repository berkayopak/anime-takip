/**
 * Repositories - Repository implementasyonları için index dosyası
 */

const SqliteAnimeRepository = require('./SqliteAnimeRepository');
const SqliteEpisodeRepository = require('./SqliteEpisodeRepository');
const SqliteUserRepository = require('./SqliteUserRepository');

module.exports = {
    SqliteAnimeRepository,
    SqliteEpisodeRepository,
    SqliteUserRepository
};
