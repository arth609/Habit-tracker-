const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, getNextUserId } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Регистрация
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: getNextUserId(),
      email,
      name: name || email.split('@')[0],
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'Регистрация успешна',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
};

// Вход
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Вход выполнен успешно',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
};

// Получение профиля
const getMe = (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
};

module.exports = { register, login, getMe };