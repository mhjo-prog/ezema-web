// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from "vitest";
import { toThumbUrl } from "./imageUtils";

// ── toThumbUrl 단위 테스트 ─────────────────────────────────────────
describe("toThumbUrl", () => {
  it("파일명 앞에 thumb_ 접두사를 붙인다", () => {
    const original = "https://xxx.supabase.co/storage/v1/object/public/post-images/posts/abc_123.webp";
    const expected = "https://xxx.supabase.co/storage/v1/object/public/post-images/posts/thumb_abc_123.webp";
    expect(toThumbUrl(original)).toBe(expected);
  });

  it("중첩 경로에서도 마지막 파일명에만 접두사를 붙인다", () => {
    const original = "https://example.com/a/b/c/image.jpg";
    expect(toThumbUrl(original)).toBe("https://example.com/a/b/c/thumb_image.jpg");
  });

  it("이미 thumb_ 접두사가 있어도 한 번 더 붙인다 (정책상 thumb는 이 함수로 다시 변환하지 않음)", () => {
    const original = "https://example.com/posts/thumb_img.webp";
    expect(toThumbUrl(original)).toBe("https://example.com/posts/thumb_thumb_img.webp");
  });
});

// ── compressImage canvas mock 테스트 ──────────────────────────────
describe("compressImage", () => {
  beforeAll(() => {
    // jsdom은 실제 canvas 렌더링을 지원하지 않으므로 핵심 동작만 mock
    const mockCtx = { drawImage: vi.fn() };

    // HTMLCanvasElement.getContext mock
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);

    // HTMLCanvasElement.toBlob mock — ~8KB blob 반환
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (callback: BlobCallback, type?: string) {
        callback(new Blob([new Uint8Array(8000)], { type: type ?? "image/webp" }));
      }
    );

    // HTMLCanvasElement.toDataURL mock — WebP 지원 감지용
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/webp;base64,AA==");

    // URL.createObjectURL / revokeObjectURL mock
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: () => "blob:mock",
      revokeObjectURL: () => {},
    });

    // Image 로드 즉시 완료 mock (naturalWidth/Height 설정)
    vi.stubGlobal("Image", class {
      naturalWidth = 2400;
      naturalHeight = 1600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) { setTimeout(() => this.onload?.(), 0); }
    });
  });

  it("compressImage가 CompressResult를 반환하고 blob.size가 양수이다", async () => {
    const { compressImage } = await import("./imageUtils");

    const fakeFile = new File([new Uint8Array(150_000)], "test.jpg", { type: "image/jpeg" });
    const result = await compressImage(fakeFile, 1200);

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.ext).toMatch(/webp|jpg/);
    expect(result.mimeType).toMatch(/image\/(webp|jpeg)/);
    expect(result.originalBytes).toBe(150_000);
    expect(result.compressedBytes).toBe(result.blob.size);
  });

  it("원본이 maxWidth보다 작으면 scale=1로 그대로 처리된다 — blob이 반환된다", async () => {
    // Image mock을 800px로 교체 (800 < 3000 → scale=1)
    vi.stubGlobal("Image", class {
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      set src(_: string) { setTimeout(() => this.onload?.(), 0); }
    });

    const { compressImage } = await import("./imageUtils");
    const fakeFile = new File([new Uint8Array(50_000)], "small.jpg", { type: "image/jpeg" });
    const result = await compressImage(fakeFile, 3000);

    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.compressedBytes).toBe(8000); // mock blob 크기
  });
});
