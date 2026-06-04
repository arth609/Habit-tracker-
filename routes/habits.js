const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const habitsController = require('../controllers/habits');

// Все маршруты требуют авторизации
router.use(authMiddleware);

router.get('/', habitsController.getAllHabits);
router.get('/today', habitsController.getTodayHabits);
router.post('/', habitsController.createHabit);
router.put('/:id', habitsController.updateHabit);
router.delete('/:id', habitsController.deleteHabit);
router.patch('/:id/complete', habitsController.completeHabit);
router.get('/analytics/stats', habitsController.getStatistics);

module.exports = router;