-- tests/fixtures/fixture.sql

-- Create tables and insert synthetic data with Unicode and multiline content

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  body text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion text,
  created_at timestamptz DEFAULT now()
);

-- Insert fixture rows with Unicode and multiline content
INSERT INTO conversations (id, title, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Welcome – 初めまして', now()),
  ('00000000-0000-0000-0000-000000000002', 'Multiline chat', now());

INSERT INTO messages (id, conversation_id, content, created_at) VALUES
  ('00000000-0000-0000-0000-000000000011', 'Hello, world! 👋', '2024-01-01T12:00:00Z'),
  ('00000000-0000-0000-0000-000000000012', 'Line1\nLine2\nLine3', '2024-01-02T13:00:00Z');

INSERT INTO journal_entries (id, content, created_at) VALUES
  ('00000000-0000-0000-0000-000000000021', 'Today I learned: emojis 👍 and accents éèà', '2024-01-03T14:00:00Z'),
  ('00000000-0000-0000-0000-000000000022', 'Multiline entry:\n- item A\n- item B', '2024-01-04T15:00:00Z');

INSERT INTO knowledge_items (id, title, body, created_at) VALUES
  ('00000000-0000-0000-0000-000000000031', 'タイトル with 漢字', '本文 includes Unicode and special chars: © ® ✓', '2024-01-05T16:00:00Z');

INSERT INTO knowledge_suggestions (id, suggestion, created_at) VALUES
  ('00000000-0000-0000-0000-000000000041', 'Consider adding multi-language support — ejemplo, 例', '2024-01-06T17:00:00Z');
