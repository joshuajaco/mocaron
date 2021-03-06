import type http from "http";
import express from "express";
import deepEqual from "deep-equal";
import bodyParser from "body-parser";

export type MatcherObj = {
  method?: string;
  body?: string | object;
  path?: string | RegExp;
  headers?: Record<string, string>;
};

export type MatcherFn = (req: express.Request) => boolean;

export type Matcher = MatcherObj | MatcherFn;

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
  private _mocks: Mock[] = [];
  private _calls: Call[] = [];
  private server: http.Server | null = null;
  private app = express();

  constructor(private options: Options) {
    this.app.use(bodyParser.raw({ type: "*/*" }));

    this.app.all("*", (req, res) => {
      const matches = this._mocks.filter(({ matcher }) =>
        matchRequest(matcher, req)
      );

      if (matches.length === 0) {
        console.warn("Unmatched", req.method, req.path);
        return res.status(404).end();
      }

      const match = matches.length === 1 ? matches[0] : matches.at(-1)!;

      this._calls.push({
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
            : JSON.stringify(response.body)
        );
      }

      res.end();
    });
  }

  public async start(): Promise<void> {
    if (this.server) {
      console.error("Server is already running");
      return;
    }

    return new Promise((resolve) => {
      this.server = this.app.listen(this.options.port, resolve);
    });
  }

  public async stop(): Promise<void> {
    const { server } = this;
    if (server) {
      return new Promise((resolve, reject) =>
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        })
      );
    }

    console.error("No server is running");
  }

  public port() {
    return this.options.port;
  }

  public mock(
    matcher: Matcher,
    response: string | number | Response,
    options: MockOptions = {}
  ) {
    this._mocks.push({
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

  public get = this.createMockFn("GET");
  public post = this.createMockFn("POST");
  public patch = this.createMockFn("PATCH");
  public delete = this.createMockFn("DELETE");

  public mocks(): readonly Mock[] {
    return this._mocks.slice();
  }

  public calls(): readonly Call[] {
    return this._calls.slice();
  }

  public hasBeenCalledWith(matcher: Matcher) {
    return this._calls.some(({ request }) => matchRequest(matcher, request));
  }

  public resetMocks() {
    this._mocks = [];
  }

  public resetCalls() {
    this._calls = [];
  }

  public reset() {
    this.resetMocks();
    this.resetCalls();
  }

  private createMockFn(method: string) {
    return (
      matcher: string | RegExp | Exclude<MatcherObj, "method">,
      response: string | number | Response,
      options: MockOptions = {}
    ) =>
      this.mock(
        typeof matcher === "string" || matcher instanceof RegExp
          ? { path: matcher, method }
          : { ...matcher, method },
        response,
        options
      );
  }
}

function matchRequest(matcher: Matcher, req: express.Request): boolean {
  if (typeof matcher === "function") return matcher(req);

  return (
    matchMethod(matcher, req) &&
    matchPath(matcher, req) &&
    matchHeaders(matcher, req) &&
    matchBody(matcher, req)
  );
}

const matchMethod = (matcher: MatcherObj, req: express.Request): boolean =>
  !matcher.method || matcher.method.toLowerCase() === req.method.toLowerCase();

const matchPath = (matcher: MatcherObj, req: express.Request): boolean =>
  !matcher.path ||
  (matcher.path instanceof RegExp
    ? !!req.path.match(matcher.path)
    : req.path === matcher.path);

const matchHeaders = (matcher: MatcherObj, req: express.Request): boolean =>
  !matcher.headers ||
  Object.entries(matcher.headers).every(([k, v]) => req.headers[k] === v);

const matchBody = (matcher: MatcherObj, req: express.Request): boolean => {
  if (!matcher.body) return true;

  if (typeof matcher.body === "string") {
    return matcher.body === req.body.toString();
  }

  try {
    return deepEqual(matcher.body, JSON.parse(req.body.toString()), {
      strict: true,
    });
  } catch {
    return false;
  }
};
