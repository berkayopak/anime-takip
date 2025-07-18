// MainView
// ...main application view...
import React, { useEffect, useState } from 'react';
import AnimeCard from '../components/AnimeCard';
import SearchBox from '../components/SearchBox';
import TabNavigation from '../components/TabNavigation';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
// ...existing code...

export default function MainView({ animeState, appState, uiState, animeController, searchController, navigationController }) {
  // DRY: Anime işlemleri için yardımcı fonksiyon
  const handleAnimeAction = async (action) => {
    if (!selectedAnime) return;
    switch (action) {
      case 'openNewEpisode':
        await animeController.openNewEpisode(selectedAnime.id, selectedAnime.currentEpisode + 1);
        break;
      case 'update':
        await animeController.updateAnime(selectedAnime.id);
        break;
      case 'delete':
        await animeController.deleteAnime(selectedAnime.id);
        break;
      default:
        break;
    }
    await animeController.loadAnimes();
    if (animeController.loadStats) await animeController.loadStats();
    setSelectedAnime(null);
  };
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Sticky header, auto refresh, IPC events
  useEffect(() => {
    // Fetch anime list on mount
    if (animeController) {
      animeController.fetchAnimeList();
    }

    // Sticky header
    const setStickyHeaderPosition = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        const navbarStyles = window.getComputedStyle(navbar);
        const navbarHeight = navbar.offsetHeight + 
          parseInt(navbarStyles.borderTopWidth) + 
          parseInt(navbarStyles.borderBottomWidth);
        document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
      }
    };
    setStickyHeaderPosition();
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setStickyHeaderPosition, 250);
    };
    window.addEventListener('resize', handleResize);

    // Auto refresh
    let autoRefreshInterval = null;
    const startAutoRefreshIfEnabled = async () => {
      try {
        const settings = await appState.getSettings();
        if (settings.autoRefresh) {
          const intervalMinutes = settings.checkInterval || 30;
          const intervalMs = intervalMinutes * 60 * 1000;
          autoRefreshInterval = setInterval(async () => {
            await appState.performRefresh(false, true);
          }, intervalMs);
        }
      } catch (error) {}
    };
    startAutoRefreshIfEnabled();

    // IPC events
    let ipcRenderer;
    try {
      ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;
    } catch {}
    if (ipcRenderer) {
      ipcRenderer.on('show-add-anime-dialog', () => navigationController.showAddAnimeDialog());
      ipcRenderer.on('show-about-dialog', () => navigationController.showAboutDialog());
      ipcRenderer.on('anime-updated', (event, data) => {
        if (data.type === 'new-episode') {
          animeController.loadAnimes().then(() => {}).catch(() => {});
          uiState.showToast(`🎉 ${data.episodeNumber}. bölüm bulundu!`, 'success');
        }
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
      if (ipcRenderer) {
        ipcRenderer.removeAllListeners('show-add-anime-dialog');
        ipcRenderer.removeAllListeners('show-about-dialog');
        ipcRenderer.removeAllListeners('anime-updated');
      }
    };
  }, [animeController, appState, uiState, navigationController]);

  const handleSearch = async (query) => {
    if (searchController) {
      searchController.setQuery(query);
      const results = await searchController.search();
      setSearchResults(results);
    }
  };

  const handleSelectAnime = (anime) => {
    setSelectedAnime(anime);
    if (animeController) {
      animeController.selectAnime(anime);
    }
  };

  const tabs = ['Home', 'Watching', 'Completed', 'Settings'];

  return (
    <div className="main-view">
      {/* Loading Overlay */}
      {uiState?.loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Yükleniyor...</span>
        </div>
      )}

      {/* Toast Messages */}
      {uiState?.toast && (
        <div className={`toast ${uiState.toast.type}`}>{uiState.toast.message}</div>
      )}

      {/* Status Indicator */}
      {uiState?.status && (
        <div className={`status-indicator ${uiState.status.type}`}>
          <span className="status-icon"></span>
          <span className="status-text">{uiState.status.message}</span>
        </div>
      )}

      <h1>Anime Tracker</h1>
      <TabNavigation tabs={tabs} activeTab={uiState?.activeTab} onTabChange={navigationController?.navigateTo} />
      <SearchBox onSearch={handleSearch} />
      <div className="anime-list">
        {(searchResults.length > 0 ? searchResults : animeState?.animeList || []).map(anime => (
          <AnimeCard
            key={anime.id}
            anime={anime}
            onSelect={handleSelectAnime}
            loading={animeState?.loading}
            error={animeState?.error}
          />
        ))}
      </div>
      {selectedAnime && (
        <Modal
          isOpen={!!selectedAnime}
          content={
            <div className="anime-modal-content">
              <h2>{selectedAnime.title}</h2>
              <img src={selectedAnime.image || 'assets/placeholder.png'} alt={selectedAnime.title} style={{ width: '120px', borderRadius: '8px' }} />
              <div style={{ margin: '1rem 0' }}>
                <span>Bölüm: {selectedAnime.currentEpisode} / {selectedAnime.totalEpisodes || '?'}</span>
                <span style={{ marginLeft: '1rem' }}>Durum: {selectedAnime.status}</span>
              </div>
              <div className="anime-modal-actions">
                <button className="btn btn-primary" onClick={() => handleAnimeAction('openNewEpisode')}>
                  Yeni Bölümü Aç
                </button>
                <button className="btn btn-success" onClick={() => handleAnimeAction('update')}>
                  Güncelle
                </button>
                <button className="btn btn-danger" onClick={() => handleAnimeAction('delete')}>
                  Sil
                </button>
              </div>
            </div>
          }
          onClose={async () => {
            setSelectedAnime(null);
            await animeController.loadAnimes();
            if (animeController.loadStats) await animeController.loadStats();
          }}
        />
      )}
      <ProgressBar progress={selectedAnime?.progress || 0} max={selectedAnime?.totalEpisodes || 100} />
    </div>
  );
}
