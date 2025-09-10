const fetch = require("node-fetch");

const sendTelegramMessage = async (message) => {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_TOKEN || !CHAT_ID) {
        console.log("⚠️ Telegram config missing!");
        return;
    }

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
            }),
        });
    } catch (err) {
        console.log("⚠️ Failed to send Telegram message:", err.message);
    }
};

module.exports = {
    sendTelegramMessage,
};
