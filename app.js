const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const { initializeMCP } = require("./services/aiService");

const app = express();

app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// demo route
app.get("/", (req, res) => {
  res.json({ message: "Task Management API is running!" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

async function startServer() {
  const PORT = process.env.PORT || 3000;
  await mongoose.connect(process.env.MONGODB_URI);

  initializeMCP()
    .then((connected) => {
      if (connected) {
        console.log(
          "🚀 Real MCP System initialized - Claude can now use tools!"
        );
      } else {
        console.log("⚠️  MCP initialization failed - chat features limited");
      }
    })
    .catch((err) => console.error("MCP initialization error:", err));

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
startServer();
