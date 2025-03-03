const express = require('express');
const cors = require('cors');
const path = require('path');
const { analyzeWebsite } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/analyze', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                error: 'URL parametresi gereklidir'
            });
        }

        // URL formatını kontrol et
        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({
                error: 'Geçersiz URL formatı'
            });
        }

        const analysis = await analyzeWebsite(url);
        res.json(analysis);

    } catch (error) {
        console.error('Analiz hatası:', error);
        res.status(500).json({
            error: 'Site analizi sırasında bir hata oluştu',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
}); 