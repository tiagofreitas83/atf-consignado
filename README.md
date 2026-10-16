# ATF Consignado Privado

Jornada de contratação de crédito consignado privado da ATF SCD S.A. (instituição 513), em 5 passos:
boas-vindas/consentimento → confirmação do CPF e proposta → recebimento (Pix) → assinatura da CCB → protocolo.

**Link pessoal:** `www.atf.com.br/consignado/<token>`. O token é opaco (CPF cifrado no servidor) e só é
repassado à API. Nenhum dado da proposta chega ao front antes de o CPF digitado conferir com o token
(`POST /proposta/verificar`); 3 erros bloqueiam o link.

**Recebimento:** CPF travado e consulta automática das chaves Pix do CPF. Se o CPF é chave, mostra o
banco (com passo a passo para levar a chave a outro banco ou usar outra chave). Se não é, mas há
outras chaves, um campo único reconhece celular, e-mail ou chave aleatória. Se não há nenhuma,
aviso + tutorial de criação. Só é aceita chave Pix do CPF do trabalhador.

A assinatura tem 5 etapas em sequência: revisar e aceitar a CCB → confirmar o e-mail (código) →
confirmar o celular (código por SMS) → apresentar o documento com foto (CNH ou RG; enviado como PDF
da carteira digital ou digitalizado com a câmera, frente e verso) → reconhecimento facial com prova de vida (oval no estilo FaceTec ZoOm). E-mail e
celular vêm pré-preenchidos da proposta e são conferidos/editados dentro da própria etapa, antes do código.

Responsividade: de 320px ao desktop, incluindo celular em paisagem. Safe-area (notch/barra de gestos),
`dvh`, hover só em dispositivos com mouse, alvos de toque ≥ 44px, modal como folha inferior no celular.

Link público: https://tiagofreitas83.github.io/atf-consignado/

React 19 + Vite + TypeScript + Tailwind 4. A especificação de design está em [`HANDOFF.md`](HANDOFF.md).

```bash
npm install   # depois: mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules
npm run dev   # http://localhost:5173
npm test
npm run build
```

Simulação no mock: `?pix=cpf` (padrão), `?pix=outras-chaves` ou `?pix=sem-chaves`, e `?horas=N`.
CPF de teste: 123.456.789-09. Chaves do titular: `mariana.lima@email.com`, `(11) 98765-4321` ou
qualquer chave aleatória.
Código `000000` (e-mail ou SMS) simula código inválido. Sem câmera, a captura facial oferece
"Simular sem câmera". Os atalhos "Preencher"/"usar documento de exemplo" são temporários.

## Estrutura

- `src/ds/` — port dos componentes do ATF Design System usados aqui (Button, IconButton, Input,
  Checkbox, Spinner, Icon e máscaras), fiel ao `_ds_bundle.js` do handoff. Quando o DS virar pacote,
  troque os imports de `./ds` por ele.
- `src/api/types.ts` — contrato com o back-end (`GET /proposta`, `POST /consentimentos`,
  `POST /pix/validar`, `POST /assinatura/codigo` e `/confirmar`, `POST /assinatura/documento`,
  `POST /assinatura/biometria`, `POST /ccb/assinar`). `src/api/mock.ts` implementa com dados fictícios.
  Para produção, crie um `ConsignadoApi` HTTP e injete em `src/main.tsx`.
- `src/flow/useConsignado.ts` — estado da jornada, gates de cada passo e espelho do passo na URL
  (`?step=N`; acesso direto ou voltar do navegador nunca pula pré-requisitos).
- `src/flow/steps/` — as cinco telas; `steps/assinatura/` — as etapas da assinatura e a captura facial
  (`FaceCapture.tsx`: a liveness é simulada por tempo; em produção, o SDK do fornecedor de biometria
  conduz a captura e o back-end compara com a foto do documento). `DocModal.tsx` — Termos/Privacidade/LGPD.

## Diferenças em relação ao protótipo

- Parcela/total seguem o README do handoff (R$ 308,34 / R$ 11.100,24, PMT truncado). O protótipo
  arredondava para R$ 308,35 / R$ 11.100,42. Em produção o valor vem da API.
- Helper/erro do Input ancorado pelo topo: no DS (`bottom:-20px`) um texto de 2 linhas sobrepõe o campo no celular.
- Links "Termo"/"Política"/"Termos"/"Privacidade" são `<button>` com estilo de link (dentro do `<label>`
  do aceite não marcam o checkbox). Modal fecha com Esc e devolve o foco.
- A assinatura deixou de ser um OTP único: virou checklist de 5 etapas (CCB, e-mail, SMS, documento, facial).
- Código inválido e falha ao carregar a proposta têm mensagem de erro (não existiam no protótipo).
- "Reiniciar demonstração" não foi implementado (só existia no protótipo).

## Pendências de produto

- Textos de Termos, Privacidade e cláusulas da CCB são provisórios (jurídico).
- "Ler documento completo", "Ver CCB assinada" e "Acompanhar protocolo" ainda sem destino.
