export const getAssetPath = (path: string) =>
  `${import.meta.env.BASE_URL}${path}`;

// LOAD PORTRAITS //////////////////////

const portraitImages = import.meta.glob(
  "/assets/img/portraits/*.{png,jpg,jpeg,gif}",
  { eager: true }
);

export const characterPortraits: string[] = Object.keys(portraitImages);

// LOAD IMAGES //////////////////////
export const imageFiles = {
  user: getAssetPath("/assets/img/user.png"),
  dot: getAssetPath("/assets/img/dot.png"),
  coffee: getAssetPath("/assets/img/coffee.png"),
  milk: getAssetPath("/assets/img/milk.png"),
  sugar: getAssetPath("/assets/img/sugar.png"),
  water: getAssetPath("/assets/img/water.png"),
  cursor: getAssetPath("/assets/img/cursor.png"),
  cafe: getAssetPath("/assets/img/cafe.jpg"),
  store: getAssetPath("/assets/img/store.jpg"),

  // webms
  cherry: getAssetPath("/assets/animation/cherry.webm"),
  banana: getAssetPath("/assets/animation/banana.webm"),
  watermelon: getAssetPath("/assets/animation/watermelon.webm"),
};
// LOAD SOUNDS //////////////////////
// export const BASE_URL = import.meta.env.BASE_URL || "";

export const soundFiles = {
  brew: getAssetPath("/assets/sfx/brew.mp3"),
  confirm: getAssetPath("/assets/sfx/confirm.mp3"),
  minor_button: getAssetPath("/assets/sfx/minor_button.mp3"),
  stop: getAssetPath("/assets/sfx/stop-13692.mp3"),
  transaction_fail: getAssetPath("/assets/sfx/transaction_fail.mp3"),
  transaction_fail2: getAssetPath("/assets/sfx/transaction_fail2.mp3"),
  transaction_success: getAssetPath("/assets/sfx/transaction_success.mp3"),
  transaction_success2: getAssetPath("/assets/sfx/transaction_success2.mp3"),
  typing_sound: getAssetPath("/assets/sfx/typing_sound.mp3"),
  typing_sound2: getAssetPath("/assets/sfx/typing_sound2.mp3"),
  typing_sound4: getAssetPath("/assets/sfx/typing_sound4.mp3"),
  core_hit: getAssetPath("/assets/sfx/coreHit.mp3"),
  core_hit2: getAssetPath("/assets/sfx/coreHit2.mp3"),
  core_hit3: getAssetPath("/assets/sfx/coreHit3.mp3"),
};
