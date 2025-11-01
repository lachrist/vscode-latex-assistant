import esbuild from "esbuild";
import pack from "./package.json" with { type: "json" };

const main = "./out/index.js";

if (pack.main !== main) {
  throw new Error(
    `package.json "main" field should be "${main}" in production.`,
    { cause: pack.main },
  );
}

const external = /\/ext\/([^/]*)\.mjs$/;

await esbuild.build({
  entryPoints: ["src/index.mjs"],
  bundle: true,
  outfile: "out/index.js",
  platform: "node",
  plugins: [
    {
      name: "external-resolved",
      setup: (build) => {
        build.onResolve({ filter: external }, ({ path }) => {
          const parts = external.exec(path);
          return { external: true, path: parts[1] };
        });
      },
    },
  ],
});
