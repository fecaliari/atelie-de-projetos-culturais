export const STATUSES = [
  { value: "ideia", label: "Ideia inicial" },
  { value: "estruturacao", label: "Em estruturação" },
  { value: "desenvolvimento", label: "Em desenvolvimento" },
  { value: "aguardando", label: "Aguardando informações" },
  { value: "revisao", label: "Pronto para revisão" },
  { value: "finalizado", label: "Finalizado" },
  { value: "inscrito", label: "Inscrito" },
  { value: "contemplado", label: "Contemplado" },
  { value: "nao_contemplado", label: "Não contemplado" },
  { value: "arquivado", label: "Arquivado" },
] as const;

export const statusLabel = (v: string) => STATUSES.find((s) => s.value === v)?.label ?? v;

export const IN_PROGRESS = ["estruturacao", "desenvolvimento", "aguardando", "revisao"];
export const DRAFTING = ["ideia"];
export const DONE = ["finalizado", "inscrito", "contemplado", "nao_contemplado"];

export const LANGUAGES = [
  "Música", "Audiovisual", "Cinema", "Fotografia", "Artes visuais", "Teatro", "Dança",
  "Literatura", "Publicações", "Patrimônio cultural", "Cultura popular e tradicional",
  "Cultura digital", "Formação e capacitação", "Oficinas", "Festivais", "Eventos",
  "Circulação cultural", "Exposições", "Comunicação cultural", "Multidisciplinar",
];

export const PROPONENT_TYPES = [
  "Pessoa física", "MEI", "Artista ou produtor individual", "Coletivo", "Associação",
  "Organização da sociedade civil", "Produtora", "Empresa", "Instituição cultural", "Outro",
];

export const BUDGET_CATEGORIES = [
  "Pré-produção", "Produção", "Pós-produção", "Recursos humanos", "Estrutura e equipamentos",
  "Comunicação e divulgação", "Acessibilidade", "Logística e deslocamento", "Administrativo",
  "Tributos e encargos", "Outros",
];

export const PHASES = ["Pré-produção", "Produção", "Pós-produção"];

export const ACCESSIBILITY_GROUPS = [
  { key: "arquitetonica", label: "Acessibilidade arquitetônica / física", hint: "Rampas, banheiros adaptados, rotas acessíveis, assentos reservados, transporte adaptado." },
  { key: "comunicacional", label: "Acessibilidade comunicacional e de conteúdo", hint: "Libras, audiodescrição, legendas, braille, linguagem simples, materiais em formatos acessíveis." },
  { key: "atitudinal", label: "Acessibilidade atitudinal", hint: "Capacitação da equipe, acolhimento, sinalização, protocolos de atendimento." },
];

export const DEMOCRATIZATION_MEASURES = [
  "Doação de produtos para distribuição gratuita com caráter social ou educativo",
  "Transporte gratuito ao público, com acessibilidade",
  "Registros audiovisuais na internet com Libras e audiodescrição",
  "Veiculação por redes públicas de TV ou meios gratuitos",
  "Atividades paralelas gratuitas (ensaios abertos, cursos, palestras, oficinas)",
  "Ação cultural para crianças, adolescentes, jovens e educadores",
  "Atividades em unidades prisionais, ILPIs ou rede de atenção psicossocial",
  "Parceria para formação de agentes culturais",
  "Bolsas de formação para públicos prioritários e vulneráveis",
  "Atividades gratuitas ou com ingresso a preço popular",
  "Circulação em diferentes bairros ou municípios",
  "Outra medida",
];

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
