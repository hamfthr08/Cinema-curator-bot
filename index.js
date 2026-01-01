import { Telegraf } from "telegraf";
import OpenAI from "openai";

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const userState = {};

bot.start((ctx) => {
  userState[ctx.from.id] = {};
  ctx.reply(
    "👋 Selamat datang di Cinema Curator.\n\nMari mulai kurasi personal Anda.\n\nPilih genre utama:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎭 Drama", callback_data: "genre_Drama" }],
          [{ text: "🧪 Sci-Fi", callback_data: "genre_Sci-Fi" }],
          [{ text: "👻 Horor", callback_data: "genre_Horor" }],
          [{ text: "🎌 Animasi", callback_data: "genre_Animasi" }],
        ],
      },
    }
  );
});

bot.on("callback_query", async (ctx) => {
  const id = ctx.from.id;
  const data = ctx.callbackQuery.data;

  if (data.startsWith("genre_")) {
    userState[id].genre = data.replace("genre_", "");
    return ctx.editMessageText(
      "Suasana apa yang sedang Anda cari?",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🌧 Sunyi & reflektif", callback_data: "mood_Sunyi" }],
            [{ text: "⚡ Intens", callback_data: "mood_Intens" }],
            [{ text: "😊 Ringan", callback_data: "mood_Ringan" }],
          ],
        },
      }
    );
  }

  if (data.startsWith("mood_")) {
    userState[id].mood = data.replace("mood_", "");
    await ctx.editMessageText("⏳ Menganalisis preferensi Anda...");

    const prompt = `
Kamu adalah kurator film profesional.

Preferensi user:
Genre: ${userState[id].genre}
Mood: ${userState[id].mood}

Tugas:
1. Rangkum preferensi user singkat
2. Rekomendasikan 3 film
3. Jelaskan alasan tiap film
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return ctx.reply(response.choices[0].message.content);
  }
});

bot.launch();
