import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startSchedulers } from "./services/scheduler.service.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    startSchedulers();

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start because the database connection could not be established.");
    console.error(error);
    process.exit(1);
  }
};

startServer();