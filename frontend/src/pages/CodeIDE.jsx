import React, { useState, useRef, useEffect, Suspense } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import axios from "axios";
import {
    Play,
    RotateCcw,
    Terminal,
    Settings,
    Code2,
    Monitor,
    AlertTriangle,
    Loader2,
    ChevronRight,
    Globe,
    Zap,
    Info
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";

// --- Configuration ---
const PISTON_API = "https://piston.emkc.org/api/v2";
const BACKUP_API = "https://emkc.org/api/v2/piston";

const CODE_SNIPPETS = {
    javascript: `// JavaScript Code\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("JAIN Student");\n`,
    typescript: `// TypeScript Code\ntype Params = {\n\tname: string;\n}\n\nfunction greet(data: Params) {\n\tconsole.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "JAIN Student" });\n`,
    python: `# Python Code\ndef greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("JAIN Student")\n`,
    java: `// Java Code\npublic class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello JAIN University!");\n\t}\n}\n`,
    cpp: `// C++ Code\n#include <iostream>\n\nint main() {\n\tstd::cout << "Hello JAIN University!" << std::endl;\n\treturn 0;\n}\n`,
    csharp: `// C# Code\nusing System;\n\nnamespace HelloWorld\n{\n\tclass Hello {\n\t\tstatic void Main(string[] args) {\n\t\t\tConsole.WriteLine("Hello JAIN University!");\n\t\t}\n\t}\n}\n`,
    php: "<?php\n\n$name = 'JAIN Student';\necho \"Hello, \" . $name . \"!\";\n",
    html: '<!-- Web Preview -->\n<div style="color: #1a365d; text-align: center; font-family: sans-serif; padding: 20px; border: 2px solid #1a365d; border-radius: 10px;">\n  <h1>Welcome to JAIN LMS</h1>\n  <p>Practice web development here!</p>\n</div>'
};

// Lazy load Monaco to prevent root-level crash
const MonacoEditor = React.lazy(() => import("@monaco-editor/react"));

export const CodeIDE = () => {
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState(CODE_SNIPPETS["javascript"]);
    const [output, setOutput] = useState([]);
    const [running, setRunning] = useState(false);
    const [availableRuntimes, setAvailableRuntimes] = useState([]);
    const [loadingRuntimes, setLoadingRuntimes] = useState(true);
    const [proMode, setProMode] = useState(false);

    // --- CRITICAL: Global Error Suppression ---
    useEffect(() => {
        // Intercept [object Event] errors triggered by network failures (Monaco CDN blocks)
        const handleGlobalError = (event) => {
            if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                console.warn("IDE: Suppressed a script/link load error to prevent application crash.");
                event.preventDefault();
                event.stopPropagation();
            }
        };

        window.addEventListener('error', handleGlobalError, true);
        return () => window.removeEventListener('error', handleGlobalError, true);
    }, []);

    // Fetch available runtimes (with backup node)
    useEffect(() => {
        const fetchRuntimes = async () => {
            try {
                const response = await axios.get(`${PISTON_API}/runtimes`, { timeout: 10000 });
                const runtimes = response.data;
                const seen = new Set();
                const filtered = runtimes
                    .filter(r => {
                        if (seen.has(r.language)) return false;
                        seen.add(r.language);
                        return true;
                    })
                    .sort((a, b) => a.language.localeCompare(b.language));
                setAvailableRuntimes(filtered);
            } catch (error) {
                console.warn("IDE: Primary API timed out, trying backup...");
                try {
                    const altResponse = await axios.get(`${BACKUP_API}/runtimes`, { timeout: 10000 });
                    setAvailableRuntimes(altResponse.data.filter((r, i, s) => s.findIndex(t => t.language === r.language) === i));
                } catch (altError) {
                    setAvailableRuntimes([
                        { language: "javascript", version: "18.15.0" },
                        { language: "python", version: "3.10.0" },
                        { language: "java", version: "15.0.2" },
                        { language: "cpp", version: "10.2.0" }
                    ]);
                }
            } finally {
                setLoadingRuntimes(false);
            }
        };
        fetchRuntimes();
    }, []);

    const clearConsole = () => setOutput([]);

    const onSelectLanguage = (value) => {
        setLanguage(value);
        setCode(CODE_SNIPPETS[value] || "");
    };

    const runCode = async () => {
        if (language === "html") {
            setOutput([{ type: "system", content: "HTML preview is handled locally. For logic testing, use JS/Python/Java." }]);
            return;
        }

        setRunning(true);
        setOutput([{ type: "system", content: `--- Executing ${language.toUpperCase()} ---` }]);

        const runtime = availableRuntimes.find(r => r.language === language);
        const version = runtime ? runtime.version : "latest";

        try {
            let response;
            try {
                response = await axios.post(`${PISTON_API}/execute`, {
                    language, version, files: [{ content: code }]
                }, { timeout: 25000 });
            } catch (e) {
                setOutput(prev => [...prev, { type: "system", content: "Trying alternate execution node..." }]);
                response = await axios.post(`${BACKUP_API}/execute`, {
                    language, version, files: [{ content: code }]
                }, { timeout: 25000 });
            }

            const { run: result } = response.data;
            const logs = [];
            if (result.stdout) logs.push({ type: "log", content: result.stdout });
            if (result.stderr) logs.push({ type: "error", content: result.stderr });
            if (!result.stdout && !result.stderr) logs.push({ type: "system", content: "Program Finished (No Output)" });
            setOutput(logs);
            toast.success("Done");
        } catch (error) {
            setOutput([{ type: "error", content: "Execution Error: Service unstable or blocked by network firewall." }]);
        } finally {
            setRunning(false);
        }
    };

    return (
        <DashboardLayout title="Code IDE">
            <div className="flex flex-col h-[calc(100vh-10rem)] gap-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border min-w-[200px]">
                            <Code2 className="w-4 h-4 text-slate-500" />
                            {loadingRuntimes ? (
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Updating...
                                </div>
                            ) : (
                                <Select value={language} onValueChange={onSelectLanguage}>
                                    <SelectTrigger className="w-full border-0 bg-transparent shadow-none h-auto p-0 focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {availableRuntimes.map((lang) => (
                                            <SelectItem key={lang.language} value={lang.language}>
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <span className="capitalize">{lang.language}</span>
                                                    <span className="text-[10px] text-slate-400">v{lang.version}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="html">HTML/CSS</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div
                            onClick={() => { if (!proMode) setProMode(true); }}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${proMode
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-emerald-50 hover:text-emerald-500"
                                }`}
                        >
                            <Zap className={`w-3.5 h-3.5 ${proMode ? "fill-current" : ""}`} />
                            {proMode ? "PRO EDITOR ACTIVE" : "ENABLE PRO FEATURES"}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={clearConsole} className="text-slate-500 h-9 hidden sm:flex">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                        <Button
                            onClick={runCode}
                            disabled={running || loadingRuntimes}
                            className="bg-[#1a365d] hover:bg-[#102a43] min-w-[120px]"
                        >
                            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                            Run Code
                        </Button>
                    </div>
                </div>

                {/* Workspace */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
                    <Card className="flex-[2] overflow-hidden border-slate-200 bg-[#1e1e1e] flex flex-col relative">
                        {!proMode ? (
                            <div className="flex-1 flex flex-col p-4">
                                <div className="mb-2 flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-3 h-3" />
                                        <span>Ultra-Stable Source Editor</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">ZERO-CRASH MODE</span>
                                    </div>
                                </div>
                                <textarea
                                    className="flex-1 w-full bg-[#1c1c1c] text-emerald-50 font-mono text-sm p-6 outline-none border border-slate-800 rounded-lg resize-none shadow-2xl custom-scrollbar selection:bg-indigo-500/30"
                                    spellCheck="false"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Paste or write your code here..."
                                />
                                <div className="mt-3 flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-800 text-[10px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-3 h-3 text-indigo-400" />
                                        Connecting to {availableRuntimes.find(r => r.language === language)?.language || language} v{availableRuntimes.find(r => r.language === language)?.version || 'latest'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Service Ready
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 relative">
                                <Suspense fallback={
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Pro Modules...</p>
                                    </div>
                                }>
                                    <MonacoEditor
                                        height="100%"
                                        theme="vs-dark"
                                        language={language === 'cpp' ? 'cpp' : language}
                                        value={code}
                                        onChange={(v) => setCode(v || "")}
                                        options={{
                                            fontSize: 14,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 20 },
                                            fontFamily: "'Fira Code', monospace"
                                        }}
                                    />
                                </Suspense>
                            </div>
                        )}

                        <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                            <Globe className="w-4 h-4 text-slate-700" />
                        </div>
                    </Card>

                    {/* Terminal */}
                    <Card className="flex-1 bg-slate-950 border-slate-800 text-slate-300 flex flex-col sm:max-w-[380px]">
                        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 bg-slate-900">
                            <Terminal className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Live Diagnostics</span>
                            <div className="flex gap-1 ml-auto">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                            </div>
                        </div>
                        <CardContent className="flex-1 p-4 font-mono text-[12px] overflow-y-auto custom-scrollbar">
                            {output.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-900 gap-3 grayscale opacity-40">
                                    <Monitor className="w-10 h-10" />
                                    <p className="text-[8px] uppercase font-bold tracking-[0.6em]">Standby</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {output.map((line, i) => (
                                        <div
                                            key={i}
                                            className={`
                        ${line.type === "error" ? "text-red-400 bg-red-400/5 p-3 rounded border border-red-900/20" : ""}
                        ${line.type === "system" ? "text-slate-600 border-b border-slate-900/40 pb-2 mb-4 text-[9px] uppercase font-bold tracking-widest" : "flex gap-3 px-1"}
                        ${line.type === "log" ? "text-emerald-400" : ""}
                        whitespace-pre-wrap break-words
                      `}
                                        >
                                            {line.type !== "system" && <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 opacity-10" />}
                                            <span className="flex-1 leading-relaxed">{line.content}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};
