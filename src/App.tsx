import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  CircleAlert,
  FileJson,
  GitFork,
  FileDown,
  Upload,
} from "lucide-react";
import {
  parseGraph,
  type ValidationIssue,
} from "./graph/validation";
import { visibleGraph, type GraphFilters } from "./graph/filters";
import { NODE_TYPES, type PaperGraph } from "./graph/types";
import { GlobalSearch } from "./components/GlobalSearch";
import { Tooltips } from "./components/Tooltips";
import { PaperNavigation } from "./components/PaperNavigation";
import { GraphCanvas, type GraphCanvasHandle } from "./components/GraphCanvas";
import { classifyNode, contextGraph, type NodeScope } from "./graph/scope";

const emptyGraph: PaperGraph = {
  schema_version: "1.0.0",
  paper: { id: "empty", title: "" },
  nodes: [], edges: [],
};
const defaultFilters = (): GraphFilters => ({
  query: "",
  section: null,
  types: [...NODE_TYPES],
});
export default function App() {
  const [graph, setGraph] = useState<PaperGraph>(emptyGraph);
  const [hasGraph, setHasGraph] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const closeInspector = useCallback(() => setInspectorOpen(false), []);
  const [showContext, setShowContext] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(
    () => window.innerWidth > 700,
  );
  const [exportReady, setExportReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const canvasRef = useRef<GraphCanvasHandle>(null);
  const dismiss = useCallback(() => {
    setSelectedId(null);
    setSelectedEdgeId(null);
    setInspectorOpen(false);
  }, []);
  const selectNode = useCallback((id: string) => {
    setInspectorOpen(true);
    setSelectedId(id);
    setSelectedEdgeId(null);
  }, []);
  const selectEdge = useCallback((id: string) => {
    setInspectorOpen(true);
    setSelectedEdgeId(id);
    setSelectedId(null);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !inspectorOpen)
        dismiss();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [inspectorOpen, dismiss]);
  const changeScope = useCallback((id: string, scope: NodeScope) => {
    setGraph((previous) => classifyNode(previous, id, scope));
  }, []);
  const [focusRequest, setFocusRequest] = useState(0);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const importError = issues.length
    ? `Import failed. Choose another JSON file.\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`
    : "";
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importSequence = useRef(0);
  const dragDepth = useRef(0);
  const visible = useMemo(
    () => visibleGraph(contextGraph(graph, showContext), filters),
    [graph, filters, showContext],
  );
  async function downloadPdf() {
    setExporting(true);
    setExportFailed(false);
    try {
      if (!canvasRef.current) throw new Error("The map is not ready.");
      await canvasRef.current.exportPdf();
    } catch (error) {
      console.error("PDF download failed", error);
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  }

  function replaceGraph(next: PaperGraph) {
    setGraph(next);
    setHasGraph(true);
    setFilters(defaultFilters());
    dismiss();
    setShowContext(false);
    setExportFailed(false);
    setFocusRequest(0);
    setIssues([]);
  }
  async function importFile(files: FileList | null) {
    if (!files?.length) return;
    const sequence = ++importSequence.current;
    setIssues([]);
    setReading(false);
    if (files.length !== 1) {
      setIssues([
        { path: "File", message: "Import one JSON graph at a time." },
      ]);
      return;
    }
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".json")) {
      setIssues([
        {
          path: "File",
          message: "Choose a .json file using the Proof Map canonical schema.",
        },
      ]);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setIssues([
        {
          path: "File",
          message: "This file exceeds the V0 import limit of 10 MiB.",
        },
      ]);
      return;
    }
    setReading(true);
    try {
      const text = await file.text();
      if (sequence !== importSequence.current) return;
      const result = parseGraph(text);
      if (result.ok) replaceGraph(result.graph);
      else setIssues(result.issues);
    } catch (error) {
      if (sequence === importSequence.current)
        setIssues([
          {
            path: "File",
            message: `Could not read this file. ${error instanceof Error ? error.message : ""}`,
          },
        ]);
    } finally {
      if (sequence === importSequence.current) setReading(false);
    }
  }
  function navigateTo(id: string) {
    setFilters(defaultFilters());
    selectNode(id);
    if (window.innerWidth <= 700) setNavigationOpen(false);
    setFocusRequest((v) => v + 1);
  }
  function showCompleteMap() {
    setFilters(defaultFilters());
    setShowContext(true);
    dismiss();
  }
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void importFile(event.dataTransfer.files);
  }

  return (
    <div
      className="app"
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={handleDrop}
    >
      <header className="app-header">
        <a
          className="brand"
          href={import.meta.env.BASE_URL}
          aria-label="Proof Map home"
        >
          <span className="brand-icon">
            <GitFork size={22} strokeWidth={1.7} />
          </span>
          <span>Proof Map</span>
        </a>
        {hasGraph && <GlobalSearch graph={graph} onSelect={navigateTo} />}
        <div className="header-actions">
          <button
            className="button"
            aria-label="Download PDF"
            data-tooltip={
              exportFailed
                ? "Download failed. Click to try again."
                : exporting
                  ? "Preparing your PDF…"
                  : !exportReady
                    ? "PDF download is available when the map is ready"
                    : "Download the visible map as PDF"
            }
            aria-describedby={exportFailed ? "pdf-download-status" : undefined}
            onClick={() => void downloadPdf()}
            disabled={!exportReady || exporting}
          >
            <FileDown size={15} />
            <span>
              {exporting
                ? "Preparing PDF…"
                : exportFailed
                  ? "Retry PDF"
                  : "Download PDF"}
            </span>
          </button>
          {exportFailed && (
            <span id="pdf-download-status" className="sr-only" role="status">
              PDF download failed. Use the download button to try again.
            </span>
          )}
          <button
            className="button primary"
            aria-label="Import JSON"
            data-tooltip={importError || "Import a paper map from a JSON file"}
            aria-describedby={importError ? "import-status" : undefined}
            onClick={() => fileInput.current?.click()}
            disabled={reading}
          >
            {importError ? <CircleAlert size={15} /> : <Upload size={15} />}
            <span>
              {reading
                ? "Reading…"
                : importError
                  ? "Retry import"
                  : "Import JSON"}
            </span>
          </button>
          {importError && (
            <span id="import-status" className="sr-only" role="status">
              {importError}
            </span>
          )}
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="Import graph JSON file"
            className="file-input"
            onChange={(e) => {
              void importFile(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </header>
      {hasGraph ? (
      <div
        className={`workspace ${navigationOpen ? "" : "navigation-collapsed"}`}
      >
        {navigationOpen && (
          <PaperNavigation
            graph={graph}
            filters={filters}
            onChange={(next) => {
              setFilters(next);
              dismiss();
            }}
            onSelect={navigateTo}
            onShowComplete={showCompleteMap}
            visibleCount={visible.nodes.length}
            selectedId={selectedId}
          />
        )}
        <GraphCanvas
          ref={canvasRef}
          graph={graph}
          filters={filters}
          selectedId={selectedId}
          focusRequest={focusRequest}
          onSelect={selectNode}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={selectEdge}
          onDismiss={dismiss}
          inspectorOpen={inspectorOpen}
          onCloseInspector={closeInspector}
          onNavigate={navigateTo}
          onClearFilters={() => setFilters(defaultFilters())}
          showContext={showContext}
          onShowContext={setShowContext}
          onScopeChange={changeScope}
          navigationOpen={navigationOpen}
          onToggleNavigation={() => setNavigationOpen((open) => !open)}
          onExportReady={setExportReady}
        />
      </div>
      ) : (
        <main className="upload-empty">
          <FileJson size={44} strokeWidth={1.2} />
          <h1>Open a paper map</h1>
          <p>Import a JSON file or drop it here to see its map.</p>
          <p className="upload-privacy">Your file stays in this browser.</p>
        </main>
      )}
      {dragging && (
        <div className="drop-overlay">
          <div>
            <FileJson size={44} strokeWidth={1.2} />
            <h2>Drop your mathematical graph</h2>
            <p>One .json file · Proof Map schema 1.0.0</p>
            <span>Processed entirely in your browser</span>
          </div>
        </div>
      )}
      <Tooltips />
    </div>
  );
}
