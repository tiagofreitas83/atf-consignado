import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { createMockApi, type CenarioPix } from "../api/mock";
import { DemoSpeed } from "../flow/timing";

const TOKEN = "k7Qx2mLw9ZvR4nH6sT0b";
type User = ReturnType<typeof userEvent.setup>;

const seguir = () => screen.getByRole("button", { name: /^Seguir$/ });

function renderApp(pix: CenarioPix = "cpf") {
  return render(
    <DemoSpeed.Provider value={0}>
      <App api={createMockApi({ latency: 0, pix })} token={TOKEN} />
    </DemoSpeed.Provider>,
  );
}

async function ateConfirmarCpf(pix: CenarioPix = "cpf") {
  const user = userEvent.setup();
  renderApp(pix);
  expect(seguir()).toBeDisabled();
  expect(screen.queryByLabelText("Seu CPF")).not.toBeInTheDocument();
  await user.click(screen.getByRole("checkbox"));
  // O CPF aparece na própria página, depois do aceite; sem ele, "Seguir" não libera.
  await screen.findByLabelText("Seu CPF");
  expect(seguir()).toBeDisabled();
  return user;
}

async function verificarCpf(user: User, cpf: string) {
  const campo = screen.getByLabelText("Seu CPF");
  await user.clear(campo);
  await user.type(campo, cpf);
  await waitFor(() => expect(seguir()).toBeEnabled());
  await user.click(seguir());
}

async function ateRecebimento(pix: CenarioPix = "cpf") {
  const user = await ateConfirmarCpf(pix);
  await verificarCpf(user, "12345678909");
  await screen.findByRole("heading", { name: "R$ 8.000,00" });
  await user.click(screen.getByRole("button", { name: /Confirmar proposta/ }));
  await screen.findByRole("heading", { name: "Onde você quer receber?" });
  return user;
}

async function ateAssinatura() {
  const user = await ateRecebimento();
  await screen.findByRole("radio", { name: /Nu Pagamentos/ });
  await user.click(screen.getByRole("button", { name: /Seguir para assinatura/ }));
  await screen.findByRole("heading", { name: /Assine a sua Cédula/ });
  return user;
}

async function aceitarCcb(user: User) {
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Continuar" }));
}

async function confirmarCodigo(user: User, label: string) {
  await user.click(await screen.findByRole("button", { name: "Enviar código" }));
  await user.type(await screen.findByLabelText(label), "123456");
  await user.click(screen.getByRole("button", { name: "Confirmar código" }));
}

/** Percorre as 5 etapas da assinatura e assina. */
async function assinarTudo(user: User) {
  const assinar = screen.getByRole("button", { name: /Assinar CCB/ });
  expect(assinar).toBeDisabled();
  await aceitarCcb(user);
  // E-mail e celular vêm da proposta, pré-preenchidos, para conferir antes do envio.
  expect(screen.getByLabelText("E-mail")).toHaveValue("mariana.lima@email.com");
  await confirmarCodigo(user, "Código do e-mail");
  expect(screen.getByLabelText("Celular")).toHaveValue("(11) 98765-4321");
  await confirmarCodigo(user, "Código do SMS");
  await user.click(await screen.findByText("CNH"));
  await user.click(screen.getByText("Enviar PDF da carteira digital"));
  await user.click(screen.getByRole("button", { name: "usar documento de exemplo" }));
  await screen.findByText("CNH validado pela carteira digital");
  await user.click(screen.getByRole("button", { name: /Iniciar reconhecimento/ }));
  // jsdom não tem câmera: cai no aviso e segue pelo modo simulado.
  await user.click(await screen.findByRole("button", { name: "Simular sem câmera" }));
  await screen.findByText("Prova de vida concluída");
  await screen.findByText(/Tudo pronto para assinar/);
  expect(assinar).toBeEnabled();
  await user.click(assinar);
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.scrollTo = vi.fn() as never;
});

describe("confirmação do CPF", () => {
  it("não mostra nenhum dado da proposta antes de o CPF conferir", async () => {
    const user = await ateConfirmarCpf();
    expect(screen.queryByText(/Mariana/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Metalúrgica/)).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Seu CPF"), "11111111111");
    expect(screen.getByText("CPF inválido.")).toBeInTheDocument();
    expect(seguir()).toBeDisabled();

    await verificarCpf(user, "52998224725");
    await screen.findByText("Este CPF não confere com o link. Você ainda tem 2 tentativas.");
    expect(screen.queryByText(/Mariana/)).not.toBeInTheDocument();

    await verificarCpf(user, "12345678909");
    await screen.findByText("Olá, Mariana. Esta é a sua proposta.");
    expect(screen.getByText("Metalúrgica Aurora Ltda")).toBeInTheDocument();
  });

  it("bloqueia o link depois de 3 CPFs que não conferem", async () => {
    const user = await ateConfirmarCpf();
    await verificarCpf(user, "52998224725");
    await screen.findByText(/2 tentativas/);
    await verificarCpf(user, "52998224725");
    await screen.findByText(/1 tentativa\./);
    await verificarCpf(user, "52998224725");
    await screen.findByText("Bloqueamos este link por segurança");
    expect(screen.queryByLabelText("Seu CPF")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Seguir$/ })).not.toBeInTheDocument();
  });
});

describe("recebimento", () => {
  it("banco da chave CPF já escolhido; regra das chaves só em outro banco", async () => {
    await ateRecebimento();
    expect(screen.queryByText("Vale qualquer chave Pix sua, Mariana")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("CPF do titular")).not.toBeInTheDocument();
    expect(await screen.findByRole("radio", { name: /Nu Pagamentos S\.A\. \(260\)/ })).toBeChecked();
    expect(screen.getByRole("button", { name: /Seguir para assinatura/ })).toBeEnabled();
  });

  it("outro banco: escolhe a opção, informa outra chave e a verificação acontece ao seguir", async () => {
    const user = await ateRecebimento();
    await user.click(await screen.findByRole("radio", { name: /Outro banco/ }));
    expect(screen.getByText("Vale qualquer chave Pix sua, Mariana")).toBeInTheDocument();
    const proximo = screen.getByRole("button", { name: /Seguir para assinatura/ });
    expect(proximo).toBeDisabled();
    await user.type(screen.getByLabelText("Chave Pix"), "mariana.lima@email.com");
    expect(proximo).toBeEnabled();
    await user.click(proximo);
    await screen.findByRole("heading", { name: /Assine a sua Cédula/ });
  });

  it("ajuda: cadastrar chave nova e mudar a chave CPF de banco", async () => {
    const user = await ateRecebimento();
    await user.click(await screen.findByRole("radio", { name: /Outro banco/ }));
    await user.click(screen.getByRole("button", { name: "Quero mudar a chave de banco" }));
    const ajuda = screen.getByRole("dialog", { name: "Como preparar sua chave Pix" });
    expect(screen.getByRole("tab", { name: "Mudar chave de banco" })).toHaveAttribute("aria-selected", "true");
    expect(ajuda).toHaveTextContent("Aprove no app do Nu Pagamentos S.A.");
    await user.click(screen.getByRole("tab", { name: "Cadastrar chave nova" }));
    expect(ajuda).toHaveTextContent("Escolha celular, e-mail ou chave aleatória");
    expect(screen.queryByRole("button", { name: /verificar de novo/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("CPF não é chave, mas há outras: reconhece o tipo e só aceita chave da pessoa", async () => {
    const user = await ateRecebimento("outras-chaves");
    await screen.findByText("Encontramos chaves Pix suas, mas não a de CPF");
    const proximo = screen.getByRole("button", { name: /Seguir para assinatura/ });
    expect(proximo).toBeDisabled();

    const campo = screen.getByLabelText("Chave Pix");
    await user.type(campo, "fulano@outro.com");
    expect(screen.getByText("Identificamos: E-mail · fulano@outro.com")).toBeInTheDocument();
    await user.click(proximo);
    await screen.findByText(/Essa chave não está no seu nome, Mariana/);
    expect(screen.getByRole("heading", { name: "Onde você quer receber?" })).toBeInTheDocument();

    await user.clear(campo);
    await user.type(campo, "(11) 98765-4321");
    expect(screen.getByText("Identificamos: Celular · (11) 98765-4321")).toBeInTheDocument();
    // O banco aparece sozinho, sem precisar seguir.
    await screen.findByText("Itaú Unibanco S.A. (341)", {}, { timeout: 3000 });
    expect(screen.getByText("O valor vai para")).toBeInTheDocument();
    await user.click(proximo);
    await screen.findByRole("heading", { name: /Assine a sua Cédula/ });
  });

  it("nenhuma chave: aviso, tutorial de criação e nova verificação", async () => {
    const user = await ateRecebimento("sem-chaves");
    await screen.findByText("Você ainda não tem chave Pix");
    expect(screen.getByText("Como criar uma chave Pix")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seguir para assinatura/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Já criei, verificar de novo" }));
    expect(await screen.findByRole("radio", { name: /Nu Pagamentos/ })).toBeChecked();
  });
});

describe("jornada", () => {
  it("vai do consentimento ao protocolo", async () => {
    const user = await ateAssinatura();
    expect(window.location.search).toBe("?step=4");
    await assinarTudo(user);
    await screen.findByRole("heading", { name: /Pronto, Mariana!/ });
    expect(screen.getByText("CP 2026 1016 48213")).toBeInTheDocument();
    expect(screen.getByText(/serão enviados por Pix para Nu Pagamentos S\.A\. \(260\)/)).toBeInTheDocument();
    expect(window.location.search).toBe("?step=5");

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await user.click(screen.getByRole("button", { name: "Copiar protocolo" }));
    expect(writeText).toHaveBeenCalledWith("CP 2026 1016 48213");
    await screen.findByRole("button", { name: "Protocolo copiado" });
  });

  it("código do e-mail inválido mostra erro e não avança", async () => {
    const user = await ateAssinatura();
    await aceitarCcb(user);
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    await user.type(await screen.findByLabelText("Código do e-mail"), "000000");
    await user.click(screen.getByRole("button", { name: "Confirmar código" }));
    await screen.findByText(/Código inválido. Confira o e-mail/);
    expect(screen.queryByLabelText("Código do SMS")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Assinar CCB/ })).toBeDisabled();
  });

  it("reenviar o código só libera depois de 30 segundos", async () => {
    const user = await ateAssinatura();
    await aceitarCcb(user);
    const agora = Date.now();
    const relogio = vi.spyOn(Date, "now").mockReturnValue(agora);
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    await screen.findByLabelText("Código do e-mail");
    expect(screen.getByText(/Reenviar código em/)).toHaveTextContent("0:30");
    expect(screen.queryByRole("button", { name: "Reenviar código" })).not.toBeInTheDocument();
    relogio.mockReturnValue(agora + 30_000);
    expect(await screen.findByRole("button", { name: "Reenviar código" }, { timeout: 2000 })).toBeEnabled();
    relogio.mockRestore();
  });

  it("e-mail inválido não deixa enviar o código; alterar o celular reabre a edição", async () => {
    const user = await ateAssinatura();
    await aceitarCcb(user);
    const email = screen.getByLabelText("E-mail");
    await user.clear(email);
    await user.type(email, "mariana@");
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar código" })).toBeDisabled();
    await user.type(email, "email.com");
    await confirmarCodigo(user, "Código do e-mail");

    await user.click(await screen.findByRole("button", { name: "Enviar código" }));
    await screen.findByLabelText("Código do SMS");
    await user.click(screen.getByRole("button", { name: "Alterar celular" }));
    const cel = screen.getByLabelText("Celular");
    await user.clear(cel);
    await user.type(cel, "11912345678");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByText("(11) •••••-5678")).toBeInTheDocument();
    expect(screen.getByText(/m•••••@email.com confirmado/)).toBeInTheDocument();
  });

  it("digitaliza o RG (frente e verso) pela câmera", async () => {
    const user = await ateAssinatura();
    await aceitarCcb(user);
    await confirmarCodigo(user, "Código do e-mail");
    await confirmarCodigo(user, "Código do SMS");
    await user.click(await screen.findByText("RG"));
    await user.click(screen.getByText("Fotografar o documento"));
    await user.click(screen.getByRole("button", { name: /Abrir câmera/ }));
    await user.click(await screen.findByRole("button", { name: "Simular sem câmera" }));
    expect(screen.getByText("Encaixe a frente do RG na moldura")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Tirar foto da frente/ }));
    await user.click(screen.getByRole("button", { name: /Usar foto e fotografar o verso/ }));
    expect(screen.getByText("Encaixe o verso do RG na moldura")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Tirar foto do verso/ }));
    await user.click(screen.getByRole("button", { name: /Tirar outra foto/ }));
    await user.click(screen.getByRole("button", { name: /Tirar foto do verso/ }));
    await user.click(screen.getByRole("button", { name: /Usar foto e enviar/ }));
    await screen.findByText("RG validado por foto");
  });

  it("acesso direto a ?step=4 cai no passo 1", async () => {
    window.history.replaceState(null, "", "/?step=4");
    renderApp();
    expect(screen.getByRole("heading", { name: /Consignado privado/ })).toBeInTheDocument();
    expect(window.location.search).toBe("?step=1");
  });

  it("voltar/avançar do navegador não pula gates", async () => {
    // Sem chave Pix, o passo 4 ainda não está liberado.
    await ateRecebimento("sem-chaves");
    await screen.findByText("Você ainda não tem chave Pix");
    act(() => {
      window.history.pushState(null, "", "/?step=4");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("heading", { name: "Onde você quer receber?" })).toBeInTheDocument();
    expect(window.location.search).toBe("?step=3");
  });

  it("modais de termo e de privacidade/LGPD abrem e fecham", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getAllByRole("button", { name: "Termo de consentimento" })[0]);
    expect(screen.getByRole("dialog", { name: "Termo de consentimento" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Política de Privacidade e LGPD" }));
    expect(screen.getByRole("dialog", { name: "Política de Privacidade e LGPD" })).toBeInTheDocument();
  });
});
