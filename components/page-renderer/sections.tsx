import { TEXT_LIMITS, type Alignment, type SectionOfType, type SectionType } from "@/lib/page-model/schema";

import { ShowWhenFilledOrEditing } from "./edit-context";
import { EditableText } from "./EditableText";
import { buttonStyle, imageStyle, textStyle } from "./element-style";
import { ElementsContainer, PageElement } from "./PageElement";
import { PageLink } from "./PageLink";
import { SectionShell } from "./SectionShell";

const heading = "font-(family-name:--page-font-heading) font-bold tracking-tight";
const muted = "text-(--page-muted)";

type Props<T extends SectionType> = { section: SectionOfType<T> };

const TEXT_ALIGN: Record<Alignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const FLEX_ALIGN: Record<Alignment, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};

export function HeaderSection({ section }: Props<"header">) {
  const { logoText, links } = section.props;
  const styles = section.styles;
  return (
    <SectionShell id={section.id} background={section.background} className="py-5">
      <nav className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <EditableText
          sectionId={section.id}
          elementKey="logo"
          path={["logoText"]}
          value={logoText}
          className={`${heading} text-xl`}
          style={textStyle(styles?.logo)}
          maxLength={TEXT_LIMITS.logoText}
          placeholder="Nombre del sitio"
          required
        />
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {links.map((link, index) => (
              <li key={link.id}>
                <PageLink href={link.href} className="hover:text-(--page-primary)">
                  <EditableText
                    sectionId={section.id}
                    elementKey="links"
                    path={["links", index, "label"]}
                    value={link.label}
                    style={textStyle(styles?.links)}
                    maxLength={TEXT_LIMITS.linkLabel}
                    placeholder="Enlace"
                    required
                  />
                </PageLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </SectionShell>
  );
}

export function HeroSection({ section }: Props<"hero">) {
  const { title, subtitle, buttonLabel, buttonHref, imageUrl, align } = section.props;
  const styles = section.styles;
  const hasImage = Boolean(imageUrl);
  // Con imagen a un lado: dos columnas (texto | imagen). Si no, una columna.
  const sideBySide = hasImage && align !== "center";
  const flow = sideBySide ? "grid" : "flex";
  const textColumn = sideBySide ? (align === "right" ? "@3xl:col-start-2" : "@3xl:col-start-1") : "";

  const containerClass = sideBySide
    ? `grid items-center gap-x-10 gap-y-5 @3xl:grid-cols-2 ${TEXT_ALIGN[align]} ${align === "right" ? "justify-items-end" : "justify-items-start"}`
    : `flex flex-col gap-5 ${TEXT_ALIGN[align]} ${FLEX_ALIGN[align]} ${
        align === "center" ? "mx-auto max-w-2xl" : align === "right" ? "ml-auto max-w-2xl" : "max-w-2xl"
      }`;

  return (
    <SectionShell id={section.id} background={section.background}>
      <ElementsContainer section={section} className={containerClass}>
        <PageElement section={section} elementKey="title" flow={flow} className={textColumn}>
          <EditableText
            sectionId={section.id}
            elementKey="title"
            path={["title"]}
            value={title}
            as="h1"
            className={`${heading} block text-4xl leading-tight @3xl:text-5xl`}
            style={textStyle(styles?.title)}
            maxLength={TEXT_LIMITS.heroTitle}
            placeholder="Título principal"
            required
          />
        </PageElement>
        <ShowWhenFilledOrEditing value={subtitle}>
          <PageElement section={section} elementKey="subtitle" flow={flow} className={textColumn}>
            <EditableText
              sectionId={section.id}
              elementKey="subtitle"
              path={["subtitle"]}
              value={subtitle}
              as="p"
              className={`${muted} block text-lg leading-relaxed`}
              style={textStyle(styles?.subtitle)}
              maxLength={TEXT_LIMITS.heroSubtitle}
              placeholder="Añade un subtítulo"
            />
          </PageElement>
        </ShowWhenFilledOrEditing>
        {/* Sin texto no hay botón en la página publicada; en el editor se muestra para poder escribirlo. */}
        <ShowWhenFilledOrEditing value={buttonLabel}>
          <PageElement section={section} elementKey="button" flow={flow} className={textColumn}>
            <PageLink
              href={buttonHref || "#"}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-(--page-primary) px-6 py-2 font-semibold text-(--page-on-primary) transition-opacity hover:opacity-90"
              style={buttonStyle(styles?.button)}
            >
              <EditableText
                sectionId={section.id}
                elementKey="button"
                path={["buttonLabel"]}
                value={buttonLabel}
                maxLength={TEXT_LIMITS.buttonLabel}
                placeholder="Texto del botón"
              />
            </PageLink>
          </PageElement>
        </ShowWhenFilledOrEditing>
        {hasImage && (
          <PageElement
            section={section}
            elementKey="image"
            flow={flow}
            className={
              sideBySide
                ? `w-full @3xl:row-span-3 @3xl:row-start-1 ${align === "right" ? "@3xl:col-start-1" : "@3xl:col-start-2"}`
                : "w-full"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias del usuario; next/image exige dominios fijos. */}
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className={`w-full rounded-2xl object-cover ${
                align === "center" ? "mx-auto max-h-[28rem] max-w-3xl" : "max-h-[32rem]"
              }`}
              style={imageStyle(styles?.image)}
            />
          </PageElement>
        )}
      </ElementsContainer>
    </SectionShell>
  );
}

export function TextSection({ section }: Props<"text">) {
  const { title, body, align } = section.props;
  const styles = section.styles;
  return (
    <SectionShell id={section.id} background={section.background}>
      <ElementsContainer
        section={section}
        className={`mx-auto flex max-w-3xl flex-col gap-4 ${TEXT_ALIGN[align]} ${FLEX_ALIGN[align]}`}
      >
        <ShowWhenFilledOrEditing value={title}>
          <PageElement section={section} elementKey="title">
            <EditableText
              sectionId={section.id}
              elementKey="title"
              path={["title"]}
              value={title}
              as="h2"
              className={`${heading} block text-3xl`}
              style={textStyle(styles?.title)}
              maxLength={TEXT_LIMITS.sectionTitle}
              placeholder="Título"
            />
          </PageElement>
        </ShowWhenFilledOrEditing>
        <ShowWhenFilledOrEditing value={body}>
          <PageElement section={section} elementKey="body" className="w-full">
            <EditableText
              sectionId={section.id}
              elementKey="body"
              path={["body"]}
              value={body}
              as="p"
              className="block w-full whitespace-pre-line text-lg leading-relaxed"
              style={textStyle(styles?.body)}
              maxLength={TEXT_LIMITS.body}
              placeholder="Escribe aquí tu texto"
              multiline
            />
          </PageElement>
        </ShowWhenFilledOrEditing>
      </ElementsContainer>
    </SectionShell>
  );
}

export function ImageSection({ section }: Props<"image">) {
  const { src, alt, caption } = section.props;
  const styles = section.styles;
  return (
    <SectionShell id={section.id} background={section.background}>
      <ElementsContainer section={section} className="flex flex-col items-center gap-3">
        <PageElement section={section} elementKey="image" className="w-full">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias del usuario; next/image exige dominios fijos.
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="max-h-[36rem] w-full rounded-2xl object-cover"
              style={imageStyle(styles?.image)}
            />
          ) : (
            <div
              className={`${muted} flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-current text-sm`}
            >
              Sin imagen
            </div>
          )}
        </PageElement>
        <ShowWhenFilledOrEditing value={caption}>
          <PageElement section={section} elementKey="caption">
            <EditableText
              sectionId={section.id}
              elementKey="caption"
              path={["caption"]}
              value={caption}
              as="p"
              className={`${muted} block text-center text-sm`}
              style={textStyle(styles?.caption)}
              maxLength={TEXT_LIMITS.caption}
              placeholder="Pie de foto (opcional)"
            />
          </PageElement>
        </ShowWhenFilledOrEditing>
      </ElementsContainer>
    </SectionShell>
  );
}

export function FeaturesSection({ section }: Props<"features">) {
  const { title, items } = section.props;
  const styles = section.styles;
  return (
    <SectionShell id={section.id} background={section.background}>
      <div className="flex flex-col gap-10">
        <EditableText
          sectionId={section.id}
          elementKey="title"
          path={["title"]}
          value={title}
          as="h2"
          className={`${heading} text-center text-3xl`}
          style={textStyle(styles?.title)}
          maxLength={TEXT_LIMITS.sectionTitle}
          placeholder="Título de la sección"
        />
        {items.length > 0 && (
          <ul className="grid gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-(--page-muted)/25 p-6"
              >
                <span className="h-1.5 w-10 rounded-full bg-(--page-primary)" aria-hidden />
                <EditableText
                  sectionId={section.id}
                  elementKey="itemTitle"
                  path={["items", index, "title"]}
                  value={item.title}
                  as="h3"
                  className={`${heading} text-xl`}
                  style={textStyle(styles?.itemTitle)}
                  maxLength={TEXT_LIMITS.featureTitle}
                  placeholder="Título"
                  required
                />
                <EditableText
                  sectionId={section.id}
                  elementKey="itemDescription"
                  path={["items", index, "description"]}
                  value={item.description}
                  as="p"
                  className={`${muted} leading-relaxed`}
                  style={textStyle(styles?.itemDescription)}
                  maxLength={TEXT_LIMITS.featureDescription}
                  placeholder="Descripción"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionShell>
  );
}

export function FooterSection({ section }: Props<"footer">) {
  const { text, links } = section.props;
  const styles = section.styles;
  return (
    <SectionShell id={section.id} background={section.background} className="py-10">
      <div
        className={`${muted} flex flex-col items-center justify-between gap-4 border-t border-(--page-muted)/25 pt-8 text-sm @2xl:flex-row`}
      >
        <EditableText
          sectionId={section.id}
          elementKey="text"
          path={["text"]}
          value={text}
          as="p"
          style={textStyle(styles?.text)}
          maxLength={TEXT_LIMITS.footerText}
          placeholder="Texto del pie de página"
        />
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((link, index) => (
              <li key={link.id}>
                <PageLink href={link.href} className="hover:text-(--page-text)">
                  <EditableText
                    sectionId={section.id}
                    elementKey="links"
                    path={["links", index, "label"]}
                    value={link.label}
                    style={textStyle(styles?.links)}
                    maxLength={TEXT_LIMITS.linkLabel}
                    placeholder="Enlace"
                    required
                  />
                </PageLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionShell>
  );
}
