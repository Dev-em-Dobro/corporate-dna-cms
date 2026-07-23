/**
 * Seed the CorporateDNA team into the `person` collection and publish each one.
 *
 * Usage:
 *   npm run seed:people          # (add the script to package.json) or:
 *   npx tsx scripts/seed-people.ts
 *
 * Idempotent: an entry whose (type, slug, locale) already exists (and is not
 * soft-deleted) is skipped, so re-running after a partial failure is safe.
 *
 * Content is stored under locale "en" (the CMS default locale) exactly as
 * supplied — the source copy is Portuguese; translating it is a separate task.
 */
// `export {}` marks this file as a module so its top-level consts/functions
// don't share global scope with the other one-off scripts (tsc would otherwise
// flag duplicate declarations like `main`).
export {};

// Load .env.local before importing anything that reads DATABASE_URL. Static
// imports are hoisted, so ../db and the content services are imported
// dynamically inside main() (same reason as scripts/seed-admin.ts).
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const LOCALE = "en";

interface PersonSeed {
  slug: string;
  name: string;
  role: string;
  bio: string; // sanitised HTML (allowlist: p, h3, ul, li, strong, em, ...)
}

const PEOPLE: PersonSeed[] = [
  {
    slug: "rhea-leckie",
    name: "Rhea Leckie",
    role: "Program Director & CEO da CorporateDNA",
    bio: `
<p>Rhea Leckie, 47, é a Fundadora-CEO da CorporateDNA Consulting, com sede europeia em Londres e sede APAC em Singapura. Líder de pensamento internacional em liderança, cultura, inclusão e equipes de alta performance, atua como conselheira de confiança para uma clientela de alto nível (Goldman Sachs, Vodafone, Heineken, Coca Cola e outros). A CorporateDNA foi semifinalista nacional no HSBC UK Business Awards 2009. Em 2008, Rhea foi uma das seis finalistas do Women of the Future Awards, com patrocínio de Cherie Blair, por ser uma empreendedora de sucesso na Grã-Bretanha corporativa. Em 2015, foi finalista do British Indian Trade Industries Awards na categoria Creative Entrepreneur. É também autora publicada do bestseller Leadership, It's in your DNA (Bloomsbury, 2012).</p>
<p>Nascida em Londres e tendo passado anos formativos na Índia, Rhea viveu e trabalhou em mais de 28 países ao longo de sua carreira. Carrega a diversidade em seu próprio DNA, celebrando "a diferença e ser diferente" através de suas experiências multiculturais no Reino Unido, EUA, Europa, Oriente Médio, Leste Asiático, África, Japão e Índia. Enquanto estava na PricewaterhouseCoopers UK, foi nomeada uma das diretoras mais jovens da empresa aos 31 anos. Tem um histórico consistente de trabalho com conselhos de administração por mais de 20 anos, incluindo Presidentes, CEOs, HRDs e equipes de alta performance.</p>
<p>Com uma equipe central de 62 coaches e facilitadores de 16 nacionalidades, a CorporateDNA se especializa em Transformação de Cultura, Desenvolvimento de Liderança, Desenvolvimento de Talentos, I&D e Coaching Executivo. Trabalha profundamente com os top 5 do FTSE 100. Clientes incluem Heineken, Unilever, Goldman Sachs, Morgan Stanley, Aviva, Coca Cola e Microsoft.</p>
<p>É autora de Leadership. It's in your DNA, publicado pela Bloomsbury e lançado em novembro de 2012, onde revela os 10 ingredientes de liderança compartilhados e inatos em todos, de Presidentes, CEOs e Ministros a maestros no esporte, música, medicina e artes. Em conversa com Sir George Martin, produtor lendário dos BEATLES, convence através de histórias inspiradoras: "Você pode fazer qualquer coisa se realmente quiser."</p>
<p>Comentarista, autora e palestrante regular sobre gestão de talentos e sucessão, liderança, empreendedorismo e mulheres em conselhos, Rhea foi destaque no Wall Street Journal, Management Today, HR Director, The Economist, Telegraph e no Comitê Consultivo Global de Talentos do Conference Board.</p>
<p>Palestrante inspiracional para o Reino Unido e países emergentes. Em 2013, foi palestrante distinção na Chicago Business School para VPs/Diretores experientes. Em 2011, ministrou aula na London School of Economics para estudantes de Gestão e em 2005 para os Gurukul Scholars na London Business School. Em 2008, foi convidada pelo Ministério das Mulheres da Malásia para compartilhar seus "segredos de sucesso" no mundo corporativo numa plataforma com o vice-primeiro-ministro e 1200 mulheres. Foi listada como uma das 100 mulheres inspiradoras pela Fundação ASHA e destacada pela International Women of Excellence em 2005. Em 2009, foi convidada pelo Ministério da Defesa do Reino Unido para inspirar mulheres em Londres. Nesse mesmo ano, integrou a delegação de Cherie Blair para explorar as histórias empreendedoras de moradores de favelas em Mumbai.</p>
<p>Tem MBA, é praticante de neurociência e coach executiva credenciada com diversas certificações de gestão e liderança pelo INSEAD, Cranfield e Ashridge. Fala quatro idiomas, considera a Itália sua casa e é casada com Philip Leckie. Vive em Singapura desde 2013.</p>
`.trim(),
  },
  {
    slug: "genevieve-james",
    name: "Genevieve James",
    role: "Programme Director",
    bio: `
<p><strong>Localização:</strong> Japão</p>
<p><strong>Valores:</strong> Courage · Freedom · Health · Knowledge · Justice · Wisdom · Professionalism · Humour</p>
<p><strong>Pontos Fortes:</strong> Strategic · Learner · Achiever · Analytical · Responsibility</p>
<p><strong>Idiomas:</strong> Inglês, Francês</p>
<h3>Experiência com Clientes</h3>
<p>GSK, Kelloggs, Heineken, Schroders, Manulife, PICC, Accenture (Beijing, Melbourne, Manila), BHP, ANZ Bank, Intercontinental Hotels, US Embassy (Philippines), ZALORA, Philip Morris, Coca Cola, Diageo, EnergyAustralia, Transport for London, AON, Nestle Nespresso, Department Human Services (South Australia).</p>
<h3>Áreas Especialistas</h3>
<ul>
<li>Gallup Certified Strengths Coach, consultora de performance e facilitadora</li>
<li>Foco em Ásia, experiência europeia, equipes multiculturais</li>
<li>Facilitação e coaching focados em performance para executivos C-level, gestores, graduados e equipes corporativas</li>
<li>Desenvolvimento de planos de ação para necessidades empresariais e individuais</li>
<li>Estratégia de Recursos Humanos, design organizacional, reestruturação e projetos de desenvolvimento para vários clientes e indústrias</li>
<li>Redesenho de processos, performance humana, expansão estratégica e de capital humano</li>
</ul>
<h3>Habilidades e Ferramentas</h3>
<ul>
<li>Gallup Certified Strengths Coach</li>
<li>Financial Times Non-Executive Director Diploma Hong Kong</li>
<li>Bachelor of Commerce – Monash University Melbourne</li>
<li>Post Graduate Diploma – Human Resources & Industrial Relations, University of Melbourne</li>
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
<p><strong>Localização:</strong> Singapura</p>
<p><strong>Valores:</strong> Empathy · Compassion · Persistence · Accountability · Courage · Integrity · Humour · Creativity</p>
<p><strong>Pontos Fortes:</strong> Strategic · Ideation · Futuristic · Positivity · Self-Assurance</p>
<p><strong>Idiomas:</strong> Inglês</p>
<h3>Experiência com Clientes</h3>
<ul>
<li>Experiência Executiva – Dyson, Cisco, Toll Group</li>
<li>Experiência em Consultoria – Large FMCG, Heineken, Unilever, GSK, Shunkhlai Group, Pharmaceutical, Tech</li>
</ul>
<h3>Áreas Especialistas</h3>
<ul>
<li>Global Talent Acquisition leader</li>
<li>Background em Behavioural Assessment Design e Leadership Selection</li>
<li>Organisational Talent Strategy</li>
<li>Planejamento de sucessão e Design de Processos</li>
<li>Planejamento e Design Organizacional</li>
<li>HR ROI e Planejamento Financeiro</li>
<li>Outsourcing</li>
<li>Planejamento de estratégia de salários e benefícios (behavioral anchors)</li>
<li>Leadership coaching</li>
<li>Inclusion & Diversity</li>
</ul>
<h3>Habilidades e Ferramentas</h3>
<ul>
<li>Coach – Marshall Goldsmith Stakeholder Centered Coaching</li>
<li>Masters Degree – INSEAD Consulting and Coaching for Change (Clinical Organisational Psychology)</li>
<li>Liderou equipes por toda a Ásia e Europa</li>
<li>Especialista no Asian Talent Landscape</li>
<li>Behavioural Interviewer</li>
</ul>
`.trim(),
  },
  {
    slug: "phil-paul",
    name: "Phil Paul",
    role: "Senior Facilitator & Coach",
    bio: `
<p><strong>Localização:</strong> Singapura</p>
<p><strong>Valores:</strong> Family · Health · Fun · Growth · Independence · Creativity · Freedom · Appearance</p>
<p><strong>Idiomas:</strong> Inglês</p>
<h3>Experiência com Clientes</h3>
<p>Shell, Unilever, SingTel, Heineken, Coca Cola, GSK, British Telecom, Taj Group of Hotels. Carreira sênior na indústria TelCo/IT que oferece uma perspectiva interna dos desafios enfrentados por líderes dentro de organizações ambiciosas em rápida mudança.</p>
<h3>Áreas Especialistas</h3>
<ul>
<li>Senior Exec Coaching – CEO, GMs, Directors, Functional VPs</li>
<li>Coaching integral whole-person para resultados transformacionais em todos os aspectos da vida interior e exterior do executivo</li>
<li>Flexibilidade de formato para adequar ao cliente – Walk with coach, Habit Setting, Beliefs work</li>
<li>Leadership Team Facilitation</li>
<li>Everest Marathon, Giro D Italia, Marathon Des Sables</li>
</ul>
<h3>Habilidades e Ferramentas</h3>
<ul>
<li>Master Performance Coach (ICF certified)</li>
<li>Master Neuro Linguistics Programming</li>
<li>NLP Practitioner, Certified NLP Coach</li>
<li>Hogan Certified: Dark Side Certified focusing on derailment and overdone strengths</li>
<li>SDI Certified: Motivation behind the Behaviors when things are going well, and under pressure</li>
<li>TKI certified: Conflict and Collaboration patterns</li>
<li>Values Based Leadership Practitioner</li>
<li>B.Sc. Engineering e MBA degrees from University of Glasgow (UK)</li>
</ul>
`.trim(),
  },
  {
    slug: "mike-jackson",
    name: "Mike Jackson",
    role: "Senior Facilitator & Executive Coach",
    bio: `
<p><strong>Localização:</strong> Singapura / Reino Unido</p>
<p><strong>Valores:</strong> Courage · Passion · Dedication · Integrity · Loyalty · Empathy · Family · Cooperation</p>
<p><strong>Pontos Fortes:</strong> Strategic · Empathetic · Positivity · Team-Oriented · Dedicated</p>
<p><strong>Idiomas:</strong> Inglês</p>
<h3>Experiência com Clientes</h3>
<p>Kellanova, Google, Shell, APEXON, Shunkhlai Group, Amplifon, Unilever, JLL, Frasers Property, National University Singapore, Sentosa, Dentsu, BBDO, WPP, Bloomberg, Shopee, Chevron, Publicis, WAH Foundation, Arkki, Merkle.</p>
<h3>Áreas Especialistas</h3>
<ul>
<li>Certified Solutions Focused Executive Coach para Senior Executives, CEOs e Leadership teams</li>
<li>International Coaching Federation Singapore Chapter Ambassador</li>
<li>Lead Advisor e Senior Advisor para o programa ESG's Enterprise Leadership Transformation trabalhando com mais de 50 CEOs/Proprietários de PMEs</li>
<li>Guest lecturer na NUS Business School no programa Leading Your Transformation para estudantes de MBA</li>
<li>Ex APAC MD Bloomberg Media, gerenciando todas as operações comerciais, membro do Comitê APAC DEI da Bloomberg</li>
<li>Ex APAC MD MEC/Wavemaker, construindo e gerenciando negócios de esportes/conteúdo em 12 mercados APAC dentro do WPP</li>
<li>Baseado em Singapura desde 2008</li>
<li>Palestrante em mais de 50 conferências mundialmente</li>
</ul>
<h3>Habilidades e Ferramentas</h3>
<ul>
<li>Certified Executive Coach com ICF</li>
<li>MA in Marketing</li>
</ul>
`.trim(),
  },
  {
    slug: "priyanka-tiku-gupta",
    name: "Priyanka Tiku Gupta",
    role: "Executive Coach & Transformational Leadership Facilitator",
    bio: `
<p><strong>Localização:</strong> Singapura / Dubai</p>
<p><strong>Valores:</strong> Integrity · Courage · Growth · Empathy · Health · Family · Wealth · Humor</p>
<p><strong>Pontos Fortes:</strong> Connectedness · Relator · Activator · Positivity · Strategic</p>
<p><strong>Idiomas:</strong> Inglês · Hindi</p>
<h3>Experiência com Clientes</h3>
<p>MediaCom, Shell, GSK, Sony, Allianz, TWE, Bayer, MetLife, Akzo Nobel, NTUC, Prudential, Asia Partners, Credit Suisse, Lego, LinkedIn, Samsung, Electrolux, Euro RSCG.</p>
<h3>Áreas Especialistas</h3>
<ul>
<li>Certified Executive & Leadership Coach (ICF)</li>
<li>Certified Breakthrough Transformational Leadership Coaching (NLP)</li>
<li>Certified Neuro Linguistic Programming (NLP) Facilitator</li>
<li>Global Media & Marketing Account Leadership & Management</li>
<li>Strategic Growth & Market Expansion</li>
<li>Reconhecida como Top 7% do GroupM Talent (APAC)</li>
<li>Vencedora de 7 prêmios Globais, 10 APAC & Singapore Media Awards</li>
<li>Juíza em Media Festivals (APAC e Global)</li>
<li>Best Regional Leader for High Performing Teams @GroupM</li>
<li>APAC Regional Training Champion @GroupM</li>
<li>1 de 2 DEI Champions @GroupM</li>
<li>Top Voice LinkedIn Exec Coaching (Em breve!)</li>
</ul>
<h3>Habilidades e Ferramentas</h3>
<ul>
<li>Executive & Transformational Leadership Coach (ICF & NLP)</li>
<li>WPP Maestro Leadership Program</li>
<li>WPP Walk the Talk Program Women's Leadership Program</li>
<li>EFT Practitioner</li>
<li>Resilience Trainer (HeartMath)</li>
<li>NLP Facilitator</li>
<li>Laughter Yoga Leader</li>
<li>Energy Flow Practitioner</li>
<li>Reiki Level 2 Practitioner</li>
<li>Timeline Technology Practitioner</li>
<li>Hypnosis Practitioner</li>
<li>Silva Mind Method & Ultra Silva Graduate</li>
</ul>
`.trim(),
  },
  {
    slug: "guilherme-mendes",
    name: 'Guilherme "G" Mendes',
    role: "CEO Corporate DNA Americas",
    bio: `
<p><strong>Localização:</strong> USA</p>
<p><strong>Valores:</strong> Accountability · Courage · Integrity · Passion · Faith · Respect · Cooperation · Family</p>
<p><strong>Idiomas:</strong> Inglês · Português · Espanhol</p>
<h3>Sobre Guilherme "G" Mendes</h3>
<p>Guilherme "G" Mendes é CEO da Corporate DNA Americas, liderando a expansão da empresa pela América do Norte e Latina. Traz uma combinação rara de liderança executiva global, acuidade comercial e profundidade em transformação, construída ao longo de mais de duas décadas.</p>
<p>Viveu e trabalhou na América Latina, América do Norte, Europa e Ásia, visitou mais de 75 países e liderou equipes multiculturais por mais de 20 anos. Atuando na interseção entre crescimento e complexidade, gerenciou P&Ls acima de US$700M, reverteu unidades de baixa performance, construiu equipes de alto impacto e motores de go-to-market em múltiplas indústrias.</p>
<p>Após anos transformando negócios por dentro, G escolheu este capítulo para expandir seu impacto de uma empresa para muitas — ajudando CEOs e equipes de liderança nas Américas a tomar decisões mais fortes e sustentáveis e a construir culturas human-centric de confiança, responsabilidade e performance.</p>
<h3>Áreas Especialistas</h3>
<ul>
<li>Assessoria para CEO, CHRO, board e equipes sênior</li>
<li>Transformação de liderança na interseção entre crescimento e complexidade</li>
<li>Turnarounds de P&L, aceleração de go-to-market e criação de valor</li>
<li>Equipes multiculturais human-centric de alta performance e decisões sustentáveis</li>
</ul>
<h3>Histórico Selecionado</h3>
<ul>
<li>P&Ls acima de US$700M</li>
<li>Turnaround na PPG Silicas protegendo clientes-chave e suprimento</li>
<li>Turnaround positivo de EBITDA na Tintas Renner/PPG América do Sul após anos de prejuízos</li>
<li>Volume da Heineken dobrado em aproximadamente 2,5 anos; posteriormente liderou capacidade de vendas em 24 mercados asiáticos</li>
<li>8% de crescimento orgânico em P&L de mais de US$300M na PMI; expansão nos EUA na Axur</li>
</ul>
<h3>Experiência com Clientes</h3>
<p>Axur · PPG · Heineken · Philip Morris International · AB InBev · HSBC</p>
`.trim(),
  },
];

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, profiles } = await import("../db/schema");
  const { createEntry, publishEntry } = await import("../lib/content/entries");

  // Author: the first active admin profile (created_by/updated_by is required).
  const [admin] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")))
    .limit(1);

  if (!admin) {
    console.error(
      "No active admin profile found. Run `npm run seed:admin` first.",
    );
    process.exit(1);
  }
  console.log(`Authoring as admin: ${admin.email}\n`);

  let created = 0;
  let published = 0;
  let skipped = 0;

  for (const p of PEOPLE) {
    // Idempotency: skip if this (type, slug, locale) already exists.
    const [existing] = await db
      .select({ id: contentEntries.id, status: contentEntries.status })
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "person"),
          eq(contentEntries.slug, p.slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );

    if (existing) {
      console.log(`• skip  ${p.slug} — already exists (${existing.status})`);
      skipped++;
      continue;
    }

    const result = await createEntry("person", {
      data: { name: p.name, role: p.role, bio: p.bio },
      locale: LOCALE,
      slug: p.slug,
      actorId: admin.id,
    });

    if (!result.ok) {
      console.error(`✗ fail  ${p.slug} — validation:`, result.errors);
      continue;
    }
    created++;

    const pub = await publishEntry("person", result.entry.id, admin.id);
    if (!pub.ok) {
      console.error(`  created but NOT published ${p.slug}:`, pub.errors);
      continue;
    }
    published++;
    console.log(`✓ done  ${p.slug} — created & published (${p.name})`);
  }

  console.log(
    `\nSummary: ${created} created, ${published} published, ${skipped} skipped, of ${PEOPLE.length} total.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
