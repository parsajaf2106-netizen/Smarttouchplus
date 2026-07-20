(function () {
  const ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

  /* Byte's face — a friendly little robot: antenna, rounded screen-head,
     dot eyes, a smile, and a small collar with a grille line underneath. */
  const ICON_BYTE_FACE =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="12" cy="2.1" r="1" fill="currentColor"/>' +
    '<line x1="12" y1="3" x2="12" y2="4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<rect x="4.5" y="4.6" width="15" height="10.4" rx="4" stroke="currentColor" stroke-width="1.7"/>' +
    '<circle cx="9" cy="9.4" r="1.15" fill="currentColor"/>' +
    '<circle cx="15" cy="9.4" r="1.15" fill="currentColor"/>' +
    '<path d="M9 12c1 1 2 1.4 3 1.4s2-.4 3-1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<line x1="12" y1="15" x2="12" y2="16.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<rect x="6.5" y="16.6" width="11" height="4.8" rx="2.4" stroke="currentColor" stroke-width="1.7"/>' +
    '<line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    "</svg>";

  const GREETING =
    "Hey, I'm Byte 👋 I can answer questions about Smart Touch +'s IT services, pricing approach, and support in Richmond Hill and the GTA. What can I help with?";
  const POPUP_TEXT = "Got a question about IT support? I can help — just ask!";

  const messages = [];
  let panelOpen = false;
  let sending = false;

  function buildWidget() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="chat-greeting" id="chatGreeting">
        <button class="chat-greeting-close" id="chatGreetingClose" aria-label="Dismiss">${ICON_CLOSE}</button>
        <div class="chat-greeting-avatar">${ICON_BYTE_FACE}</div>
        <p><strong>Hi, I'm Byte 👋</strong>${POPUP_TEXT}</p>
      </div>
      <button class="chat-launcher" id="chatLauncher" aria-label="Open chat with Byte">${ICON_BYTE_FACE}</button>
      <div class="chat-panel" id="chatPanel" role="dialog" aria-label="Chat with Byte">
        <div class="chat-header">
          <div class="avatar">${ICON_BYTE_FACE}</div>
          <div class="chat-header-text">
            <strong>Byte</strong>
            <span>Smart Touch + Assistant</span>
          </div>
          <button class="close-btn" id="chatClose" aria-label="Close chat">${ICON_CLOSE}</button>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <form class="chat-input-row" id="chatForm">
          <input type="text" id="chatInput" placeholder="Ask about our services..." autocomplete="off" />
          <button type="submit" class="chat-send-btn" id="chatSend" aria-label="Send message">${ICON_SEND}</button>
        </form>
      </div>
    `;
    document.body.appendChild(wrapper);
  }

  function appendMessage(role, text) {
    const list = document.getElementById("chatMessages");
    const bubble = document.createElement("div");
    bubble.className = "chat-msg " + (role === "user" ? "user" : "bot");
    bubble.textContent = text;
    list.appendChild(bubble);
    list.scrollTop = list.scrollHeight;
    return bubble;
  }

  function showTyping() {
    const list = document.getElementById("chatMessages");
    const bubble = document.createElement("div");
    bubble.className = "chat-msg bot typing";
    bubble.id = "chatTyping";
    bubble.innerHTML = "<span></span><span></span><span></span>";
    list.appendChild(bubble);
    list.scrollTop = list.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById("chatTyping");
    if (el) el.remove();
  }

  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    sending = true;

    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSend");

    appendMessage("user", text);
    messages.push({ role: "user", content: text });
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.classList.add("is-sending");
    showTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      hideTyping();

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        appendMessage(
          "bot",
          data.error ||
            "Byte isn't fully wired up yet on this deployment. Please use the contact form and a real person will get back to you."
        );
        return;
      }

      const data = await res.json();
      appendMessage("bot", data.reply);
      messages.push({ role: "assistant", content: data.reply });
    } catch (err) {
      hideTyping();
      appendMessage("bot", "Sorry, I'm having trouble connecting right now. Please try again or use the contact form.");
    } finally {
      sending = false;
      sendBtn.classList.remove("is-sending");
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  function dismissGreeting() {
    const greeting = document.getElementById("chatGreeting");
    greeting.classList.remove("is-visible");
    try {
      sessionStorage.setItem("byteGreetingDismissed", "1");
    } catch (err) {
      /* sessionStorage unavailable (e.g. private mode) — not critical */
    }
  }

  function openPanel() {
    const panel = document.getElementById("chatPanel");
    const launcher = document.getElementById("chatLauncher");
    panelOpen = true;
    panel.classList.add("is-open");
    launcher.classList.add("chat-open");
    dismissGreeting();
    document.getElementById("chatInput").focus();
    if (!messages.length) appendMessage("bot", GREETING);
  }

  function closePanel() {
    const panel = document.getElementById("chatPanel");
    const launcher = document.getElementById("chatLauncher");
    panelOpen = false;
    panel.classList.remove("is-open");
    launcher.classList.remove("chat-open");
  }

  function setupGreetingPopup() {
    let alreadyDismissed = false;
    try {
      alreadyDismissed = sessionStorage.getItem("byteGreetingDismissed") === "1";
    } catch (err) {
      alreadyDismissed = false;
    }
    if (alreadyDismissed) return;

    const greeting = document.getElementById("chatGreeting");
    const closeBtn = document.getElementById("chatGreetingClose");

    setTimeout(() => {
      if (panelOpen) return;
      greeting.classList.add("is-visible");
      setTimeout(() => {
        if (greeting.classList.contains("is-visible")) dismissGreeting();
      }, 12000);
    }, 1500);

    greeting.addEventListener("click", () => {
      openPanel();
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissGreeting();
    });
  }

  function setupEvents() {
    const launcher = document.getElementById("chatLauncher");
    const closeBtn = document.getElementById("chatClose");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");

    launcher.addEventListener("click", () => {
      if (panelOpen) closePanel();
      else openPanel();
    });

    closeBtn.addEventListener("click", closePanel);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage(input.value);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildWidget();
    setupEvents();
    setupGreetingPopup();
  });
})();
