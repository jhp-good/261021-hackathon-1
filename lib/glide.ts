// 부드럽게 스르륵 스크롤 — el의 윗부분이 화면 맨 위에 오도록 (여백은 el의 padding-top이 맡는다)
const DURATION = 700;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function glideTo(el: HTMLElement | null, done?: () => void) {
  if (!el) return;
  const target = el.getBoundingClientRect().top + window.scrollY;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, target);
    done?.();
    return;
  }
  const start = window.scrollY;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - t0) / DURATION, 1);
    window.scrollTo(0, start + (target - start) * ease(t));
    if (t < 1) requestAnimationFrame(step);
    else done?.();
  };
  requestAnimationFrame(step);
}
