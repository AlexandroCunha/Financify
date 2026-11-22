-- Initial Financify schema (v2). Table and column names were in Portuguese until 005_english_schema.sql.
-- To change the database, add a new file (006_..., 007_...) instead of editing this one.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE usuarios (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome          TEXT        NOT NULL CHECK (btrim(nome) <> ''),
  email         CITEXT      NOT NULL UNIQUE, -- CITEXT: "Ana@x.com" and "ana@x.com" are the same e-mail
  senha         TEXT        NOT NULL,        -- bcrypt hash, never the plain password
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categorias (
  id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descricao TEXT NOT NULL UNIQUE
);

CREATE TABLE transacoes (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descricao     TEXT        NOT NULL CHECK (btrim(descricao) <> ''),
  valor         INTEGER     NOT NULL CHECK (valor > 0),
  data          DATE        NOT NULL,
  tipo          TEXT        NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria_id  INTEGER     NOT NULL REFERENCES categorias (id),
  usuario_id    INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up the list and the statement, which always filter by user and sort by date.
CREATE INDEX transacoes_usuario_data_idx ON transacoes (usuario_id, data DESC, id DESC);

COMMENT ON COLUMN transacoes.valor IS 'Valor em centavos (1050 = R$ 10,50)';
