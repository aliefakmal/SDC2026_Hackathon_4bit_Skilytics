import { seedCatalog } from "../src/lib/seed";
import { ingestOnet } from "../src/lib/onet";
import { loadCourses, loadRoles } from "../src/lib/catalog";
import { selfDirectedRoles } from "../src/lib/self-directed";
import { checkCourseLinks } from "../src/lib/market";
import { pool } from "@workspace/db";

// Reference metadata only: no profile writes and no model requests.
try {
  await seedCatalog();
  await ingestOnet();
  const [roles, courses] = await Promise.all([loadRoles(),loadCourses()]);
  const eligible = selfDirectedRoles(roles,courses);
  await checkCourseLinks();
  console.log(JSON.stringify({referenceRoles:roles.length,eligible:eligible.length,titles:eligible.map(r=>r.title),hubspot:courses.filter(c=>c.provider === "HubSpot Academy").length},null,2));
} finally {
  await pool.end();
}
