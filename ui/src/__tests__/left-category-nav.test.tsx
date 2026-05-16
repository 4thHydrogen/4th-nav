import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LeftCategoryNav from "../components/LeftCategoryNav";

describe("LeftCategoryNav", () => {
  it("renders an mTab-style settings entry that links to admin without a login entry", () => {
    render(
      <LeftCategoryNav
        categories={["Common", "Development"]}
        activeCategory="Common"
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByLabelText("管理后台")).toHaveAttribute("href", "/admin");
    expect(screen.queryByText("登录")).not.toBeInTheDocument();
  });
});
