<?php
// chama a conexão com o banco de dados
require_once __DIR__ . '/../../config./db.php'; 

class TransacaoModel {
    private $db;

    // construtor que estabelece a conexão com o banco de dados
    public function __construct() {
        // chama a função do banco de dados para formar conexão
        $this->db = connect_db();
    }

    // função para salvar uma nova transação no banco de dados
    public function salvarTransacao(array $dados) {
        $sql = "INSERT INTO transacoes (id_usuario, tipo, valor, data, descricao, id_categoria) 
                VALUES (:id_usuario, :tipo, :valor, :data, :descricao, :id_categoria)";
        //o try catch é para capturar erros
        try {
            // o stmt  é uma var que armazena a instrução sql
            $stmt = $this->db->prepare($sql);
            // retorna true ou false
            return $stmt->execute($dados);

        } catch (PDOException $e) {
             return false;
        }
    }

    // função para buscar os dados da  transação
    public function listarTransacoes() {
        $id_usuario = 1; 
        $transacoes = $this->transacaoModel->buscarTransacoesPorUsuario($id_usuario);

        // condição para verificar se a busca deu certo
        if ($transacoes !== null) {
            // se der certo retorna uma mensagem de sucesso em JSON
            $this->responderJson([
                'sucesso' => true, 
                'mensagem' => 'Transações carregadas com sucesso.',
                'dados' => $transacoes //o array de transações
            ]);
        } else {
            // se der pau no carregamento, retorna uma mensagem de erro
            $this->responderJson(['sucesso' => false, 'mensagem' => 'Erro interno ao buscar dados.'], 500);
        }
    }

    // função para atualizar uma transação existente
    public function editarTransacao() {
        $id_usuario = 1; 
        $id_transacao = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

        // coleta os novos dados igual no adicionar
        $novos_dados = [
            'id_usuario'    => $id_usuario,
            'tipo'          => filter_input(INPUT_POST, 'tipo', FILTER_SANITIZE_STRING), 
            'valor'         => filter_input(INPUT_POST, 'valor', FILTER_VALIDATE_FLOAT),
            'data'          => filter_input(INPUT_POST, 'data', FILTER_SANITIZE_STRING),
            'descricao'     => filter_input(INPUT_POST, 'descricao', FILTER_SANITIZE_STRING),
            'id_categoria'  => filter_input(INPUT_POST, 'id_categoria', FILTER_VALIDATE_INT) 
        ];

        //validaçãozinha que verifica se está tudo ok 
        if (!$id_transacao || !$novos_dados['valor'] || $novos_dados['valor'] <= 0) {
            $this->responderJson(['sucesso' => false, 'mensagem' => 'ID da transação ou dados inválidos.'], 400);
            return;
        }
        // atualiza a transação no banco de dados
        $sucesso = $this->transacaoModel->atualizarTransacao($id_transacao, $novos_dados);

        // passa a resposta ao front-end
        if ($sucesso) {
            // verifica se foi feita a alteração de alguma linha, se não, retorna uma mensagem de erro
            if ($this->transacaoModel->db->rowCount() > 0) {
                $this->responderJson(['sucesso' => true, 'mensagem' => 'Transação atualizada com sucesso!']);
            } else {
                $this->responderJson(['sucesso' => false, 'mensagem' => 'Transação não encontrada ou nenhum dado alterado.'], 404);
            }
        } else {
            $this->responderJson(['sucesso' => false, 'mensagem' => 'Erro interno ao atualizar a transação.'], 500);
        }
    }

    // função para deletar 
    public function excluirTransacao(int $id_transacao, int $id_usuario) {
        $sql = "DELETE FROM transacoes 
                WHERE id = :id_transacao 
                AND id_usuario = :id_usuario";
        // o try catch captura erros 
        try {
            $stmt = $this->db->prepare($sql);// prepara a instrução sql

            // passa os valores para o stmt
            return $stmt->execute([
                'id_transacao' => $id_transacao,
                'id_usuario' => $id_usuario
            ]);

        } catch (PDOException $e) {
             return false;
        }
    }
}