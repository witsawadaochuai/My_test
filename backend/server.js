const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/chart')); 
app.use('/api/auth', require('./routes/login'));
app.use('/api/auth', require('./routes/signup'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
