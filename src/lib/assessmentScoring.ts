type ColorType = "Yellow" | "Red" | "Green" | "Blue";

interface ColorScores {
  Yellow: number;
  Red: number;
  Green: number;
  Blue: number;
}

interface CategoryScores {
  "Decision-Making": number;
  "Communication Style": number;
  "Team Dynamics": number;
  "Conflict Behavior": number;
  "Motivation Drivers": number;
  "Stress Behavior": number;
  "Collaboration": number;
  "Self-Management": number;
}

export interface AssessmentResults {
  colorScores: ColorScores;
  primaryColor: ColorType;
  secondaryColor: ColorType;
  spectrumPosition: number;
  categoryScores: CategoryScores;
}

// Question ranges for each category (based on 50-question structure)
const CATEGORY_RANGES = {
  "Decision-Making": [21, 30],    // Section C
  "Communication Style": [11, 20], // Section B (first half)
  "Team Dynamics": [11, 20],      // Section B (second half)
  "Conflict Behavior": [21, 30],  // Section C (subset)
  "Motivation Drivers": [1, 10],  // Section A (first half)
  "Stress Behavior": [31, 40],    // Section D
  "Collaboration": [11, 20],      // Section B
  "Self-Management": [41, 50],    // Section E
};

export function calculateResults(answers: Record<number, string>, questionColors: Record<number, Record<string, ColorType>>): AssessmentResults {
  const colorCounts: ColorScores = {
    Yellow: 0,
    Red: 0,
    Green: 0,
    Blue: 0
  };

  // Count color selections from answers
  Object.entries(answers).forEach(([questionId, selectedOption]) => {
    const qId = parseInt(questionId);
    const colorMapping = questionColors[qId];
    if (colorMapping && colorMapping[selectedOption]) {
      const color = colorMapping[selectedOption];
      colorCounts[color]++;
    }
  });

  // Calculate percentages (out of 100)
  const totalAnswers = Object.keys(answers).length;
  const colorScores: ColorScores = {
    Yellow: Math.round((colorCounts.Yellow / totalAnswers) * 100),
    Red: Math.round((colorCounts.Red / totalAnswers) * 100),
    Green: Math.round((colorCounts.Green / totalAnswers) * 100),
    Blue: Math.round((colorCounts.Blue / totalAnswers) * 100),
  };

  // Determine primary and secondary colors
  const sortedColors = Object.entries(colorScores)
    .sort(([, a], [, b]) => b - a) as [ColorType, number][];
  
  const primaryColor = sortedColors[0][0];
  const secondaryColor = sortedColors[1][0];

  // Calculate spectrum position (0-100 scale)
  // Map colors to spectrum: Red=0, Yellow=25, Green=50, Blue=75
  const colorPositions = { Red: 0, Yellow: 25, Green: 50, Blue: 75 };
  const weightedPosition = Object.entries(colorScores).reduce((sum, [color, score]) => {
    return sum + (colorPositions[color as ColorType] * score / 100);
  }, 0);
  const spectrumPosition = Math.round(weightedPosition);

  // Calculate category scores
  const categoryScores: CategoryScores = {
    "Decision-Making": 0,
    "Communication Style": 0,
    "Team Dynamics": 0,
    "Conflict Behavior": 0,
    "Motivation Drivers": 0,
    "Stress Behavior": 0,
    "Collaboration": 0,
    "Self-Management": 0,
  };

  // For each category, calculate score based on questions in that range
  Object.entries(CATEGORY_RANGES).forEach(([category, [start, end]]) => {
    const categoryAnswers = Object.entries(answers).filter(([qId]) => {
      const id = parseInt(qId);
      return id >= start && id <= end;
    });

    const categoryCounts = { Yellow: 0, Red: 0, Green: 0, Blue: 0 };
    categoryAnswers.forEach(([qId, selectedOption]) => {
      const questionId = parseInt(qId);
      const colorMapping = questionColors[questionId];
      if (colorMapping && colorMapping[selectedOption]) {
        categoryCounts[colorMapping[selectedOption]]++;
      }
    });

    // Dominant color in category determines score
    const maxCount = Math.max(...Object.values(categoryCounts));
    const categoryTotal = categoryAnswers.length;
    categoryScores[category as keyof CategoryScores] = categoryTotal > 0 
      ? Math.round((maxCount / categoryTotal) * 100)
      : 0;
  });

  return {
    colorScores,
    primaryColor,
    secondaryColor,
    spectrumPosition,
    categoryScores,
  };
}
