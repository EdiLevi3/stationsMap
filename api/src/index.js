import express from "express";
import { connectDB } from "./config/mongo.js";
import cors from "cors";
import {startRecordConsumer} from "./services/rabbitmq.js";
import recordRouter from "./routes/record.js";
import stationRouter from "./routes/station.js";
import {saveRecordInMongo} from "./controllers/recordController.js";
import Station from "./models/station.js";

const app = express();
const PORT = process.env.PORT;
await connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/records", recordRouter);
app.use("/api/stations", stationRouter);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// startRecordConsumer();


// const station = new Station({
//   name: "Jerusalem",
//   location: {
//     type: "Point",
//     coordinates: [35.2224346, 31.7768831], // [longitude, latitude]
//   },
// });

// await station.save();

// const station2 = new Station({
//   name: "Eilat",
//   location: {
//     type: "Point",
//     coordinates: [34.9519250, 29.5576690], // [longitude, latitude]
//   },
// });

// await station2.save();

// try {
//   await saveRecordInMongo({
//     date: "2026-01-01",
//     hour: 12,
//     stationName: "Eilat",
//     valid: true,
//     satelliteConstellation: {'R': {'R07':100}, 'C': {'C07': 20}},
//     recordPrecent: 80,
//     longestSequence: 900,
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
