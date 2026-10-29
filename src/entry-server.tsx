/**
 * SSR 전용 엔트리 포인트 — pre-render 빌드에만 사용
 * AnimatePresence, Header, Lenis 등 브라우저 전용 코드를 우회하여
 * 각 라우트의 <Helmet> 메타 태그와 콘텐츠만 렌더링한다.
 */
import { renderToString } from "react-dom/server";
import { Routes, Route, StaticRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import SasangPage from "./pages/SasangPage";
import WellnessPage from "./pages/WellnessPage";
import AboutPage from "./pages/AboutPage";

function SSRRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/test" element={<LandingPage onStart={() => {}} />} />
      <Route path="/sasang" element={<SasangPage />} />
      <Route path="/wellness" element={<WellnessPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

export function render(url: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const helmetContext: any = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <SSRRoutes />
      </StaticRouter>
    </HelmetProvider>
  );
  return { html, helmet: helmetContext.helmet };
}
