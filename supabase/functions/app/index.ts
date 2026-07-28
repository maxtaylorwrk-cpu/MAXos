import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<title>Max OS</title>
<style>
  :root {
    --bg: #F7F7F5;
    --card: #FFFFFF;
    --text: #2B2E33;
    --muted: #8A8F98;
    --accent: #5B7FA6;
    --accent-soft: #E8EEF4;
    --border: #ECECE9;
    --danger: #C05B4D;
  }
  * { box-sizing: border-box; }
  html, body { min-height: 100%; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }
  button, input, textarea { font: inherit; }
  button { cursor: pointer; }
  #root {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 74px;
  }
  .topbar {
    padding: 20px 20px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .topbar-title { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
  .text-button {
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    padding: 6px 0;
  }
  .content { padding: 8px 20px 24px; flex: 1; }
  .card {
    background: var(--card);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid var(--border);
  }
  .interactive { cursor: pointer; }
  .interactive:active { opacity: 0.84; }
  .card-title { font-weight: 650; font-size: 15px; margin-bottom: 4px; }
  .card-sub { color: var(--muted); font-size: 13px; line-height: 1.45; }
  .section-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin: 20px 0 8px;
    font-weight: 650;
  }
  .btn {
    display: inline-block;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    font-size: 15px;
    font-weight: 650;
    text-align: center;
    width: 100%;
  }
  .btn.secondary { background: var(--accent-soft); color: var(--accent); }
  input, textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 15px;
    background: var(--card);
    color: var(--text);
    outline: none;
  }
  input:focus, textarea:focus { border-color: var(--accent); }
  textarea { resize: vertical; min-height: 80px; }
  .navbar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid var(--border);
    display: flex;
    z-index: 20;
  }
  .nav-item {
    flex: 1;
    border: 0;
    background: transparent;
    text-align: center;
    padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
    font-size: 11px;
    color: var(--muted);
  }
  .nav-item.active { color: var(--accent); font-weight: 650; }
  .nav-icon { font-size: 20px; display: block; margin-bottom: 2px; }
  .badge {
    display: inline-block;
    background: var(--accent);
    color: white;
    border-radius: 999px;
    font-size: 11px;
    padding: 1px 7px;
    margin-left: 6px;
  }
  .msg { margin-bottom: 12px; display: flex; }
  .msg.user { justify-content: flex-end; }
  .bubble {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 15px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .msg.user .bubble { background: var(--accent); color: white; border-bottom-right-radius: 4px; }
  .msg.assistant .bubble { background: var(--card); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
  .chat-input-bar {
    position: fixed;
    bottom: 59px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: var(--bg);
    padding: 10px 20px;
    display: flex;
    gap: 8px;
    border-top: 1px solid var(--border);
    z-index: 10;
  }
  .chat-input-bar textarea { min-height: 42px; max-height: 120px; flex: 1; resize: none; }
  .chat-input-bar button {
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 0 16px;
    font-weight: 650;
  }
  .empty { color: var(--muted); font-size: 14px; padding: 24px 0; text-align: center; }
  .error-box, .error-text { color: var(--danger); font-size: 13px; }
  .error-box {
    background: #fff;
    border: 1px solid #f0d5d0;
    border-radius: 12px;
    padding: 12px;
  }
  .unlock-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 24px;
  }
  .unlock-title { font-size: 27px; font-weight: 750; margin-bottom: 6px; }
  .unlock-sub { color: var(--muted); margin-bottom: 24px; font-size: 14px; line-height: 1.5; }
  .error-text { margin-top: 8px; min-height: 18px; }
  .cat-pill {
    display: inline-block;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 11px;
    font-weight: 650;
    padding: 2px 8px;
    border-radius: 999px;
    margin-bottom: 6px;
  }
  .source-tag {
    font-size: 11px;
    font-weight: 650;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .row { display: flex; gap: 8px; }
  .row > * { flex: 1; }
  .detail { display: none; white-space: pre-wrap; margin-top: 10px; color: var(--text); font-size: 14px; line-height: 1.5; }
  .detail.open { display: block; }
  .spacer-chat { height: 92px; }
</style>
</head>
<body>
<div id="root"></div>
<script>
(function () {
  var STORAGE_KEY = 'maxos_owner_key';
  var state = {
    key: localStorage.getItem(STORAGE_KEY) || '',
    view: 'home',
    convoId: null,
    searchTimer: null
  };

  var root = document.getElementById('root');

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function lock() {
    state.key = '';
    state.convoId = null;
    localStorage.removeItem(STORAGE_KEY);
    renderUnlock();
  }

  async function parseResponse(res) {
    var data = {};
    try { data = await res.json(); } catch (_err) {}
    if (res.status === 401) {
      lock();
      throw new Error('Owner key rejected');
    }
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  }

  async function api(action, params) {
    var res = await fetch('/functions/v1/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-maxos-key': state.key
      },
      body: JSON.stringify(Object.assign({ action: action }, params || {}))
    });
    return parseResponse(res);
  }

  async function sendChat(message, conversationId) {
    var res = await fetch('/functions/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-maxos-key': state.key
      },
      body: JSON.stringify({ message: message, conversationId: conversationId || null })
    });
    return parseResponse(res);
  }

  function navbar(active) {
    var items = [
      ['home', '◐', 'Home'],
      ['chat', '💬', 'Lola'],
      ['maxos', '📖', 'Max OS'],
      ['search', '🔍', 'Search']
    ];
    return '<div class="navbar">' + items.map(function (item) {
      var id = item[0];
      return '<button class="nav-item ' + (active === id ? 'active' : '') + '" data-nav="' + id + '">' +
        '<span class="nav-icon">' + item[1] + '</span>' + item[2] + '</button>';
    }).join('') + '</div>';
  }

  function shell(title, innerHtml, activeNav) {
    root.innerHTML =
      '<div class="topbar"><div class="topbar-title">' + escapeHtml(title) + '</div>' +
      '<button class="text-button" data-action="lock">Lock</button></div>' +
      '<div class="content">' + innerHtml + '</div>' +
      navbar(activeNav);
  }

  function setView(view, convoId) {
    state.view = view;
    if (convoId !== undefined) state.convoId = convoId || null;
    render();
  }

  function renderUnlock(message) {
    root.innerHTML =
      '<div class="unlock-wrap">' +
      '<div class="unlock-title">Max OS</div>' +
      '<div class="unlock-sub">One-user mode. Enter your owner key once on this device.</div>' +
      '<input id="ownerKey" type="password" placeholder="Owner key" autocomplete="current-password" autofocus />' +
      '<div style="height:12px"></div>' +
      '<button id="unlockBtn" class="btn">Enter</button>' +
      '<div class="error-text" id="unlockErr">' + escapeHtml(message || '') + '</div>' +
      '</div>';

    var input = document.getElementById('ownerKey');
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') unlock();
    });
    document.getElementById('unlockBtn').addEventListener('click', unlock);
  }

  async function unlock() {
    var input = document.getElementById('ownerKey');
    var err = document.getElementById('unlockErr');
    var button = document.getElementById('unlockBtn');
    var candidate = input.value.trim();
    if (!candidate) return;

    err.textContent = '';
    button.disabled = true;
    button.textContent = 'Entering…';
    state.key = candidate;

    try {
      await api('home', {});
      localStorage.setItem(STORAGE_KEY, candidate);
      state.view = 'home';
      await render();
    } catch (e) {
      state.key = '';
      localStorage.removeItem(STORAGE_KEY);
      err.textContent = e.message;
      button.disabled = false;
      button.textContent = 'Enter';
    }
  }

  async function render() {
    if (!state.key) {
      renderUnlock();
      return;
    }

    root.innerHTML = '<div class="content"><div class="empty">Loading…</div></div>';
    try {
      if (state.view === 'home') await renderHome();
      else if (state.view === 'chat') await renderChat();
      else if (state.view === 'maxos') await renderMaxOS();
      else if (state.view === 'review') await renderReview();
      else if (state.view === 'journal') await renderJournal();
      else if (state.view === 'search') renderSearch();
      else setView('home');
    } catch (e) {
      if (!state.key) return;
      shell('Max OS', '<div class="error-box">' + escapeHtml(e.message) + '</div>', 'home');
    }
  }

  async function renderHome() {
    var data = await api('home', {});
    var html = '';
    var convoId = data.lastConversation ? data.lastConversation.id : '';

    html += '<div class="card interactive" data-nav="chat" data-convo="' + escapeHtml(convoId) + '">' +
      '<div class="card-title">' + (data.lastConversation ? 'Continue conversation' : 'Talk to Lola') + '</div>' +
      '<div class="card-sub">' + (data.lastConversation ? escapeHtml(data.lastConversation.title || 'Untitled') : 'Start a conversation') + '</div>' +
      '</div>';

    if (data.pendingCount > 0) {
      html += '<div class="card interactive" data-nav="review">' +
        '<div class="card-title">Pending Knowledge Reviews<span class="badge">' + data.pendingCount + '</span></div>' +
        '<div class="card-sub">Waiting for your approval</div></div>';
    }

    html += '<div class="section-label">Recent Discoveries</div>';
    if (!data.recentKnowledge || data.recentKnowledge.length === 0) {
      html += '<div class="empty">Nothing here yet.</div>';
    } else {
      html += data.recentKnowledge.map(function (k) {
        return '<div class="card"><div class="cat-pill">' + escapeHtml(k.category) + '</div>' +
          '<div class="card-title">' + escapeHtml(k.title) + '</div></div>';
      }).join('');
    }

    html += '<div class="section-label">More</div><div class="row">' +
      '<button class="btn secondary" data-nav="journal">Journal</button>' +
      '<button class="btn secondary" data-nav="maxos">Knowledge</button></div>';

    shell('Max OS', html, 'home');
  }

  async function renderChat() {
    var messages = [];
    if (state.convoId) {
      var data = await api('conversation.messages', { id: state.convoId });
      messages = data.messages || [];
    }

    var msgHtml = messages.length ? messages.map(function (m) {
      return '<div class="msg ' + (m.role === 'user' ? 'user' : 'assistant') +
        '"><div class="bubble">' + escapeHtml(m.content) + '</div></div>';
    }).join('') : '<div class="empty" id="emptyChat">Say hello to Lola.</div>';

    shell('Lola', '<div id="msgList">' + msgHtml + '</div><div class="spacer-chat"></div>', 'chat');
    root.insertAdjacentHTML('beforeend',
      '<div class="chat-input-bar"><textarea id="chatInput" placeholder="Message Lola…" rows="1"></textarea>' +
      '<button id="sendBtn">Send</button></div>'
    );

    var input = document.getElementById('chatInput');
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    });
    document.getElementById('sendBtn').addEventListener('click', send);
    window.scrollTo(0, document.body.scrollHeight);
  }

  async function send() {
    var input = document.getElementById('chatInput');
    var button = document.getElementById('sendBtn');
    var text = input.value.trim();
    if (!text || button.disabled) return;

    input.value = '';
    button.disabled = true;
    var empty = document.getElementById('emptyChat');
    if (empty) empty.remove();
    var list = document.getElementById('msgList');
    list.insertAdjacentHTML('beforeend', '<div class="msg user"><div class="bubble">' + escapeHtml(text) + '</div></div>');
    list.insertAdjacentHTML('beforeend', '<div class="msg assistant" id="thinking"><div class="bubble">…</div></div>');
    window.scrollTo(0, document.body.scrollHeight);

    try {
      var data = await sendChat(text, state.convoId);
      state.convoId = data.conversationId;
      var thinking = document.getElementById('thinking');
      if (thinking) thinking.outerHTML =
        '<div class="msg assistant"><div class="bubble">' + escapeHtml(data.reply) + '</div></div>';
    } catch (e) {
      var thinkingErr = document.getElementById('thinking');
      if (thinkingErr) thinkingErr.outerHTML =
        '<div class="msg assistant"><div class="bubble">' + escapeHtml(e.message) + '</div></div>';
    } finally {
      button.disabled = false;
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  async function renderMaxOS() {
    var data = await api('knowledge.list', {});
    var items = data.items || [];
    if (!items.length) {
      shell('Max OS', '<div class="empty">No permanent knowledge saved yet.</div>', 'maxos');
      return;
    }

    var byCategory = {};
    items.forEach(function (item) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    });

    var html = '';
    Object.keys(byCategory).sort().forEach(function (category) {
      html += '<div class="section-label">' + escapeHtml(category) + '</div>';
      html += byCategory[category].map(function (item) {
        return '<div class="card interactive" data-action="toggle-detail">' +
          '<div class="card-title">' + escapeHtml(item.title) + '</div>' +
          '<div class="detail">' + escapeHtml(item.content) + '</div></div>';
      }).join('');
    });

    shell('Max OS', html, 'maxos');
  }

  async function renderReview() {
    var data = await api('suggestions.list', {});
    var suggestions = data.suggestions || [];
    if (!suggestions.length) {
      shell('Pending Reviews', '<div class="empty">Nothing waiting for approval.</div>', 'home');
      return;
    }

    var html = suggestions.map(function (s) {
      return '<div class="card"><div class="cat-pill">' + escapeHtml(s.category) + '</div>' +
        '<div class="card-title">' + escapeHtml(s.title) + '</div>' +
        '<div class="card-sub" style="white-space:pre-wrap;margin:8px 0 12px;">' + escapeHtml(s.content) + '</div>' +
        '<div class="row"><button class="btn" data-review="approve" data-id="' + escapeHtml(s.id) + '">Approve</button>' +
        '<button class="btn secondary" data-review="reject" data-id="' + escapeHtml(s.id) + '">Reject</button></div></div>';
    }).join('');

    shell('Pending Reviews', html, 'home');
  }

  async function resolveSuggestion(id, action) {
    await api(action === 'approve' ? 'suggestions.approve' : 'suggestions.reject', { id: id });
    await renderReview();
  }

  async function renderJournal() {
    var data = await api('journal.list', {});
    var entries = data.entries || [];
    var html = '<textarea id="journalInput" placeholder="What is on your mind?"></textarea>' +
      '<div style="height:8px"></div><button class="btn" id="journalSave">Save entry</button>' +
      '<div class="section-label">Past entries</div>';

    html += entries.length ? entries.map(function (entry) {
      return '<div class="card"><div class="card-sub">' + new Date(entry.created_at).toLocaleDateString() + '</div>' +
        '<div style="margin-top:6px;white-space:pre-wrap;line-height:1.5;">' + escapeHtml(entry.content) + '</div></div>';
    }).join('') : '<div class="empty">No entries yet.</div>';

    shell('Journal', html, 'home');
    document.getElementById('journalSave').addEventListener('click', addJournal);
  }

  async function addJournal() {
    var input = document.getElementById('journalInput');
    var content = input.value.trim();
    if (!content) return;
    await api('journal.create', { content: content });
    await renderJournal();
  }

  function renderSearch() {
    shell('Search',
      '<input id="searchInput" placeholder="Search everything…" autofocus />' +
      '<div id="searchResults" style="margin-top:12px;"></div>',
      'search'
    );
    document.getElementById('searchInput').addEventListener('input', function () {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(runSearch, 300);
    });
  }

  async function runSearch() {
    var input = document.getElementById('searchInput');
    var box = document.getElementById('searchResults');
    if (!input || !box) return;
    var q = input.value.trim();
    if (!q) { box.innerHTML = ''; return; }

    box.innerHTML = '<div class="empty">Searching…</div>';
    try {
      var data = await api('search', { query: q });
      var results = data.results || [];
      box.innerHTML = results.length ? results.map(function (r) {
        return '<div class="card"><div class="source-tag">' + escapeHtml(r.source) + '</div>' +
          '<div class="card-title">' + escapeHtml(r.title) + '</div>' +
          '<div class="card-sub">' + escapeHtml(r.snippet) + (r.snippet ? '…' : '') + '</div></div>';
      }).join('') : '<div class="empty">No results.</div>';
    } catch (e) {
      box.innerHTML = '<div class="error-box">' + escapeHtml(e.message) + '</div>';
    }
  }

  document.addEventListener('click', function (event) {
    var navTarget = event.target.closest('[data-nav]');
    if (navTarget) {
      var view = navTarget.getAttribute('data-nav');
      var convo = navTarget.getAttribute('data-convo');
      setView(view, convo !== null ? convo : undefined);
      return;
    }

    var actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
      var action = actionTarget.getAttribute('data-action');
      if (action === 'lock') lock();
      if (action === 'toggle-detail') {
        var detail = actionTarget.querySelector('.detail');
        if (detail) detail.classList.toggle('open');
      }
      return;
    }

    var reviewTarget = event.target.closest('[data-review]');
    if (reviewTarget) {
      resolveSuggestion(reviewTarget.getAttribute('data-id'), reviewTarget.getAttribute('data-review'));
    }
  });

  render();
})();
</script>
</body>
</html>`

Deno.serve(() => {
  return new Response(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
})
