"use client";

export default function Header({
  name,
  onToggleSidebar,
}: {
  name: string;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border-soft bg-bg-primary px-6 py-3.5">
      <button
        onClick={onToggleSidebar}
        className="hidden max-lg:flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary"
        aria-label="Toggle sidebar"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <h1 className="truncate text-sm font-semibold text-text-primary">{name}</h1>
    </header>
  );
}
