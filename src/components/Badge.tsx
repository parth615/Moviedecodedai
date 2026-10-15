export function Badge({ status }: { status: string }) {
  const getStyle = (s: string) => {
    switch (s) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'RESEARCHED':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SCRIPTED':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'FACT_CHECKED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${getStyle(status)}`}>
      {status}
    </span>
  );
}
