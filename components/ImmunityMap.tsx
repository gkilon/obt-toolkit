import React from 'react';
import Column from './Column';
import { ColumnId, MapData, Column3Data } from '../types';

interface ImmunityMapProps {
    mapData: MapData;
    onValueChange: (columnId: ColumnId, value: string | string[] | Column3Data) => void;
    focusedColumn: ColumnId;
}

const ImmunityMap: React.FC<ImmunityMapProps> = ({ mapData, onValueChange, focusedColumn }) => {
  const columnsConfig = [
    { id: ColumnId.Goal, title: "1. מטרת השיפור", description: "מהי המטרה החשובה ביותר שאת/ה מחויב/ת להשיג, ושתהווה שינוי משמעותי עבורך?" },
    { id: ColumnId.Behaviors, title: "2. מה אני עושה/לא עושה", description: "אילו התנהגויות (פעולות או מחדלים) שלך מונעות ממך להשיג את המטרה?" },
    { id: ColumnId.HiddenCommitments, title: "3. חששות והתחייבויות נסתרות", description: "בשלב זה נחשוף את המנוע הרגשי ששומר על ההתנהגויות שלך במקום." },
    { id: ColumnId.BigAssumptions, title: "4. הנחות יסוד גדולות", description: "בהינתן ההתחייבויות הנסתרות שלך, איזו הנחה עמוקה את/ה מחזיק/ה כאמת מוחלטת על עצמך או על העולם?" },
  ];

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {columnsConfig.map(col => {
          return (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              description={col.description}
              value={mapData[col.id]}
              onValueChange={(value) => onValueChange(col.id, value)}
              isFocused={focusedColumn === col.id}
            />
          );
        })}
      </div>
  );
};

export default ImmunityMap;