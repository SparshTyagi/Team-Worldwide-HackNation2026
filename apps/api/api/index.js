import { createAppServer } from "../src/index.js";

const server = createAppServer();

export default function handler(req, res) {
  server.emit("request", req, res);
}
