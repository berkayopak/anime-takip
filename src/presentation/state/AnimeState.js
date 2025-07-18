// AnimeState
// ...anime-specific state management...
export default class AnimeState {
  constructor(ipc = null, useCaseManager = null) {
    this.animeList = [];
    this.selectedAnime = null;
    this.loading = false;
    this.error = null;
    this.ipc = ipc; // Electron IPC renderer
    this.useCaseManager = useCaseManager; // UseCaseManager instance
  }

  async loadAnimeList() {
    this.setLoading(true);
    try {
      // Prefer UseCaseManager if available, fallback to IPC
      let list = [];
      if (this.useCaseManager && this.useCaseManager.getAnimeList) {
        list = await this.useCaseManager.getAnimeList();
      } else if (this.ipc) {
        list = await this.ipc.invoke('get-anime-list');
      }
      this.setAnimeList(list);
      this.setError(null);
    } catch (err) {
      this.setError(err);
    }
    this.setLoading(false);
  }

  async persistAnimeList() {
    try {
      if (this.useCaseManager && this.useCaseManager.saveAnimeList) {
        await this.useCaseManager.saveAnimeList(this.animeList);
      } else if (this.ipc) {
        await this.ipc.invoke('save-anime-list', this.animeList);
      }
    } catch (err) {
      this.setError(err);
    }
  }

  setAnimeList(list) {
    this.animeList = Array.isArray(list) ? list : [];
  }

  getAnimeList() {
    return this.animeList;
  }

  selectAnime(anime) {
    this.selectedAnime = anime;
  }

  getSelectedAnime() {
    return this.selectedAnime;
  }

  setLoading(isLoading) {
    this.loading = !!isLoading;
  }

  isLoading() {
    return this.loading;
  }

  setError(error) {
    this.error = error;
  }

  getError() {
    return this.error;
  }

  resetState() {
    this.animeList = [];
    this.selectedAnime = null;
    this.loading = false;
    this.error = null;
  }
}
