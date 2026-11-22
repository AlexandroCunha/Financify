-- Financify switches to English: tables, columns, constraints, the transaction types
-- and the default categories get English names. Existing data is kept: everything is renamed in place.

-- Tables
ALTER TABLE usuarios   RENAME TO users;
ALTER TABLE categorias RENAME TO categories;
ALTER TABLE transacoes RENAME TO transactions;

-- users
ALTER TABLE users RENAME COLUMN nome          TO name;
ALTER TABLE users RENAME COLUMN senha         TO password;
ALTER TABLE users RENAME COLUMN criado_em     TO created_at;
ALTER TABLE users RENAME COLUMN atualizado_em TO updated_at;
ALTER TABLE users RENAME CONSTRAINT usuarios_pkey       TO users_pkey;
ALTER TABLE users RENAME CONSTRAINT usuarios_email_key  TO users_email_key;
ALTER TABLE users RENAME CONSTRAINT usuarios_nome_check TO users_name_check;
ALTER SEQUENCE usuarios_id_seq RENAME TO users_id_seq;
ALTER INDEX usuarios_demo_criado_em_idx RENAME TO users_demo_created_at_idx;

-- categories
ALTER TABLE categories RENAME COLUMN descricao TO name;
ALTER TABLE categories RENAME CONSTRAINT categorias_pkey          TO categories_pkey;
ALTER TABLE categories RENAME CONSTRAINT categorias_descricao_key TO categories_name_key;
ALTER SEQUENCE categorias_id_seq RENAME TO categories_id_seq;

-- transactions
ALTER TABLE transactions RENAME COLUMN descricao     TO description;
ALTER TABLE transactions RENAME COLUMN valor         TO amount;
ALTER TABLE transactions RENAME COLUMN data          TO date;
ALTER TABLE transactions RENAME COLUMN tipo          TO type;
ALTER TABLE transactions RENAME COLUMN categoria_id  TO category_id;
ALTER TABLE transactions RENAME COLUMN usuario_id    TO user_id;
ALTER TABLE transactions RENAME COLUMN criado_em     TO created_at;
ALTER TABLE transactions RENAME COLUMN atualizado_em TO updated_at;
ALTER TABLE transactions RENAME CONSTRAINT transacoes_pkey              TO transactions_pkey;
ALTER TABLE transactions RENAME CONSTRAINT transacoes_descricao_check   TO transactions_description_check;
ALTER TABLE transactions RENAME CONSTRAINT transacoes_valor_check       TO transactions_amount_check;
ALTER TABLE transactions RENAME CONSTRAINT transacoes_categoria_id_fkey TO transactions_category_id_fkey;
ALTER TABLE transactions RENAME CONSTRAINT transacoes_usuario_id_fkey   TO transactions_user_id_fkey;
ALTER SEQUENCE transacoes_id_seq RENAME TO transactions_id_seq;
ALTER INDEX transacoes_usuario_data_idx RENAME TO transactions_user_date_idx;

-- Transaction types: 'entrada' / 'saida' become 'income' / 'expense'
ALTER TABLE transactions DROP CONSTRAINT transacoes_tipo_check;
UPDATE transactions SET type = CASE type WHEN 'entrada' THEN 'income' ELSE 'expense' END;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense'));

COMMENT ON COLUMN transactions.amount IS 'Amount in euro cents (1050 = €10.50)';

-- Default categories (same ids, so existing transactions keep their category)
UPDATE categories
   SET name = CASE name
     WHEN 'Alimentação'            THEN 'Food'
     WHEN 'Assinaturas e Serviços' THEN 'Subscriptions and Services'
     WHEN 'Casa'                   THEN 'Home'
     WHEN 'Mercado'                THEN 'Groceries'
     WHEN 'Cuidados Pessoais'      THEN 'Personal Care'
     WHEN 'Educação'               THEN 'Education'
     WHEN 'Família'                THEN 'Family'
     WHEN 'Lazer'                  THEN 'Leisure'
     WHEN 'Pets'                   THEN 'Pets'
     WHEN 'Presentes'              THEN 'Gifts'
     WHEN 'Roupas'                 THEN 'Clothing'
     WHEN 'Saúde'                  THEN 'Health'
     WHEN 'Transporte'             THEN 'Transport'
     WHEN 'Salário'                THEN 'Salary'
     WHEN 'Vendas'                 THEN 'Sales'
     WHEN 'Outras receitas'        THEN 'Other Income'
     WHEN 'Outras despesas'        THEN 'Other Expenses'
     ELSE name
   END;
