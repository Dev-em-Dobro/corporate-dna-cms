# Cadastro de eventos e insights

Entre no CMS com uma conta autorizada. Na coleção Events ou Insights, crie uma entrada, informe o slug em inglês e preencha os campos obrigatórios. Salvar mantém o conteúdo em rascunho; publicar disponibiliza a entrada na API pública.

## Eventos

Preencha Title, Category, Event type e Date. Use Upcoming para eventos futuros e Past para eventos realizados. Summary aparece no cartão; Overview e Topics compõem os detalhes de eventos passados. Related links oferece os links de inscrição e materiais também no cartão de eventos futuros. Feature on events page prioriza o cartão entre os próximos eventos. Show the whole image preserva o enquadramento de flyers. A imagem é opcional e pode ser removida.

## Insights

Preencha Title e Body. Excerpt é o resumo da listagem. Cover é opcional. Resources permite anexar PDFs. Author approved controla a aprovação do nome do autor. Confira a página pública depois de publicar.

## Integração e validação

O site deve apontar CMS_URL para o CMS correto, com a chave de leitura configurada quando exigida. O webhook de publicação deve apontar para /api/revalidate no site, usando o mesmo CMS_WEBHOOK_SECRET. Não exponha as chaves no navegador.

Revisão local em 12/11/2026: nove testes unitários dos campos de eventos/insights e typecheck aprovados. Ajustados a remoção da imagem opcional e o campo de enquadramento. No site, ajustados os links de próximos eventos, a prioridade dos destaques e a preservação do tipo de evento.

Validação manual autorizada em produção em 12/11/2026: evento e insight temporários foram criados, publicados, despublicados e excluídos. Ambos apareceram na API pública enquanto publicados; após a limpeza, as APIs retornaram zero registros de teste. Insight sem imagem funcionou. Evento sem imagem retornou Invalid UUID na versão de produção; com mídia existente, salvou e publicou. A correção de imagem opcional está nesta branch.

Pendente: atualização do site público. Os registros publicados na API não apareceram nas listagens do site durante a conferência. Verificar CMS_URL, chave de leitura e webhook no ambiente implantado antes de aprovar a entrega. As conexões locais disponíveis não permitiram consultar a configuração dos webhooks. Não foi validada edição de conteúdo já publicado. Os testes automatizados de integração continuam sem banco isolado configurado.
