// Run explicitly after changing public reference mappings. Logs no personal data.
import { pool } from "@workspace/db";
import { ingestOnet } from "./onet";
import { loadRoles, loadCourses, roleToApi } from "./catalog";

try {
  await ingestOnet();
  const [roles, courses] = await Promise.all([loadRoles(), loadCourses()]);
  const coverage = roles.map((role) => {
    const mapped = roleToApi(role, courses);
    return {
      role: role.title,
      source: role.sourceVersion,
      specific: mapped.skills.filter((s) => s.category !== "Human").length,
      withCourses: mapped.skills
        .filter(
          (s) =>
            "courseCount" in s &&
            Number(s.courseCount) > 0 &&
            s.category !== "Human",
        )
        .map((s) => s.name),
    };
  });
  console.log(
    JSON.stringify({ courseCount: courses.length, coverage }, null, 2),
  );
} finally {
  await pool.end();
}
