const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Byte, the friendly AI assistant on the Smart Touch + website. Smart Touch + is a Richmond Hill, Ontario-based managed IT services company serving businesses across the Greater Toronto Area. It has been operating for 8 years.

Facts you can share (do not invent details beyond these):
- Services: Remote & On-Site Support, Server Management, Network Monitoring, Wi-Fi & Firewall Management, Printer Support, Cybersecurity, Backup & Disaster Recovery, Microsoft 365 Administration, Vendor Management, and New Employee Setup. Smart Touch + does NOT offer cloud migration or Azure/AWS consulting — do not claim that service.
- Service area: Richmond Hill and the Greater Toronto Area (GTA), including Markham, Vaughan, Aurora, Newmarket, and Toronto.
- Business hours: Monday-Friday, 8:00 AM-6:00 PM EST. 24/7 emergency support is available for clients on higher-tier support plans.
- Typical response time target: under 30 minutes.
- Phone: (647) 614-4484.
- To get exact pricing, a proposal, or to book a consultation, direct the visitor to the Contact page (/contact.html) or have them call (647) 614-4484 — you do not know exact pricing, so never make up numbers.
- Do not claim to know the visitor's account details, ticket status, or any information you were not given in this conversation.

Tone: concise, warm, professional, and genuinely helpful — a few sentences per answer, not an essay. If a question is outside IT services or you're unsure, say so honestly and point them to the contact page or phone number instead of guessing.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "Byte isn't fully wired up yet on this deployment (missing GEMINI_API_KEY). Please use the contact form and a real person will get back to you.",
    });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  if (!incoming.length) {
    res.status(400).json({ error: "No messages provided." });
    return;
  }

  const contents = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 2000) }],
    }));

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const requestBody = JSON.stringify({
    system_instruction: { parts: { text: SYSTEM_PROMPT } },
    contents,
    generationConfig: { maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
  });

  // Google's free tier occasionally returns 503 "high demand" errors that
  // clear up within a second or two — retry a couple of times before giving up.
  const RETRY_DELAYS_MS = [500, 1200];
  let lastStatus = null;
  let lastErrText = "";

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (response.ok) {
        const data = await response.json();
        const reply = (data.candidates?.[0]?.content?.parts || [])
          .map((part) => part.text || "")
          .join("\n")
          .trim();

        res.status(200).json({ reply: reply || "Sorry, I didn't catch that — could you rephrase?" });
        return;
      }

      lastStatus = response.status;
      lastErrText = await response.text().catch(() => "");

      const isRetryable = response.status === 503 || response.status === 429;
      if (!isRetryable || attempt === RETRY_DELAYS_MS.length) break;
      await sleep(RETRY_DELAYS_MS[attempt]);
    } catch (err) {
      lastStatus = "network_error";
      lastErrText = String(err);
      if (attempt === RETRY_DELAYS_MS.length) break;
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  console.error("Gemini API error:", lastStatus, lastErrText);
  res.status(502).json({
    error:
      lastStatus === 503
        ? "Byte's AI provider is experiencing high demand right now. Please try again in a minute, or use the contact form."
        : "Byte is temporarily unavailable. Please try again shortly or use the contact form.",
  });
};
