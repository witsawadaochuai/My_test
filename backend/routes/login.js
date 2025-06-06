const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your-secret-key';
const userFilePath = path.join(__dirname, '..', 'user.json');

function loadUsers() {
  const data = fs.readFileSync(userFilePath, 'utf8');
  return JSON.parse(data);
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('REQ BODY:', req.body); // 💡 LOG นี้สำคัญมาก!

  const users = loadUsers();
  const user = users.find(u => u.email === email);
  console.log('FOUND USER:', user);

  if (!user) {
    console.log('❌ User not found');
    return res.status(401).json({ message: 'User not found' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  console.log('PASSWORD MATCH:', match);

  if (!match) {
    console.log('❌ Password does not match');
    return res.status(401).json({ message: 'Invalid password' });
  }

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '2h' });
  console.log('✅ LOGIN SUCCESS');
  res.json({ success: true, token });
});


module.exports = router;
