import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { ExternalLink, Search } from "lucide-react";
import {
  FileCategory,
  Resource,
  SemesterKey,
  SEMESTER_TABS,
  UNITS_BY_SEMESTER,
  unitLabel,
} from "@/data/resources";

type UnitFilter = "all" | number;
type CategoryFilter = "all" | FileCategory;

export default function Files() {
  const [activeUnit, setActiveUnit] = useState<UnitFilter>("all");
  const [activeSemester, setActiveSemester] = useState<SemesterKey>(1);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load resources", err);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const allowedUnits = UNITS_BY_SEMESTER[activeSemester];
    const q = query.trim().toLowerCase();

    return resources
      .filter((r) => r.type === "file")
      .filter((r) => r.semester === activeSemester)
      .filter((r) =>
        activeUnit === "all" ? true : r.unit === activeUnit
      )
      .filter((r) =>
        activeCategory === "all" ? true : r.category === activeCategory
      )
      .filter((f) => {
        if (!q) return true;
        const t = (f.title ?? "").toLowerCase();
        const d = (f.description ?? "").toLowerCase();
        return t.includes(q) || d.includes(q);
      })
      .filter((r) => allowedUnits.includes(r.unit));
  }, [activeUnit, query, activeSemester, resources, activeCategory]);

  useEffect(() => {
    const allowedUnits = UNITS_BY_SEMESTER[activeSemester];
    if (activeUnit !== "all" && !allowedUnits.includes(activeUnit)) {
      setActiveUnit("all");
    }
  }, [activeSemester, activeUnit]);

  return (
    <div className="min-h-screen bg-background dna-pattern">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4">
            <span className="text-sm font-medium">Study Materials</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Biology <span className="text-gradient">Files</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-2xl">
            Access study materials, summaries, and resources to help you succeed.
          </p>
        </div>

        {/* Controls: Semester Tabs + Unit Tabs + Search */}
        <div className="mb-8 space-y-4">
          {/* Semester Tabs */}
          <div className="flex flex-wrap gap-2">
            {SEMESTER_TABS.map((t) => {
              const isActive = activeSemester === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveSemester(t.key)}
                  className={[
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/30 hover:bg-background/60 border-border",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Unit Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveUnit("all")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                activeUnit === "all"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background/20 hover:bg-background/40 border-border/50",
              ].join(" ")}
            >
              الكل
            </button>
            {UNITS_BY_SEMESTER[activeSemester].map((unit) => {
              const isActive = activeUnit === unit;
              return (
                <button
                  key={unit}
                  onClick={() => setActiveUnit(unit)}
                  className={[
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    isActive
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background/20 hover:bg-background/40 border-border/50",
                  ].join(" ")}
                >
                  {unitLabel(unit)}
                </button>
              );
            })}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                activeCategory === "all"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background/20 hover:bg-background/40 border-border/50",
              ].join(" ")}
            >
              الكل
            </button>
            <button
              onClick={() => setActiveCategory("worksheets")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                activeCategory === "worksheets"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background/20 hover:bg-background/40 border-border/50",
              ].join(" ")}
            >
              أوراق عمل
            </button>
            <button
              onClick={() => setActiveCategory("cheat")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                activeCategory === "cheat"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-background/20 hover:bg-background/40 border-border/50",
              ].join(" ")}
            >
              Cheat Sheet
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن ملف..."
              className="w-full pr-11 pl-4 py-3 rounded-xl bg-background/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-6 rounded-2xl group hover:scale-[1.02] transition-all duration-300 hover:border-primary/30"
            >
              {/* Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl mb-4 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                <span className="text-xs font-semibold tracking-widest text-primary/80">
                  {file.url?.toLowerCase().endsWith(".pdf") ? "PDF" : "FILE"}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {file.title}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {file.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="glass-card p-12 rounded-2xl text-center">
            <h3 className="font-serif text-xl font-bold mb-2">
              لا يوجد نتائج
            </h3>
            <p className="text-muted-foreground">
              جرّب تبدّل التبويب أو غيّر كلمات البحث.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
