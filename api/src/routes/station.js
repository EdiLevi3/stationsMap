import express from "express";
import {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
  deleteStation,
  searchStations,
} from "../controllers/stationController.js";

const stationRouter = express.Router();

stationRouter.post("/", createStation);
stationRouter.get("/", getAllStations);
stationRouter.get("/search", searchStations);
stationRouter.get("/:id", getStationById);
stationRouter.put("/:id", updateStation);
stationRouter.delete("/:id", deleteStation);

export default stationRouter;
