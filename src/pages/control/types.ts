export type SoundAsset = {
  id?: string;
  name: string;
  file?: string;
  url: string;
  builtIn?: boolean;
  durationMs?: number;
  category?: string;
  source?: string;
  license?: string;
  author?: string;
  defaultVolume?: number;
};

export type StopwatchMark = {
  id: string;
  time: number;
  name: string;
  loggedAt: string;
};
