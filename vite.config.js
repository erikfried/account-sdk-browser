import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    build: {
        target: "baseline-widely-available", // Vite default, but explicit is fine
        lib: {
            entry: path.resolve("src/index.js"),
            name: "AccountSDK",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format}.js`, // Maps to exports in package.json
        },
        rollupOptions: {
            external: ["tiny-emitter"],
            output: {
                globals: { "tiny-emitter": "TinyEmitter" },
            },
        },
        sourcemap: true,
    },
});
