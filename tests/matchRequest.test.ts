import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequest, type RequestOptions } from "node-mocks-http";
import { matchRequest, type Matcher } from "../src/matchRequest";

describe("matchRequest", () => {
  it("matches with method", () => {
    const matcher = { method: "GET" };

    const matches = [
      { method: "GET" as const },
      { method: "GET" as const, query: { foo: "bar" } },
    ];

    const fails = [
      { method: "POST" as const },
      { method: "PATCH" as const },
      { method: "DELETE" as const, query: { foo: "bar" } },
    ];

    assertRequestMatches(matcher, { matches, fails });
  });

  it("matches with string path", () => {
    const matcher = { path: "/test" };

    const matches = [
      { path: "/test" },
      { path: "/test", query: { foo: "bar" } },
    ];

    const fails = [
      { path: "/test/foo" },
      { path: "/foo", query: { foo: "bar" } },
    ];

    assertRequestMatches(matcher, { matches, fails });
  });

  it("matches with regex path", () => {
    const matcher = { path: /\/test/ };

    const matches = [
      { path: "/test" },
      { path: "/test", query: { foo: "bar" } },
      { path: "/tests" },
      { path: "/test/foo" },
    ];

    const fails = [{ path: "/foo" }, { path: "/bar", query: { foo: "bar" } }];

    assertRequestMatches(matcher, { matches, fails });
  });

  it("matches with query", () => {
    const matcher = {
      query: { foo: "bar", array: ["a", "b", "c"], baz: undefined },
    };

    const matches = [
      { query: { foo: "bar", array: ["a", "b", "c"] } },
      { path: "/foo", query: { foo: "bar", array: ["a", "b", "c"] } },
      { path: "/bar", query: { foo: "bar", array: ["a", "b", "c"] } },
    ];

    const fails = [
      { query: { foo: "bar", array: ["a", "b", "c"], baz: "1" } },
      { path: "/foo" },
      { query: { array: ["a", "b", "c"] } },
      { query: { foo: "bar" } },
      { query: { foo: "baz", array: ["a", "b", "c"] } },
      { query: { foo: "bar", array: ["c", "b", "a"] } },
      { query: { foo: "bar", array: 1 } },
    ];

    assertRequestMatches(matcher, { matches, fails });
  });

  it("matches with headers", () => {
    const matcher = {
      headers: { "Content-Type": "application/json", bar: undefined },
    };

    const matches = [
      { headers: { "Content-Type": "application/json" } },
      { headers: { "content-type": "application/json" }, path: "/foo" },
      {
        headers: { "CONTENT-TYPE": "application/json", foo: "bar" },
        query: { foo: "bar" },
      },
    ];

    const fails = [
      { headers: { "Content-Type": "application/json", bar: "1" } },
      { headers: { "Content-Type": "application/pdf" } },
      { headers: { foo: "baz" }, path: "/foo" },
      { path: "/foo" },
    ];

    assertRequestMatches(matcher, { matches, fails });
  });

  it("matches with string body", () => {
    const matcher = { body: "foobar" };

    const matches = [
      { body: Buffer.from("foobar", "utf-8") },
      { body: Buffer.from("foobar", "utf-8"), path: "/foo" },
      { body: Buffer.from("foobar", "utf-8"), query: { foo: "bar" } },
    ];

    const fails = [
      { body: Buffer.from("foobaz", "utf-8") },
      { body: Buffer.from("foobaz", "utf-8"), path: "/foo" },
      { path: "/foo" },
    ];

    assertRequestMatches(matcher, { matches, fails });
  });

  it("matches with json string body", () => {
    const matcher = { body: { foo: "bar" } };

    const matches = [
      { body: Buffer.from(JSON.stringify({ foo: "bar" }), "utf-8") },
      {
        body: Buffer.from(JSON.stringify({ foo: "bar" }), "utf-8"),
        path: "/foo",
      },
      {
        body: Buffer.from(JSON.stringify({ foo: "bar" }), "utf-8"),
        query: { foo: "bar" },
      },
    ];

    const fails = [
      { body: Buffer.from(JSON.stringify({ foo: "baz" }), "utf-8") },
      {
        body: Buffer.from(JSON.stringify({ foo: "baz" }), "utf-8"),
        path: "/foo",
      },
      { body: Buffer.from('lk"smal}ks{d', "utf-8") },
      { path: "/foo" },
    ];

    assertRequestMatches(matcher, { matches, fails });
  });

  it("matches with matcher function", () => {
    const requests = [{ path: "/test" }, { query: { foo: "bar" } }];
    assertRequestMatches(() => true, { matches: requests, fails: [] });
    assertRequestMatches(() => false, { matches: [], fails: requests });
  });

  it("matches with empty matcher", () => {
    const matcher = {};
    const matches = [{ path: "/test" }, { query: { foo: "bar" } }];
    assertRequestMatches(matcher, { matches, fails: [] });
  });
});

function assertRequestMatches(
  matcher: Matcher,
  { matches, fails }: { matches: RequestOptions[]; fails: RequestOptions[] },
) {
  matches.forEach((request) => assertRequestMatch(matcher, request, true));
  fails.forEach((request) => assertRequestMatch(matcher, request, false));
}

function assertRequestMatch(
  matcher: Matcher,
  request: RequestOptions,
  expected: boolean,
) {
  assert.equal(
    matchRequest(matcher, createRequest(request)),
    expected,
    `Expected matcher ${JSON.stringify(matcher)}${
      expected ? " " : " not "
    }to match request ${JSON.stringify(request)}`,
  );
}
