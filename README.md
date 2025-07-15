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

### Development Mode
Geliştirme modu için:
```bash
npm run dev
```

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

- **[Electron.js](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[Node.js](https://nodejs.org/)** - Backend runtime
- **[Puppeteer](https://pptr.dev/)** - Web scraping engine
- **[SQLite3](https://www.sqlite.org/)** - Local database
- **[node-notifier](https://github.com/mikaelbr/node-notifier)** - Desktop notifications
- **Modern CSS3** - Responsive UI with dark theme
- **Vanilla JavaScript** - Frontend logic

## 📁 Proje Yapısı

```
anime-takip/
├── main.js                 # Ana Electron süreci
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
└── dist/                  # Build çıktıları
```

## 🎯 Kullanım

### 1. Anime Ekleme
- **"Anime Ekle"** butonuna tıklayın
- Anime adını arama kutusuna yazın
- **"Ara"** butonuna basın
- Sonuçlardan istediğiniz animeyi seçin

### 2. Bölüm Güncelleme
- Anime kartındaki **"Güncelle"** butonuna tıklayın
- Mevcut bölüm numarasını düzenleyin
- **"Güncelle"** butonuna basın

### 3. Otomatik Kontrol
- Uygulama arka planda çalışırken otomatik olarak yeni bölümleri kontrol eder
- Yeni bölüm bulunduğunda masaüstü bildirimi alırsınız

### 4. Anime Yönetimi
- **Filtreler**: Tümü, İzleniyor, Tamamlandı, Durduruldu
- **Arama**: Anime adına göre hızlı arama
- **Silme**: İstenmeyen animeleri listeden kaldırma

## ⚙️ Ayarlar

### Kontrol Aralığı
Yeni bölüm kontrolü için zaman aralığını ayarlayın (varsayılan: 30 dakika)

### Bildirimler
Masaüstü bildirimlerini açıp kapatabilirsiniz

### Otomatik Başlatma
Uygulama açıldığında otomatik kontrol başlatsın mı?

## 🔧 Geliştirme

### Debug Modu
```bash
npm run dev
```

### Geliştirici Araçları
Uygulama içinde **F12** tuşuna basarak geliştirici araçlarını açabilirsiniz.

### Log Dosyaları
Uygulama logları konsol çıktısında görüntülenir.

## 📋 TODO / Gelecek Özellikler

- [ ] MAL (MyAnimeList) entegrasyonu
- [ ] Anime önerileri
- [ ] Export/Import özelliği
- [ ] Tema özelleştirme
- [ ] Anime notları ve puanlama
- [ ] Episode download tracker
- [ ] Mini-player modu

## 🐛 Bilinen Sorunlar

- TurkAnime.co site yapısı değiştiğinde scraping sorunları yaşanabilir
- Çok fazla anime eklenmesi durumunda performans düşüşü
- İnternet bağlantısı olmadığında yeni anime ekleme çalışmaz

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

- [Issues](https://github.com/username/anime-takip/issues) açın
- [Discussions](https://github.com/username/anime-takip/discussions) bölümünü kullanın

## 🙏 Teşekkürler

- [TurkAnime.co](https://www.turkanime.co) - Anime içerikleri için
- [Electron Community](https://www.electronjs.org/community) - Framework desteği için
- Tüm contributors ve testers

---

**⭐ Beğendiyseniz star vermeyi unutmayın!**

Made with ❤️ by [Anime Takip Team]
