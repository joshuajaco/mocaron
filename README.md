<p align="center">
  <a href="https://github.com/joshuajaco/mocaron">
    <img width="85%" src="https://raw.githubusercontent.com/joshuajaco/mocaron/main/logo.png" alt="mocaron" />
  </a>
  <br />
  <br />
  <a href="https://npmjs.com/package/mocaron">
    <img src="https://img.shields.io/npm/dw/mocaron" alt="npm downloads" />
  </a>  
  <a href="https://coveralls.io/github/joshuajaco/mocaron">
    <img src="https://coveralls.io/repos/github/joshuajaco/mocaron/badge.svg" alt="Coverage Status" />
  </a>
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square" alt="code style: prettier" />
  </a>
  <br />
  <br />
  Simple <a href="https://expressjs.com">express</a> mock server with a flexible API inspired by <a href="https://www.wheresrhys.co.uk/fetch-mock">fetch-mock</a>
</p>

---

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [API](#api)
- [Changelog](#changelog)
- [License](#license)

---

# Installation

```bash
# npm
npm install -D mocaron

# yarn
yarn add -D mocaron

# pnpm
pnpm add -D mocaron
```

# Quick Start

```ts
import { MockServer } from "mocaron";

const mockServer = new MockServer({ port: 3000 });

await mockServer.start();

mockServer.get("/test", { status: 200, body: { message: "Hello World" } });

const response = await fetch("http://localhost:3000/test");

console.log(response.status); // 200
console.log(await response.json()); // { message: "Hello World" }

await mockServer.stop();
```

# Usage

## Starting and stopping the mock server

See [`constructor()`](#constructoroptions-mockserver) [`start()`](#start-promisevoid) [`stop()`](#stop-promisevoid)

```ts
import { MockServer } from "mocaron";

const mockServer = new MockServer({ port: 3000 });

await mockServer.start();

// ...

await mockServer.stop();
```

## Registering a mock

Register a mock using [`mock()`](#mockmatcher-response-options-mockserver).

```ts
mockServer.mock(
  { path: "/test", method: "GET" },
  { status: 200, body: { message: "Hello World" } },
);

const response = await fetch("http://localhost:3000/test");

console.log(response.status); // 200
console.log(await response.json()); // { message: "Hello World" }
```

## Method specific mocks

You can also register mocks that only match a specific HTTP method.

See [`get()`](#getmatcher-response-options-mockserver) [`post()`](#postmatcher-response-options-mockserver) [`patch()`](#patchmatcher-response-options-mockserver) [`delete()`](#deletematcher-response-options-mockserver)

```ts
mockServer
  .get("/test", { status: 200, body: { message: "Hello World" } })
  .post("/test", { status: 201, body: { message: "Created" } })
  .patch("/test", { status: 200, body: { message: "Updated" } })
  .delete("/test", { status: 204 });
```

## Unmatched requests

If a request does not match any of the registered mocks the server will respond with a 404 status code.

```ts
const response = await fetch("http://localhost:3000/test");

console.log(response.status); // 404
```

## Ambiguous mocks

If two or more mocks match the same request the server will respond with a 404 status code.

```ts
mockServer.mock({ path: "/foo" }, "foo").mock({ path: "/foo" }, "bar");

const response = await fetch("http://localhost:3000/foo");

console.log(response.status); // 404
```

You can override this behavior by passing the [`overwrite`](#mockoptions) option to the last matching mock.

```ts
mockServer
  .mock({ path: "/foo" }, "foo")
  .mock({ path: "/foo" }, "bar", { overwrite: true });

const response = await fetch("http://localhost:3000/foo");

console.log(response.status); // 200
console.log(await response.text()); // bar
```

## Resetting the mock server

Calling [`reset()`](#reset-void) will reset the mock server to its initial state.

```ts
mockServer.get("/test", { status: 200 });

let response = await fetch("http://localhost:3000/test");
console.log(response.status); // 200

mockServer.reset();

response = await fetch("http://localhost:3000/test");
console.log(response.status); // 404
```

## Testing

Set up the mock server for each test using [`start()`](#start-promisevoid), [`stop()`](#stop-promisevoid) and [`reset()`](#reset-void).

```ts
import { MockServer } from "mocaron";
import { beforeAll, afterAll, beforeEach, test, assert } from "my-test-library";

const mockServer = new MockServer({ port: 3000 });

beforeAll(() => mockServer.start());
afterAll(() => mockServer.stop());
beforeEach(() => mockServer.reset());
```

Test that a mock has been called using [`hasBeenCalledWith()`](#hasbeencalledwithmatcher-boolean).

```ts
test("mock has been called", async () => {
  mockServer.get("/test", { status: 200 });

  await fetch("http://localhost:3000/test");

  assert(mockServer.hasBeenCalledWith({ path: "/test" }));
});
```

Test that a mock has been called a specific number of times using [`hasBeenCalledTimes()`](#hasbeencalledtimestimes-matcher-boolean).

```ts
test("mock has been called 3 times", async () => {
  mockServer.get("/test", { status: 200 });

  await fetch("http://localhost:3000/test");
  await fetch("http://localhost:3000/test");
  await fetch("http://localhost:3000/test");

  assert(mockServer.hasBeenCalledTimes(3, { path: "/test" }));
});
```

Custom assertions using [`calls()`](#calls-readonly-call).

```ts
test("custom assertion", async () => {
  mockServer.get("/test", { status: 200 });

  await fetch("http://localhost:3000/test");

  assert(mockServer.calls().length === 1);
  assert(mockServer.calls()[0].request.path === "/test");
});
```

# API

- [`MockServer`](#mockserver)
  - [`constructor()`](#constructoroptions-mockserver)
  - [`start()`](#start-promisevoid)
  - [`stop()`](#stop-promisevoid)
  - [`port()`](#port-number)
  - [`mock()`](#mockmatcher-response-options-mockserver)
  - [`get()`](#getmatcher-response-options-mockserver)
  - [`post()`](#postmatcher-response-options-mockserver)
  - [`patch()`](#patchmatcher-response-options-mockserver)
  - [`delete()`](#deletematcher-response-options-mockserver)
  - [`mocks()`](#mocks-readonly-mock)
  - [`calls()`](#calls-readonly-call)
  - [`hasBeenCalledWith()`](#hasbeencalledwithmatcher-boolean)
  - [`hasBeenCalledTimes()`](#hasbeencalledtimestimes-matcher-boolean)
  - [`reset()`](#reset-void)
  - [`resetMocks()`](#resetmocks-void)
  - [`resetCalls()`](#resetcalls-void)
- [`Options`](#options)
- [`Matcher`](#matcher)
- [`MatcherObj`](#matcherobj)
- [`MatcherFn`](#matcherfn)
- [`Response`](#response)
- [`ResponseObj`](#responseobj)
- [`ResponseFn`](#responsefn)
- [`MockOptions`](#mockoptions)
- [`Mock`](#mock)
- [`Call`](#call)

## `MockServer`

### `constructor(options): MockServer`

Create a new [`MockServer`](#mockserver) instance.

| Param   | Type                  | Default |
| ------- | --------------------- | ------- |
| options | [`Options`](#options) | -       |

#### Example

```ts
const mockServer = new MockServer({ port: 3000 });
```

---

### `start(): Promise<void>`

Start the mock server.

#### Example

```ts
await mockServer.start();
```

---

### `stop(): Promise<void>`

Stop the mock server.

#### Example

```ts
await mockServer.stop();
```

---

### `port(): number`

Get the port the mock server is running on.

#### Example

```ts
const port = mockServer.port();
console.log(port); // 3000
```

---

### `mock(matcher, response, options): MockServer`

Register a mock.

| Param    | Type                                            | Default |
| -------- | ----------------------------------------------- | ------- |
| matcher  | [`Matcher`](#matcher)                           | -       |
| response | `string` \| `number` \| [`Response`](#response) | -       |
| options  | [`MockOptions`](#mockoptions)                   | `{}`    |

If `response` is a `string`, it will be used as the response body.  
If `response` is a `number`, it will be used as the response status code.

Returns the [`MockServer`](#mockserver) instance.

#### Example

```ts
mockServer.mock({ path: "/test" }, { status: 204 });

const response = await fetch("http://localhost:3000/test");

console.log(response.status); // 204
```

---

### `get(matcher, response, options): MockServer`

Register a mock that only responds to requests using the HTTP `GET` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

If `matcher` is a `string` or `RegExp`, it will be used to match the request path.  
If `response` is a `string`, it will be used as the response body.  
If `response` is a `number`, it will be used as the response status code.

Returns the [`MockServer`](#mockserver) instance.

#### Example

```ts
mockServer.get("/test", {
  status: 200,
  body: { message: "Hello World" },
});

const response = await fetch("http://localhost:3000/test");

console.log(response.status); // 200
console.log(await response.json()); // { message: "Hello World" }
```

---

### `post(matcher, response, options): MockServer`

Register a mock that only responds to requests using the HTTP `POST` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

If `matcher` is a `string` or `RegExp`, it will be used to match the request path.  
If `response` is a `string`, it will be used as the response body.  
If `response` is a `number`, it will be used as the response status code.

Returns the [`MockServer`](#mockserver) instance.

#### Example

```ts
mockServer.post("/test", {
  status: 201,
  body: { message: "Hello World" },
});

const response = await fetch("http://localhost:3000/test", {
  method: "POST",
  body: JSON.stringify({ message: "Hello World" }),
});

console.log(response.status); // 201
console.log(await response.json()); // { message: "Hello World" }
```

---

### `patch(matcher, response, options): MockServer`

Register a mock that only responds to requests using the HTTP `PATCH` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

If `matcher` is a `string` or `RegExp`, it will be used to match the request path.  
If `response` is a `string`, it will be used as the response body.  
If `response` is a `number`, it will be used as the response status code.

Returns the [`MockServer`](#mockserver) instance.

#### Example

```ts
mockServer.patch("/test", {
  status: 200,
  body: { message: "Hello World" },
});

const response = await fetch("http://localhost:3000/test", {
  method: "PATCH",
  body: JSON.stringify({ message: "Hello World" }),
});

console.log(response.status); // 200
console.log(await response.json()); // { message: "Hello World" }
```

---

### `delete(matcher, response, options): MockServer`

Register a mock that only responds to requests using the HTTP `DELETE` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

If `matcher` is a `string` or `RegExp`, it will be used to match the request path.  
If `response` is a `string`, it will be used as the response body.  
If `response` is a `number`, it will be used as the response status code.

Returns the [`MockServer`](#mockserver) instance.

#### Example

```ts
mockServer.delete("/test", { status: 204 });

const response = await fetch("http://localhost:3000/test", {
  method: "DELETE",
});

console.log(response.status); // 204
```

---

### `mocks(): readonly Mock[]`

Get all registered mocks.

Returns an array of [`Mock`](#mock) objects.

#### Example

```ts
mockServer.mock({ path: "/test" }, { status: 204 });

const mocks = mockServer.mocks();

console.log(mocks);
// [{ matcher: { path: "/test" }, response: { status: 204 } }]
```

---

### `calls(): readonly Call[]`

Get all registered calls.

Returns an array of [`Call`](#call) objects.

#### Example

```ts
mockServer.mock({ path: "/test" }, { status: 204 });
await fetch("http://localhost:3000/test");

const calls = mockServer.calls();

console.log(calls);
// [{ matcher: { path: "/test" }, request: <express.Request> }]
```

---

### `hasBeenCalledWith(matcher): boolean`

Check if the route has been called with the given `matcher`.

| Param   | Type                  | Default |
| ------- | --------------------- | ------- |
| matcher | [`Matcher`](#matcher) | -       |

Returns `true` if the route has been called with the given `matcher`, `false` otherwise.

#### Example

```ts
mockServer.get("/test", { status: 200 });

console.log(mockServer.hasBeenCalledWith({ path: "/test" })); // false

await fetch("http://localhost:3000/test");

console.log(mockServer.hasBeenCalledWith({ path: "/test" })); // true
```

---

### `hasBeenCalledTimes(times, matcher): boolean`

Check if the route has been called a certain number of times with the given `matcher`.

| Param   | Type                  | Default |
| ------- | --------------------- | ------- |
| times   | `number`              | -       |
| matcher | [`Matcher`](#matcher) | -       |

Returns `true` if the route has been called `times` times with the given `matcher`, `false` otherwise.

```ts
mockServer.get("/test", { status: 200 });

console.log(mockServer.hasBeenCalledTimes(0, { path: "/test" })); // true
console.log(mockServer.hasBeenCalledTimes(1, { path: "/test" })); // false

await fetch("http://localhost:3000/test");

console.log(mockServer.hasBeenCalledTimes(0, { path: "/test" })); // false
console.log(mockServer.hasBeenCalledTimes(1, { path: "/test" })); // true
```

---

### `reset(): void`

Reset all mocks and calls.

#### Example

```ts
mockServer.get("/test", { status: 200 });
await fetch("http://localhost:3000/test");

console.log(mockServer.mocks());
// [{ matcher: { path: "/test", method: "GET" }, response: { status: 200 } }]

console.log(mockServer.calls());
// [{ matcher: { path: "/test", method: "GET" }, request: <express.Request> }]

mockServer.reset();

console.log(mockServer.mocks()); // []
console.log(mockServer.calls()); // []
```

---

### `resetMocks(): void`

Reset all mocks.

#### Example

```ts
mockServer.get("/test", { status: 200 });

console.log(mockServer.mocks());
// [{ matcher: { path: "/test", method: "GET" }, response: { status: 200 } }]

mockServer.resetMocks();

console.log(mockServer.mocks()); // []
```

---

### `resetCalls(): void`

Reset all calls.

#### Example

```ts
mockServer.get("/test", { status: 200 });
await fetch("http://localhost:3000/test");

console.log(mockServer.calls());
// [{ matcher: { path: "/test", method: "GET" }, request: <express.Request> }]

mockServer.resetCalls();

console.log(mockServer.calls()); // []
```

## `Options`

Object with the following properties:

| Property | Type     | Description                    |
| -------- | -------- | ------------------------------ |
| port     | `number` | port to run the mock server on |

## `Matcher`

Type alias for [`MatcherObj`](#matcherobj) | [`MatcherFn`](#matcherfn).

```ts
type Matcher = MatcherObj | MatcherFn;
```

## `MatcherObj`

Object with the following properties:

| Property | Type                                                                                        | Description                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| method   | `string` \| `undefined`                                                                     | HTTP method to match against                                                                                  |
| path     | `string` \| `RegExp` \| `undefined`                                                         | path to match against                                                                                         |
| query    | [`express.Request["query"]`](https://expressjs.com/en/4x/api.html#req.query) \| `undefined` | query parameters to match against.<br/>Parameters explicitly set to `undefined` will not match when provided. |
| headers  | `Record<string, string \| undefined>` \| `undefined`                                        | headers to match against.<br/>Headers explicitly set to `undefined` will not match when provided.             |
| body     | `string` \| `object` \| `undefined`                                                         | body to match against.<br/>If an `object` is given it will be compared to the request body parsed as JSON.    |

## `MatcherFn`

Function that takes an [`express.Request`](https://expressjs.com/en/4x/api.html#req) and returns whether the request should match.

```ts
type MatcherFn = (req: express.Request) => boolean;
```

## `Response`

Type alias for [`ResponseObj`](#responseobj) | [`ResponseFn`](#responsefn).

```ts
type Response = ResponseObj | ResponseFn;
```

## `ResponseObj`

Object with the following properties:

| Property | Type                                    | Description                                                                              |
| -------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| status   | `number` \| `undefined`                 | status code to respond with (defaults to `200`)                                          |
| headers  | `Record<string, string>` \| `undefined` | headers to respond with                                                                  |
| body     | `string` \| `object` \| `undefined`     | body to respond with.<br/>If an `object` is given it will be converted to a JSON string. |

## `ResponseFn`

Function that takes an [`express.Request`](https://expressjs.com/en/4x/api.html#req) and returns a [`ResponseObj`](#responseobj).

```ts
type ResponseFn = (req: express.Request) => ResponseObj;
```

## `MockOptions`

Object with the following properties:

| Property  | Type                     | Description                                                                                                        |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| overwrite | `boolean` \| `undefined` | when set to `true`,<br/>previous [ambiguous mocks](#ambiguous-mocks) matching the same request will be overwritten |

## `Mock`

Object with the following properties:

| Property | Type                          | Description                                        |
| -------- | ----------------------------- | -------------------------------------------------- |
| matcher  | [`Matcher`](#matcher)         | matcher to match against the request               |
| response | [`Response`](#response)       | response the server will respond with when matched |
| options  | [`MockOptions`](#mockoptions) | see [`MockOptions`](#mockoptions)                  |

## `Call`

Object with the following properties:

| Property | Type                                                          | Description                         |
| -------- | ------------------------------------------------------------- | ----------------------------------- |
| request  | [`express.Request`](https://expressjs.com/en/4x/api.html#req) | request the server was called with  |
| matcher  | [`Matcher`](#matcher)                                         | matcher the request matched against |

# Changelog

[CHANGELOG.md](https://github.com/joshuajaco/mocaron/blob/main/CHANGELOG.md)

# License

[MIT](https://github.com/joshuajaco/mocaron/blob/main/LICENSE)
