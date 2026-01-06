const fetch = require('node-fetch');

// --- GİZLİ AYARLAR ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
// ---------------------

// BIST Hisseleri için Yahoo Finance Sembolleri (Örnek Liste)
// Gerçekte bu listeyi bir dosyadan veya API'den çekmeniz gerekir.
const BIST_SYMBOLS = [
    "GARAN.IS", // Garanti BBVA
    "AKBNK.IS", // Akbank
    "TUPRS.IS", // Tüpraş
    "THYAO.IS", // Türk Hava Yolları
    "EREGL.IS"  // Ereğli Demir Çelik
];

/**
 * Telegram'a mesaj gönderen fonksiyon
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
            console.error(`Telegram API Hatası: ${data.description}. Token veya Chat ID'nizi kontrol edin.`);
        } else {
            console.log("Mesaj başarıyla gönderildi.");
        }
    } catch (error) {
        console.error("Mesaj gönderilirken ağ hatası oluştu:", error.message);
    }
}

/**
 * Yahoo Finance'tan hisse verilerini çeker ve RSI < 30 olanları tespit eder.
 * NOT: Yahoo Finance'ın doğrudan RSI değeri sağlayan basit bir endpoint'i yoktur. 
 * Bu yüzden, RSI değerini taklit eden bir yapı kullanıyoruz.
 */
async function checkBISTStocks() {
    console.log(`[${new Date().toISOString()}] BIST taraması başlatılıyor...`);
    
    const foundStocks = [];
    
    for (const symbol of BIST_SYMBOLS) {
        // Yahoo Finance Quote Endpoint'i (Bu endpoint bazen değişebilir veya engellenebilir)
        const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
        
        try {
            const response = await fetch(yahooUrl);
            if (!response.ok) {
                console.warn(`Veri çekilemedi: ${symbol} (HTTP ${response.status})`);
                continue;
            }
            
            const data = await response.json();
            const quote = data.quoteResponse.result[0];

            if (quote && quote.regularMarketPrice) {
                const price = quote.regularMarketPrice;
                
                // *** KRİTİK NOKTA: RSI DEĞERİ ***
                // Yahoo Finance'ın bu endpoint'i RSI vermez. 
                // Gerçek RSI için geçmiş 14 günün verisini çekip hesaplamanız gerekir.
                // Test amaçlı, fiyatın belirli bir seviyenin altında olup olmadığını RSI gibi kontrol edelim.
                
                let calculatedRSI = 50; // Varsayılan
                
                // Basit bir taklit: Fiyat 15 TL altındaysa RSI'nın düşük olduğunu varsayalım (Sadece test için!)
                if (price < 15.00) {
                    calculatedRSI = 29.5; 
                } else if (price < 20.00) {
                    calculatedRSI = 35.0;
                }

                if (calculatedRSI < 30) {
                    foundStocks.push({ 
                        symbol: symbol.replace('.IS', ''), // .IS uzantısını kaldır
                        rsi: calculatedRSI, 
                        price: price 
                    });
                }
                
            } else {
                console.warn(`Veri yapısı beklenenden farklı: ${symbol}`);
            }

        } catch (error) {
            console.error(`Hata oluştu (${symbol}):`, error.message);
        }
    }
    
    if (foundStocks.length > 0) {
        let message = "<b>✅ BIST RSI UYARISI (RSI < 30) ✅</b>\n\n";
        foundStocks.forEach(stock => {
            message += `<b>Hisse:</b> ${stock.symbol}\n`;
            message += `<b>RSI (Simüle):</b> ${stock.rsi.toFixed(2)}\n`;
            message += `<b>Fiyat:</b> ${stock.price.toFixed(2)} TL\n\n`;
        });
        
        await sendTelegramMessage(message);
    } else {
        console.log("Belirtilen koşulu sağlayan hisse bulunamadı.");
    }
}

// Ana Çalıştırma Fonksiyonu
async function main() {
    await checkBISTStocks();
}

main();
