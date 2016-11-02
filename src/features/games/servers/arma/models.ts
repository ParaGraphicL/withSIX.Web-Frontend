export enum SessionState {
  None,
  SelectingMission,
  EditingMission,
  AssigningRoles,
  SendingMission,
  LoadingGame,
  Briefing,
  Playing,
  Debriefing,
  MissionAborted
}

export enum AiLevel {
  Novice,
  Normal,
  Expert,
  Custom
}

export enum Difficulty {
  Recruit,
  Regular,
  Veteran,
  Custom
}

export enum Dlcs {
  Apex = 16,
    Helicopters = 4,
    Karts = 2,
    Marksmen = 8,
    None = 0,
    Tanoa = 32,
    Zeus = 1
}

export enum HelicopterFlightModel {
  Basic,
  Advanced
}

export enum BattlEye {
  Off,
  On
}

// TODO: EnumConverter
