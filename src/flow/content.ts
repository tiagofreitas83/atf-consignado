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
} as const;

export const TUTORIAL_PIX = [
  { title: "Abra o app do seu banco", text: "Use a conta que está no seu nome e CPF." },
  { title: "Entre em Pix › Minhas chaves", text: "O nome pode variar: Área Pix, Gerenciar chaves ou Cadastrar chave." },
  { title: "Cadastre a chave CPF", text: "Escolha CPF como tipo de chave e confirme com a senha do app." },
  { title: "Volte e valide aqui", text: "A chave fica ativa na hora. Toque em validar para seguir." },
];

export const STEP_LABELS = ["Boas-vindas", "Proposta", "Recebimento", "Assinatura", "Concluído"] as const;
