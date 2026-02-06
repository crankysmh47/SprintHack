"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

function Stars(props: any) {
    const ref = useRef<THREE.Points>(null);
    const [sphere] = useState(() => {
        // Generate random points in a sphere
        const count = 5000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 1.2 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        return positions;
    });

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color={props.color}
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}

export function ThreeBackground() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Use resolvedTheme if available, falling back to theme or 'dark' default
    const currentTheme = (mounted && resolvedTheme) ? resolvedTheme : (theme || 'dark');

    // Dark mode: electric blue/cyan hue for stars
    // Light mode: dark grey/black stars
    const color = currentTheme === 'dark' ? "#00f0ff" : "#1a1a1a";
    const bgColor = currentTheme === 'dark' ? "#02040a" : "#fafafa";

    // While mounting or deciding, show a solid background to prevent flash
    return (
        <div className="fixed inset-0 -z-10 transition-colors duration-700" style={{ backgroundColor: bgColor }}>
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars color={color} />
            </Canvas>
        </div>
    );
}
