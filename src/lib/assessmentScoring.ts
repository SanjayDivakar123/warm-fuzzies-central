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

// Question ranges for each category
const CATEGORY_RANGES_50Q = {
  "Decision-Making": [21, 30],
  "Communication Style": [11, 20],
  "Team Dynamics": [11, 20],
  "Conflict Behavior": [21, 30],
  "Motivation Drivers": [1, 10],
  "Stress Behavior": [31, 40],
  "Collaboration": [11, 20],
  "Self-Management": [41, 50],
};

const CATEGORY_RANGES_25Q = {
  "Decision-Making": [11, 15],
  "Communication Style": [6, 10],
  "Team Dynamics": [6, 10],
  "Conflict Behavior": [11, 15],
  "Motivation Drivers": [1, 5],
  "Stress Behavior": [16, 20],
  "Collaboration": [6, 10],
  "Self-Management": [21, 25],
};

export function calculateResults(
  answers: Record<number, string>, 
  questionColors: Record<number, Record<string, ColorType>>,
  totalQuestions: number = 50
): AssessmentResults {
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

  // Calculate spectrum position based on ordered colors (primary first)
  // The spectrum will be ordered: [primary, secondary, other1, other2]
  // We need to calculate where the user falls on this spectrum
  const allColors: ColorType[] = ['Red', 'Yellow', 'Green', 'Blue'];
  const colorOrder = [primaryColor, secondaryColor];
  const remainingColors = allColors.filter(c => !colorOrder.includes(c));
  const orderedColors = [...colorOrder, ...remainingColors];
  
  // Map each color to its position in the ordered spectrum (0%, 25%, 50%, 75%)
  const positionMap: Partial<Record<ColorType, number>> = {};
  positionMap[orderedColors[0]] = 12.5;  // Center of first quarter
  positionMap[orderedColors[1]] = 37.5;  // Center of second quarter
  positionMap[orderedColors[2]] = 62.5;  // Center of third quarter
  positionMap[orderedColors[3]] = 87.5;  // Center of fourth quarter
  
  // Calculate weighted position based on color scores
  const totalScore = Object.values(colorScores).reduce((sum, score) => sum + score, 0);
  const weightedPosition = Object.entries(colorScores).reduce((sum, [color, score]) => {
    const pos = positionMap[color as ColorType] || 50;
    return sum + (pos * score / totalScore);
  }, 0);
  const spectrumPosition = Math.round(weightedPosition);

  // Calculate category scores based on assessment type
  const categoryRanges = totalQuestions === 25 ? CATEGORY_RANGES_25Q : CATEGORY_RANGES_50Q;
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
  
  Object.entries(categoryRanges).forEach(([category, [start, end]]) => {
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
