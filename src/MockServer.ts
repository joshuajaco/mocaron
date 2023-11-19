import type http from "node:http";
import express from "express";
import bodyParser from "body-parser";
import { matchRequest } from "./matchRequest";
import type { Request, Matcher, MatcherObj } from "./matchRequest";

/** @see [Documentation]{@link https://github.com/joshuajaco/mocaron#responseobj} */
export type ResponseObj = {
  /**
   * status code to respond with (defaults to `200`)
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#responseobj}
   */
  status?: number;
  /**
   * headers to respond with
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#responseobj}
   */
  headers?: Record<string, string>;
  /**
   * body to respond with -
   * If an `object` is given it will be converted to a JSON string
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#responseobj}
   */
  body?: string | object;
};

/**
 * @param {Request} req - request to match against
 * @returns {ResponseObj} response the mock server should respond with
 * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#responsefn}
 */
export type ResponseFn = (req: Request) => ResponseObj;

/**
 * response the mock server should respond with
 * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#response}
 */
export type Response = ResponseObj | ResponseFn;

/** @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mockoptions} */
export type MockOptions = {
  /**
   * when set to `true`,
   * previous [ambiguous mocks]{@link https://github.com/joshuajaco/mocaron#ambiguous-mocks} matching the same request will be overwritten
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mockoptions}
   */
  overwrite?: boolean;
};

/** @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mock} */
export type Mock = {
  /**
   * matcher to match against the request
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mock}
   */
  matcher: Matcher;
  /**
   * response the server will respond with when matched
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mock}
   */
  response: Response;
  /** @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mock} */
  options: MockOptions;
};

/** @see [Documentation]{@link https://github.com/joshuajaco/mocaron#call} */
export type Call = {
  /**
   * request the server was called with
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#call}
   */
  request: Request;
  /**
   * matcher the request matched against
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#call}
   */
  matcher: Matcher;
};

/** @see [Documentation]{@link https://github.com/joshuajaco/mocaron#options} */
export type Options = {
  /**
   * port to run the mock server on
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#options}
   */
  port: number;
};

/**
 * `mocaron` mock server
 * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mockserver}
 */
export class MockServer {
  #mocks: Mock[] = [];
  #calls: Call[] = [];
  #server: http.Server | null = null;
  readonly #app = express();

  /**
   * Create a new mock server instance.
   * @param {Options} options
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#constructoroptions-mockserver}
   * @example
   * const mockServer = new MockServer({ port: 3000 });
   */
  constructor(private readonly options: Options) {
    this.#app.use(bodyParser.raw({ type: "*/*" }));

    this.#app.use((req, res, next) => {
      // body-parser will parse the body into a Buffer. See https://github.com/expressjs/body-parser#bodyparserrawoptions
      // if the body was empty, it will be an empty object ({}). See https://github.com/expressjs/body-parser#api
      req.body = req.body instanceof Buffer ? req.body : undefined;
      next();
    });

    // eslint-disable-next-line @typescript-eslint/ban-types
    this.#app.all<"*", {}, unknown, Buffer | undefined>("*", (req, res) => {
      const matches = this.#mocks.filter(({ matcher }) =>
        matchRequest(matcher, req),
      );

      if (matches.length === 0) {
        console.warn("Unmatched", req.method, req.path);
        return res.status(404).end();
      }

      const match = matches.length === 1 ? matches[0] : matches.at(-1)!;

      this.#calls.push({
        request: req,
        matcher: match.matcher,
      });

      if (matches.length > 1 && !match.options.overwrite) {
        console.warn("Ambiguous", req.method, req.path);
        console.warn("use overwrite: true");
        return res.status(404).end();
      }

      const response =
        typeof match.response === "function"
          ? match.response(req)
          : match.response;

      res.status(response.status ?? 200);

      if (response.headers) {
        Object.entries(response.headers).forEach(([k, v]) => res.header(k, v));
      }

      if (response.body) {
        res.send(
          typeof response.body === "string"
            ? response.body
            : JSON.stringify(response.body),
        );
      }

      res.end();
    });
  }

  /**
   * Start the mock server.
   * @async
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#start-promisevoid}
   * @example
   * await mockServer.start();
   */
  public start(): Promise<void> {
    if (this.#server) {
      console.warn("Server is already running");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.#server = this.#app.listen(this.options.port, resolve);
    });
  }

  /**
   * Stop the mock server.
   * @async
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#stop-promisevoid}
   * @example
   * await mockServer.stop();
   */
  public stop(): Promise<void> {
    const server = this.#server;
    if (server) return new Promise((resolve) => server.close(() => resolve()));
    console.warn("No server is running");
    return Promise.resolve();
  }

  /**
   * Get the port the mock server is running on.
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#port-number}
   * @example
   * mockServer.port();
   */
  public port(): number {
    return this.options.port;
  }

  /**
   * Register a mock.
   * @param {string | RegExp | Matcher} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @param {string | number | Response} response - If response is a `string`, it will be used as the response body - If response is a `number`, it will be used as the response status code
   * @param {MockOptions} [options={}] mock options
   * @returns {MockServer} this
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mockmatcher-response-options-mockserver}
   * @example
   * mockServer.mock({ path: "/test" }, { status: 204 });
   */
  public mock(
    matcher: string | RegExp | Matcher,
    response: string | number | Response,
    options: MockOptions = {},
  ): this {
    matcher = this.#resolvePathMatcher(matcher);

    this.#mocks.push({
      matcher,
      response:
        typeof response === "string"
          ? { body: response }
          : typeof response === "number"
            ? { status: response }
            : response,
      options,
    });

    return this;
  }

  /**
   * Register a mock that only responds to requests using the http `GET` method.
   * @param {string | RegExp | Omit<MatcherObj, "method">} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @param {string | number | Response} response - If response is a `string`, it will be used as the response body - If response is a `number`, it will be used as the response status code
   * @param {MockOptions} [options={}] mock options
   * @returns {MockServer} this
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#getmatcher-response-options-mockserver}
   * @example
   * mockServer.get("/test", {
   *   status: 200,
   *   body: { message: "Hello World" },
   * });
   */
  public get(
    matcher: string | RegExp | Omit<MatcherObj, "method">,
    response: string | number | Response,
    options: MockOptions = {},
  ): this {
    return this.mock(this.#applyMethod("GET", matcher), response, options);
  }

  /**
   * Register a mock that only responds to requests using the http `POST` method.
   * @param {string | RegExp | Omit<MatcherObj, "method">} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @param {string | number | Response} response - If response is a `string`, it will be used as the response body - If response is a `number`, it will be used as the response status code
   * @param {MockOptions} [options={}] mock options
   * @returns {MockServer} this
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#postmatcher-response-options-mockserver}
   * @example
   * mockServer.post("/test", {
   *   status: 201,
   *   body: { message: "Hello World" },
   * });
   */
  public post(
    matcher: string | RegExp | Omit<MatcherObj, "method">,
    response: string | number | Response,
    options: MockOptions = {},
  ): this {
    return this.mock(this.#applyMethod("POST", matcher), response, options);
  }

  /**
   * Register a mock that only responds to requests using the http `PUT` method.
   * @param {string | RegExp | Omit<MatcherObj, "method">} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @param {string | number | Response} response - If response is a `string`, it will be used as the response body - If response is a `number`, it will be used as the response status code
   * @param {MockOptions} [options={}] mock options
   * @returns {MockServer} this
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#postmatcher-response-options-mockserver}
   * @example
   * mockServer.put("/test", {
   *   status: 200,
   *   body: { message: "Hello World" },
   * });
   */
  public put(
    matcher: string | RegExp | Omit<MatcherObj, "method">,
    response: string | number | Response,
    options: MockOptions = {},
  ): this {
    return this.mock(this.#applyMethod("PUT", matcher), response, options);
  }

  /**
   * Register a mock that only responds to requests using the http `PATCH` method.
   * @param {string | RegExp | Omit<MatcherObj, "method">} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @param {string | number | Response} response - If response is a `string`, it will be used as the response body - If response is a `number`, it will be used as the response status code
   * @param {MockOptions} [options={}] mock options
   * @returns {MockServer} this
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#patchmatcher-response-options-mockserver}
   * @example
   * mockServer.patch("/test", {
   *   status: 200,
   *   body: { message: "Hello World" },
   * });
   */
  public patch(
    matcher: string | RegExp | Omit<MatcherObj, "method">,
    response: string | number | Response,
    options: MockOptions = {},
  ): this {
    return this.mock(this.#applyMethod("PATCH", matcher), response, options);
  }

  /**
   * Register a mock that only responds to requests using the http `DELETE` method.
   * @param {string | RegExp | Omit<MatcherObj, "method">} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @param {string | number | Response} response - If response is a `string`, it will be used as the response body - If response is a `number`, it will be used as the response status code
   * @param {MockOptions} [options={}] mock options
   * @returns {MockServer} this
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#deletematcher-response-options-mockserver}
   * @example
   * mockServer.delete("/test", { status: 204 });
   */
  public delete(
    matcher: string | RegExp | Omit<MatcherObj, "method">,
    response: string | number | Response,
    options: MockOptions = {},
  ): this {
    return this.mock(this.#applyMethod("DELETE", matcher), response, options);
  }

  /**
   * Get all registered mocks.
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#mocks-readonly-mock}
   * @example
   * mockServer.mocks();
   */
  public mocks(): readonly Mock[] {
    return this.#mocks.slice();
  }

  /**
   * Get all registered calls.
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#calls-readonly-call}
   * @example
   * mockServer.calls();
   */
  public calls(): readonly Call[] {
    return this.#calls.slice();
  }

  /**
   * Check if the route has been called with the given `matcher`.
   * @param {string | RegExp | Matcher} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @returns {boolean} `true` if the route has been called with the given `matcher`, `false` otherwise
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#hasbeencalledwithmatcher-boolean}
   * @example
   * mockServer.hasBeenCalledWith({ path: "/test" });
   */
  public hasBeenCalledWith(matcher: string | RegExp | Matcher): boolean {
    const resolved = this.#resolvePathMatcher(matcher);
    return this.#calls.some(({ request }) => matchRequest(resolved, request));
  }

  /**
   * Check if the route has been called a certain number of times with the given `matcher`.
   * @param {number} times
   * @param {string | RegExp | Matcher} matcher - If matcher is a `string` or `RegExp`, it will be used to match the request path
   * @returns {boolean} `true` if the route has been called `times` times with the given `matcher`, `false` otherwise
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#hasbeencalledtimestimes-matcher-boolean}
   * @example
   * mockServer.hasBeenCalledTimes(1, { path: "/test" });
   */
  public hasBeenCalledTimes(
    times: number,
    matcher: string | RegExp | Matcher,
  ): boolean {
    const resolved = this.#resolvePathMatcher(matcher);
    return (
      this.#calls.filter(({ request }) => matchRequest(resolved, request))
        .length === times
    );
  }

  /**
   * Reset all mocks and calls.
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#reset-void}
   * @example
   * mockServer.reset();
   */
  public reset(): void {
    this.resetMocks();
    this.resetCalls();
  }

  /**
   * Reset all mocks.
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#resetmocks-void}
   * @example
   * mockServer.resetMocks();
   */
  public resetMocks(): void {
    this.#mocks = [];
  }

  /**
   * Reset all calls.
   * @see [Documentation]{@link https://github.com/joshuajaco/mocaron#resetcalls-void}
   * @example
   * mockServer.resetCalls();
   */
  public resetCalls(): void {
    this.#calls = [];
  }

  #resolvePathMatcher(matcher: string | RegExp | Matcher): Matcher {
    return typeof matcher === "string" || matcher instanceof RegExp
      ? { path: matcher }
      : matcher;
  }

  #applyMethod(
    method: string,
    matcher: string | RegExp | Omit<MatcherObj, "method">,
  ): MatcherObj {
    return typeof matcher === "string" || matcher instanceof RegExp
      ? { path: matcher, method }
      : { ...matcher, method };
  }
}
