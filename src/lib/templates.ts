// Roteiros de perguntas. Os modelos "builtin" Funcultura e Rouanet seguem os documentos
// oficiais enviados (Ficha de Inscrição – Edital 26/2025 Cultura Digital e Manual do Proponente IN 2026).
// Modelos personalizados ficam no banco (tabela templates) e usam a mesma estrutura.

export type FieldKind = "short" | "long" | "link";
export type LinkTarget = "cronograma" | "equipe" | "orcamento" | "acessibilidade" | "democratizacao" | "documentos";

export interface TemplateField {
  key: string;
  section: string;
  label: string;
  guidance?: string;
  maxChars?: number | null;
  required?: boolean;
  kind: FieldKind;
  link?: LinkTarget;
  example?: { text: string; why: string; pitfalls?: string };
}

export interface Template {
  ref: string; // builtin:<key> ou custom:<uuid>
  name: string;
  mechanism: string;
  source?: string;
  fields: TemplateField[];
}

const ex = (text: string, why: string, pitfalls?: string) => ({ text, why, pitfalls });

const GENERIC: Template = {
  ref: "builtin:generico",
  name: "Roteiro geral (sem edital)",
  mechanism: "Sem edital definido",
  fields: [
    { key: "nome", section: "Apresentação", label: "Qual é o nome do projeto?", kind: "short",
      example: ex("Vozes do Manguezal – mostra de documentários de Vitória", "Diz o que é e onde acontece, sem rodeios.", "Evite títulos longos ou genéricos como “Projeto Cultural 2026”.") },
    { key: "apresentacao", section: "Apresentação", label: "Como você apresentaria a proposta em poucas palavras?", kind: "long",
      example: ex("Mostra itinerante de seis curtas documentais produzidos por jovens de comunidades do entorno do manguezal, exibidos em praças de três bairros.", "Em duas frases dá para entender o quê, quem e onde.", "Não use adjetivos como “inovador” ou “único” no lugar de informação.") },
    { key: "o_que", section: "Apresentação", label: "O que será realizado?", kind: "long",
      example: ex("Oficina de 40 horas de documentário para 20 jovens, produção de 6 curtas e 3 sessões públicas de exibição com debate.", "Lista ações concretas e com quantidades.") },
    { key: "formato", section: "Apresentação", label: "Qual é o formato da iniciativa?", kind: "short",
      example: ex("Oficina + mostra itinerante presencial, com exibição online posterior.", "Define o formato sem misturar com justificativa.") },
    { key: "porque", section: "Justificativa", label: "Por que esse projeto precisa ser realizado?", kind: "long",
      example: ex("Os bairros atendidos não possuem sala de cinema e as últimas ações audiovisuais na região ocorreram em 2019, segundo levantamento da associação de moradores.", "Apresenta uma necessidade verificável, com fonte.", "Evite frases que serviriam para qualquer projeto, como “a cultura transforma vidas”.") },
    { key: "contexto", section: "Justificativa", label: "Que contexto cultural, social ou artístico motivou a proposta?", kind: "long",
      example: ex("A pesca artesanal no manguezal está diminuindo e os mais jovens conhecem pouco essa história; o projeto registra esse saber pela visão deles.", "Conecta o projeto a uma situação real do território.") },
    { key: "questao", section: "Justificativa", label: "Que questão o projeto pretende abordar?", kind: "long",
      example: ex("A falta de registro da memória das comunidades pesqueiras feito pelas próprias comunidades.", "Uma questão clara e delimitada.") },
    { key: "relevancia", section: "Justificativa", label: "Qual é sua relevância para o território?", kind: "long",
      example: ex("Os filmes ficarão disponíveis para escolas da região e serão doados ao acervo da biblioteca municipal.", "Mostra retorno concreto para o lugar.") },
    { key: "objetivo_geral", section: "Objetivos", label: "Qual é o objetivo principal?", kind: "long",
      example: ex("Realizar uma mostra de documentários produzidos por jovens das comunidades do manguezal de Vitória.", "Começa com verbo e diz a finalidade em uma frase.", "Não liste vários objetivos aqui; isso vai nos específicos.") },
    { key: "objetivos_especificos", section: "Objetivos", label: "Quais resultados específicos pretende alcançar?", kind: "long",
      example: ex("1. Formar 20 jovens em linguagem documental (40h).\n2. Produzir 6 curtas de até 10 min.\n3. Realizar 3 sessões públicas em 3 bairros.", "Cada objetivo é mensurável e pode ser comprovado.") },
    { key: "ao_final", section: "Objetivos", label: "O que deverá estar realizado ao final do projeto?", kind: "long",
      example: ex("6 filmes finalizados com legendas, 3 sessões realizadas, relatório com fotos e listas de presença.", "Descreve entregas verificáveis.") },
    { key: "publico", section: "Público e território", label: "Para quem o projeto é destinado?", kind: "long",
      example: ex("Jovens de 15 a 24 anos dos bairros São Pedro, Resistência e Nova Palestina (formação); moradores em geral (sessões).", "Separa o público de cada atividade, com perfil e faixa etária.") },
    { key: "onde", section: "Público e território", label: "Onde será realizado?", kind: "short",
      example: ex("Vitória/ES – bairros São Pedro, Resistência e Nova Palestina.", "Município e locais específicos.") },
    { key: "relacao_territorio", section: "Público e território", label: "Qual é a relação com o território?", kind: "long",
      example: ex("A equipe é formada por moradores da região e o projeto nasce de uma demanda da associação local.", "Mostra vínculo real, não apenas a localização.") },
    { key: "participacao", section: "Público e território", label: "Como o público poderá participar?", kind: "long",
      example: ex("Inscrição gratuita para a oficina por formulário e em ponto físico na associação; sessões abertas sem necessidade de inscrição.", "Explica o acesso na prática.") },
    { key: "atividades", section: "Metodologia e atividades", label: "Quais atividades serão realizadas?", kind: "link", link: "cronograma",
      example: ex("Oficina (mar–abr), gravações (mai), montagem (jun), sessões (jul).", "Cada atividade tem período e local na aba Cronograma.") },
    { key: "como", section: "Metodologia e atividades", label: "Como cada atividade acontecerá?", kind: "long",
      example: ex("A oficina terá encontros semanais de 4h, com prática de câmera em celular e roteiro coletivo; cada grupo de 3 a 4 jovens produz um curta.", "Descreve o método, não só o nome da atividade.") },
    { key: "sequencia", section: "Metodologia e atividades", label: "Qual será a sequência de execução?", kind: "long",
      example: ex("Pré-produção (30 dias): inscrições e espaço. Produção (90 dias): oficina e filmagens. Pós-produção (30 dias): montagem, sessões e prestação de contas.", "Ordem lógica com duração.") },
    { key: "recursos", section: "Metodologia e atividades", label: "Quais recursos serão necessários?", kind: "link", link: "orcamento",
      example: ex("Equipe de 4 pessoas, 6 kits de gravação, projetor e som para sessões.", "Os valores vão na aba Orçamento.") },
    { key: "resultados", section: "Resultados e contrapartidas", label: "Quais resultados são esperados?", kind: "long",
      example: ex("20 jovens formados, 6 filmes, público estimado de 300 pessoas nas sessões.", "Resultados com números estimados.") },
    { key: "registro", section: "Resultados e contrapartidas", label: "Como serão registrados?", kind: "long",
      example: ex("Lista de presença, fotos, vídeo-making of e formulário de avaliação dos participantes.", "Indica como comprovar cada resultado.") },
    { key: "retorno", section: "Resultados e contrapartidas", label: "Haverá ações de retorno para a comunidade?", kind: "long",
      example: ex("Cópia dos filmes doada às 3 escolas estaduais do bairro e sessão extra para estudantes.", "Ação concreta e gratuita.") },
    { key: "compartilhamento", section: "Resultados e contrapartidas", label: "Como os resultados serão compartilhados?", kind: "long",
      example: ex("Filmes disponibilizados no YouTube com legendas e Libras após a mostra.", "Diz onde e de que forma.") },
  ],
};

const FUNCULTURA: Template = {
  ref: "builtin:funcultura-cultura-digital-2025",
  name: "Funcultura ES – Edital 26/2025 Cultura Digital (Anexo 3)",
  mechanism: "Funcultura – Espírito Santo",
  source: "ANEXO 3 – Ficha de Inscrição – Edital 26/2025 Seleção de Projetos de Cultura Digital no ES",
  fields: [
    { key: "tipo_pessoa", section: "Proponente", label: "Tipo de pessoa", guidance: "Pessoa física, MEI ou Pessoa Jurídica.", kind: "short", required: true,
      example: ex("Pessoa física", "Escolha exatamente uma das três opções da ficha.") },
    { key: "nome_proponente", section: "Proponente", label: "Nome / Razão social", kind: "short", required: true,
      example: ex("Maria da Silva Souza", "Nome completo como no documento; para PJ/MEI, a razão social.") },
    { key: "documento", section: "Proponente", label: "CPF / CNPJ", kind: "short", required: true,
      example: ex("000.000.000-00", "Use o documento do tipo de pessoa escolhido.") },
    { key: "municipio", section: "Proponente", label: "Município", kind: "short", required: true,
      example: ex("Cariacica", "Município de residência ou sede do proponente.") },
    { key: "area_atuacao", section: "Proponente", label: "Principal área de atuação no campo artístico-cultural", guidance: "Escolha uma das áreas listadas na ficha (ex.: Cultura digital, Audiovisual, Arte digital, Jogos eletrônicos...).", kind: "short",
      example: ex("Cultura digital", "Use exatamente o nome da área como aparece na lista oficial.") },
    { key: "fomento_5anos", section: "Proponente", label: "Acessou recursos públicos do fomento à cultura nos últimos 5 anos?", guidance: "Sim / Não / Não sei informar.", kind: "short",
      example: ex("Não", "Resposta simples entre as três opções.") },
    { key: "grupo_coletivo", section: "Proponente", label: "O projeto será desenvolvido por um grupo ou coletivo? Se sim, qual?", kind: "short",
      example: ex("Sim – Coletivo Pixel Capixaba", "Informe nome do grupo; os dados de contato ficam na ficha oficial.") },

    { key: "titulo", section: "1–4. Proposta", label: "1. Título do projeto", kind: "short", required: true,
      example: ex("Arquivo Vivo – memória digital do congo de Serra", "Curto e indica o objeto do projeto.", "Evite títulos que não deixam claro o que será feito.") },
    { key: "linha", section: "1–4. Proposta", label: "2. Identificação da linha", guidance: "Informe a linha do edital em que o projeto se inscreve, conforme o texto do edital.", kind: "short", required: true,
      example: ex("Linha 2 – Difusão e memória em plataformas digitais (exemplo fictício)", "Copie o nome da linha exatamente como está no edital.") },
    { key: "objeto", section: "1–4. Proposta", label: "3. Objeto", guidance: "Descreva sua proposta de forma objetiva e em poucas linhas, apresentando a ideia principal.", kind: "long", required: true,
      example: ex("Criação de um acervo digital aberto com 30 registros audiovisuais de bandas de congo da Serra, publicado em site próprio com legendas e Libras.", "Em poucas linhas: o que é, de quem, onde e o produto.", "Não inclua justificativa aqui.") },
    { key: "detalhamento", section: "1–4. Proposta", label: "4. Detalhamento", guidance: "Detalhe a proposta, as ações previstas, se houve edições anteriores e as quantidades. Explique por que seu projeto tem importância na comunidade, região ou no cenário cultural do ES. Descreva os resultados que você espera.", kind: "long", required: true,
      example: ex("O projeto visitará 10 bandas de congo... (ações, quantidades). É a primeira edição. A importância está em ... Os resultados esperados são 30 vídeos, 1 site e 2 rodas de conversa.", "Cobre os quatro pontos pedidos: ações, edições anteriores, importância e resultados.", "Esquecer de informar se houve edição anterior é uma falha comum.") },

    { key: "atividades_cronograma", section: "5–6. Atividades e planejamento", label: "5. Lista de atividades e cronograma de execução", guidance: "Todas as atividades, incluindo as agregadas, com local e data prevista (início/fim). Preencha na aba Cronograma.", kind: "link", link: "cronograma",
      example: ex("Gravação com bandas – Serra (Nova Almeida, Jacaraípe) – 03/2026 a 05/2026", "Cada linha tem atividade, local e datas.") },
    { key: "planejamento", section: "5–6. Atividades e planejamento", label: "6. Planejamento do projeto (pré-produção, produção e pós-produção)", guidance: "Descreva as ações de cada etapa e a duração (nº de dias ou meses). Você pode organizar as etapas na aba Cronograma.", kind: "long", required: true,
      example: ex("Pré-produção (2 meses): contato com as bandas, autorizações de imagem, contratação da equipe.\nProdução (4 meses): gravações, edição, desenvolvimento do site.\nPós-produção (1 mês): lançamento, relatório e prestação de contas.", "Separa as três etapas com duração.") },

    { key: "equipe", section: "7–9. Equipe e público", label: "7. Equipe do projeto", guidance: "Nome das pessoas e funções. Anexe o currículo da equipe principal (item de avaliação). Funções sem profissional definido: “a definir”. Preencha na aba Equipe.", kind: "link", link: "equipe",
      example: ex("João Pereira – direção e roteiro\nA definir – intérprete de Libras", "Nome + função; “a definir” quando ainda não escolhido.") },
    { key: "publico_alvo", section: "7–9. Equipe e público", label: "8. Público-alvo", guidance: "Para cada atividade: perfil do público (ex.: crianças, estudantes, LGBTI+...) e quantidade estimada.", kind: "long", required: true,
      example: ex("Rodas de conversa – mestres e brincantes de congo, estudantes – 80 pessoas\nAcervo online – público em geral, escolas – 2.000 acessos", "Atividade, perfil e quantidade em cada linha.") },
    { key: "ingresso", section: "7–9. Equipe e público", label: "9. Atividades com cobrança de ingresso", guidance: "Sim/Não. Se sim, informe municípios, espaços culturais e valor pretendido do ingresso.", kind: "short", required: true,
      example: ex("Não. Todas as atividades serão gratuitas.", "Responde diretamente, com detalhes só se houver cobrança.") },

    { key: "comunicacao", section: "10. Comunicação", label: "10. Plano de comunicação", guidance: "Como fará a divulgação das ações, quais materiais (peças gráficas e digitais) e a estratégia para alcançar diferentes públicos.", kind: "long", required: true,
      example: ex("Perfil no Instagram com 3 posts semanais, 2 releases para imprensa local, cartazes em escolas e associações, mensagens por WhatsApp para lideranças comunitárias, todas as peças com descrição de imagem.", "Lista canais, materiais e estratégia por público.") },

    { key: "acess_previsao", section: "11–12. Acessibilidade", label: "11. Ações de acessibilidade (Lei 13.146/2015)", guidance: "Qual a previsão de implementação de medidas de acessibilidade física, atitudinal e comunicacional? Use a aba Acessibilidade para detalhar.", kind: "long", required: true,
      example: ex("Física: locais com acesso sem degraus. Comunicacional: legendas e Libras em todos os vídeos. Atitudinal: orientação da equipe sobre atendimento a pessoas com deficiência.", "Cobre as três dimensões pedidas pela ficha.") },
    { key: "acess_medidas", section: "11–12. Acessibilidade", label: "12. Liste e detalhe todas as medidas de acessibilidade", kind: "link", link: "acessibilidade",
      example: ex("1. Janela de Libras nos 30 vídeos.\n2. Audiodescrição no vídeo de apresentação.\n3. Site seguindo padrões de acessibilidade web.", "Cada medida listada separadamente e verificável.") },

    { key: "formativas", section: "13–17. Complementos", label: "13. Ações formativas (caso couber)", guidance: "Objetivos, perfil do público, número de horas, vagas, profissional contratado (currículo ou perfil) e outras informações.", kind: "long",
      example: ex("Oficina de registro em celular – objetivo: ... – jovens de 14 a 20 anos – 12h – 15 vagas – ministrada por Ana Lima (currículo anexo).", "Traz todos os itens pedidos na ficha.") },
    { key: "planilha", section: "13–17. Complementos", label: "14. Planilha de custos", guidance: "Discrimine as despesas necessárias, prevendo inclusive os tributos devidos. Preencha na aba Orçamento.", kind: "link", link: "orcamento",
      example: ex("Edição de vídeo – serviço – 30 vídeos × R$ 300,00 = R$ 9.000,00", "Item, unidade, quantidade e valor; não esqueça os tributos.") },
    { key: "produtos", section: "13–17. Complementos", label: "15. Produtos resultantes do projeto", guidance: "Material ou bem resultante (audiovisual, publicações, objetos, criação de espaço etc.).", kind: "long",
      example: ex("30 vídeos curtos, 1 site-acervo, 1 vídeo-síntese de 15 min.", "Lista os produtos com quantidades.") },
    { key: "edicoes_anteriores", section: "13–17. Complementos", label: "16. Relatório de edições anteriores", guidance: "Se houve edição anterior, anexar relatório, material de divulgação e clipping (aba Documentos).", kind: "long",
      example: ex("Não se aplica – primeira edição.", "Diga claramente quando não houver.") },
    { key: "curriculo", section: "13–17. Complementos", label: "17. Currículo / portfólio", guidance: "Currículo/portfólio do proponente e do grupo, com ações realizadas, matérias, publicações, fotos, declarações, links (YouTube, Vimeo...).", kind: "long", required: true,
      example: ex("Maria Souza – produtora cultural desde 2016. Realizou ... (link). Matéria em A Gazeta (link).", "Fatos verificáveis com links.") },
  ],
};

const ROUANET: Template = {
  ref: "builtin:rouanet-in-2026",
  name: "Lei Rouanet – Incentivo a Projetos Culturais (IN 29/2026)",
  mechanism: "Lei Rouanet (Pronac)",
  source: "Manual do Proponente – IN 2026 (Ministério da Cultura)",
  fields: [
    { key: "titulo", section: "Proposta", label: "Nome da proposta (título)", guidance: "Título curto, que dê ideia concisa do que se quer realizar e faça referência ao objeto. Em eventos continuados, indique tipo e ano. Não use “título provisório”.", kind: "short", required: true,
      example: ex("II Festival de Teatro de Rua de Guarapari", "Indica edição, objeto e local.", "Não coloque o resumo no título.") },
    { key: "resumo", section: "Proposta", label: "Resumo da proposta cultural", guidance: "Todos os produtos culturais em no máximo 5 linhas, sem adjetivos e sem dados que possam mudar (local, número de beneficiários, datas, valores, artistas). Será publicado no DOU.", maxChars: 600, kind: "long", required: true,
      example: ex("O projeto visa a realização do Festival “Nome” com apresentações de espetáculos de teatro de rua e oficinas de iniciação teatral.", "Diz o que se pretende, de forma frugal.", "Citar datas, cidades ou nomes de artistas aqui é erro frequente.") },
    { key: "objetivo_geral", section: "Objetivos", label: "Objetivo geral", guidance: "O que o projeto pretende alcançar, sua finalidade. Qual o principal resultado? Para que realizar o projeto?", kind: "long", required: true,
      example: ex("O objetivo deste projeto é realizar o II Festival de Teatro de Rua em Guarapari.", "Uma frase, finalidade clara.") },
    { key: "objetivos_especificos", section: "Objetivos", label: "Objetivos específicos", guidance: "Detalhe todos os produtos do Plano de Distribuição, com quantidade de cada um. Apenas entregas mensuráveis, que terão de ser comprovadas.", kind: "long", required: true,
      example: ex("- Realizar 12 apresentações de espetáculos de teatro de rua.\n- Realizar 4 oficinas de iniciação teatral de 8h cada, com 20 vagas.", "Cada produto do plano de distribuição aparece com quantidade.", "Se não ficar claro o que será realizado, a proposta não é analisada.") },
    { key: "justificativa", section: "Justificativa", label: "Justificativa", guidance: "Motivos para a realização e necessidade do uso de recursos de incentivo. Transcreva os incisos do Art. 1º e do Art. 3º da Lei 8.313/91 em que a proposta se enquadra, com a fundamentação.", kind: "long", required: true,
      example: ex("O município não conta com festival de artes cênicas desde ... Enquadramento: Art. 1º, II – promover a regionalização da produção cultural, pois ... Art. 3º, II, alínea ... porque ...", "Traz motivo, necessidade do incentivo e os incisos com fundamentação.") },
    { key: "acessibilidade", section: "Acessibilidade e democratização", label: "Acessibilidade", guidance: "Medidas no aspecto arquitetônico e no aspecto comunicacional e de conteúdo, compatíveis com o objeto. Uso obrigatório do Guia de Acessibilidade do MDHC. Detalhe na aba Acessibilidade.", kind: "link", link: "acessibilidade",
      example: ex("a. Arquitetônico: espaço com rampas e área reservada para cadeirantes.\nb. Comunicacional: intérprete de Libras e audiodescrição em 4 apresentações; material de divulgação acessível.", "Segue a divisão a/b pedida no manual.") },
    { key: "democratizacao", section: "Acessibilidade e democratização", label: "Democratização de acesso", guidance: "Informe qual medida de ampliação de acesso será adotada, conforme art. 42 da IN 29/2026. Marque na aba Democratização.", kind: "link", link: "democratizacao",
      example: ex("V – realizar, gratuitamente, 4 oficinas de iniciação teatral paralelas ao festival.", "Cita o inciso e descreve a ação concreta.") },
    { key: "etapas", section: "Etapas de trabalho", label: "Etapas de trabalho", guidance: "Subdividido em Pré-produção, Produção/Execução e Pós-produção, com detalhamento das ações e período em dias, semanas ou meses (sem mês ou data exata). Pós-produção: máximo 60 dias.", kind: "long", required: true,
      example: ex("PRÉ-PRODUÇÃO – 30 dias: reuniões de equipe; contratação.\nPRODUÇÃO/EXECUÇÃO – 60 dias: ensaios; apresentações; registros.\nPÓS-PRODUÇÃO – 30 dias: avaliação; prestação de contas.", "Três etapas, ações e duração relativa.", "Pós-produção acima de 60 dias não é aceita.") },
    { key: "ficha_tecnica", section: "Ficha técnica e obra", label: "Ficha técnica", guidance: "Deixe explícito qual atividade o proponente realizará (ele deve ser responsável pela gestão). Principais profissionais: nome completo, função e currículo resumido. Pode usar a aba Equipe.", kind: "link", link: "equipe",
      example: ex("Proponente: Ana Costa – coordenação geral e gestão financeira.\nCarlos Lima – direção artística – ator e diretor há 15 anos...", "Deixa clara a função do proponente.", "Delegar a gestão a terceiros caracteriza intermediação e motiva arquivamento.") },
    { key: "sinopse", section: "Ficha técnica e obra", label: "Sinopse da obra", guidance: "Breve resumo dos produtos que precisam: livros, espetáculos, seminários, palestras, performances, exposições etc.", kind: "long",
      example: ex("Espetáculo “Nome”: comédia de rua que acompanha dois vendedores ambulantes... 50 min, classificação livre.", "Personagens, tema e roteiro em poucas linhas.") },
    { key: "especificacoes", section: "Ficha técnica e obra", label: "Especificações técnicas do produto", guidance: "Características técnicas dos produtos (ex.: nº de páginas, formato, tiragem; duração; se música exclusivamente instrumental ou regional, deixe explícito).", kind: "long",
      example: ex("Livro: 120 páginas, 14×21 cm, miolo 4/4 cores, tiragem 1.000 exemplares.", "Dados técnicos objetivos.") },
    { key: "contrapartida", section: "Outras informações", label: "Contrapartida social", guidance: "Obrigatória em projetos com venda de ingresso ou produto; ações formativas culturais ou artísticas. Inclua o produto “Contrapartidas sociais” no Plano de Distribuição.", kind: "long",
      example: ex("Oficina gratuita de 8h de iniciação teatral para estudantes da rede pública, 20 vagas.", "Ação formativa, cultural e gratuita.") },
    { key: "plano_distribuicao", section: "Outras informações", label: "Plano de distribuição (resumo)", guidance: "Deve refletir TODOS os produtos citados no Resumo e Objetivos específicos. O cadastro detalhado é feito no Salic.", kind: "long",
      example: ex("Produto principal: Festival – 12 apresentações, 3.000 ingressos gratuitos.\nContrapartida social: 4 oficinas, 80 vagas.", "Mesmos produtos dos objetivos.") },
    { key: "outras_info", section: "Outras informações", label: "Outras informações", guidance: "Informações complementares não inseridas em outros campos (ex.: beneficiários de passagens, justificativas de itens).", kind: "long",
      example: ex("Passagens: 2 trechos para o diretor convidado (função: direção artística).", "Só o que não coube nos outros campos.") },
  ],
};

export const BUILTIN_TEMPLATES: Template[] = [GENERIC, FUNCULTURA, ROUANET];

export function builtinTemplate(ref: string): Template | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.ref === ref);
}

export function sectionsOf(fields: TemplateField[]): string[] {
  const out: string[] = [];
  for (const f of fields) if (!out.includes(f.section)) out.push(f.section);
  return out;
}

export function slugKey(label: string) {
  return (
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "campo"
  ) + "_" + Math.random().toString(36).slice(2, 6);
}
