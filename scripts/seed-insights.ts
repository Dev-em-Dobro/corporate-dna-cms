/**
 * Seed a set of sample `insight` entries (title, excerpt, rich-text body, cover
 * image, tags, publish date) and publish each — enough to fill the /insights
 * library grid and give every card a real detail page.
 *
 * Covers reuse images already in the marketing-site repo (solution banners +
 * the 5H methodology shot); they are placeholders for demo content only.
 *
 * Each cover is uploaded through the real media pipeline
 * (validate -> processImage -> uploadToBunny) and attached as `coverMediaId`,
 * exactly like an admin upload. After publishing, the entry's `publishedAt` is
 * back-dated to the chosen date so the cards show varied, realistic dates.
 *
 * Usage:
 *   npx tsx scripts/seed-insights.ts
 *
 * Idempotent: an insight whose slug already exists (and is not soft-deleted) is
 * skipped, so re-running after a partial failure is safe.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const LOCALE = "en";
const PUBLIC_DIR = "E:/projetos/consulting-dna-corporate/public";

interface InsightSeed {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  tags: string[];
  cover: string; // path relative to PUBLIC_DIR
  date: string; // ISO date used for publishedAt (card date)
  body: string; // sanitised HTML
}

const INSIGHTS: InsightSeed[] = [
  {
    slug: "leading-through-ambiguity",
    title: "Leading Through Ambiguity: The New Executive Baseline",
    author: "Rhea Leckie",
    excerpt:
      "Certainty is no longer the leader's operating condition. The executives who thrive learn to make confident calls with incomplete information — and to bring their teams with them.",
    tags: ["Leadership", "Executive Presence"],
    cover: "solutions-banners/Executive Coaching.png",
    date: "2026-05-18",
    body: `
<p>For most of the last century, executive authority rested on a quiet promise: that the person at the top could see further, know more, and therefore decide better. That promise is breaking. Markets reprice overnight, technologies rewrite entire functions in a quarter, and the information a leader needs is either missing, contradictory, or already stale by the time it lands on the desk.</p>
<h2>From certainty to calibrated confidence</h2>
<p>The leaders we coach who navigate this best have made a subtle but decisive shift. They no longer wait for certainty before committing — they make calibrated bets, communicate the reasoning behind them, and build in the feedback loops that let them course-correct fast. Confidence, in other words, has moved from <em>knowing the answer</em> to <em>trusting the process by which the answer will emerge</em>.</p>
<blockquote><p>The job is no longer to remove ambiguity for your team. It is to make ambiguity survivable — and even generative — for them.</p></blockquote>
<h2>Three habits that hold under pressure</h2>
<ul>
<li><strong>Name the unknown out loud.</strong> Teams don't lose trust when a leader admits uncertainty; they lose it when the uncertainty is obvious and the leader pretends otherwise.</li>
<li><strong>Decide in drafts.</strong> Frame decisions as version one, explicitly revisable, so momentum never waits on perfect data.</li>
<li><strong>Protect the reflective hour.</strong> The instinct under pressure is to fill every gap with action. The leaders who compound learning defend time to think.</li>
</ul>
<p>Ambiguity is not a phase to be managed until normality returns. It is the normal. The executives who internalise that — who build the inner habits to stay clear-headed inside the fog — are the ones who will still be leading when the fog lifts.</p>
`.trim(),
  },
  {
    slug: "high-performing-teams-do-not-happen-by-accident",
    title: "High-Performing Teams Don't Happen by Accident",
    author: "Mike Jackson",
    excerpt:
      "Great teams are engineered, not stumbled upon. A look at the distinctive traits that separate a strong team from a genuinely high-performing one.",
    tags: ["Teams", "Performance"],
    cover: "solutions-banners/High Performing Teams.png",
    date: "2026-03-02",
    body: `
<p>Ask any executive what a high-performing team looks like and you'll hear the usual list: talented people, clear goals, good communication. All true — and all insufficient. Plenty of teams have those ingredients and still plateau at "solid." The difference between solid and exceptional is rarely raw talent. It is design.</p>
<h2>What actually distinguishes the top tier</h2>
<p>Across more than a thousand teams we've worked with, the genuinely high-performing ones share traits that don't show up on an org chart:</p>
<ul>
<li>A sense of purpose that the rest of the organisation can <em>feel</em>, not just read on a slide.</li>
<li>Ecosystems of decision-making rather than hierarchies of permission — information flows to where it's needed.</li>
<li>An enviable level of interpersonal trust, which lets the team run <em>toward</em> conflict instead of around it.</li>
<li>Diversity of style and personality that complements rather than collides.</li>
</ul>
<h2>Trust is the multiplier</h2>
<p>If there is a single trait that unlocks the rest, it is trust. Trust is what allows a team to have the real debate instead of the polite one, to surface a bad number early, to disagree hard and still leave the room aligned. Without it, every other strength is discounted.</p>
<blockquote><p>Successful teams do not happen by accident. They are the product of intention, design, and crafted effort applied at exactly the right inflection point.</p></blockquote>
<p>The encouraging news: every one of these traits can be built. The teams that reach the top tier are not luckier — they are more deliberate.</p>
`.trim(),
  },
  {
    slug: "culture-change-starts-in-the-room",
    title: "Culture Change Starts in the Room, Not on the Poster",
    author: "Genevieve James",
    excerpt:
      "You cannot cascade a culture. Real transformation happens in the critical moments that matter — in how meetings are run, feedback is given, and conflict is handled.",
    tags: ["Culture", "Transformation"],
    cover: "solutions-banners/culture-transformation-banner.png",
    date: "2026-01-21",
    body: `
<p>Most culture programmes fail for the same reason: they treat culture as something to be <em>announced</em>. New values, a townhall, a set of laminated behaviours on the wall — and then genuine bewilderment six months later when nothing has changed. Culture is not what a company declares. It is what a company repeatedly does when no one is performing.</p>
<h2>Target the moments that matter</h2>
<p>Behaviour changes at specific, observable inflection points — what we call the critical moments that matter. How is a dissenting view handled in a leadership meeting? What happens when a project slips? Who speaks first, and who is never interrupted? Change the behaviour at those moments and the culture moves. Leave them untouched and no poster will save you.</p>
<h2>Treat the root, not the symptom</h2>
<ul>
<li><strong>Read the signals.</strong> Culture blockers live in stories, cues, and rituals — not in the engagement survey's headline number.</li>
<li><strong>Make the new behaviour more powerful than the old one.</strong> People abandon a habit only when a better one visibly pays off.</li>
<li><strong>Celebrate small wins.</strong> Nothing reinforces a new culture like watching someone model it and succeed.</li>
</ul>
<blockquote><p>Change starts in the room, during the work — not in the launch event that announces it.</p></blockquote>
<p>The leaders who transform culture don't do it by force of message. They do it by changing what happens in the meeting they're in right now.</p>
`.trim(),
  },
  {
    slug: "the-legitimacy-gap-women-in-leadership",
    title: "The Legitimacy Gap: What Holds Women Leaders Back",
    author: "Genevieve James",
    excerpt:
      "Talented women are still held to male versions of leadership — and penalised when they meet them. Closing the gap starts with owning your own leadership style.",
    tags: ["Diversity & Inclusion", "Leadership"],
    cover: "solutions-banners/Women In Leadership.png",
    date: "2025-11-12",
    body: `
<p>There is a particular double bind that surfaces again and again in our work with senior women. Be passionate and you're "emotional." Be determined and you're "feisty." Show the same decisiveness expected of male peers and the very trait that earns them authority earns you a caution. We call it the legitimacy gap — and it is one of the most persistent, least discussed brakes on women's advancement.</p>
<h2>Playing big versus playing small</h2>
<p>The gap has a compounding effect. Under a constant, low-grade scrutiny, humility gets read as timidity and restraint as a lack of ambition. The rational response — play a little smaller, prepare a little more, take a little less risk — is exactly the response that limits reach.</p>
<h2>What actually moves the needle</h2>
<ul>
<li><strong>Own your leadership style.</strong> Effectiveness does not require adopting a borrowed model of power that doesn't fit.</li>
<li><strong>Trade over-preparation for intuition.</strong> The 80/20 rule and faster decisions build the visible self-belief that authority is granted to.</li>
<li><strong>Build sponsorship, not just mentorship.</strong> Pairing with senior sponsors outside your function creates advocates in the rooms you're not in.</li>
</ul>
<blockquote><p>The goal is not to help women lead like men. It is to make organisations legitimate places for women to lead as themselves.</p></blockquote>
<p>Closing the legitimacy gap is not a favour to individuals. It is how organisations stop quietly discarding half of their leadership potential.</p>
`.trim(),
  },
  {
    slug: "asian-talent-is-a-strategic-necessity",
    title: "Asian Talent Is a Strategic Necessity, Not a Nice-to-Have",
    author: "Jon Paul Pritchard",
    excerpt:
      "As the centre of economic gravity shifts east, the competition for Asian leadership is intensifying. Building that pipeline is now a board-level priority.",
    tags: ["Talent", "Asia"],
    cover: "solutions-banners/asian-talent-development.png",
    date: "2025-09-04",
    body: `
<p>For a generation, "opportunity" and "Asia" have been near-synonyms. What has changed is the scarcity of the one asset required to capture that opportunity: leadership. As global companies chase a rising middle class and new customer segments across the region, they are colliding over the same finite pool of ready-to-move Asian talent — and many are losing.</p>
<h2>The pipeline is leakier than it looks</h2>
<p>Five patterns show up repeatedly when we diagnose regional talent systems:</p>
<ul>
<li>A pipeline that is strategically thin — too few leaders genuinely ready for the next role.</li>
<li>Retention pressure, as high-potential talent is courted with aggressive external offers.</li>
<li>Weak systems for marrying performance with potential, so identification is guesswork.</li>
<li>Insufficient sponsorship from senior leaders to actively promote Asian talent.</li>
<li>A generational expectation of faster progression and better balance that legacy models don't meet.</li>
</ul>
<h2>Develop for the context, not the template</h2>
<p>Developing Asian leaders is not about importing a headquarters curriculum. It requires holding complexity at scale while honouring what makes each market distinct — the strengths, interferences, and passions specific to the region and the operating company.</p>
<blockquote><p>Where authentic leaders are needed most, a heart-centred approach to development is not soft. It is strategic.</p></blockquote>
<p>The organisations that treat Asian talent as a board-level priority — not an HR line item — are the ones that will hold their position as the centre of gravity keeps shifting east.</p>
`.trim(),
  },
  {
    slug: "the-5h-lens-head-heart-hunch-hands-habits",
    title: "The 5H Lens: Turning Insight Into Lasting Habit",
    author: "Phil Paul",
    excerpt:
      "Awareness is where most development stops. The 5H approach — Head, Heart, Hunch, Hands and Habits — is built to carry insight all the way into changed behaviour.",
    tags: ["Methodology", "5H"],
    cover: "5H-methodology.jpg",
    date: "2025-07-08",
    body: `
<p>Every leader has had the workshop epiphany — the moment of genuine insight that feels, briefly, like it will change everything. And every leader knows how quickly that insight evaporates back at the desk. The gap between <em>understanding</em> a change and <em>living</em> it is where most development quietly fails.</p>
<h2>Five lenses, one throughline</h2>
<p>The 5H lens exists to close that gap. It works across five interconnected dimensions:</p>
<ul>
<li><strong>Head</strong> — the rational case: what needs to change and why.</li>
<li><strong>Heart</strong> — the emotional commitment that makes change worth the discomfort.</li>
<li><strong>Hunch</strong> — the intuition and instinct that guide judgement when data runs out.</li>
<li><strong>Hands</strong> — deliberate practice, because behaviour changes through repetition, not resolution.</li>
<li><strong>Habits</strong> — the routines that make the new behaviour the default long after the programme ends.</li>
</ul>
<h2>Why habit is the point</h2>
<p>The first four Hs are common to good development. The fifth is where the method earns its keep. By engineering the routines that reinforce a new behaviour, the change survives contact with the calendar — the meetings, the pressures, the pull of the old default.</p>
<blockquote><p>Insight is cheap and abundant. Habit is rare and compounding. Development that ignores the difference doesn't last.</p></blockquote>
<p>Making practical links from everyday decisions to each of the five lenses is what turns a memorable session into a durable change in how a leader actually operates.</p>
`.trim(),
  },
];

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, mediaAssets, profiles } = await import("../db/schema");
  const { validateUpload } = await import("../lib/media/validate");
  const { processImage } = await import("../lib/media/image");
  const { uploadToBunny } = await import("../lib/media/bunny");
  const { createEntry, publishEntry } = await import("../lib/content/entries");

  const [admin] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")))
    .limit(1);
  if (!admin) {
    console.error("No active admin profile found. Run `npm run seed:admin`.");
    process.exit(1);
  }
  console.log(`Acting as admin: ${admin.email}\n`);

  let created = 0;
  let skipped = 0;

  for (const s of INSIGHTS) {
    const [existing] = await db
      .select({ id: contentEntries.id })
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "insight"),
          eq(contentEntries.slug, s.slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );
    if (existing) {
      console.log(`• skip  ${s.slug} — already exists`);
      skipped++;
      continue;
    }

    // --- upload the cover through the real media pipeline ---
    const bytes = new Uint8Array(readFileSync(`${PUBLIC_DIR}/${s.cover}`));
    const mimeType = s.cover.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";
    const check = validateUpload(mimeType, bytes.byteLength);
    if (!check.ok) {
      console.error(`✗ ${s.slug} — cover: ${check.error}`);
      continue;
    }
    const processed = await processImage(bytes, mimeType, mimeType === "image/png" ? "png" : "jpg");
    const bunnyKey = `uploads/${randomUUID()}-${s.slug}.${processed.ext}`;
    const { deliveryUrl, bunnyPath } = await uploadToBunny(
      bunnyKey,
      processed.bytes,
      processed.mimeType,
    );
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        filename: s.cover.split("/").pop()!,
        mimeType: processed.mimeType,
        sizeBytes: processed.bytes.byteLength,
        width: processed.width,
        height: processed.height,
        bunnyPath,
        deliveryUrl,
        altText: `${s.title} cover`,
        uploadedBy: admin.id,
      })
      .returning();

    // --- create + publish the insight ---
    const result = await createEntry("insight", {
      data: {
        title: s.title,
        author: s.author,
        excerpt: s.excerpt,
        body: s.body,
        tags: s.tags,
        coverMediaId: asset.id,
        publishedDate: s.date,
      },
      locale: LOCALE,
      slug: s.slug,
      actorId: admin.id,
    });
    if (!result.ok) {
      console.error(`✗ ${s.slug} — validation:`, result.errors);
      continue;
    }

    const pub = await publishEntry("insight", result.entry.id, admin.id);
    if (!pub.ok) {
      console.error(`  created but NOT published ${s.slug}:`, pub.errors);
      continue;
    }

    // Back-date the envelope publishedAt so the card shows the chosen date.
    await db
      .update(contentEntries)
      .set({ publishedAt: new Date(`${s.date}T09:00:00Z`) })
      .where(eq(contentEntries.id, result.entry.id));

    created++;
    console.log(`✓ new   ${s.slug} — created & published (${s.date})`);
  }

  console.log(
    `\nSummary: ${created} created, ${skipped} skipped, of ${INSIGHTS.length} total.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
