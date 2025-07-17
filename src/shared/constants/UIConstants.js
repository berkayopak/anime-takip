/**
 * UIConstants - UI ile ilgili sabitler
 */

const UIConstants = {
    // Tab seçenekleri
    TABS: {
        ALL: 'all',
        WATCHING: 'watching',
        COMPLETED: 'completed',
        PLANNED: 'planned',
        PAUSED: 'paused',
        DROPPED: 'dropped'
    },

    // Tab display name'leri
    TAB_LABELS: {
        all: 'Tümü',
        watching: 'İzleniyor',
        completed: 'Tamamlandı',
        planned: 'Planlandı',
        paused: 'Durduruldu',
        dropped: 'Bırakıldı'
    },

    // Tema seçenekleri
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },

    // Dil seçenekleri
    LANGUAGES: {
        TR: 'tr',
        EN: 'en'
    },

    // Notification pozisyonları
    NOTIFICATION_POSITIONS: {
        TOP_LEFT: 'top-left',
        TOP_RIGHT: 'top-right',
        BOTTOM_LEFT: 'bottom-left',
        BOTTOM_RIGHT: 'bottom-right'
    },

    // Modal tipleri
    MODAL_TYPES: {
        ADD_ANIME: 'add_anime',
        EDIT_ANIME: 'edit_anime',
        DELETE_CONFIRM: 'delete_confirm',
        SETTINGS: 'settings',
        ABOUT: 'about',
        EPISODE_LIST: 'episode_list'
    },

    // Loading durumları
    LOADING_STATES: {
        IDLE: 'idle',
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error'
    },

    // Animasyon süreleri (ms)
    ANIMATION_DURATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500,
        EXTRA_SLOW: 800
    },

    // Z-index değerleri
    Z_INDEX: {
        HEADER: 100,
        DROPDOWN: 200,
        MODAL_BACKDROP: 900,
        MODAL: 1000,
        NOTIFICATION: 1100,
        TOOLTIP: 1200,
        LOADING: 1300
    },

    // Breakpoint'ler (responsive design)
    BREAKPOINTS: {
        MOBILE: 480,
        TABLET: 768,
        DESKTOP: 1024,
        LARGE_DESKTOP: 1440
    },

    // Grid sistem
    GRID: {
        CARDS_PER_ROW: {
            MOBILE: 1,
            TABLET: 2,
            DESKTOP: 3,
            LARGE_DESKTOP: 4
        },
        CARD_MIN_WIDTH: 250,
        CARD_MAX_WIDTH: 350,
        CARD_ASPECT_RATIO: 0.7 // height/width
    },

    // Color palette (CSS custom properties için)
    COLORS: {
        PRIMARY: '#6c5ce7',
        SECONDARY: '#a29bfe',
        SUCCESS: '#00b894',
        WARNING: '#fdcb6e',
        ERROR: '#e17055',
        INFO: '#74b9ff',
        
        // Dark theme
        DARK: {
            BACKGROUND: '#2d3436',
            SURFACE: '#636e72',
            TEXT: '#ddd',
            TEXT_SECONDARY: '#b2bec3'
        },
        
        // Light theme
        LIGHT: {
            BACKGROUND: '#ffffff',
            SURFACE: '#f8f9fa',
            TEXT: '#2d3436',
            TEXT_SECONDARY: '#636e72'
        }
    },

    // Icon büyüklükleri
    ICON_SIZES: {
        SMALL: 16,
        MEDIUM: 20,
        LARGE: 24,
        EXTRA_LARGE: 32
    },

    // Input field boyutları
    INPUT_SIZES: {
        SMALL: 'sm',
        MEDIUM: 'md',
        LARGE: 'lg'
    },

    // Button varyantları
    BUTTON_VARIANTS: {
        PRIMARY: 'primary',
        SECONDARY: 'secondary',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error',
        GHOST: 'ghost',
        LINK: 'link'
    },

    // Button boyutları
    BUTTON_SIZES: {
        SMALL: 'sm',
        MEDIUM: 'md',
        LARGE: 'lg'
    },

    // Progress bar tipleri
    PROGRESS_TYPES: {
        LINEAR: 'linear',
        CIRCULAR: 'circular',
        SEMI_CIRCULAR: 'semi-circular'
    },

    // Dropdown pozisyonları
    DROPDOWN_POSITIONS: {
        BOTTOM_LEFT: 'bottom-left',
        BOTTOM_RIGHT: 'bottom-right',
        TOP_LEFT: 'top-left',
        TOP_RIGHT: 'top-right'
    },

    // Tooltip pozisyonları
    TOOLTIP_POSITIONS: {
        TOP: 'top',
        BOTTOM: 'bottom',
        LEFT: 'left',
        RIGHT: 'right'
    },

    // Keyboard shortcuts
    KEYBOARD_SHORTCUTS: {
        SEARCH: 'Ctrl+F',
        ADD_ANIME: 'Ctrl+N',
        REFRESH: 'F5',
        SETTINGS: 'Ctrl+,',
        CLOSE_MODAL: 'Escape',
        NEXT_TAB: 'Ctrl+Tab',
        PREV_TAB: 'Ctrl+Shift+Tab'
    },

    // Pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
        MAX_VISIBLE_PAGES: 7
    },

    // Search debounce
    SEARCH_DEBOUNCE: 300, // ms

    // Scroll behavior
    SCROLL: {
        BEHAVIOR: 'smooth',
        BLOCK: 'center',
        INLINE: 'nearest'
    },

    // Error mesajları için UI
    ERROR_DISPLAY: {
        TOAST_DURATION: 5000,
        INLINE_TIMEOUT: 10000,
        RETRY_DELAY: 2000
    },

    // Loading states
    LOADING_MESSAGES: {
        FETCHING_ANIME: 'Anime bilgileri alınıyor...',
        SYNCING_EPISODES: 'Bölümler senkronize ediliyor...',
        SAVING_DATA: 'Veriler kaydediliyor...',
        SEARCHING: 'Aranıyor...',
        LOADING_IMAGE: 'Resim yükleniyor...'
    },

    // CSS Class names
    CSS_CLASSES: {
        HIDDEN: 'hidden',
        VISIBLE: 'visible',
        LOADING: 'loading',
        ERROR: 'error',
        SUCCESS: 'success',
        ACTIVE: 'active',
        SELECTED: 'selected',
        DISABLED: 'disabled',
        HIGHLIGHTED: 'highlighted',
        FADE_IN: 'fade-in',
        FADE_OUT: 'fade-out',
        SLIDE_UP: 'slide-up',
        SLIDE_DOWN: 'slide-down'
    },

    // Form validation
    FORM_VALIDATION: {
        DEBOUNCE_TIME: 500,
        SHOW_ERRORS_AFTER: 1000,
        CLEAR_ERRORS_AFTER: 5000
    }
};

/**
 * Tab label'ı al
 */
UIConstants.getTabLabel = (tab) => {
    return UIConstants.TAB_LABELS[tab] || tab;
};

/**
 * Responsive breakpoint kontrol
 */
UIConstants.getBreakpoint = (width) => {
    if (width < UIConstants.BREAKPOINTS.MOBILE) return 'xs';
    if (width < UIConstants.BREAKPOINTS.TABLET) return 'sm';
    if (width < UIConstants.BREAKPOINTS.DESKTOP) return 'md';
    if (width < UIConstants.BREAKPOINTS.LARGE_DESKTOP) return 'lg';
    return 'xl';
};

/**
 * Grid için card sayısını hesapla
 */
UIConstants.getCardsPerRow = (width) => {
    const breakpoint = UIConstants.getBreakpoint(width);
    
    switch (breakpoint) {
        case 'xs':
        case 'sm':
            return UIConstants.GRID.CARDS_PER_ROW.MOBILE;
        case 'md':
            return UIConstants.GRID.CARDS_PER_ROW.TABLET;
        case 'lg':
            return UIConstants.GRID.CARDS_PER_ROW.DESKTOP;
        default:
            return UIConstants.GRID.CARDS_PER_ROW.LARGE_DESKTOP;
    }
};

/**
 * Color utility
 */
UIConstants.getThemeColor = (colorName, theme = 'dark') => {
    if (UIConstants.COLORS[theme] && UIConstants.COLORS[theme][colorName]) {
        return UIConstants.COLORS[theme][colorName];
    }
    return UIConstants.COLORS[colorName] || colorName;
};

/**
 * CSS animation class generator
 */
UIConstants.getAnimationClass = (animation, duration = 'NORMAL') => {
    const durationMs = UIConstants.ANIMATION_DURATION[duration] || UIConstants.ANIMATION_DURATION.NORMAL;
    return `${animation} animation-${durationMs}ms`;
};

module.exports = UIConstants;
