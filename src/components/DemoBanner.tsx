const DemoBanner = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="bg-indigo text-white text-sm py-2 px-4 text-center">
      DEMO MODE: ข้อมูลตัวอย่างกำลังถูกใช้งาน
    </div>
  );
};

export default DemoBanner;
