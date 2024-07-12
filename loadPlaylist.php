<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $url = filter_input(INPUT_POST, 'url', FILTER_SANITIZE_URL);

    if (filter_var($url, FILTER_VALIDATE_URL)) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Para seguir redirecionamentos
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Para ignorar a verificação SSL, se necessário

        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($content !== false && $httpCode == 200) {
            echo json_encode(['success' => true, 'content' => $content]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to fetch playlist from the URL.', 'error' => $curlError]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid URL.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
?>
