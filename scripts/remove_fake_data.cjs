const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function cleanData() {
  console.log('--- Purging Fake / Mock Student Accounts ---');
  
  // Find all students EXCEPT vyshnavichinna2@gmail.com
  const fakeStudents = await sql`
    SELECT id, name, email 
    FROM "user" 
    WHERE role = 'student' 
      AND email != 'vyshnavichinna2@gmail.com'
  `;

  console.log(`Identified ${fakeStudents.length} fake students to remove.`);
  
  if (fakeStudents.length > 0) {
    const fakeIds = fakeStudents.map(s => s.id);

    console.log('Deleting associated relational records in sequence...');
    
    // 1. Delete reviews for student submissions
    await sql`
      DELETE FROM reviews 
      WHERE submission_id IN (
        SELECT id FROM submissions WHERE student_id = ANY(${fakeIds})
      )
    `;

    // 2. Delete submissions
    await sql`DELETE FROM submissions WHERE student_id = ANY(${fakeIds})`;

    // 3. Delete attendance_records
    await sql`DELETE FROM attendance_records WHERE student_id = ANY(${fakeIds})`;

    // 4. Delete completed_lessons
    await sql`DELETE FROM completed_lessons WHERE student_id = ANY(${fakeIds})`;

    // 5. Delete earned_badges
    await sql`DELETE FROM earned_badges WHERE student_id = ANY(${fakeIds})`;

    // 6. Delete projects
    await sql`DELETE FROM projects WHERE student_id = ANY(${fakeIds})`;

    // 7. Delete student_flags
    await sql`DELETE FROM student_flags WHERE student_id = ANY(${fakeIds})`;

    // 8. Delete student_skill_mastery
    await sql`DELETE FROM student_skill_mastery WHERE student_id = ANY(${fakeIds})`;

    // 9. Delete student_profiles
    await sql`DELETE FROM student_profiles WHERE user_id = ANY(${fakeIds})`;

    // 10. Delete session and account
    await sql`DELETE FROM session WHERE user_id = ANY(${fakeIds})`;
    await sql`DELETE FROM account WHERE user_id = ANY(${fakeIds})`;

    // 11. Delete the user records
    const deletedUsers = await sql`
      DELETE FROM "user" 
      WHERE id = ANY(${fakeIds})
      RETURNING id, name, email
    `;

    console.log(`Successfully removed ${deletedUsers.length} fake student accounts!`);
  }

  // Clean duplicate classes - keep only 3-4 distinct clean classes
  const classes = await sql`SELECT id, name, school_id FROM classes ORDER BY id ASC`;
  console.log(`Current classes: ${classes.length}`);
  
  const seenNames = new Set();
  const classesToDelete = [];

  for (const c of classes) {
    if (seenNames.has(c.name)) {
      classesToDelete.push(c.id);
    } else {
      seenNames.add(c.name);
    }
  }

  if (classesToDelete.length > 0) {
    console.log(`Cleaning ${classesToDelete.length} duplicate class rows...`);
    for (const dupId of classesToDelete) {
      await sql`UPDATE student_profiles SET class_id = NULL WHERE class_id = ${dupId}`;
      await sql`DELETE FROM school_schedules WHERE class_id = ${dupId}`;
      await sql`DELETE FROM assignments WHERE class_id = ${dupId}`;
      await sql`DELETE FROM classes WHERE id = ${dupId}`;
    }
    console.log('Duplicate classes removed.');
  }

  // Check remaining student profiles & users
  const remaining = await sql`SELECT id, name, email, role FROM "user" WHERE role = 'student'`;
  console.log(`\nRemaining students in system (${remaining.length}):`);
  remaining.forEach(r => console.log(` - ${r.name} (${r.email})`));

  const remainingClasses = await sql`SELECT id, name, grade FROM classes`;
  console.log(`\nRemaining classes (${remainingClasses.length}):`);
  remainingClasses.forEach(c => console.log(` - [${c.id}] ${c.name}`));

  await sql.end();
  console.log('\n--- Cleanup Finished Successfully! ---');
}

cleanData().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
