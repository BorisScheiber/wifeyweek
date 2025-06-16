import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TodoPage from "./pages/TodoPage";
import CreateTodoPage from "./pages/CreateTodoPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TodoPage />} />
        <Route path="/add" element={<CreateTodoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
