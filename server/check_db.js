import "dotenv/config";
import connectDB from "./config/db.js";
import Habit from "./models/Habit.js";
import HabitLog from "./models/HabitLog.js";

async function run() {
    await connectDB();
    const habitsCount = await Habit.countDocuments({});
    const logsCount = await HabitLog.countDocuments({});
    const sampleHabit = await Habit.findOne({});
    const sampleLog = await HabitLog.findOne({});
    console.log("Total Habits in DB:", habitsCount);
    console.log("Total Logs in DB:", logsCount);
    console.log("Sample Habit:", sampleHabit);
    console.log("Sample Log:", sampleLog);
    process.exit(0);
}

run();
