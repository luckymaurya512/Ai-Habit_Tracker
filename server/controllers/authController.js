import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import AIInsight from "../models/AIInsight.js";
import { sendVerificationEmail } from "../utils/emailService.js";

/**
 * Generates a secure email verification token and its 24-hour expiry.
 * @returns {{ token: string, expiry: Date }}
 */
function generateVerificationToken() {
    // 32 bytes as base64url = 43 chars (no +/= chars that could be mangled by email clients)
    const token = crypto.randomBytes(32).toString("base64url");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return { token, expiry };
}

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "30d"
    });
}

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400)
                .json({ message: "Name, email and password are required" })
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({ messsage: "Password must be atleast 6 characters long" })
        }
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(400)
                .json({
                    message: "Email Already Registered"
                })
        }
        const { token, expiry } = generateVerificationToken();
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            avatar: name.charAt(0).toUpperCase(),
            isEmailVerified: false,
            emailVerificationToken: token,
            emailVerificationTokenExpiry: expiry,
        });
        try {
            await sendVerificationEmail(user.email, user.name, token);
        } catch (emailErr) {
            console.error("Failed to send verification email:", emailErr);
        }
        return res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400)
                .json({
                    message: "Email and password are required"
                });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401)
                .json({ message: "Invalid email or password" });
        }
        // isEmailVerified === false means a new account pending verification.
        // null means a pre-existing account created before this feature — treat as verified.
        if (user.isEmailVerified === false) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }
        const token = signToken(user._id);
        res.json({ user, token });
    }
    catch (err) {
        res.status(500)
            .json({ messagge: err.message });
    }
}

export const me = async (req, res) => {
    res.json({ user: req.user });
}

export const updateProfile = async (req, res) => {
    try {
        const { name, morningMotivation } = req.body;
        const user = await User.findById(req.user._id);
        if (name !== undefined) {
            user.name = name;
            user.avatar = name.charAt(0).toUpperCase();
        }
        if (morningMotivation !== undefined) {
            user.morningMotivation = morningMotivation;
        }
        await user.save();
        res.json({ user });
    }
    catch (err) {
        res.status(500)
            .json({ message: err.message });
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const token = req.query.token || req.body.token;
        // 1. Missing token
        if (!token || token.trim() === '') {
            return res.status(400).json({ message: "Verification token is required." });
        }
        // 2. Look up user by token
        const user = await User.findOne({ emailVerificationToken: token });
        if (!user) {
            return res.status(400).json({ message: "Invalid or already used verification token." });
        }
        // 3. Check expiry
        if (user.emailVerificationTokenExpiry < Date.now()) {
            user.emailVerificationToken = null;
            user.emailVerificationTokenExpiry = null;
            await user.save();
            return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
        }

        // GET request: only validate — do NOT consume the token.
        // This prevents Google's link-scanner from using up the token before the user clicks.
        if (req.method === 'GET') {
            return res.status(200).json({ message: "Token is valid. Please confirm to verify your email." });
        }

        // POST request: actually verify — consume the token.
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpiry = null;
        await user.save();
        return res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        // 1. Validate email
        if (!email || email.trim() === '' || email.length > 254) {
            return res.status(400).json({ message: "A valid email address is required." });
        }
        // 2. Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "No account found with that email address." });
        }
        // 3. Already verified
        if (user.isEmailVerified) {
            return res.status(400).json({ message: "This account is already verified." });
        }
        // 4. Rate-limit check (60 seconds)
        if (user.emailVerificationTokenExpiry) {
            const tokenIssuedAt = user.emailVerificationTokenExpiry.getTime() - 24 * 60 * 60 * 1000;
            if (Date.now() - tokenIssuedAt < 60_000) {
                return res.status(429).json({ message: "Please wait before requesting another verification email." });
            }
        }
        // 5. Generate new token
        const { token, expiry } = generateVerificationToken();
        // 6. Try sending email FIRST; only save if it succeeds
        try {
            await sendVerificationEmail(user.email, user.name, token);
        } catch (emailErr) {
            console.error("Failed to resend verification email:", emailErr);
            return res.status(502).json({ message: "Failed to send verification email. Please try again." });
        }
        // 7. Persist new token only after successful send
        user.emailVerificationToken = token;
        user.emailVerificationTokenExpiry = expiry;
        await user.save();
        return res.status(200).json({ message: "Verification email sent. Please check your inbox." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete all user data in parallel
        await Promise.all([
            HabitLog.deleteMany({ userId }),
            Habit.deleteMany({ userId }),
            AIInsight.deleteMany({ userId }),
        ]);

        // Finally delete the user document itself
        await User.findByIdAndDelete(userId);

        res.json({ message: "Account and all associated data deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
