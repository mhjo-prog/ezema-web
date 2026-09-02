/**
 * 클라이언트 사이드 이미지 압축 유틸리티
 * - canvas API만 사용 (외부 라이브러리 없음)
 * - WebP 미지원 브라우저는 JPEG로 폴백
 */

/** WebP 지원 여부를 한 번만 감지해서 캐시 */
let _webpSupported: boolean | null = null;
function supportsWebP(): boolean {
  if (_webpSupported !== null) return _webpSupported;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  _webpSupported = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return _webpSupported;
}

export interface CompressResult {
  blob: Blob;
  mimeType: string;
  ext: string;
  originalBytes: number;
  compressedBytes: number;
}

/**
 * 이미지를 리사이즈 + 재인코딩해서 Blob으로 반환한다.
 * @param file    원본 File 객체
 * @param maxWidth 가로 최대 픽셀 (원본이 더 작으면 그대로)
 * @param quality  인코딩 품질 0~1 (기본 0.8)
 */
export function compressImage(
  file: File,
  maxWidth: number,
  quality = 0.8
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas 2d context 생성 실패")); return; }
      ctx.drawImage(img, 0, 0, w, h);

      const mimeType = supportsWebP() ? "image/webp" : "image/jpeg";
      const ext = supportsWebP() ? "webp" : "jpg";

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("canvas.toBlob 실패")); return; }
          console.log(
            `[imageUtils] 압축 완료: ${(file.size / 1024).toFixed(0)}KB → ` +
            `${(blob.size / 1024).toFixed(0)}KB ` +
            `(${Math.round((1 - blob.size / file.size) * 100)}% 감소, ${ext})`
          );
          resolve({ blob, mimeType, ext, originalBytes: file.size, compressedBytes: blob.size });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지 로드 실패"));
    };

    img.src = objectUrl;
  });
}

/**
 * card_image_url로부터 썸네일 URL 유도
 * posts/abc_123.webp → posts/thumb_abc_123.webp
 */
export function toThumbUrl(cardImageUrl: string): string {
  const lastSlash = cardImageUrl.lastIndexOf("/");
  return cardImageUrl.slice(0, lastSlash + 1) + "thumb_" + cardImageUrl.slice(lastSlash + 1);
}
