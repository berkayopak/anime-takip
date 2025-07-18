// AnimeController
// ...anime operations controller...
export default class AnimeController {
  constructor(animeState, useCaseManager = null, ipc = null) {
    this.animeState = animeState;
    this.useCaseManager = useCaseManager;
    this.ipc = ipc;
  }

  async fetchAnimeList() {
    this.animeState.setLoading(true);
    try {
      let list = [];
      if (this.useCaseManager && this.useCaseManager.getAnimeList) {
        list = await this.useCaseManager.getAnimeList();
      } else if (this.ipc) {
        list = await this.ipc.invoke('get-anime-list');
      }
      this.animeState.setAnimeList(list);
    } catch (err) {
      this.animeState.setError(err);
    }
    this.animeState.setLoading(false);
  }

  async addAnime(anime) {
    try {
      if (this.useCaseManager && this.useCaseManager.addAnime) {
        await this.useCaseManager.addAnime(anime);
      } else if (this.ipc) {
        await this.ipc.invoke('add-anime', anime);
      }
      await this.fetchAnimeList();
    } catch (err) {
      this.animeState.setError(err);
    }
  }

  async updateAnime(updatedAnime) {
    try {
      if (this.useCaseManager && this.useCaseManager.updateAnime) {
        await this.useCaseManager.updateAnime(updatedAnime);
      } else if (this.ipc) {
        await this.ipc.invoke('update-anime', updatedAnime);
      }
      await this.fetchAnimeList();
    } catch (err) {
      this.animeState.setError(err);
    }
  }

  async deleteAnime(animeId) {
    try {
      if (this.useCaseManager && this.useCaseManager.deleteAnime) {
        await this.useCaseManager.deleteAnime(animeId);
      } else if (this.ipc) {
        await this.ipc.invoke('delete-anime', animeId);
      }
      await this.fetchAnimeList();
    } catch (err) {
      this.animeState.setError(err);
    }
  }

  selectAnime(anime) {
    this.animeState.selectAnime(anime);
  }
}
