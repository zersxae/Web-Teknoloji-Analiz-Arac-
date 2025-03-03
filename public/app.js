let currentAnalysisUrl = '';
let sourceData = null;

async function startAnalysis() {
    const urlInput = document.getElementById('urlInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const results = document.getElementById('results');
    const sourceDownload = document.getElementById('sourceDownload');
    const steps = document.querySelectorAll('.step');
    
    // URL kontrolü
    const url = urlInput.value.trim();
    if (!url) {
        alert('Lütfen bir URL girin');
        return;
    }

    try {
        new URL(url);
    } catch {
        alert('Geçerli bir URL girin');
        return;
    }

    // UI'ı sıfırla
    currentAnalysisUrl = url;
    results.innerHTML = '';
    results.classList.add('hidden');
    sourceDownload.classList.add('hidden');
    sourceData = null;

    // Loading UI'ı göster
    btnText.textContent = 'Analiz Ediliyor';
    btnLoader.classList.remove('hidden');
    analyzeBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');

    // Adımları sırayla göster
    let currentStep = 0;
    const updateSteps = () => {
        steps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.remove('active');
                step.classList.add('completed');
                step.querySelector('i').className = 'fas fa-check-circle';
            } else if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
                step.querySelector('i').className = 'fas fa-circle-notch fa-spin';
            } else {
                step.classList.remove('active', 'completed');
                step.querySelector('i').className = 'fas fa-circle';
            }
        });
    };

    try {
        // Analiz isteği
        currentStep = 0;
        updateSteps();
        const response = await fetch(`/analyze?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error('Analiz sırasında bir hata oluştu');
        }

        currentStep = 1;
        updateSteps();

        // Kaynak kodları çek
        const sourcesResponse = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
        if (!sourcesResponse.ok) {
            throw new Error('Kaynak kodlar çekilemedi');
        }
        sourceData = await sourcesResponse.json();

        currentStep = 2;
        updateSteps();

        // Sonuçları göster
        const html = await response.text();
        results.innerHTML = html;
        results.classList.remove('hidden');
        sourceDownload.classList.remove('hidden');

        currentStep = 3;
        updateSteps();

        // Tüm adımları tamamlandı olarak işaretle
        setTimeout(() => {
            steps.forEach(step => {
                step.classList.remove('active');
                step.classList.add('completed');
                step.querySelector('i').className = 'fas fa-check-circle';
            });
        }, 500);

    } catch (error) {
        console.error('Hata:', error);
        results.innerHTML = `
            <div class="error">
                <h2>❌ Hata Oluştu</h2>
                <p>${error.message}</p>
                <button onclick="startAnalysis()" class="retry-button">
                    <i class="fas fa-redo"></i>
                    Tekrar Dene
                </button>
            </div>
        `;
        results.classList.remove('hidden');
    } finally {
        // UI'ı resetle
        btnText.textContent = 'Analiz Et';
        btnLoader.classList.add('hidden');
        analyzeBtn.disabled = false;
        setTimeout(() => {
            loadingIndicator.classList.add('hidden');
        }, 1000);
    }
}

async function downloadSources() {
    if (!sourceData || !currentAnalysisUrl) {
        alert('Önce bir site analiz edin');
        return;
    }

    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.innerHTML;
    
    try {
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Hazırlanıyor...';
        downloadBtn.disabled = true;

        // ZIP dosyası oluştur
        const zip = new JSZip();

        // HTML dosyası
        if (sourceData.html) {
            zip.file('index.html', sourceData.html);
        }

        // CSS dosyaları
        if (sourceData.css && sourceData.css.files) {
            const cssFolder = zip.folder('css');
            sourceData.css.files.forEach((file, index) => {
                cssFolder.file(`style${index + 1}.css`, file.content);
            });
        }

        // JavaScript dosyaları
        if (sourceData.javascript && sourceData.javascript.files) {
            const jsFolder = zip.folder('js');
            sourceData.javascript.files.forEach((file, index) => {
                jsFolder.file(`script${index + 1}.js`, file.content);
            });
        }

        // ZIP dosyasını oluştur ve indir
        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${new URL(currentAnalysisUrl).hostname}-source.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error('İndirme hatası:', error);
        alert('Dosyalar indirilirken bir hata oluştu');
    } finally {
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
    }
}

// JSZip kütüphanesini yükle
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(script);

document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const results = document.getElementById('results');
    const error = document.getElementById('error');
    const backendResults = document.getElementById('backendResults');
    const frontendResults = document.getElementById('frontendResults');
    const securityResults = document.getElementById('securityResults');
    const serverResults = document.getElementById('serverResults');
    const seoResults = document.getElementById('seoResults');
    const performanceResults = document.getElementById('performanceResults');

    // Dil değiştirici
    const languageSelector = document.getElementById('languageSelector');
    languageSelector.addEventListener('change', (e) => {
        changeLanguage(e.target.value);
    });

    analyzeBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Lütfen bir URL girin');
            return;
        }

        try {
            new URL(url);
        } catch {
            showError('Geçersiz URL formatı');
            return;
        }

        // UI'ı sıfırla
        hideError();
        showLoading();
        clearResults();

        try {
            console.log('Analiz isteği gönderiliyor:', url);
            const response = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`);
            console.log('Sunucu yanıtı:', response);
            const data = await response.json();
            console.log('Analiz sonuçları:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Analiz sırasında bir hata oluştu');
            }

            displayResults(data);
        } catch (err) {
            console.error('Hata detayı:', err);
            showError(err.message);
        } finally {
            hideLoading();
        }
    });

    function changeLanguage(lang) {
        // Dil değişimi için gerekli metinleri güncelleyin
        // Örneğin, metinleri bir dil dosyasından alabilirsiniz
        if (lang === 'en') {
            // İngilizce metinler
        } else if (lang === 'tr') {
            // Türkçe metinler
        }
    }

    function showLoading() {
        loadingIndicator.classList.remove('hidden');
        results.classList.add('hidden');
    }

    function hideLoading() {
        loadingIndicator.classList.add('hidden');
    }

    function showError(message) {
        error.textContent = message;
        error.classList.remove('hidden');
    }

    function hideError() {
        error.textContent = '';
        error.classList.add('hidden');
    }

    function clearResults() {
        backendResults.innerHTML = '';
        frontendResults.innerHTML = '';
        securityResults.innerHTML = '';
        serverResults.innerHTML = '';
        seoResults.innerHTML = '';
        performanceResults.innerHTML = '';
    }

    function createTechItem(name, value, type = 'text') {
        const div = document.createElement('div');
        div.className = 'tech-item';

        if (type === 'array' && Array.isArray(value)) {
            div.innerHTML = `
                <h3>${name}</h3>
                <p>${value.length > 0 ? value.join(', ') : 'Tespit edilemedi'}</p>
            `;
        } else if (type === 'boolean') {
            div.innerHTML = `
                <h3>${name}</h3>
                <p>${value ? '✅ Evet' : '❌ Hayır'}</p>
            `;
        } else if (type === 'object' && value !== null && typeof value === 'object') {
            div.innerHTML = `
                <h3>${name}</h3>
                <p>${Object.entries(value).map(([k, v]) => `${k}: ${v}`).join('<br>')}</p>
            `;
        } else {
            div.innerHTML = `
                <h3>${name}</h3>
                <p>${value || 'Tespit edilemedi'}</p>
            `;
        }

        return div;
    }

    async function displayResults(data) {
        // Backend sonuçları
        backendResults.appendChild(createTechItem('Sunucu', data.backend.server));
        backendResults.appendChild(createTechItem('Powered By', data.backend.powered_by));
        backendResults.appendChild(createTechItem('Programlama Dili', data.backend.programming_language));
        backendResults.appendChild(createTechItem('Framework', data.backend.detected_frameworks, 'array'));
        backendResults.appendChild(createTechItem('CMS', data.backend.cms));
        backendResults.appendChild(createTechItem('Veritabanı', data.backend.database));
        backendResults.appendChild(createTechItem('Cache Sistemi', data.backend.cache_system));

        // Frontend sonuçları
        frontendResults.appendChild(createTechItem('JavaScript Frameworks', data.frontend.javascript_frameworks, 'array'));
        frontendResults.appendChild(createTechItem('CSS Frameworks', data.frontend.css_frameworks, 'array'));
        frontendResults.appendChild(createTechItem('UI Kütüphaneleri', data.frontend.ui_libraries, 'array'));
        frontendResults.appendChild(createTechItem('Build Tools', data.frontend.build_tools, 'array'));
        frontendResults.appendChild(createTechItem('State Management', data.frontend.state_management, 'array'));
        frontendResults.appendChild(createTechItem('Test Frameworks', data.frontend.testing_frameworks, 'array'));
        frontendResults.appendChild(createTechItem('Analytics Tools', data.frontend.analytics_tools, 'array'));
        frontendResults.appendChild(createTechItem('CDN Kütüphaneleri', data.frontend.cdn_libraries, 'array'));

        // Güvenlik sonuçları
        securityResults.appendChild(createTechItem('SSL Durumu', data.security.ssl.valid, 'boolean'));
        securityResults.appendChild(createTechItem('Güvenlik Başlıkları', data.security.headers, 'object'));
        securityResults.appendChild(createTechItem('CORS', data.security.security_features.cors_enabled, 'boolean'));
        securityResults.appendChild(createTechItem('XSS Koruması', data.security.security_features.xss_protection, 'boolean'));
        securityResults.appendChild(createTechItem('Clickjacking Koruması', data.security.security_features.clickjacking_protection, 'boolean'));
        securityResults.appendChild(createTechItem('HSTS', data.security.security_features.hsts_enabled, 'boolean'));

        // Sunucu bilgileri
        serverResults.appendChild(createTechItem('Sunucu Tipi', data.server.server_type));
        serverResults.appendChild(createTechItem('Hosting Sağlayıcı', data.server.hosting_provider));
        serverResults.appendChild(createTechItem('IP Adresleri', data.server.ip_addresses, 'array'));
        if (data.server.whois && !data.server.whois.error) {
            serverResults.appendChild(createTechItem('Domain Bilgileri', {
                'Kayıt Tarihi': data.server.whois.creationDate || 'Belirtilmemiş',
                'Son Güncelleme': data.server.whois.updatedDate || 'Belirtilmemiş',
                'Registrar': data.server.whois.registrar || 'Belirtilmemiş'
            }, 'object'));
        }

        // SEO sonuçları
        seoResults.appendChild(createTechItem('Başlık', data.seo.title));
        seoResults.appendChild(createTechItem('Meta Açıklama', data.seo.meta_description));
        seoResults.appendChild(createTechItem('Meta Anahtar Kelimeler', data.seo.meta_keywords));
        seoResults.appendChild(createTechItem('Canonical URL', data.seo.canonical_url));
        seoResults.appendChild(createTechItem('Robots.txt', data.seo.robots_txt, 'boolean'));
        seoResults.appendChild(createTechItem('Sitemap.xml', data.seo.sitemap_xml, 'boolean'));
        seoResults.appendChild(createTechItem('Open Graph', data.seo.open_graph, 'object'));
        seoResults.appendChild(createTechItem('Twitter Cards', data.seo.twitter_cards, 'object'));

        // Performans sonuçları
        performanceResults.appendChild(createTechItem('Yanıt Süresi', `${data.performance.response_time}ms`));
        performanceResults.appendChild(createTechItem('Sayfa Boyutu', `${(data.performance.page_size / 1024).toFixed(2)} KB`));
        performanceResults.appendChild(createTechItem('GZIP Sıkıştırma', data.performance.gzip_enabled, 'boolean'));
        performanceResults.appendChild(createTechItem('Cache Control', data.performance.cache_control));
        performanceResults.appendChild(createTechItem('Resource Hints', data.performance.resource_hints, 'object'));

    

        // Bağış kısmını göster
        displayDonationSection();

        results.classList.remove('hidden');
    }

    function displayDonationSection() {
        const donationSection = document.createElement('div');
        donationSection.id = 'donation';
        donationSection.className = 'donation-container';
        donationSection.innerHTML = `
            <div class="donation-card">
                <div class="donation-header">
                    <span class="donation-icon">☕</span>
                    <h4>Projeyi Destekleyin</h4>
                </div>
                <p>Bu projenin geliştirilmesine ve sürdürülmesine katkıda bulunmak ister misiniz?</p>
                <div class="donation-options">
                    <a href="https://buymeacoffee.com/zers" target="_blank" class="donation-button coffee-button">
                        <span>☕ Bir Kahve Ismarla</span>
                    </a>
                </div>
                <div class="donation-features">
                    <div class="feature">
                        <span class="feature-icon">🚀</span>
                        <span>Daha Hızlı Geliştirmeler</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🎯</span>
                        <span>Yeni Özellikler</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🛡️</span>
                        <span>Sürdürülebilir Bakım</span>
                    </div>
                </div>
            </div>
        `;
        
        results.appendChild(donationSection);
    }

    // Enter tuşu ile analiz
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeBtn.click();
        }
    });
}); 