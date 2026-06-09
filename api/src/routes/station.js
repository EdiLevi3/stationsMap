import express from "express";
import {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
  deleteStation,
  searchStations,
  getNearbyStations,
} from "../controllers/stationController.js";

const stationRouter = express.Router();

stationRouter.post("/", createStation);
stationRouter.get("/", getAllStations);
stationRouter.get("/search", searchStations);
stationRouter.get("/nearby", getNearbyStations);
stationRouter.get("/:id", getStationById);
stationRouter.put("/:id", updateStation);
stationRouter.delete("/:id", deleteStation);

export default stationRouter;
