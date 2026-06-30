"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState, DragEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { uploadFile, runDemo, getSampleFiles, getDemoDownloadUrl, type SampleFile } from "@/lib/api";
import {
  FileSpreadsheet, Upload, Loader2, AlertCircle, Layers,
  PlayCircle, Download, ChevronDown, ChevronUp,
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sampleFiles, setSampleFiles] = useState<SampleFile[]>([]);
  const [showSamples, setShowSamples] = useState(false);

  useEffect(() => {
    getSampleFiles().then(setSampleFiles).catch(() => {});
  }, []);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Please upload an Excel file (.xlsx or .xls).");
      return;
    }
    setFileName(file.name);
    setError(null);
    setLoading(true);
    try {
      const { session_id } = await uploadFile(file);
      router.push(`/dashboard/${session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError(null);
    setDemoLoading(true);
    try {
      const { session_id } = await runDemo();
      router.push(`/dashboard/${session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo failed. Please try again.");
      setDemoLoading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const busy = loading || demoLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center gap-3 shadow-md">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-wide">Audit Intelligence Platform</h1>
          <p className="text-slate-400 text-xs">Financial Statement & Risk Analysis</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Upload Audit Ledger</h2>
            <p className="text-slate-500 text-sm">
              Upload your Excel file containing Chart of Accounts and Journal Entries.
              The system will generate financial statements and audit risk findings automatically.
            </p>
          </div>

          {/* Demo button */}
          <div className="mb-4 flex flex-col gap-2">
            <button
              onClick={handleDemo}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-3 px-4 rounded-lg transition-colors"
            >
              {demoLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running demo consolidation…</>
              ) : (
                <><PlayCircle className="w-4 h-4" /> Try with Nusantara sample data</>
              )}
            </button>
            <button
              onClick={() => setShowSamples((v) => !v)}
              className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              {showSamples ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showSamples ? "Hide sample files" : "View & download sample files"}
            </button>

            {showSamples && sampleFiles.length > 0 && (
              <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 text-sm">
                {sampleFiles.map((f) => (
                  <div key={f.key} className="flex items-start gap-3 px-4 py-3">
                    <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700">{f.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                      <p className="text-xs text-slate-300 mt-0.5 font-mono">{f.filename}</p>
                    </div>
                    <a
                      href={getDemoDownloadUrl(f.key)}
                      download={f.filename}
                      className="shrink-0 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium mt-0.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">or upload your own</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Card className="border-2 border-dashed border-slate-300 shadow-sm">
            <CardContent className="p-0">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !busy && inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 py-14 px-8 cursor-pointer rounded-lg transition-colors ${
                  dragging ? "bg-blue-50 border-blue-400" : "hover:bg-slate-50"
                } ${busy ? "cursor-default pointer-events-none" : ""}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
                />

                {loading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <div className="text-center">
                      <p className="text-slate-700 font-medium">Processing {fileName}</p>
                      <p className="text-slate-400 text-sm mt-1">Generating financial statements and audit findings…</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-700 font-medium">
                        {dragging ? "Drop your file here" : "Drag & drop your Excel file here"}
                      </p>
                      <p className="text-slate-400 text-sm mt-1">or click to browse</p>
                    </div>
                    <Button
                      variant="default"
                      className="mt-2 bg-slate-800 hover:bg-slate-700 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </Button>
                    <p className="text-slate-400 text-xs">
                      Supports .xlsx and .xls — requires Chart_of_Accounts and Journal_Entries sheets
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-6 text-center text-slate-400 text-xs">
            Data is processed locally on your server. No data is sent to external services.
          </p>

          {/* Consolidation option */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <Link href="/consolidate">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Group Consolidation Upload</p>
                  <p className="text-xs text-slate-400 mt-0.5">Upload parent + subsidiaries with COA mapping to generate consolidated financials</p>
                </div>
                <span className="ml-auto text-slate-300 group-hover:text-blue-400 text-lg">→</span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
