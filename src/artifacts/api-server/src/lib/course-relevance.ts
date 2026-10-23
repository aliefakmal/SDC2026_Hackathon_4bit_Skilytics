import type { CourseView } from "./catalog";
import { SKILLS } from "../data/skills";
import { mentions } from "./occupational-skills";

/** A keyword in a technical example must not imply a general workplace course. */
export function teachesSkill(
  title: string,
  skill: { name: string; category: string },
) {
  if (skill.name === "PLC and Industrial Automation")
    return /\bplc\b|scada|industrial|robotics|manufactur|factory|programmable logic/i.test(
      title,
    );
  if (skill.name === "Patient Care")
    return (
      /patient care|nursing|caregiving|caring for/i.test(title) &&
      !/cloud|fabric|data platform|fhir/i.test(title)
    );
  if (skill.name === "ERP Systems")
    return (
      /\berp\b|\bsap\b|netsuite|odoo|dynamics/i.test(title) &&
      !/infrastructure|workloads|migrate|azure/i.test(title)
    );
  if (skill.name === "Microsoft Excel")
    return /\bexcel\b|spreadsheet|pivot table|vlookup|power query/i.test(title);
  if (skill.name === "Office Administration")
    return (
      /office|microsoft 365|\bword\b|outlook|clerical|administrative|document management/i.test(
        title,
      ) &&
      !/fabric|azure|kubernetes|sql server|cloud infrastructure/i.test(title)
    );
  if (skill.category === "Human")
    return (
      mentions(title, skill.name) &&
      !/azure|fabric|copilot|deploy|multi-agent|kubernetes/i.test(title)
    );
  if (skill.category !== "Digital") {
    const aliases = SKILLS.find((s) => s.name === skill.name)?.aliases ?? [];
    return [skill.name, ...aliases].some((alias) => mentions(title, alias));
  }
  return true;
}

export function courseFitsRole(course: CourseView, title: string) {
  if (course.roleScope && !course.roleScope.includes(title)) return false;
  if (/administrative assistant|secretar|office clerk/i.test(title))
    return /office|microsoft 365|excel|spreadsheet|\bword\b|outlook|business communication|time management|customer|bookkeep|administrative|document management/i.test(
      course.title,
    );
  return true;
}
