import "dotenv/config";
import { sendVerificationEmail } from "./utils/emailService.js";

async function run() {
  console.log("Sending test verification email...");
  try {
    await sendVerificationEmail("mauryalucky512@gmail.com", "Test User", "test-token-12345");
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

run();
