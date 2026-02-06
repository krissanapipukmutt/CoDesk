export const LoadingState = ({ label = 'กำลังโหลด...' }: { label?: string }) => (
  <div className="card p-6 text-center text-slate-500">{label}</div>
);

export const EmptyState = ({ label = 'ไม่พบข้อมูล' }: { label?: string }) => (
  <div className="card p-6 text-center text-slate-400">{label}</div>
);

export const ErrorState = ({ label = 'เกิดข้อผิดพลาด' }: { label?: string }) => (
  <div className="card p-6 text-center text-rose">{label}</div>
);
