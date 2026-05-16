import { describe, it, expect } from "vitest";
import type { DataType } from "../pages/admin/tabs/Tools/DraggableRow";
import type { Catelog } from "../types";

describe("DataType interface", () => {
  it("accepts objects with id, name, sort and extra fields", () => {
    const row: DataType = {
      id: 1,
      name: "Test Tool",
      sort: 0,
      url: "https://example.com",
      catelog: "dev",
      desc: "A test",
    };
    expect(row.id).toBe(1);
    expect(row.name).toBe("Test Tool");
  });

  it("allows index signature access", () => {
    const row: DataType = {
      id: 2,
      name: "Another",
      sort: 1,
      extra: "field",
    };
    expect(row["extra"]).toBe("field");
  });
});

describe("ToolFormModal types", () => {
  it("getOptions transforms Catelog[] to select options", async () => {
    const { getOptions } = await import("../utils/admin");
    const catelogs: Catelog[] = [
      { id: 1, name: "开发", sort: 0, hide: false },
      { id: 2, name: "设计", sort: 1, hide: false },
    ];
    const options = getOptions(catelogs);
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ label: "开发", value: "开发", key: 1 });
    expect(options[1]).toEqual({ label: "设计", value: "设计", key: 2 });
  });
});

describe("Tools component structure", () => {
  it("DraggableRow module exports Row and DragHandle", async () => {
    const mod = await import("../pages/admin/tabs/Tools/DraggableRow");
    expect(typeof mod.Row).toBe("function");
    expect(typeof mod.DragHandle).toBe("function");
  });

  it("ToolFormModal module exports default component", async () => {
    const mod = await import("../pages/admin/tabs/Tools/ToolFormModal");
    expect(mod.default).toBeDefined();
  });

  it("Tools index exports Tools named export", async () => {
    const mod = await import("../pages/admin/tabs/Tools");
    expect(typeof mod.Tools).toBe("function");
  });
});

describe("CRUD handler type compatibility", () => {
  it("DataType row can be cast to UpdateToolDto shape", () => {
    const row: DataType = {
      id: 1,
      name: "Tool",
      sort: 0,
      url: "https://example.com",
      logo: "",
      catelog: "dev",
      desc: "desc",
      hide: false,
    };
    const dto = row as unknown as {
      id: number;
      name: string;
      url: string;
      logo: string;
      catelog: string;
      desc: string;
      sort: number;
      hide: boolean;
    };
    expect(dto.id).toBe(1);
    expect(dto.name).toBe("Tool");
  });
});
