"use client";

import { Play, Sparkles } from "lucide-react";

import { replayAnimation } from "@/components/page-renderer/PageElement";
import {
  ANIMATION_DELAYS,
  ENTRANCE_ANIMATIONS,
  HOVER_EFFECTS,
  LOOP_ANIMATIONS,
  type EntranceAnimation,
  type HoverEffect,
  type LoopAnimation,
} from "@/lib/page-model/animations";
import type { ElementKey } from "@/lib/page-model/elements";
import type { ElementStyle } from "@/lib/page-model/schema";

import { PanelGroup } from "./fields";

type AnimationPanelProps = {
  sectionId: string;
  keys: ElementKey[];
  style: ElementStyle;
  set: (patch: Partial<ElementStyle>) => void;
};

const selectClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900";

const CLASSIC: EntranceAnimation[] = ["fade-in", "slide-up", "slide-right", "zoom-in"];

/** Animaciones del elemento: de entrada, continua y al pasar el ratón. */
export function AnimationPanel({ sectionId, keys, style, set }: AnimationPanelProps) {
  const entrance = style.animation && style.animation !== "none" ? style.animation : undefined;

  function replay() {
    // Espera a que se aplique el cambio antes de reproducir.
    requestAnimationFrame(() => replayAnimation({ sectionId, keys }));
  }

  return (
    <PanelGroup title="Animaciones">
      <div className="flex flex-col gap-1">
        <label htmlFor="anim-entrance" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Al aparecer
        </label>
        <div className="flex gap-1.5">
          <select
            id="anim-entrance"
            value={entrance ?? ""}
            onChange={(event) => {
              set({ animation: (event.target.value || undefined) as EntranceAnimation | undefined });
              if (event.target.value) replay();
            }}
            className={selectClass}
          >
            <option value="">Ninguna</option>
            <optgroup label="Especiales">
              {(Object.keys(ENTRANCE_ANIMATIONS) as EntranceAnimation[])
                .filter((key) => !CLASSIC.includes(key))
                .map((key) => (
                  <option key={key} value={key}>
                    {ENTRANCE_ANIMATIONS[key].label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Clásicas">
              {CLASSIC.map((key) => (
                <option key={key} value={key}>
                  {ENTRANCE_ANIMATIONS[key].label}
                </option>
              ))}
            </optgroup>
          </select>
          <button
            type="button"
            onClick={replay}
            disabled={!entrance}
            aria-label="Reproducir la animación"
            title="Reproducir la animación"
            className="shrink-0 rounded-md border border-zinc-300 px-2 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Play className="size-4" aria-hidden />
          </button>
        </div>
        {entrance && <p className="text-xs text-zinc-500">{ENTRANCE_ANIMATIONS[entrance].description}</p>}
      </div>

      {entrance && (
        <div className="flex flex-col gap-1">
          <label htmlFor="anim-delay" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Retraso
          </label>
          <select
            id="anim-delay"
            value={style.animationDelay ?? 0}
            onChange={(event) => {
              const value = Number(event.target.value);
              set({ animationDelay: value || undefined });
              replay();
            }}
            className={selectClass}
          >
            {ANIMATION_DELAYS.map((ms) => (
              <option key={ms} value={ms}>
                {ms === 0 ? "Sin retraso" : `${(ms / 1000).toLocaleString("es")} s`}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">Pon retrasos distintos a varios elementos para que aparezcan uno tras otro.</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="anim-loop" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          En movimiento continuo
        </label>
        <select
          id="anim-loop"
          value={style.loop ?? ""}
          onChange={(event) => set({ loop: (event.target.value || undefined) as LoopAnimation | undefined })}
          className={selectClass}
        >
          <option value="">Ninguno</option>
          {(Object.keys(LOOP_ANIMATIONS) as LoopAnimation[]).map((key) => (
            <option key={key} value={key}>
              {LOOP_ANIMATIONS[key].label}
            </option>
          ))}
        </select>
        {style.loop && <p className="text-xs text-zinc-500">{LOOP_ANIMATIONS[style.loop].description}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="anim-hover" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Al pasar el ratón
        </label>
        <select
          id="anim-hover"
          value={style.hover ?? ""}
          onChange={(event) => set({ hover: (event.target.value || undefined) as HoverEffect | undefined })}
          className={selectClass}
        >
          <option value="">Ninguno</option>
          {(Object.keys(HOVER_EFFECTS) as HoverEffect[]).map((key) => (
            <option key={key} value={key}>
              {HOVER_EFFECTS[key].label}
            </option>
          ))}
        </select>
        {style.hover && (
          <p className="text-xs text-zinc-500">{HOVER_EFFECTS[style.hover].description} Pásale el ratón para verlo.</p>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-zinc-500">
        <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Si alguien tiene activado «reducir movimiento» en su dispositivo, la página se muestra sin animaciones.
      </p>
    </PanelGroup>
  );
}
