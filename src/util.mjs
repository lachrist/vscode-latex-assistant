/**
 * @type {<X>(
 *   value: X | null,
 * ) => value is X}
 */
export const isNotNull = (value) => value !== null;

/**
 * @type {<O extends object, K extends string>(
 *   obj: object,
 *   key: K,
 * ) => obj is O & { [key in K]: unknown }}
 */
export const hasOwn = /** @type {any} */ (Object.hasOwn);

/**
 * @type {(
 *   val: unknown,
 * ) => val is unknown[]}
 */
export const isArray = Array.isArray;

/**
 * @type {(
 *   key: string,
 * ) => [string, null | string]}
 */
export const toNullableStringEntry = (key) => [key, null];

/**
 * @type {<V>(
 *   obj: {[key in string]: V | undefined | null},
 *   key: string,
 * ) => V | null}
 */
export const get = (obj, key) =>
  Object.hasOwn(obj, key) ? (obj[key] ?? null) : null;

/**
 * @type {<K extends string>(
 *   key: K,
 * ) => <V>(
 *   obj: { [key in K]: V },
 * ) => V}
 */
export const compileGet = (key) => (obj) => obj[key];

/**
 * @type {(
 *   error: unknown,
 * ) => string}
 */
export const printError = (error) => {
  try {
    if (!(error instanceof Error)) {
      throw Error("Not an instance of Error");
    }
    const { name, message, cause } = error;
    const name_string = typeof name === "string" ? name : "Error";
    const message_string = typeof message === "string" ? message : null;
    const cause_string = cause ? JSON.stringify(cause, null, 2) : null;
    let result = name_string;
    if (message_string) {
      result += `: ${message_string}`;
    }
    if (cause_string) {
      result += ` >> ${cause_string}`;
    }
    return result;
  } catch {
    try {
      return `Unknown Error: ${JSON.stringify(error, null, 2)}`;
    } catch {
      return "Unknown Error";
    }
  }
};
