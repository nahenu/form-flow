"use client";

import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import { AlertTriangle, Flag, GitBranch, LayoutGrid, MousePointerClick, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/ui/native-select";
import { FIELD_TYPES } from "@/lib/forms/field-types";
import {
  conditionForSource,
  defaultRouteCondition,
  defaultTarget,
  describeCondition,
  fieldsUpToStep,
  isForwardTarget,
  OPERATOR_LABELS,
  operatorNeedsValue,
  operatorsFor,
  routeProblem,
  valuesFor,
  type RouteProblem,
} from "@/lib/forms/logic";
import * as ops from "@/lib/forms/operations";
import { END, type Condition, type ConditionOperator, type Form, type Route, type Step } from "@/lib/forms/types";
import { cn } from "@/lib/utils";

const START = "__start";
const ROW = 200;
const COLUMN_X = 0;
const SIDE_COLUMN = 380;
/** Each route from a step gets its own lane to the right, so parallel routes don't overlap. */
const laneOffset = (routeIndex: number) => 36 + routeIndex * 26;

type StepNodeData = { step: Step; index: number; problems: number };
type StepNode = Node<StepNodeData, "step">;
type TerminalNode = Node<{ kind: "start" | "end" }, "terminal">;
type FlowNode = StepNode | TerminalNode;

type FlowEdgeData =
  | { kind: "start" }
  | { kind: "route"; stepId: string; routeId: string; problem: RouteProblem | null; offset: number }
  | { kind: "next"; stepId: string; hasRoutes: boolean };
type FlowEdge = Edge<FlowEdgeData & { label?: string }, "flow">;

type Selection = { kind: "step"; stepId: string } | { kind: "route"; stepId: string; routeId: string } | { kind: "next"; stepId: string } | null;

const PROBLEM_TEXT: Record<RouteProblem, string> = {
  "bad-target": "Routes can only go forward. Pick a later step or the end.",
  "missing-source": "The question this route tested was deleted.",
  "source-after": "It tests a question that comes after this step, so it can never match.",
  "missing-value": "That answer is no longer one of the question's options.",
};

export interface FlowEditorProps {
  form: Form;
  onEdit: (recipe: (draft: Form) => void, coalesceKey?: string) => void;
  onOpenStep: (stepId: string) => void;
}

/**
 * Steps on the default path from the start ("the spine") stay in the main
 * column; steps only reached through a route go to a side column, so a branch
 * looks like a branch.
 */
function spineOf(form: Form) {
  const spine = new Set<string>();
  let i = 0;
  while (i < form.steps.length) {
    spine.add(form.steps[i].id);
    const next = defaultTarget(form, i);
    if (next === END) break;
    i = form.steps.findIndex((s) => s.id === next);
  }
  return spine;
}

/** Turns the form into graph nodes and edges. Pure: the form is the only source of truth. */
function toGraph(form: Form) {
  const autoY = (i: number) => (i + 1) * ROW;
  const spine = spineOf(form);
  const nodes: FlowNode[] = [
    { id: START, type: "terminal", position: { x: COLUMN_X + 82, y: 0 }, data: { kind: "start" }, draggable: false, deletable: false },
    ...form.steps.map<StepNode>((step, index) => ({
      id: step.id,
      type: "step",
      position: step.position ?? { x: spine.has(step.id) ? COLUMN_X : COLUMN_X + SIDE_COLUMN, y: autoY(index) },
      data: { step, index, problems: (step.routes ?? []).filter((r) => routeProblem(form, index, r)).length },
      deletable: false,
    })),
    {
      id: END,
      type: "terminal",
      position: { x: COLUMN_X + 82, y: autoY(form.steps.length) },
      data: { kind: "end" },
      deletable: false,
    },
  ];

  const edges: FlowEdge[] = [];
  if (form.steps[0]) {
    edges.push({ id: "edge:start", source: START, target: form.steps[0].id, type: "flow", data: { kind: "start" }, selectable: false, deletable: false });
  }
  form.steps.forEach((step, index) => {
    (step.routes ?? []).forEach((route, routeIndex) => {
      const problem = routeProblem(form, index, route);
      if (problem === "bad-target" && !form.steps.some((s) => s.id === route.to) && route.to !== END) return;
      edges.push({
        id: `route:${step.id}:${route.id}`,
        source: step.id,
        sourceHandle: "route",
        target: route.to,
        type: "flow",
        data: {
          kind: "route",
          stepId: step.id,
          routeId: route.id,
          problem,
          offset: laneOffset(routeIndex),
          label: describeCondition(form, route.condition),
        },
      });
    });
    const hasRoutes = !!step.routes?.length;
    edges.push({
      id: `next:${step.id}`,
      source: step.id,
      sourceHandle: "next",
      target: defaultTarget(form, index),
      type: "flow",
      data: { kind: "next", stepId: step.id, hasRoutes, label: hasRoutes ? "Otherwise" : undefined },
    });
  });
  return { nodes, edges };
}

export function FlowEditor({ form, onEdit, onOpenStep }: FlowEditorProps) {
  const graph = useMemo(() => toGraph(form), [form]);
  const [nodes, setNodes] = useState<FlowNode[]>(graph.nodes);
  const [syncedGraph, setSyncedGraph] = useState(graph);
  const [selection, setSelection] = useState<Selection>(null);

  // When the form changes (an edit, undo, redo), rebuild nodes but keep React Flow's measurements.
  // Adjusting state during render, as React recommends, instead of an effect.
  if (syncedGraph !== graph) {
    setSyncedGraph(graph);
    setNodes(graph.nodes.map((n) => ({ ...n, measured: nodes.find((p) => p.id === n.id)?.measured })));
  }

  const edges = graph.edges.map((e) => ({
    ...e,
    selected:
      (selection?.kind === "route" && e.id === `route:${selection.stepId}:${selection.routeId}`) ||
      (selection?.kind === "next" && e.id === `next:${selection.stepId}`),
  }));
  const shownNodes = nodes.map((n) => ({ ...n, selected: selection?.kind === "step" && n.id === selection.stepId }));

  const indexOf = (id: string) => form.steps.findIndex((s) => s.id === id);

  function isValidConnection(c: Connection | Edge) {
    const from = indexOf(c.source);
    return from !== -1 && c.source !== c.target && isForwardTarget(form, from, c.target ?? undefined);
  }

  function onConnect(c: Connection) {
    const from = indexOf(c.source);
    if (from === -1 || !isValidConnection(c)) {
      toast("Flows only go forward: connect to a later step or the end.");
      return;
    }
    // The bottom handle sets where everyone else goes; the side handle adds a conditional route.
    if (c.sourceHandle === "next") {
      onEdit((d) => ops.setStepNext(d, c.source, c.target));
      setSelection({ kind: "next", stepId: c.source });
      return;
    }
    const condition = defaultRouteCondition(form, from);
    if (!condition) {
      onEdit((d) => ops.setStepNext(d, c.source, c.target));
      setSelection({ kind: "next", stepId: c.source });
      toast("No questions to test yet, so this became the step's default path.");
      return;
    }
    let routeId: string | null = null;
    onEdit((d) => {
      routeId = ops.addRoute(d, c.source, condition, c.target);
    });
    if (routeId) setSelection({ kind: "route", stepId: c.source, routeId });
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="relative min-h-[28rem]" aria-label="Form flow diagram">
        <ReactFlow<FlowNode, FlowEdge>
          nodes={shownNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={(changes: NodeChange<FlowNode>[]) => setNodes((ns) => applyNodeChanges(changes, ns))}
          onNodeDragStop={(_, __, dragged) => {
            const positions = Object.fromEntries(dragged.filter((n) => n.type === "step").map((n) => [n.id, n.position]));
            if (Object.keys(positions).length) onEdit((d) => ops.setStepPositions(d, positions));
          }}
          onNodeClick={(_, node) => setSelection(node.type === "step" ? { kind: "step", stepId: node.id } : null)}
          onEdgeClick={(_, edge) => {
            const data = edge.data;
            if (data?.kind === "route") setSelection({ kind: "route", stepId: data.stepId, routeId: data.routeId });
            else if (data?.kind === "next") setSelection({ kind: "next", stepId: data.stepId });
          }}
          onPaneClick={() => setSelection(null)}
          onEdgesDelete={(deleted) => {
            const routes = deleted.flatMap((e) => (e.data?.kind === "route" ? [e.data] : []));
            if (routes.length) onEdit((d) => routes.forEach((r) => ops.removeRoute(d, r.stepId, r.routeId)));
            setSelection(null);
          }}
          isValidConnection={isValidConnection}
          onConnect={onConnect}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.3}
          maxZoom={1.5}
          defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#d5ddef" />
          <Controls showInteractive={false} />
        </ReactFlow>
        <button
          type="button"
          onClick={() => onEdit((d) => ops.clearStepPositions(d))}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted"
        >
          <LayoutGrid className="size-3.5" /> Tidy up
        </button>
      </div>

      <aside aria-label="Flow settings" className="overflow-y-auto border-t border-border bg-white lg:border-l lg:border-t-0">
        <FlowPanel form={form} selection={selection} onSelect={setSelection} onEdit={onEdit} onOpenStep={onOpenStep} />
      </aside>
    </div>
  );
}

// ---- nodes & edges ----------------------------------------------------------

const handleClass = "!size-3 !border-2 !border-primary !bg-white";

function StepNodeView({ data, selected }: NodeProps<StepNode>) {
  const { step, index, problems } = data;
  const routes = step.routes?.length ?? 0;
  return (
    <div
      className={cn(
        "w-64 rounded-xl border bg-white p-3 shadow-[0_8px_24px_-14px_rgba(9,49,141,0.45)] transition-[border-color,box-shadow]",
        selected ? "border-primary ring-3 ring-primary/15" : problems ? "border-amber-400" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Top} className={handleClass} />
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">Step {index + 1}</span>
        <span className="truncate font-display text-sm text-foreground">{step.title || "Untitled step"}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {step.fields.slice(0, 3).map((f) => {
          const Icon = FIELD_TYPES[f.type].icon;
          return (
            <li key={f.id} className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <Icon className="size-3 shrink-0 text-primary/60" aria-hidden />
              <span className="truncate">{f.label || "Untitled question"}</span>
            </li>
          );
        })}
        {step.fields.length > 3 && <li className="text-xs text-muted-foreground">+{step.fields.length - 3} more</li>}
        {step.fields.length === 0 && <li className="text-xs italic text-muted-foreground">No questions yet</li>}
      </ul>
      {(routes > 0 || problems > 0) && (
        <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-[11px] font-medium">
          {routes > 0 && (
            <span className="inline-flex items-center gap-1 text-primary">
              <GitBranch className="size-3" aria-hidden /> {routes} {routes === 1 ? "route" : "routes"}
            </span>
          )}
          {problems > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-800">
              <AlertTriangle className="size-3" aria-hidden /> needs fixing
            </span>
          )}
        </div>
      )}
      {/* Bottom: where everyone else goes. Right: add a conditional route. */}
      <Handle id="next" type="source" position={Position.Bottom} className={handleClass} title="Drag to change where everyone else goes" />
      <Handle id="route" type="source" position={Position.Right} className={cn(handleClass, "!bg-primary")} title="Drag to a later step to add a route" />
    </div>
  );
}

function TerminalNodeView({ data }: NodeProps<TerminalNode>) {
  const start = data.kind === "start";
  return (
    <div
      className={cn(
        "flex w-[100px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm",
        start ? "bg-primary text-white" : "bg-brand text-primary",
      )}
    >
      {start ? <Play className="size-3.5" aria-hidden /> : <Flag className="size-3.5" aria-hidden />}
      {start ? "Start" : "End"}
      {start ? <Handle type="source" position={Position.Bottom} className={handleClass} isConnectable={false} /> : <Handle type="target" position={Position.Top} className={handleClass} />}
    </div>
  );
}

function FlowEdgeView({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd }: EdgeProps<FlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 14,
    offset: data?.kind === "route" ? data.offset : 24,
  });
  const kind = data?.kind;
  const problem = data?.kind === "route" ? data.problem : null;
  const color = problem ? "#d97706" : kind === "route" ? "#09318d" : "#9aa7c7";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : kind === "route" ? 2.25 : 1.75,
          strokeDasharray: data?.kind === "next" && data.hasRoutes ? "6 5" : undefined,
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "nodrag nopan pointer-events-auto absolute max-w-52 cursor-pointer truncate rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm",
              problem ? "border-amber-400 bg-amber-50 text-amber-900" : kind === "route" ? "border-primary/30 bg-white text-primary" : "border-border bg-white text-muted-foreground",
              selected && "ring-3 ring-primary/20",
            )}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {kind === "route" ? `If ${data.label}` : data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { step: StepNodeView, terminal: TerminalNodeView };
const edgeTypes = { flow: FlowEdgeView };

// ---- side panel -------------------------------------------------------------

const labelClass = "mb-1.5 block text-xs font-semibold text-foreground";

function TargetSelect({
  form,
  fromIndex,
  value,
  onChange,
  label,
  includeDefault,
}: {
  form: Form;
  fromIndex: number;
  value: string;
  onChange: (value: string) => void;
  label: string;
  includeDefault?: boolean;
}) {
  const later = form.steps.slice(fromIndex + 1);
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <NativeSelect aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {includeDefault && <option value="">Next step in order{later[0] ? ` (Step ${fromIndex + 2})` : " (end)"}</option>}
        {later.map((s, i) => (
          <option key={s.id} value={s.id}>
            Step {fromIndex + 2 + i} · {s.title || "Untitled step"}
          </option>
        ))}
        <option value={END}>End of the form</option>
      </NativeSelect>
    </div>
  );
}

function ConditionEditor({ form, stepIndex, condition, onChange }: { form: Form; stepIndex: number; condition: Condition; onChange: (c: Condition) => void }) {
  const sources = fieldsUpToStep(form, stepIndex);
  const source = sources.find((f) => f.id === condition.fieldId);
  const values = source ? valuesFor(source) : [];
  const stepNumberOf = (fieldId: string) => form.steps.findIndex((s) => s.fields.some((f) => f.id === fieldId)) + 1;

  return (
    <div className="space-y-2">
      <label className={labelClass}>When</label>
      <NativeSelect
        aria-label="Question to test"
        value={source ? condition.fieldId : ""}
        onChange={(e) => {
          const next = sources.find((f) => f.id === e.target.value);
          if (next) onChange(conditionForSource(next));
        }}
      >
        {!source && <option value="">Pick a question…</option>}
        {sources.map((f) => (
          <option key={f.id} value={f.id}>
            Step {stepNumberOf(f.id)} · {f.label || "Untitled question"}
          </option>
        ))}
      </NativeSelect>
      {source && (
        <div className="flex gap-2">
          <NativeSelect
            aria-label="Comparison"
            className={operatorNeedsValue(condition.operator) ? "w-28 shrink-0" : "flex-1"}
            value={condition.operator}
            onChange={(e) => {
              const operator = e.target.value as ConditionOperator;
              onChange({ ...condition, operator, value: operatorNeedsValue(operator) ? condition.value || values[0] || "" : "" });
            }}
          >
            {operatorsFor(source.type).map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </NativeSelect>
          {operatorNeedsValue(condition.operator) && (
            <NativeSelect
              aria-label="Answer"
              className="min-w-0 flex-1"
              value={values.includes(condition.value) ? condition.value : ""}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
            >
              {!values.includes(condition.value) && <option value="">Pick an answer…</option>}
              {values.map((v) => (
                <option key={v} value={v}>
                  {source.type === "rating" ? `${v} star${v === "1" ? "" : "s"}` : v}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>
      )}
    </div>
  );
}

function FlowPanel({
  form,
  selection,
  onSelect,
  onEdit,
  onOpenStep,
}: {
  form: Form;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onEdit: FlowEditorProps["onEdit"];
  onOpenStep: (stepId: string) => void;
}) {
  const stepIndex = selection ? form.steps.findIndex((s) => s.id === selection.stepId) : -1;
  const step = form.steps[stepIndex];

  if (selection?.kind === "route" && step) {
    const route = step.routes?.find((r) => r.id === selection.routeId);
    if (route) return <RoutePanel form={form} stepIndex={stepIndex} route={route} onEdit={onEdit} onDone={() => onSelect({ kind: "step", stepId: step.id })} />;
  }

  if (selection?.kind === "next" && step) {
    return (
      <div className="space-y-4 p-4">
        <PanelTitle eyebrow={`Step ${stepIndex + 1} · ${step.title || "Untitled step"}`} title={step.routes?.length ? "Otherwise" : "Then"} />
        <p className="text-sm text-muted-foreground">
          {step.routes?.length ? "Where people go when none of this step's routes match." : "Where people go after this step."}
        </p>
        <TargetSelect
          form={form}
          fromIndex={stepIndex}
          label="Go to"
          includeDefault
          value={step.next && isForwardTarget(form, stepIndex, step.next) ? step.next : ""}
          onChange={(v) => onEdit((d) => ops.setStepNext(d, step.id, v || undefined))}
        />
      </div>
    );
  }

  if (selection?.kind === "step" && step) {
    return (
      <div className="space-y-4 p-4">
        <PanelTitle eyebrow={`Step ${stepIndex + 1}`} title={step.title || "Untitled step"} />
        <div>
          <p className={labelClass}>Routes, checked in order</p>
          {step.routes?.length ? (
            <ol className="space-y-1.5">
              {step.routes.map((r) => {
                const problem = routeProblem(form, stepIndex, r);
                const target = r.to === END ? "End" : form.steps.find((s) => s.id === r.to)?.title || "a deleted step";
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ kind: "route", stepId: step.id, routeId: r.id })}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left text-xs hover:bg-muted",
                        problem ? "border-amber-400 bg-amber-50 text-amber-900" : "border-border text-foreground",
                      )}
                    >
                      If {describeCondition(form, r.condition)} <span className="text-muted-foreground">→ {target}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No routes. Everyone continues to the next step.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!defaultRouteCondition(form, stepIndex)}
            title={defaultRouteCondition(form, stepIndex) ? undefined : "Add a question first: routes test answers."}
            onClick={() => {
              const condition = defaultRouteCondition(form, stepIndex);
              if (!condition) return;
              let routeId: string | null = null;
              onEdit((d) => {
                routeId = ops.addRoute(d, step.id, condition, form.steps[stepIndex + 2]?.id ?? END);
              });
              if (routeId) onSelect({ kind: "route", stepId: step.id, routeId });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-[#0b3aa6] disabled:opacity-40"
          >
            <Plus className="size-4" /> Add route
          </button>
          <button
            type="button"
            onClick={() => onOpenStep(step.id)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Edit questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 text-sm text-muted-foreground">
      <PanelTitle eyebrow="Flow" title="Branch your form" />
      <p>Send people to different steps based on their answers.</p>
      <ul className="space-y-2.5">
        <li className="flex gap-2">
          <MousePointerClick className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="text-foreground">Drag the blue dot</strong> on the right of a step to a later step (or End) to add a route. Drag the dot underneath to change where everyone else goes.
          </span>
        </li>
        <li className="flex gap-2">
          <GitBranch className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="text-foreground">Click a line</strong> to set its condition. Solid blue lines are routes; dashed grey is where everyone else goes.
          </span>
        </li>
        <li className="flex gap-2">
          <Trash2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            Select a route and press <kbd className="rounded border border-border bg-muted px-1 font-mono text-[11px] text-foreground">Delete</kbd> to remove it. Undo works here too.
          </span>
        </li>
      </ul>
      <p className="rounded-lg bg-muted p-3 text-xs">Routes only go forward, so a form can never loop.</p>
    </div>
  );
}

function RoutePanel({ form, stepIndex, route, onEdit, onDone }: { form: Form; stepIndex: number; route: Route; onEdit: FlowEditorProps["onEdit"]; onDone: () => void }) {
  const step = form.steps[stepIndex];
  const problem = routeProblem(form, stepIndex, route);
  const key = (part: string) => `route:${route.id}:${part}:${Date.now()}`;

  return (
    <div className="space-y-4 p-4">
      <PanelTitle eyebrow={`Step ${stepIndex + 1} · ${step.title || "Untitled step"}`} title="Route" />
      <ConditionEditor
        form={form}
        stepIndex={stepIndex}
        condition={route.condition}
        onChange={(condition) => onEdit((d) => ops.updateRoute(d, step.id, route.id, { condition }), key("condition"))}
      />
      <TargetSelect
        form={form}
        fromIndex={stepIndex}
        label="Go to"
        value={isForwardTarget(form, stepIndex, route.to) ? route.to : END}
        onChange={(to) => onEdit((d) => ops.updateRoute(d, step.id, route.id, { to }), key("to"))}
      />
      {problem && (
        <p role="alert" className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {PROBLEM_TEXT[problem]}
        </p>
      )}
      <div className="flex gap-2 border-t border-border pt-4">
        <button type="button" onClick={onDone} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
          Done
        </button>
        <button
          type="button"
          onClick={() => {
            onEdit((d) => ops.removeRoute(d, step.id, route.id));
            onDone();
          }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5"
        >
          <Trash2 className="size-4" /> Delete route
        </button>
      </div>
    </div>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="truncate text-xs font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="font-display text-lg text-foreground">{title}</h2>
    </div>
  );
}
