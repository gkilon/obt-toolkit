export enum ColumnId {
  Goal = 1,
  Behaviors = 2,
  HiddenCommitments = 3,
  BigAssumptions = 4,
  Summary = 5,
}

export type Column3Data = {
  worries: string;
  commitments: string;
};

export type MapData = {
  [ColumnId.Goal]: string;
  [ColumnId.Behaviors]: string[];
  [ColumnId.HiddenCommitments]: Column3Data;
  [ColumnId.BigAssumptions]: string;
};

export type ChatMessage = {
    sender: 'user' | 'ai';
    text: string;
}
