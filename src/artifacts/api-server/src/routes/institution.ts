import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../lib/auth";
import { loadCourses } from "../lib/catalog";
import {
  compulsoryIds,
  saveCompulsory,
  graduateOutcomes,
  graduateYears,
} from "../lib/institution";
const router = Router();
router.use("/institution", requireRole("tvet"), (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get("/institution/outcomes", (_req, res) =>
  res.json({ ...graduateOutcomes, annual: graduateYears() }),
);
router.get("/institution/compulsory", async (req, res) =>
  res.json({ courseIds: await compulsoryIds(req) }),
);
router.put("/institution/compulsory", async (req, res) => {
  const { courseIds } = z
    .object({
      courseIds: z
        .array(z.number().int())
        .max(10)
        .refine((ids) => new Set(ids).size === ids.length),
    })
    .parse(req.body);
  const courses = await loadCourses(),
    selected = courseIds.map((id) => courses.find((c) => c.id === id));
  if (selected.some((c) => !c)) {
    res.status(400).json({ error: "course_catalogue_unavailable" });
    return;
  }
  if (selected.some((c) => c!.durationHours === null)) {
    res.status(400).json({ error: "compulsory_duration_required" });
    return;
  }
  res.json(
    await saveCompulsory(
      req,
      selected.filter((c): c is NonNullable<typeof c> => !!c),
    ),
  );
});
export default router;
