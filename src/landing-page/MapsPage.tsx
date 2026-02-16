
import { Navbar } from './Navbar';
import { useEffect } from 'react';
import Maps from './Maps';
import { useLocation } from 'react-router-dom';


const MapsPage = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-20">
        {/* Force remount on navigation to fix Google Map not displaying */}
        <Maps key={location.key} />
      </main>
    </>
  );
};

export default MapsPage;