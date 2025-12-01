<?php
// só pide ser acessado pelo método GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido. Use GET.']);
    exit;
}
// inclusão do controlador
require_once __DIR__ . '/../sources/controllers/transc_controller.php';

// headers para que o front-end acesse o back-end
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// instancia o controlador
$controller = new TransacaoController();

// chama o método que faz o trabalho
$controller->listarTransacoes();
?>