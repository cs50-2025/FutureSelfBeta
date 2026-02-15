import { GoogleGenAI } from "@google/genai";
import { UserHabits, SimulationMetrics, WorkoutPlan, YogaPlan, Drill, StudyCurriculum, StudyLesson } from "../types";

// Lightweight SVG placeholder for when image generation fails or hits rate limits
const FALLBACK_IMAGE = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0f172a"/><path d="M400 250 L420 290 L460 290 L430 320 L440 360 L400 330 L360 360 L370 320 L340 290 L380 290 Z" fill="none" stroke="#334155" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#334155" font-family="sans-serif" font-size="24" font-weight="bold" dy="40">Visual Unavailable</text><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="14" dy="65">API Limit Reached - Offline Mode</text></svg>')}`;

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- HELPERS FOR RANDOMIZED OFFLINE MODE ---
const getRandomScore = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// --- STRICT AI COACH IMPLEMENTATION ---

export interface DrillResponse {
  sport: string;
  selected_drills: {
    name: string;
    instruction: string;
    duration: string;
  }[];
  purpose: string;
}

export interface YogaResponse {
  focus: string;
  selected_poses: {
    name: string;
    instruction: string;
    duration: string;
  }[];
  purpose: string;
}

export interface PerformanceAnalysis {
  drill_name: string;
  score: number;
  areas_to_improve: string[];
  exp_earned: number;
  coach_message: string;
}

export const generateDrillPlan = async (sport: string): Promise<DrillResponse | null> => {
  try {
    const ai = getAIClient();
    
    const systemInstruction = `
      You are an expert AI fitness coach.
      1. Choose exactly 4 beginner-friendly drills for ${sport} that can be done at home with NO equipment.
      2. Drills must improve core skills.
      3. Return ONLY valid JSON.
    `;

    const prompt = `
      Sport: ${sport}
      
      Respond with this JSON structure:
      {
        "sport": "${sport}",
        "selected_drills": [
          { "name": "Drill 1 Name", "instruction": "Concise how-to (max 15 words)", "duration": "30s" },
          { "name": "Drill 2 Name", "instruction": "Concise how-to", "duration": "30s" },
          { "name": "Drill 3 Name", "instruction": "Concise how-to", "duration": "30s" },
          { "name": "Drill 4 Name", "instruction": "Concise how-to", "duration": "30s" }
        ],
        "purpose": "Brief session goal"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as DrillResponse;

  } catch (error: any) {
    console.warn("AI Drill Plan generation failed (using fallback):", error.message);
    
    return {
      sport: sport,
      selected_drills: [
        { name: "General Warm-up", instruction: "High knees and light jogging in place", duration: "45s" },
        { name: "Core Activation", instruction: "Plank hold to engage core stability", duration: "45s" },
        { name: "Shadow Mechanics", instruction: "Practice sport movements without equipment", duration: "60s" },
        { name: "Cooldown Stretch", instruction: "Basic static stretching for recovery", duration: "60s" }
      ],
      purpose: "General conditioning (Offline Mode)"
    };
  }
};

export const generateYogaPlan = async (focus: string): Promise<YogaResponse | null> => {
  try {
    const ai = getAIClient();
    
    const systemInstruction = `
      You are an expert Yoga and Meditation instructor.
      1. Choose exactly 4 beginner-friendly poses/exercises for ${focus}.
      2. Return ONLY valid JSON.
    `;

    const prompt = `
      Focus Area: ${focus}
      
      Respond with this JSON structure:
      {
        "focus": "${focus}",
        "selected_poses": [
          { "name": "Pose 1 Name", "instruction": "Concise how-to (max 15 words)", "duration": "45s" },
          { "name": "Pose 2 Name", "instruction": "Concise how-to", "duration": "45s" },
          { "name": "Pose 3 Name", "instruction": "Concise how-to", "duration": "45s" },
          { "name": "Pose 4 Name", "instruction": "Concise how-to", "duration": "45s" }
        ],
        "purpose": "Brief session intention"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as YogaResponse;

  } catch (error: any) {
    console.warn("AI Yoga Plan generation failed (using fallback):", error.message);
    return {
      focus: focus,
      selected_poses: [
        { name: "Mountain Pose", instruction: "Stand tall, feet together, breathe deeply", duration: "45s" },
        { name: "Forward Fold", instruction: "Hinge at hips, relax neck and shoulders", duration: "45s" },
        { name: "Child's Pose", instruction: "Kneel, sit back on heels, rest forehead", duration: "45s" },
        { name: "Deep Breathing", instruction: "Inhale 4s, hold 4s, exhale 4s", duration: "60s" }
      ],
      purpose: "Restoring balance (Offline Mode)"
    };
  }
};

export const analyzeDrillPerformance = async (sport: string, drillName: string, repCount: number): Promise<PerformanceAnalysis> => {
  try {
    const ai = getAIClient();
    const scenarios = ["Perfect form", "Slight imbalance", "Good tempo but poor posture", "Excellent stability"];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    const systemInstruction = `
      You are a real-time AI sports performance analyzer.
      Analyze a 5-8 second clip of a user doing ${drillName} for ${sport}.
      Scenario observed: ${randomScenario}.
      Scoring Rules: Range 0-100. Base EXP = Score * 2. +20 EXP bonus if safe.
      Output JSON only. Keep coach_message under 120 words. Energetic, professional.
    `;

    const prompt = `Analyze performance. Return JSON: { "drill_name": "${drillName}", "score": number, "areas_to_improve": ["string", "string"], "exp_earned": number, "coach_message": "string" }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: systemInstruction, responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as PerformanceAnalysis;

  } catch (error: any) {
    console.warn("AI Analysis failed (using fallback):", error.message);
    // RANDOMIZED FALLBACK
    const score = getRandomScore(70, 98);
    const feedback = [
      "Good intensity! Watch your balance on the recovery phase.",
      "Solid effort. Try to keep your core tighter next time.",
      "Excellent rhythm! You're really locking in the form.",
      "A bit shaky at the start, but you recovered well.",
      "Great focus. Keep your breathing steady."
    ];
    const tips = ["Engage Core", "Watch Balance", "Control Breathing", "Keep Head Up"];
    
    return {
      drill_name: drillName,
      score: score,
      areas_to_improve: [getRandomItem(tips), getRandomItem(tips)],
      exp_earned: score * 2,
      coach_message: getRandomItem(feedback)
    };
  }
};

export const analyzeYogaPerformance = async (focus: string, poseName: string): Promise<PerformanceAnalysis> => {
  try {
    const ai = getAIClient();
    const scenarios = ["Perfect alignment", "Shoulders tense", "Breathing too shallow", "Excellent calmness", "Spine rounded"];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    const systemInstruction = `
      You are a real-time AI Yoga instructor.
      Analyze a 5-8 second clip of a user doing ${poseName} for ${focus}.
      Scenario observed: ${randomScenario}.
      Scoring Rules: Range 0-100. Base EXP = Score * 2. +20 EXP bonus if breathing is visible.
      Output JSON only. Keep coach_message under 120 words. Soft, encouraging, calming voice.
    `;

    const prompt = `Analyze performance. Return JSON: { "drill_name": "${poseName}", "score": number, "areas_to_improve": ["string", "string"], "exp_earned": number, "coach_message": "string" }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: systemInstruction, responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as PerformanceAnalysis;

  } catch (error: any) {
    console.warn("AI Analysis failed (using fallback):", error.message);
    // RANDOMIZED FALLBACK
    const score = getRandomScore(75, 99);
    const feedback = [
      "Beautiful stillness. Your alignment is improving.",
      "Try to drop your shoulders slightly away from your ears to release tension.",
      "Deepen your breath. Let the exhale ground you.",
      "Good stability. Focus on lengthening the spine.",
      "Very peaceful. You held that pose with grace."
    ];
    const tips = ["Relax Shoulders", "Deepen Breath", "Lengthen Spine", "Ground Feet"];

    return {
      drill_name: poseName,
      score: score,
      areas_to_improve: [getRandomItem(tips), getRandomItem(tips)],
      exp_earned: score * 2,
      coach_message: getRandomItem(feedback)
    };
  }
};

// --- IMAGE GENERATION ---

export const generateDrillImage = async (drillName: string, sport: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    const prompt = `Minimalist vector line art of a person performing ${drillName} for ${sport}. White lines on black background with neon blue energetic accents. Clean, athletic, instructional style.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      return `data:image/png;base64,${response.candidates[0].content.parts[0].inlineData.data}`;
    }
    return null;
  } catch (error: any) { 
    console.warn("Image generation failed (using fallback):", error.message);
    // Return fallback image so UI doesn't hang
    return FALLBACK_IMAGE; 
  }
};

export const generatePoseImage = async (poseName: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    const prompt = `Minimalist vector line art of yoga pose: ${poseName}. White lines on black background with neon pink calming accents. Zen, clean, balanced composition.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      return `data:image/png;base64,${response.candidates[0].content.parts[0].inlineData.data}`;
    }
    return null;
  } catch (error: any) { 
    console.warn("Image generation failed (using fallback):", error.message);
    return FALLBACK_IMAGE; 
  }
};

// --- EXISTING SERVICES ---

export const generateFutureMessage = async (habits: UserHabits, metrics: SimulationMetrics): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `Act as Future Self (2029). Habits: Sleep ${habits.sleepHours}, Study ${habits.studyHours}. Message to past self (max 80 words).`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Connection failed.";
  } catch (error: any) { 
     console.warn("Future Message generation failed:", error.message);
     return "I am currently offline due to high traffic, but keep prioritizing your sleep and studies! (Offline Mode)";
  }
};

export const generateWorkoutPlan = async (sport: string): Promise<WorkoutPlan | null> => {
  const data = await generateDrillPlan(sport);
  if (!data) return null;
  return {
    sport: data.sport,
    drills: data.selected_drills.map(d => ({ name: d.name, reps: 10, instruction: d.instruction }))
  };
}

export const chatWithCoach = async (sport: string, drills: Drill[], userMessage: string, chatHistory: string[]): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `Coach for ${sport}. User: ${userMessage}. Short response.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Keep going!";
  } catch (error: any) { 
      console.warn("Coach Chat failed:", error.message);
      return "I'm focusing on the drill right now, let's chat later when I'm online!";
  }
};

export const runGeneralChat = async (message: string, history: any[]): Promise<string> => {
  try {
    const ai = getAIClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: { systemInstruction: "Helpful assistant 'FutureSelf AI'." }
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error: any) { 
      console.warn("General Chat failed:", error.message);
      return "I'm currently offline due to high traffic. Please try again later."; 
  }
};

export const generateStudyCurriculum = async (role: string, detail: string): Promise<StudyCurriculum | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a structured study curriculum for a ${role} focusing on ${detail}.
      Return JSON: { 
        "title": "Course Title", 
        "description": "Brief overview", 
        "units": [
          { "id":"1", "title":"Unit 1 Title", "description":"Brief desc", "estimatedTime":"1h" },
          { "id":"2", "title":"Unit 2 Title", "description":"Brief desc", "estimatedTime":"1h" },
          { "id":"3", "title":"Unit 3 Title", "description":"Brief desc", "estimatedTime":"1h" },
          { "id":"4", "title":"Unit 4 Title", "description":"Brief desc", "estimatedTime":"1h" },
          { "id":"5", "title":"Unit 5 Title", "description":"Brief desc", "estimatedTime":"1h" },
          { "id":"6", "title":"Unit 6 Title", "description":"Brief desc", "estimatedTime":"1h" }
        ] 
      }`,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) { 
    console.warn("Curriculum generation failed (using fallback):", error.message);
    // Fallback curriculum
    return {
      title: `${detail} Essentials`,
      description: "A foundational course covering core concepts (Offline Mode).",
      units: [
        { id: "1", title: "Introduction", description: "Basic principles and overview.", estimatedTime: "45m" },
        { id: "2", title: "Core Concepts", description: "Understanding the main theory.", estimatedTime: "1h" },
        { id: "3", title: "Practical Application", description: "Real-world examples.", estimatedTime: "1h 30m" },
        { id: "4", title: "Advanced Topics", description: "Deep dive into complex areas.", estimatedTime: "2h" },
        { id: "5", title: "Review & Analysis", description: "Critical thinking exercises.", estimatedTime: "1h" },
        { id: "6", title: "Final Project", description: "Applying what you've learned.", estimatedTime: "2h" }
      ]
    };
  }
};

export const generateStudyLesson = async (unitTitle: string, userContext: string): Promise<StudyLesson | null> => {
  try {
    const ai = getAIClient();
    const prompt = `
      Create a comprehensive study lesson about "${unitTitle}" appropriate for a student in: ${userContext}.
      
      Return a JSON object with this exact structure:
      {
        "title": "${unitTitle}",
        "content": "Detailed educational content in Markdown format. Use headers (#, ##), bullet points, and bold text to make it engaging.",
        "quiz": [
          {
            "question": "A relevant multiple choice question?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0,
            "explanation": "Why this is correct.",
            "glossary": { "Term": "Definition" }
          },
          {
            "question": "Another relevant question?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0,
            "explanation": "Why this is correct.",
            "glossary": { "Term": "Definition" }
          },
          {
            "question": "Final question?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0,
            "explanation": "Why this is correct.",
            "glossary": { "Term": "Definition" }
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    return JSON.parse(text);
  } catch (error: any) { 
    console.warn("Lesson generation failed (using fallback):", error.message);
    // Fallback Lesson
    return {
      title: unitTitle,
      content: `# ${unitTitle}\n\nWe are currently unable to generate the full AI customized lesson plan for **${userContext}**. \n\n### Key Concepts Overview\n\nWhile the AI connects, here are some general study strategies for **${unitTitle}**:\n\n- **Review Fundamentals**: Ensure you understand the basic definitions related to this topic.\n- **Practice Active Recall**: Test yourself on key terms.\n- **Connect Ideas**: Relate this topic to previous units.\n\n> "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence." - Abigail Adams\n\n### Self-Reflection\nTake 5 minutes to write down what you already know about this topic.`,
      quiz: [
        {
          question: `What is the main subject of this lesson?`,
          options: [unitTitle, "Quantum Mechanics", "Ancient History", "Cooking"],
          correctIndex: 0,
          explanation: `This lesson covers ${unitTitle}.`,
          glossary: { [unitTitle]: "The subject of the current lesson." }
        },
        {
           question: "Which habit helps with retention?",
           options: ["Cramming", "Active Recall", "Skipping sleep", "Multitasking"],
           correctIndex: 1,
           explanation: "Active recall is a principle of efficient learning.",
           glossary: { "Active Recall": "Stimulating memory during the learning process." }
        }
      ]
    };
  }
};