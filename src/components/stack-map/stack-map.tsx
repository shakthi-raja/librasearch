import { BAYS, DESK, ENTRANCE, FLOOR, READING_ROOM, rackCentre } from "./layout";

export type PinKind = "available" | "hold-shelf" | "on-loan";

export type MapPin = {
  rack: string;
  kind: PinKind;
  label: string;
  open?: boolean;
};

type Props = {
  pins?: MapPin[];
  /** Draw a walking route from the entrance to the open pin. */
  route?: boolean;
  title: string;
  /** cover fills the box and crops, contain shows the whole floor */
  fit?: "cover" | "contain";
  className?: string;
};

const { wall } = FLOOR;

// Column dots on the structural grid, the way a floor survey marks them.
const COLUMNS = Array.from({ length: 7 }, (_, i) =>
  Array.from({ length: 4 }, (_, j) => ({ x: 150 + i * 110, y: 160 + j * 110 })),
).flat();

function PinMark({ kind }: { kind: PinKind }) {
  if (kind === "available") return <circle r="6" />;
  if (kind === "hold-shelf")
    return <rect x="-5.5" y="-5.5" width="11" height="11" transform="rotate(45)" />;
  return <path d="M0 -7 L6.5 5 L-6.5 5 Z" />;
}

/**
 * A generated plan of the library floor. Pure SVG, drawn on the server, so it
 * renders without scripts and stays crisp at any size.
 */
export function StackMap({ pins = [], route = false, title, fit = "cover", className }: Props) {
  const open = pins.find((p) => p.open);
  const openAt = open ? rackCentre(open.rack) : undefined;
  const gate = { x: ENTRANCE.x + ENTRANCE.width / 2, y: wall.y + wall.h };

  return (
    <svg
      className={`stack-map ${className ?? ""}`}
      viewBox={`0 0 ${FLOOR.width} ${FLOOR.height}`}
      role="img"
      aria-label={title}
      preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
    >
      <defs>
        <pattern
          id="sm-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" className="sm-hatch-line" />
        </pattern>
        <filter id="sm-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.07" />
          </feComponentTransfer>
        </filter>
        <linearGradient id="sm-crease-v" x1="0" x2="1">
          <stop offset="0" className="sm-crease-shade" />
          <stop offset="1" className="sm-crease-lit" />
        </linearGradient>
      </defs>

      <rect className="sm-paper" width={FLOOR.width} height={FLOOR.height} />

      {COLUMNS.map((c) => (
        <circle key={`${c.x}-${c.y}`} className="sm-column" cx={c.x} cy={c.y} r="2.2" />
      ))}

      <rect
        className="sm-water"
        x={READING_ROOM.x}
        y={READING_ROOM.y}
        width={READING_ROOM.w}
        height={READING_ROOM.h}
        rx="18"
      />
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative set
          key={i}
          className="sm-table"
          cx={READING_ROOM.x + 46 + (i % 4) * 70}
          cy={READING_ROOM.y + 44 + Math.floor(i / 4) * 54}
          r="13"
        />
      ))}
      <text className="sm-place" x={READING_ROOM.x + 16} y={READING_ROOM.y + READING_ROOM.h - 14}>
        Reading room
      </text>

      {BAYS.map((bay) => {
        const first = bay.racks[0];
        const last = bay.racks.at(-1);
        if (!first || !last) return null;
        return (
          <g key={bay.id}>
            {bay.reserve ? (
              <rect
                className="sm-reserve"
                x={first.x - 14}
                y={first.y - 30}
                width={first.w + 28}
                height={last.y + last.h - first.y + 44}
                rx="6"
              />
            ) : null}
            <text className="sm-place" x={first.x} y={first.y - 12}>
              {bay.label}
            </text>
            {bay.racks.map((rack) => (
              <g key={rack.code}>
                <rect className="sm-rack" x={rack.x} y={rack.y} width={rack.w} height={rack.h} />
                <text className="sm-rack-code" x={rack.x + 6} y={rack.y + rack.h - 3.5}>
                  {rack.code}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      <rect className="sm-desk" x={DESK.x} y={DESK.y} width={DESK.w} height={DESK.h} rx="4" />
      <text className="sm-place" x={DESK.x + 10} y={DESK.y + 18}>
        Issue desk
      </text>

      <path
        className="sm-wall"
        d={`M${ENTRANCE.x} ${wall.y + wall.h} H${wall.x} V${wall.y} H${wall.x + wall.w} V${wall.y + wall.h} H${ENTRANCE.x + ENTRANCE.width}`}
      />
      <path className="sm-gate" d={`M${ENTRANCE.x} ${gate.y} L${ENTRANCE.x + 26} ${gate.y - 22}`} />
      <text className="sm-place" x={ENTRANCE.x - 6} y={gate.y + 24}>
        Entrance
      </text>

      {route && openAt ? (
        <path
          className="sm-route"
          d={`M${gate.x} ${gate.y - 6} V${READING_ROOM.y - 34} H${openAt.x + 34} V${openAt.y} H${openAt.x + 10}`}
        />
      ) : null}

      <rect
        className="sm-grain"
        width={FLOOR.width}
        height={FLOOR.height}
        filter="url(#sm-grain)"
      />
      <rect
        className="sm-crease"
        x={FLOOR.width * 0.62}
        y="0"
        width="3"
        height={FLOOR.height}
        fill="url(#sm-crease-v)"
      />
      <rect className="sm-crease" x="0" y={FLOOR.height * 0.48} width={FLOOR.width} height="2" />

      {pins.map((pin, i) => {
        const at = rackCentre(pin.rack);
        if (!at) return null;
        return (
          <g
            key={pin.rack}
            className={`sm-pin sm-pin-${pin.kind}${pin.open ? " sm-pin-open" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
            transform={`translate(${at.x + 14} ${at.y})`}
          >
            <g className="sm-pin-mark">
              <PinMark kind={pin.kind} />
            </g>
            <g transform="translate(12 -11)">
              <rect className="sm-tag" width={pin.label.length * 7.4 + 16} height="22" rx="4" />
              <text className="sm-tag-text" x="8" y="15">
                {pin.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
