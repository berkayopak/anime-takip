/**
 * Episode Entity - Episode verisi için domain model
 * 
 * Mevcut database.js'deki episodes tablosunun yapısına uygun
 */

const AnimeConstants = require('../../shared/constants/AnimeConstants');
const Validation = require('../../shared/utils/Validation');

class Episode {
    constructor(data = {}) {
        // Primary key
        this.id = data.id || null;
        
        // Foreign key
        this.animeId = data.animeId || null;
        
        // Required fields
        this.episodeNumber = data.episodeNumber || 0;
        
        // Optional fields
        this.watchedDate = data.watchedDate || null;
        this.rating = data.rating || null;
        this.notes = data.notes || '';
    }

    /**
     * İzlenme tarihini formatla
     */
    get watchedDateFormatted() {
        if (!this.watchedDate) return 'İzlenmedi';
        
        const date = new Date(this.watchedDate);
        return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR');
    }

    /**
     * Rating validasyonu
     */
    get isRatingValid() {
        return this.rating === null || AnimeConstants.isValidRating(this.rating);
    }

    /**
     * Rating display
     */
    get ratingDisplay() {
        if (this.rating === null) return 'Değerlendirilmedi';
        return `${this.rating}/10`;
    }

    /**
     * İzlendi mi kontrolü
     */
    get isWatched() {
        return this.watchedDate !== null;
    }

    /**
     * Episode title oluştur
     */
    get title() {
        return `Bölüm ${this.episodeNumber}`;
    }

    /**
     * Validasyon
     */
    validate() {
        const validator = new Validation();
        
        const rules = {
            animeId: ['required', 'integer', 'min:1'],
            episodeNumber: ['required', 'integer', 'min:1', 'max:10000'],
            rating: ['nullable', 'integer', 'min:0', 'max:10']
        };

        return validator.validate({
            animeId: this.animeId,
            episodeNumber: this.episodeNumber,
            rating: this.rating
        }, rules);
    }

    /**
     * İzlendi olarak işaretle
     */
    markAsWatched(rating = null, notes = '') {
        this.watchedDate = new Date().toISOString();
        
        if (rating !== null) {
            if (!AnimeConstants.isValidRating(rating)) {
                throw new Error(`Invalid rating: ${rating}. Must be between ${AnimeConstants.RATING.MIN} and ${AnimeConstants.RATING.MAX}`);
            }
            this.rating = rating;
        }
        
        if (notes) {
            this.notes = notes;
        }
    }

    /**
     * İzlenmedi olarak işaretle
     */
    markAsUnwatched() {
        this.watchedDate = null;
        this.rating = null;
        this.notes = '';
    }

    /**
     * Rating güncelle
     */
    updateRating(newRating) {
        if (newRating !== null && !AnimeConstants.isValidRating(newRating)) {
            throw new Error(`Invalid rating: ${newRating}`);
        }
        
        this.rating = newRating;
    }

    /**
     * Notları güncelle
     */
    updateNotes(newNotes) {
        this.notes = newNotes || '';
    }

    /**
     * Database için serilaştırma
     */
    toDbObject() {
        return {
            id: this.id,
            animeId: this.animeId,
            episodeNumber: this.episodeNumber,
            watchedDate: this.watchedDate,
            rating: this.rating,
            notes: this.notes
        };
    }

    /**
     * JSON için serilaştırma
     */
    toJSON() {
        return {
            ...this.toDbObject(),
            watchedDateFormatted: this.watchedDateFormatted,
            isRatingValid: this.isRatingValid,
            ratingDisplay: this.ratingDisplay,
            isWatched: this.isWatched,
            title: this.title
        };
    }

    /**
     * Clone episode
     */
    clone() {
        return new Episode(this.toDbObject());
    }

    /**
     * Static factory methods
     */
    static fromDbRow(row) {
        return new Episode(row);
    }

    static createNew(animeId, episodeNumber) {
        return new Episode({
            animeId,
            episodeNumber
        });
    }

    static createWatched(animeId, episodeNumber, rating = null, notes = '') {
        const episode = new Episode({
            animeId,
            episodeNumber,
            rating,
            notes
        });
        
        episode.markAsWatched(rating, notes);
        return episode;
    }
}

module.exports = Episode;
