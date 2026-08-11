import "./index.css";
import { Composition, Folder } from "remotion";
import { GiverDemo } from "./GiverDemo";
import { SceneLogo } from "./scenes/SceneLogo";
import { SceneUpload } from "./scenes/SceneUpload";
import { SceneDashboard } from "./scenes/SceneDashboard";
import { ScenePerson } from "./scenes/ScenePerson";
import { SceneCards } from "./scenes/SceneCards";
import { SceneEnd } from "./scenes/SceneEnd";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GiverDemo"
        component={GiverDemo}
        durationInFrames={947}
        fps={60}
        width={WIDTH}
        height={HEIGHT}
      />
      <Folder name="GiverDemo-Scenes">
        <Composition
          id="SceneLogo"
          component={SceneLogo}
          durationInFrames={Math.round(12.0 * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="SceneUpload"
          component={SceneUpload}
          durationInFrames={Math.round(4.2 * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="SceneDashboard"
          component={SceneDashboard}
          durationInFrames={Math.round(6.2 * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="ScenePerson"
          component={ScenePerson}
          durationInFrames={Math.round(4.4 * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="SceneCards"
          component={SceneCards}
          durationInFrames={Math.round(5.2 * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="SceneEnd"
          component={SceneEnd}
          durationInFrames={Math.round(2.8 * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
    </>
  );
};
