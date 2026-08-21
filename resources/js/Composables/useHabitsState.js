import { ref, computed } from 'vue';

// ── Progressive Habits: Ashish's Track — Micro-Detail (58 activities, time-sequenced) ──
export const ashishHabits = [
  // ── MORNING 05:00–08:30 — Full MOVERS Protocol (17 micro-steps) ──
  { id: 'a-1',  name: '05:00 Alarm — Out of Bed',                        points: 1, hint: 'Feet on the floor by 05:00 sharp. No snooze button. Sit up → stand → drink water → start moving immediately.' },
  { id: 'a-2',  name: '05:05 500ml Warm Water (5 min)',                  points: 1, hint: 'Drink 500ml warm water to rehydrate after sleep before anything else. Protein comes later with your post-workout shake.' },
  { id: 'a-54', name: '05:10 MOVERS: Meditation (10 min)',               points: 1, hint: 'Sit quietly, eyes closed, focus on breath. Any style works — guided app or silent. This is the "M" in MOVERS: settle the mind before the day starts.' },
  { id: 'a-55', name: '05:20 MOVERS: Oxygenation — Breathwork (5 min)',  points: 1, hint: 'Structured breathwork: box breathing, Wim Hof rounds, or alternate nostril breathing. The "O" in MOVERS — floods the body with oxygen and lowers stress before the day begins.' },
  { id: 'a-56', name: '05:25 MOVERS: Visualization (5 min)',             points: 1, hint: 'Close your eyes and mentally rehearse today going exactly as you want it to — the wins, the hard conversations, how you want to show up. The "V" in MOVERS.' },
  { id: 'a-57', name: '05:30 MOVERS: Reading (10 min)',                  points: 1, hint: 'Read something that grows you — business, craft, or personal development. Not news, not social feeds. The "R" in MOVERS.' },
  { id: 'a-58', name: '05:40 MOVERS: Scribing — Journal (10 min)',       points: 1, hint: 'Write by hand: what you\'re grateful for, your intention for today, and 1 insight from your reading. The "S" in MOVERS — different from the evening stress check-in, this one sets the tone for the day rather than reviewing it.' },
  { id: 'a-3',  name: '05:50 Outdoor Sunlight & Fresh Air (5 min)',      points: 1, hint: 'Step onto balcony or outside for natural light exposure before your workout. Sets your circadian rhythm and boosts alertness.' },
  { id: 'a-4',  name: '05:55 45-Min Strength Workout',                   points: 2, daysOfWeek: [1, 3, 5], scheduleLabel: 'Mon, Wed, Fri', hint: 'Full 45-min strength training session (upper/lower/core). Warm up 5 min, focus on progressive overload, cool down. The "E" in MOVERS — exercise closes out the protocol.' },
  { id: 'a-5',  name: '05:55 45-Min Cardio Workout',                     points: 2, daysOfWeek: [2, 4], scheduleLabel: 'Tue, Thu', hint: 'Zone 2 cardio or interval running/cycling. Build cardiovascular endurance and burn morning energy. The "E" in MOVERS.' },
  { id: 'a-6',  name: '05:55 45-Min Long Run Workout',                   points: 2, daysOfWeek: [6], scheduleLabel: 'Sat Only', hint: 'Steady-state outdoor long run. Pace yourself comfortably, maintain steady breathing, enjoy the distance. The "E" in MOVERS.' },
  { id: 'a-7',  name: '06:40 5-Min Post-Workout Stretch & Foam Roll',    points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6], scheduleLabel: 'Mon–Sat', hint: 'Cool down stretches: calves, quads, hamstrings, back, shoulders. Reduces soreness and prevents injury.' },
  { id: 'a-8',  name: '06:45 Whey Protein + Muesli, Milk & Banana',      points: 1, daysOfWeek: [1, 2, 3, 4, 5, 6], scheduleLabel: 'Mon–Sat', hint: 'Post-workout refuel: 1 scoop whey isolate blended or shaken, plus a bowl of muesli with milk and a banana. Protein + carbs within 30 min of finishing your workout.' },
  { id: 'a-9',  name: '06:55 Cold Shower & Morning Grooming',            points: 1, hint: 'End shower with 60–90 seconds cold water. Combines alertness, dopamine boost, and disciplined grooming protocol.' },
  { id: 'a-10', name: '07:05 Take Shaarvi (07:05–08:30 Baby Duty)',      points: 2, hint: '100% focused daddy-daughter time. Diaper change, feed, tummy time, baby songs. Gives Jyoti her protected 08:05–09:05 career hour (Ashish solo 08:05–08:30). Hands off cleanly at 08:30 for deep work.' },

  // ── WORK HOURS 08:30–18:30 (8 micro-steps) ──
  { id: 'a-11', name: '08:30 Daily 3-Tier Priority Definition (5 min)', points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Write down: 1 Must-Do (T1), 2 Should-Do (T2), 2 Nice-to-Do (T3). Never open email or Slack before writing these down.' },
  { id: 'a-12', name: '08:45 Block 1 — Deep Architecture / Code (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Pure deep work on core product code/system architecture. Phone on silent in another room. Zero tabs except repo.' },
  { id: 'a-13', name: '10:15 10-Min Walk + 300ml Hydration Break',       points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Step away from screen. Walk around, stretch eyes by looking 20ft away, drink 300ml water.' },
  { id: 'a-14', name: '11:00 Block 2 — High-Leverage Deliverables (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Second deep work block: product features, PR reviews, critical client deliverables. Starts after your 10:30 breakfast break, not before — protects the meal from getting skipped.' },
  { id: 'a-15', name: '12:30 15-Min Pipeline & Outreach Action',         points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Send 3 high-value outbound messages or follow up with active enterprise leads. Keep the sales pipeline warm daily.' },
  { id: 'a-16', name: '12:45 Block 3 — Technical Execution / PRs (75m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Afternoon build block: code implementations, bug fixes, automated test writing, code review merging. Runs 12:45–14:00 right before lunch.' },
  { id: 'a-17', name: '15:00 10-Min Walk + Green Tea / Black Coffee',    points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'After-lunch stroll: 10 min stroll outside or around home. Enjoy green tea or black coffee. No sugary snacks.' },
  { id: 'a-18', name: '15:15 Block 4 — Pipeline / Ops / Client Work (90m)', points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Operations, client communications, system monitoring, and documentation. Tie up all loose work threads.' },
  { id: 'a-53', name: '17:00 Client Calls & Team Sync (60m)',              points: 2, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Live calls, standups, and check-ins — video/phone conversations that don\'t fit inside a heads-down deep work block. Ends at 18:00 with a clean 30-min buffer before shutdown.' },

  // ── EVENING & SHUTDOWN 18:30–22:00 (10 micro-steps) ──
  { id: 'a-19', name: '18:30 Work Day Shutdown Ritual (5 min)',          points: 1, daysOfWeek: [1, 2, 3, 4, 5], scheduleLabel: 'Mon–Fri', hint: 'Close all work browser tabs. Review completed tasks. Log tomorrow top 3 items in notebook. Officially disconnect.' },
  { id: 'a-20', name: '18:35 Joint Family Stroller Walk with Jyoti (30 min)', points: 2, hint: 'Outdoor stroller walk together with Jyoti & Shaarvi. Fresh evening air and quality family time.' },
  { id: 'a-43', name: '19:05 Shaarvi Floor Play & Language Time (20m)',  points: 2, hint: 'Interactive floor play: read baby board books, practice sounds and clapping, stacking toys. Zero phones around.' },
  { id: 'a-21', name: '19:25 Dinner Preparation & Shared Family Dinner', points: 1, hint: 'Help Jyoti with dinner setup, cooking support, and enjoy a nourishing meal together. Teamwork makes evenings smooth.' },
  { id: 'a-22', name: '20:15 Post-Dinner Stroll with Jyoti (15 min)',    points: 1, hint: 'Relaxed post-dinner walk with Jyoti & Shaarvi. Aids digestion, lowers blood sugar spike, encourages peaceful conversation.' },
  { id: 'a-23', name: '20:45 Kitchen Reset & Counter Clean (15 min)',   points: 1, hint: 'Wash dishes, wipe counters, start dishwasher/dryer, prepare coffee/water station for morning. Zero dirty dishes.' },
  { id: 'a-24', name: '21:00 Day Journaling & 3 Wins Log (5 min)',       points: 1, hint: 'Write 3 specific wins from today, 1 lesson learned, and 1 moment of gratitude. Solidifies progress mindset.' },
  { id: 'a-25', name: '21:05 Tomorrow Preparation (Clothes, Workspace)', points: 1, hint: 'Lay out workout clothes, fill water bottle, clear desk. Tomorrow is won tonight through frictionless morning setup.' },
  { id: 'a-26', name: '21:30 Screen Curfew — Phone on Charger in Other Room', points: 1, hint: 'All blue-light screens off by 21:30 sharp. Put phone on charger outside bedroom. Pick up a physical book instead.' },
  { id: 'a-27', name: '22:00 In Bed — Lights Out (7h Sleep Target)',     points: 2, hint: 'In bed with lights out by 22:00 to ensure a full 7 hours of restorative sleep before the 05:00 wake-up.' },

  // ── HEALTH, NUTRITION & MINDSET — ALL DAY (11 habits) ──
  { id: 'a-28', name: '10:30 Breakfast — High Protein & Iron Rich',      points: 1, hint: 'Nutritious breakfast with 25g+ protein (e.g. eggs, paneer, sprouts, moong dal) plus iron sources like spinach or seeds. Sits between Block 1 and Block 2 — a real sit-down meal, not a rushed bite.' },
  { id: 'a-29', name: '14:00 Lunch with Jyoti — Balanced Protein & Veg (45m)', points: 1, hint: 'Wholesome shared lunch with Jyoti at 2:00 PM: dal, green sabzi, roti/rice, and salad. Eat mindfully together away from work screens.' },
  { id: 'a-30', name: 'Dinner — Light Protein & Vegetables',              points: 1, hint: 'Light, easily digestible dinner with protein and fiber. Finish eating at least 2 hours before bedtime.' },
  { id: 'a-31', name: '10:30 Morning Supplement — B12 (with Breakfast)', points: 1, hint: 'Take right alongside breakfast (a-28) at 10:30. B12 supports energy metabolism and nerve health — take it consistently every morning with food.' },
  { id: 'a-51', name: '14:00 Midday Supplement — D3 + Omega-3 (with Lunch)', points: 1, hint: 'Take both right after your 14:00 lunch (a-29) — usually your meal with the most fat (dal + ghee/oil). D3 and Omega-3 are fat-soluble, so they absorb far better with a fatty meal.' },
  { id: 'a-52', name: 'Night Supplement — Magnesium (Before Bed)',       points: 1, hint: 'Take 30–60 min before lights-out (~21:00–21:30), with a light snack if it upsets an empty stomach. Magnesium relaxes muscles and the nervous system — it helps you fall asleep faster and sleep deeper, which directly supports your 7h floor.' },
  { id: 'a-32', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Follow your healthy scalp regimen: gentle shampoo rinse, avoid harsh chemicals, and apply any topical treatments.' },
  { id: 'a-33', name: '5-Minute Stress & Mindset Journaling',             points: 1, hint: 'Rate your daily stress 1–10. Write down 1 challenge, 1 thing you are grateful for, and 1 positive focus for tomorrow.' },
  { id: 'a-34', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: 'Never look at phones or tablets while interacting with Shaarvi. Babies learn from direct eye contact and face-to-face attention.' },
  { id: 'a-35', name: 'Daily Jyoti Appreciation / Connection (5 min)',   points: 1, hint: 'Express genuine verbal appreciation to Jyoti. Give a warm hug, ask how she is feeling, listen without giving advice.' },
  { id: 'a-36', name: 'No Refined Sugar / Junk Food Today',              points: 1, hint: 'Zero candy, sodas, fried snacks, or bakery sweets. Fuel your body with clean, whole, nutrient-dense nutrition.' },

  // ── WEEKLY RECURRING (14 habits) ──
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
];

// ── Ashish Travel Mode (Chandigarh) — Micro-Detail (33 activities) ──
export const ashishTravelHabits = [
  // ── PRE-DEPARTURE 05:00–06:30 (6 micro-steps) ──
  { id: 'at-1',  name: '05:00 Alarm — Out of Bed',                        points: 1, hint: 'Feet on the floor at 05:00. Start moving immediately. No snooze on travel days.' },
  { id: 'at-2',  name: '05:05 500ml Warm Water + 10g Protein',           points: 1, hint: 'Hydrate immediately with 500ml warm water and 10g protein before packing.' },
  { id: 'at-3',  name: '05:15 20-Min Bodyweight Movement',                points: 1, hint: 'Quick full-body circuit: pushups, squats, lunges, planks. Prepare muscles for sitting during the drive.' },
  { id: 'at-4',  name: '05:40 Cold Shower & Dress for Travel',            points: 1, hint: 'Cold shower to be 100% alert for the road. Put on comfortable driving clothes.' },
  { id: 'at-5',  name: '06:00 Travel Bag & Work Essentials Packed',       points: 1, hint: 'Pack laptop, charger, notebook, water bottle, healthy snacks, and change of clothes.' },
  { id: 'at-6',  name: '06:15 Kiss Shaarvi & Jyoti Goodbye',              points: 1, hint: 'Loving morning goodbye before heading out on the road to Chandigarh.' },

  // ── TRANSIT & CHANDIGARH OFFICE 06:30–16:00 (8 micro-steps) ──
  { id: 'at-7',  name: '06:30 Depart for Chandigarh (3h Drive)',          points: 1, hint: 'Smooth, safe, defensive driving. Keep safe distance, listen to podcasts/audiobooks.' },
  { id: 'at-8',  name: '07:30 Listen to 1 Educational Podcast / Audio',   points: 1, hint: 'Listen to business, engineering, or self-mastery podcast during the highway drive.' },
  { id: 'at-9',  name: '09:30 Arrive at Chandigarh Office & Settle In',   points: 1, hint: 'Arrive safely, unpack workspace, drink 300ml water, review today top 3 priorities.' },
  { id: 'at-10', name: '09:45 Block 1 — High-Priority Office Deep Work (90m)', points: 2, hint: 'Tackle critical office meetings, whiteboard sessions, or client discussions.' },
  { id: 'at-11', name: '11:15 10-Min Walk + Hydration Check',             points: 1, hint: 'Walk around the office building, stretch legs, drink 300ml water.' },
  { id: 'at-12', name: '11:30 Block 2 — Team Collaboration / Reviews (90m)', points: 2, hint: 'Team alignment, code reviews, strategy discussions, and project sign-offs.' },
  { id: 'at-13', name: '13:00 Depart Chandigarh for Return (3h Drive)',    points: 1, hint: 'Leave office by 13:00 sharp for smooth return journey before peak evening traffic.' },
  { id: 'at-14', name: '14:30 Mid-Drive Rest Stop (10 min Stretch & Water)', points: 1, hint: 'Safe highway stop: stretch hip flexors and back, drink water, stay refreshed.' },

  // ── EVENING & HOME RECOVERY 16:00–22:00 (9 micro-steps) ──
  { id: 'at-15', name: '16:00 Arrive Home & Reconnect with Jyoti & Shaarvi', points: 1, hint: 'Arrive home safely, wash up, give warm hugs to Jyoti and hold baby Shaarvi.' },
  { id: 'at-16', name: '16:30 15-Min Post-Travel Foam Roll & Decompression', points: 1, hint: 'Decompress spine, roll back and hamstrings after 6 total hours in the car.' },
  { id: 'at-17', name: '17:00 Block 3 — Async Inbox / Code Follow-Up (60m)', points: 2, hint: 'Clear urgent messages, reply to critical emails, review PRs from the day.' },
  { id: 'at-18', name: '18:00 Work Day Shutdown Ritual (5 min)',          points: 1, hint: 'Log completed tasks, close computer, officially transition into evening family mode.' },
  { id: 'at-19', name: '18:35 Walk Shaarvi in Stroller (30 min)',        points: 2, hint: 'Evening fresh air walk with Shaarvi. Share stories and point out interesting things.' },
  { id: 'at-20', name: '19:25 Family Dinner & Kitchen Support',          points: 1, hint: 'Nourishing home dinner with Jyoti. Help clear table and wash dishes together.' },
  { id: 'at-21', name: '20:15 Post-Dinner Family Walk (15 min)',         points: 1, hint: 'Gentle 15-min post-dinner stroll to unwind and aid digestion.' },
  { id: 'at-22', name: '21:00 Day Journaling & 3 Wins Log',               points: 1, hint: 'Write down 3 wins from today Chandigarh trip and 1 gratitude note.' },
  { id: 'at-23', name: '21:30 Screen Curfew & Lights Out by 22:00',      points: 2, hint: 'All devices off by 21:30. In bed by 22:00 for full 7 hours of recovery sleep.' },

  // ── HEALTH & MINDSET ON TRAVEL DAYS (10 habits) ──
  { id: 'at-24', name: 'Breakfast — High Protein & Iron (Before Leaving)', points: 1, hint: 'Eat a proper protein breakfast before driving. Eggs, paratha with paneer, or a hearty meal.' },
  { id: 'at-25', name: 'Lunch — Clean Protein & Greens (At Office)',      points: 1, hint: 'Wholesome lunch at office: dal, sabzi, roti. Avoid heavy fast food to prevent afternoon slumps.' },
  { id: 'at-26', name: 'Dinner — Light Protein & Vegetables',             points: 1, hint: 'Light home-cooked dinner. Finish eating 2 hours before bed for sound digestion.' },
  { id: 'at-27', name: 'Morning Supplement — B12 (with Breakfast)',       points: 1, hint: 'Take right after breakfast, before you leave. B12 supports energy for the drive and the day ahead.' },
  { id: 'at-32', name: 'Midday Supplement — D3 + Omega-3 (with Lunch)',   points: 1, hint: 'Take both right after office lunch — fat-soluble, absorbs better with a meal that has some fat in it. Also avoids fishy burps disrupting sleep tonight.' },
  { id: 'at-33', name: 'Night Supplement — Magnesium (Before Bed)',       points: 1, hint: 'Take 30 min before your 21:30 lights-out. Magnesium relaxes muscles and nervous system — helps you recover faster from a travel day.' },
  { id: 'at-28', name: '3 Litres Water Intake Daily',                     points: 1, hint: 'Keep a water bottle in the car. Drink steadily before, during, and after travel.' },
  { id: 'at-29', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Perform your scalp rinse protocol during the evening shower.' },
  { id: 'at-30', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: 'Full eye contact and loving presence with Shaarvi. No phones in hand.' },
  { id: 'at-31', name: 'No Refined Sugar / Junk Snacks on Travel',        points: 1, hint: 'Choose roasted nuts, fresh fruit, or clean snacks over gas station junk food.' },
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
  'a-1':  ['Alarm off, out of bed by 5:30', 'Out of bed by 5:15', 'Out of bed by 5:00 sharp', '5:00 sharp + zero snooze all week'],
  'a-2':  ['Drink 250ml water', '500ml water', '500ml + 10g protein', '500ml + 10g protein + electrolytes'],
  'a-3':  ['5 min outdoors', '10 min sunlight', '10 min + light stretching', '10 min + breathwork'],
  'a-4':  ['20 min workout', '30 min workout', '45 min full strength session', '45 min + progressive overload logged'],
  'a-5':  ['20 min light cardio', '30 min cardio', '45 min Zone 2 session', '45 min + heart rate tracked'],
  'a-6':  ['3 km run', '5 km run', '8 km long run', '8 km + pace target met'],
  'a-7':  ['2 min quick stretch', '5 min stretch', '5 min stretch + foam roll', '8 min full mobility protocol'],
  'a-8':  ['Drink shake', 'Whey + 5g creatine', 'Whey + creatine within 30m', 'Whey + creatine + meal logged'],
  'a-9':  ['30s cold rinse', '60s cold shower', '90s cold shower + groom', '2 min cold + full grooming protocol'],
  'a-10': ['45 min baby duty', '60 min baby duty', '90 min full baby duty (07:00-08:30)', '90 min + Jyoti morning rest protected'],
  'a-11': ['Write 1 priority', 'Write 2 priorities', '3-Tier priority matrix written', '3-Tier + time-blocked in calendar'],
  'a-12': ['45 min focus', '60 min deep block', '90 min architecture/code', '90 min + zero interruptions logged'],
  'a-13': ['5 min break', '10 min walk', '10 min walk + 300ml water', '10 min + eye rest protocol'],
  'a-14': ['45 min focus', '60 min block', '90 min deliverables block', '90 min + PR submitted'],
  'a-15': ['1 outbound message', '2 outbound touches', '3 high-value touches', '3 touches + follow-ups logged in CRM'],
  'a-16': ['45 min code', '60 min execution', '90 min execution/PRs', '90 min + all tests passing'],
  'a-17': ['5 min break', '10 min walk', '10 min walk + tea/coffee', '10 min + fresh air'],
  'a-18': ['45 min ops', '60 min ops', '90 min pipeline/ops', '90 min + all client threads closed'],
  'a-19': ['Close laptop', 'Review tasks', '5 min full shutdown ritual', 'Shutdown + desk cleared for morning'],
  'a-20': ['15 min walk', '20 min walk', '30 min stroller walk', '30 min + interactive sensory points'],
  'a-21': ['Clear table', 'Prep 1 item', 'Full kitchen prep support', 'Prep + cook support with Jyoti'],
  'a-22': ['10 min walk', '15 min walk', '15 min walk with family', '20 min + phone-free connection'],
  'a-23': ['Dishes only', 'Dishes + counters', 'Full 15-min reset', 'Reset + coffee prepped for morning'],
  'a-24': ['1 win noted', '2 wins noted', '3 wins logged in journal', '3 wins + 1 gratitude reflection logged'],
  'a-25': ['Clothes laid out', 'Clothes + water bottle prepped', 'Full clothes + workspace + priorities ready', 'Full prep + zero friction morning guaranteed'],
  'a-26': ['Reduce screens 30m', 'No screens 9:30pm', 'No screens 10pm', '10pm + reading only'],
  'a-27': ['Bed by 23:00', 'Bed by 22:30', 'Lights out by 22:00', '22:00 sharp + 7h logged nightly'],
  'a-28': ['Eat breakfast', 'Add protein', 'Protein + iron source', '+ meal prep'],
  'a-29': ['Eat lunch', 'Add protein', 'Protein + iron source', '+ balanced macros'],
  'a-30': ['Eat dinner', 'Add protein', 'Protein + iron source', '+ portion control'],
  'a-31': ['Skip today', 'Take B12 sometimes', 'B12 daily with breakfast', 'B12 daily + track energy levels'],
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
  'a-52': ['Skip today', 'Take sometimes', 'Magnesium before bed', 'Magnesium 30-60min pre-sleep + track quality'],
  'a-53': ['1 quick call', '2 calls', '45 min calls/sync block', '45 min + notes logged for follow-up'],
  'a-54': ['1 min sit', '5 min meditation', '10 min meditation', '10 min + breath awareness log'],
  'a-55': ['A few deep breaths', '3 min breathwork', '5 min structured breathwork', '5 min + heart rate calmed'],
  'a-56': ['Think of 1 goal', '3 min visualize', '5 min full visualization', '5 min + written down'],
  'a-57': ['Skim 1 page', '5 min reading', '10 min reading', '10 min + 1 key insight noted'],
  'a-58': ['1 sentence', '5 min journal', '10 min full journal entry', '10 min + gratitude + intention set'],
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
  'j-36': ['Quick rinse', 'Wash 1 load', 'Wash + hang full load', 'Wash + hang + fold ahead'],
};

export const ashishTravelTierDescriptions = {
  'at-1':  ['Alarm off, up by 5:30', 'Up by 5:15', 'Up by 5:00 sharp', '5:00 sharp + ready to roll'],
  'at-2':  ['Drink 250ml', '500ml water', '500ml + 10g protein', '500ml + protein shake prepped'],
  'at-3':  ['10 min movement', '15 min circuit', '20 min bodyweight circuit', '20 min + dynamic stretches'],
  'at-4':  ['Quick rinse', 'Cold shower', 'Cold shower + dressed', 'Cold shower + travel groomed'],
  'at-5':  ['Pack essentials', 'Pack laptop + clothes', 'Full bag packed smoothly', 'Bag + tech + food all prepped'],
  'at-6':  ['Wave goodbye', 'Quick kiss', 'Loving goodbye hugs', 'Goodbye + family blessed'],
  'at-7':  ['Leave by 7:00', 'Leave by 6:45', 'Depart 6:30 sharp', '6:30 departure + smooth drive'],
  'at-8':  ['Music only', '15 min podcast', 'Full episode listened', 'Podcast + 1 key insight noted'],
  'at-9':  ['Arrive by 10:00', 'Arrive by 9:45', 'Arrive 9:30 sharp', '9:30 arrival + workstation set'],
  'at-10': ['45 min work', '60 min deep block', '90 min deep work block', '90 min + critical task done'],
  'at-11': ['5 min break', '10 min walk', '10 min walk + water', '10 min + eye rest'],
  'at-12': ['45 min meeting', '60 min collab', '90 min team block', '90 min + all reviews cleared'],
  'at-13': ['Leave by 13:30', 'Leave by 13:15', 'Depart 13:00 sharp', '13:00 departure + beat traffic'],
  'at-14': ['Quick bathroom stop', '5 min stretch', '10 min stretch + water', '10 min + fresh alertness'],
  'at-15': ['Arrive home 16:30', 'Arrive 16:15', 'Arrive 16:00 home', '16:00 + loving family reunion'],
  'at-16': ['5 min stretch', '10 min roll', '15 min decompression', '15 min + posture restored'],
  'at-17': ['30 min email', '45 min follow-up', '60 min async execution', '60 min + inbox zero'],
  'at-18': ['Close laptop', 'Review tasks', '5 min shutdown ritual', 'Shutdown + work brain off'],
  'at-19': ['15 min stroll', '20 min stroll', '30 min stroller walk', '30 min + Shaarvi connection'],
  'at-20': ['Eat dinner', 'Help clear table', 'Dinner + dishes done', 'Dinner + full kitchen teamwork'],
  'at-21': ['5 min walk', '10 min walk', '15 min family stroll', '15 min + peaceful chat'],
  'at-22': ['1 win noted', '2 wins noted', '3 wins logged in journal', '3 wins + gratitude logged'],
  'at-23': ['Sleep by 22:30', 'Sleep by 22:15', 'Lights out by 22:00', '22:00 + 7h sleep protected'],
  'at-24': ['Eat breakfast', 'Add protein', 'Protein + iron source', '+ meal prep'],
  'at-25': ['Eat lunch', 'Add protein', 'Protein + iron source', '+ balanced macros'],
  'at-26': ['Eat dinner', 'Add protein', 'Protein + iron source', '+ portion control'],
  'at-27': ['Skip today', 'Take B12 sometimes', 'B12 daily with breakfast', 'B12 daily + track energy levels'],
  'at-28': ['1L water', '2L water', '3L water', '3L + electrolytes'],
  'at-29': ['Skip harmful products', 'Basic scalp wash', 'Full rinse protocol', '+ DHT blocker'],
  'at-30': ['Reduce screen 30m', '1h phone-free', '2h phone-free', 'Zero screens near Shaarvi'],
  'at-31': ['1 junk snack', 'Low sugar snacks', 'Zero junk on travel', 'Clean whole foods only all day'],
  'at-32': ['Skip today', 'Take sometimes', 'D3 + Omega-3 with lunch', 'D3 + Omega-3 with lunch + track levels'],
  'at-33': ['Skip today', 'Take sometimes', 'Magnesium before bed', 'Magnesium 30min pre-sleep + track quality'],
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

  // Weekend Sensory Nature Outing
  'a-50': { partnerId: 'j-34', type: 'family', badge: '🌿 Nature Outing', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Weekend park & sensory exploration' },
  'j-34': { partnerId: 'a-50', type: 'family', badge: '🌿 Nature Outing', partnerName: 'Ashish & Shaarvi', partnerAction: 'Weekend park & sensory exploration' },

  // Travel Mode Counterparts
  'at-19': { partnerId: 'j-18', type: 'family', badge: '👨‍👩‍👧 Family Stroller Walk', partnerName: 'Jyoti & Shaarvi', partnerAction: 'Evening walk after return' },
  'at-20': { partnerId: 'j-19', type: 'meal', badge: '🍽️ Shared Dinner Prep', partnerName: 'Jyoti', partnerAction: 'Dinner teamwork after travel' },
  'at-21': { partnerId: 'j-20', type: 'couple', badge: '🌙 Post-Dinner Walk', partnerName: 'Jyoti', partnerAction: 'Post-dinner walk together' },
};

export function getSharedHabitInfo(habitId) {
  if (!habitId) return null;
  return sharedCoupleHabits[habitId] || null;
}

export const timeSlotDefinitions = {
  morning: { label: 'Morning Routine',  time: '05:00–08:30', emoji: '🌅', color: '#D4A03E' },
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
  // Ashish core habits (micro-detail: a-1..a-58)
  if (['a-1','a-2','a-3','a-4','a-5','a-6','a-7','a-8','a-9','a-10','a-54','a-55','a-56','a-57','a-58'].includes(id)) return 'morning';
  if (['a-11','a-12','a-13','a-14','a-15','a-16','a-17','a-18','a-29','a-51','a-53'].includes(id)) return 'work';
  if (['a-19','a-20','a-21','a-22','a-23','a-24','a-25','a-26','a-27','a-43'].includes(id)) return 'evening';
  if (['a-28','a-30','a-31','a-32','a-33','a-34','a-35','a-36','a-52'].includes(id)) return 'anytime';
  if (['a-37','a-38','a-39','a-40','a-41','a-42','a-44','a-45','a-46','a-47','a-48','a-49','a-50'].includes(id)) return 'weekly';

  // Ashish travel habits (micro-detail: at-1..at-33)
  if (['at-1','at-2','at-3','at-4','at-5','at-6'].includes(id)) return 'morning';
  if (['at-7','at-8','at-9','at-10','at-11','at-12','at-13','at-14','at-25','at-32'].includes(id)) return 'work';
  if (['at-15','at-16','at-17','at-18','at-19','at-20','at-21','at-22','at-23'].includes(id)) return 'evening';
  if (['at-24','at-26','at-27','at-28','at-29','at-30','at-31','at-33'].includes(id)) return 'anytime';

  // Jyoti habits by ID (micro-detail: j-1..j-36)
  if (['j-1','j-2','j-4','j-9','j-10','j-36'].includes(id)) return 'morning';
  if (['j-11','j-12','j-14','j-6'].includes(id)) return 'work';
  if (['j-15','j-16','j-17','j-18','j-19','j-20','j-21','j-22'].includes(id)) return 'evening';
  if (['j-23','j-24','j-25','j-26','j-27','j-28'].includes(id)) return 'anytime';
  if (['j-29','j-30','j-31','j-32','j-33','j-34'].includes(id)) return 'weekly';

  // Fallback by habit name prefixes
  return 'anytime';
}

export function getHabitCategory(habit) {
  const name = (habit.name || '').toLowerCase();
  const id = (habit.id || '');
  if (['a-4','a-5','a-6','a-7','j-16','at-3'].includes(id) || name.includes('workout') || name.includes('exercise') || name.includes('run') || name.includes('walk') || name.includes('stretch')) return 'fitness';
  if (['a-2','a-8','a-28','a-29','a-30','a-31','a-36','a-51','a-52','j-10','j-24','j-28','j-6','at-2','at-24','at-25','at-26','at-27','at-31','at-32','at-33'].includes(id) || name.includes('water') || name.includes('shake') || name.includes('protein') || name.includes('diet') || name.includes('breakfast') || name.includes('lunch') || name.includes('dinner') || name.includes('supplement') || name.includes('multivitamin')) return 'nutrition';
  if (['a-11','a-12','a-14','a-15','a-16','a-18','a-24','a-25','a-45','a-46','a-47','a-48','a-49','a-53','j-4','j-14','at-10','at-12','at-17'].includes(id) || name.includes('deep work') || name.includes('block') || name.includes('pipeline') || name.includes('code') || name.includes('architecture') || name.includes('client') || name.includes('review') || name.includes('priority') || name.includes('career')) return 'work';
  if (['a-10','a-20','a-21','a-22','a-34','a-35','a-43','a-44','a-50','j-9','j-11','j-15','j-18','j-21','j-26','j-27','j-30','j-36','at-6','at-15','at-19','at-20','at-21','at-30'].includes(id) || name.includes('shaarvi') || name.includes('jyoti') || name.includes('ashish') || name.includes('family') || name.includes('baby') || name.includes('date') || name.includes('stroller') || name.includes('board meeting') || name.includes('abhyanga')) return 'family';
  if (['a-3','a-9','a-19','a-26','a-27','a-32','a-33','a-54','a-55','a-56','a-57','a-58','j-1','j-2','j-12','j-22','j-25','j-31','at-1','at-4','at-16','at-18','at-22','at-23','at-29'].includes(id) || name.includes('sleep') || name.includes('wake') || name.includes('bed') || name.includes('journal') || name.includes('gratitude') || name.includes('curfew') || name.includes('sunlight') || name.includes('grooming') || name.includes('shower') || name.includes('scalp') || name.includes('meditation') || name.includes('breathwork') || name.includes('visualization') || name.includes('scribing') || name.includes('reading') || name.includes('bath')) return 'rest';
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
