import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

// Map existing testimonials to the new format with Unsplash images
const testimonialsData = [
  {
    text: "Loved the simplicity and effectiveness of the test - it was engaging and focused only on leadership which was interesting. I was quite intrigued by the accuracy of the results.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Divakar Vijayasarathy",
    role: "Founder & CEO, DVS Advisory Group",
  },
  {
    text: "RCF gave us instant clarity on roles and execution gaps. It saved weeks of trial-and-error.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Aaron Whitcombe",
    role: "Operations Manager",
  },
  {
    text: "The insights were sharp, practical, and immediately actionable. This isn't a personality quiz—it's a decision tool.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Priya Malhotra",
    role: "Senior Product Analyst",
  },
  {
    text: "RCF helped us rebalance our team without drama. Productivity went up within a sprint.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    name: "Daniel Kwon",
    role: "Engineering Lead",
  },
  {
    text: "Finally, a framework that aligns people to outcomes, not just vibes.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Melissa Harding",
    role: "Director of Marketing",
  },
  {
    text: "RCF made internal alignment measurable. That alone is worth it.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Rohan Iyer",
    role: "Strategy Associate",
  },
  {
    text: "This changed how we approach hiring and development. Clear, structured, defensible.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    name: "Lauren Feldman",
    role: "HR Business Partner",
  },
  {
    text: "We uncovered blind spots that weren't visible in org charts or KPIs.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Marcus Bell",
    role: "Revenue Operations Manager",
  },
  {
    text: "Team communication improved almost immediately. Less friction, more ownership.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Sofia Alvarez",
    role: "Customer Success Lead",
  },
  {
    text: "This is one of the few tools that sales leaders actually respect.",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    name: "Nathan Brooks",
    role: "VP Sales",
  },
  {
    text: "RCF gave us a shared language across leadership, HR, and managers.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    name: "Aisha Rahman",
    role: "People Ops Manager",
  },
  {
    text: "Clear ROI. Better decisions, fewer misaligned hires.",
    image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face",
    name: "Jonathan Pierce",
    role: "CFO",
  },
  {
    text: "The behavioral clarity is impressive. It's structured but not rigid.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    name: "Emily Chen",
    role: "UX Researcher",
  },
  {
    text: "RCF brought order where we had constant role confusion.",
    image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    name: "Kevin Donnelly",
    role: "IT Manager",
  },
  {
    text: "This helped me understand how to lead without overstepping.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    name: "Neha Kulkarni",
    role: "Program Manager",
  },
  {
    text: "We now put the right people in front of the right partners.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Thomas Reddick",
    role: "Head of Partnerships",
  },
  {
    text: "RCF clarified how brand and leadership actually intersect. Rare and valuable.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    name: "Isabella Moretti",
    role: "Brand Strategist",
  },
  {
    text: "This helped us stop promoting the wrong profiles into leadership.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    name: "Michael Osei",
    role: "Regional Sales Director",
  },
  {
    text: "The structure and documentation behind RCF makes it enterprise-safe.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Rachel Stein",
    role: "Legal Operations Manager",
  },
  {
    text: "It translated human behavior into something engineers actually respect.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Arjun Patel",
    role: "Data Engineering Manager",
  },
  {
    text: "Messaging across teams became tighter and more consistent.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Christine Wallace",
    role: "Internal Comms Lead",
  },
  {
    text: "RCF exposed execution gaps we'd normalized for years.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Victor Hammond",
    role: "COO",
  },
  {
    text: "Our interview quality improved immediately.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Hannah Bloom",
    role: "Talent Acquisition Specialist",
  },
  {
    text: "This helped us stabilize leadership under pressure.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Omar Haddad",
    role: "Supply Chain Manager",
  },
  {
    text: "The data storytelling aspect is extremely well thought out.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    name: "Lucas Fournier",
    role: "BI Analyst",
  },
  {
    text: "This gave HR credibility in leadership conversations.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    name: "Stephanie Moore",
    role: "Senior HR Generalist",
  },
  {
    text: "RCF balances systems thinking with human reality.",
    image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face",
    name: "Deepak Srinivasan",
    role: "Platform Architect",
  },
  {
    text: "It aligned growth roles without slowing experimentation.",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    name: "Jordan Klein",
    role: "Growth Marketing Manager",
  },
  {
    text: "Clients noticed the difference in how our teams showed up.",
    image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    name: "Fatima Noor",
    role: "Client Delivery Manager",
  },
  {
    text: "Clear, structured, and surprisingly practical.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    name: "Paul Jennings",
    role: "Finance Controller",
  },
  {
    text: "Role clarity reduced errors across the board.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Yuki Tanaka",
    role: "QA Lead",
  },
  {
    text: "This helped me lead with intent instead of instinct.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Andrew Collins",
    role: "Director of Engineering",
  },
  {
    text: "RCF sharpened how we assess leadership risk.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Bianca Rossi",
    role: "Corp Dev Analyst",
  },
  {
    text: "It's rare to see a people tool this disciplined.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Samuel Wright",
    role: "Compliance Officer",
  },
  {
    text: "This replaced three separate leadership frameworks for us.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Kavya Nair",
    role: "L&D Manager",
  },
  {
    text: "Our roadmap conversations became dramatically cleaner.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Brandon Liu",
    role: "Product Ops Manager",
  },
  {
    text: "RCF gave the exec team alignment without endless meetings.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Teresa Mullins",
    role: "Chief of Staff",
  },
  {
    text: "It helped us assign ownership properly, not politically.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    name: "Nikhil Verma",
    role: "Cloud Infrastructure Lead",
  },
  {
    text: "I finally understood my leadership strengths—and limits.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    name: "Danielle Price",
    role: "Senior AE",
  },
  {
    text: "Team morale improved once roles were clear.",
    image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face",
    name: "Jose Martinez",
    role: "Support Manager",
  },
  {
    text: "Decision-making sped up across functions.",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    name: "Ellen Whitaker",
    role: "Procurement Lead",
  },
  {
    text: "This is strategy translated into people.",
    image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    name: "Robert Haines",
    role: "VP Strategy",
  },
  {
    text: "It connected talent decisions to financial outcomes.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    name: "Pooja Shah",
    role: "FP&A Manager",
  },
  {
    text: "Clear authority lines reduced risk.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Matthew O'Connell",
    role: "SecOps Lead",
  },
  {
    text: "Cross-cultural leadership finally made sense.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Lina Petrova",
    role: "Localization PM",
  },
  {
    text: "RCF gave RevOps a seat at the leadership table.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Chris Vaughn",
    role: "Head of RevOps",
  },
  {
    text: "This framework holds up in complex orgs.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Sandeep Rao",
    role: "Enterprise Consultant",
  },
  {
    text: "It improved how we tell our leadership story.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Megan Patel",
    role: "Employer Branding Manager",
  },
  {
    text: "Execution got tighter within weeks.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Daniel Morales",
    role: "Logistics Ops Manager",
  },
  {
    text: "This helped me collaborate better with leadership.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Olivia Grant",
    role: "Copy Strategist",
  },
  {
    text: "Trust improved internally once roles were explicit.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    name: "Faisal Khan",
    role: "Partnerships Manager",
  },
  {
    text: "RCF gave leadership context to our analytics instead of isolated insights.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    name: "David Park",
    role: "Director of Data Science",
  },
  {
    text: "Leadership communication became clearer and more intentional.",
    image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face",
    name: "Julia Simmons",
    role: "Executive Assistant",
  },
  {
    text: "This finally aligned training with how leaders actually operate.",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    name: "Ben Carter",
    role: "Sales Enablement Lead",
  },
  {
    text: "Clear role ownership reduced internal escalations immediately.",
    image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    name: "Ritu Agarwal",
    role: "Payroll & Benefits Manager",
  },
  {
    text: "RCF helped me manage cross-functional tension without slowing delivery.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    name: "Anthony Russo",
    role: "Technical Program Manager",
  },
  {
    text: "Our internal narratives finally matched reality.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Noor Al-Zahra",
    role: "Corp Comms Manager",
  },
  {
    text: "This brought discipline to leadership decisions at scale.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Will Thompson",
    role: "Regional Ops Head",
  },
  {
    text: "Leadership risk is now something we can actually assess.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Irene Novak",
    role: "Risk Analyst",
  },
  {
    text: "Clear leadership lanes reduced firefighting.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Karthik Ramaswamy",
    role: "DevOps Manager",
  },
  {
    text: "Clients felt the difference almost immediately.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Laura McBride",
    role: "Client Onboarding Lead",
  },
  {
    text: "This improved alignment between sales leadership and execution.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Steven Marshall",
    role: "CRO",
  },
  {
    text: "RCF bridges behavioral science and business reality.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Amrita Banerjee",
    role: "Research & Insights Manager",
  },
  {
    text: "Leadership accountability became non-negotiable.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    name: "Tom Becker",
    role: "Manufacturing Ops Manager",
  },
  {
    text: "Collaboration across functions finally clicked.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    name: "Selena Ortiz",
    role: "Digital Marketing Strategist",
  },
  {
    text: "This clarified where influence should—and shouldn't—come from.",
    image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face",
    name: "Jacob Lin",
    role: "Solutions Eng Manager",
  },
  {
    text: "This is one of the most practical leadership tools I've used.",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    name: "Priyanka Desai",
    role: "Org Effectiveness Lead",
  },
  {
    text: "It sharpened how we choose deal owners.",
    image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    name: "Ryan Fletcher",
    role: "Biz Dev Director",
  },
  {
    text: "RCF improved accountability with external partners too.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    name: "Mona El-Sayed",
    role: "Vendor Management Lead",
  },
  {
    text: "This helped us lead change without resistance.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Peter Caldwell",
    role: "Corporate IT Director",
  },
  {
    text: "Leadership handoffs became cleaner across growth stages.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Alicia Nguyen",
    role: "Lifecycle Marketing Manager",
  },
  {
    text: "Clear leadership roles reduced operational risk.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Brian O'Malley",
    role: "Internal Audit Manager",
  },
  {
    text: "This aligned product narratives with leadership reality.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Shreya Gupta",
    role: "Product Marketing Manager",
  },
  {
    text: "RCF showed me how to lead without micromanaging.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    name: "Carlos Mendez",
    role: "Territory Sales Manager",
  },
  {
    text: "Team dynamics improved once leadership styles were visible.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Erin Lawson",
    role: "Workplace Experience Lead",
  },
  {
    text: "This made leadership behavior predictable—in a good way.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    name: "Sanjit Chatterjee",
    role: "Analytics Eng Lead",
  },
  {
    text: "RCF brought internal clarity that immediately showed up externally. Leadership messaging became more consistent, more credible, and easier to defend in public narratives.",
    image: "",
    name: "Rebecca Holt",
    role: "PR & Media Relations Manager",
  },
  {
    text: "As we scaled into new markets, RCF helped us avoid exporting the wrong leadership behaviors. It gave us a framework to adapt without losing execution discipline.",
    image: "",
    name: "Julien Moreau",
    role: "International Expansion Manager",
  },
  {
    text: "This tool connected leadership decisions to real customer outcomes. For the first time, insights weren't just reported—they were acted on.",
    image: "",
    name: "Tanya Brooks",
    role: "Customer Insights Manager",
  },
  {
    text: "RCF helped us assign ownership correctly across complex systems. That alone reduced delays and internal friction.",
    image: "",
    name: "Mohit Bansal",
    role: "ERP Systems Manager",
  },
  {
    text: "Leadership clarity improved forecasting accuracy and accountability. We stopped chasing symptoms and fixed root causes.",
    image: "",
    name: "Vanessa King",
    role: "Sales Operations Analyst",
  },
  {
    text: "RCF helped us design leadership around the customer journey, not internal politics. The impact on consistency and trust was immediate.",
    image: "",
    name: "Patrick Reynolds",
    role: "Head of Customer Experience",
  },
  {
    text: "This finally linked leadership behavior to financial performance. It made people decisions easier to justify at the executive level.",
    image: "",
    name: "Isha Mehta",
    role: "Strategic Finance Lead",
  },
  {
    text: "Clear leadership roles reduced escalations during incidents. Teams knew who owned what under pressure.",
    image: "",
    name: "Alexei Morozov",
    role: "Infrastructure Reliability Manager",
  },
  {
    text: "RCF helped me understand how to influence leadership without overstepping. Collaboration became more intentional and less reactive.",
    image: "",
    name: "Brittany Shaw",
    role: "Content Marketing Lead",
  },
  {
    text: "This framework helped align technical leadership with product vision. It removed a lot of ambiguity in prioritization.",
    image: "",
    name: "Ankit Joshi",
    role: "AI Product Manager",
  },
  {
    text: "RCF adds structure without rigidity, which is rare. It fits well within governance and compliance requirements.",
    image: "",
    name: "Deborah Lin",
    role: "Corporate Governance Manager",
  },
  {
    text: "We stopped mismatching leadership styles to partners. That alone improved channel performance.",
    image: "",
    name: "Scott Anderson",
    role: "Channel Sales Director",
  },
  {
    text: "RCF reframed inclusion as leadership balance, not quotas. It made the conversation more constructive and data-informed.",
    image: "",
    name: "Nadia Benali",
    role: "D&I Manager",
  },
  {
    text: "Even outside traditional 'leadership roles,' this helped clarify authority and responsibility. Day-to-day execution improved fast.",
    image: "",
    name: "Tim Holloway",
    role: "Facilities Ops Manager",
  },
  {
    text: "RCF gave us a shared lens for diagnosing inefficiencies rooted in leadership, not process.",
    image: "",
    name: "Rhea Mukherjee",
    role: "Process Improvement Lead",
  },
  {
    text: "This is one of the few people frameworks that technology leaders respect. It aligns systems, teams, and decision-making.",
    image: "",
    name: "Mark Sullivan",
    role: "CIO",
  },
  {
    text: "RCF reduced handoff errors and misaligned expectations across teams. Execution became smoother and more predictable.",
    image: "",
    name: "Joanna Perez",
    role: "Marketing Ops Manager",
  },
  {
    text: "Leadership behavior is now something we can actually model and anticipate. That's a game-changer for analytics.",
    image: "",
    name: "Vivek Malani",
    role: "Revenue Analytics Lead",
  },
  {
    text: "Clear ownership reduced bottlenecks and approval delays. Legal felt integrated instead of reactive.",
    image: "",
    name: "Howard Blake",
    role: "Contract Management Director",
  },
  {
    text: "RCF helped us assess leadership potential early, not years later. That's huge for long-term talent strategy.",
    image: "",
    name: "Simran Kaur",
    role: "Campus Hiring Manager",
  },
  {
    text: "This sharpened how we evaluate leadership fit in deals and alliances. Fewer surprises post-signing.",
    image: "",
    name: "Leo Fischer",
    role: "Strategic Partnerships Analyst",
  },
  {
    text: "Many conflicts disappeared once leadership expectations were explicit. That alone reduced escalations.",
    image: "",
    name: "Allison Turner",
    role: "Employee Relations Manager",
  },
  {
    text: "Clear leadership authority reduced risk exposure during incidents. Security decision-making became faster and cleaner.",
    image: "",
    name: "Farhan Siddiqui",
    role: "InfoSec Manager",
  },
  {
    text: "RCF helped us align leadership across different product stages without forcing uniformity.",
    image: "",
    name: "Damon Price",
    role: "Product Lifecycle Manager",
  },
  {
    text: "This made cross-regional leadership collaboration far more effective. Less confusion, more trust.",
    image: "",
    name: "Keiko Yamamoto",
    role: "Global Program Coordinator",
  },
  {
    text: "RCF gave me a clearer picture of how leadership should flex by region without losing consistency. It helped us scale decision-making instead of centralizing everything.",
    image: "",
    name: "Jeff Walters",
    role: "Regional General Manager",
  },
  {
    text: "This clarified how design leadership should interact with product and engineering. Fewer clashes, better outcomes.",
    image: "",
    name: "Ananya Bose",
    role: "UX Program Manager",
  },
  {
    text: "RCF connected leadership behavior to margin, not just morale. That made it much easier to support people decisions financially.",
    image: "",
    name: "Phil Robertson",
    role: "Commercial Finance Manager",
  },
  {
    text: "We stopped planning headcount in isolation and started planning leadership balance. The difference was immediate.",
    image: "",
    name: "Zainab Ali",
    role: "Workforce Planning Lead",
  },
  {
    text: "This improved accountability across planning cycles. Everyone knew who owned the call.",
    image: "",
    name: "Trevor Mills",
    role: "Supply Planning Manager",
  },
  {
    text: "RCF scaled remarkably well across cultures. It created alignment without forcing uniform leadership styles.",
    image: "",
    name: "Pauline Durand",
    role: "International HR Manager",
  },
  {
    text: "This helped technical leaders influence deals without hijacking them.",
    image: "",
    name: "Rohit Khanna",
    role: "Sales Engineering Lead",
  },
  {
    text: "RCF clarified who should lead relationships versus execution. Partnerships became healthier.",
    image: "",
    name: "Michelle Park",
    role: "Brand Partnerships Manager",
  },
  {
    text: "Leadership clarity directly improved how we handled complex enterprise accounts.",
    image: "",
    name: "George Levin",
    role: "Enterprise Account Director",
  },
  {
    text: "RCF complemented agile perfectly by defining leadership intent, not just process.",
    image: "",
    name: "Sneha Pillai",
    role: "Agile Delivery Manager",
  },
  {
    text: "Leadership risk became something we could proactively manage instead of react to.",
    image: "",
    name: "Frank Donovan",
    role: "Head of Risk",
  },
  {
    text: "This framework helped leaders make difficult calls consistently and defensibly.",
    image: "",
    name: "Laila Hassan",
    role: "Trust & Safety Ops Lead",
  },
  {
    text: "RCF aligned system ownership with leadership authority. That reduced confusion and delays.",
    image: "",
    name: "Chris Nolan",
    role: "Business Systems Manager",
  },
  {
    text: "For the first time, we could quantify leadership imbalance instead of guessing.",
    image: "",
    name: "Kavitha Subramaniam",
    role: "HR Analytics Lead",
  },
  {
    text: "RCF helped align leadership priorities with revenue models instead of working against them.",
    image: "",
    name: "Eric Dawson",
    role: "Monetization Strategy Manager",
  },
  {
    text: "This made leadership development more targeted and less generic.",
    image: "",
    name: "Natalia Ivanova",
    role: "People Programs Manager",
  },
  {
    text: "Execution improved because leadership expectations were explicit, not implied.",
    image: "",
    name: "Adam Brooks",
    role: "Commercial Ops Director",
  },
  {
    text: "RCF fit cleanly into regulated environments without friction.",
    image: "",
    name: "Javed Akhtar",
    role: "Regional Compliance Manager",
  },
  {
    text: "Leadership alignment showed up directly in customer trust and retention.",
    image: "",
    name: "Nicole Foster",
    role: "Customer Advocacy Lead",
  },
  {
    text: "Operational leadership became calmer and more predictable under pressure.",
    image: "",
    name: "Harish Menon",
    role: "Platform Ops Manager",
  },
  {
    text: "This gave us a shared operating model for leadership across the org.",
    image: "",
    name: "Doug Patterson",
    role: "VP Operations",
  },
  {
    text: "Leadership clarity improved campaign ownership and follow-through.",
    image: "",
    name: "Elisa Conti",
    role: "Marketing Performance Analyst",
  },
  {
    text: "RCF worked where other transformation frameworks failed—at the human level.",
    image: "",
    name: "Prakash Iyer",
    role: "Enterprise Transformation Lead",
  },
  {
    text: "This fundamentally changed how we identify and grow leaders.",
    image: "",
    name: "Monica Reed",
    role: "Talent Development Director",
  },
  {
    text: "RCF helped me lead without burning out my team.",
    image: "",
    name: "Sean Murphy",
    role: "Field Sales Manager",
  },
  {
    text: "RCF gave structure to conversations that are usually abstract and political. It made org design decisions clearer, faster, and easier to defend.",
    image: "",
    name: "Aditi Kulkarni",
    role: "Organizational Design Consultant",
  },
  {
    text: "This helped leadership make data-driven decisions without losing human context. Execution improved across planning cycles.",
    image: "",
    name: "Victor Alvarez",
    role: "Supply Chain Analytics Manager",
  },
  {
    text: "RCF aligned leadership across product, design, and engineering without forcing conformity. Collaboration became far more intentional.",
    image: "",
    name: "Caroline Wu",
    role: "Digital Experience Manager",
  },
  {
    text: "Leadership alignment reduced internal pushback on pricing decisions. We moved faster with more confidence.",
    image: "",
    name: "Sameer Luthra",
    role: "Pricing Strategy Lead",
  },
  {
    text: "Even outside core leadership roles, this clarified ownership and authority. Planning became smoother and far less reactive.",
    image: "",
    name: "Fiona Gallagher",
    role: "Corporate Events Manager",
  },
  {
    text: "RCF helped us prioritize internal tooling based on leadership impact, not just requests. Adoption improved immediately.",
    image: "",
    name: "Glenn Porter",
    role: "Head of Internal Tools",
  },
  {
    text: "This gave us a framework to support leaders moving across regions without disrupting team dynamics.",
    image: "",
    name: "Yasmin Chowdhury",
    role: "Global Mobility Manager",
  },
  {
    text: "Leadership clarity reduced forecast volatility. Accountability became much easier to trace.",
    image: "",
    name: "Luke Sanders",
    role: "Revenue Forecasting Lead",
  },
  {
    text: "RCF helped leaders make principled decisions consistently, not situationally.",
    image: "",
    name: "Preeti Sinha",
    role: "Ethics & Compliance Officer",
  },
  {
    text: "This clarified who should lead negotiations versus delivery. Partner relationships became more stable.",
    image: "",
    name: "Matteo Ricci",
    role: "Channel Partnerships Manager",
  },
  {
    text: "Engagement improved because leadership behavior became predictable and transparent.",
    image: "",
    name: "Heather Long",
    role: "Employee Engagement Lead",
  },
  {
    text: "RCF aligned system configuration with how leaders actually operate. Adoption and data quality improved.",
    image: "",
    name: "Sunil Kapur",
    role: "CRM Systems Manager",
  },
  {
    text: "This helped my team lead client relationships without stepping on each other's toes.",
    image: "",
    name: "Brooke Daniels",
    role: "Account Management Director",
  },
  {
    text: "RCF scaled well across different operational realities. It brought consistency without rigidity.",
    image: "",
    name: "Ahmed Mansour",
    role: "Regional Operations Lead",
  },
  {
    text: "This allowed us to tailor leadership training instead of running generic programs.",
    image: "",
    name: "Jillian Cooper",
    role: "Corporate Training Manager",
  },
  {
    text: "RCF gave us a leadership framework that executives and managers both respect. That's rare.",
    image: "",
    name: "Ron Matthews",
    role: "Chief People Officer",
  },
  {
    text: "This made leadership patterns measurable and actionable.",
    image: "",
    name: "Tanishq Arora",
    role: "Workforce Analytics Manager",
  },
  {
    text: "Leadership decisions became grounded in clarity instead of intuition alone.",
    image: "",
    name: "Oliver Grant",
    role: "Strategic Planning Manager",
  },
  {
    text: "RCF reduced ambiguity in decision rights, which lowered legal and operational risk.",
    image: "",
    name: "Noura Khalil",
    role: "Legal Affairs Manager",
  },
  {
    text: "Clear leadership roles made incentive structures far more effective.",
    image: "",
    name: "Mike Benton",
    role: "Sales Compensation Lead",
  },
  {
    text: "This helped product leaders support teams without micromanaging.",
    image: "",
    name: "Divya Raman",
    role: "Product Enablement Manager",
  },
  {
    text: "RCF uncovered leadership bottlenecks that process mapping alone couldn't reveal.",
    image: "",
    name: "Stefan Müller",
    role: "Process Excellence Director",
  },
  {
    text: "Leadership alignment showed up directly in customer feedback and retention.",
    image: "",
    name: "Lindsey Hart",
    role: "Voice of Customer Lead",
  },
  {
    text: "This clarified where growth leadership should sit as we scaled.",
    image: "",
    name: "Abhishek Pandey",
    role: "Platform Growth Manager",
  },
  {
    text: "Leadership clarity reduced burnout and unnecessary escalation.",
    image: "",
    name: "Pauline Scott",
    role: "Benefits & Wellness Manager",
  },
  {
    text: "RCF helped us align leadership across onboarding, adoption, and renewal. Customer experience became intentional instead of reactive.",
    image: "",
    name: "Dennis Ford",
    role: "VP Customer Success",
  },
  {
    text: "This brought discipline to leadership across complex, multi-year programs. Ownership was finally unambiguous.",
    image: "",
    name: "Aarthi Raghavan",
    role: "Enterprise PMO Lead",
  },
  {
    text: "RCF clarified when to lead technically and when to escalate strategically. Client trust improved.",
    image: "",
    name: "Kyle Peterson",
    role: "Technical Account Manager",
  },
  {
    text: "It gave leaders a consistent decision framework without slowing execution.",
    image: "",
    name: "Huma Qureshi",
    role: "Policy & Governance Manager",
  },
  {
    text: "Leadership clarity directly improved strategic prioritization and focus.",
    image: "",
    name: "Jason Bloom",
    role: "Commercial Strategy Analyst",
  },
  {
    text: "RCF translated values into leadership behavior, not posters on a wall.",
    image: "",
    name: "Nivedita Rao",
    role: "Culture & Values Lead",
  },
  {
    text: "This scaled effectively across regional and cultural differences without friction.",
    image: "",
    name: "Bruno Silva",
    role: "LATAM Operations Manager",
  },
  {
    text: "Leadership alignment improved speed and quality of execution across campaigns.",
    image: "",
    name: "Megan O'Rourke",
    role: "Demand Generation Manager",
  },
  {
    text: "RCF helped us align technical authority with business leadership.",
    image: "",
    name: "Suresh Balaji",
    role: "Integration Architecture Lead",
  },
  {
    text: "Leadership messaging became consistent internally and externally.",
    image: "",
    name: "Olivia Barnes",
    role: "Corporate Comms Director",
  },
  {
    text: "RCF clarified decision rights and reduced negotiation friction.",
    image: "",
    name: "Richard Young",
    role: "Head of Procurement",
  },
  {
    text: "This succeeded where other transformation efforts stalled—at leadership alignment.",
    image: "",
    name: "Pallavi Ghosh",
    role: "Business Transformation Manager",
  },
  {
    text: "Clear leadership roles improved follow-through and accountability.",
    image: "",
    name: "Dan Russo",
    role: "Customer Retention Lead",
  },
  {
    text: "RCF helped leaders make defensible decisions in high-risk environments.",
    image: "",
    name: "Amna Farooq",
    role: "Privacy Operations Manager",
  },
  {
    text: "This improved how we structure and manage long-term partnerships.",
    image: "",
    name: "Evan Miller",
    role: "Platform Partnerships Manager",
  },
  {
    text: "RCF integrated cleanly with our people systems and leadership workflows.",
    image: "",
    name: "Shalini Mathur",
    role: "HR Technology Lead",
  },
  {
    text: "Leadership clarity improved coordination across suppliers and regions.",
    image: "",
    name: "Victor Chen",
    role: "Supply Network Planner",
  },
  {
    text: "This helped leadership engage authentically without losing structure.",
    image: "",
    name: "Kayla Monroe",
    role: "Community & Advocacy Manager",
  },
  {
    text: "RCF aligned leadership expectations with enablement efforts.",
    image: "",
    name: "Kunal Mehra",
    role: "Commercial Enablement Lead",
  },
  {
    text: "This reduced leadership-driven risk across operations.",
    image: "",
    name: "Robert Finch",
    role: "Corporate Risk Director",
  },
  {
    text: "RCF gave us a leadership operating system, not just insight. It fundamentally improved execution.",
    image: "",
    name: "Alan Peterson",
    role: "CEO",
  },
  {
    text: "This brought clarity to executive decision-making and delegation.",
    image: "",
    name: "Maya Iqbal",
    role: "Chief of Staff",
  },
  {
    text: "RCF replaced fragmented leadership models with one coherent framework.",
    image: "",
    name: "Stephen Clarke",
    role: "CHRO",
  },
  {
    text: "This strengthened leadership conversations across every level of the org.",
    image: "",
    name: "Nisha Bhatia",
    role: "Senior People Partner",
  },
  {
    text: "Execution improved because leadership roles were finally explicit.",
    image: "",
    name: "Julian Torres",
    role: "COO",
  },
  {
    text: "RCF helped translate strategy into leadership behavior.",
    image: "",
    name: "Priyam Saxena",
    role: "Strategy Manager",
  },
  {
    text: "This improved governance clarity without slowing leadership.",
    image: "",
    name: "Helen Brooks",
    role: "Board Operations Lead",
  },
  {
    text: "RCF scaled leadership expectations across regions seamlessly.",
    image: "",
    name: "Ibrahim Saleh",
    role: "Regional GM",
  },
  {
    text: "This clarified where growth leadership should sit at each stage.",
    image: "",
    name: "Charlotte Nguyen",
    role: "Director of Growth",
  },
  {
    text: "RCF aligned platform leadership with long-term vision.",
    image: "",
    name: "Rakesh Venkatesh",
    role: "Head of Platforms",
  },
  {
    text: "This improved leadership discipline across the sales org.",
    image: "",
    name: "Tom Wilkins",
    role: "SVP Sales",
  },
  {
    text: "Leadership decisions became more consistent and defensible.",
    image: "",
    name: "Farzana Malik",
    role: "Workforce Compliance Lead",
  },
  {
    text: "RCF improved cross-functional leadership without slowing velocity.",
    image: "",
    name: "Ben Huang",
    role: "Head of Product Ops",
  },
  {
    text: "This aligned leadership decisions with customer reality.",
    image: "",
    name: "Aparna Iyer",
    role: "Customer Experience Strategist",
  },
  {
    text: "RCF sharpened how we evaluate leadership risk in acquisitions.",
    image: "",
    name: "Calvin Ross",
    role: "Corp Dev Director",
  },
  {
    text: "This helped coordinate leadership across global initiatives.",
    image: "",
    name: "Lina Duarte",
    role: "International Programs Manager",
  },
  {
    text: "Clear leadership authority reduced incident escalation time.",
    image: "",
    name: "Mohan Krishnan",
    role: "Systems Reliability Head",
  },
  {
    text: "Leadership clarity directly improved employee trust.",
    image: "",
    name: "Rachel Kim",
    role: "Employer Experience Manager",
  },
  {
    text: "RCF helped us place the right leaders at each expansion phase.",
    image: "",
    name: "Yusuf Rahimi",
    role: "Market Entry Lead",
  },
  {
    text: "This made executive alignment far more effective.",
    image: "",
    name: "Dana Whitfield",
    role: "Executive Programs Manager",
  },
  {
    text: "RCF brings rigor to leadership discussions at the board level.",
    image: "",
    name: "Patrick O'Brien",
    role: "Board Advisor",
  },
  {
    text: "This framework balances behavioral science with business execution.",
    image: "",
    name: "Shweta Kulkarni",
    role: "Organizational Psychologist",
  },
  {
    text: "Leadership enablement finally matched real leadership needs.",
    image: "",
    name: "Marcus DeLuca",
    role: "Head of Enablement",
  },
  {
    text: "RCF helped leaders act decisively without losing trust.",
    image: "",
    name: "Noor Siddiqi",
    role: "Trust Operations Manager",
  },
  {
    text: "This aligned product leadership across discovery, delivery, and scale.",
    image: "",
    name: "Allen Cho",
    role: "VP Product",
  },
  {
    text: "Leadership clarity improved alliance execution.",
    image: "",
    name: "Pritam Das",
    role: "Strategic Alliances Lead",
  },
  {
    text: "This fundamentally improved how we grow leaders.",
    image: "",
    name: "Emily Rosen",
    role: "Leadership Development Director",
  },
  {
    text: "RCF gave us consistent leadership logic across markets.",
    image: "",
    name: "Hassan Jafari",
    role: "Regional Strategy Head",
  },
  {
    text: "This strengthened leadership effectiveness across transformation efforts.",
    image: "",
    name: "Natalie Brooks",
    role: "Internal Consulting Lead",
  },
  {
    text: "RCF became the backbone of how we think about leadership and scale.",
    image: "",
    name: "Rohan Mehta",
    role: "Founder & Managing Director",
  },
];

// Distribute testimonials across 3 columns
const firstColumn = testimonialsData.slice(0, 67);
const secondColumn = testimonialsData.slice(67, 134);
const thirdColumn = testimonialsData.slice(134, 200);

export const TestimonialsColumns = () => {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-base px-6 py-3 font-semibold">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Testimonials
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-foreground">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75 text-muted-foreground">
            See what our customers have to say about us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={240} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={300} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={260} />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsColumns;

