import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Home, Lock } from "lucide-react";

type AssessmentType = "50q-teacher" | "50q-student" | "25q-teacher" | "25q-student";

interface QuestionOption {
  text: string;
  value: string;
  color: "Yellow" | "Red" | "Green" | "Blue";
}

interface Question {
  id: number;
  text: string;
  section?: string;
  options: QuestionOption[];
}

const STUDENT_50_QUESTIONS: Question[] = [
  // Section A: Leadership & Initiative (Q1-Q10)
  {
    id: 1,
    text: "When a group project begins, my first instinct is to…",
    section: "Leadership & Initiative",
    options: [
      { text: "Take action immediately and divide responsibilities", value: "a", color: "Yellow" },
      { text: "Inspire the group with a motivating idea or vision", value: "b", color: "Red" },
      { text: "Plan out the steps logically before starting", value: "c", color: "Green" },
      { text: "Suggest new, creative approaches no one has thought of yet", value: "d", color: "Blue" },
    ],
  },
  {
    id: 2,
    text: "I feel most satisfied in group work when…",
    section: "Leadership & Initiative",
    options: [
      { text: "The team executes the plan efficiently", value: "a", color: "Yellow" },
      { text: "Everyone feels energized and connected", value: "b", color: "Red" },
      { text: "The process is organized and makes sense", value: "c", color: "Green" },
      { text: "We create something original and innovative", value: "d", color: "Blue" },
    ],
  },
  {
    id: 3,
    text: "When no one steps up to lead…",
    section: "Leadership & Initiative",
    options: [
      { text: "I immediately start assigning tasks and pushing forward", value: "a", color: "Yellow" },
      { text: "I motivate others with encouragement and vision", value: "b", color: "Red" },
      { text: "I analyze the situation and build a logical framework", value: "c", color: "Green" },
      { text: "I propose a creative new way to move ahead", value: "d", color: "Blue" },
    ],
  },
  {
    id: 4,
    text: "In stressful situations, I usually…",
    section: "Leadership & Initiative",
    options: [
      { text: "Push into action and take control", value: "a", color: "Yellow" },
      { text: "Rally people with energy and positivity", value: "b", color: "Red" },
      { text: "Slow down, think critically, and find a solution", value: "c", color: "Green" },
      { text: "Reframe the problem in a fresh, innovative way", value: "d", color: "Blue" },
    ],
  },
  {
    id: 5,
    text: "My teammates usually describe me as…",
    section: "Leadership & Initiative",
    options: [
      { text: "The one who gets things done", value: "a", color: "Yellow" },
      { text: "The one who inspires and motivates", value: "b", color: "Red" },
      { text: "The one who organizes and solves problems", value: "c", color: "Green" },
      { text: "The one who brings fresh ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 6,
    text: "When given a new assignment, I prefer to…",
    section: "Leadership & Initiative",
    options: [
      { text: "Jump right in and start", value: "a", color: "Yellow" },
      { text: "Share my excitement and get others on board", value: "b", color: "Red" },
      { text: "Break it into logical steps", value: "c", color: "Green" },
      { text: "Brainstorm new ways of approaching it", value: "d", color: "Blue" },
    ],
  },
  {
    id: 7,
    text: "In leadership, I value most…",
    section: "Leadership & Initiative",
    options: [
      { text: "Speed and efficiency", value: "a", color: "Yellow" },
      { text: "Passion and vision", value: "b", color: "Red" },
      { text: "Structure and order", value: "c", color: "Green" },
      { text: "Creativity and innovation", value: "d", color: "Blue" },
    ],
  },
  {
    id: 8,
    text: "If a teammate is stuck, I…",
    section: "Leadership & Initiative",
    options: [
      { text: "Take over to keep things moving", value: "a", color: "Yellow" },
      { text: "Motivate them and remind them of the bigger picture", value: "b", color: "Red" },
      { text: "Walk them through logical steps", value: "c", color: "Green" },
      { text: "Suggest new angles to try", value: "d", color: "Blue" },
    ],
  },
  {
    id: 9,
    text: "The best leaders…",
    section: "Leadership & Initiative",
    options: [
      { text: "Drive execution and results", value: "a", color: "Yellow" },
      { text: "Inspire and connect with people", value: "b", color: "Red" },
      { text: "Think analytically and structure clearly", value: "c", color: "Green" },
      { text: "Envision and innovate for the future", value: "d", color: "Blue" },
    ],
  },
  {
    id: 10,
    text: "My natural instinct is to…",
    section: "Leadership & Initiative",
    options: [
      { text: "Act first and figure things out along the way", value: "a", color: "Yellow" },
      { text: "Share a vision and bring people together", value: "b", color: "Red" },
      { text: "Carefully analyze before moving forward", value: "c", color: "Green" },
      { text: "Question assumptions and explore new ideas", value: "d", color: "Blue" },
    ],
  },

  // Section B: Collaboration & Communication (Q11-Q20)
  {
    id: 11,
    text: "When working in a group, I tend to…",
    section: "Collaboration & Communication",
    options: [
      { text: "Push the team to take action quickly", value: "a", color: "Yellow" },
      { text: "Energize and encourage everyone", value: "b", color: "Red" },
      { text: "Keep things organized and structured", value: "c", color: "Green" },
      { text: "Suggest creative approaches to improve the work", value: "d", color: "Blue" },
    ],
  },
  {
    id: 12,
    text: "During group discussions, I…",
    section: "Collaboration & Communication",
    options: [
      { text: "Move things toward decisions", value: "a", color: "Yellow" },
      { text: "Make sure everyone feels heard", value: "b", color: "Red" },
      { text: "Focus on clarifying details", value: "c", color: "Green" },
      { text: "Ask questions that open new possibilities", value: "d", color: "Blue" },
    ],
  },
  {
    id: 13,
    text: "If conflict arises, I…",
    section: "Collaboration & Communication",
    options: [
      { text: "Push the group to resolve it fast", value: "a", color: "Yellow" },
      { text: "Use words to motivate reconciliation", value: "b", color: "Red" },
      { text: "Analyze both sides logically", value: "c", color: "Green" },
      { text: "Suggest an alternative idea everyone can rally around", value: "d", color: "Blue" },
    ],
  },
  {
    id: 14,
    text: "I contribute best when…",
    section: "Collaboration & Communication",
    options: [
      { text: "I'm driving progress", value: "a", color: "Yellow" },
      { text: "I'm inspiring people", value: "b", color: "Red" },
      { text: "I'm problem-solving logically", value: "c", color: "Green" },
      { text: "I'm creating new ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 15,
    text: "People count on me to…",
    section: "Collaboration & Communication",
    options: [
      { text: "Get things done under pressure", value: "a", color: "Yellow" },
      { text: "Lift spirits and bring energy", value: "b", color: "Red" },
      { text: "Keep things accurate and organized", value: "c", color: "Green" },
      { text: "Spot opportunities no one else sees", value: "d", color: "Blue" },
    ],
  },
  {
    id: 16,
    text: "My style of communication is…",
    section: "Collaboration & Communication",
    options: [
      { text: "Direct and action-focused", value: "a", color: "Yellow" },
      { text: "Inspiring and expressive", value: "b", color: "Red" },
      { text: "Clear and detail-oriented", value: "c", color: "Green" },
      { text: "Conceptual and visionary", value: "d", color: "Blue" },
    ],
  },
  {
    id: 17,
    text: "I dislike when teammates…",
    section: "Collaboration & Communication",
    options: [
      { text: "Waste time without acting", value: "a", color: "Yellow" },
      { text: "Lack enthusiasm", value: "b", color: "Red" },
      { text: "Skip over details", value: "c", color: "Green" },
      { text: "Resist new ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 18,
    text: "I usually motivate others by…",
    section: "Collaboration & Communication",
    options: [
      { text: "Showing results and progress", value: "a", color: "Yellow" },
      { text: "Using passion and vision", value: "b", color: "Red" },
      { text: "Explaining logic and structure", value: "c", color: "Green" },
      { text: "Sharing bold new ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 19,
    text: "In a group presentation, I'd rather…",
    section: "Collaboration & Communication",
    options: [
      { text: "Present clear actions and results", value: "a", color: "Yellow" },
      { text: "Tell the story and inspire the audience", value: "b", color: "Red" },
      { text: "Explain data and logic behind the work", value: "c", color: "Green" },
      { text: "Share the innovative, creative elements", value: "d", color: "Blue" },
    ],
  },
  {
    id: 20,
    text: "My group role is often…",
    section: "Collaboration & Communication",
    options: [
      { text: "The driver", value: "a", color: "Yellow" },
      { text: "The motivator", value: "b", color: "Red" },
      { text: "The organizer", value: "c", color: "Green" },
      { text: "The idea generator", value: "d", color: "Blue" },
    ],
  },

  // Section C: Problem-Solving & Decision-Making (Q21-Q30)
  {
    id: 21,
    text: "Faced with a tough decision, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Choose quickly and take action", value: "a", color: "Yellow" },
      { text: "Consider how it inspires or affects others", value: "b", color: "Red" },
      { text: "Analyze carefully and choose logically", value: "c", color: "Green" },
      { text: "Brainstorm new solutions before deciding", value: "d", color: "Blue" },
    ],
  },
  {
    id: 22,
    text: "When given little time to solve a problem…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Act immediately and adapt later", value: "a", color: "Yellow" },
      { text: "Encourage the team to stay positive", value: "b", color: "Red" },
      { text: "Break it into smaller, logical pieces", value: "c", color: "Green" },
      { text: "Try to reframe the challenge creatively", value: "d", color: "Blue" },
    ],
  },
  {
    id: 23,
    text: "I trust my decisions most when…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "I see action happening fast", value: "a", color: "Yellow" },
      { text: "Others feel inspired", value: "b", color: "Red" },
      { text: "The data and logic back it up", value: "c", color: "Green" },
      { text: "It feels innovative and future-oriented", value: "d", color: "Blue" },
    ],
  },
  {
    id: 24,
    text: "My biggest strength in solving problems is…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Speed and determination", value: "a", color: "Yellow" },
      { text: "Motivation and energy", value: "b", color: "Red" },
      { text: "Logic and analysis", value: "c", color: "Green" },
      { text: "Creativity and originality", value: "d", color: "Blue" },
    ],
  },
  {
    id: 25,
    text: "If I make a mistake…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "I move quickly to fix it", value: "a", color: "Yellow" },
      { text: "I stay positive and reassure others", value: "b", color: "Red" },
      { text: "I analyze what went wrong carefully", value: "c", color: "Green" },
      { text: "I try a totally different approach", value: "d", color: "Blue" },
    ],
  },
  {
    id: 26,
    text: "I prefer instructions that are…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Short and actionable", value: "a", color: "Yellow" },
      { text: "Inspiring and motivating", value: "b", color: "Red" },
      { text: "Detailed and structured", value: "c", color: "Green" },
      { text: "Open-ended and flexible", value: "d", color: "Blue" },
    ],
  },
  {
    id: 27,
    text: "I define success as…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Achieving results quickly", value: "a", color: "Yellow" },
      { text: "Inspiring and energizing people", value: "b", color: "Red" },
      { text: "Solving problems effectively", value: "c", color: "Green" },
      { text: "Creating something innovative", value: "d", color: "Blue" },
    ],
  },
  {
    id: 28,
    text: "In a debate, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Push for a decision fast", value: "a", color: "Yellow" },
      { text: "Persuade with passion and stories", value: "b", color: "Red" },
      { text: "Use facts and logic", value: "c", color: "Green" },
      { text: "Offer new perspectives and ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 29,
    text: "My first step in solving problems is…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Jump into action", value: "a", color: "Yellow" },
      { text: "Rally others with vision", value: "b", color: "Red" },
      { text: "Break down details logically", value: "c", color: "Green" },
      { text: "Explore creative alternatives", value: "d", color: "Blue" },
    ],
  },
  {
    id: 30,
    text: "If my solution doesn't work…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "I immediately try something else", value: "a", color: "Yellow" },
      { text: "I encourage others not to give up", value: "b", color: "Red" },
      { text: "I reanalyze step by step", value: "c", color: "Green" },
      { text: "I redesign the idea in a new way", value: "d", color: "Blue" },
    ],
  },

  // Section D: Adaptability & Creativity (Q31-Q40)
  {
    id: 31,
    text: "I handle sudden changes by…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Acting fast to keep things moving", value: "a", color: "Yellow" },
      { text: "Motivating others to stay upbeat", value: "b", color: "Red" },
      { text: "Adjusting my plan logically", value: "c", color: "Green" },
      { text: "Rethinking everything with a fresh idea", value: "d", color: "Blue" },
    ],
  },
  {
    id: 32,
    text: "I learn best when…",
    section: "Adaptability & Creativity",
    options: [
      { text: "I can immediately apply it", value: "a", color: "Yellow" },
      { text: "It connects to something inspiring", value: "b", color: "Red" },
      { text: "It's explained step by step", value: "c", color: "Green" },
      { text: "It's open for me to explore creatively", value: "d", color: "Blue" },
    ],
  },
  {
    id: 33,
    text: "If I had free time, I'd rather…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Build something useful", value: "a", color: "Yellow" },
      { text: "Share ideas or stories with others", value: "b", color: "Red" },
      { text: "Research or analyze something interesting", value: "c", color: "Green" },
      { text: "Experiment with a new creative project", value: "d", color: "Blue" },
    ],
  },
  {
    id: 34,
    text: "I stay motivated when…",
    section: "Adaptability & Creativity",
    options: [
      { text: "I see quick progress", value: "a", color: "Yellow" },
      { text: "People around me are energized", value: "b", color: "Red" },
      { text: "The work is logical and structured", value: "c", color: "Green" },
      { text: "I get to experiment and innovate", value: "d", color: "Blue" },
    ],
  },
  {
    id: 35,
    text: "My adaptability comes from…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Taking fast action no matter what", value: "a", color: "Yellow" },
      { text: "Staying positive and inspiring others", value: "b", color: "Red" },
      { text: "Carefully adjusting step by step", value: "c", color: "Green" },
      { text: "Redesigning new approaches creatively", value: "d", color: "Blue" },
    ],
  },
  {
    id: 36,
    text: "When trying new things, I…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Jump in and figure it out as I go", value: "a", color: "Yellow" },
      { text: "Look for inspiration and share enthusiasm", value: "b", color: "Red" },
      { text: "Research carefully before starting", value: "c", color: "Green" },
      { text: "Try unconventional ways just to see what happens", value: "d", color: "Blue" },
    ],
  },
  {
    id: 37,
    text: "I'm most energized by…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Action and momentum", value: "a", color: "Yellow" },
      { text: "Vision and excitement", value: "b", color: "Red" },
      { text: "Order and clarity", value: "c", color: "Green" },
      { text: "Creativity and imagination", value: "d", color: "Blue" },
    ],
  },
  {
    id: 38,
    text: "If my plan is interrupted, I…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Push ahead with a new action immediately", value: "a", color: "Yellow" },
      { text: "Motivate others to stay flexible", value: "b", color: "Red" },
      { text: "Re-plan with structure", value: "c", color: "Green" },
      { text: "Pivot into a creative new path", value: "d", color: "Blue" },
    ],
  },
  {
    id: 39,
    text: "I enjoy projects that are…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Fast-paced and goal-driven", value: "a", color: "Yellow" },
      { text: "Energizing and people-focused", value: "b", color: "Red" },
      { text: "Structured and logical", value: "c", color: "Green" },
      { text: "Open-ended and innovative", value: "d", color: "Blue" },
    ],
  },
  {
    id: 40,
    text: "I thrive when I can…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Take decisive action", value: "a", color: "Yellow" },
      { text: "Share vision and passion", value: "b", color: "Red" },
      { text: "Think critically and logically", value: "c", color: "Green" },
      { text: "Create and innovate freely", value: "d", color: "Blue" },
    ],
  },

  // Section E: Self-Awareness & Reflection (Q41-Q50)
  {
    id: 41,
    text: "My biggest strength is…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Taking action quickly", value: "a", color: "Yellow" },
      { text: "Motivating others", value: "b", color: "Red" },
      { text: "Thinking logically", value: "c", color: "Green" },
      { text: "Being creative", value: "d", color: "Blue" },
    ],
  },
  {
    id: 42,
    text: "I get frustrated when…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "People don't act fast enough", value: "a", color: "Yellow" },
      { text: "Others lack enthusiasm", value: "b", color: "Red" },
      { text: "Things are unclear or disorganized", value: "c", color: "Green" },
      { text: "New ideas are shut down", value: "d", color: "Blue" },
    ],
  },
  {
    id: 43,
    text: "I measure my growth by…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "What I've accomplished", value: "a", color: "Yellow" },
      { text: "How many people I've inspired", value: "b", color: "Red" },
      { text: "What I've learned and understood", value: "c", color: "Green" },
      { text: "What I've created or innovated", value: "d", color: "Blue" },
    ],
  },
  {
    id: 44,
    text: "My natural leadership style is…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Action-oriented", value: "a", color: "Yellow" },
      { text: "Visionary and motivational", value: "b", color: "Red" },
      { text: "Structured and logical", value: "c", color: "Green" },
      { text: "Creative and future-focused", value: "d", color: "Blue" },
    ],
  },
  {
    id: 45,
    text: "I gain energy from…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Achieving goals", value: "a", color: "Yellow" },
      { text: "Sharing vision with others", value: "b", color: "Red" },
      { text: "Solving puzzles and analyzing", value: "c", color: "Green" },
      { text: "Imagining new possibilities", value: "d", color: "Blue" },
    ],
  },
  {
    id: 46,
    text: "The hardest thing for me is…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Waiting without acting", value: "a", color: "Yellow" },
      { text: "Working without inspiration", value: "b", color: "Red" },
      { text: "Operating without clear data", value: "c", color: "Green" },
      { text: "Following rigid rules", value: "d", color: "Blue" },
    ],
  },
  {
    id: 47,
    text: "My proudest moments come when…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "I achieve something significant", value: "a", color: "Yellow" },
      { text: "I inspire or lead others", value: "b", color: "Red" },
      { text: "I solve a complex problem", value: "c", color: "Green" },
      { text: "I create something unique", value: "d", color: "Blue" },
    ],
  },
  {
    id: 48,
    text: "People usually notice that I…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Move quickly into action", value: "a", color: "Yellow" },
      { text: "Motivate and energize others", value: "b", color: "Red" },
      { text: "Think carefully and logically", value: "c", color: "Green" },
      { text: "Bring creative ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 49,
    text: "My preferred role in a team is…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Driving execution", value: "a", color: "Yellow" },
      { text: "Inspiring and connecting people", value: "b", color: "Red" },
      { text: "Organizing and analyzing", value: "c", color: "Green" },
      { text: "Innovating and ideating", value: "d", color: "Blue" },
    ],
  },
  {
    id: 50,
    text: "Ultimately, I want to be known as…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "A doer who gets results", value: "a", color: "Yellow" },
      { text: "A motivator who uplifts others", value: "b", color: "Red" },
      { text: "A thinker who solves problems", value: "c", color: "Green" },
      { text: "A creator who innovates", value: "d", color: "Blue" },
    ],
  },
];

const STUDENT_25_QUESTIONS: Question[] = [
  // Section A: Leadership & Initiative (Q1-Q5)
  {
    id: 1,
    text: "When starting a group project, I usually…",
    section: "Leadership & Initiative",
    options: [
      { text: "Jump in and assign roles", value: "a", color: "Yellow" },
      { text: "Share a vision or inspiring idea", value: "b", color: "Red" },
      { text: "Plan the process step by step", value: "c", color: "Green" },
      { text: "Suggest new, creative approaches", value: "d", color: "Blue" },
    ],
  },
  {
    id: 2,
    text: "I feel best when I…",
    section: "Leadership & Initiative",
    options: [
      { text: "See fast results", value: "a", color: "Yellow" },
      { text: "Inspire others to take part", value: "b", color: "Red" },
      { text: "Solve problems with logic", value: "c", color: "Green" },
      { text: "Come up with unique ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 3,
    text: "If no one leads, I…",
    section: "Leadership & Initiative",
    options: [
      { text: "Take control immediately", value: "a", color: "Yellow" },
      { text: "Motivate someone else to step up", value: "b", color: "Red" },
      { text: "Create structure for the group", value: "c", color: "Green" },
      { text: "Pitch a new direction to get moving", value: "d", color: "Blue" },
    ],
  },
  {
    id: 4,
    text: "In stressful situations, I…",
    section: "Leadership & Initiative",
    options: [
      { text: "Push forward with action", value: "a", color: "Yellow" },
      { text: "Keep others positive", value: "b", color: "Red" },
      { text: "Slow down to analyze carefully", value: "c", color: "Green" },
      { text: "Reframe with a fresh idea", value: "d", color: "Blue" },
    ],
  },
  {
    id: 5,
    text: "The best leaders…",
    section: "Leadership & Initiative",
    options: [
      { text: "Drive execution and results", value: "a", color: "Yellow" },
      { text: "Inspire and energize people", value: "b", color: "Red" },
      { text: "Think logically and provide clarity", value: "c", color: "Green" },
      { text: "Envision and innovate for the future", value: "d", color: "Blue" },
    ],
  },

  // Section B: Collaboration & Communication (Q6-Q10)
  {
    id: 6,
    text: "In group discussions, I…",
    section: "Collaboration & Communication",
    options: [
      { text: "Push for a decision", value: "a", color: "Yellow" },
      { text: "Make sure everyone feels heard", value: "b", color: "Red" },
      { text: "Clarify details and structure", value: "c", color: "Green" },
      { text: 'Ask creative, "what if" questions', value: "d", color: "Blue" },
    ],
  },
  {
    id: 7,
    text: "People count on me to…",
    section: "Collaboration & Communication",
    options: [
      { text: "Get things done under pressure", value: "a", color: "Yellow" },
      { text: "Bring energy and enthusiasm", value: "b", color: "Red" },
      { text: "Keep things organized and clear", value: "c", color: "Green" },
      { text: "Spot new opportunities", value: "d", color: "Blue" },
    ],
  },
  {
    id: 8,
    text: "My style of communication is…",
    section: "Collaboration & Communication",
    options: [
      { text: "Direct and action-oriented", value: "a", color: "Yellow" },
      { text: "Inspiring and expressive", value: "b", color: "Red" },
      { text: "Clear and logical", value: "c", color: "Green" },
      { text: "Creative and forward-looking", value: "d", color: "Blue" },
    ],
  },
  {
    id: 9,
    text: "I usually motivate others by…",
    section: "Collaboration & Communication",
    options: [
      { text: "Showing progress and results", value: "a", color: "Yellow" },
      { text: "Sharing vision and passion", value: "b", color: "Red" },
      { text: "Explaining with facts and logic", value: "c", color: "Green" },
      { text: "Introducing bold, new ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 10,
    text: "In a group project, my role is often…",
    section: "Collaboration & Communication",
    options: [
      { text: "The driver", value: "a", color: "Yellow" },
      { text: "The motivator", value: "b", color: "Red" },
      { text: "The organizer", value: "c", color: "Green" },
      { text: "The idea generator", value: "d", color: "Blue" },
    ],
  },

  // Section C: Problem-Solving & Decision-Making (Q11-Q15)
  {
    id: 11,
    text: "When faced with a tough decision, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Act quickly", value: "a", color: "Yellow" },
      { text: "Think about how it affects others", value: "b", color: "Red" },
      { text: "Analyze logically", value: "c", color: "Green" },
      { text: "Brainstorm alternatives", value: "d", color: "Blue" },
    ],
  },
  {
    id: 12,
    text: "My strength in solving problems is…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Speed and determination", value: "a", color: "Yellow" },
      { text: "Energy and optimism", value: "b", color: "Red" },
      { text: "Logic and analysis", value: "c", color: "Green" },
      { text: "Creativity and originality", value: "d", color: "Blue" },
    ],
  },
  {
    id: 13,
    text: "I prefer instructions that are…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Short and actionable", value: "a", color: "Yellow" },
      { text: "Inspiring and motivating", value: "b", color: "Red" },
      { text: "Detailed and structured", value: "c", color: "Green" },
      { text: "Open-ended and flexible", value: "d", color: "Blue" },
    ],
  },
  {
    id: 14,
    text: "In a debate, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Push for quick resolution", value: "a", color: "Yellow" },
      { text: "Persuade with passion", value: "b", color: "Red" },
      { text: "Use facts and logic", value: "c", color: "Green" },
      { text: "Share new perspectives", value: "d", color: "Blue" },
    ],
  },
  {
    id: 15,
    text: "If my solution doesn't work, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Try something else immediately", value: "a", color: "Yellow" },
      { text: "Encourage others not to give up", value: "b", color: "Red" },
      { text: "Reanalyze step by step", value: "c", color: "Green" },
      { text: "Redesign it in a new way", value: "d", color: "Blue" },
    ],
  },

  // Section D: Adaptability & Creativity (Q16-Q20)
  {
    id: 16,
    text: "I handle sudden changes by…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Acting fast to adjust", value: "a", color: "Yellow" },
      { text: "Motivating others to stay positive", value: "b", color: "Red" },
      { text: "Re-planning logically", value: "c", color: "Green" },
      { text: "Rethinking creatively", value: "d", color: "Blue" },
    ],
  },
  {
    id: 17,
    text: "I learn best when…",
    section: "Adaptability & Creativity",
    options: [
      { text: "I can apply it right away", value: "a", color: "Yellow" },
      { text: "It connects to inspiration or people", value: "b", color: "Red" },
      { text: "It's explained step by step", value: "c", color: "Green" },
      { text: "It allows me to explore freely", value: "d", color: "Blue" },
    ],
  },
  {
    id: 18,
    text: "Free time is best spent…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Building something useful", value: "a", color: "Yellow" },
      { text: "Sharing ideas and connecting", value: "b", color: "Red" },
      { text: "Researching or analyzing", value: "c", color: "Green" },
      { text: "Experimenting with creativity", value: "d", color: "Blue" },
    ],
  },
  {
    id: 19,
    text: "I stay motivated when…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Progress is visible", value: "a", color: "Yellow" },
      { text: "Energy is high around me", value: "b", color: "Red" },
      { text: "The work is structured", value: "c", color: "Green" },
      { text: "I can innovate", value: "d", color: "Blue" },
    ],
  },
  {
    id: 20,
    text: "I thrive when I can…",
    section: "Adaptability & Creativity",
    options: [
      { text: "Take decisive action", value: "a", color: "Yellow" },
      { text: "Share vision and passion", value: "b", color: "Red" },
      { text: "Solve problems logically", value: "c", color: "Green" },
      { text: "Create and innovate freely", value: "d", color: "Blue" },
    ],
  },

  // Section E: Self-Awareness & Reflection (Q21-Q25)
  {
    id: 21,
    text: "My biggest strength is…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Taking action", value: "a", color: "Yellow" },
      { text: "Motivating others", value: "b", color: "Red" },
      { text: "Thinking logically", value: "c", color: "Green" },
      { text: "Being creative", value: "d", color: "Blue" },
    ],
  },
  {
    id: 22,
    text: "I get frustrated when…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Things move too slowly", value: "a", color: "Yellow" },
      { text: "People lack enthusiasm", value: "b", color: "Red" },
      { text: "Work is disorganized", value: "c", color: "Green" },
      { text: "Ideas are shut down", value: "d", color: "Blue" },
    ],
  },
  {
    id: 23,
    text: "I measure growth by…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "What I've accomplished", value: "a", color: "Yellow" },
      { text: "How I've inspired others", value: "b", color: "Red" },
      { text: "What I've learned", value: "c", color: "Green" },
      { text: "What I've created", value: "d", color: "Blue" },
    ],
  },
  {
    id: 24,
    text: "People usually notice that I…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Act quickly", value: "a", color: "Yellow" },
      { text: "Energize others", value: "b", color: "Red" },
      { text: "Think carefully", value: "c", color: "Green" },
      { text: "Offer creative ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 25,
    text: "Ultimately, I want to be known as…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "A doer who achieves results", value: "a", color: "Yellow" },
      { text: "A motivator who uplifts others", value: "b", color: "Red" },
      { text: "A thinker who solves problems", value: "c", color: "Green" },
      { text: "A creator who innovates", value: "d", color: "Blue" },
    ],
  },
];

const TEACHER_25_QUESTIONS: Question[] = [
  // Section A (Q1-Q5)
  {
    id: 1,
    text: "When starting a new lesson, I usually…",
    section: "Teaching & Classroom Leadership",
    options: [
      { text: "Jump into teaching right away with clear tasks", value: "a", color: "Yellow" },
      { text: "Connect it to a bigger idea or story to inspire students", value: "b", color: "Red" },
      { text: "Lay out the structure and steps carefully", value: "c", color: "Green" },
      { text: "Design a creative or hands-on activity to launch it", value: "d", color: "Blue" },
    ],
  },
  {
    id: 2,
    text: "My classroom works best when…",
    section: "Teaching & Classroom Leadership",
    options: [
      { text: "Clear routines keep things moving", value: "a", color: "Yellow" },
      { text: "Students feel motivated and energized", value: "b", color: "Red" },
      { text: "Content is organized logically", value: "c", color: "Green" },
      { text: "Curiosity and creativity are encouraged", value: "d", color: "Blue" },
    ],
  },
  {
    id: 3,
    text: "When students are distracted, I…",
    section: "Teaching & Classroom Leadership",
    options: [
      { text: "Redirect quickly to keep things on track", value: "a", color: "Yellow" },
      { text: "Re-engage with encouragement and energy", value: "b", color: "Red" },
      { text: "Reset expectations clearly", value: "c", color: "Green" },
      { text: "Change the activity to something fresh", value: "d", color: "Blue" },
    ],
  },
  {
    id: 4,
    text: "I feel proud as a teacher when…",
    section: "Teaching & Classroom Leadership",
    options: [
      { text: "My students achieve results", value: "a", color: "Yellow" },
      { text: "My students feel inspired", value: "b", color: "Red" },
      { text: "My students master a concept step by step", value: "c", color: "Green" },
      { text: "My students discover something new", value: "d", color: "Blue" },
    ],
  },
  {
    id: 5,
    text: "Students usually see me as…",
    section: "Teaching & Classroom Leadership",
    options: [
      { text: "The one who gets things done", value: "a", color: "Yellow" },
      { text: "The one who inspires them", value: "b", color: "Red" },
      { text: "The one who keeps class organized", value: "c", color: "Green" },
      { text: "The one who makes learning fun and creative", value: "d", color: "Blue" },
    ],
  },
  // Section B (Q6-Q10)
  {
    id: 6,
    text: "In staff meetings, I usually…",
    section: "Collaboration & School Culture",
    options: [
      { text: "Push toward action and decisions", value: "a", color: "Yellow" },
      { text: "Encourage and motivate the team", value: "b", color: "Red" },
      { text: "Clarify details and structure", value: "c", color: "Green" },
      { text: "Suggest new approaches", value: "d", color: "Blue" },
    ],
  },
  {
    id: 7,
    text: "Colleagues rely on me to…",
    section: "Collaboration & School Culture",
    options: [
      { text: "Get projects done", value: "a", color: "Yellow" },
      { text: "Boost morale and energy", value: "b", color: "Red" },
      { text: "Keep things organized", value: "c", color: "Green" },
      { text: "Bring fresh ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 8,
    text: "My communication style is…",
    section: "Collaboration & School Culture",
    options: [
      { text: "Direct and action-focused", value: "a", color: "Yellow" },
      { text: "Expressive and inspiring", value: "b", color: "Red" },
      { text: "Clear and logical", value: "c", color: "Green" },
      { text: "Creative and visionary", value: "d", color: "Blue" },
    ],
  },
  {
    id: 9,
    text: "I get frustrated when…",
    section: "Collaboration & School Culture",
    options: [
      { text: "Things move too slowly", value: "a", color: "Yellow" },
      { text: "People seem unmotivated", value: "b", color: "Red" },
      { text: "Plans are unclear or sloppy", value: "c", color: "Green" },
      { text: "Innovation is blocked", value: "d", color: "Blue" },
    ],
  },
  {
    id: 10,
    text: "I contribute to school culture most by…",
    section: "Collaboration & School Culture",
    options: [
      { text: "Driving results and follow-through", value: "a", color: "Yellow" },
      { text: "Building positive energy in the community", value: "b", color: "Red" },
      { text: "Maintaining order and systems", value: "c", color: "Green" },
      { text: "Encouraging creativity and change", value: "d", color: "Blue" },
    ],
  },
  // Section C (Q11-Q15)
  {
    id: 11,
    text: "When classroom problems arise, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Act quickly to resolve them", value: "a", color: "Yellow" },
      { text: "Encourage students with positivity", value: "b", color: "Red" },
      { text: "Break down the issue logically", value: "c", color: "Green" },
      { text: "Reframe the problem creatively", value: "d", color: "Blue" },
    ],
  },
  {
    id: 12,
    text: "I trust my decisions most when…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "They lead to fast results", value: "a", color: "Yellow" },
      { text: "They inspire others", value: "b", color: "Red" },
      { text: "They are backed by data or logic", value: "c", color: "Green" },
      { text: "They create innovative outcomes", value: "d", color: "Blue" },
    ],
  },
  {
    id: 13,
    text: "My problem-solving strength is…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Determination and speed", value: "a", color: "Yellow" },
      { text: "Motivation and enthusiasm", value: "b", color: "Red" },
      { text: "Careful analysis", value: "c", color: "Green" },
      { text: "Out-of-the-box thinking", value: "d", color: "Blue" },
    ],
  },
  {
    id: 14,
    text: "In debates, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Push toward resolution quickly", value: "a", color: "Yellow" },
      { text: "Persuade with passion and stories", value: "b", color: "Red" },
      { text: "Use facts and logical reasoning", value: "c", color: "Green" },
      { text: "Share new perspectives and ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 15,
    text: "If my first plan doesn't work, I…",
    section: "Problem-Solving & Decision-Making",
    options: [
      { text: "Try another approach right away", value: "a", color: "Yellow" },
      { text: "Keep others motivated to continue", value: "b", color: "Red" },
      { text: "Reanalyze step by step", value: "c", color: "Green" },
      { text: "Redesign with a creative twist", value: "d", color: "Blue" },
    ],
  },
  // Section D (Q16-Q20)
  {
    id: 16,
    text: "When curriculum changes happen, I…",
    section: "Adaptability & Innovation",
    options: [
      { text: "Adjust quickly and keep moving", value: "a", color: "Yellow" },
      { text: "Stay positive and help others adapt", value: "b", color: "Red" },
      { text: "Rework plans logically", value: "c", color: "Green" },
      { text: "Try out creative alternatives", value: "d", color: "Blue" },
    ],
  },
  {
    id: 17,
    text: "I learn best when…",
    section: "Adaptability & Innovation",
    options: [
      { text: "I can apply it right away", value: "a", color: "Yellow" },
      { text: "It connects to inspiring ideas", value: "b", color: "Red" },
      { text: "It's structured step by step", value: "c", color: "Green" },
      { text: "It's open for experimentation", value: "d", color: "Blue" },
    ],
  },
  {
    id: 18,
    text: "I'm most energized when…",
    section: "Adaptability & Innovation",
    options: [
      { text: "Things are moving into action", value: "a", color: "Yellow" },
      { text: "People around me are motivated", value: "b", color: "Red" },
      { text: "Work is structured and clear", value: "c", color: "Green" },
      { text: "There's room for creativity", value: "d", color: "Blue" },
    ],
  },
  {
    id: 19,
    text: "If my plan is interrupted, I…",
    section: "Adaptability & Innovation",
    options: [
      { text: "Act quickly with a backup", value: "a", color: "Yellow" },
      { text: "Keep others encouraged", value: "b", color: "Red" },
      { text: "Re-plan step by step", value: "c", color: "Green" },
      { text: "Pivot to a new creative idea", value: "d", color: "Blue" },
    ],
  },
  {
    id: 20,
    text: "The teaching projects I enjoy most are…",
    section: "Adaptability & Innovation",
    options: [
      { text: "Fast-paced and goal-oriented", value: "a", color: "Yellow" },
      { text: "Energizing and people-focused", value: "b", color: "Red" },
      { text: "Structured and methodical", value: "c", color: "Green" },
      { text: "Open-ended and innovative", value: "d", color: "Blue" },
    ],
  },
  // Section E (Q21-Q25)
  {
    id: 21,
    text: "My biggest teaching strength is…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Taking action and execution", value: "a", color: "Yellow" },
      { text: "Inspiring and motivating students", value: "b", color: "Red" },
      { text: "Organizing and structuring content", value: "c", color: "Green" },
      { text: "Creating engaging, innovative lessons", value: "d", color: "Blue" },
    ],
  },
  {
    id: 22,
    text: "I measure my growth by…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "What I've accomplished with students", value: "a", color: "Yellow" },
      { text: "How many I've inspired", value: "b", color: "Red" },
      { text: "What I've structured and clarified", value: "c", color: "Green" },
      { text: "What I've created or innovated", value: "d", color: "Blue" },
    ],
  },
  {
    id: 23,
    text: "The hardest thing for me is…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Waiting without acting", value: "a", color: "Yellow" },
      { text: "Working without inspiration", value: "b", color: "Red" },
      { text: "Operating without structure", value: "c", color: "Green" },
      { text: "Following rigid rules", value: "d", color: "Blue" },
    ],
  },
  {
    id: 24,
    text: "My colleagues usually notice that I…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "Move things into action", value: "a", color: "Yellow" },
      { text: "Motivate and energize others", value: "b", color: "Red" },
      { text: "Keep things organized", value: "c", color: "Green" },
      { text: "Share creative ideas", value: "d", color: "Blue" },
    ],
  },
  {
    id: 25,
    text: "Ultimately, I want to be known as…",
    section: "Self-Awareness & Reflection",
    options: [
      { text: "A teacher who gets results", value: "a", color: "Yellow" },
      { text: "A teacher who inspires others", value: "b", color: "Red" },
      { text: "A teacher who brings structure and clarity", value: "c", color: "Green" },
      { text: "A teacher who sparks creativity", value: "d", color: "Blue" },
    ],
  },
];

const TEACHER_50_QUESTIONS: Question[] = STUDENT_50_QUESTIONS.map((q, idx) => {
  // Map student questions to teacher equivalents - simplified version
  // In production, these would be the actual 50 teacher questions
  const teacherQuestionText = q.text
    .replace(/group project/gi, "lesson")
    .replace(/group work/gi, "classroom")
    .replace(/teammates/gi, "colleagues")
    .replace(/group/gi, "class");

  return {
    id: q.id,
    text: teacherQuestionText,
    section: q.section,
    options: q.options,
  };
});

// Shuffle array utility function
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Randomize question options while preserving color mapping
const randomizeQuestionOptions = (questions: Question[]): Question[] => {
  return questions.map((q) => ({
    ...q,
    options: shuffleArray(q.options),
  }));
};

const LeadershipAssessment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [assessmentType, setAssessmentType] = useState<AssessmentType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [randomizedQuestions, setRandomizedQuestions] = useState<Question[]>([]);

  // Access control - change this code to your own secret
  const ACCESS_CODE = "demo2025";
  const SESSION_KEY = "leadership_demo_access";

  useEffect(() => {
    // Check if access is already granted in session
    const sessionAccess = sessionStorage.getItem(SESSION_KEY);

    if (sessionAccess === "granted") {
      setHasAccess(true);
      setIsCheckingAccess(false);
      return;
    }

    // Check URL parameter
    const accessParam = searchParams.get("access");

    if (accessParam === ACCESS_CODE) {
      sessionStorage.setItem(SESSION_KEY, "granted");
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }

    setIsCheckingAccess(false);
  }, [searchParams]);

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if no valid code
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Access Required</CardTitle>
            <CardDescription>This assessment is private and requires an access link.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Please request the access link from your administrator to continue.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectType = (type: AssessmentType) => {
    setAssessmentType(type);
    // Randomize options when starting the assessment
    let baseQuestions: Question[];
    switch (type) {
      case "50q-student":
        baseQuestions = STUDENT_50_QUESTIONS;
        break;
      case "50q-teacher":
        baseQuestions = TEACHER_50_QUESTIONS;
        break;
      case "25q-student":
        baseQuestions = STUDENT_25_QUESTIONS;
        break;
      case "25q-teacher":
        baseQuestions = TEACHER_25_QUESTIONS;
        break;
      default:
        baseQuestions = STUDENT_50_QUESTIONS;
    }
    setRandomizedQuestions(randomizeQuestionOptions(baseQuestions));
  };

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    // Navigate to results page with assessment type and answers
    navigate(`/leadership-results/${assessmentType}`, {
      state: { answers },
    });
  };

  // Get question set based on assessment type
  const getBaseQuestions = () => {
    switch (assessmentType) {
      case "50q-student":
        return STUDENT_50_QUESTIONS;
      case "50q-teacher":
        return TEACHER_50_QUESTIONS;
      case "25q-student":
        return STUDENT_25_QUESTIONS;
      case "25q-teacher":
        return TEACHER_25_QUESTIONS;
      default:
        return STUDENT_50_QUESTIONS;
    }
  };

  const questions = randomizedQuestions.length > 0 ? randomizedQuestions : getBaseQuestions();
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Keyboard navigation: 1-4 to select, Enter to submit
  useEffect(() => {
    if (!assessmentType) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentOptions = questions[currentQuestion]?.options;
      if (!currentOptions) return;

      // Number keys 1-4 to select answers
      if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (index < currentOptions.length) {
          handleAnswer(currentOptions[index].value);
        }
      }

      // Enter key to go to next question or submit
      if (e.key === 'Enter' && answers[currentQuestion]) {
        e.preventDefault();
        if (currentQuestion === questions.length - 1) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [assessmentType, currentQuestion, answers, questions]);

  // Type selection screen
  if (!assessmentType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text-primary">RCF Leadership</span> Color Assessment
            </h1>
            <p className="text-xl text-muted-foreground">Select your assessment type to begin</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleSelectType("50q-teacher")}
            >
              <CardHeader>
                <CardTitle>50-Question Teacher Assessment</CardTitle>
                <CardDescription>Comprehensive leadership profile for educators (4-6 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full color profile, detailed category breakdown, and extensive growth plan
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg student-assessment-card"
              onClick={() => handleSelectType("50q-student")}
            >
              <CardHeader>
                <CardTitle>50-Question Student Assessment</CardTitle>
                <CardDescription>Comprehensive leadership profile for students (3-5 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Color profile for group work with medium-depth analysis</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleSelectType("25q-teacher")}
            >
              <CardHeader>
                <CardTitle>25-Question Teacher Assessment</CardTitle>
                <CardDescription>Quick leadership snapshot for educators (2-3 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Short-form profile with condensed category breakdown</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg student-assessment-card"
              onClick={() => handleSelectType("25q-student")}
            >
              <CardHeader>
                <CardTitle>25-Question Student Assessment</CardTitle>
                <CardDescription>Quick leadership snapshot for students (1.5-2 pages)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Fun and motivating strength snapshot</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Assessment questions screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{questions[currentQuestion].text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={answers[currentQuestion] || ""} onValueChange={handleAnswer}>
              {questions[currentQuestion].options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem value={option.value} id={`option-${option.value}`} />
                  <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentQuestion === questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={!answers[currentQuestion]}>
                  Complete Assessment
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!answers[currentQuestion]}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadershipAssessment;
