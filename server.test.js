const app = require("./app");
const request = require("supertest");

describe("GET /healthz", () => {
  it("returns 200 on hitting with HTTP GET method", async () => {
   await request(app)
      .get("/healthz")
      .set("Accept", "application/json")
      .expect(200)
  });
});

