"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

interface MousePosition {
  x: number;
  y: number;
}

function InteractiveStars(props: any) {
  const ref = useRef<THREE.Points>(null);
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const { camera } = useThree();
  
  // Generate particles with initial positions
  const [positions, velocities] = useMemo(() => {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const r = 1.5 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      // Initialize velocities
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    
    return [pos, vel];
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    const mouse3D = new THREE.Vector3(mouseRef.current.x * 2, mouseRef.current.y * 2, 0);

    // Animate particles
    for (let i = 0; i < positions.length; i += 3) {
      const particle = new THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      );

      // Calculate distance to mouse
      const distance = particle.distanceTo(mouse3D);
      
      // Attraction/repulsion force
      if (distance < 0.8) {
        const direction = particle.clone().sub(mouse3D).normalize();
        const force = (0.8 - distance) * 0.01;
        
        positions[i] += direction.x * force;
        positions[i + 1] += direction.y * force;
        positions[i + 2] += direction.z * force;
      }

      // Add drift
      positions[i] += velocities[i] * delta;
      positions[i + 1] += velocities[i + 1] * delta;
      positions[i + 2] += velocities[i + 2] * delta;

      // Boundary check - keep particles in sphere
      const dist = Math.sqrt(
        positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2
      );
      if (dist > 1.8) {
        positions[i] *= 0.95;
        positions[i + 1] *= 0.95;
        positions[i + 2] *= 0.95;
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true;

    // Gentle rotation
    ref.current.rotation.y += delta * 0.05;
    
    // Camera follows mouse subtly
    camera.position.x += (mouseRef.current.x * 0.1 - camera.position.x) * 0.05;
    camera.position.y += (mouseRef.current.y * 0.1 - camera.position.y) * 0.05;
  });

  return (
    <group rotation={[0, 0, 0]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color={props.color}
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
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

  const currentTheme = (mounted && resolvedTheme) ? resolvedTheme : (theme || 'dark');

  // Theme-aware colors
  const color = currentTheme === 'dark' ? "#60a5fa" : "#27272a"; // blue-400 : zinc-800
  const bgColor = currentTheme === 'dark' ? "#09090b" : "#fafafa"; // zinc-950 : gray-50

  return (
    <div 
      className="fixed inset-0 -z-10 transition-colors duration-700" 
      style={{ backgroundColor: bgColor }}
    >
      {mounted && (
        <Canvas camera={{ position: [0, 0, 1], fov: 75 }}>
          <InteractiveStars color={color} />
        </Canvas>
      )}
    </div>
  );
}
