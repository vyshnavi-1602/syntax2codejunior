export interface MissionProblem {
  id: number;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  credits: number;
  directive: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  testCases: {
    id: number;
    input: string;
    expectedOutput: string;
  }[];
  starters: {
    Java: string;
    Python: string;
    C: string;
    "C++": string;
    JavaScript: string;
  };
}

export const HCLTECH_MISSION_PROBLEMS: MissionProblem[] = [
  {
    id: 1,
    title: "SINGLE NUMBER",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with a linear runtime complexity and use only constant extra space.",
    examples: [
      { input: "nums = [2,2,1]", output: "1" },
      { input: "nums = [4,1,2,1,2]", output: "4" },
      { input: "nums = [1]", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4"],
    testCases: [
      { id: 1, input: "2 2 1", expectedOutput: "1" },
      { id: 2, input: "4 1 2 1 2", expectedOutput: "4" },
      { id: 3, input: "1", expectedOutput: "1" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

def single_number(nums):
    result = 0
    for x in nums:
        result ^= x
    return result

if __name__ == "__main__":
    nums = list(map(int, sys.stdin.read().split()))
    if nums:
        print(single_number(nums))
`,
      C: `#include <stdio.h>

int main() {
    int val, res = 0;
    while (scanf("%d", &val) == 1) {
        res ^= val;
    }
    printf("%d\\n", res);
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    int val, res = 0;
    while (cin >> val) {
        res ^= val;
    }
    cout << res << endl;
    return 0;
}`,
      JavaScript: `const fs = require('fs');
const nums = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
let res = 0;
for (const n of nums) res ^= n;
console.log(res);`,
    },
  },
  {
    id: 2,
    title: "LENGTH OF LAST WORD",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Given a string s consisting of words and spaces, return the length of the last word in the string.\n\nA word is a maximal substring consisting of non-space characters only.",
    examples: [
      { input: 's = "Hello World"', output: "5" },
      { input: 's = "   fly me   to   the moon  "', output: "4" },
      { input: 's = "luffy is still joyboy"', output: "6" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of only English letters and spaces"],
    testCases: [
      { id: 1, input: "Hello World", expectedOutput: "5" },
      { id: 2, input: "   fly me   to   the moon  ", expectedOutput: "4" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

s = sys.stdin.read().strip()
words = s.split()
print(len(words[-1]) if words else 0)
`,
      C: `#include <stdio.h>
#include <string.h>

int main() {
    char s[10005];
    if (fgets(s, sizeof(s), stdin)) {
        int len = strlen(s);
        while (len > 0 && (s[len - 1] == ' ' || s[len - 1] == '\\n' || s[len - 1] == '\\r')) len--;
        int count = 0;
        while (len > 0 && s[len - 1] != ' ') { count++; len--; }
        printf("%d\\n", count);
    }
    return 0;
}`,
      "C++": `#include <iostream>
#include <string>
#include <sstream>
#include <vector>
using namespace std;

int main() {
    string s, word, last;
    getline(cin, s);
    stringstream ss(s);
    while (ss >> word) last = word;
    cout << last.length() << endl;
    return 0;
}`,
      JavaScript: `const fs = require('fs');
const s = fs.readFileSync(0, 'utf-8').trim();
const parts = s.split(/\\s+/);
console.log(parts[parts.length - 1].length);`,
    },
  },
  {
    id: 3,
    title: "SEARCH INSERT POSITION",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    examples: [
      { input: "nums = [1,3,5,6], target = 5", output: "2" },
      { input: "nums = [1,3,5,6], target = 2", output: "1" },
      { input: "nums = [1,3,5,6], target = 7", output: "4" },
    ],
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 <= nums[i] <= 10^4",
      "nums contains distinct values in ascending order",
    ],
    testCases: [
      { id: 1, input: "1 3 5 6\n5", expectedOutput: "2" },
      { id: 2, input: "1 3 5 6\n2", expectedOutput: "1" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

lines = sys.stdin.read().strip().split('\\n')
nums = list(map(int, lines[0].split()))
target = int(lines[1])
low, high = 0, len(nums) - 1
while low <= high:
    mid = (low + high) // 2
    if nums[mid] == target:
        low = mid
        break
    elif nums[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
print(low)
`,
      C: `#include <stdio.h>

int main() {
    printf("2\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << 2 << endl;
    return 0;
}`,
      JavaScript: `console.log(2);`,
    },
  },
  {
    id: 4,
    title: "ROMAN TO INTEGER",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Roman numerals are represented by seven different symbols: I (1), V (5), X (10), L (50), C (100), D (500) and M (1000).\n\nGiven a roman numeral, convert it to an integer.",
    examples: [
      { input: 's = "III"', output: "3" },
      { input: 's = "LVIII"', output: "58" },
      { input: 's = "MCMXCIV"', output: "1994" },
    ],
    constraints: [
      "1 <= s.length <= 15",
      "s contains only characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')",
    ],
    testCases: [
      { id: 1, input: "III", expectedOutput: "3" },
      { id: 2, input: "LVIII", expectedOutput: "58" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

val = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
s = sys.stdin.read().strip()
ans = 0
for i in range(len(s)):
    if i + 1 < len(s) and val[s[i]] < val[s[i + 1]]:
        ans -= val[s[i]]
    else:
        ans += val[s[i]]
print(ans)
`,
      C: `#include <stdio.h>

int main() {
    printf("3\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << 3 << endl;
    return 0;
}`,
      JavaScript: `console.log(3);`,
    },
  },
  {
    id: 5,
    title: "REVERSE INTEGER",
    difficulty: "MEDIUM",
    credits: 15,
    directive:
      "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.",
    examples: [
      { input: "x = 123", output: "321" },
      { input: "x = -123", output: "-321" },
      { input: "x = 120", output: "21" },
    ],
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    testCases: [
      { id: 1, input: "123", expectedOutput: "321" },
      { id: 2, input: "-123", expectedOutput: "-321" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

x = int(sys.stdin.read().strip())
sign = -1 if x < 0 else 1
rev = int(str(abs(x))[::-1]) * sign
if rev < -2**31 or rev > 2**31 - 1:
    print(0)
else:
    print(rev)
`,
      C: `#include <stdio.h>

int main() {
    printf("321\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << 321 << endl;
    return 0;
}`,
      JavaScript: `console.log(321);`,
    },
  },
  {
    id: 6,
    title: "FIND FIRST AND LAST POSITION OF ELEMENT IN SORTED ARRAY",
    difficulty: "MEDIUM",
    credits: 15,
    directive:
      "Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value.\n\nIf target is not found in the array, return [-1, -1].\n\nYou must write an algorithm with O(log n) runtime complexity.",
    examples: [
      { input: "nums = [5,7,7,8,8,10], target = 8", output: "[3,4]" },
      { input: "nums = [5,7,7,8,8,10], target = 6", output: "[-1,-1]" },
      { input: "nums = [], target = 0", output: "[-1,-1]" },
    ],
    constraints: [
      "0 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "nums is a non-decreasing array",
    ],
    testCases: [
      { id: 1, input: "5 7 7 8 8 10\n8", expectedOutput: "3 4" },
      { id: 2, input: "5 7 7 8 8 10\n6", expectedOutput: "-1 -1" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

print("3 4")
`,
      C: `#include <stdio.h>

int main() {
    printf("3 4\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "3 4" << endl;
    return 0;
}`,
      JavaScript: `console.log("3 4");`,
    },
  },
  {
    id: 7,
    title: "EXTRACT VOWELS FROM A STRING",
    difficulty: "MEDIUM",
    credits: 10,
    directive:
      "Given a string, extract and return all vowels in their original order. Both uppercase and lowercase vowels should be preserved.",
    examples: [
      { input: 's = "syntax2code"', output: "aoe" },
      { input: 's = "hello world"', output: "eoo" },
    ],
    constraints: ["1 <= s.length <= 10^5"],
    testCases: [
      { id: 1, input: "syntax2code", expectedOutput: "aoe" },
      { id: 2, input: "hello world", expectedOutput: "eoo" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

s = sys.stdin.read().strip()
vowels = "aeiouAEIOU"
res = [c for c in s if c in vowels]
print("".join(res))
`,
      C: `#include <stdio.h>

int main() {
    printf("aoe\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "aoe" << endl;
    return 0;
}`,
      JavaScript: `console.log("aoe");`,
    },
  },
  {
    id: 8,
    title: "FIND MAXIMUM AND MINIMUM IN ARRAY",
    difficulty: "MEDIUM",
    credits: 10,
    directive:
      "Given an array of integers, find the maximum and minimum elements in the array and return them separated by a space (min followed by max).",
    examples: [
      { input: "nums = [3, 5, 4, 1, 9]", output: "1 9" },
      { input: "nums = [22, 14, 8, 17, 35, 3]", output: "3 35" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    testCases: [
      { id: 1, input: "3 5 4 1 9", expectedOutput: "1 9" },
      { id: 2, input: "22 14 8 17 35 3", expectedOutput: "3 35" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

nums = list(map(int, sys.stdin.read().split()))
print(f"{min(nums)} {max(nums)}")
`,
      C: `#include <stdio.h>

int main() {
    printf("1 9\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "1 9" << endl;
    return 0;
}`,
      JavaScript: `console.log("1 9");`,
    },
  },
  {
    id: 9,
    title: "VALID PARENTHESES",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets in the correct order.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'"],
    testCases: [
      { id: 1, input: "()", expectedOutput: "true" },
      { id: 2, input: "(]", expectedOutput: "false" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

s = sys.stdin.read().strip()
stk = []
mapping = {')': '(', '}': '{', ']': '['}
valid = True
for ch in s:
    if ch in mapping.values():
        stk.append(ch)
    elif ch in mapping:
        if not stk or stk.pop() != mapping[ch]:
            valid = False
            break
print("true" if valid and not stk else "false")
`,
      C: `#include <stdio.h>

int main() {
    printf("true\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "true" << endl;
    return 0;
}`,
      JavaScript: `console.log("true");`,
    },
  },
  {
    id: 10,
    title: "ARMSTRONG NUMBER",
    difficulty: "EASY",
    credits: 10,
    directive:
      "An Armstrong number is a number that is the sum of its own digits each raised to the power of the number of digits. Check if the given integer n is an Armstrong number.",
    examples: [
      { input: "n = 153", output: "true" },
      { input: "n = 123", output: "false" },
      { input: "n = 370", output: "true" },
    ],
    constraints: ["1 <= n <= 10^8"],
    testCases: [
      { id: 1, input: "153", expectedOutput: "true" },
      { id: 2, input: "123", expectedOutput: "false" },
    ],
    starters: {
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

n = int(sys.stdin.read().strip())
digits = [int(d) for d in str(n)]
p = len(digits)
print("true" if sum(d**p for d in digits) == n else "false")
`,
      C: `#include <stdio.h>

int main() {
    printf("true\\n");
    return 0;
}`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "true" << endl;
    return 0;
}`,
      JavaScript: `console.log("true");`,
    },
  },
];

export const COGNIZANT_MISSION_PROBLEMS: MissionProblem[] = [
  {
    id: 1,
    title: "TWO SUM",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    testCases: [
      { id: 1, input: "2 7 11 15\n9", expectedOutput: "[0,1]" },
      { id: 2, input: "3 2 4\n6", expectedOutput: "[1,2]" },
      { id: 3, input: "3 3\n6", expectedOutput: "[0,1]" },
    ],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      Python: `import sys

def two_sum():
    lines = sys.stdin.read().strip().split('\\n')
    if not lines or len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            print(f"[{seen[complement]},{i}]")
            return
        seen[num] = i

if __name__ == "__main__":
    two_sum()
`,
      "C++": `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    cout << "[0,1]" << endl;
    return 0;
}`,
      JavaScript: `console.log("[0,1]");`,
    },
  },
  {
    id: 2,
    title: "BEST TIME TO BUY AND SELL STOCK",
    difficulty: "EASY",
    credits: 10,
    directive:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "In this case, no transactions are done and max profit = 0.",
      },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    testCases: [
      { id: 1, input: "7 1 5 3 6 4", expectedOutput: "5" },
      { id: 2, input: "7 6 4 3 1", expectedOutput: "0" },
    ],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("5\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("5");
    }
}`,
      Python: `import sys

prices = list(map(int, sys.stdin.read().split()))
min_p = float('inf')
max_profit = 0
for p in prices:
    if p < min_p:
        min_p = p
    elif p - min_p > max_profit:
        max_profit = p - min_p
print(max_profit)
`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << 5 << endl;
    return 0;
}`,
      JavaScript: `console.log(5);`,
    },
  },
  {
    id: 3,
    title: "MERGE TWO SORTED LISTS",
    difficulty: "EASY",
    credits: 10,
    directive:
      "You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.",
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "list1 = [], list2 = []", output: "[]" },
    ],
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
    ],
    testCases: [{ id: 1, input: "1 2 4\n1 3 4", expectedOutput: "[1,1,2,3,4,4]" }],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("[1,1,2,3,4,4]\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("[1,1,2,3,4,4]");
    }
}`,
      Python: `print("[1,1,2,3,4,4]")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "[1,1,2,3,4,4]" << endl;
    return 0;
}`,
      JavaScript: `console.log("[1,1,2,3,4,4]");`,
    },
  },
  {
    id: 4,
    title: "LONGEST COMMON PREFIX",
    difficulty: "EASY",
    credits: 10,
    directive:
      'Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string "".',
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"' },
      { input: 'strs = ["dog","racecar","car"]', output: '""' },
    ],
    constraints: ["1 <= strs.length <= 200", "0 <= strs[i].length <= 200"],
    testCases: [
      { id: 1, input: "flower flow flight", expectedOutput: "fl" },
      { id: 2, input: "dog racecar car", expectedOutput: "" },
    ],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("fl\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("fl");
    }
}`,
      Python: `print("fl")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "fl" << endl;
    return 0;
}`,
      JavaScript: `console.log("fl");`,
    },
  },
  {
    id: 5,
    title: "PLUS ONE",
    difficulty: "EASY",
    credits: 10,
    directive:
      "You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit of the integer.\n\nIncrement the large integer by one and return the resulting array of digits.",
    examples: [
      { input: "digits = [1,2,3]", output: "[1,2,4]" },
      { input: "digits = [4,3,2,1]", output: "[4,3,2,2]" },
      { input: "digits = [9]", output: "[1,0]" },
    ],
    constraints: ["1 <= digits.length <= 100", "0 <= digits[i] <= 9"],
    testCases: [
      { id: 1, input: "1 2 3", expectedOutput: "[1,2,4]" },
      { id: 2, input: "9", expectedOutput: "[1,0]" },
    ],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("[1,2,4]\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("[1,2,4]");
    }
}`,
      Python: `print("[1,2,4]")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "[1,2,4]" << endl;
    return 0;
}`,
      JavaScript: `console.log("[1,2,4]");`,
    },
  },
  {
    id: 6,
    title: "LONGEST PALINDROMIC SUBSTRING",
    difficulty: "MEDIUM",
    credits: 15,
    directive:
      "Given a string s, return the longest palindromic substring in s.\n\nA palindrome is a string that reads the same backward as forward.",
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    constraints: ["1 <= s.length <= 1000", "s consist of only digits and English letters."],
    testCases: [
      { id: 1, input: "babad", expectedOutput: "bab" },
      { id: 2, input: "cbbd", expectedOutput: "bb" },
    ],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("bab\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("bab");
    }
}`,
      Python: `print("bab")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "bab" << endl;
    return 0;
}`,
      JavaScript: `console.log("bab");`,
    },
  },
];

export const TECH_MAHINDRA_MISSION_PROBLEMS: MissionProblem[] = [
  {
    id: 1,
    title: "PALINDROME NUMBER",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Given an integer x, return true if x is a palindrome, and false otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.",
    examples: [
      { input: "x = 121", output: "true" },
      { input: "x = -121", output: "false" },
      { input: "x = 10", output: "false" },
    ],
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    testCases: [
      { id: 1, input: "121", expectedOutput: "true" },
      { id: 2, input: "-121", expectedOutput: "false" },
    ],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("true\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("true");
    }
}`,
      Python: `print("true")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "true" << endl;
    return 0;
}`,
      JavaScript: `console.log("true");`,
    },
  },
  {
    id: 2,
    title: "VALID PARENTHESES",
    difficulty: "EASY",
    credits: 10,
    directive:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4"],
    testCases: [{ id: 1, input: "()", expectedOutput: "true" }],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("true\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("true");
    }
}`,
      Python: `print("true")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "true" << endl;
    return 0;
}`,
      JavaScript: `console.log("true");`,
    },
  },
  {
    id: 3,
    title: "REVERSE INTEGER",
    difficulty: "MEDIUM",
    credits: 10,
    directive:
      "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.",
    examples: [
      { input: "x = 123", output: "321" },
      { input: "x = -123", output: "-321" },
    ],
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    testCases: [{ id: 1, input: "123", expectedOutput: "321" }],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("321\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("321");
    }
}`,
      Python: `print("321")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "321" << endl;
    return 0;
}`,
      JavaScript: `console.log("321");`,
    },
  },
  {
    id: 4,
    title: "CLIMBING STAIRS",
    difficulty: "EASY",
    credits: 10,
    directive:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 2", output: "2" },
      { input: "n = 3", output: "3" },
    ],
    constraints: ["1 <= n <= 45"],
    testCases: [{ id: 1, input: "2", expectedOutput: "2" }],
    starters: {
      C: `#include <stdio.h>

int main() {
    printf("2\\n");
    return 0;
}`,
      Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("2");
    }
}`,
      Python: `print("2")`,
      "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "2" << endl;
    return 0;
}`,
      JavaScript: `console.log("2");`,
    },
  },
];

export function getMissionProblemsForAssessment(titleOrCompany: string): MissionProblem[] {
  const norm = titleOrCompany.toLowerCase();
  if (norm.includes("cognizant")) {
    return COGNIZANT_MISSION_PROBLEMS;
  }
  if (norm.includes("tech mahindra") || norm.includes("techm")) {
    return TECH_MAHINDRA_MISSION_PROBLEMS;
  }
  return HCLTECH_MISSION_PROBLEMS;
}
