import { create } from "zustand";

type ConnectionStatus = "idle" | "connecting" | "open" | "reconnecting";
type ConnectionState = { status: ConnectionStatus; setStatus: (status: ConnectionStatus) => void };

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));
