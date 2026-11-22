-- Demo accounts: created by POST /demo, with sample data.
-- Each visitor gets their own; they are deleted (with their transactions, by CASCADE) after 24 hours.
ALTER TABLE usuarios ADD COLUMN demo BOOLEAN NOT NULL DEFAULT false;

-- Speeds up deleting old demo accounts.
CREATE INDEX usuarios_demo_criado_em_idx ON usuarios (criado_em) WHERE demo;
