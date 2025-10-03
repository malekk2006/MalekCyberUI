import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "200kb" }));

// حماية: limit requests
app.use(rateLimit({ windowMs: 60 * 1000, max: 20 }));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function buildPrompt({ language, description, projectName, author, filename }) {
  return `
أنت مساعد مبرمج محترف.
ولّد ملف ${language} باسم "${filename || "file"}" للمشروع "${projectName || "MyProject"}".
المؤلف: ${author || "Anonymous"}.
المتطلبات: ${description || "بدون متطلبات إضافية"}.

قوانين:
- أعطيني الكود فقط، بدون شروحات أو Markdown.
- الكود يجب أن يكون صحيح وبسيط.
`;
}

app.post("/api/generate", async (req, res) => {
  try {
    const { language, description, projectName, author, filename } = req.body;

    if (!language || !description) {
      return res.status(400).json({ error: "language & description required" });
    }

    const prompt = buildPrompt({ language, description, projectName, author, filename });

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs only code." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.2
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    const code = data?.choices?.[0]?.message?.content || "";

    res.json({ code: code.replace(/^```.*\n?/, "").replace(/```$/, "") });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Backend running on http://localhost:${port}`));
