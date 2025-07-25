-- Script de inicialização do banco de dados PostgreSQL
-- Barbearia SaaS

-- Criar banco de dados (executar como superuser)
-- CREATE DATABASE barbearia_saas;

-- Conectar ao banco barbearia_saas antes de executar o resto

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela Barbearias
CREATE TABLE IF NOT EXISTS barbearias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    logo VARCHAR(500),
    codigo_convite VARCHAR(10) NOT NULL UNIQUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario INTEGER NOT NULL CHECK (tipo_usuario IN (1, 2, 3)), -- 1=Cliente, 2=Barbeiro, 3=Gerente
    barbearia_id INTEGER REFERENCES barbearias(id) ON DELETE RESTRICT,
    foto VARCHAR(500),
    especialidades VARCHAR(500),
    descricao VARCHAR(1000),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Horarios Disponiveis
CREATE TABLE IF NOT EXISTS horarios_disponiveis (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    barbeiro_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    esta_disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(barbeiro_id, data_hora)
);

-- Tabela Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    barbeiro_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    observacoes VARCHAR(500),
    status INTEGER NOT NULL DEFAULT 1 CHECK (status IN (1, 2, 3)), -- 1=Confirmado, 2=Cancelado, 3=Realizado
    barbearia_id INTEGER NOT NULL REFERENCES barbearias(id) ON DELETE RESTRICT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_barbearia ON usuarios(tipo_usuario, barbearia_id);
CREATE INDEX IF NOT EXISTS idx_horarios_barbeiro_data ON horarios_disponiveis(barbeiro_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data ON agendamentos(barbeiro_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbearia_data ON agendamentos(barbearia_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_barbearias_codigo ON barbearias(codigo_convite);

-- Função para gerar código de convite único
CREATE OR REPLACE FUNCTION gerar_codigo_convite()
RETURNS VARCHAR(8) AS $$
DECLARE
    codigo VARCHAR(8);
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gerar código aleatório de 8 caracteres
        codigo := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) ||
            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
        );
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM barbearias WHERE codigo_convite = codigo) INTO existe;
        
        -- Se não existe, sair do loop
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código de convite automaticamente
CREATE OR REPLACE FUNCTION trigger_gerar_codigo_convite()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_convite IS NULL OR NEW.codigo_convite = '' THEN
        NEW.codigo_convite := gerar_codigo_convite();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_barbearia
    BEFORE INSERT ON barbearias
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gerar_codigo_convite();

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION trigger_atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_update_agendamento
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_data_atualizacao();

-- Dados de exemplo (opcional)
-- Inserir uma barbearia de exemplo
INSERT INTO barbearias (nome, endereco, telefone, email, codigo_convite) 
VALUES ('Barbearia Exemplo', 'Rua das Flores, 123', '(11) 99999-9999', 'contato@barbeariaexemplo.com', 'DEMO1234')
ON CONFLICT (email) DO NOTHING;

-- Inserir um gerente de exemplo (senha: 123456)
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, barbearia_id)
SELECT 'Gerente Exemplo', 'gerente@barbeariaexemplo.com', '$2a$11$8K1p/a0dURXAm7QiK41uLOhHiaDk.Izzm7y7Qx8Q8qjU8qjU8qjU8q', 3, b.id
FROM barbearias b WHERE b.email = 'contato@barbeariaexemplo.com'
ON CONFLICT (email) DO NOTHING;

-- Inserir um barbeiro de exemplo (senha: 123456)
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, barbearia_id, especialidades, descricao)
SELECT 'João Barbeiro', 'joao@barbeariaexemplo.com', '$2a$11$8K1p/a0dURXAm7QiK41uLOhHiaDk.Izzm7y7Qx8Q8qjU8qjU8qjU8q', 2, b.id, 'Corte masculino, Barba', 'Barbeiro experiente com 10 anos de profissão'
FROM barbearias b WHERE b.email = 'contato@barbeariaexemplo.com'
ON CONFLICT (email) DO NOTHING;

-- Inserir um cliente de exemplo (senha: 123456)
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario)
VALUES ('Cliente Exemplo', 'cliente@exemplo.com', '$2a$11$8K1p/a0dURXAm7QiK41uLOhHiaDk.Izzm7y7Qx8Q8qjU8qjU8qjU8q', 1)
ON CONFLICT (email) DO NOTHING;

-- Comentários sobre as tabelas
COMMENT ON TABLE barbearias IS 'Tabela que armazena informações das barbearias cadastradas no sistema';
COMMENT ON TABLE usuarios IS 'Tabela que armazena todos os usuários do sistema (clientes, barbeiros e gerentes)';
COMMENT ON TABLE horarios_disponiveis IS 'Tabela que armazena os horários disponíveis de cada barbeiro';
COMMENT ON TABLE agendamentos IS 'Tabela que armazena todos os agendamentos realizados no sistema';

COMMENT ON COLUMN usuarios.tipo_usuario IS '1=Cliente, 2=Barbeiro, 3=Gerente';
COMMENT ON COLUMN agendamentos.status IS '1=Confirmado, 2=Cancelado, 3=Realizado';
COMMENT ON COLUMN barbearias.codigo_convite IS 'Código único usado pelos barbeiros para se vincular à barbearia';

