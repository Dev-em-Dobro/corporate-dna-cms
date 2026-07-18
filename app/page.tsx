export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-brand)]">
        Corporate DNA
      </p>
      <h1 className="mt-2 text-3xl font-bold text-[var(--color-ink)]">
        Custom CMS — skeleton
      </h1>
      <p className="mt-4 text-[var(--color-muted)]">
        Standalone headless CMS, separate from the marketing site. Admin UI lives under{" "}
        <code>app/(admin)</code>, the published read API under <code>app/api/content</code>,
        and the authoring API under <code>app/api/admin</code>.
      </p>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        See <code>specs/001-custom-cms/</code> in the site repo for the spec, plan, data model,
        contracts and tasks. Implementation follows <code>tasks.md</code> (T003 onward).
      </p>
    </main>
  );
}
