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
            const response = await fetch(`/analyze?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analiz sırasında bir hata oluştu');
            }

            displayResults(data);
        } catch (err) {
            showError(err.message);
        } finally {
            hideLoading();
        }
    });

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

    function displayResults(data) {
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

        results.classList.remove('hidden');
    }

    // Enter tuşu ile analiz
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeBtn.click();
        }
    });
}); 