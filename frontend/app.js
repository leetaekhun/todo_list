const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const statusMessage = document.querySelector("#status-message");
const remainingCount = document.querySelector("#remaining-count");
const filterButtons = document.querySelectorAll(".filter-button");

let todos = [];
let currentFilter = "all";

function setStatus(message) {
  statusMessage.textContent = message;
}

function visibleTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.completed);
  }

  if (currentFilter === "done") {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

function renderTodos() {
  const remaining = todos.filter((todo) => !todo.completed).length;
  const filteredTodos = visibleTodos();

  remainingCount.textContent = remaining;
  list.innerHTML = "";

  if (filteredTodos.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = todos.length === 0 ? "아직 할 일이 없습니다." : "조건에 맞는 할 일이 없습니다.";
    list.append(empty);
    return;
  }

  filteredTodos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " is-complete" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `${todo.title} 완료 여부`);
    checkbox.addEventListener("change", () => updateTodo(todo.id, { completed: checkbox.checked }));

    const title = document.createElement("span");
    title.className = "todo-title";
    title.textContent = todo.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));

    item.append(checkbox, title, deleteButton);
    list.append(item);
  });
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "요청에 실패했습니다." }));
    throw new Error(error.message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadTodos() {
  try {
    setStatus("불러오는 중...");
    todos = await requestJson("/api/todos");
    renderTodos();
    setStatus("저장됨");
  } catch (error) {
    setStatus(error.message);
  }
}

async function createTodo(title) {
  const newTodo = await requestJson("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  todos = [newTodo, ...todos];
  renderTodos();
  setStatus("추가됨");
}

async function updateTodo(id, changes) {
  try {
    const updatedTodo = await requestJson(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });

    todos = todos.map((todo) => (todo.id === id ? updatedTodo : todo));
    renderTodos();
    setStatus("변경됨");
  } catch (error) {
    setStatus(error.message);
    renderTodos();
  }
}

async function deleteTodo(id) {
  try {
    await requestJson(`/api/todos/${id}`, {
      method: "DELETE",
    });

    todos = todos.filter((todo) => todo.id !== id);
    renderTodos();
    setStatus("삭제됨");
  } catch (error) {
    setStatus(error.message);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = input.value.trim();
  if (!title) {
    setStatus("할 일을 입력하세요.");
    return;
  }

  input.disabled = true;

  try {
    await createTodo(title);
    input.value = "";
    input.focus();
  } catch (error) {
    setStatus(error.message);
  } finally {
    input.disabled = false;
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderTodos();
  });
});

loadTodos();
