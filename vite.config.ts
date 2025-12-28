import { defineConfig } from "vite";

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const base =
    process.env.GITHUB_PAGES === "true" && repoName ? `/${repoName}/` : "/";

  return {
    base,
    server: {
      open: false
    }
  };
});
