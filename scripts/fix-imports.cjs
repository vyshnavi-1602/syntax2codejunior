const fs = require("fs");
const path = require("path");
const routesDir = path.join(process.cwd(), "src/routes");

const files = fs
  .readdirSync(routesDir, { withFileTypes: true })
  .filter((f) => f.isFile() && f.name.endsWith(".tsx"))
  .map((f) => path.join(routesDir, f.name));

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  const original = content;

  content = content.replace(
    /from\s+[\"']@\/api\/(student|teacher|admin)[\"']/g,
    'from "@/api/$1.server"',
  );

  if (content !== original) {
    fs.writeFileSync(file, content, "utf-8");
    console.log("Updated " + path.basename(file));
  }
}

// Rename the files
try {
  fs.renameSync(
    path.join(process.cwd(), "src/api/student.ts"),
    path.join(process.cwd(), "src/api/student.server.ts"),
  );
} catch (e) {}
try {
  fs.renameSync(
    path.join(process.cwd(), "src/api/teacher.ts"),
    path.join(process.cwd(), "src/api/teacher.server.ts"),
  );
} catch (e) {}
try {
  fs.renameSync(
    path.join(process.cwd(), "src/api/admin.ts"),
    path.join(process.cwd(), "src/api/admin.server.ts"),
  );
} catch (e) {}
console.log("Renamed API files");
