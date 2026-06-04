// Эмуляция базы данных в памяти

const users = [];
const habits = [];
const habitCompletions = [];

let userIdCounter = 1;
let habitIdCounter = 1;
let completionIdCounter = 1;

// Вспомогательные функции для получения следующего ID
const getNextUserId = () => userIdCounter++;
const getNextHabitId = () => habitIdCounter++;
const getNextCompletionId = () => completionIdCounter++;

module.exports = {
  users,
  habits,
  habitCompletions,
  getNextUserId,
  getNextHabitId,
  getNextCompletionId
};