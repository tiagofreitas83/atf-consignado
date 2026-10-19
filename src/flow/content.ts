// Textos provisórios — substituir pelos do jurídico.
export const DOCS = {
  termos: {
    title: "Termo de consentimento",
    paras: [
      "Ao seguir, você autoriza a ATF SCD S.A. a consultar seus dados de vínculo empregatício, salário e margem consignável junto ao empregador e às bases oficiais, exclusivamente para análise e formalização do crédito consignado.",
      "Você também autoriza a consulta ao Sistema de Informações de Crédito (SCR) do Banco Central e a comunicação ao empregador para averbação e desconto das parcelas em folha de pagamento.",
      "O consentimento pode ser revogado a qualquer momento pelos canais de atendimento, sem prejuízo das operações já contratadas.",
    ],
  },
  privacidade: {
    title: "Política de Privacidade e LGPD",
    paras: [
      "Tratamos seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018), apenas para as finalidades informadas: análise de crédito, formalização, pagamento e prevenção à fraude.",
      "Seus dados são compartilhados somente com o empregador, instituições do arranjo Pix e órgãos reguladores, quando exigido.",
      "Como titular, você pode, a qualquer momento, solicitar a confirmação do tratamento, o acesso, a correção, a anonimização, a portabilidade ou a eliminação dos seus dados, além de revogar consentimentos concedidos, nos limites da lei e das obrigações regulatórias do Banco Central.",
      "As solicitações são atendidas pelo nosso encarregado de proteção de dados (DPO), pelos canais oficiais de atendimento da ATF.",
    ],
  },
} as const;

export type Passo = { title: string; text: string };

/** Cadastrar uma chave nova no banco onde a pessoa quer receber. Fica ativa na hora. */
export const TUTORIAL_CRIAR_CHAVE: Passo[] = [
  { title: "Abra o app do banco onde quer receber", text: "A conta precisa estar no seu nome." },
  { title: "Entre em Pix › Minhas chaves › Cadastrar", text: "O nome do menu muda de banco para banco." },
  { title: "Escolha celular, e-mail ou chave aleatória", text: "Celular e e-mail são confirmados por código. A chave fica ativa na hora." },
];

/** Portabilidade: levar uma chave que a pessoa já tem para outro banco. */
export const tutorialTrocarBanco = (bancoAtual: string): Passo[] => [
  { title: "No banco novo, cadastre a mesma chave", text: "O app avisa que ela já está em outro banco e oferece trazê-la (portabilidade)." },
  { title: `Aprove no app do ${bancoAtual}`, text: "O banco atual pede a sua confirmação para liberar a chave. Sem ela, nada muda." },
  { title: "Volte aqui e siga", text: "Conferimos em qual banco a chave está antes de continuar." },
];

export const STEP_LABELS = ["Boas-vindas", "Proposta", "Recebimento", "Assinatura", "Concluído"] as const;
