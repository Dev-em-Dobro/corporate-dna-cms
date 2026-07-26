/**
 * Seed the CorporateDNA services into the `solution` collection and publish each.
 *
 * Usage:
 *   npx tsx scripts/seed-solutions.ts
 *
 * Idempotent: an entry whose (type, slug, locale) already exists (and is not
 * soft-deleted) is skipped, so re-running after a partial failure is safe.
 *
 * Source: the scraped service pages under /solutions. For each page the field
 * mapping is:
 *   title            -> the page heading
 *   problemStatement -> the hero tagline directly under the heading (richtext)
 *   body             -> the article body as sanitised HTML (paragraphs, lists,
 *                       blockquotes, and the "Engage us / What we deliver"
 *                       sections). Nav chrome and the contact/footer block are
 *                       dropped. bannerMediaId is left unset (no image yet).
 *
 * Content is stored verbatim under locale "en" (the CMS default). The source
 * copy is English; translating it is a separate task.
 */
export {};

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const LOCALE = "en";

interface SolutionSeed {
  slug: string;
  title: string;
  problemStatement: string; // sanitised HTML
  body: string; // sanitised HTML
}

const SOLUTIONS: SolutionSeed[] = [
  {
    slug: "executive-coaching",
    title: "Executive Coaching",
    problemStatement:
      "<p>New Generation Coaching that delivers real and results. We build long term habits to master your inner game, for a successful outer game.</p>",
    body: `
<p>Over the last 10 years, CorporateDNA has coached 1000+ high potential leaders, managers and teams ranging from CXO roles, Directors and Managers across multiple functions and business units. DNA Coaches approach coaching from a client-centric practice that works from the leader's agenda to help master context, navigate complexity and facilitate fast, visible results in the organization. The defined "edge" in CorporateDNA's coaching is the integration of its proprietary 5H© lens into building long term habits for the coachee.</p>
<p>Over a 6–12-month coaching journey, CorporateDNA creates coaching partnerships that are built on trust, which enables them to achieve their personal and organizational goals with increased productivity and visibility. The advancement of individuals and teams are supported through one-to-one work as either stand-alone interventions or as part of a bigger, structured leadership journey.</p>
<p>CorporateDNA coaches clients across 20+ countries combining multicultural lenses, a blend of complementary coaching techniques (results focused, psychodynamic, sports psychology led, CBT etc) with advanced knowledge in behavioural sciences to adjust the coaching process to meet clients at their current "intake baselines". E.g., Accelerated transition, new/expanded roles, blind spot removal, developing impact/executive presence, integrating a new team and others.</p>
<p>CorporateDNA is also well known for our "trusted tripartites" approach, which works with the Line Manager and Coach in a three-way alliance of trust that focuses on aligning to the same coaching objectives, managing progress, and periodic check ins. The core to CorporateDNA's executive coaching practice is that we personally participate in ongoing development, reflection and integration as an executive coach.</p>
<blockquote><p>I see myself like I have never done before – it's like pulling out the last 30 years of my life and rebuilding the puzzle! I have had many ivy league coaches, but the coaching from CorporateDNA was by far the best.</p><p>— Senior VP, Emerging Markets, Pharmaceutical Client</p></blockquote>
<p>CorporateDNA knows all the processes, tools, and levers for highly experiential execution that delivers results. Here are our illustrative tools that activate the magic of the 5H©:</p>
<ul><li>Executive Coaching Roadmap</li><li>Executive Coaching Intake – Reflective Questions</li></ul>
<h3>Engage us when you want to / What we deliver</h3>
<p><strong>Accelerate your growth: expand/extend your career and impact</strong></p>
<p><em>Accelerated Transition Coaching.</em> We help the client accelerate their learning curve by targeting a clear 'advanced threshold of new behaviours and impact' to a point of visible readiness for their next move – be that a promotion, step up, expansion or lateral move.</p>
<p><strong>Onboard a new/upward role</strong></p>
<p><em>New Role / New team / Next Version Coaching.</em> Onboarding new roles typically happens within 90-180 days of an executive's appointment – our coaching process is adjusted to leverage this "landing" period when critical and lasting impressions are made and when grasping the business and stakeholder nuances become critical.</p>
<p><strong>Remove blocks and unlock your hidden/trapped potential</strong></p>
<p><em>Unlocking Potential by Removing Blocks.</em> Pinpointing the real and perceived interferences that get in the way are important anchors for coaching. Through clear 360 diagnostic assessments and live observation, we develop an action plan that identifies desired outcomes, areas that require the most developmental growth and strategic steps to "land" the next version of them and reposition their individual brand with sustainable habits for lasting change.</p>
<p><strong>Make a bigger impact in the organization</strong></p>
<p><em>Executive Impact/Presence Coaching, Derailment Coaching and Career Coaching.</em> We help you gain a competitive edge by improving your executive-level skills. You will see an improvement in your leadership effectiveness, corporate performance, relationships and organization. By improving yourself, you will have a greater impact in your role and therefore on the organization as a whole.</p>
<p><strong>Coach your Team</strong></p>
<p>Team coaching is a powerful catalyst when the coach works with the team to focus on the whole through a systems thinking perspective, factoring in the complex organizational issues within which the team operates. Our ability to set boundaries where we integrate the three relationships we work with, in a team coaching context, is clear – with the team, with the leader of the team, and with the organization.</p>
<p>If you believe executive coaching is what your organization needs to excel, please contact us for a confidential and complimentary "chemistry session". This is a no-obligation session that is offered to see if there is a match between the potential coach and coachee.</p>
<blockquote><p>CorporateDNA coaching is deeply transformative, intense and so powerful!</p><p>— Group HR Director, Financial Services, UK</p></blockquote>
`.trim(),
  },
  {
    slug: "high-performing-teams",
    title: "High Performing Teams",
    problemStatement:
      "<p>Successful teams do not happen by accident. We bring real intention, design, and crafted efforts into your team's next inflection point.</p>",
    body: `
<p>In 2020, high performing teams (HPT) were rated as the number one business priority by all CorporateDNA's clients. CorporateDNA's HPT service is known for bringing intention, design, and crafted efforts in taking a current team to its next inflection point – because successful teams do not happen by accident.</p>
<p>The power of highly engaged teams is pivotal to high performance, especially now more than ever in a virtual world.</p>
<p>CorporateDNA has worked with over a thousand teams across 16 sectors, 52 nationalities and 30 geographies since its inception, building a track record of designing relevant journeys for teams at different inflection points:</p>
<ul><li>New teams</li><li>Stagnant teams</li><li>Start-up teams</li><li>Scale-up teams</li><li>Self-managed teams</li><li>Virtual teams</li><li>Turnaround teams</li><li>Merging teams</li></ul>
<blockquote><p>I do want to thank you Rhea and CorporateDNA for all you brought to me personally, and in particular for your partnership with HR and me to truly transform the AMALT. The impact has truly been profound over the last 1-2 years. As I reflect on years ahead in my time in AMA, this will be my happiest memory & the one that I'm most proud of.</p><p>— David Love, Executive Vice President, LEVIS Asia, Middle East, Africa</p></blockquote>
<p>CorporateDNA believes that High Performing teams are not just any strong team with great performance, but rather, mastering these distinctive traits is what makes a team "high performing":</p>
<ul><li>A deep sense of purpose in the team that is visible and "experienced" by the rest of the organization.</li><li>Creating ecosystems versus hierarchical power structures, where information and decision-making flow seamlessly.</li><li>Teams which sign up to stretching targets relative to other 'effective teams'.</li><li>A diverse set of personalities, styles and paradoxes that complements other team members' abilities.</li><li>High degree of Inclusivity and Interdependence, with an enviable trust between members.</li><li>Creating a two-way contract between the leaders and team, which allows reciprocal coaching and feedback.</li></ul>
<p>From Group PLC Boards and C-Suite Executives to Country Management and Front-Line teams, CorporateDNA has found incredible success in building highly motivated, focused, and cohesive teams. CorporateDNA continues to move teams from good to great and deliver tangible results through guided leadership journeys, building sustainable habits and creating impact from a renewed source of team energy.</p>
<p>We are reputed for our targeted designs, delivery and follow up. We are very experienced in delivering online, virtual, and hybrid programs, so that we are "meeting the client where they are at". Throughout the process, our facilitators are relentless about playback and "holding the mirror" to ensure the change starts in the room and during the process – we take great care in highlighting "what we see", e.g. dynamics and patterns of behaviour within the team, as well as potential areas for development.</p>
<p>CorporateDNA knows all the processes, tools, and levers for highly experiential execution that delivers results. Here are our illustrative tools that activate the magic of the 5H©:</p>
<ul><li>Framework</li><li>3 to 6-month Roadmap</li><li>9 to 12-month Roadmap</li><li>Scoping with team Leaders</li><li>HPT Tools</li></ul>
<h3>Engage us when / What we deliver</h3>
<p><strong>Your team is new and looking for a clear purpose, clear goals, and role alignment.</strong></p>
<p>CorporateDNA's 5H© process will work through any misalignment or general 'void' to create a shared belief that enables members to align on how their individual roles can help deliver the team's goal. This results in a renewed sense of direction and engagement.</p>
<p><strong>Your team's atmosphere is low/pessimistic and in need of a transformation.</strong></p>
<p>We work through team dysfunctions to transform the team climate, by establishing a strong and psychologically safe environment that helps achieve great business results by upping courage, ownership, and trust in equal measure.</p>
<p><strong>Team members are communicating infrequently and making poor decisions without assessing both rational and intuitive decision-making methods.</strong></p>
<p>We focus heavily on improving team empowerment through increased ownership, effective communication flows, and cohesive decision making.</p>
<p><strong>A key area of development is in building skills to have real debates versus holding onto false harmony.</strong></p>
<p>Our constructs are known for being "loose but tight" – constructing decision-making boundaries with enough room to make empowered choices.</p>
<p><strong>Team members fail to use a collaboration style that engages across functions and business units resulting in siloed teams.</strong></p>
<p>We build horizontality to break across team silos. The process looks at getting each member invested in their peers' worlds, appreciating challenges, and collaborating on solutions.</p>
<p><strong>Your team is ready to mature, grow their leadership capabilities and empower each other.</strong></p>
<p>Our team development program looks at developing each member as individuals by leveraging their strengths and weaknesses, and then building on each other's differences. Team leads are then developed as an owner and change catalyst by learning how to not only lead their teams, but to empower them to lead back. Our horizontal and vertical leadership structure works with teams across all levels.</p>
<p><strong>Your team does not fully see the value of inclusion and diversity.</strong></p>
<p>When team members do not value diverse experiences, backgrounds, and skills, this results in less successful decision-making and solutions. We look at restoring the value of inclusion and diversity through sourcing the origins of bias and dialling up inclusive leadership from a place of energy and renewal, not correction and remedy.</p>
<p><strong>Your team is lacking mutual trust, unable to manage conflict and repair relationship issues.</strong></p>
<p>We believe that one of the core strengths of a high-performing team is their exceptional level of interpersonal trust. Trust is what allows team members to leverage conflict in a constructive way, strengthen bonds and create transparent dialogues. With a tried and tested "trust equation," we encourage trust. We deepen healthy tensions, while bringing conflicts to the surface as a source of creative tension, in a depersonalized way.</p>
`.trim(),
  },
  {
    slug: "asian-talent-development",
    title: "Asian Talent Development",
    problemStatement:
      "<p>Asian Talent is a strategic necessity, not a 'nice to have.' We shape Asian leaders to transform the region in visible, impactful ways.</p>",
    body: `
<p>Asia as a region is known to be synonymous with the word "opportunity". Increasingly, the emerging economies of Asia are playing a critical role globally, while the rest of the world faces unprecedented uncertainty. Asia is undergoing its own transformation with greater economic prosperity, ease of access, a rising middle class, increased Global MNCs, and new customer segments. As businesses tap into the opportunities presented by an emerging customer base in Asia, they need to be mindful of the intensifying competition for Asian talent and leadership, which are fundamental assets to achieve business sustainability, competitiveness, and success in the region. In terms of regional talent, leadership pipelines in some organizations in Asia are weak, and experience significant challenges with overall talent scarcity, especially with talent retention and attraction.</p>
<p>We find 5 common areas of development for Asian talent:</p>
<ul><li>Creation of a strategically healthy pipeline of Asian talent with ready-to-move positions.</li><li>Leaky pipeline – Retention of High Potential Talent is a challenge with "the lure" of competitive offers from industry.</li><li>A robust system to marry performance with potential, for proper Talent Identification.</li><li>Insufficient Sponsorship and Mentorship from Leaders to promote Asian Talent.</li><li>Resolving dilemmas with Asian Talent who look for faster career progression and better work life balance.</li></ul>
<p>Developing Asian Talent on the executive level requires the ability to hold complexity at a large scale, while simplifying the needs and methods that will take the organization and its leaders to where they need to go. CorporateDNA helps organizations and its leaders to bridge gaps while appreciating what makes each market unique – honouring the strengths, challenges, interferences, and passions that are unique to the region and their OpCo identity.</p>
<p>CorporateDNA's Asia Talent Development program recognizes that executives themselves are key stakeholders. CorporateDNA co-creates a fully customized learning journey that is relevant to your organizational needs within the APAC context, and personalised to individual competencies; combining the precise functional, management, and leadership skills that are required of your leaders.</p>
<blockquote><p>There's a heart centeredness in CDNA's work that is so apt for these times, when we need increasingly more authentic leaders in our midst. Creativity and flow mark our collaboration with CDNA for our Asian talent program. Nothing ever feels false, but yet no matter what the medium, they always manage to get the people in the deep space necessary for important self-work to be done. Two years on, our pilot participants have continued to grow and mature, often referring back to the live exercises as not only the pivotal moment, but also the grounding of their leadership foundations.</p><p>— General Manager, Global Operations and Sponsor of Asia Leadership Program, Shell</p></blockquote>
<h3>CorporateDNA integrates 5 key principles in building an Asian leader</h3>
<p>These keep development objectives and methodologies consistent and simple, while keeping the program personally relevant and nuanced.</p>
<ul><li><strong>Showing up with Authenticity</strong> – on the personal and professional level without leaning on a "mask to fit in". We address blockers, interferences, and relational crutches that steer Asian leaders to stay safe, default to the status quo and edit themselves to fit in.</li><li><strong>Courageous Conversations</strong> – where clear communication and psychological safety is ensured. Truly productive and necessary discussions are embedded into daily working practices, rather than caging areas of development due to fear of consequences, hierarchy-laden processes, or siloed working environments. Developing Asian leaders to hold and encourage courageous conversations means they are able to accelerate value and faster decision-making, which cascades through all layers of the organization.</li><li><strong>Multiple Pathways for growth and discovery</strong> – we develop Asian leaders at different inflection points: at the Leadership Team, Management Team, and the layers below (MT minus 1 and MT minus 2). The core of developing Asian leaders is about maximizing potential, which can mean upward expansion, lateral movement, and taking on different niches.</li><li><strong>Leadership Agility</strong> – instilling agility in Asian Talent requires confidence and a sense of adventure. There is a need to empower leaders to break free from edited selves. We address the introvert vs. extrovert disparity, level up cultural awareness, build globally-ready competencies, and drive purpose and passion-led leadership.</li><li><strong>Mastering Storytelling</strong> – Asian Talent needs to activate themselves as compelling and invigorating leaders, in addition to effective execution. Many Asian leaders need that extra push to overcome their edited selves and take a heart and people-centric approach. The best way to unlock their true potential is in mastering the art of storytelling, which provides self-initiated passion and purpose as a foundation, amplifying their impact through inspiration and vision.</li></ul>
<p>CorporateDNA customizes each learning journey to the needs of a specific learner, through adult learning principles, psychometric analyses, self-exploration and mindfulness, frequent 1:1 coaching from experts and in small groups, and intense individual feedback with key stakeholders and talent experts. This is combined with intimate knowledge of the functional and relational challenges of each leader's role, through a working relationship with each leader's department head. This program will challenge candidates' belief systems and previous successes, in order for them to thrive in a new, more advanced playing field.</p>
<p>CorporateDNA's Asia Talent Development program has proven successful over the last 12 years and has helped fast track people's careers toward globally ready, confident, and motivated leaders in senior management. More than 85% of the candidates have discovered a greater sense of mission, insight, self-awareness, and belonging within their team, function, and organization. CorporateDNA has also been rated one of the best providers to deliver a structured leadership development experience virtually with the same impact and ROI (face to face, live online, moderated online, or as self-directed learning).</p>
<p>In addition to the ROI on the delegate, CorporateDNA is committed to activating the power of the Asian Talent development cohort as a critical mass of influencers that breathe life, drive, and purpose into their teams and peer groups. This ensures that the reinvigoration your delegates experience will be paid forward to the wider business and inspire others to create sustainable shifts in the organization.</p>
<p>CorporateDNA knows all the processes, tools, and levers for highly experiential execution that delivers results. Here are our illustrative tools that activate the magic of the 5H©:</p>
<ul><li>2025 Asian Talent Shifts</li><li>Global-Asian Leader Model</li></ul>
<p>In all of our programs we always:</p>
<ul><li>Consider the functional, management and leadership skills that the position needs in the Talent Pipeline, as well as unique needs that are specific to the region.</li><li>Provide individual opportunity for growth and discovery, stretching leaders by challenging belief systems and past successes that hold them back from advancing in the pipeline.</li><li>Customize learning to the needs of a specific learner and include self-exploration, on-the-job practice, real-time progress tracking, 1:1 coaching, and feedback.</li><li>Leverage low-complexity and impactful lessons for breakthrough and depth of engagement, that lead to high-complexity and life changing perspectives.</li><li>Drive purpose and performance by holding people accountable to growth dialogues and build great teams.</li><li>Master the art of storytelling to motivate and inspire leaders to unlock discretionary efforts through the team.</li><li>Explore the 5H© of Head, Heart, Hunch, Hands and Habits © to make practical links to everyday decisions and choices, to produce new routines that establish new behaviors.</li><li>Provide action plans that you can use on a personal level and to guide your organization.</li></ul>
<h3>Engage us when / What we deliver</h3>
<p><strong>You want to nominate a global pool of 50-100 high potential leaders across your Asian/APAC region.</strong></p>
<p>Our trademark Asia Talent programs start by co-creating an end-to-end process of defining the key success criteria for the ROI, followed by a careful nomination process to develop a critical pool of high potentials, to engage and develop them through a holistic development process toward destination roles.</p>
<p><strong>You want to create a local Asian Talent Development program to drive a pipeline of local talent.</strong></p>
<p>Our program is tailored to your regional business needs and delivers a robust pipeline of ready-now Asian talent through an end-to-end Asian talent elevation experience. We design constructs that offer roadmaps ranging from 3m to 18m designs based on budget, availability, and resources.</p>
<p><strong>You want a compelling narrative with a clear WHY to engage the organization on Asia Talent Development.</strong></p>
<p>Asia Talent development usually lines up under two strategies – driving performance or preparing for the future. We deliver upfront investment on "whatever it takes" to create a roadmap of engagement, hard proof points with key milestones, and a strong narrative around your leadership purpose so every stakeholder is aligned with the "Why".</p>
<p><strong>You want flexibility, relevance and choice.</strong></p>
<p>Designed by experts in learning design and content curation, enabling learners to advance their personal development when and how it works best for them:</p>
<ul><li>Personalises learning to the delegate / cohort.</li><li>Develops Asian talent with relevant, recommended learning stimulus.</li><li>Engages learners with curated, updated content on a wide range of topics.</li><li>Integrates learning into busy work diaries through a "bursts and sprints" approach.</li><li>Creates a community of social learning.</li></ul>
<p><strong>You want to retain talent in critical roles through long term engagement and retention.</strong></p>
<p>Our process helps your talent drive growth opportunities in the Asian business to improve bottom-line performance and drive strategy execution without getting stuck or stagnant. We create learning teams that show impact through a few important projects, creating a "halo effect" that builds confidence with other stakeholders, and an organizational culture based on values of ownership that releases energy back into the organization through strong business contribution.</p>
<p><strong>You want to drive Inclusion and Diversity in the Asia organization as a real enabler of success through the talent agenda.</strong></p>
<p>Our inclusion-rich design makes diversity of composition and inclusion of diverse perspectives a central red thread of the Asian Talent program in leadership, across gender, nationalities, and functions.</p>
<p><strong>You want to make Asian Talent development sustainable beyond the planned program delivery.</strong></p>
<p>Education for sponsors and leaders on how to apply CorporateDNA's proprietary 5H© method (Head-Heart-Hunch-Hands-Habits©) to sustain the transformation and measure it year on year, plus a fully owned digital ecosystem using "behavioural nudge theory" to hardwire the shifts in leaders so you can continue progressing on your own through self-sustainable methods.</p>
`.trim(),
  },
  {
    slug: "women-in-leadership",
    title: "Women In Leadership",
    problemStatement:
      "<p>We help women leaders master their inner games with real confidence and authenticity to shape strong outer games.</p>",
    body: `
<h3>Helping women leaders master their inner and outer game</h3>
<p>CorporateDNA's Women in Leadership programmes shape organizational ambition to empower and advance women executives as a source of competitive advantage through well-crafted development journeys.</p>
<p>Our programmes result in clear winning proof points. More than 70% of candidates have been promoted up the pipeline from Senior Manager to Director positions, and more than 80% of candidates from Director to C-suite positions.</p>
<p>Our grasp of the organization's context, prevailing culture/mindsets, and "pipeline issues" gives us the expertise and insight to push through infrastructural and interpersonal challenges in the leadership pipeline, such as: unconscious biases, scarcity of role models, and a peer group that shrinks the more senior they become.</p>
<blockquote><p>The best programme I have attended in a professional context. The specific focus on women AND business accelerated my leadership effectiveness. Coaches were incredible. An intense but rewarding programme.</p><p>— Commercial Director, Financial Services UK</p></blockquote>
<blockquote><p>Now I stand on big stages and receive amazing feedback, and I have this programme to thank for it.</p><p>— Julie Feltham, Commercial Risk & Governance Lead, AVIVA</p></blockquote>
<p>CorporateDNA offers gender inclusive programmes to women in leadership at different phases of their career line across 4 key life stages – late 20s, mid 30s, 40s, 50s and beyond, where we observe several patterns play out, including:</p>
<ul><li>Overcoming the 'legitimacy' gap, where women are not only held to male versions of expressed leadership but face a double standard when doing so (e.g., being passionate is perceived as 'emotional,' being determined is perceived as 'feisty').</li><li>'Playing big vs playing small', where the arc of distortion and unconscious gender biases result in humility being perceived as timidity.</li><li>Breaking out of perfectionism and low risk-taking through the 80/20 rule, converging on self-belief and faster decision-making.</li><li>Pairing delegates with senior mentors outside of their function and/or industry for productive, lasting and interdependent partnerships to learn from and to teach.</li><li>Owning your leadership style by overcoming male models of power and leadership behaviours that do not serve gender-equitable organisations and executives in the present context.</li><li>Overcoming Imposter Syndrome to achieve success in their career.</li></ul>
<p>CorporateDNA offers two options for these programmes:</p>
<h3>1. Women in Leadership (Face to Face) Programme</h3>
<p>A holistic internal programme to advance women over a 9-12 month journey. A distinctive process of co-creating an end-to-end journey for developing Women in Leadership, tailored to your unique needs, challenges, and competencies. This is an intensive 9-12 month programme that requires delegates to be involved, vulnerable, courageous, and invested in self-discovery.</p>
<p>The design covers a wide range of topics including:</p>
<ul><li>Leading with authenticity</li><li>Influencing without authority</li><li>Managing conflict</li><li>Political savviness</li><li>Assertive leadership</li><li>Coaching leadership styles</li><li>Managing subconscious biases</li><li>Effective communication among diverse groups</li></ul>
<p>We deliver the experience through a set of pragmatic roadmaps linked to the business agenda.</p>
<h3>2. Women in Leadership (Virtual bite-sized) sessions</h3>
<p>Key topics in bitesize format and interactive webinars.</p>
<p>All programmes are comprehensive and fully integrated with:</p>
<ul><li>Modular Workshops with individual ROI feedback provided</li><li>Tripartite connects with line managers and business sponsors</li><li>Interactive sessions</li><li>Panel discussions as an interplay between 'experts' and 'women presenters'</li><li>Small group work with a higher focus on individual learning</li><li>Professional coaching both in groups and one-on-one</li><li>Mentoring from industry leaders</li><li>Role playing</li><li>Self-reflections and comprehensive debrief sessions assessing impact</li><li>Alumni community membership and lifelong learning opportunities</li></ul>
<p>CorporateDNA's Women in Leadership programme has proven successful through strong shifts in performance. This is indicated by a greater sense of confidence, mission, assertion, authenticity, faster decision-making, and a deepened sense of connection with their team, peers, and organization as a result of the programme.</p>
<p>CorporateDNA knows all the processes, tools, and levers for highly experiential execution that delivers results. Here are our illustrative tools that activate the magic of the 5H©:</p>
<ul><li>Women in Leadership Programme Booklet</li><li>Participants' Feedback from the Women in Leadership Programme</li><li>End-of-Journey Review of the Women in Leadership Programme</li></ul>
<p>In all of our programmes we always:</p>
<ul><li>Develop confidence in women to fail fast and recover stronger.</li><li>Inspire self-ownership in women leaders to have tough conversations that drive growth and advancement.</li><li>Push women leaders to avoid personal and professional crutches, e.g., defaulting to likeability over respect, or a dependency on over-preparedness over intuition and risk.</li><li>Bridge the gap in intent and perception.</li><li>Impart the power of influence and inspiration, by prioritising high-empathy, psychologically safe cultures for women to inspire and be inspired to step up.</li></ul>
<h3>Engage us when / What we deliver</h3>
<p><strong>You have a deficit of strong women leaders in the pipeline, at both Manager and Director levels, and want to build their readiness for career advancement.</strong></p>
<p>Leadership and succession strategies for fast tracking female talent and preparing them for the future.</p>
<p><strong>Capable, "ready now" women are subconsciously holding themselves back from growing further.</strong></p>
<p>Release limiting beliefs in women who are capable but self-doubting to clearly articulate their value proposition and create a career strategy to support their goals.</p>
<p><strong>You want to create powerful partnerships and role models between high-potential women leaders and industry mentors.</strong></p>
<p>We enable women to become confident in the role of a trusted advisor for others, and we identify key shapers in and outside of your organization.</p>
<p><strong>You want to intentionally develop Asian women leaders for global roles.</strong></p>
<p>Build a winning Asian Women Talent Pipeline, foster an inclusive culture to increase the representation of women in senior leadership roles in APAC, nurture and develop high-potential women to strengthen your leadership pipeline, and adapt your leadership style to lead and inspire your teams in a VUCA environment in APAC.</p>
<blockquote><p>A huge thank you for all of your support across the ALIO programme over the last year. This programme came at just the right time, and it was certainly the most useful training event that I have ever attended. I learned so many tools that I use in my day-to-day role now. The whole programme has culminated in a shift in my mindset of what I am capable of and has increased my self-confidence.</p><p>— Senior Director, Pharmaceutical Client</p></blockquote>
`.trim(),
  },
  {
    slug: "culture-transformation",
    title: "Culture Transformation",
    problemStatement:
      "<p>We love shaping new cultures. We transform organisations and teams by breathing purpose into environments, where well designed cultures release real performance.</p>",
    body: `
<p>The pandemic has provided real evidence of the role culture-making and culture-building now holds in organizations. As the world has rewired its norms, one thing that has stayed constant is the need for employees to belong to a purposeful culture. Culture is mindset and behavioural change at large scale. A culture in which all layers of leadership are aligned, invested, and actively breathe meaning to the organization's values and goals will ultimately advance organizational health, performance and sustainability.</p>
<p>Since 2007, CorporateDNA has driven culture transformation across 36 countries through reorganizations, restructures and mergers. We intentionally shape environments that drive and engage teams, making them bigger than the sum of their parts through collaboration and a win-and-grow mindset, to thrive in change and complexity.</p>
<blockquote><p>We had our Americas All Hands Leadership meeting this week in NYC. In preparation for the event we used all the tools and learnings from our work with CDNA. The All Hands was an overwhelming success, but the best part is the commentary on the leadership team being so cohesive. I have received dozens of emails from the event and they all use words like inspiring, authentic, genuine, collaborative, bold, motivational, honest, aligning and many others.</p><p>— Andrew Morawski, President and Country Chairman, Vodafone Americas</p></blockquote>
<p>CorporateDNA has been trusted to deliver multiple culture transformations as an essential lever, at the intersection of strategy, performance and organizational health. We have enabled culture transformations at various levels:</p>
<ul><li>Organization Culture</li><li>Country/Market Team Culture</li><li>Functional Culture</li><li>Team Cultures</li></ul>
<p>Our Culture Transformation methodology, DNA's Culture Ecosystem, is inspired by a Solar System model of 10 distinct culture planets working collaboratively, to fuel the company's purpose at its core (the organization's Sun) with purpose at the centre of the organizational universe. This model enables leaders to think of these ten "Culture markers" as interdependent and essential elements that make up a larger, visible macro-culture:</p>
<ul><li>Winning Mindset with Winning Habits</li><li>Market Identity, Culture, & Brand Perception</li><li>Competitive Ability</li><li>Agile Decision Making</li><li>Courageous ownership of Transformation</li><li>LT Maturity & Trust</li><li>LT | LT -1 -2 Empowerment to Speak Up and Scale Up</li><li>Keep / Kill / Change Processes</li><li>Meeting and Dialogue Effectiveness</li><li>Inclusive Culture</li></ul>
<p>CorporateDNA knows all the processes, tools, and levers for highly experiential execution that delivers results. Here are our illustrative tools that activate the magic of the 5H©:</p>
<ul><li>CDNA's 10 Planets of Transformation</li><li>CDNA's 10 Principles of Leading Culture Change</li></ul>
<h3>Vodafone Americas (HQ: New York)</h3>
<p><em>Sponsor: President, Vodafone Americas.</em> Vodafone New York appointed CorporateDNA to deliver an in-country leadership transformation to work through a crucial point in the region's purpose – to boost brand visibility and performance success. We undertook an 18-month journey starting with the LT (Leadership Team) to unpack the lived realities and perspectives of each specific member, followed by mindsets and behaviours that will help the team stay relevant and become future fit. Along with team and individual coaching, we created a new "smell of the place" with energy, conviction and personal skin in the game, with profound impact especially on the country level.</p>
<h3>Levi's China</h3>
<p><em>Sponsor: President AMA region and CEO, Levi's China.</em> Levi Strauss & Co. appointed CorporateDNA to deliver an intense and intimately engaged culture transformation for 36 members of their Greater China Leadership Team from 2018 to 2020. The pinnacle of this journey was successfully launching their first Asian flagship "beacon" store in Wuhan, set up to deliver a 10X strategy in China. CorporateDNA ran a series of workshops, training, and engagement exercises to shift the GCLT from a pressure-based and siloed working culture to a deeply connected winning leadership team, coaching the CEO and the LT through this personal and professional transformation journey.</p>
<h3>Coca Cola Japan</h3>
<p><em>Sponsor: President, Coca Cola Japan.</em> CorporateDNA delivered a culture transformation journey over 18 months for 25 Leadership Team members in Coca-Cola Japan, during a challenging and intensive growth period in the lead up to the Tokyo Olympics 2020. CorporateDNA partnered closely to build an environment of psychological safety and emotional assurance, inspiring the LT to innovate and create a speak-up culture, invigorating courage, and executing acceleration plans to deliver breakthrough performance.</p>
<h3>HEINEKEN Vietnam</h3>
<p><em>Sponsor: GM, HEINEKEN Vietnam.</em> We were invited to lead HEINEKEN Vietnam's culture transformation during the pandemic as Vietnam went from being one of the top 3 performers in the HEINEKEN family to a stage of uncertainty and a sense of "plateau". Starting with the Management Team, we enabled 70 "change champions" to transform their OpCo by becoming purpose-driven and authentic, uncaged leaders, making essential shifts toward confidence, determination, and motivation. We are leading similar 6-9 month transformations for HEINEKEN Korea, Malaysia, Taiwan, Sri Lanka and Myanmar.</p>
<h3>Unilever Philippines Board</h3>
<p><em>Sponsor: Chairman, Unilever Philippines.</em> Over a 3-month coaching journey, CorporateDNA created a strategic partnership with the Unilever Philippines Board that was built on trust and challenge, enabling them to identify their personal and organizational goals with increased productivity and brand visibility. We developed the team's future focus and breakthrough habits for a dramatic impact on leadership effectiveness, market performance, and a culture change that has started to cascade throughout the organization.</p>
<h3>GSK Mexico Board</h3>
<p><em>Sponsor: GM, GSK Mexico.</em> CorporateDNA helped deliver a culture transformation in GSK Mexico – the most profitable market within the Emerging Markets portfolio. GSK Mexico was determined to overcome a highly competitive and fragmented organizational culture that operated on fear-based and siloed ways of working. CorporateDNA helped the LT make essential shifts from fear and defensiveness to courage and authenticity, parent-child relationships to accountability and self-initiation, and obstacle-oriented thinking to solution-oriented thinking and agile decision-making.</p>
<h3>In all our Culture Transformations</h3>
<ul><li>We target mindset and behaviour changes that "release" inertia and drive performance, crafting these behaviours clearly for a shared vocabulary and a single reference point to track progress.</li><li>We tease out culture "blockers" to treat the root cause, not symptoms, focusing on signals, stories and cues based on how meetings are run, feedback is given, and conflict is handled.</li><li>We call out "critical moments that matter," where a new behaviour will be far more powerful than the old behaviour in driving results, so the flywheel of change spins faster.</li><li>We instil rewards and positive nudges to role model and reinforce the desired culture, spotlighting the behaviours and ways of working that accelerate value.</li><li>We create opportunities for people to role model the new culture and witness overcoming barriers to change, celebrating small wins through a human-centric approach.</li><li>We shape and deliver the journey in equi-powered ways, extending the leadership team from a centred core of titled leaders to empowered minus 1s and minus 2s.</li></ul>
<h3>Engage us when / What we deliver</h3>
<p><strong>Your team is new and looking for a clear purpose, clear goals, and role alignment.</strong></p>
<p>CorporateDNA's 5H© process will work through any misalignment or general 'void' to create a shared belief that enables members to align on how their individual roles can help deliver the team's goal. This results in a renewed sense of direction and engagement.</p>
<p><strong>Your team's atmosphere is negative and in need of a transformation.</strong></p>
<p>We work through team dysfunctions to transform the team climate, by establishing a strong and psychologically safe environment that helps achieve great business results by upping courage, ownership, and trust in equal measure.</p>
<p><strong>Team members are communicating infrequently and making poor decisions without assessing both rational and intuitive decision-making methods.</strong></p>
<p>We focus heavily on improving team empowerment through increased ownership, effective communication flows, and cohesive decision making.</p>
<p><strong>A key area of development is in building skills to have real debates versus holding onto false harmony.</strong></p>
<p>Our constructs are known for being "loose but tight" – constructing decision-making boundaries with enough room to make empowered choices.</p>
<p><strong>Team members fail to use a collaboration style that engages across functions and business units resulting in siloed teams.</strong></p>
<p>We build horizontality to break across team silos. The process looks at getting each member invested in their peers' worlds, appreciating challenges, and collaborating on solutions.</p>
<p><strong>Your team is ready to mature, grow their leadership capabilities and empower each other.</strong></p>
<p>Our team development program looks at developing each member as individuals by leveraging their strengths and weaknesses, and then building on each other's differences. Team leads are then developed as owners and change catalysts, learning how to not only lead their teams but to empower them to lead back. Our horizontal and vertical leadership structure works with teams across all levels.</p>
<p><strong>Your team does not fully see the value of inclusion and diversity.</strong></p>
<p>When team members do not value diverse experiences, backgrounds, and skills, this results in less successful decision-making and solutions. We look at restoring the value of inclusion and diversity through sourcing the origins of bias and dialling up inclusive leadership from a place of energy and renewal, not correction and remedy.</p>
<p><strong>Your team is lacking mutual trust, unable to manage conflict and repair relationship issues.</strong></p>
<p>We believe that one of the core strengths of a high-performing team is their exceptional level of interpersonal trust. Trust is what allows team members to leverage conflict in a constructive way, strengthen bonds and create transparent dialogues. With a tried and tested "trust equation," we encourage trust, deepening healthy tensions while bringing conflicts to the surface as a source of creative tension, in a depersonalized way.</p>
<blockquote><p>After several DNA sessions, I can give you my heartfelt and conscious feedback. This has been a very interesting personal learning process; connecting with concepts like vulnerability on a day to day basis has been of great value for me, and I see it reflected in the team. Last week we had our Leadership Team day and the communication flowed with much more ease. We've clearly started to care and trust each other more. I also see a personal gain, as I apply my transformation at home with my family on a daily basis.</p><p>— Vaccines Head, GSK Mexico</p></blockquote>
`.trim(),
  },
  {
    slug: "inclusion-diversity",
    title: "Inclusion & Diversity",
    problemStatement:
      "<p>We take I&amp;D to a real place of bold culture change and performance amplification, where Inclusion goes beyond fixing unconscious biases.</p>",
    body: `
<p>CorporateDNA lives a fundamental belief that Inclusion and Diversity is an organization's leading differentiator. Our clients really value the 'humanity and honesty' we bring to taking I&amp;D from awareness-building and bias training to a real place of bold culture change and performance amplification.</p>
<p>CorporateDNA's Inclusion and Diversity programs are committed to building capacity in leaders to engage with intersectional thinking and inclusive conversations, addressing unconscious biases, identifying gaps in alignment, unlearning for transformative learning, and working through growing pains, as leaders align with inclusion and diversity goals. By building on these capacities, your leaders will be proficient in establishing psychological safety, constructive and authentic dialogue, and encouraging visibility across all members of the leadership team.</p>
<blockquote><p>Thank you so much for the two fantastic I&amp;D workshops you ran with our Canadian Board and ExCo this week. We had a great session with DNA and you as independents really got us engaged and excited. The involvement was excellent with a number of clear action items to help redefine our role and how we spend our time.</p><p>— Chief People Officer, AVIVA, Canada</p></blockquote>
<blockquote><p>The highest-value half day we have had for our understanding of Inclusion as part of the Board's legacy. Highly pragmatic with a great foundation for how we shape our brand as a PLC Board and a Leadership Team.</p><p>— Executive Chairman, Group Board, Global Financial Services Client, UK</p></blockquote>
<p>CorporateDNA knows all the processes, tools, and levers for highly experiential execution that delivers results. Here are our illustrative tools that activate the magic of the 5H©:</p>
<ul><li>Twin Tracks Roadmap</li><li>Unconscious Biases Model</li></ul>
<p>CorporateDNA offers a distinctive process of addressing I&amp;D needs through Twin Tracks of unbiasing the organization (fix lens) while building an Inclusive organization (builds lens). The Fix Track focuses on addressing bias, overhauling organizational fixed wiring, developing active listening, and scaling an inclusive, psychologically safe culture of feedback.</p>
<p>While most consulting firms focus on 'fixing' organizational culture, CorporateDNA goes beyond resolving immediate needs and blind spots. By integrating the "Build Track" into the I&amp;D program, we focus on constructing organizational culture and infrastructure for inclusion and diversity that is made to last, on top of creating strategy for the here-and-now. The "Build Track" is aimed at driving and sustaining performance, impact, and growth through your leaders' I&amp;D readiness. In addition, CorporateDNA navigates difficult conversations and facilitates self-reflection in leadership teams through the Unconscious Bias Triangle, which addresses different crucial aspects of individual and professional identities, through the lens of Self, Organization, and Theatre (i.e. Function and Region).</p>
<p>CorporateDNA's Inclusion &amp; Diversity program has proven successful through strong shifts in performance, indicated by greater risk-taking and innovative ideas, increase in speed of execution, and greater team engagement. More than 70% of candidates have expressed overall reform in organizational culture, e.g., real debate and less false harmony, and stripping out fear of failure, judgement, and rejection in favour of authenticity and confidence. CorporateDNA has also been rated one of the best providers to deliver a structured I&amp;D experience virtually with the same impact and ROI (face to face, live online, moderated online, or as self-directed learning).</p>
<p>CorporateDNA is invested in building inclusive leaders who are able to thrive in complexity (of identities, functions and lived experiences) while unifying their teams with purpose. This ensures that I&amp;D in leadership is not the 'brand' of an individual leader, but a commitment and accord that drives the team towards equity, accountability, and honouring others for their inherent value and potential.</p>
<p>In all of our programs we always:</p>
<ul><li>Leverage building inclusive leaders as a signature trait of an inclusive team.</li><li>Provide an individual opportunity for growth and discovery, rather than a cookie cutter program that drives compliance.</li><li>Provide impactful 1-1 coaching to catalyse shifts in building inclusive mindsets.</li><li>Go beyond normal unconscious bias training by uncaging where biases are born, and how they manifest in business.</li><li>Reframe bias from 'bad' to understanding it as "mental shortcuts" that compel decisions and choices that don't serve us best.</li><li>Create energy and self-investment for I&amp;D beyond HR or Group.</li><li>Construct exercises that always touch on the intrinsic 3-level interaction of Self, My Theatre, and the Organization as a whole.</li><li>Explore the 5H of Head, Heart, Hunch, Hands and Habits to make practical links to everyday decisions and choices.</li></ul>
<h3>Engage us when / What we deliver</h3>
<p><strong>You want to activate the highest leadership in your organization to role model I&amp;D, e.g., Executive Teams, PLC, Executive Committees, Group Leadership Teams, Regional Leadership Teams.</strong></p>
<p>We amplify, challenge, and accelerate the collective wisdom of senior leadership teams. CorporateDNA leads the team through an end to end I&amp;D roadmap, starting with personal and organizational bias identification, moving through to the removal of the barriers to access created by these biases. We focus on business-relevant outcomes, deepening the relationships within senior teams, and fostering greater organizational harmony.</p>
<p><strong>You want to activate and embed I&amp;D in a particular region, e.g., Asia Pacific Regional Teams, European Regional Teams, Sales and Marketing functions, Digital Transformation functions.</strong></p>
<p>Our I&amp;D program cuts across representational and functional biases. It is tailored to your regional business needs, completing the local culture, and aiming to deliver a robust pipeline of inclusive talent through an end-to-end leadership experience. We design client-centric I&amp;D roadmaps ranging from 3m to 18m designs, based on budget, availability, and resources.</p>
<p><strong>You want to impart unconscious bias training for the entire organization digitally.</strong></p>
<p>We deliver highly engaging bias training which defeats the #sameold diversity training, both in-room and online, using next generation tools to capture individual biases and playback organizational goals. Using AI-powered video interviews and multi-lingual transcription, it is possible to cover large workforce populations swiftly and efficiently. CorporateDNA can create digital assets to be embedded into an Organizational LMS or support hybrid learning solutions with a range of tools and real-time facilitation.</p>
<p><strong>You want to intentionally build I&amp;D as part of organizational growth strategy and business impact.</strong></p>
<p>Our inclusion-rich design makes diversity of composition and inclusion of diverse perspectives a central red thread of our leadership program – across gender, nationalities, and functions.</p>
<p><strong>Activate the Gender Track – you want to develop Women in Leadership as part of your I&amp;D program.</strong></p>
<p>We empower female leaders with access to tools that support resilience and psychological safety, align business outcomes with program outputs to ensure commercial relevancy, and support overcoming the impact of previous individual challenges to focus on future progression.</p>
<p><strong>Activate the Ethnicity Track – you want to intentionally build ethnic diversity as part of organizational growth strategy.</strong></p>
<p>Our acceleration programs for local high potential talent create fertile ground for individual growth while ensuring organizational values remain front of mind. We deepen the understanding of individual leadership styles, and the effect they can have on employees from diverse ethnic backgrounds.</p>
<p><strong>Activate the Youth Track – you want to intentionally develop young professionals across diverse groups, e.g. age and generational gaps, gender, ethnicity.</strong></p>
<p>Acceleration programs for local young talent who show potential through role mastery for the future, fostering a sense of belonging through the empowerment of next generation workers while supporting focused commercial output, and rounding off the hard skills with the key soft skills that enable accelerated growth to key leadership positions.</p>
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
  let updated = 0;
  let published = 0;
  let unchanged = 0;

  const data = (s: SolutionSeed) => ({
    title: s.title,
    problemStatement: s.problemStatement,
    body: s.body,
  });

  for (const s of SOLUTIONS) {
    // Upsert by (type, slug, locale). The earlier seeding left several entries
    // as stubs (title + problemStatement only, empty body), so an existing row
    // is UPDATED to the full content rather than skipped.
    const [existing] = await db
      .select({ id: contentEntries.id, status: contentEntries.status, data: contentEntries.data })
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
      const cur = existing.data as Record<string, string>;
      if (
        cur.title === s.title &&
        cur.problemStatement === s.problemStatement &&
        cur.body === s.body
      ) {
        console.log(`• same  ${s.slug} — content already up to date`);
        unchanged++;
        continue;
      }
      const upd = await updateEntry("solution", existing.id, {
        data: data(s),
        actorId: admin.id,
      });
      if (!upd.ok) {
        console.error(`✗ fail  ${s.slug} — validation:`, upd.errors);
        continue;
      }
      updated++;
      const pub = await publishEntry("solution", existing.id, admin.id);
      if (!pub.ok) {
        console.error(`  updated but NOT published ${s.slug}:`, pub.errors);
        continue;
      }
      published++;
      console.log(`✓ upd   ${s.slug} — updated & republished (${s.title})`);
      continue;
    }

    const result = await createEntry("solution", {
      data: data(s),
      locale: LOCALE,
      slug: s.slug,
      actorId: admin.id,
    });

    if (!result.ok) {
      console.error(`✗ fail  ${s.slug} — validation:`, result.errors);
      continue;
    }
    created++;

    const pub = await publishEntry("solution", result.entry.id, admin.id);
    if (!pub.ok) {
      console.error(`  created but NOT published ${s.slug}:`, pub.errors);
      continue;
    }
    published++;
    console.log(`✓ new   ${s.slug} — created & published (${s.title})`);
  }

  console.log(
    `\nSummary: ${created} created, ${updated} updated, ${published} published, ${unchanged} unchanged, of ${SOLUTIONS.length} total.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
