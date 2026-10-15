'use client';

import { useState, useRef } from 'react';
import { Plus, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setStatus('idle');
    setErrorMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/upload-gameplay', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(data.error || `Upload failed with status ${res.status}`);
      }

      setStatus('success');
      formRef.current?.reset();
      // Reload the page after a short delay so the new asset shows up
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-emerald-500" /> Add New Asset
      </h2>

      {status === 'success' && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4" /> Video uploaded successfully! Refreshing...
        </div>
      )}

      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
          <input required type="text" name="title" placeholder="e.g. Minecraft Parkour 1" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Video File (MP4)</label>
          <input required type="file" name="file" accept="video/*" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Duration (Seconds)</label>
          <input required type="number" name="duration" placeholder="300" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Tags (Comma separated)</label>
          <input type="text" name="tags" placeholder="minecraft, parkour, fast" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">License Info</label>
          <input type="text" name="license" placeholder="Creative Commons" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Save Asset
            </>
          )}
        </button>
      </form>
    </div>
  );
}
