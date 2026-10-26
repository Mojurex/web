import { examList } from "@/lib/admin";
import { LiveRefresh } from "@/components/LiveRefresh";
import Link from "next/link";
import { OpenToggle } from "./OpenToggle";

export default async function AdminHome() {
  const exams = await examList();
  const grades = [...new Set(exams.map((e) => e.grade))];
  return (
    <main>
      <h1 className="text-3xl font-bold">Шалгалтууд</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Шалгалтыг нээгээд кодыг сурагчдад өгнө. Хувилбар А, Б-г зэргэлдээ суусан сурагчдад ээлжлэн өгнө.
      </p>
      <div className="mt-4">
        <LiveRefresh topic="exams" />
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {grades.map((grade) => {
          const variants = exams.filter((e) => e.grade === grade);
          return (
            <section key={grade} className="grid gap-4 rounded-2xl border border-line bg-surface p-5 md:grid-cols-[10rem_1fr]">
              <div>
                <h2 className="text-2xl font-bold">{grade}-р анги</h2>
                <p className="text-sm text-muted">{variants[0].topic}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {variants.map((e) => (
                  <div key={e.id} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/admin/exams/${e.id}`} className="font-semibold text-indigo hover:underline">
                        Хувилбар {e.variant === "A" ? "А" : "Б"}
                      </Link>
                      <OpenToggle examId={e.id} open={e.is_open} />
                    </div>
                    <p className="font-mono text-2xl font-bold tracking-[0.2em]">{e.access_code}</p>
                    <p className="text-sm text-muted">
                      {e.started === 0
                        ? "Одоогоор сурагч ороогүй"
                        : `${e.started} сурагч · ${e.active} өгч байна · ${e.finished} дууссан`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
