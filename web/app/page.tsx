"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type View =
  | "home"
  | "chat"
  | "maxos"
  | "review"
  | "journal"
  | "search";

type Conversation = {
  id: string;
  title: string | null;
  updated_at: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type KnowledgeItem = {
  id: string;
  category: string;
  title: string;
  content?: string;
};

type Suggestion = {
  id: string;
  category: string;
  title: string;
  content: string;
};

type JournalEntry = {
  id: string;
  content: string;
  created_at: string;
};

type SearchResult = {
  id: string;
  source: string;
  title: string;
  snippet: string;
};

type HomeData = {
  lastConversation: Conversation | null;
  pendingCount: number;
  recentKnowledge: KnowledgeItem[];
};

type ChatResponse = {
  conversationId: string;
  reply: string;
};

const OWNER_STORAGE_KEY = "maxos_owner_key";
const OWNER_SESSION_KEY = "maxos_owner_session_key";

class UnauthorizedError extends Error {}

function storageGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function storageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Session-only use still works when persistent storage is unavailable.
  }
}

function storageRemove(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Nothing else to clear.
  }
}

async function post<T>(
  target: "api" | "chat",
  ownerKey: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`/api/maxos/${target}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-maxos-key": ownerKey,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  let data: { error?: string } & Partial<T> = {};
  try {
    data = (await response.json()) as { error?: string } & Partial<T>;
  } catch {
    // The status still provides a useful fallback below.
  }

  if (response.status === 401) {
    throw new UnauthorizedError("Owner key rejected");
  }
  if (!response.ok) {
    throw new Error(data.error ?? "MAXos could not complete that request");
  }
  return data as T;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [view, setView] = useState<View>("home");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [home, setHome] = useState<HomeData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [chatText, setChatText] = useState("");
  const [journalText, setJournalText] = useState("");
  const [sending, setSending] = useState(false);
  const messageEnd = useRef<HTMLDivElement>(null);

  const clearOwnerKey = useCallback(() => {
    storageRemove(sessionStorage, OWNER_SESSION_KEY);
    storageRemove(localStorage, OWNER_STORAGE_KEY);
    setKey("");
    setRemember(false);
    setConversationId(null);
    setView("home");
  }, []);

  const handleError = useCallback(
    (caught: unknown) => {
      if (caught instanceof UnauthorizedError) {
        clearOwnerKey();
      }
      setError(
        caught instanceof Error ? caught.message : "MAXos could not load",
      );
    },
    [clearOwnerKey],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const persistent = storageGet(localStorage, OWNER_STORAGE_KEY);
      const session = storageGet(sessionStorage, OWNER_SESSION_KEY);
      setRemember(Boolean(persistent));
      setKey(session || persistent);
      setBooted(true);
    });

    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Installation remains optional; the online app still works.
      });
    }

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!booted || !key) return;
    let cancelled = false;

    async function loadView() {
      setLoading(true);
      setError("");
      try {
        if (view === "home") {
          const data = await post<HomeData>("api", key, { action: "home" });
          if (!cancelled) setHome(data);
        } else if (view === "chat") {
          const conversationRequest = post<{ conversations: Conversation[] }>(
            "api",
            key,
            { action: "conversations.list" },
          );
          const messageRequest = conversationId
            ? post<{ messages: Message[] }>("api", key, {
                action: "conversation.messages",
                id: conversationId,
              })
            : Promise.resolve({ messages: [] });
          const [conversationData, messageData] = await Promise.all([
            conversationRequest,
            messageRequest,
          ]);
          if (!cancelled) {
            setConversations(conversationData.conversations ?? []);
            setMessages(messageData.messages ?? []);
          }
        } else if (view === "maxos") {
          const data = await post<{ items: KnowledgeItem[] }>("api", key, {
            action: "knowledge.list",
          });
          if (!cancelled) setKnowledge(data.items ?? []);
        } else if (view === "review") {
          const data = await post<{ suggestions: Suggestion[] }>("api", key, {
            action: "suggestions.list",
          });
          if (!cancelled) setSuggestions(data.suggestions ?? []);
        } else if (view === "journal") {
          const data = await post<{ entries: JournalEntry[] }>("api", key, {
            action: "journal.list",
          });
          if (!cancelled) setEntries(data.entries ?? []);
        }
      } catch (caught) {
        if (!cancelled) handleError(caught);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadView();
    return () => {
      cancelled = true;
    };
  }, [booted, conversationId, handleError, key, refresh, view]);

  useEffect(() => {
    if (view === "chat") {
      requestAnimationFrame(() => {
        messageEnd.current?.scrollIntoView({ block: "end" });
      });
    }
  }, [messages, sending, view]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const candidate = String(form.get("ownerKey") ?? "").trim();
    if (!candidate) return;

    setLoading(true);
    setError("");
    try {
      const data = await post<HomeData>("api", candidate, { action: "home" });
      storageSet(sessionStorage, OWNER_SESSION_KEY, candidate);
      if (remember) {
        storageSet(localStorage, OWNER_STORAGE_KEY, candidate);
      } else {
        storageRemove(localStorage, OWNER_STORAGE_KEY);
      }
      setHome(data);
      setKey(candidate);
      setView("home");
    } catch (caught) {
      storageRemove(sessionStorage, OWNER_SESSION_KEY);
      storageRemove(localStorage, OWNER_STORAGE_KEY);
      handleError(caught);
    } finally {
      setLoading(false);
    }
  }

  function navigate(nextView: View, nextConversation?: string | null) {
    setError("");
    if (nextConversation !== undefined) {
      setConversationId(nextConversation);
    }
    setView(nextView);
  }

  async function sendMessage() {
    const content = chatText.trim();
    if (!content || sending) return;

    const optimistic: Message = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setChatText("");
    setMessages((current) => [...current, optimistic]);
    setSending(true);
    setError("");

    try {
      const data = await post<ChatResponse>("chat", key, {
        message: content,
        conversationId,
      });
      setMessages((current) => [
        ...current,
        {
          id: `reply-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);
      setConversationId(data.conversationId);
      setRefresh((value) => value + 1);
    } catch (caught) {
      handleError(caught);
    } finally {
      setSending(false);
    }
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function resolveSuggestion(id: string, action: "approve" | "reject") {
    setError("");
    try {
      await post<{ ok: boolean }>("api", key, {
        action:
          action === "approve"
            ? "suggestions.approve"
            : "suggestions.reject",
        id,
      });
      setRefresh((value) => value + 1);
    } catch (caught) {
      handleError(caught);
    }
  }

  async function saveJournal() {
    const content = journalText.trim();
    if (!content) return;
    setError("");
    try {
      await post<{ entry: JournalEntry }>("api", key, {
        action: "journal.create",
        content,
      });
      setJournalText("");
      setRefresh((value) => value + 1);
    } catch (caught) {
      handleError(caught);
    }
  }

  async function runSearch(query: string) {
    const cleaned = query.trim();
    if (!cleaned) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setError("");
    try {
      const data = await post<{ results: SearchResult[] }>("api", key, {
        action: "search",
        query: cleaned,
      });
      setSearchResults(data.results ?? []);
    } catch (caught) {
      handleError(caught);
    } finally {
      setSearching(false);
    }
  }

  if (!booted) {
    return <main className="unlock-wrap">Loading…</main>;
  }

  if (!key) {
    return (
      <main className="unlock-wrap">
        <form className="unlock-card" onSubmit={unlock}>
          <h1>MAXos</h1>
          <p>
            One-user mode. Enter your owner key. It is sent only in a request
            header, never in the URL.
          </p>
          <label className="sr-only" htmlFor="ownerKey">
            Owner key
          </label>
          <input
            id="ownerKey"
            name="ownerKey"
            type="password"
            placeholder="Owner key"
            autoComplete="current-password"
            autoFocus
          />
          <label className="remember-line">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Remember on this device
          </label>
          <p className="security-note">
            Leave this off to keep the key only for this app session. Use Lock
            when you are done.
          </p>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Entering…" : "Enter"}
          </button>
          <div className="error-text" role="alert">
            {error}
          </div>
        </form>
      </main>
    );
  }

  let content: React.ReactNode;
  let title = "MAXos";
  let active: View = view;

  if (loading && view !== "search") {
    content = <div className="empty">Loading…</div>;
  } else if (view === "home") {
    content = (
      <>
        <button
          className="card interactive"
          onClick={() =>
            navigate("chat", home?.lastConversation?.id ?? null)
          }
        >
          <span className="card-title">
            {home?.lastConversation ? "Continue conversation" : "Talk to Lola"}
          </span>
          <span className="card-sub">
            {home?.lastConversation?.title ?? "Start a conversation"}
          </span>
        </button>

        {(home?.pendingCount ?? 0) > 0 && (
          <button
            className="card interactive"
            onClick={() => navigate("review")}
          >
            <span className="card-title">
              Pending Knowledge Reviews
              <span className="badge">{home?.pendingCount}</span>
            </span>
            <span className="card-sub">Waiting for your approval</span>
          </button>
        )}

        <div className="section-label">Recent discoveries</div>
        {home?.recentKnowledge?.length ? (
          home.recentKnowledge.map((item) => (
            <article className="card" key={item.id}>
              <span className="cat-pill">{item.category}</span>
              <h2 className="card-title">{item.title}</h2>
            </article>
          ))
        ) : (
          <div className="empty">Nothing here yet.</div>
        )}

        <div className="section-label">More</div>
        <div className="row">
          <button
            className="btn secondary"
            onClick={() => navigate("journal")}
          >
            Journal
          </button>
          <button
            className="btn secondary"
            onClick={() => navigate("maxos")}
          >
            Knowledge
          </button>
        </div>
      </>
    );
  } else if (view === "chat") {
    title = "Lola";
    content = (
      <>
        <details className="conversation-drawer" open={!conversationId}>
          <summary>
            {conversationId ? "Conversations" : "Choose a conversation"}
          </summary>
          <div className="conversation-list">
            <button
              className={`conversation-link${conversationId ? "" : " active"}`}
              onClick={() => navigate("chat", null)}
            >
              New conversation
            </button>
            {conversations.map((conversation) => (
              <button
                className={`conversation-link${
                  conversationId === conversation.id ? " active" : ""
                }`}
                key={conversation.id}
                onClick={() => navigate("chat", conversation.id)}
              >
                {conversation.title || "Untitled"}
                <span className="conversation-meta">
                  {formatDate(conversation.updated_at)}
                </span>
              </button>
            ))}
          </div>
        </details>
        <div className="message-list">
          {messages.length ? (
            messages.map((message) => (
              <div className={`msg ${message.role}`} key={message.id}>
                <div className="bubble">{message.content}</div>
              </div>
            ))
          ) : (
            <div className="empty">Say hello to Lola.</div>
          )}
          {sending && (
            <div className="msg assistant">
              <div className="bubble">…</div>
            </div>
          )}
          <div ref={messageEnd} />
        </div>
        <div className="spacer-chat" />
        <div className="chat-input-bar">
          <label className="sr-only" htmlFor="chatInput">
            Message Lola
          </label>
          <textarea
            id="chatInput"
            value={chatText}
            onChange={(event) => setChatText(event.target.value)}
            onKeyDown={handleComposerKey}
            placeholder="Message Lola…"
            rows={1}
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || !chatText.trim()}
          >
            Send
          </button>
        </div>
      </>
    );
  } else if (view === "maxos") {
    const byCategory = knowledge.reduce<Record<string, KnowledgeItem[]>>(
      (groups, item) => {
        (groups[item.category] ??= []).push(item);
        return groups;
      },
      {},
    );
    content = knowledge.length ? (
      <>
        {Object.keys(byCategory)
          .sort()
          .map((category) => (
            <section key={category}>
              <div className="section-label">{category}</div>
              {byCategory[category].map((item) => (
                <details className="card knowledge-card" key={item.id}>
                  <summary className="card-title">{item.title}</summary>
                  <div className="detail">{item.content}</div>
                </details>
              ))}
            </section>
          ))}
      </>
    ) : (
      <div className="empty">No permanent knowledge saved yet.</div>
    );
  } else if (view === "review") {
    title = "Pending Reviews";
    active = "home";
    content = suggestions.length ? (
      <>
        {suggestions.map((suggestion) => (
          <article className="card" key={suggestion.id}>
            <span className="cat-pill">{suggestion.category}</span>
            <h2 className="card-title">{suggestion.title}</h2>
            <p className="review-content">{suggestion.content}</p>
            <div className="row">
              <button
                className="btn"
                onClick={() =>
                  void resolveSuggestion(suggestion.id, "approve")
                }
              >
                Approve
              </button>
              <button
                className="btn secondary"
                onClick={() =>
                  void resolveSuggestion(suggestion.id, "reject")
                }
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </>
    ) : (
      <div className="empty">Nothing waiting for approval.</div>
    );
  } else if (view === "journal") {
    title = "Journal";
    active = "home";
    content = (
      <>
        <label className="sr-only" htmlFor="journalInput">
          Journal entry
        </label>
        <textarea
          id="journalInput"
          value={journalText}
          onChange={(event) => setJournalText(event.target.value)}
          placeholder="What is on your mind?"
        />
        <button
          className="btn journal-save"
          onClick={() => void saveJournal()}
          disabled={!journalText.trim()}
        >
          Save entry
        </button>
        <div className="section-label">Past entries</div>
        {entries.length ? (
          entries.map((entry) => (
            <article className="card" key={entry.id}>
              <div className="card-sub">{formatDate(entry.created_at)}</div>
              <div className="journal-content">{entry.content}</div>
            </article>
          ))
        ) : (
          <div className="empty">No entries yet.</div>
        )}
      </>
    );
  } else {
    title = "Search";
    content = (
      <>
        <label className="sr-only" htmlFor="searchInput">
          Search everything
        </label>
        <input
          id="searchInput"
          placeholder="Search everything…"
          autoFocus
          onChange={(event) => {
            const value = event.target.value;
            window.clearTimeout(
              Number(event.currentTarget.dataset.searchTimer || "0"),
            );
            const timer = window.setTimeout(() => void runSearch(value), 300);
            event.currentTarget.dataset.searchTimer = String(timer);
          }}
        />
        <div className="search-results">
          {searching ? (
            <div className="empty">Searching…</div>
          ) : searchResults.length ? (
            searchResults.map((result) => (
              <article className="card" key={`${result.source}-${result.id}`}>
                <div className="source-tag">{result.source}</div>
                <h2 className="card-title">{result.title}</h2>
                <p className="card-sub">
                  {result.snippet}
                  {result.snippet ? "…" : ""}
                </p>
              </article>
            ))
          ) : null}
        </div>
      </>
    );
  }

  return (
    <main className="maxos-shell">
      <header className="topbar">
        <h1>{title}</h1>
        <button className="text-button" type="button" onClick={clearOwnerKey}>
          Lock
        </button>
      </header>
      <section className="content">
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
        {content}
      </section>
      <nav className="navbar" aria-label="MAXos">
        {[
          ["home", "◐", "Home"],
          ["chat", "💬", "Lola"],
          ["maxos", "📖", "MAXos"],
          ["search", "🔍", "Search"],
        ].map(([id, icon, label]) => (
          <button
            className={`nav-item${active === id ? " active" : ""}`}
            key={id}
            type="button"
            onClick={() => navigate(id as View)}
          >
            <span className="nav-icon" aria-hidden="true">
              {icon}
            </span>
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
