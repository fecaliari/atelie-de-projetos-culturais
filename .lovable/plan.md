# Ateliê Cultural — Plano de construção

Seu documento pede para apresentar o plano antes de começar. Vamos construir em 4 fases; esta rodada entrega a **Fase 1 (base)**. O domínio a gente conecta depois de publicar.

## O que você verá ao fim desta rodada
- Entrada com e-mail e senha (conta só sua; dados privados).
- Menu lateral editorial: Visão geral, Meus projetos, Novo projeto, Biblioteca de editais, Biblioteca de referências, Radar de oportunidades, Configurações (as três bibliotecas/radar aparecem como "em breve").
- **Visão geral**: projetos por situação, últimos acessados, pendências (perguntas sem resposta), atalhos.
- **Meus projetos**: lista com filtros por situação e linguagem; criar, duplicar, arquivar.
- **Página do projeto** com abas: Informações gerais, Construção guiada, Orçamento, Cronograma, Equipe, Acessibilidade, Democratização, Documentos.
- **Construção guiada**: 6 etapas (Apresentação → Resultados), uma pergunta por vez, salvamento automático, histórico de versões de cada resposta, botão **"Ver exemplo"** (exemplo fictício + explicação + erros comuns — nunca copiado para o campo), e visão do projeto completo.
- **Perguntas complementares por IA**: botão "Revisar respostas" que aponta lacunas e contradições em forma de pergunta — sem escrever nada por você.
- **Orçamento** com cálculo automático (quantidade × valor, totais por categoria); **Cronograma** por etapas/meses; **Equipe**; fichas de **Acessibilidade** e **Democratização**.
- **Documentos**: envio de arquivos privados por projeto.
- **Exportação** do projeto em DOCX e PDF (com suas respostas exatamente como escritas).

## Visual
Tons creme/off-white, grafite e verde-musgo; títulos serifados (Fraunces), texto funcional sem serifa (Instrument Sans); linhas finas e grid de revista, sem cara de painel corporativo.

## Próximas rodadas
- **Fase 2** — Bibliotecas de editais e referências, "Adicionar fonte" (arquivo, link, vídeo, texto), leitura de editais por IA com revisão manual, exportação XLSX.
- **Fase 3** — Radar: fontes do ES (estado e todos os municípios) e nacionais, pesquisa manual e semanal, histórico, nunca marcar "aberto" sem verificação.
- **Fase 4** — Compatibilidade projeto × edital, pendências documentais, integrações opcionais.

## Preciso de você
- **Funcultura (piloto)**: o documento proíbe inventar campos do edital. Envie o edital vigente e o formulário oficial (PDF/DOCX) para eu montar o roteiro fiel. Até lá, uso o roteiro genérico de 6 etapas.

## Detalhes técnicos
- Lovable Cloud para login, banco, armazenamento privado; RLS por `user_id` em todas as tabelas.
- Tabelas fase 1: `projects`, `project_answers` (+ `answer_versions`), `budget_items`, `schedule_items`, `team_members`, `accessibility`, `democratization`, `project_documents`; bucket privado `project-files`.
- IA via Lovable AI Gateway em server function, com prompt restrito a perguntas (troca de provedor isolada num módulo).
- Exportação DOCX (biblioteca `docx`) e PDF gerados no navegador.
- Roteiro de perguntas como dados configuráveis, preparado para modelos por edital.
