// index.js
const fetch = require('node-fetch');

// --- GİZLİ AYARLAR (Bunları GitHub Secrets'a taşıyacağız) ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
// -------------------------------------------------------------

/**
 * Telegram'a mesaj gönderen fonksiyon
 * @param {string} message Gönderilecek metin
 */
async function sendTelegramMessage(message) {
    if (!TELEGRAM_BOT_TOKEN || !CHAT_ID) {
        console.error("Telegram ayarları (Token veya Chat ID) eksik.");
        return;
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            }),
        });

        const data = await response.json();
        if (!data.ok) {
            console.error("Telegram API Hatası:", data.description);
        } else {
            console.log("Mesaj başarıyla gönderildi.");
        }
    } catch (error) {
        console.error("Mesaj gönderilirken ağ hatası oluştu:", error.message);
    }
}

/**
 * BIST Veri Kontrol ve RSI Tespiti (Şimdilik Yer Tutucu)
 */
async function checkBISTStocks() {
    console.log(`[${new Date().toISOString()}] BIST taraması başlatılıyor...`);
    
    // *** BURASI GERÇEK BIST VERİSİ İLE DEĞİŞTİRİLECEK ***
    
    // Varsayalım ki tarama sonucu RSI 30'un altında olan bir hisse bulduk:
    const foundStocks = [
        { symbol: "GARAN", rsi: 28.5, price: 15.50 },
        { symbol: "THYAO", rsi: 29.9, price: 250.10 }
    ];
    
    if (foundStocks.length > 0) {
        let message = "<b>🚨 RSI UYARISI (RSI < 30) 🚨</b>\n\n";
        foundStocks.forEach(stock => {
            message += `<b>Hisse:</b> ${stock.symbol}\n`;
            message += `<b>RSI:</b> ${stock.rsi.toFixed(2)}\n`;
            message += `<b>Fiyat:</b> ${stock.price.toFixed(2)} TL\n\n`;
        });
        
        await sendTelegramMessage(message);
    } else {
        console.log("Belirtilen koşulu sağlayan hisse bulunamadı.");
        // İsteğe bağlı: Her taramada başarılı olduğunu bildirmek için:
        // await sendTelegramMessage("BIST taraması yapıldı. Alarm yok.");
    }
}

// Ana Çalıştırma Fonksiyonu
async function main() {
    // Bu bot, 5 dakikada bir çalışacak şekilde ayarlandığı için,
    // her çalıştığında sadece ana görevi yapar.
    await checkBISTStocks();
}

main();
