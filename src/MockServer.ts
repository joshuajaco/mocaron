import type http from "node:http";
import express from "express";
import bodyParser from "body-parser";
import { matchRequest } from "./matchRequest";
import type { Matcher, MatcherObj } from "./matchRequest";

export type ResponseObj = {
  status?: number;
  body?: string | object;
  headers?: Record<string, string>;
};

export type ResponseFn = (req: express.Request) => ResponseObj;

export type Response = ResponseObj | ResponseFn;

export type MockOptions = { overwrite?: boolean };

export type Mock = {
  matcher: Matcher;
  response: Response;
  options: MockOptions;
};

export type Call = { request: express.Request; matcher: Matcher };

export type Options = { port: number };

export class MockServer {
  #mocks: Mock[] = [];
  #calls: Call[] = [];
  #server: http.Server | null = null;
  readonly #app = express();

  constructor(private readonly options: Options) {
    this.#app.use(bodyParser.raw({ type: "*/*" }));

    this.#app.all("*", (req, res) => {
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

  public start(): Promise<void> {
    if (this.#server) {
      console.error("Server is already running");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.#server = this.#app.listen(this.options.port, resolve);
    });
  }

  public stop(): Promise<void> {
    const server = this.#server;
    if (server) return new Promise((resolve) => server.close(() => resolve()));
    console.error("No server is running");
    return Promise.resolve();
  }

  public port() {
    return this.options.port;
  }

  public mock(
    matcher: Matcher,
    response: string | number | Response,
    options: MockOptions = {},
  ) {
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

  public get = this.#createMockFn("GET");
  public post = this.#createMockFn("POST");
  public patch = this.#createMockFn("PATCH");
  public delete = this.#createMockFn("DELETE");

  public mocks(): readonly Mock[] {
    return this.#mocks.slice();
  }

  public calls(): readonly Call[] {
    return this.#calls.slice();
  }

  public hasBeenCalledWith(matcher: Matcher) {
    return this.#calls.some(({ request }) => matchRequest(matcher, request));
  }

  public resetMocks() {
    this.#mocks = [];
  }

  public resetCalls() {
    this.#calls = [];
  }

  public reset() {
    this.resetMocks();
    this.resetCalls();
  }

  #createMockFn(method: string) {
    return (
      matcher: string | RegExp | Exclude<MatcherObj, "method">,
      response: string | number | Response,
      options: MockOptions = {},
    ) =>
      this.mock(
        typeof matcher === "string" || matcher instanceof RegExp
          ? { path: matcher, method }
          : { ...matcher, method },
        response,
        options,
      );
  }
}
