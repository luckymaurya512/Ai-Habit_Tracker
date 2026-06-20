import { GoogleGenAI } from "@google/genai";

let client = null;
const getClient = () => {
    if (client) {
        return client;
    }
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return null;
    }
    client = new GoogleGenAI({ apiKey: key });
    return client;
};

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY;

export const parseJSON = (text) => {
    let cleaned = (text || "").trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    }
    else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/```\n?/g, "");
    }
    return JSON.parse(cleaned.trim());
};

export const chatCompletion = async ({ system, user, temperature = 0.7 }) => {
    const c = getClient();
    if (!c) {
        return {
            ok: false,
            content:
                "AI features are disabled- set GEMINI_API_KEY in the backend .env to enable real AI responses."
        };
    }
    try {
        const res = await c.models.generateContent({
            model: model,
            contents: user,
            config: {
                systemInstruction: system,
                temperature
            }
        });
        return { ok: true, content: (res.text || "").trim() };
    }
    catch (err) {
        console.error("AI Error: ", err.message);
        return {
            ok: false,
            content: "AI request failed, please try again later"
        };
    }
};

export const SYSTEM_PROMPTS = {
    weekly:
        "You are a warm, encouraging habit coach. Analyse the user's last 7 days of habit data and write a short personalised report (120-180 words). Mention: what went well, what struggled, patterns noticed, and one specific piece of encouragement. Use the user's actual habit names. Be human, not generic. No markdown headers - use plain prose with line breaks.",
    suggestions:
        "You are a helpful habit coach. Based on the user's goals, productive time, and past struggles, suggest exactly 3 personalised habits. Return valid json only with this shape:{\"suggestions\":[{\"name\":\"...\",\"description\":\"...\,\"frequency\":\daily\weekly\",\"category\":\"Health\Fitness\Learning|Mindfulness|Productivity|Social|Finance|Creative|Other\",\"icon\":\"<emoji>\",\reason\":\"...\"}]}.No prose outside JSON.",
    recovery:
        "You are a compassionate habit recovery coach. The user broke a streak. Write a 3-day recovery plan tailored to this specific habit. Be warm but actionable. Use this structure: sort empathic opening (1-2 sentances), then Day 1/ Day 2/ Day3 sections with one concrete action each, then a closing line of encouragement. 150 to 200 words total.",
    chat:
        "You are a helpful habit analysis assistant. Answer the user's question using ONLY the provided habit data as context. Be specific - cite actual habit names, days, percentage. Keep replies under 20 words. If the data is insufficient, say so briefly.",
    morning:
        "You are a warm, motivating friend. Write a single short morning message (30-60 words) using the user's actual habit names and current streak. Mention 1-2 specific habits. Energetic but not cheesy. No emojis overload -max 1. "
};

const makeUserMessage = (parts) => {
    if (Array.isArray(parts)) {
        return parts.map((p) => (typeof p === "string" ? { text: p } : p)).filter((p) => p && p.text);
    }
    return [{ text: parts || "" }];
};

export const generateWeeklyReport = async (habits, logs) => {
    const habitNames = habits.map((h) => h.name).join(", ");
    const logSummary = habits.map((h) => {
        const hLogs = logs.filter((l) => String(l.habitId) === String(h._id));
        return `  - ${h.name}: ${hLogs.length} times`;
    }).join("\n");
    const system = SYSTEM_PROMPTS.weekly + "\n\nHabits: " + habitNames + "\n\nLog summary:\n" + logSummary;
    const user = "Give me my weekly habit report.";
    const res = await chatCompletion({ system, user, temperature: 0.7 });
    return res;
};

export const generateSuggestions = async (goals, productiveTime, struggles) => {
    const system = SYSTEM_PROMPTS.suggestions + JSON.stringify({ maxCount: 3 });
    const user = "User goals: " + goals + "\n\nProductive time: " + productiveTime + "\n\nPast struggles: " + struggles;
    const res = await chatCompletion({ system, user, temperature: 0.8 });
    if (res.ok && res.content) {
        try {
            return { ok: true, suggestions: parseJSON(res.content).suggestions || [] };
        }
        catch (err) {
            return { ok: false, error: "Failed to parse suggestions" };
        }
    }
    return res;
};

export const generateRecoveryMessage = async (habitNames, context) => {
    const system = SYSTEM_PROMPTS.recovery + "\n\nHabits: " + habitNames.join(", ") + "\n\nContext: " + context;
    const user = "I missed some habit days. Give me a recovery message.";
    const res = await chatCompletion({ system, user, temperature: 0.7 });
    if (res.ok && res.content) {
        try {
            return { ok: true, ...parseJSON(res.content) };
        }
        catch (err) {
            return { ok: false, error: "Failed to parse recovery message" };
        }
    }
    return res;
};

export const generateChat = async (habitNames, history, currentMessage) => {
    const habitList = habitNames.join(", ");
    const context = history.slice(-10).map((m) => `${m.user ? "User" : "Coach"}: ${m.text}`).join("\n");
    const system = SYSTEM_PROMPTS.chat + "\n\nHabits: " + habitList + "\n\nHistory: " + context + "\n\nNow respond to the latest user message.";
    const user = currentMessage;
    const res = await chatCompletion({ system, user, temperature: 0.7 });
    return res;
};

export const generateMorning = async (focusArea) => {
    const system = SYSTEM_PROMPTS.morning + "\n\nToday's focus: " + focusArea;
    const user = "Give me a morning message to start my day with focus.";
    const res = await chatCompletion({ system, user, temperature: 0.7 });
    if (res.ok && res.content) {
        try {
            return { ok: true, ...parseJSON(res.content) };
        }
        catch (err) {
            return { ok: false, error: "Failed to parse morning message" };
        }
    }
    return res;
};