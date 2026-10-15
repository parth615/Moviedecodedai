import { prisma } from '@/lib/prisma';
import { deleteGameplayAsset } from './actions';
import UploadForm from './UploadForm';
import { Trash2, Film, Clock, Tag, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GameplayLibraryPage() {
  const assets = await prisma.gameplayAsset.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Film className="w-8 h-8 text-indigo-500" />
            Gameplay Asset Library
          </h1>
          <p className="text-slate-400 mt-2">Manage background gameplay loops for the Split-Screen Engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD ASSET FORM */}
        <div className="lg:col-span-1">
          <UploadForm />
        </div>

        {/* ASSET LIST */}
        <div className="lg:col-span-2 space-y-4">
          {assets.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
              <Film className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-white font-medium">No gameplay assets found</h3>
              <p className="text-slate-500 text-sm mt-1">Add your first video loop using the form.</p>
            </div>
          ) : (
            assets.map(asset => (
              <div key={asset.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start">
                
                {/* VIDEO PREVIEW */}
                <div className="w-full md:w-48 aspect-[9/16] bg-black rounded-lg overflow-hidden shrink-0 border border-slate-800">
                  <video src={asset.url} className="w-full h-full object-cover" controls preload="metadata" muted />
                </div>

                {/* DETAILS */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white leading-tight">{asset.title}</h3>
                    <form action={deleteGameplayAsset.bind(null, asset.id)}>
                      <button type="submit" className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title="Delete Asset">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      {asset.license || 'No License'}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-400 col-span-2">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <div className="flex flex-wrap gap-1">
                        {asset.tags ? asset.tags.split(',').map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">{tag.trim()}</span>
                        )) : <span className="text-slate-600 italic">No tags</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-mono break-all">{asset.url}</span>
                    <span className="text-xs font-medium px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full shrink-0">
                      Used {asset.usageCount} times
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
