const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const habitsRoutes = require('./routes/habits');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'Добро пожаловать в API Трекера привычек!',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      habits: {
        getAll: 'GET /api/habits',
        getToday: 'GET /api/habits/today',
        create: 'POST /api/habits',
        update: 'PUT /api/habits/:id',
        delete: 'DELETE /api/habits/:id',
        complete: 'PATCH /api/habits/:id/complete',
        stats: 'GET /api/habits/analytics/stats'
      }
    }
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});