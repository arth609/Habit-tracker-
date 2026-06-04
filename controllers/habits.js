const {
  habits,
  habitCompletions,
  getNextHabitId,
  getNextCompletionId
} = require('../database');

// Получить все привычки пользователя
const getAllHabits = (req, res) => {
  const userHabits = habits.filter(h => h.userId === req.user.id);
  const today = new Date().toISOString().split('T')[0];
  
  const habitsWithStatus = userHabits.map(habit => ({
    ...habit,
    isCompletedToday: habitCompletions.some(
      c => c.habitId === habit.id && c.date === today
    )
  }));
  
  res.json({ habits: habitsWithStatus });
};

// Получить привычки на сегодня
const getTodayHabits = (req, res) => {
  const userHabits = habits.filter(h => h.userId === req.user.id && h.isActive !== false);
  const today = new Date().toISOString().split('T')[0];
  
  // Фильтрация по расписанию
  const dayOfWeek = new Date().getDay();
  const habitsForToday = userHabits.filter(habit => {
    if (habit.scheduleType === 'daily') return true;
    if (habit.scheduleType === 'weekly') {
      return habit.selectedDays?.includes(dayOfWeek);
    }
    return true;
  });
  
  const habitsWithStatus = habitsForToday.map(habit => ({
    ...habit,
    isCompletedToday: habitCompletions.some(
      c => c.habitId === habit.id && c.date === today
    )
  }));
  
  res.json({ habits: habitsWithStatus, date: today });
};

// Создать привычку
const createHabit = (req, res) => {
  try {
    const { title, description, color, icon, scheduleType, selectedDays, reminderTime } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Название привычки обязательно' });
    }
    
    const newHabit = {
      id: getNextHabitId(),
      userId: req.user.id,
      title,
      description: description || '',
      color: color || '#4F46E5',
      icon: icon || '📌',
      scheduleType: scheduleType || 'daily',
      selectedDays: selectedDays || [],
      reminderTime: reminderTime || null,
      isActive: true,
      streak: 0,
      bestStreak: 0,
      createdAt: new Date().toISOString()
    };
    
    habits.push(newHabit);
    
    res.status(201).json({
      message: 'Привычка создана',
      habit: newHabit
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании привычки' });
  }
};

// Обновить привычку
const updateHabit = (req, res) => {
  const habitId = parseInt(req.params.id);
  const habitIndex = habits.findIndex(h => h.id === habitId && h.userId === req.user.id);
  
  if (habitIndex === -1) {
    return res.status(404).json({ error: 'Привычка не найдена' });
  }
  
  habits[habitIndex] = {
    ...habits[habitIndex],
    ...req.body,
    id: habitId,
    userId: req.user.id,
    updatedAt: new Date().toISOString()
  };
  
  res.json({ message: 'Привычка обновлена', habit: habits[habitIndex] });
};

// Удалить привычку
const deleteHabit = (req, res) => {
  const habitId = parseInt(req.params.id);
  const habitIndex = habits.findIndex(h => h.id === habitId && h.userId === req.user.id);
  
  if (habitIndex === -1) {
    return res.status(404).json({ error: 'Привычка не найдена' });
  }
  
  habits.splice(habitIndex, 1);
  
  // Удаляем связанные выполнения
  const completionsToRemove = habitCompletions.filter(c => c.habitId === habitId);
  completionsToRemove.forEach(c => {
    const idx = habitCompletions.findIndex(hc => hc.id === c.id);
    if (idx !== -1) habitCompletions.splice(idx, 1);
  });
  
  res.json({ message: 'Привычка удалена' });
};

// Отметить выполнение привычки
const completeHabit = (req, res) => {
  const habitId = parseInt(req.params.id);
  const habit = habits.find(h => h.id === habitId && h.userId === req.user.id);
  
  if (!habit) {
    return res.status(404).json({ error: 'Привычка не найдена' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  const alreadyCompleted = habitCompletions.some(
    c => c.habitId === habitId && c.date === today
  );
  
  if (alreadyCompleted) {
    return res.status(400).json({ error: 'Привычка уже отмечена сегодня' });
  }
  
  const newCompletion = {
    id: getNextCompletionId(),
    habitId,
    userId: req.user.id,
    date: today,
    completedAt: new Date().toISOString()
  };
  
  habitCompletions.push(newCompletion);
  
  // Пересчёт серии
  const updatedStreak = calculateStreak(habitId, req.user.id);
  habit.streak = updatedStreak;
  
  if (updatedStreak > habit.bestStreak) {
    habit.bestStreak = updatedStreak;
  }
  
  res.json({
    message: 'Привычка отмечена!',
    streak: updatedStreak,
    date: today
  });
};

// Расчёт текущей серии
const calculateStreak = (habitId, userId) => {
  const completions = habitCompletions
    .filter(c => c.habitId === habitId && c.userId === userId)
    .map(c => c.date)
    .sort()
    .reverse();
  
  if (completions.length === 0) return 0;
  
  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (completions[0] !== today && completions[0] !== yesterdayStr) {
    return 0;
  }
  
  for (let i = 0; i < completions.length - 1; i++) {
    const current = new Date(completions[i]);
    const next = new Date(completions[i + 1]);
    const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

// Получить статистику
const getStatistics = (req, res) => {
  const userHabits = habits.filter(h => h.userId === req.user.id);
  const userCompletions = habitCompletions.filter(c => c.userId === req.user.id);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Вычисляем процент выполнения за последние 7 дней
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }
  
  let totalPossible = 0;
  let totalCompleted = 0;
  
  last7Days.forEach(date => {
    userHabits.forEach(habit => {
      totalPossible++;
      if (userCompletions.some(c => c.habitId === habit.id && c.date === date)) {
        totalCompleted++;
      }
    });
  });
  
  const weeklyCompletionRate = totalPossible > 0 
    ? Math.round((totalCompleted / totalPossible) * 100) 
    : 0;
  
  const totalHabits = userHabits.length;
  let totalStreak = 0;
  let totalBestStreak = 0;
  
  userHabits.forEach(habit => {
    totalStreak += habit.streak || 0;
    totalBestStreak += habit.bestStreak || 0;
  });
  
  res.json({
    totalHabits,
    totalCompletions: userCompletions.length,
    weeklyCompletionRate,
    todayCompletions: userCompletions.filter(c => c.date === today).length,
    averageStreak: totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0,
    totalBestStreak
  });
};

module.exports = {
  getAllHabits,
  getTodayHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  getStatistics
};