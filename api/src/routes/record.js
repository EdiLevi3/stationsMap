import express from "express";
import {
  createRecord,
  getAllRecords,
  getRecordById,
  replaceRecord,
  updateRecord,
  deleteRecord,
  getAllRecordsByStation,
  getStationDayRecords, 
  getStationHourRecords
} from "../controllers/recordController.js";

const recordRouter = express.Router();

recordRouter.post("/", createRecord);
recordRouter.get("/", getAllRecords);
recordRouter.get(
  "/station/:stationId",
  getAllRecordsByStation
);
recordRouter.get("/station/:stationId/day/:date", getStationDayRecords);
recordRouter.get("/station/:stationId/day/:date/hour/:hour", getStationHourRecords);
recordRouter.get("/:id", getRecordById);
recordRouter.put("/:id", replaceRecord);
recordRouter.patch("/:id", updateRecord);
recordRouter.delete("/:id", deleteRecord);


export default recordRouter;
