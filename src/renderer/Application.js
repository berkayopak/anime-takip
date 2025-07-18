// Application.js - Renderer Entry Point
// Clean Architecture + Feature-based Hybrid

import { AppState } from '../presentation/state/AppState';
import { AnimeState } from '../presentation/state/AnimeState';
import { UIState } from '../presentation/state/UIState';
import { AnimeController } from '../presentation/controllers/AnimeController';
import { SearchController } from '../presentation/controllers/SearchController';
import { NavigationController } from '../presentation/controllers/NavigationController';
import { MainView } from '../presentation/views/MainView';
import { SettingsView } from '../presentation/views/SettingsView';

// Global state/context
const appState = new AppState();
const animeState = new AnimeState();
const uiState = new UIState();

// Controllers
const animeController = new AnimeController(appState, animeState, uiState);
const searchController = new SearchController(appState, animeState, uiState);
const navigationController = new NavigationController(appState, animeState, uiState);

// Views
const mainView = new MainView(appState, animeState, uiState, animeController, searchController, navigationController);
const settingsView = new SettingsView(appState, uiState, navigationController);

// Lifecycle: DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  // Mount main view and components
  mainView.mount();
  settingsView.mount();

  // Mount UI components
  mainView.mountComponents(); // AnimeCard, SearchBox, TabNavigation, ProgressBar, Modal

  // Bind global and component events
  navigationController.bindGlobalEvents();
  mainView.bindComponentEvents();

  // Initial state sync
  appState.init();
  animeState.init();
  uiState.init();
});

// Expose for debugging
window.__app = {
  appState,
  animeState,
  uiState,
  animeController,
  searchController,
  navigationController,
  mainView,
  settingsView
};
