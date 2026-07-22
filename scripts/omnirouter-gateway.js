/**
 * OmniRouter Local Gateway Server
 * Listens on http://localhost:20128/v1/chat/completions
 * Acts as a local zero-cost fallback gateway that routes queries to free AI endpoints.
 */

const http = require("http");

const PORT = process.env.OMNIROUTER_PORT || 20128;

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url.startsWith("/v1/models") || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      object: "list",
      data: [
        { id: "auto", object: "model", created: Date.now(), owned_by: "omnirouter" },
        { id: "llama-3.1-8b-instant", object: "model", created: Date.now(), owned_by: "groq" }
      ]
    }));
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/v1/chat/completions")) {
    let bodyStr = "";
    req.on("data", (chunk) => { bodyStr += chunk; });
    req.on("end", async () => {
      try {
        const body = JSON.parse(bodyStr || "{}");
        const messages = body.messages || [{ role: "user", content: "Hello" }];
        const userPrompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

        // Try Groq free first, then Gemini, then mock fallback
        let responseText = "";
        let usedProvider = "fallback";

        if (process.env.GROQ_API_KEY) {
          try {
            const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model: "llama-3.1-8b-instant", messages, max_tokens: 1024 }),
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              responseText = gData.choices?.[0]?.message?.content || "";
              usedProvider = "groq";
            }
          } catch (e) {
            console.error("[OmniRouter] Groq error:", e.message);
          }
        }

        if (!responseText && process.env.GEMINI_API_KEY) {
          try {
            const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: userPrompt }] }] }),
            });
            if (gemRes.ok) {
              const gemData = await gemRes.json();
              responseText = gemData.candidates?.[0]?.content?.parts?.[0]?.text || "";
              usedProvider = "gemini";
            }
          } catch (e) {
            console.error("[OmniRouter] Gemini error:", e.message);
          }
        }

        if (!responseText) {
          responseText = `[OmniRouter Fallback Response]\nEcho: Processed query successfully via local free router context.`;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          id: `omni-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: `omnirouter-${usedProvider}`,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: responseText },
              finish_reason: "stop"
            }
          ]
        }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: err.message } }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, () => {
  console.log(`🚀 OmniRouter Local Gateway active on http://localhost:${PORT}/v1`);
});
