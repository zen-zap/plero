import { Router } from "express";

const router = Router();

router.post("/suggest", (req, res) => {
    // Dummy implementation
    const { code, language, prompt } = req.body;
    res.json({
        suggestion: `Mock suggestion for language: ${language}. You sent: ${code || prompt}`,
    });
});

router.post("/chat", (req, res) => {
    // Dummy implementation
    const { message } = req.body;
    res.json({
        response: `Mock AI chat reply to: ${message}`,
    });
});

export default router;