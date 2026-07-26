/**
 * Seed the CorporateDNA client stories into the `case` collection and publish.
 *
 * Usage:
 *   npx tsx scripts/seed-cases.ts
 *
 * Upsert by (type, slug, locale): a missing entry is created & published; an
 * existing one is updated to the full content & republished (so pre-existing
 * stubs get filled in). Re-running is safe.
 *
 * Source: the scraped case pages under /cases. Field mapping:
 *   title        -> client name
 *   quote        -> the primary client-leader pull quote (plain text)
 *   quoter       -> that quote's attribution (name, role, company)
 *   introduction -> the "At A Glance" figures (when present) + "Client Challenge"
 *   text         -> "CorporateDNA Solution" + "Results" + secondary testimonials
 *   tags         -> service lines + industry
 * mutedVideoUrl / youtube / brandColor / logoMediaId are left unset (no media
 * in the source). Content is stored verbatim under locale "en" (CMS default).
 */
export {};

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const LOCALE = "en";

interface CaseSeed {
  slug: string;
  title: string;
  quote: string; // plain text
  quoter: string; // plain text
  tags: string[];
  introduction: string; // sanitised HTML
  text: string; // sanitised HTML
}

const CASES: CaseSeed[] = [
  {
    slug: "levis",
    title: "Levi Strauss & Co.",
    quote:
      "We continue to embrace disruption, which could be the best stimulus for transformation. Change is usually hard but in a moment of crisis, it is a given. This crisis also gives us unique opportunities to take moves which in normal times could have been impossible.",
    quoter: "Amy Yang, Managing Director of Greater China, Levi Strauss & Co.",
    tags: ["Culture Transformation", "Leadership Development", "Executive Coaching", "Retail"],
    introduction: `
<p>As a 168-year-old legacy brand in the retail industry, Levi has survived and thrived through adversity through resilient, agile, creative, and spirited leadership, and there was a need to cascade and reinvigorate these values into new markets during a time of growth and acute crisis. In 2019, Levi Strauss' global leadership team built the first Beacon Flagship store in Wuhan, China. In the face of a rising global pandemic and the extraordinary challenges that come with it, this also meant that mental fitness and organizational health were imperative to sustaining growth and emerging stronger.</p>
`.trim(),
    text: `
<h2>CorporateDNA Solution</h2>
<p>Levi Strauss & Co. appointed CorporateDNA to deliver an intense and intimately engaged leadership development and executive coaching programme across 2018-2020. The burning platform was in integrating a reconfigured Greater China LT under the leadership of a new MD, building trust and collaboration while unlearning siloed and pressure-based ways of working, fighting through a fragmented and "split" team culture, and navigating uncertainties with courage and care.</p>
<p>Concurrently, Levi Strauss China also suffered from a reputation as a 'dark market,' rather than a winning team. Despite the leadership team's keen development of strategy, there was an even greater need to build resilience, courage, trust, and credibility in the leadership team, to unleash the growth of the market.</p>
<p>In partnership, CorporateDNA was deeply involved in activating inclusive, collaborative, and trust-centric behaviours that were much needed for the Greater China LT, to breathe strategy and execution to life through motivation and trust, and managing interferences such as limiting beliefs and egos. Fundamentally, CorporateDNA helped them define what winning would look like and what it would take, and broke it down into tangible ways of 'just doing it'.</p>
<h2>Results</h2>
<p>As a result, 36 leaders in the China leadership team were able to directly apply their learnings from the program and saw increased performance and motivation in their team members. CorporateDNA acted as allies and coaches through this personal and organizational development journey, where these leaders were inspired to be catalysts in shaping organizational culture and behaviours:</p>
<ul><li>A team that possesses the readiness and credibility to successfully deliver large-scale growth in the China market, multiple times.</li><li>A renewed reputation as a Winning Team, and recognition in global leadership and by the CEO of Levi Strauss for their deep and committed transformation.</li><li>A sustainable and psychologically safe working relationship in the team, fuelled by connection, motivation, and based on what each leader values the most.</li><li>Clear alignment of organizational values and mindsets, that opened hearts and built self-awareness, for breakthrough performance during a crisis.</li><li>A sense of a strengthened inner self in each leader, with resilient business mindsets that put the organization first.</li><li>The agility and confidence to bring a positive spin to adversity and frustrations; to fail forward so that a legacy can be built upon challenges faced today.</li><li>A 'dream team' and winning culture for the Levi Strauss China leadership team.</li></ul>
<blockquote><p>It was a series of great sessions filled with "Super-Charge". It was awesome the way you lead this, and I thoroughly enjoyed it. I'm confident you will both challenge and develop us, and we will be all the stronger for it. Not all of it is comfortable but it is what we need!</p><p>— Greater China LT, Levi Strauss & Co.</p></blockquote>
`.trim(),
  },
  {
    slug: "shell",
    title: "Shell",
    quote:
      "I'm a firm believer in pushing for Asian talent. The fact that we are so far from headquarters means we have to work harder on visibility. Otherwise, they don't know who you are.",
    quoter: "Leslie Hayward, HR Director, Shell",
    tags: ["Asian Talent Development", "Inclusion & Diversity", "Energy"],
    introduction: `
<p>Shell Asia was an exciting and rapidly growing collection of markets for Shell. However, with Royal Dutch Shell headquartered in the Netherlands and incorporated in the UK, Shell APAC was keen on putting themselves on the radar by showcasing Asia's talent.</p>
<p>Shell is very big on diversity and inclusion (D&amp;I) and has a 50:50 male to female ratio for new employees. Every year's intake has to build the funnel towards gender diversity.</p>
<p>Across 2 cohorts, 45 high potentials were chosen from Australia, Brunei, China, India, Indonesia, Japan, Malaysia, Myanmar, New Zealand, Pakistan, Philippines, Singapore, South Korea, Taiwan, Thailand, and Vietnam.</p>
`.trim(),
    text: `
<h2>CorporateDNA Solution</h2>
<p>In 2019, Shell Asia partnered with CorporateDNA to curate a high intensity program called Talent Acceleration Program for Asia (TAPA), which was created with the strategic intent of bringing more Asian Talent to the forefront. In a very human centred way, we started with the leadership narrative of the chosen Asian delegates across 16 nationalities, and these were filmed to help them find their authentic leadership identity.</p>
<p>Interestingly, one cohort received the program as an in-room experience pre-COVID19 and the other received it as fully virtual post-COVID19. The impact was seamlessly consistent across both formats and generated remarkable results.</p>
<h2>Results</h2>
<p>With an 88% Net Promoter Score at the end of the TAPA program, all participating leaders were able to identify and transform their limiting beliefs, fears and insecurities into purpose. By leading from a place of purpose and value, they have seen growth, grounded leadership and productivity that's higher than ever before.</p>
`.trim(),
  },
  {
    slug: "morgan-stanley",
    title: "Morgan Stanley",
    quote:
      "We operate in a dynamic environment that changes by the minute. Technology is no longer something that supports the business, it is at the core of our business. I want the MD conference to be the foundation for all 150 Directors being aligned on mindsets and behaviours needed for this Culture transformation within Tech.",
    quoter:
      "Rob Rooney, Head of Technology, Operations & Firm Resilience, Morgan Stanley",
    tags: ["Culture Transformation", "Leadership Development", "Financial Services"],
    introduction: `
<p>As an industry leader, the Tech business within Morgan Stanley was due for a culture transformation. With 15k technologists supporting 10 billion transactions, the top 150 directors were experiencing a need for a change of mindset and culture.</p>
`.trim(),
    text: `
<h2>CorporateDNA Solution</h2>
<p>CorporateDNA was appointed to deliver a mindset and behaviours transformation for the top 150 directors across 25 global locations at their annual MD conference in New York in 2019. Our pre-work concluded that the burning platform for this culture transformation was leadership's concern about a big loss of: "Our Edge, Our Leadership position, Our Competitive Advantage, Our Credibility, Talent, Productivity, Revenue depletion… along with being viewed as old and lethargic!"</p>
<p>In partnership, CorporateDNA distilled 5 mindsets and worked through an engaging set of workshops to fight inertia and cynicism while creating supporting behaviours for each mindset. The session was delivered experientially in real time with the highest levels of engagement.</p>
<h2>Results</h2>
<p>As a result, over 150 leaders were able to dial up honesty in looking at the mirror, embrace the need for a collective change in the DNA of this community, give and receive feedback, apply their learnings from the program, and innovate to create an ownership culture. Results reported included:</p>
<ul><li>Clear messaging and alignment of 2020 Goals.</li><li>Rapid adoption of the 5 mindsets to their in-country leadership teams.</li><li>Actively pushing PACE strategy within Morgan Stanley Tech.</li><li>Breaking the stop-start crises loop.</li><li>Reversing the indecision trap through rapid decision making.</li><li>Higher engagement levels.</li></ul>
<blockquote><p>We have never been so honest in a room before, that too all together. Maybe the mindset change we have been talking about is being born right here!</p><p>— Tech MD, Morgan Stanley, 2019</p></blockquote>
`.trim(),
  },
  {
    slug: "aviva",
    title: "Aviva",
    quote:
      "Truly embracing diversity goes beyond appreciating people for who they are, regardless of their background. It's about recognizing the breadth of talent, expertise and perspectives they bring to the table. Instead of integrating them into a common culture, it's about celebrating the differences and empowering people to share their uniqueness. This is what we mean by \"inclusive diversity\", which lies at the heart of how we do business at Aviva.",
    quoter:
      "Chris Wei, Global Chairman of Aviva Digital and Executive Chairman, Aviva Asia",
    tags: ["Inclusion & Diversity", "Women in Leadership", "Insurance"],
    introduction: `
<p>In 2017, leading Global Insurance company Aviva wanted to adopt a serious, visible and new lens on Diversity and Inclusion, starting at the top with the Group PLC Board. The emphasis was placed on decreasing the gender, ethnic and generational gaps among the company's talent.</p>
`.trim(),
    text: `
<h2>CorporateDNA Solution</h2>
<p>Aviva partnered with CorporateDNA to enable the group PLC to curate a program called "Inclusion: Lenses and Legacies" with two targeted tracks.</p>
<h3>Track 1: Inclusion and Diversity for the Group PLC Board (2017-2018)</h3>
<p>The first track worked with the Group PLC Board, sponsored by the Executive Chairman Sir Adrian Montague, to help shape an Inclusive Legacy. These workshops aimed to define the Inclusion ambition for Aviva and carried an element of personal reflection for the Board to reposition themselves by representing the new Asian and millennial consumer base. CorporateDNA worked with both Executive and Non-Executive members to learn how to leverage areas of difference as a core strength for innovation, with the combination of individual life stories and unconscious biases.</p>
<blockquote><p>Thank you so much for the fantastic two workshops you ran in Canada this week. We had a great morning with Rhea and Jamie and the independents really got engaged and excited. The involvement was excellent and it was a great session. We had a number of clear action items to help redefine our role and how we spend our time.</p><p>— Aviva Canada Board, led by Maurice Tulloch (became Group CEO, Aviva)</p></blockquote>
<h3>Track 2: Accelerating Women Leaders (2016-2020)</h3>
<p>The second track, sponsored by Group HR Director Sarah Morris, worked with over 100 women in leadership at Senior Leadership and Senior Management levels over 3 years. The inner work included Personal Brand Impact, Courageous Leadership and Authenticity. The harder skills included Commercial Acumen, Decision Making, Creative Problem Solving, Collaboration, Networking and the Feedback Cycle.</p>
<h2>Results</h2>
<p>The company is now led by several senior women who were promoted into commercial roles during the ALIO journey.</p>
`.trim(),
  },
  {
    slug: "coca-cola",
    title: "Coca-Cola",
    quote:
      "We continue to invest for sustainable growth in the future, and we remain very focused on raising the performance bar everywhere to capture the opportunity available to us.",
    quoter:
      "John Murphy, Chief Financial Officer and Executive Vice-President, Global Executive Team, Coca-Cola",
    tags: ["Culture Transformation", "High Performing Teams", "Consumer Goods"],
    introduction: `
<p>As a legacy brand in the beverage industry, Coca-Cola was due for a reset – with 32 markets, 4.0 billion consumers, and an industry retail value of ~$281 billion, there was a need for organizational alignment, and to update leadership behaviours and mindsets. In 2018, Coca-Cola introduced a set of new behaviors and performance indicators globally.</p>
`.trim(),
    text: `
<h2>CorporateDNA Solution</h2>
<p>John Murphy, APAC President and CEO, appointed CorporateDNA to deliver a culture transformation for a newly formed APAC Leadership Team in 2018, who were responsible for 32 APAC markets and their supporting functions. Our pre-work concluded that the burning platform for this culture transformation was a new leadership team learning to embrace new mindsets, unlearning cross-functional siloes, and creating a new starting line across the experienced LT members to form a consistent baseline. CorporateDNA ran a series of sessions with this newly formed APAC leadership team, with a focus on embedding these newly released winning mindsets and identity, to ensure APAC role-models these new behaviours that would unleash the power of the market, over an 18-month period.</p>
<p>In the same 18-month period, CorporateDNA also enabled Coca-Cola Japan in implementing several changes in their leadership team, as they prepared for the Tokyo Olympics 2020.</p>
<p>In partnership, CorporateDNA distilled the 4 global mindsets into liveable everyday behaviours and worked through an engaging set of workshops at the regional and country level, to activate confident, inclusive, and collaborative behaviours that would make this LT win.</p>
<h2>Results</h2>
<h3>Track 1 (Regional Transformation): Coca-Cola APAC</h3>
<p>As a result, over 18 APAC LT leaders at the helm of the region were able to directly apply their learnings from the program and saw increased performance and motivation in their team members as they were held accountable through growth dialogues and were inspired to be catalysts in shaping perception and organizational culture:</p>
<ul><li>Clear messaging and alignment of 2018 behaviours and mindsets.</li><li>A sense of renewed confidence in individual leaders as credible, functional owners.</li><li>Making bold, agile decisions by breaking out of parent-child dynamics; becoming open to challenges.</li><li>Actively engaging in cross-functional interdependency rather than in siloes, and a smooth transition into Matrix team leadership.</li><li>Living a consumer-driven culture, each market being an engine of growth.</li><li>A winning culture for the APAC leadership team.</li></ul>
<h3>Track 2 (Country Transformation): Coca-Cola Japan</h3>
<p>Over 25 LT leaders in Coca-Cola Japan were able to tap into their strengths and manage interferences, such as fears, insecurities and limiting beliefs. There was a deep and neglected need for emotional assurance and authenticity in the leadership team that was unleashed in this transformation. Results reported included:</p>
<ul><li>Emotional needs of being included, understood, and supported were nurtured and created a sustainable environment of psychological safety.</li><li>Inspired to innovate and create a speak-up culture.</li><li>Invigorated courage.</li><li>Executed acceleration plans to deliver breakthrough performance for Coca-Cola's leadership in the Tokyo Olympics.</li></ul>
<blockquote><p>Great feedback on the CorporateDNA facilitation of our Asia Pacific Leadership Team - level of engagement and key themes that were generated was great work!</p><p>— John Murphy, President, APAC, Coca-Cola</p></blockquote>
<blockquote><p>Thank you for the great couple of days with my Japan LT, and the DNA fitness report which summarizes well the key findings and priorities. Refreshing breakthroughs!</p><p>— Jorge Garduno, Coca-Cola, Japan</p></blockquote>
`.trim(),
  },
  {
    slug: "gsk",
    title: "GSK",
    quote:
      "I have always believed that the question of culture is fundamental for any organization. Culture – mainly defined not by the values and expectations written on the wall but by the way that leadership behaves – can be a fantastic accelerator for change, but can also be a complete derailer if a company gets it wrong. When I laid out the priorities for GSK, they were innovation, performance and trust to the power of 'c' for 'culture'.",
    quoter: "Emma Walmsley, Group CEO, GSK",
    tags: ["Culture Transformation", "High Performing Teams", "Leadership Development", "Pharmaceutical"],
    introduction: `
<p><strong>At a glance:</strong></p>
<ul><li>26 countries</li><li>7 year partnership</li><li>2 culture transformations in the Pharma business</li><li>100+ leaders across Asia</li><li>60+ high performing teams</li><li>50+ women in leadership coaching</li></ul>
<p>Over the last 3 years, GSK, under the helm of Group CEO Emma Walmsley, has pivoted into a much more competitive model. Against a changing environment of pricing pressure, technology disruption, and consolidation, significant changes include:</p>
<ul><li>Transforming the company into a world class Bio-Pharmaceutical company.</li><li>Competitive launches via accelerating Pharma investment on priority countries and products to drive growth.</li><li>Delayering the business in Emerging Markets & Classic and Established Products to drive better decision making and a culture of accountability and high performance for double digit growth.</li></ul>
<blockquote><p>For some people it has been uncomfortable, and that is why updating talent is also important. Although many of the people who have come before have done incredibly important things, and in some cases been successful for a period, when you are redesigning and resetting what you want to do for the next chapter, you need to have fit-for-purpose leaders who embrace the kind of culture that you want.</p><p>— Emma Walmsley, Group CEO, GSK</p></blockquote>
`.trim(),
    text: `
<h2>Client Challenge</h2>
<p>CorporateDNA was invited to partner with GSK at the peak of this major transformation as the red threads across culture, leadership and talent and high performing teams became very deliberate. Our mandate was to focus on shifting the two large businesses:</p>
<ul><li>From an individual leader focus to a high performing team focus.</li><li>From safe and supportive conversations to courageous straight talk.</li><li>From culture as a lag indicator to a lead enabler.</li></ul>
<p>Against this blueprint of the "Why and What" of this transformation becoming very clear, and with changes across GSK's purpose, goals, strategies, priorities, values and expectations, the "How and Who" became extremely important.</p>
<h2>CorporateDNA Solution</h2>
<p>Here's how we have partnered with GSK across Europe, U.S. and Asia Pacific:</p>
<ul><li>Asia Leadership Program</li><li>High Performing Teams</li><li>Major Culture Transformations</li></ul>
<h2>Results</h2>
<p>New ways of working with new mindsets, behaviours and sense of accountability were established for the organization's LT and LT -1 levels. Increased engagement in both leadership and followership across functions and markets, and the annual GSK survey results showed significant increase in satisfaction across emerging markets.</p>
<p>At the end of the 9 month journey, CorporateDNA assessed the key achievements in Emerging Markets where a clear turnaround was evident. The proof points from the EM Leadership team included:</p>
<ul><li>Owning the double digit ambition forecast from grassroots.</li><li>Higher quality business reviews and clear direction setting.</li><li>Clear alignment on purpose.</li><li>Early signs of winning from gaining back market share, profit protection initiatives and increased customer engagement.</li><li>Direct, productive and honest conversations with seniors that enabled alignment and collaboration.</li><li>Sharper focus on the key products that matter with clear accountability through a new and agile structure.</li><li>Competitive performance and understanding the importance of a smart allocation of resources.</li></ul>
<blockquote><p>COVID-19 accelerated the pressure and urgency on our leadership teams to re-think and challenge every aspect of our business. Thanks CorporateDNA for bringing such high energy and engagement during such tough times, and for being so agile and adaptive in how you partnered with us on the transformation. Leading change this year would have been much harder without you.</p><p>— EMLT, GSK 2020</p></blockquote>
`.trim(),
  },
  {
    slug: "heineken",
    title: "HEINEKEN",
    quote:
      "The reason the organisation has thrived for such a long time is because it has continuously renewed and revitalised itself. We must increase our ability to respond and adapt while always staying true to the values of our company to create a cycle of permanent renewal. We are at our core a growth company and we'll always remain hungry to seek out new opportunities for growth.",
    quoter: "Dolf van den Brink, Chairman Executive Board and CEO, HEINEKEN",
    tags: ["Culture Transformation", "Asian Talent Development", "Inclusion & Diversity", "Consumer Goods"],
    introduction: `
<p><strong>At a glance:</strong></p>
<ul><li>26 countries</li><li>6 year partnership</li><li>APAC Leadership Team</li><li>70+ HiPo successors in APAC</li><li>15+ country leadership teams</li></ul>
<p>Over the last three years, HEINEKEN has experienced an exponential change – marked by its change in Board, Executive Leadership, and global reorganisation while embedding a "Transformative Evergreen" strategy during the Covid-19 pandemic. This change was amplified further as the company transitioned from Jean-Francois van Boxmeer's leadership to Dolf van den Brink's as Group CEO, an avid role model of leading from the inside-out and a living example of courage, authenticity, and grit. Significant changes include:</p>
<ul><li>The honesty and humility to address the fundamental question of keeping the "beer category relevant in old and new consumer targets" despite its 155-year-old success story.</li><li>Revitalizing all layers of the organization through new mindsets, a new people and talent-centric culture, and emphasis on their sustainability & responsibility agenda.</li><li>Large-scale acceleration and increased focus on people-centric vision through HEINEKEN Evergreen, enhancing the competitive edge for HEINEKEN International Brands and developing the APAC consumer market.</li></ul>
`.trim(),
    text: `
<h2>Client Challenge</h2>
<p>COVID-19 happened at the absolute peak of HEINEKEN's performance, resulting in a loss of market share and premium brands. HEINEKEN APAC underwent a series of unprecedented changes in less than 5 years along with 3 Regional Presidents in quick succession. CorporateDNA was invited to partner closely with all three incoming APAC Presidents in 2016, 2018, and 2020 respectively, each time to deepen the relevant shifts into the fabric of the APAC Region and its 26 countries (OpCos) including Vietnam, Taiwan, Malaysia, Singapore, and Korea. At the peak of this major transformation, our mandate was to focus on 3 key layers of change:</p>
<ul><li>The General Managers of the OpCos.</li><li>The General Managers of the various Operating Countries and their respective Management Teams (MT).</li><li>The layer below the MT, of "new-gen change agents".</li></ul>
<p>In all 3 layers, CorporateDNA partnered with HEINEKEN to work on the red threads of shifting the culture – from comfort to growth zones, deepening psychological safety and trust, real debate over false harmony, and empowering critical layers of the organisation to own bold decisions and choices. The Key Shifts we identified to underpin the design of the transformation included:</p>
<ul><li>From an individual leader focus to a high-performing team focus.</li><li>From a personal performance focus to consumer and brand-focus.</li><li>From false harmony to real debate.</li><li>From inner game to outer game mastery (e.g., from individual agendas and functional silos to being in service of the brand and the customer).</li><li>From a Regional Office culture to empowering the OpCos to be the centre of gravity.</li></ul>
<blockquote><p>To me, success means mobilising the organisation so that we can do amazing things together. It means embracing our entrepreneurial spirit while being disciplined around pursuing productivity and cost-consciousness. It means empowering our people to go beyond what they thought possible and to achieve more than they could have imagined.</p><p>— Dolf van den Brink, CEO, HEINEKEN International</p></blockquote>
<h2>CorporateDNA Solution</h2>
<p>Here's how we have partnered with HEINEKEN across Asia Pacific:</p>
<ul><li>Uncage Asian Talent Acceleration Programme</li><li>Inclusion & Diversity</li><li>Operating Local Country Transformations</li><li>Asia Pacific Leadership Team</li></ul>
<h2>Results</h2>
<p>Through all the work we undertake with HEINEKEN, the spirit of Uncage – borne out of Uncaging HEINEKEN's Tiger Beer campaign (which is about local heroes and their bravery in pursuit of passion) – became the foundation that led all our transformations at Regional, OpCo and Individual levels. The results included:</p>
<ul><li>An increased focus on building consumer and customer-centricity, key capabilities, I&amp;D, route to markets, portfolio optimization, and digital transformation accelerated the top-line performance.</li><li>General Managers owning and living the transformation with courage, authenticity, and grit.</li><li>Layers below the leadership team were empowered to speak up and own the growth of the business.</li><li>Quality of peer and direct report feedback enabled by higher quality performance and growth dialogues.</li><li>Improved Climate Survey results.</li><li>Higher quality Strategic Planning reviews and Annual Plan Submissions.</li></ul>
<p>HEINEKEN has experienced significant wins through large transformations undertaken across all levels of management over the last 6 years, as CorporateDNA continues to partner with them to push their boundaries and keep HEINEKEN Uncage real.</p>
`.trim(),
  },
  {
    slug: "unilever",
    title: "Unilever",
    quote:
      "Putting purpose at the heart of all our brands is not only the right thing to do; we know it drives superior performance and growth.",
    quoter: "Sunny Jain, President, Beauty & Personal Care, Unilever",
    tags: ["Culture Transformation", "High Performing Teams", "Leadership Development", "Consumer Goods"],
    introduction: `
<p><strong>At a glance:</strong></p>
<ul><li>6 countries</li><li>7 year partnership</li><li>200 leaders globally</li><li>20 high performing teams</li></ul>
<p>Over the last three years, Unilever has experienced a bold and gritty transformation in their ways of working. Marked by the shadow of Covid-19, Unilever has adapted to major interferences and disruptions in their commercial, supply, and technological processes, powered by purpose and innovation. While Unilever possesses a distinct position as a global leader in the retail industry that cares for its consumers and people, thriving as a business and driving performance meant it needed to become really intentional in remaining a future-fit and purpose-led business committed to being a force of good in the world. Significant developments in Unilever's business include:</p>
<ul><li>A commitment to the Unilever Compass Strategy, that aligns the organization's growth strategy with the belief that sustainable and purposeful business drives superior long-term performance.</li><li>Revitalizing all layers of the organization through a new Standard of Leadership, rolled out with clear markers of Inner and Outer Game mindsets and behaviours for leaders and teams.</li><li>4 change programs delivered globally: Leading through Change, Partnering through Change, Thriving through Change, and a Commercial Operations Change Transformation Journey.</li><li>An overhaul of Unilever's commercial operations, led by purpose, and creating growth and value through stakeholder-centric ways of working.</li></ul>
`.trim(),
    text: `
<h2>Client Challenge</h2>
<p>With the global challenges and pressures that Unilever faced, there was a deep-seated and urgent need to revitalize and invigorate the organization to not only adapt to new requirements and contingencies, but to thrive within this unprecedented landscape. From 2020 to 2021, CorporateDNA was invited to partner closely with Unilever in undertaking an ambitious and necessary merger of two essential functions in the organization – Supply Chain and Procurement, under a new Leadership Team with the leader being a Global Executive Team member.</p>
<p>Our work with Unilever spanned 4 culturally and commercially diverse continents and 6 countries, including North America, South America (Argentina), Europe (Italy), the U.K., and Asia (Singapore and the Philippines). At the peak of this major transformation, our mandate was to focus on 4 key areas of change:</p>
<ul><li>Ambitioning and purpose-setting.</li><li>Stakeholder-centricity – understanding stakeholder needs, setting expectations against dependencies and timelines, and feedback.</li><li>Clarity in communication, working processes, and alignment on new standards of leadership.</li></ul>
<blockquote><p>Our people have been our absolute priority throughout 2020, and because of them we've been able to meet the needs of consumers and grow our business.</p><p>— Leena Nair, Chief HR Officer, Unilever</p></blockquote>
<p>In our pre-work, CorporateDNA partnered closely with Unilever to deliver a strategy that identified the "what and how" for the Leadership Team to activate Unilever's purpose while leveraging their strengths, including:</p>
<ul><li>Alignment on their inner game as a new leadership team, defining their purpose with clear ambitions and expectations, and being active change agents in the process.</li><li>Enabling a psychologically safe environment.</li><li>Key business priorities, with value and impact at the forefront.</li><li>Navigating ambiguity and holding polarities in an uncertain business landscape.</li><li>Unpacking Unilever standards of leadership, through the elements that make up how they work internally.</li><li>Clarifying and enabling Unilever standards of leadership through each LT member's roles and capabilities, zeroing in on an edge-to-edge process.</li><li>The execution of these new expectations, while empowering and including the layer below the MT into new ways of working.</li></ul>
<h2>CorporateDNA Solution</h2>
<p>Here's how we have partnered with Unilever globally:</p>
<ul><li>Inner and Outer Game – Leaders and Teams</li><li>Leading through Change</li><li>Partnering through Change</li><li>Thriving through Change</li><li>Board Development Coaching – Unilever Philippines</li><li>Commercial Operations: Change Transformation</li></ul>
<h3>The Inner and Outer Game for Leaders and Teams</h3>
<p>A 2-part model was applied for the transformation of Unilever's Standards of Leadership: the inner and outer game. The inner game focused on how leaders can harness their ability to tune in and lead from that inner place, not a place of reactivity. Leading with a sense of purpose, personal mastery and agility to pivot decisions was the first half of this successful approach. The second half, the outer game, focused on how leaders can sharpen their business acumen to deliver effective solutions. Generating value, mentoring talent and inspiring others from genuine love and passion have all contributed to Unilever's global success.</p>
<h2>Results</h2>
<p>Through the work we undertake with Unilever across teams and businesses, the results include:</p>
<ul><li>A deepened sense of shared purpose, alignment of expectations and team goals, understanding and authenticity through sharing best and worst selves, and exploring points of friction and vulnerabilities.</li><li>A greater capacity for agility and decisiveness, through renewed intent, interdependent partnerships, validating areas of focus, establishing objectives, and points of integration.</li><li>Psychological safety through courageous conversations, defining and celebrating success, milestones, and proof points to see the shifts that are needed to win, and overcoming fears and limitations.</li><li>An increased focus on building stakeholder-centricity.</li><li>General Managers owning and living the transformation with courage, authenticity, and grit.</li><li>Building a visible change mindset at the grassroots.</li></ul>
<p>Being purpose and values-led enabled Unilever to make quicker, conscious decisions in a challenging global landscape, revitalized the organization and a sustainable way of working, and emerged stronger through the Standards of Leadership expected of individual leaders.</p>
`.trim(),
  },
];

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, profiles } = await import("../db/schema");
  const { createEntry, updateEntry, publishEntry } = await import(
    "../lib/content/entries"
  );

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
  let updated = 0;
  let published = 0;
  let unchanged = 0;

  const data = (c: CaseSeed) => ({
    tags: c.tags,
    title: c.title,
    quote: c.quote,
    quoter: c.quoter,
    introduction: c.introduction,
    text: c.text,
  });

  for (const c of CASES) {
    const [existing] = await db
      .select({ id: contentEntries.id, status: contentEntries.status, data: contentEntries.data })
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "case"),
          eq(contentEntries.slug, c.slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );

    if (existing) {
      const cur = existing.data as Record<string, unknown>;
      if (
        cur.title === c.title &&
        cur.quote === c.quote &&
        cur.quoter === c.quoter &&
        cur.introduction === c.introduction &&
        cur.text === c.text &&
        JSON.stringify(cur.tags ?? []) === JSON.stringify(c.tags)
      ) {
        console.log(`• same  ${c.slug} — content already up to date`);
        unchanged++;
        continue;
      }
      const upd = await updateEntry("case", existing.id, {
        data: data(c),
        actorId: admin.id,
      });
      if (!upd.ok) {
        console.error(`✗ fail  ${c.slug} — validation:`, upd.errors);
        continue;
      }
      updated++;
      const pub = await publishEntry("case", existing.id, admin.id);
      if (!pub.ok) {
        console.error(`  updated but NOT published ${c.slug}:`, pub.errors);
        continue;
      }
      published++;
      console.log(`✓ upd   ${c.slug} — updated & republished (${c.title})`);
      continue;
    }

    const result = await createEntry("case", {
      data: data(c),
      locale: LOCALE,
      slug: c.slug,
      actorId: admin.id,
    });

    if (!result.ok) {
      console.error(`✗ fail  ${c.slug} — validation:`, result.errors);
      continue;
    }
    created++;

    const pub = await publishEntry("case", result.entry.id, admin.id);
    if (!pub.ok) {
      console.error(`  created but NOT published ${c.slug}:`, pub.errors);
      continue;
    }
    published++;
    console.log(`✓ new   ${c.slug} — created & published (${c.title})`);
  }

  console.log(
    `\nSummary: ${created} created, ${updated} updated, ${published} published, ${unchanged} unchanged, of ${CASES.length} total.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
