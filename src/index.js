const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const { analyzeWebsite } = require('./analyzer');
const sourceExtractor = require('./extractor');
const visualizer = require('./visualizer');

// Basit bir trafik verisi tutmak için
const trafficData = new Map();

// Trafik verilerini kaydetme fonksiyonu
function logTrafficData(url) {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD formatı

    if (!trafficData.has(url)) {
        trafficData.set(url, new Map());
    }

    const urlData = trafficData.get(url);
    if (!urlData.has(today)) {
        urlData.set(today, 0);
    }

    urlData.set(today, urlData.get(today) + 1);

    // 7 günden eski verileri temizle
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    for (const [date] of urlData) {
        if (new Date(date) < weekAgo) {
            urlData.delete(date);
        }
    }
}

// Trafik istatistiklerini alma fonksiyonu
function getTrafficStats(url) {
    if (!trafficData.has(url)) {
        return {
            totalVisits: 0,
            highestDaily: 0,
            averageDaily: 0,
            dailyData: []
        };
    }

    const urlData = trafficData.get(url);
    const now = new Date();
    const stats = {
        totalVisits: 0,
        highestDaily: 0,
        averageDaily: 0,
        dailyData: []
    };

    // Son 7 günün verilerini hazırla
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const visits = urlData.get(dateStr) || 0;
        
        stats.dailyData.push({
            date: dateStr,
            visits: visits
        });
        
        stats.totalVisits += visits;
        stats.highestDaily = Math.max(stats.highestDaily, visits);
    }

    stats.averageDaily = Math.round(stats.totalVisits / 7);
    return stats;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());
app.use(express.static(path.join(__dirname, '../public')));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Memory usage endpoint
app.get('/memory', (req, res) => {
    const used = process.memoryUsage();
    res.status(200).json({
        rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
        external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
    });
});

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Analiz endpoint'i
app.get('/analyze', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).send('URL parametresi gereklidir');
        }

        try {
            new URL(url);
        } catch (error) {
            return res.status(400).send('Geçersiz URL formatı');
        }

        // Ziyareti kaydet
        logTrafficData(url);

        console.log(`Analiz başlatılıyor: ${url}`);
        const analysis = await analyzeWebsite(url);
        const trafficStats = getTrafficStats(url);

        // Analiz sonuçlarını HTML olarak gönder
        res.send(`
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Analiz Sonuçları - ${url}</title>
                <link rel="stylesheet" href="style.css">
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>🔍 Web Teknoloji Analiz Sonuçları</h1>
                        <p>Analiz edilen site: ${url}</p>
                        <a href="/" class="back-button">← Yeni Analiz</a>
                    </header>

                    <main class="results">
                        <div class="result-section">
                            <h2>📡 Backend Teknolojileri</h2>
                            <div class="tech-grid">
                                <div class="tech-item">
                                    <h3>Sunucu</h3>
                                    <p>${analysis.backend.server || 'Tespit edilemedi'}</p>
                                </div>
                                <div class="tech-item">
                                    <h3>Programlama Dili</h3>
                                    <p>${analysis.backend.programming_language || 'Tespit edilemedi'}</p>
                                </div>
                                <div class="tech-item">
                                    <h3>Framework</h3>
                                    <p>${analysis.backend.detected_frameworks.length > 0 ? analysis.backend.detected_frameworks.join(', ') : 'Tespit edilemedi'}</p>
                                </div>
                                <div class="tech-item">
                                    <h3>CMS</h3>
                                    <p>${analysis.backend.cms || 'Tespit edilemedi'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="result-section">
                            <h2>🎨 Frontend Teknolojileri</h2>
                            <div class="tech-grid">
                                <div class="tech-item">
                                    <h3>JavaScript Frameworks</h3>
                                    <p>${analysis.frontend.javascript_frameworks.length > 0 ? analysis.frontend.javascript_frameworks.join(', ') : 'Tespit edilemedi'}</p>
                                </div>
                                <div class="tech-item">
                                    <h3>CSS Frameworks</h3>
                                    <p>${analysis.frontend.css_frameworks.length > 0 ? analysis.frontend.css_frameworks.join(', ') : 'Tespit edilemedi'}</p>
                                </div>
                                <div class="tech-item">
                                    <h3>UI Kütüphaneleri</h3>
                                    <p>${analysis.frontend.ui_libraries.length > 0 ? analysis.frontend.ui_libraries.join(', ') : 'Tespit edilemedi'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="result-section">
                            <h2>🛡️ Güvenlik Analizi</h2>
                            <div class="tech-grid">
                                <div class="tech-item">
                                    <h3>SSL Durumu</h3>
                                    <p>${analysis.security.ssl.valid ? '✅ Güvenli' : '❌ Güvenli Değil'}</p>
                                </div>
                                <div class="tech-item">
                                    <h3>CORS</h3>
                                    <p>${analysis.security.security_features.cors_enabled ? '✅ Aktif' : '❌ Pasif'}</p>
                                </div>
                                <div class="tech-item">
                                    <h3>XSS Koruması</h3>
                                    <p>${analysis.security.security_features.xss_protection ? '✅ Aktif' : '❌ Pasif'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="result-section">
                            <h2>⚡ Performans Metrikleri</h2>
                            <div class="tech-grid">
                                <div class="tech-item">
                                    <h3>Yanıt Süresi</h3>
                                    <p>${analysis.performance.response_time}ms</p>
                                </div>
                                <div class="tech-item">
                                    <h3>Sayfa Boyutu</h3>
                                    <p>${(analysis.performance.page_size / 1024).toFixed(2)} KB</p>
                                </div>
                                <div class="tech-item">
                                    <h3>GZIP Sıkıştırma</h3>
                                    <p>${analysis.performance.gzip_enabled ? '✅ Aktif' : '❌ Pasif'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="result-section">
                            <h2>📈 Trafik Analizi</h2>
                            <div class="traffic-stats">
                                <div class="stat-card">
                                    <span class="stat-value">${trafficStats.totalVisits}</span>
                                    <span class="stat-label">Toplam Ziyaret</span>
                                </div>
                                <div class="stat-card">
                                    <span class="stat-value">${trafficStats.highestDaily}</span>
                                    <span class="stat-label">En Yüksek Günlük Ziyaret</span>
                                </div>
                                <div class="stat-card">
                                    <span class="stat-value">${trafficStats.averageDaily}</span>
                                    <span class="stat-label">Ortalama Günlük Ziyaret</span>
                                </div>
                            </div>
                        </div>

                        <div class="result-section donation-section">
                            <h2>💝 Projeyi Destekleyin</h2>
                            <p>Bu proje açık kaynak olarak geliştirilmektedir. Geliştirilmesine destek olmak için bağış yapabilirsiniz.</p>
                            <div class="donation-container">
                                <iframe 
                                    src="https://www.buymeacoffee.com/widget/page/zers" 
                                    style="width: 100%; height: 550px; border: 0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
                                    title="Buy Me a Coffee"
                                    allow="payment"
                                ></iframe>
                            </div>
                        </div>
                    </main>

                    <footer>
                        <p>Bu araç açık kaynak kodludur. <a href="https://github.com/zersxae/Web-Teknoloji-Analiz-Arac-" target="_blank">GitHub'da İnceleyin</a></p>
                    </footer>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Analiz hatası:', error);
        let errorMessage = 'Site analizi sırasında bir hata oluştu';
        
        if (error.message.includes('timeout')) {
            errorMessage = 'Site yanıt vermedi. Bu site analiz için çok yavaş yanıt veriyor veya erişimi engelliyor olabilir. Lütfen başka bir site deneyin.';
        } else if (error.message.includes('ENOTFOUND')) {
            errorMessage = 'Site bulunamadı. Lütfen URL\'in doğru olduğundan emin olun.';
        } else if (error.message.includes('ECONNREFUSED')) {
            errorMessage = 'Siteye bağlanılamadı. Site şu anda erişilebilir değil veya analizi engelliyor olabilir.';
        }

        res.status(500).send(`
            <div class="error">
                <h2>❌ Hata Oluştu</h2>
                <p>${errorMessage}</p>
                <a href="/" class="back-button">← Tekrar Dene</a>
            </div>
        `);
    }
});

// Kaynak kod çekme endpoint'i
app.get('/api/extract', async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parametresi gerekli' });
    }

    try {
        const sources = await sourceExtractor.extractSources(url);
        res.json(sources);
    } catch (error) {
        console.error('Kaynak kod çekme hatası:', error);
        res.status(500).json({ 
            error: 'Kaynak kodlar çekilemedi',
            details: error.message 
        });
    }
});

// Catch-all error handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

// Export for Vercel
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
    });
} 