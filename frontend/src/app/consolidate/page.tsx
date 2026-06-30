"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { consolidateEntities } from "@/lib/api";
import {
  FileSpreadsheet, Upload, Loader2, AlertCircle,
  X, Plus, ArrowLeft, Layers, Wand2,
} from "lucide-react";

function guessEntityCode(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, "").toUpperCase();
  const match = stem.match(/^[A-Z0-9]+/);
  return match ? match[0].slice(0, 8) : "";
}

export default function ConsolidatePage() {
  const router = useRouter();

  const [parentFile, setParentFile] = useState<File | null>(null);
  const [subsidiaryFiles, setSubsidiaryFiles] = useState<File[]>([]);
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentRef = useRef<HTMLInputElement>(null);
  const subRef = useRef<HTMLInputElement>(null);
  const mappingRef = useRef<HTMLInputElement>(null);

  function addSubsidiary(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.name.match(/\.(xlsx|xls)$/i));
    setSubsidiaryFiles((prev) => [...prev, ...valid]);
  }

  function removeSubsidiary(idx: number) {
    setSubsidiaryFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  const canSubmit = parentFile && subsidiaryFiles.length > 0 && mappingFile && !loading;

  async function handleSubmit() {
    if (!parentFile || subsidiaryFiles.length === 0 || !mappingFile) return;
    setError(null);
    setLoading(true);
    try {
      // Pass empty codes — backend auto-detects from mapping × filename
      const { session_id } = await consolidateEntities(parentFile, subsidiaryFiles, mappingFile, []);
      router.push(`/dashboard/${session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Consolidation failed. Please try again.");
      setLoading(false);
    }
  }

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

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to single-entity upload
          </Link>

          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">Group Consolidation Upload</h2>
            </div>
            <p className="text-slate-500 text-sm">
              Upload the parent ledger, one or more subsidiary ledgers, and the COA mapping file.
              Entity codes are detected automatically from the filenames and mapping.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-slate-700 font-medium">Consolidating {1 + subsidiaryFiles.length} entities…</p>
                <p className="text-slate-400 text-sm mt-1">Remapping accounts, merging ledgers, generating reports</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Parent file */}
              <FileSection
                label="Parent Company Ledger"
                required
                description="Excel file with Chart_of_Accounts and Journal_Entries sheets"
                file={parentFile}
                onSelect={setParentFile}
                onClear={() => setParentFile(null)}
                inputRef={parentRef}
              />

              {/* Subsidiary files */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Subsidiary Ledgers <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">Same format as parent — one file per subsidiary</p>
                <div className="space-y-2">
                  {subsidiaryFiles.map((f, i) => {
                    const detected = guessEntityCode(f.name);
                    return (
                      <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2.5">
                        <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm text-slate-700 flex-1 truncate">{f.name}</span>
                        {detected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                            <Wand2 className="w-2.5 h-2.5" />
                            {detected}
                          </span>
                        )}
                        <button onClick={() => removeSubsidiary(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  <input
                    ref={subRef}
                    type="file"
                    accept=".xlsx,.xls"
                    multiple
                    className="hidden"
                    onChange={(e) => { addSubsidiary(e.target.files); e.target.value = ""; }}
                  />
                  <button
                    onClick={() => subRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg py-2.5 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add subsidiary file
                  </button>
                </div>
              </div>

              {/* Mapping file */}
              <FileSection
                label="COA Mapping File"
                required
                description="Excel with COA_Mapping sheet: Entity_Code, Sub_Account_No, Parent_Account_No"
                file={mappingFile}
                onSelect={setMappingFile}
                onClear={() => setMappingFile(null)}
                inputRef={mappingRef}
              />

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs rounded-lg px-3 py-2.5">
                <Wand2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Entity codes are auto-detected from the filename and COA mapping — no manual input needed.</span>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 mr-2" />
                Consolidate &amp; Analyse
              </Button>

              <p className="text-center text-slate-400 text-xs">
                {1 + subsidiaryFiles.length} {1 + subsidiaryFiles.length === 1 ? "entity" : "entities"} selected
                {subsidiaryFiles.length === 0 && " — add at least one subsidiary"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FileSection({
  label, required, description, file, onSelect, onClear, inputRef,
}: {
  label: string;
  required?: boolean;
  description: string;
  file: File | null;
  onSelect: (f: File) => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <p className="text-xs text-slate-400 mb-2">{description}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }}
      />
      {file ? (
        <div className="flex items-center gap-3 bg-white border border-green-200 rounded-lg px-4 py-2.5">
          <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
          <button onClick={onClear} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/40 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Select file
        </button>
      )}
    </div>
  );
}
