import express from "express";
import { register, login, me, updateProfile, verifyEmail, resendVerification, deleteAccount } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.put("/profile", protect, updateProfile);
router.delete("/account", protect, deleteAccount);
router.get("/verify-email", verifyEmail);   // GET: just validates token exists (safe for scanners)
router.post("/verify-email", verifyEmail);  // POST: actually verifies (requires user interaction)
router.post("/resend-verification", resendVerification);

export default router;