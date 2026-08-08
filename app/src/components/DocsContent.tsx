"use client";

import type { DocBlock, DocSection } from "@/lib/docs";

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="max-w-2xl text-[15px] leading-relaxed text-mist">
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul className="max-w-2xl space-y-2 text-[15px] leading-relaxed text-mist">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 bg-copper" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="max-w-2xl space-y-2.5 text-[15px] leading-relaxed text-mist">
          {block.items.map((item, i) => (
            <li key={item} className="flex gap-3">
              <span className="font-mono text-[11px] text-copper">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="max-w-3xl overflow-x-auto border border-line/80">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line/80 bg-ink/80">
                {block.headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-[10px] font-normal uppercase tracking-[0.16em] text-copper"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr
                  key={row.join("|")}
                  className="border-b border-line/50 last:border-b-0"
                >
                  {row.map((cell, i) => (
                    <td
                      key={`${cell}-${i}`}
                      className={[
                        "px-3 py-2.5 align-top",
                        i === 0
                          ? "font-mono text-[13px] text-foam"
                          : "text-mist",
                      ].join(" ")}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <aside className="max-w-2xl border-l-2 border-copper/70 bg-ink/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-copper">
            {block.title}
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-foam/90">
            {block.text}
          </p>
        </aside>
      );
    case "formula":
      return (
        <div className="max-w-2xl border border-line/70 bg-void/60 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-mist">
            {block.label}
          </p>
          <p className="mt-1.5 font-mono text-[13px] text-gold">{block.value}</p>
        </div>
      );
    default:
      return null;
  }
}

export function DocsSectionView({ section }: { section: DocSection }) {
  return (
    <section
      id={section.id}
      className="scroll-mt-28 border-b border-line/50 py-12 last:border-b-0"
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-copper">
        {section.id.replace(/-/g, " ")}
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-tight text-foam sm:text-4xl">
        {section.title}
      </h2>
      {section.lead && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-foam/80">
          {section.lead}
        </p>
      )}
      <div className="mt-6 space-y-5">
        {section.blocks.map((block, i) => (
          <Block key={`${section.id}-${i}`} block={block} />
        ))}
      </div>
    </section>
  );
}
