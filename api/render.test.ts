import { describe, it, expect } from "vitest";
import { injectMeta } from "./render.js";

const TEMPLATE = `<!doctype html><html lang="ko"><head><title>Old Title</title><meta name="description" content="old desc"><meta property="og:title" content="old og title"><meta property="og:description" content="old og desc"><meta property="og:url" content="https://keepslow.kr/old"><link rel="canonical" href="https://keepslow.kr/old"></head><body><div id="root"></div></body></html>`;

describe("injectMeta", () => {
  it("replaces title", () => {
    const result = injectMeta(TEMPLATE, { title: "New Title", description: "desc", canonical: "https://keepslow.kr/sasang/abc" });
    expect(result).toContain("<title>New Title</title>");
    expect(result).not.toContain("<title>Old Title</title>");
  });

  it("replaces meta description", () => {
    const result = injectMeta(TEMPLATE, { title: "T", description: "New Desc", canonical: "https://keepslow.kr/" });
    expect(result).toContain('content="New Desc"');
    expect(result).not.toContain('content="old desc"');
  });

  it("replaces og:title", () => {
    const result = injectMeta(TEMPLATE, { title: "New OG", description: "d", canonical: "https://keepslow.kr/" });
    expect(result).toContain('property="og:title" content="New OG"');
  });

  it("replaces canonical href", () => {
    const result = injectMeta(TEMPLATE, { title: "T", description: "d", canonical: "https://keepslow.kr/sasang/abc" });
    expect(result).toContain('href="https://keepslow.kr/sasang/abc"');
    expect(result).not.toContain('href="https://keepslow.kr/old"');
  });

  it("injects body content into #root", () => {
    const result = injectMeta(TEMPLATE, { title: "T", description: "d", canonical: "https://keepslow.kr/", bodyContent: "<h1>Hello</h1>" });
    expect(result).toContain('<div id="root"><h1>Hello</h1></div>');
  });

  it("injects extraHead before </head>", () => {
    const result = injectMeta(TEMPLATE, { title: "T", description: "d", canonical: "https://keepslow.kr/", extraHead: '<script type="application/ld+json">{"@type":"Article"}</script>' });
    expect(result).toContain('"@type":"Article"');
    const headEnd = result.indexOf("</head>");
    const scriptPos = result.indexOf('"@type":"Article"');
    expect(scriptPos).toBeLessThan(headEnd);
  });

  it("injects robots meta when provided", () => {
    const result = injectMeta(TEMPLATE, { title: "T", description: "d", canonical: "https://keepslow.kr/", robots: "noindex, follow" });
    expect(result).toContain('<meta name="robots" content="noindex, follow">');
  });

  it("escapes HTML entities in title", () => {
    const result = injectMeta(TEMPLATE, { title: 'A & B "test"', description: "d", canonical: "https://keepslow.kr/" });
    expect(result).toContain("<title>A &amp; B &quot;test&quot;</title>");
  });
});
