export interface McqQuestionItem {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  xp: number;
  sourceDoc?: string | undefined;
}

export interface TheoryQuestionItem {
  id: string;
  questionText: string;
  expectedAnswer: string;
  rubricOrGuidelines?: string | undefined;
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  sourceDoc?: string | undefined;
}

export interface SubjectItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  questions: McqQuestionItem[];
  theoryQuestions?: TheoryQuestionItem[];
}

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  {
    id: "sub_python",
    name: "Python Programming",
    description: "Core syntax, data types, control structures, functions, and OOP in Python.",
    iconName: "Terminal",
    color: "emerald",
    questions: [
      {
        id: "py_q1",
        questionText: "What is the output of `print(type([1, 2, 3]))` in Python 3?",
        options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'set'>"],
        correctAnswer: "<class 'list'>",
        explanation: "In Python, square brackets denote a standard built-in `list` object.",
        difficulty: "Easy",
        xp: 15,
      },
      {
        id: "py_q2",
        questionText: "Which keyword is used to create a function in Python?",
        options: ["def", "function", "func", "define"],
        correctAnswer: "def",
        explanation:
          "Functions in Python are defined using the `def` keyword followed by the function name.",
        difficulty: "Easy",
        xp: 15,
      },
      {
        id: "py_q3",
        questionText: "What will `s = 'Python'; print(s[1:4])` print?",
        options: ["yth", "ytho", "Pyt", "y"],
        correctAnswer: "yth",
        explanation:
          "Python slicing is zero-indexed and exclusive of the end index (index 1 is 'y', 2 is 't', 3 is 'h').",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "py_q4",
        questionText:
          "Which collection type is unordered, mutable, and does not allow duplicate members?",
        options: ["Set", "List", "Tuple", "Dictionary"],
        correctAnswer: "Set",
        explanation: "A set in Python stores distinct, unique elements without fixed ordering.",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "py_q5",
        questionText: "What does the expression `[x**2 for x in range(4)]` evaluate to?",
        options: ["[0, 1, 4, 9]", "[1, 4, 9, 16]", "[0, 2, 4, 6]", "[0, 1, 2, 3]"],
        correctAnswer: "[0, 1, 4, 9]",
        explanation:
          "This is a list comprehension squaring numbers from range(4) which are 0, 1, 2, and 3.",
        difficulty: "Medium",
        xp: 30,
      },
      {
        id: "py_q6",
        questionText:
          "What is the time complexity of looking up a key in a Python dictionary on average?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        correctAnswer: "O(1)",
        explanation:
          "Python dictionaries are implemented using hash tables, offering O(1) average lookup time.",
        difficulty: "Hard",
        xp: 35,
      },
    ],
  },
  {
    id: "sub_java",
    name: "Java & OOP Concepts",
    description: "Classes, objects, polymorphism, encapsulation, interfaces, and inheritance.",
    iconName: "Code2",
    color: "indigo",
    questions: [
      {
        id: "java_q1",
        questionText:
          "Which pillar of Object-Oriented Programming binds data and methods together?",
        options: ["Encapsulation", "Polymorphism", "Abstraction", "Inheritance"],
        correctAnswer: "Encapsulation",
        explanation:
          "Encapsulation bundles data (attributes) and methods operating on that data inside a class, shielding internal state.",
        difficulty: "Easy",
        xp: 20,
      },
      {
        id: "java_q2",
        questionText: "What is the size of an `int` variable in Java?",
        options: ["32 bits (4 bytes)", "16 bits (2 bytes)", "64 bits (8 bytes)", "8 bits (1 byte)"],
        correctAnswer: "32 bits (4 bytes)",
        explanation:
          "In Java, primitive `int` is standard across platforms at 32-bit two's complement integer.",
        difficulty: "Easy",
        xp: 15,
      },
      {
        id: "java_q3",
        questionText: "Can an interface in Java 8+ have concrete methods?",
        options: [
          "Yes, using default or static keywords",
          "No, interfaces can only have abstract methods",
          "Yes, but only private methods",
          "No, only abstract classes can have concrete methods",
        ],
        correctAnswer: "Yes, using default or static keywords",
        explanation:
          "Java 8 introduced default and static methods in interfaces to support backward-compatible API evolution.",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "java_q4",
        questionText: "Which keyword prevents a class from being inherited in Java?",
        options: ["final", "static", "sealed", "const"],
        correctAnswer: "final",
        explanation:
          "Declaring a class `final` prevents any other class from extending or subclassing it.",
        difficulty: "Medium",
        xp: 20,
      },
      {
        id: "java_q5",
        questionText:
          "What is the difference between `==` and `.equals()` when comparing two String objects?",
        options: [
          "`==` compares memory references, while `.equals()` compares string content",
          "They behave identically",
          "`.equals()` compares memory references, while `==` compares content",
          "`==` is case-insensitive while `.equals()` is case-sensitive",
        ],
        correctAnswer: "`==` compares memory references, while `.equals()` compares string content",
        explanation:
          "In Java, `==` tests object reference equality, whereas `String.equals()` compares the actual sequence of characters.",
        difficulty: "Medium",
        xp: 25,
      },
    ],
  },
  {
    id: "sub_dsa",
    name: "Data Structures & Algorithms",
    description:
      "Arrays, stacks, queues, trees, searching, sorting, and Big-O computational complexity.",
    iconName: "Layers",
    color: "amber",
    questions: [
      {
        id: "dsa_q1",
        questionText: "Which data structure follows the LIFO (Last In, First Out) principle?",
        options: ["Stack", "Queue", "Binary Tree", "Linked List"],
        correctAnswer: "Stack",
        explanation:
          "A Stack pushes and pops elements from the top, making the last inserted element the first one removed.",
        difficulty: "Easy",
        xp: 20,
      },
      {
        id: "dsa_q2",
        questionText: "What is the worst-case time complexity of QuickSort?",
        options: ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"],
        correctAnswer: "O(n^2)",
        explanation:
          "When partitions are unbalanced (e.g. always picking smallest/largest element as pivot), QuickSort degrades to O(n^2).",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "dsa_q3",
        questionText:
          "In a balanced Binary Search Tree (AVL), what is the time complexity of searching for an element?",
        options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
        correctAnswer: "O(log n)",
        explanation:
          "Because the tree is balanced, each comparison cuts the search space in half, yielding logarithmic search time.",
        difficulty: "Medium",
        xp: 30,
      },
      {
        id: "dsa_q4",
        questionText:
          "Which sorting algorithm guarantees O(n log n) worst-case time and is stable?",
        options: ["Merge Sort", "Quick Sort", "Heap Sort", "Bubble Sort"],
        correctAnswer: "Merge Sort",
        explanation:
          "Merge Sort is a divide-and-conquer algorithm with guaranteed O(n log n) runtime and stability.",
        difficulty: "Hard",
        xp: 35,
      },
    ],
  },
  {
    id: "sub_web",
    name: "Web Development & JavaScript",
    description:
      "HTML5, CSS layout, modern JavaScript ES6+, asynchronous programming, and REST APIs.",
    iconName: "Globe",
    color: "sky",
    questions: [
      {
        id: "web_q1",
        questionText: "Which JavaScript keyword declares a block-scoped reassignable variable?",
        options: ["let", "var", "const", "static"],
        correctAnswer: "let",
        explanation:
          "`let` provides block scope and permits reassignment, unlike `const` which is read-only.",
        difficulty: "Easy",
        xp: 15,
      },
      {
        id: "web_q2",
        questionText: "What does the `async` keyword before a function declaration guarantee?",
        options: [
          "The function will return a Promise",
          "The function executes in a separate CPU thread",
          "The function cannot throw errors",
          "The function runs synchronously without blocking",
        ],
        correctAnswer: "The function will return a Promise",
        explanation: "An async function always wraps its return value in a Promise.",
        difficulty: "Medium",
        xp: 25,
      },
      {
        id: "web_q3",
        questionText: "What is the purpose of HTTP status code 404?",
        options: [
          "Not Found - the requested resource could not be found",
          "Internal Server Error",
          "Unauthorized access",
          "Request Succeeded",
        ],
        correctAnswer: "Not Found - the requested resource could not be found",
        explanation:
          "404 indicates that the origin server did not find a current representation for the target resource.",
        difficulty: "Easy",
        xp: 15,
      },
    ],
  },
];

const STORAGE_KEY = "s2c_question_bank_v3";

export const DEFAULT_THEORY_QUESTIONS: Record<string, TheoryQuestionItem[]> = {
  sub_python: [
    {
      id: "py_th1",
      questionText:
        "Explain the difference between mutable and immutable data types in Python. Give two examples of each.",
      expectedAnswer:
        "Mutable objects (like lists, dictionaries, and sets) can be modified after creation without changing their identity in memory. Immutable objects (like integers, strings, and tuples) cannot be altered once created; any modification produces a new object.",
      rubricOrGuidelines:
        "Full marks for clearly defining memory mutability and naming lists/dicts (mutable) and strings/tuples (immutable).",
      difficulty: "Easy",
      marks: 5,
    },
    {
      id: "py_th2",
      questionText:
        "Describe how list comprehensions work in Python and why they are preferred over traditional for-loops for mapping/filtering.",
      expectedAnswer:
        "List comprehensions provide a concise syntactic construct [expr for item in iterable if condition] that combines looping and conditional filtering in a single expressive expression, executing at optimized C-level speed.",
      rubricOrGuidelines:
        "Check for syntax format, explanation of performance optimization, and readability benefits.",
      difficulty: "Medium",
      marks: 8,
    },
    {
      id: "py_th3",
      questionText:
        "What is the Global Interpreter Lock (GIL) in CPython and what are its implications for CPU-bound multithreaded applications?",
      expectedAnswer:
        "The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once in CPython. For CPU-bound tasks, multithreading does not achieve true multi-core parallelism; multiprocessing or asyncio should be used instead.",
      rubricOrGuidelines:
        "Award marks for identifying single-core bytecode execution and recommending multiprocessing for CPU bound workloads.",
      difficulty: "Hard",
      marks: 10,
    },
  ],
  sub_java: [
    {
      id: "java_th1",
      questionText:
        "Explain the four pillars of Object-Oriented Programming (OOP) with real-world software examples.",
      expectedAnswer:
        "1. Encapsulation: Bundling data and methods while restricting direct access (private fields with getters/setters). 2. Abstraction: Hiding implementation details and exposing only essential interfaces. 3. Inheritance: Reusing parent class properties and behavior via extends. 4. Polymorphism: Ability of methods/objects to execute different behaviors dynamically (method overloading and overriding).",
      rubricOrGuidelines: "2.5 marks per pillar with clear definition and real-world example.",
      difficulty: "Medium",
      marks: 10,
    },
    {
      id: "java_th2",
      questionText:
        "What is the difference between an Abstract Class and an Interface in modern Java (Java 8+)?",
      expectedAnswer:
        "An interface defines a contract with default and static methods, multiple interfaces can be implemented, and variables are implicitly public static final. An abstract class can have instance state (fields), constructors, and protected methods, but Java permits only single inheritance.",
      rubricOrGuidelines:
        "Credit differences regarding state, constructors, and multiple vs single inheritance.",
      difficulty: "Medium",
      marks: 8,
    },
  ],
  sub_dsa: [
    {
      id: "dsa_th1",
      questionText:
        "Compare the time and space complexity of Merge Sort and Quick Sort in average and worst cases. Under what circumstances would you choose Merge Sort?",
      expectedAnswer:
        "Merge Sort runs in O(n log n) in all cases with O(n) auxiliary space. Quick Sort runs in O(n log n) average but O(n^2) worst case with O(log n) stack space. Merge Sort is preferred when stable sorting is required (e.g. linked lists) or for external sorting with predictable upper-bound latency.",
      rubricOrGuidelines:
        "Accurate Big-O times in table/format and valid rationale for Merge Sort stability.",
      difficulty: "Hard",
      marks: 10,
    },
    {
      id: "dsa_th2",
      questionText:
        "Explain the working principle of a Hash Table and describe two common collision resolution techniques.",
      expectedAnswer:
        "A hash table uses a hash function to map keys to bucket indices for O(1) average access. Collision resolutions: 1. Separate Chaining: Each bucket holds a linked list or balanced tree of colliding entries. 2. Open Addressing (Linear/Quadratic Probing): Searches for the next available slot sequentially.",
      rubricOrGuidelines:
        "Clearly articulate hash function mapping, separate chaining, and open addressing probing.",
      difficulty: "Medium",
      marks: 8,
    },
  ],
  sub_web: [
    {
      id: "web_th1",
      questionText:
        "Explain the differences between Server-Side Rendering (SSR), Client-Side Rendering (CSR), and Static Site Generation (SSG).",
      expectedAnswer:
        "CSR renders HTML dynamically in the browser via JavaScript. SSR renders HTML on-demand on the server per request, improving initial load and SEO. SSG generates static HTML files ahead of time at build time for high performance and CDN edge caching.",
      rubricOrGuidelines: "Credit trade-offs regarding SEO, build time, and server workload.",
      difficulty: "Medium",
      marks: 8,
    },
  ],
};

export function loadQuestionBank(): SubjectItem[] {
  if (typeof window === "undefined") return DEFAULT_SUBJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialized = DEFAULT_SUBJECTS.map((s) => ({
        ...s,
        theoryQuestions: DEFAULT_THEORY_QUESTIONS[s.id] || [],
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialized));
      return initialized;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((s) => ({
        ...s,
        theoryQuestions:
          s.theoryQuestions && s.theoryQuestions.length > 0
            ? s.theoryQuestions
            : DEFAULT_THEORY_QUESTIONS[s.id] || [],
      }));
    }
    return DEFAULT_SUBJECTS;
  } catch (e) {
    console.error("Failed to load question bank:", e);
    return DEFAULT_SUBJECTS;
  }
}

export function saveQuestionBank(subjects: SubjectItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  } catch (e) {
    console.error("Failed to save question bank:", e);
  }
}

/**
 * Intelligent parser that extracts or generates MCQs from uploaded document text or notes
 */
export function extractQuestionsFromDocumentText(
  text: string,
  subjectName: string,
  docTitle?: string,
): McqQuestionItem[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const generated: McqQuestionItem[] = [];

  // Check if text is JSON formatted
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : parsed.questions || [parsed];
      items.forEach((item: Record<string, unknown>, idx: number) => {
        const qText = (item.questionText || item.question || item.prompt) as string | undefined;
        if (qText) {
          const optList =
            Array.isArray(item.options) && item.options.length >= 2
              ? (item.options as string[])
              : ["Option A", "Option B", "Option C", "Option D"];
          generated.push({
            id: `imported_${Date.now()}_${idx}`,
            questionText: qText,
            options: optList,
            correctAnswer: (item.correctAnswer ||
              item.answer ||
              optList[0] ||
              "Option A") as string,
            explanation:
              (item.explanation as string) ||
              `Derived from curriculum document: ${docTitle || subjectName}`,
            difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") || "Medium",
            xp: Number(item.xp) || 25,
            sourceDoc: docTitle || "Uploaded JSON",
          });
        }
      });
      if (generated.length > 0) return generated;
    } catch {
      // Continue to textual parsing
    }
  }

  // Regex-based question blocks (e.g. "Q1: What is ... A) ... B) ... Answer: ...")
  const questionBlocks = trimmed.split(/\n\s*(?:(?:Q\d+[:.)]|Question\s*\d+[:.)]|\d+[.)]))\s*/i);

  if (questionBlocks.length > 1) {
    questionBlocks.slice(1).forEach((block, idx) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length >= 2) {
        const questionText = lines[0] || "Question";
        const optionLines = lines.filter((l) => /^[a-d][.)]\s*/i.test(l));
        const answerLine = lines.find((l) => /^(?:Ans|Answer|Correct)[\s:]+/i.test(l));

        const options =
          optionLines.length >= 2
            ? optionLines.map((l) => l.replace(/^[a-d][.)]\s*/i, "").trim())
            : ["True", "False", "None of the above", "Both A and B"];

        let correctAnswer = options[0] || "Option A";
        if (answerLine) {
          const ansText = answerLine.replace(/^(?:Ans|Answer|Correct)[\s:]+/i, "").trim();
          const matchOpt = options.find((o) => o.toLowerCase() === ansText.toLowerCase());
          if (matchOpt) correctAnswer = matchOpt;
        }

        generated.push({
          id: `doc_q_${Date.now()}_${idx}`,
          questionText: questionText,
          options,
          correctAnswer: correctAnswer,
          explanation: `Extracted from document chapter notes: ${docTitle || subjectName}`,
          difficulty: idx % 2 === 0 ? "Easy" : "Medium",
          xp: 20,
          sourceDoc: docTitle || "Syllabus Document",
        });
      }
    });
  }

  // Fallback concept extractor: If unstructured lecture notes / curriculum text was provided
  if (generated.length === 0) {
    const paragraphs = trimmed
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    const sampleConcepts = paragraphs.slice(0, 5);

    sampleConcepts.forEach((para, idx) => {
      const sentences = para
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
      const mainSentence = sentences[0] || para.substring(0, 80);

      generated.push({
        id: `auto_${Date.now()}_${idx}`,
        questionText: `Based on the provided ${subjectName} material, which statement accurately reflects: "${mainSentence}"?`,
        options: [
          `It is a fundamental principle in ${subjectName} as outlined in the curriculum document`,
          `It is deprecated and avoided in modern implementations`,
          `It applies only in specialized micro-services architectures`,
          `It represents a theoretical model with no standard application`,
        ],
        correctAnswer: `It is a fundamental principle in ${subjectName} as outlined in the curriculum document`,
        explanation: `Reference from uploaded documentation: "${para.substring(0, 150)}..."`,
        difficulty: idx === 0 ? "Easy" : idx === 1 ? "Medium" : "Hard",
        xp: 25,
        sourceDoc: docTitle || "Curriculum Document",
      });
    });
  }

  return generated;
}

/**
 * Intelligent parser that extracts or generates Theory / Descriptive questions from uploaded document text
 */
export function extractTheoryQuestionsFromDocumentText(
  text: string,
  subjectName: string,
  docTitle?: string,
): TheoryQuestionItem[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const generated: TheoryQuestionItem[] = [];

  // 1. JSON parsing support
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed)
        ? parsed
        : parsed.theoryQuestions || parsed.questions || [parsed];
      items.forEach((item: Record<string, unknown>, idx: number) => {
        const qText = (item.questionText || item.question || item.prompt) as string | undefined;
        if (qText) {
          generated.push({
            id: `theory_imp_${Date.now()}_${idx}`,
            questionText: qText,
            expectedAnswer: (item.expectedAnswer ||
              item.answer ||
              item.solution ||
              "Comprehensive theoretical explanation.") as string,
            rubricOrGuidelines: (item.rubricOrGuidelines || item.guidelines || item.rubric) as
              string | undefined,
            difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") || "Medium",
            marks: Number(item.marks) || (idx % 2 === 0 ? 5 : 10),
            sourceDoc: docTitle || "Uploaded JSON",
          });
        }
      });
      if (generated.length > 0) return generated;
    } catch {
      // Fall through
    }
  }

  // 2. Question blocks formatted as "Q1: Explain / Describe / What is ..."
  const questionBlocks = trimmed.split(/\n\s*(?:(?:Q\d+[:.)]|Question\s*\d+[:.)]|\d+[.)]))\s*/i);
  if (questionBlocks.length > 1) {
    questionBlocks.slice(1).forEach((block, idx) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        const questionText = lines[0] || `Theory Question on ${subjectName}`;
        const answerLine = lines.find((l) => /^(?:Ans|Answer|Expected|Solution)[\s:]+/i.test(l));
        const rubricLine = lines.find((l) => /^(?:Rubric|Guideline|Key Points)[\s:]+/i.test(l));

        const expectedAnswer = answerLine
          ? answerLine.replace(/^(?:Ans|Answer|Expected|Solution)[\s:]+/i, "").trim()
          : lines.slice(1).join(" ") ||
            `Model answer derived from curriculum notes on ${subjectName}.`;

        generated.push({
          id: `doc_th_${Date.now()}_${idx}`,
          questionText,
          expectedAnswer,
          rubricOrGuidelines: rubricLine
            ? rubricLine.replace(/^(?:Rubric|Guideline|Key Points)[\s:]+/i, "").trim()
            : "Award marks for conceptual clarity, accurate terminology, and relevant code examples.",
          difficulty: idx % 3 === 0 ? "Easy" : idx % 3 === 1 ? "Medium" : "Hard",
          marks: idx % 3 === 2 ? 10 : 5,
          sourceDoc: docTitle || "Curriculum Document",
        });
      }
    });
  }

  // 3. Paragraph-based conceptual synthesis
  if (generated.length === 0) {
    const paragraphs = trimmed
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40);

    const keyParagraphs = paragraphs.slice(0, 4);
    keyParagraphs.forEach((para, idx) => {
      const sentences = para
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
      const mainSentence = sentences[0] || para.substring(0, 80);

      generated.push({
        id: `auto_th_${Date.now()}_${idx}`,
        questionText: `Explain the architectural importance of: "${mainSentence}" in ${subjectName}. Provide a concrete programming example.`,
        expectedAnswer: `According to syllabus reference: ${para}`,
        rubricOrGuidelines:
          "Check for clear theoretical explanation (3 marks) and realistic code implementation (2 marks).",
        difficulty: idx === 0 ? "Easy" : idx === 1 ? "Medium" : "Hard",
        marks: idx % 2 === 0 ? 5 : 8,
        sourceDoc: docTitle || "Curriculum Document",
      });
    });
  }

  return generated;
}
