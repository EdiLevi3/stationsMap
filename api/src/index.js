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
//   name: "Lebanon",
//   location: {
//     type: "Point",
//     coordinates: [35.8622850, 33.8547210], // [longitude, latitude]
//   },
//   frequency: 4,
//   antenna: "abc"
// });
// await station.save();

// const station1 = new Station({
//   name: "Lebanon",
//   location: {
//     type: "Point",
//     coordinates: [35.8622850, 33.8547210], // [longitude, latitude]
//   },
//   // frequenthy: 1,
//   // anthena: "abc"
// });
// await station1.save();

// const station2 = new Station({
//   name: "Beer Sheva",
//   location: {
//     type: "Point",
//     coordinates: [34.7867691, 31.2521018], // [longitude, latitude]
//   },
//   // frequenthy: 1,
//   // anthena: "abc"
// });
// await station2.save();

// const station3 = new Station({
//   name: "Raanana",
//   location: {
//     type: "Point",
//     coordinates: [34.8745337, 32.1923797], // [longitude, latitude]
//   },
//   // frequenthy: 1,
//   // anthena: "abc"
// });
// await station3.save();

// const station4 = new Station({
//   name: "Haifa",
//   location: {
//     type: "Point",
//     coordinates: [34.9895710, 32.7940463], // [longitude, latitude]
//   },
//   // frequenthy: 1,
//   // anthena: "abc"
// });
// await station4.save();

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
//     date: "2026-06-10",
//     hour: 5,
//     stationName: "Lebanon",
//     satelliteConstellation: {'R': {'R07':100, 'R09':3000}, 'C': {'C07': 20}},
//     recordPrecent: 100,
//     longestSequence: 3600,
//     spoofPrecents: 0,
//     gamPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-07",
//     hour: 0,
//     stationName: "Jerusalem",
//     satelliteConstellation: {'R': {'R07':100, 'R08':3600, 'R54': 3600, 'R14': 900, 'R67': 840}, 'C': {'C07': 20}},
//     recordPrecent: 100,
//     longestSequence: 3600,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 18,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R09':100}, 'C': {'C09': 20}},
//     recordPrecent: 0,
//     longestSequence: 5,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 19,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 20,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 21,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 22,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 23,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R07':100}, 'C': {'C07': 20}},
//     recordPrecent: 80,
//     longestSequence: 900,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 3,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R07':100}, 'C': {'C07': 20}},
//     recordPrecent: 100,
//     longestSequence: 900,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 4,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R09':100}, 'C': {'C09': 20}},
//     recordPrecent: 0,
//     longestSequence: 5,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 5,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 6,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 7,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 8,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 9,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 10,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// } "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }
// try {
//   await saveRecordInMongo({
//     date: "2026-06-08",
//     hour: 10,
//     stationName: "Jerusalem",
//     valid: true,
//     satelliteConstellation: {'R': {'R06':100}, 'C': {'C06': 20}},
//     recordPrecent: 30,
//     longestSequence: 18,
//     spoofPrecents: 0,
//     gemPrecents: 0
//   });
//   console.log("Record saved successfully");
// } catch (error) {
//   console.error("Error saving record:", error);
// }

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
