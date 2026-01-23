import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("should render the message correctly", () => {
    const testMessage = "暂无数据";
    render(<EmptyState message={testMessage} />);
    
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    const { container } = render(<EmptyState message="Test message" />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("flex-col");
    expect(wrapper).toHaveClass("items-center");
    expect(wrapper).toHaveClass("justify-center");
    expect(wrapper).toHaveClass("py-12");
    expect(wrapper).toHaveClass("text-gray-400");
  });

  it("should render an SVG icon", () => {
    const { container } = render(<EmptyState message="Test" />);
    
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("w-16");
    expect(svg).toHaveClass("h-16");
    expect(svg).toHaveClass("mb-4");
  });

  it("should render message with correct text size", () => {
    render(<EmptyState message="Test message" />);
    
    const message = screen.getByText("Test message");
    expect(message).toHaveClass("text-sm");
  });
});
