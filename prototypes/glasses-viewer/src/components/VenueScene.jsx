import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { venue } from "../model/operationalState.js";

const levelColor = ["#223028", "#26352e", "#2b3c34", "#31443a"];

function shapeBounds(points) {
  const xs = points.map((point) => point.xM);
  const ys = points.map((point) => point.yM);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: (minX + maxX) / 2 - 36,
    z: (minY + maxY) / 2 - 17,
    width: Math.max(1.5, maxX - minX),
    depth: Math.max(1.5, maxY - minY),
  };
}

function VenueGeometry({ mode, floor }) {
  const levels = venue.package.levels;
  const plans = venue.package.floorPlans;
  const selectedOrdinal = floor === "ALL" ? null : Number(floor.replace(/\D/g, "")) || 0;

  return (
    <group rotation={[0, -0.15, 0]}>
      {levels.map((level, levelIndex) => {
        const plan = plans.find((candidate) => candidate.levelId === level.levelId);
        const visible =
          mode !== "floor" ||
          floor === "ALL" ||
          level.ordinal === selectedOrdinal ||
          (floor === "L2" && level.levelRef === "L2");
        if (!visible || !plan) return null;
        const separation = mode === "site" ? levelIndex * 7 : levelIndex * 0.8;
        const y = mode === "top" ? levelIndex * 0.2 : separation;
        return (
          <group key={level.levelId} position={[0, y, 0]}>
            {plan.shapes.map((shape, shapeIndex) => {
              const bounds = shapeBounds(shape.points);
              return (
                <mesh
                  key={shape.shapeId}
                  position={[bounds.x, 0, bounds.z]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[bounds.width - 0.45, 0.55, bounds.depth - 0.45]} />
                  <meshStandardMaterial
                    color={levelColor[levelIndex]}
                    emissive={shapeIndex % 4 === 0 ? "#123c2f" : "#07100d"}
                    emissiveIntensity={shapeIndex % 4 === 0 ? 0.42 : 0.12}
                    transparent
                    opacity={mode === "site" ? 0.88 : 0.96}
                    roughness={0.75}
                    metalness={0.18}
                  />
                </mesh>
              );
            })}
            <mesh position={[0, -0.42, 0]} receiveShadow>
              <boxGeometry args={[74, 0.2, 36]} />
              <meshStandardMaterial color="#07100d" transparent opacity={0.68} />
            </mesh>
          </group>
        );
      })}

      <Line
        points={[
          [-27, mode === "site" ? 0.6 : 1.1, 8],
          [-13, mode === "site" ? 7.6 : 1.2, 1],
          [4, mode === "site" ? 14.6 : 1.3, -2],
          [22, mode === "site" ? 21.6 : 1.4, -7],
        ]}
        color="#46e0a0"
        lineWidth={2.2}
        dashed
        dashScale={4}
        dashSize={0.8}
        gapSize={0.5}
      />

      <mesh position={[-23, mode === "site" ? 1.8 : 2, 8]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshStandardMaterial color="#ff4053" emissive="#ff4053" emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[3, mode === "site" ? 15.4 : 2, -2]}>
        <sphereGeometry args={[0.72, 20, 20]} />
        <meshStandardMaterial color="#7aa2ff" emissive="#7aa2ff" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[19, mode === "site" ? 22.4 : 2, -7]}>
        <sphereGeometry args={[0.72, 20, 20]} />
        <meshStandardMaterial color="#ffb43a" emissive="#ffb43a" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

export function VenueScene({ mode = "site", floor = "ALL" }) {
  const top = mode === "top";
  return (
    <Canvas
      shadows
      orthographic={top}
      camera={
        top
          ? { position: [0, 80, 0.01], zoom: 7.6, near: 0.1, far: 250 }
          : { position: [62, 54, 70], fov: 34, near: 0.1, far: 300 }
      }
      dpr={[1, 1.4]}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#020604", 90, 175]} />
      <ambientLight intensity={1.4} />
      <directionalLight
        castShadow
        position={[20, 45, 25]}
        intensity={3.4}
        color="#d7ffef"
      />
      <pointLight position={[-30, 18, 16]} color="#46e0a0" intensity={28} distance={70} />
      <VenueGeometry mode={mode} floor={floor} />
      <OrbitControls
        enablePan
        enableZoom
        minDistance={35}
        maxDistance={150}
        minPolarAngle={top ? 0 : Math.PI / 6}
        maxPolarAngle={top ? Math.PI / 4 : Math.PI / 2.05}
        target={[0, mode === "site" ? 10 : 0, 0]}
      />
    </Canvas>
  );
}
