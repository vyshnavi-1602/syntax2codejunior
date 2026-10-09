export interface CourseModule {
  id: string;
  day: number;
  title: string;
  topics: string[];
  questionsCount: number;
}

export interface CourseFeedback {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

export type CourseCategory = "Academics" | "Placements" | "Competitive" | "Foundation";
export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
export type CourseStatus = "Published" | "Draft" | "Archived";

export interface CourseItem {
  id: string;
  title: string;
  instructor: string;
  totalQuestions: number;
  languages: string[];
  category: CourseCategory;
  level: CourseLevel;
  status: CourseStatus;
  version: string;
  description?: string;
  modules: CourseModule[];
  feedbacks?: CourseFeedback[];
  enrolled?: boolean;
  visualType?: "lock" | "globe" | "laptop";
}

export const DEFAULT_COURSES: CourseItem[] = [
  {
    id: "crs-c-bootcamp-9",
    title: "C PROGRAMMING BOOTCAMP - 9 DAYS",
    instructor: "ADMIN",
    totalQuestions: 33,
    languages: ["C"],
    category: "Academics",
    level: "Intermediate",
    status: "Published",
    version: "v1",
    enrolled: true,
    visualType: "lock",
    description:
      "9-day C Programming Bootcamp (C language only). Each day is a module with training problems and live assessments.",
    modules: [
      {
        id: "mod-1",
        day: 1,
        title: "Introduction to C Syntax & Primitive Data Types",
        topics: ["Variable declarations", "Standard I/O", "Format specifiers"],
        questionsCount: 4,
      },
      {
        id: "mod-2",
        day: 2,
        title: "Operators, Expressions & Precedence",
        topics: ["Arithmetic operators", "Bitwise logic", "Short-circuit evaluation"],
        questionsCount: 5,
      },
      {
        id: "mod-3",
        day: 3,
        title: "Control Flow & Decision Making",
        topics: ["if-else ladders", "switch-case statements", "Ternary operator"],
        questionsCount: 4,
      },
      {
        id: "mod-4",
        day: 4,
        title: "Iterative Loops & Jump Statements",
        topics: ["for loops", "while & do-while", "break and continue"],
        questionsCount: 5,
      },
      {
        id: "mod-5",
        day: 5,
        title: "1D & 2D Arrays in Memory",
        topics: ["Array bounds", "Matrix manipulation", "Contiguous memory layout"],
        questionsCount: 4,
      },
      {
        id: "mod-6",
        day: 6,
        title: "Strings & Character Arrays",
        topics: ["Null termination", "string.h utilities", "Buffer security"],
        questionsCount: 3,
      },
      {
        id: "mod-7",
        day: 7,
        title: "Functions, Scope & Recursion",
        topics: ["Call by value", "Activation frames", "Base cases"],
        questionsCount: 3,
      },
      {
        id: "mod-8",
        day: 8,
        title: "Pointers & Memory Architecture",
        topics: ["Pointer arithmetic", "Double pointers", "Dynamic malloc & free"],
        questionsCount: 3,
      },
      {
        id: "mod-9",
        day: 9,
        title: "Structures, Unions & Capstone Project",
        topics: ["Typedef", "Memory alignment", "File I/O"],
        questionsCount: 2,
      },
    ],
    feedbacks: [
      {
        id: "fb-1",
        studentName: "Aarav Gupta",
        rating: 5,
        comment: "Outstanding hands-on coverage of pointer arithmetic and dynamic allocation.",
        date: "2 days ago",
      },
    ],
  },
  {
    id: "crs-6days-training",
    title: "6 DAYS TRAINING PROGRAM",
    instructor: "ADMIN",
    totalQuestions: 100,
    languages: ["Java", "C", "C++", "Python"],
    category: "Academics",
    level: "Intermediate",
    status: "Published",
    version: "v1",
    enrolled: false,
    visualType: "globe",
    description: "Fundamentals of Arrays and Strings",
    modules: [
      {
        id: "mod-t1",
        day: 1,
        title: "Syntax Fundamentals Across Languages",
        topics: ["I/O patterns", "Type casting", "Memory models"],
        questionsCount: 18,
      },
      {
        id: "mod-t2",
        day: 2,
        title: "Data Collections & Linear Structures",
        topics: ["Arrays", "Vectors", "ArrayLists", "Lists"],
        questionsCount: 20,
      },
      {
        id: "mod-t3",
        day: 3,
        title: "Hashing & Lookup Optimizations",
        topics: ["Hash maps", "Frequency counting", "Set collisions"],
        questionsCount: 18,
      },
      {
        id: "mod-t4",
        day: 4,
        title: "Two Pointers & Sliding Window",
        topics: ["Subarray maximums", "Palindrome checks", "Sorted pair search"],
        questionsCount: 16,
      },
      {
        id: "mod-t5",
        day: 5,
        title: "Sorting & Binary Search Applications",
        topics: ["Lower and upper bounds", "Custom comparators", "Rotated arrays"],
        questionsCount: 14,
      },
      {
        id: "mod-t6",
        day: 6,
        title: "Capstone Mock Competition Round",
        topics: ["Live speed trial", "Timed automated scoring", "Post-exam editorial"],
        questionsCount: 14,
      },
    ],
    feedbacks: [],
  },
  {
    id: "crs-10days-training",
    title: "10 DAYS TRAINING PROGRAM",
    instructor: "ADMIN",
    totalQuestions: 50,
    languages: ["Java", "C++", "Python"],
    category: "Academics",
    level: "Intermediate",
    status: "Published",
    version: "v1",
    enrolled: true,
    visualType: "laptop",
    description: "Fundamentals",
    modules: [
      {
        id: "mod-10-1",
        day: 1,
        title: "Core Data Types & Memory Allocation",
        topics: ["Memory representations", "Primitive limits", "Type casting"],
        questionsCount: 5,
      },
      {
        id: "mod-10-2",
        day: 2,
        title: "Conditionals, Logic & Bitwise Manipulations",
        topics: ["Binary arithmetic", "Masking", "Branch prediction"],
        questionsCount: 5,
      },
      {
        id: "mod-10-3",
        day: 3,
        title: "Loop Optimizations & Invariants",
        topics: ["Nested loop limits", "Termination criteria", "Space-time complexity"],
        questionsCount: 5,
      },
      {
        id: "mod-10-4",
        day: 4,
        title: "1D Array Fundamentals & Subarray Sums",
        topics: ["Prefix sums", "Kadane's algorithm", "Sliding window"],
        questionsCount: 5,
      },
      {
        id: "mod-10-5",
        day: 5,
        title: "Matrix Operations & 2D Grid Traversals",
        topics: ["Transposition", "Rotations", "Boundary traversal"],
        questionsCount: 5,
      },
      {
        id: "mod-10-6",
        day: 6,
        title: "String Parsing & Anagrams",
        topics: ["Character frequencies", "Sliding window string matching"],
        questionsCount: 5,
      },
      {
        id: "mod-10-7",
        day: 7,
        title: "Recursion Foundations & Call Stacks",
        topics: ["Base conditions", "Euler paths", "Recursion trees"],
        questionsCount: 5,
      },
      {
        id: "mod-10-8",
        day: 8,
        title: "Divide & Conquer Sorting Algorithms",
        topics: ["Merge sort", "Quick sort partitioning", "Inversions"],
        questionsCount: 5,
      },
      {
        id: "mod-10-9",
        day: 9,
        title: "Searching Strategies & Lower/Upper Bounds",
        topics: ["Binary search on answer space", "Ternary search"],
        questionsCount: 5,
      },
      {
        id: "mod-10-10",
        day: 10,
        title: "Comprehensive Synthesis & Project Evaluation",
        topics: ["Multi-topic integration", "Timed test bench", "Benchmark scoring"],
        questionsCount: 5,
      },
    ],
    feedbacks: [],
  },
];

const TEACHER_COURSES_KEY = "s2c_teacher_courses_v1";
const SCHOOL_COURSES_KEY = "s2c_school_courses_v1";
const STUDENT_COURSES_KEY = "s2c_student_courses_v1";

export function loadCourses(portal: "teacher" | "school" | "student"): CourseItem[] {
  if (typeof window === "undefined") return DEFAULT_COURSES;
  const key =
    portal === "teacher"
      ? TEACHER_COURSES_KEY
      : portal === "school"
        ? SCHOOL_COURSES_KEY
        : STUDENT_COURSES_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_COURSES));
      return DEFAULT_COURSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COURSES;
  } catch {
    return DEFAULT_COURSES;
  }
}

export function saveCourses(portal: "teacher" | "school" | "student", courses: CourseItem[]) {
  if (typeof window === "undefined") return;
  const key =
    portal === "teacher"
      ? TEACHER_COURSES_KEY
      : portal === "school"
        ? SCHOOL_COURSES_KEY
        : STUDENT_COURSES_KEY;
  try {
    localStorage.setItem(key, JSON.stringify(courses));
  } catch (err) {
    console.error("Failed to save courses:", err);
  }
}
