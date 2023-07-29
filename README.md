<p align="center">
  <img width="85%" src="https://raw.githubusercontent.com/joshuajaco/mocaron/main/logo.png" alt="mocaron" />
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
  Simple <a href="https://expressjs.com">express</a> mock server with an API inspired by <a href="https://www.wheresrhys.co.uk/fetch-mock">fetch-mock</a>
</p>

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

# API

## `MockServer`

### `constructor(options): MockServer`

Creates a new [`MockServer`](#mockserver) instance.

| Param   | Type                  | Default |
| ------- | --------------------- | ------- |
| options | [`Options`](#options) | -       |

#### Example

```ts
const mockServer = new MockServer({ port: 3000 });
```

---

### `start(): Promise<void>`

Starts the mock server.

#### Example

```ts
await mockServer.start();
```

---

### `stop(): Promise<void>`

Stops the mock server.

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

Returns the [`MockServer`](#mockserver) instance.

#### Example

```ts
mockServer.mock("/test", { status: 204 });

const response = await fetch("http://localhost:3000/test");

console.log(response.status); // 204
```

---

### `get(matcher, response, options): MockServer`

Register a mock that only responds to requests using the http `GET` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

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

Register a mock that only responds to requests using the http `POST` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

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

Register a mock that only responds to requests using the http `PATCH` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

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

Register a mock that only responds to requests using the http `DELETE` method.

| Param    | Type                                                | Default |
| -------- | --------------------------------------------------- | ------- |
| matcher  | `string` \| `RegExp` \| [`MatcherObj`](#matcherobj) | -       |
| response | `string` \| `number` \| [`Response`](#response)     | -       |
| options  | [`MockOptions`](#mockoptions)                       | `{}`    |

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

console.log(mocks); // [{ matcher: "/test", response: { status: 204 } }]
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
// [{ matcher: { path: "/test", request: <express.Request> } }]
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
// [{ matcher: "/test", response: { status: 200 } }]

console.log(mockServer.calls());
// [{ path: "/test", method: "GET", request: <express.Request> }]

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

object with the following properties:

| Property | Type     | Description                    |
| -------- | -------- | ------------------------------ |
| port     | `number` | port to run the mock server on |

## `Matcher`

Type alias for [`MatcherObj`](#matcherobj) | [`MatcherFn`](#matcherfn).

```ts
type Matcher = MatcherObj | MatcherFn;
```

## `MatcherObj`

object with the following properties:

| Property | Type                                                                                        | Description                       |
| -------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| method   | `string` \| `undefined`                                                                     | http method to match against      |
| path     | `string` \| `RegExp` \| `undefined`                                                         | path to match against             |
| query    | [`express.Request["query"]`](https://expressjs.com/en/4x/api.html#req.query) \| `undefined` | query parameters to match against |
| headers  | `Record<string, string \| undefined>` \| `undefined`                                        | headers to match against          |
| body     | `string` \| `object` \| `undefined`                                                         | body to match against             |

## `MatcherFn`

A function that takes an [`express.Request`](https://expressjs.com/en/4x/api.html#req) and returns whether the request should match.

```ts
type MatcherFn = (req: express.Request) => boolean;
```

## `Response`

Type alias for [`ResponseObj`](#responseobj) | [`ResponseFn`](#responsefn).

```ts
type Response = ResponseObj | ResponseFn;
```

## `ResponseObj`

object with the following properties:

| Property | Type                                    | Description                 |
| -------- | --------------------------------------- | --------------------------- |
| status   | `number` \| `undefined`                 | status code to respond with |
| headers  | `Record<string, string>` \| `undefined` | headers to respond with     |
| body     | `string` \| `object` \| `undefined`     | body to respond with        |

## `ResponseFn`

A function that takes an [`express.Request`](https://expressjs.com/en/4x/api.html#req) and returns an [`ResponseObj`](#responseobj).

```ts
type ResponseFn = (req: express.Request) => ResponseObj;
```

## `MockOptions`

object with the following properties:

| Property  | Type                     | Description                                                                          |
| --------- | ------------------------ | ------------------------------------------------------------------------------------ |
| overwrite | `boolean` \| `undefined` | when set to `true`,<br/>previous mocks matching the same request will be overwritten |

## `Mock`

object with the following properties:

| Property | Type                          | Description                                        |
| -------- | ----------------------------- | -------------------------------------------------- |
| matcher  | [`Matcher`](#matcher)         | matcher to match against the request               |
| response | [`Response`](#response)       | response the server will respond with when matched |
| options  | [`MockOptions`](#mockoptions) | see [`MockOptions`](#mockoptions)                  |

## `Call`

object with the following properties:

| Property | Type                                                          | Description                         |
| -------- | ------------------------------------------------------------- | ----------------------------------- |
| request  | [`express.Request`](https://expressjs.com/en/4x/api.html#req) | request the server was called with  |
| matcher  | [`Matcher`](#matcher)                                         | matcher thr request matched against |

# Changelog

[CHANGELOG.md](https://github.com/joshuajaco/mocaron/blob/main/CHANGELOG.md)

# License

[MIT](https://github.com/joshuajaco/mocaron/blob/main/LICENSE)
