import { after, afterEach, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPort } from "get-port-please";
import { MockServer } from "../src";

describe("MockServer", () => {
  let port: number;
  let host: string;
  let mockServer: MockServer;

  before(async () => {
    port = await getPort(3000);
    host = `http://localhost:${port}`;
    mockServer = new MockServer({ port });
    await mockServer.start();
  });

  afterEach(() => mockServer.reset());
  after(() => mockServer.stop());

  it("works with realistic example", async () => {
    mockServer
      .get("/foo", (req) => ({ body: req.query["foo"] ?? "foo" }))
      .post("/bar", 201)
      .get("/bar", { body: { bar: 1 } })
      .patch("/bar", (req) =>
        req.body ? { body: JSON.parse(req.body.toString()) } : { status: 400 },
      )
      .delete("/bar", 204);

    {
      const response = await fetch(`${host}/foo`);
      assert.equal(await response.text(), "foo");
    }

    {
      const response = await fetch(`${host}/foo?foo=bar`);
      assert.equal(await response.text(), "bar");
    }

    {
      const response = await fetch(`${host}/bar`, { method: "POST" });
      assert.equal(response.status, 201);
    }

    {
      const response = await fetch(`${host}/bar`);
      assert.deepEqual(await response.json(), { bar: 1 });
    }

    {
      const response = await fetch(`${host}/bar`, {
        method: "PATCH",
        body: JSON.stringify({ bar: 2 }),
      });
      assert.deepEqual(await response.json(), { bar: 2 });
    }

    {
      const response = await fetch(`${host}/bar`, { method: "DELETE" });
      assert.equal(response.status, 204);
    }
  });

  it("responds with 404 for unmatched requests", async () => {
    const { warn } = console;
    const calls: string[][] = [];
    console.warn = (...args) => calls.push(args);

    mockServer.mock({ body: "unmatched" }, "Unmatched");

    try {
      const response = await fetch(`${host}/test`);
      assert.equal(response.status, 404);
    } finally {
      console.warn = warn;
    }

    assert.deepEqual(calls, [["Unmatched", "GET", "/test"]]);
  });

  describe("#start", () => {
    it("does nothing when server is already running", async () => {
      const { warn } = console;
      const calls: string[][] = [];
      console.warn = (...args) => calls.push(args);

      try {
        await mockServer.start();
      } finally {
        console.warn = warn;
      }

      assert.deepEqual(calls, [["Server is already running"]]);
    });
  });

  describe("#stop", () => {
    it("does nothing when server is not running", async () => {
      const { warn } = console;
      const calls: string[][] = [];
      console.warn = (...args) => calls.push(args);

      const port = await getPort(3001);
      const mockServer = new MockServer({ port });

      try {
        await mockServer.stop();
      } finally {
        console.warn = warn;
      }

      assert.deepEqual(calls, [["No server is running"]]);
    });
  });

  describe("#port", () => {
    it("returns port", () => {
      assert.equal(mockServer.port(), port);
    });
  });

  describe("#mock", () => {
    it("mocks a request", async () => {
      mockServer.mock("/test", "Hello World");

      const response = await fetch(`${host}/test`);
      const text = await response.text();

      assert.equal(text, "Hello World");
    });

    it("responds with 404 for ambiguous mocks", async () => {
      const { warn } = console;
      const calls: string[][] = [];
      console.warn = (...args) => calls.push(args);

      mockServer.mock("/test", "Hello World").mock("/test", "World Hello");

      try {
        const response = await fetch(`${host}/test`);
        assert.equal(response.status, 404);
      } finally {
        console.warn = warn;
      }

      assert.deepEqual(calls, [
        ["Ambiguous", "GET", "/test"],
        ["use overwrite: true"],
      ]);
    });

    it("allows overwriting previous mocks", async () => {
      mockServer
        .mock("/test", "Hello World")
        .mock("/test", "World Hello", { overwrite: true });

      const response = await fetch(`${host}/test`);
      const text = await response.text();

      assert.equal(text, "World Hello");
    });
  });

  describe("#get", () => {
    it("mocks a request", async () => {
      mockServer.get("/test", {
        body: "Hello World",
        headers: { "Content-Type": "text/plain" },
      });

      const response = await fetch(`${host}/test`);
      const text = await response.text();

      assert.equal(text, "Hello World");
    });
  });

  describe("#post", () => {
    it("mocks a request", async () => {
      mockServer.post({ path: "/test" }, "Hello World");

      const response = await fetch(`${host}/test`, {
        method: "POST",
        body: "test",
      });

      const text = await response.text();

      assert.equal(text, "Hello World");
    });
  });

  describe("#put", () => {
    it("mocks a request", async () => {
      mockServer.put({ path: "/test" }, "Hello World");

      const response = await fetch(`${host}/test`, {
        method: "PUT",
        body: "test",
      });

      const text = await response.text();

      assert.equal(text, "Hello World");
    });
  });

  describe("#patch", () => {
    it("mocks a request", async () => {
      mockServer.patch({ path: "/test" }, "Hello World");

      const response = await fetch(`${host}/test`, {
        method: "PATCH",
        body: "test",
      });

      const text = await response.text();

      assert.equal(text, "Hello World");
    });
  });

  describe("#delete", () => {
    it("mocks a request", async () => {
      mockServer.delete({ path: "/test" }, "Hello World");

      const response = await fetch(`${host}/test`, {
        method: "DELETE",
      });

      const text = await response.text();

      assert.equal(text, "Hello World");
    });
  });

  describe("#mocks", () => {
    it("returns all registered mocks", async () => {
      mockServer
        .mock({ method: "GET", path: "/test" }, "Hello World")
        .post({ path: "/test" }, "Hello World")
        .get(
          "/test",
          { body: "Hello World", headers: { "Content-Type": "text/plain" } },
          { overwrite: true },
        );

      assert.deepEqual(mockServer.mocks(), [
        {
          matcher: { method: "GET", path: "/test" },
          response: { body: "Hello World" },
          options: {},
        },

        {
          matcher: { method: "POST", path: "/test" },
          response: { body: "Hello World" },
          options: {},
        },
        {
          matcher: { method: "GET", path: "/test" },
          response: {
            body: "Hello World",
            headers: { "Content-Type": "text/plain" },
          },
          options: { overwrite: true },
        },
      ]);
    });
  });

  describe("#calls", () => {
    it("returns all calls", async () => {
      mockServer
        .mock({ method: "GET", path: "/test" }, "Hello World")
        .post({ path: "/test" }, "Hello World")
        .get(
          "/test",
          { body: "Hello World", headers: { "Content-Type": "text/plain" } },
          { overwrite: true },
        );

      await fetch(`${host}/test`);
      await fetch(`${host}/test`, { method: "POST" });

      assert.equal(mockServer.calls().length, 2);

      assert.deepEqual(mockServer.calls()[0].matcher, {
        method: "GET",
        path: "/test",
      });
      assert.equal(mockServer.calls()[0].request.method, "GET");
      assert.equal(mockServer.calls()[0].request.path, "/test");

      assert.deepEqual(mockServer.calls()[1].matcher, {
        method: "POST",
        path: "/test",
      });
      assert.equal(mockServer.calls()[1].request.method, "POST");
      assert.equal(mockServer.calls()[1].request.path, "/test");
    });
  });

  describe("#hasBeenCalledWith", () => {
    it("returns true if mock server was called with given matcher", async () => {
      mockServer.get("/foo", 200).get("/bar", 200);

      assert(!mockServer.hasBeenCalledWith({ method: "GET", path: "/foo" }));
      assert(!mockServer.hasBeenCalledWith({ method: "GET", path: "/bar" }));
      assert(!mockServer.hasBeenCalledWith({ method: "GET", path: "/baz" }));

      await fetch(`${host}/foo`);

      assert(mockServer.hasBeenCalledWith({ method: "GET", path: "/foo" }));

      assert(!mockServer.hasBeenCalledWith({ method: "GET", path: "/bar" }));
      assert(!mockServer.hasBeenCalledWith({ method: "GET", path: "/baz" }));

      await fetch(`${host}/bar`);

      assert(mockServer.hasBeenCalledWith({ method: "GET", path: "/foo" }));
      assert(mockServer.hasBeenCalledWith({ method: "GET", path: "/bar" }));

      assert(!mockServer.hasBeenCalledWith({ method: "GET", path: "/baz" }));
    });
  });

  describe("#hasBeenCalledTimes", () => {
    it("returns true if mock server was called a certain number of times with given matcher", async () => {
      mockServer.get("/foo", 200).get("/bar", 200);

      assert(mockServer.hasBeenCalledTimes(0, { method: "GET", path: "/foo" }));
      assert(mockServer.hasBeenCalledTimes(0, { method: "GET", path: "/bar" }));

      await fetch(`${host}/foo`);

      assert(mockServer.hasBeenCalledTimes(1, { method: "GET", path: "/foo" }));

      await fetch(`${host}/foo`);

      assert(mockServer.hasBeenCalledTimes(2, { method: "GET", path: "/foo" }));

      await fetch(`${host}/bar`);

      assert(mockServer.hasBeenCalledTimes(2, { method: "GET", path: "/foo" }));
      assert(mockServer.hasBeenCalledTimes(1, { method: "GET", path: "/bar" }));
    });
  });
});
