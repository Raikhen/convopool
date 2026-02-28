import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { routes } from "../src/routes";

const app = new Hono().basePath("/api");
app.use("*", cors());
app.route("/", routes);

export const GET = handle(app);
export const POST = handle(app);
