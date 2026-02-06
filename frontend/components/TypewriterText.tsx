"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
    text: string;
    className?: string;
    cursorColor?: string;
    delay?: number;
}

export function TypewriterText({
    text,
    className = "",
    cursorColor = "bg-blue-500",
    delay = 50
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, delay);

            return () => clearTimeout(timeout);
        }
    }, [currentIndex, delay, text]);

    return (
        <div className={`inline-flex items-center ${className}`}>
            <span>{displayedText}</span>
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className={`inline-block w-[2px] h-[1em] ml-1 ${cursorColor}`}
            />
        </div>
    );
}
