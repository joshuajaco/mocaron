<p align="center">
  <img width="80%" src="https://raw.githubusercontent.com/joshuajaco/mocaron/main/logo.png" alt="mocaron" />
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
  Simple <a href="https://expressjs.com">express</a> mock server with an API inspired by <a href="https://www.wheresrhys.co.uk/fetch-mock">fetch-mock</a>.
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

# License

[MIT](https://github.com/joshuajaco/mocaron/blob/main/LICENSE)
