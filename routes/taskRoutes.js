const express = require('express');
const { authenticateToken } = require('../middlewares/authenticateToken');
const { getTasks, createTask, updateTask, deleteTask, chatAssistant } = require('../controllers/taskController');

const router = express.Router();

// Apply authentication middleware to all task routes
router.use(authenticateToken);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/chat', chatAssistant)

module.exports = router;