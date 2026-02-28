import { Hono } from "hono";
import { handle } from "hono/vercel";
import { routes } from "./routes";

const app = new Hono().basePath("/api");
app.route("/", routes);

export const GET = handle(app);
export const POST = handle(app);
