import { ref, computed } from 'vue';

// ── Progressive Habits: Ashish's Track — Master Operating Plan (Track 1 Home Base & Weekends) ──
export const ashishHabits = [
  // ── PHASE 1: SUNRISE & PHYSICAL AWAKENING (04:45–07:05) ──
  { id: 'a-64', name: '04:45 Bed Spinal Mobility (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Cat-cow, knees-to-chest, pelvic tilts, supine spinal twists. Decompresses spine before feet touch floor. Non-negotiable spinal preservation.' },
  { id: 'a-1',  name: '04:55 Alarm — Out of Bed', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Feet on floor immediately after mobility. Zero snooze. Sit up, stand, hydrate.' },
  { id: 'a-2',  name: '04:55 500ml Warm Water + Lemon + Sublingual B12 & ALA', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '500ml warm water + lemon + Sublingual Methylcobalamin B12 (1000 mcg) + Alpha Lipoic Acid on empty stomach.' },
  { id: 'a-5',  name: '05:00 MOVERS Sadhana — Padma Sadhana & Surya Namaskar (20 min)', points: 2, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Padma Sadhana sequence + 4–6 slow Surya Namaskars. Wakes up the spine gently with zero compressive shock.' },
  { id: 'a-55', name: '05:20 MOVERS Sadhana — Sudarshan Kriya & Pranayama (15 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '3-stage Pranayama with Ujjayi, Bhastrika rounds, Om chanting and Sudarshan Kriya. Floods tissues with oxygen, calms systemic inflammation.' },
  { id: 'a-54', name: '05:35 MOVERS Sadhana — Meditation & Deep Silence (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Rest in silent stillness post-Kriya. Settles autonomic nervous system before deep execution.' },
  { id: 'a-58', name: '05:45 MOVERS Sadhana — Mental Rehearsal & Stiffness Log (15 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Mentally rehearse today (ZoetiCoach, Digital Builders, Infosys syncs) + write stiffness minutes and 3 gratitudes.' },
  { id: 'a-3',  name: '06:00 Natural Sunlight & Horizon View (5 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Natural morning sunlight exposure; gaze at distant horizon to relax eye muscles and reset circadian rhythm.' },
  { id: 'a-4',  name: '06:05 Workout — Core & Calisthenics (30 min)', points: 2, daysOfWeek: [1, 3, 5], scheduleLabel: 'Mon, Wed, Fri', hint: 'M/W/F: 30m Core & Calisthenics (pull-ups, push-ups; strict zero heavy barbell deadlifts/squats).' },
  { id: 'a-72', name: '06:05 20-Min Spine Yoga Flow', points: 2, daysOfWeek: [2, 4], scheduleLabel: 'Tue, Thu', hint: 'T/Th: 20m restorative spine yoga (Bhujangasana, Marjariasana, Setu Bandhasana, Pawanmuktasana).' },
  { id: 'a-6',  name: '06:05 Saturday Low-Impact Cardio (35 min)', points: 2, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Saturday cardio: skipping, shadow footwork, bag technique. No road running (spinal protection).' },
  { id: 'a-60', name: '06:00 Sunday Restorative Yoga & Foam Rolling (40 min)', points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Sunday restorative active recovery: joint mobility, asanas, foam rolling, and spinal unloading.' },
  { id: 'a-7',  name: '06:35 10-Min Post-Workout Stretch & Foam Roll', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6], scheduleLabel: 'Mon–Sat', hint: 'Foam roll thoracic spine, hip flexors, hamstrings. Relieves desk posture load.' },
  { id: 'a-66', name: '06:45 Warm Sesame Abhyanga Joint Massage (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Warm sesame oil on joints, lower back, and scalp before shower to soothe joint stiffness.' },
  { id: 'a-9',  name: '06:55 Warm Shower & Morning Grooming (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Warm shower throughout; cool rinse on scalp only for hair and scalp vitality.' },

  // ── PHASE 2: NOURISHMENT & WORKSTATION SETUP (07:05–08:30) ──
  { id: 'a-8',  name: '07:05 Clean Breakfast — Soaked Nuts + Papaya + Protein + Ground Flaxseed', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Soaked nuts + fresh papaya + clean protein + 2 tbsp freshly ground flaxseed (soluble fibre + ALA omega-3 for LDL). Zero added sugar.' },
  { id: 'a-67', name: '07:25 Post-Breakfast Walk (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '10m post-meal stroll to blunt glucose spike (targets glucose 108 -> <95).' },
  { id: 'a-61', name: '07:35 Hydration Rail Setup (Fill 2L Mineral Bottle)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Fill 2L bottle with water, pink Himalayan salt & lemon. Start 3.0L daily hydration rail.' },
  { id: 'a-11', name: '07:45 Sprint Planning & Desk Setup (Humidifier ON)', points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Humidifier ON, screen 15–20° below eye level. Set top 3 priorities across ZoetiCoach, Digital Builders & Infosys.' },

  // ── PHASE 3: DAYTIME DEEP LAPTOP WORK (08:30–14:00) ──
  { id: 'a-12', name: '08:30 Deep Block 1: Product Build — ZoetiCoach & Digital Builders (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Heavy engineering, architecture & code for your businesses. Phone away in another room.' },
  { id: 'a-13', name: '10:15 Eye Rest, CCF Sip & Daily Multivitamin (Iron 0)', points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: '20-20-20 eye break + 10 blinks. Warm CCF infusion. Multivitamin (Iron STOPPED — Ferritin 68.7 replete).' },
  { id: 'a-14', name: '11:00 Deep Block 2: Business & Core Work (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Critical feature implementation, test suites, core Infosys tasks, and system optimization.' },
  { id: 'a-15', name: '12:30 Movement & Hydration Pause (15m)', points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Stand, stretch, drink mineral water, quick eye reset and standing back extension.' },
  { id: 'a-16', name: '12:45 Deep Block 3: Code & Review (75m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Code reviews, PR merges, automated deployments, and technical documentation.' },

  // ── PHASE 4: NOURISHMENT & AFTERNOON TASKS (14:00–18:15) ──
  { id: 'a-70', name: '13:45 Pre-Lunch Isabgol (1 tsp in 300ml warm water)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '1 heaped tsp psyllium husk in 300ml warm water 15m pre-lunch (LDL 146 -> <130 & glucose blunting). Keep 2h from supplements.' },
  { id: 'a-29', name: '14:00 Wholesome Lunch & Midday Supplements (D3 + Omega-3 + Curcumin)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Thick dal with 1 tsp ghee, barley/oats roti swap, cooked sabzi, curd. Take Vitamin D3 + Algal Omega-3 DHA/EPA + Curcumin with piperine.' },
  { id: 'a-68', name: '14:50 Post-Lunch Walk & Lubricating Eye Drops', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '10m stroll to blunt glucose spike. Instill preservative-free eye drops to restore tear film.' },
  { id: 'a-18', name: '15:15 Deep Block 4: Business Ops & Build (60m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Operations, client messaging, architecture documentation, venture backlog clearance.' },
  { id: 'a-53', name: '16:15 ★ Business Meetings / Deep Build (2 Hours, Alternate Days)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Alternate Days: 2h dedicated Business Meetings (in-person or online). Non-meeting days: uninterrupted deep engineering sprint.' },

  // ── PHASE 5: EVENING FITNESS, OFFICE WRAP & RESTORATION (18:15–22:00) ──
  { id: 'a-20', name: '18:15 Outdoor Fitness Walk (45m at Sunset)', points: 2, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '45m brisk outdoor walk at sunset. Distant horizon gaze and spinal decompression in fresh air.' },
  { id: 'a-17', name: '19:00 ★ Infosys Office Block: Meetings & Final Works (75m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Dedicated window for office deliverables: live meetings, team syncs, closing daily office work. (Light days: converts to business build).' },
  { id: 'a-71', name: '19:50 Pre-Dinner Isabgol (1 tsp, warm water)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Second dose of isabgol in warm water 15 min pre-dinner for evening metabolic and cholesterol control.' },
  { id: 'a-30', name: '20:15 Dinner with Soy Protein & Laptop Wrap', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Dinner with soy protein (chunks/tofu) + cooked vegetables + 10m stroll. Wrap daily commits and roadmap notes.' },
  { id: 'a-19', name: '21:00 ★ HARD LAPTOP SHUTDOWN (9:00 PM)', points: 2, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'All laptop work strictly concludes at 21:00. Non-negotiable screen-free buffer to protect eyes, nervous system, and sleep.' },
  { id: 'a-23', name: '21:00 Workspace Reset & 3 Wins Log (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Clean desk (10m), log 3 wins and 1 lesson. Layout next-day workout clothes & water bottle.' },
  { id: 'a-52', name: '21:15 Evening Supplement — Magnesium Glycinate', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Magnesium Glycinate in warm water or haldi milk. Eases muscle tension and deepens restorative sleep.' },
  { id: 'a-69', name: '21:30 Spinal Wind-Down (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Screen blackout. 10m spinal stretches: supine twists, legs-up-the-wall, child\'s pose.' },
  { id: 'a-63', name: '21:40 Heated Eye Mask Over Closed Lids (10 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '10 min heated eye compress to melt meibomian secretions and relieve high-laptop ocular strain.' },
  { id: 'a-27', name: '22:00 In Bed — Lights Out (7h Restorative Sleep Floor)', points: 2, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'In bed by 22:00 sharp. 7 hours of uninterrupted restorative sleep (22:00-05:00) is a clinical anti-inflammatory requirement.' },

  // ── ALL-DAY HEALTH & OCULAR GUARDRAILS ──
  { id: 'a-73', name: '3.0L Daily Hydration Rail Logged', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '3.0L daily minimum (500ml by 08:30 · 1.0L by 11:00 · 2.0L by 15:00 · 3.0L by 20:30). Stop 30m pre-meal, resume 45m post-meal.' },
  { id: 'a-65', name: '45-Minute Movement Timer Active', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Stand every 45 min during laptop work, walk 2-3 min, and do 1 gentle standing backward extension.' },
  { id: 'a-62', name: 'Preservative-Free Eye Drops (4× Daily: 09:00, 12:00, 15:00, 18:00)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: '1 drop in each eye 4 times daily across screen hours to maintain ocular tear film.' },
  { id: 'a-32', name: 'Strict Barbell Embargo (Calisthenics & Core Only)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Strictly zero heavy deadlifts, squats, or overhead barbell presses. Focus on pull-ups, push-ups, and core holds.' },
  { id: 'a-36', name: 'Clean Metabolic Nutrition (Zero Refined Sugar)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Zero candy, sodas, fried foods, bakery sweets. Whole foods, barley/oats, seeds, and healthy lipids only.' },
  { id: 'a-35', name: 'Daily Jyoti Appreciation & Couple Connection', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Express heartfelt appreciation to Jyoti. Quality connection and mutual encouragement.' },

  // ── SATURDAY SPRINT SPECIALIZATIONS ──
  { id: 'a-80', name: '08:30 Saturday Morning Laptop Build (4.0h)', points: 3, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Uninterrupted deep architecture and coding for ZoetiCoach & Digital Builders.' },
  { id: 'a-81', name: '12:30 Saturday Wholesome Lunch & Walk', points: 1, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Wholesome lunch + 15m walk.' },
  { id: 'a-82', name: '13:30 Saturday Afternoon Laptop Build (5.0h)', points: 3, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Feature engineering, automated tests, and product builds for your businesses.' },
  { id: 'a-83', name: '18:30 Saturday Fitness Walk & Sunset Posture Reset (45m)', points: 2, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: '45m brisk outdoor walk at sunset. Posture reset and spinal decompression.' },
  { id: 'a-84', name: '19:15 Saturday Wholesome Dinner & Walk', points: 1, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Wholesome dinner + 10m digestive walk.' },
  { id: 'a-85', name: '20:00 Saturday Night Laptop Sprint (60m to 21:00 Shutdown)', points: 2, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Code commits, PR reviews, daily wrap. Hard shutdown at 21:00 sharp.' },
  { id: 'a-59', name: '★ Weekend Couple Time & Relaxed Connection with Jyoti (90 min)', points: 3, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Protected Saturday daytime couple connection: quality conversation, tea together, relaxed shared activities.' },

  // ── SUNDAY SPRINT & MILESTONE SPECIALIZATIONS ──
  { id: 'a-86', name: '08:00 Sunday Early Laptop Build (1.5h)', points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Early feature development and tech backlog clearance for businesses.' },
  { id: 'a-40', name: '09:30 ★ Business Milestone Review (1h)', points: 3, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Progress audit across ZoetiCoach & Digital Builders, OKRs, weekly sprint planning.' },
  { id: 'a-87', name: '10:30 Sunday Laptop Sprint (1h Execution)', points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Immediate execution on roadmap priorities decided in milestone review.' },
  { id: 'a-38', name: '11:30 Meal Prep (2h Batch Cooking)', points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Cook 2–3 staple bases (sprouted moong, lentils, base gravies) to save 4 hours on weekdays.' },
  { id: 'a-74', name: '13:30 Sunday Lunch + Weekly Vitamin D3 Sachet (60,000 IU)', points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Weekly high-potency D3 sachet (60,000 IU) taken with healthy meal fats for bone, muscle & immune health.' },
  { id: 'a-88', name: '14:30 Sunday Afternoon Laptop Build (4.0h)', points: 3, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Core laptop engineering, UI polish, and backend deployments for businesses.' },
  { id: 'a-89', name: '18:30 Sunday Fitness Walk & Spine Decompression (45m)', points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: '45m brisk outdoor walk and spine decompression.' },
  { id: 'a-90', name: '19:15 Sunday Wholesome Dinner & Walk', points: 1, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Wholesome dinner + 10m digestive walk.' },
  { id: 'a-91', name: '20:00 Sunday Night Laptop Sprint (60m to 21:00 Shutdown)', points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Lock roadmap for upcoming week. Hard laptop shutdown at 21:00.' },

  // ── FRIDAY FINANCE ──
  { id: 'a-75', name: '25% Tax Set-Aside Transfer (44ADA)', points: 2, daysOfWeek: [5], scheduleLabel: 'Fri Only', hint: 'Transfer 25% of contract/professional receipts to separate untouchable tax reserve account under 44ADA.' },
];

// ── Jyoti's Track (37 activities) ──
export const jyotiHabits = [
  // ── MORNING & MIDDAY 05:00–14:45 (14 micro-steps) ──
  { id: 'j-1',  name: 'Protected Sleep Window — 05:00 to 08:00',         points: 2, hint: 'Uninterrupted morning sleep while Ashish handles morning routines and Shaarvi. Rest is the foundation of postpartum healing, milk supply, and energy.' },
  { id: 'j-2',  name: '08:00 Wake-Up & 500ml Water (5 min)',             points: 1, hint: 'Drink 500ml warm water upon waking at 08:00 to rehydrate and support digestion and milk production.' },
  { id: 'j-37', name: '08:00 Sublingual B12 — Methylcobalamin 1000 mcg', points: 3, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Take sublingual methylcobalamin 1000 mcg on waking (empty stomach). **Critical for nursing**: maternal B12 is 245 (low, MCV 101 ceiling) and passes directly into milk for Shaarvi\'s neurological development.' },
  { id: 'j-4',  name: '08:05 Career Focus — IBP Supply Planning Study (1h)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Ashish has Shaarvi solo 08:05–08:30. Protected 1-hour session for SAP IBP Supply Planning certification & case studies (widens from Demand to Demand + Supply for higher contract rates).' },
  { id: 'j-9',  name: '09:05 Shaarvi Bath — Abhyanga, Exercises & Play (40 min)', points: 3, hint: 'Hands-on routine with Shaarvi: warm oil abhyanga massage, vocal interaction, developmental exercises, and soothing warm bath.' },
  { id: 'j-41', name: '09:05 Shaarvi Tummy Time — 30–60 min Daily in Bursts', points: 2, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Short tummy time bursts on the play mat with a floor mirror, building towards 30–60 min total daily. Strengthens neck, shoulders, and motor control.' },
  { id: 'j-10', name: '09:45 Breakfast + Protein at Every Meal (30 min)', points: 1, hint: 'Nourishing breakfast with adequate protein (paneer, moong sprouts, curd, nuts). Lactation significantly raises protein requirements.' },
  { id: 'j-38', name: '09:45 Vitamin D3 + Algal DHA (with Breakfast)',    points: 2, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Daily Vitamin D3 + Algal DHA (vegetarian omega-3 passes into breast milk for Shaarvi\'s brain development) taken with nourishing breakfast containing healthy fats.' },
  { id: 'j-36', name: '10:15 Wash Shaarvi\'s Clothes (45 min)',          points: 1, hint: 'Wash and hang Shaarvi\'s clothes and essentials. Completes all active morning baby chores by 11:00 AM sharp.' },
  { id: 'j-11', name: '11:00 Settle Shaarvi for Nap (15 min)',           points: 2, hint: 'Settle Shaarvi into her crib/bed with gentle rocking, white noise, and cozy sleep environment for her midday rest.' },
  { id: 'j-12', name: '11:15 Own Bath & Room Cleanup (1h45m)',           points: 2, hint: 'While Shaarvi naps: take your own relaxed warm bath, personal grooming, and tidy up the room till 13:00.' },
  { id: 'j-42', name: '12:00 Gayatri Mantra with Shaarvi (3 or 11 Times)', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Midday shloka: chant Gayatri Mantra 3 or 11 times with Shaarvi. Rhythmic Sanskrit chanting is deeply calming for infants and anchors midday rhythm.' },
  { id: 'j-14', name: '13:00 Creative Project / Personal Development (1h)', points: 1, hint: 'Spend this quiet hour on self-directed creative projects, learning, journaling, or portfolio work leading into 14:00 lunch.' },
  { id: 'j-6',  name: '14:00 Lunch with Ashish — Nourishing Meal (45 min)', points: 1, hint: 'Nutrient-rich lunch with Ashish at 2:00 PM: dal, protein, healthy fats (ghee/nuts), cooked vegetables, and curd. Relax and enjoy a shared mindful meal.' },

  // ── AFTERNOON & EVENING 16:00–21:30 (9 micro-steps) ──
  { id: 'j-15', name: '16:00 Shaarvi Afternoon Feed & Stroller Walk',    points: 1, hint: 'Afternoon feeding session followed by fresh air stroll in the stroller around the neighborhood.' },
  { id: 'j-16', name: '17:00 20-Min Postpartum Pelvic & Core Movement',  points: 2, hint: 'Gentle postpartum yoga, pelvic floor rehab, kegels, and diaphragmatic breathing.' },
  { id: 'j-17', name: '17:30 Fresh Fruit & Hydration Snack',             points: 1, hint: 'Fresh seasonal fruit (papaya, apple, pear, pomegranate) with handful of almonds/walnuts and 300ml water.' },
  { id: 'j-18', name: '18:35 Joint Family Stroller Walk with Ashish',     points: 1, hint: 'Evening family walk together with Ashish & Shaarvi. Connect and enjoy the evening sights and sounds.' },
  { id: 'j-19', name: '19:25 Dinner Preparation & Shared Family Dinner',  points: 1, hint: 'Enjoy a light, nourishing home-cooked dinner with Ashish. Unwind and team up in the kitchen together.' },
  { id: 'j-20', name: '20:15 Post-Dinner Stroll with Ashish (15 min)',   points: 1, hint: 'Short 15-minute relaxed walk after dinner to aid digestion and spend peaceful couple time together.' },
  { id: 'j-21', name: '20:45 Shaarvi Bedtime — Board Book, Feed, Dark Room & Sarve Bhavantu Shloka', points: 2, hint: 'Dim room lights, read board book, final feed, swaddle/sleep sack, and close with "Sarve bhavantu sukhinaḥ, sarve santu nirāmayāḥ".' },
  { id: 'j-40', name: '21:15 Night Supplement — Magnesium Glycinate',    points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Magnesium glycinate with warm half-milk-half-water. Relaxes muscles, supports deep sleep cycles, and aids enzymatic function (low ALP).' },
  { id: 'j-22', name: '21:30 Lights Out & Sleep (Target 7h Floor)',      points: 2, hint: 'Screens away, room cool and dark. Get into bed by 21:30 to maximize deep sleep before morning.' },

  // ── NUTRITION, HYDRATION & RECOVERY — ALL DAY (7 habits) ──
  { id: 'j-23', name: '3.5L Daily Water Intake Tracked',                 points: 1, hint: 'Drink 3.5 litres of water throughout the day. Keep your marked water bottle filled and beside you (crucial for lactation).' },
  { id: 'j-24', name: 'B12, Zinc & Folate Rich Nutrition Plan',          points: 1, hint: 'No iron problem (iron 89, Hb 13.1 normal). Focus on zinc (soaked/sprouted pumpkin seeds, sesame, legumes), folate (steamed greens, dal, citrus), and clean proteins.' },
  { id: 'j-43', name: 'Zinc & Folate Rich Foods (Lactation Nutrition)',   points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'Deliberate zinc & folate intake: pumpkin seeds, til, cashews, soaked chana/rajma, paneer, steamed palak. Reverses low ALP (11 U/L) and macrocytosis.' },
  { id: 'j-25', name: '5-Minute Mother Gratitude & Mood Journal',         points: 1, hint: 'Write down 3 moments that brought you joy today and 1 reminder that you are doing an amazing job.' },
  { id: 'j-26', name: 'Zero Screens While Nursing Shaarvi',              points: 2, hint: 'Put phone away while feeding Shaarvi. Eye-to-eye contact during feeding deepens mother-baby bond and oxytocin.' },
  { id: 'j-27', name: 'Daily Ashish Connection & Check-In',              points: 1, hint: 'Share how your day felt with Ashish. Talk about feelings, dreams, and team up on household plans.' },
  { id: 'j-28', name: 'No Refined Sugar / Processed Foods Today',        points: 1, hint: 'Stick to wholesome, natural foods. Avoid sugary sodas, packaged chips, and processed bakery treats.' },

  // ── WEEKLY RECURRING (8 habits) ──
  { id: 'j-29', name: '★ Board Meeting with Ashish (45 min, Hard Stop)',  points: 3, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Sunday couple review: sync on baby schedule, celebrate weekly wins, align on health & household goals. 45m hard stop.' },
  { id: 'j-39', name: 'Weekly Vitamin D3 Sachet (Repletion, 8 Weeks)',    points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Weekly high-dose D3 sachet (confirm lactation dose with paediatrician) taken with Sunday meal for 8-week repletion (current 20.63 ng/mL).' },
  { id: 'j-30', name: '★ Date Night / Couple Window (2h)',               points: 3, daysOfWeek: [5], scheduleLabel: 'Fri Date Night', hint: 'Dedicated 2-hour date night with Ashish. Relax, laugh, and enjoy each other\'s company.' },
  { id: 'j-31', name: 'Personal Pampering & Self-Care Ritual (1h)',       points: 2, daysOfWeek: [0, 6], scheduleLabel: 'Sat–Sun', hint: '1 full hour just for yourself: hair mask, skincare ritual, warm bath, or reading your favorite book.' },
  { id: 'j-32', name: 'Shaarvi Developmental Milestone Log',              points: 1, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Record Shaarvi\'s new sounds, motor achievements, smiles, and funny moments in her baby journal.' },
  { id: 'j-33', name: '★ Protected Personal Block (3h, 16:00–19:00) — Ashish on Solo Baby Duty', points: 3, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Protected 3 hours on Saturday (16:00–19:00) for creative work, portfolio building, or personal rest while Ashish takes 100% solo Shaarvi care.' },
  { id: 'j-34', name: 'Shaarvi Sensory & Nature Outing',                  points: 2, daysOfWeek: [0, 6], scheduleLabel: 'Sat–Sun', hint: 'Weekend sensory trip to a park, garden, or family outing to expose Shaarvi to new nature textures.' },
  { id: 'j-35', name: '★ Weekend Couple Time & Connection with Ashish (90 min)', points: 3, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Protected Saturday afternoon couple window with Ashish: relax, talk about dreams, enjoy tea together, and connect with zero weekday distractions.' },
];

// ── Track 2: Chandigarh Solo Sprint — Monday Transit, Infosys 4h Shift & Flat Build Studio ──
export const ashishTravelHabits = [
  // ── PRE-DEPARTURE 04:45–05:30 ──
  { id: 'at-1',  name: '04:45 Bed Spinal Mobility (10 min)', points: 1, hint: 'Cat-cow, knees-to-chest, pelvic tilts, supine twist. Essential spinal decompression before sitting for 3-hour transit.' },
  { id: 'at-2',  name: '04:55 500ml Warm Water + Lemon + Sublingual B12 & ALA', points: 1, hint: 'Warm water with lemon. Take sublingual B12 (1000 mcg) and Alpha Lipoic Acid on empty stomach.' },
  { id: 'at-3',  name: '05:00 Sudarshan Kriya & MOVERS Sadhana (20 min)', points: 2, hint: 'Pranayama, Bhastrika rounds, Sudarshan Kriya, deep silence & stiffness log.' },
  { id: 'at-4',  name: '05:20 Light Snack, Hydration & Car Load (Lumbar Cushion)', points: 1, hint: 'Light snack/nuts, pack 2L mineral bottle (salt + lemon), prepped food, and lumbar cushion in driver seat.' },

  // ── TRANSIT & INFOSYS 4H SHIFT 05:30–13:00 ──
  { id: 'at-9',  name: '05:30 Outbound Drive: Ludhiana → Chandigarh (Audio/Calls)', points: 2, hint: '05:30–08:45 drive with active lumbar cushion behind lower back. Steady hydration sips.' },
  { id: 'at-10', name: '08:45 3-Min Standing Back Extension on Arrival', points: 1, hint: 'Before entering campus. Decompresses lower back after 3-hour transit drive.' },
  { id: 'at-11', name: '09:00 ★ Infosys On-Site 4h Shift (09:00–13:00)', points: 3, hint: 'High-focus office deliverables. Stand every 45 min; preservative-free eye drops at 09:30 & 12:00.' },

  // ── FLAT STUDIO AFTERNOON & BUILD SPRINTS 13:00–18:15 ──
  { id: 'at-12', name: '13:00 Drive to Flat & Standing Extension (30m)', points: 1, hint: 'Drive from campus to flat. 3-minute standing back extension before entering.' },
  { id: 'at-13', name: '13:30 Unpack, Eat Ludhiana Lunch & Studio Desk Setup', points: 1, hint: 'Unpack bags, eat packed home lunch from Ludhiana, humidifier ON, laptop stand adjusted.' },
  { id: 'at-14', name: '14:15 ★ Afternoon Laptop Build Block (2.0h) — Businesses', points: 3, hint: 'All afternoon free time routes straight into laptop engineering for ZoetiCoach & Digital Builders.' },
  { id: 'at-15', name: '16:15 ★ Business Meetings / Build Window (2.0h, Alternate Days)', points: 2, hint: 'Alternate Days: 2h business meetings (online from flat or physical in tricity). Non-meeting days: deep build sprint.' },

  // ── EVENING FITNESS, OFFICE WRAP & 21:00 SHUTDOWN 18:15–22:00 ──
  { id: 'at-16', name: '18:15 Outdoor Fitness Walk in Neighborhood (45m)', points: 2, hint: '45m brisk outdoor walk at sunset. Distant horizon gaze & spinal decompression in fresh air.' },
  { id: 'at-17', name: '19:00 ★ Infosys Evening Office Block (75m from Flat)', points: 2, hint: 'Online office syncs, team check-ins, and closing daily deliverables from flat.' },
  { id: 'at-18', name: '20:15 Quick 1-Pot Dinner & Laptop Wrap', points: 1, hint: 'Simple high-protein 1-pot dinner (soya/paneer) + 10m stroll. Wrap daily notes and commits.' },
  { id: 'at-19', name: '21:00 ★ HARD LAPTOP SHUTDOWN (9:00 PM)', points: 2, hint: 'All laptop work strictly concludes at 21:00. Non-negotiable screen-free buffer.' },
  { id: 'at-20', name: '21:00 Flat Reset & Magnesium Glycinate Drink', points: 1, hint: 'Wash dishes immediately (chore zero-state), desk reset, magnesium glycinate in warm water.' },
  { id: 'at-21', name: '21:30 Spinal Wind-Down & Heated Eye Mask (20m)', points: 1, hint: '10m supine twists/legs-up-the-wall + 10m heated eye mask over closed lids.' },
  { id: 'at-22', name: '22:00 In Bed — Lights Out (7h Restorative Sleep)', points: 2, hint: 'In bed with complete darkness. 7 hours of sleep protected for tomorrow morning build.' },

  // ── HEALTH & FLAT DISCIPLINES ──
  { id: 'at-25', name: '3.0L Daily Hydration Rail Logged (2L Bottle in Car)', points: 1, hint: 'Keep 2L bottle in car. Sip throughout transit and flat. Never fridge-cold.' },
  { id: 'at-28', name: 'Clean 1-Pot Whole Food Nutrition (Zero Junk)', points: 1, hint: 'Zero junk food. Clean, warm, high-protein 1-pot meals only on travel days.' },
];

// ── Track 2: Chandigarh Solo Sprint — Tuesday–Thursday (Flat Studio + Infosys 4h) ──
export const ashishOfficeMidHabits = [
  // ── MORNING SADHANA & VITALITY 05:00–08:00 ──
  { id: 'ao-1',  name: '05:00 Bed Spinal Mobility (10 min)', points: 1, hint: 'Cat-cow, knees-to-chest, pelvic tilts, supine twist. Decompress spine before feet touch floor.' },
  { id: 'ao-2',  name: '05:10 500ml Warm Water + Lemon + Sublingual B12 & ALA', points: 1, hint: 'Sublingual B12 (1000 mcg) and Alpha Lipoic Acid with warm lemon water.' },
  { id: 'ao-3',  name: '05:15 MOVERS Sadhana (Padma Sadhana, Kriya & Meditation)', points: 2, hint: 'Padma Sadhana (20m) → Sudarshan Kriya (15m) → Meditation (10m) at flat.' },
  { id: 'ao-4',  name: '06:00 Workout / Spine Yoga & Shower (35m)', points: 2, hint: 'Core calisthenics or gentle spine yoga (zero heavy spinal loads) → Warm shower.' },
  { id: 'ao-7',  name: '07:05 Clean Breakfast & Quick 1-Pot Prep (Flaxseed)', points: 1, hint: 'Papaya, soaked nuts, clean protein + 2 tbsp ground flaxseed. 10m walk + quick meal prep.' },

  // ── MORNING LAPTOP BUILD BLOCK AT FLAT 08:00–10:30 (2.5h) ──
  { id: 'ao-14', name: '08:00 ★ MORNING LAPTOP BUILD BLOCK (2.5h Uninterrupted)', points: 3, hint: 'All morning free time channels into heavy coding, architecture and features for ZoetiCoach & Digital Builders at flat.' },

  // ── INFOSYS 4H ON-SITE SHIFT 10:30–15:00 ──
  { id: 'ao-9',  name: '10:30 Drive Flat → Infosys Campus (30 min)', points: 1, hint: 'Drive to Infosys campus with active lumbar cushion.' },
  { id: 'ao-10', name: '11:00 ★ Infosys 4h On-Site Shift (11:00–15:00)', points: 3, hint: 'High-intensity office deliverables. Stand every 45 min; eye drops at 11:30 & 14:00.' },
  { id: 'ao-12', name: '15:00 Drive Infosys Campus → Flat (30 min)', points: 1, hint: 'Drive back to flat. 3-min standing back extension upon arrival.' },
  { id: 'ao-13', name: '15:30 Quick Chore Check & Async Office Wrap (45m)', points: 1, hint: 'Zero-state kitchen check, hydration refill, quick async check.' },

  // ── PRIME BUSINESS SPRINT & MEETINGS 16:15–18:15 ──
  { id: 'ao-17', name: '16:15 ★ PRIME BUSINESS SPRINT & MEETINGS (2.0h)', points: 3, hint: 'Alternate Days: 2h Business Meetings (physical in tricity or online). Non-meeting days: deep laptop build.' },

  // ── EVENING FITNESS, OFFICE WRAP & 21:00 SHUTDOWN 18:15–22:00 ──
  { id: 'ao-23', name: '18:15 Outdoor Fitness Walk in Fresh Air (45m)', points: 2, hint: '45m brisk walk at sunset. Distant gaze and spinal decompression.' },
  { id: 'ao-20', name: '19:00 ★ Infosys Evening Office Block (75m from Flat)', points: 2, hint: 'Evening office meetings, syncs, and closing daily deliverables from flat.' },
  { id: 'ao-24', name: '20:15 Simple 1-Pot Dinner with Soy Protein & Wrap', points: 1, hint: '20:00 Isabgol → Simple 1-pot dinner with soya/paneer + 10m digestive walk. Daily wrap.' },
  { id: 'ao-21', name: '21:00 ★ HARD LAPTOP SHUTDOWN (9:00 PM)', points: 2, hint: 'Hard laptop power off. Zero screens. 60-minute wind-down buffer before sleep.' },
  { id: 'ao-28', name: '21:00 Space Reset & Magnesium Glycinate Drink', points: 1, hint: 'Immediate chore zero-state (clean plates/pots), magnesium glycinate in warm water.' },
  { id: 'ao-25', name: '21:30 Spinal Stretch & Heated Eye Mask (20m)', points: 1, hint: '10m supine twists/legs-up-wall + 10m heated eye mask over closed lids.' },
  { id: 'ao-29', name: '22:00 In Bed — Lights Out (7h Restorative Sleep)', points: 2, hint: 'In bed with lights out by 22:00 sharp.' },

  // ── HEALTH & FLAT DISCIPLINES ──
  { id: 'ao-30', name: '3.0L Daily Water Protocol (Warm/Room Temp)', points: 1, hint: 'Keep 2L bottle at flat & campus. Sip throughout. Never fridge-cold.' },
  { id: 'ao-32', name: 'Movement Break Every 45 Minutes', points: 1, hint: 'Repeating timer. Stand, walk 2-3m, gentle standing backward extension.' },
  { id: 'ao-33', name: '1-Pot High-Nutrient Nutrition (Zero Junk)', points: 1, hint: 'Clean whole foods. No junk food or processed snacks.' },
];

// ── Track 2: Chandigarh Solo Sprint — Friday (Checkout, Infosys Shift & Return Drive) ──
export const ashishOfficeFriHabits = [
  // ── MORNING & FLAT CHECKOUT 05:00–09:30 ──
  { id: 'af-1',  name: '05:00 Bed Spinal Mobility & Morning Sadhana', points: 2, hint: 'Spinal mobility → Warm water + B12/ALA → MOVERS Sadhana at flat.' },
  { id: 'af-7',  name: '07:05 Clean Breakfast + Flaxseed & Grooming', points: 1, hint: 'Nutrient-dense breakfast + 2 tbsp ground flaxseed. Warm shower.' },
  { id: 'af-8',  name: '08:30 Flat Checkout & Packing (Chore Zero-State)', points: 1, hint: 'Pack bags, clean kitchen, clear trash, lock flat, load car with lumbar cushion.' },
  { id: 'af-9',  name: '09:30 Drive Flat → Infosys Campus (30 min)', points: 1, hint: 'Drive to campus with active lumbar support.' },

  // ── INFOSYS 4H SHIFT 10:00–14:00 ──
  { id: 'af-10', name: '10:00 ★ Infosys 4h Shift: Weekly Deliverables Wrap', points: 3, hint: '10:00–14:00 weekly deliverables wrap. Stand every 45 min; eye drops at 10:30 & 13:00.' },

  // ── RETURN DRIVE TO LUDHIANA (2:00–5:00 PM) 14:00–17:00 ──
  { id: 'af-12', name: '14:00 ★ RETURN DRIVE TO LUDHIANA (14:00–17:00)', points: 2, hint: 'Drive CHD → Ludhiana (2:00–5:00 PM). Active lumbar cushion, educational podcasts, steady hydration.' },

  // ── HOMECOMING & EVENING 17:00–22:00 ──
  { id: 'af-13', name: '17:00 Home Arrival & 15m Spinal Decompression', points: 1, hint: 'Arrive Ludhiana home. 15m spinal foam rolling and legs-up-the-wall after drive.' },
  { id: 'af-16', name: '17:30 ★ HOMECOMING LAPTOP BUILD (45m) — Businesses', points: 2, hint: 'Channel evening free time into laptop development for ZoetiCoach & Digital Builders.' },
  { id: 'af-21', name: '18:15 Outdoor Fitness Walk & Sunset Posture Reset (45m)', points: 2, hint: '45m brisk outdoor walk at sunset. Horizon view and spinal decompression.' },
  { id: 'af-18', name: '19:00 Weekly Office Handoffs & Syncs (75m)', points: 2, hint: 'Close weekly office threads and syncs (or weekend transition).' },
  { id: 'af-23', name: '20:15 Wholesome Dinner & Daily Wrap', points: 1, hint: 'Wholesome dinner with family + 10m digestive stroll. Daily wrap.' },
  { id: 'af-20', name: '21:00 ★ HARD LAPTOP SHUTDOWN (9:00 PM)', points: 2, hint: 'Strict 21:00 laptop shutdown. Disconnect completely for the weekend.' },
  { id: 'af-27', name: '21:00 Home Comfort Wind-Down & Magnesium Drink', points: 1, hint: 'Magnesium glycinate in warm water/haldi milk. Reflect on wins.' },
  { id: 'af-28', name: '21:30 Spinal Wind-Down & Heated Eye Mask (20m)', points: 1, hint: 'Supine twist, legs up wall, 10m heated eye compress over closed eyelids.' },
  { id: 'af-29', name: '22:00 In Bed — Lights Out (7h Restorative Sleep)', points: 2, hint: 'Lights out by 22:00. Welcome home restorative sleep.' },

  // ── HEALTH & FINANCE ──
  { id: 'af-30', name: '3.0L Daily Water Protocol (2L Bottle in Car)', points: 1, hint: 'Keep 2L bottle in car. Sip throughout transit. Never fridge-cold.' },
  { id: 'af-34', name: '25% Tax Set-Aside Transfer (44ADA)', points: 2, hint: 'Friday finance: transfer 25% of contract/professional receipts to untouchable tax reserve.' },
];

// ── Ashish Half-Day Routine (WFH Ludhiana — Light Office + Business Build Sprints) ──
export const ashishHalfDayHabits = [
  // ── MORNING 04:45–08:30 ──
  { id: 'a-64', name: '04:45 Bed Spinal Mobility (10 min)', points: 1, hint: 'Cat-cow, knees-to-chest, pelvic tilts, supine twist.' },
  { id: 'a-1',  name: '04:55 Alarm — Out of Bed', points: 1, hint: 'Zero snooze. Hydrate immediately.' },
  { id: 'a-2',  name: '04:55 500ml Warm Water + Lemon + Sublingual B12 & ALA', points: 1, hint: 'B12 (1000 mcg) + ALA with warm lemon water.' },
  { id: 'a-5',  name: '05:00 MOVERS Sadhana — Padma Sadhana & Surya Namaskar (20 min)', points: 2, hint: 'Padma Sadhana sequence + 4-6 slow Surya Namaskars.' },
  { id: 'a-55', name: '05:20 MOVERS Sadhana — Sudarshan Kriya & Pranayama (15 min)', points: 1, hint: 'Sudarshan Kriya and oxygenation.' },
  { id: 'a-54', name: '05:35 MOVERS Sadhana — Meditation & Deep Silence (10 min)', points: 1, hint: 'Silent stillness post-Kriya.' },
  { id: 'a-3',  name: '06:00 Natural Sunlight & Horizon View (5 min)', points: 1, hint: 'Circadian light reset.' },
  { id: 'a-4',  name: '06:05 Workout — Core & Calisthenics (30 min)', points: 2, hint: 'Core stability and calisthenics (zero heavy barbells).' },
  { id: 'a-7',  name: '06:35 10-Min Post-Workout Stretch & Foam Roll', points: 1, hint: 'Foam roll thoracic spine, hip flexors, hamstrings.' },
  { id: 'a-66', name: '06:45 Warm Sesame Abhyanga Joint Massage (10 min)', points: 1, hint: 'Warm sesame oil on joints and back.' },
  { id: 'a-9',  name: '06:55 Warm Shower & Morning Grooming', points: 1, hint: 'Warm bath and scalp care.' },
  { id: 'a-8',  name: '07:05 Clean Breakfast + Flaxseed (2 tbsp)', points: 1, hint: 'Soaked nuts, papaya, protein, ground flaxseed.' },
  { id: 'a-67', name: '07:25 Post-Breakfast Walk (10 min)', points: 1, hint: 'Glucose blunting walk.' },
  { id: 'a-61', name: '07:35 Hydration Rail Setup (Fill 2L Bottle)', points: 1, hint: 'Fill 2L mineral bottle.' },
  { id: 'a-11', name: '07:45 Sprint Planning & Desk Setup (Humidifier ON)', points: 1, hint: 'Set top 3 priorities across ventures.' },

  // ── MORNING FOCUS 08:30–14:00 ──
  { id: 'a-12', name: '08:30 Deep Block 1: Product Build — ZoetiCoach & Digital Builders (90m)', points: 2, hint: 'Core product architecture & code.' },
  { id: 'a-13', name: '10:15 Eye Rest, CCF Sip & Daily Multivitamin (Iron 0)', points: 1, hint: '20-20-20 eye break, CCF sip, multivitamin.' },
  { id: 'a-14', name: '11:00 Deep Block 2: Business & Core Work (90m)', points: 2, hint: 'Core feature implementation & reviews.' },
  { id: 'a-16', name: '12:45 Deep Block 3: Code & Review (75m)', points: 2, hint: 'Automated tests & PR merges.' },
  { id: 'a-70', name: '13:45 Pre-Lunch Isabgol (1 tsp, warm water)', points: 1, hint: 'Isabgol 15 min pre-meal.' },
  { id: 'a-29', name: '14:00 Wholesome Lunch & Midday Supplements', points: 1, hint: 'Dal, sabzi, roti, D3 + Omega-3 + Curcumin.' },
  { id: 'a-68', name: '14:50 Post-Lunch Walk & Lubricating Eye Drops', points: 1, hint: 'Walk + eye drops.' },

  // ── HALF-DAY AFTERNOON BUILD PIVOT 15:15–18:15 ──
  { id: 'ah-1', name: '15:15 ★ Creative Venture Build & Features (90 min)', points: 2, hint: 'High-leverage engineering for ZoetiCoach & Digital Builders.' },
  { id: 'ah-2', name: '16:45 ★ Content & System Architecture (45 min)', points: 2, hint: 'Technical docs, pipeline design, partner communications.' },
  { id: 'ah-3', name: '17:30 Personal Tasks & Workstation Wrap (45 min)', points: 1, hint: 'Wrap half-day personal admin and workstation clean.' },

  // ── EVENING & 21:00 SHUTDOWN 18:15–22:00 ──
  { id: 'a-20', name: '18:15 Outdoor Fitness Walk (45m at Sunset)', points: 2, hint: 'Brisk walk and horizon view.' },
  { id: 'a-17', name: '19:00 Office Handoffs & Live Syncs (60m)', points: 2, hint: 'Close office deliverables.' },
  { id: 'a-30', name: '20:15 Dinner with Soy Protein & Wrap', points: 1, hint: 'Nourishing dinner + 10m walk.' },
  { id: 'a-19', name: '21:00 ★ HARD LAPTOP SHUTDOWN (9:00 PM)', points: 2, hint: 'Hard shutdown at 21:00.' },
  { id: 'a-23', name: '21:00 Workspace Reset & 3 Wins Log', points: 1, hint: 'Desk clean, log 3 wins.' },
  { id: 'a-52', name: '21:15 Evening Supplement — Magnesium Glycinate', points: 1, hint: 'Magnesium in warm water/milk.' },
  { id: 'a-69', name: '21:30 Spinal Wind-Down (10 min)', points: 1, hint: 'Supine twist and legs-up-the-wall.' },
  { id: 'a-63', name: '21:40 Heated Eye Mask Over Closed Lids (10 min)', points: 1, hint: 'Heated eye compress.' },
  { id: 'a-27', name: '22:00 In Bed — Lights Out (7h Sleep)', points: 2, hint: 'Lights out by 22:00.' },
  { id: 'a-73', name: '3.0L Daily Hydration Rail Logged', points: 1, hint: '3L daily water target.' },
  { id: 'a-65', name: 'Movement Break Every 45 Minutes', points: 1, hint: 'Stand, walk, gentle back extension.' },
];

// ── Ashish Holiday Routine (Spiritual / Festive / Restorative — Zero Office Work) ──
export const ashishHolidayHabits = [
  { id: 'a-64', name: '04:45 Bed Spinal Mobility (10 min)', points: 1, hint: 'Cat-cow, knees-to-chest, pelvic tilts, supine twist.' },
  { id: 'a-1',  name: '05:00 Gentle Wake-up & Gratitude', points: 1, hint: 'Peaceful holiday morning wake-up.' },
  { id: 'a-2',  name: '05:05 500ml Warm Water + Lemon + Sublingual B12 & ALA', points: 1, hint: 'Sublingual B12 and ALA with warm water and lemon.' },
  { id: 'a-5',  name: '05:15 MOVERS Sadhana — Deep Padma Sadhana (30m)', points: 3, hint: 'Unrushed holiday Padma Sadhana + Surya Namaskars.' },
  { id: 'a-55', name: '05:45 MOVERS Sadhana — Sudarshan Kriya (20 min)', points: 2, hint: 'Deep Sudarshan Kriya and Pranayama.' },
  { id: 'a-54', name: '06:05 MOVERS Sadhana — Meditation & Stillness (15 min)', points: 2, hint: 'Extended silent meditation.' },
  { id: 'a-3',  name: '06:20 Sunlight, Nature & Horizon View (15 min)', points: 1, hint: 'Morning sunlight and fresh air.' },
  { id: 'a-66', name: '06:40 Relaxed Full-Body Abhyanga (20 min)', points: 2, hint: 'Spacious warm sesame oil massage on joints and back.' },
  { id: 'a-9',  name: '07:00 Warm Shower & Festive Grooming', points: 1, hint: 'Nourishing warm bath.' },
  { id: 'a-8',  name: '07:30 Festive / Healthy Family Breakfast + Flaxseed', points: 1, hint: 'Whole food breakfast with family + ground flaxseed.' },
  { id: 'a-50', name: '10:30 Family Outing / Park / Nature Walk (60 min)', points: 2, hint: 'Family walk in botanical garden or park.' },
  { id: 'a-70', name: '13:15 Isabgol Before Lunch', points: 1, hint: 'Isabgol in warm water before meal.' },
  { id: 'a-29', name: '13:30 Festive Shared Lunch with Family', points: 2, hint: 'Wholesome festive lunch cooked with love.' },
  { id: 'a-51', name: '14:30 Midday Supplement — D3 + Omega-3', points: 1, hint: 'Take with festive lunch.' },
  { id: 'a-68', name: '14:45 Post-Lunch Family Stroll (15 min)', points: 1, hint: 'Digestive stroll.' },
  { id: 'ah-1', name: '15:30 Creative Passion / Reading / Personal Build (90m)', points: 2, hint: 'Inspiring personal build or reading.' },
  { id: 'a-20', name: '18:00 Sunset Outdoor Fitness Walk (45m)', points: 2, hint: 'Extended evening walk in golden hour.' },
  { id: 'a-71', name: '19:00 Isabgol Before Dinner', points: 1, hint: 'Isabgol in warm water before dinner.' },
  { id: 'a-21', name: '19:15 Festive Dinner & Quality Connection', points: 2, hint: 'Nourishing shared dinner.' },
  { id: 'a-22', name: '20:15 Post-Dinner Family Walk (20 min)', points: 1, hint: 'Digestive stroll under night sky.' },
  { id: 'a-24', name: '21:00 Holiday Gratitude & 3 Wins Journaling', points: 1, hint: 'Reflect on family joy and spiritual connection.' },
  { id: 'a-52', name: '21:15 Magnesium Glycinate + Warm Haldi Milk', points: 1, hint: 'Deep relaxation before sleep.' },
  { id: 'a-69', name: '21:25 Restorative Spinal Wind-Down (15 min)', points: 1, hint: 'Supine twist, legs up wall, child\'s pose.' },
  { id: 'a-27', name: '21:45 Restful Holiday Sleep (8h target)', points: 2, hint: 'Deep restorative sleep.' },
  { id: 'a-73', name: '3 Litres Daily Water Protocol Logged', points: 1, hint: 'Sip steadily throughout the day.' },
  { id: 'a-35', name: 'Daily Jyoti Appreciation & Love', points: 1, hint: 'Heartfelt appreciation and connection.' },
];

// ── Generic Starter Habits (7 simple starter habits) ──
export const genericStarterHabits = [
  { id: 'g-1', name: 'Morning water & stretch (10 min)',   points: 1, hint: 'Drink a glass of water first thing. Spend 10 min stretching or doing light movement.' },
  { id: 'g-2', name: 'Daily exercise (30 min)',            points: 2, hint: 'Any form of exercise: walk, run, gym, yoga, sport. Just move with intent for 30 min.' },
  { id: 'g-3', name: 'Eat 1 healthy, balanced meal',       points: 1, hint: 'At least one meal today focused on real food: protein + vegetables + complex carbs.' },
  { id: 'g-4', name: 'Deep focus block (60 min)',          points: 3, hint: '60 min of uninterrupted work on your most important task. Phone on silent, notifications off.' },
  { id: 'g-5', name: 'Read for 15 minutes',                points: 1, hint: 'Read a book (not social media). Fiction or non-fiction, 15 min minimum.' },
  { id: 'g-6', name: 'Plan tomorrow (5 min)',              points: 1, hint: 'Write down your top 3 priorities for tomorrow. Takes 5 min, saves 30 min of decision-making.' },
  { id: 'g-7', name: 'Lights out by target time',          points: 2, hint: 'Pick your target bedtime and stick to it. Screens off 30 min before. Room dark and cool.' },
];

export const ashishTierDescriptions = {
  'a-1':  ['Alarm off, out of bed by 5:30', 'Out of bed by 5:15', 'Out of bed by 5:00 after mobility', '04:55 sharp + zero snooze all week'],
  'a-2':  ['Drink 250ml warm water', '500ml warm water', '500ml warm + lemon + Sublingual B12 & ALA', '500ml warm + lemon + Sublingual B12 (1000mcg) + ALA fasting'],
  'a-3':  ['5 min outdoors', '10 min sunlight', '10 min + horizon view', 'Sunlight + distant horizon gaze to relax ciliary muscles'],
  'a-4':  ['15 min movement', '25 min workout', '30 min core & calisthenics', '30 min pull-ups/push-ups + zero heavy barbell loads'],
  'a-5':  ['10 min gentle asanas', '15 min Padma Sadhana', '20 min Padma Sadhana + Surya Namaskar', 'Full Padma Sadhana sequence + 4–6 slow Surya Namaskars'],
  'a-6':  ['15 min walking', '25 min low-impact', '35 min low-impact cardio', '35 min skipping/footwork + no road running'],
  'a-7':  ['3 min quick stretch', '5 min stretch', '10 min stretch + foam roll', '10 min full mobility (thoracic, hips, hamstrings)'],
  'a-8':  ['Soaked nuts only', 'Nuts + clean protein', 'Nuts + papaya + protein + 2 tbsp ground flaxseed', 'Full clean breakfast + 2 tbsp ground flaxseed + zero sugar'],
  'a-9':  ['Quick warm rinse', 'Warm shower', 'Warm shower + cool scalp rinse', 'Warm shower + cool scalp rinse for hair vitality'],
  'a-11': ['Write 1 priority', 'Write 3 priorities', 'Sprint planning + humidifier ON', 'Top 3 priorities (ZoetiCoach/Digital Builders/Infosys) + desk ergonomics'],
  'a-12': ['45 min focus', '60 min build', '90 min ZoetiCoach & Digital Builders build', '90 min deep architecture & code + phone in another room'],
  'a-13': ['5 min eye rest', '10 min eye rest', '20-20-20 eye rest + CCF sip + multivitamin', '20-20-20 eye reset + 10 blinks + CCF sip + multivitamin (Iron 0)'],
  'a-14': ['45 min focus', '60 min core work', '90 min business & core deliverables', '90 min core execution + PRs & test suites'],
  'a-15': ['5 min stretch', '10 min pause', '15 min movement & hydration pause', '15 min stand + stretch + mineral water + back extension'],
  'a-16': ['45 min code', '60 min review', '75 min code & review sprint', '75 min PR merges + deployment pipelines + docs'],
  'a-17': ['30 min office check', '45 min office sync', '75 min Infosys office block', '75 min live meetings, team syncs & daily office wrap'],
  'a-18': ['30 min ops', '45 min ops', '60 min business ops & build', '60 min ops + venture backlog clearance + architecture docs'],
  'a-19': ['Laptop off by 22:00', 'Laptop off by 21:30', '★ Hard laptop shutdown at 21:00', 'Strict 21:00 shutdown + 60m zero-screen restorative buffer'],
  'a-20': ['15 min walk', '30 min walk', '45 min outdoor fitness walk at sunset', '45 min brisk walk + distant horizon gaze + spinal decompression'],
  'a-23': ['Clear desk', 'Log 1 win', '10 min workspace reset & 3 wins log', '10 min clean desk + 3 wins logged + tomorrow clothes & bottle prepped'],
  'a-27': ['Bed by 23:00', 'Bed by 22:30', 'Lights out by 22:00', '22:00 sharp + 7h restorative sleep floor protected'],
  'a-29': ['Eat lunch', 'Add protein', 'Cooked protein + dal + jau/oats swap', 'Dal + jau swap + turmeric/pepper + D3/Omega-3/Curcumin'],
  'a-30': ['Eat dinner', 'Warm dinner', 'Dinner with soy protein + 10m walk', 'Soy chunks/tofu + cooked veg + 10m stroll + daily wrap'],
  'a-32': ['Skip harmful products', 'Basic calisthenics', 'Zero heavy deadlifts/squats', 'Strict barbell embargo + pull-ups/core isometrics only'],
  'a-35': ['Compliment Jyoti', '1 gesture of appreciation', 'Meaningful connection', 'Heartfelt verbal appreciation & mutual encouragement'],
  'a-36': ['Reduce snacks', '1 sugar item max', 'Zero junk food', 'Zero junk + clean whole foods & healthy lipids only'],
  'a-38': ['Cook 1 base', 'Prep 2 bases', '2h batch cooking', '2h batch meal prep: sprouted moong, lentils, base gravies'],
  'a-40': ['Quick sync 15min', '30 min review', '1h business milestone review', '1h progress audit across ZoetiCoach & Digital Builders + OKRs'],
  'a-52': ['Skip today', 'Take sometimes', 'Magnesium glycinate at 21:15', 'Magnesium glycinate in warm water/milk + sleep quality'],
  'a-53': ['30 min meeting', '60 min build', '2h business meetings or deep build block', '2h alternate-day business meetings / deep laptop build sprint'],
  'a-54': ['3 min sit', '5 min meditation', '10 min meditation & stillness', '10 min deep silence post-Kriya'],
  'a-55': ['5 min pranayama', '10 min pranayama', '15 min Sudarshan Kriya & Pranayama', 'Full 3-stage Ujjayi + Bhastrika + Kriya sequence'],
  'a-58': ['1 sentence', '5 min journal', '15 min mental rehearsal & stiffness log', '15 min mental rehearsal + stiffness minutes logged for rheumatologist'],
  'a-59': ['30 min couple time', '60 min couple time', '90 min dedicated couple connection', '90 min protected Saturday daytime couple connection with Jyoti'],
  'a-60': ['10 min mobility', '20 min stretch', '40 min restorative yoga & foam roll', '40 min + full posture & spinal decompression'],
  'a-61': ['Fill bottle with water', 'Water + salt', '2L mineral bottle (salt + lemon)', '2L mineral bottle + 3.0L daily rail + zero mealtime gulps'],
  'a-62': ['Skip today', '1–2 drops daily', '4× daily drops (09/12/15/18)', '4× daily preservative-free drops + tear film restoration'],
  'a-63': ['Skip compress', '5 min warm cloth', '10 min heated eye mask over closed eyelids', '10 min heated eye mask + meibomian gland clearance'],
  'a-64': ['3 min gentle stretch', '5 min bed mobility', '10 min full spinal mobility in bed', '10 min cat-cow/pelvic tilts/supine twists before rising'],
  'a-65': ['Stand once per hour', 'Stand every 45 min', 'Stand + walk 2-3 min + back extension', 'Full 45-min timer + 2-3m walk + standing extension'],
  'a-66': ['Skip today', '5 min oil on joints', '10 min warm sesame abhyanga', '10 min warm sesame abhyanga on joints, back & scalp'],
  'a-67': ['5 min walk', '8 min walk', '10 min post-breakfast walk', '10 min walk to blunt glucose spike (glucose 108 -> <95)'],
  'a-68': ['5 min walk', '8 min walk', '10 min post-lunch walk', '10 min post-lunch stroll + lubricating eye drops'],
  'a-69': ['3 min stretch', '5 min wind-down', '10 min spinal wind-down', '10 min supine twist + legs up wall + child\'s pose'],
  'a-70': ['Take 1/2 tsp', '1 tsp isabgol once', '1 tsp isabgol in warm water 15m pre-lunch', '1 heaped tsp isabgol in 300ml warm water 15m pre-lunch (LDL lever)'],
  'a-71': ['Take 1/2 tsp', '1 tsp isabgol', '1 tsp isabgol in warm water 15m pre-dinner', '1 tsp isabgol in warm water 15m pre-dinner for evening glucose control'],
  'a-72': ['10 min stretch', '15 min yoga', '20 min gentle spinal yoga flow', '20 min Bhujangasana/Cat-Cow/Bridge/Pawanmuktasana sequence'],
  'a-73': ['1.5L water', '2L water', '2.8L water tracked', '3.0L logged on the rail (500ml / 1L / 2L / 3L)'],
  'a-74': ['Skip', 'Take monthly', 'Weekly D3 sachet (60,000 IU) with lunch', 'Weekly D3 sachet (60,000 IU) with healthy meal fats for repletion'],
  'a-75': ['10% transfer', '15% transfer', '20% tax transfer', '25% tax transfer under 44ADA to separate reserve account'],
  'a-80': ['1h build', '2h build', '4.0h Saturday morning laptop build', '4.0h deep architecture & coding for ZoetiCoach & Digital Builders'],
  'a-81': ['Quick lunch', 'Lunch + 5m walk', 'Wholesome lunch + 15m walk', 'Wholesome lunch + 15m digestive walk + postural reset'],
  'a-82': ['2h build', '3.5h build', '5.0h Saturday afternoon laptop build', '5.0h uninterrupted feature engineering & testing for businesses'],
  'a-83': ['15 min walk', '30 min walk', '45 min Saturday sunset fitness walk', '45 min brisk walk + sunset posture reset & decompression'],
  'a-84': ['Quick dinner', 'Healthy dinner', 'Wholesome dinner + 10m walk', 'Wholesome dinner + 10m digestive walk'],
  'a-85': ['15 min wrap', '30 min sprint', '60 min night laptop sprint', '60 min night sprint + commits & PRs + 21:00 hard shutdown'],
  'a-86': ['30 min build', '1h build', '1.5h Sunday early laptop build', '1.5h early feature development & tech backlog clearance'],
  'a-87': ['30 min sprint', '45 min sprint', '1h Sunday roadmap execution sprint', '1h immediate execution on review priorities'],
  'a-88': ['1h build', '2.5h build', '4.0h Sunday afternoon laptop build', '4.0h core laptop engineering, UI polish & backend deployments'],
  'a-89': ['15 min walk', '30 min walk', '45 min Sunday fitness walk', '45 min brisk walk + spinal decompression'],
  'a-90': ['Quick dinner', 'Healthy dinner', 'Wholesome dinner + 10m walk', 'Wholesome dinner + 10m digestive walk'],
  'a-91': ['15 min wrap', '30 min sprint', '60 min Sunday night sprint', '60 min roadmap lock for upcoming week + 21:00 hard shutdown'],
};

export const jyotiTierDescriptions = {
  'j-1':  ['Rest until 7:00', 'Sleep until 7:30', 'Sleep until 8:00 protected', 'Full 8:00 rest + energized start (maternal recovery)'],
  'j-2':  ['Drink 250ml', '500ml water', '500ml warm water', '500ml + morning hydration routine'],
  'j-4':  ['30 min focus', '45 min focus', '60 min Career Session — IBP Supply Planning', '60 min + IBP Supply Planning study/case studies completed'],
  'j-6':  ['15 min lunch', '30 min lunch', '45 min proper shared lunch with Ashish', '45 min + galactagogue foods + balanced nutrition'],
  'j-9':  ['15 min quick bath', '30 min massage + bath', '45 min abhyanga + exercises + bath', '60 min full abhyanga + exercises + play + warm bath'],
  'j-10': ['Quick bite', 'Breakfast eaten', 'Nourishing breakfast + protein focus', 'Breakfast + ample protein + healthy lactation fuel'],
  'j-36': ['Quick rinse', 'Start washing machine', 'Wash & hang Shaarvi clothes', 'Full baby laundry done by 11:00'],
  'j-11': ['Rock to sleep', 'Settle in 15 min', 'Settled for nap + white noise', 'Smooth 30-min nap settle, cozy sleep'],
  'j-12': ['30 min bath/tidy', '1h bath/tidy', 'Full bath + room cleanup', '1h30 bath + deep room cleanup done by 13:00'],
  'j-14': ['15 min creative', '30 min creative', '45 min project time', '60 min + portfolio progress'],
  'j-15': ['Feed only', 'Feed + short walk', 'Feed + full stroller stroll', 'Feed + nature exploration'],
  'j-16': ['5 min stretching', '10 min pelvic exercises', '20 min full postpartum movement', '20 min + core recovery routine'],
  'j-17': ['Drink water', 'Fruit snack', 'Fruit + nuts + water', 'Whole nutrition snack + hydration'],
  'j-18': ['10 min walk', '15 min walk', '20 min family stroller walk', '30 min family stroller walk with Ashish & Shaarvi'],
  'j-19': ['Eat dinner', 'Light healthy dinner', 'Nourishing dinner + family time', 'Mindful dinner + clean ingredients with Ashish'],
  'j-20': ['5 min stroll', '10 min walk', '15 min stroll with Ashish', '15 min + peaceful evening chat'],
  'j-21': ['Quick feed', 'Feed + lullaby', 'Full bedtime routine + board book', 'Board book + feed + dark room + Sarve Bhavantu shloka'],
  'j-22': ['Sleep by 22:30', 'Sleep by 22:00', 'Lights out 21:30', '21:30 + 7h deep sleep logged'],
  'j-23': ['2L water', '2.5L water', '3.5L water tracked', '3.5L + full hydration balance for lactation'],
  'j-24': ['1 healthy meal', 'B12 & zinc foods', 'Full B12, zinc & folate rich meals', 'Nutrient-dense plan followed 100% (no iron restriction)'],
  'j-25': ['Think of 1 joy', 'Write 1 win', '5 min gratitude journal', 'Journal + self-love reflection'],
  'j-26': ['Reduce phone during feed', 'Phone away 15m', 'Zero screens while nursing', '100% loving eye contact with Shaarvi'],
  'j-27': ['Quick greeting', '5 min conversation', 'Meaningful connection with Ashish', 'Shared reflections + mutual support'],
  'j-28': ['1 sweet max', 'Low sugar intake', 'Zero refined sugar', 'Zero junk + pure nutritious meals'],
  'j-29': ['15 min review', '30 min review', '45 min Sunday board meeting (hard stop)', '45 min + week aligned with Ashish + celebrate wins'],
  'j-30': ['30 min date', '60 min date', '2h dedicated date night', '2h + romantic dinner/movie with Ashish'],
  'j-31': ['15 min self-care', '30 min pampering', '60 min full spa & relaxation', '60 min + complete rejuvenation'],
  'j-32': ['Note 1 achievement', 'Write 2 memories', 'Full weekly milestone log', 'Log + baby photos saved'],
  'j-33': ['1h personal', '2h creative output', '3h protected personal block (16:00-19:00)', '3h uninterrupted creative/personal block + Ashish on baby duty'],
  'j-34': ['Short trip', '30 min outdoor time', '1h sensory outing with Shaarvi', '1h + new sensory stimuli explored'],
  'j-35': ['30 min couple time', '60 min couple time', '90 min dedicated couple connection', '90 min + quality couple conversation with Ashish'],
  'j-37': ['Take B12 occasionally', '500mcg B12', '1000mcg sublingual B12 on waking', '1000mcg sublingual methylcobalamin daily (Shaarvi milk B12 secure)'],
  'j-38': ['Take D3 occasionally', 'D3 with water', 'D3 + algal DHA with breakfast', 'D3 + algal DHA with fatty breakfast daily (milk DHA optimized)'],
  'j-39': ['Skip', 'Monthly D3', 'Weekly D3 sachet (lactation dose)', 'Weekly D3 sachet with Sunday meal (20.63 → 40-60 target)'],
  'j-40': ['Skip', 'Magnesium sometimes', 'Magnesium glycinate at 21:15', 'Magnesium glycinate with warm milk + deep sleep & ALP support'],
  'j-41': ['5 min tummy time', '15 min tummy time', '30 min tummy time in bursts', '30–60 min tummy time with floor mirror + head lifts'],
  'j-42': ['Chant once', '3x Gayatri', '11x Gayatri Mantra with Shaarvi', '11x Gayatri Mantra chanted at 12:00 midday anchor'],
  'j-43': ['Eat seeds', 'Sprouted legumes', 'Zinc & folate rich foods daily', 'Soaked pumpkin seeds, til, steamed palak, beetroot & dal eaten'],
};

export const ashishTravelTierDescriptions = {
  'at-1':  ['3 min stretch', '5 min bed mobility', '10 min spinal mobility in bed', '10 min + stiffness assessment'],
  'at-2':  ['Drink 250ml', '500ml water', '500ml warm + lemon + Sublingual B12 & ALA', '500ml + empty stomach absorption'],
  'at-3':  ['5 min quick journal', '10 min compressed', '20 min Sudarshan Kriya & MOVERS', '20 min Kriya + silence + stiffness logged'],
  'at-4':  ['Light snack', 'Pack bottle', 'Snack + 2L bottle + lumbar cushion in car', 'Car loaded with lumbar cushion, food & 2L mineral bottle'],
  'at-9':  ['Drive quietly', 'Listen to music', 'Outbound drive (05:30–08:45) + audio', 'Drive + active lumbar support + steady hydration sips'],
  'at-10': ['Quick stretch', '1 min stand', '3-min standing extension on arrival', '3-min extension + assess stiffness before campus'],
  'at-11': ['Check in', 'Morning work', 'Infosys 4h shift + eye drops', 'Infosys 4h on-site + stand every 45 min + eye drops (09:30 & 12:00)'],
  'at-12': ['Drive to flat', 'Drive + stretch', 'Drive to flat + 3-min standing extension', 'Drive to flat + standing extension + settle in'],
  'at-13': ['Unpack bags', 'Eat lunch', 'Unpack + packed Ludhiana lunch + setup', 'Packed lunch + workstation ergonomic setup + humidifier ON'],
  'at-14': ['45 min build', '60 min build', '2.0h afternoon laptop build block', '2.0h deep laptop build for ZoetiCoach & Digital Builders'],
  'at-15': ['30 min meeting', '60 min build', '2.0h business meetings or deep build', '2.0h alt-day business meetings / deep build sprint'],
  'at-16': ['15 min walk', '30 min walk', '45 min outdoor fitness walk', '45 min brisk walk at sunset + horizon view'],
  'at-17': ['30 min sync', '45 min sync', '75 min Infosys evening office block', '75 min online syncs & deliverables wrap from flat'],
  'at-18': ['Eat dinner', '1-pot dinner', 'Simple 1-pot dinner + 10m walk', 'High-protein 1-pot dinner (soya/paneer) + 10m stroll + daily wrap'],
  'at-19': ['Laptop off by 22:00', 'Laptop off by 21:30', '★ Hard laptop shutdown at 21:00', 'Strict 21:00 shutdown + 60m zero-screen buffer'],
  'at-20': ['Clear desk', 'Dishes washed', 'Flat reset + magnesium drink', 'Immediate chore zero-state + magnesium glycinate in warm water'],
  'at-21': ['3 min stretch', '5 min wind-down', '10 min spinal stretch + heated eye mask', '10m supine twist + 10m heated eye mask over closed lids'],
  'at-22': ['Bed by 22:30', 'Bed by 22:00', 'Lights out by 22:00', '22:00 sharp + 7h restorative sleep protected'],
  'at-25': ['1L water', '2L water', '3.0L water protocol (2L in car)', '3.0L + sip in transit + zero mealtime gulps'],
  'at-28': ['1 junk snack', 'Low sugar snacks', 'Clean 1-pot whole foods on travel', 'Zero junk food + clean high-protein 1-pot meals only'],
};

export const sharedCoupleHabits = {
  // Shared Lunch (14:00)
  'a-29': { partnerId: 'j-6', type: 'meal', badge: '👫 Shared Lunch (2 PM)', partnerName: 'Jyoti', partnerAction: 'Shared mindful meal together at 14:00' },
  'j-6':  { partnerId: 'a-29', type: 'meal', badge: '👫 Shared Lunch (2 PM)', partnerName: 'Ashish', partnerAction: 'Shared mindful meal together at 14:00' },

  // Outdoor Fitness / Family Walk (18:15)
  'a-20': { partnerId: 'j-18', type: 'family', badge: '👨‍👩‍👧 Family Walk', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Joint evening stroller walk outdoors' },
  'j-18': { partnerId: 'a-20', type: 'family', badge: '👨‍👩‍👧 Family Walk', partnerName: 'Ashish & Shaarvi', partnerAction: 'Joint evening stroller walk outdoors' },

  // Shared Dinner (20:15)
  'a-30': { partnerId: 'j-19', type: 'meal', badge: '🍽️ Shared Dinner', partnerName: 'Jyoti', partnerAction: 'Nourishing home-cooked dinner together' },
  'j-19': { partnerId: 'a-30', type: 'meal', badge: '🍽️ Shared Dinner', partnerName: 'Ashish', partnerAction: 'Nourishing home-cooked dinner together' },

  // Daily Appreciation / Connection
  'a-35': { partnerId: 'j-27', type: 'couple', badge: '💖 Couple Connection', partnerName: 'Jyoti', partnerAction: 'Daily genuine verbal appreciation & check-in' },
  'j-27': { partnerId: 'a-35', type: 'couple', badge: '💖 Couple Connection', partnerName: 'Ashish', partnerAction: 'Daily genuine verbal appreciation & check-in' },

  // Sunday Milestone & Alignment (★)
  'a-40': { partnerId: 'j-29', type: 'strategic', badge: '★ Board Meeting', partnerName: 'Jyoti', partnerAction: 'Sunday alignment & strategic review' },
  'j-29': { partnerId: 'a-40', type: 'strategic', badge: '★ Board Meeting', partnerName: 'Ashish', partnerAction: 'Sunday alignment & strategic review' },

  // Weekend Daytime Couple Connection (★ Saturday)
  'a-59': { partnerId: 'j-35', type: 'couple', badge: '★ Weekend Couple Time', partnerName: 'Jyoti', partnerAction: 'Saturday 90-min couple connection & relaxation' },
  'j-35': { partnerId: 'a-59', type: 'couple', badge: '★ Weekend Couple Time', partnerName: 'Ashish', partnerAction: 'Saturday 90-min couple connection & relaxation' },

  // Travel Mode Counterparts
  'at-16': { partnerId: 'j-18', type: 'family', badge: '👨‍👩‍👧 Evening Walk', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Evening walk' },
  'af-21': { partnerId: 'j-18', type: 'family', badge: '👨‍👩‍👧 Family Walk', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Evening walk after Friday return' },
  'af-23': { partnerId: 'j-19', type: 'meal', badge: '🍽️ Shared Dinner', partnerName: 'Jyoti', partnerAction: 'Dinner together after Friday return' },
};

export function getSharedHabitInfo(habitId) {
  if (!habitId) return null;
  return sharedCoupleHabits[habitId] || null;
}

export const timeSlotDefinitions = {
  morning: { label: 'Sunrise & Morning Protocol', time: '04:45–08:30', emoji: '🌅', color: '#D4A03E' },
  work:    { label: 'Deep Build & Business Execution', time: '08:30–18:15', emoji: '⚡', color: '#D4B36A' },
  evening: { label: 'Fitness Walk, Office & Shutdown', time: '18:15–21:00', emoji: '🌙', color: '#B08D3E' },
  anytime: { label: 'Spine & Health Shield', time: 'All Day', emoji: '💚', color: '#6366f1' },
  weekly:  { label: 'Weekly Milestones & Review', time: 'Weekly', emoji: '📅', color: '#B8865A' },
};

export const timeSlotOrder = {
  morning: 1,
  work: 2,
  evening: 3,
  anytime: 4,
  weekly: 5,
};

export function getTimeSlotForHabit(id, habit = null) {
  if (habit && habit.timeSlot) return habit.timeSlot;
  if (habit && habit.startTime) {
    const [h, m] = String(habit.startTime).split(':').map(Number);
    const mins = (h || 0) * 60 + (m || 0);
    if (mins >= 4 * 60 && mins < 8 * 60 + 30) return 'morning';
    if (mins >= 8 * 60 + 30 && mins < 18 * 60 + 15) return 'work';
    if (mins >= 18 * 60 + 15 && mins <= 22 * 60) return 'evening';
    return 'evening';
  }

  // Ashish core habits (Master Operating Plan)
  if (['a-1','a-2','a-3','a-4','a-5','a-6','a-7','a-8','a-9','a-54','a-55','a-58','a-60','a-61','a-64','a-66','a-67','a-72'].includes(id)) return 'morning';
  if (['a-11','a-12','a-13','a-14','a-15','a-16','a-18','a-29','a-51','a-53','a-59','a-68','a-70','a-80','a-81','a-82','a-86','a-87','a-88'].includes(id)) return 'work';
  if (['a-17','a-19','a-20','a-23','a-27','a-30','a-52','a-63','a-69','a-71','a-83','a-84','a-85','a-89','a-90','a-91'].includes(id)) return 'evening';
  if (['a-32','a-35','a-36','a-62','a-65','a-73'].includes(id)) return 'anytime';
  if (['a-38','a-40','a-74','a-75'].includes(id)) return 'weekly';

  // Ashish travel habits (Monday transit)
  if (['at-1','at-2','at-3','at-4'].includes(id)) return 'morning';
  if (['at-9','at-10','at-11','at-12','at-13','at-14','at-15'].includes(id)) return 'work';
  if (['at-16','at-17','at-18','at-19','at-20','at-21','at-22'].includes(id)) return 'evening';
  if (['at-25','at-28'].includes(id)) return 'anytime';

  // Ashish office mid-week (Tue–Thu flat studio)
  if (['ao-1','ao-2','ao-3','ao-4','ao-7'].includes(id)) return 'morning';
  if (['ao-9','ao-10','ao-12','ao-13','ao-14','ao-17'].includes(id)) return 'work';
  if (['ao-20','ao-21','ao-23','ao-24','ao-25','ao-28','ao-29'].includes(id)) return 'evening';
  if (['ao-30','ao-32','ao-33'].includes(id)) return 'anytime';

  // Ashish office Friday (flat→office→Ludhiana)
  if (['af-1','af-7','af-8','af-9'].includes(id)) return 'morning';
  if (['af-10','af-12','af-13','af-16'].includes(id)) return 'work';
  if (['af-18','af-20','af-21','af-23','af-27','af-28','af-29'].includes(id)) return 'evening';
  if (['af-30','af-34'].includes(id)) return 'anytime';

  // Ashish half-day & holiday habits
  if (['ah-1','ah-2','ah-3'].includes(id)) return 'work';

  // Jyoti habits by ID (micro-detail: j-1..j-43)
  if (['j-1','j-2','j-4','j-9','j-10','j-36','j-37','j-38','j-41'].includes(id)) return 'morning';
  if (['j-11','j-12','j-14','j-6','j-35','j-42'].includes(id)) return 'work';
  if (['j-15','j-16','j-17','j-18','j-19','j-20','j-21','j-22','j-40'].includes(id)) return 'evening';
  if (['j-23','j-24','j-25','j-26','j-27','j-28','j-43'].includes(id)) return 'anytime';
  if (['j-29','j-30','j-31','j-32','j-33','j-34','j-39'].includes(id)) return 'weekly';

  // Fallback by habit name prefixes
  return 'anytime';
}

export function getHabitCategory(habit) {
  if (habit && habit.category) return habit.category;
  const name = (habit.name || '').toLowerCase();
  const id = (habit.id || '');
  if (['a-4','a-5','a-6','a-7','a-20','a-60','a-64','a-67','a-68','a-69','a-72','a-83','a-89','j-16','at-1','at-4','at-10','at-16','at-21','ao-1','ao-4','ao-23','ao-25','af-1','af-13','af-21','af-28'].includes(id) || name.includes('workout') || name.includes('exercise') || name.includes('run') || name.includes('walk') || name.includes('stretch') || name.includes('mobility') || name.includes('yoga') || name.includes('abhyanga') || name.includes('extension') || name.includes('decompression')) return 'fitness';
  if (['a-2','a-8','a-13','a-29','a-30','a-36','a-52','a-61','a-70','a-71','a-73','a-74','a-81','a-84','a-90','j-10','j-24','j-28','j-6','j-37','j-38','j-39','j-40','j-43','at-2','at-18','at-20','at-25','at-28','ao-2','ao-7','ao-24','ao-28','ao-30','ao-33','af-7','af-23','af-27','af-30'].includes(id) || name.includes('water') || name.includes('shake') || name.includes('protein') || name.includes('diet') || name.includes('breakfast') || name.includes('lunch') || name.includes('dinner') || name.includes('supplement') || name.includes('multivitamin') || name.includes('isabgol') || name.includes('mineral bottle') || name.includes('papaya') || name.includes('flaxseed') || name.includes('zinc') || name.includes('folate') || name.includes('d3') || name.includes('b12') || name.includes('magnesium')) return 'nutrition';
  if (['a-11','a-12','a-14','a-15','a-16','a-17','a-18','a-40','a-53','a-75','a-80','a-82','a-85','a-86','a-87','a-88','a-91','j-4','j-14','at-9','at-11','at-14','at-15','at-17','ao-9','ao-10','ao-14','ao-17','ao-20','af-9','af-10','af-12','af-16','af-18','af-34','ah-1','ah-2','ah-3'].includes(id) || name.includes('deep work') || name.includes('build') || name.includes('block') || name.includes('sprint') || name.includes('code') || name.includes('architecture') || name.includes('meeting') || name.includes('office') || name.includes('infosys') || name.includes('deliverables') || name.includes('review') || name.includes('priority') || name.includes('career') || name.includes('drive') || name.includes('execution') || name.includes('project') || name.includes('tax')) return 'work';
  if (['a-35','a-38','a-50','a-59','a-66','j-9','j-11','j-15','j-18','j-21','j-26','j-27','j-30','j-33','j-34','j-35','j-36','j-41','j-42','at-8','ao-8','af-8','af-23'].includes(id) || name.includes('shaarvi') || name.includes('jyoti') || name.includes('ashish') || name.includes('family') || name.includes('baby') || name.includes('date') || name.includes('couple') || name.includes('board meeting') || name.includes('abhyanga') || name.includes('meal prep') || name.includes('cooking')) return 'family';
  if (['a-1','a-3','a-9','a-19','a-23','a-27','a-32','a-54','a-55','a-58','a-62','a-63','a-65','j-1','j-2','j-12','j-22','j-25','j-31','at-3','at-12','at-13','at-19','at-22','ao-3','ao-12','ao-13','ao-21','ao-28','ao-29','ao-32','af-8','af-20','af-27','af-29'].includes(id) || name.includes('sleep') || name.includes('wake') || name.includes('bed') || name.includes('journal') || name.includes('gratitude') || name.includes('sunlight') || name.includes('grooming') || name.includes('shower') || name.includes('meditation') || name.includes('kriya') || name.includes('eye drops') || name.includes('eye mask') || name.includes('compress') || name.includes('movement break') || name.includes('shutdown') || name.includes('reset') || name.includes('lights out')) return 'rest';
  return 'ops';
}

export function getCurrentTimeBlock(targetDate = new Date()) {
  const now = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < 8 * 60 + 30) return 'morning';  // 00:00–08:30
  if (mins < 18 * 60 + 15) return 'work';    // 08:30–18:15
  if (mins < 21 * 60) return 'evening';      // 18:15–21:00 (shutdown at 21:00)
  return 'evening';
}

