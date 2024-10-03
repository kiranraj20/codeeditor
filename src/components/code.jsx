import React, { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import aiService from "./aiService";
import Output from "./Output";
import Coder from "../Utils/Icons/Coder";
import Code from "./code"; // Your POC Code component

const CodeEditor = () => {
  const editorRef = useRef();
  const monacoRef = useRef(null);
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [outputSrc, setOutputSrc] = useState("");

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();
  };

  const onSelect = (language) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language]);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const existingCode = editorRef.current.getValue();
      const generatedCode = await aiService.generateCode(existingCode, prompt, language);
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (editor && monaco) {
        const position = editor.getPosition();
        const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);
        editor.executeEdits("ai-insert", [{ range, text: "\n" + generatedCode, forceMoveMarkers: true }]);
        setValue(editor.getValue());
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Method to execute code and handle console output
  const executeCode = () => {
    setError(null);
    setConsoleOutput([]);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.development.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.development.js"></script>
        </head>
        <body>
          <div id="root"></div>
          <script>
            window.onerror = function(message, source, lineno, colno, error) {
              window.parent.postMessage({ type: 'console', method: 'error', args: [message] }, '*');
              return true;
            };
            const console = {
              log: (...args) => {
                window.parent.postMessage({ type: 'console', method: 'log', args }, '*');
              },
              error: (...args) => {
                window.parent.postMessage({ type: 'console', method: 'error', args }, '*');
              },
              warn: (...args) => {
                window.parent.postMessage({ type: 'console', method: 'warn', args }, '*');
              }
            };
            try {
              ${value}
            } catch (error) {
              console.error(error.toString());
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setOutputSrc(url);
    setActiveTab('output');
    setConsoleOutput(prev => [...prev, 'Code executed. Check the output tab for results.']);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'console') {
        const { method, args } = event.data;
        setConsoleOutput(prev => [...prev, `${method}: ${args.join(' ')}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    return () => {
      if (outputSrc) {
        URL.revokeObjectURL(outputSrc);
      }
    };
  }, [outputSrc]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'editor':
        return (
          <Editor
            options={{ minimap: { enabled: false } }}
            height="75vh"
            theme="vs-dark"
            language={language}
            value={value}
            onChange={(value) => setValue(value)}
            onMount={onMount}
          />
        );
      case 'console':
        return (
          <div className="bg-gray-100 overflow-auto h-full p-2">
            {consoleOutput.length > 0 ? (
              consoleOutput.map((log, index) => (
                <div key={index} className="font-mono text-sm">{log}</div>
              ))
            ) : (
              <div className="font-mono text-sm text-gray-500">No console output yet.</div>
            )}
          </div>
        );
      case 'output':
        return (
          <div className="h-full">
            {outputSrc && (
              <iframe
                src={outputSrc}
                className="w-full h-full border rounded"
                title="output"
                sandbox="allow-scripts"
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex border-b">
        {['editor', 'console', 'output'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 p-4">
        {renderTabContent()}
      </div>
      <div className="p-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={executeCode}
        >
          Run Code
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;
