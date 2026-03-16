require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// --- 1. เชื่อมต่อ Database ---
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected..."))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 2. สร้าง Schema ---
const UserSchema = new mongoose.Schema({
  chatId: { type: String, unique: true },
  username: String,
  dateJoined: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

// --- 3. ฟังก์ชันส่งข้อความหาทุกคน (Broadcast) ---
async function broadcast(text) {
  const users = await User.find();
  console.log(`กำลังส่งข่าวให้ผู้ใช้จำนวน ${users.length} คน...`);

  for (const user of users) {
      try {
          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              chat_id: user.chatId,
              text: text,
              parse_mode: 'Markdown' 
          });
      } catch (err) {
          console.error(`ส่งหา ${user.chatId} พลาด:`, err.message);
      }
  }
}

// --- 4. Routes ---

// รับข่าวจากบอท (ตัวส่ง)
app.post("/tv", async (req, res) => {
  const msg = req.body.message;
  if (msg) {
      await broadcast(msg);
      return res.json({ status: "success" });
  }
  res.status(400).json({ status: "no message" });
});

// รับการกด /start จากเพื่อน (Telegram Webhook)
app.post("/telegram-webhook", async (req, res) => {
  const { message } = req.body;
  
  if (message && message.text === "/start") {
      const chatId = message.chat.id.toString();
      const firstName = message.from.first_name || "User";

      try {
          // บันทึกลง DB (ถ้าซ้ำมันจะไม่สร้างใหม่เพราะเราตั้ง unique: true)
          await User.findOneAndUpdate(
              { chatId }, 
              { chatId, username: firstName }, 
              { upsert: true, new: true }
          );

          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              chat_id: chatId,
              text: `สวัสดีคุณ ${firstName}! 🔔 ระบบได้ลงทะเบียนคุณเรียบร้อยแล้ว คุณจะได้รับแจ้งเตือนข่าวกล่องแดงทุกวันเวลา 09:00 น.`
          });
      } catch (err) {
          console.error("DB Error:", err.message);
      }
  }
  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("Webhook API is Live!"));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));