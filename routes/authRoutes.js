const express = require('express');
const authController = require('../controllers/authController');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;