// LOAD PORTRAITS //////////////////////

const portraitImages = import.meta.glob(
  "/assets/img/portraits/*.{png,jpg,jpeg,gif}",
  { eager: true }
);

export const characterPortraits: string[] = Object.keys(portraitImages);

// LOAD SOUNDS //////////////////////

const sounds = import.meta.glob("/assets/sfx/*.{mp3,wav}", {
  eager: true,
});
export const soundFiles: Record<string, string> = Object.fromEntries(
  Object.entries(sounds).map(([path, mod]) => [
    path.replace("/assets/sfx/", ""),
    (mod as { default: string }).default,
  ])
);
