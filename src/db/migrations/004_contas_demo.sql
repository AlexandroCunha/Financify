-- Contas de demonstração: criadas pela rota POST /demo, com dados de exemplo.
-- Cada visitante ganha a sua; elas são apagadas (com as transações, por CASCADE) depois de 24 horas.
ALTER TABLE usuarios ADD COLUMN demo BOOLEAN NOT NULL DEFAULT false;

-- Acelera a limpeza das contas de demonstração antigas.
CREATE INDEX usuarios_demo_criado_em_idx ON usuarios (criado_em) WHERE demo;
