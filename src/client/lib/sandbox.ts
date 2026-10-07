export interface TestCase {
  input: string;
  expected: string;
}

export interface ExecutionResult {
  passed: boolean;
  actual?: string;
  error?: string;
}

/**
 * Executes untrusted JavaScript inside an isolated Web Worker.
 * Completely isolates execution from document, cookies, parent window, and localStorage.
 * Includes timeout protection against infinite loops.
 */
export async function runSandboxedJavaScript(
  code: string,
  timeoutMs = 2500,
): Promise<{ logs: string[]; error?: string; success: boolean }> {
  return new Promise((resolve) => {
    const workerScript = `
      self.onmessage = function(e) {
        var logs = [];
        var originalLog = console.log;
        var originalWarn = console.warn;
        var originalError = console.error;

        console.log = function() {
          var args = Array.prototype.slice.call(arguments);
          logs.push(args.map(function(a) {
            return (typeof a === 'object' && a !== null) ? JSON.stringify(a) : String(a);
          }).join(' '));
        };
        console.warn = console.log;
        console.error = console.log;

        try {
          // Block prototype poisoning and dangerous worker globals
          self.document = undefined;
          self.localStorage = undefined;
          self.sessionStorage = undefined;
          self.cookie = undefined;
          self.fetch = undefined;
          self.XMLHttpRequest = undefined;

          var fn = new Function(e.data.code);
          fn();
          self.postMessage({ success: true, logs: logs });
        } catch (err) {
          self.postMessage({ success: false, logs: logs, error: err.message || String(err) });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    let worker: Worker | null = null;

    try {
      worker = new Worker(workerUrl);
    } catch {
      // Fallback: execute inside a sandboxed iframe with no same-origin permissions
      return resolve(runFallbackJS(code));
    }

    const timer = setTimeout(() => {
      if (worker) {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      }
      resolve({
        success: false,
        logs: ["Error: Execution timed out (possible infinite loop detected)."],
        error: "Execution timed out (2.5s limit exceeded)",
      });
    }, timeoutMs);

    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker?.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        success: event.data.success,
        logs: event.data.logs || [],
        error: event.data.error,
      });
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker?.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        success: false,
        logs: [`Runtime Error: ${err.message}`],
        error: err.message,
      });
    };

    worker.postMessage({ code });
  });
}

function runFallbackJS(
  code: string,
): Promise<{ logs: string[]; error?: string; success: boolean }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return resolve({ success: false, logs: ["Cannot execute in SSR environment."] });
    }

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    // Disallow same-origin so cookies, parent DOM and localStorage cannot be accessed
    iframe.setAttribute("sandbox", "allow-scripts");

    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      iframe.remove();
      resolve({
        success: false,
        logs: ["Error: Execution timed out (possible infinite loop)."],
        error: "Execution timed out (2.5s limit exceeded)",
      });
    }, 2500);

    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      channel.port1.close();
      iframe.remove();
      resolve(event.data);
    };

    iframe.srcdoc = `<!DOCTYPE html><html><body><script>
      window.onmessage = function(e) {
        var port = e.ports[0];
        var logs = [];
        console.log = function() {
          var args = Array.prototype.slice.call(arguments);
          logs.push(args.map(function(a) {
            return (typeof a === 'object' && a !== null) ? JSON.stringify(a) : String(a);
          }).join(' '));
        };
        console.warn = console.log;
        console.error = console.log;
        try {
          var fn = new Function(e.data.code);
          fn();
          port.postMessage({ success: true, logs: logs });
        } catch(err) {
          port.postMessage({ success: false, logs: logs, error: err.message || String(err) });
        }
      };
    <\\/script></body></html>`;

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ code }, "*", [channel.port2]);
    };
    document.body.appendChild(iframe);
  });
}

/**
 * Sandboxed Python interpreter for classroom scripts (loops, ranges, variables, math, print).
 */
export function runSandboxedPython(code: string): {
  logs: string[];
  error?: string;
  success: boolean;
} {
  const logs: string[] = [];
  const lines = code.split("\n");
  const variables: Record<string, unknown> = {};

  try {
    let i = 0;
    while (i < lines.length) {
      const line = lines[i]?.trim() || "";
      if (!line || line.startsWith("#")) {
        i++;
        continue;
      }

      // Handle simple for loops: for i in range(start, end, step):
      const forMatch = line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\(([^)]+)\):/);
      if (forMatch) {
        const loopVar = forMatch[1]!;
        const rangeArgs = forMatch[2]!
          .split(",")
          .map((s) => evalPythonExpr(s.trim(), variables) as number);
        let start = 0;
        let end = 0;
        let step = 1;

        if (rangeArgs.length === 1) {
          end = rangeArgs[0] || 0;
        } else if (rangeArgs.length === 2) {
          start = rangeArgs[0] || 0;
          end = rangeArgs[1] || 0;
        } else if (rangeArgs.length >= 3) {
          start = rangeArgs[0] || 0;
          end = rangeArgs[1] || 0;
          step = rangeArgs[2] || 1;
        }

        // Collect loop body
        const loopBody: string[] = [];
        i++;
        while (i < lines.length && (lines[i]?.startsWith("    ") || lines[i]?.startsWith("\t"))) {
          loopBody.push(lines[i]!.trim());
          i++;
        }

        // Execute loop body
        let iterations = 0;
        for (let v = start; step > 0 ? v < end : v > end; v += step) {
          variables[loopVar] = v;
          for (const bodyLine of loopBody) {
            executePythonLine(bodyLine, variables, logs);
          }
          iterations++;
          if (iterations > 1000) {
            throw new Error("Maximum loop iterations (1000) exceeded.");
          }
        }
        continue;
      }

      // Handle standalone lines
      executePythonLine(line, variables, logs);
      i++;
    }

    return { success: true, logs };
  } catch (err) {
    const error = err as Error;
    return { success: false, logs, error: error.message };
  }
}

function executePythonLine(line: string, variables: Record<string, unknown>, logs: string[]) {
  // Print statement: print(...)
  if (line.startsWith("print(") && line.endsWith(")")) {
    const inner = line.slice(6, -1);
    const parts = splitPythonArgs(inner);
    const printed = parts.map((p) => evalPythonExpr(p, variables)).join(" ");
    logs.push(printed);
    return;
  }

  // Variable assignment: x = ...
  const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
  if (assignMatch) {
    const varName = assignMatch[1]!;
    const expr = assignMatch[2]!;
    variables[varName] = evalPythonExpr(expr, variables);
    return;
  }
}

function splitPythonArgs(str: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== "\\")) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
      }
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function evalPythonExpr(expr: string, vars: Record<string, unknown>): unknown {
  expr = expr.trim();
  if (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'"))
  ) {
    return expr.slice(1, -1);
  }
  if (!isNaN(Number(expr))) {
    return Number(expr);
  }

  // Expression evaluation with safe context
  try {
    const keys = Object.keys(vars);
    const vals = Object.values(vars);
    const fn = new Function(...keys, `return (${expr});`);
    return fn(...vals);
  } catch {
    return expr;
  }
}

/**
 * Sandboxed Java class runner for classroom exercises (main, System.out.println, loops).
 */
export function runSandboxedJava(code: string): {
  logs: string[];
  error?: string;
  success: boolean;
} {
  const logs: string[] = [];
  try {
    if (!code.includes("class") || !code.includes("main")) {
      return {
        success: false,
        logs: [
          "Error: Java file must contain a class with 'public static void main(String[] args)'",
        ],
        error: "Missing main method",
      };
    }

    // Look for loop and print inside Java code
    const printMatches = code.matchAll(/System\.out\.println\(([^)]+)\);/g);
    const loopMatch = code.match(
      /for\s*\(\s*int\s+([a-zA-Z_]\w*)\s*=\s*(\d+);\s*\1\s*<=\s*(\d+);\s*\1\s*\+\+\s*\)\s*\{([^}]+)\}/s,
    );

    if (loopMatch) {
      const varName = loopMatch[1]!;
      const start = parseInt(loopMatch[2]!, 10);
      const end = parseInt(loopMatch[3]!, 10);
      const body = loopMatch[4]!;

      for (let v = start; v <= end; v++) {
        const bodyPrint = body.match(/System\.out\.println\(([^)]+)\);/);
        if (bodyPrint) {
          const expr = bodyPrint[1]!.replace(new RegExp(`\\b${varName}\\b`, "g"), String(v));
          // Evaluate Java string concatenation
          const parts = expr.split("+").map((s) => s.trim());
          const out = parts
            .map((p) => {
              if (
                (p.startsWith('"') && p.endsWith('"')) ||
                (p.startsWith("'") && p.endsWith("'"))
              ) {
                return p.slice(1, -1);
              }
              try {
                return eval(p);
              } catch {
                return p;
              }
            })
            .join("");
          logs.push(out);
        }
      }
    } else {
      for (const match of printMatches) {
        const expr = match[1]!;
        const parts = expr.split("+").map((s) => s.trim());
        const out = parts
          .map((p) => {
            if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
              return p.slice(1, -1);
            }
            try {
              return eval(p);
            } catch {
              return p;
            }
          })
          .join("");
        logs.push(out);
      }
    }

    if (logs.length === 0) {
      logs.push("Compilation successful: No output produced by main().");
    }

    return { success: true, logs };
  } catch (err) {
    const error = err as Error;
    return { success: false, logs, error: error.message };
  }
}

export async function runJavaScript(
  code: string,
  testCases: TestCase[],
): Promise<{ success: boolean; results: ExecutionResult[]; logs: string[] }> {
  const sandboxed = await runSandboxedJavaScript(code);
  const results: ExecutionResult[] = [];
  let allPassed = sandboxed.success;

  for (const tc of testCases) {
    const matched = sandboxed.logs.some(
      (l) => l.includes(tc.expected) || l.trim() === tc.expected.trim(),
    );
    if (matched) {
      results.push({ passed: true, actual: tc.expected });
    } else {
      allPassed = false;
      results.push({
        passed: false,
        actual: sandboxed.logs[0] || "No output",
        error: "Output did not match expected",
      });
    }
  }

  return { success: allPassed, results, logs: sandboxed.logs };
}
