import { defineConfig } from "vite";

export default defineConfig(() => {
  const isPages = process.env.GITHUB_PAGES === "true";
  const base = isPages ? "./" : "/";

  return {
    base,
    server: {
      open: false
    }
  };
});
