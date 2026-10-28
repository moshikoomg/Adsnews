import { Composition } from 'remotion';
import { RenderJobVideo } from './RenderJobVideo.jsx';
import { jobDurationSec } from './timing.js';
import sampleJob from '../sample-job.json';

// גודל, fps ואורך נגזרים מפקודת הרינדור עצמה
const calculateMetadata = ({ props }) => {
  const { fps, width, height } = props.job.output;
  return { fps, width, height, durationInFrames: Math.max(1, Math.ceil(jobDurationSec(props.job) * fps)) };
};

export const RemotionRoot = () => (
  <Composition
    id="RenderJob"
    component={RenderJobVideo}
    defaultProps={{ job: sampleJob }}
    calculateMetadata={calculateMetadata}
    fps={30}
    width={1080}
    height={1920}
    durationInFrames={300}
  />
);
