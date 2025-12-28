import "./style.css";
import { createCanvasResizer } from "./game/canvas";
import { CONFIG } from "./game/content/config";
import { Game } from "./game/Game";

const canvas = document.getElementById(CONFIG.dom.canvasId);

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas element missing");
}

const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Canvas context unavailable");
}

const game = new Game(canvas, ctx);
const resize = createCanvasResizer(canvas, ctx, (width, height) => {
  game.resize(width, height);
});

window.addEventListener("resize", () => {
  resize();
});

game.start();
