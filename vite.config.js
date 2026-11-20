/* VITE CONFIG */
/* Vite is the tool that runs the React app on our computer (npm run dev) and
   builds the optimized files for GitHub Pages (npm run build -> dist/). */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    //"./" makes every file path relative, so the build works inside
    //https://<user>.github.io/<repo>/ without hard-coding the repository name.
    base: "./",
});
