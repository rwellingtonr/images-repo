import "dotenv/config";
import http from "node:http";
import { main } from "./main";

http
  .createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "*");

    console.log("🚀 ~ server ~ request.url:", request.url);

    if (request.url !== "/download") {
      return response.writeHead(200).end("hey there");
    }

    response.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${Date.now().toString(
        16
      )}.zip"`,
    });

    await main(response);
  })
  .listen(process.env.PORT, () =>
    console.log(`Server is up on port ${process.env.PORT}`)
  );
