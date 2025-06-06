const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// mock user database
const users = [
  {
    email: "admin@example.com",
    passwordHash: bcrypt.hashSync("123456", 10)
  }
];

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'User not found' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid password' });

  res.json({ success: true, token: 'mock-jwt-token' });
});

module.exports = router;
