import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white mt-12 py-4 border-t border-slate-200">
      <div className="container mx-auto px-4 text-center text-slate-500">
        <p>&copy; {new Date().getFullYear()} כלי OBT (One Big Thing). פותח בסיוע AI.</p>
      </div>
    </footer>
  );
};

export default Footer;