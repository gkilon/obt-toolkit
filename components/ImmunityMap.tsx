import React, { useState, useCallback, useEffect } from 'react';
import Column from './Column';
import SummaryModal from './SummaryModal';
import { ColumnId, MapData, InsightsData, Column3Data } from '../types';

const MAP_DATA_STORAGE_KEY = 'immunityMapData';
const INSIGHTS_DATA_STORAGE_KEY = 'immunityInsightsData';

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


const ImmunityMap: React.FC = () => {
  const [mapData, setMapData] = useState<MapData>(() => getStoredData<MapData>(MAP_DATA_STORAGE_KEY, {
    [ColumnId.Goal]: '',
    [ColumnId.Behaviors]: '',
    [ColumnId.HiddenCommitments]: { worries: '', commitments: '' },
    [ColumnId.BigAssumptions]: '',
  }));

  const [insightsData, setInsightsData] = useState<InsightsData>(() => getStoredData<InsightsData>(INSIGHTS_DATA_STORAGE_KEY, {}));
  
  const [loadingColumn, setLoadingColumn] = useState<ColumnId | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);


  // Save mapData to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MAP_DATA_STORAGE_KEY, JSON.stringify(mapData));
    } catch (error) {
      console.error(`Error writing mapData to localStorage:`, error);
    }
  }, [mapData]);

  // Save insightsData to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INSIGHTS_DATA_STORAGE_KEY, JSON.stringify(insightsData));
    } catch (error)      {
      console.error(`Error writing insightsData to localStorage:`, error);
    }
  }, [insightsData]);
  

  const handleValueChange = (columnId: ColumnId, value: string | Column3Data) => {
    setMapData(prev => ({ ...prev, [columnId]: value }));
  };

  const handleMapUpdate = (newData: MapData) => {
    setMapData(newData);
  };

  const handleGetInsights = useCallback(async (columnId: ColumnId) => {
    setLoadingColumn(columnId);
    setInsightsData(prev => ({ ...prev, [columnId]: '' }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/.netlify/functions/get-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, mapData }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
      }
      
      const text = await response.text();
      setInsightsData(prev => ({ ...prev, [columnId]: text }));

    } catch (error) {
      console.error("Error fetching insights:", error);
      let userErrorMessage = "אירעה שגיאה כללית. אנא נסה שוב מאוחר יותר.";
      if (error instanceof Error) {
          if (error.name === 'AbortError') {
              userErrorMessage = "**השרת לא הגיב בזמן.**\n\nזה קורה לפעמים כשהשרת 'מתעורר'. אנא נסה/י שוב בעוד מספר רגעים.";
          } else if(error.message.includes("API_KEY is missing")) {
            userErrorMessage = "שגיאה: מפתח ה-API אינו מוגדר נכון בסביבת השרת. יש לוודא שהוגדר כראוי בהגדרות Netlify.";
          } else if (error.message.includes("Failed to fetch")) {
             userErrorMessage = "**החיבור לשרת נכשל.**\n\nייתכן שמדובר בתקלה זמנית או בעומס. אנא ודא/י שחיבור האינטרנט שלך יציב ונסה/י שוב בעוד מספר רגעים.";
          }
          else {
            userErrorMessage = `אירעה שגיאה: ${error.message}`;
          }
      }
      setInsightsData(prev => ({ ...prev, [columnId]: userErrorMessage }));
    } finally {
      clearTimeout(timeoutId);
      setLoadingColumn(null);
    }
  }, [mapData]);

  const handleGetSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryContent('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('/.netlify/functions/get-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: ColumnId.Summary, mapData }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
      }
      
      const text = await response.text();
      setSummaryContent(text);

    } catch (error) {
        console.error("Error fetching summary:", error);
        let userErrorMessage = "אירעה שגיאה כללית. אנא נסה שוב מאוחר יותר.";
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                userErrorMessage = "**השרת לא הגיב בזמן.**\n\nזה קורה לפעמים כשהשרת 'מתעורר'. אנא נסה/י שוב בעוד מספר רגעים.";
            } else {
                userErrorMessage = `**אירעה שגיאה בקבלת הסיכום:** ${error.message}`;
            }
        }
        setSummaryContent(userErrorMessage);
    } finally {
        clearTimeout(timeoutId);
        setIsSummaryLoading(false);
    }
  }, [mapData]);


  const columnsConfig = [
    { id: ColumnId.Goal, title: "1. מטרת השיפור", description: "מהי המטרה החשובה ביותר שאת/ה מחויב/ת להשיג, ושתהווה שינוי משמעותי עבורך?", dependsOn: [] },
    { id: ColumnId.Behaviors, title: "2. מה אני עושה/לא עושה", description: "אילו התנהגויות (פעולות או מחדלים) שלך מונעות ממך להשיג את המטרה?", dependsOn: [ColumnId.Goal] },
    { id: ColumnId.HiddenCommitments, title: "3. חששות והתחייבויות נסתרות", description: "בשלב זה נחשוף את המנוע הרגשי ששומר על ההתנהגויות שלך במקום.", dependsOn: [ColumnId.Goal, ColumnId.Behaviors] },
    { id: ColumnId.BigAssumptions, title: "4. הנחות יסוד גדולות", description: "בהינתן ההתחייבויות הנסתרות שלך, איזו הנחה עמוקה את/ה מחזיק/ה כאמת מוחלטת על עצמך או על העולם?", dependsOn: [ColumnId.Goal, ColumnId.Behaviors, ColumnId.HiddenCommitments] },
  ];

  const isDependencyEmpty = (depId: ColumnId): boolean => {
    if (depId === ColumnId.HiddenCommitments) {
        const { worries, commitments } = mapData[depId];
        return !worries.trim() || !commitments.trim();
    }
    const value = mapData[depId as Exclude<ColumnId, ColumnId.HiddenCommitments | ColumnId.Summary>];
    return !value.trim();
  };

  const isCurrentColumnEmpty = (colId: ColumnId): boolean => {
      if (colId === ColumnId.HiddenCommitments) {
        const { worries, commitments } = mapData[colId];
        return !worries.trim() || !commitments.trim();
    }
    const value = mapData[colId as Exclude<ColumnId, ColumnId.HiddenCommitments | ColumnId.Summary>];
    return !value.trim();
  };

  const areAllColumnsFilled = columnsConfig.every(col => !isCurrentColumnEmpty(col.id));


  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start">
        {columnsConfig.map(col => {
          const isButtonDisabled = isCurrentColumnEmpty(col.id) || col.dependsOn.some(isDependencyEmpty);
          return (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              description={col.description}
              value={mapData[col.id]}
              onValueChange={(value) => handleValueChange(col.id, value)}
              onGetInsights={() => handleGetInsights(col.id)}
              insights={insightsData[col.id]}
              isLoading={loadingColumn === col.id}
              isButtonDisabled={isButtonDisabled}
            />
          );
        })}
      </div>
      
      {areAllColumnsFilled && (
        <div className="text-center mt-20 animate-fade-in-slow">
          <p className="text-xl text-slate-800 mb-2 font-semibold">כל הכבוד! השלמת את מפת ה-OBT שלך.</p>
          <p className="text-slate-600 mb-6">השלב הבא הוא לסכם, לנתח, ולתכנן את הצעדים הבאים שלך.</p>
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            disabled={loadingColumn !== null}
            className="bg-blue-600 text-white font-bold py-4 px-8 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center mx-auto shadow-xl text-lg"
          >
              <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 3l6-3m0 0l6-3m-6 3V7" />
              </svg>
              פתח לוח סיכום וניתוח
              </>
          </button>
        </div>
      )}

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        mapData={mapData}
        onMapUpdate={handleMapUpdate}
        summaryContent={summaryContent}
        isSummaryLoading={isSummaryLoading}
        onGetSummary={handleGetSummary}
      />
      <style>{`
        @keyframes fade-in-slow {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-slow {
            animation: fade-in-slow 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ImmunityMap;