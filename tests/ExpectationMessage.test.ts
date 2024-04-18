import { after, afterEach, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPort } from "get-port-please";
import { MockServer, ExpectationMessage } from "../src";

describe("ExpectationMessage", () => {
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

  describe(".hasBeenCalledWith", () => {
    it("formats message", async () => {
      mockServer
        .get("/foo", 200)
        .post("/bar", 200)
        .get("/bar", 200)
        .patch("/bar", 200)
        .delete("/bar", 200);

      await fetch(`${host}/foo`);

      await fetch(`${host}/foo?foo=bar`);

      await fetch(`${host}/bar`, {
        method: "POST",
        body: JSON.stringify({ some: "content" }),
      });

      await fetch(`${host}/bar`);

      await fetch(`${host}/bar`, {
        method: "PATCH",
        body: "string",
        headers: { Authorization: "1" },
      });

      await fetch(`${host}/bar`, { method: "DELETE" });

      const matcher = {
        method: "POST",
        path: "/foo",
        query: { foo: "bar" },
        headers: { Authorization: "1" },
        body: { some: "content" },
      };

      assert.equal(
        ExpectationMessage.hasBeenCalledWith(mockServer, matcher),
        `Expected 'mockServer' to have been called with matcher:\n{\n  "method": "POST",\n  "path": "/foo",\n  "query": {\n    "foo": "bar"\n  },\n  "headers": {\n    "Authorization": "1"\n  },\n  "body": {\n    "some": "content"\n  }\n}\n\nGET /foo:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "body": Object {\x1B[39m\n\x1B[32m-     "some": "content",\x1B[39m\n\x1B[32m-   },\x1B[39m\n\x1B[31m+   "body": undefined,\x1B[39m\n\x1B[2m    "headers": Object {\x1B[22m\n\x1B[32m-     "Authorization": "1",\x1B[39m\n\x1B[31m+     "Authorization": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[32m-   "method": "POST",\x1B[39m\n\x1B[31m+   "method": "GET",\x1B[39m\n\x1B[2m    "path": "/foo",\x1B[22m\n\x1B[2m    "query": Object {\x1B[22m\n\x1B[2m      "foo": "bar",\x1B[22m\n\x1B[2m    },\x1B[22m\n\x1B[2m  }\x1B[22m\n\nPOST /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[2m    "body": Object {\x1B[22m\n\x1B[2m      "some": "content",\x1B[22m\n\x1B[2m    },\x1B[22m\n\x1B[2m    "headers": Object {\x1B[22m\n\x1B[32m-     "Authorization": "1",\x1B[39m\n\x1B[31m+     "Authorization": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[2m    "method": "POST",\x1B[22m\n\x1B[32m-   "path": "/foo",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m    "query": Object {\x1B[22m\n\x1B[32m-     "foo": "bar",\x1B[39m\n\x1B[31m+     "foo": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[2m  }\x1B[22m\n\nGET /foo:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "body": Object {\x1B[39m\n\x1B[32m-     "some": "content",\x1B[39m\n\x1B[32m-   },\x1B[39m\n\x1B[31m+   "body": undefined,\x1B[39m\n\x1B[2m    "headers": Object {\x1B[22m\n\x1B[32m-     "Authorization": "1",\x1B[39m\n\x1B[31m+     "Authorization": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[32m-   "method": "POST",\x1B[39m\n\x1B[31m+   "method": "GET",\x1B[39m\n\x1B[2m    "path": "/foo",\x1B[22m\n\x1B[2m    "query": Object {\x1B[22m\n\x1B[32m-     "foo": "bar",\x1B[39m\n\x1B[31m+     "foo": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[2m  }\x1B[22m\n\nPATCH /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "body": Object {\x1B[39m\n\x1B[32m-     "some": "content",\x1B[39m\n\x1B[32m-   },\x1B[39m\n\x1B[31m+   "body": "string",\x1B[39m\n\x1B[2m    "headers": Object {\x1B[22m\n\x1B[32m-     "Authorization": "1",\x1B[39m\n\x1B[31m+     "Authorization": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[32m-   "method": "POST",\x1B[39m\n\x1B[32m-   "path": "/foo",\x1B[39m\n\x1B[31m+   "method": "PATCH",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m    "query": Object {\x1B[22m\n\x1B[32m-     "foo": "bar",\x1B[39m\n\x1B[31m+     "foo": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[2m  }\x1B[22m\n\nGET /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "body": Object {\x1B[39m\n\x1B[32m-     "some": "content",\x1B[39m\n\x1B[32m-   },\x1B[39m\n\x1B[31m+   "body": undefined,\x1B[39m\n\x1B[2m    "headers": Object {\x1B[22m\n\x1B[32m-     "Authorization": "1",\x1B[39m\n\x1B[31m+     "Authorization": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[32m-   "method": "POST",\x1B[39m\n\x1B[32m-   "path": "/foo",\x1B[39m\n\x1B[31m+   "method": "GET",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m    "query": Object {\x1B[22m\n\x1B[32m-     "foo": "bar",\x1B[39m\n\x1B[31m+     "foo": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[2m  }\x1B[22m\n\nDELETE /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "body": Object {\x1B[39m\n\x1B[32m-     "some": "content",\x1B[39m\n\x1B[32m-   },\x1B[39m\n\x1B[31m+   "body": undefined,\x1B[39m\n\x1B[2m    "headers": Object {\x1B[22m\n\x1B[32m-     "Authorization": "1",\x1B[39m\n\x1B[31m+     "Authorization": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[32m-   "method": "POST",\x1B[39m\n\x1B[32m-   "path": "/foo",\x1B[39m\n\x1B[31m+   "method": "DELETE",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m    "query": Object {\x1B[22m\n\x1B[32m-     "foo": "bar",\x1B[39m\n\x1B[31m+     "foo": undefined,\x1B[39m\n\x1B[2m    },\x1B[22m\n\x1B[2m  }\x1B[22m`,
      );

      assert.equal(
        ExpectationMessage.hasBeenCalledWith(mockServer, { path: "/foobar" }),
        `Expected 'mockServer' to have been called with matcher:\n{\n  "path": "/foobar"\n}\n\nGET /foo:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "path": "/foobar",\x1B[39m\n\x1B[31m+   "path": "/foo",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nGET /foo:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "path": "/foobar",\x1B[39m\n\x1B[31m+   "path": "/foo",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nPOST /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "path": "/foobar",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nGET /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "path": "/foobar",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nPATCH /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "path": "/foobar",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nDELETE /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "path": "/foobar",\x1B[39m\n\x1B[31m+   "path": "/bar",\x1B[39m\n\x1B[2m  }\x1B[22m`,
      );

      assert.equal(
        ExpectationMessage.hasBeenCalledWith(mockServer, { method: "PUT" }),
        `Expected 'mockServer' to have been called with matcher:\n{\n  "method": "PUT"\n}\n\nGET /foo:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "method": "PUT",\x1B[39m\n\x1B[31m+   "method": "GET",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nGET /foo:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "method": "PUT",\x1B[39m\n\x1B[31m+   "method": "GET",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nPOST /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "method": "PUT",\x1B[39m\n\x1B[31m+   "method": "POST",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nGET /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "method": "PUT",\x1B[39m\n\x1B[31m+   "method": "GET",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nPATCH /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "method": "PUT",\x1B[39m\n\x1B[31m+   "method": "PATCH",\x1B[39m\n\x1B[2m  }\x1B[22m\n\nDELETE /bar:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "method": "PUT",\x1B[39m\n\x1B[31m+   "method": "DELETE",\x1B[39m\n\x1B[2m  }\x1B[22m`,
      );
    });

    it("formats message with function matcher", async () => {
      const matcher = () => true;

      assert.equal(
        ExpectationMessage.hasBeenCalledWith(mockServer, matcher),
        "Expected 'mockServer' to have been called with matcher:\n() => true\n\nNo diff (matcher is a function)",
      );
    });
  });

  describe(".hasBeenCalledTimes", () => {
    it("formats message", async () => {
      mockServer.get("/foo", 200);

      await fetch(`${host}/foo`);

      const matcher = { path: "/foo" };

      assert.equal(
        ExpectationMessage.hasBeenCalledTimes(mockServer, 2, matcher),
        `Expected 'mockServer' to have been called 2 times with matcher:\n{\n  "path": "/foo"\n}\n\nActual calls: 1`,
      );
    });

    it("formats message without calls", async () => {
      mockServer.get("/foo", 200);

      await fetch(`${host}/foo`);

      const matcher = { path: "/bar" };

      assert.equal(
        ExpectationMessage.hasBeenCalledTimes(mockServer, 2, matcher),
        `Expected 'mockServer' to have been called with matcher:\n{\n  "path": "/bar"\n}\n\nGET /foo:\n\x1B[32m- Expected\x1B[39m\n\x1B[31m+ Received\x1B[39m\n\n\x1B[2m  Object {\x1B[22m\n\x1B[32m-   "path": "/bar",\x1B[39m\n\x1B[31m+   "path": "/foo",\x1B[39m\n\x1B[2m  }\x1B[22m`,
      );
    });
  });
});
