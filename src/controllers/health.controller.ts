import { Request, Response } from "express";
import { env } from "../config/env";

export function healthController(_req: Request, res: Response) {
  return res.json({
    ok: true,
    service: "origin",
    nodeKey: env.NODE_KEY,
    nodeName: env.NODE_NAME,
    type: env.NODE_TYPE,
    timestamp: new Date().toISOString(),
  });
}