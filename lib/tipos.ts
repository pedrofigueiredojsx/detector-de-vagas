export type Gravidade = "baixa" | "media" | "alta";

export type Sinal = {
  id: string;
  descricao: string;
  gravidade: Gravidade;
  trecho: string;
  inicio: number;
  fim: number;
};
