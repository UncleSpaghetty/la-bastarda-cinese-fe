import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { apiErrorMessage } from "@/lib/api/client";
import { RealtimeClient } from "@/lib/realtime/realtime-client";
import { useConnectionStore } from "@/stores/connection-store";

import { getMatch, sendCommand } from "../api";
import type { MatchState } from "../api";
import { assignPlayerSeats } from "../game-layout";
import { useGameAnimations } from "../use-game-animations";

const specialCards: Record<string, string[]> = {
  "2": [
    "Due trasparente: regole azzerate, talento ancora da trovare.",
    "Un 2 salva tutti. Perfino chi non lo meritava.",
    "Reset totale. La strategia era sopravvalutata comunque.",
  ],
  "7": [
    "Sette bastardo: adesso si vola basso. Come le aspettative.",
    "Sotto il sette, proprio dove sta il livello del tavolo.",
    "Il 7 ha abbassato l'asticella. Finalmente alla vostra portata.",
  ],
  "8": [
    "Otto! Il prossimo salta. Una pausa dalla sua mediocrità.",
    "Turno saltato. Il tavolo ringrazia.",
    "L'8 ti ha ignorato con la stessa eleganza del gruppo chat.",
  ],
  "10": [
    "Dieci: tavolo bruciato. Restano solo le vostre pessime scelte.",
    "Pulizia completa. Per la dignità è troppo tardi.",
    "Il 10 cancella il tavolo, non gli errori che vi hanno portato qui.",
  ],
  A: [
    "Asso servito. Scegli a chi rovinare la giornata.",
    "Un asso e improvvisamente tutti evitano il contatto visivo.",
    "Passa il disastro a un amico. È questo il senso dell'amicizia.",
  ],
};
const collectMessages = [
  "Tavolo raccolto. Un souvenir davvero ingombrante.",
  "Hai preso tutto. L'avidità, almeno, non ti manca.",
  "Che bella mano piena. Peccato sia piena di problemi.",
  "Raccogliere il tavolo: la passeggiata della vergogna, ma con le carte.",
];
const rankOrder = ["3", "4", "5", "6", "7", "8", "9", "J", "Q", "K", "2", "10", "A"];
const sortCards = (cards: MatchState["payload"]["table_cards"]) =>
  [...cards].sort(
    (a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank) || a.suit.localeCompare(b.suit)
  );
const alwaysPlayable = new Set(["2", "10", "A"]);
const ordinaryStrength: Record<string, number> = {
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  J: 11,
  Q: 12,
  K: 13,
};

function isCardLegal(
  card: MatchState["payload"]["table_cards"][number],
  payload: MatchState["payload"]
) {
  if (payload.phase === "ACE_RESPONSE") return alwaysPlayable.has(card.rank);
  const constraint = payload.constraint;
  if (alwaysPlayable.has(card.rank) || !constraint?.rank) return true;
  if (!(card.rank in ordinaryStrength)) return false;
  if (constraint.lower_or_equal_seven) return ordinaryStrength[card.rank] <= 7;
  return (
    !(constraint.rank in ordinaryStrength) ||
    ordinaryStrength[card.rank] >= ordinaryStrength[constraint.rank]
  );
}

/** All state, effects and command handlers powering the match table page. */
export function useMatch() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const state = useQuery({
    queryKey: ["match", id],
    queryFn: () => getMatch(id),
    refetchInterval: 2_000,
  });
  const { animations, suppressNextAnimation } = useGameAnimations(state.data);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; tone?: "success" | "error" }>();
  const [specialNotice, setSpecialNotice] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1366px)").matches
  );
  const lastNoticeSequence = useRef<number | undefined>(undefined);
  const noticeInitialized = useRef(false);
  const autoCollectedVersion = useRef<number | undefined>(undefined);
  const setConnection = useConnectionStore((value) => value.setStatus);

  useEffect(() => {
    const base = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/v1";
    const socket = new RealtimeClient({
      url: `${base}/matches/${id}/`,
      onStatus: setConnection,
      onMessage: (message) => {
        if (message.type === "game.state")
          queryClient.setQueryData(["match", id], message as MatchState);
        if (message.type === "resync.required") {
          suppressNextAnimation();
          queryClient.invalidateQueries({ queryKey: ["match", id] });
        }
      },
    });
    socket.connect();
    return () => socket.disconnect();
  }, [id, queryClient, setConnection, suppressNextAnimation]);

  useEffect(() => {
    if (!feedback && !specialNotice) return;
    const timer = window.setTimeout(() => {
      setFeedback(undefined);
      setSpecialNotice(undefined);
    }, 4_500);
    return () => window.clearTimeout(timer);
  }, [feedback, specialNotice]);

  useEffect(() => {
    const latest = state.data?.payload.recent_events?.[0];
    if (!noticeInitialized.current) {
      noticeInitialized.current = true;
      lastNoticeSequence.current = latest?.sequence;
      return;
    }
    if (!latest) return;
    if (latest.sequence <= (lastNoticeSequence.current ?? 0)) return;
    lastNoticeSequence.current = latest.sequence;
    if (latest.payload.special_message) setSpecialNotice(latest.payload.special_message);
    else if (latest.type === "cards.played") {
      const special = latest.payload.cards?.find((card) => specialCards[card.rank]);
      if (special)
        setSpecialNotice(
          specialCards[special.rank][latest.sequence % specialCards[special.rank].length]
        );
    } else if (latest.type === "table.collected")
      setSpecialNotice(collectMessages[latest.sequence % collectMessages.length]);
  }, [state.data?.payload.recent_events]);

  const mutation = useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: object }) =>
      sendCommand(id, state.data!.state_version, name, payload),
    onSuccess: () => {
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["match", id] });
    },
    onError: (error) => {
      setFeedback({
        message: apiErrorMessage(error, "Questa mossa non è consentita."),
        tone: "error",
      });
      queryClient.invalidateQueries({ queryKey: ["match", id] });
    },
  });

  useEffect(() => {
    const match = state.data;
    if (!match || mutation.isPending || autoCollectedVersion.current === match.state_version)
      return;
    const player = match.payload.players.find((item) => item.private_hand !== undefined);
    if (
      !player ||
      player.seat_index !== match.payload.turn_seat ||
      !["TURN", "ACE_RESPONSE"].includes(match.payload.phase)
    )
      return;
    const visible = player.private_hand?.length ? player.private_hand : player.public_face_up_cards;
    if (!visible.length || visible.some((card) => isCardLegal(card, match.payload))) return;
    autoCollectedVersion.current = match.state_version;
    setFeedback({ message: "Nessuna carta giocabile: il tavolo viene raccolto automaticamente." });
    mutation.mutate({ name: "collect_table", payload: {} });
  }, [mutation, state.data]);

  useEffect(() => {
    if (state.data?.payload.phase === "COMPLETED" || state.data?.payload.phase === "ABANDONED")
      navigate(`/matches/${id}/result`, { replace: true });
  }, [id, navigate, state.data?.payload.phase]);

  const own = state.data?.payload.players.find((player) => player.private_hand !== undefined);
  const layout = useMemo(
    () =>
      assignPlayerSeats({
        players: state.data?.payload.players ?? [],
        localPlayerId: own?.id ?? "spectator",
      }),
    [own?.id, state.data?.payload.players]
  );

  const active = state.data?.payload.players.find(
    (player) => player.seat_index === state.data.payload.turn_seat
  );
  const isOwnTurn = own?.seat_index === state.data?.payload.turn_seat;
  const playableVisible = own?.private_hand?.length
    ? sortCards(own.private_hand)
    : (own?.public_face_up_cards ?? []);

  const toggle = (cardId: string, rank: string) => {
    if (!state.data) return;
    if (selected.includes(cardId)) return setSelected(selected.filter((item) => item !== cardId));
    const candidate = playableVisible.find((card) => card.id === cardId);
    if (candidate && !isCardLegal(candidate, state.data.payload)) {
      setFeedback({
        message: state.data.payload.constraint?.lower_or_equal_seven
          ? "Azione non permessa: dopo un 7 puoi giocare solo valori pari o inferiori a 7."
          : "Azione non permessa: questa carta è inferiore al valore richiesto.",
        tone: "error",
      });
      return;
    }
    const chosen = playableVisible.filter((card) => selected.includes(card.id));
    if (chosen.length && chosen[0].rank !== rank) {
      setFeedback({
        message: "Puoi giocare insieme soltanto carte dello stesso valore.",
        tone: "error",
      });
      return;
    }
    setSelected([...selected, cardId]);
  };
  const chooseCovered = (cardId: string) => {
    if (own?.privately_seen_face_down_card?.id === cardId) setSelected([cardId]);
    else mutation.mutate({ name: "peek_face_down", payload: { card_id: cardId } });
  };

  const ownForDisplay = own
    ? { ...own, private_hand: own.private_hand ? sortCards(own.private_hand) : own.private_hand }
    : undefined;

  return {
    matchId: id,
    match: state.data,
    animations,
    selected,
    feedback,
    specialNotice,
    historyOpen,
    setHistoryOpen,
    active,
    isOwnTurn,
    own: ownForDisplay,
    playableVisible,
    layout,
    busy: mutation.isPending,
    toggle,
    chooseCovered,
    navigate,
    play: () => mutation.mutate({ name: "play_cards", payload: { card_ids: selected } }),
    collect: () => mutation.mutate({ name: "collect_table", payload: {} }),
    command: (name: string, payload: object) => mutation.mutate({ name, payload }),
  };
}
