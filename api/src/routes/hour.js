import express from 'express';
import { getHourData, getHourDataByDate, upsertrecord, deleteRecord, createRecord, getRecordByStation, createHour } from '../controllers/hourController.js';


const hourRouter = express.Router();

hourRouter.get("/:hour", getHourData);

hourRouter.get("/:hour/date/:date", getHourDataByDate);

hourRouter.put("/:hour/date/:date/station/:stationId", upsertrecord);

hourRouter.delete("/:hour/date/:date/station/:stationId", deleteRecord);

hourRouter.post("/:hour/date/:date/station/:stationId", createRecord);

hourRouter.get("/:hour/date/:date/station/:stationId", getRecordByStation);

hourRouter.post("/:hour", createHour);


export default hourRouter;


