/** Constantes de domínio usadas pela UI (não dependem do adaptador mock). */

export const ufs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const accessoriesByCategorySlug: Record<string, string[]> = {
  smartphones: ["Caixa original", "Carregador", "Cabo original", "Fones", "Película aplicada", "Capinha"],
  notebooks: ["Caixa original", "Carregador original", "Mochila/case", "Mouse"],
  videogames: ["Caixa original", "1 controle extra", "Cabos originais", "Jogos físicos"],
  "tvs-audio": ["Controle remoto", "Base/suporte", "Caixa original", "Manual"],
  cameras: ["Caixa original", "Bateria extra", "Cartão de memória", "Bolsa/case", "Alça original"],
  tablets: ["Caixa original", "Carregador", "Capa/case", "Caneta (stylus)"],
  wearables: ["Caixa original", "Carregador", "Pulseira extra"],
  eletrodomesticos: ["Nota fiscal de instalação", "Manual", "Acessórios internos completos"],
  bicicletas: ["Nota fiscal", "Suporte de caramanhola", "Ciclocomputador", "Pedais extras"],
  ferramentas: ["Maleta original", "Bateria extra", "Carregador", "Brocas/acessórios"],
};

export const conditionOptions = [
  { value: "NEW", label: "Novo", description: "Lacrado ou sem qualquer sinal de uso" },
  { value: "EXCELLENT", label: "Excelente", description: "Sinais mínimos, funcionamento perfeito" },
  { value: "GOOD", label: "Bom", description: "Marcas leves de uso, tudo funcionando" },
  { value: "FAIR", label: "Regular", description: "Desgaste visível, funcional" },
  { value: "POOR", label: "Ruim", description: "Danos evidentes ou defeitos parciais" },
] as const;
