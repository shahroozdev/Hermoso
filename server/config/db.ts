/* eslint-disable no-console */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI as string, { family: 4 });
    isConnected = true;
  } catch (error: unknown) {
    const err = error as { code?: string; syscall?: string };
    if (err?.code === "ECONNREFUSED" && err?.syscall === "querySrv") {
      console.error(
        "MongoDB SRV DNS lookup failed. This usually means the current network or DNS server is blocking SRV record resolution for the Atlas cluster."
      );
      console.error(
        "Try switching to a standard mongodb:// Atlas connection string or use a DNS server that supports SRV lookups."
      );
    }

    throw error;
  }
};