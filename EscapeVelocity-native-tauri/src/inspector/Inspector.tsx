/** PageSetting inspector (M5): GUI controls bound to `settings.json`. Every
 *  change updates the settings and triggers a debounced regenerate + recompile,
 *  so the whole book re-typesets. */
import type { ReactNode } from "react";
import { compileStore, useCompile } from "../compile/store";
import type { ParagraphStyle, Settings } from "../model/types";
import { FONTS, PARAGRAPH_STYLES, PRESETS, TEMPLATES } from "./options";

function patchSettings(mut: (s: Settings) => Settings) {
  const s = compileStore.getState().settings;
  if (s) compileStore.setSettings(mut(s));
}
const updBody = (p: Partial<Settings["body"]>) => patchSettings((s) => ({ ...s, body: { ...s.body, ...p } }));
const updMargins = (p: Partial<Settings["margins"]>) =>
  patchSettings((s) => ({ ...s, margins: { ...s.margins, ...p } }));
const updPara = (p: Partial<Settings["paragraph"]>) =>
  patchSettings((s) => ({ ...s, paragraph: { ...s.paragraph, ...p } }));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ev-insp__section">
      <h3 className="ev-insp__title">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ev-insp__row">
      <span className="ev-insp__label">{label}</span>
      {children}
    </label>
  );
}

function SelectRow(props: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Row label={props.label}>
      <select
        className="ev-insp__select"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </Row>
  );
}

function NumberRow(props: {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={props.label}>
      <input
        className="ev-insp__number"
        type="number"
        value={props.value}
        step={props.step}
        min={props.min}
        max={props.max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) props.onChange(v);
        }}
      />
    </Row>
  );
}

function ToggleRow(props: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={props.label}>
      <input
        className="ev-insp__toggle"
        type="checkbox"
        checked={props.value}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    </Row>
  );
}

export function Inspector() {
  const settings = useCompile((s) => s.settings);

  if (!settings) {
    return (
      <div className="ev-pane__body">
        <div className="ev-empty">
          <div className="ev-empty__hint">Settings load when the desktop app starts.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ev-pane__body ev-inspector">
      <Section title="Output">
        <SelectRow
          label="Template"
          value=""
          options={TEMPLATES}
          onChange={(v) => {
            if (v) void compileStore.applyTemplate(v);
          }}
        />
        <SelectRow
          label="Preset"
          value={settings.output_preset}
          options={PRESETS}
          onChange={(v) => void compileStore.switchPreset(v)}
        />
        <Row label="Trim">
          <span className="ev-insp__readout">
            {settings.trim.width_in} × {settings.trim.height_in} in
          </span>
        </Row>
        <ToggleRow label="Bleed" value={settings.bleed} onChange={(v) => patchSettings((s) => ({ ...s, bleed: v }))} />
      </Section>

      <Section title="Body type">
        <SelectRow label="Font" value={settings.body.font} options={FONTS} onChange={(v) => updBody({ font: v })} />
        <NumberRow label="Size (pt)" value={settings.body.size_pt} step={0.5} min={8} max={16} onChange={(v) => updBody({ size_pt: v })} />
        <NumberRow label="Leading (pt)" value={settings.body.leading_pt} step={0.5} min={9} max={28} onChange={(v) => updBody({ leading_pt: v })} />
        <ToggleRow label="Justify" value={settings.body.justify} onChange={(v) => updBody({ justify: v })} />
        <ToggleRow label="Hyphenate" value={settings.body.hyphenate} onChange={(v) => updBody({ hyphenate: v })} />
        <ToggleRow label="Microtype" value={settings.body.microtype} onChange={(v) => updBody({ microtype: v })} />
      </Section>

      <Section title="Paragraphs">
        <SelectRow
          label="Style"
          value={settings.paragraph.style}
          options={PARAGRAPH_STYLES}
          onChange={(v) => updPara({ style: v as ParagraphStyle })}
        />
        <ToggleRow
          label="No first indent"
          value={settings.paragraph.suppress_first_indent}
          onChange={(v) => updPara({ suppress_first_indent: v })}
        />
      </Section>

      <Section title="Margins (in)">
        <NumberRow label="Inside" value={settings.margins.inside_in} step={0.0625} min={0.25} max={2} onChange={(v) => updMargins({ inside_in: v })} />
        <NumberRow label="Outside" value={settings.margins.outside_in} step={0.0625} min={0.25} max={2} onChange={(v) => updMargins({ outside_in: v })} />
        <NumberRow label="Top" value={settings.margins.top_in} step={0.0625} min={0.25} max={2} onChange={(v) => updMargins({ top_in: v })} />
        <NumberRow label="Bottom" value={settings.margins.bottom_in} step={0.0625} min={0.25} max={2} onChange={(v) => updMargins({ bottom_in: v })} />
      </Section>

      <Section title="Running heads">
        <ToggleRow
          label="Show running heads"
          value={settings.running_heads.enabled}
          onChange={(v) => patchSettings((s) => ({ ...s, running_heads: { enabled: v } }))}
        />
      </Section>
    </div>
  );
}
