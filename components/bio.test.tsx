import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Bio } from "./bio";

const expectedLinks = {
  "Juniper Square": "https://www.junipersquare.com",
  Blog: "/blog",
  "CELab podcast": "/blog/on-the-celab-podcast",
  LinkedIn: "https://www.linkedin.com/in/kelly-mullaney-ced",
  GitHub: "https://github.com/kelly-vibe-coding",
  Email: "mailto:kelly@mullaney.ai",
} as const;

describe("Bio", () => {
  it("renders Kelly's bio structure, anchor facts, and links", () => {
    render(<Bio />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Kelly Mullaney" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent ===
          "These days I run Internal Applied AI at Juniper Square",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Humbled former amateur boxer")).toBeInTheDocument();

    expect(screen.getByText("Some things about me:")).toBeInTheDocument();
    expect(screen.getByText("Some things I’ve put out:")).toBeInTheDocument();
    expect(screen.getByText("Where to find me:")).toBeInTheDocument();

    for (const [name, href] of Object.entries(expectedLinks)) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});
