const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns');
const { promisify } = require('util');
const https = require('https');
const whois = require('whois-json');
const sslChecker = require('ssl-checker');
const chalk = require('chalk'); // Renkli terminal çıktısı için

const resolveDns = promisify(dns.resolve);

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    switch(type) {
        case 'info':
            console.log(chalk.blue(`[${timestamp}] ℹ️ ${message}`));
            break;
        case 'success':
            console.log(chalk.green(`[${timestamp}] ✅ ${message}`));
            break;
        case 'warning':
            console.log(chalk.yellow(`[${timestamp}] ⚠️ ${message}`));
            break;
        case 'error':
            console.log(chalk.red(`[${timestamp}] ❌ ${message}`));
            break;
        case 'start':
            console.log(chalk.magenta(`[${timestamp}] 🚀 ${message}`));
            break;
        case 'end':
            console.log(chalk.cyan(`[${timestamp}] 🏁 ${message}`));
            break;
    }
}

async function analyzeWebsite(url) {
    try {
        log(`Analiz başlatılıyor: ${url}`, 'start');
        log('HTTP isteği gönderiliyor...', 'info');
        
        const startTime = Date.now();
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: false,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        const responseTime = Date.now() - startTime;

        log(`Sayfa yanıtı alındı (${responseTime}ms)`, 'success');
        log(`HTTP Durum Kodu: ${response.status}`, 'info');

        const $ = cheerio.load(response.data);
        const headers = response.headers;
        const htmlContent = response.data;
        const scripts = [];
        const styles = [];

        log('Script ve stil dosyaları toplanıyor...', 'info');
        $('script').each((_, element) => {
            const src = $(element).attr('src');
            if (src) log(`Script bulundu: ${src}`, 'info');
            scripts.push({ src, content: $(element).html() });
        });

        $('link[rel="stylesheet"]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) log(`Stylesheet bulundu: ${href}`, 'info');
            styles.push(href);
        });

        log('Paralel analizler başlatılıyor...', 'info');
        const [dnsInfo, sslInfo, whoisInfo] = await Promise.all([
            analyzeDNS(url).then(info => {
                log('DNS analizi tamamlandı', 'success');
                return info;
            }),
            analyzeSSL(url).then(info => {
                log('SSL analizi tamamlandı', 'success');
                return info;
            }),
            analyzeWhois(url).then(info => {
                log('WHOIS analizi tamamlandı', 'success');
                return info;
            })
        ]);

        log('Backend teknolojileri analiz ediliyor...', 'info');
        const backend = await analyzeBackend(headers, $, url, htmlContent);
        log(`Backend analizi tamamlandı. Tespit edilen teknolojiler: ${backend.detected_frameworks.join(', ') || 'Yok'}`, 'success');

        log('Frontend teknolojileri analiz ediliyor...', 'info');
        const frontend = await analyzeFrontend($, scripts, styles, htmlContent);
        log(`Frontend analizi tamamlandı. JS Frameworks: ${frontend.javascript_frameworks.join(', ') || 'Yok'}`, 'success');

        log('Güvenlik analizi yapılıyor...', 'info');
        const security = await analyzeSecurity(headers, url, sslInfo);
        log('Güvenlik analizi tamamlandı', 'success');

        log('Sunucu bilgileri analiz ediliyor...', 'info');
        const server = await analyzeServerInfo(headers, dnsInfo, whoisInfo);
        log('Sunucu analizi tamamlandı', 'success');

        log('SEO analizi yapılıyor...', 'info');
        const seo = await analyzeSEO($, url, headers);
        log('SEO analizi tamamlandı', 'success');

        log('Performans metrikleri hesaplanıyor...', 'info');
        const performance = await analyzePerformance(response, htmlContent);
        log('Performans analizi tamamlandı', 'success');

        const result = {
            url,
            status: response.status,
            backend,
            frontend,
            security,
            server,
            performance,
            seo
        };

        log(`Analiz tamamlandı! Toplam süre: ${Date.now() - startTime}ms`, 'end');
        return result;

    } catch (error) {
        log(`Analiz hatası: ${error.message}`, 'error');
        throw new Error(`Site analizi başarısız: ${error.message}`);
    }
}

async function analyzeBackend(headers, $, url, htmlContent) {
    const backend = {
        server: headers['server'] || 'Belirlenemedi',
        powered_by: headers['x-powered-by'] || 'Belirlenemedi',
        detected_frameworks: [],
        programming_language: 'Belirlenemedi',
        cms: 'Belirlenemedi',
        database: 'Belirlenemedi',
        cache_system: 'Belirlenemedi'
    };

    // Programlama dili tespiti
    if (headers['x-powered-by']) {
        if (headers['x-powered-by'].includes('PHP')) backend.programming_language = 'PHP';
        if (headers['x-powered-by'].includes('ASP.NET')) backend.programming_language = 'C#';
        if (headers['x-powered-by'].includes('Node.js')) backend.programming_language = 'JavaScript';
    }

    // Framework tespiti
    const frameworkPatterns = {
        'Laravel': ['/vendor/laravel', 'laravel', 'Laravel'],
        'Django': ['csrftoken', 'django', '__admin_media_prefix__'],
        'Ruby on Rails': ['rails', 'ruby-on-rails', 'rails-env'],
        'Express': ['express', 'express-session'],
        'Spring': ['jsessionid', 'spring', 'spring-security'],
        'ASP.NET': ['.aspx', 'asp.net', '__VIEWSTATE'],
        'CodeIgniter': ['ci_session', 'codeigniter'],
        'Symfony': ['symfony', '_symfony'],
        'Yii': ['yii', 'yiiframework'],
        'Flask': ['flask', 'flask-session'],
        'FastAPI': ['fastapi'],
        'NestJS': ['nestjs']
    };

    // CMS tespiti
    const cmsPatterns = {
        'WordPress': ['wp-content', 'wp-includes', 'wordpress'],
        'Drupal': ['drupal', 'sites/all', 'drupal.js'],
        'Joomla': ['joomla', 'com_content', 'mod_'],
        'Magento': ['magento', 'mage/', 'Mage.'],
        'Shopify': ['shopify', 'Shopify.', '.myshopify.com'],
        'WooCommerce': ['woocommerce', 'wc-'],
        'PrestaShop': ['prestashop', 'presta-'],
        'OpenCart': ['opencart', 'route=common'],
        'MODX': ['modx', 'assets/components'],
        'Ghost': ['ghost', 'ghost-sdk']
    };

    // Database tespiti
    const dbPatterns = {
        'MySQL': ['mysql', 'mysqli'],
        'PostgreSQL': ['pgsql', 'postgresql'],
        'MongoDB': ['mongodb', 'mongoose'],
        'SQLite': ['sqlite'],
        'Redis': ['redis'],
        'Oracle': ['oracle', 'oci8'],
        'Microsoft SQL': ['mssql', 'sqlsrv']
    };

    // Cache sistem tespiti
    if (headers['x-cache']) backend.cache_system = 'Varnish';
    if (headers['x-drupal-cache']) backend.cache_system = 'Drupal Cache';
    if (headers['cf-cache-status']) backend.cache_system = 'Cloudflare';
    if (headers['x-magento-cache']) backend.cache_system = 'Magento Cache';

    // Meta etiketleri ve generator analizi
    const generator = $('meta[name="generator"]').attr('content');
    if (generator) {
        Object.entries(cmsPatterns).forEach(([cms, patterns]) => {
            if (patterns.some(pattern => generator.toLowerCase().includes(pattern))) {
                backend.cms = cms;
            }
        });
    }

    // HTML içeriği analizi
    const htmlString = $.html();
    
    // Framework tespiti
    Object.entries(frameworkPatterns).forEach(([framework, patterns]) => {
        if (patterns.some(pattern => 
            htmlString.toLowerCase().includes(pattern.toLowerCase()) ||
            Object.keys(headers).some(header => 
                header.toLowerCase().includes(pattern.toLowerCase())
            )
        )) {
            backend.detected_frameworks.push(framework);
        }
    });

    // CMS tespiti (eğer henüz tespit edilmediyse)
    if (backend.cms === 'Belirlenemedi') {
        Object.entries(cmsPatterns).forEach(([cms, patterns]) => {
            if (patterns.some(pattern => htmlString.toLowerCase().includes(pattern))) {
                backend.cms = cms;
            }
        });
    }

    // Database tespiti
    Object.entries(dbPatterns).forEach(([db, patterns]) => {
        if (patterns.some(pattern => htmlString.toLowerCase().includes(pattern))) {
            backend.database = db;
        }
    });

    return backend;
}

async function analyzeFrontend($, scripts, styles, htmlContent) {
    const frontend = {
        javascript_frameworks: [],
        css_frameworks: [],
        ui_libraries: [],
        build_tools: [],
        cdn_libraries: [],
        state_management: [],
        testing_frameworks: [],
        analytics_tools: []
    };

    // JavaScript framework tespiti
    const jsPatterns = {
        'React': ['react', 'reactjs', 'react-dom', 'jsx'],
        'Vue.js': ['vue', 'vuejs', 'vue-router', 'vuex'],
        'Angular': ['angular', 'ng-', '@angular'],
        'Svelte': ['svelte'],
        'jQuery': ['jquery', 'jquery.min.js'],
        'Next.js': ['next', '__next', '_next'],
        'Nuxt.js': ['nuxt', '__nuxt', '_nuxt'],
        'Alpine.js': ['alpine', 'x-data'],
        'Ember.js': ['ember'],
        'Backbone.js': ['backbone'],
        'Preact': ['preact'],
        'Lit': ['lit-element', 'lit-html']
    };

    // CSS framework tespiti
    const cssPatterns = {
        'Bootstrap': ['bootstrap', 'navbar-', 'btn-'],
        'Tailwind CSS': ['tailwind', 'tw-'],
        'Material UI': ['mui', 'material-ui'],
        'Bulma': ['bulma', 'is-'],
        'Foundation': ['foundation'],
        'Semantic UI': ['semantic-ui', 'ui segment'],
        'Chakra UI': ['chakra'],
        'Ant Design': ['ant-design', 'antd'],
        'Styled Components': ['styled-components'],
        'SASS/SCSS': ['.scss', '.sass'],
        'Less': ['.less']
    };

    // UI kütüphane tespiti
    const uiPatterns = {
        'Material Design': ['material-design', 'md-'],
        'Font Awesome': ['font-awesome', 'fa-'],
        'Feather Icons': ['feather-icons'],
        'Material Icons': ['material-icons'],
        'Chart.js': ['chart.js'],
        'D3.js': ['d3.js', 'd3.min.js'],
        'Three.js': ['three.js'],
        'Lodash': ['lodash'],
        'Moment.js': ['moment.js'],
        'Axios': ['axios']
    };

    // Build tool tespiti
    const buildPatterns = {
        'Webpack': ['webpack', '__webpack'],
        'Babel': ['babel'],
        'Parcel': ['parcel'],
        'Rollup': ['rollup'],
        'Vite': ['vite'],
        'Gulp': ['gulp'],
        'Grunt': ['grunt']
    };

    // State management tespiti
    const statePatterns = {
        'Redux': ['redux', 'react-redux'],
        'Vuex': ['vuex'],
        'MobX': ['mobx'],
        'Recoil': ['recoil'],
        'XState': ['xstate'],
        'Pinia': ['pinia']
    };

    // Test framework tespiti
    const testPatterns = {
        'Jest': ['jest'],
        'Mocha': ['mocha'],
        'Cypress': ['cypress'],
        'Playwright': ['playwright'],
        'Testing Library': ['testing-library'],
        'Selenium': ['selenium']
    };

    // Analytics tool tespiti
    const analyticsPatterns = {
        'Google Analytics': ['ga', 'gtag', 'analytics'],
        'Mixpanel': ['mixpanel'],
        'Segment': ['segment'],
        'Hotjar': ['hotjar'],
        'Amplitude': ['amplitude']
    };

    // CDN tespiti
    const cdnPatterns = {
        'Cloudflare': ['cloudflare'],
        'jsDelivr': ['jsdelivr'],
        'unpkg': ['unpkg'],
        'Google CDN': ['googleapis'],
        'Microsoft CDN': ['ajax.aspnetcdn.com'],
        'CDNJS': ['cdnjs.cloudflare.com']
    };

    // Script analizi
    scripts.forEach(({ src, content }) => {
        if (src) {
            // Framework tespiti
            Object.entries(jsPatterns).forEach(([framework, patterns]) => {
                if (patterns.some(pattern => src.toLowerCase().includes(pattern))) {
                    frontend.javascript_frameworks.push(framework);
                }
            });

            // CDN tespiti
            Object.entries(cdnPatterns).forEach(([cdn, patterns]) => {
                if (patterns.some(pattern => src.toLowerCase().includes(pattern))) {
                    frontend.cdn_libraries.push(cdn);
                }
            });
        }

        if (content) {
            // State management tespiti
            Object.entries(statePatterns).forEach(([tool, patterns]) => {
                if (patterns.some(pattern => content.toLowerCase().includes(pattern))) {
                    frontend.state_management.push(tool);
                }
            });

            // Build tool tespiti
            Object.entries(buildPatterns).forEach(([tool, patterns]) => {
                if (patterns.some(pattern => content.toLowerCase().includes(pattern))) {
                    frontend.build_tools.push(tool);
                }
            });
        }
    });

    // Stil analizi
    styles.forEach(href => {
        if (href) {
            Object.entries(cssPatterns).forEach(([framework, patterns]) => {
                if (patterns.some(pattern => href.toLowerCase().includes(pattern))) {
                    frontend.css_frameworks.push(framework);
                }
            });
        }
    });

    // HTML içeriği analizi
    const htmlString = $.html();
    
    // UI kütüphane tespiti
    Object.entries(uiPatterns).forEach(([lib, patterns]) => {
        if (patterns.some(pattern => htmlString.toLowerCase().includes(pattern))) {
            frontend.ui_libraries.push(lib);
        }
    });

    // Analytics tool tespiti
    Object.entries(analyticsPatterns).forEach(([tool, patterns]) => {
        if (patterns.some(pattern => htmlString.toLowerCase().includes(pattern))) {
            frontend.analytics_tools.push(tool);
        }
    });

    // Test framework tespiti
    Object.entries(testPatterns).forEach(([framework, patterns]) => {
        if (patterns.some(pattern => htmlString.toLowerCase().includes(pattern))) {
            frontend.testing_frameworks.push(framework);
        }
    });

    // Tekrarlanan değerleri temizle
    Object.keys(frontend).forEach(key => {
        frontend[key] = [...new Set(frontend[key])];
    });

    return frontend;
}

async function analyzeSecurity(headers, url, sslInfo) {
    return {
        headers: {
            'Content-Security-Policy': headers['content-security-policy'] || 'Yok',
            'X-Frame-Options': headers['x-frame-options'] || 'Yok',
            'X-XSS-Protection': headers['x-xss-protection'] || 'Yok',
            'X-Content-Type-Options': headers['x-content-type-options'] || 'Yok',
            'Strict-Transport-Security': headers['strict-transport-security'] || 'Yok',
            'Referrer-Policy': headers['referrer-policy'] || 'Yok'
        },
        ssl: sslInfo,
        security_features: {
            cors_enabled: !!headers['access-control-allow-origin'],
            csrf_protection: false, // Site içeriğine göre tespit edilecek
            xss_protection: headers['x-xss-protection'] !== '0',
            clickjacking_protection: !!headers['x-frame-options'],
            hsts_enabled: !!headers['strict-transport-security']
        }
    };
}

async function analyzeServerInfo(headers, dnsInfo, whoisInfo) {
    return {
        server_type: headers['server'] || 'Belirlenemedi',
        hosting_provider: await detectHostingProvider(dnsInfo),
        ip_addresses: dnsInfo.addresses || [],
        dns_records: dnsInfo.records || {},
        whois: whoisInfo,
        headers: headers
    };
}

async function analyzePerformance(response, htmlContent) {
    return {
        response_time: response.timing || 0,
        page_size: Buffer.byteLength(htmlContent, 'utf8'),
        gzip_enabled: (response.headers['content-encoding'] || '').includes('gzip'),
        cache_control: response.headers['cache-control'] || 'Yok',
        resource_hints: {
            preload: true, // Site içeriğine göre tespit edilecek
            prefetch: true,
            preconnect: true
        }
    };
}

async function analyzeSEO($, url, headers) {
    const seo = {
        title: $('title').text() || 'Yok',
        meta_description: $('meta[name="description"]').attr('content') || 'Yok',
        meta_keywords: $('meta[name="keywords"]').attr('content') || 'Yok',
        canonical_url: $('link[rel="canonical"]').attr('href') || url,
        robots_txt: await checkRobotsTxt(url),
        sitemap_xml: await checkSitemapXml(url),
        structured_data: [],
        open_graph: {},
        twitter_cards: {}
    };

    // Open Graph etiketleri
    $('meta[property^="og:"]').each((_, element) => {
        const property = $(element).attr('property').replace('og:', '');
        const content = $(element).attr('content');
        seo.open_graph[property] = content;
    });

    // Twitter Card etiketleri
    $('meta[name^="twitter:"]').each((_, element) => {
        const name = $(element).attr('name').replace('twitter:', '');
        const content = $(element).attr('content');
        seo.twitter_cards[name] = content;
    });

    return seo;
}

async function analyzeDNS(url) {
    try {
        const hostname = new URL(url).hostname;
        log(`DNS sorguları başlatılıyor: ${hostname}`, 'info');
        
        const [addresses, records] = await Promise.all([
            resolveDns(hostname, 'A').then(result => {
                log(`IP adresleri bulundu: ${result.join(', ')}`, 'success');
                return result;
            }),
            Promise.all([
                resolveDns(hostname, 'MX').catch(() => {
                    log('MX kaydı bulunamadı', 'warning');
                    return [];
                }),
                resolveDns(hostname, 'TXT').catch(() => {
                    log('TXT kaydı bulunamadı', 'warning');
                    return [];
                }),
                resolveDns(hostname, 'NS').catch(() => {
                    log('NS kaydı bulunamadı', 'warning');
                    return [];
                })
            ])
        ]);

        return {
            addresses,
            records: {
                mx: records[0],
                txt: records[1],
                ns: records[2]
            }
        };
    } catch (error) {
        log(`DNS analizi hatası: ${error.message}`, 'error');
        return { addresses: [], records: {} };
    }
}

async function analyzeSSL(url) {
    try {
        const hostname = new URL(url).hostname;
        log(`SSL sertifikası kontrol ediliyor: ${hostname}`, 'info');
        const sslInfo = await sslChecker(hostname);
        log(`SSL sertifikası ${sslInfo.valid ? 'geçerli' : 'geçersiz'}`, sslInfo.valid ? 'success' : 'warning');
        return sslInfo;
    } catch (error) {
        log(`SSL analizi hatası: ${error.message}`, 'error');
        return { valid: false, error: error.message };
    }
}

async function analyzeWhois(url) {
    try {
        const hostname = new URL(url).hostname;
        log(`WHOIS sorgusu yapılıyor: ${hostname}`, 'info');
        const whoisData = await whois(hostname);
        log('WHOIS bilgileri alındı', 'success');
        return whoisData;
    } catch (error) {
        log(`WHOIS sorgusu hatası: ${error.message}`, 'error');
        return { error: error.message };
    }
}

async function detectHostingProvider(dnsInfo) {
    log('Hosting sağlayıcı tespit ediliyor...', 'info');
    const hostingPatterns = {
        'Amazon AWS': ['amazonaws.com', 'aws.amazon.com'],
        'Google Cloud': ['googleusercontent.com', 'cloud.google.com'],
        'Microsoft Azure': ['azure.com', 'azurewebsites.net'],
        'DigitalOcean': ['digitalocean.com'],
        'Heroku': ['herokuapp.com'],
        'Cloudflare': ['cloudflare.com'],
        'GoDaddy': ['godaddy.com'],
        'Vercel': ['vercel.app'],
        'Netlify': ['netlify.app']
    };

    const addresses = dnsInfo.addresses || [];
    const records = dnsInfo.records || {};

    for (const [provider, patterns] of Object.entries(hostingPatterns)) {
        const allRecords = [
            ...addresses,
            ...(records.ns || []),
            ...(records.txt || [])
        ].join(' ').toLowerCase();

        if (patterns.some(pattern => allRecords.includes(pattern.toLowerCase()))) {
            log(`Hosting sağlayıcı tespit edildi: ${provider}`, 'success');
            return provider;
        }
    }

    log('Hosting sağlayıcı tespit edilemedi', 'warning');
    return 'Belirlenemedi';
}

async function checkRobotsTxt(url) {
    try {
        const robotsUrl = new URL('/robots.txt', url).href;
        log(`robots.txt kontrol ediliyor: ${robotsUrl}`, 'info');
        const response = await axios.get(robotsUrl);
        const exists = response.status === 200;
        log(`robots.txt ${exists ? 'bulundu' : 'bulunamadı'}`, exists ? 'success' : 'warning');
        return exists;
    } catch {
        log('robots.txt bulunamadı', 'warning');
        return false;
    }
}

async function checkSitemapXml(url) {
    try {
        const sitemapUrl = new URL('/sitemap.xml', url).href;
        log(`sitemap.xml kontrol ediliyor: ${sitemapUrl}`, 'info');
        const response = await axios.get(sitemapUrl);
        const exists = response.status === 200;
        log(`sitemap.xml ${exists ? 'bulundu' : 'bulunamadı'}`, exists ? 'success' : 'warning');
        return exists;
    } catch {
        log('sitemap.xml bulunamadı', 'warning');
        return false;
    }
}

module.exports = {
    analyzeWebsite
};