/**
 * Replace the (Portuguese) copy on the English `person` entries with the
 * original English source text. The people were first seeded with PT copy under
 * locale "en"; this restores the intended English content.
 *
 * Usage:
 *   npx tsx scripts/update-people-en.ts
 *
 * - Matches entries by (type=person, slug, locale=en), not soft-deleted.
 * - MERGES into the existing `data`, so photoMediaId (and any social links)
 *   attached by other scripts are preserved.
 * - Re-publishes each entry so the public read API + site cache pick it up.
 * - Priyanka Tiku Gupta is intentionally absent — no English source supplied.
 */
// `export {}` marks this file as a module so its top-level consts don't share
// global scope with the other one-off scripts (which would collide under tsc).
export {};

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const LOCALE = "en";

interface PersonUpdate {
  slug: string;
  name: string;
  role: string;
  bio: string; // sanitised HTML (allowlist: p, h3, ul, li, strong, em, ...)
}

const PEOPLE: PersonUpdate[] = [
  {
    slug: "rhea-leckie",
    name: "Rhea Leckie",
    role: "Program Director and CEO of CorporateDNA",
    bio: `
<p>An international thought leader and trusted advisor at the highest levels, Rhea Leckie, 47, is the Founder-CEO of Corporate DNA Consulting, with its European headquarters in London and its APAC offices in Singapore.</p>
<p>With a core team of 62 coaches and facilitators across 16 nationalities, Corporate DNA was a national semi-finalist for the HSBC UK, 2009 Business Awards. In 2008, Rhea was one of six finalists for the Women of the Future Awards, with Cherie Blair's patronage for being a successful entrepreneur in corporate Britain. In 2015, Rhea was a finalist for the British Indian Trade Industries Awards under the Creative Entrepreneur category.</p>
<p>The Corporate DNA offering specialises in Culture Transformation, Leadership development, Talent development, I&D, and Executive coaching. Working deeply with the top 5 of the FTSE 100 clients, Rhea is best known for her authenticity and impact at all levels. Clients include Heineken, Unilever, Goldman Sachs, Morgan Stanley, Aviva, Coca Cola, and Microsoft.</p>
<p>Born in London, and having spent formative years in India, Rhea has worked and lived in 28 countries. Rhea carries diversity in her own DNA – celebrating "difference and being different" across her cross-cultural experiences in the UK, the US, Europe, the Middle East, East Asia, Africa, Japan, and India.</p>
<p>Previously, while at PricewaterhouseCoopers UK, she was appointed one of their youngest directors at 31. Rhea has a consistent track record of working with management boards for over 20 years, including Chairmen, CEOs, HRDs and High Performing Teams.</p>
<p>Rhea is the author of Leadership. It's in your DNA published by Bloomsbury and released in November, 2012 where she reveals the 10 shared leadership ingredients innate in everyone from Chairmen, CEOs and Ministers to maestros in sports, music, medicine, arts to everyday plumbers and chefs. In conversation with Sir George Martin, Producer of the legendary BEATLES, she convinces us through inspiring stories and insights her core belief: "You can do anything if you really want to." She uses the 10 ingredients to structure her keynotes and coaching lessons with great success.</p>
<p>A regular commentator, author and speaker on talent and succession management, leadership, entrepreneurship and women in boards, Rhea has featured in the Wall Street Journal, Management Today, HR Director, The Economist, Telegraph and on the global Advisory Committee for Talent for the Conference Board.</p>
<p>Rhea is an inspirational speaker for the UK and emerging countries. In 2013 Rhea was a distinguished speaker at the Chicago Business School for experienced VPs/Directors while in 2011, Rhea lectured at the London School of Economics to Management students and in 2005 to the Gurukul Scholars in London Business School. In 2008 Rhea was invited by the Government of Malaysia's Ministry of Women to share her "secrets of success" in the corporate world on a platform with their deputy prime minister and 1200 women. Involved in several voluntary and inspirational causes, Rhea was listed as one of 100 inspirational women by the ASHA foundation and featured by the International Women of Excellence in 2005. In 2009, Rhea was invited by the Ministry of Defence, UK to inspire women in London to advance their careers. In 2009, she was part of Cherie Blair's delegation to tap into the entrepreneurial stories of slum dwellers in Mumbai.</p>
<p>Rhea has an MBA, is a neuroscience practitioner and a qualified accredited executive coach with a number of management and leadership certifications from INSEAD, Cranfield and Ashridge. Rhea speaks four languages, considers Italy her home and is married to Philip Leckie, who she shares her love for sports and travel with. Rhea has been living in Singapore since 2013.</p>
`.trim(),
  },
  {
    slug: "guilherme-mendes",
    name: 'Guilherme "G" Mendes',
    role: "CEO Corporate DNA Americas",
    bio: `
<p><strong>Location:</strong> USA</p>
<p><strong>Values:</strong> Accountability · Courage · Integrity · Passion · Faith · Respect · Cooperation · Family</p>
<p><strong>Languages:</strong> English · Portuguese · Spanish</p>
<h3>About Guilherme "G" Mendes</h3>
<p>Guilherme "G" Mendes is CEO of Corporate DNA Americas, leading the firm's expansion across North and Latin America. He brings a rare combination of global executive leadership, commercial sharpness, and transformation depth, built across more than two decades.</p>
<p>He has lived and worked across Latin America, North America, Europe, and Asia, visited more than 75 countries, and led multicultural teams for over 20 years. Operating at the intersection of growth and complexity, he has owned $700M+ P&Ls, turned around underperforming units, built high-impact teams and go-to-market engines across multiple industries.</p>
<p>After years of transforming businesses from the inside, G chose this chapter to expand his impact from one enterprise to many — helping CEOs and leadership teams across the Americas make stronger, more sustainable decisions and build human-centric cultures of trust, accountability, and performance.</p>
<h3>Specialist Areas</h3>
<ul>
<li>CEO, CHRO, board, and senior team advisory</li>
<li>Leadership transformation at the intersection of growth and complexity</li>
<li>P&L turnarounds, go-to-market acceleration, and value creation</li>
<li>Human-centric, high-performance multicultural teams and sustainable decisions</li>
</ul>
<h3>Selected Track Record</h3>
<ul>
<li>P&Ls above $700M</li>
<li>Turnaround at PPG Silicas while protecting key customers and supply</li>
<li>Positive EBITDA turnaround at Tintas Renner / PPG South America after years of losses</li>
<li>Heineken volume doubled in roughly 2.5 years; later led sales capability across 24 Asian markets</li>
<li>8% organic growth on an over-$300M PMI P&L; USA expansion at Axur</li>
</ul>
<h3>Client Experience</h3>
<p>Axur · PPG · Heineken · Philip Morris International · AB InBev · HSBC</p>
`.trim(),
  },
  {
    slug: "mike-jackson",
    name: "Mike Jackson",
    role: "Senior Facilitator & Executive Coach",
    bio: `
<p><strong>Location:</strong> Singapore / UK</p>
<p><strong>Values:</strong> Courage · Passion · Dedication · Integrity · Loyalty · Empathy · Family · Cooperation</p>
<p><strong>Strengths:</strong> Strategic · Empathetic · Positivity · Team-Oriented · Dedicated</p>
<p><strong>Languages:</strong> English</p>
<h3>Client Experience</h3>
<p>Kellanova, Google, Shell, APEXON, Shunkhlai Group, Amplifon, Unilever, JLL, Frasers Property, National University Singapore, Sentosa, Dentsu, BBDO, WPP, Bloomberg, Shopee, Chevron, Publicis, WAH Foundation, Arkki, Merkle</p>
<h3>Specialist Areas</h3>
<ul>
<li>Certified Solutions Focused Executive Coach for Senior Executives, CEO's and Leadership teams</li>
<li>International Coaching Federation Singapore Chapter Ambassador</li>
<li>Lead Advisor and Senior Advisor for ESG's Enterprise Leadership Transformation programme working with over 50 SME CEO's/Owners</li>
<li>Guest lecturer at NUS Business School on Leading Your Transformation programme for MBA students</li>
<li>Ex APAC MD Bloomberg Media, managing all commercial operations, member of Bloomberg's APAC DEI committee</li>
<li>Ex APAC MD MEC/Wavemaker, building and managing sports/content businesses across 12 APAC markets within WPP</li>
<li>Based in Singapore since 2008</li>
<li>Spoken at over 50 conferences worldwide</li>
</ul>
<h3>Skills and Tools</h3>
<ul>
<li>Certified Executive Coach with ICF</li>
<li>MA in Marketing</li>
</ul>
`.trim(),
  },
  {
    slug: "genevieve-james",
    name: "Genevieve James",
    role: "Programme Director",
    bio: `
<p><strong>Location:</strong> Japan</p>
<p><strong>Values:</strong> Courage · Freedom · Health · Knowledge · Justice · Wisdom · Professionalism · Humour</p>
<p><strong>Strengths:</strong> Strategic · Learner · Achiever · Analytical · Responsibility</p>
<p><strong>Languages:</strong> English, French</p>
<h3>Client Experience</h3>
<p>GSK, Kelloggs, Heineken, Schroders, Manulife, PICC, Accenture (Beijing, Melbourne, Manila), BHP, ANZ Bank, Intercontinental Hotels, US Embassy (Philippines), ZALORA, Philip Morris, Coca Cola, Diageo, EnergyAustralia, Transport for London, AON, Nestle Nespresso, Department Human Services (South Australia).</p>
<h3>Specialist Areas</h3>
<ul>
<li>Gallup Certified Strengths Coach, performance consultant and facilitator</li>
<li>Asia focus, European experience, cross-cultural teams</li>
<li>C-level executives, managers, graduates, and corporate team performance focused facilitation and coaching</li>
<li>Developing actionable plans to address business and individual needs</li>
<li>Human Resources Strategy, organisational design, restructuring and development projects for various clients and industries</li>
<li>Process redesign, human performance, strategic and human capital resource expansion</li>
</ul>
<h3>Skills and Tools</h3>
<ul>
<li>Gallup Certified Strengths Coach</li>
<li>Financial Times Non-Executive Director Diploma Hong Kong</li>
<li>Bachelor of Commerce – Monash University Melbourne</li>
<li>Post Graduate Diploma – Human Resources & Industrial Relations University of Melbourne</li>
<li>Alliance Francaise LEVEL 1,2 D.E.L.F (Department of Education in France)</li>
<li>Masters of Business (Human Resources) Scholarship – University College Dublin Ireland</li>
</ul>
`.trim(),
  },
  {
    slug: "jon-paul-pritchard",
    name: "Jon-Paul (JP) Pritchard",
    role: "Senior Facilitator & Coach",
    bio: `
<p><strong>Location:</strong> Singapore</p>
<p><strong>Values:</strong> Empathy · Compassion · Persistence · Accountability · Courage · Integrity · Humour · Creativity</p>
<p><strong>Strengths:</strong> Strategic · Ideation · Futuristic · Positivity · Self-Assurance</p>
<p><strong>Languages:</strong> English</p>
<h3>Client Experience</h3>
<ul>
<li>Executive Experience – Dyson, Cisco, Toll Group</li>
<li>Consulting Experience – Large FMCG, Heineken, Unilever, GSK, Shunkhlai Group, Pharmaceutical, Tech</li>
</ul>
<h3>Specialist Areas</h3>
<ul>
<li>Global Talent Acquisition leader</li>
<li>Background in Behavioural Assessment Design and Leadership Selection</li>
<li>Organisational Talent Strategy</li>
<li>Succession planning and Process Design</li>
<li>Organisational Planning and Design</li>
<li>HR ROI and Finance Planning</li>
<li>Outsourcing</li>
<li>Salary and Benefits strategy planning (behavioural anchors)</li>
<li>Leadership coaching</li>
<li>Inclusion & Diversity</li>
</ul>
<h3>Skills and Tools</h3>
<ul>
<li>Coach – Marshall Goldsmith Stakeholder Centered Coaching</li>
<li>Masters Degree – INSEAD Consulting and Coaching for Change (Clinical Organisational Psychology)</li>
<li>Led teams throughout Asia and Europe</li>
<li>Specialist on Asian Talent Landscape</li>
<li>Behavioural Interviewer</li>
</ul>
`.trim(),
  },
  {
    slug: "phil-paul",
    name: "Phil Paul",
    role: "Senior Facilitator & Coach",
    bio: `
<p><strong>Location:</strong> Singapore</p>
<p><strong>Values:</strong> Family · Health · Fun · Growth · Independence · Creativity · Freedom · Appearance</p>
<p><strong>Languages:</strong> English</p>
<h3>Client Experience</h3>
<p>Shell, Unilever, SingTel, Heineken, Coca Cola, GSK, British Telecom, Taj Group of Hotels. A senior career in the TelCo/IT industry lends an insider lens of the challenges faced by leaders within fast changing, ambitious organisations.</p>
<h3>Specialist Areas</h3>
<ul>
<li>Senior Exec Coaching – CEO, GMs, Directors, Functional VPs</li>
<li>Integrated whole-person coaching for transformational results in all aspects of the executive's inner and outer life</li>
<li>Flex of format to suit client – Walk with coach, Habit Setting, Beliefs work</li>
<li>Leadership Team Facilitation</li>
<li>Everest Marathon, Giro D Italia, Marathon Des Sables</li>
</ul>
<h3>Skills and Tools</h3>
<ul>
<li>Master Performance Coach (ICF certified)</li>
<li>Master Neuro Linguistics Programming</li>
<li>NLP Practitioner, Certified NLP Coach</li>
<li>Hogan Certified: Dark Side Certified focusing on derailment and overdone strengths</li>
<li>SDI Certified: Motivation behind the Behaviors when things are going well, and under pressure</li>
<li>TKI certified: Conflict and Collaboration patterns</li>
<li>Values Based Leadership Practitioner</li>
<li>B.Sc. Engineering and MBA degrees from University of Glasgow (UK)</li>
</ul>
`.trim(),
  },
];

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, profiles } = await import("../db/schema");
  const { updateEntry, publishEntry } = await import("../lib/content/entries");

  const [admin] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")))
    .limit(1);

  if (!admin) {
    console.error("No active admin profile found. Run `npm run seed:admin` first.");
    process.exit(1);
  }
  console.log(`Acting as admin: ${admin.email}\n`);

  let updated = 0;
  let republished = 0;
  let missing = 0;

  for (const p of PEOPLE) {
    const [entry] = await db
      .select()
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "person"),
          eq(contentEntries.slug, p.slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );

    if (!entry) {
      console.error(`✗ ${p.slug} — no en entry found (skipping)`);
      missing++;
      continue;
    }

    const current = entry.data as Record<string, unknown>;
    // Merge: keep photoMediaId, social links, etc.; overwrite the copy.
    const upd = await updateEntry("person", entry.id, {
      data: { ...current, name: p.name, role: p.role, bio: p.bio },
      actorId: admin.id,
    });
    if (!upd.ok) {
      console.error(`✗ ${p.slug} — update failed:`, upd.errors);
      continue;
    }
    updated++;

    // Was published before? re-publish so the public read/cache updates.
    if (entry.status === "published") {
      const pub = await publishEntry("person", entry.id, admin.id);
      if (!pub.ok) {
        console.error(`  updated but re-publish failed ${p.slug}:`, pub.errors);
        continue;
      }
      republished++;
    }
    console.log(`✓ ${p.slug} — updated${entry.status === "published" ? " & re-published" : ""} (${p.name})`);
  }

  console.log(
    `\nSummary: ${updated} updated, ${republished} re-published, ${missing} missing, of ${PEOPLE.length} total.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
