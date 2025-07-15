# 🎌 Anime Takip - TurkAnime Tracker

Modern ve kullanıcı dostu bir **TurkAnime.co** anime takip uygulaması. Electron.js ile geliştirilmiş, dark theme ve anime temalı arayüze sahip masaüstü uygulaması.

![Anime Takip](assets/icon.png)

## ✨ Özellikler

### 🔍 **Anime Arama & Ekleme**
- TurkAnime.co üzerinden anime arama
- Tek tıkla anime ekleme
- Otomatik anime detayları çekme

### 📊 **İzleme Takibi**
- Hangi bölümde kaldığınızı takip edin
- Progress bar ile görsel ilerleme
- İzleme durumu yönetimi (İzleniyor, Tamamlandı, Durduruldu)

### 🔔 **Otomatik Bildirimler**
- Yeni bölüm yayınlandığında bildirim alın
- Arka planda otomatik kontrol
- Masaüstü toast bildirimleri

### 💾 **Yerel Veri Saklama**
- SQLite veritabanı ile hızlı veri erişimi
- İzleme geçmişiniz güvenle saklanır
- Çevrimdışı çalışma desteği

### 🎨 **Modern Arayüz**
- Anime temalı dark theme
- Responsive tasarım
- Smooth animasyonlar ve geçişler

## 🚀 Kurulum

### Gereksinimler
- **Node.js** (v16 veya üzeri)
- **npm** package manager

### Adım Adım Kurulum

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/username/anime-takip.git
   cd anime-takip
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Uygulamayı çalıştırın:**
   ```bash
   npm start
   ```

   Veya production modunda:
   ```bash
   npm run start:prod
   ```

### Development Mode
Geliştirme modu için:
```bash
npm run dev
```

**Not:** NODE_ENV=development ile çalıştırmak için `cross-env` kullanılmaktadır.

## 📦 Build & Dağıtım

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

### Tüm Platformlar
```bash
npm run build
```

Build edilmiş dosyalar `dist/` klasöründe oluşacaktır.

## 🛠️ Teknoloji Stack

- **[Electron.js](https://www.electronjs.org/)** (v37.2.1) - Cross-platform desktop framework
- **[Node.js](https://nodejs.org/)** - Backend runtime
- **[Puppeteer](https://pptr.dev/)** (v24.13.0) - Web scraping engine
- **[SQLite3](https://www.sqlite.org/)** (v5.1.7) - Local database
- **[node-notifier](https://github.com/mikaelbr/node-notifier)** (v10.0.1) - Desktop notifications
- **[Cheerio](https://cheerio.js.org/)** (v1.1.0) - Server-side HTML parsing
- **[cross-env](https://github.com/kentcdodds/cross-env)** (v7.0.3) - Cross-platform environment variables
- **[electron-builder](https://www.electron.build/)** (v26.0.12) - App packaging and distribution
- **Modern CSS3** - Responsive UI with dark theme
- **Vanilla JavaScript** - Frontend logic

## 📁 Proje Yapısı

```
anime-takip/
├── main.js                 # Ana Electron süreci
├── package.json            # Proje bağımlılıkları ve script'ler
├── .gitignore             # Git ignore kuralları
├── src/
│   ├── animeTracker.js     # Anime takip logic'i
│   ├── database.js         # SQLite database yönetimi
│   └── renderer/
│       ├── index.html      # Ana UI dosyası
│       ├── styles.css      # CSS stilleri
│       └── renderer.js     # Frontend JavaScript
├── assets/
│   ├── icon.png           # Uygulama ikonu
│   └── placeholder.jpg    # Placeholder görsel
├── data/                  # SQLite veritabanı (otomatik oluşur)
├── dist/                  # Build çıktıları
└── node_modules/          # NPM bağımlılıkları
```

## 🎯 Kullanım

### 1. Anime Ekleme
- **"Anime Ekle"** butonuna tıklayın
- Anime adını arama kutusuna yazın
- **"Ara"** butonuna basın
- Sonuçlardan istediğiniz animeyi seçin
- Mevcut bölüm numaranızı girin ve onaylayın

### 2. Bölüm Güncelleme
- Anime kartındaki **"Güncelle"** butonuna tıklayın
- Mevcut bölüm numarasını düzenleyin
- Anime durumunu değiştirin (İzleniyor, Tamamlandı, vb.)
- **"Güncelle"** butonuna basın

### 3. Yeni Bölüm İzleme
- Anime kartında **"Yeni: X. Bölüm"** badge'i görünürse
- **"X. Bölümü İzle"** butonuna tıklayın
- Bölüm otomatik olarak tarayıcıda açılır ve bölüm numaranız güncellenir

### 4. Otomatik Kontrol
- Uygulama arka planda çalışırken otomatik olarak yeni bölümleri kontrol eder
- Yeni bölüm bulunduğunda masaüstü bildirimi alırsınız
- Anime kartlarında yeni bölüm badge'leri görünür

### 4. Anime Yönetimi
- **Filtreler**: Tümü, İzleniyor, Tamamlandı, Durduruldu, Bırakıldı
- **Arama**: Anime adına göre hızlı arama
- **Silme**: İstenmeyen animeleri listeden kaldırma
- **Kategori Güncelleme**: TurkAnime.co'dan kategorileri güncelleme

### 5. Ayarlar
- **Kontrol Aralığı**: Otomatik kontrol süresini ayarlama
- **Bildirimler**: Masaüstü bildirimlerini açma/kapama
- **Otomatik Yenileme**: Uygulama açıldığında otomatik kontrol

## ⚙️ Ayarlar

### Kontrol Aralığı
Yeni bölüm kontrolü için zaman aralığını ayarlayın (varsayılan: 30 dakika)

### Bildirimler
Masaüstü bildirimlerini açıp kapatabilirsiniz. Test bildirimi gönderebilirsiniz.

### Otomatik Yenileme
Uygulama açıldığında otomatik kontrol başlatsın mı?

## 🎯 Öne Çıkan Özellikler

### 🔥 **Yeni Bölüm Bildirimleri**
- Anime kartlarında yeni bölüm badge'leri
- Tek tıkla yeni bölümü izleme
- Otomatik bölüm numarası güncelleme

### 📈 **Akıllı Takip**
- Progress bar ile görsel ilerleme
- Anime durumu yönetimi
- İstatistik özeti (toplam anime, izlenen bölüm, vb.)

### 🔍 **Gelişmiş Arama**
- TurkAnime.co API entegrasyonu
- Hızlı anime bulma
- Kategori bazlı arama

## 🔧 Geliştirme

### Debug Modu
```bash
npm run dev
```

### Geliştirici Araçları
Uygulama içinde **F12** tuşuna basarak geliştirici araçlarını açabilirsiniz.

### Log Dosyaları
Uygulama logları konsol çıktısında görüntülenir. Geliştirme sırasında detaylı debug bilgileri mevcuttur.

### Veritabanı
SQLite veritabanı `data/` klasöründe saklanır ve otomatik olarak oluşturulur.

## 🔧 Sorun Giderme

### Uygulama Başlamıyor
1. Node.js versiyonunuzun v16+ olduğundan emin olun
2. `npm install` komutunu tekrar çalıştırın
3. `node_modules` klasörünü silip yeniden yükleyin

### Anime Bulunamıyor
1. İnternet bağlantınızı kontrol edin
2. TurkAnime.co sitesinin erişilebilir olduğundan emin olun
3. **"Kategorileri Güncelle"** butonunu kullanın

### Bildirimler Çalışmıyor
1. Ayarlardan bildirimlerin açık olduğundan emin olun
2. İşletim sistemi bildirim izinlerini kontrol edin
3. **"Test Bildirimi"** butonunu kullanın

## 📋 TODO / Gelecek Özellikler

- [ ] MAL (MyAnimeList) entegrasyonu
- [ ] Anime önerileri ve rating sistemi
- [ ] Export/Import özelliği (JSON, CSV)
- [ ] Tema özelleştirme (light/dark mode seçimi)
- [ ] Anime notları ve kişisel puanlama
- [ ] Episode download tracker
- [ ] Mini-player modu
- [ ] Keyboard shortcuts
- [ ] Anime takvimi entegrasyonu
- [ ] Multi-language support

## 🐛 Bilinen Sorunlar

- TurkAnime.co site yapısı değiştiğinde scraping sorunları yaşanabilir
- Çok fazla anime eklenmesi durumunda performans düşüşü olabilir
- İnternet bağlantısı olmadığında yeni anime ekleme çalışmaz
- Bazı anime URL'lerinde episode link oluşturma sorunları
- Windows'ta cross-env ile NODE_ENV ayarlama sorunları (düzeltildi)

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyebilirsiniz.

## 💬 Destek

Herhangi bir sorun yaşarsanız veya öneriniz varsa:

- [Issues](https://github.com/berkayopak/anime-takip/issues) açın
- [Discussions](https://github.com/berkayopak/anime-takip/discussions) bölümünü kullanın
- Email: support@animetakip.com (yakında aktif olacak)

## 📊 İstatistikler

- ✅ Cross-platform desteği (Windows, macOS, Linux)
- ✅ Offline çalışma capability
- ✅ Modern ES6+ JavaScript
- ✅ Responsive design
- ✅ Dark theme optimized

## 🙏 Teşekkürler

- [TurkAnime.co](https://www.turkanime.co) - Anime içerikleri için
- [Electron Community](https://www.electronjs.org/community) - Framework desteği için
- [Puppeteer Team](https://pptr.dev/) - Web scraping kütüphanesi için
- Tüm contributors ve beta testers

## 📝 Changelog

### v1.0.0 (Current)
- ✅ İlk stabil sürüm
- ✅ Anime arama ve ekleme
- ✅ Otomatik bölüm kontrolü
- ✅ Masaüstü bildirimleri
- ✅ Yeni bölüm badge sistemi
- ✅ Kategori yönetimi
- ✅ Cross-platform build desteği

---

**⭐ Beğendiyseniz star vermeyi unutmayın!**

Made with ❤️ by [Berkay Opak](https://github.com/berkayopak)
