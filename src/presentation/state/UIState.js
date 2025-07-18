// UIState
// ...UI state management...
export default class UIState {
  constructor(ipc = null) {
    this.theme = 'dark';
    this.activeTab = 'home';
    this.isModalOpen = false;
    this.modalContent = null;
    this.ipc = ipc; // Electron IPC renderer
  }

  async loadTheme() {
    if (!this.ipc) return;
    try {
      const theme = await this.ipc.invoke('get-theme');
      this.setTheme(theme);
    } catch (err) {}
  }

  async saveTheme() {
    if (!this.ipc) return;
    try {
      await this.ipc.invoke('save-theme', this.theme);
    } catch (err) {}
  }

  async persistActiveTab() {
    if (!this.ipc) return;
    try {
      await this.ipc.invoke('save-active-tab', this.activeTab);
    } catch (err) {}
  }

  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
  }

  getTheme() {
    return this.theme;
  }

  setActiveTab(tab) {
    this.activeTab = tab;
  }

  getActiveTab() {
    return this.activeTab;
  }

  openModal(content = null) {
    this.isModalOpen = true;
    this.modalContent = content;
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalContent = null;
  }

  isModalVisible() {
    return this.isModalOpen;
  }

  getModalContent() {
    return this.modalContent;
  }
}
