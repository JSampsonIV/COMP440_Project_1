export interface NPC {
  id: number;
  x: number;
  progress: number;
  saved: boolean;
  name: string;
  desc: string;
  skin: string;
  shirt: string;
  pants: string;
}

export interface GameResult {
  won: boolean;
  npcs: NPC[];
}
