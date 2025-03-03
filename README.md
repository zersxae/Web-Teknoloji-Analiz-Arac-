# 🔍 Web Teknoloji Analiz Aracı

Bu araç, herhangi bir web sitesinin kullandığı backend ve frontend teknolojilerini otomatik olarak analiz ederek detaylı bir rapor sunar. Modern ve kullanıcı dostu arayüzü sayesinde, web teknolojilerini kolayca keşfedebilirsiniz.

![Web Teknoloji Analiz Aracı](https://via.placeholder.com/800x400?text=Web+Teknoloji+Analiz+Aracı)

## 🚀 Özellikler

### Backend Analizi
- Sunucu teknolojisi tespiti (Apache, Nginx, IIS vb.)
- Programlama dili tespiti (PHP, Node.js, Python vb.)
- Framework tespiti (Laravel, Django, Flask vb.)
- CMS sistemleri tespiti (WordPress, Drupal, Joomla vb.)

### Frontend Analizi
- JavaScript framework tespiti (React, Vue.js, Angular vb.)
- CSS framework tespiti (Bootstrap, Tailwind CSS, Material UI vb.)
- JavaScript kütüphane tespiti (jQuery vb.)
- CDN kullanım analizi

### Genel Özellikler
- 🎯 Kullanıcı dostu arayüz
- 🔄 Asenkron analiz sistemi
- 📱 Responsive tasarım
- ⚡ Hızlı sonuç
- 🛡️ Hata yönetimi

## 🛠️ Teknolojiler

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Paketler**: axios, cheerio, cors
- **Tasarım**: CSS Variables, Flexbox, Grid
- **Font**: Inter (Google Fonts)

## ⚙️ Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/yourusername/site-analiz.git
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
  }
}
```

#### Hata Yanıtları

- `400 Bad Request`: Geçersiz veya eksik URL
- `500 Internal Server Error`: Sunucu hatası

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

- [ ] Daha fazla framework desteği
- [ ] Versiyon tespiti
- [ ] Performans analizi
- [ ] SSL sertifika bilgileri
- [ ] DNS kayıtları analizi
- [ ] Raporları PDF olarak dışa aktarma

## 📜 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasını inceleyebilirsiniz.

## 📞 İletişim

- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourusername](https://twitter.com/yourusername)
- E-posta: your.email@example.com

---
⭐️ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 