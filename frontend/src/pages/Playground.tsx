import { useNavigate } from "react-router-dom";
import PlaygroundHeader from "../components/PlaygroundHeader";
import PlaygroundWorkspace from "../components/PlaygroundWorkspace";
import {
  usePlaygroundWorkspace,
  type PlaygroundLanguage,
} from "../hooks/usePlaygroundWorkspace";
import "../styles/playground.css";

const LANGUAGES: PlaygroundLanguage[] = [
  {
    id: "javascript",
    label: "JavaScript",
    filename: "script.js",
    sample: `const todos = [
  { title: "Design hero", done: true },
  { title: "Wire realtime", done: false },
  { title: "Launch playground", done: false },
];

todos.forEach((todo, index) => {
  const status = todo.done ? "✅" : "⏳";
  console.log(status + " " + (index + 1) + ". " + todo.title);
});

console.log("Remaining", todos.filter((todo) => !todo.done).length);
`,
  },
  {
    id: "python",
    label: "Python",
    filename: "main.py",
    sample: `from statistics import mean

notes = [3.4, 4.2, 5.0, 4.8]
print("Average", round(mean(notes), 2))
print("Collaborators", ["Mira", "Lee", "Kai"])
`,
  },
  {
    id: "cpp",
    label: "C++",
    filename: "main.cpp",
    sample: `#include <iostream>
#include <vector>

int main() {
  std::vector<int> prs = {12, 4, 6};
  for (size_t i = 0; i < prs.size(); ++i) {
    std::cout << "Week " << i + 1 << ": " << prs[i] << " merged PRs\n";
  }
  return 0;
}
`,
  },
  {
    id: "java",
    label: "Java",
    filename: "Main.java",
    sample: `import java.util.List;

public class Main {
  public static void main(String[] args) {
    List<String> squad = List.of("Mira", "Lee", "Kai");
    squad.forEach(name -> System.out.println("Hello " + name + "!"));
  }
}
`,
  },
];

export default function Playground() {
  const navigate = useNavigate();
  const {
    activeLanguageId,
    editorFile,
    running,
    terminalOpen,
    handleLanguageChange,
    handleRun,
    handleCodeChange,
    toggleTerminal,
  } = usePlaygroundWorkspace(LANGUAGES);

  return (
    <div className="playground-shell">
      <PlaygroundHeader
        title="Try CodeTogether instantly"
        description="Editor, run button, and terminal — no project required."
        onGoHome={() => navigate("/")}
      />
      <PlaygroundWorkspace
        languages={LANGUAGES}
        activeLanguageId={activeLanguageId}
        editorFile={editorFile}
        running={running}
        terminalOpen={terminalOpen}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onToggleTerminal={toggleTerminal}
        onCodeChange={handleCodeChange}
      />
    </div>
  );
}
