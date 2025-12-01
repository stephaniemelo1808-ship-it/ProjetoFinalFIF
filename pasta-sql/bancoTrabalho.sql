CREATE DATABASE IF NOT EXISTS bancoTrabalho;
USE bancoTrabalho;

CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 'INT AUTO_INCREMENT' é o padrão MySQL
    tipo_usuario VARCHAR(2) NOT NULL CHECK (tipo_usuario IN ('pf', 'pj')),
    nome VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    documento VARCHAR(18),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Contas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome_banco VARCHAR(100) NOT NULL,
    tipo_conta VARCHAR(20) NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca')),
    saldo_inicial DECIMAL(10, 2) DEFAULT 0.00, -- 'DECIMAL' é melhor para dinheiro no MySQL
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_contas_usuarios
    FOREIGN KEY (usuario_id) 
    REFERENCES Usuarios(id)
    ON DELETE CASCADE
);

CREATE TABLE Transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
    tipo_transacao VARCHAR(10) NOT NULL CHECK (tipo_transacao IN ('receita', 'despesa')),
    data_transacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    categoria VARCHAR(50),
    tipo_perfil VARCHAR(2) NOT NULL CHECK (tipo_perfil IN ('pf', 'pj')),
    
    CONSTRAINT fk_transacoes_usuarios
    FOREIGN KEY (usuario_id) 
    REFERENCES Usuarios(id)
    ON DELETE CASCADE
);



INSERT INTO Usuarios (tipo_usuario, nome, email, senha_hash, telefone, documento) 
VALUES 
('pf', 'Roberto Almeida', 'roberto@email.com', 'hash12345', '11988887777', '123.456.789-00'),
('pj', 'Tech Soluções Ltda', 'contato@tech.com', 'hash67890', '1133334444', '12.345.678/0001-99'),
('pf', 'Carla Dias', 'carla@email.com', 'hashabcde', '21999998888', '987.654.321-11');


INSERT INTO Contas (usuario_id, nome_banco, tipo_conta, saldo_inicial) 
VALUES 
(1, 'Banco Nubank', 'corrente', 150.00),
(2, 'Banco Itaú', 'corrente', 15000.00),
(3, 'Caixa Econômica', 'poupanca', 500.50);


INSERT INTO Transacoes (usuario_id, descricao, valor, tipo_transacao, categoria, tipo_perfil, data_transacao) 
VALUES 
(1, 'Salário Mensal', 4500.00, 'receita', 'Salário', 'pf', '2025-11-01'),
(2, 'Pagamento Aluguel', 3200.00, 'despesa', 'Escritório', 'pj', '2025-11-05'),
(3, 'Compras Supermercado', 850.75, 'despesa', 'Alimentação', 'pf', '2025-11-10');

SELECT * FROM Usuarios;
SELECT * FROM Contas;
SELECT * FROM Transacoes;


-- DELETE FROM Transacoes;
-- DELETE FROM Contas;
-- DELETE FROM Usuarios;
