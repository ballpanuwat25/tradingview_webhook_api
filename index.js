require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;

async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text
    })
  });
}

app.post("/tv", async (req, res) => {
  const msg = req.body.message || "TradingView Alert";
  await sendTelegram(msg);
  res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`Webhook running on ${PORT}`));