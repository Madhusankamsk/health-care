import { Breadcrumbs } from "@/components/nav/Breadcrumbs";

type SectionIntroProps = {
  title: string;
  tag?: string;
  tagTone?: "success" | "warning" | "info" | "danger";
};

/** Compact page chrome: breadcrumbs + title. No card or filled panel — blends with app shell. */
export function SectionIntro({ title, tag, tagTone = "info" }: SectionIntroProps) {
  return (
    <header className="border-b border-[var(--border)] pb-2 pt-0 sm:pb-2.5">
      <div className="flex flex-col gap-0.5">
        <Breadcrumbs />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="min-w-0 text-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-xl">
            {title}
          </h1>
          {tag ? <span className={`pill pill-${tagTone}`}>{tag}</span> : null}
        </div>
      </div>
    </header>
  );
}
