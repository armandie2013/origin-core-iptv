import { Router } from "express";
import {
  getActiveChannelsController,
  getChannelStatusController,
  stopChannelController,
} from "../controllers/channels.controller";

const router = Router();

router.get("/channels/active", getActiveChannelsController);
router.get("/channels/:channelId/status", getChannelStatusController);
router.post("/channels/:channelId/stop", stopChannelController);

export default router;