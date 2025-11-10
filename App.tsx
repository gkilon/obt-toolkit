import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImmunityMap from './components/ImmunityMap';
import Chatbot from './components/Chatbot';
import HistoryAccordion from './components/HistoryAccordion';
import { MapData, ColumnId, ChatMessage, Column3Data } from './types';

const MAP_DATA_STORAGE_KEY = 'immunityMapData';
const CHAT_HISTORY_STORAGE_KEY = 'chatHistory';

// Helper function to get data from localStorage safely
const getStoredData = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue) as T;
    }
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    localStorage.removeItem(key); // Clear corrupted data
  }
  return defaultValue;
};

const App: React.FC = () => {
    const [mapData, setMapData] = useState<MapData>(() => {
    const initialData: MapData = {
      [ColumnId.Goal]: '',
      [ColumnId.Behaviors]: [],
      [ColumnId.HiddenCommitments]: { worries: '', commitments: '' },
      [ColumnId.BigAssumptions]: '',
    };
    const stored = getStoredData<MapData>(MAP_DATA_STORAGE_KEY, initialData);
    if (typeof stored[ColumnId.Behaviors] === 'string') {
      const behaviorsString = stored[ColumnId.Behaviors] as unknown as string;
      stored[ColumnId.Behaviors] = behaviorsString.split('\n').filter(line => line.trim() !== '');
    }
    if (!Array.isArray(stored[ColumnId.Behaviors])) {
        stored[ColumnId.Behaviors] = [];
    }
    return stored;
  });
  
  const initialBotMessage: ChatMessage = {
      sender: 'ai',
      text: 'שלום! אני ה-"OBT Expert" שלך. אני כאן כדי לסייע לך למלא את מפת החסינות לשינוי שלך, שלב אחר שלב.\n\nבוא נתחיל עם **עמודה 1**: מהי המטרה החשובה ביותר שאת/ה מחויב/ת להשיג?'
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
      const storedHistory = getStoredData<ChatMessage[]>(CHAT_HISTORY_STORAGE_KEY, []);
      return storedHistory.length > 0 ? storedHistory : [initialBotMessage];
  });
  
  const [focusedColumn, setFocusedColumn] = useState<ColumnId>(ColumnId.Goal);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);

  // Save mapData to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MAP_DATA_STORAGE_KEY, JSON.stringify(mapData));
    } catch (error) {
      console.error(`Error writing mapData to localStorage:`, error);
    }
  }, [mapData]);

  // Save chatHistory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (error)      {
      console.error(`Error writing chatHistory to localStorage:`, error);
    }
  }, [chatHistory]);

  const handleValueChange = (columnId: ColumnId, value: string | string[] | Column3Data) => {
    setMapData(prev => ({ ...prev, [columnId]: value }));
  };

  const handleNewUserMessage = async (message: string) => {
    const newHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: message }];
    setChatHistory(newHistory);
    setIsBotTyping(true);

    try {
      const response = await fetch('/.netlify/functions/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newHistory,
          mapData: mapData,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      
      setChatHistory(prev => [...prev, { sender: 'ai', text: responseData.text }]);
      
      if (responseData.focusedColumn && Object.values(ColumnId).includes(responseData.focusedColumn)) {
        setFocusedColumn(responseData.focusedColumn as ColumnId);
      }

    } catch (error) {
      console.error('Error fetching bot response:', error);
       setChatHistory(prev => [...prev, { sender: 'ai', text: 'אופס, נתקלתי בבעיה. נוכל לנסות שוב?' }]);
    } finally {
        setIsBotTyping(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
         <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">מפת ה-OBT (One Big Thing) שלך</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              נהל/י דיאלוג עם מאמן ה-AI כדי לחשוף את הדינמיקה הנסתרת שמונעת ממך להשיג את מטרותיך.
            </p>
        </div>
        
        {/* Mobile Chat Overlay */}
        <div 
          className={`lg:hidden fixed inset-0 bg-black/40 z-10 transition-opacity ${isChatExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsChatExpanded(false)}
        ></div>

        <div className="flex flex-col lg:flex-row lg:gap-8 relative">
            {/* Desktop: Left side - Chatbot / Mobile: Bottom Sheet Chatbot */}
            <div className="lg:w-1/3 lg:sticky lg:top-24 lg:h-full">
                <Chatbot 
                    history={chatHistory} 
                    onNewMessage={handleNewUserMessage}
                    isBotTyping={isBotTyping}
                    isExpanded={isChatExpanded}
                    setIsExpanded={setIsChatExpanded}
                />
            </div>

            {/* Right side - Immunity Map. Added bottom padding for mobile to not be obscured by chatbot */}
            <div className="lg:w-2/3 pb-[140px] lg:pb-0">
                 <ImmunityMap 
                    mapData={mapData}
                    onValueChange={handleValueChange}
                    focusedColumn={focusedColumn}
                />
            </div>
        </div>

        <HistoryAccordion />
      </main>
      <Footer />
    </div>
  );
};

export default App;