// NavigationController
// ...navigation logic controller...
export default class NavigationController {
  constructor(uiState, ipc = null) {
    this.uiState = uiState;
    this.ipc = ipc;
  }

  navigateTo(tab) {
    this.uiState.setActiveTab(tab);
    if (this.ipc && this.uiState.persistActiveTab) {
      this.uiState.persistActiveTab();
    }
  }

  getCurrentTab() {
    return this.uiState.getActiveTab();
  }

  openModal(content) {
    this.uiState.openModal(content);
  }

  closeModal() {
    this.uiState.closeModal();
  }
}
