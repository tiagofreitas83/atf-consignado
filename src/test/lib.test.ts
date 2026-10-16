import { describe, expect, it } from "vitest";
import { cpfValido } from "../lib/cpf";
import { brl, celularMascarado, mesAno, taxaAmAa } from "../lib/format";
import { maskCPF, maskPhoneBR } from "../ds/masks";
import { createMockApi, pmt } from "../api/mock";

describe("cpf", () => {
  it("valida dígitos verificadores", () => {
    expect(cpfValido("12345678909")).toBe(true);
    expect(cpfValido("12345678900")).toBe(false);
    expect(cpfValido("11111111111")).toBe(false);
    expect(cpfValido("1234567890")).toBe(false);
  });
});

describe("máscaras", () => {
  it("CPF e celular", () => {
    expect(maskCPF("12345678909999")).toBe("123.456.789-09");
    expect(maskPhoneBR("11987654321")).toBe("(11) 98765-4321");
  });
});

describe("formatação", () => {
  it("valores da proposta", () => {
    expect(brl(8000)).toBe("R$ 8.000,00");
    expect(brl(11100.24)).toBe("R$ 11.100,24");
    expect(taxaAmAa(0.0189, 0.2519)).toBe("1,89% a.m. · 25,19% a.a.");
    expect(mesAno("2026-12")).toBe("dezembro de 2026");
    expect(celularMascarado("11987654321")).toBe("(11) •••••-4321");
  });
});

describe("mock da proposta", () => {
  it("Tabela Price bate com o handoff", async () => {
    expect(pmt(8000, 0.0189, 36)).toBeCloseTo(308.345, 3);
    const p = await createMockApi({ latency: 0 }).getProposta();
    expect(p.parcela).toBe(308.34);
    expect(p.total).toBe(11100.24);
  });
});
