/**
 * AnimeConstants - Anime ile ilgili sabitler
 * Multi-tenant provider sistemi destekli
 */

const AnimeConstants = {
    // Anime durumları
    STATUS: {
        WATCHING: 'watching',
        COMPLETED: 'completed',
        PLANNED: 'planned',
        PAUSED: 'paused',
        DROPPED: 'dropped'
    },

    // Anime tipleri
    TYPE: {
        TV: 'tv',
        MOVIE: 'movie',
        OVA: 'ova',
        ONA: 'ona',
        SPECIAL: 'special'
    },

    // Anime kategorileri/türleri (TurkAnime.co'dan dinamik olarak çekilir)
    // Bu liste sadece fallback için kullanılır - gerçek kategoriler API'den alınır
    FALLBACK_GENRES: [
        'Aksiyon', 'Dram', 'Komedi', 'Romantik', 'Fantastik', 'Macera', 'Gizem', 
        'Bilim Kurgu', 'Supernatural', 'Seinen', 'Shounen', 'Shoujo', 'Josei', 
        'Ecchi', 'Harem', 'Slice of Life', 'Okul', 'Spor', 'Müzik', 'Tarih', 
        'Askeri', 'Polis', 'Gerilim', 'Korku', 'Yaoi', 'Yuri', 'Mecha', 'Uzay', 
        'Aile', 'Çocuk'
    ],

    // Rating sınırları
    RATING: {
        MIN: 0,
        MAX: 10,
        DEFAULT: 0
    },

    // Episode sınırları
    EPISODES: {
        MIN: 0,
        MAX: 10000,
        UNKNOWN: -1
    },

    // Varsayılan placeholder resim
    DEFAULT_IMAGE: '/assets/placeholder.png',

    // Site Providers (Tenant yaklaşımı - ileride farklı siteler eklenebilir)
    PROVIDERS: {
        TURKANIME: {
            ID: 'turkanime',
            NAME: 'TurkAnime.co',
            BASE_URL: 'https://www.turkanime.co',
            API_ENDPOINTS: {
                CATEGORIES: '/ajax/turler',
                ANIME_LIST: '/ajax/tamliste',
                // İleride ekleneble ek endpoint'ler
                // SEARCH: '/ajax/arama',
                // EPISODE_LIST: '/ajax/bolumler',
                // ANIME_DETAIL: '/ajax/detay'
            },
            USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
            HEADERS: {
                'Accept': '*/*',
                'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'X-Requested-With': 'XMLHttpRequest',
                'Connection': 'keep-alive'
            },
            SELECTORS: {
                ANIME_CARD: '.card-anime',
                ANIME_TITLE: '.anime-title',
                ANIME_IMAGE: '.anime-image img',
                EPISODE_LIST: '.episode-list',
                EPISODE_ITEM: '.episode-item',
                EPISODE_NUMBER: '.episode-number',
                EPISODE_TITLE: '.episode-title'
            },
            RATE_LIMITS: {
                REQUESTS_PER_MINUTE: 30,
                REQUEST_DELAY: 2000 // ms
            }
        }
        // İleride eklenebilecek diğer provider'lar:
        // NINEANIME: { ... },
        // ANIMEPAHE: { ... },
        // CRUNCHYROLL: { ... }
    },

    // Mevcut provider (varsayılan)
    DEFAULT_PROVIDER: 'turkanime',

    // Arama filtreleri
    SEARCH_FILTERS: {
        ALL: 'all',
        WATCHING: 'watching',
        COMPLETED: 'completed',
        PLANNED: 'planned',
        PAUSED: 'paused',
        DROPPED: 'dropped'
    },

    // Sıralama seçenekleri
    SORT_OPTIONS: {
        NAME_ASC: 'name_asc',
        NAME_DESC: 'name_desc',
        RATING_ASC: 'rating_asc',
        RATING_DESC: 'rating_desc',
        DATE_ADDED_ASC: 'date_added_asc',
        DATE_ADDED_DESC: 'date_added_desc',
        PROGRESS_ASC: 'progress_asc',
        PROGRESS_DESC: 'progress_desc',
        LAST_WATCHED_ASC: 'last_watched_asc',
        LAST_WATCHED_DESC: 'last_watched_desc'
    },

    // Progress durumları
    PROGRESS_STATUS: {
        NOT_STARTED: 'not_started',
        WATCHING: 'watching',
        COMPLETED: 'completed',
        PAUSED: 'paused',
        UP_TO_DATE: 'up_to_date'
    },

    // Validation mesajları
    VALIDATION_MESSAGES: {
        INVALID_NAME: 'Geçerli bir anime adı giriniz',
        INVALID_URL: 'Geçerli bir TurkAnime URL\'si giriniz',
        INVALID_RATING: 'Rating 0-10 arası olmalıdır',
        INVALID_EPISODES: 'Bölüm sayısı geçerli değil',
        DUPLICATE_ANIME: 'Bu anime zaten listede mevcut'
    },

    // Bildirim mesajları
    NOTIFICATION_MESSAGES: {
        ANIME_ADDED: 'Anime başarıyla eklendi',
        ANIME_UPDATED: 'Anime bilgileri güncellendi',
        ANIME_DELETED: 'Anime listeden kaldırıldı',
        EPISODE_WATCHED: 'Bölüm izlendi olarak işaretlendi',
        NEW_EPISODES_FOUND: 'yeni bölüm bulundu',
        SYNC_COMPLETED: 'Senkronizasyon tamamlandı',
        SYNC_FAILED: 'Senkronizasyon başarısız'
    },

    // API yanıt kodları
    API_RESPONSES: {
        SUCCESS: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        NOT_FOUND: 404,
        INTERNAL_ERROR: 500
    },

    // Cache süresi (ms)
    CACHE_DURATION: {
        ANIME_DATA: 24 * 60 * 60 * 1000, // 24 saat
        EPISODE_DATA: 6 * 60 * 60 * 1000, // 6 saat
        SEARCH_RESULTS: 15 * 60 * 1000, // 15 dakika
        IMAGE_CACHE: 7 * 24 * 60 * 60 * 1000 // 7 gün
    },

    // Retry politikaları
    RETRY: {
        MAX_ATTEMPTS: 3,
        BASE_DELAY: 1000, // 1 saniye
        MAX_DELAY: 10000, // 10 saniye
        EXPONENTIAL_BASE: 2
    },

    // Rate limiting
    RATE_LIMIT: {
        REQUESTS_PER_MINUTE: 30,
        REQUESTS_PER_HOUR: 1000,
        BURST_SIZE: 10
    }
};

/**
 * Status display name'leri al
 */
AnimeConstants.getStatusDisplayName = (status) => {
    const displayNames = {
        [AnimeConstants.STATUS.WATCHING]: 'İzleniyor',
        [AnimeConstants.STATUS.COMPLETED]: 'Tamamlandı',
        [AnimeConstants.STATUS.PLANNED]: 'Planlandı',
        [AnimeConstants.STATUS.PAUSED]: 'Durduruldu',
        [AnimeConstants.STATUS.DROPPED]: 'Bırakıldı'
    };
    
    return displayNames[status] || status;
};

/**
 * Genre validasyonu
 */
AnimeConstants.isValidGenre = (genre) => {
    return AnimeConstants.GENRES.includes(genre);
};

/**
 * Status validasyonu
 */
AnimeConstants.isValidStatus = (status) => {
    return Object.values(AnimeConstants.STATUS).includes(status);
};

/**
 * Provider helper fonksiyonları
 */

/**
 * Aktif provider'ı al
 */
AnimeConstants.getCurrentProvider = () => {
    return AnimeConstants.PROVIDERS[AnimeConstants.DEFAULT_PROVIDER.toUpperCase()];
};

/**
 * Provider'a göre API URL'ini oluştur
 */
AnimeConstants.getApiUrl = (endpoint, providerId = null) => {
    const provider = providerId 
        ? AnimeConstants.PROVIDERS[providerId.toUpperCase()]
        : AnimeConstants.getCurrentProvider();
    
    if (!provider) {
        throw new Error(`Provider not found: ${providerId || AnimeConstants.DEFAULT_PROVIDER}`);
    }
    
    if (!provider.API_ENDPOINTS[endpoint.toUpperCase()]) {
        throw new Error(`Endpoint not found for provider ${provider.ID}: ${endpoint}`);
    }
    
    return `${provider.BASE_URL}${provider.API_ENDPOINTS[endpoint.toUpperCase()]}`;
};

/**
 * Provider'ın desteklediği endpoint'leri al
 */
AnimeConstants.getProviderEndpoints = (providerId = null) => {
    const provider = providerId 
        ? AnimeConstants.PROVIDERS[providerId.toUpperCase()]
        : AnimeConstants.getCurrentProvider();
    
    if (!provider) {
        return [];
    }
    
    return Object.keys(provider.API_ENDPOINTS);
};

/**
 * Provider'ın rate limit bilgilerini al
 */
AnimeConstants.getProviderRateLimit = (providerId = null) => {
    const provider = providerId 
        ? AnimeConstants.PROVIDERS[providerId.toUpperCase()]
        : AnimeConstants.getCurrentProvider();
    
    if (!provider || !provider.RATE_LIMITS) {
        return AnimeConstants.RATE_LIMIT; // Fallback to global rate limit
    }
    
    return provider.RATE_LIMITS;
};

/**
 * Rating validasyonu
 */
AnimeConstants.isValidRating = (rating) => {
    return typeof rating === 'number' && 
           rating >= AnimeConstants.RATING.MIN && 
           rating <= AnimeConstants.RATING.MAX;
};

/**
 * Progress hesaplama
 */
AnimeConstants.calculateProgress = (watchedEpisodes, totalEpisodes) => {
    if (!totalEpisodes || totalEpisodes <= 0) {
        return 0;
    }
    
    return Math.min(100, Math.round((watchedEpisodes / totalEpisodes) * 100));
};

/**
 * Progress status belirleme
 */
AnimeConstants.getProgressStatus = (watchedEpisodes, totalEpisodes, animeStatus) => {
    if (watchedEpisodes === 0) {
        return AnimeConstants.PROGRESS_STATUS.NOT_STARTED;
    }
    
    if (totalEpisodes && watchedEpisodes >= totalEpisodes) {
        return AnimeConstants.PROGRESS_STATUS.COMPLETED;
    }
    
    if (animeStatus === AnimeConstants.STATUS.PAUSED) {
        return AnimeConstants.PROGRESS_STATUS.PAUSED;
    }
    
    if (animeStatus === AnimeConstants.STATUS.WATCHING) {
        // İzlenen anime için güncel mi kontrol et
        // Bu bilgi scraping'den gelecek
        return AnimeConstants.PROGRESS_STATUS.WATCHING;
    }
    
    return AnimeConstants.PROGRESS_STATUS.WATCHING;
};

module.exports = AnimeConstants;
