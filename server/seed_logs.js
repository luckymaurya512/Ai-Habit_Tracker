import "dotenv/config";
import connectDB from "./config/db.js";
import Habit from "./models/Habit.js";
import HabitLog from "./models/HabitLog.js";
import { lastNDays } from "./utils/dateHelpers.js";

async function run() {
    await connectDB();
    
    // Find the habit we saw in the context
    const habit = await Habit.findOne({ name: "Drink 2 bottles of water" });
    if (!habit) {
        console.error("Habit 'Drink 2 bottles of water' not found. Please make sure the habit exists first!");
        process.exit(1);
    }

    const userId = habit.userId;
    const habitId = habit._id;
    console.log(`Found habit: "${habit.name}" for user ID: ${userId}`);

    // Clear existing logs for this habit to start clean
    await HabitLog.deleteMany({ habitId });
    console.log("Cleared old logs for this habit.");

    // Generate mock completions for the last 30 days
    const days = lastNDays(30);
    const logsToCreate = [];

    for (const dateStr of days) {
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Let's seed logs primarily on Mondays (1) and Wednesdays (3) to show clear consistency
        if (dayOfWeek === 1 || dayOfWeek === 3) {
            logsToCreate.push({
                userId,
                habitId,
                completedDate: dateStr,
                notes: "Seed automated completion"
            });
        }
    }

    if (logsToCreate.length > 0) {
        await HabitLog.insertMany(logsToCreate);
        console.log(`Successfully seeded ${logsToCreate.length} habit logs for "${habit.name}"!`);
        console.log("Seed dates:", logsToCreate.map(l => l.completedDate));
    } else {
        console.log("No logs created.");
    }

    process.exit(0);
}

run();
