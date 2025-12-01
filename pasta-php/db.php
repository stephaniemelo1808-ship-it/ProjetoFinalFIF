<?php

function connect_db() {
    // inserir os dados para conectar o banco
    $host = 'localhost';
    $db   = 'seu_banco';
    $user = 'root';
    $pass = 'senha';

    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (\PDOException $e) {
        // Logar o erro em vez de imprimir! E matar o script.
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno de conexão com o banco de dados.']);
        exit;
    }
}
