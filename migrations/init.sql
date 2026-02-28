CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  email TEXT,
  phone_number TEXT,
  linked_id INT,
  link_precedence TEXT CHECK (link_precedence IN ('primary','secondary')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_linked_id ON contacts(linked_id);