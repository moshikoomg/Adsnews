# סטודיו וידאו לעסקים

אפליקציית Web מובייל-פירסט (בסגנון טיקטוק) לצילום, עריכה אוטומטית והפצה של סרטונים.
React 18 + Vite + Tailwind, ניהול state עם Zustand, מוכן ל-Supabase (עובד גם בלי, במצב הדגמה).

## הרצה

```bash
npm install
npm run dev        # פותח על http://localhost:5173 (גם ברשת המקומית, לבדיקה בטלפון)
```

מצלמה בטלפון דורשת HTTPS. לבדיקה מהנייד: `npx vite --host` דרך מנהרה (ngrok / cloudflared) או פריסה ל-Vercel/Netlify.

## הזרימה

1. **בית**: "צלם סרטון" או "העלה סרטון קיים".
2. **צילום**: מצלמה קדמית + מיקרופון, החזק כדי להקליט ושחרר לסיום. טלפרומפטר צף (תסריט מלא או נקודות) שגולל לפי זיהוי דיבור (Web Speech API), ואם אין תמיכה – לפי מילים לדקה. "זוג עיניים" צמוד לעדשה.
3. **סטודיו עריכה**: תצוגה מקדימה חיה + מגירה תחתונה עם 5 לשוניות: סגנון ומותג, כתוביות, מעברים ו-B-Roll, אודיו, בקשת AI חופשית.
4. **ברירות מחדל**: בכל לשונית יש כפתור 📍 "סמן כברירת מחדל". "שמור נעוצים" שומר רק את המקטעים שסימנת (או הכל, אם לא סימנת כלום). כל סרטון הבא (מצולם או מועלה) נפתח אוטומטית עם ההגדרות האלה. נשמר ב-localStorage, ובטבלת `user_defaults` כשמחוברים ל-Supabase.
5. **יצירה והפצה**: בונה פקודת רינדור JSON, שולח ל-Backend, מציג התקדמות, ואז "שגר לכל הפלטפורמות".

## מבנה

```
src/
  store/useStudio.js        ← כל ה-state: מקור, תמלול, הגדרות, ברירות מחדל, רינדור
  lib/defaults.js           ← מבנה ההגדרות (FACTORY_SETTINGS)
  lib/presets.js            ← תבניות עסק, פונטים, חבילות אייקונים לפי תחום, מעברים, פלטפורמות
  lib/captions.js           ← תמלול (Edge Function או דמה) + חלוקה לשורות
  lib/renderJob.js          ← buildRenderJob (לוגיקה טהורה, משותפת ל-Frontend ולרינדור)
  lib/dispatch.js           ← dispatchRenderJob / publishToPlatforms
  hooks/useCamera.js        ← getUserMedia
  hooks/useHoldToRecord.js  ← MediaRecorder בלחיצה רציפה
  hooks/useSpeechFollow.js  ← מעקב דיבור לטלפרומפטר
  components/record/        ← EyesIndicator, Teleprompter, RecordButton
  components/editor/        ← PreviewPlayer (כתוביות קריוקי, אמוג'י, זום), panels
  components/common/        ← BottomSheet, רכיבי UI
  screens/                  ← Home, Record, Editor, Publish
supabase/
  migrations/0001_init.sql  ← user_defaults, render_jobs (+RLS, realtime), bucket videos
  functions/render-video    ← מקבל את ה-JSON ומעביר למנוע הרינדור (RENDERER_URL)
  functions/transcribe      ← Whisper עם חותמות זמן למילים
  functions/publish-video   ← מתאמים לכל רשת
render-job.schema.json      ← ה-JSON Schema של פקודת הרינדור
renderer/                   ← מנוע הרינדור (Remotion) + שירות HTTP + Dockerfile
```

## פקודת הרינדור (RenderJob)

`buildRenderJob()` ב-`src/lib/renderJob.js` מחבר את חומר הגלם להגדרות:

- `timeline.segments` – המקטעים שנשארים אחרי חיתוך שתיקות (זמן מקור → זמן פלט), כולל zoom ל-Jump-cuts.
- `timeline.transitions` – מעבר בין כל שני מקטעים.
- `captions.words / lines` – מילים עם זמנים **אחרי** החיתוך, מוכן להדגשת קריוקי.
- `overlays` – אמוג'י / תמונות / וידאו B-Roll שקופצים לפי מילות מפתח, ולוגו.
- `audio`, `style.brand`, `ai.customPrompt`, `publish.targets`.

לחץ `{ } JSON` במסך ההפצה כדי לראות ולהעתיק את הפקודה.

## חיבור Supabase

```bash
cp .env.example .env.local     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
supabase db push
supabase functions deploy render-video transcribe publish-video
supabase secrets set OPENAI_API_KEY=... RENDERER_URL=... RENDERER_TOKEN=...
```

הרינדור עצמו לא רץ בתוך Edge Function (מגבלת זמן). `RENDERER_URL` הוא שירות Remotion Lambda או שרת FFmpeg שקורא את ה-JSON ומעדכן את `render_jobs` (status, progress, output_url). ה-Frontend מאזין לעדכונים ב-Realtime.

## מנוע הרינדור (renderer/)

קומפוזיציית Remotion שמקבלת RenderJob ומייצרת MP4 אמיתי:

- `src/layers/Segments.jsx` – כל מקטע מנגן את הטווח שלו מהמקור (חיתוך שתיקות), עם זום Jump-cut ומעבר כניסה (Zoom In/Out, Fade, Cut).
- `src/layers/Captions.jsx` – קריוקי / מילה-מילה / משפט, בפונט ובצבעי המותג, במיקום ובגודל שנבחרו.
- `src/layers/Overlays.jsx` – אמוג'י שקופצים, תמונות, B-Roll וידאו ולוגו.
- מוזיקת רקע לפי `MUSIC_LIBRARY` (מזהה רצועה ← URL).
- `server.mjs` – שירות HTTP (`POST /render`) עם תור. מרנדר, מעלה ל-`videos/rendered/` ומעדכן את `render_jobs` (progress, status, output_url). ה-Frontend מקבל את העדכון ב-Realtime ומציג את הסרטון המוכן.

```bash
cd renderer && npm install
node make-sample-job.mjs energetic   # בונה פקודה לדוגמה עם אותו buildRenderJob של ה-Frontend
npm run render:sample                # → out/sample.mp4
npm run studio                       # Remotion Studio לצפייה ועריכה של הקומפוזיציה
npm start                            # שירות הרינדור על פורט 8080
```

משתני סביבה לשירות: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RENDERER_TOKEN`, `MUSIC_LIBRARY`.
פריסה: `docker build -f renderer/Dockerfile .` ל-Railway / Fly.io / Cloud Run, ואז `supabase secrets set RENDERER_URL=https://... RENDERER_TOKEN=...`.
לעומסים גבוהים אפשר לעבור ל-Remotion Lambda בלי לשנות את הקומפוזיציה.

> שים לב: Remotion דורש רישיון חברה לעסקים עם יותר מ-3 עובדים (remotion.dev/license).

## מה עוד חסר (צעדים הבאים)

- התחברות משתמשים (Supabase Auth) ו-OAuth לכל רשת חברתית.
- תרגום הבקשה החופשית לפעולות עריכה (LLM) בתוך `resolvePrompt`.

## במאי ה-AI (עריכה אוטומטית)

הזרימה המרכזית: מצלמים או מעלים סרטון, כותבים בבריף מה רוצים (ואפשר להוסיף סרטון השראה), והמערכת מייצרת את כל העריכה לבד.

- `src/lib/director/plan.js` – מבנה EditPlan: כותרת פתיחה, מילים מודגשות, זום ברגעים, אימוג'י ומדבקות, קריאה לפעולה, סגנון וכתוביות.
- `supabase/functions/ai-director` – Claude מקבל פריימים מהסרטון, תמלול עם זמנים, הבקשה וסרטון ההשראה, ומחזיר EditPlan. צריך `supabase secrets set ANTHROPIC_API_KEY=...`.
- `src/lib/director/local.js` – במאי מקומי לפי כללים, כשאין שרת (זה מה שרץ כרגע באתר).
- `src/lib/frames.js` – דגימת פריימים וניתוח השראה (פלטה וקצב).
- תיקונים בצ'אט ("בלי זום", "תגדיל את הטקסט") מריצים את הבמאי שוב עם כל הבקשות, כשהאחרונה גוברת.
- הבריף וההשראה יכולים להישמר כברירת מחדל, ואז כל סרטון חדש נערך אוטומטית באותו סגנון.
