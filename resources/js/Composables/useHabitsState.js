import { ref, computed } from 'vue';

// ── Progressive Habits: Ashish's Track — Micro-Detail (58 activities, time-sequenced) ──
export const ashishHabits = [
  // ── MORNING 04:45–08:30 — Integrated MOVERS Sadhana Protocol + Health Layer (18 micro-steps) ──
  { id: 'a-64', name: '04:45 Spinal Mobility — In Bed (10 min)',          points: 1, hint: 'Before you stand up. Cat-cow · knees-to-chest · pelvic tilts · supine spinal twist · child\'s pose. On the floor, before anything else. Highest-value addition to the whole day — decompresses overnight stiffness before load.' },
  { id: 'a-1',  name: '04:55 Alarm — Out of Bed',                        points: 1, hint: 'Feet on the floor after spinal mobility. No snooze button. Sit up → stand → drink water → start moving immediately.' },
  { id: 'a-2',  name: '04:55 500ml Warm Water + Lemon + B12 & ALA',      points: 1, hint: 'Take Vitamin B12 and Alpha Lipoic Acid with 250ml warm (not cold) water with lemon; finish the next 250ml warm water. Warm, not cold — this is the first vata rule of the day.' },
  { id: 'a-5',  name: '05:00 MOVERS [E]: Padma Sadhana & Surya Namaskar (20 min)', points: 2, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], scheduleLabel: 'Daily', hint: 'The "E" in MOVERS. Full Padma Sadhana sequence (Butterfly, Cat stretch, Yogamudra, Bhujangasana, Shalabhasana, Shavasana, Nadi Shodhan) + 4–6 slow breath-synchronized Surya Namaskars. Wakes up the spine gently with zero compressive shock.' },
  { id: 'a-55', name: '05:20 MOVERS [O]: Sudarshan Kriya & Pranayama (15 min)', points: 1, hint: 'The "O" in MOVERS. 3-stage Pranayama with Ujjayi, Bhastrika rounds, Om chanting and Sudarshan Kriya. Floods the body with oxygen, activates parasympathetic nervous system, and calms systemic inflammation.' },
  { id: 'a-54', name: '05:35 MOVERS [M]: Meditation & Deep Silence (10 min)', points: 1, hint: 'The "M" in MOVERS. Rest in silent stillness following Sudarshan Kriya. Allows the mind and autonomic nervous system to settle deeply before the day begins.' },
  { id: 'a-56', name: '05:45 MOVERS [V]: Visualization & Sankalpa (5 min)', points: 1, hint: 'The "V" in MOVERS. Close your eyes and mentally rehearse today going smoothly — architecture discussions, focused execution, and calm presence.' },
  { id: 'a-57', name: '05:50 MOVERS [R]: Reading (5 min)',                points: 1, hint: 'The "R" in MOVERS. Dense technical or uplifting wisdom reading only. Not news, not social feeds.' },
  { id: 'a-58', name: '05:55 MOVERS [S]: Scribing & Stiffness Log (5 min)', points: 1, hint: 'The "S" in MOVERS. Write by hand: three gratitudes + the One Big Thing. Add: last night\'s stiffness minutes — sets the tone for the day.' },
  { id: 'a-3',  name: '06:00 Outdoor Sunlight & Fresh Air (5 min)',      points: 1, hint: 'Look at the distant natural horizon light to release ciliary muscle accommodation and reset circadian rhythm. Boosts alertness and supports vitamin D.' },
  { id: 'a-4',  name: '06:05 Workout — Moderate Strength / Cardio (30 min)', points: 2, daysOfWeek: [1, 3, 5], scheduleLabel: 'Mon, Wed, Fri', hint: '30 min moderate strength. **No deadlifts, no loaded squats, no overhead press** until rheumatologist clears you. Focus on core stability, pull-ups, and controlled bodyweight/dumbbell movements.' },
  { id: 'a-6',  name: '06:05 Low-Impact Cardio — 35 Min',                points: 2, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Brisk walking, cycling, skipping, or boxing footwork on the bag — technique and head movement only, no heavy power work. High-impact running stays paused until cleared.' },
  { id: 'a-7',  name: '06:35 10-Min Post-Workout Stretch & Foam Roll',   points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6], scheduleLabel: 'Mon–Sat', hint: 'Shoulders, thoracic spine, hip flexors, hamstrings. Longer than before — this is where a desk-and-car body gets repaid.' },
  { id: 'a-66', name: '06:45 Abhyanga — Warm Sesame Oil (10 min)',        points: 1, daysOfWeek: [2, 4, 6, 0], scheduleLabel: 'Tue, Thu, Sat, Sun', hint: 'Before showering. Joints, lower back, scalp. The traditional answer to dryness and joint stiffness — costs nothing. You already do it for Shaarvi. Daily if you can.' },
  { id: 'a-9',  name: '06:55 Warm Shower & Morning Grooming',            points: 1, hint: 'Body warm throughout. Final 20 seconds: cool rinse on the scalp only. Cold is the classic vata aggravator your doctor told you to avoid, and it worsens inflammatory joint stiffness.' },
  { id: 'a-8',  name: '07:05 Breakfast — Soaked Nuts + Papaya + Clean Protein', points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6], scheduleLabel: 'Mon–Sat', hint: 'Soaked almonds, walnuts, 2–3 cashews, 5–6 raisins + **bowl of fresh papaya** + **clean protein**: fresh paneer, moong dal chilla / steamed moong sprouts, plant protein, or diluted whey. Zero added sugar, no muesli, no bananas (glucose protection).' },
  { id: 'a-67', name: '07:20 Post-Breakfast Walk (10 min)',              points: 1, hint: 'Most effective single non-drug intervention for a fasting glucose of 108. Take Shaarvi with you if possible.' },
  { id: 'a-61', name: '07:30 Prepare 2L Mineral Bottle & Daily Water Protocol', points: 1, hint: 'Fill 2L mineral bottle: filtered water + ¼–½ tsp pink Himalayan salt + 1 tbsp fresh lemon. **Water Protocol**: 3L daily total. **Do NOT drink large water with meals** (stop 30m before, max 2–3 warm sips during, resume 45m after to protect digestion). Sip steadily between 09:00–20:30.' },
  { id: 'a-10', name: '07:35 Take Shaarvi (07:35–08:30 Baby Duty)',      points: 2, hint: 'Abhyanga, tummy time, turn-taking session #1, karāgre shloka. 100% focused daddy-daughter time. Gives Jyoti her protected career hour. Hands off cleanly at 08:30 for deep work.' },

  // ── WORK HOURS 08:30–18:30 (13 micro-steps in exact chronological order) ──
  { id: 'a-11', name: '08:30 Daily 1-3-5 & Top Priority Execution (5 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Turn on the ultrasonic cool-mist humidifier (1.5–2.5 ft away from your face, filled with RO water). Verify monitor center is 15–20° below eye level. Then write down: 1 Must-Do (T1), 3 Should-Do (T2), 5 Nice-to-Do (T3). Never open email or Slack before writing these down.' },
  { id: 'a-12', name: '08:45 Block 1 — Deep Architecture / Code (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Pure deep work on core product code/system architecture. Phone on silent in another room. Zero tabs except repo.' },
  { id: 'a-13', name: '10:30 10-Min Walk & Screen Hydration Break',       points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Step away from screen. Do a full 20-20-20 eye rest pause (look 20 ft away for 20 seconds), then perform 10 deliberate full blinks to re-spread the tear film. Walk around, and drink from your mineral bottle. Protects against digital eye strain and dry eye fatigue.' },
  { id: 'a-28', name: '10:30 Warm Hydration / CCF or Herbal Infusion + Snack', points: 1, hint: 'Warm water or herbal infusion (Tulsi / Cumin-Coriander-Fennel water). No milk tea or coffee needed — avoiding both protects iron absorption and balances Vata. Light snack if needed.' },
  { id: 'a-31', name: '10:30 Multivitamin (Iron PAUSED)',               points: 1, hint: 'Take your breakfast multivitamin with your 10:30 snack. **Iron supplement PAUSED** until ferritin is tested — supplementing raises serum iron and ferritin, masking a deficiency on the test you still need. Tell your doctor you\'ve been taking it. When you do resume: pair with amla, lemon or orange. Never with milk, tea, coffee or calcium.' },
  { id: 'a-14', name: '11:00 Block 2 — High-Leverage Deliverables (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Second deep work block: product features, PR reviews, critical client deliverables. Starts after your 10:30 breakfast break, not before — protects the meal from getting skipped.' },
  { id: 'a-15', name: '12:30 15-Min Pipeline & Outreach Action',         points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Send 3 high-value outbound messages or follow up with active enterprise leads. Keep the sales pipeline warm daily.' },
  { id: 'a-16', name: '12:45 Block 3 — Technical Execution / PRs (75m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Afternoon build block: code implementations, bug fixes, automated test writing, code review merging. Runs 12:45–14:00 right before lunch.' },
  { id: 'a-29', name: '14:00 Lunch with Jyoti — Balanced Protein & Cooked Veg (45m)', points: 1, hint: 'Thick dal with ghee and lemon or amla, cooked or lightly sautéed vegetables instead of raw salad, curd, one roti. **No tea after. Small sips of warm water only.** Wholesome shared lunch with Jyoti.' },
  { id: 'a-51', name: '14:45 Midday Supplement — D3 + Omega-3 (with Lunch)', points: 1, hint: 'With lunch. Correct timing — both need fat to absorb. Ask your doctor about raising the D3 dose.' },
  { id: 'a-68', name: '14:50 Post-Lunch Walk (10 min)',                  points: 1, hint: 'Walk after eating — second most effective non-drug intervention for glucose of 108. Even a short stroll helps.' },
  { id: 'a-17', name: '15:00 10-Min Walk + Warm Herbal Sip',             points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'After-lunch stroll: 10 min stroll outside or around home. Warm water or herbal infusion. No coffee or chai needed.' },
  { id: 'a-62', name: '15:00 Eye Drops — 4× Daily (09:00, 12:00, 15:00, 18:00)', points: 1, hint: 'Instill 1 drop of preservative-free lubricating eye drops in each eye, four times daily. One drop at 15:00 doesn\'t cover a ten-hour screen day with measurable dryness. Plus 20-20-20 as an all-day habit.' },
  { id: 'a-18', name: '15:15 Block 4 — Pipeline / Ops / Client Work (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Operations, client communications, system monitoring, and documentation. Tie up all loose work threads.' },
  { id: 'a-53', name: '17:00 Client Calls & Team Sync (60m)',              points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Live calls, standups, and check-ins — video/phone conversations that don\'t fit inside a heads-down deep work block. Ends at 18:00 with a clean 30-min buffer before shutdown.' },

  // ── EVENING & SHUTDOWN 18:30–22:00 (12 micro-steps in exact chronological order) ──
  { id: 'a-19', name: '18:30 Work Day Shutdown Ritual (5 min)',          points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Turn off the desk humidifier and rinse the water tank. Close all work browser tabs. Review completed tasks. Log tomorrow top 3 items in notebook. Officially disconnect.' },
  { id: 'a-20', name: '18:35 Joint Family Stroller Walk with Jyoti (30 min)', points: 2, hint: 'Outdoor stroller walk together with Jyoti & Shaarvi. Fresh evening air and quality family time.' },
  { id: 'a-43', name: '19:05 Shaarvi Floor Play & Language Time (20m)',  points: 2, hint: 'Interactive floor play: read baby board books, practice sounds and clapping, stacking toys. Zero phones around.' },
  { id: 'a-21', name: '19:25 Dinner Preparation & Shared Family Dinner', points: 1, hint: 'Help Jyoti with dinner setup, cooking support, and enjoy a nourishing meal together. Teamwork makes evenings smooth.' },
  { id: 'a-30', name: 'Dinner — Light Protein & Cooked Vegetables',      points: 1, hint: 'Fully warm — no raw salad in the evening. Lightly sautéed or steamed with a little ghee. Paneer, soya or dal. Finish eating at least 2 hours before bedtime.' },
  { id: 'a-22', name: '20:15 Post-Dinner Stroll with Jyoti (15 min)',    points: 1, hint: 'Relaxed post-dinner walk with Jyoti & Shaarvi. Aids digestion, lowers blood sugar spike, encourages peaceful conversation.' },
  { id: 'a-23', name: '20:45 Kitchen Reset & Counter Clean (15 min)',   points: 1, hint: 'Wash dishes, wipe counters, start dishwasher/dryer, prepare coffee/water station for morning. Zero dirty dishes.' },
  { id: 'a-24', name: '21:00 Day Journaling & 3 Wins Log (5 min)',       points: 1, hint: 'Write 3 specific wins from today, 1 lesson learned, and 1 moment of gratitude. Solidifies progress mindset.' },
  { id: 'a-25', name: '21:05 Tomorrow Preparation (Clothes, Workspace)', points: 1, hint: 'Lay out workout clothes, fill water bottle, clear desk. Tomorrow is won tonight through frictionless morning setup.' },
  { id: 'a-26', name: '21:35 Screen Off Lockout — Complete Screen Blackout', points: 1, hint: 'Complete screen blackout by 21:35 sharp. Put phone on charger in another room. This allows ciliary muscle spasms from prolonged near-focus to fully subside before sleep, preventing accommodative strain from carrying into tomorrow.' },
  { id: 'a-52', name: '21:15 Night Supplement — Magnesium',               points: 1, hint: 'With warm half-milk-half-water and a pinch of haldi. Earlier than before, so it isn\'t fighting your sleep. Magnesium relaxes muscles and the nervous system.' },
  { id: 'a-69', name: '21:20 Evening Spinal Wind-Down (10 min)',          points: 1, hint: 'Supine twist · legs up the wall · child\'s pose. Inflammatory stiffness responds to end-of-day decompression. This changes how the next morning feels.' },
  { id: 'a-63', name: '21:40 Night Sip & Warm Eye Compress (10 min)',    points: 1, hint: 'Apply a warm damp compress or heated eye mask for 10 minutes over closed eyelids to clear meibomian oil glands and restore the tear film lipid layer. Take a small warm sip (tapering fluid volume to avoid sleep disruption). Do this every night — it\'s the single most effective daily habit for preventing chronic dry eye.' },
  { id: 'a-27', name: '22:00 In Bed — Lights Out (7h Sleep Target)',     points: 2, hint: 'In bed with lights out by 22:00 to ensure a full 7 hours of restorative sleep before the 05:00 wake-up.' },

  // ── HEALTH & MINDSET — ALL DAY (6 habits) ──
  { id: 'a-65', name: 'Movement Break Every 45 Minutes',                 points: 1, hint: 'Repeating 45-min timer. Stand, walk 3 minutes, one gentle back extension. Non-negotiable — four back-to-back 90-minute blocks with two breaks across ten hours is punishing for a stiff spine. Timer, not willpower.' },
  { id: 'a-32', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Follow your healthy scalp regimen: gentle shampoo rinse, avoid harsh chemicals, and apply any topical treatments. Rinse the scalp after every workout — sweat carries DHT.' },
  { id: 'a-33', name: '5-Minute Stress & Mindset Journaling',             points: 1, hint: 'Rate your daily stress 1–10. Write down 1 challenge, 1 thing you are grateful for, and 1 positive focus for tomorrow.' },
  { id: 'a-34', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: 'Never look at phones or tablets while interacting with Shaarvi. Babies learn from direct eye contact and face-to-face attention.' },
  { id: 'a-35', name: 'Daily Jyoti Appreciation / Connection (5 min)',   points: 1, hint: 'Express genuine verbal appreciation to Jyoti. Give a warm hug, ask how she is feeling, listen without giving advice.' },
  { id: 'a-36', name: 'No Refined Sugar / Junk Food Today',              points: 1, hint: 'Zero candy, sodas, fried snacks, or bakery sweets. Fuel your body with clean, whole, nutrient-dense nutrition.' },

  // ── WEEKLY RECURRING (13 habits) ──
  { id: 'a-37', name: '★ Board Meeting with Jyoti — Weekly Review (60m)', points: 3, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Comprehensive Sunday strategic review: review weekly metrics, celebrate wins, plan next week top 3 goals with Jyoti.' },
  { id: 'a-38', name: 'Meal Prep (2h Batch Cooking)',                     points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Cook 2–3 staple bases (boiled legumes, roasted veggies, grilled proteins) to save 4 hours of cooking on weekdays.' },
  { id: 'a-39', name: 'Full House Declutter & Laundry (60 min)',          points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Clean all rooms, fold all laundry, organize desks, and take out recycling. Clean environment = clear mind.' },
  { id: 'a-40', name: 'Weekly Strategy & Goal Review (30 min)',           points: 2, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Review monthly and quarterly OKRs. Are we on track with revenue, health targets, and family milestones?' },
  { id: 'a-41', name: 'Weekly 10% Income Auto-Transfer to Savings',       points: 2, daysOfWeek: [5], scheduleLabel: 'Fri Only', hint: 'Transfer minimum 10% of weekly earnings to investment/emergency accounts before spending any discretionary money.' },
  { id: 'a-42', name: 'Weekly Expense Audit & Budget Logging (15 min)',   points: 1, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Review credit card & bank statements. Categorize all expenses in your budget sheet. Zero untracked leaks.' },
  { id: 'a-44', name: '★ Date Night / Dedicated Couple Time (2h)',        points: 3, daysOfWeek: [5], scheduleLabel: 'Fri Date Night', hint: '2 hours of protected quality time just for you and Jyoti. Order nice food, watch a movie, or talk without baby distractions.' },
  { id: 'a-45', name: '2 Targeted Discovery Calls Booked This Week',      points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Book minimum 2 prospective client or customer discovery calls to keep the top-of-funnel pipeline growing.' },
  { id: 'a-46', name: '2 Past Client Reconnection Touches Sent',         points: 1, daysOfWeek: [2, 4], scheduleLabel: 'Tue, Thu', hint: 'Send 2 warm check-ins or value-add updates to past clients or partners to generate repeat opportunities.' },
  { id: 'a-47', name: '5 Meaningful Partner Interactions',                points: 1, daysOfWeek: [3, 5], scheduleLabel: 'Wed, Fri', hint: 'Engage thoughtfully on social media / communities / partner channels with industry peers and potential collaborators.' },
  { id: 'a-48', name: 'Weekly Pipeline Scrub & Invoicing (45 min)',       points: 2, daysOfWeek: [5], scheduleLabel: 'Fri Only', hint: 'Update deal stages, follow up on unpaid invoices, archive dead leads, and ensure accurate sales forecasts.' },
  { id: 'a-49', name: 'Social Post / Newsletter Batch Production (2h)',   points: 2, daysOfWeek: [4, 6], scheduleLabel: 'Thu & Sat', hint: 'Batch write 3 social media posts or 1 newsletter edition in a single focused session. Schedule them out.' },
  { id: 'a-50', name: 'Shaarvi Weekend Sensory & Nature Outing (1h)',     points: 2, daysOfWeek: [0, 6], scheduleLabel: 'Sat–Sun', hint: 'Take Shaarvi to a botanical garden, park, or scenic outdoor spot. Let her touch grass, feel the breeze, and explore.' },
  { id: 'a-59', name: '★ Weekend Couple Time & Relaxed Connection with Jyoti (90 min)', points: 3, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Protected Saturday daytime couple connection: quality conversation, tea together, relaxed shared activities or movie without office calls or weekday rush.' },
  { id: 'a-60', name: 'Sunday Restorative Stretch, Mobility & Foam Roll (30 min)', points: 1, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Sunday morning active recovery routine: gentle mobility, foam rolling, and joint decompression to restore the body before the upcoming week.' },
];

// ── Jyoti's Track (30 activities) ──
export const jyotiHabits = [
  // ── MORNING & MIDDAY 05:00–14:45 (9 micro-steps) ──
  { id: 'j-1',  name: 'Protected Sleep Window — 05:00 to 08:00',         points: 2, hint: 'Uninterrupted morning sleep while Ashish handles morning routines and Shaarvi. Rest is the foundation of energy and healing.' },
  { id: 'j-2',  name: '08:00 Wake-Up & 500ml Water (5 min)',             points: 1, hint: 'Drink 500ml warm water upon waking at 08:00 to rehydrate and support digestion and milk production.' },
  { id: 'j-4',  name: '08:05 Career & Focus Session (1h)',               points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Ashish has Shaarvi solo 08:05–08:30 (she is typically settled/napping the rest of that hour). Use this protected 1-hour session for your career, skill building, and professional projects.' },
  { id: 'j-9',  name: '09:05 Shaarvi Bath — Abhyanga, Exercises & Play (40 min)', points: 3, hint: 'Hands-on routine with Shaarvi: warm oil abhyanga massage, developmental exercises, vocal interaction & communication, gentle playing, and a soothing warm bath.' },
  { id: 'j-10', name: '09:45 Breakfast & Multivitamins (30 min)',        points: 1, hint: 'Nourishing breakfast along with your daily multivitamins (B12, DHA, D3, iron). Fuel and support postpartum vitality right after Shaarvi is dressed.' },
  { id: 'j-36', name: '10:15 Wash Shaarvi\'s Clothes (45 min)',          points: 1, hint: 'Wash and hang Shaarvi\'s clothes and essentials. Completes all active morning baby chores by 11:00 AM sharp.' },
  { id: 'j-11', name: '11:00 Settle Shaarvi for Nap (15 min)',           points: 2, hint: 'Settle Shaarvi into her crib/bed with gentle rocking, white noise, and cozy sleep environment for her midday rest.' },
  { id: 'j-12', name: '11:15 Own Bath & Room Cleanup (1h45m)',           points: 2, hint: 'While Shaarvi naps: take your own relaxed warm bath, personal grooming, and tidy up the room till 13:00.' },
  { id: 'j-14', name: '13:00 Creative Project / Personal Development (1h)', points: 1, hint: 'Spend this quiet hour on self-directed creative projects, learning, journaling, or relaxing hobbies while the afternoon is quiet, leading into 14:00 lunch.' },
  { id: 'j-6',  name: '14:00 Lunch with Ashish — Nourishing Meal (45 min)', points: 1, hint: 'Nutrient-rich lunch with Ashish at 2:00 PM: protein, healthy fats (ghee/nuts), and lactogenic foods (oats, methi, fennel, lentils). Relax and enjoy a shared mindful meal.' },

  // ── AFTERNOON & EVENING 16:00–21:30 (8 micro-steps) ──
  { id: 'j-15', name: '16:00 Shaarvi Afternoon Feed & Stroller Walk',    points: 1, hint: 'Afternoon feeding session followed by fresh air stroll in the stroller around the neighborhood.' },
  { id: 'j-16', name: '17:00 20-Min Postpartum Pelvic & Core Movement',  points: 2, hint: 'Gentle postpartum yoga, kegels, diaphragmatic breathing, and gentle core rehab exercises.' },
  { id: 'j-17', name: '17:30 Fresh Fruit & Hydration Snack',             points: 1, hint: 'Eat a fresh seasonal fruit (apple, papaya, berries) with handful of almonds/walnuts and 300ml water.' },
  { id: 'j-18', name: '18:35 Joint Family Stroller Walk with Ashish',     points: 1, hint: 'Evening family walk together with Ashish & Shaarvi. Connect and enjoy the evening sights and sounds.' },
  { id: 'j-19', name: '19:25 Dinner Preparation & Shared Family Dinner',  points: 1, hint: 'Enjoy a light, nourishing home-cooked dinner with Ashish. Unwind and team up in the kitchen together.' },
  { id: 'j-20', name: '20:15 Post-Dinner Stroll with Ashish (15 min)',   points: 1, hint: 'Short 15-minute relaxed walk after dinner to aid digestion and spend peaceful couple time together.' },
  { id: 'j-21', name: '20:45 Shaarvi Bedtime Routine (Lullaby, Feed)',   points: 2, hint: 'Dim the room lights, sing lullabies, swaddle/sleep sack, final night feed, and put Shaarvi to sleep.' },
  { id: 'j-22', name: '21:30 Lights Out & Sleep (Target 7h Floor)',      points: 2, hint: 'Screens away, room cool and dark. Get into bed early to maximize deep sleep cycles before morning.' },

  // ── NUTRITION, HYDRATION & RECOVERY — ALL DAY (6 habits) ──
  { id: 'j-23', name: '3.5L Daily Water Intake Tracked',                 points: 1, hint: 'Drink 3.5 litres of water throughout the day. Keep your marked water bottle filled and beside you.' },
  { id: 'j-24', name: 'Iron & Calcium Rich Nutrition Plan',              points: 1, hint: 'Include greens, sesame seeds, dairy/ragi, and iron-rich lentils to replenish mineral stores postpartum.' },
  { id: 'j-25', name: '5-Minute Mother Gratitude & Mood Journal',         points: 1, hint: 'Write down 3 moments that brought you joy today and 1 reminder that you are doing an amazing job.' },
  { id: 'j-26', name: 'Zero Screens While Nursing Shaarvi',              points: 2, hint: 'Put phone away while feeding Shaarvi. Eye-to-eye contact during feeding deepens mother-baby bond and oxytocin.' },
  { id: 'j-27', name: 'Daily Ashish Connection & Check-In',              points: 1, hint: 'Share how your day felt with Ashish. Talk about feelings, dreams, and team up on household plans.' },
  { id: 'j-28', name: 'No Refined Sugar / Processed Foods Today',        points: 1, hint: 'Stick to wholesome, natural foods. Avoid sugary sodas, packaged chips, and processed bakery treats.' },

  // ── WEEKLY RECURRING (6 habits) ──
  { id: 'j-29', name: '★ Board Meeting with Ashish (60 min)',            points: 3, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Sunday couple review: sync on baby schedule, celebrate weekly wins, and align on upcoming goals.' },
  { id: 'j-30', name: '★ Date Night / Couple Window (2h)',               points: 3, daysOfWeek: [5], scheduleLabel: 'Fri Date Night', hint: 'Dedicated 2-hour date night with Ashish. Relax, laugh, and enjoy each other company.' },
  { id: 'j-31', name: 'Personal Pampering & Self-Care Ritual (1h)',       points: 2, daysOfWeek: [0, 6], scheduleLabel: 'Sat–Sun', hint: '1 full hour just for yourself: hair mask, skincare ritual, warm bath, or reading your favorite book.' },
  { id: 'j-32', name: 'Shaarvi Developmental Milestone Log',              points: 1, daysOfWeek: [0], scheduleLabel: 'Sun Only', hint: 'Record Shaarvi new sounds, motor achievements, smiles, and funny moments in her baby journal.' },
  { id: 'j-33', name: 'Creative Output / Skill Practice (2h)',            points: 2, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Spend 2 hours advancing your creative portfolio, design skills, or professional learning projects.' },
  { id: 'j-34', name: 'Shaarvi Sensory & Nature Outing',                  points: 2, daysOfWeek: [0, 6], scheduleLabel: 'Sat–Sun', hint: 'Weekend sensory trip to a park, garden, or family outing to expose Shaarvi to new nature textures.' },
  { id: 'j-35', name: '★ Weekend Couple Time & Connection with Ashish (90 min)', points: 3, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Protected Saturday afternoon couple window with Ashish: relax, talk about dreams, enjoy tea together, and connect with zero weekday distractions.' },
];

// ── Ashish Travel Mode (Chandigarh) — Health-Adjusted (30 activities) ──
export const ashishTravelHabits = [
  // ── PRE-DEPARTURE 04:45–06:30 (8 micro-steps) ──
  { id: 'at-1',  name: '04:45 Spinal Mobility — In Bed (10 min)',         points: 1, hint: 'Especially important today — you\'re about to sit for travel. Cat-cow, knees-to-chest, pelvic tilts, supine twist, child\'s pose.' },
  { id: 'at-2',  name: '04:55 500ml Warm Water + Lemon, B12 & ALA',     points: 1, hint: 'Warm water with lemon. Take B12 and ALA before anything else.' },
  { id: 'at-3',  name: '05:00 Sudarshan Kriya & Compressed MOVERS (20 Min)', points: 1, hint: 'Pranayama, Bhastrika rounds, Sudarshan Kriya, deep silence & morning stiffness log. Compressed for travel days.' },
  { id: 'at-4',  name: '05:20 Padma Sadhana & Gentle Surya Namaskar (20 Min)', points: 2, hint: 'Gentle Padma Sadhana asana sequence (Butterfly, Cat stretch, Yogamudra, Bhujangasana, Shalabhasana, Shavasana) + 4 slow Surya Namaskars. Doctor-prescribed restorative movement — replaces strength on travel days.' },
  { id: 'at-5',  name: '05:40 Abhyanga — Warm Sesame Oil (10 Min)',      points: 1, hint: 'Non-negotiable on travel days. Warm sesame oil on lower back, joints, and scalp before shower.' },
  { id: 'at-6',  name: '05:50 Warm Shower & Grooming',                   points: 1, hint: 'Body warm throughout. Final 20 seconds: cool rinse on the scalp only.' },
  { id: 'at-7',  name: '06:05 Breakfast — Soaked Nuts + Papaya + Clean Protein', points: 1, hint: 'Soaked nuts + bowl of fresh papaya + clean protein (fresh paneer, moong dal chilla / steamed moong sprouts, plant protein, or diluted whey). Eaten sitting down calmly.' },
  { id: 'at-8',  name: '06:20 10 Min with Shaarvi & Pack 2L Mineral Bottle', points: 1, hint: 'Turn-taking session #1 with Shaarvi. Pack 2L mineral bottle (salt + lemon) into car. **Do not gulp water with breakfast** — sip steadily on the road.' },

  // ── OUTBOUND TRANSIT & CHANDIGARH OFFICE 06:30–13:30 (5 micro-steps) ──
  { id: 'at-9',  name: '06:30 Outbound Drive to Chandigarh — Audio Block (06:30–09:15)', points: 1, hint: 'Hands-free. Technical audio one day, recorded spoken practice the other. **Seat upright, lumbar support behind the lower back.** Sip mineral water throughout.' },
  { id: 'at-10', name: '09:15 3-Min Standing Extension on Arrival',      points: 1, hint: 'Before you walk into the office. Sitting for transit is exactly what your back can\'t absorb silently. Decompress immediately.' },
  { id: 'at-11', name: '09:30 Chandigarh Office Focus (Eye Drops 09:30 & 12:00)', points: 2, hint: 'High-focus office block. Stand every 45 min — same rule, different building. Eye drops at 09:30 and 12:00.' },
  { id: 'at-12', name: '13:00 Lunch + Mobile Stealth Block + 10m Walk',  points: 1, hint: 'Wholesome cooked lunch (dal, sabzi, roti). Small warm sips only — no large water with meal. 5 platform bids, 10 founder touches, followed by a 10-min walk for post-meal glucose control.' },
  { id: 'at-13', name: '13:30 Return Drive to Ludhiana — Audio / Calls (13:30–16:30)', points: 1, hint: 'Drive back to Ludhiana (1:30 PM – 4:30 PM). Hands-free client calls and educational audio. Lumbar support engaged.' },

  // ── HOME RECOVERY & EVENING 16:30–21:30 (11 micro-steps) ──
  { id: 'at-14', name: '16:30 Home Arrival & Spinal Decompression (15m)', points: 1, hint: 'Arrive home in Ludhiana safely. 15 minutes of foam rolling, supine twist, and legs-up-the-wall to unload spine after transit.' },
  { id: 'at-15', name: '17:00 Async Execution / Client Catch-up (60m)',   points: 2, hint: 'Focused 1-hour block to clear critical emails, PR reviews, and urgent client threads.' },
  { id: 'at-16', name: '18:00 Work Shutdown Ritual (5 min)',              points: 1, hint: 'Laptop closed. Tomorrow priorities noted. Complete transition to evening family mode.' },
  { id: 'at-17', name: '18:35 Joint Family Stroller Walk with Jyoti (30m)', points: 2, hint: 'Outdoor stroller walk together with Jyoti & Shaarvi. Fresh evening air and family connection.' },
  { id: 'at-18', name: '19:25 Dinner Preparation & Shared Family Dinner', points: 1, hint: 'Teamwork with Jyoti in kitchen. Nourishing warm cooked meal. No raw salads in evening. Small sips only with dinner.' },
  { id: 'at-19', name: '20:15 Post-Dinner Stroll with Jyoti (15 min)',    points: 1, hint: 'Gentle 15-min post-dinner stroll with Jyoti to aid digestion and maintain glucose stability.' },
  { id: 'at-20', name: '20:45 Kitchen Reset & Shaarvi Wind-Down',        points: 1, hint: 'Dishes done, counters clean. Diya, shloka, and calm bedtime routine for Shaarvi.' },
  { id: 'at-21', name: '21:00 Day Journaling & 3 Wins Log',               points: 1, hint: 'Write 3 wins from today Chandigarh trip, 1 lesson, and gratitude.' },
  { id: 'at-22', name: '21:05 Magnesium + Warm Diluted Milk',           points: 1, hint: 'Take magnesium with warm half-milk-half-water and a pinch of haldi. Muscle relaxation before sleep.' },
  { id: 'at-23', name: '21:15 Evening Spinal Wind-Down — 10 Min',       points: 1, hint: 'Supine twist · legs up the wall · child\'s pose. Essential after travel to ensure loose back tomorrow.' },
  { id: 'at-24', name: '21:30 Lights Out — Early Recovery Sleep',        points: 2, hint: 'In bed with complete screen blackout. Full 7.5h restorative sleep before next morning.' },

  // ── HEALTH & MINDSET ON TRAVEL DAYS (6 rules) ──
  { id: 'at-25', name: '3 Litres Daily Water Protocol (Warm/Room Temp)',  points: 1, hint: 'Keep 2L bottle in car. Sip throughout transit and office. Never fridge-cold. **Do NOT drink large water with meals** (stop 30m before, resume 45m after).' },
  { id: 'at-26', name: 'Scalp Care & Hair Protocol',                     points: 1, hint: 'Perform scalp rinse during evening shower. Cleanse away sweat and DHT.' },
  { id: 'at-27', name: 'Zero Screen Time in Front of Shaarvi',           points: 2, hint: 'Full eye contact and loving presence with Shaarvi. No phones in hand.' },
  { id: 'at-28', name: 'No Refined Sugar / Clean Whole Foods on Travel',  points: 1, hint: 'Zero junk food. Clean, warm, nourishing meals only on travel days.' },
  { id: 'at-29', name: 'Midday Supplement — D3 + Omega-3 (with Lunch)', points: 1, hint: 'Take with office lunch — fat-soluble vitamins absorb best with food.' },
  { id: 'at-30', name: 'Morning Supplement — B12 & ALA (Fasting)',       points: 1, hint: 'Take with your 500ml warm water and lemon at 04:55.' },
];

// ── Office Mid-Week (Tue–Thu): Panchkula Flat → Office (30 min, 12 km) → Flat Evening ──
// Wake 05:15 · Depart flat 07:00 · Office 07:30–11:00 (3.5h) · Back at flat by 11:30
export const ashishOfficeMidHabits = [
  // ── MORNING AT FLAT 05:15–07:00 (8 micro-steps) ──
  { id: 'ao-1',  name: '05:15 Spinal Mobility — In Bed (10 min)',          points: 1, hint: 'Cat-cow, knees-to-chest, pelvic tilts, supine twist, child\'s pose. Decompress before the day.' },
  { id: 'ao-2',  name: '05:25 500ml Warm Water + Lemon + B12 & ALA',      points: 1, hint: 'Take B12 and ALA with warm water and lemon on empty stomach.' },
  { id: 'ao-3',  name: '05:30 MOVERS: Padma Sadhana & Surya Namaskar (20 min)', points: 2, hint: 'Full Padma Sadhana sequence + 4 slow Surya Namaskars at the flat. Portable practice — just needs a mat.' },
  { id: 'ao-4',  name: '05:50 Sudarshan Kriya & Pranayama (10 min)',       points: 1, hint: 'Compressed Kriya at flat. 3-stage Ujjayi, Bhastrika, Om chanting. Floods body with oxygen.' },
  { id: 'ao-5',  name: '06:00 Meditation & Visualization (10 min)',        points: 1, hint: 'Silent meditation + visualization. Compress M+V from MOVERS into one sitting.' },
  { id: 'ao-6',  name: '06:10 Quick Shower & Grooming',                    points: 1, hint: 'Warm shower at the flat. Efficient grooming for office.' },
  { id: 'ao-7',  name: '06:25 Breakfast — Clean Protein + Papaya + Nuts',  points: 1, hint: 'Soaked nuts + papaya + clean protein. Eat calmly before departure.' },
  { id: 'ao-8',  name: '06:45 Pack Mineral Bottle & Prep for Office',      points: 1, hint: 'Fill 2L mineral bottle (salt + lemon). Gather laptop and essentials. Depart by 07:00.' },

  // ── COMMUTE & OFFICE 07:00–11:00 (4 micro-steps) ──
  { id: 'ao-9',  name: '07:00 Drive to Office — Audio/Calls (30 min)',     points: 1, hint: 'Short 12km drive from Panchkula flat to office. Hands-free audio or planning. Lumbar support.' },
  { id: 'ao-10', name: '07:30 Office Focus Block (3.5 hrs)',               points: 2, hint: 'High-intensity office focus. Attendance marked. Stand every 45 min. Eye drops at 09:00 and 11:00.' },
  { id: 'ao-11', name: '10:30 Warm Hydration & Snack Break',               points: 1, hint: 'CCF or herbal infusion. Light snack. Step away from screen for 10 min.' },
  { id: 'ao-12', name: '11:00 Drive Back to Flat (30 min)',                 points: 1, hint: '12km drive back to Panchkula flat. Hands-free calls or educational audio.' },

  // ── FLAT AFTERNOON 11:30–18:30 (8 micro-steps — deep work from flat) ──
  { id: 'ao-13', name: '11:30 Post-Commute Stretch & Settle (10 min)',     points: 1, hint: '3-min standing extension + brief spine decompression. Change into comfortable clothes.' },
  { id: 'ao-14', name: '11:45 Block 1 — Deep Architecture / Code (90 min)', points: 2, hint: 'Pure deep work from flat. Phone on silent. Zero distractions.' },
  { id: 'ao-15', name: '13:15 Lunch — Balanced Protein & Cooked Veg + D3/Omega-3', points: 1, hint: 'Warm cooked meal. Dal, sabzi, roti/rice. Take D3 + Omega-3 with food. Small sips only.' },
  { id: 'ao-16', name: '13:45 Post-Lunch Walk (10 min)',                   points: 1, hint: 'Walk around the Panchkula colony. Glucose control after lunch.' },
  { id: 'ao-17', name: '14:00 Block 2 — Client / Pipeline / Ops (90 min)', points: 2, hint: 'Afternoon deep work block. Client calls, PR reviews, pipeline outreach.' },
  { id: 'ao-18', name: '15:30 15-Min Walk & Eye Drops',                    points: 1, hint: 'Step away, eye drops, warm herbal sip. Recharge for final block.' },
  { id: 'ao-19', name: '15:45 Block 3 — Technical Execution / PRs (90 min)', points: 2, hint: 'Final afternoon work block. Code implementations, bug fixes, documentation.' },
  { id: 'ao-20', name: '17:15 Client Calls & Team Sync (45 min)',          points: 2, hint: 'Live calls, standups, and check-ins. Ends by 18:00.' },

  // ── FLAT EVENING 18:00–22:00 (Solo at Panchkula flat) ──
  { id: 'ao-21', name: '18:00 Work Shutdown Ritual (5 min)',               points: 1, hint: 'Close all work tabs. Log tomorrow top 3. Officially disconnect.' },
  { id: 'ao-22', name: '18:10 Video Call with Jyoti & Shaarvi (20 min)',   points: 2, hint: 'FaceTime with Jyoti and Shaarvi. See baby\'s face, hear about their day. Stay connected despite distance.' },
  { id: 'ao-23', name: '18:30 Evening Walk — Solo Panchkula (30 min)',     points: 1, hint: 'Solo evening walk in Panchkula. Fresh air, decompression, light movement.' },
  { id: 'ao-24', name: '19:00 Dinner — Light Protein & Warm Cooked Food', points: 1, hint: 'Simple warm dinner at flat. Dal, sabzi, roti. No raw salads in evening.' },
  { id: 'ao-25', name: '19:30 Post-Dinner Stroll (15 min)',                points: 1, hint: 'Gentle walk around the flat complex for digestion.' },
  { id: 'ao-26', name: '20:00 Reading / Personal Development (30 min)',    points: 1, hint: 'Dense reading or upskilling. Use the flat quiet time productively.' },
  { id: 'ao-27', name: '20:30 Day Journaling & 3 Wins Log',               points: 1, hint: 'Write 3 wins from today, 1 lesson, gratitude. Reflect on flat day.' },
  { id: 'ao-28', name: '20:45 Magnesium + Warm Milk & Evening Wind-Down', points: 1, hint: 'Magnesium with warm half-milk-half-water + haldi. Spinal wind-down: supine twist, legs up wall, child\'s pose.' },
  { id: 'ao-29', name: '21:15 Screen Off & Lights Out — Recovery Sleep',   points: 2, hint: 'Full screen blackout by 21:15. Phone on charger. 8h sleep opportunity.' },

  // ── HEALTH ALL DAY (5 rules) ──
  { id: 'ao-30', name: '3 Litres Daily Water Protocol (Warm/Room Temp)',   points: 1, hint: 'Keep 2L bottle at office and flat. Sip throughout. Never fridge-cold. No large water with meals.' },
  { id: 'ao-31', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Scalp rinse during evening shower. Cleanse sweat and DHT.' },
  { id: 'ao-32', name: 'Movement Break Every 45 Minutes',                 points: 1, hint: 'Timer-based. Stand, walk 3 min, one gentle back extension. Non-negotiable.' },
  { id: 'ao-33', name: 'No Refined Sugar / Clean Whole Foods',            points: 1, hint: 'Zero junk food. Clean, warm, nourishing meals only.' },
  { id: 'ao-34', name: 'Zero Personal Screen Time During Work Blocks',    points: 1, hint: 'No social media, no YouTube. Protect the deep work blocks at the flat.' },
];

// ── Office Friday: Panchkula Flat → Office (30 min) → Return to Ludhiana (~2.75h) ──
// Wake 05:15 · Depart flat 07:00 · Office 07:30–11:00 · Return drive to Ludhiana 11:30–14:15
export const ashishOfficeFriHabits = [
  // ── MORNING AT FLAT 05:15–07:00 (same as mid-week) ──
  { id: 'af-1',  name: '05:15 Spinal Mobility — In Bed (10 min)',          points: 1, hint: 'Cat-cow, knees-to-chest, pelvic tilts, supine twist, child\'s pose.' },
  { id: 'af-2',  name: '05:25 500ml Warm Water + Lemon + B12 & ALA',      points: 1, hint: 'B12 and ALA with warm water and lemon on empty stomach.' },
  { id: 'af-3',  name: '05:30 MOVERS: Padma Sadhana & Surya Namaskar (20 min)', points: 2, hint: 'Full Padma Sadhana + Surya Namaskars at flat. Last office morning this week.' },
  { id: 'af-4',  name: '05:50 Sudarshan Kriya & Pranayama (10 min)',       points: 1, hint: 'Compressed Kriya. 3-stage Ujjayi, Bhastrika, Om chanting.' },
  { id: 'af-5',  name: '06:00 Meditation & Visualization (10 min)',        points: 1, hint: 'Silent meditation + visualization. Set intention for the drive home.' },
  { id: 'af-6',  name: '06:10 Quick Shower & Grooming',                    points: 1, hint: 'Warm shower. Pack flat bag — you\'re heading home today.' },
  { id: 'af-7',  name: '06:25 Breakfast — Clean Protein + Papaya + Nuts',  points: 1, hint: 'Full breakfast before departure. Pack snacks for the return drive.' },
  { id: 'af-8',  name: '06:45 Pack Flat, Mineral Bottle & Office Prep',    points: 1, hint: 'Pack flat bag, fill 2L mineral bottle, gather all essentials. Depart by 07:00. You won\'t return until next office block.' },

  // ── COMMUTE & OFFICE 07:00–11:00 (same as mid-week) ──
  { id: 'af-9',  name: '07:00 Drive to Office — Audio/Calls (30 min)',     points: 1, hint: 'Last 12km drive to office this block. Hands-free audio. Lumbar support.' },
  { id: 'af-10', name: '07:30 Office Focus Block (3.5 hrs)',               points: 2, hint: 'Final office attendance of the week. Stand every 45 min. Eye drops.' },
  { id: 'af-11', name: '10:30 Warm Hydration & Snack Break',               points: 1, hint: 'CCF or herbal infusion. Light snack. Eye drops.' },

  // ── RETURN DRIVE TO LUDHIANA 11:00–14:00 ──
  { id: 'af-12', name: '11:00 Return Drive to Ludhiana — Audio / Calls (11:00–14:00)', points: 1, hint: 'Drive from office back to Ludhiana (~2.75h). Hands-free client calls and educational audio. Lumbar support engaged. Sip mineral water.' },

  // ── HOME AFTERNOON & EVENING 14:00–22:00 (back with family!) ──
  { id: 'af-13', name: '14:00 Home Arrival & Spinal Decompression (15 min)', points: 1, hint: 'Arrive home in Ludhiana. 15 min foam rolling, supine twist, legs-up-the-wall to unload spine.' },
  { id: 'af-14', name: '14:15 Lunch with Jyoti — Balanced Protein & Cooked Veg', points: 1, hint: 'Warm cooked meal with Jyoti. Take D3 + Omega-3. Small sips only.' },
  { id: 'af-15', name: '14:45 Post-Lunch Walk (10 min)',                   points: 1, hint: 'Walk after eating. Glucose control and transition to afternoon work.' },
  { id: 'af-16', name: '15:00 Block 1 — Deep Work / Client Catch-up (90 min)', points: 2, hint: 'Afternoon deep work at home. Clear critical emails, PRs, client threads.' },
  { id: 'af-17', name: '16:30 15-Min Pipeline & Outreach Action',          points: 1, hint: 'Send 3 high-value outbound messages. Keep pipeline warm.' },
  { id: 'af-18', name: '16:45 Client Calls & Team Sync (45 min)',          points: 2, hint: 'Live calls, standups, and check-ins. End of work week sync.' },
  { id: 'af-19', name: '17:30 Weekly Pipeline Scrub & Invoicing (45 min)', points: 2, hint: 'Update deal stages, follow up on unpaid invoices. Friday finance routine.' },
  { id: 'af-20', name: '18:15 Work Shutdown — Welcome Home Ritual (5 min)', points: 1, hint: 'Close all work. Log next week\'s top 3. Celebrate end of office block week!' },
  { id: 'af-21', name: '18:35 Joint Family Stroller Walk with Jyoti (30 min)', points: 2, hint: 'Outdoor stroller walk with Jyoti & Shaarvi. Reconnect after the office week away.' },
  { id: 'af-22', name: '19:05 Shaarvi Floor Play & Language Time (20 min)', points: 2, hint: 'Interactive floor play. Read baby board books. Zero phones.' },
  { id: 'af-23', name: '19:25 Dinner Prep & Shared Family Dinner',         points: 1, hint: 'Teamwork with Jyoti in kitchen. Nourishing warm meal together.' },
  { id: 'af-24', name: '20:15 Post-Dinner Stroll with Jyoti (15 min)',     points: 1, hint: 'Gentle post-dinner stroll. Digestion and peaceful conversation.' },
  { id: 'af-25', name: '20:45 Kitchen Reset & Shaarvi Wind-Down',          points: 1, hint: 'Dishes done. Diya, shloka, calm bedtime routine for Shaarvi.' },
  { id: 'af-26', name: '21:00 Day Journaling & 3 Wins Log',               points: 1, hint: 'Write 3 wins from the office week, 1 lesson, gratitude.' },
  { id: 'af-27', name: '21:05 Magnesium + Warm Milk',                      points: 1, hint: 'Magnesium with warm half-milk-half-water + haldi. Muscle relaxation.' },
  { id: 'af-28', name: '21:15 Evening Spinal Wind-Down (10 min)',          points: 1, hint: 'Supine twist, legs up the wall, child\'s pose. Extra needed after the drive.' },
  { id: 'af-29', name: '21:30 Screen Off & Lights Out — Recovery Sleep',   points: 2, hint: 'Full screen blackout. 7.5h restorative sleep. Welcome home.' },

  // ── HEALTH ALL DAY (4 rules) ──
  { id: 'af-30', name: '3 Litres Daily Water Protocol (Warm/Room Temp)',   points: 1, hint: 'Keep 2L bottle in car. Sip throughout transit and office. No large water with meals.' },
  { id: 'af-31', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Scalp rinse in evening shower at home.' },
  { id: 'af-32', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: 'Full eye contact with Shaarvi. You\'ve been away all week — be 100% present.' },
  { id: 'af-33', name: 'No Refined Sugar / Clean Whole Foods',            points: 1, hint: 'Zero junk. Clean meals only.' },
  { id: 'af-34', name: '10% Income Auto-Transfer to Savings',             points: 2, hint: 'Friday finance: transfer minimum 10% of weekly earnings to savings.' },
];

// ── Ashish Half-Day Routine (WFH Ludhiana — Light Office + Personal Projects / Content / Errands) ──
export const ashishHalfDayHabits = [
  // ── MORNING 04:45–08:30 (Full MOVERS Sadhana Protocol) ──
  { id: 'a-64', name: '04:45 Spinal Mobility — In Bed (10 min)',          points: 1, hint: 'Cat-cow · knees-to-chest · pelvic tilts · supine spinal twist · child\'s pose.' },
  { id: 'a-1',  name: '04:55 Alarm — Out of Bed',                        points: 1, hint: 'Feet on the floor. No snooze button.' },
  { id: 'a-2',  name: '04:55 500ml Warm Water + Lemon + B12 & ALA',      points: 1, hint: 'Take B12 and ALA with warm water and lemon.' },
  { id: 'a-5',  name: '05:00 MOVERS [E]: Padma Sadhana & Surya Namaskar (20 min)', points: 2, hint: 'Full Padma Sadhana sequence + 4–6 slow breath-synchronized Surya Namaskars.' },
  { id: 'a-55', name: '05:20 MOVERS [O]: Sudarshan Kriya & Pranayama (15 min)', points: 1, hint: '3-stage Pranayama with Ujjayi, Bhastrika rounds, Om chanting and Sudarshan Kriya.' },
  { id: 'a-54', name: '05:35 MOVERS [M]: Meditation & Deep Silence (10 min)', points: 1, hint: 'Rest in silent stillness following Sudarshan Kriya.' },
  { id: 'a-56', name: '05:45 MOVERS [V]: Visualization & Sankalpa (5 min)', points: 1, hint: 'Mentally rehearse today going smoothly.' },
  { id: 'a-57', name: '05:50 MOVERS [R]: Reading (5 min)',                points: 1, hint: 'Dense technical or uplifting wisdom reading.' },
  { id: 'a-58', name: '05:55 MOVERS [S]: Scribing & Stiffness Log (5 min)', points: 1, hint: 'Three gratitudes + One Big Thing + stiffness log.' },
  { id: 'a-3',  name: '06:00 Outdoor Sunlight & Fresh Air (5 min)',      points: 1, hint: 'Distant natural horizon light to release ciliary muscle accommodation.' },
  { id: 'a-4',  name: '06:05 Workout — Moderate Strength / Cardio (30 min)', points: 2, hint: 'Moderate strength / restorative workout. No heavy deadlifts or compressive loads.' },
  { id: 'a-7',  name: '06:35 10-Min Post-Workout Stretch & Foam Roll',   points: 1, hint: 'Shoulders, thoracic spine, hip flexors, hamstrings.' },
  { id: 'a-66', name: '06:45 Abhyanga — Warm Sesame Oil (10 min)',        points: 1, hint: 'Warm sesame oil on joints, lower back, and scalp before shower.' },
  { id: 'a-9',  name: '06:55 Warm Shower & Morning Grooming',            points: 1, hint: 'Body warm throughout. Final 20 seconds cool rinse on scalp only.' },
  { id: 'a-8',  name: '07:05 Breakfast — Soaked Nuts + Papaya + Clean Protein', points: 1, hint: 'Soaked nuts + papaya + fresh paneer / moong chilla / plant protein.' },
  { id: 'a-67', name: '07:20 Post-Breakfast Walk (10 min)',              points: 1, hint: 'Post-meal glucose walk. Take Shaarvi along.' },
  { id: 'a-61', name: '07:30 Prepare 2L Mineral Bottle & Daily Water Protocol', points: 1, hint: 'Fill 2L mineral bottle: water + pink salt + lemon. 3L total daily.' },
  { id: 'a-10', name: '07:35 Take Shaarvi (07:35–08:30 Baby Duty)',      points: 2, hint: '100% focused daddy-daughter time. Protects Jyoti\'s career hour.' },

  // ── MORNING FOCUS 08:30–14:00 (Compressed 2 deep blocks) ──
  { id: 'a-11', name: '08:30 Daily 1-3-5 & Half-Day Priorities (5 min)', points: 1, hint: 'Write today\'s 1-3-5. Prioritize the half-day focus.' },
  { id: 'a-12', name: '08:45 Block 1 — Deep Architecture / Core Code (90m)', points: 2, hint: 'First half-day focus block: core system design & highest-leverage code.' },
  { id: 'a-13', name: '10:30 10-Min Walk & Screen Hydration Break',       points: 1, hint: '20-20-20 eye rest pause, 10 deliberate blinks, mineral water.' },
  { id: 'a-28', name: '10:30 Warm Hydration / CCF or Herbal Infusion + Snack', points: 1, hint: 'Tulsi or CCF water. No caffeine needed.' },
  { id: 'a-31', name: '10:30 Multivitamin (Iron PAUSED)',               points: 1, hint: 'Take multivitamin with snack.' },
  { id: 'a-14', name: '11:00 Block 2 — High-Leverage Deliverables (90m)', points: 2, hint: 'Second deep work block: finish key client deliverables & code reviews.' },
  { id: 'a-15', name: '12:30 15-Min Pipeline & Outreach Action',         points: 1, hint: 'Send 3 outbound touches to maintain momentum.' },
  { id: 'a-16', name: '12:45 Wrap-up Work & Sync PRs (75m)',             points: 2, hint: 'Wrap up morning sprint, push git commits, merge open PRs.' },
  { id: 'a-29', name: '14:00 Lunch with Jyoti — Balanced Protein & Cooked Veg', points: 1, hint: 'Shared lunch with Jyoti. Thick dal, cooked sabzi, roti. Small warm sips only.' },
  { id: 'a-51', name: '14:45 Midday Supplement — D3 + Omega-3 (with Lunch)', points: 1, hint: 'Take with food for optimal fat-soluble absorption.' },
  { id: 'a-68', name: '14:50 Post-Lunch Walk (10 min)',                  points: 1, hint: '10 min walk to blunt glucose spike.' },
  { id: 'a-62', name: '15:00 Eye Drops (09:00, 12:00, 15:00, 18:00)',   points: 1, hint: 'Preservative-free lubricating eye drops.' },

  // ── HALF-DAY PRODUCTIVE PIVOT 15:15–18:30 (Replaces late client calls) ──
  { id: 'ah-1', name: '15:15 Creative / Personal Project Build (90 min)', points: 2, hint: 'High-leverage personal project build (Habuilt development, side apps, architecture prototypes).' },
  { id: 'ah-2', name: '16:45 Content Production / Social Connects (45 min)', points: 2, hint: 'Build valuable content, write tech insights, or reach out to new founders/partners.' },
  { id: 'ah-3', name: '17:30 Personal Tasks, Errands & Family Prep (60 min)', points: 1, hint: 'Take care of half-day personal tasks: bank/documentation, festival prep, vehicle maintenance, or family errand.' },

  // ── EVENING & FAMILY 18:30–22:00 (Nourishing Family Connection) ──
  { id: 'a-19', name: '18:30 Work Day Shutdown Ritual (5 min)',          points: 1, hint: 'Close laptop tabs. Log tomorrow top 3 items.' },
  { id: 'a-20', name: '18:35 Joint Family Stroller Walk with Jyoti (30 min)', points: 2, hint: 'Outdoor stroller walk together with Jyoti & Shaarvi.' },
  { id: 'a-43', name: '19:05 Shaarvi Floor Play & Language Time (20m)',  points: 2, hint: 'Interactive floor play, board books, and clapping.' },
  { id: 'a-21', name: '19:25 Dinner Preparation & Shared Family Dinner', points: 1, hint: 'Help Jyoti with dinner setup, enjoy warm meal together.' },
  { id: 'a-30', name: 'Dinner — Light Protein & Cooked Vegetables',      points: 1, hint: 'Warm cooked meal. Finish 2 hours before bedtime.' },
  { id: 'a-22', name: '20:15 Post-Dinner Stroll with Jyoti (15 min)',    points: 1, hint: 'Relaxed post-dinner walk to aid digestion.' },
  { id: 'a-23', name: '20:45 Kitchen Reset & Counter Clean (15 min)',   points: 1, hint: 'Dishes done, counters clean, clean kitchen.' },
  { id: 'a-24', name: '21:00 Day Journaling & 3 Wins Log (5 min)',       points: 1, hint: 'Write 3 wins from today, 1 lesson, gratitude.' },
  { id: 'a-25', name: '21:05 Tomorrow Preparation (Clothes, Workspace)', points: 1, hint: 'Prepare clothes and workspace for frictionless morning.' },
  { id: 'a-52', name: '21:15 Night Supplement — Magnesium',               points: 1, hint: 'With warm half-milk-half-water and a pinch of haldi.' },
  { id: 'a-69', name: '21:20 Evening Spinal Wind-Down (10 min)',          points: 1, hint: 'Supine twist · legs up the wall · child\'s pose.' },
  { id: 'a-26', name: '21:35 Screen Off Lockout — Complete Blackout',    points: 1, hint: 'Complete screen blackout. Phone on charger in another room.' },
  { id: 'a-63', name: '21:40 Night Sip & Warm Eye Compress (10 min)',    points: 1, hint: 'Warm compress over closed eyelids to restore tear film lipid layer.' },
  { id: 'a-27', name: '22:00 In Bed — Lights Out (7h Sleep Target)',     points: 2, hint: 'In bed by 22:00 for restorative sleep.' },

  // ── HEALTH & MINDSET — ALL DAY (6 habits) ──
  { id: 'a-65', name: 'Movement Break Every 45 Minutes',                 points: 1, hint: 'Repeating 45-min timer. Stand, walk, gentle back extension.' },
  { id: 'a-32', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Gentle scalp rinse and care regimen.' },
  { id: 'a-33', name: '5-Minute Stress & Mindset Journaling',             points: 1, hint: 'Rate stress, note challenge, focus on positive.' },
  { id: 'a-34', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: 'Never look at phones while interacting with Shaarvi.' },
  { id: 'a-35', name: 'Daily Jyoti Appreciation / Connection (5 min)',   points: 1, hint: 'Express genuine verbal appreciation to Jyoti.' },
  { id: 'a-36', name: 'No Refined Sugar / Junk Food Today',              points: 1, hint: 'Clean, whole, nutrient-dense nutrition.' },
];

// ── Ashish Holiday Routine (Spiritual / Festive / Restorative — Zero Office Work) ──
export const ashishHolidayHabits = [
  { id: 'a-64', name: '04:45 Spinal Mobility — In Bed (10 min)',          points: 1, hint: 'Cat-cow · knees-to-chest · pelvic tilts · supine spinal twist · child\'s pose.' },
  { id: 'a-1',  name: '05:00 Gentle Wake-up & Gratitude',                 points: 1, hint: 'Peaceful holiday morning wake-up.' },
  { id: 'a-2',  name: '05:05 500ml Warm Water + Lemon + B12 & ALA',      points: 1, hint: 'Take B12 and ALA with warm water and lemon.' },
  { id: 'a-5',  name: '05:15 MOVERS [E]: Deep Padma Sadhana & Surya Namaskar (30m)', points: 3, hint: 'Unrushed holiday Padma Sadhana + gentle Surya Namaskars.' },
  { id: 'a-55', name: '05:45 MOVERS [O]: Sudarshan Kriya & Pranayama (20 min)', points: 2, hint: 'Deep, spacious Sudarshan Kriya and Pranayama.' },
  { id: 'a-54', name: '06:05 MOVERS [M]: Meditation & Deep Silence (15 min)', points: 2, hint: 'Extended silent meditation in stillness.' },
  { id: 'a-3',  name: '06:20 Sunlight, Nature & Fresh Air (15 min)',     points: 1, hint: 'Morning sunlight and fresh air.' },
  { id: 'a-66', name: '06:40 Relaxed Full-Body Abhyanga (20 min)',        points: 2, hint: 'Spacious warm sesame oil massage on joints and scalp.' },
  { id: 'a-9',  name: '07:00 Warm Shower & Festive Grooming',            points: 1, hint: 'Nourishing warm bath.' },
  { id: 'a-8',  name: '07:30 Festive / Healthy Family Breakfast',         points: 1, hint: 'Nourishing whole food breakfast with family.' },
  { id: 'a-10', name: '08:00 Extended Play & Quality Time with Shaarvi (2h)', points: 3, hint: 'Joyful, playful, uninterrupted daddy-daughter playtime.' },
  { id: 'a-50', name: '10:30 Family Outing / Park / Nature Walk (60 min)', points: 2, hint: 'Take Shaarvi & Jyoti to botanical garden or park.' },
  { id: 'a-29', name: '13:30 Festive Shared Lunch with Family',            points: 2, hint: 'Wholesome festive lunch cooked with love.' },
  { id: 'a-51', name: '14:30 Midday Supplement — D3 + Omega-3',           points: 1, hint: 'Take with festive lunch.' },
  { id: 'a-68', name: '14:45 Post-Lunch Family Stroll (15 min)',          points: 1, hint: 'Digestive stroll with Jyoti.' },
  { id: 'ah-1', name: '15:30 Creative Passion / Reading / Personal Project (90m)', points: 2, hint: 'Work on creative hobbies, reading, or inspiring ideas.' },
  { id: 'a-20', name: '18:00 Sunset Family Stroller Walk with Jyoti (45m)', points: 2, hint: 'Extended evening walk in golden hour.' },
  { id: 'a-21', name: '19:15 Festive Dinner & Quality Connection',        points: 2, hint: 'Nourishing shared dinner.' },
  { id: 'a-22', name: '20:15 Post-Dinner Family Walk (20 min)',           points: 1, hint: 'Digestive stroll under night sky.' },
  { id: 'a-24', name: '21:00 Holiday Gratitude & 3 Wins Journaling',      points: 1, hint: 'Reflect on family joy and spiritual connection.' },
  { id: 'a-52', name: '21:15 Magnesium + Warm Haldi Milk',                points: 1, hint: 'Deep relaxation before sleep.' },
  { id: 'a-69', name: '21:25 Restorative Spinal Wind-Down (15 min)',      points: 1, hint: 'Supine twist, legs up wall, child\'s pose.' },
  { id: 'a-27', name: '21:45 Restful Holiday Sleep (8h target)',          points: 2, hint: 'Deep restorative sleep.' },
  { id: 'a-61', name: '3 Litres Mineral Water Protocol',                  points: 1, hint: 'Sip steadily throughout the day.' },
  { id: 'a-34', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: '100% present with Shaarvi.' },
  { id: 'a-35', name: 'Daily Jyoti Appreciation & Love',                  points: 1, hint: 'Heartfelt appreciation and connection.' },
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
  'a-1':  ['Alarm off, out of bed by 5:30', 'Out of bed by 5:15', 'Out of bed by 5:10 after mobility', '5:10 sharp + zero snooze all week'],
  'a-2':  ['Drink 250ml warm water', '500ml warm water', '500ml warm + lemon + B12 & ALA', '500ml warm + lemon + B12 & ALA + vata protocol'],
  'a-3':  ['5 min outdoors', '10 min sunlight', '10 min + light stretching', '10 min + breathwork + vitamin D'],
  'a-4':  ['15 min movement', '25 min workout', '35 min Surya Namaskar + moderate strength', '35 min + 4–6 slow Surya Namaskars + zero heavy spinal load'],
  'a-5':  ['10 min gentle asanas', '15 min Padma Sadhana', '20 min Padma Sadhana + Surya Namaskar', 'Full Padma Sadhana sequence + 4 slow Surya Namaskars'],
  'a-6':  ['15 min walking', '25 min low-impact', '40 min low-impact cardio', '40 min + heart rate tracked + no running'],
  'a-7':  ['3 min quick stretch', '5 min stretch', '10 min stretch + foam roll', '10 min full mobility (thoracic, hips, hamstrings)'],
  'a-8':  ['Soaked nuts only', 'Nuts + clean protein', 'Nuts + papaya + paneer/chilla/protein', 'Full rebuilt breakfast (paneer/chilla/plant protein) + no sugar/muesli'],
  'a-9':  ['Quick warm rinse', 'Warm shower', 'Warm shower + cool scalp rinse', 'Warm shower + cool scalp + full grooming'],
  'a-10': ['45 min baby duty', '60 min baby duty', '90 min full baby duty (07:00-08:30)', '90 min + Jyoti morning rest protected'],
  'a-11': ['Write 1 priority', 'Write 3 priorities', '1-3-5 matrix + humidifier ON', '1-3-5 + humidifier + monitor angle verified'],
  'a-12': ['45 min focus', '60 min deep block', '90 min architecture/code', '90 min + zero interruptions logged'],
  'a-13': ['5 min break', '10 min walk', '10 min walk + 20-20-20 eye rest', '10 min + 20-20-20 + 10 blinks + mineral water'],
  'a-14': ['45 min focus', '60 min block', '90 min deliverables block', '90 min + PR submitted'],
  'a-15': ['1 outbound message', '2 outbound touches', '3 high-value touches', '3 touches + follow-ups logged in CRM'],
  'a-16': ['45 min code', '60 min execution', '90 min execution/PRs', '90 min + all tests passing'],
  'a-17': ['5 min break', '10 min walk', '10 min walk + warm herbal sip', '10 min walk + CCF/herbal sip + fresh air (no coffee/chai)'],
  'a-18': ['45 min ops', '60 min ops', '90 min pipeline/ops', '90 min + all client threads closed'],
  'a-19': ['Close laptop', 'Review tasks', '5 min full shutdown ritual', 'Shutdown + desk cleared for morning'],
  'a-20': ['15 min walk', '20 min walk', '30 min stroller walk', '30 min + interactive sensory points'],
  'a-21': ['Clear table', 'Prep 1 item', 'Full kitchen prep support', 'Prep + cook support with Jyoti'],
  'a-22': ['10 min walk', '15 min walk', '15 min walk with family', '20 min + phone-free connection'],
  'a-23': ['Dishes only', 'Dishes + counters', 'Full 15-min reset', 'Reset + coffee prepped for morning'],
  'a-24': ['1 win noted', '2 wins noted', '3 wins logged in journal', '3 wins + 1 gratitude reflection logged'],
  'a-25': ['Clothes laid out', 'Clothes + water bottle prepped', 'Full clothes + workspace + priorities ready', 'Full prep + zero friction morning guaranteed'],
  'a-26': ['Reduce screens 30m', 'No screens 21:45', 'Complete blackout by 21:35', '21:35 blackout + phone in other room + ciliary reset'],
  'a-27': ['Bed by 23:00', 'Bed by 22:30', 'Lights out by 22:00', '22:00 sharp + 7h logged nightly'],
  'a-28': ['Warm water', 'CCF infusion', 'Warm water / herbal infusion + snack', 'Herbal infusion (Tulsi/CCF) + no tea/coffee needed'],
  'a-29': ['Eat lunch', 'Add protein', 'Cooked protein + sautéed veg + dal', '+ ghee/amla + zero mealtime gulps'],
  'a-30': ['Eat dinner', 'Warm dinner', 'Warm protein + cooked vegetables', '+ no raw salad + portion control'],
  'a-31': ['Skip today', 'Take multivitamin', 'Multivitamin daily (iron PAUSED)', 'Multivitamin + ferritin test done'],
  'a-32': ['Skip harmful products', 'Basic scalp wash', 'Full rinse protocol', '+ DHT blocker'],
  'a-33': ['Notice stress level', 'Rate 1-10', '5 min journal entry', 'Journal + action step'],
  'a-34': ['Reduce screen 30m', '1h phone-free', '2h phone-free', 'Zero screens near Shaarvi'],
  'a-35': ['Compliment Jyoti', '1 gesture of appreciation', 'Meaningful connection', '+ shared reflection'],
  'a-36': ['Reduce snacks', '1 sugar item max', 'Zero junk food', 'Zero junk + whole foods only'],
  'a-37': ['Glance at notes', '20 min review', '45 min board meeting', '60 min full alignment with Jyoti'],
  'a-38': ['Cook 1 base', 'Prep 2 bases', '2h batch cooking', '2h + portioned into containers'],
  'a-39': ['1 room tidy', '3 rooms tidy', '60 min full declutter', 'Declutter + deep clean + laundry'],
  'a-40': ['Quick sync 15min', '30 min review', '45 min board meeting', '+ OKR tracking'],
  'a-41': ['Note amount', 'Calculate 10%', 'Transfer 10%', 'Transfer + auto-invest'],
  'a-42': ['Glance at bank', 'Log 1 entry', 'Full income/expense log', '+ budget review'],
  'a-43': ['5 min touchpoint', '10 min floor play', '20 min play + language', '20 min + developmental focus'],
  'a-44': ['No work after 20:00 Fri', 'No work after 19:00 Fri', 'No code after 18:30 Fri', 'Date night planned'],
  'a-45': ['Note 1 prospect', '1 call/week', '2 calls/week', '2 calls + follow-ups booked'],
  'a-46': ['Identify 1 past client', 'Draft 1 request', '2 requests sent', '2 sent + follow-ups'],
  'a-47': ['1 comment', '2 interactions', '5 partner touches', '5 touches + value delivered'],
  'a-48': ['Check invoices', 'Update deals', 'Full 45-min admin session', '+ week prep done'],
  'a-49': ['Draft 1 post', 'Record 1 post', '2h batch session', '2h + scheduled for week'],
  'a-50': ['20 min stroller stroll', '30 min park visit', '1h sensory nature outing', '1h+ new nature exploration logged'],
  'a-51': ['Skip today', 'Take sometimes', 'D3 + Omega-3 with lunch', 'D3 + Omega-3 with lunch + track levels'],
  'a-52': ['Skip today', 'Take sometimes', 'Magnesium at 21:15 + warm milk/haldi', 'Magnesium 21:15 + warm milk + track sleep quality'],
  'a-53': ['1 quick call', '2 calls', '45 min calls/sync block', '45 min + notes logged for follow-up'],
  'a-54': ['3 min sit', '5 min meditation', '10 min meditation & stillness', '10 min deep silence post-Kriya'],
  'a-55': ['5 min pranayama', '10 min pranayama', '15 min Sudarshan Kriya & Pranayama', 'Full 3-stage Ujjayi + Bhastrika + Kriya sequence'],
  'a-56': ['Think of 1 goal', '3 min visualize', '5 min full visualization', '5 min + written down'],
  'a-57': ['Skim 1 page', '5 min reading', '10 min reading', '10 min + 1 key insight noted'],
  'a-58': ['1 sentence', '5 min journal', '10 min full journal + stiffness log', '10 min + gratitude + stiffness minutes + intention set'],
  'a-59': ['30 min couple time', '60 min couple time', '90 min dedicated couple connection', '90 min + phone-free shared activity with Jyoti'],
  'a-60': ['10 min mobility', '20 min stretch', '30 min restorative stretch & foam roll', '30 min + full posture recovery routine'],
  'a-61': ['Fill bottle with water', 'Water + salt', '2L mineral bottle (salt + lemon)', '2L mineral bottle + 3L daily rail + zero mealtime gulps'],
  'a-62': ['Skip today', '1–2 drops daily', '4× daily drops (09/12/15/18)', '4× daily + 20-20-20 + assess dryness'],
  'a-63': ['Skip compress', '5 min warm cloth', '10 min warm compress over closed eyelids', '10 min heated eye mask + meibomian gland clearance'],
  'a-64': ['3 min gentle stretch', '5 min bed mobility', '10 min full spinal mobility in bed', '10 min + stiffness assessment before standing'],
  'a-65': ['Stand once per hour', 'Stand every 45 min', 'Stand + walk 3 min + back extension', 'Full 45-min timer + walk + extension + logged'],
  'a-66': ['Skip today', '5 min oil on joints', '10 min warm sesame abhyanga', '10 min full abhyanga (joints, back, scalp)'],
  'a-67': ['5 min walk', '8 min walk', '10 min post-breakfast walk', '10 min walk + take Shaarvi'],
  'a-68': ['5 min walk', '8 min walk', '10 min post-lunch walk', '10 min + mindful digestion walk'],
  'a-69': ['3 min stretch', '5 min wind-down', '10 min spinal wind-down', '10 min supine twist + legs up wall + child\'s pose'],
};

export const jyotiTierDescriptions = {
  'j-1':  ['Rest until 7:00', 'Sleep until 7:30', 'Sleep until 8:00 protected', 'Full 8:00 rest + energized start'],
  'j-2':  ['Drink 250ml', '500ml water', '500ml warm water', '500ml + morning hydration routine'],
  'j-4':  ['30 min focus', '45 min focus', '60 min Career Session', '60 min + project deliverable done'],
  'j-6':  ['15 min lunch', '30 min lunch', '45 min proper lunch', '45 min + galactagogue foods included'],
  'j-9':  ['15 min quick bath', '30 min massage + bath', '45 min abhyanga + exercises + bath', '60 min full abhyanga + exercises + play + warm bath'],
  'j-10': ['Quick bite', 'Breakfast eaten', 'Nourishing breakfast + multivitamins', 'Breakfast + multivitamins + hydration'],
  'j-36': ['Quick rinse', 'Start washing machine', 'Wash & hang Shaarvi clothes', 'Full baby laundry done by 11:00'],
  'j-11': ['Rock to sleep', 'Settle in 15 min', 'Settled for nap + white noise', 'Smooth 30-min nap settle, cozy sleep'],
  'j-12': ['30 min bath/tidy', '1h bath/tidy', 'Full bath + room cleanup', '1h30 bath + deep room cleanup done by 13:00'],
  'j-14': ['15 min creative', '30 min creative', '45 min project time', '60 min + portfolio progress'],
  'j-15': ['Feed only', 'Feed + short walk', 'Feed + full stroller stroll', 'Feed + nature exploration'],
  'j-16': ['5 min stretching', '10 min pelvic exercises', '20 min full postpartum movement', '20 min + core recovery routine'],
  'j-17': ['Drink water', 'Fruit snack', 'Fruit + nuts + water', 'Whole nutrition snack + hydration'],
  'j-18': ['10 min walk', '15 min walk', '20 min family stroller walk', '20 min + happy family connection'],
  'j-19': ['Eat dinner', 'Light healthy dinner', 'Nourishing dinner + family time', 'Mindful dinner + clean ingredients'],
  'j-20': ['5 min stroll', '10 min walk', '15 min stroll with Ashish', '15 min + peaceful evening chat'],
  'j-21': ['Quick feed', 'Feed + lullaby', 'Full bedtime routine', 'Calm sleep + baby settled'],
  'j-22': ['Sleep by 22:30', 'Sleep by 22:00', 'Lights out 21:30', '21:30 + 7h deep sleep logged'],
  'j-23': ['2L water', '2.5L water', '3.5L water tracked', '3.5L + full hydration balance'],
  'j-24': ['1 healthy meal', 'Iron & calcium foods', 'Full balanced postpartum meals', 'Nutrient-rich plan followed 100%'],
  'j-25': ['Think of 1 joy', 'Write 1 win', '5 min gratitude journal', 'Journal + self-love reflection'],
  'j-26': ['Reduce phone during feed', 'Phone away 15m', 'Zero screens while nursing', '100% loving eye contact with Shaarvi'],
  'j-27': ['Quick greeting', '5 min conversation', 'Meaningful connection with Ashish', 'Shared reflections + mutual support'],
  'j-28': ['1 sweet max', 'Low sugar intake', 'Zero refined sugar', 'Zero junk + pure nutritious meals'],
  'j-29': ['15 min review', '30 min review', '60 min Sunday board meeting', '60 min + week aligned with Ashish'],
  'j-30': ['30 min date', '60 min date', '2h dedicated date night', '2h + romantic dinner/movie'],
  'j-31': ['15 min self-care', '30 min pampering', '60 min full spa & relaxation', '60 min + complete rejuvenation'],
  'j-32': ['Note 1 achievement', 'Write 2 memories', 'Full weekly milestone log', 'Log + baby photos saved'],
  'j-33': ['30 min practice', '60 min output', '2h creative session', '2h + completed creative work'],
  'j-34': ['Short trip', '30 min outdoor time', '1h sensory outing with Shaarvi', '1h + new sensory stimuli explored'],
  'j-35': ['30 min couple time', '60 min couple time', '90 min dedicated couple connection', '90 min + quality couple conversation with Ashish'],
};

export const ashishTravelTierDescriptions = {
  'at-1':  ['3 min stretch', '5 min bed mobility', '10 min spinal mobility in bed', '10 min + stiffness assessment'],
  'at-2':  ['Drink 250ml', '500ml water', '500ml warm + lemon + B12 & ALA', '500ml + vata protocol'],
  'at-3':  ['5 min quick journal', '10 min compressed', '20 min Sudarshan Kriya & MOVERS', '20 min Kriya + silence + stiffness logged'],
  'at-4':  ['10 min gentle asanas', '15 min Padma Sadhana', '20 min Padma Sadhana + Surya Namaskar', 'Full Padma Sadhana sequence + 4 slow Surya Namaskars'],
  'at-5':  ['Skip today', '5 min oil', '10 min abhyanga lower back', '10 min full abhyanga (joints, back, scalp)'],
  'at-6':  ['Quick rinse', 'Warm shower', 'Warm shower + cool scalp', 'Warm shower + full grooming'],
  'at-7':  ['Grab food on the way', 'Light breakfast', 'Full breakfast (paneer/chilla/protein + papaya)', 'Full breakfast + nuts + papaya + clean protein'],
  'at-8':  ['Wave goodbye', '5 min with Shaarvi', '10 min Shaarvi session + 2L bottle packed', '10 min + 2L bottle in car ready'],
  'at-9':  ['Drive quietly', 'Listen to music', 'Technical audio block (06:30–09:15)', 'Audio block + lumbar support + sip water'],
  'at-10': ['Quick stretch', '1 min stand', '3-min standing extension on arrival', '3-min extension + assess stiffness'],
  'at-11': ['Check in', 'Morning work', 'Full office focus + eye drops', 'Full office + eye drops + 45-min breaks'],
  'at-12': ['Quick lunch', 'Eat at desk', 'Lunch + stealth block + 10m walk', 'Lunch + 5 bids + 10 touches + walk'],
  'at-13': ['Drive home', 'Drive + music', 'Return drive (13:30–16:30) + calls', 'Return drive + US calls + lumbar support'],
  'at-14': ['Quick sit', '5 min stretch', '15-min post-travel decompression', '15-min decompression + legs up wall'],
  'at-15': ['15 min email', '30 min catch-up', '60 min focused async block', '60 min + inbox zero + PRs checked'],
  'at-16': ['Close laptop', 'Review tasks', '5 min shutdown ritual', 'Shutdown + work brain off'],
  'at-17': ['15 min walk', '20 min walk', '30 min family stroller walk', '30 min + Shaarvi connection'],
  'at-18': ['Eat dinner', 'Help clear table', 'Dinner + dishes done', 'Dinner + full kitchen teamwork'],
  'at-19': ['5 min walk', '10 min walk', '15 min stroll with Jyoti', '15 min + peaceful chat'],
  'at-20': ['Dishes only', 'Dishes + counters', 'Full reset + baby bedtime routine', 'Reset + calm bedtime routine'],
  'at-21': ['1 win noted', '2 wins noted', '3 wins logged in journal', '3 wins + gratitude logged'],
  'at-22': ['Skip', 'Take magnesium', 'Magnesium + warm diluted milk', 'Magnesium + warm milk + haldi'],
  'at-23': ['3 min stretch', '5 min wind-down', '10 min spinal wind-down', '10 min + legs up wall 5 min'],
  'at-24': ['Bed by 22:30', 'Bed by 22:00', 'Lights out by 21:30', '21:30 sharp + 7.5h sleep protected'],
  'at-25': ['1L water', '2L water', '3L water protocol', '3L + sip in transit + zero mealtime gulps'],
  'at-26': ['Skip', 'Basic wash', 'Full scalp rinse protocol', '+ DHT blocker'],
  'at-27': ['Reduce screen 30m', '1h phone-free', '2h phone-free', 'Zero screens near Shaarvi'],
  'at-28': ['1 junk snack', 'Low sugar snacks', 'Zero junk on travel', 'Clean whole foods only all day'],
  'at-29': ['Skip today', 'Take sometimes', 'D3 + Omega-3 with lunch', 'D3 + Omega-3 with lunch + track levels'],
  'at-30': ['Skip today', 'Take B12 sometimes', 'B12 fasting with warm water', 'B12 at 04:55 + track energy'],
};

export const sharedCoupleHabits = {
  // Shared Lunch (14:00)
  'a-29': { partnerId: 'j-6', type: 'meal', badge: '👫 Shared Lunch (2 PM)', partnerName: 'Jyoti', partnerAction: 'Shared mindful meal together at 14:00' },
  'j-6':  { partnerId: 'a-29', type: 'meal', badge: '👫 Shared Lunch (2 PM)', partnerName: 'Ashish', partnerAction: 'Shared mindful meal together at 14:00' },

  // Joint Family Stroller Walk (18:35)
  'a-20': { partnerId: 'j-18', type: 'family', badge: '👨‍👩‍👧 Family Stroller Walk', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Joint evening stroller walk outdoors' },
  'j-18': { partnerId: 'a-20', type: 'family', badge: '👨‍👩‍👧 Family Stroller Walk', partnerName: 'Ashish & Shaarvi', partnerAction: 'Joint evening stroller walk outdoors' },

  // Dinner Prep & Family Meal (19:25)
  'a-21': { partnerId: 'j-19', type: 'meal', badge: '🍽️ Shared Dinner Prep', partnerName: 'Jyoti', partnerAction: 'Kitchen teamwork & dinner setup together' },
  'j-19': { partnerId: 'a-21', type: 'meal', badge: '🍽️ Shared Dinner Prep', partnerName: 'Ashish', partnerAction: 'Kitchen teamwork & dinner setup together' },
  'a-30': { partnerId: 'j-19', type: 'meal', badge: '🍽️ Shared Dinner', partnerName: 'Jyoti', partnerAction: 'Nourishing home-cooked dinner together' },

  // Post-Dinner Walk (20:15)
  'a-22': { partnerId: 'j-20', type: 'couple', badge: '🌙 Post-Dinner Walk', partnerName: 'Jyoti', partnerAction: '15-min relaxing couple walk' },
  'j-20': { partnerId: 'a-22', type: 'couple', badge: '🌙 Post-Dinner Walk', partnerName: 'Ashish', partnerAction: '15-min relaxing couple walk' },

  // Daily Appreciation / Connection
  'a-35': { partnerId: 'j-27', type: 'couple', badge: '💖 Couple Connection', partnerName: 'Jyoti', partnerAction: 'Daily genuine verbal appreciation & check-in' },
  'j-27': { partnerId: 'a-35', type: 'couple', badge: '💖 Couple Connection', partnerName: 'Ashish', partnerAction: 'Daily genuine verbal appreciation & check-in' },

  // Sunday Board Meeting (★)
  'a-37': { partnerId: 'j-29', type: 'strategic', badge: '★ Board Meeting', partnerName: 'Jyoti', partnerAction: 'Sunday alignment & strategic review' },
  'j-29': { partnerId: 'a-37', type: 'strategic', badge: '★ Board Meeting', partnerName: 'Ashish', partnerAction: 'Sunday alignment & strategic review' },

  // Friday Date Night (★)
  'a-44': { partnerId: 'j-30', type: 'date', badge: '★ Couple Date Night', partnerName: 'Jyoti', partnerAction: '2-hour uninterrupted date window' },
  'j-30': { partnerId: 'a-44', type: 'date', badge: '★ Couple Date Night', partnerName: 'Ashish', partnerAction: '2-hour uninterrupted date window' },

  // Weekend Daytime Couple Connection (★ Saturday)
  'a-59': { partnerId: 'j-35', type: 'couple', badge: '★ Weekend Couple Time', partnerName: 'Jyoti', partnerAction: 'Saturday 90-min couple connection & relaxation' },
  'j-35': { partnerId: 'a-59', type: 'couple', badge: '★ Weekend Couple Time', partnerName: 'Ashish', partnerAction: 'Saturday 90-min couple connection & relaxation' },

  // Weekend Sensory Nature Outing
  'a-50': { partnerId: 'j-34', type: 'family', badge: '🌿 Nature Outing', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Weekend park & sensory exploration' },
  'j-34': { partnerId: 'a-50', type: 'family', badge: '🌿 Nature Outing', partnerName: 'Ashish & Shaarvi', partnerAction: 'Weekend park & sensory exploration' },

  // Travel Mode Counterparts
  'at-17': { partnerId: 'j-18', type: 'family', badge: '👨‍👩‍👧 Family Stroller Walk', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Evening walk after return' },
  'at-18': { partnerId: 'j-19', type: 'meal', badge: '🍽️ Shared Dinner Prep', partnerName: 'Jyoti', partnerAction: 'Dinner teamwork after travel' },
  'at-19': { partnerId: 'j-20', type: 'couple', badge: '🌙 Post-Dinner Walk', partnerName: 'Jyoti', partnerAction: 'Post-dinner walk together' },
};

export function getSharedHabitInfo(habitId) {
  if (!habitId) return null;
  return sharedCoupleHabits[habitId] || null;
}

export const timeSlotDefinitions = {
  morning: { label: 'Morning Routine',  time: '04:45–08:30', emoji: '🌅', color: '#D4A03E' },
  work:    { label: 'Deep Work & Ops',   time: '08:30–18:30', emoji: '⚡', color: '#D4B36A' },
  evening: { label: 'Evening & Family', time: '18:30–22:00', emoji: '🌙', color: '#B08D3E' },
  anytime: { label: 'Health & Mindset', time: 'All Day',     emoji: '💚', color: '#6366f1' },
  weekly:  { label: 'Weekly Recurring', time: 'Weekly',      emoji: '📅', color: '#B8865A' },
};

export const timeSlotOrder = {
  morning: 1,
  work: 2,
  evening: 3,
  anytime: 4,
  weekly: 5,
};

export function getTimeSlotForHabit(id) {
  // Ashish core habits (micro-detail: a-1..a-69)
  if (['a-1','a-2','a-3','a-4','a-5','a-6','a-7','a-8','a-9','a-10','a-54','a-55','a-56','a-57','a-58','a-60','a-61','a-64','a-66','a-67'].includes(id)) return 'morning';
  if (['a-11','a-12','a-13','a-28','a-31','a-14','a-15','a-16','a-29','a-51','a-68','a-17','a-62','a-18','a-53','a-59'].includes(id)) return 'work';
  if (['a-19','a-20','a-43','a-21','a-30','a-22','a-23','a-24','a-25','a-26','a-52','a-69','a-63','a-27'].includes(id)) return 'evening';
  if (['a-32','a-33','a-34','a-35','a-36','a-65'].includes(id)) return 'anytime';
  if (['a-37','a-38','a-39','a-40','a-41','a-42','a-44','a-45','a-46','a-47','a-48','a-49','a-50'].includes(id)) return 'weekly';

  // Ashish travel habits (health-adjusted: at-1..at-30)
  if (['at-1','at-2','at-3','at-4','at-5','at-6','at-7','at-8'].includes(id)) return 'morning';
  if (['at-9','at-10','at-11','at-12','at-13','at-29'].includes(id)) return 'work';
  if (['at-14','at-15','at-16','at-17','at-18','at-19','at-20','at-21','at-22','at-23','at-24'].includes(id)) return 'evening';
  if (['at-25','at-26','at-27','at-28','at-30'].includes(id)) return 'anytime';

  // Ashish office mid-week (Tue–Thu flat→office: ao-1..ao-34)
  if (['ao-1','ao-2','ao-3','ao-4','ao-5','ao-6','ao-7','ao-8'].includes(id)) return 'morning';
  if (['ao-9','ao-10','ao-11','ao-12','ao-13','ao-14','ao-15','ao-16','ao-17','ao-18','ao-19','ao-20'].includes(id)) return 'work';
  if (['ao-21','ao-22','ao-23','ao-24','ao-25','ao-26','ao-27','ao-28','ao-29'].includes(id)) return 'evening';
  if (['ao-30','ao-31','ao-32','ao-33','ao-34'].includes(id)) return 'anytime';

  // Ashish office Friday (flat→office→Ludhiana: af-1..af-34)
  if (['af-1','af-2','af-3','af-4','af-5','af-6','af-7','af-8'].includes(id)) return 'morning';
  if (['af-9','af-10','af-11','af-12','af-13','af-14','af-15','af-16','af-17','af-18','af-19','af-20'].includes(id)) return 'work';
  if (['af-21','af-22','af-23','af-24','af-25','af-26','af-27','af-28','af-29'].includes(id)) return 'evening';
  if (['af-30','af-31','af-32','af-33','af-34'].includes(id)) return 'anytime';

  // Ashish half-day & holiday habits
  if (['ah-1','ah-2','ah-3'].includes(id)) return 'work';

  // Jyoti habits by ID (micro-detail: j-1..j-36)
  if (['j-1','j-2','j-4','j-9','j-10','j-36'].includes(id)) return 'morning';
  if (['j-11','j-12','j-14','j-6','j-35'].includes(id)) return 'work';
  if (['j-15','j-16','j-17','j-18','j-19','j-20','j-21','j-22'].includes(id)) return 'evening';
  if (['j-23','j-24','j-25','j-26','j-27','j-28'].includes(id)) return 'anytime';
  if (['j-29','j-30','j-31','j-32','j-33','j-34'].includes(id)) return 'weekly';

  // Fallback by habit name prefixes
  return 'anytime';
}

export function getHabitCategory(habit) {
  const name = (habit.name || '').toLowerCase();
  const id = (habit.id || '');
  if (['a-4','a-5','a-6','a-7','a-60','a-64','a-67','a-68','a-69','j-16','at-4','at-10','at-14','at-23','ao-3','ao-13','ao-16','ao-23','af-3','af-13','af-15','af-28'].includes(id) || name.includes('workout') || name.includes('exercise') || name.includes('run') || name.includes('walk') || name.includes('stretch') || name.includes('mobility') || name.includes('yoga') || name.includes('abhyanga') || name.includes('extension') || name.includes('decompression')) return 'fitness';
  if (['a-2','a-8','a-28','a-29','a-30','a-31','a-36','a-51','a-52','a-61','j-10','j-24','j-28','j-6','at-2','at-7','at-12','at-18','at-22','at-25','at-28','at-29','at-30','ao-2','ao-7','ao-11','ao-15','ao-24','ao-28','ao-30','ao-33','af-2','af-7','af-11','af-14','af-23','af-27','af-30','af-33'].includes(id) || name.includes('water') || name.includes('shake') || name.includes('protein') || name.includes('diet') || name.includes('breakfast') || name.includes('lunch') || name.includes('dinner') || name.includes('supplement') || name.includes('multivitamin') || name.includes('mineral bottle') || name.includes('papaya') || name.includes('green tea')) return 'nutrition';
  if (['a-11','a-12','a-14','a-15','a-16','a-18','a-24','a-25','a-45','a-46','a-47','a-48','a-49','a-53','j-4','j-14','at-9','at-11','at-13','at-15','at-16','ao-9','ao-10','ao-12','ao-14','ao-17','ao-19','ao-20','ao-26','ao-34','af-9','af-10','af-12','af-16','af-17','af-18','af-19','ah-1','ah-2','ah-3'].includes(id) || name.includes('deep work') || name.includes('block') || name.includes('pipeline') || name.includes('code') || name.includes('architecture') || name.includes('client') || name.includes('review') || name.includes('priority') || name.includes('career') || name.includes('office') || name.includes('stealth') || name.includes('drive') || name.includes('execution') || name.includes('content') || name.includes('project')) return 'work';
  if (['a-10','a-20','a-21','a-22','a-34','a-35','a-43','a-44','a-50','a-59','a-66','j-9','j-11','j-15','j-18','j-21','j-26','j-27','j-30','j-35','j-36','at-5','at-8','at-17','at-18','at-19','at-20','at-27','ao-8','ao-22','af-8','af-21','af-22','af-23','af-24','af-25','af-32'].includes(id) || name.includes('shaarvi') || name.includes('jyoti') || name.includes('ashish') || name.includes('family') || name.includes('baby') || name.includes('date') || name.includes('stroller') || name.includes('board meeting') || name.includes('abhyanga') || name.includes('couple') || name.includes('video call')) return 'family';
  if (['a-3','a-9','a-19','a-26','a-27','a-32','a-33','a-54','a-55','a-56','a-57','a-58','a-62','a-63','a-65','j-1','j-2','j-12','j-22','j-25','j-31','at-1','at-3','at-6','at-21','at-24','at-26','ao-1','ao-4','ao-5','ao-6','ao-18','ao-21','ao-25','ao-27','ao-29','ao-31','ao-32','af-1','af-4','af-5','af-6','af-20','af-26','af-29','af-31'].includes(id) || name.includes('sleep') || name.includes('wake') || name.includes('bed') || name.includes('journal') || name.includes('gratitude') || name.includes('curfew') || name.includes('sunlight') || name.includes('grooming') || name.includes('shower') || name.includes('scalp') || name.includes('meditation') || name.includes('breathwork') || name.includes('visualization') || name.includes('scribing') || name.includes('reading') || name.includes('bath') || name.includes('eye drops') || name.includes('eye compress') || name.includes('movement break') || name.includes('spinal') || name.includes('lights out')) return 'rest';
  return 'ops';
}

export function getCurrentTimeBlock(targetDate = new Date()) {
  const now = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < 8 * 60 + 30) return 'morning';  // 00:00–08:30
  if (mins < 18 * 60 + 30) return 'work';    // 08:30–18:30
  if (mins < 22 * 60) return 'evening';      // 18:30–22:00
  return 'evening';
}
