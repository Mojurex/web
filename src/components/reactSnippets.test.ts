import { describe, expect, it } from "vitest";
import { componentName } from "./reactSnippets";

describe("componentName", () => {
  it("файлын нэрээс компонентын нэр гаргана", () => {
    expect(componentName("App.jsx")).toBe("App");
    expect(componentName("components/ProductCard.jsx")).toBe("ProductCard");
    expect(componentName("components/header.jsx")).toBe("Header");
    expect(componentName("user-card.jsx")).toBe("Usercard");
  });
});
