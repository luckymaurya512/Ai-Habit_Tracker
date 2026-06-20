import Habit from "../models/Habit.js"
import HabitLog from "../models/HabitLog.js";
import AIInsight from "../models/AIInsight.js";
import { chatCompletion, SYSTEM_PROMPTS } from "../utils/aiService.js";
import { lastNDays, calcStreak, todayKey } from "../utils/dateHelpers.js";

const buildWeeklyContext = async (userId) => {
    const habits = await Habit.find({ userId, isArchieved: false });
    const days = lastNDays(7);
    const logs = await HabitLog.find({
        userId,
        completedDate: { $gte: days[0], $lte: days[days.length - 1] }
    });
    const perHabit = habits.map((h) => {
        const completed = logs.filter(
            (l) => String(l.habitId) === String(h._id)
        ).length;
        return {
            name: h.name,
            category: h.category,
            frequency: h.frequency,
            completedDays: completed,
            targetDays: h.targetDays
        };
    })
    return { days, perHabit };
};

export const weeklyReport = async (req, res) => {
    try {
        const ctx = await buildWeeklyContext(req.user._id);
        if (!ctx.perHabit.length) {
            return res.json({
                content: "You don't have any active habits yet. Create your first habit to start tracking-"
            });
        }
        const userMsg = `Here is the user's habit data for the past 7 days(${ctx.days[0]} to ${ctx.days[6]}):\n\n${ctx.perHabit
            .map(
                (h) => `-${h.name} (${h.category}, ${h.frequency}) : completed ${h.completedDays} of the past 7 days, target ${h.targetDays}/week`
            )
            .join("\n")}\n\n Please write the personalised weekly report now.`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.weekly,
            user: userMsg
        });
        await AIInsight.create({
            userId: req.user._id,
            type: "weekly",
            content
        });
        res.json({ content });
    }
    catch (err) {
        res.status(500)
            .json({ message: err.message });
    }
};

export const suggestHabits = async (req, res) => {
    try {
        const { goals, productiveTime, struggles } = req.body;
        const userMsg = `User goals: ${goals || "not provided"}\nMost productive time: ${productiveTime || "not provided"}\nPast struggles: ${struggles || "not provided"}\n\n Suggest 3 habits now. Return JSON only.`;
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.suggestions,
            user: userMsg
        });
        let suggestions = [];
        try {
            const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
            suggestions = parsed.suggestions || [];
        }
        catch {
            suggestions = [];
        }
        if (!suggestions.length) {
            suggestions = [
                {
                    name: "10 minute morning walk",
                    description: "Start the day with light movement and fresh air.",
                    frequency: "daily",
                    category: "fitness",
                    icon: "😉",
                    reason: "Low-friction way to build consistency early in the morning"
                },
                {
                    name: "Read 5 pages",
                    description: "Expand your knowledge and engage your mind.",
                    frequency: "daily",
                    category: "learning",
                    icon: "😉",
                    reason: "Low-friction way to build consistency early in the morning"
                },
                {
                    name: "15 minutes of yoga",
                    description: "Improve flexibility and reduce stress.",
                    frequency: "daily",
                    category: "fitness",
                    icon: "😉",
                    reason: "Improves flexibility and reduces stress"
                },

            ];
        }
        await AIInsight.create({
            userId: req.user._id,
            type: "suggestion",
            content: JSON.stringify(suggestions),
            meta: { goals, productiveTime, struggles },
        });
        res.json({ suggestions });
    }
    catch (err) {
        res.status(500)
            .json({ message: err.message });
    }
};

export const recoveryPlan = async (req, res) => {
    try {
        const { habitId } = req.body;
        const habit = await Habit.findOne({
            _id: habitId,
            userId: req.user._id
        });
        if (!habit) {
            return res.status(404)
                .json({ message: "Habit not found" });
        }
        const logs = await HabitLog.find({
            userId: req.user._id,
            habitId
        }).sort({ completedDate: -1 });
        const keys = logs.map((l) => l.completedDate);
        const { current, longest } = calcStreak(keys);

        const userMsg = `Habit: ${habit.name} (${habit.category}).\ndescription: ${habit.description || "none"}.\nCurrent streak: ${current} days. Longest ever: ${longest} days. The user just broke a streak. Write a warm , actionable 3-day recovery plan.`;
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.recovery,
            user: userMsg
        });
        await AIInsight.create({
            userId: req.user._id,
            type: "recovery",
            content,
            meta: { habitId }
        });
        res.json({ content });
    }
    catch (err) {
        res.status(500)
            .json({ message: err.message });
    }
};

export const chatAnalysis = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400)
                .json({ message: "question is required" });
        }
        const habits = await Habit.find({
            userId: req.user._id,
            isArchieved: false
        });
        const days = lastNDays(30);
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: { $gte: days[0], $lte: days[days.length - 1] },
        });
        const context = habits
            .map((h) => {
                const hLogs = logs.filter(
                    (l) => String(l.habitId) === String(h._id)
                );
                const byDow = [0, 0, 0, 0, 0, 0, 0];
                for (const l of hLogs) {
                    const dow = new Date(l.completedDate).getDay();
                    byDow[dow] += 1;
                }
                return `${h.name} (${h.category}): ${hLogs.length}/30 in last 30 days, by weekday [Sun Mon Tue Wed Thu Fri Sat]:${byDow}`;
            }).join("\n");

        console.log("AI Chat Context:\n", context);

        const userMsg = `User question : "${question}"\n\n User data (last 30 days): \n${context}\n\n Answer now. `;
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.chat,
            user: userMsg
        });
        await AIInsight.create({
            userId: req.user._id,
            type: "chat",
            content,
            meta: { question }
        });
        res.json({ content, context });
    }
    catch (err) {
        res.status(500)
            .json({ message: err.message });
    }
};

// export const recoveryPlan = async (req, res) => {
//     try{
//         const {habitId} = req.body;
//         const habit = await Habit.find({
//             userId: req.user._id,
//             _id: habitId
//         });
//         if(!habit){
//             return res.status(404)
//             .json({message: "Habit not found"});
//         }
//         const logs = await HabitLog.find({
//             userId: req.user._id,
//             habitId,
//         }).sort({
//             completedDate: 1
//         });
//         const keys = logs.map((l)=>l.completedDate)
//         const {current, longest} = calcStreak(keys);
//         const userMsg = `Habit: ${habit.name}(${habit.category}).\n Description: ${habit.description || "none"}.\nCurrent streak: ${current} days. Longest ever: ${longest} days. The user just broke a streak. Write a warm, actionable 3-day recovery plan. `;
//         const {content} = await chatCompletion({
//             system: SYSTEM_PROMPTS.recovery,
//             user: userMsg
//         });
//         await AIInsight.create({
//             userId: req.user._id,
//             type: "recovery",
//             content,
//             meta: {habitId}
//         });
//         res.json({content});
//     }
//     catch(err){
//         res.status(500)
//         .json({message: err.message});
//     }
// };

export const morningMotivation = async (req, res) => {
    try {
        const habits = await Habit.find({
            userId: req.user._id,
            isArchieved: false
        });
        if (!habits || habits.length === 0) {
            return res.json({
                content: "Good morning.. add your first habit today and lets get started",
            });
        }
        const days = lastNDays(30);
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: { $gte: days[0], $lte: days[days.length - 1] }
        })
        const ctx = habits
            .map((h) => {
                const hLogs = logs
                    .filter((l) => String(l.habitId) === String(h._id))
                    .map((l) => l.completedDate)
                    .sort()
                    .reverse();
                const { current } = calcStreak(hLogs);
                return `${h.name}: current streak ${current}`;
            })
            .join("\n");
        const today = todayKey();
        const todayLogs = logs.filter((l) => l.completedDate === today);
        const done = todayLogs.length;
        const total = habits.length;

        const userMsg = `Today's habits and streaks:\n${ctx}\n\nDone today: ${done}/${total}. Write the morning message`;
        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.morning,
            user: userMsg,
            temperature: 0.8,
        });

        await AIInsight.create({
            userId: req.user._id,
            type: "morning",
            content
        });
        res.json({ content });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};