<?php
// verifica se o método de requisição é post, se não for, retorna o erro http 405 e a mensagem em json
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido. Use POST.']);
    exit;
}
//inclui o controlador
require_once __DIR__ . '/../sources/controllers/transc_controller.php';

// headers para que o  front-end acesse o back-end
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// instancia o controlador
$controller = new TransacaoController();
// chama o método que faz o trabalho
$controller->deletarTransacao();
?>