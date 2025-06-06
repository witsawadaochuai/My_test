const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const userFilePath = path.join(__dirname, '..', 'user.json');

function loadUsers() {
  if (!fs.existsSync(userFilePath)) return [];
  return JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
}

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ email, passwordHash });
  saveUsers(users);

  res.json({ success: true, message: 'User registered successfully' });
});

module.exports = router;
