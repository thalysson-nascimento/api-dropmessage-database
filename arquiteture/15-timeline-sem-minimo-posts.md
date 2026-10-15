# Timeline sem quantidade mínima — GET /post-message

## Diagnóstico e ajuste

A antiga constante MINIMO_POST_MESSAGE_SHOW_VIDEO_REWARD=4 não bloqueava diretamente as publicações: controlava a inclusão do cartão de publicidade quando a página tinha mais de quatro posts. O bloqueio real era posts.slice(0, availableLikes), que escondia parte da página ou todas as fotos quando o saldo de curtidas acabava.

A listagem agora devolve todos os posts elegíveis da página desde uma única publicação. O saldo de curtidas continua sendo validado no POST /like-post-message; este ajuste não concede curtidas extras nem modifica assinaturas, recompensas, notificações ou matches. A listagem não usa mais os saldos countLikePostMessage/rewardLikesAvailable para limitar fotos.

O cartão WATCH_VIDEO + AI_SUGGESTION pode aparecer em páginas com pelo menos uma publicação para contas gratuitas que ainda podem assistir recompensas. Páginas sem publicações e assinantes continuam recebendo AI_SUGGESTION. O contador de vídeos é comparado como número; valores inválidos ou negativos não habilitam a recompensa. Foram removidos a consulta duplicada da assinatura e o limite mínimo antigo. A assinatura mais recente é usada com ordenação determinística; active/trialing/past_due mantêm o acesso atual aos dados de localização.

A ordenação dos posts usa createdAt DESC e id DESC para estabilizar empates. Contagem e busca usam os mesmos filtros de elegibilidade. page e limit são inteiros positivos, limit até 100 (padrões: page=1 e limit=10); valores inválidos recebem 400. O limite de página não é uma quantidade mínima de publicações.

## Contrato preservado

GET /post-message?page=1&limit=10, com Bearer JWT, mantém:

{ page, totalPages, totalItems, interests, type: ["POST"], items }

items continua misturando cards POST e recomendações AI_SUGGESTION/WATCH_VIDEO. totalItems/totalPages contam somente publicações, não cartões de recomendação. Uma única foto geralmente produz dois itens: o POST e o cartão de recomendação. Uma lista sem fotos pode conter apenas a recomendação; items.length não é a quantidade de posts.

A expiração continua baseada em expirationTimer > agora e isExpired=false: mesmo se o listener Redis atrasar, o endpoint deixa de listar o post vencido. A publicação fica elegível assim que o upload direto é confirmado e o post é persistido; PENDING não é publicado. O endpoint não é uma assinatura em tempo real: uma tela aberta precisa refazer a consulta para receber novas publicações.

Preservados os filtros atuais: somente outros autores, contas ativas, interesses do visitante e exclusão de posts já curtidos, recusados ou comentados por ele. A própria publicação continua na área de posts do usuário (GET /user-post-message); não foi inserida artificialmente na timeline de descoberta do autor. Nenhuma migration nem alteração em dados existentes.

## Verificação do frontend e prompt de adaptação

O frontend local usa GET /post-message com page e limit=10 e tipa o mesmo envelope. Não precisa mudar a URL nem os campos para exibir uma única publicação. No entanto, o swiper atual avança e marca o post para remoção antes de aguardar o resultado da curtida; sua fila trata todo next como sucesso e ignora mustVideoWatch/awaitLikePostMessage. Com a timeline visível mesmo sem saldo, é necessário respeitar esse resultado.

Prompt para o frontend:

Revise PostMessageComponent, PostMessageService e SwiperContainerComponent para o contrato atual de GET /post-message. Preserve o layout e os fluxos de recompensa, assinatura, comentários, publicidade e publicação direta.

1. Renderize cada item type contendo POST, mesmo que só exista uma foto na página. Não condicione a timeline a quatro posts, ao saldo de curtidas ou a items.length. Para contar fotos, filtre por type.includes('POST'); totalItems também conta apenas fotos.
2. Preserve os cartões de recomendação. Agora WATCH_VIDEO pode aparecer junto de apenas uma foto. Não confundir AI_SUGGESTION isolado com uma publicação; evite duplicar cartões ao juntar páginas. Use page/totalPages para encerrar paginação, sem contar cards extras como posts.
3. A visualização da timeline não consome curtidas. No clique de curtir, aguarde POST /like-post-message antes de confirmar/remover/avançar o card. Se mustVideoWatch=true ou type contém WATCH_VIDEO, abra o fluxo de recompensa e mantenha o post. Se awaitLikePostMessage=true, respeite o bloqueio/renovação sem marcar a curtida como concluída. Somente trate a resposta como curtida aceita quando os indicadores atuais autorizarem. Não use HTTP 200 isoladamente como sucesso de curtida, nem crie curtida local sem confirmação. Desfaça estado pendente em falhas e impeça duplicação de cliques.
4. Ao voltar à tela/reconectar e após publicação confirmada, recarregue a primeira página e deduplique IDs. O GET passa a listar novas publicações assim que elas são confirmadas; uma resposta já carregada não muda sozinha. Não criar um listener de evento inexistente nem inserir o próprio post na descoberta se a API o exclui.
5. Remova fotos vencidas pelo expirationTimer e respeite post-expired e exclusões existentes. Refazer a consulta deve remover posts vencidos mesmo se o evento não chegou. Não estender o prazo da imagem nem afetar a leitura única dos chats.
6. Mantenha page/limit inteiros positivos e limit entre 1 e 100. Exiba erro recuperável para 400 e reinicie a paginação em refresh sem misturar respostas antigas.
7. Teste uma conta visitante com 1, 2, 3 e 4 posts elegíveis, saldo de curtidas zero, publicidade disponível/esgotada, assinatura ativa, timeline vazia e expiração durante a exibição. Use outro usuário elegível para ver uma publicação nova: o autor continua consultando seus próprios posts na tela apropriada. Verifique que like/comentário/match/recompensa só mudam após confirmação do servidor.

Para compilar o frontend pelo PowerShell:

    cd C:\Users\thalysson\projetos\app-dropmessage
    npm run build:prod

A compilação verifica tipos/templates; ela não substitui os testes de comportamento acima. Nenhum arquivo do frontend foi editado nesta tarefa.
