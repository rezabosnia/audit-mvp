"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { uploadFile } from "@/lib/api";
import { FileSpreadsheet, Upload, Loader2, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center gap-3 shadow-md">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-wide">Audit Intelligence Platform</h1>
          <p className="text-slate-400 text-xs">Financial Statement & Risk Analysis</p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              Upload Audit Ledger
            </h2>
            <p className="text-slate-500 text-sm">
              Upload your Excel file containing Chart of Accounts and Journal
              Entries. The system will generate financial statements and audit
              risk findings automatically.
            </p>
          </div>

          <Card className="border-2 border-dashed border-slate-300 shadow-sm">
            <CardContent className="p-0">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !loading && inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 py-14 px-8 cursor-pointer rounded-lg transition-colors ${
                  dragging ? "bg-blue-50 border-blue-400" : "hover:bg-slate-50"
                } ${loading ? "cursor-default pointer-events-none" : ""}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />

                {loading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <div className="text-center">
                      <p className="text-slate-700 font-medium">
                        Processing {fileName}
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Generating financial statements and audit findings…
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-700 font-medium">
                        {dragging
                          ? "Drop your file here"
                          : "Drag & drop your Excel file here"}
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        or click to browse
                      </p>
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
        </div>
      </main>
    </div>
  );
}
