import type { VercelRequest, VercelResponse } from "@vercel/node";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// GA4 데이터 수집 시작일 (이 상수는 UI와 공유됨)
export const GA_DATA_START = "2026-09-01";

const PROPERTY_ID = process.env.GA_PROPERTY_ID;
const CLIENT_EMAIL = process.env.GA_CLIENT_EMAIL;
const PRIVATE_KEY_RAW = process.env.GA_PRIVATE_KEY;

type Range = "7d" | "30d" | "monthly" | "all";

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // 따옴표로 감싸져 저장된 경우 제거
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // 이스케이프된 \n → 실제 줄바꿈 (이미 실제 줄바꿈이면 영향 없음)
  key = key.replace(/\\n/g, "\n");
  // CRLF 정리
  key = key.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return key;
}

function keyDiagnostics(key: string) {
  return {
    hasKey: key.length > 0,
    keyLength: key.length,
    startsWithBegin: key.startsWith("-----BEGIN"),
    endsWithEnd: key.trimEnd().endsWith("PRIVATE KEY-----"),
    newlineCount: (key.match(/\n/g) ?? []).length,
  };
}

function getDateRange(range: Range): { startDate: string; endDate: string } {
  if (range === "7d") return { startDate: "7daysAgo", endDate: "today" };
  if (range === "30d") return { startDate: "30daysAgo", endDate: "today" };
  // monthly(12개월)와 all 모두 데이터 시작일부터 집계
  return { startDate: GA_DATA_START, endDate: "today" };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — /admin 에서만 호출하지만 명시적으로 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // 환경변수 미설정 시 graceful degradation (로컬 개발 등)
  if (!PROPERTY_ID || !CLIENT_EMAIL || !PRIVATE_KEY_RAW) {
    return res.status(200).json({ error: "GA_ENV_MISSING" });
  }

  const range = (req.query.range as Range) ?? "7d";
  const dateRange = getDateRange(range);

  const privateKey = normalizePrivateKey(PRIVATE_KEY_RAW);

  const analyticsClient = new BetaAnalyticsDataClient({
    credentials: { client_email: CLIENT_EMAIL, private_key: privateKey },
  });

  try {
    // ── 쿼리 1: 이벤트별 사용자 수 + 평균 체류시간 ─────────────────
    const [eventsResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [dateRange],
      dimensions: [{ name: "eventName" }],
      metrics: [
        { name: "totalUsers" },
        { name: "eventCount" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: ["quiz_start", "quiz_complete", "result_share", "result_save"],
          },
        },
      },
    });

    // ── 쿼리 2: 평균 체류시간 (세션 단위) ─────────────────────────
    const [sessionResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [dateRange],
      metrics: [
        { name: "averageSessionDuration" },
        { name: "activeUsers" },
      ],
      // /admin 세션을 제외하기 위해 랜딩 페이지 기준 필터 시도
      // (정확하지 않을 수 있으나 최선의 근사치)
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: "landingPage",
            stringFilter: { matchType: "BEGINS_WITH", value: "/admin" },
          },
        },
      },
    });

    // ── 쿼리 3: result_share method 별 분리 ────────────────────────
    const [shareResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [dateRange],
      dimensions: [
        { name: "eventName" },
        { name: "customEvent:method" },
      ],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "result_share" },
        },
      },
    });

    // ── 결과 파싱 ──────────────────────────────────────────────────
    const eventMap: Record<string, { users: number; count: number }> = {};
    for (const row of eventsResponse.rows ?? []) {
      const name = row.dimensionValues?.[0]?.value ?? "";
      eventMap[name] = {
        users: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
        count: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
      };
    }

    const quizStartUsers = eventMap["quiz_start"]?.users ?? 0;
    const quizCompleteUsers = eventMap["quiz_complete"]?.users ?? 0;
    const completionRate =
      quizStartUsers > 0
        ? Math.round((quizCompleteUsers / quizStartUsers) * 100)
        : 0;

    const avgSessionSec = Math.round(
      parseFloat(sessionResponse.rows?.[0]?.metricValues?.[0]?.value ?? "0")
    );

    const shareMap: Record<string, number> = {};
    for (const row of shareResponse.rows ?? []) {
      const method = row.dimensionValues?.[1]?.value ?? "unknown";
      shareMap[method] = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
    }

    const payload = {
      quizStartUsers,
      quizCompleteUsers,
      completionRate,
      avgSessionSec,
      shareKakao: shareMap["kakao"] ?? 0,
      shareCopy: shareMap["copy"] ?? 0,
      dateRange,
      dataStart: GA_DATA_START,
    };

    // 10분 캐시
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=60");
    return res.status(200).json(payload);
  } catch (err) {
    console.error("[ga-metrics]", err);
    const diag = keyDiagnostics(privateKey);
    return res.status(500).json({ error: "GA_API_ERROR", message: String(err), diag });
  }
}
