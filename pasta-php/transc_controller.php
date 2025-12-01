<?php
// inclui o modelo de transação para que o controlador possa acessar os métodos do banco de dados
require_once __DIR__ . '/../models/transc_model.php'; 
// classe controladora de transações
class TransacaoController {
    private $transacaoModel;
    // construtor que instancia o modelo de transação
    public function __construct() {
    // instancia o modelo para ter acesso aos métodos do banco de dados
        $this->transacaoModel = new TransacaoModel();
    }
   // função para adicionar uma nova transação
    public function adicionarTransacao() {
        $id_usuario = 1;
        $json_data = file_get_contents('php://input');
        $request_data = json_decode($json_data, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($request_data)) {
            $this->responderJson(['sucesso' => false, 'mensagem' => 'Formato JSON inválido.'], 400);
            return;
        }
        // coleta os dados da requisição       
        $dados = [
            'id_usuario'    => $id_usuario,
            'tipo'          => filter_input(INPUT_POST, 'tipo', FILTER_SANITIZE_STRING), // ex: 'Receita' ou 'Despesa'
            'valor'         => filter_input(INPUT_POST, 'valor', FILTER_VALIDATE_FLOAT),
            'data'          => filter_input(INPUT_POST, 'data', FILTER_SANITIZE_STRING), // formato 'YYYY-MM-DD'
            'descricao'     => filter_input(INPUT_POST, 'descricao', FILTER_SANITIZE_STRING),
            'id_categoria'  => filter_input(INPUT_POST, 'id_categoria', FILTER_VALIDATE_INT) 
        ];
        //validação dos dados
    if (!$dados['valor'] || $dados['valor'] <= 0 || !$dados['tipo'] ||        !$dados['id_usuario']) {
        $this->responderJson(['sucesso' => false, 'mensagem' => 'Dados inválidos ou incompletos.'], 400);// mensagem de erro se os dados forem inválidos
            return;
        }
        // parte do modelo que salva a transação no banco de dados
        $sucesso = $this->transacaoModel->salvarTransacao($dados);
        // resposta ao front-end
        if ($sucesso) {
            $this->responderJson(['sucesso' => true, 'mensagem' => 'Transação salva com sucesso!']);
        } else {
            // se retornar false, significa que houve um erro ao salvar a transação no banco de dados
            $this->responderJson(['sucesso' => false, 'mensagem' => 'Erro ao salvar a transação no banco de dados.'], 500);
        }
       
    }

    //função para responder ao front-end em formato json
    private function responderJson(array $data, int $httpCode = 200) {
        http_response_code($httpCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
     // função para listar todas as transações do usuário        
    public function listarTransacoes() {
        // ex de id de um usuário logado
        $id_usuario = 1; 
        // parte do modelo que busca as transações no banco de dados
        $transacoes = $this->transacaoModel->buscarTransacoesPorUsuario($id_usuario);
       // resposta ao front-end
        if ($transacoes !== null) {
            // se der certo, retorna o array de transações em json
            $this->responderJson([
                'sucesso' => true, 
                'mensagem' => 'Transações carregadas com sucesso.',
                'dados' => $transacoes // O array de transações
            ]);
        } else {
            // se der pau ao carregar, retorna uma mensagem de erro
            $this->responderJson(['sucesso' => false, 'mensagem' => 'Erro interno ao buscar dados.'], 500);
        }
    }
      // função para editar uma transação existente            
    public function editarTransacao() {
        //simula o id de um usuário logado
        $id_usuario = 1; 
        // coleta o id da transação que será editada via POST
        $id_transacao = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

        // coleta os novos dados do formulário
        $novos_dados = [
            'id_usuario'    => $id_usuario,
            'tipo'          => filter_input(INPUT_POST, 'tipo', FILTER_SANITIZE_STRING), 
            'valor'         => filter_input(INPUT_POST, 'valor', FILTER_VALIDATE_FLOAT),
            'data'          => filter_input(INPUT_POST, 'data', FILTER_SANITIZE_STRING),
            'descricao'     => filter_input(INPUT_POST, 'descricao', FILTER_SANITIZE_STRING),
            'id_categoria'  => filter_input(INPUT_POST, 'id_categoria', FILTER_VALIDATE_INT) 
        ];

        //validação dos dados pra ver se estão corretos
        if (!$id_transacao || !$novos_dados['valor'] || $novos_dados['valor'] <= 0) {
            $this->responderJson(['sucesso' => false, 'mensagem' => 'ID da transação ou dados inválidos.'], 400);
            return;
        }
        // o modelo atualiza a transação no banco de dados
        $sucesso = $this->transacaoModel->atualizarTransacao($id_transacao, $novos_dados);

        // resposta ao front-end de falha ou sucesso
        if ($sucesso) {
            // verifica se foi realmente alterada alguma linha, se não, retorna uma mensagem de erro
            if ($this->transacaoModel->db->rowCount() > 0) {
                $this->responderJson(['sucesso' => true, 'mensagem' => 'Transação atualizada com sucesso!']);
            } else {
                $this->responderJson(['sucesso' => false, 'mensagem' => 'Transação não encontrada ou nenhum dado alterado.'], 404);
            }
        } else {
            $this->responderJson(['sucesso' => false, 'mensagem' => 'Erro interno ao atualizar a transação.'], 500);
        }
    }

    // função para deletar uma transação 
    public function deletarTransacao() {
        //mesmo processo de simulação de id
        $id_usuario = 1; 
        // coleta o id da transação que será deletada via POS
        $id_transacao = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

        //validação dos dados
        if (!$id_transacao) {
            $this->responderJson(['sucesso' => false, 'mensagem' => 'ID da transação ausente ou inválido.'], 400);
            return;
        }

        // o modelo exclui a transação no banco de dados
        $sucesso = $this->transacaoModel->excluirTransacao($id_transacao, $id_usuario);

        // resposta ao front-end
        if ($sucesso) {
            // verifica se alguma linha foi realmente delatada, se não, retorna uma mensagem de erro
            if ($this->transacaoModel->db->rowCount() > 0) {
                $this->responderJson(['sucesso' => true, 'mensagem' => 'Transação excluída com sucesso!']);
            } else {
                $this->responderJson(['sucesso' => false, 'mensagem' => 'Transação não encontrada ou você não tem permissão para excluí-la.'], 404);
            }
        } else {
            $this->responderJson(['sucesso' => false, 'mensagem' => 'Erro interno ao excluir a transação.'], 500);
        }
    }
}