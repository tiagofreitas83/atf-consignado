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
    title: "Política de privacidade",
    paras: [
      "Tratamos seus dados pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), apenas para as finalidades informadas: análise de crédito, formalização, pagamento e prevenção à fraude.",
      "Seus dados são compartilhados somente com o empregador, instituições do arranjo Pix e órgãos reguladores, quando exigido.",
      "Você pode solicitar acesso, correção ou eliminação dos seus dados pelo e-mail do nosso encarregado de proteção de dados.",
    ],
  },
  lgpd: {
    title: "LGPD",
    paras: [
      "A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante a você, como titular, o direito de saber quais dados pessoais a ATF SCD S.A. trata, para quais finalidades e com quem eles são compartilhados.",
      "Você pode, a qualquer momento, solicitar a confirmação do tratamento, o acesso, a correção, a anonimização, a portabilidade ou a eliminação dos seus dados, além de revogar consentimentos concedidos, nos limites da lei e das obrigações regulatórias do Banco Central.",
      "As solicitações são atendidas pelo nosso encarregado de proteção de dados (DPO), pelos canais oficiais de atendimento da ATF.",
    ],
  },
} as const;

export type Passo = { title: string; text: string };

export const TUTORIAL_CRIAR_CHAVE: Passo[] = [
  { title: "Abra o app do seu banco", text: "Use uma conta que esteja no seu nome e CPF." },
  { title: "Entre em Pix › Minhas chaves", text: "O nome pode variar: Área Pix, Gerenciar chaves ou Cadastrar chave." },
  { title: "Cadastre uma chave", text: "Recomendamos o CPF. Também valem celular, e-mail ou chave aleatória." },
  { title: "Volte e verifique de novo", text: "A chave fica ativa na hora. Toque em “Já criei, verificar de novo”." },
];

/** Portabilidade da chave CPF para outro banco. */
export const tutorialTrocarBanco = (bancoAtual: string): Passo[] => [
  { title: "Abra o app do banco onde quer receber", text: "A conta precisa estar no seu nome e CPF." },
  { title: "Cadastre o CPF como chave Pix", text: "O app avisa que a chave está em outro banco e oferece trazê-la (portabilidade)." },
  { title: "Confirme no banco atual", text: `O ${bancoAtual} pede a sua confirmação para liberar a chave. Sem ela, a portabilidade não acontece.` },
  { title: "Volte e verifique de novo", text: "Com a portabilidade concluída, toque em “Já movi, verificar de novo”." },
];

export const STEP_LABELS = ["Boas-vindas", "Proposta", "Recebimento", "Assinatura", "Concluído"] as const;
