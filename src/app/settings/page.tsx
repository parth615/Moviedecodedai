import { getAllSettings } from '@/lib/settings';
import { updateSetting, pauseAutomation, resumeAutomation } from './actions';
import { AlertOctagon, Settings2, PlayCircle, StopCircle, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getAllSettings();
  const isPaused = settings.AUTOMATION_PAUSED === 'true';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-blue-500" />
            System Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">Configure production behaviors and global limits</p>
        </div>
        
        <form action={isPaused ? resumeAutomation : pauseAutomation}>
          <button 
            type="submit"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-colors ${
              isPaused 
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isPaused ? <PlayCircle className="w-5 h-5" /> : <StopCircle className="w-5 h-5" />}
            {isPaused ? 'RESUME AUTOMATION' : 'PAUSE ALL AUTOMATION'}
          </button>
        </form>
      </div>

      {isPaused && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-4 items-start">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-500">AUTOMATION IS CURRENTLY PAUSED</h3>
            <p className="text-sm text-red-400/80 mt-1">No new videos will be generated, researched, or published. Existing jobs in the queue will be held until resumed.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <SettingCard 
          title="Provider Mode" 
          description="Switch between real API calls and mock data generation."
          settingKey="PROVIDER_MODE"
          currentValue={settings.PROVIDER_MODE}
          options={['mock', 'production']}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingCard 
            title="Daily Video Limit" 
            description="Maximum number of videos to publish per day."
            settingKey="DAILY_VIDEO_LIMIT"
            currentValue={settings.DAILY_VIDEO_LIMIT}
            type="number"
          />
          <SettingCard 
            title="Daily Budget ($)" 
            description="Maximum API spend per day (LLM + TTS)."
            settingKey="DAILY_BUDGET"
            currentValue={settings.DAILY_BUDGET}
            type="number"
            step="0.01"
          />
          <SettingCard 
            title="Minimum QA Score" 
            description="Videos below this score are automatically rejected."
            settingKey="MINIMUM_QA_SCORE"
            currentValue={settings.MINIMUM_QA_SCORE}
            type="number"
          />
          <SettingCard 
            title="Minimum Research Confidence" 
            description="Topics below this score will not be scripted."
            settingKey="MINIMUM_RESEARCH_CONFIDENCE"
            currentValue={settings.MINIMUM_RESEARCH_CONFIDENCE}
            type="number"
          />
        </div>

        <SettingCard 
          title="Auto-Publish to YouTube" 
          description="When enabled, videos rendered during Auto-Pilot will be uploaded straight to YouTube Shorts."
          settingKey="AUTO_PUBLISH"
          currentValue={settings.AUTO_PUBLISH || 'true'}
          options={['true', 'false']}
        />
      </div>
    </div>
  );
}

function SettingCard({ 
  title, 
  description, 
  settingKey, 
  currentValue, 
  options,
  type = 'text',
  step
}: { 
  title: string, 
  description: string, 
  settingKey: string, 
  currentValue: string,
  options?: string[],
  type?: string,
  step?: string
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-200">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <form action={updateSetting} className="flex gap-2 min-w-[200px]">
          <input type="hidden" name="key" value={settingKey} />
          {options ? (
            <select 
              name="value" 
              defaultValue={currentValue}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
            </select>
          ) : (
            <input 
              type={type} 
              step={step}
              name="value" 
              defaultValue={currentValue}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          )}
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
