# ATF Consignado Privado

Jornada de contratação de crédito consignado privado da ATF SCD S.A. (instituição 513), em 5 passos:
boas-vindas/consentimento → proposta → recebimento (Pix CPF) → assinatura da CCB (OTP) → protocolo.

React 19 + Vite + TypeScript + Tailwind 4. A especificação de design está em [`HANDOFF.md`](HANDOFF.md).

```bash
npm install   # depois: mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules
npm run dev   # http://localhost:5173
npm test
npm run build
```

Simulação no mock: `?pix=sem-chave` (a primeira validação Pix falha) e `?horas=N` (prazo do Pix).
OTP `000000` simula código inválido.

## Estrutura

- `src/ds/` — port dos componentes do ATF Design System usados aqui (Button, IconButton, Input,
  Checkbox, Spinner, Icon e máscaras), fiel ao `_ds_bundle.js` do handoff. Quando o DS virar pacote,
  troque os imports de `./ds` por ele.
- `src/api/types.ts` — contrato com o back-end (`GET /proposta`, `POST /consentimentos`,
  `POST /pix/validar`, `POST /ccb/otp`, `POST /ccb/assinar`). `src/api/mock.ts` implementa com dados fictícios.
  Para produção, crie um `ConsignadoApi` HTTP e injete em `src/main.tsx`.
- `src/flow/useConsignado.ts` — estado da jornada, gates de cada passo e espelho do passo na URL
  (`?step=N`; acesso direto ou voltar do navegador nunca pula pré-requisitos).
- `src/flow/steps/` — as cinco telas; `DocModal.tsx` — Termos/Privacidade.

## Diferenças em relação ao protótipo

- Parcela/total seguem o README do handoff (R$ 308,34 / R$ 11.100,24, PMT truncado). O protótipo
  arredondava para R$ 308,35 / R$ 11.100,42. Em produção o valor vem da API.
- Helper/erro do Input ancorado pelo topo: no DS (`bottom:-20px`) um texto de 2 linhas sobrepõe o campo no celular.
- Links "Termo"/"Política"/"Termos"/"Privacidade" são `<button>` com estilo de link (dentro do `<label>`
  do aceite não marcam o checkbox). Modal fecha com Esc e devolve o foco.
- OTP inválido e falha ao carregar a proposta têm mensagem de erro (não existiam no protótipo).
- "Reiniciar demonstração" não foi implementado (só existia no protótipo).

## Pendências de produto

- Textos de Termos, Privacidade e cláusulas da CCB são provisórios (jurídico).
- "Ler documento completo", "Ver CCB assinada" e "Acompanhar protocolo" ainda sem destino.
