import cables from "./items/cables.png";
import desktop from "./items/desktop.png";
import laptop from "./items/laptop.png";
import memory from "./items/memory.png";
import networkKit from "./items/network-kit.png";
import serverParts from "./items/server-parts.png";

export const itemArt: Record<string, string> = {
  Cables: cables,
  Workstation: desktop,
  Laptop: laptop,
  Storage: memory,
  Network: networkKit,
  Server: serverParts,
  "Mini PC": desktop,
};
