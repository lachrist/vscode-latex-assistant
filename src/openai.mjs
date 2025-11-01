import { env } from "node:process";
import { get, hasOwn, isArray } from "./util.mjs";

class OpenaiError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "OpenaiError";
  }
}

/**
 * @type {(data: unknown) => string}
 */
export const extractResponse = (data) => {
  if (typeof data !== "object" || data === null) {
    throw new TypeError("Openai response was not an object", { cause: data });
  }
  if (hasOwn(data, "error")) {
    const { error } = data;
    if (typeof error !== "object" || error === null) {
      throw new TypeError("Openai error was not an object", { cause: data });
    }
    if (!hasOwn(error, "message")) {
      throw new TypeError("Openai error has no message", { cause: data });
    }
    const { message } = error;
    if (typeof message !== "string") {
      throw new TypeError("Openai error message is not a string", {
        cause: data,
      });
    }
    throw new OpenaiError(message);
  } else {
    if (!hasOwn(data, "choices")) {
      throw new TypeError("Openai response has no choices", { cause: data });
    }
    const { choices } = data;
    if (!isArray(choices)) {
      throw new TypeError("Openai response choices is not an array", {
        cause: data,
      });
    }
    if (choices.length === 0) {
      throw new TypeError("Openai response has no choices", { cause: data });
    }
    if (choices.length > 1) {
      throw new TypeError("Openai response has multiple choices", {
        cause: data,
      });
    }
    const choice = choices[0];
    if (typeof choice !== "object" || choice === null) {
      throw new TypeError("OpenAI choice is not an object", { cause: data });
    }
    if (!hasOwn(choice, "finish_reason")) {
      throw new TypeError("OpenAI choice has no finish_reason", {
        cause: data,
      });
    }
    const { finish_reason } = choice;
    if (finish_reason !== "stop") {
      throw new Error("OpenAI did not finish", {
        cause: data,
      });
    }
    if (!hasOwn(choice, "message")) {
      throw new TypeError("OpenAI choice has no message", { cause: data });
    }
    const { message } = choice;
    if (typeof message !== "object" || message === null) {
      throw new TypeError("OpenAI message is not an object", { cause: data });
    }
    if (!hasOwn(message, "content")) {
      throw new TypeError("OpenAI message has no content", { cause: data });
    }
    const { content } = message;
    if (typeof content !== "string") {
      throw new TypeError("OpenAI message content is not a string", {
        cause: data,
      });
    }
    return content;
  }
};

/**
 * @type {(
 *   message: string,
 *   config: import("./openai").OpenaiConfig,
 * ) => Promise<string>}
 */
export const fetchOpenai = async (message, config) => {
  const env_var = config["api-key-env-var"];
  const bearer = get(env, env_var);
  if (bearer === null) {
    throw new Error(`OpenAI API key is not in ${env_var}`);
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${bearer}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      messages: [
        { role: "system", content: config["system-message"].join("\n") },
        { role: "user", content: message },
      ],
    }),
  });
  return extractResponse(await response.json());
};
