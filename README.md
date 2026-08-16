# todo_list

Frontend, backend, database가 어떤 역할을 하는지 직접 확인하기 위한 Todo List 프로젝트입니다.

## 구조

```txt
todo_list/
  frontend/        # 사용자가 보는 화면
  backend/         # HTTP 요청을 받고 API 응답을 만드는 서버
  db/              # todo 데이터를 저장하는 곳
  package.json     # 실행 스크립트
```

## 실행

```bash
npm start
```

브라우저에서 아래 주소를 엽니다.

```txt
http://localhost:4000
```

## 역할

Frontend는 입력창, 버튼, todo 목록을 보여줍니다. 사용자가 버튼을 누르면 backend API로 요청을 보냅니다.

Backend는 `/api/todos` 요청을 받고, 데이터를 읽거나 수정한 뒤 JSON으로 응답합니다.

Database 역할은 지금은 `db/todos.json` 파일이 맡고 있습니다. 나중에 이 부분을 PostgreSQL 같은 실제 DB로 바꾸면 됩니다.

## Git 흐름

작업이 끝날 때마다 아래 순서로 저장합니다.

```bash
git status
git add .
git commit -m "작업 내용"
git push
```
