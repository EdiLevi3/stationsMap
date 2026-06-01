import express from "express";
import {
  createRecord,
  getAllRecords,
  getRecordById,
  replaceRecord,
  updateRecord,
  deleteRecord,
} from "../controllers/recordController.js";

const recordRouter = express.Router();

recordRouter.post("/", createRecord);
recordRouter.get("/", getAllRecords);
recordRouter.get("/:id", getRecordById);
recordRouter.put("/:id", replaceRecord);
recordRouter.patch("/:id", updateRecord);
recordRouter.delete("/:id", deleteRecord);

export default recordRouter;
