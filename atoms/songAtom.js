import { atom } from "recoil";

/** Track Id state defines which track id is selected */
export const currentTrackIdState = atom({
  key: "currentTrackIdState", // unique id(with respect to other selectors)
  default: null,
});
/** If a song is playing or not */
export const isPlayingState = atom({
  key: "isPlayingState",
  default: false,
});
