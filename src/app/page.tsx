export default function Page() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
          NYDF Assessor — Namibia’s Most Complete Readiness Hub
        </h1>
        <p className="mt-6 text-lg md:text-xl leading-relaxed text-gray-700">
          We prepare youth-led applications to pass first time. Clear criteria,
          document checklists, and guided submission — grounded in policy alignment.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a
            href="#checklist"
            className="inline-flex items-center justify-center rounded-lg border border-gray-900 px-5 py-3 text-base font-medium hover:bg-gray-900 hover:text-white"
          >
            Open the Readiness Checklist
          </a>
          <a
            href="#intake"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-base font-medium text-white hover:opacity-90"
          >
            Start Assessor Intake
          </a>
        </div>
      </section>

      <section id="checklist" className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-semibold">Readiness Checklist (Preview)</h2>
        <ul className="mt-6 list-disc pl-6 space-y-2 text-gray-800">
          <li>Applicant identity & basic eligibility</li>
          <li>Business concept clarity & impact rationale</li>
          <li>Budget & use-of-funds structure</li>
          <li>Supporting docs: IDs, quotes, letters, compliance items</li>
          <li>Submission packaging & timing</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          Full interactive checklist and auto‑scoring coming next.
        </p>
      </section>

      <section id="intake" className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-2xl md:text-3xl font-semibold">Assessor Intake (Stub)</h2>
        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Full Name" className="border rounded-lg px-4 py-3" />
          <input type="email" required placeholder="Email" className="border rounded-lg px-4 py-3" />
          <input placeholder="Phone" className="border rounded-lg px-4 py-3" />
          <input placeholder="Region" className="border rounded-lg px-4 py-3" />
          <textarea placeholder="Brief: your idea / use of funds" className="md:col-span-2 border rounded-lg px-4 py-3 h-28" />
          <button type="button" className="md:col-span-2 rounded-lg bg-gray-900 text-white px-5 py-3 hover:opacity-90">
            Save (non‑functional stub)
          </button>
        </form>
        <p className="mt-3 text-sm text-gray-600">
          Next step: wire this to a permanent backend (Supabase) per the Permanence Rule.
        </p>
      </section>
    </main>
  );
}
