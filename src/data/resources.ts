export type ResourceType = "video" | "exam" | "file";
export type SemesterKey = 1 | 2 | 3;
export type FileCategory = "worksheets" | "cheat";

export interface Resource {
  id: number;
  type: ResourceType;
  title: string;
  url: string;
  description: string;
  semester: SemesterKey;
  unit: number;
  category?: FileCategory | null;
}

export const SEMESTER_TABS: { key: SemesterKey; label: string }[] = [
  { key: 1, label: "الفصل الأول" },
  { key: 2, label: "الفصل الثاني" },
  { key: 3, label: "المكثف" },
];

export const UNITS_BY_SEMESTER: Record<SemesterKey, number[]> = {
  1: [1, 2, 3, 4],
  2: [1, 2, 3, 4, 5],
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

export function unitLabel(unit: number) {
  switch (unit) {
    case 1:
      return "الوحدة الأولى";
    case 2:
      return "الوحدة الثانية";
    case 3:
      return "الوحدة الثالثة";
    case 4:
      return "الوحدة الرابعة";
    case 5:
      return "الوحدة الخامسة";
    case 6:
      return "الوحدة السادسة";
    case 7:
      return "الوحدة السابعة";
    case 8:
      return "الوحدة الثامنة";
    case 9:
      return "الوحدة التاسعة";
    default:
      return `الوحدة ${unit}`;
  }
}
