const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((u) => u.username === username);
  if (!user) {
    return response.status(400).send({ error: "Usuário não encontrado." });
  }
  request.user = user;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;
  const userExists = users.find((u) => u.username === username);
  if (userExists) {
    return response.status(400).send({ error: "Usuário já cadastrado." });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  response.json(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request.headers;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  const userIndex = users.findIndex((u) => u.username === username);
  users[userIndex].todos = [todo];

  response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  (request, response) => {
    const { username } = request.headers;
    const { id } = request.params;
    const { title, deadline } = request.body;
    const { user } = request;
    const currentTodo = user.todos.find((t) => t.id === id);
    if (!currentTodo) {
      return response.status(404).json({ error: "Todo não existe." });
    }
    const updatedTodo = { ...currentTodo, title, deadline };
    const userIndex = users.findIndex((u) => u.username === username);
    users[userIndex].todos = [
      ...user.todos.filter((t) => t.id !== id),
      updatedTodo,
    ];

    response.status(201).json(updatedTodo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  (request, response) => {
    const { username } = request.headers;
    const { user } = request;
    const { id } = request.params;
    const currentTodo = user.todos.find((t) => t.id === id);
    if (!currentTodo) {
      return response.status(404).json({ error: "Todo não existe." });
    }
    const updatedTodo = { ...currentTodo, done: true };

    const userIndex = users.findIndex((u) => u.username === username);
    users[userIndex].todos = [
      ...user.todos.filter((t) => t.id !== id),
      updatedTodo,
    ];
    response.status(201).json(updatedTodo);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  (request, response) => {
    const { username } = request.headers;
    const { id } = request.params;
    const { user } = request;
    
    const currentTodo = user.todos.find((t) => t.id === id);
    if (!currentTodo) {
      return response.status(404).json({ error: "Todo não existe." });
    }
    const userIndex = users.findIndex((u) => u.username === username);
    users[userIndex].todos = [...user.todos.filter((t) => t.id !== id)];
    return response.status(204).send();
  }
);

module.exports = app;
