#!/usr/bin/env node
/**
 * Supabase Storage 이미지 일괄 압축
 * ---------------------------------------------------------------
 * post-images 버킷의 이미지를 리사이즈 + 재압축해서 같은 경로에 덮어씁니다.
 * 파일명과 URL이 그대로라 DB도 코드도 수정할 필요가 없습니다.
 *
 * 실행 전 반드시 --dry-run 으로 먼저 확인하세요 (기본값).
 *
 *   설치:      npm i -D sharp
 *   미리보기:  node scripts/compress-storage-images.mjs
 *   실제 실행: node scripts/compress-storage-images.mjs --live
 *
 * 환경변수 (.env.local 또는 셸에서):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...      ← service_role 키 (anon 키로는 덮어쓰기 불가)
 *
 * ⚠️  service_role 키는 절대 git에 커밋하지 마세요. .env.local 은 .gitignore 에 있어야 합니다.
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────
// 설정
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  bucket: 'post-images',

  // 이 크기 미만 파일은 건드리지 않음 (이미 충분히 가벼움)
  minSizeBytes: 150 * 1024,

  // 가로 최대 픽셀 (1200px 초과는 리사이즈)
  maxWidth: 1200,

  // WebP 품질 (0~100). 80이면 JPEG 95 수준의 화질에 파일 크기 40~60% 감소
  webpQuality: 80,

  // 건드리지 않을 파일 (thumb_ 접두사 포함 — 썸네일은 별도 관리)
  skipPatterns: [/^thumb_/i, /\/thumb_/i],

  // 브라우저 캐시 보관 기간 (초). 1년
  cacheControl: '31536000',

  // 원본 백업 폴더
  backupDir: './storage-backup',

  // 동시 처리 수
  concurrency: 4,
};

const LIVE = process.argv.includes('--live');

// ─────────────────────────────────────────────────────────────
// 환경변수 로드
// ─────────────────────────────────────────────────────────────
async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      /* 파일 없으면 무시 */
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const pct = (before, after) =>
  before === 0 ? '0%' : `${(((before - after) / before) * 100).toFixed(0)}%`;

/** 버킷 전체를 재귀적으로 훑어서 파일 목록을 만든다 */
async function listAllFiles(supabase, prefix = '') {
  const out = [];
  const pageSize = 100;
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage
      .from(CONFIG.bucket)
      .list(prefix, { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw new Error(`목록 조회 실패 (${prefix || '/'}): ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        // 폴더 → 재귀
        out.push(...(await listAllFiles(supabase, fullPath)));
      } else {
        out.push({
          path: fullPath,
          size: entry.metadata?.size ?? 0,
          mimetype: entry.metadata?.mimetype ?? '',
        });
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return out;
}

/** 이미지 한 장을 WebP로 변환. 파일명·경로는 그대로, Content-Type만 image/webp */
async function transform(buffer) {
  const img = sharp(buffer, { failOn: 'none' });
  const meta = await img.metadata();

  let pipeline = img.rotate(); // EXIF 회전 정보 반영
  if ((meta.width ?? 0) > CONFIG.maxWidth) {
    pipeline = pipeline.resize({ width: CONFIG.maxWidth, withoutEnlargement: true });
  }

  const converted = await pipeline
    .webp({ quality: CONFIG.webpQuality, effort: 4 })
    .toBuffer();

  return {
    buffer: converted,
    contentType: 'image/webp',
    note: `WebP q${CONFIG.webpQuality}`,
  };
}

/** 배열을 제한된 동시성으로 처리 */
async function mapLimit(items, limit, fn) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────
async function main() {
  await loadEnv();

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('❌ Supabase 환경변수가 필요합니다.');
    console.error('   URL  : SUPABASE_URL 또는 VITE_SUPABASE_URL');
    console.error('   KEY  : SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SERVICE_KEY');
    console.error('   .env 또는 .env.local 에 넣거나 셸 환경변수로 지정하세요.');
    console.error('   service_role 키는 Supabase 대시보드 → Settings → API 에서 확인합니다.');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Supabase Storage 이미지 압축  [${LIVE ? '실제 실행' : '미리보기 (dry-run)'}]`);
  console.log('════════════════════════════════════════════════════');
  console.log(`  버킷        : ${CONFIG.bucket}`);
  console.log(`  최대 가로   : ${CONFIG.maxWidth}px`);
  console.log(`  WebP 품질   : ${CONFIG.webpQuality}`);
  console.log(`  출력 포맷   : image/webp (파일명·URL 유지)`);
  console.log(`  캐시 기간   : ${(Number(CONFIG.cacheControl) / 86400).toFixed(0)}일`);
  console.log('');

  process.stdout.write('파일 목록 조회 중... ');
  const all = await listAllFiles(supabase);
  console.log(`${all.length}개 발견`);

  const targets = all.filter((f) => {
    if (CONFIG.skipPatterns.some((re) => re.test(f.path))) return false;
    if (f.size < CONFIG.minSizeBytes) return false;
    if (!/^image\/(jpeg|png|gif)$/.test(f.mimetype)) return false; // 이미 WebP인 파일 제외
    return true;
  });

  const totalBefore = all.reduce((s, f) => s + f.size, 0);
  console.log(`전체 용량   : ${fmt(totalBefore)}`);
  console.log(`처리 대상   : ${targets.length}개 (${fmt(targets.reduce((s, f) => s + f.size, 0))})`);
  console.log(`건너뜀      : ${all.length - targets.length}개 (작거나 제외 대상)`);
  console.log('');

  if (targets.length === 0) {
    console.log('처리할 파일이 없습니다.');
    return;
  }

  if (LIVE) {
    await fs.mkdir(CONFIG.backupDir, { recursive: true });
    console.log(`원본 백업 위치: ${path.resolve(CONFIG.backupDir)}`);
    console.log('');
  }

  const stats = { done: 0, skipped: 0, failed: 0, before: 0, after: 0 };
  const failures = [];

  await mapLimit(targets, CONFIG.concurrency, async (file) => {
    const label = file.path.length > 58 ? '…' + file.path.slice(-57) : file.path;

    try {
      // 1) 원본 다운로드
      const { data: blob, error: dlErr } = await supabase.storage
        .from(CONFIG.bucket)
        .download(file.path);
      if (dlErr) throw new Error(`다운로드 실패: ${dlErr.message}`);

      const original = Buffer.from(await blob.arrayBuffer());

      // 2) 백업 (실제 실행일 때만)
      if (LIVE) {
        const dest = path.join(CONFIG.backupDir, file.path);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, original);
      }

      // 3) 변환
      const { buffer: converted, contentType, note } = await transform(original);

      // 4) 오히려 커졌으면 건너뜀
      if (converted.length >= original.length) {
        stats.skipped++;
        console.log(`  ─  ${label.padEnd(58)} ${fmt(original.length).padStart(9)}  (변화 없음, 건너뜀)`);
        return;
      }

      stats.before += original.length;
      stats.after += converted.length;

      // 5) 업로드 (같은 경로에 덮어쓰기)
      if (LIVE) {
        const { error: upErr } = await supabase.storage
          .from(CONFIG.bucket)
          .upload(file.path, converted, {
            upsert: true,
            contentType,
            cacheControl: CONFIG.cacheControl,
          });
        if (upErr) throw new Error(`업로드 실패: ${upErr.message}`);
      }

      stats.done++;
      console.log(
        `  ✓  ${label.padEnd(58)} ` +
          `${fmt(original.length).padStart(9)} → ${fmt(converted.length).padStart(9)}  ` +
          `${pct(original.length, converted.length).padStart(4)} 감소   ${note}`
      );
    } catch (err) {
      stats.failed++;
      failures.push({ path: file.path, message: err.message });
      console.log(`  ✗  ${label.padEnd(58)} ${err.message}`);
    }
  });

  // ─── 요약 ───
  const projectedTotal = totalBefore - stats.before + stats.after;

  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('  결과');
  console.log('════════════════════════════════════════════════════');
  console.log(`  처리 완료   : ${stats.done}개`);
  console.log(`  건너뜀      : ${stats.skipped}개`);
  console.log(`  실패        : ${stats.failed}개`);
  console.log('');
  console.log(`  대상 용량   : ${fmt(stats.before)} → ${fmt(stats.after)}  (${pct(stats.before, stats.after)} 감소)`);
  console.log(`  버킷 전체   : ${fmt(totalBefore)} → ${fmt(projectedTotal)}`);

  if (stats.before > 0) {
    const ratio = stats.before / stats.after;
    console.log('');
    console.log(`  평균 ${ratio.toFixed(1)}배 가벼워졌습니다.`);
    console.log(`  월 전송량 추정: 14.7 GB → 약 ${(14.7 / ratio).toFixed(1)} GB (무료 한도 5 GB)`);
  }

  if (failures.length) {
    console.log('');
    console.log('  실패 목록:');
    for (const f of failures) console.log(`    - ${f.path}: ${f.message}`);
  }

  console.log('');
  if (!LIVE) {
    console.log('  ⓘ 지금은 미리보기입니다. 아무것도 변경되지 않았습니다.');
    console.log('    실제로 적용하려면 --live 를 붙여 다시 실행하세요:');
    console.log('');
    console.log('      node scripts/compress-storage-images.mjs --live');
  } else {
    console.log(`  ✓ 완료. 원본은 ${CONFIG.backupDir} 에 백업되어 있습니다.`);
    console.log('    사이트를 열어 이미지가 정상인지 확인하세요.');
    console.log('    (브라우저 캐시 때문에 안 바뀐 것처럼 보이면 강력 새로고침: Cmd+Shift+R)');
  }
  console.log('');
}

main().catch((err) => {
  console.error('');
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
