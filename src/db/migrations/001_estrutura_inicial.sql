-- Estrutura inicial do Financify (v2).
-- Para mudar o banco no futuro, crie um novo arquivo (002_..., 003_...) em vez de editar este.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE usuarios (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome          TEXT        NOT NULL CHECK (btrim(nome) <> ''),
  email         CITEXT      NOT NULL UNIQUE, -- CITEXT: "Ana@x.com" e "ana@x.com" são o mesmo e-mail
  senha         TEXT        NOT NULL,        -- hash bcrypt, nunca a senha em texto
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

-- Acelera a listagem e o extrato, que sempre filtram por usuário e ordenam por data.
CREATE INDEX transacoes_usuario_data_idx ON transacoes (usuario_id, data DESC, id DESC);

COMMENT ON COLUMN transacoes.valor IS 'Valor em centavos (1050 = R$ 10,50)';
