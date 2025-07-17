// Use Cases Index
// Centralized export for all use cases

// Base use case
const BaseUseCase = require('./BaseUseCase');

// Anime use cases
const AddAnime = require('./anime/AddAnime');
const SearchAnime = require('./anime/SearchAnime');
const UpdateAnime = require('./anime/UpdateAnime');
const DeleteAnime = require('./anime/DeleteAnime');

// Episode use cases
const MarkWatched = require('./episodes/MarkWatched');
const SyncEpisodes = require('./episodes/SyncEpisodes');

// Notification use cases
const ShowNotification = require('./notifications/ShowNotification');
const CheckUpdates = require('./notifications/CheckUpdates');

module.exports = {
  // Base
  BaseUseCase,
  
  // Anime operations
  AddAnime,
  SearchAnime,
  UpdateAnime,
  DeleteAnime,
  
  // Episode operations
  MarkWatched,
  SyncEpisodes,
  
  // Notification operations
  ShowNotification,
  CheckUpdates,
};
