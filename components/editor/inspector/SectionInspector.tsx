"use client";

import { AlignCenter, AlignLeft, AlignRight, MousePointerClick } from "lucide-react";
import type { ReactNode } from "react";

import type { EditorAction } from "@/lib/editor/reducer";
import type { Path } from "@/lib/editor/set-in";
import { createFeatureItem, createNavLink } from "@/lib/page-model/defaults";
import type { ElementKey } from "@/lib/page-model/elements";
import { BUTTON_ICON_KEYS, BUTTON_ICONS, type ButtonIcon } from "@/lib/page-model/icons";
import { SECTION_INFO } from "@/lib/page-model/section-info";
import { LIMITS, TEXT_LIMITS, type Alignment, type NavLink, type PageTheme, type Section } from "@/lib/page-model/schema";

import { ColorInput, LinkInput, PanelGroup, Segmented, TextInput } from "./fields";
import { ElementInspector } from "./ElementInspector";
import { ExtraSectionFields, FeatureIconSelect } from "./ExtraSectionFields";
import { ImageInput } from "./ImageInput";
import { LayoutPanel } from "./LayoutPanel";
import { ListEditor } from "./ListEditor";
import { ShapeInspector } from "./ShapeInspector";
import { SHAPE_LABELS } from "@/components/page-renderer/ShapeElement";

type SectionInspectorProps = {
  section: Section | null;
  /** Elemento seleccionado dentro de la sección: se muestra su panel en lugar del de la sección. */
  selectedElement: ElementKey | null;
  /** Todos los elementos seleccionados (Mayús/Ctrl + clic). */
  selectedElements: ElementKey[];
  /** Forma seleccionada. Mutuamente excluyente con selectedElement. */
  selectedShapeId: string | null;
  theme: PageTheme;
  device: "desktop" | "mobile";
  dispatch: (action: EditorAction) => void;
};

const ALIGN_OPTIONS: { value: Alignment; label: string; icon: ReactNode }[] = [
  { value: "left", label: "Izquierda", icon: <AlignLeft className="size-3.5" aria-hidden /> },
  { value: "center", label: "Centro", icon: <AlignCenter className="size-3.5" aria-hidden /> },
  { value: "right", label: "Derecha", icon: <AlignRight className="size-3.5" aria-hidden /> },
];

/** Panel "Editar": los campos de la sección seleccionada. */
export function SectionInspector({
  section,
  selectedElement,
  selectedElements,
  selectedShapeId,
  theme,
  device,
  dispatch,
}: SectionInspectorProps) {
  if (!section) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-zinc-500">
        <MousePointerClick className="size-6" aria-hidden />
        Haz clic en una sección de la página para editarla.
      </div>
    );
  }

  if (selectedShapeId && section.shapes) {
    const shape = section.shapes.find((s) => s.id === selectedShapeId);
    if (shape) {
      return (
        <ShapeInspector
          section={section}
          shape={shape}
          dispatch={dispatch}
          onBack={() => dispatch({ type: "select", id: section.id })}
        />
      );
    }
  }

  if (selectedElement) {
    return (
      <ElementInspector
        section={section}
        elementKey={selectedElement}
        selectedKeys={selectedElements.length > 0 ? selectedElements : [selectedElement]}
        theme={theme}
        device={device}
        dispatch={dispatch}
        onBack={() => dispatch({ type: "select", id: section.id })}
      />
    );
  }

  const set = (path: Path, value: unknown) =>
    dispatch({ type: "updateSectionField", id: section.id, path, value });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold">{SECTION_INFO[section.type].label}</h2>
        <p className="text-xs text-zinc-500">
          Consejo: también puedes hacer clic en cualquier texto de la página y escribir ahí mismo.
        </p>
      </div>

      <SectionFields section={section} set={set} />

      <LayoutPanel
        section={section}
        device={device}
        dispatch={dispatch}
        onSelectElement={(key) => dispatch({ type: "selectElement", id: section.id, key })}
      />

      <PanelGroup title="Formas decorativas">
        {section.shapes && section.shapes.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {section.shapes.map((shape) => (
              <button
                key={shape.id}
                type="button"
                className="flex items-center gap-2 rounded border border-zinc-200 p-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                onClick={() => dispatch({ type: "selectShape", id: section.id, shapeId: shape.id })}
              >
                <div 
                  className="size-4 rounded-sm border border-zinc-300 dark:border-zinc-700" 
                  style={{ backgroundColor: shape.color, borderRadius: shape.type === "circle" ? "50%" : shape.radius === "full" ? "9999px" : shape.radius === "small" ? "0.25rem" : "0" }}
                />
                <span className="flex-1 text-left">
                  {SHAPE_LABELS[shape.type]}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            const newShape: import("@/lib/page-model/schema").Shape = {
              id: `shape-${Date.now()}`,
              type: "square",
              color: theme.colors.text,
              opacity: 50,
              radius: "none",
              position: { x: 10, y: 50, w: 20, h: 100 },
              zIndex: 0,
            };
            dispatch({ type: "addShape", id: section.id, shape: newShape });
            dispatch({ type: "selectShape", id: section.id, shapeId: newShape.id });
          }}
          className="w-full rounded border border-dashed border-zinc-300 py-2 text-sm text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        >
          + Agregar forma
        </button>
      </PanelGroup>

      <PanelGroup title="Fondo">
        <ColorInput
          label="Color de fondo de la sección"
          value={section.background ?? theme.colors.background}
          onChange={(color) => dispatch({ type: "setSectionBackground", id: section.id, color })}
          hint={section.background ? undefined : "Ahora usa el color de fondo del sitio (pestaña Estilo)."}
        />
        {section.background && (
          <button
            type="button"
            onClick={() => dispatch({ type: "setSectionBackground", id: section.id, color: undefined })}
            className="self-start text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Usar el fondo del sitio
          </button>
        )}
        
        <ImageInput 
          label="Imagen de fondo" 
          value={section.backgroundImage ?? ""} 
          onChange={(url) => dispatch({ type: "setSectionBackgroundImage", id: section.id, url: url || undefined })} 
        />
        
        {section.backgroundImage && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Opacidad de la imagen ({section.backgroundOpacity ?? 100}%)
            </span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={section.backgroundOpacity ?? 100} 
              onChange={(e) => dispatch({ type: "setSectionBackgroundOpacity", id: section.id, opacity: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>
        )}

        {section.backgroundImage && (
          <div className="flex flex-col gap-1">
            <label htmlFor="bg-overlay" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Oscurecer la foto ({section.backgroundOverlay ?? 0}%)
            </label>
            <input
              id="bg-overlay"
              type="range"
              min="0"
              max="90"
              step="5"
              value={section.backgroundOverlay ?? 0}
              onChange={(e) =>
                dispatch({
                  type: "updateSectionAppearance",
                  id: section.id,
                  patch: { backgroundOverlay: Number(e.target.value) },
                })
              }
              className="w-full accent-blue-600"
            />
            <p className="text-xs text-zinc-500">Una capa oscura sobre la foto hace que el texto se lea mejor.</p>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.lightText ?? false}
            onChange={(e) =>
              dispatch({ type: "updateSectionAppearance", id: section.id, patch: { lightText: e.target.checked } })
            }
            className="size-4 accent-blue-600"
          />
          Texto claro (para fondos oscuros o con foto)
        </label>
      </PanelGroup>
    </div>
  );
}

function SectionFields({ section, set }: { section: Section; set: (path: Path, value: unknown) => void }) {
  switch (section.type) {
    case "header":
      return (
        <>
          <PanelGroup title="Contenido">
            <TextInput
              label="Nombre"
              value={section.props.logoText}
              onChange={(v) => set(["logoText"], v)}
              maxLength={TEXT_LIMITS.logoText}
              required
            />
            <ImageInput
              label="Logo (imagen, opcional)"
              value={section.props.logoImage}
              onChange={(v) => set(["logoImage"], v)}
            />
          </PanelGroup>
          <PanelGroup title="Menú">
            <LinksEditor links={section.props.links} onChange={(links) => set(["links"], links)} />
          </PanelGroup>
        </>
      );

    case "hero":
      return (
        <>
          <PanelGroup title="Contenido">
            <TextInput
              label="Antetítulo"
              value={section.props.eyebrow}
              onChange={(v) => set(["eyebrow"], v)}
              maxLength={TEXT_LIMITS.eyebrow}
              placeholder="TULUÁ · VALLE DEL CAUCA"
              hint="Texto pequeño sobre el título. Déjalo vacío para no mostrarlo."
            />
            <TextInput
              label="Título"
              value={section.props.title}
              onChange={(v) => set(["title"], v)}
              maxLength={TEXT_LIMITS.heroTitle}
              required
            />
            <TextInput
              label="Palabras resaltadas del título"
              value={section.props.highlight}
              onChange={(v) => set(["highlight"], v)}
              maxLength={TEXT_LIMITS.heroTitle}
              placeholder="a minutos"
              hint="Escribe una parte del título para pintarla con el color principal."
            />
            <TextInput
              label="Subtítulo"
              value={section.props.subtitle}
              onChange={(v) => set(["subtitle"], v)}
              maxLength={TEXT_LIMITS.heroSubtitle}
              multiline
            />
          </PanelGroup>
          <PanelGroup title="Botón principal">
            <TextInput
              label="Texto del botón"
              value={section.props.buttonLabel}
              onChange={(v) => set(["buttonLabel"], v)}
              maxLength={TEXT_LIMITS.buttonLabel}
              hint="Déjalo vacío para no mostrar botón."
            />
            <LinkInput
              label="Al pulsar el botón, ir a"
              value={section.props.buttonHref}
              onChange={(v) => set(["buttonHref"], v)}
              optional
            />
            <IconSelect label="Icono" value={section.props.buttonIcon} onChange={(v) => set(["buttonIcon"], v)} />
          </PanelGroup>
          <PanelGroup title="Segundo botón (con borde)">
            <TextInput
              label="Texto"
              value={section.props.secondaryLabel}
              onChange={(v) => set(["secondaryLabel"], v)}
              maxLength={TEXT_LIMITS.buttonLabel}
              placeholder="Ver proyectos"
              hint="Déjalo vacío para no mostrarlo."
            />
            {section.props.secondaryLabel && (
              <>
                <LinkInput
                  label="Al pulsarlo, ir a"
                  value={section.props.secondaryHref}
                  onChange={(v) => set(["secondaryHref"], v)}
                  optional
                />
                <IconSelect
                  label="Icono"
                  value={section.props.secondaryIcon}
                  onChange={(v) => set(["secondaryIcon"], v)}
                />
              </>
            )}
          </PanelGroup>
          <PanelGroup title="Posición">
            <Segmented
              label="Alinear contenido y botón"
              value={section.props.align}
              options={ALIGN_OPTIONS}
              onChange={(v) => set(["align"], v)}
            />
            <p className="text-xs text-zinc-500">
              Con imagen: a la izquierda o derecha, la imagen se coloca al lado; en el centro, debajo.
            </p>
          </PanelGroup>
          <PanelGroup title="Imagen">
            <ImageInput label="Imagen de portada" value={section.props.imageUrl} onChange={(v) => set(["imageUrl"], v)} />
          </PanelGroup>
        </>
      );

    case "text":
      return (
        <PanelGroup title="Contenido">
          <TextInput
            label="Título"
            value={section.props.title}
            onChange={(v) => set(["title"], v)}
            maxLength={TEXT_LIMITS.sectionTitle}
          />
          <TextInput
            label="Texto"
            value={section.props.body}
            onChange={(v) => set(["body"], v)}
            maxLength={TEXT_LIMITS.body}
            multiline
          />
          <Segmented label="Alineación" value={section.props.align} options={ALIGN_OPTIONS} onChange={(v) => set(["align"], v)} />
        </PanelGroup>
      );

    case "image":
      return (
        <PanelGroup title="Imagen">
          <ImageInput label="Foto" value={section.props.src} onChange={(v) => set(["src"], v)} />
          <TextInput
            label="Descripción de la imagen"
            value={section.props.alt}
            onChange={(v) => set(["alt"], v)}
            maxLength={TEXT_LIMITS.imageAlt}
            hint="Para personas con discapacidad visual y buscadores. Ej.: «Taza de café sobre una mesa»."
          />
          <TextInput
            label="Pie de foto"
            value={section.props.caption}
            onChange={(v) => set(["caption"], v)}
            maxLength={TEXT_LIMITS.caption}
          />
        </PanelGroup>
      );

    case "features":
      return (
        <>
          <PanelGroup title="Contenido">
            <TextInput
              label="Título"
              value={section.props.title}
              onChange={(v) => set(["title"], v)}
              maxLength={TEXT_LIMITS.sectionTitle}
            />
          </PanelGroup>
          <PanelGroup title="Elementos">
            <ListEditor
              items={section.props.items}
              max={LIMITS.featureItems}
              noun="característica"
              create={createFeatureItem}
              onChange={(items) => set(["items"], items)}
              renderItem={(item, index) => (
                <>
                  <FeatureIconSelect
                    id={`feature-icon-${item.id}`}
                    value={item.icon}
                    onChange={(v) => set(["items", index, "icon"], v)}
                  />
                  <TextInput
                    label="Título"
                    value={item.title}
                    onChange={(v) => set(["items", index, "title"], v)}
                    maxLength={TEXT_LIMITS.featureTitle}
                    required
                  />
                  <TextInput
                    label="Descripción"
                    value={item.description}
                    onChange={(v) => set(["items", index, "description"], v)}
                    maxLength={TEXT_LIMITS.featureDescription}
                    multiline
                  />
                </>
              )}
            />
          </PanelGroup>
        </>
      );

    case "footer":
      return (
        <>
          <PanelGroup title="Contenido">
            <TextInput
              label="Texto"
              value={section.props.text}
              onChange={(v) => set(["text"], v)}
              maxLength={TEXT_LIMITS.footerText}
            />
          </PanelGroup>
          <PanelGroup title="Enlaces">
            <LinksEditor links={section.props.links} onChange={(links) => set(["links"], links)} />
          </PanelGroup>
        </>
      );
    default:
      return <ExtraSectionFields section={section} set={set} />;
  }
}

function LinksEditor({ links, onChange }: { links: NavLink[]; onChange: (links: NavLink[]) => void }) {
  const update = (index: number, patch: Partial<NavLink>) =>
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));

  return (
    <ListEditor
      items={links}
      max={LIMITS.links}
      noun="enlace"
      create={createNavLink}
      onChange={onChange}
      renderItem={(link, index) => (
        <>
          <TextInput
            label="Texto"
            value={link.label}
            onChange={(label) => update(index, { label })}
            maxLength={TEXT_LIMITS.linkLabel}
            required
          />
          <LinkInput label="Destino" value={link.href} onChange={(href) => update(index, { href })} />
        </>
      )}
    />
  );
}

/** Selector del icono de un botón. */
function IconSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ButtonIcon;
  onChange: (icon: ButtonIcon) => void;
}) {
  const id = `icon-${label}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as ButtonIcon)}
        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {BUTTON_ICON_KEYS.map((key) => (
          <option key={key} value={key}>
            {BUTTON_ICONS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}
