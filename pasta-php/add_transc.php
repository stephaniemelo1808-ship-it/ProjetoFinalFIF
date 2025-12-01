<?php
// inclui o controlador
// O __DIR__ chama o controlador 
require_once __DIR__ . '/../sources/controllers/transc_controller.php';

// define que este script só pode ser acessado via post
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // se não, retorna o erro http 405
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;// encerra o script para evitar que o código continue sendo executado
}
// os headers permitem que o front-end acesse o back-end
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
// instancia o controlador
$controller = new TransacaoController();

// chama o método que faz o trabalho (validação e salvamento no banco de dados)
$controller->adicionarTransacao();
?>