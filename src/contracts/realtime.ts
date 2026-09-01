export const SCHEMA_VERSION = 1 as const;

export type ClientMessage =
  | { type: "connection.heartbeat"; schema_version: 1; payload: Record<string, never> }
  | {
      type: "game.command";
      schema_version: 1;
      command_id: string;
      match_id: string;
      expected_version: number;
      payload: { command: string; [key: string]: unknown };
    };

export type ServerMessage =
  | {
      type: "game.state";
      schema_version: 1;
      match_id: string;
      state_version: number;
      server_time: string;
      deadline: string | null;
      payload: unknown;
    }
  | {
      type:
        | "command.accepted"
        | "command.rejected"
        | "room.state"
        | "game.event"
        | "presence.changed"
        | "timer.warning"
        | "connection.heartbeat"
        | "resync.required";
      schema_version: 1;
      payload: unknown;
    };
