import "dotenv/config";
import { chatCompletion, SYSTEM_PROMPTS } from "./utils/aiService.js";

const userMsg = `User goals: Build a stronger fitness routine and read more books\nMost productive time: Early morning before work\nPast struggles: Late night journalising and weekend gym sessions\n\n Suggest 3 habits now. Return JSON only.`;

async function run() {
    console.log("Calling chatCompletion...");
    const res = await chatCompletion({
        system: SYSTEM_PROMPTS.suggestions,
        user: userMsg
    });
    console.log("RESULT:", res);
}

run();
