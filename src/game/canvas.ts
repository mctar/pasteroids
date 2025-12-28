import { CONFIG } from "./content/config";

export const createCanvasResizer = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  onResize: (width: number, height: number) => void
): (() => void) => {
  const resize = (): void => {
    const dpr = Math.min(
      CONFIG.canvas.maxDpr,
      Math.max(CONFIG.canvas.minDpr, window.devicePixelRatio)
    );
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    const targetWidth = Math.floor(displayWidth * dpr);
    const targetHeight = Math.floor(displayHeight * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.setTransform(dpr, CONFIG.core.zero, CONFIG.core.zero, dpr, CONFIG.core.zero, CONFIG.core.zero);
    onResize(displayWidth, displayHeight);
  };

  resize();
  return resize;
};
