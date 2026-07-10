import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { MapPin, ArrowRight } from "lucide-react";

export const revalidate = 300;

const CATEGORY_STYLES: Record<string, string> = {
  jrf: "bg-[var(--tag-jrf-bg)] text-[var(--tag-jrf)]",
  srf: "bg-[var(--tag-jrf-bg)] text-[var(--tag-jrf)]",
  phd: "bg-[var(--tag-phd-bg)] text-[var(--tag-phd)]",
  industry: "bg-[var(--tag-industry-bg)] text-[var(--tag-industry)]",
  government: "bg-[var(--tag-govt-bg)] text-[var(--tag-govt)]",
  fellowship: "bg-[var(--tag-fellowship-bg)] text-[var(--tag-fellowship)]",
  internship: "bg-[var(--tag-industry-bg)] text-[var(--tag-industry)]",
};

async function getFeatured() {
  try {
    if (!supabaseAdmin) return [];
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("id, title, slug, category, location, created_at, organizations(name)")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false })
      .limit(6);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-content px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-20">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold text-primary">
          Free. No login required. Worldwide.
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
          The world&apos;s semiconductor &amp; VLSI opportunities, <span className="text-primary">in one place</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary sm:text-lg">
          Research fellowships, PhDs, government roles, and industry jobs from DRDO, ISRO, IITs, and top chip companies globally. Plus a free self-paced VLSI academy.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/opportunities" className="w-full rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white transition-all ease-out-quart hover:-translate-y-0.5 hover:bg-primary-hover sm:w-auto">
            Browse Opportunities
          </Link>
          <Link href="/academy" className="w-full rounded-xl border border-border bg-surface px-7 py-3 text-sm font-semibold text-text hover:bg-surface-raised sm:w-auto">
            Start Learning Free
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-content px-4 pb-14 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-4">
          {[
            ["Global", "Coverage"],
            ["110+", "Organizations"],
            ["7", "Learning Tracks"],
            ["Daily", "Fresh Updates"],
          ].map(([num, label]) => (
            <div key={label} className="bg-surface p-6 text-center">
              <div className="tnum text-xl font-extrabold sm:text-2xl">{num}</div>
              <div className="mt-1 text-xs font-medium text-text-tertiary">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-content px-4 pb-14 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Latest Opportunities</h2>
          <Link href="/opportunities" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-text-secondary">
            New opportunities are being verified. Check back shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((opp: any) => {
              const org = Array.isArray(opp.organizations) ? opp.organizations[0] : opp.organizations;
              return (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.slug}`}
                  className="group rounded-xl border border-border bg-surface p-5 transition-all ease-out-quart hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-3 text-xs font-medium text-text-tertiary">{org?.name ?? ""}</div>
                  <h3 className="mb-3 line-clamp-2 font-semibold leading-snug group-hover:text-primary">
                    {opp.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${CATEGORY_STYLES[opp.category] ?? ""}`}>
                      {opp.category}
                    </span>
                    {opp.location && (
                      <span className="flex items-center gap-1 text-xs text-text-tertiary">
                        <MapPin className="h-3 w-3" /> {opp.location}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ACADEMY PREVIEW */}
      <section className="mx-auto max-w-content px-4 pb-14 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">Learn VLSI from zero. Free forever.</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            7 sequential tracks from digital logic to interview prep. Curated free lectures, daily plans, and gated assessments.
          </p>
          <Link href="/academy" className="mt-6 inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
            Explore the Academy <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-content px-4 pb-20 sm:px-6">
        <div className="rounded-2xl bg-primary p-8 text-center text-white sm:p-12">
          <h2 className="text-xl font-bold sm:text-2xl">Never miss an opportunity</h2>
          <p className="mx-auto mt-2 max-w-md text-sm opacity-90">
            Weekly email alerts for new JRF, PhD, and industry roles matching your interests.
          </p>
          <form className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 rounded-lg border-0 bg-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/60 focus:bg-white/20 focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-primary hover:bg-white/90">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
