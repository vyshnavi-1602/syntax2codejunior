export interface McqQuestionItem {
  id: string;
  topicId?: string;
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
  topicId?: string;
  questionText: string;
  expectedAnswer: string;
  rubricOrGuidelines?: string | undefined;
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  sourceDoc?: string | undefined;
}

export interface TopicItem {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  questions: McqQuestionItem[];
  theoryQuestions?: TheoryQuestionItem[];
}

export interface SubjectItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  topics: TopicItem[];
  questions: McqQuestionItem[];
  theoryQuestions?: TheoryQuestionItem[];
}

export interface ExamItem {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  topicIds: string[];
  totalQuestions: number;
  durationMinutes: number;
  passingPercentage: number;
  status: "Draft" | "Published" | "Scheduled";
  scheduledDate?: string;
  questions: McqQuestionItem[];
}

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  {
    id: "sub_antonyms",
    name: "Antonyms",
    description: "Vocabulary opposites, contextual antonyms, and verbal reasoning.",
    iconName: "BookOpen",
    color: "emerald",
    topics: [
      {
        id: "top_ant_1",
        subjectId: "sub_antonyms",
        name: "General Antonyms & Opposites",
        description: "Common opposite word pairings tested in school and competitive exams.",
        questions: [
          {
            id: "ant_q1",
            questionText: "What is the antonym of 'ABUNDANT'?",
            options: ["Scarce", "Plentiful", "Ample", "Substantial"],
            correctAnswer: "Scarce",
            explanation:
              "'Abundant' means existing or available in large quantities; its opposite is 'Scarce'.",
            difficulty: "Easy",
            xp: 15,
          },
          {
            id: "ant_q2",
            questionText: "Choose the exact opposite of 'CANDID':",
            options: ["Deceitful", "Honest", "Direct", "Sincere"],
            correctAnswer: "Deceitful",
            explanation:
              "'Candid' means truthful and straightforward. The opposite is 'Deceitful'.",
            difficulty: "Medium",
            xp: 20,
          },
          {
            id: "ant_q3",
            questionText: "What is the antonym of 'TRANSIENT'?",
            options: ["Permanent", "Temporary", "Fleeting", "Brief"],
            correctAnswer: "Permanent",
            explanation:
              "'Transient' means lasting only for a short time; opposite is 'Permanent'.",
            difficulty: "Medium",
            xp: 25,
          },
        ],
      },
      {
        id: "top_ant_2",
        subjectId: "sub_antonyms",
        name: "Advanced Contextual Antonyms",
        description: "Higher-level vocabulary and nuance in sentence contexts.",
        questions: [
          {
            id: "ant_q4",
            questionText: "What is the opposite of 'METICULOUS'?",
            options: ["Careless", "Thorough", "Precise", "Detailed"],
            correctAnswer: "Careless",
            explanation:
              "'Meticulous' refers to showing great attention to detail. The opposite is 'Careless'.",
            difficulty: "Easy",
            xp: 15,
          },
          {
            id: "ant_q5",
            questionText: "Identify the antonym for 'BENEVOLENT':",
            options: ["Malevolent", "Kind", "Generous", "Helpful"],
            correctAnswer: "Malevolent",
            explanation:
              "'Benevolent' is well-meaning and kindly; 'Malevolent' means having or showing a wish to do evil.",
            difficulty: "Medium",
            xp: 25,
          },
        ],
      },
    ],
    questions: [],
  },
  {
    id: "sub_aptitude",
    name: "aptitude",
    description: "Comprehensive quantitative, logical, and analytical problem solving.",
    iconName: "Terminal",
    color: "indigo",
    topics: [
      {
        id: "top_apt_num",
        subjectId: "sub_aptitude",
        name: "Number Series & Sequences",
        questions: [
          {
            id: "apt_q1",
            questionText: "Find the next number in sequence: 2, 6, 12, 20, 30, ?",
            options: ["42", "40", "44", "38"],
            correctAnswer: "42",
            explanation:
              "Differences are +4, +6, +8, +10, so next difference is +12. 30 + 12 = 42 (or n^2 + n).",
            difficulty: "Easy",
            xp: 15,
          },
          {
            id: "apt_q2",
            questionText: "Find missing number: 3, 7, 15, 31, 63, ?",
            options: ["127", "125", "128", "126"],
            correctAnswer: "127",
            explanation: "Pattern is (x * 2) + 1. 63 * 2 + 1 = 127.",
            difficulty: "Medium",
            xp: 20,
          },
        ],
      },
      {
        id: "top_apt_quant",
        subjectId: "sub_aptitude",
        name: "Quantitative Aptitude",
        questions: [
          {
            id: "apt_q3",
            questionText:
              "If 15 men can complete a work in 20 days, how many days will 10 men take?",
            options: ["30 days", "25 days", "35 days", "28 days"],
            correctAnswer: "30 days",
            explanation: "Total work = 15 * 20 = 300 man-days. 300 / 10 = 30 days.",
            difficulty: "Medium",
            xp: 20,
          },
        ],
      },
      {
        id: "top_apt_log",
        subjectId: "sub_aptitude",
        name: "Logical Reasoning",
        questions: [
          {
            id: "apt_q4",
            questionText:
              "Pointing to a photograph, a man says: 'She is the daughter of my grandfather's only son.' Who is she to him?",
            options: ["Sister", "Mother", "Aunt", "Daughter"],
            correctAnswer: "Sister",
            explanation: "Grandfather's only son = father. Father's daughter = sister.",
            difficulty: "Easy",
            xp: 15,
          },
        ],
      },
      {
        id: "top_apt_di",
        subjectId: "sub_aptitude",
        name: "Data Interpretation",
        questions: [
          {
            id: "apt_q5",
            questionText:
              "If a pie chart has a category with 72 degrees angle, what percentage of the total does it represent?",
            options: ["20%", "25%", "18%", "15%"],
            correctAnswer: "20%",
            explanation: "(72 / 360) * 100% = 20%.",
            difficulty: "Easy",
            xp: 15,
          },
        ],
      },
      {
        id: "top_apt_perc",
        subjectId: "sub_aptitude",
        name: "Percentages & Profit Loss",
        questions: [
          {
            id: "apt_q6",
            questionText: "An article bought for $80 is sold for $100. Find profit percentage:",
            options: ["25%", "20%", "30%", "15%"],
            correctAnswer: "25%",
            explanation: "Profit = $20. (20 / 80) * 100 = 25%.",
            difficulty: "Easy",
            xp: 15,
          },
        ],
      },
      {
        id: "top_apt_time",
        subjectId: "sub_aptitude",
        name: "Time, Speed & Distance",
        questions: [
          {
            id: "apt_q7",
            questionText:
              "A train 120m long passes a pole in 6 seconds. What is the speed of the train in km/h?",
            options: ["72 km/h", "60 km/h", "80 km/h", "64 km/h"],
            correctAnswer: "72 km/h",
            explanation: "Speed = 120 / 6 = 20 m/s. In km/h = 20 * (18 / 5) = 72 km/h.",
            difficulty: "Medium",
            xp: 25,
          },
        ],
      },
      {
        id: "top_apt_perm",
        subjectId: "sub_aptitude",
        name: "Permutation & Combination",
        questions: [
          {
            id: "apt_q8",
            questionText: "In how many ways can the letters of the word 'LEADER' be arranged?",
            options: ["360", "720", "120", "480"],
            correctAnswer: "360",
            explanation: "6 letters with 2 E's: 6! / 2! = 720 / 2 = 360.",
            difficulty: "Hard",
            xp: 30,
          },
        ],
      },
      {
        id: "top_apt_work",
        subjectId: "sub_aptitude",
        name: "Work & Wages",
        questions: [
          {
            id: "apt_q9",
            questionText:
              "A and B can do a job in 12 days and 16 days respectively. Working together, they finish in:",
            options: ["48/7 days", "7 days", "6 days", "8 days"],
            correctAnswer: "48/7 days",
            explanation: "Combined rate = 1/12 + 1/16 = 7/48. Time = 48/7 days (approx 6.85 days).",
            difficulty: "Medium",
            xp: 20,
          },
        ],
      },
    ],
    questions: [],
  },
  {
    id: "sub_aptitude_3rd",
    name: "APTITUDE FOR 3RD YEARS",
    description: "Campus placements, recruitment tests, and corporate assessments.",
    iconName: "Code2",
    color: "amber",
    topics: [
      {
        id: "top_apt3_quant",
        subjectId: "sub_aptitude_3rd",
        name: "Advanced Quantitative Mock",
        questions: [
          {
            id: "apt3_q1",
            questionText: "What is the probability of rolling a sum of 8 with two six-sided dice?",
            options: ["5/36", "1/6", "1/9", "7/36"],
            correctAnswer: "5/36",
            explanation:
              "Pairs summing to 8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes out of 36.",
            difficulty: "Medium",
            xp: 25,
          },
        ],
      },
      {
        id: "top_apt3_verbal",
        subjectId: "sub_aptitude_3rd",
        name: "Verbal & Critical Thinking",
        questions: [
          {
            id: "apt3_q2",
            questionText: "Select the sentence with correct grammatical syntax:",
            options: [
              "Neither of the candidates has submitted their credentials.",
              "Neither of the candidates have submitted their credentials.",
              "Neither of the candidate has submitted their credentials.",
              "Neither of the candidates were submitting their credentials.",
            ],
            correctAnswer: "Neither of the candidates has submitted their credentials.",
            explanation: "'Neither' is singular and takes the singular verb 'has'.",
            difficulty: "Hard",
            xp: 30,
          },
        ],
      },
    ],
    questions: [],
  },
  {
    id: "sub_blood",
    name: "Blood Relations",
    description: "Family tree decoding, generation gaps, and coded blood relation tests.",
    iconName: "Users",
    color: "rose",
    topics: [
      {
        id: "top_blood_1",
        subjectId: "sub_blood",
        name: "Family Tree & Coded Relations",
        questions: [
          {
            id: "blood_q1",
            questionText:
              "If A + B means A is the mother of B, A - B means A is the brother of B, what does P - Q + R mean?",
            options: [
              "P is maternal uncle of R",
              "P is father of R",
              "P is brother of R",
              "P is grandfather of R",
            ],
            correctAnswer: "P is maternal uncle of R",
            explanation:
              "P is brother of Q, and Q is mother of R. Therefore P is maternal uncle of R.",
            difficulty: "Medium",
            xp: 25,
          },
          {
            id: "blood_q2",
            questionText:
              "Introducing a boy, a girl said, 'He is the son of the daughter of the father of my uncle.' How is the boy related to the girl?",
            options: ["Brother", "Cousin", "Nephew", "Uncle"],
            correctAnswer: "Brother",
            explanation:
              "Father of my uncle = grandfather. Daughter of grandfather = mother. Son of mother = brother.",
            difficulty: "Easy",
            xp: 20,
          },
        ],
      },
    ],
    questions: [],
  },
  {
    id: "sub_bootcamp_c",
    name: "BOOTCAMP-1ST YEAR -C(MCQ)",
    description: "Foundational C programming, memory addressing, and pointers.",
    iconName: "Terminal",
    color: "cyan",
    topics: [
      {
        id: "top_boot_c_1",
        subjectId: "sub_bootcamp_c",
        name: "C Fundamentals & Pointers",
        questions: [
          {
            id: "c_q1",
            questionText: "What does the dereference operator '*' do in C?",
            options: [
              "Accesses the value stored at the pointer's memory address",
              "Returns the memory address of a variable",
              "Multiplies two memory addresses",
              "Allocates heap memory",
            ],
            correctAnswer: "Accesses the value stored at the pointer's memory address",
            explanation:
              "The unary '*' operator dereferences a pointer to access the value at that address.",
            difficulty: "Easy",
            xp: 15,
          },
          {
            id: "c_q2",
            questionText: "What is the return type of `malloc()` in C?",
            options: ["void*", "int*", "char*", "size_t"],
            correctAnswer: "void*",
            explanation: "`malloc` returns a `void*` which can be cast to any data type pointer.",
            difficulty: "Medium",
            xp: 20,
          },
        ],
      },
    ],
    questions: [],
  },
  {
    id: "sub_calender",
    name: "Calender",
    description: "Calendar mathematics, leap years, odd days, and day determination.",
    iconName: "Calendar",
    color: "teal",
    topics: [
      {
        id: "top_cal_1",
        subjectId: "sub_calender",
        name: "Odd Days & Day Calculations",
        questions: [
          {
            id: "cal_q1",
            questionText: "How many odd days are in an ordinary (non-leap) year of 365 days?",
            options: ["1 odd day", "2 odd days", "0 odd days", "3 odd days"],
            correctAnswer: "1 odd day",
            explanation: "365 / 7 = 52 weeks and 1 remainder day (1 odd day).",
            difficulty: "Easy",
            xp: 15,
          },
          {
            id: "cal_q2",
            questionText: "If Jan 1, 2006 was a Sunday, what day was Jan 1, 2010?",
            options: ["Friday", "Sunday", "Thursday", "Saturday"],
            correctAnswer: "Friday",
            explanation:
              "2006, 2007, 2008 (leap = 2 odd), 2009 -> 1 + 1 + 2 + 1 = 5 odd days. Sunday + 5 = Friday.",
            difficulty: "Medium",
            xp: 20,
          },
        ],
      },
    ],
    questions: [],
  },
  {
    id: "sub_clock",
    name: "Clock",
    description: "Clock hands speed, angle between hands, and time gains/losses.",
    iconName: "Clock",
    color: "purple",
    topics: [
      {
        id: "top_clk_1",
        subjectId: "sub_clock",
        name: "Angle Between Hands & Reflection",
        questions: [
          {
            id: "clk_q1",
            questionText: "What is the angle between the hands of a clock at 3:30?",
            options: ["75 degrees", "70 degrees", "80 degrees", "90 degrees"],
            correctAnswer: "75 degrees",
            explanation: "Formula: |30*H - 11/2*M| = |30*3 - 5.5*30| = |90 - 165| = 75 degrees.",
            difficulty: "Medium",
            xp: 20,
          },
          {
            id: "clk_q2",
            questionText: "How many times do the hands of a clock coincide in a 24-hour day?",
            options: ["22 times", "24 times", "44 times", "48 times"],
            correctAnswer: "22 times",
            explanation: "The hands coincide 11 times every 12 hours, so 22 times in 24 hours.",
            difficulty: "Easy",
            xp: 15,
          },
        ],
      },
    ],
    questions: [],
  },
  {
    id: "sub_python",
    name: "Python Programming",
    description: "Core syntax, data types, control structures, functions, and OOP in Python.",
    iconName: "Terminal",
    color: "emerald",
    topics: [
      {
        id: "top_py_data",
        subjectId: "sub_python",
        name: "Variables & Data Types",
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
            id: "py_q4",
            questionText:
              "Which collection type is unordered, mutable, and does not allow duplicate members?",
            options: ["Set", "List", "Tuple", "Dictionary"],
            correctAnswer: "Set",
            explanation: "A set in Python stores distinct, unique elements without fixed ordering.",
            difficulty: "Medium",
            xp: 25,
          },
        ],
      },
      {
        id: "top_py_loops",
        subjectId: "sub_python",
        name: "Control Flow & Loops",
        questions: [
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
        ],
      },
      {
        id: "top_py_func",
        subjectId: "sub_python",
        name: "Functions & Scope",
        questions: [
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
        ],
      },
      {
        id: "top_py_oop",
        subjectId: "sub_python",
        name: "OOP & Classes",
        questions: [
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
    ],
    questions: [],
  },
];

export const DEFAULT_EXAMS: ExamItem[] = [
  {
    id: "exam_1",
    title: "Mid-Term Python & Logic Assessment",
    subjectId: "sub_python",
    subjectName: "Python Programming",
    topicIds: ["top_py_data", "top_py_loops"],
    totalQuestions: 25,
    durationMinutes: 45,
    passingPercentage: 70,
    status: "Published",
    scheduledDate: "Tomorrow, 10:00 AM",
    questions: [],
  },
  {
    id: "exam_2",
    title: "Placement Quantitative Screening Exam",
    subjectId: "sub_aptitude",
    subjectName: "aptitude",
    topicIds: ["top_apt_num", "top_apt_quant", "top_apt_time"],
    totalQuestions: 30,
    durationMinutes: 60,
    passingPercentage: 65,
    status: "Scheduled",
    scheduledDate: "15 Oct 2026, 02:00 PM",
    questions: [],
  },
  {
    id: "exam_3",
    title: "Verbal Antonyms & Word Power Quiz",
    subjectId: "sub_antonyms",
    subjectName: "Antonyms",
    topicIds: ["top_ant_1", "top_ant_2"],
    totalQuestions: 20,
    durationMinutes: 30,
    passingPercentage: 60,
    status: "Draft",
    questions: [],
  },
];

const STORAGE_KEY = "s2c_question_bank_v5";
const EXAMS_STORAGE_KEY = "s2c_exams_v2";

export function loadQuestionBank(): SubjectItem[] {
  if (typeof window === "undefined") return DEFAULT_SUBJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBJECTS));
      return DEFAULT_SUBJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((s) => {
        if (!s.topics || s.topics.length === 0) {
          const defaultTop: TopicItem = {
            id: `top_${s.id}_default`,
            subjectId: s.id,
            name: `${s.name} Core Topics`,
            questions: s.questions || [],
            theoryQuestions: s.theoryQuestions || [],
          };
          return {
            ...s,
            topics: [defaultTop],
            questions: s.questions || [],
          };
        }
        return s;
      });
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

export function loadExams(): ExamItem[] {
  if (typeof window === "undefined") return DEFAULT_EXAMS;
  try {
    const raw = localStorage.getItem(EXAMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(DEFAULT_EXAMS));
      return DEFAULT_EXAMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_EXAMS;
  }
}

export function saveExams(exams: ExamItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
  } catch (e) {
    console.error("Failed to save exams:", e);
  }
}

/**
 * Intelligent file parser: handles .docx, .doc, .txt, .md, .json, .csv
 */
export async function extractTextFromUploadedFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  // If Word .docx, extract XML text from zip container natively
  if (name.endsWith(".docx")) {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const docXmlName = "word/document.xml";

      for (let i = 0; i < bytes.length - 30; i++) {
        if (
          bytes[i] === 0x50 &&
          bytes[i + 1] === 0x4b &&
          bytes[i + 2] === 0x03 &&
          bytes[i + 3] === 0x04
        ) {
          const b8 = bytes[i + 8] ?? 0;
          const b9 = bytes[i + 9] ?? 0;
          const compressionMethod = b8 | (b9 << 8);
          const b18 = bytes[i + 18] ?? 0;
          const b19 = bytes[i + 19] ?? 0;
          const b20 = bytes[i + 20] ?? 0;
          const b21 = bytes[i + 21] ?? 0;
          const compressedSize = b18 | (b19 << 8) | (b20 << 16) | (b21 << 24);
          const b26 = bytes[i + 26] ?? 0;
          const b27 = bytes[i + 27] ?? 0;
          const fileNameLength = b26 | (b27 << 8);
          const b28 = bytes[i + 28] ?? 0;
          const b29 = bytes[i + 29] ?? 0;
          const extraFieldLength = b28 | (b29 << 8);

          const fileNameStart = i + 30;
          const currentFileName = new TextDecoder().decode(
            bytes.subarray(fileNameStart, fileNameStart + fileNameLength),
          );

          if (currentFileName === docXmlName) {
            const fileDataStart = fileNameStart + fileNameLength + extraFieldLength;
            const compressedData = bytes.subarray(fileDataStart, fileDataStart + compressedSize);

            let xmlText = "";
            if (compressionMethod === 0) {
              xmlText = new TextDecoder().decode(compressedData);
            } else if (compressionMethod === 8 && typeof DecompressionStream !== "undefined") {
              const ds = new DecompressionStream("deflate-raw");
              const writer = ds.writable.getWriter();
              writer.write(compressedData);
              writer.close();
              const decompressed = await new Response(ds.readable).arrayBuffer();
              xmlText = new TextDecoder().decode(decompressed);
            }

            if (xmlText) {
              return xmlText
                .replace(/<\/w:p>/g, "\n")
                .replace(/<w:t[^>]*>(.*?)<\/w:t>/g, "$1")
                .replace(/<[^>]+>/g, "")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"');
            }
          }
        }
      }
    } catch (err) {
      console.warn("Native docx parse fallback:", err);
    }
  }

  // Standard text reader for .txt, .md, .csv, .json, fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

/**
 * Intelligent question extractor: parses multiple choice questions from plain text
 */
export function extractQuestionsFromDocumentText(
  text: string,
  subjectName: string,
  docTitle?: string,
): McqQuestionItem[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const generated: McqQuestionItem[] = [];

  // 1. JSON parsing support
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
              (item.explanation as string) || `Derived from document: ${docTitle || subjectName}`,
            difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") || "Medium",
            xp: Number(item.xp) || 20,
            sourceDoc: docTitle || "Uploaded File",
          });
        }
      });
      if (generated.length > 0) return generated;
    } catch {
      // Fall through
    }
  }

  // 2. Multi-line Q&A Parser
  const questionBlocks = trimmed.split(/\n\s*(?:(?:Q\d+[:.)]|Question\s*\d+[:.)]|\d+[.)]))\s*/i);

  if (questionBlocks.length > 1) {
    questionBlocks.slice(1).forEach((block, idx) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        const questionText = lines[0] || `Question ${idx + 1}`;
        const optionLines = lines.filter((l) => /^[a-d][.)]\s+/i.test(l));
        let options = optionLines.map((l) => l.replace(/^[a-d][.)]\s+/i, "").trim());

        const answerLine = lines.find((l) => /^(?:Ans|Answer|Correct)[\s:]+/i.test(l));
        let correctAnswer = "";

        if (answerLine) {
          const rawAns = answerLine.replace(/^(?:Ans|Answer|Correct)[\s:]+/i, "").trim();
          const letterMatch = rawAns.match(/^[a-d]\b/i);
          if (letterMatch && letterMatch[0]) {
            const letterIdx = ["a", "b", "c", "d"].indexOf(letterMatch[0].toLowerCase());
            if (letterIdx >= 0 && options[letterIdx]) {
              correctAnswer = options[letterIdx]!;
            }
          }
          if (!correctAnswer) {
            correctAnswer = rawAns;
          }
        }

        if (options.length < 2) {
          options = [
            correctAnswer || "Option A (Valid)",
            "Option B (Alternative)",
            "Option C (Distractor)",
            "Option D (None of the above)",
          ];
        }

        if (!correctAnswer) {
          correctAnswer = options[0] || "Option A";
        }

        generated.push({
          id: `doc_mcq_${Date.now()}_${idx}`,
          questionText,
          options,
          correctAnswer,
          explanation: `Answer derived from syllabus notes: ${correctAnswer}`,
          difficulty: idx % 3 === 0 ? "Easy" : idx % 3 === 1 ? "Medium" : "Hard",
          xp: idx % 3 === 2 ? 30 : idx % 3 === 1 ? 20 : 15,
          sourceDoc: docTitle || "Uploaded Document",
        });
      }
    });
  }

  // 3. Fallback: Parse paragraphs into questions if not formatted
  if (generated.length === 0) {
    const paragraphs = trimmed
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    const samplePool = paragraphs.slice(0, 6);
    samplePool.forEach((para, idx) => {
      const sentences = para
        .split(/[.?!]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8);
      const prompt = sentences[0] || para.substring(0, 70);
      const ans = sentences[1] || `True according to notes`;

      generated.push({
        id: `auto_mcq_${Date.now()}_${idx}`,
        questionText: `According to ${docTitle || subjectName}: "${prompt}..." What is the primary conclusion?`,
        options: [
          ans,
          `Contrary to findings, this cannot occur`,
          `Only valid in legacy environments`,
          `None of the above`,
        ],
        correctAnswer: ans,
        explanation: `Syllabus excerpt: ${para.substring(0, 120)}...`,
        difficulty: idx % 2 === 0 ? "Easy" : "Medium",
        xp: 20,
        sourceDoc: docTitle || "Uploaded Document",
      });
    });
  }

  return generated;
}

export function extractTheoryQuestionsFromDocumentText(
  text: string,
  subjectName: string,
  docTitle?: string,
): TheoryQuestionItem[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const generated: TheoryQuestionItem[] = [];

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
          : lines.slice(1).join(" ") || `Model answer derived from notes on ${subjectName}.`;

        generated.push({
          id: `doc_th_${Date.now()}_${idx}`,
          questionText,
          expectedAnswer,
          rubricOrGuidelines: rubricLine
            ? rubricLine.replace(/^(?:Rubric|Guideline|Key Points)[\s:]+/i, "").trim()
            : "Award marks for conceptual clarity, accurate terminology, and reasoning.",
          difficulty: idx % 3 === 0 ? "Easy" : idx % 3 === 1 ? "Medium" : "Hard",
          marks: idx % 3 === 2 ? 10 : 5,
          sourceDoc: docTitle || "Curriculum Document",
        });
      }
    });
  }

  return generated;
}
