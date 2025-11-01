import vscode from "../ext/vscode.mjs";
import { fetchOpenai } from "./openai.mjs";
import { compileGet, printError } from "./util.mjs";
import { excerpt } from "./excerpt.mjs";

const LINE_SEPARATOR = {
  [vscode.EndOfLine.LF]: "\n",
  [vscode.EndOfLine.CRLF]: "\r\n",
};

const getName = compileGet("name");

/**
 * @type {(
 *   context: import("vscode").ExtensionContext,
 * ) => void}
 */
export const activate = (context) => {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "latex-assistant.prompt",
      async (editor, _edit, input) => {
        /** @type {import("./config").Config} */
        const config = /** @type {any} */ (
          vscode.workspace.getConfiguration("latex-assistant")
        );
        try {
          await execute(editor, input, config);
        } catch (error) {
          vscode.window.showErrorMessage(printError(error));
        }
      },
    ),
  );
};

const DELIMITER = "%%%%%%%%%%";

/**
 * @type {(
 *   editor: import("vscode").TextEditor,
 *   input: unknown,
 *   config: import("./config").Config,
 * ) => Promise<void>}
 */
const execute = async (editor, input, config) => {
  const name =
    input ??
    (await vscode.window.showQuickPick(config.openai.map(getName), {
      placeHolder: "Choose a prompt",
    }));
  if (name != null) {
    const prompt = config.openai.find((prompt) => prompt.name === name);
    if (prompt == null) {
      throw new Error(`Unknown prompt: ${name}`);
    }
    const { selection } = editor;
    const line_separator = LINE_SEPARATOR[editor.document.eol];
    const message = excerpt(editor.document.getText(), selection, {
      line_separator,
      config: prompt,
    });
    const result = await fetchOpenai(message, prompt);
    editor.edit((edit) => {
      edit.insert(
        new vscode.Position(selection.end.line + 1, 0),
        [DELIMITER, result, DELIMITER, ""].join(line_separator),
      );
    });
  }
};

/**
 * @type {() => void}
 */
export const deactivate = () => {};
