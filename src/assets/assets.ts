// LOAD PORTRAITS //////////////////////

const portraitImages = import.meta.glob(
  "/assets/img/portraits/*.{png,jpg,jpeg,gif}",
  { eager: true }
);

export const characterPortraits: string[] = Object.keys(portraitImages);

// LOAD SOUNDS //////////////////////
export const BASE_URL = import.meta.env.BASE_URL || "";

export const soundFiles: Record<string, string> = {
  brew: `${BASE_URL}/assets/sfx/brew.mp3`,
  confirm: `${BASE_URL}/assets/sfx/confirm.mp3`,
  minor_button: `${BASE_URL}/assets/sfx/minor_button.mp3`,
  stop: `${BASE_URL}/assets/sfx/stop-13692.mp3`,
  transaction_fail: `${BASE_URL}/assets/sfx/transaction_fail.mp3`,
  transaction_fail2: `${BASE_URL}/assets/sfx/transaction_fail2.mp3`,
  transaction_success: `${BASE_URL}/assets/sfx/transaction_success.mp3`,
  transaction_success2: `${BASE_URL}/assets/sfx/transaction_success2.mp3`,
  typing_sound: `${BASE_URL}/assets/sfx/typing_sound.mp3`,
  typing_sound2: `${BASE_URL}/assets/sfx/typing_sound2.mp3`,
  typing_sound4: `${BASE_URL}/assets/sfx/typing_sound4.mp3`,
  core_hit: `${BASE_URL}/assets/sfx/coreHit.mp3`,
  core_hit2: `${BASE_URL}/assets/sfx/coreHit2.mp3`,
  core_hit3: `${BASE_URL}/assets/sfx/coreHit3.mp3`,
};
