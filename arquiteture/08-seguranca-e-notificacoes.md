# Análise de segurança e notificações

Data: 09/10/2026. Escopo: revisão estática de rotas, autenticação HTTP/socket, notificações e uploads; auditoria das dependências instaladas de produção. Não houve teste de invasão, inspeção de infraestrutura de produção nem chamadas reais ao Cloudinary. Após autorização explícita, o banco configurado foi consultado para conferir e aplicar exclusivamente a migration de notificações. As alterações locais existentes no chat foram preservadas.

## Correções implementadas

- Reações e comentários do chat global geram notificações privadas para o autor da mensagem. Destinatário obtido do banco, ator do JWT; ações próprias e remoções não notificam. Interação e notificação são gravadas na mesma transação. Consultas de notificações permanecem filtradas pelo destinatário autenticado.
- Vínculo separado globalChatMessageId; messageId permanece exclusivo de mensagens privadas. Os tipos LIKE/COMMENT continuam iguais. Comentários globais guardam o texto exato da ação, sem buscar o comentário mais recente do ator.
- Falha do socket não desfaz uma notificação já persistida. Não existe mecanismo de reenvio do evento; a consulta HTTP continua disponível.
- Nenhuma miniatura de mídia global nas notificações, evitando revelar fotos de visualização única.
- Removidos logs com conteúdo de comentários no processamento das notificações.
- Multer atualizado de 1.4.5-lts.2 para 2.4.0. A versão instalada exata consta no lockfile. Foram preservados os exports existentes de upload.
- Rotas ativas de avatar, publicações, chat global e privado validam os bytes antes do controller. Os dois serviços de upload autenticado também validam.
- Mantido o limite de 5 MB; adicionados limites de uma imagem, 50 campos, 51 partes, 64 KB por campo e 100 caracteres por nome de campo multipart.
- Arquivos permanecem em memória até envio ao Cloudinary. O nome original não é usado como caminho de escrita nos fluxos ativos.

## Limites das proteções de upload

São aceitos JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF e AVIF. Clientes com application/octet-stream continuam funcionando se o conteúdo tiver assinatura reconhecida; MIME normalizado ao conteúdo. Outros formatos de imagem antes aceitos implicitamente ficam recusados. Validar os formatos usados pelos aplicativos em homologação.

A identificação por assinatura não garante integridade completa, ausência de malware, ausência de arquivos poliglotas nem limite de pixels descompactados. O processamento completo continua no Cloudinary (resource_type=image), sem extrair arquivos ou executar conteúdo no backend. Acrescentar decodificação/regravação ou antivírus exige avaliar animações, HEIC/AVIF, metadados e custos, para preservar comportamento.

## Riscos que exigem tratamento separado

| Prioridade | Evidência | Implicação e ação sugerida |
| --- | --- | --- |
| Alta | rateLimit está criado, mas app.use(limitRequest) está comentado em src/server.ts | Uploads concorrentes podem consumir memória, banda e cota Cloudinary. Definir quotas por usuário e limites no proxy após medir uso legítimo. Não foi ativado um limite global sem avaliar chat/polling. |
| Alta | URLs assinadas getImageUrl não possuem expiração curta | Assinatura autentica a URL, mas não impede reutilização por quem já a recebeu. Fotos globais de visualização única precisam de entrega com prazo curto e validação integrada. O contrato existente foi preservado nesta tarefa. |
| Média | Texto livre em mensagens/reação e nome original devolvido ao cliente | Renderizar como texto escapado no frontend; não inserir em HTML. Não é possível confirmar XSS sem o código cliente. |
| Média | Listagem de notificações sem paginação; leitura marca todas como lidas | Volume crescente e possível corrida com notificações novas. Evoluir paginação e marcar apenas registros efetivamente apresentados mediante contrato do frontend. |
| Média | Configurações legadas de armazenamento local confiam em MIME e nome original; exports diretos Cloudinary não usam a validação binária nova | Não há rota ativa usando esses fluxos conforme buscas em src. Auditar antes de reutilizar; todas as rotas ativas usam upload em memória mais validação. |
| Média | Middleware global de erro retorna mensagens de Error e status 400 | Pode expor detalhes de serviços e uniformizar erros indevidamente. Rever padronização com testes dos contratos existentes. |

## Dependências

Após a atualização do Multer, npm audit --omit=dev reportou **31 alertas: 3 críticos, 19 altos e 9 moderados**. Isso representa alertas de pacotes e cadeias transitivas, não 31 explorações confirmadas da API. O resultado é uma fotografia das versões instaladas e dos avisos disponíveis na data da consulta.

Críticos: handlebars, proxy-addr e tar. Handlebars merece prioridade na geração de templates; proxy-addr exige verificar a configuração real de proxy; tar aparece na cadeia de ferramentas de instalação do bcrypt, sem evidência de extração de arquivos enviados por usuários nas rotas atuais. Avaliar exposição individual antes de atribuir impacto remoto.

Não foi executado audit fix --force. Atualizações de Express, Axios, Socket.IO, Handlebars e dependências transitivas, além das mudanças principais sugeridas para bcrypt/ngrok e da cadeia Cloudinary, devem ser verificadas em homologação.

| Pacote | Severidade | Dependência | Indicação do auditor |
| --- | --- | --- | --- |
| @mapbox/node-pre-gyp | high | transitiva | mudança de versão principal indicada |
| ajv | moderate | transitiva | correção disponível |
| axios | high | direta | correção disponível |
| bcrypt | high | direta | mudança de versão principal indicada |
| body-parser | moderate | transitiva | correção disponível |
| brace-expansion | high | transitiva | correção disponível |
| cloudinary | high | direta | mudança de versão principal indicada |
| engine.io | high | transitiva | correção disponível |
| express | moderate | direta | correção disponível |
| extract-zip | high | transitiva | mudança de versão principal indicada |
| flatted | high | transitiva | correção disponível |
| follow-redirects | moderate | transitiva | correção disponível |
| form-data | high | transitiva | correção disponível |
| gaxios | moderate | transitiva | correção disponível |
| handlebars | critical | direta | correção disponível |
| http-cache-semantics | high | transitiva | correção disponível |
| joi | high | direta | correção disponível |
| js-yaml | high | transitiva | correção disponível |
| lodash | high | transitiva | correção disponível |
| minimatch | high | transitiva | correção disponível |
| multer-storage-cloudinary | high | direta | mudança de versão principal indicada |
| ngrok | high | direta | mudança de versão principal indicada |
| path-to-regexp | high | transitiva | correção disponível |
| proxy-addr | critical | transitiva | correção disponível |
| qs | moderate | transitiva | correção disponível |
| socket.io-adapter | moderate | transitiva | correção disponível |
| socket.io-parser | high | transitiva | correção disponível |
| tar | critical | transitiva | mudança de versão principal indicada |
| uuid | moderate | transitiva | mudança de versão principal indicada |
| ws | high | transitiva | correção disponível |
| yaml | moderate | transitiva | correção disponível |

## Implantação e frontend

1. Aplicar a migration versionada 20261010000000_global_chat_notifications antes de subir o backend novo; gerar Prisma Client no build. A migration foi aplicada ao banco configurado após autorização explícita em 09/10/2026. Não restam migrations pendentes ou falhas.
2. O aplicativo deve usar os eventos privados existentes e atualizar a lista via GET /notification; navegar pelo target.type=global-chat e target.id. Não há frontend neste repositório para implementar a tela/navegação.
3. Validar upload real em Cloudinary, formatos usados pelos dispositivos e transações em PostgreSQL em homologação. Os testes locais simulam os serviços externos.

## Referências

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): limites, allowlist e validação em camadas; assinatura isolada não basta.
- [Express: correções de segurança de agosto de 2026](https://expressjs.com/en/blog/2026-08-31-security-releases/): correções de falhas de processamento multipart no Multer 2.3.0.
- Avisos individuais: consultar npm audit --omit=dev para URLs, versões afetadas e condições de exploração atuais.

## Verificação local

34 testes aprovados e verificação TypeScript sem erros. Prisma Client gerado com sucesso e diff sem erros de whitespace. A migration de notificações foi aplicada com sucesso: 254 clientes antes/depois e os mesmos identificadores, 28 notificações antes/depois e 2 mensagens globais antes/depois. Foram confirmadas as três colunas opcionais. A execução não alterou dados dos clientes. A migration utiliza transação, lock_timeout de 5 segundos e statement_timeout de 30 segundos. Entrega real de mídia e fluxos completos de interação permanecem pendentes de homologação.
