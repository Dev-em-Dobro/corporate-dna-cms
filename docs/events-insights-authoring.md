# Cadastro de eventos e insights

Entre no CMS com uma conta autorizada. Na coleção Events ou Insights, crie uma entrada, informe o slug em inglês e preencha os campos obrigatórios. Salvar mantém o conteúdo em rascunho; publicar disponibiliza a entrada na API pública.

## Eventos

Preencha Title, Category, Event type e Date. Use Upcoming para eventos futuros e Past para eventos realizados. Summary aparece no cartão; Overview e Topics compõem os detalhes de eventos passados. Related links oferece os links de inscrição e materiais também no cartão de eventos futuros. Feature on events page prioriza o cartão entre os próximos eventos. Show the whole image preserva o enquadramento de flyers. A imagem é opcional e pode ser removida.

## Insights

Preencha Title e Body. Excerpt é o resumo da listagem. Cover é opcional. Resources permite anexar PDFs. Author approved controla a aprovação do nome do autor. Confira a página pública depois de publicar.

## Integração e validação

O site deve apontar CMS_URL para o CMS correto, com a chave de leitura configurada quando exigida. O webhook de publicação deve apontar para /api/revalidate no site, usando o mesmo CMS_WEBHOOK_SECRET. Não exponha as chaves no navegador.

Revisão local em 12/11/2026: nove testes unitários dos campos de eventos/insights e typecheck aprovados. Ajustados a remoção da imagem opcional e o campo de enquadramento. No site, ajustados os links de próximos eventos, a prioridade dos destaques e a preservação do tipo de evento.

Pendente: comprovar criar, salvar rascunho, publicar, editar e despublicar um evento e um insight em banco isolado, verificando a atualização do site. A conexão de testes não está configurada; as suítes de integração falharam ao inicializar o banco (Invalid URL). Isso não comprova prontidão operacional. Não foram criados dados de teste em produção.
