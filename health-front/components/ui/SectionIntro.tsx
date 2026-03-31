import { Breadcrumbs } from "@/components/nav/Breadcrumbs";

type SectionIntroProps = {
  title: string;
  tag?: string;
  tagTone?: "success" | "warning" | "info" | "danger";
};

export function SectionIntro({ title, tag, tagTone = "info" }: SectionIntroProps) {
  return (
    <div className="page-section px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-2">
        <Breadcrumbs />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="min-w-0 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {title}
          </h1>
          {tag ? <span className={`pill pill-${tagTone}`}>{tag}</span> : null}
        </div>
      </div>
    </div>
  );
}
