const Task = require("../models/Task");

async function getTasks(req, res, next) {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    next(error);
  }
}

// Create new task
async function createTask(req, res, next) {
  try {
    const { title, description, dueDate } = req.body;

    const task = new Task({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.user.userId,
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
