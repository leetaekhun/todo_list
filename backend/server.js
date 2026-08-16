const crypto = require("crypto");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 4000);
const ROOT_DIR = path.join(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const DB_FILE = path.join(ROOT_DIR, "db", "todos.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function readTodos() {
  const data = await fs.readFile(DB_FILE, "utf8");
  return JSON.parse(data);
}

async function writeTodos(todos) {
  await fs.writeFile(DB_FILE, `${JSON.stringify(todos, null, 2)}\n`, "utf8");
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(data));
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode);
  response.end();
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { message });
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/todos") {
    const todos = await readTodos();
    sendJson(response, 200, todos);
    return;
  }

  if (request.method === "POST" && pathname === "/api/todos") {
    const body = await readBody(request);
    const title = String(body.title || "").trim();

    if (!title) {
      sendError(response, 400, "할 일을 입력하세요.");
      return;
    }

    const todos = await readTodos();
    const todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await writeTodos([todo, ...todos]);
    sendJson(response, 201, todo);
    return;
  }

  const todoIdMatch = pathname.match(/^\/api\/todos\/([^/]+)$/);

  if (todoIdMatch && request.method === "PATCH") {
    const id = todoIdMatch[1];
    const body = await readBody(request);
    const todos = await readTodos();
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      sendError(response, 404, "Todo를 찾을 수 없습니다.");
      return;
    }

    const updatedTodo = {
      ...todos[index],
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : todos[index].title,
      completed: typeof body.completed === "boolean" ? body.completed : todos[index].completed,
    };

    todos[index] = updatedTodo;
    await writeTodos(todos);
    sendJson(response, 200, updatedTodo);
    return;
  }

  if (todoIdMatch && request.method === "DELETE") {
    const id = todoIdMatch[1];
    const todos = await readTodos();
    const nextTodos = todos.filter((todo) => todo.id !== id);

    if (nextTodos.length === todos.length) {
      sendError(response, 404, "Todo를 찾을 수 없습니다.");
      return;
    }

    await writeTodos(nextTodos);
    sendEmpty(response, 204);
    return;
  }

  sendError(response, 404, "API 경로를 찾을 수 없습니다.");
}

async function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const filePath = path.normalize(path.join(FRONTEND_DIR, decodedPath));

  if (!filePath.startsWith(FRONTEND_DIR)) {
    sendError(response, 403, "접근할 수 없는 파일입니다.");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
    });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendError(response, 404, "페이지를 찾을 수 없습니다.");
      return;
    }

    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendError(response, 400, "JSON 형식이 올바르지 않습니다.");
      return;
    }

    console.error(error);
    sendError(response, 500, "서버 오류가 발생했습니다.");
  }
});

server.listen(PORT, () => {
  console.log(`Todo app is running at http://localhost:${PORT}`);
});
