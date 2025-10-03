// server.js — simple proxy to AI for CodeSmith
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "200kb" }));

// rate limit - protect endpoint
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // adjust as needed
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; // ضع النموذج المناسب

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set in .env");
  process.exit(1);
}

function buildPrompt({language, description, projectName, author, filename}) {
  // قالب واضح ودقيق يساعد النموذج على انتاج كود نظيف
  return `
You are a professional code generator assistant.
Generate a ${language} file named "${filename || "file"}" for project "${projectName || "MyProject"}".
Author: ${author || "Anonymous"}.
Requirements: ${description || "No extra requirements"}.

Output rules:
- Provide only the raw code for the file (no surrounding backticks or explanations).
- Make sure the result is syntactically correct and runnable where applicable.
- If multiple files are needed, return a comment header indicating file name like: // FILE: filename.ext
- Keep the code concise and include minimal comments.
`;
}

app.post("/api/generate", async (req, res) => {
  try {
    const { language, description, projectName, author, filename, max_tokens = 1200 } = req.body || {};

    // Basic input checks
    if (!language) return res.status(400).json({ error: "language is required" });
    if (!description || description.length < 3) return res.status(400).json({ error: "provide a short description" });
    if (description.length > 2000) return res.status(400).json({ error: "description too long" });

    const prompt = buildPrompt({ language, description, projectName, author, filename });

    // Call OpenAI Chat/Responses API (adjust endpoint/model as needed)
    // Here we use Chat Completions v1 as an example — adapt if you use another provider endpoint.
    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs code only." },
        { role: "user", content: prompt }
      ],
      max_tokens,
      temperature: 0.2,
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!openaiRes.ok) {
      const txt = await openaiRes.text();
      console.error("OpenAI error:", txt);
      return res.status(502).json({ error: "AI provider error", detail: txt });
    }

    const json = await openaiRes.json();
    const output = (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || "";

    // Postprocess: remove surrounding markdown fences if any
    const cleaned = output.replace(/^```(\w+)?\n/, "").replace(/\n```$/, "");

    // Log lightweight
    console.log(`[AI] Generated ${language} for ${projectName || 'proj'} (${filename || 'file'})`);

    res.json({ code: cleaned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", detail: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`CodeSmith AI backend listening on ${port}`));
