import type { DifficultyKey } from '../types';

export type DifficultyConfig = {
  baseSpeed: number;
  speedRamp: number;
  baseSpawnMs: number;
  spawnRampMs: number;
  minSpawnMs: number;
  lateralSpeed: number;
  seedChance: number;
};

export const DIFFICULTY_CONFIG: Record<DifficultyKey, DifficultyConfig> = {
  easy: {
    baseSpeed: 70,
    speedRamp: 1.4,
    baseSpawnMs: 1200,
    spawnRampMs: 6,
    minSpawnMs: 550,
    lateralSpeed: 170,
    seedChance: 0.12
  },
  normal: {
    baseSpeed: 85,
    speedRamp: 1.8,
    baseSpawnMs: 1050,
    spawnRampMs: 7,
    minSpawnMs: 470,
    lateralSpeed: 200,
    seedChance: 0.11
  },
  hard: {
    baseSpeed: 100,
    speedRamp: 2.2,
    baseSpawnMs: 900,
    spawnRampMs: 8,
    minSpawnMs: 380,
    lateralSpeed: 220,
    seedChance: 0.1
  }
};

export const getSpeed = (config: DifficultyConfig, elapsedSec: number, burstBoost: number) => {
  return config.baseSpeed + config.speedRamp * elapsedSec + burstBoost;
};

export const getSpawnInterval = (config: DifficultyConfig, elapsedSec: number) => {
  return Math.max(config.minSpawnMs, config.baseSpawnMs - config.spawnRampMs * elapsedSec);
};
