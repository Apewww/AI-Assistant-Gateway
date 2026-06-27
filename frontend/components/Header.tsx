"use client";

export default function Header({
  name,
  onToggleSidebar,
}: {
  name: string;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-bg-primary px-4 py-3">
      <button
        onClick={onToggleSidebar}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <h1 className="truncate text-sm font-medium text-text-primary">{name}</h1>
    </header>
  );
}
