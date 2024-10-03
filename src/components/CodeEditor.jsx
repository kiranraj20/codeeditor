import React, { useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import aiService from "./aiService";
import Coder from "../Utils/Icons/Coder";
import Code from "./code";

const CodeEditor = () => {
  const editorRef = useRef();
  const monacoRef = useRef(null);
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

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
      const generatedCode = await aiService.generateCode(
        existingCode,
        prompt,
        language
      );

      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (editor && monaco) {
        const position = editor.getPosition();
        const range = new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        );
        editor.executeEdits("ai-insert", [
          {
            range: range,
            text: "\n" + generatedCode,
            forceMoveMarkers: true,
          },
        ]);
        setValue(editor.getValue());
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="gap-4 flex flex-col">
        <div className="flex">
          <div className="w-[50%]">
            <LanguageSelector language={language} onSelect={onSelect} />
            <div className="mb-4">
              <input
                type="text"
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Describe the code you want to generate"
                className="w-full p-2 border border-gray-300 rounded"
              />
              <button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isGenerating ? "Generating..." : "Generate Code"}
              </button>
              {error && (
                <p className="text-red-500 mt-2 truncate ...">{error}</p>
              )}
            </div>
          </div>
          <div className="w-[50%] h-[250px] flex justify-center items-center">
            <Coder />
          </div>
        </div>
        <div className="flex w-[100%]">
          <Editor
            options={{
              minimap: {
                enabled: false,
              },
            }}
            height="75vh"
            theme="vs-dark"
            language={language}
            defaultValue={CODE_SNIPPETS[language]}
            onMount={onMount}
            value={value}
            onChange={(value) => setValue(value)}
            className="rounded-md overflow-hidden"
          />
          <Output editorRef={editorRef} language={language} />
        </div>
      </div>
      <Code />
    </div>
  );
};

export default CodeEditor;
