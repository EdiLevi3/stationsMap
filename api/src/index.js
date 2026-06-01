import express from "express";
import { connectDB } from "./config/db.js";
import cors from "cors";
import startRecordConsumer from "./services/rabbitmq.js";
import recordRouter from "./routes/record.js";
import stationRouter from "./routes/station.js";

const app = express();
const PORT = process.env.PORT;
await connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/records", recordRouter);
app.use("/api/stations", stationRouter);

startRecordConsumer();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
