import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Line,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

const COLOURS = {
  ink: "#070a10",
  ground: "#0a0e14",
  structure: "#202b33",
  structureEdge: "#4e646e",
  glass: "#233640",
  mint: "#49e2b1",
  cyan: "#53b9d8",
  amber: "#ffb23e",
  red: "#ff5570",
  violet: "#9d84ff",
  white: "#d9ebe5",
  muted: "#5b746c",
};

const FLOOR_DEFS = [
  { id: "G", name: "Event floor", baseY: 1.1, radius: 10.6, tint: "#25343b" },
  { id: "L1", name: "Concourse", baseY: 3.65, radius: 10.15, tint: "#293941" },
  { id: "L2", name: "Hospitality", baseY: 6.2, radius: 9.55, tint: "#2d3e46" },
  { id: "L3", name: "Operations", baseY: 8.75, radius: 8.8, tint: "#31434b" },
];

const PEOPLE = [
  { id: "nia", label: "Nia Patel", floor: "L2", position: [-6.2, 0.55, 1.4], colour: COLOURS.amber },
  { id: "cal", label: "Cal Ellis", floor: "G", position: [3.9, 0.55, -4.1], colour: COLOURS.mint },
  { id: "guard-12", label: "Guard 12", floor: "L1", position: [4.8, 0.55, 2.2], colour: COLOURS.cyan },
  { id: "guard-05", label: "Guard 05", floor: "L2", position: [-2.1, 0.55, -4.5], colour: COLOURS.mint },
  { id: "medic-2", label: "Medic 2", floor: "G", position: [-4.4, 0.55, -3.1], colour: COLOURS.white },
];

const INCIDENTS = [
  { id: "medical-north", label: "Medical · North gate", floor: "G", position: [-3.1, 0.7, -5.35], severity: "critical" },
  { id: "welfare-b", label: "Welfare check · Corridor B", floor: "L1", position: [-6.05, 0.7, 1.8], severity: "warning" },
];

const TEAMS = [
  { id: "team-alpha", label: "Team Alpha", position: [-15.7, 0.5, -6.8], colour: COLOURS.mint },
  { id: "team-bravo", label: "Team Bravo", position: [14.7, 0.5, 7.4], colour: COLOURS.cyan },
  { id: "team-charlie", label: "Team Charlie", position: [-12.8, 0.5, 11.6], colour: COLOURS.amber },
];

const ROUTES = [
  {
    id: "route-medical",
    colour: COLOURS.mint,
    points: [
      [-15.7, 0.22, -6.8],
      [-11.4, 0.23, -5.7],
      [-8.3, 0.24, -5.2],
      [-5.8, 0.25, -5.3],
      [-3.1, 1.88, -5.35],
    ],
  },
  {
    id: "trail-nia",
    colour: "#7aa2ff",
    dashed: true,
    points: [
      [-1.6, 6.77, 5.8],
      [-2.8, 6.77, 4.4],
      [-4.2, 6.77, 3.2],
      [-5.1, 6.77, 2.4],
      [-6.2, 6.77, 1.4],
    ],
  },
  {
    id: "route-evac",
    colour: COLOURS.cyan,
    points: [
      [6.7, 1.38, 2.3],
      [8.8, 1.22, 3.1],
      [11.9, 0.24, 5.7],
      [16.8, 0.24, 8.9],
      [21.2, 0.24, 10.4],
    ],
  },
];

const INVESTIGATION_PEOPLE = [
  { id: "nia", label: "Nia Patel", position: [4.8, 0.55, 1.15], colour: "#7aa2ff" },
  { id: "cal", label: "Cal Ellis", position: [-5.6, 0.55, 5.3], colour: COLOURS.mint },
  { id: "maya", label: "Maya Chen", position: [7.7, 0.55, -4.7], colour: COLOURS.mint },
  { id: "guard-12", label: "Guard 12", position: [10.4, 0.55, 4.9], colour: COLOURS.muted },
];

function InvestigationPlan({ layers, selected, onSelect }) {
  const selectedId = selectionId(selected);
  const upperRooms = [
    [-10.4, -5.9, 4.7, 4.3], [-5.25, -5.9, 4.7, 4.3], [0.05, -5.9, 5.1, 4.3],
    [5.45, -5.9, 4.8, 4.3], [10.55, -5.9, 4.7, 4.3],
  ];
  const lowerRooms = [
    [-10.5, 5.6, 4.5, 4.6], [-5.25, 5.6, 4.7, 4.6], [0.1, 5.6, 5.15, 4.6],
    [5.55, 5.6, 4.85, 4.6], [10.6, 5.6, 4.5, 4.6],
  ];
  const doors = [-10.3, -5.3, 0, 5.4, 10.4];
  const searchAreas = [
    { id: "sector-a", position: [5.3, 0.24, -2.2], size: [7.7, 0.08, 3.9] },
    { id: "sector-b", position: [9.3, 0.24, 3.3], size: [4.4, 0.08, 3.2] },
  ];
  const trail = [
    [-10.7, 0.53, 0.5],
    [-6.7, 0.53, 0.2],
    [-2.9, 0.53, 0.15],
    [0.8, 0.53, 0.5],
    [4.8, 0.53, 1.15],
  ];

  return (
    <group position={[0, 0.45, 0]}>
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[27, 0.36, 17.5]} />
        <meshStandardMaterial color="#1c2830" roughness={0.84} metalness={0.14} />
      </mesh>
      <mesh receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[25.7, 0.12, 4.8]} />
        <meshStandardMaterial color="#26363d" roughness={0.9} />
      </mesh>

      {[...upperRooms, ...lowerRooms].map(([x, z, w, d], index) => (
        <group
          key={`${x}-${z}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.({ type: "space", id: `room-${index + 1}`, name: index < 5 ? "Operations room" : "Service room" });
          }}
        >
          <mesh position={[x, 0.72, z]} castShadow receiveShadow>
            <boxGeometry args={[w, 1.1, d]} />
            <meshStandardMaterial
              color={selectedId === `room-${index + 1}` ? "#315c56" : "#2a3a42"}
              roughness={0.62}
              metalness={0.13}
            />
          </mesh>
          <mesh position={[x, 1.31, z]} castShadow>
            <boxGeometry args={[w + 0.05, 0.08, d + 0.05]} />
            <meshStandardMaterial color="#52656d" roughness={0.52} />
          </mesh>
          {[-0.28, 0.28].map((offset) => (
            <mesh key={offset} position={[x + offset * w, 1.34, z]} castShadow>
              <boxGeometry args={[0.05, 0.6, d * 0.82]} />
              <meshBasicMaterial color="#5f7b72" transparent opacity={0.22} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[-13.05, 1.05, 0]} castShadow>
        <boxGeometry args={[0.34, 1.9, 17.5]} />
        <meshStandardMaterial color="#52636b" />
      </mesh>
      <mesh position={[13.05, 1.05, 0]} castShadow>
        <boxGeometry args={[0.34, 1.9, 17.5]} />
        <meshStandardMaterial color="#52636b" />
      </mesh>

      {doors.flatMap((x) => [
        <mesh key={`${x}-n`} position={[x, 0.78, -2.73]}>
          <boxGeometry args={[0.14, 1.05, 0.42]} />
          <meshStandardMaterial color={COLOURS.mint} emissive={COLOURS.mint} emissiveIntensity={1.1} />
        </mesh>,
        <mesh key={`${x}-s`} position={[x, 0.78, 2.73]}>
          <boxGeometry args={[0.14, 1.05, 0.42]} />
          <meshStandardMaterial color={COLOURS.mint} emissive={COLOURS.mint} emissiveIntensity={1.1} />
        </mesh>,
      ])}

      {layerIsEnabled(layers, "search") && searchAreas.map((area) => (
        <group
          key={area.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.({ type: "search-sector", id: area.id, label: area.id === "sector-a" ? "Search Sector A" : "Search Sector B" });
          }}
        >
          <mesh position={area.position}>
            <boxGeometry args={area.size} />
            <meshBasicMaterial color={COLOURS.amber} transparent opacity={selectedId === area.id ? 0.3 : 0.16} depthWrite={false} />
          </mesh>
          <Line
            points={[
              [area.position[0] - area.size[0] / 2, 0.31, area.position[2] - area.size[2] / 2],
              [area.position[0] + area.size[0] / 2, 0.31, area.position[2] - area.size[2] / 2],
              [area.position[0] + area.size[0] / 2, 0.31, area.position[2] + area.size[2] / 2],
              [area.position[0] - area.size[0] / 2, 0.31, area.position[2] + area.size[2] / 2],
              [area.position[0] - area.size[0] / 2, 0.31, area.position[2] - area.size[2] / 2],
            ]}
            color={COLOURS.amber}
            lineWidth={1.4}
            transparent
            opacity={0.8}
          />
        </group>
      ))}

      {layerIsEnabled(layers, "routes") && (
        <>
          <Line points={trail} color="#7aa2ff" lineWidth={3} dashed dashSize={0.35} gapSize={0.24} toneMapped={false} />
          <Line
            points={[[-5.6, 0.54, 5.3], [-5.6, 0.54, 2.3], [-1.5, 0.54, 1.2], [4.8, 0.54, 1.15]]}
            color={COLOURS.mint}
            lineWidth={2.4}
            dashed
            dashSize={0.35}
            gapSize={0.22}
            toneMapped={false}
          />
        </>
      )}

      {layerIsEnabled(layers, "people") && INVESTIGATION_PEOPLE.map((item) => (
        <PersonMarker
          key={item.id}
          item={item}
          yOffset={0.55}
          selected={selectedId === item.id}
          onSelect={onSelect}
        />
      ))}

      {layerIsEnabled(layers, "cameras") && [[-8.4,-2.2],[1.6,2.2],[8.5,-2.2]].map(([x,z], index) => (
        <group key={`${x}-${z}`} position={[x, 1.05, z]} rotation={[Math.PI / 2, 0, index % 2 ? 0 : Math.PI]}>
          <mesh>
            <coneGeometry args={[1.15, 3.2, 20, 1, true]} />
            <meshBasicMaterial color="#7aa2ff" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, -1.65, 0]}>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshBasicMaterial color="#7aa2ff" toneMapped={false} />
          </mesh>
        </group>
      ))}

      <mesh position={[4.8, 0.61, 1.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.18, 40]} />
        <meshBasicMaterial color="#7aa2ff" transparent opacity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

function layerIsEnabled(layers, key) {
  if (!layers) return true;
  if (Array.isArray(layers)) return layers.includes(key);
  if (layers instanceof Set) return layers.has(key);
  if (typeof layers === "object") {
    if (key in layers) return Boolean(layers[key]);
    const aliases = {
      people: ["staff", "personnel"],
      incidents: ["alerts"],
      teams: ["responders"],
      routes: ["trails", "navigation"],
      coverage: ["mesh", "anchors"],
      search: ["sectors", "searchSectors"],
      muster: ["musterPoints"],
      campus: ["context", "site"],
    };
    const alias = aliases[key]?.find((name) => name in layers);
    return alias ? Boolean(layers[alias]) : true;
  }
  return true;
}

function selectionId(selected) {
  if (!selected) return null;
  return typeof selected === "string" ? selected : selected.id ?? null;
}

function CameraController({ view, floor, mode }) {
  const lowerView = String(view).toLowerCase();
  const is2d = lowerView.includes("2d") || lowerView === "two";
  const isFocus = String(view).toLowerCase().includes("focus");
  const selectedFloor = FLOOR_DEFS.find((item) => item.id === floor) ?? FLOOR_DEFS[0];
  const isInvestigation = String(mode).toLowerCase().includes("investig");
  const focusY = isInvestigation ? 1.2 : isFocus ? selectedFloor.baseY + 1.6 : 4;
  const controls = useRef();

  useEffect(() => {
    if (!controls.current) return;
    controls.current.target.set(0, focusY, 0);
    controls.current.update();
  }, [focusY, is2d]);

  return (
    <>
      {is2d ? (
        <OrthographicCamera
          makeDefault
          position={[0, 42, 0.01]}
          near={0.1}
          far={110}
          zoom={27}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={isInvestigation ? [20, 18, 24] : isFocus ? [19, 15, 23] : [26, 23, 31]}
          fov={35}
          near={0.1}
          far={160}
        />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        target={[0, focusY, 0]}
        enableDamping
        dampingFactor={0.075}
        enableRotate={!is2d}
        minDistance={isFocus ? 10 : 17}
        maxDistance={58}
        minZoom={18}
        maxZoom={58}
        maxPolarAngle={is2d ? 0 : Math.PI * 0.47}
        minPolarAngle={is2d ? 0 : Math.PI * 0.16}
      />
    </>
  );
}

function PulsingRing({ colour, radius = 0.72, speed = 1, opacity = 0.55 }) {
  const ring = useRef();

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const cycle = (clock.elapsedTime * speed) % 1;
    const scale = 0.75 + cycle * 1.25;
    ring.current.scale.setScalar(scale);
    ring.current.material.opacity = opacity * (1 - cycle);
  });

  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.82, radius, 36]} />
      <meshBasicMaterial
        color={colour}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function PersonMarker({ item, yOffset, selected, onSelect }) {
  const group = useRef();

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y =
      item.position[1] + yOffset + Math.sin(clock.elapsedTime * 2.2 + item.position[0]) * 0.07;
  });

  return (
    <group
      ref={group}
      position={[item.position[0], item.position[1] + yOffset, item.position[2]]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.({ type: "person", ...item });
      }}
    >
      <mesh castShadow>
        <sphereGeometry args={[selected ? 0.28 : 0.22, 18, 18]} />
        <meshStandardMaterial
          color={item.colour}
          emissive={item.colour}
          emissiveIntensity={selected ? 2.4 : 1.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.42, 0]} castShadow>
        <capsuleGeometry args={[selected ? 0.17 : 0.14, 0.46, 6, 12]} />
        <meshStandardMaterial
          color={item.colour}
          emissive={item.colour}
          emissiveIntensity={selected ? 1.4 : 0.45}
        />
      </mesh>
      {selected && <PulsingRing colour={item.colour} radius={0.62} speed={0.72} />}
    </group>
  );
}

function IncidentMarker({ item, yOffset, selected, onSelect }) {
  const colour = item.severity === "critical" ? COLOURS.red : COLOURS.amber;

  return (
    <Float speed={2.5} rotationIntensity={0.25} floatIntensity={0.3}>
      <group
        position={[item.position[0], item.position[1] + yOffset, item.position[2]]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.({ type: "incident", ...item });
        }}
      >
        <mesh castShadow rotation={[0, Math.PI / 4, 0]}>
          <octahedronGeometry args={[selected ? 0.48 : 0.36, 0]} />
          <meshStandardMaterial
            color={colour}
            emissive={colour}
            emissiveIntensity={selected ? 3.2 : 2}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.68, 0]}>
          <cylinderGeometry args={[0.025, 0.06, 0.9, 10]} />
          <meshBasicMaterial color={colour} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <PulsingRing colour={colour} radius={selected ? 1.05 : 0.76} speed={0.92} />
      </group>
    </Float>
  );
}

function TeamMarker({ item, selected, onSelect }) {
  return (
    <group
      position={item.position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.({ type: "team", ...item });
      }}
    >
      <mesh castShadow rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[selected ? 0.48 : 0.36, 0.85, 5]} />
        <meshStandardMaterial
          color={item.colour}
          emissive={item.colour}
          emissiveIntensity={selected ? 1.8 : 0.8}
          toneMapped={false}
        />
      </mesh>
      <PulsingRing colour={item.colour} radius={selected ? 0.95 : 0.66} speed={0.55} />
    </group>
  );
}

function ArenaFloor({ floor, index, layout, activeFloor, selected, onSelect }) {
  const group = useRef();
  const targetY = useMemo(() => {
    if (layout === "exploded") return floor.baseY + index * 1.7;
    if (layout === "focus") return floor.id === activeFloor ? 1.25 : floor.baseY + 14 + index;
    return floor.baseY;
  }, [activeFloor, floor, index, layout]);

  useFrame(() => {
    if (!group.current) return;
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY, 0.085);
  });

  const isActive = activeFloor === floor.id;
  const hiddenByFocus = layout === "focus" && !isActive;
  const yOffset = targetY - floor.baseY;

  return (
    <group ref={group} position={[0, floor.baseY, 0]} visible={!hiddenByFocus}>
      <group
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.({ type: "floor", id: floor.id, floor: floor.id, name: floor.name });
        }}
      >
        <mesh receiveShadow castShadow scale={[1, 1, 0.66]}>
          <cylinderGeometry args={[floor.radius, floor.radius + 0.4, 0.32, 64]} />
          <meshStandardMaterial
            color={selected ? COLOURS.mint : floor.tint}
            roughness={0.72}
            metalness={0.2}
            transparent
            opacity={selected ? 0.92 : isActive ? 0.86 : 0.72}
          />
        </mesh>
        <mesh position={[0, 0.19, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.66]}>
          <torusGeometry args={[floor.radius * 0.77, 0.62, 12, 80]} />
          <meshStandardMaterial
            color={isActive ? "#36574f" : "#2a3940"}
            roughness={0.62}
            metalness={0.25}
            transparent
            opacity={0.88}
          />
        </mesh>
        <mesh position={[0, 0.42, 0]} scale={[1, 1, 0.65]}>
          <cylinderGeometry args={[floor.radius * 0.62, floor.radius * 0.64, 0.18, 64]} />
          <meshStandardMaterial
            color={index === 0 ? "#162027" : "#1b2930"}
            roughness={0.9}
          />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((segment) => {
          const angle = (segment / 8) * Math.PI * 2;
          return (
            <mesh
              key={segment}
              position={[
                Math.cos(angle) * floor.radius * 0.78,
                0.62,
                Math.sin(angle) * floor.radius * 0.51,
              ]}
              rotation={[0, -angle, 0]}
              castShadow
            >
              <boxGeometry args={[1.9, 0.85, 0.18]} />
              <meshStandardMaterial
                color={isActive ? "#3d5f57" : "#33464e"}
                emissive={isActive ? "#18352f" : "#10191e"}
                emissiveIntensity={0.35}
                roughness={0.52}
              />
            </mesh>
          );
        })}
      </group>

      {index === 0 && (
        <>
          <mesh position={[0, 0.58, 0]} receiveShadow>
            <boxGeometry args={[8.8, 0.12, 5.1]} />
            <meshStandardMaterial color="#1c2a31" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.4, 2.47, 50]} />
            <meshBasicMaterial color={COLOURS.muted} transparent opacity={0.5} />
          </mesh>
        </>
      )}

      <mesh position={[floor.radius * 0.76, 0.5, 0]} castShadow>
        <boxGeometry args={[2.7, 1.15, 4.7]} />
        <meshStandardMaterial
          color={COLOURS.glass}
          roughness={0.42}
          metalness={0.32}
          transparent
          opacity={0.82}
        />
      </mesh>
      <mesh position={[-floor.radius * 0.7, 0.5, 0]} castShadow>
        <boxGeometry args={[2.3, 1.05, 4.1]} />
        <meshStandardMaterial color="#23333a" roughness={0.68} />
      </mesh>

      <mesh position={[0, 0.63, floor.radius * 0.43]} castShadow>
        <boxGeometry args={[6.2, 0.84, 1.25]} />
        <meshStandardMaterial
          color="#293b42"
          emissive="#14252b"
          emissiveIntensity={0.25}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0, 0.64, -floor.radius * 0.43]} castShadow>
        <boxGeometry args={[6.2, 0.84, 1.25]} />
        <meshStandardMaterial color="#293b42" roughness={0.55} />
      </mesh>

      {isActive && (
        <mesh position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[floor.radius + 0.22, floor.radius + 0.28, 96]} />
          <meshBasicMaterial color={COLOURS.mint} transparent opacity={0.72} toneMapped={false} />
        </mesh>
      )}

      {/* Local marker height is adjusted back from the animated floor group. */}
      <group position={[0, -yOffset, 0]} />
    </group>
  );
}

function SearchSector({ position, radius, start, length, colour, id, selected, onSelect }) {
  return (
    <group position={position}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.({ type: "search-sector", id });
        }}
      >
        <circleGeometry args={[radius, 48, start, length]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={selected ? 0.27 : 0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[radius - 0.08, radius, 48, 1, start, length]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={selected ? 0.95 : 0.55}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CoverageLayer({ selected, onSelect }) {
  const anchors = [
    { id: "anchor-north", position: [-8.8, 0.17, -7.5], radius: 6.8, health: "live" },
    { id: "anchor-east", position: [10.2, 0.17, 1.8], radius: 7.5, health: "live" },
    { id: "anchor-south", position: [1.6, 0.17, 9.4], radius: 6.1, health: "degraded" },
  ];

  return anchors.map((anchor) => {
    const colour = anchor.health === "degraded" ? COLOURS.amber : COLOURS.mint;
    return (
      <group
        key={anchor.id}
        position={anchor.position}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.({ type: "anchor", ...anchor });
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[anchor.radius - 0.1, anchor.radius, 72]} />
          <meshBasicMaterial
            color={colour}
            transparent
            opacity={selectionId(selected) === anchor.id ? 0.9 : 0.28}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 2.1, 10]} />
          <meshStandardMaterial
            color={colour}
            emissive={colour}
            emissiveIntensity={0.65}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 2.14, 0]}>
          <sphereGeometry args={[0.17, 12, 12]} />
          <meshBasicMaterial color={colour} toneMapped={false} />
        </mesh>
      </group>
    );
  });
}

function CampusContext({ onSelect }) {
  const trees = [
    [-20, -12], [-16, -13.5], [-10, -14], [14, -13.2], [18.5, -11.8],
    [22, -7], [22.5, 2], [20.5, 13], [-19, 13], [-23, 8], [-23, -2],
  ];

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[62, 47]} />
        <meshStandardMaterial color={COLOURS.ground} roughness={0.96} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 15]}>
        <planeGeometry args={[58, 5.4]} />
        <meshStandardMaterial color="#111b19" roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-19, -0.06, 0]}>
        <planeGeometry args={[4.8, 31]} />
        <meshStandardMaterial color="#111b19" roughness={0.9} />
      </mesh>

      {[-24, -16, -8, 0, 8, 16, 24].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.045, 15]}>
          <planeGeometry args={[3.7, 0.09]} />
          <meshBasicMaterial color="#45554f" transparent opacity={0.4} />
        </mesh>
      ))}

      <RoundedBox position={[15.8, 1.2, -8.7]} args={[8.7, 2.4, 5.4]} radius={0.28} smoothness={3} castShadow>
        <meshStandardMaterial color="#162823" roughness={0.68} metalness={0.18} />
      </RoundedBox>
      <RoundedBox position={[-13.7, 0.85, 8.9]} args={[6.2, 1.7, 4.2]} radius={0.22} smoothness={3} castShadow>
        <meshStandardMaterial color="#132520" roughness={0.75} />
      </RoundedBox>

      <mesh position={[18.9, 0.18, 9.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.2, 5.8]} />
        <meshStandardMaterial color="#102c22" roughness={0.9} />
      </mesh>
      {[16.2, 18, 19.8, 21.6].map((x) => (
        <mesh key={x} position={[x, 0.2, 9.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.035, 5.2]} />
          <meshBasicMaterial color={COLOURS.mint} transparent opacity={0.22} />
        </mesh>
      ))}

      {trees.map(([x, z], index) => (
        <group key={`${x}-${z}`} position={[x, 0, z]} scale={0.72 + (index % 3) * 0.09}>
          <mesh position={[0, 0.58, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.13, 1.15, 8]} />
            <meshStandardMaterial color="#263029" roughness={1} />
          </mesh>
          <mesh position={[0, 1.45, 0]} castShadow>
            <coneGeometry args={[0.66, 1.75, 9]} />
            <meshStandardMaterial color="#18372d" roughness={0.92} />
          </mesh>
        </group>
      ))}

      <mesh
        position={[18.9, 0.25, 9.7]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.({ type: "muster", id: "muster-east", name: "East muster" });
        }}
      >
        <boxGeometry args={[8.4, 0.12, 6]} />
        <meshBasicMaterial color={COLOURS.mint} transparent opacity={0.035} />
      </mesh>
    </group>
  );
}

function VenueWorld({
  mode,
  view,
  floor,
  layers,
  selected,
  onSelect,
  people = PEOPLE,
  incidents = INCIDENTS,
  teams = TEAMS,
}) {
  const selectedId = selectionId(selected);
  const lowerMode = String(mode ?? "live").toLowerCase();
  const lowerView = String(view ?? "3d-site").toLowerCase();
  const is2d = lowerView.includes("2d") || lowerView === "two";
  const isSpecificFloor = floor && floor !== "ALL";
  const layout = lowerView.includes("exploded")
    ? "exploded"
    : lowerView.includes("focus") || lowerMode.includes("investig") || (is2d && isSpecificFloor)
      ? "focus"
      : lowerMode.includes("rescue") && !is2d
        ? "exploded"
        : "stacked";
  const activeFloor =
    (floor && floor !== "ALL" ? floor : null) ??
    (selected && typeof selected === "object" ? selected.floor : null) ??
    (lowerMode.includes("investig") ? "L1" : "G");
  const isInvestigation = lowerMode.includes("investig");

  const floorOffsets = useMemo(() => {
    const offsets = {};
    FLOOR_DEFS.forEach((item, index) => {
      const target =
        layout === "exploded"
          ? item.baseY + index * 1.7
          : layout === "focus"
            ? item.id === activeFloor
              ? 1.25
              : item.baseY + 14 + index
            : item.baseY;
      offsets[item.id] = target - item.baseY;
    });
    return offsets;
  }, [activeFloor, layout]);

  const floorTargets = useMemo(() => {
    const targets = {};
    FLOOR_DEFS.forEach((item) => {
      targets[item.id] = item.baseY + floorOffsets[item.id];
    });
    return targets;
  }, [floorOffsets]);

  const routeVisible = (route) => {
    if (route.id === "trail-nia") return lowerMode.includes("investig") || selectedId === "nia";
    if (route.id === "route-evac") return lowerMode.includes("rescue") || lowerMode.includes("major");
    return true;
  };

  return (
    <>
      <color attach="background" args={["#070a10"]} />
      <fog attach="fog" args={["#070a10", 36, 90]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#d7eef2", "#07100e", 1.25]} />
      <directionalLight
        position={[14, 25, 12]}
        intensity={3.35}
        color="#d8fff4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[-11, 10, -8]} color={COLOURS.cyan} intensity={28} distance={32} />
      <pointLight position={[13, 7, 10]} color={COLOURS.mint} intensity={20} distance={26} />

      {layerIsEnabled(layers, "campus") && <CampusContext onSelect={onSelect} />}

      {isInvestigation ? (
        <InvestigationPlan layers={layers} selected={selected} onSelect={onSelect} />
      ) : (
        <group>
          {FLOOR_DEFS.map((item, index) => (
            <ArenaFloor
              key={item.id}
              floor={item}
              index={index}
              layout={layout}
              activeFloor={activeFloor}
              selected={selectedId === item.id}
              onSelect={onSelect}
            />
          ))}
        </group>
      )}

      {!isInvestigation && layerIsEnabled(layers, "people") &&
        people.map((item) => {
          if (layout === "focus" && item.floor !== activeFloor) return null;
          return (
            <PersonMarker
              key={item.id}
              item={item}
              yOffset={floorTargets[item.floor]}
              selected={selectedId === item.id}
              onSelect={onSelect}
            />
          );
        })}

      {!isInvestigation && layerIsEnabled(layers, "incidents") &&
        incidents.map((item) => {
          if (layout === "focus" && item.floor !== activeFloor) return null;
          return (
            <IncidentMarker
              key={item.id}
              item={item}
              yOffset={floorTargets[item.floor]}
              selected={selectedId === item.id}
              onSelect={onSelect}
            />
          );
        })}

      {!isInvestigation && layerIsEnabled(layers, "teams") &&
        teams.map((item) => (
          <TeamMarker
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={onSelect}
          />
        ))}

      {!isInvestigation && layerIsEnabled(layers, "routes") &&
        ROUTES.filter(routeVisible).map((route) => {
          const routeFloor = route.id === "trail-nia" ? "L2" : route.id === "route-medical" ? "G" : null;
          const yOffset = routeFloor ? floorOffsets[routeFloor] : 0;
          return (
            <Line
              key={route.id}
              points={route.points.map(([x, y, z]) => [x, y + yOffset, z])}
              color={route.colour}
              lineWidth={route.id === "trail-nia" ? 2.2 : 3.2}
              dashed={route.dashed}
              dashSize={0.3}
              gapSize={0.22}
              transparent
              opacity={0.9}
              toneMapped={false}
            />
          );
        })}

      {layerIsEnabled(layers, "coverage") && (
        <CoverageLayer selected={selected} onSelect={onSelect} />
      )}

      {layerIsEnabled(layers, "search") &&
        (lowerMode.includes("rescue") || lowerMode.includes("major") || selectedId?.startsWith("sector")) && (
          <>
            <SearchSector
              id="sector-a"
              position={[-4, 0.19, 0]}
              radius={15.8}
              start={Math.PI * 0.72}
              length={Math.PI * 0.46}
              colour={COLOURS.mint}
              selected={selectedId === "sector-a"}
              onSelect={onSelect}
            />
            <SearchSector
              id="sector-b"
              position={[2, 0.18, 1]}
              radius={17.5}
              start={Math.PI * 1.12}
              length={Math.PI * 0.38}
              colour={COLOURS.cyan}
              selected={selectedId === "sector-b"}
              onSelect={onSelect}
            />
            <SearchSector
              id="sector-c"
              position={[0, 0.2, 0]}
              radius={21.7}
              start={Math.PI * 0.08}
              length={Math.PI * 0.3}
              colour={COLOURS.amber}
              selected={selectedId === "sector-c"}
              onSelect={onSelect}
            />
          </>
        )}

      {layerIsEnabled(layers, "muster") && (
        <group position={[18.9, 0.25, 9.7]}>
          {[[-2.6, -1.6], [-1.8, -0.3], [-0.8, 1.4], [0.4, -1], [1.5, 0.5], [2.7, -1.3]].map(
            ([x, z], index) => (
              <mesh key={index} position={[x, 0.25, z]}>
                <sphereGeometry args={[0.12, 10, 10]} />
                <meshBasicMaterial color={index < 5 ? COLOURS.mint : COLOURS.amber} toneMapped={false} />
              </mesh>
            ),
          )}
          <PulsingRing colour={COLOURS.mint} radius={3.25} speed={0.25} opacity={0.22} />
        </group>
      )}

      <CameraController view={view} floor={activeFloor} mode={mode} />
    </>
  );
}

/**
 * Shared operational venue canvas.
 *
 * demoId: selects the operating context (live, person/investigation, rescue/major incident)
 * viewMode: "three" | "two" | "exploded" | "focus"
 * activeFloor: "ALL" | "G" | "L1" | "L2" | "L3"
 * layers: object, array, or Set containing people/incidents/teams/routes/coverage/search/muster/campus
 * selected: an id string or a selected data object
 * onSelect: receives { type, id, label, ...data }
 */
export function VenueScene({
  demoId = "live",
  viewMode = "three",
  activeFloor = "ALL",
  layers,
  selected,
  onSelect,
  className,
  style,
  people,
  incidents,
  teams,
  // Legacy aliases make the scene easy to reuse outside the four demo shells.
  mode,
  view,
  floor,
}) {
  const [pointerDown, setPointerDown] = useState(null);
  const demoKey = String(demoId).toLowerCase();
  const resolvedMode =
    mode ??
    (demoKey === "sar" || demoKey.includes("rescue") || demoKey.includes("major")
      ? "rescue"
      : demoKey.includes("person") || demoKey.includes("invest")
        ? "investigation"
        : "live");
  const resolvedView =
    view ??
    ({
      three: "3d-site",
      two: "2d-site",
      exploded: "3d-exploded",
      focus: "3d-focus",
    }[viewMode] ??
      viewMode);
  const resolvedFloor = floor ?? activeFloor;
  const emitSelection = (value) => {
    if (!value) {
      onSelect?.(null);
      return;
    }
    onSelect?.({
      ...value,
      label:
        value.label ??
        value.name ??
        (value.type === "floor"
          ? `Floor ${value.id}`
          : value.id
              .split("-")
              .map((word) => word[0]?.toUpperCase() + word.slice(1))
              .join(" ")),
    });
  };

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 360,
        background: COLOURS.ink,
        overflow: "hidden",
        ...style,
      }}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.7]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onPointerMissed={() => emitSelection(null)}
        onPointerDown={(event) => setPointerDown([event.clientX, event.clientY])}
        onPointerUp={(event) => {
          if (!pointerDown) return;
          const moved = Math.hypot(event.clientX - pointerDown[0], event.clientY - pointerDown[1]);
          if (moved > 5) event.stopPropagation();
          setPointerDown(null);
        }}
      >
        <Suspense fallback={null}>
          <VenueWorld
            mode={resolvedMode}
            view={resolvedView}
            floor={resolvedFloor}
            layers={layers}
            selected={selected}
            onSelect={emitSelection}
            people={people}
            incidents={incidents}
            teams={teams}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default VenueScene;
