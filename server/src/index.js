import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const app = createApp();

await connectDatabase();

app.listen(env.port, () => {
  console.log(`Medical Research Assistant API listening on http://localhost:${env.port}`);
});

