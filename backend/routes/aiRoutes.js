const express = require('express');
const router  = express.Router();
const { chat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/chat — all authenticated users
router.post('/chat', protect, chat);

// POST /api/ai/triage - open to authenticated (or unauthenticated, but let's say authenticated for now)
const { triage } = require('../controllers/aiController');
router.post('/triage', protect, triage);

module.exports = router;
