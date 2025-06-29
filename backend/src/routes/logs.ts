import { Router } from "express";

const router = Router();

router.post("/log", (req, res) => {
    // Dummy log. In reality, you'd save to DB.
    const { action, details } = req.body;
    console.log("Log:", action, details);
    res.json({ success: true });
});

export default router;