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

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: { text: SYSTEM_PROMPT } },
        contents,
        generationConfig: { maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Gemini API error:", response.status, errText);
      res.status(502).json({ error: "Byte is temporarily unavailable. Please try again shortly or use the contact form." });
      return;
    }

    const data = await response.json();
    const reply = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("\n")
      .trim();

    res.status(200).json({ reply: reply || "Sorry, I didn't catch that — could you rephrase?" });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(502).json({ error: "Byte is temporarily unavailable. Please try again shortly or use the contact form." });
  }
};
