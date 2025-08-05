import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Edit3, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const { toast } = useToast();

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        })));
      } catch (error) {
        console.error("Error loading todos:", error);
      }
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date()
      };
      setTodos([todo, ...todos]);
      setNewTodo("");
      toast({
        title: "Todo adicionado!",
        description: "Sua tarefa foi criada com sucesso.",
      });
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
    const todo = todos.find(t => t.id === id);
    if (todo) {
      toast({
        title: todo.completed ? "Tarefa reativada!" : "Tarefa concluída!",
        description: todo.completed ? "A tarefa foi marcada como pendente." : "Parabéns por completar a tarefa!",
      });
    }
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
    toast({
      title: "Tarefa removida!",
      description: "A tarefa foi excluída com sucesso.",
      variant: "destructive"
    });
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editText.trim() && editingId) {
      setTodos(todos.map(todo =>
        todo.id === editingId ? { ...todo, text: editText.trim() } : todo
      ));
      setEditingId(null);
      setEditText("");
      toast({
        title: "Tarefa atualizada!",
        description: "As alterações foram salvas.",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const clearCompleted = () => {
    const completedCount = todos.filter(todo => todo.completed).length;
    setTodos(todos.filter(todo => !todo.completed));
    if (completedCount > 0) {
      toast({
        title: `${completedCount} tarefa(s) removida(s)!`,
        description: "Todas as tarefas concluídas foram excluídas.",
      });
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Lista de Tarefas
          </h1>
          <p className="text-lg text-gray-600">
            Organize suas tarefas e aumente sua produtividade
          </p>
        </div>

        {/* Add Todo */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Nova Tarefa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua tarefa..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTodo()}
                className="flex-1"
              />
              <Button onClick={addTodo} disabled={!newTodo.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Filters */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary" className="text-sm">
                  Total: {todos.length}
                </Badge>
                <Badge variant="default" className="text-sm bg-blue-500">
                  Ativas: {activeCount}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Concluídas: {completedCount}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("active")}
                >
                  Ativas
                </Button>
                <Button
                  variant={filter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("completed")}
                >
                  Concluídas
                </Button>
              </div>
              
              {completedCount > 0 && (
                <>
                  <Separator orientation="vertical" className="hidden md:block h-6" />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearCompleted}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Concluídas
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    {filter === "all" && "Nenhuma tarefa encontrada"}
                    {filter === "active" && "Nenhuma tarefa ativa"}
                    {filter === "completed" && "Nenhuma tarefa concluída"}
                  </div>
                  {filter === "all" && (
                    <p className="text-sm text-gray-500">
                      Adicione sua primeira tarefa acima!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map((todo) => (
              <Card 
                key={todo.id} 
                className={`shadow-lg transition-all duration-200 hover:shadow-xl ${
                  todo.completed ? "bg-gray-50 border-gray-200" : "bg-white"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      {editingId === todo.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className={`${
                            todo.completed 
                              ? "line-through text-gray-500" 
                              : "text-gray-900"
                          } mb-1`}>
                            {todo.text}
                          </p>
                          <p className="text-xs text-gray-400">
                            Criado: {todo.createdAt.toLocaleDateString("pt-BR")} às{" "}
                            {todo.createdAt.toLocaleTimeString("pt-BR", { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {editingId !== todo.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(todo.id, todo.text)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Todos;