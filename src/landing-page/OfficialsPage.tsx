
import { Navbar } from './Navbar';
import { useEffect } from 'react';
import Officials from './Officials';

const OfficialsPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-20">
        <Officials />
      </main>
    </>
  );
};

export default OfficialsPage;
