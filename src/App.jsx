import { useStudio } from './store/useStudio';
import HomeScreen from './screens/HomeScreen';
import RecordScreen from './screens/RecordScreen';
import EditorScreen from './screens/EditorScreen';
import PublishScreen from './screens/PublishScreen';

const SCREENS = { home: HomeScreen, record: RecordScreen, editor: EditorScreen, publish: PublishScreen };

export default function App() {
  const screen = useStudio((s) => s.screen);
  const Screen = SCREENS[screen] ?? HomeScreen;
  return (
    <div className="mx-auto h-full max-w-md relative overflow-hidden bg-black">
      <Screen />
    </div>
  );
}
