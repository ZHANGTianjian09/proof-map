import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  MarkerType,
  PanOnScrollMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
} from "@xyflow/react";
import {
  Focus,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  Tags,
  X,
} from "lucide-react";
import { constructGraph } from "../graph/normalize";
import { layoutGraph } from "../graph/layout";
import { gridLayout, NODE_HEIGHT, NODE_WIDTH } from "../graph/layout-shared";
import { matchesFilters, type GraphFilters } from "../graph/filters";
import {
  OBJECT_STYLE,
  RELATION_STYLE,
  sectionPresentation,
} from "../graph/presentation";
import { directNeighbors } from "../graph/navigation";
import { contextGraph, nodeScope, type NodeScope } from "../graph/scope";
import { edgeGeometry, edgeLanes, unionBounds } from "../graph/edge-geometry";
import { mapOverview, constrainMapViewport } from "../graph/canvas-viewport";
import { readingViewport } from "../graph/inspector-layout";
import type { PaperGraph } from "../graph/types";
import { MathObjectNode, type ObjectFlowNode } from "./MathObjectNode";
import {
  RelationshipEdge,
  type RelationshipFlowEdge,
} from "./RelationshipEdge";
import { NodeInspector } from "./NodeInspector";
import { EdgeInspector } from "./EdgeInspector";
import { FloatingPanel } from "./FloatingPanel";
import { EdgeLegend } from "./EdgeLegend";
import { exportMapPdf } from "../export/map-pdf";

const nodeTypes = { mathObject: MathObjectNode };
const edgeTypes = { relationship: RelationshipEdge };
export interface GraphCanvasHandle {
  exportPdf: () => Promise<number>;
}
interface Props {
  graph: PaperGraph;
  filters: GraphFilters;
  selectedId: string | null;
  selectedEdgeId: string | null;
  focusRequest: number;
  showContext: boolean;
  navigationOpen: boolean;
  onSelect: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onDismiss: () => void;
  inspectorOpen: boolean;
  onCloseInspector: () => void;
  onNavigate: (id: string) => void;
  onClearFilters: () => void;
  onShowContext: (show: boolean) => void;
  onScopeChange: (id: string, scope: NodeScope) => void;
  onToggleNavigation: () => void;
  onExportReady: (ready: boolean) => void;
}
function Canvas({
  graph,
  filters,
  selectedId,
  selectedEdgeId,
  focusRequest,
  showContext,
  navigationOpen,
  onSelect,
  onSelectEdge,
  onDismiss,
  inspectorOpen,
  onCloseInspector,
  onNavigate,
  onClearFilters,
  onShowContext,
  onScopeChange,
  onToggleNavigation,
  onExportReady,
  exportRef,
}: Props & { exportRef: Ref<GraphCanvasHandle> }) {
  const [positions, setPositions] = useState<ObjectFlowNode[]>([]);
  const [layoutStatus, setLayoutStatus] = useState<
    "loading" | "ready" | "fallback"
  >("loading");
  const layoutHint =
    layoutStatus === "loading"
      ? "Arranging the map…"
      : layoutStatus === "fallback"
        ? "Automatic layout unavailable. Objects are shown in a grid."
        : "Rearrange the map automatically";
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [area, setArea] = useState({ width: 900, height: 650 });
  const areaRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const { getViewport, setViewport } = useReactFlow<
    ObjectFlowNode,
    RelationshipFlowEdge
  >();
  const viewport = useViewport();
  const sections = useMemo(() => sectionPresentation(graph), [graph]);
  const index = useMemo(() => constructGraph(graph), [graph]);
  const neighborhood = useMemo(
    () => (selectedId ? directNeighbors(index, selectedId) : null),
    [index, selectedId],
  );
  const selectedEdge = selectedEdgeId
    ? graph.edges.find((edge) => edge.id === selectedEdgeId)
    : undefined;
  const layoutInput = useMemo(
    () => contextGraph(graph, showContext),
    [graph, showContext],
  );
  const globalCount = graph.nodes.filter(
    (n) => nodeScope(n) === "global_context",
  ).length;
  useEffect(() => {
    if (!areaRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setArea({ width, height });
    });
    observer.observe(areaRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!showLegend) return;
    const pointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !legendRef.current?.contains(event.target)
      )
        setShowLegend(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLegend(false);
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [showLegend]);
  useEffect(() => {
    const controller = new AbortController();
    const createNodes = (
      coords: ReturnType<typeof gridLayout>,
    ): ObjectFlowNode[] =>
      coords.map((position) => {
        const object = index.nodesById.get(position.id)!;
        return {
          id: position.id,
          type: "mathObject",
          position: { x: position.x, y: position.y },
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          draggable: false,
          connectable: false,
          ariaLabel: `${object.label}: ${object.title}; ${OBJECT_STYLE[object.type].label}`,
          data: {
            object,
            sectionTitle: sections.get(object.section)?.title ?? object.section,
            sectionLabel: sections.get(object.section)?.label ?? object.section,
            sectionColor: sections.get(object.section)?.color ?? "#ffffff",
            isolated:
              !index.incoming.get(object.id)?.length &&
              !index.outgoing.get(object.id)?.length,
          },
        };
      });
    setPositions(createNodes(gridLayout(layoutInput)));
    setLayoutStatus("loading");
    layoutGraph(layoutInput, controller.signal)
      .then((coords) => {
        if (controller.signal.aborted) return;
        setPositions(createNodes(coords));
        setLayoutStatus("ready");
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) {
          setLayoutStatus("fallback");
          console.error("Automatic layout failed", error);
        }
      });
    return () => controller.abort();
  }, [layoutInput, index, sections]);
  const nodes = useMemo(
    () =>
      positions.map((node) => ({
        ...node,
        selected: node.id === selectedId,
        hidden: !matchesFilters(node.data.object, filters),
        data: {
          ...node.data,
          neighborhood: neighborhood?.predecessors.has(node.id)
            ? neighborhood.successors.has(node.id)
              ? ("both" as const)
              : ("predecessor" as const)
            : neighborhood?.successors.has(node.id)
              ? ("successor" as const)
              : selectedEdge &&
                  (node.id === selectedEdge.source ||
                    node.id === selectedEdge.target)
                ? ("endpoint" as const)
                : undefined,
        },
      })),
    [positions, selectedId, filters, neighborhood, selectedEdge],
  );
  const visibleIds = useMemo(
    () => new Set(nodes.filter((n) => !n.hidden).map((n) => n.id)),
    [nodes],
  );
  const edges = useMemo((): RelationshipFlowEdge[] => {
    const lanes = edgeLanes(layoutInput.edges);
    return layoutInput.edges.map((edge) => {
      const style = RELATION_STYLE[edge.relation];
      const highlighted =
        edge.id === selectedEdgeId ||
        selectedId === edge.source ||
        selectedId === edge.target;
      return {
        id: edge.id,
        type: "relationship",
        source: edge.source,
        target: edge.target,
        selected: edge.id === selectedEdgeId,
        hidden: !visibleIds.has(edge.source) || !visibleIds.has(edge.target),
        data: {
          relationship: edge,
          ...lanes.get(edge.id)!,
          showLabel: showLabels || highlighted,
          selectionOnlyLabel: !showLabels && highlighted,
        },
        style: {
          stroke: style.color,
          strokeWidth: style.width + (highlighted ? 0.7 : 0),
          strokeDasharray: edge.origin === "inferred" ? "7 5" : undefined,
          opacity: (selectedId || selectedEdgeId) && !highlighted ? 0.65 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: style.color,
          width: 18,
          height: 18,
        },
        markerStart:
          edge.relation === "equivalent_to"
            ? {
                type: MarkerType.ArrowClosed,
                color: style.color,
                width: 18,
                height: 18,
              }
            : undefined,
        ariaLabel: `${index.nodesById.get(edge.source)?.label} ${style.label} ${index.nodesById.get(edge.target)?.label}; ${edge.origin}; ${edge.verification}`,
        focusable: true,
      };
    });
  }, [layoutInput, visibleIds, selectedId, selectedEdgeId, showLabels, index]);
  const mapBounds = useMemo(() => {
    const visible = nodes.filter((node) => !node.hidden);
    if (!visible.length) return { x: 0, y: 0, width: 1, height: 1 };
    const byId = new Map(visible.map((node) => [node.id, node]));
    const bounds = visible.map((node) => ({
      ...node.position,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }));
    for (const edge of edges) {
      if (edge.hidden) continue;
      const source = byId.get(edge.source)!;
      const target = byId.get(edge.target)!;
      bounds.push(
        edgeGeometry(
          {
            x: source.position.x + NODE_WIDTH / 2,
            y: source.position.y + NODE_HEIGHT,
          },
          { x: target.position.x + NODE_WIDTH / 2, y: target.position.y },
          edge.data!.lane,
          edge.data!.laneCount,
        ).bounds,
      );
    }
    return unionBounds(bounds);
  }, [nodes, edges]);
  const overview = useMemo(() => mapOverview(mapBounds, area), [mapBounds, area]);
  const canPan = viewport.zoom > overview.zoom + 0.00001;
  const overviewRef = useRef(overview);
  overviewRef.current = overview;
  // Resizing or filtering may raise the full-map zoom floor.
  useEffect(() => {
    if (layoutStatus === "loading") return;
    if (getViewport().zoom < overview.zoom)
      void setViewport(overviewRef.current);
  }, [overview.zoom, layoutStatus, getViewport, setViewport]);
  const visibleCount = nodes.filter((n) => !n.hidden).length;
  useEffect(
    () => onExportReady(layoutStatus !== "loading" && visibleCount > 0),
    [layoutStatus, visibleCount, onExportReady],
  );
  useImperativeHandle(
    exportRef,
    () => ({
      exportPdf: async () => {
        if (layoutStatus === "loading")
          throw new Error("Wait for the map to finish arranging.");
        const element = areaRef.current?.querySelector<HTMLElement>(
          ".react-flow__viewport",
        );
        if (!element) throw new Error("The graph is not ready to export.");
        return exportMapPdf(
          element,
          graph.paper,
          nodes
            .filter((n) => !n.hidden)
            .map((n) => ({
              id: n.id,
              ...n.position,
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
            })),
          edges.filter((e) => !e.hidden).map((e) => e.data!.relationship),
        );
      },
    }),
    [graph.paper, nodes, edges, layoutStatus],
  );
  const lastFocus = useRef(0);
  const focusRef = useRef({ focusRequest, selectedId });
  focusRef.current = { focusRequest, selectedId };
  useEffect(() => {
    if (layoutStatus === "loading") return;
    // Search owns the camera for this render. Filtering and layout use overview.
    if (focusRef.current.focusRequest !== lastFocus.current) return;
    const timer = setTimeout(
      () =>
        void setViewport(
          {
            ...overviewRef.current,
            zoom: Math.max(
              overviewRef.current.zoom,
              visibleCount > 80 ? 0.6 : 0,
            ),
          },
          { duration: 300 },
        ),
      60,
    );
    return () => clearTimeout(timer);
  }, [layoutStatus, filters, setViewport]);
  useEffect(() => {
    if (!focusRequest) lastFocus.current = 0;
    if (
      !focusRequest ||
      lastFocus.current === focusRequest ||
      layoutStatus === "loading" ||
      !selectedId
    )
      return;
    const target = positions.find((node) => node.id === selectedId);
    const timer = setTimeout(() => {
      lastFocus.current = focusRequest;
      // Hidden global context opens the same inspector without revealing or moving it.
      if (!target || !visibleIds.has(selectedId)) return;
      void setViewport(
        readingViewport(
          { ...target.position, width: NODE_WIDTH, height: NODE_HEIGHT },
          area,
        ),
        {
          duration: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 300,
        },
      );
    }, 80);
    return () => clearTimeout(timer);
  }, [
    focusRequest,
    selectedId,
    visibleIds,
    positions,
    layoutStatus,
    setViewport,
    area,
  ]);
  const onNodesChange = useCallback(
    (changes: NodeChange<ObjectFlowNode>[]) => {
      const selected = changes.find((c) => c.type === "select" && c.selected);
      if (selected?.type === "select") onSelect(selected.id);
      setPositions((previous) =>
        applyNodeChanges(
          changes.filter((c) => c.type === "dimensions"),
          previous,
        ),
      );
    },
    [onSelect],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationshipFlowEdge>[]) => {
      const selected = changes.find((c) => c.type === "select" && c.selected);
      if (selected?.type === "select") onSelectEdge(selected.id);
    },
    [onSelectEdge],
  );
  const selectedNode = selectedId ? index.nodesById.get(selectedId) : undefined;
  function focusSelection(includeNeighbors = false) {
    if (!selectedId) return;
    if (!visibleIds.has(selectedId)) {
      onShowContext(true);
      onNavigate(selectedId);
      return;
    }
    const ids =
      includeNeighbors && neighborhood
        ? [selectedId, ...neighborhood.predecessors, ...neighborhood.successors]
        : [selectedId];
    const targets = positions.filter(
      (node) => ids.includes(node.id) && visibleIds.has(node.id),
    );
    const x = Math.min(...targets.map((node) => node.position.x));
    const y = Math.min(...targets.map((node) => node.position.y));
    const width =
      Math.max(...targets.map((node) => node.position.x + NODE_WIDTH)) - x;
    const height =
      Math.max(...targets.map((node) => node.position.y + NODE_HEIGHT)) - y;
    void setViewport(readingViewport({ x, y, width, height }, area), {
      duration: 300,
    });
  }
  return (
    <main className="canvas-panel" aria-label="Global paper map" data-layout-status={layoutStatus}>
      <div className="canvas-toolbar">
        <div className="canvas-heading">
          <button
            className="icon-button"
            aria-label={
              navigationOpen
                ? "Collapse paper navigator"
                : "Open paper navigator"
            }
            aria-expanded={navigationOpen}
            data-tooltip={
              navigationOpen
                ? "Hide the paper navigator"
                : "Open the paper navigator"
            }
            onClick={onToggleNavigation}
          >
            {navigationOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>
          <div>
            <h2>Proof map</h2>
            <p>
              {visibleCount} / {graph.nodes.length} objects <span>·</span>{" "}
              {edges.filter((e) => !e.hidden).length} relationships
            </p>
          </div>
        </div>
        <div className="canvas-actions">
          <div className="legend-menu" ref={legendRef}>
            <button
              className="toolbar-button"
              aria-label="Edge legend"
              data-tooltip="Explain relationship lines and arrowheads"
              aria-expanded={showLegend}
              onClick={() => setShowLegend(!showLegend)}
            >
              <Info size={15} />
              <span>Edge legend</span>
            </button>
            {showLegend && <EdgeLegend />}
          </div>
          <button
            className={`icon-button ${showLabels ? "active" : ""}`}
            aria-label="Toggle all relationship labels"
            data-tooltip={
              showLabels
                ? "Hide relationship labels"
                : "Show relationship labels"
            }
            aria-pressed={showLabels}
            onClick={() => setShowLabels(!showLabels)}
          >
            <Tags size={17} />
          </button>
          {layoutStatus !== "ready" && (
            <span id="layout-status" className="sr-only" role="status">
              {layoutHint}
            </span>
          )}
        </div>
      </div>
      <div className="map-area" ref={areaRef}>
        <ReactFlow<ObjectFlowNode, RelationshipFlowEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => {
            onSelect(node.id);
          }}
          onEdgeClick={(_, edge) => {
            onSelectEdge(edge.id);
          }}
          onPaneClick={() => {
            onDismiss();
            setShowLegend(false);
          }}
          onMoveEnd={(event, next) => {
            const fitted = overviewRef.current;
            const bounded = next.zoom <= fitted.zoom + 0.00001
              ? fitted
              : event ? constrainMapViewport(next, mapBounds, area) : next;
            if (Math.abs(next.x - bounded.x) > 0.5 || Math.abs(next.y - bounded.y) > 0.5)
              void setViewport(bounded);
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          panOnScroll={canPan}
          panOnScrollMode={PanOnScrollMode.Free}
          panOnScrollSpeed={1}
          zoomOnScroll={false}
          zoomOnPinch
          zoomActivationKeyCode={null}
          panOnDrag={canPan}
          zoomOnDoubleClick={false}
          selectionOnDrag={false}
          autoPanOnNodeFocus={false}
          deleteKeyCode={null}
          minZoom={overview.zoom}
          maxZoom={2}
          onlyRenderVisibleElements={false}
          aria-label="Interactive mathematical knowledge graph"
        ></ReactFlow>
        <div className="map-hint">
          {canPan ? "Scroll to pan" : "Full map · Pan locked"} <span>·</span>{" "}
          Pinch to zoom <span>·</span> Click to read
        </div>
        {showContext && (
          <button
            className="context-shown-chip"
            onClick={() => onShowContext(false)}
          >
            Global context shown <X size={12} />
          </button>
        )}
        {inspectorOpen && (selectedNode || selectedEdge) && (
          <FloatingPanel
            selectionKey={selectedNode?.id ?? selectedEdge!.id}
            area={area}
            onClose={onCloseInspector}
          >
            {selectedNode ? (
              <NodeInspector
                node={selectedNode}
                graph={graph}
                index={index}
                onSelect={onNavigate}
                onClose={onCloseInspector}
                onScopeChange={onScopeChange}
                hiddenContext={
                  nodeScope(selectedNode) === "global_context" && !showContext
                }
                onReveal={() => {
                  onShowContext(true);
                  onNavigate(selectedNode.id);
                }}
                onFocus={() => focusSelection()}
                onFocusNeighbors={() => focusSelection(true)}
              />
            ) : (
              <EdgeInspector
                edge={selectedEdge!}
                index={index}
                onSelect={onNavigate}
                onClose={onCloseInspector}
              />
            )}
          </FloatingPanel>
        )}
        {layoutStatus !== "loading" && !visibleCount && (
          <div className="canvas-empty">
            <Focus size={28} strokeWidth={1.3} />
            <h3>
              {graph.nodes.length
                ? "No proof objects match this view"
                : "This paper has no objects yet"}
            </h3>
            <p>
              {globalCount
                ? "Use search to inspect global context, or show the complete map."
                : "Adjust your search, section, or object types."}
            </p>
            {graph.nodes.length > 0 && (
              <button className="button" onClick={onClearFilters}>
                Reset filters
              </button>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
export const GraphCanvas = forwardRef<GraphCanvasHandle, Props>(
  function GraphCanvas(props, ref) {
    return (
      <ReactFlowProvider>
        <Canvas {...props} exportRef={ref} />
      </ReactFlowProvider>
    );
  },
);
