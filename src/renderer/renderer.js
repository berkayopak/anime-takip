const { ipcRenderer } = require('electron');

class AnimeApp {
  constructor() {
    this.animes = [];
    this.filteredAnimes = [];
    this.currentFilter = 'watching'; // Default to 'watching' instead of 'all'
    this.currentAnimeId = null;
    this.searchTimeout = null;
    this.autoRefreshInterval = null; // For managing auto refresh interval
    
    this.init();
  }

  async init() {
    try {
      this.showStatus('Uygulama başlatılıyor...', 'loading');
      
      this.bindEvents();
      // Set default filter to 'watching' instead of 'all'
      this.setFilter('watching');
      
      this.showStatus('Animeler yükleniyor...', 'loading');
      // Always reload anime list and stats to keep everything current
      await this.loadAnimes(false); // false = don't show loading overlay (we already have button loading)
      await this.loadStats();

      // Setup auto refresh based on settings
      this.setupAutoRefresh();

      this.showStatus('Kategoriler yükleniyor...', 'loading');
      this.updateCategories(true); // true = show UI feedback
      
      // Use common refresh method for initial check
      await this.performRefresh(false); // false = don't show toast for no updates on startup
      
    } catch (error) {
      this.showToast('Uygulama başlatılırken hata oluştu', 'error');
      this.showStatus('Başlatma hatası', 'error', 3000);
      
      // Restore refresh button state even on error
      const refreshBtn = document.getElementById('refreshBtn');
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Yenile';
        refreshBtn.disabled = false;
      }
    }
  }

  bindEvents() {
    // Main buttons
    document.getElementById('addAnimeBtn').addEventListener('click', () => this.showAddAnimeDialog());
    document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
    document.getElementById('updateCategoriesBtn').addEventListener('click', () => this.updateCategories(true)); // true = show UI feedback
    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsDialog());

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
    
    // Filter tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
    });

    // Add anime modal
    document.getElementById('searchAnimeBtn').addEventListener('click', () => this.searchAnime());
    
    // Bind input events once
    this.bindSearchInputEvents();
    this.bindEpisodeInputEvents();

    // Episode selection modal
    document.getElementById('confirmAddAnimeBtn').addEventListener('click', () => this.confirmAddAnime());
    document.getElementById('cancelAddAnimeBtn').addEventListener('click', () => this.closeEpisodeSelectionDialog());

    // Modal close handlers
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModals();
      }
    });

    // IPC listeners
    ipcRenderer.on('show-add-anime-dialog', () => this.showAddAnimeDialog());
    ipcRenderer.on('show-about-dialog', () => this.showAboutDialog());
    ipcRenderer.on('anime-updated', (event, data) => {
      if (data.type === 'new-episode') {
        // Reload anime list to show new episode badge
        this.loadAnimes().then(() => {
          // Success - anime list reloaded
        }).catch(error => {
          // Error - failed to reload anime list
        });
        this.showToast(`🎉 ${data.episodeNumber}. bölüm bulundu!`, 'success');
      }
    });
  }

  bindSearchInputEvents() {
    const searchInput = document.getElementById('animeSearchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchAnime();
    });
  }

  bindEpisodeInputEvents() {
    const episodeInput = document.getElementById('currentEpisodeSelection');
    if (!episodeInput) return;
    
    episodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.confirmAddAnime();
      }
    });
    
    episodeInput.addEventListener('blur', () => {
      // Ensure valid value when focus is lost
      const value = episodeInput.value.trim();
      if (value === '' || isNaN(parseInt(value))) {
        episodeInput.value = 0;
      }
    });
    
    episodeInput.addEventListener('input', (e) => {
      // Only validate, don't modify unless necessary
      const value = e.target.value;
      const numValue = parseInt(value);
      
      // Only intervene if value is negative
      if (numValue < 0) {
        e.target.value = 0;
      }
    });
  }

  async loadAnimes(showLoadingOverlay = true) {
    try {
      if (showLoadingOverlay) {
        this.showLoading(true);
      }
      this.animes = await ipcRenderer.invoke('get-anime-list');
      this.applyFilter();
      this.renderAnimes();
    } catch (error) {
      this.showToast('Animeler yüklenirken hata oluştu', 'error');
    } finally {
      if (showLoadingOverlay) {
        this.showLoading(false);
      }
    }
  }

  async loadStats() {
    try {
      const stats = {
        total: this.animes.length,
        watching: this.animes.filter(a => a.status === 'watching').length,
        completed: this.animes.filter(a => a.status === 'completed').length,
        totalWatched: this.animes.reduce((sum, a) => sum + a.currentEpisode, 0)
      };

      document.getElementById('totalAnimes').textContent = stats.total;
      document.getElementById('watchingAnimes').textContent = stats.watching;
      document.getElementById('completedAnimes').textContent = stats.completed;
      document.getElementById('totalEpisodes').textContent = stats.totalWatched;
    } catch (error) {
      // Failed to load stats
    }
  }

  renderAnimes() {
    const grid = document.getElementById('animeGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (this.filteredAnimes.length === 0) {
      grid.style.display = 'none';
      
      // Show custom empty state for specific filters
      if (this.currentFilter === 'completed') {
        emptyState.innerHTML = `
          <div class="empty-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Henüz tamamlanmış anime yok</h3>
          <p>Bitirdiğiniz animeler burada görünecek</p>
        `;
      } else if (this.currentFilter === 'paused') {
        emptyState.innerHTML = `
          <div class="empty-icon">
            <i class="fas fa-pause-circle"></i>
          </div>
          <h3>Henüz durdurulmuş anime yok</h3>
          <p>Ara verdiğiniz animeler burada görünecek</p>
        `;
      } else if (this.currentFilter === 'dropped') {
        emptyState.innerHTML = `
          <div class="empty-icon">
            <i class="fas fa-times-circle"></i>
          </div>
          <h3>Henüz bırakılmış anime yok</h3>
          <p>Bıraktığınız animeler burada görünecek</p>
        `;
      } else {
        // Default empty state for 'all' and 'watching'
        emptyState.innerHTML = `
          <div class="empty-icon">
            <i class="fas fa-tv"></i>
          </div>
          <h3>Henüz anime eklemediniz</h3>
          <p>İzlediğiniz animeleri takip etmek için anime ekleyin</p>
          <button class="btn btn-primary" onclick="showAddAnimeDialog()">
            <i class="fas fa-plus"></i> İlk Animeni Ekle
          </button>
        `;
      }
      
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = this.filteredAnimes.map(anime => this.createAnimeCard(anime)).join('');
    
    // Bind card events
    this.bindCardEvents();
  }

  createAnimeCard(anime) {
    const progress = anime.totalEpisodes > 0 ? (anime.currentEpisode / anime.totalEpisodes) * 100 : 0;
    const statusClass = `status-${anime.status}`;
    const statusText = this.getStatusText(anime.status);
    
    // Check if there are new episodes available from database
    const hasNewEpisode = anime.has_new_episode === 1;
    const nextEpisode = anime.currentEpisode + 1;
    const newEpisodesBadge = hasNewEpisode ? 
      `<div class="new-episode-badge">Yeni: ${nextEpisode}. Bölüm</div>` : '';
    
    // New episode button if available
    const newEpisodeButton = hasNewEpisode ? 
      `<button class="btn btn-success btn-sm new-episode-btn" onclick="app.openNewEpisode(${anime.id}, ${nextEpisode})">
        <i class="fas fa-play"></i> ${nextEpisode}. Bölümü İzle
      </button>` : '';
    
    return `
      <div class="anime-card ${hasNewEpisode ? 'has-new-episode' : ''}" data-id="${anime.id}">
        <div class="anime-image">
          <img src="${anime.image || 'assets/placeholder.png'}" alt="${anime.title}" 
               onerror="this.src='assets/placeholder.png'">
          <div class="anime-status ${statusClass}">${statusText}</div>
          ${newEpisodesBadge}
        </div>
        <div class="anime-info">
          <h3 class="anime-title">${anime.title}</h3>
          <div class="anime-progress">
            <div class="progress-info">
              <span>Bölüm ${anime.currentEpisode}${anime.totalEpisodes > 0 ? '/' + anime.totalEpisodes : '/?'}</span>
              <span>${Math.round(progress)}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>
          <div class="anime-actions">
            ${newEpisodeButton}
            <div class="regular-actions">
              <button class="btn btn-primary btn-sm" onclick="app.showAnimeDialog(${anime.id})">
                <i class="fas fa-edit"></i> Güncelle
              </button>
              <button class="btn btn-info btn-sm" onclick="app.openAnimeUrl('${anime.url}')">
                <i class="fas fa-external-link-alt"></i> Aç
              </button>
              <button class="btn btn-danger btn-sm" onclick="app.deleteAnime(${anime.id})">
                <i class="fas fa-trash"></i> Kaldır
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindCardEvents() {
    // Events are bound via onclick attributes in createAnimeCard
  }

  getStatusText(status) {
    const statusMap = {
      'watching': 'İzleniyor',
      'completed': 'Tamamlandı',
      'paused': 'Durduruldu',
      'dropped': 'Bırakıldı'
    };
    return statusMap[status] || 'Bilinmiyor';
  }

  handleSearch(query) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilter(query);
      this.renderAnimes();
    }, 300);
  }

  setFilter(filter) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    this.currentFilter = filter;
    this.applyFilter();
    this.renderAnimes();
  }

  applyFilter(searchQuery = '') {
    let filtered = this.animes;
    
    // Apply status filter
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(anime => anime.status === this.currentFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(anime => 
        anime.title.toLowerCase().includes(query)
      );
    }
    
    this.filteredAnimes = filtered;
  }

  async searchAnime() {
    const query = document.getElementById('animeSearchInput').value.trim();
    if (!query) {
      this.showToast('Lütfen bir anime adı girin', 'warning');
      return;
    }

    try {
      this.showLoading(true);
      const results = await ipcRenderer.invoke('search-anime', query);
      this.displaySearchResults(results);
    } catch (error) {
      this.showToast('Arama sırasında hata oluştu', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Sonuç bulunamadı</p>';
      return;
    }

    container.innerHTML = results.map(anime => `
      <div class="search-result" onclick="app.addAnimeFromSearch('${anime.url}', '${anime.title}', '')">
        <div class="search-result-icon">
          <i class="fas fa-tv"></i>
        </div>
        <div class="search-result-info">
          <div class="search-result-title">${anime.title}</div>
          <div class="search-result-url">${anime.url}</div>
        </div>
      </div>
    `).join('');
  }

  async addAnimeFromSearch(url, title, image) {
    try {
      // Check if anime already exists first
      const existingAnime = this.animes.find(a => a.url === url);
      if (existingAnime) {
        this.showToast('Bu anime zaten listede mevcut', 'warning');
        return;
      }

      // Show episode selection dialog
      this.showEpisodeSelectionDialog(url, title, image);
      
    } catch (error) {
      this.showToast('Anime eklenirken hata oluştu', 'error');
    }
  }

  showEpisodeSelectionDialog(url, title, image) {
    // Store the anime data for later use
    this.pendingAnimeData = { url, title, image };
    
    // Update dialog content
    document.getElementById('episodeDialogTitle').textContent = title;
    const episodeInput = document.getElementById('currentEpisodeSelection');
    episodeInput.value = 0;
    
    // Show dialog
    document.getElementById('episodeSelectionModal').classList.add('show');
    
    // Focus and select all text in input for easy manual entry
    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (episodeInput && document.getElementById('episodeSelectionModal').classList.contains('show')) {
          episodeInput.focus();
          episodeInput.select();
        }
      }, 150); // Increased delay for modal animation
    });
  }

  async confirmAddAnime() {
    if (!this.pendingAnimeData) return;

    try {
      this.showLoading(true);
      
      const currentEpisode = parseInt(document.getElementById('currentEpisodeSelection').value) || 0;
      
      const animeData = { 
        ...this.pendingAnimeData, 
        currentEpisode: currentEpisode 
      };
      
      await ipcRenderer.invoke('add-anime', animeData);
      
      this.showToast('Anime başarıyla eklendi', 'success');
      this.closeAddAnimeDialog();
      this.closeEpisodeSelectionDialog();
      
      // Load immediately to show the anime in UI
      await this.loadAnimes();
      await this.loadStats();
      
      // IPC event will handle UI update when episode check completes (for new episode badge)
      
    } catch (error) {
      this.showToast('Anime eklenirken hata oluştu', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  closeEpisodeSelectionDialog() {
    document.getElementById('episodeSelectionModal').classList.remove('show');
    this.pendingAnimeData = null;
  }

  showAnimeDialog(animeId) {
    const anime = this.animes.find(a => a.id === animeId);
    if (!anime) return;

    this.currentAnimeId = animeId;
    document.getElementById('animeTitle').textContent = anime.title;
    document.getElementById('currentEpisodeInput').value = anime.currentEpisode;
    document.getElementById('animeStatusSelect').value = anime.status;
    document.getElementById('animeModal').classList.add('show');
  }

  closeAnimeDialog() {
    document.getElementById('animeModal').classList.remove('show');
    this.currentAnimeId = null;
  }

  incrementEpisode() {
    const input = document.getElementById('currentEpisodeInput');
    input.value = parseInt(input.value || 0) + 1;
  }

  decrementEpisode() {
    const input = document.getElementById('currentEpisodeInput');
    const value = parseInt(input.value || 0);
    if (value > 0) {
      input.value = value - 1;
    }
  }

  async updateAnime() {
    if (!this.currentAnimeId) return;

    try {
      const episode = parseInt(document.getElementById('currentEpisodeInput').value || 0);
      const status = document.getElementById('animeStatusSelect').value;
      
      await ipcRenderer.invoke('update-episode', this.currentAnimeId, episode);
      await ipcRenderer.invoke('update-anime-status', this.currentAnimeId, status);
      
      // Update the specific anime in our local array
      const anime = this.animes.find(a => a.id === this.currentAnimeId);
      if (anime) {
        const oldEpisode = anime.currentEpisode;
        anime.currentEpisode = episode;
        anime.status = status;
        
        // Only clear new episode flag if the episode number actually changed
        if (episode !== oldEpisode) {
          anime.has_new_episode = 0;
        }
        
        // Re-render without loading from database to preserve other animes' status
        this.renderAnimes();
        this.applyFilter(); // Re-apply filter to update filtered list
        this.renderAnimes(); // Re-render again after filter
      }
      
      this.showToast('Anime başarıyla güncellendi', 'success');
      
      // Check for new episodes after update BEFORE closing dialog (to preserve currentAnimeId)
      if (anime && episode > 0) {
        this.showStatus('Yeni bölüm kontrol ediliyor...', 'loading');
        try {
          const updates = await ipcRenderer.invoke('check-single-anime-update', this.currentAnimeId);
          
          if (updates && updates.length > 0) {
            const update = updates[0];
            const updatedAnime = this.animes.find(a => a.id === update.anime.id);
            if (updatedAnime) {
              updatedAnime.has_new_episode = 1; // Set new episode flag
              this.renderAnimes(); // Re-render to show new episode badge
              this.showToast(`🎉 ${update.anime.title} için yeni bölüm mevcut!`, 'success');
              this.showStatus(`✅ Yeni bölüm bulundu!`, 'success', 3000);
            }
          } else {
            this.showStatus('✅ Kontrol tamamlandı', 'success', 2000);
          }
        } catch (error) {
          this.showStatus('❌ Kontrol hatası', 'error', 3000);
        }
      }
      
      this.closeAnimeDialog();
      await this.loadStats(); // Only reload stats, not anime list
      
    } catch (error) {
      this.showToast('Anime güncellenirken hata oluştu', 'error');
    }
  }

  async deleteAnime(animeId) {
    const anime = this.animes.find(a => a.id === animeId);
    if (!anime) return;

    // Use custom confirm dialog instead of native confirm()
    const confirmed = await this.showConfirmDialog(
      `"${anime.title}" animesini silmek istediğinizden emin misiniz?`
    );
    
    if (!confirmed) return;

    try {
      await ipcRenderer.invoke('delete-anime', animeId);
      this.showToast('Anime başarıyla silindi', 'success');
      await this.loadAnimes();
      await this.loadStats();
    } catch (error) {
      this.showToast('Anime silinirken hata oluştu', 'error');
    }
  }

  // Custom confirm dialog to avoid native confirm() focus issues
  showConfirmDialog(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmDialog');
      const messageEl = document.getElementById('confirmMessage');
      const yesBtn = document.getElementById('confirmYes');
      const noBtn = document.getElementById('confirmNo');
      
      messageEl.textContent = message;
      modal.classList.add('show');
      
      // Remove any existing event listeners
      const newYesBtn = yesBtn.cloneNode(true);
      const newNoBtn = noBtn.cloneNode(true);
      yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
      noBtn.parentNode.replaceChild(newNoBtn, noBtn);
      
      // Add new event listeners
      newYesBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        resolve(true);
      });
      
      newNoBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        resolve(false);
      });
      
      // Close on modal background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
          resolve(false);
        }
      });
      
      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          modal.classList.remove('show');
          document.removeEventListener('keydown', handleEscape);
          resolve(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      // Focus the No button by default (safer)
      setTimeout(() => newNoBtn.focus(), 100);
    });
  }

  openAnimeUrl(url) {
    require('electron').shell.openExternal(url);
  }

  showAddAnimeDialog() {
    document.getElementById('animeSearchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('addAnimeModal').classList.add('show');
  }

  closeAddAnimeDialog() {
    document.getElementById('addAnimeModal').classList.remove('show');
  }

  showSettingsDialog() {
    // Load current settings
    this.loadCurrentSettings();
    document.getElementById('settingsModal').classList.add('show');
  }

  async loadCurrentSettings() {
    try {
      const settings = await ipcRenderer.invoke('get-settings');
      document.getElementById('checkInterval').value = settings.checkInterval;
      document.getElementById('notifications').checked = settings.notifications;
      document.getElementById('autoRefresh').checked = settings.autoRefresh;
      
      // Update test notification button state
      this.updateTestNotificationButton();
      
      // Add event listener to notifications checkbox (only once)
      const notificationsCheckbox = document.getElementById('notifications');
      notificationsCheckbox.removeEventListener('change', this.updateTestNotificationButton.bind(this));
      notificationsCheckbox.addEventListener('change', () => {
        this.updateTestNotificationButton();
      });
      
    } catch (error) {
      // Failed to load settings
    }
  }

  updateTestNotificationButton() {
    const notificationsEnabled = document.getElementById('notifications').checked;
    const testBtn = document.getElementById('testNotificationBtn');
    
    if (notificationsEnabled) {
      testBtn.disabled = false;
      testBtn.classList.remove('disabled');
      testBtn.title = '';
    } else {
      testBtn.disabled = true;
      testBtn.classList.add('disabled');
      testBtn.title = 'Bildirimleri etkinleştirin';
    }
  }

  closeSettingsDialog() {
    document.getElementById('settingsModal').classList.remove('show');
  }

  async saveSettings() {
    try {
      const settings = {
        checkInterval: parseInt(document.getElementById('checkInterval').value) || 30,
        notifications: document.getElementById('notifications').checked,
        autoRefresh: document.getElementById('autoRefresh').checked
      };
      
      const success = await ipcRenderer.invoke('save-settings', settings);
      
      if (success) {
        this.showToast('Ayarlar başarıyla kaydedildi', 'success');
        
        // Restart auto refresh with new settings
        this.setupAutoRefresh();
        
        this.closeSettingsDialog();
      } else {
        this.showToast('Ayarlar kaydedilirken hata oluştu', 'error');
      }
    } catch (error) {
      this.showToast('Ayarlar kaydedilirken hata oluştu', 'error');
    }
  }

  async testNotification() {
    // Check if notifications are enabled
    const notificationsEnabled = document.getElementById('notifications').checked;
    if (!notificationsEnabled) {
      this.showToast('Bildirimleri etkinleştirin', 'warning');
      return;
    }
    
    try {
      await ipcRenderer.invoke('test-notification');
      this.showToast('Test bildirimi gönderildi', 'success');
    } catch (error) {
      this.showToast('Test bildirimi gönderilemedi', 'error');
    }
  }

  showAboutDialog() {
    const message = `
      Anime Takip v1.0.0
      
      TurkAnime.co için geliştirilmiş anime takip uygulaması
      
      Özellikler:
      • Anime arama ve ekleme
      • Bölüm takibi
      • Otomatik güncelleme kontrolü
      • Masaüstü bildirimleri
      
      Geliştirici: GitHub Copilot
    `;
    
    alert(message);
  }

  closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('show');
    });
  }

  // Common refresh method used by both init and manual refresh
  async performRefresh(showNoUpdatesToast = true, isAutoRefresh = false) {
    // Show loading state in refresh button (for both manual and auto refresh for better UX)
    const refreshBtn = document.getElementById('refreshBtn');
    let originalHTML = '';
    
    // Always show visual feedback, but with different text for auto refresh
    originalHTML = refreshBtn.innerHTML;

    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Yenileniyor...';
    refreshBtn.disabled = true;

    try {
      const statusMessage = isAutoRefresh ? 'Otomatik kontrol yapılıyor...' : 'Yeni bölümler kontrol ediliyor...';
      this.showStatus(statusMessage, 'loading');
      
      // Check for updates
      const updates = await ipcRenderer.invoke('check-for-updates');
      
      // Safely handle updates response
      const updateCount = updates && Array.isArray(updates) ? updates.length : 0;
      
      // Always reload anime list and stats to keep everything current
      await this.loadAnimes(false); // false = don't show loading overlay (we already have button loading)
      await this.loadStats();
      
      if (updateCount > 0) {
        const toastMessage = isAutoRefresh ? `🔄 ${updateCount} yeni bölüm otomatik bulundu!` : `🎉 ${updateCount} yeni bölüm bulundu!`;
        this.showToast(toastMessage, 'success');
        this.showStatus(`✅ ${updateCount} yeni bölüm bulundu!`, 'success', isAutoRefresh ? 5000 : 3000);
      } else {
        if (showNoUpdatesToast && !isAutoRefresh) {
          this.showToast('Yeni bölüm bulunamadı', 'info');
        }
        const successMessage = isAutoRefresh ? '✅ Otomatik kontrol tamamlandı' : '✅ Tüm animeler güncel';
        this.showStatus(successMessage, 'success', 2000);
      }
      
    } catch (error) {
      const errorMessage = isAutoRefresh ? 'Otomatik kontrol sırasında hata oluştu' : 'Yenileme sırasında hata oluştu';
      this.showToast(errorMessage, 'error');
      this.showStatus('❌ Yenileme hatası', 'error', 3000);
    } finally {
      // Always restore button state
      refreshBtn.innerHTML = originalHTML;
      refreshBtn.disabled = false;
    }
  }

  async refreshData() {
    // Just use the common refresh method - no extra loading overlay
    await this.performRefresh(false); // true = show toast for no updates
  }

  setupAutoRefresh() {
    // Clear any existing interval
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }

    this.startAutoRefreshIfEnabled();
  }

  async startAutoRefreshIfEnabled() {
    try {
      const settings = await ipcRenderer.invoke('get-settings');
      
      // Only start auto refresh if enabled in settings
      if (settings.autoRefresh) {
        const intervalMinutes = settings.checkInterval || 30;
        const intervalMs = intervalMinutes * 60 * 1000;
        
        this.autoRefreshInterval = setInterval(async () => {
          // Use the common refresh method with auto refresh flag
          await this.performRefresh(false, true); // false = no toast for no updates, true = isAutoRefresh
        }, intervalMs);
      }
    } catch (error) {
      // Failed to load settings for auto refresh
    }
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
      overlay.classList.add('show');
    } else {
      overlay.classList.remove('show');
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    // Check if a similar toast already exists and remove it
    const existingToasts = container.querySelectorAll('.toast');
    existingToasts.forEach(existingToast => {
      if (existingToast.textContent === message) {
        existingToast.remove();
      }
    });
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds for error messages, 3 seconds for others
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);
  }

  showStatus(message, type = 'info', duration = 0) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = statusIndicator.querySelector('.status-text');
    const statusIcon = statusIndicator.querySelector('.status-icon');
    
    statusText.textContent = message;
    
    // Update icon and color based on type
    switch (type) {
      case 'loading':
        statusIcon.className = 'fas fa-spinner fa-spin status-icon';
        statusIcon.style.color = 'var(--primary-color)';
        break;
      case 'success':
        statusIcon.className = 'fas fa-check-circle status-icon';
        statusIcon.style.color = 'var(--success-color)';
        break;
      case 'error':
        statusIcon.className = 'fas fa-exclamation-circle status-icon';
        statusIcon.style.color = 'var(--danger-color)';
        break;
      case 'warning':
        statusIcon.className = 'fas fa-exclamation-triangle status-icon';
        statusIcon.style.color = 'var(--warning-color)';
        break;
      default: // 'info'
        statusIcon.className = 'fas fa-info-circle status-icon';
        statusIcon.style.color = 'var(--accent-color)';
    }
    
    statusIndicator.classList.add('show');
    
    if (duration > 0) {
      setTimeout(() => {
        statusIndicator.classList.remove('show');
      }, duration);
    }
  }

  hideStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.classList.remove('show');
  }

  openNewEpisode(animeId, episodeNumber) {
    const anime = this.animes.find(a => a.id === animeId);
    if (!anime) return;

    // Extract anime ID from URL to construct episode URL
    let animeUrlId = null;
    if (anime.url.includes('/anime/')) {
      animeUrlId = anime.url.split('/anime/')[1];
    } else if (anime.url.includes('/tanitim/')) {
      animeUrlId = anime.url.split('/tanitim/')[1];
    } else {
      const urlParts = anime.url.split('/').filter(part => part.length > 0);
      animeUrlId = urlParts[urlParts.length - 1];
    }

    if (animeUrlId) {
      // Clean up anime ID
      animeUrlId = animeUrlId.split('?')[0].replace(/\/$/, '');
      
      // Construct episode URL
      const episodeUrl = `https://www.turkanime.co/video/${animeUrlId}-${episodeNumber}-bolum`;
      
      // Open episode URL
      require('electron').shell.openExternal(episodeUrl);
      
      // Auto-update current episode to the new episode
      this.updateEpisodeNumber(animeId, episodeNumber);
    } else {
      this.showToast('Episode URL oluşturulamadı', 'error');
    }
  }

  async updateEpisodeNumber(animeId, episode) {
    try {
      await ipcRenderer.invoke('update-episode', animeId, episode);
      this.showToast(`Bölüm ${episode} olarak güncellendi`, 'success');
      
      // Update only the specific anime in our local array to clear its new episode badge
      const anime = this.animes.find(a => a.id === animeId);
      if (anime) {
        anime.currentEpisode = episode;
        anime.has_new_episode = 0; // Clear only this anime's new episode flag
        
        // Re-render without loading from database to preserve other animes' status
        this.renderAnimes();
      }
      
      await this.loadStats(); // Only reload stats, not anime list
      
      // Check if there's another new episode for this anime after updating
      this.showStatus('Yeni bölüm kontrol ediliyor...', 'loading');
      try {
        const updates = await ipcRenderer.invoke('check-single-anime-update', animeId);
        
        if (updates && updates.length > 0) {
          const update = updates[0];
          const updatedAnime = this.animes.find(a => a.id === update.anime.id);
          if (updatedAnime) {
            updatedAnime.has_new_episode = 1; // Set new episode flag
            this.renderAnimes(); // Re-render to show new episode badge if there's another one
            this.showToast(`🎉 ${update.anime.title} için bir sonraki bölüm de mevcut!`, 'success');
            this.showStatus(`✅ Yeni bölüm bulundu!`, 'success', 3000);
          }          } else {
            this.showStatus('✅ Kontrol tamamlandı', 'success', 2000);
          }
        } catch (error) {
          this.showStatus('❌ Kontrol hatası', 'error', 3000);
        }
      
    } catch (error) {
      this.showToast('Bölüm güncellenirken hata oluştu', 'error');
      this.showStatus('❌ Güncelleme hatası', 'error', 3000);
    }
  }

  async updateCategories(showUIFeedback = true) {
    let btn = null;
    let originalHTML = '';
    
    try {
      // Show loading state in button only if UI feedback is requested
      if (showUIFeedback) {
        btn = document.getElementById('updateCategoriesBtn');
        if (btn) {
          originalHTML = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Güncelleniyor...';
          btn.disabled = true;
        }
      }

      // Show status indicator
      this.showStatus('Kategoriler güncelleniyor...', 'loading');

      // Call backend to update categories
      const result = await ipcRenderer.invoke('update-categories');
      
      if (result.success) {
        const successMessage = `Kategoriler güncellendi! ${result.count} kategori yüklendi.`;
        this.showStatus(successMessage, 'success', 3000);
        
        if (showUIFeedback) {
          this.showToast(`Kategoriler başarıyla güncellendi! ${result.count} kategori yüklendi.`, 'success');
        }
      } else {
        this.showStatus('Kategori güncellemesi başarısız!', 'error', 5000);
        
        if (showUIFeedback) {
          this.showToast(`Kategoriler güncellenemedi: ${result.error}`, 'error');
        }
      }
      
      return result;
    } catch (error) {
      this.showStatus('Kategoriler güncellenirken hata oluştu!', 'error', 5000);
      
      if (showUIFeedback) {
        this.showToast('Kategoriler güncellenirken hata oluştu.', 'error');
      }
      
      return { success: false, error: error.message };
    } finally {
      // Restore button state only if button was found and modified
      if (btn && originalHTML) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Ensure single instance
  if (!window.app) {
    window.app = new AnimeApp();
  }
});

// Global functions for onclick handlers
window.showAddAnimeDialog = () => window.app.showAddAnimeDialog();
window.closeAddAnimeDialog = () => window.app.closeAddAnimeDialog();
window.closeSettingsDialog = () => window.app.closeSettingsDialog();
window.closeAnimeDialog = () => window.app.closeAnimeDialog();
window.closeEpisodeSelectionDialog = () => window.app.closeEpisodeSelectionDialog();
window.confirmAddAnime = () => window.app.confirmAddAnime();
window.saveSettings = () => window.app.saveSettings();
window.testNotification = () => window.app.testNotification();
window.updateAnime = () => window.app.updateAnime();
window.incrementEpisode = () => window.app.incrementEpisode();
window.decrementEpisode = () => window.app.decrementEpisode();
