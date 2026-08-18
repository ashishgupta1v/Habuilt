<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { loadUserMonthlyState, saveUserMonthlyState, loadAllUserMonthlyStates } from '@/lib/supabase';
import {
  BarChart3,
  Gift,
  FileText,
  Compass,
  Edit3,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Check,
  ArrowUp,
  ArrowDown,
  Flame,
  Award,
  TrendingUp,
  Target,
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Layers,
  Star,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
  X,
  Heart,
  Briefcase,
  Trophy,
  CheckSquare,
  Settings,
  ChevronUp,
  ChevronDown,
  Shield,
  Crown,
  Gauge,
  Play,
  Eye,
  EyeOff,
  Download,
  Upload,
  MessageSquare,
  Smile,
  Battery,
  Activity,
  Share2,
  Users,
  BookOpen,
  Hash,
  Sparkle,
  Bell,
  Plane,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Archive,
  RotateCcw,
  Timer,
  Coffee,
  Pause,
  History,
  Link2,
  Volume2,
  VolumeX,
} from 'lucide-vue-next';

const props = defineProps({
  appName: {
    type: String,
    default: 'Habuilt Tracker',
  },
  today: {
    type: String,
    default: '',
  },
  userId: {
    type: String,
    default: '',
  },
  userEmail: {
    type: String,
    default: '',
  },
  wallet: {
    type: Number,
    default: 0,
  },
  month: {
    type: Number,
    default: 1,
  },
  year: {
    type: Number,
    default: 2000,
  },
  monthDays: {
    type: Number,
    default: 31,
  },
  currentDay: {
    type: Number,
    default: 1,
  },
  isCurrentMonth: {
    type: Boolean,
    default: true,
  },
  isFutureMonth: {
    type: Boolean,
    default: false,
  },
  canNavigatePrevMonth: {
    type: Boolean,
    default: false,
  },
  canNavigateNextMonth: {
    type: Boolean,
    default: false,
  },
  previousMonth: {
    type: Object,
    default: () => ({ month: 1, year: 2000 }),
  },
  nextMonth: {
    type: Object,
    default: () => ({ month: 1, year: 2000 }),
  },
  habits: {
    type: Array,
    default: () => [],
  },
  staticPreview: {
    type: Boolean,
    default: false,
  },
});

const page = usePage();

const localHabits = ref([]);
const pendingCells = ref({});

// ── Progressive Habits: Ashish's Track — Micro-Detail (42 activities, time-sequenced) ──
const ashishHabits = [
  // ── MORNING 05:00–08:30 (10 micro-steps) ──
  { id: 'a-1',  name: '05:00 Alarm — Out of Bed',                        points: 1, hint: 'Feet on the floor by 05:00 sharp. No snooze button. Sit up → stand → drink water → start moving immediately.' },
  { id: 'a-2',  name: '05:05 Hydrate — 500ml Warm Water + Lemon',       points: 1, hint: 'Drink 500ml of warm water with half a squeezed lemon to rehydrate after sleep and activate digestion.' },
  { id: 'a-3',  name: '05:10 Breathwork / Meditation (5 min)',            points: 1, hint: '5 minutes of box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) or quiet mindfulness before touching screens.' },
  { id: 'a-4',  name: '05:15 Deep Focus Block 1 — Build & Ship (1h45)',  points: 3, hint: '1 hour 45 min of pure uninterrupted building/coding on Habuilt or core projects. Notifications off, zero Slack/email. Produce real output.' },
  { id: 'a-5',  name: '07:00 Ship Something — Commit & Push',            points: 1, hint: 'Push at least one visible git commit or publish an update. Make tangible, visible progress every morning.' },
  { id: 'a-6',  name: '07:15 Boxing / Cardio Workout (30 min)',          points: 2, hint: '30 minutes of shadow boxing, heavy bag drills, jump rope, or intense cardio for stamina and mental energy.' },
  { id: 'a-7',  name: '07:45 Post-Workout Full Body Stretch (5 min)',    points: 1, hint: 'Stretch hamstrings, hips, chest, and shoulders. Hold each stretch 30 seconds to prevent stiffness.' },
  { id: 'a-8',  name: '07:40 ★ Shaarvi Morning Play & Care (45 min)',    points: 3, hint: 'Give Jyoti protected morning space. Play with Shaarvi: talk to her, name toys/objects, smile, and engage with full attention.' },
  { id: 'a-9',  name: '08:20 Cold Finish Shower',                        points: 1, hint: 'End your shower with 30–60 seconds of cold water. Builds stress resilience, circulation, and alertness.' },
  { id: 'a-10', name: '08:30 Grooming & Skincare Routine',                points: 1, hint: 'Cleanse face, apply moisturizer and sunscreen. Style hair and dress sharp for the day.' },
  // ── WORK 08:45–18:30 (8 micro-steps) ──
  { id: 'a-11', name: '08:45 Work Start — Plan Top 3 & Deep Dive',       points: 2, hint: 'Start the workday with high focus: list your top 3 priority tasks, clear urgent messages in 20 min, then dive deep.' },
  { id: 'a-12', name: '10:00 Client Outreach — 5 Direct Messages / Emails', points: 2, hint: 'Send 5 personalized direct messages or emails to prospects, clients, or collaborators (LinkedIn, email, or WhatsApp). Reference their work or specific problems.' },
  { id: 'a-13', name: '11:00 Lead Follow-Ups — Check & Reply to Prospects', points: 1, hint: 'Review messages sent over the last few days. Respond promptly to interested leads and send a polite follow-up message to those who haven\'t replied yet.' },
  { id: 'a-14', name: '20-20-20 Eye Breaks (Every 20 min)',              points: 1, hint: 'Every 20 minutes of screen work, look at an object 20 feet (6 meters) away for 20 seconds to prevent eye fatigue and headaches.' },
  { id: 'a-15', name: 'Hourly Posture Check & 2-Min Walk',                points: 1, hint: 'Stand up every hour: roll shoulders back, unhunch your spine, stretch neck, and walk around for 2 minutes.' },
  { id: 'a-16', name: '15:30 Business Pipeline Block (30 min)',           points: 2, hint: 'Dedicated 30-minute afternoon slot to grow your business: research potential clients, draft proposals, or plan offers.' },
  { id: 'a-17', name: '16:30 New Business Ideas & Market Notes',          points: 1, hint: 'Write down 1–2 new ideas for services, product features, or client solutions. Research one quick competitor or market angle.' },
  { id: 'a-18', name: '17:30 Weekly Deals & Pipeline Review',             points: 1, hint: 'Review status of all active leads, proposals, and deals. Note down clear next actions for each contact.' },
  // ── EVENING 18:30–22:30 (9 micro-steps) ──
  { id: 'a-19', name: '★ 18:30 Hard Stop — Laptop Closed',              points: 2, hint: '18:30 is non-negotiable family time. Shut your laptop lid, log out of work, and transition to evening mode.' },
  { id: 'a-20', name: '18:35 Phone in Drawer (Digital Detox)',           points: 1, hint: 'Physically store your smartphone inside a drawer or cabinet. Eliminating visual temptation keeps you fully present.' },
  { id: 'a-21', name: '★ 19:15 Family Walk with Jyoti & Shaarvi (20 min)', points: 1, hint: 'Step outside for an evening stroll together without phones. Enjoy fresh air, conversation, and family bonding.' },
  { id: 'a-22', name: '★ 19:35 Family Dinner — Phones Away',             points: 1, hint: 'Eat dinner together at the table. Keep all screens off, talk about the day\'s highlights, and enjoy mindful eating.' },
  { id: 'a-23', name: '★ 20:30 Shaarvi Bedtime Routine — Diya & Stories', points: 3, hint: 'Lead the bedtime ritual: light the diya, recite evening shloka/story, change clothes, and lovingly rock/settle Shaarvi to sleep.' },
  { id: 'a-24', name: '21:15 Evening Focus Block — Admin & Planning (1h15)', points: 2, hint: 'Quiet time after Shaarvi is asleep: complete pending invoices, reply to key messages, and organize upcoming projects.' },
  { id: 'a-25', name: '22:15 Plan Tomorrow\'s Top 3 Priorities',          points: 1, hint: 'Write down tomorrow\'s 3 most important tasks before going to bed. Pre-planning removes morning friction.' },
  { id: 'a-26', name: '22:00 Screen-Free Wind-Down Routine',             points: 1, hint: 'Turn off all monitors and TVs. Read a physical book, write in your journal, or stretch in dim warm lighting.' },
  { id: 'a-27', name: '22:30 Lights Out — 7+ Hours Sleep Floor',         points: 2, hint: 'In bed with lights out by 22:30. Keep the bedroom cool and dark to ensure at least 7 hours of restorative sleep.' },
  // ── HEALTH & DAILY (9 micro-steps) ──
  { id: 'a-28', name: 'Breakfast — High Protein & Iron Rich',             points: 1, hint: 'Nutritious breakfast with 25g+ protein (e.g. eggs, paneer, sprouts, moong dal) plus iron sources like spinach or seeds.' },
  { id: 'a-29', name: 'Lunch — Balanced Protein & Vegetables',           points: 1, hint: 'Wholesome lunch: dal, green sabzi, roti/rice, and salad. Eat mindfully away from your computer desk.' },
  { id: 'a-30', name: 'Dinner — Light Protein & Vegetables',              points: 1, hint: 'Light, easily digestible dinner with protein and fiber. Finish eating at least 2 hours before bedtime.' },
  { id: 'a-31', name: 'Daily Supplements — B12, Omega-3, D3, Mg',        points: 1, hint: 'Take your daily supplements with food: Vitamin B12, Omega-3 fatty acids, Vitamin D3, and Magnesium.' },
  { id: 'a-32', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Follow your healthy scalp regimen: gentle shampoo rinse, avoid harsh chemicals, and apply any topical treatments.' },
  { id: 'a-33', name: '5-Minute Stress & Mindset Journaling',             points: 1, hint: 'Rate your daily stress 1–10. Write down 1 challenge, 1 thing you are grateful for, and 1 positive focus for tomorrow.' },
  { id: 'a-34', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: 'Never look at phones or tablets while interacting with Shaarvi. Babies learn from direct eye contact and face-to-face attention.' },
  { id: 'a-35', name: 'Track Sleep Quality & Total Hours',               points: 1, hint: 'Log your bedtime, wake time, and how energized you feel (1–5 scale) to keep your energy optimized.' },
  { id: 'a-36', name: '3 Litres Water Intake Daily',                     points: 1, hint: 'Drink 3L of water spread throughout the day: morning (500ml), midday (1L), afternoon (1L), evening (500ml).' },
  // ── WEEKLY RITUALS (6 micro-steps) ──
  { id: 'a-37', name: 'Weekly Build-in-Public Post #1',                  points: 1, hint: 'Share a screenshot, lesson learned, or milestone about Habuilt / your projects on LinkedIn or Twitter.' },
  { id: 'a-38', name: 'Weekly Build-in-Public Post #2 & Networking',     points: 1, hint: 'Publish your second update of the week and spend 10 minutes leaving thoughtful comments on 5 creator/founder posts.' },
  { id: 'a-39', name: 'Saturday Build Marathon (4 Hours Focus)',          points: 3, hint: '4 uninterrupted weekend hours dedicated to building major features or launching creative side projects.' },
  { id: 'a-40', name: '★ Sunday Family Board Meeting (45 min)',           points: 3, hint: 'Weekly structured sync with Jyoti: review weekly budget, celebrate Shaarvi\'s milestones, and plan the upcoming week\'s calendar.' },
  { id: 'a-41', name: 'Weekly 10% Tax & Savings Transfer',               points: 1, hint: 'Transfer 10% of this week\'s earnings into a separate tax/savings reserve account to ensure financial peace of mind.' },
  { id: 'a-42', name: 'Weekly Expense & Income Ledger Update',             points: 1, hint: 'Categorize this week\'s spending and income into your budget tracker so finances stay 100% transparent and on track.' },
  // ── PLAN ALIGNMENT: additional habits from household plan ──
  { id: 'a-43', name: '★ 18:35 Shaarvi Floor Play & Language Time (40 min)', points: 3, hint: 'Get down on the floor with Shaarvi. Play with blocks, describe what she holds, practice new sounds, and make her giggle.' },
  { id: 'a-44', name: '★ Friday Date Night with Jyoti',                   points: 2, hint: 'No Friday evening work blocks! Dedicate this evening exclusively to Jyoti: cook together, watch a movie, or have special quality time.' },
  { id: 'a-45', name: 'Client Discovery Calls (2/Week)',                points: 2, hint: 'Conduct 2 high-value video/phone calls with prospective clients or partners to understand their needs and present solutions.' },
  { id: 'a-46', name: 'Request Client Testimonials (2/Week)',           points: 1, hint: 'Reach out to 2 happy clients or colleagues to request a written testimonial or LinkedIn recommendation.' },
  { id: 'a-47', name: 'Speak & Record 3-Min Pitch / Concept (2/Week)',    points: 1, hint: 'Record a 3-minute video/voice clip explaining a product idea or technical topic. Refines verbal confidence and presentation skills.' },
  { id: 'a-48', name: 'Saturday Admin — Invoices, Deals & Next Week Prep (45 min)', points: 2, hint: 'Send out pending client invoices, log payments, review deal pipelines, and organize your calendar for the coming week.' },
  { id: 'a-49', name: 'Sunday Content Batching — Posts & Videos (2h)',    points: 2, hint: 'Batch-write 3–5 social media posts or record video content in one 2-hour sitting so your outreach runs on autopilot.' },
  { id: 'a-50', name: '★ Sunday Meal Prep & Batch Cooking with Jyoti (2h)', points: 2, hint: 'Cook healthy base meals together with Jyoti for the upcoming week (dal, vegetables, prepped salads, roti dough) to save weekday time.' },
];

// ── Progressive Habits: Jyoti's Track — Micro-Detail (35 activities, time-sequenced) ──
const jyotiHabits = [
  // ── MORNING 05:00–11:00 (9 micro-steps) ──
  { id: 'j-1',  name: 'Protected Sleep Window — 05:00 to 08:00',         points: 2, hint: 'Uninterrupted morning sleep while Ashish handles morning routines and Shaarvi. Rest is the foundation of energy and healing.' },
  { id: 'j-2',  name: '08:00 Morning Wake-Up & 500ml Water',             points: 1, hint: 'Drink 500ml warm water upon waking to rehydrate and support digestion and milk production.' },
  { id: 'j-3',  name: '08:15 Postnatal Vitamins & Nursing Stack (B12, DHA, D3)', points: 1, hint: 'Take your essential postnatal vitamins with breakfast: Vitamin B12, DHA (for baby brain development), and Vitamin D3.' },
  { id: 'j-4',  name: '08:30 Block A — Career & Focus Session 1 (1h)',   points: 2, hint: '1 hour of uninterrupted time for your creative or career projects while Ashish watches Shaarvi. Keep notifications silent.' },
  { id: 'j-5',  name: '09:30 Block A — Career & Focus Session 2 (1h)',   points: 2, hint: 'Second 1-hour focused work block to finish priorities, study new skills, or work on portfolio deliverables.' },
  { id: 'j-6',  name: '10:30 Refreshing Outdoor Walk (20 min)',          points: 1, hint: 'Enjoy 20 minutes of fresh air, natural sunlight, and relaxed walking to lift your mood and get natural Vitamin D.' },
  { id: 'j-7',  name: '10:50 Postnatal Gentle Core & Recovery Stretches', points: 1, hint: 'Perform recommended postpartum rehab exercises: gentle core reactivation, diastasis recti safe moves, and upper back stretches.' },
  { id: 'j-8',  name: '11:00 Pelvic Floor & Breathing Exercises (5 min)', points: 1, hint: '5 minutes of mindful Kegel contractions and deep diaphragmatic breathing to strengthen pelvic floor tone.' },
  { id: 'j-35', name: '★ Shaarvi Abhyanga — Warm Oil Massage (15 min)',  points: 2, hint: 'Traditional warm oil baby massage for Shaarvi before bath time. Use gentle circular strokes from head to toe to soothe muscles, support digestion, and bond.' },
  // ── MIDDAY 11:00–15:00 (5 micro-steps) ──
  { id: 'j-9',  name: '★ 11:00 Shaarvi Feeding & Burping',               points: 1, hint: 'Nourish Shaarvi calmly in a comfortable posture. Remember to burp her gently and keep a tall glass of water nearby for yourself.' },
  { id: 'j-10', name: '★ 11:30 Shaarvi Floor Play & Object Naming',      points: 2, hint: 'Sit together on the playmat. Hold up colorful objects, name them clearly, repeat sounds, and encourage reaching and grasping.' },
  { id: 'j-11', name: '★ 12:00 Shaarvi Milestone Tracking & Observation', points: 1, hint: 'Notice new movements, babbles, eye tracking, or motor milestones. Log any special developmental moments.' },
  { id: 'j-12', name: '13:00 Block B — Light Tasks & Communications (1h)', points: 2, hint: 'Handle easy tasks: replying to emails, light research, scheduling, or personal organization.' },
  { id: 'j-13', name: '14:00 Creative Skill Practice & Learning',         points: 1, hint: 'Spend 45–60 minutes learning or practicing design, writing, or professional tools to build long-term career momentum.' },
  // ── EVENING & NIGHT (7 micro-steps) ──
  { id: 'j-14', name: '★ 18:30 Hard Stop — Floor Play with Shaarvi',    points: 2, hint: 'Transition away from work. Enjoy relaxed floor time with Shaarvi as Ashish finishes his workday.' },
  { id: 'j-15', name: '★ 19:00 Developmental Sensory Play with Shaarvi', points: 1, hint: 'Engage Shaarvi with sensory toys, music, high-contrast flashcards, or tummy time for brain development.' },
  { id: 'j-16', name: '★ 19:15 Family Walk with Ashish & Shaarvi (15 min)', points: 1, hint: 'Evening stroll together around the neighborhood without phones. Great for digestion and calming down before dinner.' },
  { id: 'j-17', name: '★ 19:30 Family Dinner Together — No Phones',       points: 1, hint: 'Sit down for a warm family meal together. Keep devices off the table and enjoy relaxed conversation.' },
  { id: 'j-18', name: '20:30 Night Care — Feeding & Calming Routine',     points: 2, hint: 'Comfortable nighttime feeding, diaper change, and soothing lullaby routine to help Shaarvi drift into peaceful sleep.' },
  { id: 'j-19', name: '21:00 Sleep & Well-Being Log',                     points: 1, hint: 'Quickly jot down sleep duration, energy level, and nursing notes to spot patterns and celebrate good rest.' },
  { id: 'j-20', name: '22:00 Evening Wind-Down & Lights Out',             points: 1, hint: 'Dim room lights by 22:00. Disconnect from screens, read or listen to calming audio, and get into bed for restorative rest.' },
  // ── NUTRITION & HEALTH (6 micro-steps) ──
  { id: 'j-21', name: 'Nutritious Breakfast — Protein & Iron Rich',        points: 1, hint: 'Eat a wholesome breakfast with protein and iron (eggs, paneer, chilla, oats, seeds) to sustain energy and recovery.' },
  { id: 'j-22', name: 'Wholesome Lunch — Protein, Greens & Grains',       points: 1, hint: 'Balanced meal with dal, green leafy vegetables, roti/rice, and curd/salad. Eat in a relaxed setting.' },
  { id: 'j-23', name: 'Light & Nourishing Dinner',                        points: 1, hint: 'Enjoy a warm, light dinner with easy-to-digest proteins and veggies, eaten at least 2 hours before bed.' },
  { id: 'j-24', name: '3 Litres Daily Hydration',                         points: 1, hint: 'Drink 3L of water and herbal infusions throughout the day — essential for lactation, energy, and recovery.' },
  { id: 'j-25', name: 'No Chai/Tea Within 90 Min of Meals',               points: 1, hint: 'Tannins in tea/coffee inhibit iron absorption. Wait at least 90 minutes after eating before having tea.' },
  { id: 'j-26', name: 'Zero Screen Time in Front of Shaarvi',             points: 2, hint: 'Keep phones out of sight during baby interactions so Shaarvi receives 100% focused eye contact and interaction.' },
  // ── CAREER TRACK (3 micro-steps) ──
  { id: 'j-27', name: 'Daily 30-Min Skill Building & Reading',            points: 2, hint: 'Read articles, watch tutorials, or practice creative exercises to expand your expertise every single day.' },
  { id: 'j-28', name: 'Portfolio & Progress Showcase Update',             points: 1, hint: 'Add newly completed design files, notes, or case studies to your portfolio collection.' },
  { id: 'j-29', name: 'Financial Accounts & Invoicing Review',             points: 2, hint: 'Review incoming payments, organize receipts, and send out any client invoices.' },
  // ── WEEKLY RITUALS (5 micro-steps) ──
  { id: 'j-30', name: 'Saturday Afternoon Personal Project Block (3h)',   points: 3, hint: '3 hours of completely protected weekend time for your own projects or pampering while Ashish is fully on baby duty.' },
  { id: 'j-31', name: '★ Sunday Family Board Meeting (45 min)',           points: 3, hint: 'Weekly structured conversation with Ashish: review goals, finances, Shaarvi milestones, and upcoming weekly schedule.' },
  { id: 'j-32', name: '★ Sunday Batch Cooking & Meal Prep (2h)',          points: 2, hint: 'Prepare staple sauces, chopped veggies, dal, and healthy snacks with Ashish to make weekday dinners effortless.' },
  { id: 'j-33', name: 'Weekly Meal & Grocery Plan Prep',                  points: 1, hint: 'Write down lunch/dinner meal ideas for Monday through Saturday and make a quick shopping checklist.' },
  { id: 'j-34', name: '★ Shaarvi Monthly Growth & Milestone Summary (29th)', points: 2, hint: 'On the 29th of each month, save photos, note down new words/movements, weight/height, and special memories.' },
];

// ── Progressive Habits System: Tier Definitions ──
// Each habit can progress through 4 tiers. These are the default tier descriptions.
const defaultTierLabels = ['Floor', 'Foundation', 'Standard', 'Mastery'];

const ashishTierDescriptions = {
  'a-1':  ['Wake by 06:30', 'Wake by 06:00', 'Wake by 05:30', '05:00 sharp every day'],
  'a-2':  ['Glass of water', '300ml water', '500ml + lemon', '500ml + lemon + electrolytes'],
  'a-3':  ['1 min deep breaths', '3 min breathwork', '5 min meditation', '5 min + intention set'],
  'a-4':  ['30 min build work', '1h build work', '1h45 deep block', '1h45 + ship daily'],
  'a-5':  ['Note what to ship', 'Stage a commit', 'Push code / content', 'Ship + announce'],
  'a-6':  ['10 min movement', '20 min exercise', '30 min boxing', '30 min + sparring drills'],
  'a-7':  ['Quick stretch', '3 min stretch', '5 min full stretch', '5 min + foam roll'],
  'a-8':  ['10 min play', '20 min turn-taking', '30 min turn-taking + shloka', '45 min turn-taking + shloka + milestone check'],
  'a-9':  ['Warm shower', 'Cool rinse finish', 'Cold finish 30s', 'Full cold shower'],
  'a-10': ['Basic hygiene', 'Groom clean', 'Groom + skincare', 'Full skincare routine'],
  'a-11': ['Show up, basics done', 'Meet expectations', 'High intensity', 'Top performer output'],
  'a-12': ['1 outreach touch', '3 outreach msgs', '5 direct messages', '5 msgs + tailored follow-ups'],
  'a-13': ['Check for replies', 'Reply to 1 lead', 'Reply all pending leads', 'Reply + re-engage cold leads'],
  'a-14': ['1 eye break/day', '3 breaks/day', 'Every 20 min', 'Every 20 min + 10s rule'],
  'a-15': ['Stand once/day', 'Stand hourly', 'Posture check hourly', '+ standing desk 2h'],
  'a-16': ['Note 1 business idea', '15 min pipeline', '30 min business block', '30 min + metrics'],
  'a-17': ['Jot 1 idea', 'Research 1 lead', 'Note + research 2', 'Full pipeline brief'],
  'a-18': ['Skim notes', 'Quick review', 'Written deals review', 'Review + next actions'],
  'a-19': ['Stop by 20:00', 'Stop by 19:30', '18:30 hard stop', '18:30 non-negotiable'],
  'a-20': ['Phone on silent', 'Phone face-down', 'Phone in drawer', 'Phone off + drawer'],
  'a-21': ['5 min walk', '10 min walk', '20 min family walk', '20 min + no phones'],
  'a-22': ['Eat together', 'Eat + talk', 'Dinner no phones', 'Dinner + gratitude share'],
  'a-23': ['Help with bedtime', 'Own 1 step', 'Own full routine', 'Diya + story + shloka + settle'],
  'a-24': ['15 min admin', '30 min pipeline', '1h15 deep block', '1h15 + follow-ups sent'],
  'a-25': ['Glance at calendar', 'List 3 priorities', 'Full plan + prep', 'Plan + pre-work done'],
  'a-26': ['Reduce screens 30m', 'No screens 9:30pm', 'No screens 10pm', '10pm + reading only'],
  'a-27': ['Bed by 23:30', 'Bed by 23:00', 'Sleep by 22:30', '22:30 + sleep tracking'],
  'a-28': ['Eat breakfast', 'Add protein', 'Protein + iron source', '+ meal prep'],
  'a-29': ['Eat lunch', 'Add protein', 'Protein + iron source', '+ balanced macros'],
  'a-30': ['Eat dinner', 'Add protein', 'Protein + iron source', '+ portion control'],
  'a-31': ['Take 1 supplement', 'B12 + D3', 'Full stack daily', 'Full stack + track levels'],
  'a-32': ['Skip harmful products', 'Basic scalp wash', 'Full rinse protocol', '+ DHT blocker'],
  'a-33': ['Notice stress level', 'Rate 1-10', '5 min journal entry', 'Journal + action step'],
  'a-34': ['Reduce screen 30m', '1h phone-free', '2h phone-free', 'Zero screens near Shaarvi'],
  'a-35': ['Note sleep time', 'Log hours', 'Track duration + quality', '+ sleep score'],
  'a-36': ['1L water', '2L water', '3L water', '3L + electrolytes'],
  'a-37': ['Draft 1 post', 'Publish 1 post', 'Post + 1 comment', 'Post + engage community'],
  'a-38': ['Draft post #2', 'Publish post #2', 'Post + engage', 'Post + collab thread'],
  'a-39': ['1h Saturday build', '2h build', '4h marathon', '4h + ship something'],
  'a-40': ['Quick sync 15min', '30 min review', '45 min board meeting', '+ OKR tracking'],
  'a-41': ['Note amount', 'Calculate 10%', 'Transfer 10%', 'Transfer + auto-invest'],
  'a-42': ['Glance at bank', 'Log 1 entry', 'Full income/expense log', '+ budget review'],
  'a-43': ['10 min floor play', '20 min floor play', '40 min play + language', '40 min + developmental focus'],
  'a-44': ['No work after 20:00 Fri', 'No work after 19:00 Fri', 'No code after 18:30 Fri', 'Date night planned'],
  'a-45': ['Note 1 prospect', '1 call/week', '2 calls/week', '2 calls + follow-ups booked'],
  'a-46': ['Identify 1 past client', 'Draft 1 request', '2 requests sent', '2 sent + follow-ups'],
  'a-47': ['Think through topic', 'Outline verbally', '1 recording/week', '2 recordings + posted'],
  'a-48': ['Check invoices', 'Update deals', 'Full 45-min admin session', '+ week prep done'],
  'a-49': ['Draft 1 post', 'Record 1 post', '2h batch session', '2h + scheduled for week'],
  'a-50': ['Help with 1 dish', 'Prep 2 items', '2h full batch cook', '2h + variety + freezer stock'],
};

const jyotiTierDescriptions = {
  'j-1':  ['Sleep 6h minimum', 'Sleep 7h', 'Protected 05-08 sleep', '8h + sleep quality tracking'],
  'j-2':  ['Glass of water', '300ml water', '500ml hydrate', '500ml + electrolytes'],
  'j-3':  ['Take 1 supplement', 'B12 + D3', 'Full nursing stack', '+ track levels quarterly'],
  'j-4':  ['30 min focused work', '45 min deep work', '1h deep block', '1h + output tracking'],
  'j-5':  ['15 min focused work', '30 min deep work', '1h deep block', '1h + milestone push'],
  'j-6':  ['5 min stretching', '10 min walk', '20 min outdoor walk', '20 min + breathing'],
  'j-7':  ['Light stretch', '5 min recovery', 'Full postpartum set', '+ physio exercises'],
  'j-8':  ['Awareness only', '3 min practice', '5 min pelvic floor', '5 min + tracking'],
  'j-9':  ['Feed on demand', 'Feed + burp', 'Feed + log time', 'Feed + track volume'],
  'j-10': ['5 min play', '10 min floor play', '15 min + naming', '20 min structured play'],
  'j-11': ['Note 1 milestone', 'Check milestone chart', 'Log milestone + photo', '+ developmental note'],
  'j-12': ['15 min light tasks', '30 min light work', '1h light work', '1h + skill application'],
  'j-13': ['10 min practice', '20 min practice', 'Focused application', 'Apply + document'],
  'j-14': ['Present at 18:30', 'Floor play 15min', 'Full floor play', '+ developmental focus'],
  'j-15': ['5 min activity', '10 min guided', '15 min developmental', '15 min + new skill'],
  'j-16': ['5 min walk', '10 min walk', '15 min family walk', '15 min + no phones'],
  'j-17': ['Eat together', 'Eat + talk', 'Dinner no phones', 'Dinner + gratitude'],
  'j-18': ['Respond to feeds', 'Manage 1 feed', 'Full night watch', '+ comfort routine'],
  'j-19': ['Note sleep time', 'Log hours', 'Track duration + quality', '+ sleep score'],
  'j-20': ['Bed by 23:00', 'Bed by 22:30', 'Lights out 22:00', '22:00 + wind-down routine'],
  'j-21': ['Eat breakfast', 'Add protein', 'Protein + iron source', '+ meal prep'],
  'j-22': ['Eat lunch', 'Add protein', 'Protein + iron source', '+ balanced macros'],
  'j-23': ['Eat dinner', 'Add protein', 'Protein + iron source', '+ portion control'],
  'j-24': ['1.5L water', '2L water', '3L water', '3L + herbal tea only'],
  'j-25': ['Tea 1h after meals', '90 min gap', 'No tea after meals', 'No caffeine after 2pm'],
  'j-26': ['Reduce screen 30m', '1h phone-free', '2h phone-free', 'Zero screens near Shaarvi'],
  'j-27': ['Read 10 min/day', '20 min learn', '30 min skill building', '30 min + notes'],
  'j-28': ['Note what learned', 'Update 1 item', 'Portfolio update', '+ showcase piece'],
  'j-29': ['Review accounts', 'Send 1 invoice', 'Full invoices + accounts', '+ tax planning'],
  'j-30': ['1h Saturday block', '2h Saturday block', '3h deep afternoon', '3h + ship output'],
  'j-31': ['Quick sync 15min', '30 min review', '45 min board meeting', '+ OKR tracking'],
  'j-32': ['Prep 2 meals', 'Prep 3-4 meals', '2h batch cooking', '2h + variety'],
  'j-33': ['List 3 meals', 'Plan 5 meals', 'Full week plan', 'Plan + shopping list'],
  'j-34': ['Quick photo log', 'Note milestones', 'Monthly report (29th)', '+ development assessment'],
  'j-35': ['Quick oil rub', '10 min massage', '15 min full abhyanga', '15 min + warm bath ritual'],
};

// ── Ashish Travel Mode (Chandigarh) — Micro-Detail (31 activities, time-sequenced) ──
// Schedule: leave 06:30, 3h drive, office 09:30-13:00, return 13:00-16:00, home 16:00
const ashishTravelHabits = [
  // ── PRE-DEPARTURE 05:00–06:30 (6 micro-steps) ──
  { id: 'at-1',  name: '05:00 Alarm — Out of Bed',                        points: 1, hint: 'Feet on floor by 05:00. Travel day = earlier prep. No snooze. Sit up → stand → start moving.' },
  { id: 'at-2',  name: '05:05 Hydrate — 500ml Warm Water + Lemon',        points: 1, hint: 'Drink 500ml warm water with lemon before departure to stay hydrated during the drive.' },
  { id: 'at-3',  name: '05:10 Breathwork (5 min)',                         points: 1, hint: 'Box breathing (4-4-4-4) or calm meditation for a clear, centered mindset before travel.' },
  { id: 'at-4',  name: '05:15 Deep Focus Block 1 — Build & Ship (1h)',    points: 3, hint: '1 hour of intense coding/building before leaving. Ship a clean commit or feature.' },
  { id: 'at-5',  name: '06:15 ★ Shaarvi Morning Play (15 min)',           points: 3, hint: 'Morning connection with Shaarvi before leaving. Name objects, cuddle, and smile.' },
  { id: 'at-6',  name: '06:30 Leave for Chandigarh (On Time)',             points: 1, hint: 'Bag packed the night before. Leave by 06:30 sharp. Breakfast eaten or packed.' },
  // ── OUTBOUND DRIVE 06:30–09:30 (2 micro-steps) ──
  { id: 'at-7',  name: 'Outbound Drive — Audio Learning & Podcasts',       points: 2, hint: 'Use the 3h drive productively: listen to industry audiobooks, podcasts, or practice speech.' },
  { id: 'at-8',  name: 'Record Spoken Pitch / Idea (5 min)',               points: 1, hint: 'Voice-record yourself explaining a business concept or feature clearly in 3–5 min. Builds verbal agility.' },
  // ── OFFICE 09:30–13:00 (4 micro-steps) ──
  { id: 'at-9',  name: '09:30 Office — High-Intensity In-Person Work',    points: 2, hint: 'Maximize office presence: lead discussions, collaborate with colleagues, and execute top priorities.' },
  { id: 'at-10', name: '10:00 Client Outreach — 5 Direct Messages / Emails', points: 2, hint: 'Send 5 tailored messages/emails to clients or prospects from your desktop. Reference specific solutions.' },
  { id: 'at-11', name: '20-20-20 Eye Breaks + Posture Stand',             points: 1, hint: 'Every 20 min look 20 feet away for 20 seconds. Stand up and align posture hourly.' },
  { id: 'at-12', name: 'Coffee Chats — Networking & Relationship Building', points: 1, hint: 'Have at least 1 meaningful one-on-one conversation with a teammate or contact to build strong rapport.' },
  // ── RETURN DRIVE 13:00–16:00 (2 micro-steps) ──
  { id: 'at-13', name: '13:00 Return Drive — Hands-Free Client Calls',    points: 2, hint: 'Use the return drive for scheduled client calls or hands-free business calls.' },
  { id: 'at-14', name: '14:00 Lead Follow-Ups — Check & Reply to Inquiries', points: 1, hint: 'Check replies received during the day. Reply to active conversations and bump pending inquiries.' },
  // ── EVENING 16:00–21:30 (9 micro-steps) ──
  { id: 'at-15', name: '16:00 Home — Shower & Reset',                     points: 1, hint: 'Shower, change clothes, and fully transition from travel mode into family mode.' },
  { id: 'at-16', name: '★ 16:30 Shaarvi Play & Reconnection (30 min)',   points: 3, hint: 'Compensate for morning travel. Get down on the playmat with Shaarvi for 30 min of joyful, screen-free play.' },
  { id: 'at-17', name: '17:00 Deep Focus Block 2 — Pipeline & Admin (1h15)', points: 2, hint: 'Evening work block: send invoices, organize code, reply to important correspondence.' },
  { id: 'at-18', name: '★ 18:30 Hard Stop — Laptop Closed',              points: 2, hint: 'Close laptop lid at 18:30 sharp. Family evening begins. Non-negotiable.' },
  { id: 'at-19', name: '18:35 Phone in Drawer (Digital Detox)',           points: 1, hint: 'Put smartphone in a drawer. Out of sight = full presence with family.' },
  { id: 'at-20', name: '★ 18:45 Family Walk with Jyoti & Shaarvi (20 min)', points: 1, hint: 'Fresh air and light movement together to decompress after long driving hours.' },
  { id: 'at-21', name: '★ 19:15 Family Dinner — Phones Away',             points: 1, hint: 'Sit together for dinner. Phones off the table. Enjoy nourishing food and conversation.' },
  { id: 'at-22', name: '★ 20:30 Shaarvi Bedtime Routine — Diya & Story',  points: 3, hint: 'Lead bedtime: light diya, recite story/shloka, settle Shaarvi lovingly to sleep.' },
  { id: 'at-23', name: '21:30 Lights Out — Early Recovery Sleep',         points: 2, hint: 'Travel days require deeper rest. Be in bed with lights off by 21:30 for restorative recovery.' },
  // ── HEALTH & DAILY (8 micro-steps) ──
  { id: 'at-24', name: 'Breakfast — High Protein & Iron (Before Leaving)', points: 1, hint: 'Eat a proper protein breakfast before driving. Eggs, paratha with paneer, or a hearty meal.' },
  { id: 'at-25', name: 'Lunch — Clean Protein & Greens (At Office)',      points: 1, hint: 'Wholesome lunch at office: dal, sabzi, roti. Avoid heavy fast food to prevent afternoon slumps.' },
  { id: 'at-26', name: 'Dinner — Light Protein & Vegetables',             points: 1, hint: 'Light home-cooked dinner. Finish eating 2 hours before bed for sound digestion.' },
  { id: 'at-27', name: 'Daily Supplements — B12, Omega-3, D3, Mg',        points: 1, hint: 'Take your full supplement stack with meals. Never skip on travel days.' },
  { id: 'at-28', name: '3 Litres Water Intake Daily',                     points: 1, hint: 'Keep a water bottle in the car. Drink steadily before, during, and after travel.' },
  { id: 'at-29', name: 'Scalp Care & Hair Protocol',                      points: 1, hint: 'Perform your scalp rinse protocol during the evening shower.' },
  { id: 'at-30', name: 'Zero Screen Time in Front of Shaarvi',            points: 2, hint: 'Full eye contact and loving presence with Shaarvi. No phones in hand.' },
  { id: 'at-31', name: 'Track Sleep Duration & Quality',                  points: 1, hint: 'Log your sleep hours to ensure travel days don\'t create a recovery deficit.' },
];

const ashishTravelTierDescriptions = {
  'at-1':  ['Wake by 06:00', 'Wake by 05:30', 'Wake by 05:00', '05:00 sharp every day'],
  'at-2':  ['Glass of water', '300ml water', '500ml + lemon', '500ml + lemon + electrolytes'],
  'at-3':  ['1 min deep breaths', '3 min breathwork', '5 min meditation', '5 min + intention set'],
  'at-4':  ['20 min build work', '30 min build work', '1h deep block', '1h + ship daily'],
  'at-5':  ['5 min with Shaarvi', '10 min turn-taking', '15 min structured play', '15 min + shloka'],
  'at-6':  ['Leave on time', 'Leave by 06:40', 'Leave by 06:30', '06:30 sharp + bag prepped night before'],
  'at-7':  ['Music / podcast', 'Technical audio', 'Spoken practice aloud', 'Practice + record clip'],
  'at-8':  ['Think through topic', 'Outline verbally', 'Record 3-min clip', 'Record 5-min + post notes'],
  'at-9':  ['Show up, basics', 'Meet expectations', 'High intensity in-person', 'Top output + visibility'],
  'at-10': ['1 outreach touch', '3 outreach msgs', '5 direct messages', '5 msgs + tailored follow-ups'],
  'at-11': ['1 eye break', '3 breaks', 'Every 20 min', 'Every 20 min + standing'],
  'at-12': ['Quick hello', '1 meaningful chat', '2 relationship chats', 'Strategic networking'],
  'at-13': ['Listen to audio', 'Review pipeline notes', 'Client calls scheduled', 'Calls + follow-up notes'],
  'at-14': ['Check for replies', 'Reply to 1 lead', 'Reply all pending leads', 'Reply + re-engage cold leads'],
  'at-15': ['Quick change', 'Shower + change', 'Full shower + decompress', '+ scalp rinse'],
  'at-16': ['10 min play', '15 min play', '30 min reconnection', '30 min + milestone check'],
  'at-17': ['15 min admin', '30 min pipeline', '1h15 deep block', '1h15 + follow-ups sent'],
  'at-18': ['Stop by 19:30', 'Stop by 19:00', '18:30 hard stop', '18:30 non-negotiable'],
  'at-19': ['Phone on silent', 'Phone face-down', 'Phone in drawer', 'Phone off + drawer'],
  'at-20': ['5 min walk', '10 min walk', '20 min family walk', '20 min + no phones'],
  'at-21': ['Eat together', 'Eat + talk', 'Dinner no phones', 'Dinner + gratitude share'],
  'at-22': ['Help with bedtime', 'Own 1 step', 'Own full routine', 'Diya + story + shloka'],
  'at-23': ['Bed by 23:00', 'Bed by 22:00', 'Sleep by 21:30', '21:30 + wind-down ritual'],
  'at-24': ['Eat breakfast', 'Add protein', 'Protein + iron source', '+ meal prep'],
  'at-25': ['Eat lunch', 'Add protein', 'Protein + iron source', '+ balanced macros'],
  'at-26': ['Eat dinner', 'Add protein', 'Protein + iron source', '+ portion control'],
  'at-27': ['Take 1 supplement', 'B12 + D3', 'Full stack daily', 'Full stack + track levels'],
  'at-28': ['1L water', '2L water', '3L water', '3L + electrolytes'],
  'at-29': ['Skip harmful products', 'Basic scalp wash', 'Full rinse protocol', '+ DHT blocker'],
  'at-30': ['Reduce screen 30m', '1h phone-free', '2h phone-free', 'Zero screens near Shaarvi'],
  'at-31': ['Note sleep time', 'Log hours', 'Track duration + quality', '+ sleep score'],
};

// ── Progressive Phases ──
const defaultPhases = [
  { id: 'assets',   name: 'Assets & Foundations', weeks: [1, 6],   description: 'Build core routines, establish Floor habits' },
  { id: 'pipeline', name: 'Pipeline & Growth',    weeks: [7, 14],  description: 'Graduate to Standard tier, build momentum' },
  { id: 'mastery',  name: 'Rate, Volume & Exit',  weeks: [15, 26], description: 'Hit Mastery tier, compound gains' },
];

// ── SEEDED USERS: Ashish & Jyoti keep their hardcoded curated checklists ──
// All other users get a small generic starter set and full customization.
const isAshish = computed(() => {
  const email = (props.userEmail || '').toLowerCase().trim();
  return email === 'ashishgupta1v@gmail.com';
});
const isJyoti = computed(() => {
  const email = (props.userEmail || '').toLowerCase().trim();
  return email === 'goyaljyoti007@gmail.com' || email.includes('jyoti');
});
const isSeededUser = computed(() => isAshish.value || isJyoti.value);

// ── Travel Mode (Ashish only) ──
const travelMode = ref(false);

// ── Generic starter set for non-seeded users ──
// Universally-applicable atomic habits — user can add/rename/remove/archive freely.
const genericStarterHabits = [
  { id: 'g-1', name: 'Wake up on time',                    points: 1, hint: 'Set your target wake time and get up when the alarm rings. No snooze.' },
  { id: 'g-2', name: '500ml water first thing',            points: 1, hint: 'Drink 500ml water within 10 minutes of waking. Before coffee, before food.' },
  { id: 'g-3', name: 'Move for 20 minutes',                points: 2, hint: 'Any movement counts: walk, stretch, gym, yoga. 20 min minimum.' },
  { id: 'g-4', name: 'Deep focus block (60 min)',          points: 3, hint: '60 min of uninterrupted work on your most important task. Phone on silent, notifications off.' },
  { id: 'g-5', name: 'Read for 15 minutes',                points: 1, hint: 'Read a book (not social media). Fiction or non-fiction, 15 min minimum.' },
  { id: 'g-6', name: 'Plan tomorrow (5 min)',              points: 1, hint: 'Write down your top 3 priorities for tomorrow. Takes 5 min, saves 30 min of decision-making.' },
  { id: 'g-7', name: 'Lights out by target time',          points: 2, hint: 'Pick your target bedtime and stick to it. Screens off 30 min before. Room dark and cool.' },
];

const fallbackHabits = computed(() => {
  if (isJyoti.value) return jyotiHabits;
  if (isAshish.value) {
    return travelMode.value ? ashishTravelHabits : ashishHabits;
  }
  // Generic user — small starter set they can immediately customize
  return genericStarterHabits;
});

const darkMode = ref(false);
const mobileViewMode = ref('daily'); // 'daily' | 'grid'
const mobileSelectedDay = ref(props.currentDay);
const focusDay = ref(props.currentDay);
const focusTasksByDay = ref({});
const newFocusTask = ref('');
const rewardLedger = ref([]);
const newWeeklyCheck = ref('');
const walletBalance = ref(0);
const isNavigatingMonth = ref(false);
const redeemedBeforeCurrentMonth = ref(0);
const earnedBeforeCurrentMonth = ref(0);

// ── Progressive System State ──
const progressiveSettings = ref({
  startDate: '',          // YYYY-MM-DD when the 26-week program begins
  currentPhaseId: 'assets',
  dayType: 'full',        // 'full' | 'half' | 'floor'  — declared each morning
  tierLabels: [...defaultTierLabels],
  phases: defaultPhases.map(p => ({ ...p, weeks: [...p.weeks] })),
  habitTiers: {},         // habitId -> currentTier (1-4)
  pointMultipliers: { full: 1.0, half: 0.6, floor: 0.3 },
});
const progressivePanelOpen = ref(false);
const tierDetailHabitId = ref(null);    // which habit's tier detail is expanded

// ── TIER 1-4 ENHANCED STATE ──
const analyticsOpen = ref(false);       // analytics panel toggle
const focusModeOn = ref(false);         // Tier 3: focus mode
const habitNotesOpen = ref(null);       // Tier 3: which habit's note is open (habitId-day key)
const partnerViewOpen = ref(false);     // Tier 4: partner dashboard toggle
const partnerData = ref(null);          // Tier 4: partner's loaded state
const partnerLoading = ref(false);

// Tier 2: Mood & Energy (persisted per day in enhancedState)
const enhancedState = ref({
  moodEnergy: {},       // { [day]: { mood: 1-5, energy: 1-5 } }
  habitNotes: {},       // { ['habitId:day']: 'note text' }
  achievements: {},     // { [id]: { unlocked: true, date: 'YYYY-MM-DD' } }
  notificationsEnabled: false,
  quoteSeenDate: '',
  // ── Extended state ──
  morningSetupDate: '',       // 'YYYY-MM-DD' of last completed Quick Morning Setup
  dailyFocus: {},             // { [day]: [ 'top1', 'top2', 'top3' ] } — user-set focus intentions
  deepWorkTimer: null,        // { targetMin, startedAt, elapsedBeforePause, linkedHabitId, running, completedForDay }
  archivedHabitIds: [],       // array of habit IDs marked archived
});

// ── HABIT DEPENDENCY CHAINS ──
// After the trigger habit is completed, the next habit is highlighted as "up next".
// Chains follow the natural time-block flow so completion feels sequential.
const habitChains = {
  // Ashish morning routine chain
  'a-1':  'a-2',   // Alarm → Hydrate
  'a-2':  'a-3',   // Hydrate → Meditation
  'a-3':  'a-4',   // Meditation → Deep Block 1
  'a-4':  'a-5',   // Deep Block 1 → Ship
  'a-5':  'a-6',   // Ship → Boxing
  'a-6':  'a-7',   // Boxing → Stretch
  'a-7':  'a-8',   // Stretch → Shaarvi Watch
  'a-8':  'a-9',   // Shaarvi Watch → Cold Shower
  'a-9':  'a-10',  // Cold → Groom
  'a-10': 'a-11',  // Groom → Job Start
  // Work chain
  'a-11': 'a-12',  // Job Start → Outbound
  'a-12': 'a-13',  // Outbound → Follow-Ups
  'a-16': 'a-17',  // Stealth → Pipeline Ideas
  // Evening chain
  'a-19': 'a-20',  // Hard Stop → Phone in Drawer
  'a-20': 'a-21',  // Phone → Family Walk
  'a-21': 'a-22',  // Walk → Dinner
  'a-22': 'a-23',  // Dinner → Shaarvi Bedtime
  'a-23': 'a-24',  // Bedtime → Deep Block 2
  'a-24': 'a-25',  // Deep Block 2 → Review & Plan
  'a-25': 'a-26',  // Review → Wind-Down
  'a-26': 'a-27',  // Wind-Down → Lights Out
  // Jyoti chain
  'j-1':  'j-2',   // Sleep → Wake-Up
  'j-2':  'j-3',   // Wake → Supplements
  'j-3':  'j-4',   // Supplements → Deep Work 1
  'j-4':  'j-5',   // Deep Work 1 → Deep Work 2
  'j-5':  'j-6',   // Deep Work 2 → Walk
  'j-6':  'j-7',   // Walk → Postpartum Recovery
  'j-7':  'j-8',   // Recovery → Pelvic Floor
  'j-8':  'j-35',  // Pelvic Floor → Abhyanga
  'j-14': 'j-15',  // Hard Stop → Dev Activity
  'j-15': 'j-16',  // Dev Activity → Family Walk
};

// ── DEEP WORK TIMER — LINKED HABIT AUTO-COMPLETE ──
// When a timer completes for a linked habit, that habit is auto-marked for the day.
const timerHabitOptions = computed(() => {
  return visibleHabits.value
    .filter(h => !isHabitArchived(h))
    .slice()
    .sort((a, b) => {
      const isPriorityA = (a.points >= 2 || a.name.toLowerCase().includes('deep') || a.name.toLowerCase().includes('build') || a.name.toLowerCase().includes('stealth'));
      const isPriorityB = (b.points >= 2 || b.name.toLowerCase().includes('deep') || b.name.toLowerCase().includes('build') || b.name.toLowerCase().includes('stealth'));
      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;
      return b.points - a.points;
    });
});

// ── LIFETIME STATS — cross-month data ──
const lifetimeData = ref({
  loaded: false,
  months: [],           // [{ monthKey: '2026-08', earned, possible, dayTypes, habitCompletions: { [habitId]: [day...] } }]
  totalXP: 0,           // sum of xp across all months (approximate, uses saved points × completions)
  totalDaysTracked: 0,  // days with at least 1 completion
  allTimeBestStreak: { name: '—', days: 0, habitId: null },
  currentLifetimeStreak: 0, // consecutive days across months where user hit at least 1 habit
});

// Tier 2: Motivational quotes
const motivationalQuotes = [
  { text: 'We are what we repeatedly do. Excellence is not an act, but a habit.', author: 'Aristotle' },
  { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'Every action you take is a vote for the type of person you wish to become.', author: 'James Clear' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { text: 'Consistency is the hallmark of the unimaginative.', author: 'Oscar Wilde' },
  { text: 'What you get by achieving your goals is not as important as what you become.', author: 'Zig Ziglar' },
  { text: 'First forget inspiration. Habit is more dependable.', author: 'Octavia Butler' },
  { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
  { text: 'Habits are the compound interest of self-improvement.', author: 'James Clear' },
  { text: 'Be patient with yourself. Self-growth is tender; it is holy ground.', author: 'Stephen Covey' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
  { text: 'One percent better every day. That is the Habuilt way.', author: 'Habuilt' },
  { text: 'Your net worth to the world is usually determined by what remains after your bad habits are subtracted from your good ones.', author: 'Benjamin Franklin' },
  { text: 'Sow a thought, reap an action; sow an action, reap a habit; sow a habit, reap a character; sow a character, reap a destiny.', author: 'Stephen Covey' },
  { text: 'We first make our habits, and then our habits make us.', author: 'John Dryden' },
  { text: 'The chains of habit are too weak to be felt until they are too strong to be broken.', author: 'Samuel Johnson' },
  { text: 'People do not decide their futures, they decide their habits, and their habits decide their futures.', author: 'F. M. Alexander' },
  { text: 'If you are going to achieve excellence in big things, you develop the habit in little matters.', author: 'Colin Powell' },
  { text: 'Drop by drop is the water pot filled. Likewise, the wise one, gathering it little by little, fills oneself with good.', author: 'Buddha' },
  { text: 'The difference between who you are and who you want to be is what you do.', author: 'Bill Phillips' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { text: 'Strength does not come from what you can do. It comes from overcoming the things you once thought you could not.', author: 'Rikki Rogers' },
];

// — Habit editor —
const habitsEditing = ref(false);
const habitsDraft = ref([]);
const habitSaveStatus = ref('idle'); // 'idle' | 'saving' | 'saved' | 'error'
const hasCustomHabits = ref(false);
const habitSwipeStart = ref({});

const rewardsEditing = ref(false);
const rewardsDraft = ref([]);
const rewardSaveStatus = ref('idle'); // 'idle' | 'saving' | 'saved' | 'error'

const ledgerEditing = ref(false);
const ledgerDraft = ref([]);
const ledgerSaveStatus = ref('idle'); // 'idle' | 'saving' | 'saved' | 'error'

const defaultRewards = [
  { type: 'Daily', item: '1 Hour+ social media', cost: 8 },
  { type: 'Weekly', item: 'New gadget/supplement under 500', cost: 12 },
  { type: 'Weekly', item: 'Cheat Meal', cost: 15 },
  { type: 'Weekly', item: 'Social Meetup/Night Out/Movie', cost: 20 },
  { type: 'Month', item: 'New Tech/Clothing', cost: 30 },
  { type: 'Month', item: 'Purchase 1 Useful Subscription/Plan', cost: 40 },
  { type: 'Quarter', item: 'Major Purchase', cost: 100 },
  { type: 'Half-Yr', item: 'Vacation', cost: 500 },
  { type: 'Yearly', item: 'International Vacation', cost: 2000 },
];

const rewards = ref(defaultRewards.map((reward) => ({ ...reward })));

const createDefaultWeeklyReview = () => ({
  reviewDate: '',
  metrics: {
    weeklyPoints: '',
    weeklyStickiness: '',
    monthlyPoints: '',
    monthlyStickiness: '',
  },
  checks: [
    { text: 'I reviewed missed days and found one clear trigger.', done: false },
    { text: 'I declared tier (Full/Half/Floor) at breakfast every day.', done: false },
    { text: 'Shaarvi blocks never shrank — they happened first.', done: false },
    { text: '18:30 hard stop held — phones out of room.', done: false },
    { text: 'Sleep stayed above 7h floor (or next day was Floor tier).', done: false },
    { text: 'I graduated max one habit this week (1% rule).', done: false },
  ],
  reflections: {
    wins: '',
    misses: '',
    triggerPlan: '',
    rewardTune: '',
    habitScale: '',
    healthCheck: '',
    nextWeekFocus: '',
  },
});

const weeklyReview = ref(createDefaultWeeklyReview());

const monthScope = computed(() => `${props.year}-${String(props.month).padStart(2, '0')}`);
const localStateKey = computed(() => `habuilt.dashboard.${props.userId || 'guest'}.${monthScope.value}`);
const localStatePrefix = computed(() => `habuilt.dashboard.${props.userId || 'guest'}.`);
const monthLabel = computed(
  () => new Date(props.year, Math.max(0, props.month - 1), 1).toLocaleString('en-US', { month: 'long' }).toUpperCase(),
);
const selectedMonthIndex = computed(() => (props.year * 100) + props.month);

const mapHabit = (habit) => ({
  id: habit.id,
  name: habit.name,
  points: habit.points,
  hint: habit.hint || '',
  completedToday: !!habit.completedToday,
  completedDays: Array.isArray(habit.completedDays)
    ? [...habit.completedDays]
    : (habit.completedToday ? [props.currentDay] : []),
});

watch(
  () => props.habits,
  (value) => {
    if (Array.isArray(value) && value.length > 0) {
      localHabits.value = value.map(mapHabit);
      return;
    }

    localHabits.value = fallbackHabits.value.map(mapHabit);
  },
  { immediate: true },
);

watch(
  () => props.currentDay,
  (value) => {
    if (focusDay.value > props.monthDays || focusDay.value < 1) {
      focusDay.value = value;
    }
  },
);

watch(
  () => props.monthDays,
  (value) => {
    if (focusDay.value > value) {
      focusDay.value = value;
    }
  },
);

const days = computed(() => Array.from({ length: props.monthDays }, (_, index) => index + 1));

const isWeekendDay = (day) => {
  const weekDay = new Date(props.year, props.month - 1, day).getDay();

  return weekDay === 0 || weekDay === 6;
};

const flashSuccess = computed(() => page?.props?.flash?.success ?? null);
const flashError = computed(() => page?.props?.flash?.error ?? null);

// Archived habits: kept in localHabits for historical continuity (streaks/XP earned before archiving still count)
// but hidden from the daily checklist.
const archivedIdSet = computed(() => new Set((enhancedState.value.archivedHabitIds || [])));
const isHabitArchived = (habit) => !!habit && (archivedIdSet.value.has(habit.id) || habit.archived === true);
const visibleHabits = computed(() => localHabits.value.filter((h) => !isHabitArchived(h)));
const archivedHabits = computed(() => localHabits.value.filter((h) => isHabitArchived(h)));

const totalHabits = computed(() => visibleHabits.value.length);
const draftHasErrors = computed(
  () => habitsDraft.value.length === 0 || habitsDraft.value.some((h) => !h.name.trim()),
);
const rewardDraftHasErrors = computed(
  () => rewardsDraft.value.length === 0
    || rewardsDraft.value.some((reward) => !reward.type.trim() || !reward.item.trim() || Number(reward.cost) < 1),
);
const ledgerDraftHasErrors = computed(
  () => ledgerDraft.value.some((entry) => !entry.item.trim() || !entry.description.trim() || Number(entry.cost) < 0),
);

const normalizeReward = (reward, index = 0) => ({
  type: String(reward?.type || 'Custom').trim() || 'Custom',
  item: String(reward?.item || `Reward ${index + 1}`).trim() || `Reward ${index + 1}`,
  cost: Math.max(1, Math.min(10000, Number(reward?.cost) || 1)),
});

const normalizeLedgerEntry = (entry, index = 0) => {
  const fallbackDate = new Date().toLocaleString();
  const normalizedTimestamp = Number(entry?.timestamp);

  return {
    item: String(entry?.item || `Reward ${index + 1}`).trim() || `Reward ${index + 1}`,
    description: String(entry?.description || '').trim() || String(entry?.item || `Reward ${index + 1}`),
    cost: Math.max(0, Math.min(10000, Number(entry?.cost) || 0)),
    date: String(entry?.date || fallbackDate),
    timestamp: Number.isFinite(normalizedTimestamp) ? normalizedTimestamp : Date.now() + index,
  };
};

const getDayTotal = (day) => visibleHabits.value.reduce(
  (sum, habit) => sum + (habit.completedDays.includes(day) ? habit.points : 0),
  0,
);

const getServerDayTotal = (day) => {
  if (!Array.isArray(props.habits) || props.habits.length === 0) {
    return 0;
  }

  return props.habits.reduce((sum, habit) => {
    const completedDays = Array.isArray(habit?.completedDays) ? habit.completedDays : [];
    const points = Number(habit?.points);

    return sum + (completedDays.includes(day) ? (Number.isFinite(points) ? points : 0) : 0);
  }, 0);
};

const todayPoints = computed(() => getDayTotal(props.currentDay));
const maxDailyPoints = computed(() => visibleHabits.value.reduce((sum, habit) => sum + habit.points, 0));

// ── Mobile daily view helpers ──
const mobileDay = computed(() => Math.max(1, Math.min(mobileSelectedDay.value, props.monthDays)));
const mobileDayPoints = computed(() => getDayTotal(mobileDay.value));
const mobileDayCompleted = computed(() =>
  visibleHabits.value.filter((h) => h.completedDays.includes(mobileDay.value)).length
);
const mobileDayLabel = computed(() => {
  const d = new Date(props.year, props.month - 1, mobileDay.value);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
});
const mobileDayIsToday = computed(() =>
  props.isCurrentMonth && mobileDay.value === props.currentDay
);
const mobileDayIsFuture = computed(() => {
  if (props.isFutureMonth) return true;
  if (!props.isCurrentMonth) return false;
  return mobileDay.value > props.currentDay;
});
const mobilePrevDay = () => {
  if (mobileSelectedDay.value > 1) mobileSelectedDay.value--;
};
const mobileNextDay = () => {
  if (mobileSelectedDay.value < props.monthDays) mobileSelectedDay.value++;
};
const mobileGoToday = () => {
  mobileSelectedDay.value = props.currentDay;
};

// ── Progressive System Computed Helpers ──
const getTierDescriptions = (habitId) => {
  if (travelMode.value && ashishTravelTierDescriptions[habitId]) {
    return ashishTravelTierDescriptions[habitId];
  }
  const descs = isJyoti.value ? jyotiTierDescriptions : ashishTierDescriptions;
  return descs[habitId] || ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'];
};

// Toggle travel mode — switches habit list and persists
const toggleTravelMode = () => {
  travelMode.value = !travelMode.value;
  // Re-initialize habits from the new preset, preserving completion data
  const newPreset = travelMode.value ? ashishTravelHabits : ashishHabits;
  const currentMap = {};
  localHabits.value.forEach(h => { currentMap[h.id] = h; });
  localHabits.value = newPreset.map(h => ({
    ...h,
    completedDays: currentMap[h.id]?.completedDays || [],
    completedToday: currentMap[h.id]?.completedToday || false,
  }));
  hasCustomHabits.value = false;
  persistLocalState();
};

const getHabitTier = (habitId) => {
  return progressiveSettings.value.habitTiers[habitId] || 1;
};

const setHabitTier = (habitId, tier) => {
  const clamped = Math.max(1, Math.min(4, tier));
  progressiveSettings.value.habitTiers = {
    ...progressiveSettings.value.habitTiers,
    [habitId]: clamped,
  };
  persistLocalState();
};

const graduateHabit = (habitId) => {
  const current = getHabitTier(habitId);
  if (current < 4) setHabitTier(habitId, current + 1);
};

const demoteHabit = (habitId) => {
  const current = getHabitTier(habitId);
  if (current > 1) setHabitTier(habitId, current - 1);
};

const toggleTierDetail = (habitId) => {
  tierDetailHabitId.value = tierDetailHabitId.value === habitId ? null : habitId;
};

const currentDayType = computed(() => progressiveSettings.value.dayType || 'full');

const setDayType = (type) => {
  progressiveSettings.value.dayType = type;
  persistLocalState();
};

const dayTypeLabel = computed(() => {
  switch (currentDayType.value) {
    case 'full': return 'Full Day';
    case 'half': return 'Half Day';
    case 'floor': return 'Floor Day';
    default: return 'Full Day';
  }
});

const dayTypeMultiplier = computed(() => {
  const m = progressiveSettings.value.pointMultipliers || { full: 1.0, half: 0.6, floor: 0.3 };
  return m[currentDayType.value] || 1.0;
});

const adjustedDailyTarget = computed(() => {
  return Math.round(maxDailyPoints.value * dayTypeMultiplier.value);
});

const programStartDate = computed(() => {
  const d = progressiveSettings.value.startDate;
  if (!d) return null;
  const parsed = new Date(d + 'T00:00:00');
  return isNaN(parsed.getTime()) ? null : parsed;
});

const currentProgramWeek = computed(() => {
  if (!programStartDate.value) return 0;
  const now = new Date();
  const diff = now.getTime() - programStartDate.value.getTime();
  return Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
});

const currentPhase = computed(() => {
  const week = currentProgramWeek.value;
  if (week <= 0) return null;
  const phases = progressiveSettings.value.phases || defaultPhases;
  for (const phase of phases) {
    if (week >= phase.weeks[0] && week <= phase.weeks[1]) return phase;
  }
  // Past week 26 — still in last phase
  return phases[phases.length - 1] || null;
});

const phaseProgressPercent = computed(() => {
  const week = currentProgramWeek.value;
  if (week <= 0 || !currentPhase.value) return 0;
  const [start, end] = currentPhase.value.weeks;
  const total = end - start + 1;
  const elapsed = Math.min(week - start + 1, total);
  return Math.round((elapsed / total) * 100);
});

const avgTierLevel = computed(() => {
  const habits = localHabits.value;
  if (habits.length === 0) return 1;
  const sum = habits.reduce((s, h) => s + getHabitTier(h.id), 0);
  return (sum / habits.length).toFixed(1);
});

const tierDistribution = computed(() => {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const h of localHabits.value) {
    dist[getHabitTier(h.id)]++;
  }
  return dist;
});

const tierColorClass = (tier) => {
  switch (tier) {
    case 1: return 'tier--floor';
    case 2: return 'tier--foundation';
    case 3: return 'tier--standard';
    case 4: return 'tier--mastery';
    default: return 'tier--floor';
  }
};

const startProgram = () => {
  const today = new Date();
  progressiveSettings.value.startDate = today.toISOString().slice(0, 10);
  // Reset all tiers to 1
  const tiers = {};
  for (const h of localHabits.value) {
    tiers[h.id] = 1;
  }
  progressiveSettings.value.habitTiers = tiers;
  progressiveSettings.value.dayType = 'full';
  persistLocalState();
};

const toggleProgressivePanel = () => {
  progressivePanelOpen.value = !progressivePanelOpen.value;
};

// ── Auto-Tier-Graduation Suggestions ──
// Calculates current streak for each habit and suggests graduation at 14+ days
const GRADUATION_STREAK_THRESHOLD = 14;

const getHabitStreak = (habit) => {
  if (!habit || !Array.isArray(habit.completedDays) || habit.completedDays.length === 0) return 0;
  const sorted = [...habit.completedDays].sort((a, b) => b - a);
  // Count consecutive days backward from the latest completed day
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] - 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const graduationSuggestions = computed(() => {
  const suggestions = [];
  for (const habit of localHabits.value) {
    const tier = getHabitTier(habit.id);
    if (tier >= 4) continue; // Already at max tier
    const streak = getHabitStreak(habit);
    if (streak >= GRADUATION_STREAK_THRESHOLD) {
      const tierLabels = progressiveSettings.value.tierLabels || defaultTierLabels;
      const nextTierDesc = getTierDescriptions(habit.id)[tier]; // tier is 1-based, array is 0-based, so tier = next tier's index
      suggestions.push({
        habitId: habit.id,
        habitName: habit.name,
        currentTier: tier,
        nextTier: tier + 1,
        streak,
        currentLabel: tierLabels[tier - 1],
        nextLabel: tierLabels[tier],
        nextDescription: nextTierDesc,
      });
    }
  }
  return suggestions;
});

const dismissGraduationSuggestion = (habitId) => {
  // Graduating the habit clears the suggestion naturally
  graduateHabit(habitId);
};

// ── Day-Type Auto-Suggest ──
// Checks previous day's sleep habit to suggest today's day type
const sleepHabitId = computed(() => {
  if (isJyoti.value) return 'j-1';
  if (isAshish.value) return 'a-14';
  // Generic user: try to detect a sleep-related habit by name
  const match = localHabits.value.find(h => /sleep|lights out|bedtime/i.test(h.name || ''));
  return match?.id || null;
});

const suggestedDayType = computed(() => {
  // Find sleep habit
  const sleepHabit = localHabits.value.find(h => h.id === sleepHabitId.value);
  if (!sleepHabit) return null;

  const yesterday = props.currentDay - 1;
  if (yesterday < 1) return null; // First day of month — no data

  const sleptWell = sleepHabit.completedDays.includes(yesterday);

  // Also check overall completion rate for yesterday
  const yesterdayTotal = localHabits.value.reduce(
    (sum, h) => sum + (h.completedDays.includes(yesterday) ? h.points : 0), 0
  );
  const maxPts = localHabits.value.reduce((s, h) => s + h.points, 0);
  const yesterdayPct = maxPts > 0 ? (yesterdayTotal / maxPts) * 100 : 0;

  if (sleptWell && yesterdayPct >= 60) return { type: 'full', reason: 'Good sleep + strong yesterday' };
  if (sleptWell) return { type: 'full', reason: 'Sleep target met last night' };
  if (!sleptWell && yesterdayPct >= 40) return { type: 'half', reason: 'Missed sleep — pace yourself' };
  return { type: 'floor', reason: 'Poor sleep — protect essentials only' };
});

const applySuggestedDayType = () => {
  if (suggestedDayType.value) {
    setDayType(suggestedDayType.value.type);
  }
};

// ── Mobile Category Filters & Classification ──
const activeMobileCategory = ref('all');
const activeTimeFilter = ref('all');

// Auto-detect current time block based on hour
const getCurrentTimeBlock = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 18) return 'work';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'anytime';
};
const hoveredChartPoint = ref(null);

// Time-of-day slot for each habit — used to group and order the checklist timeline
const getHabitTimeSlot = (habit) => {
  if (!habit || !habit.name) return 'anytime';
  const id = habit.id || '';
  const name = habit.name.toLowerCase();

  // Ashish regular habits by ID (micro-detail: a-1..a-50)
  if (['a-1','a-2','a-3','a-4','a-5','a-6','a-7','a-8','a-9','a-10'].includes(id)) return 'morning';
  if (['a-11','a-12','a-13','a-14','a-15','a-16','a-17','a-18'].includes(id)) return 'work';
  if (['a-19','a-20','a-21','a-22','a-23','a-24','a-25','a-26','a-27','a-43'].includes(id)) return 'evening';
  if (['a-28','a-29','a-30','a-31','a-32','a-33','a-34','a-35','a-36'].includes(id)) return 'anytime';
  if (['a-37','a-38','a-39','a-40','a-41','a-42','a-44','a-45','a-46','a-47','a-48','a-49','a-50'].includes(id)) return 'weekly';

  // Ashish travel habits (micro-detail: at-1..at-31)
  if (['at-1','at-2','at-3','at-4','at-5','at-6'].includes(id)) return 'morning';
  if (['at-7','at-8','at-9','at-10','at-11','at-12','at-13','at-14'].includes(id)) return 'work';
  if (['at-15','at-16','at-17','at-18','at-19','at-20','at-21','at-22','at-23'].includes(id)) return 'evening';
  if (['at-24','at-25','at-26','at-27','at-28','at-29','at-30','at-31'].includes(id)) return 'anytime';

  // Jyoti habits by ID (micro-detail: j-1..j-34)
  if (['j-1','j-2','j-3','j-4','j-5','j-6','j-7','j-8','j-35'].includes(id)) return 'morning';
  if (['j-9','j-10','j-11','j-12','j-13'].includes(id)) return 'midday';
  if (['j-14','j-15','j-16','j-17','j-18','j-19','j-20'].includes(id)) return 'evening';
  if (['j-21','j-22','j-23','j-24','j-25','j-26'].includes(id)) return 'anytime';
  if (['j-27','j-28','j-29'].includes(id)) return 'work';
  if (['j-30','j-31','j-32','j-33','j-34'].includes(id)) return 'weekly';

  // Fallback heuristic for custom habits
  if (name.includes('wake') || name.includes('morning') || name.includes('block 1') || name.includes('block a') || name.includes('groom') || name.includes('boxing')) return 'morning';
  if (name.includes('job') || name.includes('work') || name.includes('outbound') || name.includes('stealth') || name.includes('career') || name.includes('skill')) return 'work';
  if (name.includes('sleep by') || name.includes('night') || name.includes('dinner') || name.includes('walk') || name.includes('hard stop') || name.includes('bedtime') || name.includes('block 2')) return 'evening';
  return 'anytime';
};

const timeSlotOrder = { morning: 0, midday: 1, work: 2, evening: 3, anytime: 4, weekly: 5 };
const timeSlotMeta = {
  morning:  { label: 'Morning',           emoji: '🌅', time: '05:00 – 08:30' },
  midday:   { label: 'Midday',            emoji: '☀️', time: '10:45 – 15:00' },
  work:     { label: 'Work / Deep Focus',  emoji: '⚡', time: '08:45 – 18:30' },
  evening:  { label: 'Evening',            emoji: '🌙', time: '18:30 – 22:30' },
  anytime:  { label: 'Health & Daily',     emoji: '🥗', time: 'All Day' },
  weekly:   { label: 'Weekly Rituals',     emoji: '📅', time: 'Tracked Weekly' },
};

// Grouped habits for timeline view
const timelineGroupedHabits = computed(() => {
  const source = focusFilteredHabits.value;
  const groups = {};
  for (const h of source) {
    const slot = getHabitTimeSlot(h);
    if (!groups[slot]) groups[slot] = { slot, meta: timeSlotMeta[slot] || timeSlotMeta.anytime, habits: [] };
    groups[slot].habits.push(h);
  }
  return Object.values(groups).sort((a, b) => (timeSlotOrder[a.slot] ?? 99) - (timeSlotOrder[b.slot] ?? 99));
});

const getHabitCategory = (habit) => {
  if (!habit || !habit.name) return 'other';
  if (habit.name.startsWith('★')) return 'shared';
  const slot = getHabitTimeSlot(habit);
  if (slot === 'morning') return 'morning';
  if (slot === 'work' || slot === 'midday') return 'work';
  if (slot === 'evening') return 'evening';
  if (slot === 'anytime') return 'health';
  if (slot === 'weekly') return 'work';
  return 'other';
};

const getCategoryLabel = (category) => {
  switch (category) {
    case 'morning': return 'Morning';
    case 'work': return 'Work';
    case 'evening': return 'Evening';
    case 'health': return 'Health';
    case 'shared': return 'Shared ★';
    default: return 'Habit';
  }
};

const filteredMobileHabits = computed(() => {
  let source = visibleHabits.value;
  // Apply time-slot filter first
  if (activeTimeFilter.value !== 'all') {
    source = source.filter(h => getHabitTimeSlot(h) === activeTimeFilter.value);
  }
  // Then apply category filter on top
  if (activeMobileCategory.value !== 'all') {
    source = source.filter(h => getHabitCategory(h) === activeMobileCategory.value);
  }
  return source;
});

// Time-slot based counts and completion for filter pills
const timeSlotCounts = computed(() => {
  const counts = { all: visibleHabits.value.length, morning: 0, work: 0, evening: 0, anytime: 0, weekly: 0 };
  for (const h of visibleHabits.value) {
    const slot = getHabitTimeSlot(h);
    if (counts[slot] !== undefined) counts[slot]++;
  }
  return counts;
});

const timeSlotCompleted = computed(() => {
  const comp = { all: 0, morning: 0, work: 0, evening: 0, anytime: 0, weekly: 0 };
  for (const h of visibleHabits.value) {
    if (hasCompletedDay(h, mobileDay.value)) {
      comp.all++;
      const slot = getHabitTimeSlot(h);
      if (comp[slot] !== undefined) comp[slot]++;
    }
  }
  return comp;
});

// Keep old category counts for backward compat
const mobileCategoryCounts = computed(() => {
  const counts = { all: localHabits.value.length, morning: 0, work: 0, evening: 0, health: 0, shared: 0 };
  for (const h of localHabits.value) {
    const cat = getHabitCategory(h);
    if (counts[cat] !== undefined) counts[cat]++;
  }
  return counts;
});

const mobileCategoryCompleted = computed(() => {
  const comp = { all: 0, morning: 0, work: 0, evening: 0, health: 0, shared: 0 };
  for (const h of localHabits.value) {
    if (hasCompletedDay(h, mobileDay.value)) {
      comp.all++;
      const cat = getHabitCategory(h);
      if (comp[cat] !== undefined) comp[cat]++;
    }
  }
  return comp;
});

const evaluatedDays = computed(() => {
  if (props.isFutureMonth) {
    return 0;
  }

  return Math.max(0, Math.min(props.currentDay, props.monthDays));
});

const monthTotalPoints = computed(() => {
  if (evaluatedDays.value === 0) {
    return 0;
  }

  return days.value
    .filter((day) => day <= evaluatedDays.value)
    .reduce((sum, day) => sum + getDayTotal(day), 0);
});

const completionRate = computed(() => {
  const denominator = totalHabits.value * evaluatedDays.value;

  if (denominator === 0) {
    return 0;
  }

  let completedCells = 0;

  localHabits.value.forEach((habit) => {
    completedCells += habit.completedDays.filter((day) => day <= evaluatedDays.value).length;
  });

  return (completedCells / denominator) * 100;
});

const dailyAverage = computed(() => {
  if (evaluatedDays.value === 0) {
    return 0;
  }

  return monthTotalPoints.value / evaluatedDays.value;
});

const personalBest = computed(() => {
  let bestDay = null;
  let bestPoints = 0;

  for (let day = 1; day <= evaluatedDays.value; day += 1) {
    const score = getDayTotal(day);

    if (bestDay === null || score > bestPoints) {
      bestDay = day;
      bestPoints = score;
    }
  }

  return { day: bestDay, points: bestPoints };
});

const monthRedeemed = computed(() => rewardLedger.value.reduce((sum, item) => {
  const cost = Number(item?.cost);

  return sum + (Number.isFinite(cost) ? cost : 0);
}, 0));

const monthEarned = computed(() => Math.max(0, monthTotalPoints.value));
const openingBalance = computed(() => Math.max(
  0,
  earnedBeforeCurrentMonth.value - redeemedBeforeCurrentMonth.value
));

const availableWallet = computed(() => Math.max(
  0,
  openingBalance.value + monthEarned.value - monthRedeemed.value
));

// Milestone offset — subtracted from wallet so milestone counts from reset point
const milestonePointsOffset = ref(0);
const milestoneWallet = computed(() => Math.max(0, availableWallet.value - milestonePointsOffset.value));

const activeMilestoneTarget = computed(() => (milestoneWallet.value >= 500 ? 2000 : 500));
const activeMilestoneLabel = computed(() => (activeMilestoneTarget.value === 500 ? 'Vacation' : 'International Vacation'));
const pointsToVacation = computed(() => Math.max(activeMilestoneTarget.value - milestoneWallet.value, 0));
const vacationProgress = computed(
  () => Math.max(0, Math.min((milestoneWallet.value / activeMilestoneTarget.value) * 100, 100)),
);
const milestoneMessage = computed(() => {
  if (pointsToVacation.value > 0) {
    return `${pointsToVacation.value} points left to hit ${activeMilestoneLabel.value}`;
  }

  if (activeMilestoneTarget.value === 500) {
    return 'Vacation unlocked. Next milestone: International Vacation (2000 pts).';
  }

  return 'International Vacation unlocked. Time to redeem!';
});

const resetMilestone = () => {
  milestonePointsOffset.value = availableWallet.value;
  // Store globally in localStorage so it persists across months
  try { localStorage.setItem('habuilt.milestoneOffset.' + props.userId, String(milestonePointsOffset.value)); } catch {}
  persistLocalState();
};

watch(
  () => props.wallet,
  (value) => {
    walletBalance.value = Number.isFinite(value) ? value : 0;
  },
  { immediate: true },
);

const targetDailyPoints = computed(() => {
  return Math.round(Math.max(25, Math.ceil(maxDailyPoints.value * 0.6)) * dayTypeMultiplier.value);
});

const heroStatsExpanded = ref(false);
const mobileHeroExpanded = ref(false);

// Collapsible sections — start collapsed to reduce scroll
const rewardsExpanded = ref(false);
const ledgerExpanded = ref(false);
const weeklyReviewExpanded = ref(false);

// Best-effort friendly name — falls back to the email local-part for generic users
const displayName = computed(() => {
  if (isJyoti.value) return 'Jyoti';
  if (isAshish.value) return 'Ashish';
  const email = String(props.userEmail || '').trim();
  if (!email) return 'Friend';
  const local = email.split('@')[0] || 'Friend';
  // Prettify: dots/underscores → spaces, capitalize first letter
  const cleaned = local.replace(/[._-]+/g, ' ').replace(/\d+$/, '').trim();
  if (!cleaned) return 'Friend';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
});

const timeGreeting = computed(() => {
  const hour = new Date().getHours();
  const name = displayName.value;
  let salute = 'Good evening';
  let quote = 'Finish the day strong with relentless execution.';
  if (hour >= 5 && hour < 12) {
    salute = 'Good morning';
    quote = 'Win the morning, win the entire day.';
  } else if (hour >= 12 && hour < 17) {
    salute = 'Good afternoon';
    quote = 'Maintain peak focus and daily momentum.';
  } else if (hour >= 17 && hour < 22) {
    salute = 'Good evening';
    quote = 'Execute your evening protocol with discipline.';
  } else {
    salute = 'Night protocol';
    quote = 'Prioritize deep recovery and restorative sleep.';
  }
  return { salute, name, quote };
});

const systemStreak = computed(() => {
  if (evaluatedDays.value === 0) return { current: 0, best: 0 };
  let current = 0;
  const startDay = props.currentDay;
  for (let d = startDay; d >= 1; d--) {
    if (getDayTotal(d) > 0) {
      current++;
    } else if (d === startDay && getDayTotal(d) === 0) {
      continue;
    } else {
      break;
    }
  }
  let best = 0;
  let temp = 0;
  for (let d = 1; d <= evaluatedDays.value; d++) {
    if (getDayTotal(d) > 0) {
      temp++;
      if (temp > best) best = temp;
    } else {
      temp = 0;
    }
  }
  return { current, best: Math.max(best, current) };
});

const performanceGrade = computed(() => {
  const rate = completionRate.value;
  if (rate >= 90) return { grade: 'A+', label: 'Elite Execution', class: 'grade--a-plus' };
  if (rate >= 80) return { grade: 'A', label: 'Strong Consistency', class: 'grade--a' };
  if (rate >= 70) return { grade: 'B+', label: 'Good Momentum', class: 'grade--b-plus' };
  if (rate >= 60) return { grade: 'B', label: 'Solid Foundation', class: 'grade--b' };
  if (rate >= 50) return { grade: 'C+', label: 'Building Rhythm', class: 'grade--c-plus' };
  if (rate >= 35) return { grade: 'C', label: 'Needs Focus', class: 'grade--c' };
  return { grade: 'D', label: 'Re-align Baseline', class: 'grade--d' };
});

const miniHeatmapDays = computed(() => {
  const target = targetDailyPoints.value;
  const list = [];
  const today = props.currentDay;
  const start = Math.max(1, today - 6);
  const end = Math.min(props.monthDays, start + 6);
  for (let d = start; d <= end; d++) {
    const pts = getDayTotal(d);
    const maxPts = maxDailyPoints.value;
    const pct = maxPts > 0 ? Math.min(100, Math.round((pts / maxPts) * 100)) : 0;
    const isToday = props.isCurrentMonth && d === props.currentDay;
    const isFuture = props.isFutureMonth || (props.isCurrentMonth && d > props.currentDay);
    const isMet = pts >= target;
    list.push({ day: d, points: pts, pct, isToday, isFuture, isMet });
  }
  return list;
});

const getGithubLevel = (pct, points) => {
  if (points === 0 || pct === 0) return 'gh-l0';
  if (pct >= 90) return 'gh-l4';
  if (pct >= 65) return 'gh-l3';
  if (pct >= 35) return 'gh-l2';
  return 'gh-l1';
};

const todayCompletedCount = computed(() => {
  return localHabits.value.filter((h) => (h.completedDays || []).includes(props.currentDay)).length;
});

const daysOnTargetCount = computed(() => {
  if (evaluatedDays.value === 0) return 0;
  let count = 0;
  for (let day = 1; day <= evaluatedDays.value; day += 1) {
    if (getDayTotal(day) >= targetDailyPoints.value) {
      count += 1;
    }
  }
  return count;
});

const chartData = computed(() => days.value.map((day) => getDayTotal(day)));

const chartWidth = 1000;
const chartHeight = 220;
const chartPaddingX = 14;
const chartPaddingTop = 16;
const chartPaddingBottom = 16;

const chartMaxValue = computed(() => {
  const rawMax = Math.max(1, maxDailyPoints.value, targetDailyPoints.value, ...chartData.value);

  return Math.max(25, Math.ceil(rawMax / 5) * 5);
});

const getChartY = (value) => {
  const chartTop = chartPaddingTop;
  const chartBottom = chartHeight - chartPaddingBottom;
  const drawableHeight = chartBottom - chartTop;

  return chartBottom - ((value / chartMaxValue.value) * drawableHeight);
};

const chartGridLines = computed(() => {
  const lines = [];
  const step = chartMaxValue.value <= 35 ? 5 : 10;

  for (let value = chartMaxValue.value; value >= 0; value -= step) {
    lines.push({ value, y: getChartY(value) });
  }

  if (lines[lines.length - 1]?.value !== 0) {
    lines.push({ value: 0, y: getChartY(0) });
  }

  return lines;
});

const chartPoints = computed(() => {
  const step = days.value.length > 1
    ? (chartWidth - (chartPaddingX * 2)) / (days.value.length - 1)
    : 0;

  return chartData.value.map((value, index) => ({
    day: days.value[index],
    value,
    x: chartPaddingX + (step * index),
    y: getChartY(value),
    isWeekend: [0, 6].includes(new Date(props.year, props.month - 1, days.value[index]).getDay()),
  }));
});

const chartLinePath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }

  if (chartPoints.value.length === 1) {
    const point = chartPoints.value[0];

    return `M ${point.x} ${point.y}`;
  }

  let path = `M ${chartPoints.value[0].x} ${chartPoints.value[0].y}`;

  // Smooth the line using cubic Bezier segments for a softer visual curve.
  for (let index = 0; index < chartPoints.value.length - 1; index += 1) {
    const p0 = chartPoints.value[index - 1] ?? chartPoints.value[index];
    const p1 = chartPoints.value[index];
    const p2 = chartPoints.value[index + 1];
    const p3 = chartPoints.value[index + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6);
    const cp1y = p1.y + ((p2.y - p0.y) / 6);
    const cp2x = p2.x - ((p3.x - p1.x) / 6);
    const cp2y = p2.y - ((p3.y - p1.y) / 6);

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
});

const chartAreaPath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }

  const first = chartPoints.value[0];
  const last = chartPoints.value[chartPoints.value.length - 1];
  const baseline = chartHeight - chartPaddingBottom;

  return `${chartLinePath.value} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
});

const getFocusKey = () => `day-${focusDay.value}`;

const focusTasks = computed(() => {
  const raw = focusTasksByDay.value[getFocusKey()];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw;
});

const persistLocalState = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    darkMode: darkMode.value,
    focusTasksByDay: focusTasksByDay.value,
    rewardsCatalog: rewards.value,
    rewardLedger: rewardLedger.value,
    weeklyReview: weeklyReview.value,
    localHabits: localHabits.value,
    hasCustomHabits: hasCustomHabits.value,
    travelMode: travelMode.value,
    milestonePointsOffset: milestonePointsOffset.value,
    progressiveSettings: progressiveSettings.value,
    enhancedState: enhancedState.value,
  };

  if (props.userId) {
    saveUserMonthlyState(props.userId, monthScope.value, payload);
  }

  await recalculateGlobalTotals();
};

const monthIndexFromScope = (scope) => {
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(String(scope));

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return (year * 100) + month;
};

const recalculateGlobalTotals = async () => {
  if (typeof window === 'undefined' || !props.userId) {
    redeemedBeforeCurrentMonth.value = 0;
    earnedBeforeCurrentMonth.value = 0;
    return;
  }

  let spentBeforeCurrent = 0;
  let earnedBeforeCurrent = 0;
  const states = await loadAllUserMonthlyStates(props.userId);

  states.forEach((row) => {
    const scopeIndex = monthIndexFromScope(row.month_key);
    if (scopeIndex === null) {
      return;
    }

    try {
      const parsed = row.state_data;
      
      // Points spent
      const entries = Array.isArray(parsed?.rewardLedger) ? parsed.rewardLedger : [];
      const monthSpent = entries.reduce((sum, entry) => {
        const cost = Number(entry?.cost);
        return sum + (Number.isFinite(cost) ? cost : 0);
      }, 0);

      // Points earned
      let monthEarnedIter = 0;
      if (Array.isArray(parsed?.localHabits)) {
        parsed.localHabits.forEach(habit => {
          if (Array.isArray(habit.completedDays) && habit.points) {
             monthEarnedIter += habit.completedDays.length * habit.points;
          }
        });
      }

      if (scopeIndex < selectedMonthIndex.value) {
        spentBeforeCurrent += monthSpent;
        earnedBeforeCurrent += monthEarnedIter;
      }

    } catch {
      // Ignored
    }
  });

  redeemedBeforeCurrentMonth.value = Math.max(0, spentBeforeCurrent);
  earnedBeforeCurrentMonth.value = Math.max(0, earnedBeforeCurrent);
};

const normalizeWeeklyReview = (raw) => {
  const fallback = createDefaultWeeklyReview();

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const text = (value) => {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  };

  const checks = Array.isArray(raw.checks)
    ? raw.checks
      .map((check) => ({ text: text(check?.text).trim(), done: !!check?.done }))
      .filter((check) => check.text !== '')
    : [];

  return {
    reviewDate: text(raw.reviewDate),
    metrics: {
      weeklyPoints: text(raw.metrics?.weeklyPoints),
      weeklyStickiness: text(raw.metrics?.weeklyStickiness),
      monthlyPoints: text(raw.metrics?.monthlyPoints),
      monthlyStickiness: text(raw.metrics?.monthlyStickiness),
    },
    checks: checks.length > 0 ? checks : fallback.checks,
    reflections: {
      wins: text(raw.reflections?.wins),
      misses: text(raw.reflections?.misses),
      triggerPlan: text(raw.reflections?.triggerPlan),
      rewardTune: text(raw.reflections?.rewardTune),
      habitScale: text(raw.reflections?.habitScale),
      healthCheck: text(raw.reflections?.healthCheck),
      nextWeekFocus: text(raw.reflections?.nextWeekFocus),
    },
  };
};

const applyThemeClass = () => {
  if (typeof document === 'undefined') {
    return;
  }

  document.body.classList.toggle('theme-dark', darkMode.value);
};

const loadLocalState = async () => {
  if (typeof window === 'undefined' || !props.userId) {
    return;
  }

  const parsed = await loadUserMonthlyState(props.userId, monthScope.value);

  if (!parsed) {
    weeklyReview.value = createDefaultWeeklyReview();
    rewards.value = defaultRewards.map((reward) => ({ ...reward }));
    await recalculateGlobalTotals();
    return;
  }

  try {
    darkMode.value = !!parsed.darkMode;
    focusTasksByDay.value = parsed.focusTasksByDay && typeof parsed.focusTasksByDay === 'object'
      ? parsed.focusTasksByDay
      : {};
    rewards.value = Array.isArray(parsed.rewardsCatalog)
      ? parsed.rewardsCatalog.map((reward, index) => normalizeReward(reward, index))
      : defaultRewards.map((reward) => ({ ...reward }));
    rewardLedger.value = Array.isArray(parsed.rewardLedger)
      ? parsed.rewardLedger.map((entry, index) => normalizeLedgerEntry(entry, index))
      : [];
    weeklyReview.value = normalizeWeeklyReview(parsed.weeklyReview);

    // Restore travel mode
    if (typeof parsed.travelMode === 'boolean') {
      travelMode.value = parsed.travelMode;
    }

    // Restore milestone offset
    if (typeof parsed.milestonePointsOffset === 'number') {
      milestonePointsOffset.value = parsed.milestonePointsOffset;
    }

    // Restore progressive settings
    if (parsed.progressiveSettings && typeof parsed.progressiveSettings === 'object') {
      const ps = parsed.progressiveSettings;
      progressiveSettings.value = {
        startDate: ps.startDate || '',
        currentPhaseId: ps.currentPhaseId || 'assets',
        dayType: ps.dayType || 'full',
        tierLabels: Array.isArray(ps.tierLabels) && ps.tierLabels.length === 4
          ? [...ps.tierLabels]
          : [...defaultTierLabels],
        phases: Array.isArray(ps.phases) && ps.phases.length > 0
          ? ps.phases.map(p => ({ ...p, weeks: Array.isArray(p.weeks) ? [...p.weeks] : [1, 6] }))
          : defaultPhases.map(p => ({ ...p, weeks: [...p.weeks] })),
        habitTiers: (ps.habitTiers && typeof ps.habitTiers === 'object') ? { ...ps.habitTiers } : {},
        pointMultipliers: (ps.pointMultipliers && typeof ps.pointMultipliers === 'object')
          ? { ...ps.pointMultipliers }
          : { full: 1.0, half: 0.6, floor: 0.3 },
      };
    }

    // Restore enhanced state (Tiers 1-4 + extended)
    if (parsed.enhancedState && typeof parsed.enhancedState === 'object') {
      const es = parsed.enhancedState;
      enhancedState.value = {
        moodEnergy: (es.moodEnergy && typeof es.moodEnergy === 'object') ? { ...es.moodEnergy } : {},
        habitNotes: (es.habitNotes && typeof es.habitNotes === 'object') ? { ...es.habitNotes } : {},
        achievements: (es.achievements && typeof es.achievements === 'object') ? { ...es.achievements } : {},
        notificationsEnabled: !!es.notificationsEnabled,
        quoteSeenDate: es.quoteSeenDate || '',
        morningSetupDate: es.morningSetupDate || '',
        dailyFocus: (es.dailyFocus && typeof es.dailyFocus === 'object') ? { ...es.dailyFocus } : {},
        deepWorkTimer: (es.deepWorkTimer && typeof es.deepWorkTimer === 'object') ? { ...es.deepWorkTimer } : null,
        archivedHabitIds: Array.isArray(es.archivedHabitIds) ? [...es.archivedHabitIds] : [],
        pushSubscription: es.pushSubscription || null,
      };
    }

    // Restore custom habit definitions or merge completions onto defaults
    if (Array.isArray(parsed.localHabits)) {
      if (parsed.hasCustomHabits) {
        // Full restore: custom names, points, AND completion data
        // Merge hints from default habits (hints are code-only, not persisted)
        const defaultHintMap = {};
        fallbackHabits.value.forEach(dh => { if (dh.hint) defaultHintMap[dh.id] = dh.hint; });
        localHabits.value = parsed.localHabits.map((h) => ({
          id: String(h.id || `custom-${Date.now()}-${Math.random()}`),
          name: String(h.name || ''),
          points: Math.max(1, Math.min(100, Number(h.points) || 1)),
          hint: defaultHintMap[h.id] || h.hint || '',
          completedDays: Array.isArray(h.completedDays) ? [...h.completedDays] : [],
          completedToday: !!h.completedToday,
        }));
        hasCustomHabits.value = true;
      } else {
        // Legacy path: merge only completion state onto defaults
        localHabits.value = localHabits.value.map((current) => {
          const matchingStored = parsed.localHabits.find((h) => h.id === current.id);
          if (matchingStored) {
            current.completedDays = Array.isArray(matchingStored.completedDays)
              ? [...matchingStored.completedDays]
              : [];
            current.completedToday = !!matchingStored.completedToday;
          }
          return current;
        });
      }
    }
  } catch {
    weeklyReview.value = createDefaultWeeklyReview();
  }

  // Restore global milestone offset from localStorage (persists across months)
  try {
    const savedOffset = localStorage.getItem('habuilt.milestoneOffset.' + props.userId);
    if (savedOffset !== null) {
      milestonePointsOffset.value = Number(savedOffset) || 0;
    }
  } catch {}

  await recalculateGlobalTotals();
};

const updateFocusTasksForDay = (tasks) => {
  focusTasksByDay.value = {
    ...focusTasksByDay.value,
    [getFocusKey()]: tasks,
  };

  persistLocalState();
};

const addFocusTask = () => {
  const text = newFocusTask.value.trim();

  if (!text) {
    return;
  }

  updateFocusTasksForDay([
    ...focusTasks.value,
    { text, done: false },
  ]);

  newFocusTask.value = '';
};

const deleteFocusTask = (index) => {
  updateFocusTasksForDay(focusTasks.value.filter((_, taskIndex) => taskIndex !== index));
};

const toggleFocusTask = (index) => {
  updateFocusTasksForDay(
    focusTasks.value.map((task, taskIndex) => (
      taskIndex === index
        ? { ...task, done: !task.done }
        : task
    )),
  );
};

const createSummary = (dayList) => {
  const targetPerDay = Math.max(1, Math.ceil(maxDailyPoints.value * 0.6));
  const points = dayList.reduce((sum, day) => sum + getDayTotal(day), 0);
  const completedDays = dayList.filter((day) => getDayTotal(day) >= targetPerDay).length;

  return {
    points,
    completedDays,
    totalDays: dayList.length,
    stickiness: dayList.length > 0 ? (completedDays / dayList.length) * 100 : 0,
    targetPerDay,
  };
};

const weeklyDays = computed(() => {
  const start = Math.max(1, evaluatedDays.value - 6);
  const result = [];

  for (let day = start; day <= evaluatedDays.value; day += 1) {
    result.push(day);
  }

  return result;
});

const weeklySummary = computed(() => createSummary(weeklyDays.value));
const monthlySummary = computed(() => createSummary(days.value.filter((day) => day <= evaluatedDays.value)));

const weeklySnapshotLabel = computed(
  () => `${weeklySummary.value.points} pts • ${weeklySummary.value.completedDays}/${weeklySummary.value.totalDays} days • ${weeklySummary.value.stickiness.toFixed(1)}% (day complete ≥ ${weeklySummary.value.targetPerDay} pts)`,
);

const monthlySnapshotLabel = computed(
  () => `${monthlySummary.value.points} pts • ${monthlySummary.value.completedDays}/${monthlySummary.value.totalDays} days • ${monthlySummary.value.stickiness.toFixed(1)}% (day complete ≥ ${monthlySummary.value.targetPerDay} pts)`,
);

const weeklyStickinessGuide = computed(() => {
  const totalDays = Math.max(weeklySummary.value.totalDays, 1);
  const completedDays = weeklySummary.value.completedDays;
  const threshold = weeklySummary.value.targetPerDay;

  return `Purpose: shows how consistently you hit your daily minimum in the last ${totalDays} days. Formula: (${completedDays} / ${totalDays}) × 100, where a day counts only if points are ≥ ${threshold}. Manual: count qualifying days, divide by ${totalDays}, then multiply by 100.`;
});

const monthlyStickinessGuide = computed(() => {
  const totalDays = Math.max(monthlySummary.value.totalDays, 1);
  const completedDays = monthlySummary.value.completedDays;
  const threshold = monthlySummary.value.targetPerDay;

  return `Purpose: shows month-to-date consistency of hitting your daily minimum. Formula: (${completedDays} / ${totalDays}) × 100, where a day counts only if points are ≥ ${threshold}. Manual: count qualifying days from day 1 to today, divide by ${totalDays}, then multiply by 100.`;
});

const fillWeeklyReviewMetrics = () => {
  weeklyReview.value = {
    ...weeklyReview.value,
    reviewDate: weeklyReview.value.reviewDate || props.today,
    metrics: {
      weeklyPoints: String(weeklySummary.value.points),
      weeklyStickiness: weeklySummary.value.stickiness.toFixed(1),
      monthlyPoints: String(monthlySummary.value.points),
      monthlyStickiness: monthlySummary.value.stickiness.toFixed(1),
    },
  };

  persistLocalState();
};

const saveWeeklyReview = () => {
  weeklyReview.value = normalizeWeeklyReview(weeklyReview.value);
  persistLocalState();
};

const addWeeklyCheck = () => {
  const text = newWeeklyCheck.value.trim();

  if (!text) {
    return;
  }

  weeklyReview.value.checks.push({ text, done: false });
  newWeeklyCheck.value = '';
  persistLocalState();
};

const removeWeeklyCheck = (index) => {
  weeklyReview.value.checks.splice(index, 1);

  if (weeklyReview.value.checks.length === 0) {
    weeklyReview.value.checks = createDefaultWeeklyReview().checks;
  }

  persistLocalState();
};

const claimReward = (reward) => {
  const rewardCost = Math.max(1, Number(reward?.cost) || 0);

  if (availableWallet.value < rewardCost) {
    return;
  }

  const descriptionInput = window.prompt(`Add description for "${reward.item}" (optional):`, reward.item);

  if (descriptionInput === null) {
    return;
  }

  const description = descriptionInput.trim() || reward.item;

  rewardLedger.value.unshift({
    item: reward.item,
    description,
    cost: rewardCost,
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
  });

  persistLocalState();
};

const startEditingRewards = () => {
  rewardsDraft.value = rewards.value.map((reward) => ({ ...normalizeReward(reward) }));
  rewardsEditing.value = true;
  rewardSaveStatus.value = 'idle';
};

const cancelEditingRewards = () => {
  rewardsEditing.value = false;
  rewardsDraft.value = [];
  rewardSaveStatus.value = 'idle';
};

const addDraftReward = () => {
  rewardsDraft.value.push({
    type: 'Custom',
    item: '',
    cost: 1,
  });
};

const removeDraftReward = (index) => {
  rewardsDraft.value.splice(index, 1);
};

const saveEditedRewards = async () => {
  if (rewardDraftHasErrors.value) {
    return;
  }

  rewardSaveStatus.value = 'saving';
  rewards.value = rewardsDraft.value.map((reward, index) => normalizeReward(reward, index));
  await persistLocalState();

  rewardSaveStatus.value = 'saved';
  rewardsEditing.value = false;

  setTimeout(() => {
    rewardSaveStatus.value = 'idle';
  }, 2500);
};

const startEditingLedger = () => {
  ledgerDraft.value = rewardLedger.value.map((entry, index) => ({ ...normalizeLedgerEntry(entry, index) }));
  ledgerEditing.value = true;
  ledgerSaveStatus.value = 'idle';
};

const cancelEditingLedger = () => {
  ledgerEditing.value = false;
  ledgerDraft.value = [];
  ledgerSaveStatus.value = 'idle';
};

const addDraftLedgerEntry = () => {
  ledgerDraft.value.unshift({
    item: 'Custom Reward',
    description: '',
    cost: 0,
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
  });
};

const removeDraftLedgerEntry = (index) => {
  ledgerDraft.value.splice(index, 1);
};

const saveEditedLedger = async () => {
  if (ledgerDraftHasErrors.value) {
    return;
  }

  ledgerSaveStatus.value = 'saving';
  rewardLedger.value = ledgerDraft.value.map((entry, index) => normalizeLedgerEntry(entry, index));
  await persistLocalState();

  ledgerSaveStatus.value = 'saved';
  ledgerEditing.value = false;

  setTimeout(() => {
    ledgerSaveStatus.value = 'idle';
  }, 2500);
};

const clearHabitChecklistProgressLocally = () => {
  localHabits.value = localHabits.value.map((habit) => ({
    ...habit,
    completedDays: [],
    completedToday: false,
  }));
  pendingCells.value = {};
};

// ─── Habit Editor Functions ───────────────────────────────────────────────────

const startEditingHabits = () => {
  const archived = archivedIdSet.value;
  habitsDraft.value = localHabits.value.map((h) => ({
    id: h.id,
    name: h.name,
    points: h.points,
    hint: h.hint || '',
    completedDays: [...h.completedDays],
    completedToday: h.completedToday,
    archived: archived.has(h.id) || h.archived === true,
  }));
  habitsEditing.value = true;
  habitSaveStatus.value = 'idle';
};

const toggleDraftArchive = (index) => {
  const h = habitsDraft.value[index];
  if (!h) return;
  habitsDraft.value[index] = { ...h, archived: !h.archived };
};

const cancelEditingHabits = () => {
  habitsEditing.value = false;
  habitsDraft.value = [];
  habitSaveStatus.value = 'idle';
};

const addDraftHabit = () => {
  habitsDraft.value.push({
    id: `custom-${Date.now()}-${habitsDraft.value.length}`,
    name: '',
    points: 1,
    completedDays: [],
    completedToday: false,
  });
};

const removeDraftHabit = (index) => {
  habitsDraft.value.splice(index, 1);
};

const moveDraftHabit = (fromIndex, toIndex) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= habitsDraft.value.length || toIndex >= habitsDraft.value.length) {
    return;
  }

  const [movedHabit] = habitsDraft.value.splice(fromIndex, 1);
  habitsDraft.value.splice(toIndex, 0, movedHabit);
};

const onHabitSwipeStart = (index, event) => {
  const touch = event?.changedTouches?.[0];
  if (!touch) {
    return;
  }

  habitSwipeStart.value[index] = {
    x: touch.clientX,
    y: touch.clientY,
  };
};

const onHabitSwipeEnd = (index, event) => {
  const start = habitSwipeStart.value[index];
  const touch = event?.changedTouches?.[0];

  delete habitSwipeStart.value[index];

  if (!start || !touch) {
    return;
  }

  const deltaX = touch.clientX - start.x;
  const deltaY = touch.clientY - start.y;
  const verticalThreshold = 30;

  if (Math.abs(deltaY) < verticalThreshold || Math.abs(deltaY) < Math.abs(deltaX)) {
    return;
  }

  if (deltaY < 0) {
    moveDraftHabit(index, Math.max(0, index - 1));
    return;
  }

  moveDraftHabit(index, Math.min(habitsDraft.value.length - 1, index + 1));
};

const saveEditedHabits = async () => {
  if (draftHasErrors.value) return;

  habitSaveStatus.value = 'saving';

  localHabits.value = habitsDraft.value.map((h) => ({
    id: h.id,
    name: h.name.trim(),
    points: Math.max(1, Math.min(100, Number(h.points) || 1)),
    hint: h.hint || '',
    completedDays: [...h.completedDays],
    completedToday: h.completedToday,
    archived: !!h.archived,
  }));

  // Sync archivedHabitIds from draft flags
  enhancedState.value.archivedHabitIds = habitsDraft.value
    .filter(h => h.archived)
    .map(h => h.id);

  hasCustomHabits.value = true;
  await persistLocalState();

  habitSaveStatus.value = 'saved';
  habitsEditing.value = false;

  setTimeout(() => {
    habitSaveStatus.value = 'idle';
  }, 2500);
};

// ─────────────────────────────────────────────────────────────────────────────

const clearLocalProgress = async () => {
  if (!window.confirm('Clear all dashboard progress? Habit checklist grid, total point balance, vacation milestone, and Today\' Focus and Reward data will be reset.')) {
    return;
  }

  clearHabitChecklistProgressLocally();
  focusDay.value = props.currentDay;
  focusTasksByDay.value = {};
  newFocusTask.value = '';
  rewardLedger.value = [];
  milestonePointsOffset.value = 0;
  try { localStorage.removeItem('habuilt.milestoneOffset.' + props.userId); } catch {}
  weeklyReview.value = createDefaultWeeklyReview();
  newWeeklyCheck.value = '';
  await persistLocalState();
};

const goToMonth = (target) => {
  if (!target || isNavigatingMonth.value) {
    return;
  }

  isNavigatingMonth.value = true;
  window.location.search = `?month=${target.month}&year=${target.year}`;
};

const goToPreviousMonth = () => {
  if (!props.canNavigatePrevMonth) {
    return;
  }

  goToMonth(props.previousMonth);
};

const goToNextMonth = () => {
  if (!props.canNavigateNextMonth) {
    return;
  }

  goToMonth(props.nextMonth);
};

const hasCompletedDay = (habit, day) => habit.completedDays.includes(day);
const keyFor = (habitId, day) => `${habitId}:${day}`;

const setHabitDayCompletion = (habit, day, completed) => {
  if (completed) {
    habit.completedDays.push(day);
    habit.completedDays = [...new Set(habit.completedDays)].sort((a, b) => a - b);
  } else {
    habit.completedDays = habit.completedDays.filter((value) => value !== day);
  }

  habit.completedToday = habit.completedDays.includes(props.currentDay);
};

const toggleHabitForDay = async (habit, day) => {
  if (props.isFutureMonth) {
    return;
  }

  const pendingKey = keyFor(habit.id, day);

  if (pendingCells.value[pendingKey]) {
    return;
  }

  pendingCells.value[pendingKey] = true;
  pendingCells.value = { ...pendingCells.value };

  try {
    const wasCompleted = hasCompletedDay(habit, day);
    setHabitDayCompletion(habit, day, !wasCompleted);
    // Haptic feedback — short tap on complete, double-pulse on undo
    if (navigator.vibrate) {
      navigator.vibrate(wasCompleted ? [15, 30, 15] : [20]);
    }
    await persistLocalState();
  } finally {
    delete pendingCells.value[pendingKey];
    pendingCells.value = { ...pendingCells.value };
  }
};

onMounted(async () => {
  await loadLocalState();
  applyThemeClass();
  // Re-schedule notifications if previously enabled
  if (enhancedState.value.notificationsEnabled) scheduleReminders();
  // Update minute clock every 30s for real-time UP NEXT resolution
  minuteTickTimer = setInterval(() => {
    currentDayMinutes.value = new Date().getHours() * 60 + new Date().getMinutes();
  }, 30000);
  // Load cross-month lifetime data (async, non-blocking for first paint)
  loadLifetimeData();
  // Resume active timer tick if a timer was running when tab closed
  if (enhancedState.value.deepWorkTimer?.running) {
    ensureTimerTick();
  }
  // Show Quick Morning Setup once per day if in current month + morning window
  maybeShowMorningSetup();
});

let minuteTickTimer = null;

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('theme-dark');
  }
  if (minuteTickTimer) clearInterval(minuteTickTimer);
  stopTimerTick();
});

watch(darkMode, () => {
  applyThemeClass();
  persistLocalState();
});

const bestCurrentStreak = computed(() => {
  if (!localHabits.value.length) return { name: '—', days: 0 };
  let best = { name: '—', days: 0 };
  for (const h of localHabits.value) {
    const s = getHabitStreak(h);
    if (s > best.days) best = { name: h.name, days: s };
  }
  return best;
});

// ══════════════════════════════════════════════════════════════════════════════
// TIER 1: ANALYTICS & STICKINESS
// ══════════════════════════════════════════════════════════════════════════════

// Daily Quote — deterministic pick based on date
const todayQuote = computed(() => {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
});

// Heatmap data — completion percentage per day
const heatmapData = computed(() => {
  const data = [];
  const maxPts = maxDailyPoints.value || 1;
  for (let d = 1; d <= props.monthDays; d++) {
    const pts = getDayTotal(d);
    const pct = Math.round((pts / maxPts) * 100);
    const isFuture = props.isCurrentMonth ? d > props.currentDay : props.isFutureMonth;
    data.push({ day: d, points: pts, pct, isFuture });
  }
  return data;
});

// Heatmap intensity class
const heatmapIntensity = (pct) => {
  if (pct >= 90) return 'heatmap--l4';
  if (pct >= 65) return 'heatmap--l3';
  if (pct >= 40) return 'heatmap--l2';
  if (pct > 0) return 'heatmap--l1';
  return 'heatmap--l0';
};

// Streak stats per habit
const habitStreaks = computed(() => {
  return localHabits.value.map(h => {
    const current = getHabitStreak(h);
    // Longest streak calculation
    const sorted = [...(h.completedDays || [])].sort((a, b) => a - b);
    let longest = 0, run = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0 || sorted[i] === sorted[i - 1] + 1) { run++; } else { run = 1; }
      if (run > longest) longest = run;
    }
    return { id: h.id, name: h.name, current, longest, total: (h.completedDays || []).length };
  });
});

// Consistency score (0-100) — weighted formula
const consistencyScore = computed(() => {
  if (evaluatedDays.value === 0) return 0;
  const rate = completionRate.value / 100;                           // 0-1
  const avgStreak = habitStreaks.value.reduce((s, h) => s + h.current, 0) / Math.max(1, habitStreaks.value.length);
  const streakFactor = Math.min(1, avgStreak / 14);                  // 14-day = 1.0
  const tierFactor = (Number(avgTierLevel.value) - 1) / 3;          // 0-1
  const dayOnTarget = evaluatedDays.value > 0 ? daysOnTargetCount.value / evaluatedDays.value : 0;
  return Math.round((rate * 40) + (dayOnTarget * 25) + (streakFactor * 20) + (tierFactor * 15));
});

const consistencyGrade = computed(() => {
  const s = consistencyScore.value;
  if (s >= 90) return { letter: 'A+', color: 'var(--grade-a)' };
  if (s >= 80) return { letter: 'A', color: 'var(--grade-a)' };
  if (s >= 70) return { letter: 'B+', color: 'var(--grade-b)' };
  if (s >= 60) return { letter: 'B', color: 'var(--grade-b)' };
  if (s >= 50) return { letter: 'C', color: 'var(--grade-c)' };
  if (s >= 40) return { letter: 'D', color: 'var(--grade-d)' };
  return { letter: 'F', color: 'var(--grade-f)' };
});

// Category-wise breakdown
const categoryBreakdown = computed(() => {
  const cats = {};
  for (const h of localHabits.value) {
    const cat = getHabitCategory(h);
    if (!cats[cat]) cats[cat] = { total: 0, completed: 0, label: getCategoryLabel(cat) };
    cats[cat].total += evaluatedDays.value;
    cats[cat].completed += (h.completedDays || []).filter(d => d <= evaluatedDays.value).length;
  }
  return Object.entries(cats).map(([key, v]) => ({
    key,
    label: v.label,
    pct: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);
});

// Local push notification setup
const enableNotifications = async () => {
  if (!('Notification' in window)) return;
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    enhancedState.value.notificationsEnabled = true;
    persistLocalState();
    scheduleReminders();
    // Register push subscription if SW supports it
    registerPushSubscription();
  }
};

// Push notification subscription — stores subscription endpoint in Supabase
// for server-side push delivery. Requires VAPID keys to be configured.
// Generate VAPID keys: npx web-push generate-vapid-keys
// Set VITE_VAPID_PUBLIC_KEY in .env for client, store private key on server.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

const registerPushSubscription = async () => {
  if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return; // Already subscribed

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Store subscription in enhanced state (persisted to Supabase)
    enhancedState.value.pushSubscription = JSON.parse(JSON.stringify(sub));
    await persistLocalState();
  } catch (err) {
    console.warn('Push subscription failed:', err);
  }
};

// Helper: convert VAPID base64 key to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

const scheduleReminders = () => {
  if (!enhancedState.value.notificationsEnabled) return;
  // Morning reminder at next 6 AM
  const now = new Date();
  const morning = new Date(now);
  morning.setHours(6, 0, 0, 0);
  if (morning <= now) morning.setDate(morning.getDate() + 1);
  const msToMorning = morning - now;

  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('Habuilt — Good Morning!', {
        body: 'Time to set your day type and start tracking.',
        icon: '/icons/icon-192x192.png',
      });
    }
  }, msToMorning);

  // Evening reminder at 8 PM
  const evening = new Date(now);
  evening.setHours(20, 0, 0, 0);
  if (evening <= now) evening.setDate(evening.getDate() + 1);
  const msToEvening = evening - now;

  setTimeout(() => {
    if (Notification.permission === 'granted') {
      const pct = Math.round(completionRate.value);
      new Notification('Habuilt — Evening Check', {
        body: `You're at ${pct}% today. Don't break the streak!`,
        icon: '/icons/icon-192x192.png',
      });
    }
  }, msToEvening);
};

// ══════════════════════════════════════════════════════════════════════════════
// TIER 2: GAMIFICATION & MOTIVATION
// ══════════════════════════════════════════════════════════════════════════════

// XP System — points earned weighted by tier + day type
const totalXP = computed(() => {
  let xp = 0;
  for (const h of localHabits.value) {
    const tier = getHabitTier(h.id);
    const tierMultiplier = 1 + ((tier - 1) * 0.25); // T1=1x, T2=1.25x, T3=1.5x, T4=1.75x
    const completions = (h.completedDays || []).filter(d => d <= evaluatedDays.value).length;
    xp += Math.round(h.points * tierMultiplier * completions);
  }
  return xp;
});

// Leveling: each level requires progressively more XP
const levelData = computed(() => {
  const xp = totalXP.value;
  // Level formula: XP needed = 50 * level^1.5
  let level = 1;
  let xpForNext = 50;
  let xpAccum = 0;
  while (xpAccum + xpForNext <= xp) {
    xpAccum += xpForNext;
    level++;
    xpForNext = Math.round(50 * Math.pow(level, 1.5));
  }
  const xpInLevel = xp - xpAccum;
  const pct = Math.round((xpInLevel / xpForNext) * 100);
  return { level, xp, xpInLevel, xpForNext, pct };
});

const levelTitle = computed(() => {
  const l = levelData.value.level;
  if (l >= 50) return 'Legend';
  if (l >= 40) return 'Grand Master';
  if (l >= 30) return 'Master';
  if (l >= 20) return 'Expert';
  if (l >= 15) return 'Veteran';
  if (l >= 10) return 'Warrior';
  if (l >= 7) return 'Apprentice';
  if (l >= 4) return 'Initiate';
  return 'Beginner';
});

// Achievement badges
const achievementDefs = [
  { id: 'first-day', name: 'First Step', desc: 'Complete your first habit', icon: 'Play' },
  { id: 'streak-7', name: 'Weekly Warrior', desc: '7-day streak on any habit', icon: 'Flame' },
  { id: 'streak-14', name: 'Fortnight Force', desc: '14-day streak on any habit', icon: 'Flame' },
  { id: 'streak-30', name: 'Monthly Machine', desc: '30-day streak on any habit', icon: 'Crown' },
  { id: 'perfect-day', name: 'Perfect Day', desc: '100% completion in a day', icon: 'Star' },
  { id: 'perfect-week', name: 'Perfect Week', desc: '7 consecutive 100% days', icon: 'Trophy' },
  { id: 'tier-2', name: 'Foundation Built', desc: 'Graduate a habit to Foundation', icon: 'Shield' },
  { id: 'tier-3', name: 'Standard Bearer', desc: 'Graduate a habit to Standard', icon: 'Shield' },
  { id: 'tier-4', name: 'Mastery Achieved', desc: 'Graduate a habit to Mastery', icon: 'Crown' },
  { id: 'all-tier-2', name: 'All Foundations', desc: 'All habits at Foundation+', icon: 'Award' },
  { id: 'level-5', name: 'Level 5', desc: 'Reach Level 5', icon: 'Zap' },
  { id: 'level-10', name: 'Double Digits', desc: 'Reach Level 10', icon: 'Zap' },
  { id: 'level-20', name: 'Expert Status', desc: 'Reach Level 20', icon: 'Trophy' },
  { id: 'score-80', name: 'A-Player', desc: 'Consistency score 80+', icon: 'Target' },
  { id: 'score-95', name: 'Near-Perfect', desc: 'Consistency score 95+', icon: 'Crown' },
  { id: 'xp-500', name: 'Half K', desc: 'Earn 500 total XP', icon: 'Star' },
  { id: 'xp-1000', name: 'Thousand Club', desc: 'Earn 1000 total XP', icon: 'Award' },
  { id: 'xp-5000', name: 'XP Legend', desc: 'Earn 5000 total XP', icon: 'Crown' },
];

const unlockedAchievements = computed(() => {
  const unlocked = new Set(Object.keys(enhancedState.value.achievements || {}));
  const newUnlocks = [];

  // Check each achievement
  const check = (id, condition) => {
    if (!unlocked.has(id) && condition) newUnlocks.push(id);
    return unlocked.has(id) || condition;
  };

  const anyCompleted = localHabits.value.some(h => (h.completedDays || []).length > 0);
  check('first-day', anyCompleted);

  const maxStreak = Math.max(0, ...habitStreaks.value.map(h => h.longest));
  check('streak-7', maxStreak >= 7);
  check('streak-14', maxStreak >= 14);
  check('streak-30', maxStreak >= 30);

  // Perfect day check
  const hasPerfectDay = (() => {
    for (let d = 1; d <= evaluatedDays.value; d++) {
      if (getDayTotal(d) >= maxDailyPoints.value) return true;
    }
    return false;
  })();
  check('perfect-day', hasPerfectDay);

  // Perfect week
  const hasPerfectWeek = (() => {
    for (let d = 1; d <= evaluatedDays.value - 6; d++) {
      let all = true;
      for (let i = 0; i < 7; i++) {
        if (getDayTotal(d + i) < maxDailyPoints.value) { all = false; break; }
      }
      if (all) return true;
    }
    return false;
  })();
  check('perfect-week', hasPerfectWeek);

  // Tier achievements
  const tiers = localHabits.value.map(h => getHabitTier(h.id));
  check('tier-2', tiers.some(t => t >= 2));
  check('tier-3', tiers.some(t => t >= 3));
  check('tier-4', tiers.some(t => t >= 4));
  check('all-tier-2', tiers.length > 0 && tiers.every(t => t >= 2));

  // Level achievements
  check('level-5', levelData.value.level >= 5);
  check('level-10', levelData.value.level >= 10);
  check('level-20', levelData.value.level >= 20);

  // Score achievements
  check('score-80', consistencyScore.value >= 80);
  check('score-95', consistencyScore.value >= 95);

  // XP achievements
  check('xp-500', totalXP.value >= 500);
  check('xp-1000', totalXP.value >= 1000);
  check('xp-5000', totalXP.value >= 5000);

  // Persist newly unlocked
  if (newUnlocks.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    for (const id of newUnlocks) {
      enhancedState.value.achievements[id] = { unlocked: true, date: today };
    }
    persistLocalState();
  }

  return achievementDefs.map(def => ({
    ...def,
    unlocked: unlocked.has(def.id) || newUnlocks.includes(def.id),
    date: enhancedState.value.achievements?.[def.id]?.date || '',
  }));
});

const unlockedCount = computed(() => unlockedAchievements.value.filter(a => a.unlocked).length);

// Mood & energy helpers
const getMoodEnergy = (day) => enhancedState.value.moodEnergy?.[day] || { mood: 0, energy: 0 };

const setMood = (day, mood) => {
  if (!enhancedState.value.moodEnergy) enhancedState.value.moodEnergy = {};
  const current = enhancedState.value.moodEnergy[day] || { mood: 0, energy: 0 };
  enhancedState.value.moodEnergy[day] = { ...current, mood };
  persistLocalState();
};

const setEnergy = (day, energy) => {
  if (!enhancedState.value.moodEnergy) enhancedState.value.moodEnergy = {};
  const current = enhancedState.value.moodEnergy[day] || { mood: 0, energy: 0 };
  enhancedState.value.moodEnergy[day] = { ...current, energy };
  persistLocalState();
};

const moodLabels = ['', 'Awful', 'Low', 'Okay', 'Good', 'Great'];
const energyLabels = ['', 'Drained', 'Low', 'Moderate', 'High', 'Charged'];

// Confetti trigger
const showConfetti = ref(false);
const triggerConfetti = () => {
  showConfetti.value = true;
  setTimeout(() => { showConfetti.value = false; }, 3000);
};

// ══════════════════════════════════════════════════════════════════════════════
// TIER 3: SMART FEATURES
// ══════════════════════════════════════════════════════════════════════════════

// Focus mode — show only incomplete habits for today
const focusFilteredHabits = computed(() => {
  if (!focusModeOn.value) return filteredMobileHabits.value;
  return filteredMobileHabits.value.filter(h => !h.completedDays.includes(mobileDay.value));
});

// Habit notes
const getHabitNote = (habitId, day) => {
  return enhancedState.value.habitNotes?.[`${habitId}:${day}`] || '';
};

const setHabitNote = (habitId, day, note) => {
  if (!enhancedState.value.habitNotes) enhancedState.value.habitNotes = {};
  enhancedState.value.habitNotes[`${habitId}:${day}`] = note;
  persistLocalState();
};

const toggleHabitNote = (habitId, day) => {
  const key = `${habitId}:${day}`;
  habitNotesOpen.value = habitNotesOpen.value === key ? null : key;
};

// Smart suggestions — data-driven weekly tips
const smartSuggestions = computed(() => {
  const suggestions = [];
  if (evaluatedDays.value < 3) return suggestions;

  // Find weakest habit (lowest completion rate)
  const habitRates = localHabits.value.map(h => {
    const completed = (h.completedDays || []).filter(d => d <= evaluatedDays.value).length;
    return { id: h.id, name: h.name, rate: evaluatedDays.value > 0 ? completed / evaluatedDays.value : 0 };
  }).sort((a, b) => a.rate - b.rate);

  if (habitRates.length > 0 && habitRates[0].rate < 0.5) {
    suggestions.push({
      type: 'focus',
      text: `"${habitRates[0].name}" needs attention — only ${Math.round(habitRates[0].rate * 100)}% completion this month.`,
    });
  }

  // Find strongest habit for praise
  const best = habitRates[habitRates.length - 1];
  if (best && best.rate >= 0.8) {
    suggestions.push({
      type: 'praise',
      text: `"${best.name}" is your strongest habit at ${Math.round(best.rate * 100)}%. Consider graduating its tier.`,
    });
  }

  // Streak warning
  const atRisk = habitStreaks.value.filter(h => h.current >= 5 && h.current < 14);
  if (atRisk.length > 0) {
    suggestions.push({
      type: 'streak',
      text: `${atRisk.length} habit${atRisk.length > 1 ? 's' : ''} building strong streaks (5-13 days). Keep going to hit graduation!`,
    });
  }

  // Mood-habit correlation hint
  const moodData = enhancedState.value.moodEnergy || {};
  const goodMoodDays = Object.entries(moodData).filter(([, v]) => v.mood >= 4).map(([d]) => Number(d));
  if (goodMoodDays.length >= 3) {
    const goodDayAvgPts = goodMoodDays.reduce((s, d) => s + getDayTotal(d), 0) / goodMoodDays.length;
    const overallAvg = dailyAverage.value;
    if (goodDayAvgPts > overallAvg * 1.15) {
      suggestions.push({
        type: 'insight',
        text: `On high-mood days, you score ${Math.round(goodDayAvgPts)} pts vs ${Math.round(overallAvg)} avg. Mood matters!`,
      });
    }
  }

  // Consistency suggestion
  if (consistencyScore.value < 60 && evaluatedDays.value > 7) {
    suggestions.push({
      type: 'tip',
      text: 'Consistency score is below 60. Try focusing on fewer habits first — depth beats breadth.',
    });
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
});

// ── Best Time of Day analytics ──
const bestTimeOfDay = computed(() => {
  const slots = ['morning', 'work', 'evening', 'anytime'];
  const stats = {};
  for (const slot of slots) {
    const habitsInSlot = localHabits.value.filter(h => getHabitTimeSlot(h) === slot);
    if (habitsInSlot.length === 0) continue;
    let totalCompletions = 0;
    let totalPossible = habitsInSlot.length * evaluatedDays.value;
    for (const h of habitsInSlot) {
      totalCompletions += (h.completedDays || []).filter(d => d <= evaluatedDays.value).length;
    }
    const rate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    stats[slot] = { count: habitsInSlot.length, completions: totalCompletions, possible: totalPossible, rate };
  }
  const sorted = Object.entries(stats).sort((a, b) => b[1].rate - a[1].rate);
  const best = sorted[0];
  const weakest = sorted[sorted.length - 1];
  return { stats, best: best ? { slot: best[0], ...best[1] } : null, weakest: weakest ? { slot: weakest[0], ...weakest[1] } : null };
});

// ── Weekly Momentum Sparkline (7-day point totals) ──
const weeklyMomentumData = computed(() => {
  const today = props.currentDay;
  const points = [];
  for (let i = 6; i >= 0; i--) {
    const day = today - i;
    points.push(day >= 1 ? getDayTotal(day) : 0);
  }
  const max = Math.max(...points, 1);
  const trend = points[6] - points[0]; // positive = improving
  const avg = Math.round(points.reduce((s, v) => s + v, 0) / 7);
  return { points, max, trend, avg };
});

// ── Milestone Badges ──
const milestoneBadges = computed(() => {
  const xp = totalXP.value;
  const milestones = [
    { threshold: 500,   label: 'Starter',    icon: '🌱' },
    { threshold: 1000,  label: 'Builder',    icon: '🔨' },
    { threshold: 2500,  label: 'Achiever',   icon: '⭐' },
    { threshold: 5000,  label: 'Champion',   icon: '🏆' },
    { threshold: 10000, label: 'Legend',      icon: '👑' },
  ];
  return milestones.map(m => ({ ...m, earned: xp >= m.threshold }));
});
const nextMilestone = computed(() => milestoneBadges.value.find(m => !m.earned) || null);

// ══════════════════════════════════════════════════════════════════════════════
// LIFETIME STATS — CROSS-MONTH ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// Parse "YYYY-MM" → { year, month }
const parseMonthKey = (mk) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(mk || ''));
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
};

// Days in a given month (year is 4-digit, month is 1-12)
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

// Sort month keys chronologically ascending
const sortMonthKeys = (a, b) => {
  const pa = parseMonthKey(a); const pb = parseMonthKey(b);
  if (!pa || !pb) return 0;
  return (pa.year * 12 + pa.month) - (pb.year * 12 + pb.month);
};

// Load all months from Supabase, digest into a compact per-habit + per-month structure
const loadLifetimeData = async () => {
  if (!props.userId) {
    lifetimeData.value = { loaded: true, months: [], totalXP: 0, totalDaysTracked: 0, allTimeBestStreak: { name: '—', days: 0, habitId: null }, currentLifetimeStreak: 0 };
    return;
  }

  const rows = await loadAllUserMonthlyStates(props.userId);
  const months = [];
  const perHabitCompletions = {}; // habitId → [{ year, month, day }] chronologically
  const habitNames = {};

  // Include current-month unsaved local data by overlaying
  const nowScope = monthScope.value;
  let sawCurrentMonth = false;

  rows.sort((a, b) => sortMonthKeys(a.month_key, b.month_key)).forEach((row) => {
    const parsed = row.state_data;
    const pm = parseMonthKey(row.month_key);
    if (!parsed || !pm) return;
    if (row.month_key === nowScope) sawCurrentMonth = true;

    const habitsInMonth = Array.isArray(parsed.localHabits) ? parsed.localHabits : [];
    let earned = 0;
    let possible = 0;
    const daysWithActivity = new Set();

    habitsInMonth.forEach((h) => {
      const pts = Number(h.points) || 0;
      const cd = Array.isArray(h.completedDays) ? h.completedDays : [];
      earned += pts * cd.length;
      possible += pts * daysInMonth(pm.year, pm.month);
      if (!perHabitCompletions[h.id]) perHabitCompletions[h.id] = [];
      habitNames[h.id] = h.name || habitNames[h.id] || h.id;
      cd.forEach((d) => {
        perHabitCompletions[h.id].push({ year: pm.year, month: pm.month, day: d });
        daysWithActivity.add(`${pm.year}-${pm.month}-${d}`);
      });
    });

    months.push({
      monthKey: row.month_key,
      year: pm.year,
      month: pm.month,
      earned,
      possible,
      completionRate: possible > 0 ? Math.round((earned / possible) * 100) : 0,
      activeDays: daysWithActivity.size,
    });
  });

  // Overlay current month with in-memory state (so unsaved changes show up)
  if (!sawCurrentMonth) {
    const pm = parseMonthKey(nowScope);
    if (pm) {
      let earned = 0, possible = 0;
      const daysWithActivity = new Set();
      localHabits.value.forEach((h) => {
        const pts = h.points || 0;
        const cd = h.completedDays || [];
        earned += pts * cd.length;
        possible += pts * daysInMonth(pm.year, pm.month);
        cd.forEach((d) => daysWithActivity.add(`${pm.year}-${pm.month}-${d}`));
      });
      months.push({
        monthKey: nowScope, year: pm.year, month: pm.month,
        earned, possible,
        completionRate: possible > 0 ? Math.round((earned / possible) * 100) : 0,
        activeDays: daysWithActivity.size,
      });
    }
  }

  // Merge current in-memory month completions into perHabitCompletions (dedupe by y-m-day)
  const pmNow = parseMonthKey(nowScope);
  if (pmNow) {
    localHabits.value.forEach((h) => {
      if (!perHabitCompletions[h.id]) perHabitCompletions[h.id] = [];
      habitNames[h.id] = h.name;
      const existing = new Set(perHabitCompletions[h.id]
        .filter(x => x.year === pmNow.year && x.month === pmNow.month)
        .map(x => x.day));
      (h.completedDays || []).forEach((d) => {
        if (!existing.has(d)) perHabitCompletions[h.id].push({ year: pmNow.year, month: pmNow.month, day: d });
      });
    });
  }

  // Compute all-time longest streak per habit
  const habitStreakSummary = {};
  let allTimeBest = { name: '—', days: 0, habitId: null };
  Object.entries(perHabitCompletions).forEach(([habitId, arr]) => {
    // Convert to sorted absolute day-index (days since epoch, ignoring TZ)
    const daysAbs = arr.map(({ year, month, day }) => {
      const dt = new Date(year, month - 1, day);
      return Math.floor(dt.getTime() / 86400000);
    }).sort((a, b) => a - b);
    // Dedupe
    const unique = [...new Set(daysAbs)];
    let longest = 0, run = 0, prev = null;
    for (const d of unique) {
      if (prev !== null && d === prev + 1) run++; else run = 1;
      if (run > longest) longest = run;
      prev = d;
    }
    // Current (from today backward)
    const todayAbs = Math.floor(new Date(props.year, props.month - 1, props.currentDay).getTime() / 86400000);
    let current = 0;
    for (let i = unique.length - 1; i >= 0; i--) {
      if (unique[i] === todayAbs - current) current++;
      else if (unique[i] < todayAbs - current) break;
    }
    habitStreakSummary[habitId] = { longest, current, total: unique.length, name: habitNames[habitId] || habitId };
    if (longest > allTimeBest.days) {
      allTimeBest = { name: habitNames[habitId] || habitId, days: longest, habitId };
    }
  });

  // Lifetime "at least 1 habit / day" streak
  const allActiveDays = new Set();
  Object.values(perHabitCompletions).forEach((arr) => {
    arr.forEach(({ year, month, day }) => {
      const dt = new Date(year, month - 1, day);
      allActiveDays.add(Math.floor(dt.getTime() / 86400000));
    });
  });
  const sortedActive = [...allActiveDays].sort((a, b) => a - b);
  const todayAbs2 = Math.floor(new Date(props.year, props.month - 1, props.currentDay).getTime() / 86400000);
  let lifetimeStreak = 0;
  for (let i = sortedActive.length - 1; i >= 0; i--) {
    if (sortedActive[i] === todayAbs2 - lifetimeStreak) lifetimeStreak++;
    else if (sortedActive[i] < todayAbs2 - lifetimeStreak) break;
  }

  const totalXP = months.reduce((s, m) => s + m.earned, 0);
  const totalDaysTracked = allActiveDays.size;

  lifetimeData.value = {
    loaded: true,
    months: months.sort((a, b) => sortMonthKeys(a.monthKey, b.monthKey)),
    perHabitStreaks: habitStreakSummary,
    totalXP,
    totalDaysTracked,
    allTimeBestStreak: allTimeBest,
    currentLifetimeStreak: lifetimeStreak,
  };
};

// Month-over-month trend for the chart (last 6 months incl. current)
const monthTrendData = computed(() => {
  if (!lifetimeData.value.loaded) return [];
  const src = [...lifetimeData.value.months];
  // Keep last 6
  return src.slice(-6).map((m) => ({
    label: new Date(m.year, m.month - 1, 1).toLocaleString('en-US', { month: 'short' }),
    pct: m.completionRate,
    earned: m.earned,
  }));
});

const lifetimeSummary = computed(() => {
  if (!lifetimeData.value.loaded) {
    return { totalXP: 0, totalDaysTracked: 0, allTimeBestStreak: { name: '—', days: 0 }, currentLifetimeStreak: 0, monthCount: 0 };
  }
  return {
    totalXP: lifetimeData.value.totalXP,
    totalDaysTracked: lifetimeData.value.totalDaysTracked,
    allTimeBestStreak: lifetimeData.value.allTimeBestStreak,
    currentLifetimeStreak: lifetimeData.value.currentLifetimeStreak,
    monthCount: lifetimeData.value.months.length,
  };
});

// Per-habit history (used by hover / focus mode)
const historyForHabit = (habitId) => {
  if (!lifetimeData.value.loaded) return [];
  const summary = lifetimeData.value.perHabitStreaks?.[habitId];
  return summary || { longest: 0, current: 0, total: 0 };
};

// ══════════════════════════════════════════════════════════════════════════════
// TIME-AWARE "UP NEXT" RESOLUTION & HABIT CHAINS
// ══════════════════════════════════════════════════════════════════════════════

// Minute clock for time-aware UI updates (minutes from midnight 0..1439)
const currentDayMinutes = ref(new Date().getHours() * 60 + new Date().getMinutes());

// Parse scheduled time in minutes from midnight (e.g. "05:15" -> 315, "18:30" -> 1110)
const getHabitScheduledMinutes = (habit) => {
  if (!habit || !habit.name) return 9999;
  const name = habit.name.toLowerCase();

  // 1. Direct match on "HH:MM" in habit name string
  const match = /(\d{1,2}):(\d{2})/.exec(habit.name);
  if (match) {
    const hh = parseInt(match[1], 10);
    const mm = parseInt(match[2], 10);
    return hh * 60 + mm;
  }

  // 2. Specific keyword-based chronological schedule mapping
  if (name.includes('breakfast')) return 8 * 60;               // 08:00 AM
  if (name.includes('outreach') || name.includes('outbound') || name.includes('direct message')) return 10 * 60; // 10:00 AM
  if (name.includes('follow-up') || name.includes('prospects')) return 11 * 60; // 11:00 AM
  if (name.includes('eye break')) return 12 * 60;              // 12:00 PM
  if (name.includes('lunch')) return 13 * 60;                  // 01:00 PM
  if (name.includes('posture') || name.includes('stand')) return 14 * 60; // 02:00 PM
  if (name.includes('pipeline') || name.includes('stealth') || name.includes('business block')) return 15 * 60 + 30; // 03:30 PM
  if (name.includes('business idea') || name.includes('market note') || name.includes('pipeline idea')) return 16 * 60 + 30; // 04:30 PM
  if (name.includes('pipeline review') || name.includes('deals review') || name.includes('weekly pipeline')) return 17 * 60 + 30; // 05:30 PM
  if (name.includes('water') || name.includes('hydration')) return 17 * 60; // 05:00 PM
  if (name.includes('dinner')) return 19 * 60 + 30;            // 07:30 PM
  if (name.includes('scalp')) return 21 * 60 + 30;             // 09:30 PM
  if (name.includes('stress') || name.includes('journal')) return 21 * 60 + 45; // 09:45 PM
  if (name.includes('sleep duration') || name.includes('track sleep') || name.includes('sleep quality')) return 22 * 60 + 30; // 10:30 PM

  // 3. Fallback offsets by time-slot
  const slot = getHabitTimeSlot(habit);
  if (slot === 'morning') return 7 * 60 + 30; // 07:30
  if (slot === 'work') return 11 * 60;        // 11:00
  if (slot === 'evening') return 19 * 60;     // 19:00
  if (slot === 'anytime') return 14 * 60;     // 14:00
  if (slot === 'weekly') return 18 * 60;      // 18:00
  return 12 * 60;
};

// Format scheduled minutes to human readable string (e.g. 315 -> "5:15 AM", 1110 -> "6:30 PM")
const formatScheduledTime = (minutes) => {
  if (minutes >= 9999) return '';
  const hh = Math.floor(minutes / 60) % 24;
  const mm = minutes % 60;
  const period = hh >= 12 ? 'PM' : 'AM';
  const displayH = hh % 12 === 0 ? 12 : hh % 12;
  const displayM = String(mm).padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
};

// Given a habit ID that was just completed, what should the user do next?
const nextInChainId = (habitId) => habitChains[habitId] || null;

// Which habits are chain candidates (recently finished parent step)
const upNextChainHabits = computed(() => {
  const today = props.currentDay;
  const upNext = new Set();
  visibleHabits.value.forEach((h) => {
    if (!(h.completedDays || []).includes(today)) return;
    const nextId = nextInChainId(h.id);
    if (!nextId) return;
    const nextHabit = visibleHabits.value.find(x => x.id === nextId);
    if (!nextHabit) return;
    if ((nextHabit.completedDays || []).includes(today)) return;
    upNext.add(nextId);
  });
  return upNext;
});

// Single active UP NEXT activity as per CURRENT TIME OF DAY (not earlier pending items)
const upNextHabitInfo = computed(() => {
  if (!props.isCurrentMonth) return null;
  const today = props.currentDay;
  const nowMin = currentDayMinutes.value;

  // Filter visible habits uncompleted today and sort strictly by scheduled time
  const uncompleted = visibleHabits.value
    .filter(h => !hasCompletedDay(h, today))
    .map(h => ({
      habit: h,
      schedMin: getHabitScheduledMinutes(h),
    }))
    .sort((a, b) => a.schedMin - b.schedMin);

  if (uncompleted.length === 0) return null; // All completed for today!

  // 1. Strict time-of-day matching: look for uncompleted activities scheduled from current time window onward
  // Allows a 15-minute grace window in the past (activities currently active / in progress)
  const currentAndFuture = uncompleted.filter(x => x.schedMin >= nowMin - 15);

  if (currentAndFuture.length > 0) {
    // If a chain successor of a recently completed habit is scheduled now or in the future today, prioritize it
    const chainTarget = currentAndFuture.find(x => upNextChainHabits.value.has(x.habit.id));
    const target = chainTarget || currentAndFuture[0];

    const diff = target.schedMin - nowMin;
    const isCurrentSlot = diff <= 15 && diff >= -15;

    let badgeText = '';
    let shortBadge = '';

    if (isCurrentSlot) {
      badgeText = `UP NEXT · ${formatScheduledTime(target.schedMin)}`;
      shortBadge = formatScheduledTime(target.schedMin);
    } else if (diff > 0 && diff <= 60) {
      badgeText = `UP NEXT · IN ${diff}m`;
      shortBadge = `IN ${diff}m`;
    } else {
      badgeText = `UP NEXT · ${formatScheduledTime(target.schedMin)}`;
      shortBadge = formatScheduledTime(target.schedMin);
    }

    return {
      habit: target.habit,
      status: isCurrentSlot ? 'due' : 'upcoming',
      badgeText,
      shortBadge,
      timeLabel: formatScheduledTime(target.schedMin),
    };
  }

  // 2. Only if ALL current & future activities for today are finished, show the next earlier remaining habit
  const fallback = uncompleted[uncompleted.length - 1];
  return {
    habit: fallback.habit,
    status: 'upcoming',
    badgeText: `UP NEXT · ${formatScheduledTime(fallback.schedMin)}`,
    shortBadge: formatScheduledTime(fallback.schedMin),
    timeLabel: formatScheduledTime(fallback.schedMin),
  };
});

const isHabitUpNext = (habit) => {
  return upNextHabitInfo.value?.habit?.id === habit.id;
};


// ══════════════════════════════════════════════════════════════════════════════
// ACCOUNTABILITY / DEEP WORK TIMER (ENHANCED)
// ══════════════════════════════════════════════════════════════════════════════

const timerTickHandle = ref(null);
const timerNow = ref(Date.now()); // Reactive clock so elapsed re-renders each tick
const timerLauncherDuration = ref(50); // Default deep-work slot
const customTimerMin = ref(null);
const timerLauncherHabitId = ref('');
const timerSoundEnabled = ref(true);
const timerCompleteToast = ref(null); // { name, points }

const onCustomTimerInput = () => {
  if (customTimerMin.value && customTimerMin.value > 0) {
    timerLauncherDuration.value = Math.min(300, Math.max(1, Number(customTimerMin.value)));
  }
};

const timerState = computed(() => enhancedState.value.deepWorkTimer || null);
const timerElapsedSec = computed(() => {
  const t = timerState.value;
  if (!t) return 0;
  const base = t.elapsedBeforePause || 0;
  const live = t.running ? Math.floor((timerNow.value - (t.startedAt || timerNow.value)) / 1000) : 0;
  return base + live;
});
const timerRemainingSec = computed(() => {
  return Math.max(0, timerTargetSec.value - timerElapsedSec.value);
});
const timerElapsedFormatted = computed(() => {
  const s = timerElapsedSec.value;
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
});
const timerRemainingFormatted = computed(() => {
  const s = timerRemainingSec.value;
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
});
const timerTargetSec = computed(() => (timerState.value?.targetMin || 0) * 60);
const timerProgressPct = computed(() => {
  const target = timerTargetSec.value;
  if (target <= 0) return 0;
  return Math.min(100, Math.round((timerElapsedSec.value / target) * 100));
});
const timerLinkedHabit = computed(() => {
  const id = timerState.value?.linkedHabitId;
  if (!id) return null;
  return localHabits.value.find(h => h.id === id) || null;
});

// Synthesized 4-tone celebration chime (Web Audio API)
const playTimerCompleteChime = () => {
  if (!timerSoundEnabled.value) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (major chord chime)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = ctx.currentTime + idx * 0.14;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.9);
    });
  } catch (e) {
    console.warn('Audio chime unsupported:', e);
  }
};

// Native system notification
const sendTimerCompleteNotification = (habitName, points) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('🎯 Deep Work Session Complete!', {
        body: habitName ? `Great job! "${habitName}" (+${points} pts) auto-marked complete.` : 'Focus session finished! Time for a short break.',
        icon: '/icons/icon-192.png',
        badge: '/favicon.svg',
      });
    } catch (e) { /* ignore */ }
  }
};

const requestTimerNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) { /* ignore */ }
  }
};

const startDeepWorkTimer = (targetMin, linkedHabitId) => {
  const min = Math.max(1, Number(targetMin) || 25);
  enhancedState.value.deepWorkTimer = {
    targetMin: min,
    linkedHabitId: linkedHabitId || null,
    startedAt: Date.now(),
    elapsedBeforePause: 0,
    running: true,
    isBreak: false,
    completedForDay: props.currentDay,
    _autoCompleted: false,
  };
  requestTimerNotificationPermission();
  ensureTimerTick();
  persistLocalState();
};

const startBreakTimer = (breakMin = 5) => {
  enhancedState.value.deepWorkTimer = {
    targetMin: breakMin,
    linkedHabitId: null,
    startedAt: Date.now(),
    elapsedBeforePause: 0,
    running: true,
    isBreak: true,
    completedForDay: props.currentDay,
    _autoCompleted: false,
  };
  ensureTimerTick();
  persistLocalState();
};

const pauseDeepWorkTimer = () => {
  const t = enhancedState.value.deepWorkTimer;
  if (!t || !t.running) return;
  const extra = Math.floor((Date.now() - (t.startedAt || Date.now())) / 1000);
  enhancedState.value.deepWorkTimer = {
    ...t,
    elapsedBeforePause: (t.elapsedBeforePause || 0) + extra,
    running: false,
    startedAt: null,
  };
  stopTimerTick();
  persistLocalState();
};

const resumeDeepWorkTimer = () => {
  const t = enhancedState.value.deepWorkTimer;
  if (!t || t.running) return;
  enhancedState.value.deepWorkTimer = { ...t, startedAt: Date.now(), running: true };
  ensureTimerTick();
  persistLocalState();
};

const stopDeepWorkTimer = () => {
  stopTimerTick();
  enhancedState.value.deepWorkTimer = null;
  timerCompleteToast.value = null;
  if (typeof document !== 'undefined') document.title = 'Habuilt';
  persistLocalState();
};

const ensureTimerTick = () => {
  if (timerTickHandle.value) return;
  timerTickHandle.value = setInterval(() => {
    timerNow.value = Date.now();
    const t = enhancedState.value.deepWorkTimer;
    if (!t || !t.running) return;

    // Auto-complete linked habit when target reached
    if (timerElapsedSec.value >= timerTargetSec.value && !t._autoCompleted) {
      if (t.linkedHabitId) {
        const habit = localHabits.value.find(h => h.id === t.linkedHabitId);
        if (habit && !habit.completedDays.includes(props.currentDay)) {
          setHabitDayCompletion(habit, props.currentDay, true);
          timerCompleteToast.value = {
            name: habit.name,
            points: habit.points,
          };
          setTimeout(() => { timerCompleteToast.value = null; }, 6000);
          launchConfetti();
          sendTimerCompleteNotification(habit.name, habit.points);
        }
      } else {
        sendTimerCompleteNotification(null, 0);
      }
      playTimerCompleteChime();
      if (navigator.vibrate) navigator.vibrate([25, 50, 25, 50, 40]);
      enhancedState.value.deepWorkTimer = { ...t, _autoCompleted: true, running: false };
      stopTimerTick();
      persistLocalState();
    }
  }, 1000);
};

const stopTimerTick = () => {
  if (timerTickHandle.value) {
    clearInterval(timerTickHandle.value);
    timerTickHandle.value = null;
  }
};

// Sync browser document title with timer countdown
watch([() => timerState.value?.running, timerRemainingFormatted, () => timerState.value?._autoCompleted, () => timerState.value?.isBreak], () => {
  if (typeof document === 'undefined') return;
  const t = timerState.value;
  if (!t) {
    document.title = 'Habuilt';
    return;
  }
  const habitLabel = timerLinkedHabit.value ? timerLinkedHabit.value.name.split('—')[0].trim() : (t.isBreak ? 'Rest Break' : 'Deep Work');

  if (t._autoCompleted) {
    document.title = `🎉 Done! ${habitLabel} — Habuilt`;
  } else if (t.running) {
    document.title = `⏱ (${timerRemainingFormatted.value}) ${habitLabel} — Habuilt`;
  } else {
    document.title = `⏸ Paused (${timerRemainingFormatted.value}) — Habuilt`;
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// QUICK MORNING SETUP
// ══════════════════════════════════════════════════════════════════════════════

const morningSetupOpen = ref(false);
const morningSetupFocus = ref(['', '', '']);

const todayDateKey = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

const morningHabits = computed(() =>
  visibleHabits.value.filter(h => getHabitTimeSlot(h) === 'morning').slice(0, 6)
);

const openMorningSetup = () => {
  // Pre-populate focus with existing values for today
  const existing = enhancedState.value.dailyFocus?.[props.currentDay] || [];
  morningSetupFocus.value = [
    existing[0] || '',
    existing[1] || '',
    existing[2] || '',
  ];
  morningSetupOpen.value = true;
};

const closeMorningSetup = () => {
  morningSetupOpen.value = false;
};

const saveMorningSetup = () => {
  // Persist focus intentions
  if (!enhancedState.value.dailyFocus) enhancedState.value.dailyFocus = {};
  enhancedState.value.dailyFocus[props.currentDay] = morningSetupFocus.value
    .map(t => t.trim())
    .filter(Boolean);
  enhancedState.value.morningSetupDate = todayDateKey.value;
  persistLocalState();
  morningSetupOpen.value = false;
  if (navigator.vibrate) navigator.vibrate([30]);
};

// Auto-open on first mount of the day (once per day)
const maybeShowMorningSetup = () => {
  if (!props.isCurrentMonth) return;
  const alreadyShownToday = enhancedState.value.morningSetupDate === todayDateKey.value;
  if (alreadyShownToday) return;
  // Only auto-open in the morning window (5am – 11am local)
  const hour = new Date().getHours();
  if (hour < 5 || hour >= 12) return;
  openMorningSetup();
};

const dailyFocusToday = computed(() => enhancedState.value.dailyFocus?.[props.currentDay] || []);

// ══════════════════════════════════════════════════════════════════════════════
// HABIT ARCHIVE / RESTORE
// ══════════════════════════════════════════════════════════════════════════════

const archiveHabitById = (id) => {
  if (!id) return;
  const list = enhancedState.value.archivedHabitIds || [];
  if (list.includes(id)) return;
  enhancedState.value.archivedHabitIds = [...list, id];
  // Also update draft if editor is open
  const idx = habitsDraft.value.findIndex(h => h.id === id);
  if (idx >= 0) habitsDraft.value[idx].archived = true;
  persistLocalState();
};

const restoreHabitById = (id) => {
  enhancedState.value.archivedHabitIds = (enhancedState.value.archivedHabitIds || []).filter(x => x !== id);
  const idx = habitsDraft.value.findIndex(h => h.id === id);
  if (idx >= 0) habitsDraft.value[idx].archived = false;
  persistLocalState();
};

const addDefaultHabitBack = (defaultHabit) => {
  // Restore a default habit that was previously deleted
  const existing = localHabits.value.find(h => h.id === defaultHabit.id);
  if (existing) {
    // Just un-archive
    restoreHabitById(defaultHabit.id);
    return;
  }
  localHabits.value.push({
    id: defaultHabit.id,
    name: defaultHabit.name,
    points: defaultHabit.points,
    hint: defaultHabit.hint || '',
    completedDays: [],
    completedToday: false,
  });
  hasCustomHabits.value = true;
  persistLocalState();
};

// Which default habits are missing from localHabits entirely (i.e. deleted by user)
const missingDefaultHabits = computed(() => {
  const currentIds = new Set(localHabits.value.map(h => h.id));
  return fallbackHabits.value.filter(h => !currentIds.has(h.id));
});

// Bulk-add every missing default habit at once (used from empty state)
const restoreAllDefaults = async () => {
  const additions = missingDefaultHabits.value.map(h => ({
    id: h.id,
    name: h.name,
    points: h.points,
    hint: h.hint || '',
    completedDays: [],
    completedToday: false,
  }));
  if (additions.length === 0) return;
  localHabits.value = [...localHabits.value, ...additions];
  // Also un-archive any that were archived
  enhancedState.value.archivedHabitIds = (enhancedState.value.archivedHabitIds || [])
    .filter(id => !additions.some(a => a.id === id));
  hasCustomHabits.value = true;
  await persistLocalState();
};

// ══════════════════════════════════════════════════════════════════════════════
// TIER 4: SOCIAL & EXPORT
// ══════════════════════════════════════════════════════════════════════════════

// Partner data loading
// Partner view: only meaningful for the seeded Ashish/Jyoti pair
const partnerEmail = computed(() => {
  if (isJyoti.value) return 'ashishgupta1v@gmail.com';
  if (isAshish.value) return 'goyaljyoti007@gmail.com';
  return '';
});
const partnerName = computed(() => {
  if (isJyoti.value) return 'Ashish';
  if (isAshish.value) return 'Jyoti';
  return '';
});

const loadPartnerData = async () => {
  partnerViewOpen.value = !partnerViewOpen.value;
  // Partner view toggles open/close. Actual partner data loading
  // would require cross-user Supabase lookup which is planned for v2.
  partnerData.value = null;
};

// JSON Backup/Restore
const exportBackup = () => {
  const backup = {
    version: 1,
    exportDate: new Date().toISOString(),
    userEmail: props.userEmail,
    month: props.month,
    year: props.year,
    localHabits: localHabits.value,
    hasCustomHabits: hasCustomHabits.value,
    travelMode: travelMode.value,
    milestonePointsOffset: milestonePointsOffset.value,
    progressiveSettings: progressiveSettings.value,
    enhancedState: enhancedState.value,
    rewards: rewards.value,
    rewardLedger: rewardLedger.value,
    weeklyReview: weeklyReview.value,
    focusTasksByDay: focusTasksByDay.value,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habuilt-backup-${props.year}-${String(props.month).padStart(2, '0')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importBackup = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !data.localHabits) {
        alert('Invalid backup file.');
        return;
      }
      if (!window.confirm(`Restore backup from ${data.exportDate}? This will overwrite current data.`)) return;

      // Restore data
      if (Array.isArray(data.localHabits)) {
        localHabits.value = data.localHabits.map(h => ({
          id: h.id, name: h.name, points: h.points || 1,
          completedDays: Array.isArray(h.completedDays) ? [...h.completedDays] : [],
          completedToday: !!h.completedToday,
        }));
        hasCustomHabits.value = !!data.hasCustomHabits;
      }
      if (data.progressiveSettings) {
        progressiveSettings.value = { ...progressiveSettings.value, ...data.progressiveSettings };
      }
      if (data.enhancedState) {
        enhancedState.value = { ...enhancedState.value, ...data.enhancedState };
      }
      if (data.rewards) rewards.value = data.rewards;
      if (data.rewardLedger) rewardLedger.value = data.rewardLedger;
      if (data.weeklyReview) weeklyReview.value = normalizeWeeklyReview(data.weeklyReview);
      if (data.focusTasksByDay) focusTasksByDay.value = data.focusTasksByDay;

      await persistLocalState();
      alert('Backup restored successfully!');
    } catch {
      alert('Failed to read backup file.');
    }
  };
  input.click();
};

// Share progress card — Canvas → PNG → Web Share API
const shareProgress = async () => {
  const W = 1080, H = 1350; // Instagram-story-friendly 4:5
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = '#6366f1'; ctx.fillRect(0, 0, W, 6);

  // Helper: rounded rect
  const rrect = (x, y, w, h, r, fill, stroke) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  };

  // ── Header ──
  ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  ctx.fillText('Habuilt', 60, 90);
  ctx.fillStyle = '#94a3b8'; ctx.font = '28px system-ui, sans-serif';
  ctx.fillText(`${monthLabel.value} ${props.year} Progress Report`, 60, 130);

  // ── KPI Cards Row ──
  const kpis = [
    { label: 'Score', value: `${consistencyScore.value}`, sub: consistencyGrade.value.letter, color: '#6366f1' },
    { label: 'Streak', value: `${systemStreak.value.current}d`, sub: `Best: ${systemStreak.value.best}d`, color: '#f59e0b' },
    { label: 'Level', value: `${levelData.value.level}`, sub: levelTitle.value, color: '#22c55e' },
    { label: 'XP', value: totalXP.value >= 1000 ? `${(totalXP.value/1000).toFixed(1)}k` : `${totalXP.value}`, sub: 'earned', color: '#a855f7' },
  ];
  const cardW = 230, cardH = 140, cardGap = 20, cardStartX = 60;
  kpis.forEach((k, i) => {
    const cx = cardStartX + i * (cardW + cardGap);
    rrect(cx, 170, cardW, cardH, 16, '#1e293b', k.color);
    ctx.fillStyle = '#94a3b8'; ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(k.label, cx + 20, 205);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(k.value, cx + 20, 260);
    ctx.fillStyle = '#64748b'; ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(k.sub, cx + 20, 290);
  });

  // ── Completion Ring ──
  const ringCx = W / 2, ringCy = 430, ringR = 80;
  ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.strokeStyle = '#334155';
  ctx.beginPath(); ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2); ctx.stroke();
  const pct = completionRate.value / 100;
  ctx.strokeStyle = pct >= 0.8 ? '#22c55e' : pct >= 0.5 ? '#f59e0b' : '#ef4444';
  ctx.beginPath(); ctx.arc(ringCx, ringCy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct); ctx.stroke();
  ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 40px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${completionRate.value.toFixed(0)}%`, ringCx, ringCy + 12);
  ctx.fillStyle = '#94a3b8'; ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Completion', ringCx, ringCy + 40);
  ctx.textAlign = 'left';

  // ── Mini Heatmap ──
  ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Monthly Activity', 60, 560);
  const cellSize = 28, cellGap = 4, hmStartX = 60, hmStartY = 575;
  const cols = 7;
  heatmapData.value.forEach((cell, idx) => {
    const col = idx % cols, row = Math.floor(idx / cols);
    const x = hmStartX + col * (cellSize + cellGap);
    const y = hmStartY + row * (cellSize + cellGap);
    let fill = '#1e293b';
    if (!cell.isFuture) {
      if (cell.pct >= 90) fill = '#22c55e';
      else if (cell.pct >= 65) fill = '#16a34a';
      else if (cell.pct >= 40) fill = '#4ade80';
      else if (cell.pct > 0) fill = '#86efac';
    }
    rrect(x, y, cellSize, cellSize, 4, fill, null);
    ctx.fillStyle = cell.isFuture ? '#334155' : '#f8fafc'; ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(`${cell.day}`, x + cellSize / 2, y + cellSize / 2 + 4);
    ctx.textAlign = 'left';
  });

  // ── Top Streaks ──
  const topStreaks = habitStreaks.value.slice().sort((a, b) => b.current - a.current).slice(0, 5);
  const streakY = 780;
  ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Top Streaks', 60, streakY);
  topStreaks.forEach((s, i) => {
    const y = streakY + 20 + i * 44;
    rrect(60, y, W - 120, 38, 8, '#1e293b', null);
    ctx.fillStyle = '#f8fafc'; ctx.font = '18px system-ui, sans-serif';
    const name = s.name.length > 30 ? s.name.substring(0, 28) + '…' : s.name;
    ctx.fillText(name, 80, y + 25);
    ctx.fillStyle = s.current >= 7 ? '#f59e0b' : '#94a3b8'; ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.current}d streak`, W - 80, y + 25);
    ctx.textAlign = 'left';
  });

  // ── Milestone Badges ──
  const badgeY = 1040;
  ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Milestones', 60, badgeY);
  const badges = milestoneBadges.value;
  const bw = 170, bh = 60, bgap = 18;
  badges.forEach((m, i) => {
    const x = 60 + i * (bw + bgap);
    const fill = m.earned ? '#1e3a5f' : '#1e293b';
    const border = m.earned ? '#6366f1' : '#334155';
    rrect(x, badgeY + 15, bw, bh, 10, fill, border);
    ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(m.icon, x + 30, badgeY + 55);
    ctx.fillStyle = m.earned ? '#f8fafc' : '#475569'; ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(m.label, x + 100, badgeY + 45);
    ctx.fillStyle = m.earned ? '#a5b4fc' : '#334155'; ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`${m.threshold} XP`, x + 100, badgeY + 65);
    ctx.textAlign = 'left';
  });

  // ── Footer ──
  ctx.fillStyle = '#475569'; ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('habuilt.com  •  1% better every day', 60, H - 40);
  // Bottom accent
  ctx.fillStyle = '#6366f1'; ctx.fillRect(0, H - 6, W, 6);

  // ── Export & Share ──
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `habuilt-${monthLabel.value.toLowerCase()}-${props.year}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Habuilt — ${monthLabel.value} ${props.year}`,
        text: `Score: ${consistencyScore.value}/100 | ${systemStreak.value.current}d streak | Level ${levelData.value.level}\n1% better every day. habuilt.com`,
        files: [file],
      });
    } else if (navigator.share) {
      // Fallback: share text only (desktop browsers)
      const text = `🏗 Habuilt — ${monthLabel.value} ${props.year}\n📊 Score: ${consistencyScore.value}/100 (${consistencyGrade.value.letter})\n🔥 ${systemStreak.value.current}d streak\n⭐ Level ${levelData.value.level} ${levelTitle.value}\n💪 ${totalXP.value} XP\n\n1% better every day. habuilt.com`;
      await navigator.share({ title: 'My Habuilt Progress', text });
    } else {
      // Last resort: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
    }
  } catch { /* user cancelled share dialog */ }
};
</script>

<template>
  <AppLayout>
    <section class="dashboard-flow" :class="{ 'month-nav-loading': isNavigatingMonth, 'show-all-sections': mobileHeroExpanded }">

      <!-- ══ CELEBRATION AUTO-COMPLETE TOAST ══ -->
      <div v-if="timerCompleteToast" class="timer-toast" @click="timerCompleteToast = null">
        <div class="timer-toast__icon">🎉</div>
        <div class="timer-toast__content">
          <strong>Deep Work Complete!</strong>
          <span>Auto-marked <em>{{ timerCompleteToast.name }}</em> (+{{ timerCompleteToast.points }} pts)</span>
        </div>
        <button class="timer-toast__close" aria-label="Close"><X class="icon-xs" /></button>
      </div>

      <!-- ══ DEEP WORK TIMER LAUNCHER (when no timer active) ══ -->
      <details v-if="!timerState && isCurrentMonth" class="deep-timer-launcher">
        <summary class="deep-timer-launcher__summary">
          <Timer class="icon-sm" />
          <span>Start Deep Work Session</span>
          <span class="deep-timer-launcher__hint">— auto-completes linked habit</span>
          <button
            type="button"
            class="deep-timer-launcher__mute-btn"
            @click.stop="timerSoundEnabled = !timerSoundEnabled"
            :title="timerSoundEnabled ? 'Chime sound enabled' : 'Chime sound muted'"
          >
            <Volume2 v-if="timerSoundEnabled" class="icon-xs" />
            <VolumeX v-else class="icon-xs" />
          </button>
        </summary>
        <div class="deep-timer-launcher__body">
          <div class="deep-timer-launcher__row">
            <label class="deep-timer-launcher__label">Duration</label>
            <div class="deep-timer-launcher__durations">
              <button v-for="min in [15, 25, 50, 90, 120]" :key="'dur-' + min"
                :class="['deep-timer-launcher__dur', timerLauncherDuration === min && !customTimerMin && 'deep-timer-launcher__dur--active']"
                @click="timerLauncherDuration = min; customTimerMin = null" type="button">
                {{ min }}m
              </button>
              <div class="deep-timer-launcher__custom-wrap">
                <input
                  v-model.number="customTimerMin"
                  type="number"
                  min="1"
                  max="300"
                  placeholder="Custom"
                  class="deep-timer-launcher__custom-input"
                  @focus="onCustomTimerInput"
                  @input="onCustomTimerInput"
                />
                <span class="deep-timer-launcher__custom-unit">m</span>
              </div>
            </div>
          </div>
          <div class="deep-timer-launcher__row">
            <label class="deep-timer-launcher__label">Link to habit (auto-mark on complete)</label>
            <select v-model="timerLauncherHabitId" class="deep-timer-launcher__select">
              <option value="">— No linked habit (general focus) —</option>
              <option v-for="h in timerHabitOptions" :key="'opt-' + h.id" :value="h.id">
                {{ hasCompletedDay(h, props.currentDay) ? '✓ ' : '' }}{{ h.name }} (+{{ h.points }} pt{{ h.points !== 1 ? 's' : '' }})
              </option>
            </select>
          </div>
          <button class="btn btn--primary-action deep-timer-launcher__start"
            @click="startDeepWorkTimer(timerLauncherDuration, timerLauncherHabitId || null)">
            <Play class="icon-sm" />
            <span>Start {{ timerLauncherDuration }}-min Focus Session</span>
          </button>
        </div>
      </details>

      <!-- ══ DEEP WORK TIMER (sticky when active) ══ -->
      <div v-if="timerState" class="deep-timer" :class="{ 'deep-timer--paused': !timerState.running, 'deep-timer--complete': timerState._autoCompleted, 'deep-timer--break': timerState.isBreak }">
        <div class="deep-timer__ring">
          <svg viewBox="0 0 40 40" class="deep-timer__ring-svg">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4"/>
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="4"
                    stroke-dasharray="100.53" :stroke-dashoffset="100.53 - (100.53 * timerProgressPct / 100)"
                    transform="rotate(-90 20 20)" stroke-linecap="round"/>
          </svg>
          <span class="deep-timer__pct mono-num">{{ timerProgressPct }}%</span>
        </div>
        <div class="deep-timer__body">
          <div class="deep-timer__top">
            <span class="deep-timer__label" v-if="timerState._autoCompleted && timerLinkedHabit">🎉 Done! {{ timerLinkedHabit.name }} marked (+{{ timerLinkedHabit.points }} pts)</span>
            <span class="deep-timer__label" v-else-if="timerState._autoCompleted">🎉 Session Complete!</span>
            <span class="deep-timer__label" v-else-if="timerState.isBreak">☕ Rest Break ({{ timerRemainingFormatted }} left)</span>
            <span class="deep-timer__label" v-else-if="timerLinkedHabit">🎯 Focus · {{ timerLinkedHabit.name }}</span>
            <span class="deep-timer__label" v-else>🎯 Deep Work Session</span>
            <span class="deep-timer__elapsed mono-num">{{ timerElapsedFormatted }} / {{ timerState.targetMin }}m</span>
          </div>

          <div v-if="timerState._autoCompleted" class="deep-timer__actions deep-timer__complete-actions">
            <button class="deep-timer__btn deep-timer__btn--break" @click="startBreakTimer(5)">
              <Coffee class="icon-xs" /> 5m Break
            </button>
            <button class="deep-timer__btn deep-timer__btn--break" @click="startBreakTimer(15)">
              <Coffee class="icon-xs" /> 15m Break
            </button>
            <button class="deep-timer__btn deep-timer__btn--primary" @click="stopDeepWorkTimer">
              <Check class="icon-xs" /> Finish
            </button>
          </div>

          <div v-else class="deep-timer__actions">
            <button v-if="!timerState.running" class="deep-timer__btn deep-timer__btn--primary" @click="resumeDeepWorkTimer">
              <Play class="icon-xs" /> Resume
            </button>
            <button v-if="timerState.running" class="deep-timer__btn" @click="pauseDeepWorkTimer">
              <Pause class="icon-xs" /> Pause
            </button>
            <button class="deep-timer__btn deep-timer__btn--danger" @click="stopDeepWorkTimer">
              <X class="icon-xs" /> Stop
            </button>
          </div>
        </div>
      </div>

      <!-- ══ MOBILE COMPACT BAR (shown only on mobile, above everything) ══ -->
      <div class="mobile-compact-bar">
        <div class="mcb-row">
          <span class="mcb-greeting">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
          <span class="grade-badge mcb-grade" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
          <span class="mcb-streak"><Flame class="icon-xs" /> {{ systemStreak.current }}d</span>
          <span class="mcb-wallet"><Award class="icon-xs" /> {{ availableWallet }}pts</span>
        </div>
        <div class="mcb-row mcb-row--progress">
          <div class="mcb-day-pills">
            <button class="mcb-pill" :class="{ 'mcb-pill--active': currentDayType === 'full' }" @click="setDayType('full')">Full</button>
            <button class="mcb-pill" :class="{ 'mcb-pill--active': currentDayType === 'half' }" @click="setDayType('half')">Half</button>
            <button class="mcb-pill" :class="{ 'mcb-pill--active': currentDayType === 'floor' }" @click="setDayType('floor')">Floor</button>
          </div>
          <div class="mcb-progress-track">
            <div class="mcb-progress-fill" :style="{ width: `${totalHabits > 0 ? Math.min(100, Math.round((todayCompletedCount / totalHabits) * 100)) : 0}%` }"></div>
          </div>
          <span class="mcb-progress-label">{{ todayCompletedCount }}/{{ totalHabits }}</span>
        </div>

        <!-- Live Up Next Activity Row on Mobile -->
        <div v-if="props.isCurrentMonth && upNextHabitInfo && !hasCompletedDay(upNextHabitInfo.habit, props.currentDay)"
          class="mcb-up-next-row"
          @click="toggleHabitForDay(upNextHabitInfo.habit, props.currentDay)">
          <div class="mcb-up-next-tag" :class="{ 'mcb-up-next-tag--due': upNextHabitInfo.status === 'due' }">
            <Clock class="icon-xs" />
            <span>{{ upNextHabitInfo.shortBadge }}</span>
          </div>
          <span class="mcb-up-next-title">{{ upNextHabitInfo.habit.name }}</span>
          <span class="mcb-up-next-action">
            <Check class="icon-xs" />
            <span>+{{ upNextHabitInfo.habit.points }}pt</span>
          </span>
        </div>

        <button class="mcb-expand-btn" @click="mobileHeroExpanded = !mobileHeroExpanded">
          {{ mobileHeroExpanded ? 'Hide Dashboard' : 'Show Dashboard' }}
          <ChevronUp v-if="mobileHeroExpanded" class="icon-xs" />
          <ChevronDown v-else class="icon-xs" />
        </button>
      </div>


      <!-- ── TOP HERO & OVERVIEW ── -->
      <section class="card card--hero" :class="{ 'mobile-hero-collapsed': !mobileHeroExpanded }" id="overview">
        <!-- ── Command Bar: Month Nav + Track + Level Pill + Theme ── -->
        <div class="hero-command-bar">
          <div class="hero-command-bar__left">
            <span class="hero-track-pill" :class="isJyoti ? 'hero-track-pill--jyoti' : (isAshish ? 'hero-track-pill--ashish' : 'hero-track-pill--generic')">
              <Sparkles class="icon-xs" />
              <span v-if="isJyoti">Jyoti's System</span>
              <span v-else-if="isAshish">Ashish's System</span>
              <span v-else>{{ displayName }}'s System</span>
            </span>
            <span class="hero-version-tag">PRO</span>
            <!-- Level / XP Pill -->
            <div class="hero-level-chip" :title="`${levelData.xpInLevel} / ${levelData.xpForNext} XP to next level`">
              <Zap class="icon-xs icon-zap" />
              <span class="hero-level-chip__text">Lv. {{ levelData.level }} {{ levelTitle }}</span>
              <span class="hero-level-chip__xp">{{ totalXP }} XP</span>
            </div>
          </div>
          <div class="hero-command-bar__right">
            <!-- Travel Mode (Chandigarh Preset — Ashish only) -->
            <button
              v-if="isAshish"
              class="hero-nav-btn hero-nav-btn--travel"
              :class="{ 'hero-nav-btn--travel-active': travelMode }"
              @click="toggleTravelMode"
              :title="travelMode ? 'Travel Mode Active (Chandigarh - 14 habits) • Click to return to Home' : 'Switch to Travel Mode (Chandigarh)'"
            >
              <Plane class="icon-sm" />
              <span class="hero-travel-tag">{{ travelMode ? 'Chandigarh' : 'Travel' }}</span>
            </button>

            <button class="hero-nav-btn" :disabled="!canNavigatePrevMonth || isNavigatingMonth" @click="goToPreviousMonth" title="Previous Month">
              <ChevronLeft class="icon-sm" />
            </button>
            <div class="hero-month-chip">
              <Calendar class="icon-xs" />
              <span>{{ monthLabel.slice(0, 3) }} '{{ String(year).slice(-2) }}</span>
            </div>
            <button class="hero-nav-btn" :disabled="!canNavigateNextMonth || isNavigatingMonth" @click="goToNextMonth" title="Next Month">
              <ChevronRight class="icon-sm" />
            </button>
            <button class="hero-nav-btn hero-nav-btn--theme" @click="darkMode = !darkMode" :title="darkMode ? 'Light Mode' : 'Dark Mode'" aria-label="Toggle Theme">
              <Sun v-if="darkMode" class="icon-sm icon-sun" />
              <Moon v-else class="icon-sm icon-moon" />
            </button>
          </div>
        </div>

        <!-- ── GREETING & DAY-TYPE STRIP ── -->
        <div class="hero-greeting-bar">
          <div class="hero-greeting-text">
            <div class="hero-greeting-title">
              <span class="hero-greeting-salute">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
              <span class="hero-greeting-wave">👋</span>
              <span class="grade-badge" :class="performanceGrade.class" :title="`Current Grade: ${performanceGrade.grade} (${performanceGrade.label})`">
                {{ performanceGrade.grade }}
              </span>
            </div>
            <p class="hero-greeting-quote">
              <span class="hero-greeting-quote__brand">Habuilt.</span> {{ timeGreeting.quote }}
            </p>
          </div>

          <!-- Interactive Day-Type Toggle -->
          <div class="hero-day-type-box">
            <div class="hero-day-type-label">
              <span>Day Protocol</span>
              <span class="hero-day-type-target">Target: {{ targetDailyPoints }} pts</span>
            </div>
            <div class="day-type-pills">
              <button
                type="button"
                class="day-type-pill"
                :class="{ 'day-type-pill--active': currentDayType === 'full' }"
                @click="setDayType('full')"
                title="Full Protocol: 100% target"
              >
                <Zap class="icon-xs" />
                <span>Full (100%)</span>
              </button>
              <button
                type="button"
                class="day-type-pill"
                :class="{ 'day-type-pill--active': currentDayType === 'half' }"
                @click="setDayType('half')"
                title="Half Protocol: 60% target"
              >
                <Clock class="icon-xs" />
                <span>Half (60%)</span>
              </button>
              <button
                type="button"
                class="day-type-pill"
                :class="{ 'day-type-pill--active': currentDayType === 'floor' }"
                @click="setDayType('floor')"
                title="Floor Protocol: 30% target (protect baseline)"
              >
                <Shield class="icon-xs" />
                <span>Floor (30%)</span>
              </button>
            </div>
          </div>
        </div>

        <header class="hero-head">
          <!-- ── LEFT: Focus Tasks + Mini Heatmap Ribbon ── -->
          <div class="hero-main">
            <!-- ── TODAY'S FOCUS CARD ── -->
            <div class="focus-card focus-card--hero">
              <div class="focus-head">
                <div class="focus-title-group">
                  <Target class="icon-focus" />
                  <strong>TODAY'S FOCUS</strong>
                  <span class="focus-today-progress-pill">
                    {{ todayCompletedCount }}/{{ totalHabits }} habits
                  </span>
                </div>
                <div class="focus-day-select">
                  <label for="focus-day">Day</label>
                  <select id="focus-day" v-model.number="focusDay">
                    <option v-for="day in days" :key="`focus-${day}`" :value="day">{{ day }}</option>
                  </select>
                  <button
                    v-if="focusDay !== props.currentDay && isCurrentMonth"
                    class="focus-jump-today"
                    type="button"
                    @click="focusDay = props.currentDay"
                    title="Jump to today"
                  >
                    Today
                  </button>
                  <span class="focus-score-badge">
                    <Flame class="icon-xs" />
                    <span>{{ getDayTotal(focusDay) }} pts</span>
                  </span>
                </div>
              </div>

              <!-- Quick Progress Track -->
              <div class="focus-quick-progress">
                <div class="focus-quick-progress-track">
                  <div
                    class="focus-quick-progress-fill"
                    :style="{ width: `${totalHabits > 0 ? Math.min(100, Math.round((todayCompletedCount / totalHabits) * 100)) : 0}%` }"
                  ></div>
                </div>
              </div>

              <div v-if="focusTasks.length > 0" class="focus-list">
                <article
                  v-for="(task, index) in focusTasks"
                  :key="`task-${focusDay}-${index}`"
                  class="focus-item"
                  :class="{ 'focus-item--done': task.done }"
                >
                  <button
                    type="button"
                    class="focus-checkbox"
                    :class="{ 'focus-checkbox--checked': task.done }"
                    @click="toggleFocusTask(index)"
                    :aria-label="task.done ? 'Mark task incomplete' : 'Mark task complete'"
                  >
                    <Check v-if="task.done" class="icon-check-focus" />
                  </button>
                  <label
                    :for="`focus-check-${focusDay}-${index}`"
                    class="focus-item__text"
                    :class="{ 'is-done': task.done }"
                    @click="toggleFocusTask(index)"
                  >
                    {{ task.text }}
                  </label>
                  <button
                    class="focus-delete"
                    type="button"
                    @click="deleteFocusTask(index)"
                    title="Delete task"
                  >
                    <Trash2 class="icon-xs" />
                  </button>
                </article>
              </div>

              <p v-else class="focus-empty">
                <Target class="icon-empty-focus" />
                <span>No daily objectives set yet — add your key priorities below.</span>
              </p>

              <div class="focus-input-row">
                <input
                  v-model="newFocusTask"
                  type="text"
                  maxlength="200"
                  placeholder="Type an objective and press Enter..."
                  @keydown.enter.prevent="addFocusTask"
                >
                <button
                  class="btn btn--add-focus"
                  :disabled="newFocusTask.trim() === ''"
                  @click="addFocusTask"
                  type="button"
                >
                  <Plus class="icon-sm" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <!-- ── 7-DAY GITHUB-STYLE MINI HEATMAP ── -->
            <div class="gh-mini-heatmap">
              <div class="gh-mini-heatmap__head">
                <div class="gh-mini-heatmap__title">
                  <Activity class="icon-xs" />
                  <span>7-Day Rhythm</span>
                </div>
                <div class="gh-mini-heatmap__legend">
                  <span class="gh-legend-txt">Less</span>
                  <span class="gh-sq gh-l0"></span>
                  <span class="gh-sq gh-l1"></span>
                  <span class="gh-sq gh-l2"></span>
                  <span class="gh-sq gh-l3"></span>
                  <span class="gh-sq gh-l4"></span>
                  <span class="gh-legend-txt">More</span>
                </div>
              </div>
              <div class="gh-mini-heatmap__track">
                <div
                  v-for="item in miniHeatmapDays"
                  :key="`mhm-${item.day}`"
                  class="gh-day-node"
                  :class="{ 'gh-day-node--today': item.isToday }"
                  :title="`Day ${item.day}: ${item.points} pts (${item.pct}%) ${item.isMet ? '• Target Met' : ''}`"
                >
                  <span class="gh-day-lbl">D{{ item.day }}</span>
                  <div
                    class="gh-sq"
                    :class="[
                      item.isFuture ? 'gh-future' : getGithubLevel(item.pct, item.points),
                      { 'gh-sq--met': item.isMet, 'gh-sq--today': item.isToday }
                    ]"
                  ></div>
                  <span class="gh-day-val">{{ item.isFuture ? '—' : item.points }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── RIGHT: 2x2 Glass KPI Cards + Expandable Breakdown ── -->
          <div class="hero-side">
            <div class="hero-kpi-grid">
              <!-- KPI 1: Today's Score -->
              <article class="glass-kpi glass-kpi--flame">
                <div class="glass-kpi__ring-wrap">
                  <svg class="glass-kpi__ring" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="url(#heroFlameGrad)" stroke-width="4" stroke-linecap="round"
                      :stroke-dasharray="`${Math.min(100, maxDailyPoints > 0 ? (todayPoints / maxDailyPoints) * 175.93 : 0)} 175.93`"
                      transform="rotate(-90 32 32)" />
                    <defs>
                      <linearGradient id="heroFlameGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#D4B36A" />
                        <stop offset="100%" stop-color="#D4A03E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="glass-kpi__ring-center">
                    <Flame class="glass-kpi__ring-icon glass-kpi__ring-icon--flame" />
                  </div>
                </div>
                <div class="glass-kpi__body">
                  <span class="glass-kpi__label">Today's Points</span>
                  <strong class="glass-kpi__value">{{ todayPoints }}<small>pts</small></strong>
                  <span class="glass-kpi__sub">of {{ maxDailyPoints }} possible</span>
                </div>
              </article>

              <!-- KPI 2: Streak & Grade -->
              <article class="glass-kpi glass-kpi--amber" :class="{ 'streak-flame-glow': [7, 14, 21, 30, 60, 90].includes(systemStreak.current) }">
                <div class="glass-kpi__ring-wrap">
                  <svg class="glass-kpi__ring" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="url(#heroAmberGrad)" stroke-width="4" stroke-linecap="round"
                      :stroke-dasharray="`${Math.min(175.93, (systemStreak.current / 30) * 175.93)} 175.93`"
                      transform="rotate(-90 32 32)" />
                    <defs>
                      <linearGradient id="heroAmberGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#D4A03E" />
                        <stop offset="100%" stop-color="#B08D3E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="glass-kpi__ring-center">
                    <Trophy class="glass-kpi__ring-icon glass-kpi__ring-icon--amber" />
                  </div>
                </div>
                <div class="glass-kpi__body">
                  <span class="glass-kpi__label">System Streak</span>
                  <strong class="glass-kpi__value">{{ systemStreak.current }}<small>days</small></strong>
                  <span class="glass-kpi__sub">Best: {{ systemStreak.best }}d • Grade {{ performanceGrade.grade }}</span>
                </div>
              </article>

              <!-- KPI 3: Wallet & Vacation Milestone -->
              <article class="glass-kpi glass-kpi--emerald">
                <div class="glass-kpi__ring-wrap">
                  <svg class="glass-kpi__ring" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="url(#heroEmeraldGrad)" stroke-width="4" stroke-linecap="round"
                      :stroke-dasharray="`${Math.min(175.93, (vacationProgress / 100) * 175.93)} 175.93`"
                      transform="rotate(-90 32 32)" />
                    <defs>
                      <linearGradient id="heroEmeraldGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#D4B36A" />
                        <stop offset="100%" stop-color="#B08D3E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="glass-kpi__ring-center">
                    <Award class="glass-kpi__ring-icon glass-kpi__ring-icon--emerald" />
                  </div>
                </div>
                <div class="glass-kpi__body">
                  <span class="glass-kpi__label">Reward Wallet</span>
                  <strong class="glass-kpi__value">{{ availableWallet }}<small>pts</small></strong>
                  <span class="glass-kpi__sub">{{ activeMilestoneLabel }} {{ vacationProgress.toFixed(0) }}%</span>
                </div>
              </article>

              <!-- KPI 4: XP Level & Rank -->
              <article class="glass-kpi glass-kpi--sky">
                <div class="glass-kpi__ring-wrap">
                  <svg class="glass-kpi__ring" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="url(#heroSkyGrad)" stroke-width="4" stroke-linecap="round"
                      :stroke-dasharray="`${Math.min(175.93, (levelData.pct / 100) * 175.93)} 175.93`"
                      transform="rotate(-90 32 32)" />
                    <defs>
                      <linearGradient id="heroSkyGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#D4A574" />
                        <stop offset="100%" stop-color="#B8865A" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="glass-kpi__ring-center">
                    <Zap class="glass-kpi__ring-icon glass-kpi__ring-icon--sky" />
                  </div>
                </div>
                <div class="glass-kpi__body">
                  <span class="glass-kpi__label">XP Rank</span>
                  <strong class="glass-kpi__value">Lv. {{ levelData.level }}<small>{{ levelTitle }}</small></strong>
                  <span class="glass-kpi__sub">{{ totalXP }} XP • {{ completionRate.toFixed(1) }}% Rate</span>
                </div>
              </article>
            </div>

            <!-- Expandable Stats Action Button -->
            <button
              type="button"
              class="hero-expand-toggle-btn"
              @click="heroStatsExpanded = !heroStatsExpanded"
            >
              <div class="hero-expand-toggle-btn__left">
                <DollarSign class="icon-xs" />
                <span>Financial Ledger & Point Math Breakdown</span>
              </div>
              <ChevronUp v-if="heroStatsExpanded" class="icon-xs" />
              <ChevronDown v-else class="icon-xs" />
            </button>

            <!-- Expandable Balance Row -->
            <div v-if="heroStatsExpanded" class="hero-balance-row">
              <div class="hero-balance-cell">
                <span>Opening Balance</span>
                <strong>{{ openingBalance }}</strong>
              </div>
              <div class="hero-balance-cell hero-balance-cell--earned">
                <span>+ Earned (Month)</span>
                <strong>{{ monthEarned }}</strong>
              </div>
              <div class="hero-balance-cell hero-balance-cell--spent">
                <span>- Redeemed (Ledger)</span>
                <strong>{{ monthRedeemed }}</strong>
              </div>
              <div class="hero-balance-cell hero-balance-cell--total">
                <span>= Net Available Balance</span>
                <strong>{{ availableWallet }}</strong>
              </div>
            </div>
          </div>
        </header>

        <p v-if="flashSuccess" class="banner banner--success">
          <CheckCircle2 class="icon-sm" />
          <span>{{ flashSuccess }}</span>
        </p>
        <p v-if="flashError" class="banner banner--error">
          <AlertCircle class="icon-sm" />
          <span>{{ flashError }}</span>
        </p>
      </section>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- ── SECTION: MONTHLY PERFORMANCE ANALYTICS ── -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <section class="card card--analytics" id="analytics">
        <div class="section-head">
          <div class="section-title-wrap">
            <h2 class="section-title">
              <span class="section-title__icon section-title__icon--analytics">
                <BarChart3 class="icon-md" />
              </span>
              <span>Performance Analytics</span>
            </h2>
            <small>Interactive daily performance trends & milestone tracking</small>
          </div>
          <div class="analytics-badges">
            <span class="section-badge section-badge--month">
              <Calendar class="icon-xs" />
              <span>{{ monthLabel }} {{ year }}</span>
            </span>
            <span class="section-badge section-badge--target">
              <Target class="icon-xs" />
              <span>Target: {{ targetDailyPoints }}+ pts/day</span>
            </span>
          </div>
        </div>

        <!-- ── HYBRID HTML + SVG CHART ── -->
        <div class="analytics-chart-container">
          <!-- Main Chart Row: HTML Y-Axis + SVG Plot Canvas -->
          <div class="analytics-chart-main">
            <!-- Crisp HTML Y-Axis (Fixed, unscaled typography) -->
            <div class="analytics-y-axis" aria-hidden="true">
              <span
                v-for="line in chartGridLines"
                :key="`ylabel-${line.value}`"
                class="analytics-y-axis__label"
                :style="{ top: `${(line.y / chartHeight) * 100}%` }"
              >
                {{ line.value }}
              </span>
            </div>

            <!-- SVG Visual Plot Area -->
            <div class="analytics-canvas-box">
              <svg class="analytics-svg" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="analyticsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#C8A456" stop-opacity="0.35" />
                    <stop offset="70%" stop-color="#C8A456" stop-opacity="0.08" />
                    <stop offset="100%" stop-color="#C8A456" stop-opacity="0.00" />
                  </linearGradient>
                  <linearGradient id="analyticsLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#D4B36A" />
                    <stop offset="50%" stop-color="#C8A456" />
                    <stop offset="100%" stop-color="#B08D3E" />
                  </linearGradient>
                </defs>

                <!-- Grid lines -->
                <g class="analytics-svg__grid">
                  <line
                    v-for="line in chartGridLines"
                    :key="`grid-${line.value}`"
                    :x1="chartPaddingX"
                    :x2="chartWidth - chartPaddingX"
                    :y1="line.y"
                    :y2="line.y"
                    vector-effect="non-scaling-stroke"
                  />
                </g>

                <!-- Target threshold line (vector-effect ensures consistent 1.5px stroke) -->
                <line
                  class="analytics-svg__target-line"
                  :x1="chartPaddingX"
                  :x2="chartWidth - chartPaddingX"
                  :y1="getChartY(targetDailyPoints)"
                  :y2="getChartY(targetDailyPoints)"
                  vector-effect="non-scaling-stroke"
                />

                <!-- Area & Line paths -->
                <path class="analytics-svg__area" :d="chartAreaPath" />
                <path class="analytics-svg__line" :d="chartLinePath" vector-effect="non-scaling-stroke" />

                <!-- Data point circles -->
                <circle
                  v-for="point in chartPoints"
                  :key="`pt-${point.day}`"
                  class="analytics-svg__dot"
                  :class="{
                    'analytics-svg__dot--hovered': hoveredChartPoint?.day === point.day,
                    'analytics-svg__dot--above': point.value >= targetDailyPoints,
                    'analytics-svg__dot--below': point.value > 0 && point.value < targetDailyPoints,
                    'analytics-svg__dot--today': props.isCurrentMonth && point.day === props.currentDay
                  }"
                  :cx="point.x"
                  :cy="point.y"
                  :r="hoveredChartPoint?.day === point.day ? 6.5 : (props.isCurrentMonth && point.day === props.currentDay ? 5 : 3.5)"
                  vector-effect="non-scaling-stroke"
                  @mouseenter="hoveredChartPoint = point"
                  @mouseleave="hoveredChartPoint = null"
                  @touchstart.passive="hoveredChartPoint = point"
                />
              </svg>

              <!-- Target Floating Flag (Crisp HTML, no SVG distortion) -->
              <div class="analytics-target-flag" :style="{ top: `${(getChartY(targetDailyPoints) / chartHeight) * 100}%` }">
                <span class="analytics-target-flag__text">TARGET {{ targetDailyPoints }} PTS</span>
              </div>

              <!-- Interactive Floating Glass Tooltip -->
              <div
                v-if="hoveredChartPoint"
                class="analytics-tooltip"
                :class="hoveredChartPoint.value >= targetDailyPoints ? 'analytics-tooltip--met' : 'analytics-tooltip--below'"
                :style="{
                  left: `clamp(12px, ${(hoveredChartPoint.x / chartWidth) * 100}%, calc(100% - 150px))`
                }"
              >
                <div class="analytics-tooltip__header">
                  <span class="analytics-tooltip__day">Day {{ hoveredChartPoint.day }}</span>
                  <span class="analytics-tooltip__badge" :class="hoveredChartPoint.value >= targetDailyPoints ? 'analytics-tooltip__badge--met' : ''">
                    {{ hoveredChartPoint.value >= targetDailyPoints ? '✓ Target Hit' : 'Below Target' }}
                  </span>
                </div>
                <div class="analytics-tooltip__body">
                  <strong class="analytics-tooltip__points">{{ hoveredChartPoint.value }}</strong>
                  <span class="analytics-tooltip__unit">pts</span>
                  <span v-if="hoveredChartPoint.isWeekend" class="analytics-tooltip__weekend-tag">Weekend</span>
                </div>
              </div>
            </div>
          </div>

          <!-- HTML X-Axis (Days 1..31) (Crisp typography, no font stretching) -->
          <div class="analytics-x-axis">
            <div class="analytics-x-axis__pad"></div>
            <div class="analytics-x-axis__track">
              <span
                v-for="point in chartPoints"
                :key="`x-day-${point.day}`"
                class="analytics-x-axis__tick"
                :class="{
                  'analytics-x-axis__tick--weekend': point.isWeekend,
                  'analytics-x-axis__tick--today': props.isCurrentMonth && point.day === props.currentDay,
                  'analytics-x-axis__tick--active': hoveredChartPoint?.day === point.day,
                  'analytics-x-axis__tick--key': point.day === 1 || point.day % 5 === 0 || point.day === props.monthDays || (props.isCurrentMonth && point.day === props.currentDay)
                }"
                :style="{ left: `${(point.x / chartWidth) * 100}%` }"
                @mouseenter="hoveredChartPoint = point"
                @mouseleave="hoveredChartPoint = null"
              >
                {{ point.day }}
              </span>
            </div>
          </div>
        </div>

        <!-- Chart Legend Bar -->
        <div class="chart-legend-bar">
          <div class="chart-legend-items">
            <p class="chart-legend-note">
              <span class="chart-legend-dot chart-legend-dot--weekend">●</span>
              <span>Weekend (Sat/Sun)</span>
            </p>
            <p class="chart-legend-note">
              <span class="chart-legend-dot chart-legend-dot--target">- -</span>
              <span>Daily Target ({{ targetDailyPoints }} pts)</span>
            </p>
            <p class="chart-legend-note">
              <span class="chart-legend-dot chart-legend-dot--today">●</span>
              <span>Today</span>
            </p>
          </div>
          <span class="chart-legend-summary">
            {{ daysOnTargetCount }} of {{ evaluatedDays }} days on target ({{ evaluatedDays > 0 ? Math.round((daysOnTargetCount / evaluatedDays) * 100) : 0 }}%)
          </span>
        </div>

        <!-- 4-Card Premium Glass Metrics Grid -->
        <div class="analytics-metrics-grid">
          <!-- Card 1: Monthly Personal Best -->
          <article class="metric-glass-card metric-glass-card--gold">
            <div class="metric-glass-card__header">
              <div class="metric-glass-card__icon-wrap metric-glass-card__icon-wrap--gold">
                <Trophy class="metric-glass-card__icon" />
              </div>
              <span class="metric-glass-card__tag metric-glass-card__tag--gold">RECORD</span>
            </div>
            <div class="metric-glass-card__content">
              <span class="metric-glass-card__label">Monthly Best</span>
              <strong class="metric-glass-card__value">
                {{ personalBest.day ? `${personalBest.points}` : '0' }}
                <small>pts</small>
              </strong>
              <p class="metric-glass-card__desc">
                {{ personalBest.day ? `Achieved on Day ${personalBest.day}` : 'No points yet this month' }}
              </p>
            </div>
          </article>

          <!-- Card 2: Daily Average -->
          <article class="metric-glass-card metric-glass-card--sky">
            <div class="metric-glass-card__header">
              <div class="metric-glass-card__icon-wrap metric-glass-card__icon-wrap--sky">
                <TrendingUp class="metric-glass-card__icon" />
              </div>
              <span
                class="metric-glass-card__tag"
                :class="dailyAverage >= targetDailyPoints ? 'metric-glass-card__tag--emerald' : 'metric-glass-card__tag--sky'"
              >
                {{ dailyAverage >= targetDailyPoints ? 'ON TRACK' : 'BUILDING' }}
              </span>
            </div>
            <div class="metric-glass-card__content">
              <span class="metric-glass-card__label">Daily Average</span>
              <strong class="metric-glass-card__value">
                {{ dailyAverage.toFixed(1) }}
                <small>pts/day</small>
              </strong>
              <p class="metric-glass-card__desc">
                Target: {{ targetDailyPoints }} pts/day
              </p>
            </div>
          </article>

          <!-- Card 3: Consistency / Completion Rate -->
          <article class="metric-glass-card metric-glass-card--emerald">
            <div class="metric-glass-card__header">
              <div class="metric-glass-card__icon-wrap metric-glass-card__icon-wrap--emerald">
                <CheckCircle2 class="metric-glass-card__icon" />
              </div>
              <span class="metric-glass-card__tag metric-glass-card__tag--emerald">
                {{ daysOnTargetCount }}/{{ evaluatedDays }} ON TARGET
              </span>
            </div>
            <div class="metric-glass-card__content">
              <span class="metric-glass-card__label">Consistency Rate</span>
              <strong class="metric-glass-card__value">
                {{ completionRate.toFixed(1) }}
                <small>%</small>
              </strong>
              <p class="metric-glass-card__desc">
                {{ daysOnTargetCount }} days met target goal
              </p>
            </div>
          </article>

          <!-- Card 4: Total Points Earned -->
          <article class="metric-glass-card metric-glass-card--violet">
            <div class="metric-glass-card__header">
              <div class="metric-glass-card__icon-wrap metric-glass-card__icon-wrap--violet">
                <Zap class="metric-glass-card__icon" />
              </div>
              <span class="metric-glass-card__tag metric-glass-card__tag--violet">MONTH TOTAL</span>
            </div>
            <div class="metric-glass-card__content">
              <span class="metric-glass-card__label">Total Volume</span>
              <strong class="metric-glass-card__value">
                {{ monthTotalPoints }}
                <small>pts</small>
              </strong>
              <p class="metric-glass-card__desc">
                {{ evaluatedDays }} days tracked in {{ monthLabel }}
              </p>
            </div>
          </article>
        </div>

        <!-- Milestone Progress Card -->
        <div class="milestone-block">
          <div class="milestone-block__head">
            <div class="milestone-block__title">
              <div class="milestone-icon-wrap">
                <Sparkles class="icon-sm icon-sparkle" />
              </div>
              <div class="milestone-info">
                <strong>{{ activeMilestoneLabel }} Milestone</strong>
                <span>{{ activeMilestoneTarget }} pts required for unlock</span>
              </div>
            </div>
            <div class="milestone-block__meta">
              <span class="milestone-block__target">{{ milestoneWallet }} / {{ activeMilestoneTarget }} pts</span>
              <strong class="milestone-block__pct">{{ vacationProgress.toFixed(1) }}%</strong>
            </div>
          </div>
          <div class="milestone-track">
            <div class="milestone-fill" :style="`width: ${Math.min(100, vacationProgress)}%`">
              <span v-if="vacationProgress > 12" class="milestone-fill__label">{{ milestoneWallet }} pts</span>
            </div>
          </div>
          <div class="milestone-footer">
            <p class="milestone-note">{{ milestoneMessage }}</p>
            <span class="milestone-badge" :class="vacationProgress >= 100 ? 'milestone-badge--unlocked' : ''">
              {{ vacationProgress >= 100 ? '🎉 Unlocked' : `${pointsToVacation} pts left` }}
            </span>
            <button class="milestone-reset-btn" @click="resetMilestone" title="Reset milestone to start fresh">
              <RefreshCw class="icon-xs" /> Reset
            </button>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- ── SECTION: DAILY QUOTE ── -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <section class="card card--quote" v-if="todayQuote">
        <div class="daily-quote">
          <BookOpen class="daily-quote__icon" />
          <blockquote class="daily-quote__text">"{{ todayQuote.text }}"</blockquote>
          <cite class="daily-quote__author">— {{ todayQuote.author }}</cite>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- ── SECTION: ENHANCED DASHBOARD (XP, Score, Badges, Heatmap) ── -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <section class="card card--enhanced" id="enhanced-stats">
        <div class="section-head">
          <div class="section-title-wrap">
            <h2 class="section-title">
              <span class="section-title__icon section-title__icon--enhanced"><Activity class="icon-md" /></span>
              <span>Dashboard</span>
            </h2>
            <small>Level, score, streaks & achievements</small>
          </div>
          <div class="enhanced-actions">
            <button class="btn btn--secondary btn--sm" @click="focusModeOn = !focusModeOn" :class="{ 'btn--active': focusModeOn }">
              <component :is="focusModeOn ? EyeOff : Eye" class="icon-sm" />
              <span>{{ focusModeOn ? 'Focus ON' : 'Focus' }}</span>
            </button>
            <button class="btn btn--secondary btn--sm" @click="enableNotifications" v-if="!enhancedState.notificationsEnabled">
              <Bell class="icon-sm" /><span>Reminders</span>
            </button>
            <button class="btn btn--secondary btn--sm" @click="exportBackup" title="Export backup">
              <Download class="icon-sm" /><span class="hide-mobile">Backup</span>
            </button>
            <button class="btn btn--secondary btn--sm" @click="importBackup" title="Import backup">
              <Upload class="icon-sm" /><span class="hide-mobile">Restore</span>
            </button>
            <button class="btn btn--secondary btn--sm" @click="shareProgress" title="Share progress">
              <Share2 class="icon-sm" /><span class="hide-mobile">Share</span>
            </button>
          </div>
        </div>

        <!-- XP / Level / Score Row -->
        <div class="enhanced-stat-row">
          <!-- Level Card -->
          <div class="stat-card stat-card--level">
            <div class="stat-card__label">Level {{ levelData.level }}</div>
            <div class="stat-card__title">{{ levelTitle }}</div>
            <div class="xp-bar">
              <div class="xp-bar__fill" :style="{ width: levelData.pct + '%' }"></div>
            </div>
            <div class="xp-bar__label">{{ levelData.xpInLevel }} / {{ levelData.xpForNext }} XP</div>
          </div>

          <!-- Total XP -->
          <div class="stat-card stat-card--xp">
            <div class="stat-card__label">Total XP</div>
            <div class="stat-card__value">{{ totalXP.toLocaleString() }}</div>
            <Sparkle class="stat-card__deco" />
          </div>

          <!-- Consistency Score -->
          <div class="stat-card stat-card--score">
            <div class="stat-card__label">Consistency</div>
            <div class="stat-card__grade" :style="{ color: consistencyGrade.color }">{{ consistencyGrade.letter }}</div>
            <div class="stat-card__value stat-card__value--sm">{{ consistencyScore }}/100</div>
          </div>

          <!-- Badges Count -->
          <div class="stat-card stat-card--badges" @click="analyticsOpen = !analyticsOpen">
            <div class="stat-card__label">Badges</div>
            <div class="stat-card__value">{{ unlockedCount }}/{{ achievementDefs.length }}</div>
            <div class="stat-card__hint">{{ analyticsOpen ? 'Hide' : 'View all' }}</div>
          </div>
        </div>

        <!-- Mood & Energy for Today (current month only) -->
        <div class="mood-energy-row" v-if="isCurrentMonth">
          <div class="mood-section">
            <span class="mood-label"><Smile class="icon-xs" /> Mood</span>
            <div class="mood-pills">
              <button v-for="i in 5" :key="'mood-' + i"
                class="mood-pill" :class="{ 'mood-pill--active': getMoodEnergy(currentDay).mood === i }"
                @click="setMood(currentDay, i)"
                :title="moodLabels[i]">
                {{ ['', '😫', '😕', '😐', '😊', '😄'][i] }}
              </button>
            </div>
            <span class="mood-text" v-if="getMoodEnergy(currentDay).mood">{{ moodLabels[getMoodEnergy(currentDay).mood] }}</span>
          </div>
          <div class="mood-section">
            <span class="mood-label"><Battery class="icon-xs" /> Energy</span>
            <div class="mood-pills">
              <button v-for="i in 5" :key="'energy-' + i"
                class="mood-pill" :class="{ 'mood-pill--active': getMoodEnergy(currentDay).energy === i }"
                @click="setEnergy(currentDay, i)"
                :title="energyLabels[i]">
                {{ ['', '🪫', '🔋', '⚡', '💪', '🔥'][i] }}
              </button>
            </div>
            <span class="mood-text" v-if="getMoodEnergy(currentDay).energy">{{ energyLabels[getMoodEnergy(currentDay).energy] }}</span>
          </div>
        </div>

        <!-- Smart Suggestions -->
        <div class="smart-suggestions" v-if="smartSuggestions.length > 0">
          <div class="smart-suggestions__title"><Sparkle class="icon-xs" /> Smart Insights</div>
          <div class="suggestion-card" v-for="(s, idx) in smartSuggestions" :key="idx" :class="'suggestion-card--' + s.type">
            <span>{{ s.text }}</span>
          </div>
        </div>

        <!-- Best Time of Day Card -->
        <div class="analytics-card analytics-card--time-energy" v-if="bestTimeOfDay.best && evaluatedDays > 3">
          <div class="analytics-card__head">
            <Clock class="icon-sm" />
            <strong>Best Time of Day</strong>
          </div>
          <div class="time-energy-grid">
            <div v-for="slot in ['morning', 'work', 'evening', 'anytime']" :key="slot"
              class="time-energy-cell"
              :class="{ 'time-energy-cell--best': bestTimeOfDay.best?.slot === slot, 'time-energy-cell--weak': bestTimeOfDay.weakest?.slot === slot }">
              <span class="time-energy-cell__emoji">{{ { morning: '🌅', work: '⚡', evening: '🌙', anytime: '🥗' }[slot] }}</span>
              <span class="time-energy-cell__label">{{ { morning: 'Morning', work: 'Work', evening: 'Evening', anytime: 'Health' }[slot] }}</span>
              <strong class="time-energy-cell__rate mono-num">{{ bestTimeOfDay.stats[slot]?.rate ?? 0 }}%</strong>
              <div class="time-energy-cell__bar">
                <div class="time-energy-cell__fill" :style="{ width: (bestTimeOfDay.stats[slot]?.rate ?? 0) + '%' }"></div>
              </div>
            </div>
          </div>
          <p class="analytics-card__insight" v-if="bestTimeOfDay.best && bestTimeOfDay.weakest && bestTimeOfDay.best.slot !== bestTimeOfDay.weakest.slot">
            You're strongest in <strong>{{ { morning: 'mornings', work: 'work hours', evening: 'evenings', anytime: 'health habits' }[bestTimeOfDay.best.slot] }}</strong> ({{ bestTimeOfDay.best.rate }}%).
            Focus on <strong>{{ { morning: 'mornings', work: 'work hours', evening: 'evenings', anytime: 'health habits' }[bestTimeOfDay.weakest.slot] }}</strong> ({{ bestTimeOfDay.weakest.rate }}%) to level up.
          </p>
        </div>

        <!-- Weekly Momentum Sparkline -->
        <div class="analytics-card analytics-card--momentum" v-if="evaluatedDays > 1">
          <div class="analytics-card__head">
            <TrendingUp class="icon-sm" />
            <strong>7-Day Momentum</strong>
            <span class="momentum-trend mono-num" :class="weeklyMomentumData.trend >= 0 ? 'momentum-trend--up' : 'momentum-trend--down'">
              {{ weeklyMomentumData.trend >= 0 ? '+' : '' }}{{ weeklyMomentumData.trend }} pts
            </span>
          </div>
          <div class="sparkline-wrap">
            <svg class="sparkline-svg" viewBox="0 0 180 40" preserveAspectRatio="none">
              <polyline
                :points="weeklyMomentumData.points.map((v, i) => `${i * 30},${40 - (v / weeklyMomentumData.max) * 36}`).join(' ')"
                fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <circle v-for="(v, i) in weeklyMomentumData.points" :key="i"
                :cx="i * 30" :cy="40 - (v / weeklyMomentumData.max) * 36" r="2.5"
                :fill="i === 6 ? 'var(--accent)' : 'var(--surface-2)'" stroke="var(--accent)" stroke-width="1.5" />
            </svg>
            <div class="sparkline-labels">
              <span v-for="(v, i) in weeklyMomentumData.points" :key="'sl'+i" class="sparkline-day-label mono-num">
                {{ v }}
              </span>
            </div>
          </div>
          <p class="analytics-card__stat">Avg <strong class="mono-num">{{ weeklyMomentumData.avg }}</strong> pts/day over last 7 days</p>
        </div>

        <!-- Milestone Badges -->
        <div class="analytics-card analytics-card--badges" v-if="totalXP > 0">
          <div class="analytics-card__head">
            <Award class="icon-sm" />
            <strong>Milestone Badges</strong>
            <span class="milestone-earned-count mono-num">{{ milestoneBadges.filter(m => m.earned).length }}/{{ milestoneBadges.length }}</span>
          </div>
          <div class="milestone-badge-row">
            <div v-for="m in milestoneBadges" :key="m.threshold"
              class="xp-badge" :class="{ 'xp-badge--earned': m.earned, 'xp-badge--next': !m.earned && nextMilestone?.threshold === m.threshold }">
              <span class="xp-badge__icon">{{ m.icon }}</span>
              <span class="xp-badge__label">{{ m.label }}</span>
              <span class="xp-badge__threshold mono-num">{{ m.threshold >= 1000 ? (m.threshold/1000) + 'k' : m.threshold }}</span>
            </div>
          </div>
          <p class="analytics-card__stat" v-if="nextMilestone">
            <strong class="mono-num">{{ nextMilestone.threshold - totalXP }}</strong> XP to <strong>{{ nextMilestone.label }}</strong> badge
          </p>
        </div>

        <!-- ── LIFETIME STATS (cross-month) ── -->
        <div class="analytics-card analytics-card--lifetime" v-if="lifetimeData.loaded && lifetimeSummary.monthCount > 0">
          <div class="analytics-card__head">
            <History class="icon-sm" />
            <strong>Lifetime Stats</strong>
            <span class="lifetime-month-count mono-num">{{ lifetimeSummary.monthCount }} mo</span>
          </div>
          <div class="lifetime-stats-grid">
            <div class="lifetime-stat">
              <div class="lifetime-stat__value mono-num">{{ lifetimeSummary.currentLifetimeStreak }}</div>
              <div class="lifetime-stat__label">Active-Day Streak</div>
              <div class="lifetime-stat__sub">across all months</div>
            </div>
            <div class="lifetime-stat">
              <div class="lifetime-stat__value mono-num">{{ lifetimeSummary.allTimeBestStreak.days }}</div>
              <div class="lifetime-stat__label">All-Time Best</div>
              <div class="lifetime-stat__sub" :title="lifetimeSummary.allTimeBestStreak.name">{{ lifetimeSummary.allTimeBestStreak.name }}</div>
            </div>
            <div class="lifetime-stat">
              <div class="lifetime-stat__value mono-num">{{ lifetimeSummary.totalXP.toLocaleString() }}</div>
              <div class="lifetime-stat__label">Total XP</div>
              <div class="lifetime-stat__sub">earned all-time</div>
            </div>
            <div class="lifetime-stat">
              <div class="lifetime-stat__value mono-num">{{ lifetimeSummary.totalDaysTracked }}</div>
              <div class="lifetime-stat__label">Active Days</div>
              <div class="lifetime-stat__sub">≥1 habit done</div>
            </div>
          </div>

          <!-- Month-over-Month Trend Bars -->
          <div class="month-trend" v-if="monthTrendData.length > 1">
            <div class="month-trend__title">Month-over-Month Completion</div>
            <div class="month-trend__bars">
              <div class="month-trend__bar" v-for="(m, i) in monthTrendData" :key="'mtb-' + i">
                <div class="month-trend__fill" :style="{ height: Math.max(4, m.pct) + '%' }"
                     :class="{ 'month-trend__fill--current': i === monthTrendData.length - 1 }"
                     :title="`${m.label}: ${m.pct}% (${m.earned} pts)`"></div>
                <span class="month-trend__pct mono-num">{{ m.pct }}%</span>
                <span class="month-trend__label">{{ m.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="category-breakdown" v-if="categoryBreakdown.length > 0">
          <div class="category-breakdown__title">Category Performance</div>
          <div class="category-bar-list">
            <div class="category-bar-item" v-for="cat in categoryBreakdown" :key="cat.key">
              <span class="category-bar-item__label">{{ cat.label }}</span>
              <div class="category-bar-item__bar">
                <div class="category-bar-item__fill" :style="{ width: cat.pct + '%' }"></div>
              </div>
              <span class="category-bar-item__pct">{{ cat.pct }}%</span>
            </div>
          </div>
        </div>

        <!-- ── GITHUB-STYLE MONTHLY CONTRIBUTION HEATMAP ── -->
        <div class="heatmap-section gh-heatmap-section">
          <div class="gh-heatmap-header">
            <div class="gh-heatmap-title">
              <Activity class="icon-xs" />
              <span>Monthly Habit Activity</span>
              <span class="gh-heatmap-meta">{{ daysOnTargetCount }}/{{ evaluatedDays }} days on target ({{ completionRate.toFixed(0) }}%)</span>
            </div>
            <div class="gh-heatmap-legend">
              <span>Less</span>
              <span class="gh-sq gh-l0"></span>
              <span class="gh-sq gh-l1"></span>
              <span class="gh-sq gh-l2"></span>
              <span class="gh-sq gh-l3"></span>
              <span class="gh-sq gh-l4"></span>
              <span>More</span>
            </div>
          </div>
          <div class="gh-matrix-wrap">
            <div class="gh-matrix-grid">
              <div
                v-for="cell in heatmapData"
                :key="`gh-m-${cell.day}`"
                class="gh-matrix-cell"
                :class="[
                  cell.isFuture ? 'gh-future' : getGithubLevel(cell.pct, cell.points),
                  { 'gh-matrix-cell--today': props.isCurrentMonth && cell.day === props.currentDay }
                ]"
                :title="`Day ${cell.day}: ${cell.points} pts (${cell.pct}%)`"
              >
                <span class="gh-matrix-cell__num">{{ cell.day }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Achievement Badges (collapsible) -->
        <div class="achievements-section" v-if="analyticsOpen">
          <div class="achievements-grid">
            <div v-for="a in unlockedAchievements" :key="a.id"
              class="achievement-badge" :class="{ 'achievement-badge--locked': !a.unlocked }">
              <div class="achievement-badge__icon">{{ a.unlocked ? '🏅' : '🔒' }}</div>
              <div class="achievement-badge__name">{{ a.name }}</div>
              <div class="achievement-badge__desc">{{ a.desc }}</div>
              <div class="achievement-badge__date" v-if="a.unlocked && a.date">{{ a.date }}</div>
            </div>
          </div>
        </div>

        <!-- Streak Leaderboard -->
        <div class="streak-board">
          <div class="streak-board__title">Top Streaks</div>
          <div class="streak-list">
            <div class="streak-item" v-for="h in habitStreaks.slice().sort((a, b) => b.current - a.current).slice(0, 5)" :key="h.id">
              <span class="streak-item__name">{{ h.name }}</span>
              <span class="streak-item__stats">
                <span class="streak-item__current" :class="{ 'streak-item__current--hot': h.current >= 7 }">🔥 {{ h.current }}d</span>
                <span class="streak-item__best">Best: {{ h.longest }}d</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SECTION: PROGRESSIVE SYSTEM BAR ── -->
      <section class="card progressive-bar" id="progressive">
        <div class="progressive-bar__header">
          <div class="progressive-bar__title-group">
            <h2 class="section-title">
              <span class="section-title__icon"><TrendingUp class="icon-md" /></span>
              <span>Progressive System</span>
            </h2>
            <span class="progressive-bar__subtitle">Atomic 1% Daily Improvement</span>
          </div>
          <div class="progressive-bar__actions">
            <button class="btn btn--secondary btn--sm" @click="toggleProgressivePanel" :title="progressivePanelOpen ? 'Close Settings' : 'Open Settings'">
              <Settings class="icon-sm" />
              <span>{{ progressivePanelOpen ? 'Close' : 'Settings' }}</span>
            </button>
          </div>
        </div>

        <!-- Day Type Selector + Quick Stats -->
        <div class="progressive-bar__row">
          <!-- Day Type -->
          <div class="day-type-selector">
            <span class="day-type-selector__label">Today's Tier:</span>
            <div class="day-type-selector__options">
              <button
                class="day-type-btn"
                :class="{ 'day-type-btn--active': currentDayType === 'full', 'day-type-btn--full': true }"
                @click="setDayType('full')"
              >
                <Flame class="icon-xs" /> Full
              </button>
              <button
                class="day-type-btn"
                :class="{ 'day-type-btn--active': currentDayType === 'half', 'day-type-btn--half': true }"
                @click="setDayType('half')"
              >
                <Gauge class="icon-xs" /> Half
              </button>
              <button
                class="day-type-btn"
                :class="{ 'day-type-btn--active': currentDayType === 'floor', 'day-type-btn--floor': true }"
                @click="setDayType('floor')"
              >
                <Shield class="icon-xs" /> Floor
              </button>
            </div>
            <span class="day-type-selector__target">Target: {{ adjustedDailyTarget }} pts</span>
            <!-- Auto-suggest based on sleep -->
            <button
              v-if="suggestedDayType && suggestedDayType.type !== currentDayType"
              class="day-type-suggest"
              @click="applySuggestedDayType"
              :title="suggestedDayType.reason"
            >
              <Sparkles class="icon-xs" />
              <span>Suggested: <strong>{{ suggestedDayType.type === 'full' ? 'Full' : suggestedDayType.type === 'half' ? 'Half' : 'Floor' }}</strong></span>
              <small>{{ suggestedDayType.reason }}</small>
            </button>
          </div>

          <!-- Phase Tracker -->
          <div class="phase-tracker" v-if="programStartDate">
            <div class="phase-tracker__info">
              <span class="phase-tracker__week">Week {{ currentProgramWeek }}/26</span>
              <span class="phase-tracker__name" v-if="currentPhase">{{ currentPhase.name }}</span>
            </div>
            <div class="phase-tracker__bar">
              <div class="phase-tracker__fill" :style="{ width: phaseProgressPercent + '%' }"></div>
            </div>
          </div>
          <div class="phase-tracker phase-tracker--setup" v-else>
            <button class="btn btn--primary-action btn--sm" @click="startProgram">
              <Play class="icon-xs" /> Start 26-Week Program
            </button>
          </div>

          <!-- Tier Stats -->
          <div class="tier-stats">
            <span class="tier-stats__avg">Avg Tier: <strong>{{ avgTierLevel }}</strong></span>
            <div class="tier-stats__dist">
              <span class="tier-dot tier--floor" :title="tierDistribution[1] + ' habits at Floor'">T1: {{ tierDistribution[1] }}</span>
              <span class="tier-dot tier--foundation" :title="tierDistribution[2] + ' habits at Foundation'">T2: {{ tierDistribution[2] }}</span>
              <span class="tier-dot tier--standard" :title="tierDistribution[3] + ' habits at Standard'">T3: {{ tierDistribution[3] }}</span>
              <span class="tier-dot tier--mastery" :title="tierDistribution[4] + ' habits at Mastery'">T4: {{ tierDistribution[4] }}</span>
            </div>
          </div>
        </div>

        <!-- ── Progressive Settings Panel ── -->
        <div v-if="progressivePanelOpen" class="progressive-settings">
          <div class="progressive-settings__section">
            <h3 class="progressive-settings__heading">Program Start Date</h3>
            <div class="progressive-settings__field">
              <input
                type="date"
                :value="progressiveSettings.startDate"
                @change="progressiveSettings.startDate = $event.target.value; persistLocalState()"
                class="progressive-settings__input"
              >
              <span v-if="programStartDate" class="progressive-settings__helper">
                Week {{ currentProgramWeek }} of 26
              </span>
            </div>
          </div>

          <div class="progressive-settings__section">
            <h3 class="progressive-settings__heading">Tier Labels</h3>
            <div class="progressive-settings__tier-labels">
              <div v-for="(label, idx) in progressiveSettings.tierLabels" :key="'tl-' + idx" class="progressive-settings__tier-label-row">
                <span class="progressive-settings__tier-num" :class="tierColorClass(idx + 1)">T{{ idx + 1 }}</span>
                <input
                  type="text"
                  :value="label"
                  @input="progressiveSettings.tierLabels[idx] = $event.target.value"
                  @change="persistLocalState()"
                  maxlength="20"
                  class="progressive-settings__input progressive-settings__input--sm"
                >
              </div>
            </div>
          </div>

          <div class="progressive-settings__section">
            <h3 class="progressive-settings__heading">Point Multipliers</h3>
            <div class="progressive-settings__multipliers">
              <label class="progressive-settings__mult-row">
                <span>Full Day</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2"
                  :value="progressiveSettings.pointMultipliers.full"
                  @change="progressiveSettings.pointMultipliers.full = Number($event.target.value) || 1.0; persistLocalState()"
                  class="progressive-settings__input progressive-settings__input--xs"
                >
              </label>
              <label class="progressive-settings__mult-row">
                <span>Half Day</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2"
                  :value="progressiveSettings.pointMultipliers.half"
                  @change="progressiveSettings.pointMultipliers.half = Number($event.target.value) || 0.6; persistLocalState()"
                  class="progressive-settings__input progressive-settings__input--xs"
                >
              </label>
              <label class="progressive-settings__mult-row">
                <span>Floor Day</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2"
                  :value="progressiveSettings.pointMultipliers.floor"
                  @change="progressiveSettings.pointMultipliers.floor = Number($event.target.value) || 0.3; persistLocalState()"
                  class="progressive-settings__input progressive-settings__input--xs"
                >
              </label>
            </div>
          </div>

          <div class="progressive-settings__section">
            <h3 class="progressive-settings__heading">Phases</h3>
            <div class="progressive-settings__phases">
              <div v-for="(phase, idx) in progressiveSettings.phases" :key="'ph-' + idx" class="progressive-settings__phase-row">
                <input
                  type="text"
                  v-model="phase.name"
                  @change="persistLocalState()"
                  maxlength="40"
                  class="progressive-settings__input"
                  placeholder="Phase name"
                >
                <label class="progressive-settings__week-range">
                  W<input
                    type="number"
                    min="1"
                    max="52"
                    v-model.number="phase.weeks[0]"
                    @change="persistLocalState()"
                    class="progressive-settings__input progressive-settings__input--xs"
                  >–<input
                    type="number"
                    min="1"
                    max="52"
                    v-model.number="phase.weeks[1]"
                    @change="persistLocalState()"
                    class="progressive-settings__input progressive-settings__input--xs"
                  >
                </label>
                <button class="habits-editor__delete" @click="progressiveSettings.phases.splice(idx, 1); persistLocalState()" v-if="progressiveSettings.phases.length > 1">
                  <Trash2 class="icon-sm" />
                </button>
              </div>
              <button class="btn btn--secondary btn--sm" @click="progressiveSettings.phases.push({ id: 'custom-' + Date.now(), name: '', weeks: [1, 6], description: '' }); persistLocalState()">
                <Plus class="icon-xs" /> Add Phase
              </button>
            </div>
          </div>

          <div class="progressive-settings__section">
            <h3 class="progressive-settings__heading">Habit Tiers — Graduation Control</h3>
            <p class="progressive-settings__hint">Set each habit's current tier. Graduate one habit per week (1% rule).</p>
            <div class="progressive-settings__habit-tiers">
              <div v-for="habit in localHabits" :key="'ht-' + habit.id" class="progressive-settings__habit-tier-row">
                <span class="progressive-settings__habit-name">{{ habit.name }}</span>
                <div class="progressive-settings__tier-controls">
                  <button
                    class="tier-ctrl-btn"
                    :disabled="getHabitTier(habit.id) <= 1"
                    @click="demoteHabit(habit.id)"
                    title="Demote tier"
                  >
                    <ArrowDown class="icon-xs" />
                  </button>
                  <span class="tier-badge" :class="tierColorClass(getHabitTier(habit.id))">
                    T{{ getHabitTier(habit.id) }}
                    <small>{{ progressiveSettings.tierLabels[getHabitTier(habit.id) - 1] }}</small>
                  </span>
                  <button
                    class="tier-ctrl-btn"
                    :disabled="getHabitTier(habit.id) >= 4"
                    @click="graduateHabit(habit.id)"
                    title="Graduate tier"
                  >
                    <ArrowUp class="icon-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── GRADUATION SUGGESTIONS ── -->
      <div v-if="graduationSuggestions.length > 0" class="graduation-banner">
        <div class="graduation-banner__header">
          <Award class="icon-md graduation-banner__icon" />
          <span class="graduation-banner__title">Ready to Level Up</span>
          <span class="graduation-banner__count">{{ graduationSuggestions.length }} habit{{ graduationSuggestions.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="graduation-banner__list">
          <div v-for="sug in graduationSuggestions" :key="'grad-' + sug.habitId" class="graduation-card">
            <div class="graduation-card__info">
              <span class="graduation-card__name">{{ sug.habitName }}</span>
              <span class="graduation-card__streak">
                <Flame class="icon-xs" /> {{ sug.streak }}-day streak at T{{ sug.currentTier }}
              </span>
              <span class="graduation-card__next">
                Next: <strong>T{{ sug.nextTier }} {{ sug.nextLabel }}</strong> — {{ sug.nextDescription }}
              </span>
            </div>
            <button class="btn btn--primary-action btn--sm graduation-card__btn" @click="dismissGraduationSuggestion(sug.habitId)">
              <ChevronUp class="icon-xs" /> Graduate
            </button>
          </div>
        </div>
      </div>

      <!-- ── SECTION: HABIT CHECKLIST ── -->
      <section class="card" id="habits">
        <div class="section-head">
          <div class="section-title-wrap">
            <h2 class="section-title">
              <span class="section-title__icon">
                <CheckSquare class="icon-md" />
              </span>
              <span>Habit Checklist</span>
            </h2>
            <small>Core Leading Indicators — day-based completion matrix</small>
          </div>
          <button v-if="!habitsEditing" class="btn btn--secondary" @click="startEditingHabits" title="Customize Habits">
            <Edit3 class="icon-sm" />
            <span>Edit Habits</span>
          </button>
        </div>

        <!-- ── Habits Editor Panel ──────────────────────────────────── -->
        <div v-if="habitsEditing" class="habits-editor">
          <p class="habits-editor__hint">
            Edit habit names and assign point values. Use arrow buttons to reorder by priority.
            Changes are saved securely to your account.
          </p>

          <div class="habits-editor__list">
            <div
              v-for="(habit, index) in habitsDraft"
              :key="habit.id"
              class="habits-editor__row"
              :class="{ 'habits-editor__row--archived': habit.archived }"
              @touchstart.passive="onHabitSwipeStart(index, $event)"
              @touchend.passive="onHabitSwipeEnd(index, $event)"
            >
              <span class="habits-editor__num">{{ index + 1 }}</span>
              <div class="habits-editor__move" aria-label="Reorder habit">
                <button
                  class="habits-editor__move-btn"
                  :disabled="index === 0"
                  @click="moveDraftHabit(index, index - 1)"
                  title="Move up"
                  type="button"
                >
                  <ArrowUp class="icon-xs" />
                </button>
                <button
                  class="habits-editor__move-btn"
                  :disabled="index === habitsDraft.length - 1"
                  @click="moveDraftHabit(index, index + 1)"
                  title="Move down"
                  type="button"
                >
                  <ArrowDown class="icon-xs" />
                </button>
              </div>
              <input
                v-model="habit.name"
                type="text"
                maxlength="80"
                placeholder="Habit name…"
                class="habits-editor__name"
                :class="{ 'habits-editor__name--error': !habit.name.trim() }"
              >
              <label class="habits-editor__pts-label">
                <span>pts</span>
                <input
                  v-model.number="habit.points"
                  type="number"
                  min="1"
                  max="100"
                  class="habits-editor__pts"
                >
              </label>
              <span class="habits-editor__tier-badge" :class="tierColorClass(getHabitTier(habit.id))" :title="'Current tier: T' + getHabitTier(habit.id)">
                T{{ getHabitTier(habit.id) }}
              </span>
              <button
                class="habits-editor__archive"
                :class="{ 'habits-editor__archive--active': habit.archived }"
                @click="toggleDraftArchive(index)"
                :title="habit.archived ? 'Restore from archive' : 'Archive (hide from daily list, keep history)'"
                type="button"
              >
                <RotateCcw v-if="habit.archived" class="icon-sm" />
                <Archive v-else class="icon-sm" />
              </button>
              <button class="habits-editor__delete" @click="removeDraftHabit(index)" title="Permanently remove habit">
                <Trash2 class="icon-sm" />
              </button>
            </div>
          </div>

          <button class="btn btn--secondary habits-editor__add" @click="addDraftHabit">
            <Plus class="icon-sm" />
            <span>Add Habit</span>
          </button>

          <!-- Restore Default Habits (if some were removed) -->
          <div v-if="missingDefaultHabits.length > 0" class="habits-editor__restore-defaults">
            <div class="habits-editor__restore-title">
              <RotateCcw class="icon-xs" />
              <span>
                Restore from your default
                <template v-if="isJyoti">Jyoti</template>
                <template v-else-if="isAshish && travelMode">Travel</template>
                <template v-else-if="isAshish">Ashish</template>
                <template v-else>Starter</template>
                preset ({{ missingDefaultHabits.length }} missing):
              </span>
            </div>
            <div class="habits-editor__restore-chips">
              <button
                v-for="dh in missingDefaultHabits.slice(0, 12)"
                :key="'restore-' + dh.id"
                class="habits-editor__restore-chip"
                @click="addDefaultHabitBack(dh); habitsDraft.push({ id: dh.id, name: dh.name, points: dh.points, hint: dh.hint || '', completedDays: [], completedToday: false, archived: false })"
                type="button"
                :title="`+${dh.points} pt · ${dh.name}`"
              >
                <Plus class="icon-xs" />
                <span>{{ dh.name.length > 26 ? dh.name.slice(0, 26) + '…' : dh.name }}</span>
              </button>
              <span v-if="missingDefaultHabits.length > 12" class="habits-editor__restore-more">
                +{{ missingDefaultHabits.length - 12 }} more…
              </span>
            </div>
          </div>

          <div class="habits-editor__actions">
            <button
              class="btn btn--primary-action"
              :disabled="draftHasErrors || habitSaveStatus === 'saving'"
              @click="saveEditedHabits"
            >
              <span v-if="habitSaveStatus === 'saving'">Saving…</span>
              <span v-else-if="habitSaveStatus === 'saved'" class="btn-inner-saved">
                <Check class="icon-sm" /> Saved
              </span>
              <span v-else>Save Habits</span>
            </button>
            <button class="btn btn--ghost" @click="cancelEditingHabits">Cancel</button>
            <span v-if="draftHasErrors && habitsDraft.length > 0" class="habits-editor__warn">
              All habits need a name before saving.
            </span>
          </div>
        </div>

        <!-- ── Normal Grid View ──────────────────────────────────────── -->
        <template v-else>
          <div v-if="localHabits.length === 0" class="empty-state">
            No habits found yet. Refresh once seeding is complete.
          </div>

          <template v-else>
            <!-- ── View toggle (visible on mobile) ── -->
            <div class="mobile-view-toggle">
              <button
                class="mobile-view-toggle__btn"
                :class="{ 'mobile-view-toggle__btn--active': mobileViewMode === 'daily' }"
                @click="mobileViewMode = 'daily'"
              >
                <CheckSquare class="icon-xs" />
                <span>Today's Checklist</span>
              </button>
              <button
                class="mobile-view-toggle__btn"
                :class="{ 'mobile-view-toggle__btn--active': mobileViewMode === 'grid' }"
                @click="mobileViewMode = 'grid'"
              >
                <Layers class="icon-xs" />
                <span>Month Grid</span>
              </button>
            </div>

            <!-- ── Mobile Daily Checklist ── -->
            <div class="mobile-daily" :class="{ 'mobile-daily--hidden': mobileViewMode !== 'daily' }">
              <!-- Day Navigator -->
              <div class="mobile-daily__nav">
                <button
                  class="mobile-daily__nav-btn"
                  :disabled="mobileDay <= 1"
                  @click="mobilePrevDay"
                  aria-label="Previous Day"
                >
                  <ChevronLeft class="icon-md" />
                </button>
                <div class="mobile-daily__nav-center">
                  <button v-if="!mobileDayIsToday" class="mobile-daily__today-link" @click="mobileGoToday">
                    Jump to today
                  </button>
                  <span class="mobile-daily__nav-label" :class="{ 'mobile-daily__nav-label--today': mobileDayIsToday }">
                    {{ mobileDayLabel }}
                    <span v-if="mobileDayIsToday" class="mobile-daily__today-badge">TODAY</span>
                  </span>
                </div>
                <button
                  class="mobile-daily__nav-btn"
                  :disabled="mobileDay >= props.monthDays || mobileDayIsFuture"
                  @click="mobileNextDay"
                  aria-label="Next Day"
                >
                  <ChevronRight class="icon-md" />
                </button>
              </div>

              <!-- Time-Slot Filter Pills (sticky) -->
              <div class="time-filter-bar">
                <button
                  class="time-filter-pill"
                  :class="{ 'time-filter-pill--active': activeTimeFilter === 'all' }"
                  @click="activeTimeFilter = 'all'"
                >
                  <span class="time-filter-pill__label">All</span>
                  <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.all }}/{{ timeSlotCounts.all }}</span>
                </button>
                <button
                  v-if="timeSlotCounts.morning > 0"
                  class="time-filter-pill"
                  :class="{
                    'time-filter-pill--active': activeTimeFilter === 'morning',
                    'time-filter-pill--current': getCurrentTimeBlock() === 'morning' && activeTimeFilter === 'all'
                  }"
                  @click="activeTimeFilter = activeTimeFilter === 'morning' ? 'all' : 'morning'"
                >
                  <span class="time-filter-pill__label">Morning</span>
                  <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.morning }}/{{ timeSlotCounts.morning }}</span>
                </button>
                <button
                  v-if="timeSlotCounts.work > 0"
                  class="time-filter-pill"
                  :class="{
                    'time-filter-pill--active': activeTimeFilter === 'work',
                    'time-filter-pill--current': getCurrentTimeBlock() === 'work' && activeTimeFilter === 'all'
                  }"
                  @click="activeTimeFilter = activeTimeFilter === 'work' ? 'all' : 'work'"
                >
                  <span class="time-filter-pill__label">Work</span>
                  <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.work }}/{{ timeSlotCounts.work }}</span>
                </button>
                <button
                  v-if="timeSlotCounts.evening > 0"
                  class="time-filter-pill"
                  :class="{
                    'time-filter-pill--active': activeTimeFilter === 'evening',
                    'time-filter-pill--current': getCurrentTimeBlock() === 'evening' && activeTimeFilter === 'all'
                  }"
                  @click="activeTimeFilter = activeTimeFilter === 'evening' ? 'all' : 'evening'"
                >
                  <span class="time-filter-pill__label">Evening</span>
                  <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.evening }}/{{ timeSlotCounts.evening }}</span>
                </button>
                <button
                  v-if="timeSlotCounts.anytime > 0"
                  class="time-filter-pill"
                  :class="{ 'time-filter-pill--active': activeTimeFilter === 'anytime' }"
                  @click="activeTimeFilter = activeTimeFilter === 'anytime' ? 'all' : 'anytime'"
                >
                  <span class="time-filter-pill__label">Health</span>
                  <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.anytime }}/{{ timeSlotCounts.anytime }}</span>
                </button>
                <button
                  v-if="timeSlotCounts.weekly > 0"
                  class="time-filter-pill"
                  :class="{ 'time-filter-pill--active': activeTimeFilter === 'weekly' }"
                  @click="activeTimeFilter = activeTimeFilter === 'weekly' ? 'all' : 'weekly'"
                >
                  <span class="time-filter-pill__label">Weekly</span>
                  <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.weekly }}/{{ timeSlotCounts.weekly }}</span>
                </button>
              </div>

              <!-- Travel Mode Toggle (Ashish only) -->
              <div v-if="isAshish" class="travel-mode-bar">
                <button class="travel-mode-toggle" :class="{ 'travel-mode-toggle--active': travelMode }" @click="toggleTravelMode">
                  <Plane v-if="travelMode" class="icon-sm" />
                  <MapPin v-else class="icon-sm" />
                  <span>{{ travelMode ? 'Travel Mode (Chandigarh)' : 'Home Mode' }}</span>
                  <ToggleRight v-if="travelMode" class="icon-md travel-toggle-icon" />
                  <ToggleLeft v-else class="icon-md travel-toggle-icon" />
                </button>
              </div>

              <!-- Progress Summary -->
              <div class="mobile-daily__progress">
                <div class="mobile-daily__progress-bar">
                  <div
                    class="mobile-daily__progress-fill"
                    :style="{ width: totalHabits > 0 ? (mobileDayCompleted / totalHabits * 100) + '%' : '0%' }"
                  ></div>
                </div>
                <div class="mobile-daily__progress-stats">
                  <span><strong>{{ mobileDayCompleted }}</strong>/{{ totalHabits }} habits completed</span>
                  <span><strong>{{ mobileDayPoints }}</strong>/{{ maxDailyPoints }} pts earned</span>
                </div>
              </div>

              <!-- Timeline-Grouped Habit Cards -->
              <div class="mobile-daily__list">
                <!-- Empty state — when user has no visible habits at all -->
                <div v-if="visibleHabits.length === 0" class="checklist-empty">
                  <div class="checklist-empty__icon"><Sparkles class="icon-md" /></div>
                  <h3 class="checklist-empty__title">Your checklist is empty</h3>
                  <p class="checklist-empty__body">
                    Add habits that fit your life — even 3–5 to start is enough.
                    You can archive or remove any of them anytime.
                  </p>
                  <div class="checklist-empty__actions">
                    <button class="btn btn--primary-action" @click="startEditingHabits">
                      <Plus class="icon-sm" /> <span>Add Your First Habits</span>
                    </button>
                    <button v-if="missingDefaultHabits.length > 0" class="btn btn--secondary" @click="restoreAllDefaults">
                      <RotateCcw class="icon-sm" /> <span>Load Starter Preset ({{ missingDefaultHabits.length }})</span>
                    </button>
                  </div>
                </div>
                <template v-for="group in timelineGroupedHabits" :key="'tg-' + group.slot">
                  <!-- Time Slot Header -->
                  <div class="timeline-slot-header" :class="'timeline-slot-header--' + group.slot">
                    <span class="timeline-slot-emoji">{{ group.meta.emoji }}</span>
                    <span class="timeline-slot-label">{{ group.meta.label }}</span>
                    <span class="timeline-slot-time">{{ group.meta.time }}</span>
                    <span
                      class="timeline-slot-count"
                      :class="{ 'timeline-slot-complete-badge': group.habits.filter(h => hasCompletedDay(h, mobileDay)).length === group.habits.length && group.habits.length > 0 }"
                    >
                      {{ group.habits.filter(h => hasCompletedDay(h, mobileDay)).length }}/{{ group.habits.length }}
                      <span v-if="group.habits.filter(h => hasCompletedDay(h, mobileDay)).length === group.habits.length && group.habits.length > 0">✓</span>
                    </span>
                  </div>
                  <!-- Habit Cards in this slot -->
                  <template v-for="habit in group.habits" :key="'m-' + habit.id">
                    <button
                      class="mobile-daily__card"
                      :class="{
                        'mobile-daily__card--done': hasCompletedDay(habit, mobileDay),
                        'mobile-daily__card--shared': habit.name.startsWith('★'),
                        'mobile-daily__card--up-next': mobileDayIsToday && isHabitUpNext(habit) && !hasCompletedDay(habit, mobileDay),
                        [`mobile-daily__card--cat-${getHabitCategory(habit)}`]: true
                      }"
                      :disabled="mobileDayIsFuture || !!pendingCells[keyFor(habit.id, mobileDay)]"
                      @click="toggleHabitForDay(habit, mobileDay)"
                    >
                      <span v-if="mobileDayIsToday && isHabitUpNext(habit) && !hasCompletedDay(habit, mobileDay)" class="mobile-daily__up-next-badge" :class="{ 'mobile-daily__up-next-badge--due': upNextHabitInfo?.status === 'due' }">
                        <Clock class="icon-xs" /> {{ upNextHabitInfo?.badgeText || 'UP NEXT' }}
                      </span>
                      <div class="mobile-daily__card-check">
                        <span v-if="pendingCells[keyFor(habit.id, mobileDay)]" class="mobile-daily__spinner">…</span>
                        <span v-else-if="hasCompletedDay(habit, mobileDay)" class="mobile-daily__checkmark">
                          <Check class="icon-check-mobile" />
                        </span>
                        <span v-else class="mobile-daily__circle"></span>
                      </div>
                      <div class="mobile-daily__card-body">
                        <span class="mobile-daily__card-name">{{ habit.name }}</span>
                        <span class="mobile-daily__card-meta">
                          <span class="mobile-daily__card-category">{{ group.meta.label }}</span>
                          <span class="tier-badge tier-badge--inline" :class="tierColorClass(getHabitTier(habit.id))" @click.stop="toggleTierDetail(habit.id)">
                            T{{ getHabitTier(habit.id) }}
                          </span>
                        </span>
                        <!-- Tier Detail Expand -->
                        <div v-if="tierDetailHabitId === habit.id" class="tier-detail-expand" @click.stop>
                          <div v-for="t in 4" :key="'td-' + t" class="tier-detail-row" :class="{ 'tier-detail-row--current': getHabitTier(habit.id) === t }">
                            <span class="tier-detail-label" :class="tierColorClass(t)">T{{ t }}</span>
                            <span class="tier-detail-desc">{{ getTierDescriptions(habit.id)[t - 1] }}</span>
                            <button v-if="getHabitTier(habit.id) !== t" class="tier-detail-set" @click.stop="setHabitTier(habit.id, t)">Set</button>
                            <Check v-else class="icon-xs tier-detail-active" />
                          </div>
                        </div>
                      </div>
                      <span class="mobile-daily__card-pts">
                        +{{ habit.points }}<small>pt{{ habit.points !== 1 ? 's' : '' }}</small>
                      </span>
                      <!-- Habit Note Toggle -->
                      <button class="habit-note-btn" @click.stop="toggleHabitNote(habit.id, mobileDay)"
                        :class="{ 'habit-note-btn--has': getHabitNote(habit.id, mobileDay) }"
                        title="Add note">
                        <MessageSquare class="icon-xs" />
                      </button>
                    </button>
                    <!-- Habit Note Input & Clear Guidance -->
                    <div v-if="habitNotesOpen === habit.id + ':' + mobileDay" class="habit-note-input" @click.stop>
                      <div v-if="habit.hint" class="habit-note-guidance">
                        <div class="habit-note-guidance__header">
                          <Sparkles class="icon-xs" />
                          <span class="habit-note-guidance__title">Instructions & Guidance</span>
                        </div>
                        <p class="habit-note-guidance__text">{{ habit.hint }}</p>
                      </div>
                      <textarea
                        :value="getHabitNote(habit.id, mobileDay)"
                        @input="setHabitNote(habit.id, mobileDay, $event.target.value)"
                        rows="2"
                        :placeholder="'Quick note / log about ' + habit.name + ' today...'"
                      ></textarea>
                    </div>
                  </template>
                </template>
              </div>
            </div>

            <!-- ── Desktop Month Grid ── -->
            <div class="habit-grid-wrap" :class="{ 'habit-grid-wrap--mobile-hidden': mobileViewMode === 'daily' }">
              <table class="habit-grid">
                <thead>
                  <tr>
                    <th class="habit-grid__sticky">Core Habit (Leading Indicator)</th>
                    <th class="habit-grid__pts">Pts</th>
                    <th
                      v-for="day in days"
                      :key="`head-${day}`"
                      class="habit-grid__day"
                      :class="[
                        props.isCurrentMonth && day === props.currentDay ? 'habit-grid__day--current' : '',
                        isWeekendDay(day) ? 'habit-grid__day--weekend' : '',
                      ]"
                    >
                      {{ day }}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="habit in visibleHabits" :key="habit.id" class="habit-grid__row" :class="{ 'habit-grid__row--up-next': props.isCurrentMonth && isHabitUpNext(habit) }">
                    <td class="habit-grid__sticky habit-grid__name" :class="{ 'habit-grid__name--shared': habit.name.startsWith('★'), 'habit-grid__name--up-next': props.isCurrentMonth && isHabitUpNext(habit) }">
                      <span class="habit-grid__name-text" :title="habit.hint ? (habit.name + '\n\n💡 Instructions:\n' + habit.hint) : habit.name">{{ habit.name }}</span>
                      <span v-if="props.isCurrentMonth && isHabitUpNext(habit)" class="habit-grid__up-next-pill" :class="{ 'habit-grid__up-next-pill--due': upNextHabitInfo?.status === 'due' }" :title="'Scheduled: ' + (upNextHabitInfo?.timeLabel || '')">
                        <Clock class="icon-xs" /> {{ upNextHabitInfo?.badgeText || 'UP NEXT' }}
                      </span>
                      <span class="tier-badge tier-badge--grid" :class="tierColorClass(getHabitTier(habit.id))" :title="getTierDescriptions(habit.id)[getHabitTier(habit.id) - 1]">
                        T{{ getHabitTier(habit.id) }}
                      </span>
                    </td>
                    <td class="habit-grid__pts">{{ habit.points }}</td>

                    <td
                      v-for="day in days"
                      :key="`${habit.id}-${day}`"
                      class="habit-grid__cell"
                      :class="[
                        isWeekendDay(day) ? 'habit-grid__cell--weekend' : '',
                        props.isCurrentMonth && day === props.currentDay ? 'habit-grid__cell--today' : '',
                      ]"
                    >
                      <button
                        class="habit-grid__check"
                        :class="hasCompletedDay(habit, day) ? 'habit-grid__check--done' : ''"
                        :disabled="isFutureMonth || !!pendingCells[keyFor(habit.id, day)]"
                        @click="toggleHabitForDay(habit, day)"
                        :title="`Day ${day}: ${habit.name}`"
                      >
                        <Check v-if="hasCompletedDay(habit, day)" class="icon-grid-check" />
                        <span v-else-if="pendingCells[keyFor(habit.id, day)]">…</span>
                        <span v-else-if="isFutureMonth">–</span>
                      </button>
                    </td>
                  </tr>

                  <tr class="habit-grid__totals">
                    <td class="habit-grid__sticky">DAILY TOTAL POINTS</td>
                    <td class="habit-grid__pts">—</td>
                    <td
                      v-for="day in days"
                      :key="`tot-${day}`"
                      class="habit-grid__cell"
                      :class="[
                        isWeekendDay(day) ? 'habit-grid__cell--weekend' : '',
                        props.isCurrentMonth && day === props.currentDay ? 'habit-grid__cell--today' : '',
                        getDayTotal(day) >= Math.max(25, Math.ceil(maxDailyPoints * 0.6)) ? 'habit-grid__tot--target-met' : ''
                      ]"
                    >
                      {{ getDayTotal(day) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </template>
      </section>

      <!-- ── SECTION: COMPACT REWARD BAR + LEDGER ── -->
      <section class="card card--compact-rewards" id="rewards">
        <!-- ── Compact Reward Bar ── -->
        <div class="reward-bar">
          <div class="reward-bar__wallet">
            <Gift class="icon-sm" />
            <span class="reward-bar__label">Reward Wallet</span>
            <strong class="reward-bar__balance mono-num">{{ availableWallet }} <small>pts</small></strong>
          </div>
          <div class="reward-bar__actions">
            <button
              class="btn btn--compact-redeem"
              :class="{ 'btn--compact-redeem--open': rewardsExpanded }"
              @click="rewardsExpanded = !rewardsExpanded"
            >
              <span>{{ rewardsExpanded ? 'Close' : 'Redeem' }}</span>
              <ChevronDown v-if="!rewardsExpanded" class="icon-xs" />
              <ChevronUp v-else class="icon-xs" />
            </button>
            <button class="btn btn--icon-only" @click="rewardsExpanded = true; startEditingRewards()" title="Edit Rewards">
              <Edit3 class="icon-xs" />
            </button>
          </div>
        </div>

        <!-- ── Expandable Reward List (compact) ── -->
        <div v-show="rewardsExpanded" class="reward-bar__body">
          <div v-if="rewardsEditing" class="rewards-editor">
            <p class="habits-editor__hint">Edit reward type, title and redeem points. Save to apply for this month.</p>

            <div class="rewards-editor__list">
              <div v-for="(reward, index) in rewardsDraft" :key="`reward-draft-${index}`" class="rewards-editor__row">
                <input v-model="reward.type" type="text" maxlength="24" placeholder="Type (Daily/Weekly...)" class="rewards-editor__type">
                <input v-model="reward.item" type="text" maxlength="100" placeholder="Reward name" class="rewards-editor__item">
                <label class="rewards-editor__cost-label">
                  <span>Pts</span>
                  <input v-model.number="reward.cost" type="number" min="1" max="10000" class="rewards-editor__cost">
                </label>
                <button class="habits-editor__delete" @click="removeDraftReward(index)">
                  <Trash2 class="icon-sm" />
                </button>
              </div>
            </div>

            <button class="btn btn--secondary rewards-editor__add" @click="addDraftReward">
              <Plus class="icon-sm" />
              <span>Add Reward</span>
            </button>

            <div class="habits-editor__actions">
              <button class="btn btn--primary-action" :disabled="rewardDraftHasErrors || rewardSaveStatus === 'saving'" @click="saveEditedRewards">
                <span v-if="rewardSaveStatus === 'saving'">Saving…</span>
                <span v-else-if="rewardSaveStatus === 'saved'" class="btn-inner-saved">
                  <Check class="icon-sm" /> Saved
                </span>
                <span v-else>Save Rewards</span>
              </button>
              <button class="btn btn--ghost" @click="cancelEditingRewards">Cancel</button>
            </div>
          </div>

          <div v-else class="reward-compact-list">
            <div
              v-for="reward in rewards"
              :key="`${reward.type}-${reward.item}`"
              class="reward-compact-row"
            >
              <span class="reward-compact-row__tag">{{ reward.type }}</span>
              <span class="reward-compact-row__name">{{ reward.item }}</span>
              <button
                class="reward-compact-row__btn"
                :disabled="availableWallet < reward.cost"
                @click="claimReward(reward)"
              >
                <span class="mono-num">{{ reward.cost }}</span> pts
              </button>
            </div>
          </div>
        </div>

        <!-- ── Point Ledger (compact) ── -->
        <div class="ledger-bar">
          <div class="ledger-bar__head" @click="ledgerExpanded = !ledgerExpanded">
            <div class="ledger-bar__title">
              <FileText class="icon-sm" />
              <span>Point Ledger</span>
              <small class="ledger-bar__purpose">Transaction log of redeemed rewards</small>
            </div>
            <div class="ledger-bar__meta">
              <span class="ledger-bar__count mono-num">{{ rewardLedger.length }} txns</span>
              <ChevronDown v-if="!ledgerExpanded" class="icon-xs collapse-chevron" />
              <ChevronUp v-else class="icon-xs collapse-chevron" />
            </div>
          </div>

          <div v-show="ledgerExpanded" class="ledger-bar__body">
            <!-- Edit Mode -->
            <div v-if="ledgerEditing" class="ledger-editor">
              <div class="ledger-editor__actions">
                <button class="btn btn--secondary" @click="addDraftLedgerEntry">
                  <Plus class="icon-sm" />
                  <span>Add Entry</span>
                </button>
              </div>

              <div class="ledger-wrap">
                <table class="ledger-table">
                  <thead>
                    <tr>
                      <th>Reward Item</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Redeem Cost</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(entry, index) in ledgerDraft" :key="`ledger-draft-${entry.timestamp}-${index}`">
                      <td><input v-model="entry.item" type="text" maxlength="80" class="ledger-editor__input"></td>
                      <td><input v-model="entry.description" type="text" maxlength="120" class="ledger-editor__input"></td>
                      <td><input v-model="entry.date" type="text" maxlength="40" class="ledger-editor__input"></td>
                      <td><input v-model.number="entry.cost" type="number" min="0" max="10000" class="ledger-editor__cost"></td>
                      <td>
                        <button class="habits-editor__delete" @click="removeDraftLedgerEntry(index)">
                          <Trash2 class="icon-sm" />
                        </button>
                      </td>
                    </tr>
                    <tr v-if="ledgerDraft.length === 0">
                      <td colspan="5" class="ledger-table__empty">No redemptions yet. Redeem from Reward Shop above.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="habits-editor__actions">
                <button class="btn btn--primary-action" :disabled="ledgerDraftHasErrors || ledgerSaveStatus === 'saving'" @click="saveEditedLedger">
                  <span v-if="ledgerSaveStatus === 'saving'">Saving…</span>
                  <span v-else-if="ledgerSaveStatus === 'saved'" class="btn-inner-saved">
                    <Check class="icon-sm" /> Saved
                  </span>
                  <span v-else>Save Ledger</span>
                </button>
                <button class="btn btn--ghost" @click="cancelEditingLedger">Cancel</button>
              </div>
            </div>

            <!-- Read Mode — compact transaction list -->
            <div v-else class="ledger-compact-list">
              <div v-if="rewardLedger.length === 0" class="ledger-compact-empty">
                No redemptions yet. Build your point bank first.
              </div>
              <div
                v-for="entry in rewardLedger"
                :key="entry.timestamp"
                class="ledger-compact-row"
              >
                <div class="ledger-compact-row__left">
                  <strong>{{ entry.item }}</strong>
                  <small v-if="entry.description">{{ entry.description }}</small>
                </div>
                <div class="ledger-compact-row__right">
                  <span class="ledger-compact-row__cost mono-num">-{{ entry.cost }} pts</span>
                  <span class="ledger-compact-row__date">{{ entry.date }}</span>
                </div>
              </div>
            </div>

            <div class="ledger-bar__footer">
              <button class="btn btn--icon-only" @click.stop="ledgerExpanded = true; startEditingLedger()" title="Edit Ledger">
                <Edit3 class="icon-xs" />
              </button>
              <button class="btn btn--ghost btn--clear-all" @click="clearLocalProgress">
                <Trash2 class="icon-xs" />
                <span>Clear All Progress</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SECTION: WEEKLY REVIEW (Compact) ── -->
      <section class="card card--weekly-review" id="weekly-review">
        <div class="section-head section-head--collapsible" @click="weeklyReviewExpanded = !weeklyReviewExpanded">
          <div class="review-header-bar">
            <h2 class="section-title">
              <span class="section-title__icon">
                <Compass class="icon-md" />
              </span>
              <span>Sunday Review</span>
              <ChevronDown v-if="!weeklyReviewExpanded" class="icon-sm collapse-chevron" />
              <ChevronUp v-else class="icon-sm collapse-chevron" />
            </h2>
            <!-- Inline auto-metrics summary when collapsed -->
            <div v-if="!weeklyReviewExpanded" class="review-inline-metrics">
              <span class="review-inline-stat mono-num">W: {{ weeklySnapshotLabel }}</span>
              <span class="review-inline-stat mono-num">M: {{ monthlySnapshotLabel }}</span>
            </div>
          </div>
          <button class="btn btn--secondary" @click.stop="weeklyReviewExpanded = true; fillWeeklyReviewMetrics()">
            <Sparkles class="icon-sm" />
            <span>Auto Fill</span>
          </button>
        </div>

        <div v-show="weeklyReviewExpanded" class="collapsible-body">
          <!-- Compact Metrics Row -->
          <div class="review-metrics-strip">
            <div class="review-metric-cell">
              <span class="review-metric-cell__label">Date</span>
              <input v-model="weeklyReview.reviewDate" type="date" class="review-metric-cell__input" @change="saveWeeklyReview">
            </div>
            <div class="review-metric-cell">
              <span class="review-metric-cell__label">Wk Pts</span>
              <input v-model="weeklyReview.metrics.weeklyPoints" type="text" placeholder="104" class="review-metric-cell__input mono-num" @change="saveWeeklyReview">
            </div>
            <div class="review-metric-cell">
              <span class="review-metric-cell__label">Wk Stick %</span>
              <input v-model="weeklyReview.metrics.weeklyStickiness" type="text" placeholder="71.4" class="review-metric-cell__input mono-num" @change="saveWeeklyReview">
            </div>
            <div class="review-metric-cell">
              <span class="review-metric-cell__label">Mo Pts</span>
              <input v-model="weeklyReview.metrics.monthlyPoints" type="text" placeholder="298" class="review-metric-cell__input mono-num" @change="saveWeeklyReview">
            </div>
            <div class="review-metric-cell">
              <span class="review-metric-cell__label">Mo Stick %</span>
              <input v-model="weeklyReview.metrics.monthlyStickiness" type="text" placeholder="64.5" class="review-metric-cell__input mono-num" @change="saveWeeklyReview">
            </div>
          </div>

          <!-- Checkpoints (compact) -->
          <div class="review-checks-compact">
            <div class="review-checks-compact__head">
              <strong>Checkpoints</strong>
              <span class="review-checks-compact__count mono-num">{{ weeklyReview.checks.filter(c => c.done).length }}/{{ weeklyReview.checks.length }}</span>
            </div>
            <div class="check-list">
              <div v-for="(check, index) in weeklyReview.checks" :key="`check-${index}`" class="check-item">
                <button
                  type="button"
                  class="focus-checkbox"
                  :class="{ 'focus-checkbox--checked': check.done }"
                  @click="check.done = !check.done; saveWeeklyReview()"
                >
                  <Check v-if="check.done" class="icon-check-focus" />
                </button>
                <input v-model="check.text" type="text" maxlength="160" @change="saveWeeklyReview">
                <button @click="removeWeeklyCheck(index)" class="check-delete-btn" title="Remove">
                  <Trash2 class="icon-xs" />
                </button>
              </div>
            </div>
            <div class="check-add-row">
              <input v-model="newWeeklyCheck" type="text" maxlength="160" placeholder="Add checkpoint..." @keydown.enter.prevent="addWeeklyCheck">
              <button class="btn btn--add-check" :disabled="newWeeklyCheck.trim() === ''" @click="addWeeklyCheck">
                <Plus class="icon-sm" />
              </button>
            </div>
          </div>

          <!-- Compact Reflections (2-col) -->
          <div class="reflection-compact">
            <label>
              <span class="reflection-compact__label">Wins</span>
              <textarea v-model="weeklyReview.reflections.wins" rows="1" placeholder="What went well?" @blur="saveWeeklyReview" />
            </label>
            <label>
              <span class="reflection-compact__label">Friction</span>
              <textarea v-model="weeklyReview.reflections.misses" rows="1" placeholder="Where did you slip?" @blur="saveWeeklyReview" />
            </label>
            <label>
              <span class="reflection-compact__label">If-Then Plan</span>
              <textarea v-model="weeklyReview.reflections.triggerPlan" rows="1" placeholder="If [X], then [Y]" @blur="saveWeeklyReview" />
            </label>
            <label>
              <span class="reflection-compact__label">Health Check</span>
              <textarea v-model="weeklyReview.reflections.healthCheck" rows="1" placeholder="Sleep, stress, energy" @blur="saveWeeklyReview" />
            </label>
            <label class="reflection-compact__wide">
              <span class="reflection-compact__label">Next Week Focus</span>
              <textarea v-model="weeklyReview.reflections.nextWeekFocus" rows="1" placeholder="Non-negotiable outcomes..." @blur="saveWeeklyReview" />
            </label>
          </div>
        </div><!-- /collapsible-body weekly-review -->
      </section>
      <!-- Confetti Overlay -->
      <div class="confetti-overlay" v-if="showConfetti">
        <div v-for="i in 40" :key="'confetti-' + i"
          class="confetti-piece"
          :style="{
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 0.5 + 's',
            backgroundColor: ['#C8A456', '#D4B36A', '#8B7355', '#D4A574', '#C9B18C', '#B08D3E'][i % 6],
          }">
        </div>
      </div>
      <!-- ══ QUICK MORNING SETUP MODAL ══ -->
      <div v-if="morningSetupOpen" class="morning-setup-overlay" @click.self="closeMorningSetup">
        <div class="morning-setup-modal" role="dialog" aria-modal="true" aria-labelledby="morning-setup-title">
          <button class="morning-setup__close" @click="closeMorningSetup" aria-label="Close">
            <X class="icon-sm" />
          </button>
          <div class="morning-setup__hero">
            <Coffee class="icon-md morning-setup__hero-icon" />
            <h2 id="morning-setup-title">Good morning, {{ timeGreeting.name }}</h2>
            <p class="morning-setup__sub">Set your intention in 30 seconds. One screen, three questions.</p>
          </div>

          <!-- Step 1: Day Type -->
          <div class="morning-setup__step">
            <div class="morning-setup__step-num">1</div>
            <div class="morning-setup__step-body">
              <div class="morning-setup__step-title">Today's day type</div>
              <div class="morning-setup__day-pills">
                <button class="morning-setup__pill" :class="{ 'morning-setup__pill--active': currentDayType === 'full' }" @click="setDayType('full')">
                  Full <small>1.0×</small>
                </button>
                <button class="morning-setup__pill" :class="{ 'morning-setup__pill--active': currentDayType === 'half' }" @click="setDayType('half')">
                  Half <small>0.6×</small>
                </button>
                <button class="morning-setup__pill" :class="{ 'morning-setup__pill--active': currentDayType === 'floor' }" @click="setDayType('floor')">
                  Floor <small>0.3×</small>
                </button>
              </div>
              <p v-if="suggestedDayType" class="morning-setup__suggest">
                <Sparkles class="icon-xs" />
                Suggested: <strong>{{ suggestedDayType.type }}</strong> — {{ suggestedDayType.reason }}
                <button class="morning-setup__suggest-apply" @click="applySuggestedDayType">Apply</button>
              </p>
            </div>
          </div>

          <!-- Step 2: Morning Habits Quick Tap -->
          <div class="morning-setup__step" v-if="morningHabits.length > 0">
            <div class="morning-setup__step-num">2</div>
            <div class="morning-setup__step-body">
              <div class="morning-setup__step-title">Tap what's already done</div>
              <div class="morning-setup__habits">
                <button v-for="h in morningHabits" :key="'ms-' + h.id"
                  class="morning-setup__habit"
                  :class="{ 'morning-setup__habit--done': hasCompletedDay(h, props.currentDay) }"
                  @click="toggleHabitForDay(h, props.currentDay)">
                  <Check v-if="hasCompletedDay(h, props.currentDay)" class="icon-xs" />
                  <Circle v-else class="icon-xs" />
                  <span>{{ h.name.length > 30 ? h.name.slice(0, 30) + '…' : h.name }}</span>
                  <span class="morning-setup__habit-pts mono-num">+{{ h.points }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Step 3: Top 3 Focus -->
          <div class="morning-setup__step">
            <div class="morning-setup__step-num">3</div>
            <div class="morning-setup__step-body">
              <div class="morning-setup__step-title">Top 3 for today</div>
              <div class="morning-setup__focus-list">
                <input v-for="(_, i) in morningSetupFocus" :key="'msf-' + i"
                  v-model="morningSetupFocus[i]"
                  :placeholder="`Focus ${i + 1}${i === 0 ? ' — the one that would make today feel like a win' : ''}`"
                  class="morning-setup__focus-input"
                  maxlength="80"
                />
              </div>
            </div>
          </div>

          <div class="morning-setup__actions">
            <button class="btn btn--secondary" @click="closeMorningSetup">Skip</button>
            <button class="btn btn--primary-action" @click="saveMorningSetup">
              <Check class="icon-sm" /> <span>Save &amp; Start Day</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ══ FLOATING BUTTON — Re-open Morning Setup ══ -->
      <button v-if="!morningSetupOpen && isCurrentMonth && dailyFocusToday.length > 0"
        class="morning-setup-fab"
        @click="openMorningSetup"
        :title="'Today\'s Focus: ' + dailyFocusToday.join(' · ')">
        <Coffee class="icon-sm" />
        <span class="morning-setup-fab__count">{{ dailyFocusToday.length }}</span>
      </button>
      <button v-else-if="!morningSetupOpen && isCurrentMonth"
        class="morning-setup-fab morning-setup-fab--empty"
        @click="openMorningSetup"
        title="Set today's morning intention">
        <Coffee class="icon-sm" />
      </button>

    </section>
  </AppLayout>
</template>
