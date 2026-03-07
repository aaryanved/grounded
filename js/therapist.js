import { Conversation } from "https://cdn.jsdelivr.net/npm/@11labs/client@latest/+esm";
import { ELEVENLABS_AGENT_ID } from "../config.js";

let _conversation = null;

export async function startTherapistConversation(onStatusChange) {
  if (_conversation) return;
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    _conversation = await Conversation.startSession({
      agentId: ELEVENLABS_AGENT_ID,
      onConnect:    ()         => onStatusChange?.("connected"),
      onDisconnect: ()         => { _conversation = null; onStatusChange?.("disconnected"); },
      onError:      (err)      => { console.error("[therapist]", err); onStatusChange?.("error"); },
      onModeChange: ({ mode }) => onStatusChange?.(mode), // "listening" | "speaking"
    });
  } catch (err) {
    _conversation = null;
    throw err;
  }
}

export async function endTherapistConversation() {
  if (!_conversation) return;
  await _conversation.endSession();
  _conversation = null;
}

export function isConversationActive() {
  return _conversation !== null;
}
