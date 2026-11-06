# Detector de Vaga Falsa

Cole o texto de um post de vaga e veja os **indícios de golpe ou de isca de engajamento**, com os trechos suspeitos marcados no próprio texto.

Feito em Next.js + TypeScript. Combina regras, checagem de idade de domínio e uma camada de IA gratuita, e continua funcionando só com regras quando a IA não está disponível.

> **Demo:** _adicione aqui o link do site publicado_
>
> **Print:** _adicione aqui um print da tela com o exemplo "Golpe sutil"_

---

## O que ele faz

- Dá uma nota de risco de 0 a 100 e um nível: baixo, médio ou alto.
- Marca no texto original os trechos que acenderam cada alerta.
- Lista cada indício com a explicação do motivo.
- Mostra quando a IA participou da análise ("com IA").

O resultado descreve **o texto do post**. Ele aponta indícios, não acusa pessoa nem empresa.

## Como funciona

A análise roda em três camadas, da mais barata para a mais cara:

```
Texto colado
    │
    ▼
Route Handler (/api/analisar)
  validação de tamanho + limite de uso por IP
    │
    ├── 1. Regras (regex)        → padrões clássicos de golpe, sem custo
    ├── 2. Domínio (RDAP)        → idade do domínio dos links do post
    └── 3. IA (Groq)             → golpes bem escritos que as regras não pegam
    │
    ▼
Score + indícios com trecho → tela
```

### 1. Regras

Dez regras com gravidade (baixa, média ou alta), entre elas: pedido de comentário para receber a vaga, currículo para e-mail pessoal, taxa de inscrição ou pagamento antecipado, pedido de dados sensíveis, contato direto por WhatsApp, urgência artificial, promessa de vaga sem experiência, ganho chamativo, pedido para chamar no privado e link encurtado.

### 2. Idade do domínio

Para cada link do post (máximo 3), o servidor consulta a data de registro do domínio via RDAP. Domínio criado há menos de 30 dias vira um indício de gravidade alta. Quando a consulta não retorna dado, nada é marcado: ausência de informação nunca vira suspeita.

O servidor **nunca abre os links do post**. Ele só consulta os dados públicos de registro do domínio.

### 3. IA

Quando as regras não indicam risco altíssimo (score abaixo de 90), um modelo de linguagem analisa o texto e devolve um risco e uma lista de indícios em JSON.

Cuidados no uso da IA:

- **Prompt injection:** o post vai dentro de marcadores `<post>` e é tratado como dado, não como instrução.
- **Sem acusações:** o prompt exige falar só em indícios, com o motivo.
- **Validação da resposta:** o JSON passa por um schema (Zod). Itens fora do formato são descartados sem derrubar o resto.
- **Citações verificadas:** o trecho citado pela IA precisa existir literalmente no texto. Se não existir, o indício é descartado.
- **Fallback:** se a IA falhar (sem chave, limite de uso, timeout), o resultado sai só com regras e domínio.

## Cálculo do score

| Gravidade | Peso |
| --------- | ---- |
| Baixa     | 10   |
| Média     | 20   |
| Alta      | 35   |

- Score das regras e do domínio = soma dos pesos, limitada a 100.
- Score final = o maior entre esse valor e o risco informado pela IA.
- Níveis: **baixo** (abaixo de 30), **médio** (30 a 59), **alto** (60 ou mais).

## Privacidade e segurança

- Aviso na tela: com a IA ativa, o texto é enviado a um serviço externo (Groq). A pessoa é orientada a não colar dados pessoais.
- A chave da API fica apenas no servidor (variável de ambiente), nunca no navegador.
- Limite de 5 análises por minuto por IP.
- O texto exibido é renderizado pelo React (escapado), então conteúdo colado não executa como HTML.

## Stack

- [Next.js](https://nextjs.org/) (App Router) e TypeScript
- [Zod](https://zod.dev/) para validar a resposta da IA
- [Groq](https://groq.com/) (plano gratuito) para a camada de IA
- RDAP para a data de registro dos domínios
- CSS Modules

## Rodando localmente

Requisitos: Node.js 20 ou superior.

```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
npm install
```

Crie o arquivo `.env.local` na raiz:

```
GROQ_API_KEY=sua-chave-aqui
GROQ_MODEL=llama-3.3-70b-versatile
```

A chave é gratuita no console do Groq. Os nomes de modelos mudam com o tempo: se der erro de modelo não encontrado, troque o valor de `GROQ_MODEL` por um modelo disponível na sua conta.

Sem a chave, o projeto funciona normalmente só com regras e domínio.

```bash
npm run dev
```

Abra http://localhost:3000.

## Estrutura

```
app/
  api/analisar/route.ts   rota que orquestra as três camadas
  page.tsx                tela
  page.module.css         estilos da tela
  globals.css             estilos globais
lib/
  tipos.ts                tipos compartilhados
  regras.ts               regras, pesos e cálculo do score
  dominio.ts              extração de links e consulta RDAP
  ia.ts                   chamada ao Groq e validação da resposta
  grifar.ts               divide o texto em trechos normais e marcados
  limite.ts               limite de uso por IP
```

## Limitações conhecidas

- As regras são padrões de texto simples e não pegam todo golpe. É por isso que existe a camada de IA.
- A IA pode errar. Uma vaga legítima pode receber indícios, e um golpe bem feito pode passar.
- Algumas extensões de domínio não expõem a data de registro pelo RDAP.
- O limite de uso guarda os dados na memória do servidor. Em ambientes serverless ele funciona como um freio parcial, não como garantia. O ideal é migrar para um armazenamento externo (por exemplo, Redis).
- O plano gratuito do provedor de IA tem limites diários. Quando acabam, o detector segue só com regras.

## Próximos passos

- Limite de uso com armazenamento externo
- Checagem de posts repetidos por similaridade de texto
- Seguir links encurtados com proteção contra SSRF antes de consultar o domínio
- Testes automatizados para as regras

## Aviso

Esta ferramenta é um projeto de estudo e não substitui o seu julgamento. O resultado indica sinais no texto e não é uma acusação contra ninguém. Desconfie sempre de vagas que pedem pagamento, dados sensíveis ou contato fora dos canais oficiais da empresa.
