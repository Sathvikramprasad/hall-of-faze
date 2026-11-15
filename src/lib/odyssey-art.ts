import { existsSync } from "node:fs";
import path from "node:path";
import { ODYSSEY_ART_DIR, ODYSSEY_ART_EXTENSIONS, ODYSSEY_STATES, type OdysseyArt } from "@/lib/odyssey";

/** Finds the warrior art in public/odyssey at build time. Missing files fall back to the stand-in. */
export function getOdysseyArt(): OdysseyArt {
  const art = {} as OdysseyArt;
  for (const state of ODYSSEY_STATES) {
    const ext = ODYSSEY_ART_EXTENSIONS.find((e) => existsSync(path.join(process.cwd(), "public", ODYSSEY_ART_DIR, `${state}.${e}`)));
    art[state] = ext ? `/${ODYSSEY_ART_DIR}/${state}.${ext}` : null;
  }
  return art;
}
