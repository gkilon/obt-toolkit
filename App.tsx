import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImmunityMap from './components/ImmunityMap';
import HistoryAccordion from './components/HistoryAccordion';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">מפת ה-OBT (One Big Thing) שלך</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            כלי אינטראקטיבי זה ינחה אותך, צעד אחר צעד, בתהליך לחשיפת הדינמיקה הנסתרת שמונעת ממך להשיג את מטרותיך החשובות ביותר.
          </p>
           <div className="inline-block bg-slate-200 text-slate-700 text-sm rounded-full px-4 py-1.5 mt-6 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1.5 align-text-bottom" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            ההתקדמות שלך נשמרת אוטומטית בדפדפן
          </div>
        </div>
        <ImmunityMap />
        <HistoryAccordion />
      </main>
      <Footer />
    </div>
  );
};

export default App;