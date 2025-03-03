# 🔍 Web Teknoloji Analiz Aracı

Bu araç, herhangi bir web sitesinin kullandığı backend ve frontend teknolojilerini otomatik olarak analiz ederek detaylı bir rapor sunar. Modern ve kullanıcı dostu arayüzü sayesinde, web teknolojilerini kolayca keşfedebilirsiniz.


## 🌐 Demo

[Live Demo](https://site-analiz.vercel.app)

## 🚀 Özellikler

### Backend Analizi
- Sunucu teknolojisi tespiti (Apache, Nginx, IIS vb.)
- Programlama dili tespiti (PHP, Node.js, Python vb.)
- Framework tespiti (Laravel, Django, Flask vb.)
- CMS sistemleri tespiti (WordPress, Drupal, Joomla vb.)
- DNS analizi ve WHOIS bilgileri
- SSL sertifika kontrolü

### Frontend Analizi
- JavaScript framework tespiti (React, Vue.js, Angular vb.)
- CSS framework tespiti (Bootstrap, Tailwind CSS, Material UI vb.)
- JavaScript kütüphane tespiti (jQuery vb.)
- CDN kullanım analizi
- SEO analizi

### Genel Özellikler
- 🎯 Kullanıcı dostu arayüz
- 🔄 Asenkron analiz sistemi
- 📱 Responsive tasarım
- ⚡ Hızlı sonuç
- 🛡️ Hata yönetimi
- 📊 Detaylı raporlama

## 🛠️ Teknolojiler

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript
- **Paketler**: 
  - axios (HTTP istekleri)
  - cheerio (HTML parsing)
  - cors (Cross-origin resource sharing)
  - whois-json (WHOIS sorguları)
  - ssl-checker (SSL kontrolleri)
- **Deployment**: Vercel

## ⚙️ Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/zersxae/Web-Teknoloji-Analiz-Arac-.git
cd site-analiz
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı başlatın:
```bash
# Geliştirme modu
npm run dev

# Prodüksiyon modu
npm start
```

4. Tarayıcınızda açın:
```
http://localhost:3000
```

## 🚀 Deployment

### Vercel ile Deploy

1. [Vercel](https://vercel.com)'e giriş yapın
2. New Project > Import Git Repository
3. site-analiz repository'sini seçin
4. Deploy butonuna tıklayın

Vercel otomatik olarak:
- Node.js ortamını kurar
- Bağımlılıkları yükler
- SSL sertifikası oluşturur
- Global CDN üzerinden yayınlar

## 📡 API Kullanımı

### Site Analizi Endpoint'i

```http
GET /analyze?url=https://example.com
```

#### Başarılı Yanıt (200 OK)

```json
{
  "url": "https://example.com",
  "backend": {
    "server": "Apache",
    "powered_by": "PHP/8.1",
    "detected_frameworks": ["WordPress", "Laravel"]
  },
  "frontend": {
    "javascript_frameworks": ["React", "jQuery"],
    "css_frameworks": ["Bootstrap", "Tailwind CSS"],
    "cdn_libraries": ["Google Fonts", "Cloudflare CDN"]
  },
  "security": {
    "ssl_valid": true,
    "headers": {
      "content-security-policy": "...",
      "x-frame-options": "DENY"
    }
  }
}
```

## 🔍 Tespit Edilen Teknolojiler

### Backend Teknolojileri
- Web Sunucuları: Apache, Nginx, IIS
- Programlama Dilleri: PHP, Node.js, Python, Ruby
- Frameworks: Laravel, Django, Flask, Ruby on Rails
- CMS: WordPress, Drupal, Joomla

### Frontend Teknolojileri
- JavaScript Frameworks: React, Vue.js, Angular
- CSS Frameworks: Bootstrap, Tailwind CSS, Material UI
- JavaScript Libraries: jQuery, Lodash
- CDN Servisleri: Cloudflare, Google Fonts, jsDelivr

## 🤝 Katkıda Bulunma

1. Bu repoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: amazing new feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Yapılacaklar

- [x] DNS kayıtları analizi
- [x] SSL sertifika bilgileri
- [x] WHOIS bilgileri
- [ ] Performans analizi
- [ ] Raporları PDF olarak dışa aktarma
- [ ] API rate limiting
- [ ] Kullanıcı authentication

## 📜 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasını inceleyebilirsiniz.

## 🐛 Hata Bildirimi

Bir hata bulduysanız veya öneriniz varsa, lütfen GitHub Issues üzerinden bildirin.

## 📞 İletişim

Sorularınız için Issues bölümünü kullanabilir veya aşağıdaki kanallardan bize ulaşabilirsiniz:

- GitHub: [@zersxae](https://github.com/zersxae)
- E-posta: zersxae@gmail.com

---
⭐️ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 