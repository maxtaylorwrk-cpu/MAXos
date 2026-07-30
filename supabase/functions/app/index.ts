import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#5B7FA6" />
<meta name="color-scheme" content="light" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="MAXos" />
<meta name="format-detection" content="telephone=no" />
<meta name="referrer" content="no-referrer" />
<link rel="manifest" href="/functions/v1/app/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/functions/v1/app/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/functions/v1/app/icon-192.png" />
<title>MAXos</title>
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
  * { box-sizing: border-box; min-width: 0; }
  html, body { min-height: 100%; width: 100%; overflow-x: hidden; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    overscroll-behavior-x: none;
  }
  button, input, textarea { font: inherit; }
  button { cursor: pointer; touch-action: manipulation; }
  button:focus-visible, input:focus-visible, textarea:focus-visible, summary:focus-visible {
    outline: 3px solid rgba(91,127,166,0.3);
    outline-offset: 2px;
  }
  #root {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-bottom: calc(74px + env(safe-area-inset-bottom));
  }
  .topbar {
    padding: calc(14px + env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 8px max(20px, env(safe-area-inset-left));
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
    min-height: 44px;
    padding: 8px 4px;
  }
  .content {
    padding: 8px max(20px, env(safe-area-inset-right)) 24px max(20px, env(safe-area-inset-left));
    flex: 1;
    width: 100%;
    overflow-wrap: anywhere;
  }
  .card {
    background: var(--card);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid var(--border);
    max-width: 100%;
    overflow-wrap: anywhere;
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
    min-height: 44px;
    font-size: 15px;
    font-weight: 650;
    text-align: center;
    width: 100%;
  }
  .btn.secondary { background: var(--accent-soft); color: var(--accent); }
  .btn:disabled { opacity: 0.6; cursor: default; }
  input, textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    min-height: 44px;
    font-size: 16px;
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
    padding: 8px 2px calc(8px + env(safe-area-inset-bottom));
    min-height: calc(58px + env(safe-area-inset-bottom));
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
    bottom: calc(58px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: var(--bg);
    padding: 10px max(16px, env(safe-area-inset-right)) 10px max(16px, env(safe-area-inset-left));
    display: flex;
    align-items: flex-end;
    gap: 8px;
    border-top: 1px solid var(--border);
    z-index: 10;
  }
  .chat-input-bar textarea {
    min-height: 44px;
    max-height: 120px;
    flex: 1;
    resize: none;
    overscroll-behavior: contain;
  }
  .chat-input-bar button {
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 0 16px;
    min-width: 68px;
    min-height: 44px;
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
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
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
  .detail { display: none; white-space: pre-wrap; margin-top: 10px; color: var(--text); font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
  .detail.open { display: block; }
  .remember-line {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin-top: 8px;
    color: var(--text);
    font-size: 14px;
  }
  .remember-line input { width: 20px; min-height: 20px; height: 20px; accent-color: var(--accent); }
  .security-note { color: var(--muted); font-size: 12px; line-height: 1.45; margin-bottom: 12px; }
  .conversation-drawer {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .conversation-drawer summary {
    min-height: 44px;
    padding: 12px 14px;
    cursor: pointer;
    font-weight: 650;
    list-style-position: inside;
  }
  .conversation-list {
    max-height: 38vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-top: 1px solid var(--border);
    padding: 8px;
  }
  .conversation-link {
    width: 100%;
    min-height: 44px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--text);
    padding: 10px;
    text-align: left;
    overflow-wrap: anywhere;
  }
  .conversation-link + .conversation-link { margin-top: 4px; }
  .conversation-link.active { background: var(--accent-soft); color: var(--accent); }
  .conversation-meta { display: block; color: var(--muted); font-size: 11px; margin-top: 3px; }
  .spacer-chat { height: 116px; }
  @media (max-width: 360px) {
    .topbar { padding-left: max(16px, env(safe-area-inset-left)); padding-right: max(16px, env(safe-area-inset-right)); }
    .content { padding-left: max(16px, env(safe-area-inset-left)); padding-right: max(16px, env(safe-area-inset-right)); }
    .row { flex-direction: column; }
    .bubble { max-width: 90%; }
  }
  @media (display-mode: standalone) {
    body { min-height: 100dvh; }
  }
</style>
</head>
<body>
<div id="root"></div>
<script>
(function () {
  var STORAGE_KEY = 'maxos_owner_key';
  var SESSION_STORAGE_KEY = 'maxos_owner_session_key';

  function storageGet(storage, key) {
    try { return storage.getItem(key) || ''; } catch (_err) { return ''; }
  }
  function storageSet(storage, key, value) {
    try { storage.setItem(key, value); } catch (_err) {}
  }
  function storageRemove(storage, key) {
    try { storage.removeItem(key); } catch (_err) {}
  }

  var state = {
    key: storageGet(sessionStorage, SESSION_STORAGE_KEY) || storageGet(localStorage, STORAGE_KEY),
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
    storageRemove(sessionStorage, SESSION_STORAGE_KEY);
    storageRemove(localStorage, STORAGE_KEY);
    renderUnlock();
  }

  async function parseResponse(res) {
    var data = {};
    try { data = await res.json(); } catch (_err) {}
    if (res.status === 401) {
      state.key = '';
      storageRemove(sessionStorage, SESSION_STORAGE_KEY);
      storageRemove(localStorage, STORAGE_KEY);
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
      '<div class="unlock-title">MAXos</div>' +
      '<div class="unlock-sub">One-user mode. Enter your owner key. It is sent only in a request header, never in the URL.</div>' +
      '<input id="ownerKey" type="password" placeholder="Owner key" autocomplete="current-password" autofocus />' +
      '<label class="remember-line"><input id="rememberKey" type="checkbox" />Remember on this device</label>' +
      '<div class="security-note">Leave this off to keep the key only for this app session. Use Lock when you are done.</div>' +
      '<button id="unlockBtn" class="btn">Enter</button>' +
      '<div class="error-text" id="unlockErr" role="alert">' + escapeHtml(message || '') + '</div>' +
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
      storageSet(sessionStorage, SESSION_STORAGE_KEY, candidate);
      if (document.getElementById('rememberKey').checked) {
        storageSet(localStorage, STORAGE_KEY, candidate);
      } else {
        storageRemove(localStorage, STORAGE_KEY);
      }
      state.view = 'home';
      await render();
    } catch (e) {
      state.key = '';
      storageRemove(sessionStorage, SESSION_STORAGE_KEY);
      storageRemove(localStorage, STORAGE_KEY);
      renderUnlock(e.message);
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
      if (!state.key) {
        renderUnlock(e.message);
        return;
      }
      shell('MAXos', '<div class="error-box">' + escapeHtml(e.message) + '</div>', 'home');
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
    var conversationData = await api('conversations.list', {});
    var conversations = conversationData.conversations || [];
    if (state.convoId) {
      var data = await api('conversation.messages', { id: state.convoId });
      messages = data.messages || [];
    }

    var conversationHtml = '<details class="conversation-drawer"' + (state.convoId ? '' : ' open') + '>' +
      '<summary>' + (state.convoId ? 'Conversations' : 'Choose a conversation') + '</summary>' +
      '<div class="conversation-list">' +
      '<button class="conversation-link' + (!state.convoId ? ' active' : '') + '" data-nav="chat" data-convo="">New conversation</button>' +
      conversations.map(function (conversation) {
        var active = state.convoId === conversation.id ? ' active' : '';
        return '<button class="conversation-link' + active + '" data-nav="chat" data-convo="' + escapeHtml(conversation.id) + '">' +
          escapeHtml(conversation.title || 'Untitled') +
          '<span class="conversation-meta">' + new Date(conversation.updated_at).toLocaleDateString() + '</span></button>';
      }).join('') + '</div></details>';

    var msgHtml = messages.length ? messages.map(function (m) {
      return '<div class="msg ' + (m.role === 'user' ? 'user' : 'assistant') +
        '"><div class="bubble">' + escapeHtml(m.content) + '</div></div>';
    }).join('') : '<div class="empty" id="emptyChat">Say hello to Lola.</div>';

    shell('Lola', conversationHtml + '<div id="msgList">' + msgHtml + '</div><div class="spacer-chat"></div>', 'chat');
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

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/functions/v1/app/sw.js', { scope: '/functions/v1/app/' }).catch(function () {});
    });
  }

  render();
})();
</script>
</body>
</html>`

const APP_PATH = '/functions/v1/app'
const MANIFEST = "{\n  \"id\": \"/functions/v1/app/\",\n  \"name\": \"MAXos\",\n  \"short_name\": \"MAXos\",\n  \"description\": \"Private owner interface for MAXos\",\n  \"start_url\": \"/functions/v1/app/\",\n  \"scope\": \"/functions/v1/app/\",\n  \"display\": \"standalone\",\n  \"orientation\": \"any\",\n  \"background_color\": \"#F7F7F5\",\n  \"theme_color\": \"#5B7FA6\",\n  \"icons\": [\n    {\n      \"src\": \"/functions/v1/app/icon-192.png\",\n      \"sizes\": \"192x192\",\n      \"type\": \"image/png\",\n      \"purpose\": \"any\"\n    },\n    {\n      \"src\": \"/functions/v1/app/icon-512.png\",\n      \"sizes\": \"512x512\",\n      \"type\": \"image/png\",\n      \"purpose\": \"any maskable\"\n    }\n  ]\n}"
const SERVICE_WORKER = "const APP_SCOPE = '/functions/v1/app/';\nconst STATIC_CACHE = 'maxos-static-v1';\nconst STATIC_ASSETS = [\n  APP_SCOPE + 'manifest.webmanifest',\n  APP_SCOPE + 'icon-192.png',\n  APP_SCOPE + 'icon-512.png',\n  APP_SCOPE + 'apple-touch-icon.png'\n];\nconst OFFLINE_HTML = '<!doctype html><html lang=\"en\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#5B7FA6\"><title>MAXos offline</title><body style=\"margin:0;background:#F7F7F5;color:#2B2E33;font:16px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif\"><main style=\"max-width:32rem;margin:auto;padding:15vh 24px\"><h1>MAXos is offline</h1><p>Reconnect to the internet, then reopen MAXos. Chat and saved data remain on the live Supabase backend.</p></main></body></html>';\n\nself.addEventListener('install', function (event) {\n  event.waitUntil(caches.open(STATIC_CACHE).then(function (cache) {\n    return cache.addAll(STATIC_ASSETS);\n  }).then(function () { return self.skipWaiting(); }));\n});\n\nself.addEventListener('activate', function (event) {\n  event.waitUntil(caches.keys().then(function (keys) {\n    return Promise.all(keys.filter(function (key) {\n      return key.indexOf('maxos-static-') === 0 && key !== STATIC_CACHE;\n    }).map(function (key) { return caches.delete(key); }));\n  }).then(function () { return self.clients.claim(); }));\n});\n\nself.addEventListener('fetch', function (event) {\n  if (event.request.method !== 'GET') return;\n  var url = new URL(event.request.url);\n  if (url.origin !== self.location.origin || url.pathname.indexOf(APP_SCOPE) !== 0) return;\n\n  if (event.request.mode === 'navigate') {\n    event.respondWith(fetch(event.request).catch(function () {\n      return new Response(OFFLINE_HTML, {\n        status: 503,\n        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }\n      });\n    }));\n    return;\n  }\n\n  if (STATIC_ASSETS.indexOf(url.pathname) !== -1) {\n    event.respondWith(caches.match(event.request).then(function (cached) {\n      return cached || fetch(event.request);\n    }));\n  }\n});\n"
const ICON_192 = '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'
const ICON_512 = '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'
const APPLE_TOUCH_ICON = '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'

function base64Bytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

function response(body: BodyInit, contentType: string, cacheControl: string, extraHeaders: Record<string, string> = {}) {
  return new Response(body, {
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      ...extraHeaders
    }
  })
}

Deno.serve((request) => {
  const path = new URL(request.url).pathname

  if (path === APP_PATH + '/manifest.webmanifest') {
    return response(MANIFEST, 'application/manifest+json; charset=utf-8', 'public, max-age=3600')
  }
  if (path === APP_PATH + '/sw.js') {
    return response(SERVICE_WORKER, 'application/javascript; charset=utf-8', 'no-store', {
      'Service-Worker-Allowed': APP_PATH + '/'
    })
  }
  if (path === APP_PATH + '/icon-192.png') {
    return response(base64Bytes(ICON_192), 'image/png', 'public, max-age=31536000, immutable')
  }
  if (path === APP_PATH + '/icon-512.png') {
    return response(base64Bytes(ICON_512), 'image/png', 'public, max-age=31536000, immutable')
  }
  if (path === APP_PATH + '/apple-touch-icon.png') {
    return response(base64Bytes(APPLE_TOUCH_ICON), 'image/png', 'public, max-age=31536000, immutable')
  }
  if (path !== APP_PATH && path !== APP_PATH + '/') {
    return response('Not found', 'text/plain; charset=utf-8', 'no-store')
  }

  return response(HTML, 'text/html; charset=utf-8', 'no-store')
})
