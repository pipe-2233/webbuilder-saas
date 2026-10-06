"use client";

import type { Path } from "@/lib/editor/set-in";
import { createCard, createSpec, createStat, createStep } from "@/lib/page-model/defaults";
import { BUTTON_ICON_KEYS, BUTTON_ICONS, FEATURE_ICON_KEYS, FEATURE_ICONS } from "@/lib/page-model/icons";
import { LIMITS, TEXT_LIMITS, type Section, type SectionOfType } from "@/lib/page-model/schema";

import { LinkInput, PanelGroup, Segmented, TextInput } from "./fields";
import { ImageInput } from "./ImageInput";
import { ListEditor } from "./ListEditor";

type SetField = (path: Path, value: unknown) => void;

/** Lista desplegable sencilla (iconos, etc.). */
function Select<T extends string>({
  id,
  label,
  value,
  options,
  labels,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Icono de una característica (lo usa también el panel de características). */
export function FeatureIconSelect({ id, value, onChange }: { id: string; value: (typeof FEATURE_ICON_KEYS)[number]; onChange: (v: (typeof FEATURE_ICON_KEYS)[number]) => void }) {
  return <Select id={id} label="Icono" value={value} options={FEATURE_ICON_KEYS} labels={FEATURE_ICONS} onChange={onChange} />;
}

/** Antetítulo, título y descripción de las secciones nuevas. */
function IntroFields({ section, set }: { section: SectionOfType<"showcase" | "cards" | "steps" | "contact">; set: SetField }) {
  return (
    <PanelGroup title="Encabezado">
      <TextInput label="Antetítulo" value={section.props.eyebrow} onChange={(v) => set(["eyebrow"], v)} maxLength={TEXT_LIMITS.eyebrow} hint="Texto pequeño sobre el título (opcional)." />
      <TextInput label="Título" value={section.props.title} onChange={(v) => set(["title"], v)} maxLength={TEXT_LIMITS.sectionTitle} />
      <TextInput label="Descripción" value={section.props.subtitle} onChange={(v) => set(["subtitle"], v)} maxLength={TEXT_LIMITS.heroSubtitle} multiline />
    </PanelGroup>
  );
}

/** Campos de las secciones de cifras, destacado, tarjetas, lista y contacto. */
export function ExtraSectionFields({ section, set }: { section: Section; set: SetField }) {
  switch (section.type) {
    case "stats":
      return (
        <PanelGroup title="Cifras">
          <p className="text-xs text-zinc-500">En la página publicada los números cuentan desde 0 al aparecer en pantalla.</p>
          <ListEditor
            items={section.props.items}
            max={LIMITS.stats}
            noun="cifra"
            create={createStat}
            onChange={(items) => set(["items"], items)}
            renderItem={(item, index) => (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="Número" value={item.value} onChange={(v) => set(["items", index, "value"], v)} maxLength={TEXT_LIMITS.statValue} placeholder="1.000" required />
                  <TextInput label="Unidad" value={item.suffix} onChange={(v) => set(["items", index, "suffix"], v)} maxLength={TEXT_LIMITS.chip} placeholder="m²" />
                </div>
                <TextInput label="Texto" value={item.label} onChange={(v) => set(["items", index, "label"], v)} maxLength={TEXT_LIMITS.statLabel} placeholder="lotes desde" />
                <TextInput label="Detalle" value={item.detail} onChange={(v) => set(["items", index, "detail"], v)} maxLength={TEXT_LIMITS.statLabel} placeholder="hasta 3.500 m²" />
              </>
            )}
          />
        </PanelGroup>
      );

    case "showcase":
      return (
        <>
          <IntroFields section={section} set={set} />
          <PanelGroup title="Imagen">
            <ImageInput label="Foto" value={section.props.imageUrl} onChange={(v) => set(["imageUrl"], v)} />
            <Segmented
              label="Lado de la imagen"
              value={section.props.imageSide}
              options={[
                { value: "left", label: "Izquierda" },
                { value: "right", label: "Derecha" },
              ]}
              onChange={(v) => set(["imageSide"], v)}
            />
          </PanelGroup>
          <PanelGroup title="Ficha de datos">
            <TextInput label="Título de la ficha" value={section.props.specsTitle} onChange={(v) => set(["specsTitle"], v)} maxLength={TEXT_LIMITS.sectionTitle} placeholder="Lotes disponibles" />
            <ListEditor
              items={section.props.specs}
              max={LIMITS.specs}
              noun="dato"
              create={createSpec}
              onChange={(specs) => set(["specs"], specs)}
              renderItem={(spec, index) => (
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="Dato" value={spec.label} onChange={(v) => set(["specs", index, "label"], v)} maxLength={TEXT_LIMITS.specLabel} required />
                  <TextInput label="Valor" value={spec.value} onChange={(v) => set(["specs", index, "value"], v)} maxLength={TEXT_LIMITS.specValue} />
                </div>
              )}
            />
          </PanelGroup>
          <PanelGroup title="Botón">
            <TextInput label="Texto del botón" value={section.props.buttonLabel} onChange={(v) => set(["buttonLabel"], v)} maxLength={TEXT_LIMITS.buttonLabel} hint="Déjalo vacío para no mostrarlo." />
            <LinkInput label="Al pulsar, ir a" value={section.props.buttonHref} onChange={(v) => set(["buttonHref"], v)} optional />
            <Select id="showcase-icon" label="Icono" value={section.props.buttonIcon} options={BUTTON_ICON_KEYS} labels={BUTTON_ICONS} onChange={(v) => set(["buttonIcon"], v)} />
          </PanelGroup>
        </>
      );

    case "cards":
      return (
        <>
          <IntroFields section={section} set={set} />
          <PanelGroup title="Tarjetas">
            <ListEditor
              items={section.props.items}
              max={LIMITS.cards}
              noun="tarjeta"
              create={() => createCard()}
              onChange={(items) => set(["items"], items)}
              renderItem={(card, index) => (
                <>
                  <ImageInput label="Foto" value={card.imageUrl} onChange={(v) => set(["items", index, "imageUrl"], v)} />
                  <TextInput label="Zona o categoría" value={card.tag} onChange={(v) => set(["items", index, "tag"], v)} maxLength={TEXT_LIMITS.chip * 2} placeholder="Chancos · Tuluá" />
                  <TextInput label="Título" value={card.title} onChange={(v) => set(["items", index, "title"], v)} maxLength={TEXT_LIMITS.featureTitle} required />
                  <TextInput label="Descripción" value={card.description} onChange={(v) => set(["items", index, "description"], v)} maxLength={TEXT_LIMITS.featureDescription} multiline />
                  <TextInput label="Precio" value={card.price} onChange={(v) => set(["items", index, "price"], v)} maxLength={TEXT_LIMITS.price} placeholder="$115.000 por m²" />
                  <TextInput
                    label="Etiquetas"
                    value={card.chips.join(", ")}
                    onChange={(v) =>
                      set(
                        ["items", index, "chips"],
                        v.split(",").map((chip) => chip.trim()).filter(Boolean).slice(0, LIMITS.chips).map((chip) => chip.slice(0, TEXT_LIMITS.chip)),
                      )
                    }
                    maxLength={LIMITS.chips * (TEXT_LIMITS.chip + 2)}
                    placeholder="1.000 m², Escrituras, Financiación"
                    hint="Sepáralas con comas (máximo 6)."
                  />
                </>
              )}
            />
            <TextInput label="Nota al final" value={section.props.note} onChange={(v) => set(["note"], v)} maxLength={TEXT_LIMITS.note} placeholder="Los precios pueden cambiar." multiline />
          </PanelGroup>
        </>
      );

    case "steps":
      return (
        <>
          <IntroFields section={section} set={set} />
          <PanelGroup title="Puntos de la lista">
            <ListEditor
              items={section.props.items}
              max={LIMITS.steps}
              noun="punto"
              create={createStep}
              onChange={(items) => set(["items"], items)}
              renderItem={(item, index) => (
                <>
                  <TextInput label="Título" value={item.title} onChange={(v) => set(["items", index, "title"], v)} maxLength={TEXT_LIMITS.featureTitle} required />
                  <TextInput label="Descripción" value={item.description} onChange={(v) => set(["items", index, "description"], v)} maxLength={TEXT_LIMITS.featureDescription} />
                  <TextInput label="Dato a la derecha" value={item.value} onChange={(v) => set(["items", index, "value"], v)} maxLength={TEXT_LIMITS.specValue} placeholder="5 min" />
                </>
              )}
            />
          </PanelGroup>
        </>
      );

    case "contact":
      return (
        <>
          <IntroFields section={section} set={set} />
          <PanelGroup title="WhatsApp">
            <TextInput label="Nombre de quien atiende" value={section.props.contactName} onChange={(v) => set(["contactName"], v)} maxLength={TEXT_LIMITS.logoText} placeholder="Arles Castaño" />
            <div className="grid grid-cols-[5rem_1fr] gap-2">
              <TextInput label="País" value={section.props.countryCode} onChange={(v) => set(["countryCode"], v.replace(/\D/g, "").slice(0, 4))} maxLength={4} placeholder="57" />
              <TextInput label="Teléfono" value={section.props.phone} onChange={(v) => set(["phone"], v)} maxLength={TEXT_LIMITS.phone} placeholder="310 654 4931" />
            </div>
            <TextInput label="Mensaje que se escribe solo" value={section.props.whatsappMessage} onChange={(v) => set(["whatsappMessage"], v)} maxLength={TEXT_LIMITS.heroSubtitle} hint="Lo que aparecerá escrito al abrir WhatsApp." multiline />
            <TextInput label="Texto del botón" value={section.props.buttonLabel} onChange={(v) => set(["buttonLabel"], v)} maxLength={TEXT_LIMITS.buttonLabel} />
          </PanelGroup>
          <PanelGroup title="Otros contactos">
            <TextInput label="Instagram" value={section.props.instagram} onChange={(v) => set(["instagram"], v)} maxLength={TEXT_LIMITS.logoText} placeholder="@tunegocio" />
            <TextInput label="Correo" value={section.props.email} onChange={(v) => set(["email"], v.trim())} maxLength={120} placeholder="hola@tunegocio.com" />
          </PanelGroup>
        </>
      );

    default:
      return null;
  }
}
