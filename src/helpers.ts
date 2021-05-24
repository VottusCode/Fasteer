import chalk from "chalk";

export const formatStatusCode = (statusCode = 200) => {
  const status = String(statusCode);

  if (status.startsWith("3")) return chalk.magentaBright(status);
  if (status.startsWith("4")) return chalk.yellow(status);
  if (status.startsWith("5")) return chalk.redBright(status);

  return chalk.greenBright(status);
};

export const safeParseJson = <T = object>(
  ...args: Parameters<typeof JSON.parse>
): T | null => {
  try {
    return JSON.parse(...args) as T;
  } catch (_) {
    return null;
  }
};

// https://github.com/VottusCode/morgan-body/blob/v3/src/formatter/JsonFormatter.ts
export const formatJson = (
  obj: unknown,
  enableColors = true,
  minify = false
) => {
  if (!obj) return obj;

  const parsed = typeof obj === "string" ? safeParseJson(obj) : obj;
  if (!parsed) return obj;

  obj = parsed;
  const json = minify
    ? JSON.stringify(obj, null)
    : JSON.stringify(obj, null, 2);

  const formatMatch = (match: string, type: string) => {
    switch (type) {
      case "number":
        return chalk.yellow(match);
      case "string":
        return chalk.green(match);
      case "boolean":
        return chalk.blue(match);
      case "key":
        match = match.replace(/['"]+/g, "");
        match = match.replace(":", chalk.whiteBright(":"));
        return chalk.bold.blueBright(match);
      case "unknown":
        return chalk.gray(match);
      case "null":
      default:
        return chalk.red(match);
    }
  };

  if (!enableColors) return json;

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null|undefined)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    match => {
      let type = "unknown";

      if (/^"/.test(match)) type = /:$/.test(match) ? "key" : "string";
      else if (/true|false/.test(match)) type = "boolean";
      else if (/null|undefined/.test(match)) type = "null";
      else if (/[0-9]/.test(match)) type = "number";

      return formatMatch(match, type);
    }
  );
};

export const withFasteer = (...args: any[]) =>
  chalk.yellow("[Fasteer] ") + chalk.green(args.join(" "));
