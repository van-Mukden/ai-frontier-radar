"use client";

import { useEffect, useRef } from "react";

/** 全宽点状波浪动画背景（canvas），低调科技感，铺在标题卡片后面。 */
export function DotWave() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const gap = 22; // 点间距
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    function resize() {
      const parent = canvas!.parentElement!;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const time = t / 1000;
      for (let x = gap / 2; x < w; x += gap) {
        for (let y = gap / 2; y < h; y += gap) {
          // 由多个正弦叠加出波浪起伏，越靠右越亮（品牌蓝）
          const wave =
            Math.sin(x * 0.018 + time * 0.9) +
            Math.sin(y * 0.02 - time * 0.6) +
            Math.sin((x + y) * 0.012 + time * 0.4);
          const n = (wave + 3) / 6; // 0..1
          const r = 0.6 + n * 1.7;
          const alpha = 0.06 + n * 0.34;
          // 亮点偏品牌蓝，暗点偏灰白
          const blue = n > 0.62;
          ctx!.beginPath();
          ctx!.fillStyle = blue
            ? `rgba(94,169,255,${alpha})`
            : `rgba(220,225,232,${alpha * 0.7})`;
          ctx!.arc(x, y, r, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    }
    if (reduce) {
      draw(0); // 静态一帧
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
