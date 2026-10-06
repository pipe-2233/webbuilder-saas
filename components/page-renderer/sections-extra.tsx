import { AtSign, Mail } from "lucide-react";
import type { CSSProperties } from "react";

import { TEXT_LIMITS, type SectionOfType, type SectionType } from "@/lib/page-model/schema";

import { ShowWhenFilledOrEditing } from "./edit-context";
import { EditableText } from "./EditableText";
import { buttonStyle, imageStyle, textStyle } from "./element-style";
import { ButtonIconView } from "./icons";
import { CopyButton, CountUp } from "./interactive";
import { ElementsContainer, PageElement } from "./PageElement";
import { PageLink } from "./PageLink";
import { SectionShell } from "./SectionShell";

/*
 * Secciones para páginas comerciales: cifras, destacado, tarjetas, lista y
 * contacto. Siguen el mismo patrón que las demás: textos editables sobre la
 * página, elementos con estilo/animación y posición libre en escritorio.
 */

const heading = "font-(family-name:--page-font-heading) font-bold tracking-tight";
const muted = "text-(--page-muted)";
const eyebrowClass =
  "inline-flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-(--page-primary) uppercase before:h-px before:w-8 before:shrink-0 before:bg-current";
const cardClass = "rounded-2xl border border-(--page-muted)/20 bg-(--page-text)/[0.03]";
const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-(--page-primary) px-6 py-2 font-semibold text-(--page-on-primary) transition-opacity hover:opacity-90";

type Props<T extends SectionType> = { section: SectionOfType<T> };
type IntroSection = SectionOfType<"showcase" | "cards" | "steps" | "contact">;

/** Antetítulo, título y descripción (cada uno es un elemento movible). */
function Intro({ section, center = false }: { section: IntroSection; center?: boolean }) {
  const { eyebrow, title, subtitle } = section.props;
  const styles = section.styles;
  return (
    <>
      <ShowWhenFilledOrEditing value={eyebrow}>
        <PageElement section={section} elementKey="eyebrow">
          <p className={`${eyebrowClass} ${center ? "justify-center" : ""}`}>
            <EditableText
              sectionId={section.id}
              elementKey="eyebrow"
              path={["eyebrow"]}
              value={eyebrow}
              style={textStyle(styles?.eyebrow)}
              maxLength={TEXT_LIMITS.eyebrow}
              placeholder="Antetítulo (opcional)"
            />
          </p>
        </PageElement>
      </ShowWhenFilledOrEditing>
      <ShowWhenFilledOrEditing value={title}>
        <PageElement section={section} elementKey="title">
          <EditableText
            sectionId={section.id}
            elementKey="title"
            path={["title"]}
            value={title}
            as="h2"
            className={`${heading} block text-3xl leading-tight @3xl:text-4xl`}
            style={textStyle(styles?.title)}
            maxLength={TEXT_LIMITS.sectionTitle}
            placeholder="Título"
          />
        </PageElement>
      </ShowWhenFilledOrEditing>
      <ShowWhenFilledOrEditing value={subtitle}>
        <PageElement section={section} elementKey="subtitle">
          <EditableText
            sectionId={section.id}
            elementKey="subtitle"
            path={["subtitle"]}
            value={subtitle}
            as="p"
            className={`${muted} block max-w-2xl text-lg leading-relaxed`}
            style={textStyle(styles?.subtitle)}
            maxLength={TEXT_LIMITS.heroSubtitle}
            placeholder="Descripción (opcional)"
            multiline
          />
        </PageElement>
      </ShowWhenFilledOrEditing>
    </>
  );
}

export function StatsSection({ section }: Props<"stats">) {
  const { items } = section.props;
  return (
    <SectionShell section={section} className="py-10 @3xl:py-14">
      <ElementsContainer section={section} className="flex flex-col">
        <PageElement section={section} elementKey="items" className="w-full">
          <ul className="grid grid-cols-2 gap-6 @3xl:grid-cols-(--stat-cols)" style={{ "--stat-cols": `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` } as CSSProperties}>
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-1 border-l-2 border-(--page-primary) pl-4">
                <p className={`${heading} text-3xl text-(--page-primary) @3xl:text-4xl`}>
                  <CountUp value={item.value} />
                  {item.suffix && <span className="ml-1">{item.suffix}</span>}
                </p>
                <EditableText
                  sectionId={section.id}
                  path={["items", index, "label"]}
                  value={item.label}
                  as="p"
                  className="block font-semibold"
                  maxLength={TEXT_LIMITS.statLabel}
                  placeholder="Qué significa"
                />
                <EditableText
                  sectionId={section.id}
                  path={["items", index, "detail"]}
                  value={item.detail}
                  as="p"
                  className={`${muted} block text-sm`}
                  maxLength={TEXT_LIMITS.statLabel}
                  placeholder="Detalle (opcional)"
                />
              </li>
            ))}
          </ul>
        </PageElement>
      </ElementsContainer>
    </SectionShell>
  );
}

export function ShowcaseSection({ section }: Props<"showcase">) {
  const { imageUrl, imageSide, specsTitle, specs, buttonLabel, buttonHref, buttonIcon } = section.props;
  const styles = section.styles;
  const textCol = imageSide === "left" ? "@3xl:col-start-2" : "@3xl:col-start-1";
  const imageCol = imageSide === "left" ? "@3xl:col-start-1" : "@3xl:col-start-2";

  return (
    <SectionShell section={section}>
      <ElementsContainer section={section} className="grid items-start gap-x-12 gap-y-5 @3xl:grid-cols-2">
        <PageElement section={section} elementKey="image" flow="grid" className={`w-full @3xl:row-span-5 @3xl:row-start-1 ${imageCol}`}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias del usuario.
            <img src={imageUrl} alt="" draggable={false} className="aspect-[4/5] w-full rounded-3xl object-cover" style={imageStyle(styles?.image)} />
          ) : (
            <div className={`${muted} flex aspect-[4/5] w-full items-center justify-center rounded-3xl border-2 border-dashed border-current text-sm`}>
              Sin imagen
            </div>
          )}
        </PageElement>
        <IntroColumn section={section} col={textCol} />
        {specs.length > 0 && (
          <PageElement section={section} elementKey="items" flow="grid" className={`w-full ${textCol}`}>
            <div className={`${cardClass} p-6`}>
              {specsTitle && <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-(--page-primary) uppercase">{specsTitle}</p>}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {specs.map((spec, index) => (
                  <div key={spec.id} className="flex flex-col gap-0.5">
                    <EditableText sectionId={section.id} path={["specs", index, "label"]} value={spec.label} as="span" className={`${muted} block text-sm`} maxLength={TEXT_LIMITS.specLabel} placeholder="Dato" required />
                    <EditableText sectionId={section.id} path={["specs", index, "value"]} value={spec.value} as="span" className="block font-semibold" maxLength={TEXT_LIMITS.specValue} placeholder="Valor" />
                  </div>
                ))}
              </dl>
            </div>
          </PageElement>
        )}
        <ShowWhenFilledOrEditing value={buttonLabel}>
          <PageElement section={section} elementKey="button" flow="grid" className={textCol}>
            <PageLink href={buttonHref || "#"} className={primaryButton} style={buttonStyle(styles?.button)}>
              <ButtonIconView icon={buttonIcon} />
              <EditableText sectionId={section.id} elementKey="button" path={["buttonLabel"]} value={buttonLabel} maxLength={TEXT_LIMITS.buttonLabel} placeholder="Texto del botón" />
            </PageLink>
          </PageElement>
        </ShowWhenFilledOrEditing>
      </ElementsContainer>
    </SectionShell>
  );
}

/** Intro en la columna de texto de la sección destacada (cada elemento en la columna indicada). */
function IntroColumn({ section, col }: { section: SectionOfType<"showcase">; col: string }) {
  const { eyebrow, title, subtitle } = section.props;
  const styles = section.styles;
  return (
    <>
      <ShowWhenFilledOrEditing value={eyebrow}>
        <PageElement section={section} elementKey="eyebrow" flow="grid" className={col}>
          <p className={eyebrowClass}>
            <EditableText sectionId={section.id} elementKey="eyebrow" path={["eyebrow"]} value={eyebrow} style={textStyle(styles?.eyebrow)} maxLength={TEXT_LIMITS.eyebrow} placeholder="Antetítulo (opcional)" />
          </p>
        </PageElement>
      </ShowWhenFilledOrEditing>
      <PageElement section={section} elementKey="title" flow="grid" className={col}>
        <EditableText sectionId={section.id} elementKey="title" path={["title"]} value={title} as="h2" className={`${heading} block text-3xl leading-tight @3xl:text-4xl`} style={textStyle(styles?.title)} maxLength={TEXT_LIMITS.sectionTitle} placeholder="Título" />
      </PageElement>
      <ShowWhenFilledOrEditing value={subtitle}>
        <PageElement section={section} elementKey="subtitle" flow="grid" className={col}>
          <EditableText sectionId={section.id} elementKey="subtitle" path={["subtitle"]} value={subtitle} as="p" className={`${muted} block text-lg leading-relaxed`} style={textStyle(styles?.subtitle)} maxLength={TEXT_LIMITS.heroSubtitle} placeholder="Descripción" multiline />
        </PageElement>
      </ShowWhenFilledOrEditing>
    </>
  );
}

export function CardsSection({ section }: Props<"cards">) {
  const { items, note } = section.props;
  return (
    <SectionShell section={section}>
      <ElementsContainer section={section} className="flex flex-col gap-4">
        <Intro section={section} />
        <PageElement section={section} elementKey="items" className="mt-6 w-full">
          <ul className="grid gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {items.map((item, index) => (
              <li key={item.id} className={`${cardClass} flex flex-col overflow-hidden`}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias del usuario.
                  <img src={item.imageUrl} alt="" draggable={false} className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="aspect-[4/3] w-full bg-(--page-primary)/15" aria-hidden />
                )}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <EditableText sectionId={section.id} path={["items", index, "tag"]} value={item.tag} as="span" className="block text-xs font-semibold tracking-wider text-(--page-primary) uppercase" maxLength={TEXT_LIMITS.chip * 2} placeholder="Zona o categoría" />
                  <EditableText sectionId={section.id} path={["items", index, "title"]} value={item.title} as="h3" className={`${heading} block text-xl`} maxLength={TEXT_LIMITS.featureTitle} placeholder="Título" required />
                  <EditableText sectionId={section.id} path={["items", index, "description"]} value={item.description} as="p" className={`${muted} block text-sm leading-relaxed`} maxLength={TEXT_LIMITS.featureDescription} placeholder="Descripción" multiline />
                  <EditableText sectionId={section.id} path={["items", index, "price"]} value={item.price} as="p" className="mt-auto block pt-2 text-lg font-bold text-(--page-primary)" maxLength={TEXT_LIMITS.price} placeholder="Precio" />
                  {item.chips.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 pt-1">
                      {item.chips.map((chip, chipIndex) => (
                        <li key={chipIndex} className="rounded-full bg-(--page-text)/[0.06] px-2.5 py-1 text-xs font-medium">
                          {chip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {note && <p className={`${muted} mt-6 text-sm`}>{note}</p>}
        </PageElement>
      </ElementsContainer>
    </SectionShell>
  );
}

export function StepsSection({ section }: Props<"steps">) {
  const { items } = section.props;
  return (
    <SectionShell section={section}>
      <ElementsContainer section={section} className="flex flex-col gap-4">
        <Intro section={section} />
        <PageElement section={section} elementKey="items" className="mt-6 w-full">
          <ol className="relative flex flex-col gap-3 before:absolute before:top-4 before:bottom-4 before:left-[0.6875rem] before:w-0.5 before:bg-(--page-primary)/30">
            {items.map((item, index) => (
              <li key={item.id} className={`${cardClass} relative ml-8 flex items-center justify-between gap-4 p-4`}>
                <span className="absolute top-1/2 -left-8 size-6 -translate-y-1/2 rounded-full border-4 border-(--page-bg) bg-(--page-primary)" aria-hidden />
                <div className="flex min-w-0 flex-col">
                  <EditableText sectionId={section.id} path={["items", index, "title"]} value={item.title} as="span" className="block font-semibold" maxLength={TEXT_LIMITS.featureTitle} placeholder="Título" required />
                  <EditableText sectionId={section.id} path={["items", index, "description"]} value={item.description} as="span" className={`${muted} block text-sm`} maxLength={TEXT_LIMITS.featureDescription} placeholder="Descripción" />
                </div>
                <EditableText sectionId={section.id} path={["items", index, "value"]} value={item.value} as="span" className="block shrink-0 font-bold text-(--page-primary)" maxLength={TEXT_LIMITS.specValue} placeholder="Dato" />
              </li>
            ))}
          </ol>
        </PageElement>
      </ElementsContainer>
    </SectionShell>
  );
}

/** Enlace de WhatsApp con el número completo y el mensaje inicial. */
export function whatsappLink(countryCode: string, phone: string, message: string): string {
  const digits = `${countryCode}${phone}`.replace(/\D/g, "");
  const text = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function ContactSection({ section }: Props<"contact">) {
  const { contactName, phone, countryCode, whatsappMessage, buttonLabel, instagram, email } = section.props;
  const styles = section.styles;
  const handle = instagram.replace(/^@/, "").trim();

  return (
    <SectionShell section={section}>
      <ElementsContainer section={section} className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <Intro section={section} center />
        <PageElement section={section} elementKey="button" className="mt-6 w-full">
          <div className={`${cardClass} flex flex-col items-center gap-4 p-6`}>
            {(contactName || phone) && (
              <div>
                {contactName && <p className={`${muted} text-sm`}>WhatsApp · {contactName}</p>}
                {phone && <p className={`${heading} text-3xl`}>{phone}</p>}
              </div>
            )}
            <div className="flex w-full flex-col gap-3 @2xl:flex-row @2xl:justify-center">
              {phone && (
                <PageLink href={whatsappLink(countryCode, phone, whatsappMessage)} className={primaryButton} style={buttonStyle(styles?.button)}>
                  <ButtonIconView icon="whatsapp" />
                  <EditableText sectionId={section.id} elementKey="button" path={["buttonLabel"]} value={buttonLabel} maxLength={TEXT_LIMITS.buttonLabel} placeholder="Escribir por WhatsApp" />
                </PageLink>
              )}
              {phone && (
                <CopyButton
                  text={`+${countryCode} ${phone}`.trim()}
                  label="Copiar número"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-current px-6 py-2 font-semibold"
                />
              )}
            </div>
            {!phone && <p className={`${muted} text-sm`}>Añade un teléfono en el panel para mostrar el botón de WhatsApp.</p>}
            {(handle || email) && (
              <div className={`${muted} flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm`}>
                {handle && (
                  <PageLink href={`https://instagram.com/${encodeURIComponent(handle)}`} className="inline-flex items-center gap-1.5 hover:text-(--page-primary)">
                    <AtSign className="size-4" aria-hidden />
                    Instagram: @{handle}
                  </PageLink>
                )}
                {email && (
                  <PageLink href={`mailto:${email}`} className="inline-flex items-center gap-1.5 hover:text-(--page-primary)">
                    <Mail className="size-4" aria-hidden />
                    {email}
                  </PageLink>
                )}
              </div>
            )}
          </div>
        </PageElement>
      </ElementsContainer>
    </SectionShell>
  );
}
