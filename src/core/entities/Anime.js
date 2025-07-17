/**
 * Anime Entity - Anime verisi için domain model
 * 
 * Mevcut database.js'deki animes tablosunun yapısına uygun
 */

const AnimeConstants = require('../../shared/constants/AnimeConstants');
const Validation = require('../../shared/utils/Validation');

class Anime {
    constructor(data = {}) {
        // Primary key
        this.id = data.id || null;
        
        // Required fields
        this.title = data.title || '';
        this.url = data.url || '';
        
        // Optional fields with defaults
        this.image = data.image || '';
        this.currentEpisode = data.currentEpisode || 0;
        this.totalEpisodes = data.totalEpisodes || 0;
        this.status = data.status || AnimeConstants.STATUS.WATCHING;
        this.has_new_episode = data.has_new_episode || 0;
        this.lastChecked = data.lastChecked || null;
        this.dateAdded = data.dateAdded || new Date().toISOString();
        this.notes = data.notes || '';
        
        // Computed properties
        this._progress = null;
        this._progressStatus = null;
    }

    /**
     * Progress hesaplama (cached)
     */
    get progress() {
        if (this._progress === null) {
            this._progress = AnimeConstants.calculateProgress(
                this.currentEpisode, 
                this.totalEpisodes
            );
        }
        return this._progress;
    }

    /**
     * Progress status belirleme (cached)
     */
    get progressStatus() {
        if (this._progressStatus === null) {
            this._progressStatus = AnimeConstants.getProgressStatus(
                this.currentEpisode,
                this.totalEpisodes,
                this.status
            );
        }
        return this._progressStatus;
    }

    /**
     * Status display name
     */
    get statusDisplayName() {
        return AnimeConstants.getStatusDisplayName(this.status);
    }

    /**
     * Yeni bölüm var mı kontrolü
     */
    get hasNewEpisode() {
        return Boolean(this.has_new_episode);
    }

    /**
     * Anime tamamlandı mı kontrolü
     */
    get isCompleted() {
        return this.status === AnimeConstants.STATUS.COMPLETED ||
               (this.totalEpisodes > 0 && this.currentEpisode >= this.totalEpisodes);
    }

    /**
     * Anime izleniyor mu kontrolü
     */
    get isWatching() {
        return this.status === AnimeConstants.STATUS.WATCHING;
    }

    /**
     * Son kontrol tarihini formatla
     */
    get lastCheckedFormatted() {
        if (!this.lastChecked) return 'Hiç kontrol edilmedi';
        
        const date = new Date(this.lastChecked);
        return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR');
    }

    /**
     * Ekleme tarihini formatla
     */
    get dateAddedFormatted() {
        const date = new Date(this.dateAdded);
        return date.toLocaleDateString('tr-TR');
    }

    /**
     * Validasyon
     */
    validate() {
        const validator = new Validation();
        
        const rules = {
            title: ['required', 'minLength:1', 'maxLength:255'],
            url: ['required', 'url', 'turkAnimeUrl'],
            status: ['required', 'in:' + Object.values(AnimeConstants.STATUS).join(',')],
            currentEpisode: ['integer', 'min:0', 'max:10000'],
            totalEpisodes: ['integer', 'min:0', 'max:10000']
        };

        return validator.validate({
            title: this.title,
            url: this.url,
            status: this.status,
            currentEpisode: this.currentEpisode,
            totalEpisodes: this.totalEpisodes
        }, rules);
    }

    /**
     * Bölüm güncelle
     */
    updateEpisode(newEpisode) {
        const oldEpisode = this.currentEpisode;
        this.currentEpisode = Math.max(0, parseInt(newEpisode) || 0);
        
        // Progress cache'i temizle
        this._progress = null;
        this._progressStatus = null;
        
        // Status otomatik güncelleme
        if (this.totalEpisodes > 0 && this.currentEpisode >= this.totalEpisodes) {
            this.status = AnimeConstants.STATUS.COMPLETED;
        } else if (this.status === AnimeConstants.STATUS.COMPLETED && this.currentEpisode < this.totalEpisodes) {
            this.status = AnimeConstants.STATUS.WATCHING;
        }
        
        return oldEpisode !== this.currentEpisode;
    }

    /**
     * Status güncelle
     */
    updateStatus(newStatus) {
        if (!AnimeConstants.isValidStatus(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }
        
        const oldStatus = this.status;
        this.status = newStatus;
        
        // Progress cache'i temizle
        this._progressStatus = null;
        
        return oldStatus !== this.status;
    }

    /**
     * Yeni bölüm flag'ini güncelle
     */
    setNewEpisodeFlag(hasNew) {
        this.has_new_episode = hasNew ? 1 : 0;
    }

    /**
     * Son kontrol tarihini güncelle
     */
    updateLastChecked() {
        this.lastChecked = new Date().toISOString();
    }

    /**
     * Database için serilaştırma
     */
    toDbObject() {
        return {
            id: this.id,
            title: this.title,
            url: this.url,
            image: this.image,
            currentEpisode: this.currentEpisode,
            totalEpisodes: this.totalEpisodes,
            status: this.status,
            has_new_episode: this.has_new_episode,
            lastChecked: this.lastChecked,
            dateAdded: this.dateAdded,
            notes: this.notes
        };
    }

    /**
     * JSON için serilaştırma
     */
    toJSON() {
        return {
            ...this.toDbObject(),
            progress: this.progress,
            progressStatus: this.progressStatus,
            statusDisplayName: this.statusDisplayName,
            hasNewEpisode: this.hasNewEpisode,
            isCompleted: this.isCompleted,
            isWatching: this.isWatching,
            lastCheckedFormatted: this.lastCheckedFormatted,
            dateAddedFormatted: this.dateAddedFormatted
        };
    }

    /**
     * Clone anime
     */
    clone() {
        return new Anime(this.toDbObject());
    }

    /**
     * Static factory methods
     */
    static fromDbRow(row) {
        return new Anime(row);
    }

    static createNew(title, url, options = {}) {
        return new Anime({
            title,
            url,
            ...options,
            dateAdded: new Date().toISOString()
        });
    }
}

module.exports = Anime;
