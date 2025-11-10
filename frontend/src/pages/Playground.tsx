/**
 * Playground Page
 * ----------------
 * Provides an instant, standalone coding environment for users to experiment
 * with supported languages without needing to create or join a project.
 *
 * Features:
 * - Multi-language support (JavaScript, Python, C++, Java)
 * - Live code editor with sample snippets
 * - Integrated run and terminal view using the shared workspace logic
 * - Quick navigation back to the main dashboard
 *
 * Components:
 * - PlaygroundHeader: Displays title, description, and navigation button
 * - PlaygroundWorkspace: Handles editor, language selector, and terminal panel
 * - usePlaygroundWorkspace: Custom hook for runtime management and code execution
 */

import { useNavigate } from "react-router-dom";
import PlaygroundHeader from "../components/PlaygroundHeader";
import PlaygroundWorkspace from "../components/PlaygroundWorkspace";
import {
  usePlaygroundWorkspace,
  type PlaygroundLanguage,
} from "../hooks/usePlaygroundWorkspace";
import "../styles/playground.css";

/**
 * LANGUAGES
 * ----------
 * Predefined list of supported languages for the playground, including:
 * - Identifier (`id`)
 * - User-friendly label
 * - Default filename
 * - Example snippet to display when switching languages
 */
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
    std::cout << "Week " << i + 1 << ": " << prs[i] << " merged PRs\\n";
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

/**
 * Playground Component
 * ---------------------
 * The main functional component rendering the playground interface.
 *
 * Behavior:
 * - Initializes the playground workspace using `usePlaygroundWorkspace`
 * - Displays editor, terminal, and language tabs
 * - Provides navigation to return to the home screen
 */
export default function Playground() {
  const navigate = useNavigate();

  // Custom workspace hook: handles language state, code updates, run execution, and terminal toggling
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

  /**
   * JSX Return
   * -----------
   * Constructs the playground shell layout including:
   * - Header section (title, subtitle, navigation)
   * - Workspace section (editor, output terminal, language selection)
   */
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
