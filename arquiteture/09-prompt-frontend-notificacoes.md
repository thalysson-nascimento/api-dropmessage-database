# Prompt para adaptar o frontend

Adapte o frontend às notificações de reações e comentários do chat global, preservando os fluxos existentes. Examine primeiro a arquitetura, os serviços HTTP/Socket.IO e a tela de notificações do projeto.

Contrato do backend:
- GET /notification, autenticado com o JWT atual, retorna { subscription, items }. Notificações do chat global usam type="LIKE" ou "COMMENT", actors, target={ id: ID da mensagem, type:"global-chat", thumbnailUrl:null } e meta.emotion ou meta.commentText. Preserve o tratamento dos demais tipos/destinos.
- GET /notification marca todas as notificações do usuário como lidas. Consulte esse endpoint ao abrir/atualizar a tela; evite usá-lo em segundo plano com a tela fechada.
- GET /notification/unread-count retorna { count, hasUnread } e deve sincronizar o contador na inicialização/reconexão.
- Socket.IO autentica pelo auth.token e entrega notification:new { notificationId } e notification:unread { count, hasUnread } na sala privada definida pelo servidor. Atualize o contador pelo valor recebido, sem incrementar também no evento new. Com a tela aberta, atualize a lista ao receber new; trate duplicações e remova listeners no logout/desmontagem. Não entre em salas de outros usuários nem gere notificações a partir dos eventos públicos global-chat:*.

Implemente:
1. Exibir quem reagiu e a emoção, ou quem comentou e o texto do comentário. Renderizar conteúdo e nomes como texto escapado.
2. Ao tocar numa notificação com target.type="global-chat", abrir o chat e localizar/destacar target.id. Respeitar a paginação existente por cursor (GET /global-chat, páginas de até 20), sem presumir que a mensagem esteja na primeira página. Tratar mensagem removida/expirada com aviso amigável.
3. Preservar imagens de visualização única: não obter/exibir miniaturas nem abrir/consumir a imagem automaticamente pelo toque na notificação; manter a ação explícita de abertura existente. Fotos continuam sem comentários; ações próprias e remoções de reação não geram notificações.
4. Preservar uploads multipart no campo file, com limite de 5 MB. O backend aceita JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF e AVIF e rejeita outros arquivos. Mostrar erros de validação do servidor de forma clara; a validação local é apenas auxiliar.
5. Testar lista, contador, navegação para mensagem fora da primeira página, reconexão/logout, eventos repetidos, mensagem removida e privacidade de visualização única. Não alterar fluxos de match, notificações antigas, chat privado ou regras de assinatura.

Implemente as alterações no projeto e informe os arquivos alterados e os testes executados.
