-- Script de inicialização do banco de dados PostgreSQL
-- Barbearia SaaS

-- Comandos para criar o banco de dados (geralmente executado por um superusuário do PostgreSQL)
-- CREATE DATABASE barbearia_saas;

-- É necessário conectar ao banco de dados 'barbearia_saas' antes de executar o restante do script.

-- Habilita a extensão 'uuid-ossp' para geração de UUIDs, se ainda não estiver habilitada.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criação da Tabela 'barbearias'
-- Armazena informações sobre cada barbearia registrada no sistema.
CREATE TABLE IF NOT EXISTS barbearias (
    id SERIAL PRIMARY KEY, -- Chave primária auto-incrementável.
    nome VARCHAR(100) NOT NULL, -- Nome da barbearia.
    endereco VARCHAR(200) NOT NULL, -- Endereço físico da barbearia.
    telefone VARCHAR(20) NOT NULL, -- Telefone de contato da barbearia.
    email VARCHAR(100) NOT NULL UNIQUE, -- Email da barbearia, deve ser único.
    logo VARCHAR(500), -- URL ou caminho para o logo da barbearia (opcional).
    codigo_convite VARCHAR(10) NOT NULL UNIQUE, -- Código único para convite de novos usuários para esta barbearia.
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Data e hora de criação do registro, com fuso horário.
);

-- Criação da Tabela 'usuarios'
-- Armazena informações de todos os usuários do sistema: clientes, barbeiros e gerentes.
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY, -- Chave primária auto-incrementável.
    nome VARCHAR(100) NOT NULL, -- Nome completo do usuário.
    email VARCHAR(100) NOT NULL UNIQUE, -- Email do usuário, deve ser único.
    senha_hash VARCHAR(255) NOT NULL, -- Hash da senha do usuário (para autenticação local).
    tipo_usuario INTEGER NOT NULL CHECK (tipo_usuario IN (1, 2, 3)), -- Tipo de usuário: 1=Cliente, 2=Barbeiro, 3=Gerente.
    barbearia_id INTEGER REFERENCES barbearias(id) ON DELETE RESTRICT, -- Chave estrangeira para a tabela 'barbearias' (para barbeiros e gerentes).
    foto VARCHAR(500), -- URL ou caminho para a foto de perfil (opcional).
    especialidades VARCHAR(500), -- Especialidades do barbeiro (para tipo_usuario=2).
    descricao VARCHAR(1000), -- Descrição ou biografia (para barbeiros).
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Data e hora de criação do registro, com fuso horário.
);

-- Criação da Tabela 'horarios_disponiveis'
-- Armazena os horários que cada barbeiro tem disponível para agendamentos.
CREATE TABLE IF NOT EXISTS horarios_disponiveis (
    id SERIAL PRIMARY KEY, -- Chave primária auto-incrementável.
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL, -- Data e hora do horário disponível.
    barbeiro_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, -- Chave estrangeira para o barbeiro associado.
    esta_disponivel BOOLEAN NOT NULL DEFAULT TRUE, -- Indica se o horário está disponível (TRUE) ou ocupado (FALSE).
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Data e hora de criação do registro, com fuso horário.
    UNIQUE(barbeiro_id, data_hora) -- Garante que um barbeiro não tenha horários duplicados.
);

-- Criação da Tabela 'agendamentos'
-- Armazena todos os agendamentos realizados no sistema.
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY, -- Chave primária auto-incrementável.
    cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT, -- Chave estrangeira para o cliente que fez o agendamento.
    barbeiro_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT, -- Chave estrangeira para o barbeiro agendado.
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL, -- Data e hora do agendamento.
    observacoes VARCHAR(500), -- Observações adicionais sobre o agendamento (opcional).
    status INTEGER NOT NULL DEFAULT 1 CHECK (status IN (1, 2, 3)), -- Status do agendamento: 1=Confirmado, 2=Cancelado, 3=Realizado.
    barbearia_id INTEGER NOT NULL REFERENCES barbearias(id) ON DELETE RESTRICT, -- Chave estrangeira para a barbearia do agendamento.
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Data e hora de criação do registro, com fuso horário.
    data_atualizacao TIMESTAMP WITH TIME ZONE -- Data e hora da última atualização do registro.
);

-- Criação de Índices para melhor performance de consultas.
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email); -- Índice para buscas rápidas por email de usuário.
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_barbearia ON usuarios(tipo_usuario, barbearia_id); -- Índice para buscas por tipo de usuário e barbearia.
CREATE INDEX IF NOT EXISTS idx_horarios_barbeiro_data ON horarios_disponiveis(barbeiro_id, data_hora); -- Índice para buscas de horários por barbeiro e data.
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data ON agendamentos(barbeiro_id, data_hora); -- Índice para buscas de agendamentos por barbeiro e data.
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbearia_data ON agendamentos(barbearia_id, data_hora); -- Índice para buscas de agendamentos por barbearia e data.
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id); -- Índice para buscas de agendamentos por cliente.
CREATE INDEX IF NOT EXISTS idx_barbearias_codigo ON barbearias(codigo_convite); -- Índice para buscas rápidas por código de convite da barbearia.

-- Função para gerar um código de convite único para barbearias.
CREATE OR REPLACE FUNCTION gerar_codigo_convite()
RETURNS VARCHAR(8) AS $$
DECLARE
    codigo VARCHAR(8);
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gera um código aleatório de 8 caracteres, combinando MD5 e números aleatórios.
        codigo := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) ||
            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
        );
        
        -- Verifica se o código gerado já existe na tabela 'barbearias'.
        SELECT EXISTS(SELECT 1 FROM barbearias WHERE codigo_convite = codigo) INTO existe;
        
        -- Se o código não existe, sai do loop.
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN codigo; -- Retorna o código único gerado.
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar o código de convite automaticamente antes de inserir uma nova barbearia.
CREATE OR REPLACE FUNCTION trigger_gerar_codigo_convite()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o código de convite não for fornecido, gera um novo.
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

-- Função para atualizar a coluna 'data_atualizacao' automaticamente em agendamentos.
CREATE OR REPLACE FUNCTION trigger_atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao := CURRENT_TIMESTAMP; -- Define a data de atualização para o momento atual.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_update_agendamento
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_data_atualizacao();

-- Dados de exemplo (opcional) para popular o banco de dados para testes ou demonstração.
-- Inserir uma barbearia de exemplo.
INSERT INTO barbearias (nome, endereco, telefone, email, codigo_convite) 
VALUES ('Barbearia Exemplo', 'Rua das Flores, 123', '(11) 99999-9999', 'contato@barbeariaexemplo.com', 'DEMO1234')
ON CONFLICT (email) DO NOTHING; -- Evita erro se o email já existir.

-- Inserir um gerente de exemplo (senha: 123456 - hash pré-calculado).
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, barbearia_id)
SELECT 'Gerente Exemplo', 'gerente@barbeariaexemplo.com', '$2a$11$8K1p/a0dURXAm7QiK41uLOhHiaDk.Izzm7y7Qx8Q8qjU8qjU8qjU8q', 3, b.id
FROM barbearias b WHERE b.email = 'contato@barbeariaexemplo.com'
ON CONFLICT (email) DO NOTHING; -- Evita erro se o email já existir.

-- Inserir um barbeiro de exemplo (senha: 123456 - hash pré-calculado).
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, barbearia_id, especialidades, descricao)
SELECT 'João Barbeiro', 'joao@barbeariaexemplo.com', '$2a$11$8K1p/a0dURXAm7QiK41uLOhHiaDk.Izzm7y7Qx8Q8qjU8qjU8qjU8q', 2, b.id, 'Corte masculino, Barba', 'Barbeiro experiente com 10 anos de profissão'
FROM barbearias b WHERE b.email = 'contato@barbeariaexemplo.com'
ON CONFLICT (email) DO NOTHING; -- Evita erro se o email já existir.

-- Inserir um cliente de exemplo (senha: 123456 - hash pré-calculado).
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario)
VALUES ('Cliente Exemplo', 'cliente@exemplo.com', '$2a$11$8K1p/a0dURXAm7QiK41uLOhHiaDk.Izzm7y7Qx8Q8qjU8qjU8qjU8q', 1)
ON CONFLICT (email) DO NOTHING; -- Evita erro se o email já existir.

-- Comentários adicionais sobre as tabelas (metadados).
COMMENT ON TABLE barbearias IS 'Tabela que armazena informações das barbearias cadastradas no sistema';
COMMENT ON TABLE usuarios IS 'Tabela que armazena todos os usuários do sistema (clientes, barbeiros e gerentes)';
COMMENT ON TABLE horarios_disponiveis IS 'Tabela que armazena os horários disponíveis de cada barbeiro';
COMMENT ON TABLE agendamentos IS 'Tabela que armazena todos os agendamentos realizados no sistema';

COMMENT ON COLUMN usuarios.tipo_usuario IS '1=Cliente, 2=Barbeiro, 3=Gerente';
COMMENT ON COLUMN agendamentos.status IS '1=Confirmado, 2=Cancelado, 3=Realizado';
COMMENT ON COLUMN barbearias.codigo_convite IS 'Código único usado pelos barbeiros para se vincular à barbearia';


