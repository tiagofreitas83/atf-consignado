import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { createMockApi } from "../api/mock";
import { DemoSpeed } from "../flow/timing";

const seguir = () => screen.getByRole("button", { name: /^Seguir$/ });

function renderApp(pix: "cadastrado" | "sem-chave" = "cadastrado") {
  return render(
    <DemoSpeed.Provider value={0}>
      <App api={createMockApi({ latency: 0, pixResultado: pix })} />
    </DemoSpeed.Provider>,
  );
}

type User = ReturnType<typeof userEvent.setup>;

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

async function ateAssinatura() {
  const user = await ateRecebimento();
  await user.type(screen.getByLabelText("Chave Pix (CPF)"), "12345678909");
  await user.click(screen.getByRole("button", { name: "Validar chave Pix" }));
  await screen.findByText("Chave validada");
  await user.click(screen.getByRole("button", { name: /Seguir para assinatura/ }));
  await screen.findByRole("heading", { name: /Assine a sua Cédula/ });
  return user;
}

async function ateRecebimento(pix: "cadastrado" | "sem-chave" = "cadastrado") {
  const user = userEvent.setup();
  renderApp(pix);
  expect(seguir()).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  await waitFor(() => expect(seguir()).toBeEnabled());
  await user.click(seguir());
  await screen.findByRole("heading", { name: "R$ 8.000,00" });
  expect(screen.getByText("1,89% a.m. · 25,19% a.a.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Confirmar proposta/ }));
  await screen.findByRole("heading", { name: "Onde você quer receber?" });
  return user;
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.scrollTo = vi.fn() as never;
});

describe("jornada", () => {
  it("vai do consentimento ao protocolo", async () => {
    const user = await ateRecebimento();
    expect(window.location.search).toBe("?step=3");
    const cpf = screen.getByLabelText("Chave Pix (CPF)");
    const proximo = screen.getByRole("button", { name: /Seguir para assinatura/ });

    await user.type(cpf, "11111111111");
    expect(screen.getByText("CPF inválido.")).toBeInTheDocument();
    await user.clear(cpf);
    await user.type(cpf, "52998224725");
    expect(screen.getByText("A chave precisa ser o CPF do titular do crédito.")).toBeInTheDocument();
    await user.clear(cpf);
    await user.type(cpf, "12345678909");
    expect(cpf).toHaveValue("123.456.789-09");
    expect(proximo).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Validar chave Pix" }));
    await screen.findByText("Chave validada");
    expect(screen.getByText(/Nu Pagamentos S\.A\. \(260\)/)).toBeInTheDocument();
    expect(proximo).toBeEnabled();

    await user.click(proximo);
    await screen.findByRole("heading", { name: /Assine a sua Cédula/ });
    await assinarTudo(user);
    await screen.findByRole("heading", { name: /Pronto, Mariana!/ });
    expect(screen.getByText("CP 2026 1016 48213")).toBeInTheDocument();
    expect(window.location.search).toBe("?step=5");
    expect(screen.queryByRole("button", { name: /Acompanhar protocolo/ })).not.toBeInTheDocument();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await user.click(screen.getByRole("button", { name: "Copiar protocolo" }));
    expect(writeText).toHaveBeenCalledWith("CP 2026 1016 48213");
    await screen.findByRole("button", { name: "Protocolo copiado" });
  });

  it("CPF sem chave Pix abre o tutorial e permite validar de novo", async () => {
    const user = await ateRecebimento("sem-chave");
    await user.type(screen.getByLabelText("Chave Pix (CPF)"), "12345678909");
    await user.click(screen.getByRole("button", { name: "Validar chave Pix" }));
    await screen.findByText("Seu CPF ainda não é uma chave Pix");
    expect(screen.getByText("Cadastre a chave CPF")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /validar novamente/ }));
    await screen.findByText("Chave validada");
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

  it("digitaliza o RG (frente e verso) pela câmera", async () => {
    const user = await ateAssinatura();
    await aceitarCcb(user);
    await confirmarCodigo(user, "Código do e-mail");
    await confirmarCodigo(user, "Código do SMS");
    await user.click(await screen.findByText("RG"));
    await user.click(screen.getByText("Fotografar o documento"));
    await user.click(screen.getByRole("button", { name: /Abrir câmera/ }));
    // jsdom não tem câmera: segue pelo modo simulado.
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
    expect(screen.getByRole("button", { name: /Iniciar reconhecimento/ })).toBeInTheDocument();
  });

  it("passo 3 não pede mais e-mail nem celular", async () => {
    await ateRecebimento();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Celular")).not.toBeInTheDocument();
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

  it("acesso direto a ?step=4 cai no passo 1", async () => {
    window.history.replaceState(null, "", "/?step=4");
    render(<App api={createMockApi({ latency: 0 })} />);
    expect(screen.getByRole("heading", { name: /Consignado privado/ })).toBeInTheDocument();
    expect(window.location.search).toBe("?step=1");
  });

  it("voltar do navegador não pula gates", async () => {
    await ateRecebimento();
    act(() => {
      window.history.pushState(null, "", "/?step=4");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("heading", { name: "Onde você quer receber?" })).toBeInTheDocument();
    expect(window.location.search).toBe("?step=3");
  });

  it("modal de termos abre e fecha com Esc", async () => {
    const user = userEvent.setup();
    render(<App api={createMockApi({ latency: 0 })} />);
    await user.click(screen.getAllByRole("button", { name: "Termo de consentimento" })[0]);
    expect(screen.getByRole("dialog", { name: "Termo de consentimento" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "LGPD" }));
    expect(screen.getByRole("dialog", { name: "LGPD" })).toBeInTheDocument();
  });
});
