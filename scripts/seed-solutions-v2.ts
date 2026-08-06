/**
 * Seed the SEVEN outcome-first Solutions (correções-06-08, itens 2/6/7/8).
 *
 * Each solution now LEADS with a business-outcome tagline (problemStatement) and
 * carries the mechanisms/programmes underneath (body). Testimonials that used to
 * sit inline in the body are moved to `proofRefs` (item 8). "CorporateDNA" is
 * normalised to "Corporate DNA" and "5H©" to "5H®" (item 12).
 *
 * Usage:
 *   npx tsx scripts/seed-solutions-v2.ts            # dry-run: prints plan only
 *   npx tsx scripts/seed-solutions-v2.ts --apply    # upsert + publish the 7
 *
 * Idempotent: upsert by (type, slug, locale). NEVER deletes. Obsolete entries
 * (inclusion-diversity, asian-talent-development, leadership-development, and the
 * "teste pt" junk) are only PRINTED as a retire-plan for you to approve — see the
 * end of this file. Nothing is removed automatically.
 *
 * The 2 brand-new propositions whose copy is owned by CDNA (Rhea) — CEO & Top
 * Team Transformation and CHRO / HRLT Effectiveness — ship as clearly-marked
 * STRUCTURE-ONLY placeholders. No claims are invented.
 */
export {};

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const LOCALE = "en";
const APPLY = process.argv.includes("--apply");

interface ProofRef {
  quote: string;
  author: string;
  role: string;
  caseSlug?: string;
}
interface SolutionSeed {
  slug: string;
  title: string;
  problemStatement: string; // outcome-first tagline (HTML)
  body: string; // sanitised HTML — mechanisms underneath
  proofRefs?: ProofRef[];
  pending?: boolean; // true = copy owned by CDNA, structure-only placeholder
}

const PENDING_NOTE =
  '<p><em>Overview pending final copy from CDNA — structure only. No claims below are final.</em></p>';

const SOLUTIONS: SolutionSeed[] = [
  // 1 ────────────────────────────────────────────────────────────────────────
  {
    slug: "ceo-top-team-transformation",
    title: "CEO & Top Team Transformation",
    pending: true,
    problemStatement:
      "<p>Align the top team. Improve decision quality. Accelerate execution.</p>",
    body: `
${PENDING_NOTE}
<p>When the enterprise agenda depends on the people at the very top, the top team itself becomes the highest-leverage place to intervene. We work with CEOs and their leadership teams to turn strategic intent into aligned decisions and faster execution.</p>
<h3>When we're engaged</h3>
<ul>
<li>A new CEO or a reshaped top team that has to perform quickly.</li>
<li>A strategy or transformation that is stalling at the leadership-team level.</li>
<li>Decision-making that is slow, siloed, or unaligned across the top team.</li>
</ul>
<h3>What we deliver</h3>
<ul>
<li>Alignment of the top team around a shared agenda and clear priorities.</li>
<li>Sharper decision quality and faster, more accountable execution.</li>
<li>A top team that models the behaviour the rest of the organisation follows.</li>
</ul>
<p><em>Detailed proposition and evidence to be supplied by CDNA.</em></p>
`.trim(),
  },

  // 2 ────────────────────────────────────────────────────────────────────────
  {
    slug: "executive-coaching",
    title: "Executive Coaching",
    problemStatement:
      "<p>Strengthen judgment and leadership performance when the stakes are highest.</p>",
    body: `
<p>Executive coaching earns its place when the stakes are high — an accelerated transition, an expanded mandate, a blind spot that has started to cost the business. We help senior leaders sharpen judgment, presence and impact when it matters most, working from the leader's own agenda to navigate complexity and produce fast, visible results.</p>
<h3>When we're engaged</h3>
<ul>
<li><strong>Accelerate growth</strong> — target a clear threshold of new behaviours and impact to a point of visible readiness for a promotion, step-up, expansion or lateral move.</li>
<li><strong>Onboard a new or bigger role</strong> — leverage the critical 90–180 day "landing" window when lasting impressions are made and the business and stakeholder nuances have to be grasped.</li>
<li><strong>Unlock trapped potential</strong> — pinpoint the real and perceived interferences that get in the way, then build an action plan with sustainable habits for lasting change.</li>
<li><strong>Make a bigger impact</strong> — executive presence, derailment and career coaching that improves leadership effectiveness, relationships and organisational performance.</li>
<li><strong>Coach the team</strong> — a systems view that factors in the complex organisational context the team operates within.</li>
</ul>
<h3>How we work</h3>
<p>Coaching is client-centric and grounded in the proprietary 5H® lens, building long-term habits rather than short-term fixes. Over a typical 6–12-month journey we form a coaching partnership built on trust, blending complementary techniques (results-focused, psychodynamic, sports-psychology-led, CBT) with behavioural science to meet each leader at their baseline. Our "trusted tripartite" approach aligns coach, coachee and line manager around the same objectives, progress and check-ins.</p>
<p>If executive coaching is what your organisation needs, we offer a confidential, no-obligation "chemistry session" to see whether there is a match between coach and coachee.</p>
`.trim(),
    proofRefs: [
      {
        quote:
          "I see myself like I have never done before — it's like pulling out the last 30 years of my life and rebuilding the puzzle! I have had many ivy league coaches, but the coaching from Corporate DNA was by far the best.",
        author: "Senior VP, Emerging Markets",
        role: "Pharmaceutical Client",
      },
      {
        quote: "Corporate DNA coaching is deeply transformative, intense and so powerful!",
        author: "Group HR Director",
        role: "Financial Services, UK",
      },
    ],
  },

  // 3 ────────────────────────────────────────────────────────────────────────
  {
    slug: "culture-transformation",
    title: "Leadership & Culture Transformation",
    problemStatement:
      "<p>Turn strategic intent into leadership behaviour that moves the business.</p>",
    body: `
<p>Strategy only moves the business when leaders behave differently. We transform culture at the intersection of strategy, performance and organisational health — aligning every layer of leadership so that intent becomes consistent behaviour, and behaviour becomes results.</p>
<h3>When we're engaged</h3>
<ul>
<li>A reorganisation, restructure or merger that needs leaders aligned and invested.</li>
<li>A strategy that depends on new mindsets and ways of working to land.</li>
<li>A team climate — pessimism, silos, false harmony, low trust — that is holding performance back.</li>
</ul>
<h3>What we deliver</h3>
<p>Culture is mindset and behavioural change at scale. Our methodology, the DNA Culture Ecosystem, treats culture as a set of interdependent "markers" that leaders can see and shift — from a winning mindset and agile decision-making to leadership-team maturity, empowerment of the layers below, and an inclusive culture. In practice we:</p>
<ul>
<li>Target the mindset and behaviour changes that release inertia and drive performance, crafting them into a shared vocabulary and a single reference point to track progress.</li>
<li>Treat root causes, not symptoms — reading the signals, stories and cues in how meetings run, feedback is given and conflict is handled.</li>
<li>Call out the "critical moments that matter," where a new behaviour is far more powerful than the old one, so the flywheel of change spins faster.</li>
<li>Extend leadership from a core of titled leaders to empowered minus-1s and minus-2s.</li>
</ul>
<h3>Inclusion &amp; Diversity — an embedded capability</h3>
<p>We take Inclusion &amp; Diversity beyond awareness-building and bias training to a place of bold culture change and performance amplification. Through a twin-track approach — "unbiasing" the organisation while building an inclusive one — I&amp;D becomes a red thread of the leadership agenda rather than a stand-alone initiative, driving real debate, faster execution and stronger engagement.</p>
`.trim(),
    proofRefs: [
      {
        quote:
          "We had our Americas All Hands Leadership meeting this week in NYC. In preparation we used all the tools and learnings from our work with Corporate DNA. The All Hands was an overwhelming success, but the best part is the commentary on the leadership team being so cohesive.",
        author: "Andrew Morawski",
        role: "President and Country Chairman, Vodafone Americas",
      },
      {
        quote:
          "Connecting with concepts like vulnerability on a day-to-day basis has been of great value for me, and I see it reflected in the team. We've clearly started to care and trust each other more.",
        author: "Vaccines Head",
        role: "GSK Mexico",
        caseSlug: "gsk",
      },
    ],
  },

  // 4 ────────────────────────────────────────────────────────────────────────
  {
    slug: "talent-succession",
    title: "Talent & Succession",
    pending: true,
    problemStatement:
      "<p>Build a ready-now leadership pipeline and retain critical talent.</p>",
    body: `
${PENDING_NOTE}
<p>A strategy is only as strong as the pipeline behind it. We help organisations build a ready-now supply of leaders and retain the critical talent the business cannot afford to lose — turning succession from a risk into a source of advantage.</p>
<h3>When we're engaged</h3>
<ul>
<li>Key roles with weak or uncertain succession cover.</li>
<li>Difficulty identifying and accelerating high-potential talent.</li>
<li>Retention pressure on the people who matter most.</li>
</ul>
<h3>What we deliver</h3>
<ul>
<li>A strategically healthy pipeline with ready-to-move successors for critical positions.</li>
<li>A robust way to marry performance with potential for proper talent identification.</li>
<li>Sponsorship and development that keep high-potential talent engaged and retained.</li>
</ul>
<p><em>Global proposition copy to be confirmed by CDNA. Until then the regional specialisation below is the live, honestly-labelled offering.</em></p>
<hr/>
<h3>Asian Talent Development — regional specialisation</h3>
<p>Asia is synonymous with opportunity, and competition for Asian talent and leadership is intensifying. Leadership pipelines in the region are often weak, with real challenges in talent scarcity, retention and attraction. Developing Asian talent at the executive level means holding complexity at scale while honouring what makes each market unique.</p>
<p>Corporate DNA co-creates a fully customised learning journey relevant to the APAC context and personalised to individual competencies, integrating five principles when building an Asian leader:</p>
<ul>
<li><strong>Showing up with authenticity</strong> — without leaning on a "mask to fit in."</li>
<li><strong>Courageous conversations</strong> — clear communication and psychological safety that accelerate value and decision-making.</li>
<li><strong>Multiple pathways for growth</strong> — developing leaders at different inflection points, from the leadership team to the layers below.</li>
<li><strong>Leadership agility</strong> — building globally-ready, purpose-led leaders who break free of edited selves.</li>
<li><strong>Mastering storytelling</strong> — amplifying impact through inspiration and vision.</li>
</ul>
<p>Each journey is customised through adult-learning principles, psychometric analysis, frequent 1:1 and small-group coaching, and intense feedback with key stakeholders — challenging belief systems and past successes so leaders can thrive in a more advanced playing field.</p>
`.trim(),
    proofRefs: [
      {
        quote:
          "There's a heart-centredness in CDNA's work that is so apt for these times, when we need increasingly more authentic leaders in our midst. Two years on, our pilot participants have continued to grow and mature, often referring back to the live exercises as the grounding of their leadership foundations.",
        author: "General Manager, Global Operations",
        role: "Sponsor of Asia Leadership Program, Shell",
        caseSlug: "shell",
      },
    ],
  },

  // 5 ────────────────────────────────────────────────────────────────────────
  {
    slug: "high-performing-teams",
    title: "High-Performing Teams & Manager Impact",
    problemStatement:
      "<p>Enhance team dynamics. Increase execution speed and accountability.</p>",
    body: `
<p>Successful teams do not happen by accident — they are designed. We take a team to its next inflection point, lifting the quality of its dynamics so that decisions get made faster and accountability holds. The power of a highly engaged team is pivotal to performance, especially in a hybrid world.</p>
<h3>When we're engaged</h3>
<ul>
<li>A <strong>new team</strong> that needs a clear purpose, goals and role alignment.</li>
<li>A team whose <strong>climate is low</strong> and needs psychological safety, courage and trust restored.</li>
<li>Teams <strong>making slow or poor decisions</strong>, or holding onto false harmony instead of real debate.</li>
<li><strong>Siloed teams</strong> that fail to collaborate across functions and business units.</li>
<li>A team <strong>ready to mature</strong> — growing leadership capability and empowering each other.</li>
</ul>
<h3>What makes a team genuinely high-performing</h3>
<ul>
<li>A deep, visible sense of purpose the rest of the organisation can feel.</li>
<li>Ecosystems rather than hierarchies, where information and decisions flow.</li>
<li>Stretching targets, complementary styles, and an enviable level of trust.</li>
<li>A two-way contract that allows reciprocal coaching and feedback.</li>
</ul>
<h3>The business outcome</h3>
<p>We move teams from good to great and deliver tangible results through guided leadership journeys — building sustainable habits and creating impact from a renewed source of team energy. Throughout, our facilitators "hold the mirror" so the change starts in the room, not months later.</p>
`.trim(),
    proofRefs: [
      {
        quote:
          "Thank you Rhea and Corporate DNA for all you brought to me personally, and in particular for your partnership with HR and me to truly transform the team. The impact has been profound over the last 1–2 years — this will be my happiest memory and the one I'm most proud of.",
        author: "David Love",
        role: "Executive Vice President, Levi's Asia, Middle East, Africa",
        caseSlug: "levis",
      },
    ],
  },

  // 6 ────────────────────────────────────────────────────────────────────────
  {
    slug: "women-in-leadership",
    title: "Women in Leadership",
    problemStatement:
      "<p>Accelerate progression and strengthen the leadership pipeline.</p>",
    body: `
<p>We help organisations advance women executives as a source of competitive advantage — accelerating progression and strengthening the leadership pipeline through well-crafted development journeys. Our grasp of context, culture and "pipeline issues" lets us push through the infrastructural and interpersonal barriers women face, from unconscious bias to a peer group that shrinks the more senior they become.</p>
<h3>When we're engaged</h3>
<ul>
<li>A deficit of strong women leaders in the pipeline at Manager and Director levels.</li>
<li>Capable, "ready-now" women subconsciously holding themselves back.</li>
<li>A need for powerful partnerships and role models between high-potential women and industry mentors.</li>
<li>Intentional development of Asian women leaders for global roles.</li>
</ul>
<h3>What we address</h3>
<ul>
<li>The "legitimacy gap" and the double standards women are held to.</li>
<li>"Playing big vs playing small," where humility is misread as timidity.</li>
<li>Perfectionism and low risk-taking — converging on self-belief and faster decisions.</li>
<li>Owning a leadership style that does not default to male models of power.</li>
<li>Overcoming imposter syndrome.</li>
</ul>
<h3>How we deliver</h3>
<p>Programmes run as an intensive face-to-face journey or as virtual, bite-sized sessions — integrating modular workshops with individual ROI feedback, tripartite connects with line managers and sponsors, professional coaching in groups and one-to-one, mentoring from industry leaders, and an alumni community for lifelong learning.</p>
`.trim(),
    proofRefs: [
      {
        quote:
          "The best programme I have attended in a professional context. The specific focus on women AND business accelerated my leadership effectiveness. An intense but rewarding programme.",
        author: "Commercial Director",
        role: "Financial Services, UK",
      },
      {
        quote:
          "Now I stand on big stages and receive amazing feedback, and I have this programme to thank for it.",
        author: "Julie Feltham",
        role: "Commercial Risk & Governance Lead, Aviva",
        caseSlug: "aviva",
      },
    ],
  },

  // 7 ────────────────────────────────────────────────────────────────────────
  {
    slug: "chro-hrlt-effectiveness",
    title: "CHRO / HRLT Effectiveness",
    pending: true,
    problemStatement:
      "<p>Increase HR's strategic influence and transformation readiness.</p>",
    body: `
${PENDING_NOTE}
<p>The CHRO and the HR leadership team are increasingly the architects of transformation. We help HR raise its strategic influence and build the readiness to lead change — not just support it.</p>
<h3>When we're engaged</h3>
<ul>
<li>A CHRO or HRLT that needs to shift from operational partner to strategic driver.</li>
<li>An HR function preparing to lead a major transformation or reorganisation.</li>
<li>An HR leadership team that needs to align and raise its own performance.</li>
</ul>
<h3>What we deliver</h3>
<ul>
<li>Greater strategic influence for HR at the top table.</li>
<li>Transformation readiness across the HR leadership team.</li>
<li>An HRLT that models the leadership behaviour it asks of the business.</li>
</ul>
<p><em>Detailed proposition and evidence to be supplied by CDNA.</em></p>
`.trim(),
  },
];

// ── obsolete entries: PRINTED as a plan only, never auto-deleted ──────────────
const RETIRE_PLAN = [
  { slug: "inclusion-diversity", why: "absorbed into Leadership & Culture + Women in Leadership" },
  { slug: "asian-talent-development", why: "folded under Talent & Succession (×2 rows incl. draft)" },
  { slug: "leadership-development", why: "not in the new taxonomy; ×2 rows incl. 'teste pt' junk" },
];

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, profiles } = await import("../db/schema");
  const { createEntry, updateEntry, publishEntry } = await import(
    "../lib/content/entries"
  );

  console.log(APPLY ? "MODE: --apply (will upsert + publish)\n" : "MODE: dry-run (no writes). Pass --apply to write.\n");

  console.log("Planned 7 outcome-first solutions:");
  for (const s of SOLUTIONS) {
    const tag = s.problemStatement.replace(/<[^>]+>/g, "");
    console.log(`  • ${s.slug}${s.pending ? " [PLACEHOLDER — CDNA copy pending]" : ""}`);
    console.log(`      title: ${s.title}`);
    console.log(`      outcome: ${tag}`);
    console.log(`      proofRefs: ${s.proofRefs?.length ?? 0}`);
  }
  console.log("\nRetire-plan (NOT executed — approve separately):");
  for (const r of RETIRE_PLAN) console.log(`  ✗ ${r.slug} — ${r.why}`);

  if (!APPLY) {
    console.log("\nDry-run complete. Review above, then re-run with --apply.");
    process.exit(0);
  }

  const [admin] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")))
    .limit(1);
  if (!admin) {
    console.error("No active admin profile found. Run `npm run seed:admin` first.");
    process.exit(1);
  }
  console.log(`\nAuthoring as admin: ${admin.email}\n`);

  const data = (s: SolutionSeed) => ({
    title: s.title,
    problemStatement: s.problemStatement,
    body: s.body,
    proofRefs: s.proofRefs ?? [],
  });

  let created = 0, updated = 0, published = 0;
  for (const s of SOLUTIONS) {
    const [existing] = await db
      .select({ id: contentEntries.id })
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "solution"),
          eq(contentEntries.slug, s.slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );

    if (existing) {
      const upd = await updateEntry("solution", existing.id, { data: data(s), actorId: admin.id });
      if (!upd.ok) { console.error(`✗ fail  ${s.slug} —`, upd.errors); continue; }
      updated++;
      const pub = await publishEntry("solution", existing.id, admin.id);
      if (!pub.ok) { console.error(`  updated but NOT published ${s.slug}:`, pub.errors); continue; }
      published++;
      console.log(`✓ upd   ${s.slug} — updated & republished`);
    } else {
      const res = await createEntry("solution", { data: data(s), locale: LOCALE, slug: s.slug, actorId: admin.id });
      if (!res.ok) { console.error(`✗ fail  ${s.slug} —`, res.errors); continue; }
      created++;
      const pub = await publishEntry("solution", res.entry.id, admin.id);
      if (!pub.ok) { console.error(`  created but NOT published ${s.slug}:`, pub.errors); continue; }
      published++;
      console.log(`✓ new   ${s.slug} — created & published`);
    }
  }
  console.log(`\nSummary: ${created} created, ${updated} updated, ${published} published, of ${SOLUTIONS.length}.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
