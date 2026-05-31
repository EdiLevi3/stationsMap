import express from 'express';
import { createStation, getAllStations, getStationById, updateStation, deleteStation } from '../controllers/stationController.js';

const stationRouter = express.Router();

stationRouter.post("/", createStation);
stationRouter.get("/", getAllStations);
stationRouter.get("/:id", getStationById);
stationRouter.put("/:id", updateStation);
stationRouter.delete("/:id", deleteStation);

export default stationRouter;