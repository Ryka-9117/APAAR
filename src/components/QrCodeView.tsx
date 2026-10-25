"use client";

import React, { useMemo } from "react";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic SVG matrix generator for mock QR code display
 * Generates official QR-style corner positioning targets, timing patterns, and encoded data bits
 */
export const QrCodeView: React.FC<QrCodeProps> = ({ value, size = 160, className = "" }) => {
  const matrix = useMemo(() => {
    const dim = 25; // 25x25 QR matrix (Version 2 standard)
    const grid: boolean[][] = Array(dim)
      .fill(false)
      .map(() => Array(dim).fill(false));

    // Helper: draw 7x7 Finder Pattern with 3x3 solid center
    const drawFinder = (startX: number, startY: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          if (
            y === 0 || y === 6 || x === 0 || x === 6 || // Outer 7x7 border
            (y >= 2 && y <= 4 && x >= 2 && x <= 4) // Inner 3x3 solid box
          ) {
            grid[startY + y][startX + x] = true;
          }
        }
      }
    };

    // Draw 3 corner finder patterns
    drawFinder(0, 0); // Top-left
    drawFinder(dim - 7, 0); // Top-right
    drawFinder(0, dim - 7); // Bottom-left

    // Draw timing patterns (alternating dots connecting finders)
    for (let i = 8; i < dim - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Alignment pattern at bottom right
    const alignX = dim - 9;
    const alignY = dim - 9;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (y === 0 || y === 4 || x === 0 || x === 4 || (y === 2 && x === 2)) {
          grid[alignY + y][alignX + x] = true;
        }
      }
    }

    // Deterministically encode value bytes into remaining data cells
    let bitIndex = 0;
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    for (let y = 0; y < dim; y++) {
      for (let x = 0; x < dim; x++) {
        // Skip finder areas
        if (
          (x < 8 && y < 8) || // Top-left
          (x >= dim - 8 && y < 8) || // Top-right
          (x < 8 && y >= dim - 8) || // Bottom-left
          (x >= dim - 9 && x <= dim - 5 && y >= dim - 9 && y <= dim - 5) || // Alignment
          (x === 6 || y === 6) // Timing lines
        ) {
          continue;
        }

        const pseudorandom = Math.sin(hash + bitIndex * 1.618) * 10000;
        grid[y][x] = (pseudorandom - Math.floor(pseudorandom)) > 0.45;
        bitIndex++;
      }
    }

    return grid;
  }, [value]);

  const dim = matrix.length;
  const cellSize = size / dim;

  return (
    <div className={`inline-block p-3 bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto"
        role="img"
        aria-label={`QR Code encoding ${value}`}
      >
        <rect width={size} height={size} fill="#FFFFFF" />
        {matrix.map((row, y) =>
          row.map((cell, x) =>
            cell ? (
              <rect
                key={`${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize + 0.2}
                height={cellSize + 0.2}
                fill="#10233F"
              />
            ) : null
          )
        )}
      </svg>
      <div className="text-[10px] text-center text-slate-500 font-mono mt-1 tracking-wider truncate max-w-[160px]">
        SCAN TO VERIFY
      </div>
    </div>
  );
};
