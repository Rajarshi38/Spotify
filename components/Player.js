import { useSession } from "next-auth/react";
import React, { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import { currentTrackIdState, isPlayingState } from "../atoms/songAtom";
import useSpotify from "../hooks/useSpotify";
import useSongInfo from "../hooks/useSongInfo";
import { ReplyIcon, SwitchHorizontalIcon } from "@heroicons/react/outline";
import {
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
  VolumeOffIcon,
  VolumeUpIcon,
} from "@heroicons/react/solid";
import { debounce } from "lodash";

const Player = () => {
  const spotifyApi = useSpotify();
  const { data: session } = useSession();
  const [currentTrackId, setCurrentTrackId] =
    useRecoilState(currentTrackIdState);
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [volume, setVolume] = useState(50);
  const songInfo = useSongInfo();

  const fetchCurrentSong = () => {
    if (!songInfo) {
      spotifyApi.getMyRecentlyPlayedTracks().then((data) => console.log(data));
      spotifyApi.getMyCurrentPlayingTrack().then((data) => {
        setCurrentTrackId(data.body?.item.id);
        spotifyApi.getMyCurrentPlaybackState().then((data) => {
          setIsPlaying(data.body?.is_playing);
        });
      });
    }
  };

  /**
   * When no devices of spotify is online the player component show a placeholder of image with no image.
   * Fetch Recent Song will fill that placeholder but I can not figure out how to use that because if i use that
   * then When I refresh while a active device is on then the current playing song will be gone.   *
   * @note current playing song is based on recent minutes active
   * @note but recent playing song is not like that it gives the list of recently played songs within a timeframe which
   * is different from current playing song
   */
  const fetchRecentSong = () => {
    if (!songInfo) {
      spotifyApi.getMyRecentlyPlayedTracks().then((data) => {
        setCurrentTrackId(data.body?.items[0]?.track.id);
      });
    }
  };
  const handlePlayPause = () => {
    spotifyApi.getMyCurrentPlaybackState().then((data) => {
      if (data.body.is_playing) {
        spotifyApi.pause();
        setIsPlaying(false);
      } else {
        spotifyApi.play();
        setIsPlaying(true);
      }
    });
  };

  const skipPrevious = async () => {
    await spotifyApi.skipToPrevious();
    await spotifyApi.getMyCurrentPlayingTrack().then((data) => {
      setCurrentTrackId(data.body?.item.id);
    });
  };

  const skipNext = async () => {
    await spotifyApi.skipToNext();
    await spotifyApi.getMyCurrentPlayingTrack().then((data) => {
      setCurrentTrackId(data.body?.item.id);
    });
  };

  const debouncedAdjustVolume = useCallback(
    debounce((volume) => {
      spotifyApi.setVolume(volume).catch((err) => console.error(err));
    }, 500),

    [spotifyApi]
  );

  useEffect(() => {
    if (spotifyApi.getAccessToken() && !currentTrackId) {
      fetchCurrentSong();
      setVolume(50);
    }
  }, [currentTrackId, spotifyApi, session]);

  useEffect(() => {
    if (volume > 0 && volume < 100) {
      debouncedAdjustVolume(volume);
    }
  }, [volume]);
  return (
    <div className="h-24 bg-gradient-to-b from-black to-gray-900  text-white font-body grid grid-cols-3 text-xs md:text-base px-2 md:px-8">
      {/* Left */}
      <div className="flex items-center space-x-4">
        <img
          className="hidden md:inline h-10 w-10"
          src={songInfo?.album.images?.[0]?.url}
          alt=""
        />

        <div>
          <h3>{songInfo?.name}</h3>
          <p>{songInfo?.artists?.[0]?.name}</p>
        </div>
      </div>
      {/* Center */}
      <div className="flex items-center justify-evenly">
        <SwitchHorizontalIcon className="button" />
        {/** SpotifyApi.skipToPrevious() - api not working */}
        <RewindIcon onClick={skipPrevious} className="button" />
        {isPlaying ? (
          <PauseIcon onClick={handlePlayPause} className="button w-10 h-10" />
        ) : (
          <PlayIcon onClick={handlePlayPause} className="button w-10 h-10" />
        )}
        <FastForwardIcon onClick={skipNext} className="button" />
        <ReplyIcon className="button" />
      </div>

      {/* Right */}

      <div className="flex items-center space-x-3 md:space-x-4 justify-end pr-5">
        <VolumeOffIcon
          className="button"
          onClick={() => volume > 0 && setVolume(volume - 10)}
        />
        <input
          className="w-14 md:w-28"
          value={volume}
          type="range"
          onChange={(e) => setVolume(e.target.value)}
          min={0}
          max={100}
        />
        <VolumeUpIcon
          className="button"
          onClick={() => volume < 100 && setVolume(volume + 10)}
        />
      </div>
    </div>
  );
};

export default Player;
