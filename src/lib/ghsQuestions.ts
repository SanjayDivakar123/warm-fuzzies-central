export interface GHSQuestion {
  id: number;
  section: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

// Color mapping: A = Yellow (Creativity), B = Green (Relationships), C = Blue (Structure), D = Red (Efficiency)
export const GHS_COLOR_MAP = {
  A: "Yellow",
  B: "Green", 
  C: "Blue",
  D: "Red"
} as const;

export const GHS_QUESTIONS: GHSQuestion[] = [
  // SECTION 1 — School Values & Teaching Philosophy
  { id: 1, section: "School Values & Teaching Philosophy", question: "Which trait best reflects your school's teaching philosophy?", options: { A: "Creativity", B: "Relationships", C: "Planning", D: "Productivity" } },
  { id: 2, section: "School Values & Teaching Philosophy", question: "What makes a lesson \"excellent\" at your school?", options: { A: "Innovation", B: "Engagement", C: "Structure", D: "Efficiency" } },
  { id: 3, section: "School Values & Teaching Philosophy", question: "What do you want teachers to prioritize?", options: { A: "Creative risk-taking", B: "Student connection", C: "Organizational clarity", D: "Action & results" } },
  { id: 4, section: "School Values & Teaching Philosophy", question: "Which area defines your school identity?", options: { A: "Creative instruction", B: "Student-centered culture", C: "Consistent routines", D: "Strong academic pace" } },
  { id: 5, section: "School Values & Teaching Philosophy", question: "What do you want teachers to improve most?", options: { A: "Idea generation", B: "Motivational strategies", C: "Planning systems", D: "Classroom execution" } },
  { id: 6, section: "School Values & Teaching Philosophy", question: "Your school most needs teachers who can:", options: { A: "Design unique lessons", B: "Inspire students", C: "Create structure", D: "Drive momentum" } },
  { id: 7, section: "School Values & Teaching Philosophy", question: "Which quality do you believe defines \"master teaching\"?", options: { A: "Creativity", B: "Emotional intelligence", C: "Planning mastery", D: "Instructional speed" } },
  { id: 8, section: "School Values & Teaching Philosophy", question: "What leads to the biggest student success at your school?", options: { A: "Innovative tasks", B: "Positive teacher relationships", C: "Clear expectations", D: "Pacing and productivity" } },
  { id: 9, section: "School Values & Teaching Philosophy", question: "School culture improves most when teachers:", options: { A: "Think creatively", B: "Connect deeply", C: "Plan consistently", D: "Stay action-oriented" } },
  { id: 10, section: "School Values & Teaching Philosophy", question: "Which area do you want measured in every teacher?", options: { A: "Instructional creativity", B: "Motivational impact", C: "Organizational habits", D: "Execution style" } },
  { id: 11, section: "School Values & Teaching Philosophy", question: "What frustrates you most in weak teaching?", options: { A: "Lack of ideas", B: "Poor relationships", C: "Low structure", D: "Slow execution" } },
  { id: 12, section: "School Values & Teaching Philosophy", question: "What outcome do you care about most?", options: { A: "Innovative results", B: "Student satisfaction", C: "Predictability & order", D: "Completion of academic tasks" } },
  { id: 13, section: "School Values & Teaching Philosophy", question: "Your school's classes run best when teachers:", options: { A: "Build imaginative lessons", B: "Build rapport", C: "Build structure", D: "Build momentum" } },
  { id: 14, section: "School Values & Teaching Philosophy", question: "You want a teacher assessment that feels:", options: { A: "Creative & open-ended", B: "Warm & relational", C: "Structured & analytic", D: "Clear & action-based" } },
  { id: 15, section: "School Values & Teaching Philosophy", question: "Which report style fits your school best?", options: { A: "Vision-oriented", B: "People-centered", C: "Organized & detailed", D: "Direct & fast-paced" } },

  // SECTION 2 — Teacher Strengths You Want Measured
  { id: 16, section: "Teacher Strengths You Want Measured", question: "Which strength should the teacher report highlight most?", options: { A: "Creative thinking", B: "Relationship-building", C: "Planning precision", D: "Task efficiency" } },
  { id: 17, section: "Teacher Strengths You Want Measured", question: "The most important teacher strength at your school is:", options: { A: "New ideas", B: "Classroom climate", C: "Structure", D: "Productivity" } },
  { id: 18, section: "Teacher Strengths You Want Measured", question: "Which strength do you want broken down in detail?", options: { A: "Idea generation", B: "Student motivation", C: "Organization", D: "Classroom execution" } },
  { id: 19, section: "Teacher Strengths You Want Measured", question: "Which type of feedback do teachers need most?", options: { A: "Creative growth", B: "Relational insight", C: "Planning improvement", D: "Execution habits" } },
  { id: 20, section: "Teacher Strengths You Want Measured", question: "Teachers often struggle most with:", options: { A: "Too few ideas", B: "Student engagement", C: "Disorganized planning", D: "Slow task completion" } },
  { id: 21, section: "Teacher Strengths You Want Measured", question: "What strengths are currently undervalued?", options: { A: "Creativity", B: "Student-facing warmth", C: "Systems management", D: "High-efficiency teaching" } },
  { id: 22, section: "Teacher Strengths You Want Measured", question: "Which teacher trait impacts student success most?", options: { A: "Creativity", B: "Emotional support", C: "Structure", D: "Academic pacing" } },
  { id: 23, section: "Teacher Strengths You Want Measured", question: "Which teacher strength varies most in your school?", options: { A: "Innovation", B: "Empathy", C: "Organization", D: "Execution" } },
  { id: 24, section: "Teacher Strengths You Want Measured", question: "Which strength do new teachers lack most?", options: { A: "Creativity", B: "Classroom presence", C: "Planning", D: "Speed" } },
  { id: 25, section: "Teacher Strengths You Want Measured", question: "What do veteran teachers need feedback on?", options: { A: "Innovation", B: "Relational growth", C: "Organizational systems", D: "Efficiency" } },
  { id: 26, section: "Teacher Strengths You Want Measured", question: "What do struggling teachers need most?", options: { A: "Creative templates", B: "Communication strategies", C: "Planning routines", D: "Timing & pacing support" } },
  { id: 27, section: "Teacher Strengths You Want Measured", question: "Which skill matters most for PD planning?", options: { A: "Creative practices", B: "Classroom relationships", C: "Planning frameworks", D: "Instructional execution" } },
  { id: 28, section: "Teacher Strengths You Want Measured", question: "Which should be emphasized in teacher reports?", options: { A: "Ideation strengths", B: "Engagement strengths", C: "Planning strengths", D: "Productivity strengths" } },
  { id: 29, section: "Teacher Strengths You Want Measured", question: "Admin wants to see teacher strengths described as:", options: { A: "Innovative", B: "Supportive", C: "Organized", D: "Efficient" } },
  { id: 30, section: "Teacher Strengths You Want Measured", question: "The teacher report should help teachers identify:", options: { A: "Their creative style", B: "Their relational style", C: "Their planning style", D: "Their execution style" } },

  // SECTION 3 — Teacher Growth Areas You Want Measured
  { id: 31, section: "Teacher Growth Areas You Want Measured", question: "What is the most common growth need?", options: { A: "Overthinking or idea overload", B: "Emotional burnout", C: "Lack of structure", D: "Slow instruction" } },
  { id: 32, section: "Teacher Growth Areas You Want Measured", question: "Teachers often struggle with:", options: { A: "Finishing ideas", B: "Setting boundaries", C: "Planning ahead", D: "Staying on pace" } },
  { id: 33, section: "Teacher Growth Areas You Want Measured", question: "You want the teacher report to flag when a teacher is:", options: { A: "Too abstract", B: "Too emotionally burdened", C: "Too rigid", D: "Too fast or sloppy" } },
  { id: 34, section: "Teacher Growth Areas You Want Measured", question: "Which growth area do you want measured most?", options: { A: "Idea focus", B: "Emotional regulation", C: "Organization", D: "Task management" } },
  { id: 35, section: "Teacher Growth Areas You Want Measured", question: "Which PD topic would benefit your school most?", options: { A: "Creativity in curriculum", B: "Trauma-informed relationships", C: "Planning systems", D: "Time management" } },
  { id: 36, section: "Teacher Growth Areas You Want Measured", question: "What is the biggest source of teacher conflict?", options: { A: "Conflicting ideas", B: "Personality clashes", C: "Planning differences", D: "Different working speeds" } },
  { id: 37, section: "Teacher Growth Areas You Want Measured", question: "New teachers struggle most with:", options: { A: "Narrowing lesson ideas", B: "Managing student emotions", C: "Planning long-term units", D: "Executing lessons smoothly" } },
  { id: 38, section: "Teacher Growth Areas You Want Measured", question: "Veteran teachers struggle most with:", options: { A: "Fresh ideas", B: "Student connection", C: "Organizational flexibility", D: "Maintaining pace" } },
  { id: 39, section: "Teacher Growth Areas You Want Measured", question: "Growth areas should be described as:", options: { A: "Creative discipline", B: "Relational tuning", C: "Planning refinement", D: "Execution habits" } },
  { id: 40, section: "Teacher Growth Areas You Want Measured", question: "What frustrates admin most about teacher shortcomings?", options: { A: "Lack of innovation", B: "Poor emotional awareness", C: "Disorganization", D: "Inefficiency" } },
  { id: 41, section: "Teacher Growth Areas You Want Measured", question: "Teachers most often need support in:", options: { A: "Choosing ideas", B: "Managing relationships", C: "Structuring content", D: "Executing lessons" } },
  { id: 42, section: "Teacher Growth Areas You Want Measured", question: "You want growth edges framed as:", options: { A: "Creative opportunities", B: "Relationship adjustments", C: "Organizational tweaks", D: "Efficiency upgrades" } },
  { id: 43, section: "Teacher Growth Areas You Want Measured", question: "Student feedback usually points to issues in:", options: { A: "Creativity", B: "Connection", C: "Structure", D: "Pacing" } },
  { id: 44, section: "Teacher Growth Areas You Want Measured", question: "You want to measure which \"blind spot\"?", options: { A: "Idea overwhelm", B: "Emotional overextension", C: "Over-structuring", D: "Rushing" } },
  { id: 45, section: "Teacher Growth Areas You Want Measured", question: "The teacher report should offer strategies for:", options: { A: "Creative focus", B: "Emotional balance", C: "Planning systems", D: "Execution rhythm" } },

  // SECTION 4 — Instructional Style Priorities
  { id: 46, section: "Instructional Style Priorities", question: "What instructional style do you want teachers assessed on most?", options: { A: "Creative/innovative teaching", B: "Relationship-centered teaching", C: "Structured/planned teaching", D: "Fast-paced/efficient teaching" } },
  { id: 47, section: "Instructional Style Priorities", question: "Which instructional weakness causes the most inconsistency?", options: { A: "Unfocused lessons", B: "Weak rapport", C: "Poor lesson structure", D: "Slow pacing" } },
  { id: 48, section: "Instructional Style Priorities", question: "The best teachers in your school excel at:", options: { A: "Creative lesson design", B: "Inspiring students", C: "Creating consistent systems", D: "Moving lessons forward" } },
  { id: 49, section: "Instructional Style Priorities", question: "You want classroom observations to focus more on:", options: { A: "Innovation", B: "Student relationships", C: "Planning quality", D: "Execution" } },
  { id: 50, section: "Instructional Style Priorities", question: "In your school, ineffective lessons are usually caused by:", options: { A: "Weak creativity", B: "Lack of student connection", C: "Missing structure", D: "Weak pacing" } },
  { id: 51, section: "Instructional Style Priorities", question: "Which instructional domain needs the most detail in reports?", options: { A: "Creativity", B: "Communication", C: "Organization", D: "Efficiency" } },
  { id: 52, section: "Instructional Style Priorities", question: "When lessons fail, the most common cause is:", options: { A: "Idea overload", B: "Emotional misreads", C: "Disorganization", D: "Slow response to issues" } },
  { id: 53, section: "Instructional Style Priorities", question: "Teachers should receive more feedback on:", options: { A: "Design of learning experiences", B: "How they interact with students", C: "How they structure content", D: "How they manage transitions" } },
  { id: 54, section: "Instructional Style Priorities", question: "Strong instruction at your school depends on:", options: { A: "Creative tasks", B: "Classroom connections", C: "Clear routines", D: "Quick adjustments" } },
  { id: 55, section: "Instructional Style Priorities", question: "What should the teacher report help clarify?", options: { A: "Their creative tendencies", B: "Their relational tendencies", C: "Their organizational tendencies", D: "Their execution tendencies" } },
  { id: 56, section: "Instructional Style Priorities", question: "The school wants to encourage teachers to:", options: { A: "Take creative risks", B: "Deepen student relationships", C: "Strengthen planning habits", D: "Improve execution efficiency" } },
  { id: 57, section: "Instructional Style Priorities", question: "Your teachers most often ask for PD on:", options: { A: "Engagement ideas", B: "Relationship-building", C: "Planning tools", D: "Timing & pacing" } },
  { id: 58, section: "Instructional Style Priorities", question: "Student complaints usually highlight:", options: { A: "Boring lessons", B: "Teacher-student disconnect", C: "Confusing structure", D: "Slow instruction" } },
  { id: 59, section: "Instructional Style Priorities", question: "An \"effective teacher\" at your school is mostly defined by:", options: { A: "Innovation", B: "Empathy", C: "Clarity", D: "Efficiency" } },
  { id: 60, section: "Instructional Style Priorities", question: "The teacher report should include observations about:", options: { A: "Creative practices", B: "Classroom culture", C: "Planning quality", D: "Instructional pacing" } },

  // SECTION 5 — Classroom Management & Environment
  { id: 61, section: "Classroom Management & Environment", question: "What aspect of classroom management should be assessed?", options: { A: "Creative engagement techniques", B: "Relationship-centered discipline", C: "Routine & procedure clarity", D: "Momentum and pacing" } },
  { id: 62, section: "Classroom Management & Environment", question: "When teachers struggle with management, it's usually due to:", options: { A: "Unengaging instruction", B: "Weak rapport", C: "Inconsistent routines", D: "Loss of pacing" } },
  { id: 63, section: "Classroom Management & Environment", question: "Your school prioritizes management based on:", options: { A: "Student engagement", B: "Student-teacher trust", C: "Structure", D: "Efficiency" } },
  { id: 64, section: "Classroom Management & Environment", question: "The teacher report should measure how teachers:", options: { A: "Use creativity in management", B: "Build relationships around discipline", C: "Establish clear systems", D: "Sustain momentum" } },
  { id: 65, section: "Classroom Management & Environment", question: "Classroom disruptions often come from:", options: { A: "Boredom", B: "Emotional disconnect", C: "Confusing expectations", D: "Slow movement in lessons" } },
  { id: 66, section: "Classroom Management & Environment", question: "Teachers need the most support in:", options: { A: "Engagement strategies", B: "Relational discipline", C: "Routine-setting", D: "Transition timing" } },
  { id: 67, section: "Classroom Management & Environment", question: "What makes management strongest?", options: { A: "Fun & creativity", B: "Trust", C: "Predictability", D: "Fast redirection" } },
  { id: 68, section: "Classroom Management & Environment", question: "What should be included in teacher growth data?", options: { A: "Student engagement signals", B: "Student relationship indicators", C: "Routine consistency", D: "Lesson pacing markers" } },
  { id: 69, section: "Classroom Management & Environment", question: "Teachers who struggle need the report to emphasize:", options: { A: "Creative solutions", B: "Relational repair strategies", C: "Organizational procedures", D: "Actionable redirection methods" } },
  { id: 70, section: "Classroom Management & Environment", question: "The school wants management feedback to focus on:", options: { A: "Innovation", B: "Trust & connection", C: "Routines", D: "Speed of recovery" } },
  { id: 71, section: "Classroom Management & Environment", question: "Your discipline philosophy is closest to:", options: { A: "Engagement first", B: "Relationships first", C: "Structure first", D: "Action first" } },
  { id: 72, section: "Classroom Management & Environment", question: "What part of classroom environment matters most?", options: { A: "Creativity", B: "Emotional safety", C: "Predictability", D: "Momentum" } },
  { id: 73, section: "Classroom Management & Environment", question: "Teachers would benefit from more insight into:", options: { A: "Fun & novelty", B: "Student emotional cues", C: "Routine clarity", D: "Efficient transitions" } },
  { id: 74, section: "Classroom Management & Environment", question: "Student behavioral issues decrease when teachers focus on:", options: { A: "Creative engagement", B: "Relationships", C: "Structure", D: "Pacing" } },
  { id: 75, section: "Classroom Management & Environment", question: "The teacher report should include strategies for:", options: { A: "Engagement design", B: "Relationship repair", C: "Routine management", D: "Dynamic movement" } },

  // SECTION 6 — Collaboration & Professional Culture
  { id: 76, section: "Collaboration & Professional Culture", question: "What should the teacher assessment measure in PLC/team meetings?", options: { A: "Idea contribution", B: "Relationship & morale", C: "Organization", D: "Action-taking" } },
  { id: 77, section: "Collaboration & Professional Culture", question: "Teachers often struggle in collaboration because of:", options: { A: "Competing ideas", B: "Communication tone", C: "Planning gaps", D: "Follow-through issues" } },
  { id: 78, section: "Collaboration & Professional Culture", question: "You want the report to highlight teachers who:", options: { A: "Bring creative solutions", B: "Boost team morale", C: "Keep meetings organized", D: "Drive tasks to completion" } },
  { id: 79, section: "Collaboration & Professional Culture", question: "The biggest friction point in teacher teams is:", options: { A: "Idea overload", B: "Emotional tensions", C: "Inconsistent planning", D: "Missing deliverables" } },
  { id: 80, section: "Collaboration & Professional Culture", question: "Collaboration works best when teachers:", options: { A: "Brainstorm well", B: "Support each other", C: "Share structured plans", D: "Execute reliably" } },
  { id: 81, section: "Collaboration & Professional Culture", question: "The school wants to promote teams that are:", options: { A: "Innovative", B: "Supportive", C: "Organized", D: "Productive" } },
  { id: 82, section: "Collaboration & Professional Culture", question: "What should the teacher report measure about collaboration?", options: { A: "Creativity in problem-solving", B: "Emotional intelligence", C: "Preparedness", D: "Follow-through" } },
  { id: 83, section: "Collaboration & Professional Culture", question: "Teacher partnerships break down when:", options: { A: "Creativity clashes", B: "People issues arise", C: "Plans are unclear", D: "Workload isn't shared" } },
  { id: 84, section: "Collaboration & Professional Culture", question: "You want collaboration feedback framed as:", options: { A: "Creative opportunities", B: "Relational improvements", C: "Structural fixes", D: "Action steps" } },
  { id: 85, section: "Collaboration & Professional Culture", question: "The report should help teachers understand:", options: { A: "Their brainstorming style", B: "Their relational style", C: "Their planning role", D: "Their execution role" } },
  { id: 86, section: "Collaboration & Professional Culture", question: "Strong teacher teams at your school excel at:", options: { A: "Ideation", B: "Communication", C: "Planning", D: "Delivery" } },
  { id: 87, section: "Collaboration & Professional Culture", question: "In meetings, you value teachers who:", options: { A: "Think outside the box", B: "Keep morale up", C: "Come prepared", D: "Take initiative" } },
  { id: 88, section: "Collaboration & Professional Culture", question: "Teachers often need help with:", options: { A: "Prioritization of ideas", B: "Resolving interpersonal issues", C: "Coordinating plans", D: "Finishing shared work" } },
  { id: 89, section: "Collaboration & Professional Culture", question: "The biggest predictor of team success is:", options: { A: "Innovation", B: "Relationship health", C: "Clear planning", D: "Execution consistency" } },
  { id: 90, section: "Collaboration & Professional Culture", question: "The teacher report should describe collaboration style as:", options: { A: "Creative", B: "Motivational", C: "Organized", D: "Action-oriented" } },

  // SECTION 7 — Leadership Style & Capacity
  { id: 91, section: "Leadership Style & Capacity", question: "Which leadership quality matters most?", options: { A: "Vision", B: "Empathy", C: "Structure", D: "Action" } },
  { id: 92, section: "Leadership Style & Capacity", question: "The teacher report should evaluate leadership based on:", options: { A: "Creative influence", B: "Relational presence", C: "Planning ability", D: "Execution ability" } },
  { id: 93, section: "Leadership Style & Capacity", question: "Strong teacher leaders at your school usually excel in:", options: { A: "New ideas", B: "Community-building", C: "Organization", D: "Getting things done" } },
  { id: 94, section: "Leadership Style & Capacity", question: "Leadership weaknesses typically appear as:", options: { A: "Too many ideas, no focus", B: "Burnout from emotional labor", C: "Poor planning", D: "Lack of follow-through" } },
  { id: 95, section: "Leadership Style & Capacity", question: "You want teachers to grow as leaders by:", options: { A: "Innovating instruction", B: "Building stronger relationships", C: "Structuring systems", D: "Taking decisive action" } },
  { id: 96, section: "Leadership Style & Capacity", question: "Teachers struggle to lead when:", options: { A: "They are unsure of their ideas", B: "Emotional tension is high", C: "Plans are unclear", D: "Tasks feel overwhelming" } },
  { id: 97, section: "Leadership Style & Capacity", question: "The school should measure teachers' leadership in:", options: { A: "Creative contributions", B: "Team morale", C: "Organizational clarity", D: "Project completion" } },
  { id: 98, section: "Leadership Style & Capacity", question: "Effective leaders in your school are:", options: { A: "Visionary", B: "Supportive", C: "Organized", D: "Driven" } },
  { id: 99, section: "Leadership Style & Capacity", question: "You want leadership feedback framed as:", options: { A: "Inspiration", B: "Connection", C: "Planning", D: "Action" } },
  { id: 100, section: "Leadership Style & Capacity", question: "Teachers need the most leadership support in:", options: { A: "Idea refinement", B: "Communication", C: "Planning systems", D: "Delegation" } },
  { id: 101, section: "Leadership Style & Capacity", question: "Leadership growth should prioritize:", options: { A: "Creative courage", B: "Relational strength", C: "Organizational consistency", D: "Execution discipline" } },
  { id: 102, section: "Leadership Style & Capacity", question: "Teacher leaders fail most often due to:", options: { A: "Idea overwhelm", B: "Emotional burnout", C: "Over-structuring", D: "Lack of follow-through" } },
  { id: 103, section: "Leadership Style & Capacity", question: "The report should include leadership indicators for:", options: { A: "Creativity", B: "Motivation", C: "Planning", D: "Execution" } },
  { id: 104, section: "Leadership Style & Capacity", question: "You want to identify teachers who can lead:", options: { A: "Innovation projects", B: "Culture initiatives", C: "Systems improvements", D: "Academic outcomes" } },
  { id: 105, section: "Leadership Style & Capacity", question: "Leadership tendencies should be described as:", options: { A: "Creative", B: "Relational", C: "Organizational", D: "Operational" } },

  // SECTION 8 — Professional Growth & Development
  { id: 106, section: "Professional Growth & Development", question: "Which professional growth area matters most?", options: { A: "Creativity", B: "Emotional intelligence", C: "Planning skills", D: "Efficiency" } },
  { id: 107, section: "Professional Growth & Development", question: "Teachers often resist PD because:", options: { A: "It's not creative", B: "It feels impersonal", C: "It feels unstructured", D: "It feels impractical" } },
  { id: 108, section: "Professional Growth & Development", question: "You prefer PD to focus on:", options: { A: "Instructional innovation", B: "Relationship strategies", C: "Systems & routines", D: "Action-based techniques" } },
  { id: 109, section: "Professional Growth & Development", question: "Teachers need more individualized insight into:", options: { A: "Their creative strengths", B: "Their emotional tendencies", C: "Their planning habits", D: "Their execution habits" } },
  { id: 110, section: "Professional Growth & Development", question: "Growth goals should reflect:", options: { A: "Innovation", B: "Relationships", C: "Organization", D: "Productivity" } },
  { id: 111, section: "Professional Growth & Development", question: "Teachers improve fastest when PD is:", options: { A: "Inspirational", B: "Supportive", C: "Structured", D: "Practical" } },
  { id: 112, section: "Professional Growth & Development", question: "Admin struggles most with teachers who:", options: { A: "Don't innovate", B: "Struggle with communication", C: "Lack planning consistency", D: "Move too slowly" } },
  { id: 113, section: "Professional Growth & Development", question: "The teacher report should help set:", options: { A: "Creative goals", B: "Relational goals", C: "Planning goals", D: "Efficiency goals" } },
  { id: 114, section: "Professional Growth & Development", question: "The biggest PD gap is in:", options: { A: "Curriculum creativity", B: "Classroom climate", C: "Organizational systems", D: "Instructional pacing" } },
  { id: 115, section: "Professional Growth & Development", question: "You want teacher reports to offer:", options: { A: "Creative strategies", B: "Relationship strategies", C: "Planning strategies", D: "Execution strategies" } },
  { id: 116, section: "Professional Growth & Development", question: "Teachers reflect best when given:", options: { A: "Open-ended questions", B: "Relational prompts", C: "Structured rubrics", D: "Clear next steps" } },
  { id: 117, section: "Professional Growth & Development", question: "Growth should be measured primarily through:", options: { A: "Innovative practices", B: "Student surveys", C: "Planning documents", D: "Instructional outcomes" } },
  { id: 118, section: "Professional Growth & Development", question: "Teachers struggle most to maintain:", options: { A: "Creative energy", B: "Emotional boundaries", C: "Organization", D: "Momentum" } },
  { id: 119, section: "Professional Growth & Development", question: "Admin prefers growth data that is:", options: { A: "Imaginative", B: "Human-centered", C: "Detailed & structured", D: "Simple & actionable" } },
  { id: 120, section: "Professional Growth & Development", question: "Growth feedback should be expressed as:", options: { A: "Creative opportunities", B: "Interpersonal insights", C: "Planning adjustments", D: "Action recommendations" } },

  // SECTION 9 — Schoolwide Priorities & Strategic Goals
  { id: 121, section: "Schoolwide Priorities & Strategic Goals", question: "Your top strategic goal for teachers is:", options: { A: "More innovative instruction", B: "Stronger relationships", C: "Better systems", D: "Higher efficiency" } },
  { id: 122, section: "Schoolwide Priorities & Strategic Goals", question: "Your school wants its teacher report to connect to:", options: { A: "Curriculum development", B: "School climate", C: "Organizational alignment", D: "Academic performance" } },
  { id: 123, section: "Schoolwide Priorities & Strategic Goals", question: "The teacher report should drive decisions in:", options: { A: "Instructional redesign", B: "Culture & climate strategy", C: "Planning cycles", D: "Scheduling & pacing" } },
  { id: 124, section: "Schoolwide Priorities & Strategic Goals", question: "When thinking about whole-school goals, teaching should:", options: { A: "Spark creativity", B: "Improve connection", C: "Create consistency", D: "Increase productivity" } },
  { id: 125, section: "Schoolwide Priorities & Strategic Goals", question: "Which school priority matters most this year?", options: { A: "Innovation", B: "SEL", C: "Structure", D: "Academics" } },
  { id: 126, section: "Schoolwide Priorities & Strategic Goals", question: "What will improve teacher success the fastest?", options: { A: "Creativity workshops", B: "Relationship training", C: "Planning frameworks", D: "Pacing tools" } },
  { id: 127, section: "Schoolwide Priorities & Strategic Goals", question: "Admin wants data that helps them:", options: { A: "Encourage creativity", B: "Support staff wellbeing", C: "Standardize expectations", D: "Improve instruction" } },
  { id: 128, section: "Schoolwide Priorities & Strategic Goals", question: "Teachers need more alignment around:", options: { A: "Imaginative tasks", B: "Emotional support systems", C: "Organizational practices", D: "Lesson pacing norms" } },
  { id: 129, section: "Schoolwide Priorities & Strategic Goals", question: "School culture improves when teachers:", options: { A: "Innovate", B: "Empathize", C: "Organize", D: "Execute" } },
  { id: 130, section: "Schoolwide Priorities & Strategic Goals", question: "Strategic improvement requires:", options: { A: "Creative leadership", B: "Relational leadership", C: "Structural leadership", D: "Operational leadership" } },
  { id: 131, section: "Schoolwide Priorities & Strategic Goals", question: "The custom teacher assessment should emphasize:", options: { A: "Instructional innovation", B: "Climate contributions", C: "Consistency & planning", D: "Results & outputs" } },
  { id: 132, section: "Schoolwide Priorities & Strategic Goals", question: "Your school wants to avoid reports that feel:", options: { A: "Too theoretical", B: "Too impersonal", C: "Too rigid", D: "Too vague" } },
  { id: 133, section: "Schoolwide Priorities & Strategic Goals", question: "The data should help admin identify:", options: { A: "Innovators", B: "Connectors", C: "Organizers", D: "Executors" } },
  { id: 134, section: "Schoolwide Priorities & Strategic Goals", question: "You want the teacher report to ultimately:", options: { A: "Inspire creativity", B: "Improve relationships", C: "Increase consistency", D: "Boost performance" } },
  { id: 135, section: "Schoolwide Priorities & Strategic Goals", question: "The teacher report should position teachers as:", options: { A: "Creative designers", B: "Student advocates", C: "System managers", D: "Instructional drivers" } },

  // SECTION 10 — How You Want the Teacher Report to LOOK & FEEL
  { id: 136, section: "Report Look & Feel", question: "The tone of the report should be:", options: { A: "Visionary", B: "Warm", C: "Structured", D: "Direct" } },
  { id: 137, section: "Report Look & Feel", question: "The visual style should be:", options: { A: "Creative", B: "Human-centered", C: "Clean & organized", D: "Minimal & bold" } },
  { id: 138, section: "Report Look & Feel", question: "The report should feel:", options: { A: "Inspirational", B: "Supportive", C: "Analytical", D: "Actionable" } },
  { id: 139, section: "Report Look & Feel", question: "Feedback should be framed as:", options: { A: "Creative insights", B: "Relational insights", C: "Planning insights", D: "Execution insights" } },
  { id: 140, section: "Report Look & Feel", question: "Teachers should walk away feeling:", options: { A: "Inspired", B: "Understood", C: "Organized", D: "Motivated" } },
  { id: 141, section: "Report Look & Feel", question: "The report should emphasize:", options: { A: "Originality", B: "Empathy", C: "Structure", D: "Productivity" } },
  { id: 142, section: "Report Look & Feel", question: "Growth suggestions should be:", options: { A: "Idea-focused", B: "Relationship-focused", C: "System-focused", D: "Task-focused" } },
  { id: 143, section: "Report Look & Feel", question: "Strengths profiles should highlight:", options: { A: "Unique ideas", B: "Student connections", C: "Planning habits", D: "Efficiency habits" } },
  { id: 144, section: "Report Look & Feel", question: "The report should help teachers:", options: { A: "Innovate", B: "Connect", C: "Organize", D: "Execute" } },
  { id: 145, section: "Report Look & Feel", question: "The most important feeling after reading the report is:", options: { A: "Creative confidence", B: "Emotional clarity", C: "Organizational direction", D: "Action steps" } },
  { id: 146, section: "Report Look & Feel", question: "The length of the report should be:", options: { A: "Long & deep", B: "Medium & warm", C: "Structured & moderate", D: "Short & concise" } },
  { id: 147, section: "Report Look & Feel", question: "Visuals should emphasize:", options: { A: "Creative layouts", B: "People-focused graphics", C: "Charts & structure", D: "Simple icons" } },
  { id: 148, section: "Report Look & Feel", question: "The report should include:", options: { A: "Creative suggestions", B: "Relationship strategies", C: "Planning templates", D: "Efficiency workflows" } },
  { id: 149, section: "Report Look & Feel", question: "You want teachers to primarily improve in:", options: { A: "Innovation", B: "Engagement", C: "Planning", D: "Execution" } },
  { id: 150, section: "Report Look & Feel", question: "The final teacher report should feel like:", options: { A: "A creative blueprint", B: "A relational mirror", C: "A planning guide", D: "An action roadmap" } },
];

export interface GHSResult {
  id: string;
  teacherName: string;
  email: string;
  submittedAt: string;
  answers: Record<number, string>;
  colorScores: {
    Yellow: number;
    Green: number;
    Blue: number;
    Red: number;
  };
  primaryColor: string;
  secondaryColor: string;
}

export function calculateGHSResults(answers: Record<number, string>): {
  colorScores: { Yellow: number; Green: number; Blue: number; Red: number };
  primaryColor: string;
  secondaryColor: string;
} {
  const colorCounts = { Yellow: 0, Green: 0, Blue: 0, Red: 0 };
  
  Object.values(answers).forEach((answer) => {
    const color = GHS_COLOR_MAP[answer as keyof typeof GHS_COLOR_MAP];
    if (color) {
      colorCounts[color]++;
    }
  });

  const total = Object.keys(answers).length;
  const colorScores = {
    Yellow: Math.round((colorCounts.Yellow / total) * 100),
    Green: Math.round((colorCounts.Green / total) * 100),
    Blue: Math.round((colorCounts.Blue / total) * 100),
    Red: Math.round((colorCounts.Red / total) * 100),
  };

  const sorted = Object.entries(colorScores).sort(([, a], [, b]) => b - a);
  
  return {
    colorScores,
    primaryColor: sorted[0][0],
    secondaryColor: sorted[1][0],
  };
}
