// SearchController
// ...search operations controller...
export default class SearchController {
  constructor(animeState, ipc = null) {
    this.animeState = animeState;
    this.searchResults = [];
    this.query = '';
    this.ipc = ipc;
  }

  setQuery(query) {
    this.query = query;
  }

  getQuery() {
    return this.query;
  }

  async search() {
    let list = this.animeState.getAnimeList();
    if (this.ipc) {
      try {
        list = await this.ipc.invoke('search-anime', this.query);
      } catch (err) {
        // Optionally handle error
      }
    }
    if (!this.query) {
      this.searchResults = list;
    } else {
      this.searchResults = list.filter(anime =>
        anime.title && anime.title.toLowerCase().includes(this.query.toLowerCase())
      );
    }
    return this.searchResults;
  }

  getResults() {
    return this.searchResults;
  }
}
