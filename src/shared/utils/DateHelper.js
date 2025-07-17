/**
 * DateHelper - Date utility functions
 * Tarih işlemleri için yardımcı fonksiyonlar
 */

class DateHelper {
    /**
     * Formatlanmış tarih string'i döndür
     * @param {Date|string|number} date - Tarih
     * @param {string} format - Format ('short', 'medium', 'long', 'time', 'datetime')
     * @param {string} locale - Dil (tr, en)
     */
    static format(date, format = 'medium', locale = 'tr') {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';

        const options = this._getFormatOptions(format);
        
        try {
            return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', options).format(dateObj);
        } catch (error) {
            // Fallback to basic format
            return dateObj.toLocaleDateString();
        }
    }

    /**
     * Relative time string'i döndür (2 saat önce, 3 gün önce gibi)
     * @param {Date|string|number} date - Tarih
     * @param {string} locale - Dil
     */
    static relative(date, locale = 'tr') {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';

        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (locale === 'tr') {
            return this._getRelativeStringTR(diffSeconds, diffMinutes, diffHours, diffDays, diffWeeks, diffMonths, diffYears);
        } else {
            return this._getRelativeStringEN(diffSeconds, diffMinutes, diffHours, diffDays, diffWeeks, diffMonths, diffYears);
        }
    }

    /**
     * İki tarih arasındaki farkı hesapla
     * @param {Date|string|number} date1 - İlk tarih
     * @param {Date|string|number} date2 - İkinci tarih
     * @param {string} unit - Birim ('ms', 'seconds', 'minutes', 'hours', 'days')
     */
    static diff(date1, date2, unit = 'days') {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

        const diffMs = Math.abs(d2.getTime() - d1.getTime());

        switch (unit) {
            case 'ms':
                return diffMs;
            case 'seconds':
                return Math.floor(diffMs / 1000);
            case 'minutes':
                return Math.floor(diffMs / (1000 * 60));
            case 'hours':
                return Math.floor(diffMs / (1000 * 60 * 60));
            case 'days':
                return Math.floor(diffMs / (1000 * 60 * 60 * 24));
            default:
                return diffMs;
        }
    }

    /**
     * Tarihi ISO string formatına çevir (database için)
     * @param {Date|string|number} date - Tarih
     */
    static toISO(date) {
        if (!date) return null;
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return null;

        return dateObj.toISOString();
    }

    /**
     * Tarihi YYYY-MM-DD formatına çevir
     * @param {Date|string|number} date - Tarih
     */
    static toDateString(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';

        return dateObj.toISOString().split('T')[0];
    }

    /**
     * Türk tarih formatından Date object'e çevir (DD.MM.YYYY)
     * @param {string} dateString - Tarih string'i
     */
    static fromTurkishFormat(dateString) {
        if (!dateString) return null;
        
        const parts = dateString.split('.');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-based
        const year = parseInt(parts[2], 10);

        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * Bugünün başlangıcını al (00:00:00)
     */
    static startOfDay(date = new Date()) {
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    }

    /**
     * Bugünün sonunu al (23:59:59)
     */
    static endOfDay(date = new Date()) {
        const dateObj = new Date(date);
        dateObj.setHours(23, 59, 59, 999);
        return dateObj;
    }

    /**
     * Haftanın başlangıcını al (Pazartesi)
     */
    static startOfWeek(date = new Date()) {
        const dateObj = new Date(date);
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
        dateObj.setDate(diff);
        return this.startOfDay(dateObj);
    }

    /**
     * Ayın başlangıcını al
     */
    static startOfMonth(date = new Date()) {
        const dateObj = new Date(date);
        dateObj.setDate(1);
        return this.startOfDay(dateObj);
    }

    /**
     * Yılın başlangıcını al
     */
    static startOfYear(date = new Date()) {
        const dateObj = new Date(date);
        dateObj.setMonth(0, 1);
        return this.startOfDay(dateObj);
    }

    /**
     * Tarih validasyonu
     * @param {*} date - Kontrol edilecek değer
     */
    static isValid(date) {
        if (!date) return false;
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
    }

    /**
     * Gelecek tarih mi kontrol et
     * @param {Date|string|number} date - Tarih
     */
    static isFuture(date) {
        if (!this.isValid(date)) return false;
        return new Date(date) > new Date();
    }

    /**
     * Geçmiş tarih mi kontrol et
     * @param {Date|string|number} date - Tarih
     */
    static isPast(date) {
        if (!this.isValid(date)) return false;
        return new Date(date) < new Date();
    }

    /**
     * Bugün mü kontrol et
     * @param {Date|string|number} date - Tarih
     */
    static isToday(date) {
        if (!this.isValid(date)) return false;
        const today = this.toDateString(new Date());
        const compareDate = this.toDateString(date);
        return today === compareDate;
    }

    /**
     * Anime release date formatter (özel format)
     * @param {string} releaseDate - Release date string
     */
    static formatAnimeDate(releaseDate) {
        if (!releaseDate) return 'Bilinmiyor';
        
        const date = new Date(releaseDate);
        if (isNaN(date.getTime())) return releaseDate;

        const now = new Date();
        const diffDays = this.diff(date, now, 'days');

        if (this.isToday(date)) {
            return 'Bugün';
        } else if (diffDays === 1) {
            return this.isFuture(date) ? 'Yarın' : 'Dün';
        } else if (diffDays <= 7) {
            return this.relative(date);
        } else {
            return this.format(date, 'short');
        }
    }

    /**
     * Episode watch time calculator
     * @param {number} episodeCount - Bölüm sayısı
     * @param {number} averageLength - Ortalama bölüm süresi (dakika)
     */
    static calculateWatchTime(episodeCount, averageLength = 24) {
        if (!episodeCount || episodeCount <= 0) return 'Bilinmiyor';

        const totalMinutes = episodeCount * averageLength;
        const hours = Math.floor(totalMinutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            const remainingHours = hours % 24;
            return `${days} gün ${remainingHours > 0 ? remainingHours + ' saat' : ''}`.trim();
        } else if (hours > 0) {
            const remainingMinutes = totalMinutes % 60;
            return `${hours} saat ${remainingMinutes > 0 ? remainingMinutes + ' dk' : ''}`.trim();
        } else {
            return `${totalMinutes} dakika`;
        }
    }

    // ============ PRIVATE METHODS ============

    static _getFormatOptions(format) {
        switch (format) {
            case 'short':
                return { day: '2-digit', month: '2-digit', year: 'numeric' };
            case 'medium':
                return { day: 'numeric', month: 'long', year: 'numeric' };
            case 'long':
                return { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                };
            case 'time':
                return { hour: '2-digit', minute: '2-digit' };
            case 'datetime':
                return { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                };
            default:
                return { day: 'numeric', month: 'long', year: 'numeric' };
        }
    }

    static _getRelativeStringTR(seconds, minutes, hours, days, weeks, months, years) {
        if (seconds < 60) return 'Az önce';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        if (weeks < 4) return `${weeks} hafta önce`;
        if (months < 12) return `${months} ay önce`;
        return `${years} yıl önce`;
    }

    static _getRelativeStringEN(seconds, minutes, hours, days, weeks, months, years) {
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
}

module.exports = DateHelper;
