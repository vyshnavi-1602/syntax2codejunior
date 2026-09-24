export interface TestCase {
  input: string;
  expected: string;
}

export interface ExecutionResult {
  passed: boolean;
  actual?: string;
  error?: string;
}

export async function runJavaScript(
  code: string,
  testCases: TestCase[],
): Promise<{ success: boolean; results: ExecutionResult[]; logs: string[] }> {
  const results: ExecutionResult[] = [];
  let success = true;
  const logs: string[] = [];

  const originalLog = console.log;
  console.log = (...args) => {
    logs.push(
      args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
    );
  };

  // Extremely basic and naive sandbox for demo purposes.
  // In production, use Web Workers or an isolated iframe with Content-Security-Policy.

  try {
    for (const tc of testCases) {
      try {
        const executableCode = `
          ${code}
          
          const __result = eval(${JSON.stringify(tc.input)});
          return eval(__result);
        `;

        // eslint-disable-next-line no-new-func
        const func = new Function(executableCode);
        const actualRaw = func();

        const actual = typeof actualRaw === "string" ? `'${actualRaw}'` : JSON.stringify(actualRaw);

        if (actual === tc.expected) {
          results.push({ passed: true, actual });
        } else {
          success = false;
          results.push({ passed: false, actual });
        }
      } catch (e: any) {
        success = false;
        results.push({ passed: false, error: e.message || String(e) });
      }
    }
  } finally {
    console.log = originalLog;
  }

  return { success, results, logs };
}
