import type { Gravidade, Sinal } from "./tipos";

type Regra = {
  id: string;
  descricao: string;
  gravidade: Gravidade;
  padrao: RegExp;
};

const REGRAS: Regra[] = [
  {
    id: "comente-para-recer",
    descricao: "Pede comentário para receber a vaga",
    gravidade: "alta",
    padrao: /coment(e|em|ar)\s+["“"]?(eu quero|sim|interesse|quero)/i,
  },
  {
    id: "email-pessoal",
    descricao: "Currículo para e-mail pessoal",
    gravidade: "alta",
    padrao: /[\w.+-]+@(gmail|hotmail|outlook|yahoo)\.com/i,
  },
  {
    id: "pede-taxa",
    descricao: "Menciona taxa ou pagamento antecipado",
    gravidade: "alta",
    padrao: /taxa de (inscri|particip)|pagamento antecipado/i,
  },
  {
    id: "whatsapp",
    descricao: "Contato direto por WhatsApp",
    gravidade: "media",
    padrao: /wa\.me|whatsapp|zap/i,
  },
  {
    id: "urgencia",
    descricao: "Urgência artificial",
    gravidade: "media",
    padrao: /urgente|últimas vagas|vagas limitadas/i,
  },
  {
    id: "dados-sensiveis",
    descricao: "Pede dados sensíveis logo de cara",
    gravidade: "alta",
    padrao: /\bcpf\b|\brg\b|dados banc[aá]rios|n[uú]mero do cart[aã]o/i,
  },
  {
    id: "sem-experiencia",
    descricao: "Promete vaga sem exigir experiência",
    gravidade: "media",
    padrao:
      /sem (precisar de |necessidade de )?experi[eê]ncia|n[aã]o precisa (de )?experi[eê]ncia/i,
  },
  {
    id: "ganho-absurdo",
    descricao: "Promete ganho alto e chamativo",
    gravidade: "media",
    padrao: /ganhe (at[eé] )?r\$\s?[\d.]{4,}/i,
  },
  {
    id: "pede-dm",
    descricao: "Manda chamar no privado",
    gravidade: "media",
    padrao: /(chame|chama|envie|mande|manda)[^.]{0,20}\b(dm|inbox|privado)\b/i,
  },
  {
    id: "link-encurtado",
    descricao: "Link encurtado esconde o destino",
    gravidade: "media",
    padrao: /\b(bit\.ly|tinyurl\.com|cutt\.ly|is\.gd|rb\.gy)\/\S+/i,
  },
];

const PESO: Record<Gravidade, number> = {
  baixa: 10,
  media: 20,
  alta: 35,
};

function nivelDe(score: number) {
  if (score >= 60) return "alto";
  if (score >= 30) return "medio";
  return "baixo";
}

export function montarResultado(sinais: Sinal[], riscoIA = 0) {
  const soma = sinais.reduce((total, s) => total + PESO[s.gravidade], 0);
  const score = Math.min(100, Math.max(soma, riscoIA));
  return { score, nivel: nivelDe(score), sinais };
}

export function analisarPorRegras(texto: string) {
  const sinais: Sinal[] = [];

  for (const regra of REGRAS) {
    const achou = texto.match(regra.padrao);

    if (achou) {
      sinais.push({
        id: regra.id,
        descricao: regra.descricao,
        gravidade: regra.gravidade,
        trecho: achou[0],
        inicio: achou.index ?? 0,
        fim: (achou.index ?? 0) + achou[0].length,
      });
    }
  }

  return montarResultado(sinais);
}
