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
//   // frequenthy: 1,
//   // anthena: "abc"
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
//     date: "2026-06-08",
//     hour: 12,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R07':100}, 'C': {'C07': 20}},
//     recordPrecent: 80,
//     longestSequence: 900,
//     spoofPrecents: 60,
//     gemPrecents: 40
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-07",
//     hour: 12,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R07':100}, 'C': {'C07': 20}},
//     recordPrecent: 100,
//     longestSequence: 900,
//     spoofPrecents: 10,
//     gemPrecents: 10
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 11,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R09':100}, 'C': {'C09': 20}},
//     recordPrecent: 0,
//     longestSequence: 5,
//     spoofPrecents: 10,
//     gemPrecents: 2
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-07",
//     hour: 11,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 100,
//     gemPrecents: 100
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
