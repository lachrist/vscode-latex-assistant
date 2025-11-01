import { writeFile, readFile } from "fs/promises";
import { argv } from "node:process";

if (argv.length !== 3) {
  throw new Error("usage: node package-compile.mjs (test|prod)");
}

const env = argv[2];

if (env !== "test" && env !== "prod") {
  throw new Error("env argument should be 'test' or 'prod'");
}

const LIB_DIR = {
  test: "src",
  prod: "out",
};

/**
 * @type {(
 *   content: string,
 * ) => string}
 */
const formatJson = (content) =>
  JSON.stringify(JSON.parse(content), null, 2) + "\n";

/**
 * @type {(
 *   prompt: {
 *     name: string,
 *     marker: string,
 *     temperature: number,
 *   },
 * ) => Promise<import("./src/config").OpenaiEntry>}
 */
const loadPrompt = async ({ name, marker, temperature }) => ({
  name,
  "api-key-env-var": "OPENAI_API_KEY",
  "model": "gpt-4o-mini",
  temperature,
  "system-message": (
    await readFile(new URL(`prompts/${name}.md`, import.meta.url), "utf8")
  ).split("\n"),
  "begin-selection-marker": `START-${marker}`,
  "end-selection-marker": `STOP-${marker}`,
  "section-hierarchy": [
    "title",
    "chapter",
    "section",
    "subsection",
    "subsubsection",
    "paragraph",
  ],
  "before-char-count": 512,
  "after-char-count": 0,
});

const prompts = await Promise.all(
  [
    {
      name: "revise",
      marker: "REVISING",
      temperature: 0.4,
    },
    {
      name: "elaborate",
      marker: "ELABORATING",
      temperature: 0.6,
    },
  ].map(loadPrompt),
);

await writeFile(
  new URL("package.json", import.meta.url),
  formatJson(
    (await readFile(new URL("package-template.json", import.meta.url), "utf8"))
      .replace('"<DEFAULT-PROMPT-LIST>"', () => JSON.stringify(prompts))
      .replace("<LIB-DIR>", LIB_DIR[env]),
  ),
);
