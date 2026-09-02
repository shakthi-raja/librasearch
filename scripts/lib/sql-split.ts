/**
 * Splits a SQL script into statements the way the mysql client does, including
 * DELIMITER directives, so routines and triggers can live in plain .sql files.
 * Quotes, backticks and comments are respected; empty statements are dropped.
 */
export function splitSql(script: string): string[] {
  const statements: string[] = [];
  let delimiter = ";";
  let current = "";
  let i = 0;
  let atLineStart = true;

  const flush = () => {
    const statement = current.trim();
    if (statement.length > 0) statements.push(statement);
    current = "";
  };

  while (i < script.length) {
    if (atLineStart) {
      const lineEnd = script.indexOf("\n", i);
      const line = script.slice(i, lineEnd === -1 ? script.length : lineEnd);
      const directive = /^\s*DELIMITER\s+(\S+)\s*$/i.exec(line);
      if (directive?.[1]) {
        flush();
        delimiter = directive[1];
        i = lineEnd === -1 ? script.length : lineEnd + 1;
        continue;
      }
    }

    const char = script[i] as string;
    const next = script[i + 1];
    atLineStart = false;

    if (char === "-" && next === "-" && /\s/.test(script[i + 2] ?? " ")) {
      const end = script.indexOf("\n", i);
      i = end === -1 ? script.length : end;
      continue;
    }
    if (char === "#") {
      const end = script.indexOf("\n", i);
      i = end === -1 ? script.length : end;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = script.indexOf("*/", i + 2);
      if (end === -1) throw new Error("unterminated block comment");
      i = end + 2;
      current += " ";
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      let j = i + 1;
      while (j < script.length) {
        const c = script[j];
        if (c === "\\" && char !== "`") {
          j += 2;
          continue;
        }
        if (c === char) {
          if (script[j + 1] === char) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      if (j >= script.length) throw new Error(`unterminated ${char} quote`);
      current += script.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (script.startsWith(delimiter, i)) {
      flush();
      i += delimiter.length;
      continue;
    }

    current += char;
    if (char === "\n") atLineStart = true;
    i++;
  }

  flush();
  return statements;
}
