"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Wifi,
  WifiOff,
  Loader2,
  Building2,
} from "lucide-react";
import {
  endCall,
  failCall,
  recordMuteState,
  cancelCall,
} from "@/lib/call-actions";
import { PeerManager } from "@/lib/webrtc/peer";
import { Signaling, type SignalingMessage } from "@/lib/webrtc/signaling";
import type { CallWithJoins } from "@/lib/call-queries";
import { CITY_NAMES } from "@/lib/site";

/**
 * The "you're in a call right now" UI. Mounted by /call/[id]/page.tsx.
 *
 * Renders:
 *   - Counterparty avatar + name (big)
 *   - Listing reference line ("Calling about: ...")
 *   - Connection state (Connecting... / Connected / Reconnecting / Failed)
 *   - mm:ss timer once connected
 *   - Three big circular buttons: Mute, Speaker (stub), End call
 *   - <audio autoplay> sink for the remote MediaStream
 *
 * Lifecycle (caller role):
 *   mount → start mic → createOffer → send via signaling
 *        → wait for callee_answer → setRemoteDescription
 *        → exchange ICE → connected
 *
 * Lifecycle (callee role):
 *   mount → subscribe signaling first → wait for caller_offer
 *        → setRemoteDescription → start mic → createAnswer → send back
 *        → exchange ICE → connected
 *
 * Either side hanging up = `hangup` broadcast + endCall(id, reason). The
 * remote side receives `hangup` over signaling and tears down immediately,
 * THEN runs endCall too — the .neq("status", "ended") in endCall makes that
 * idempotent on the DB row.
 */

export type CallRole = "caller" | "callee";

interface InCallScreenProps {
  call: CallWithJoins;
  role: CallRole;
  myUserId: string;
}

type ConnState =
  | "initializing"
  | "ringing"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended"
  | "failed";

const CONNECTION_TIMEOUT_MS = 15_000;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function InCallScreen({ call, role, myUserId }: InCallScreenProps) {
  const router = useRouter();

  // ----- Refs that survive re-renders -----
  const peerRef = React.useRef<PeerManager | null>(null);
  const signalingRef = React.useRef<Signaling | null>(null);
  const audioElRef = React.useRef<HTMLAudioElement | null>(null);
  const pendingIceRef = React.useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = React.useRef(false);
  const teardownInFlightRef = React.useRef(false);
  const connectionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ----- UI state -----
  const [connState, setConnState] = React.useState<ConnState>("initializing");
  const [muted, setMuted] = React.useState(false);
  const [speakerOn, setSpeakerOn] = React.useState(true);
  const [showSpeakerNote, setShowSpeakerNote] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [callDurationSec, setCallDurationSec] = React.useState(0);

  // Counterparty identity
  const counterparty = role === "caller" ? call.callee : call.caller;
  const counterpartyName = counterparty?.name?.trim() || "HostelPups user";
  const counterpartyAvatar = counterparty?.avatar_url ?? null;

  // ----- Connection timeout: if not connected in 15s, mark failed -----
  React.useEffect(() => {
    if (connState === "connected" || connState === "ended" || connState === "failed") {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      return;
    }
    if (connectionTimeoutRef.current) return;
    connectionTimeoutRef.current = setTimeout(() => {
      setConnState("failed");
      setErrorMsg(
        "Connection failed. The other person's network may be too restrictive (no TURN server configured).",
      );
      void failCall(call.id).catch(() => {});
    }, CONNECTION_TIMEOUT_MS);
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    };
  }, [connState, call.id]);

  // ----- Timer once accepted -----
  React.useEffect(() => {
    if (connState !== "connected") return;
    const startedMs = Date.now();
    const handle = setInterval(() => {
      setCallDurationSec(Math.floor((Date.now() - startedMs) / 1000));
    }, 1000);
    return () => clearInterval(handle);
  }, [connState]);

  // ----- Main WebRTC setup -----
  React.useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const peer = new PeerManager({
          onRemoteStream: (stream) => {
            if (audioElRef.current) {
              audioElRef.current.srcObject = stream;
              audioElRef.current.play().catch(() => {
                // Autoplay can be blocked — user gesture from clicking Accept
                // should already have unlocked audio context. Browsers vary.
              });
            }
          },
          onIceCandidate: (candidate) => {
            // Forward ICE to the other peer over signaling.
            signalingRef.current
              ?.send({ type: "ice_candidate", candidate })
              .catch(() => {});
          },
          onConnectionStateChange: (state) => {
            if (cancelled) return;
            if (state === "connected") setConnState("connected");
            else if (state === "connecting" || state === "new")
              setConnState("connecting");
            else if (state === "disconnected") setConnState("reconnecting");
            else if (state === "failed") {
              setConnState("failed");
              setErrorMsg(
                "WebRTC connection failed. Either party may be on a restrictive network.",
              );
              void failCall(call.id).catch(() => {});
            }
          },
        });
        peerRef.current = peer;

        const signaling = new Signaling({
          callId: call.id,
          role,
          onMessage: handleSignalingMessage,
        });
        signalingRef.current = signaling;
        await signaling.subscribe();

        if (cancelled) return;

        if (role === "caller") {
          // Caller starts the SDP exchange immediately.
          await peer.start();
          const offer = await peer.createOffer();
          await signaling.send({ type: "caller_offer", sdp: offer });
          setConnState("ringing");
        } else {
          // Callee waits for the caller_offer. Mic is requested AFTER the
          // offer is received so we don't tie up the device before we know
          // the caller is still there.
          setConnState("connecting");
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Could not start the call";
        setConnState("failed");
        setErrorMsg(msg);
        void failCall(call.id).catch(() => {});
      }
    }

    async function handleSignalingMessage(msg: SignalingMessage) {
      const peer = peerRef.current;
      if (!peer) return;

      try {
        if (msg.type === "caller_offer" && role === "callee") {
          await peer.setRemoteDescription(msg.sdp);
          remoteDescSetRef.current = true;
          // Flush queued ICE that arrived before remote SDP was set.
          for (const cand of pendingIceRef.current) {
            await peer.addIceCandidate(cand);
          }
          pendingIceRef.current = [];

          await peer.start();
          const answer = await peer.createAnswer();
          await signalingRef.current?.send({
            type: "callee_answer",
            sdp: answer,
          });
        } else if (msg.type === "callee_answer" && role === "caller") {
          await peer.setRemoteDescription(msg.sdp);
          remoteDescSetRef.current = true;
          for (const cand of pendingIceRef.current) {
            await peer.addIceCandidate(cand);
          }
          pendingIceRef.current = [];
          setConnState("connecting");
        } else if (msg.type === "ice_candidate") {
          if (!remoteDescSetRef.current) {
            // ICE can race ahead of SDP — queue it.
            pendingIceRef.current.push(msg.candidate);
          } else {
            await peer.addIceCandidate(msg.candidate);
          }
        } else if (msg.type === "hangup") {
          // Remote peer ended. Tear down locally; the DB row was already
          // updated by them. Use endCall on our side too (idempotent because
          // of the .neq("status", "ended") guard).
          setConnState("ended");
          void endCall(call.id, role === "caller" ? "hangup_callee" : "hangup_caller").catch(() => {});
          setTimeout(() => router.push("/calls"), 400);
        }
      } catch (err) {
        console.warn("Signaling message handler failed:", err);
      }
    }

    setup();

    return () => {
      cancelled = true;
      // Don't tear down here on first effect — there's an explicit teardown
      // path in handleHangup that broadcasts hangup first. But if React
      // unmounted us without the user clicking End (e.g. page navigation),
      // we still need to stop the mic + leave the channel.
      if (!teardownInFlightRef.current) {
        teardownInFlightRef.current = true;
        try {
          peerRef.current?.close();
        } catch {
          // ignore
        }
        signalingRef.current?.close().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.id, role]);

  // ----- Mute toggle -----
  function handleMute() {
    const next = !muted;
    setMuted(next);
    peerRef.current?.setMuted(next);
    // Side label is from the perspective of the row in DB:
    const side = role === "caller" ? "caller" : "callee";
    void recordMuteState(call.id, side, next).catch(() => {});
  }

  // ----- Speaker toggle (PENDING native) -----
  function handleSpeaker() {
    // PENDING — real earpiece <-> loudspeaker routing requires native code
    // (Capacitor + AVAudioSession on iOS / AudioManager.MODE_IN_COMMUNICATION
    // on Android). On the web there's no standardized API for this. We toggle
    // the audio element's `muted` ↔ on/off as a visual cue but it's not
    // strictly correct UX — true call routing comes later.
    setSpeakerOn((prev) => !prev);
    setShowSpeakerNote(true);
    setTimeout(() => setShowSpeakerNote(false), 3500);
  }

  // ----- Hangup -----
  async function handleHangup() {
    if (teardownInFlightRef.current) return;
    teardownInFlightRef.current = true;
    try {
      // Broadcast first so the remote side tears down immediately rather
      // than waiting for the DB row update to propagate.
      await signalingRef.current?.send({ type: "hangup" }).catch(() => {});
      peerRef.current?.close();
      await signalingRef.current?.close();

      if (connState === "ringing" && role === "caller") {
        // Hangup before pickup = cancellation
        await cancelCall(call.id).catch(() => {});
      } else {
        const reason = role === "caller" ? "hangup_caller" : "hangup_callee";
        await endCall(call.id, reason).catch(() => {});
      }
    } finally {
      setConnState("ended");
      router.push("/calls");
    }
  }

  // ----- Render -----
  const initial = counterpartyName.charAt(0).toUpperCase() || "?";
  const listingTitle = call.listing?.title ?? null;
  const listingCity = call.listing?.city ? CITY_NAMES[call.listing.city] ?? call.listing.city : null;

  let stateLabel = "Connecting…";
  let StateIcon: React.ComponentType<{ size?: number; className?: string }> = Loader2;
  let stateExtraClass = "animate-spin";
  if (connState === "ringing") {
    stateLabel = "Ringing…";
    StateIcon = Loader2;
  } else if (connState === "connected") {
    stateLabel = formatDuration(callDurationSec);
    StateIcon = Wifi;
    stateExtraClass = "";
  } else if (connState === "reconnecting") {
    stateLabel = "Reconnecting…";
    StateIcon = WifiOff;
    stateExtraClass = "animate-pulse";
  } else if (connState === "failed") {
    stateLabel = "Call failed";
    StateIcon = WifiOff;
    stateExtraClass = "";
  } else if (connState === "ended") {
    stateLabel = "Call ended";
    StateIcon = PhoneOff;
    stateExtraClass = "";
  }

  return (
    <div className="fixed inset-0 z-[90] bg-[var(--color-ink)] text-white flex flex-col">
      {/* Hidden audio sink — remote MediaStream attaches here */}
      <audio
        ref={audioElRef}
        autoPlay
        playsInline
        // Visually hidden but functionally live
        className="hidden"
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-white/60 font-bold">
          {role === "caller" ? "Calling" : "In call with"}
        </p>

        <div className="relative mt-5 inline-flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center">
          {connState === "ringing" || connState === "connecting" ? (
            <>
              <span
                className="absolute inset-0 rounded-full bg-[var(--color-brand-400)]/30 animate-ping"
                aria-hidden="true"
              />
              <span
                className="absolute inset-3 rounded-full bg-[var(--color-brand-300)]/30 animate-pulse"
                aria-hidden="true"
              />
            </>
          ) : null}
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] flex items-center justify-center text-4xl font-black overflow-hidden shadow-2xl">
            {counterpartyAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={counterpartyAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </div>
        </div>

        <h1 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight">
          {counterpartyName}
        </h1>

        {listingTitle && (
          <p className="mt-1 text-sm text-white/70 flex items-center justify-center gap-1.5">
            <Building2 size={14} aria-hidden="true" />
            Calling about <span className="font-semibold">{listingTitle}</span>
            {listingCity && <span className="text-white/50">· {listingCity}</span>}
          </p>
        )}

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
          <StateIcon size={14} className={stateExtraClass} aria-hidden="true" />
          {stateLabel}
        </div>

        {errorMsg && (
          <p
            role="alert"
            className="mt-4 max-w-sm text-sm text-red-200 bg-red-900/40 border border-red-400/30 rounded-xl px-4 py-2"
          >
            {errorMsg}
          </p>
        )}

        {muted && (
          <p
            className="mt-3 text-xs uppercase tracking-widest text-amber-300 font-bold"
            aria-live="polite"
          >
            Microphone muted
          </p>
        )}

        {showSpeakerNote && (
          <div
            className="mt-3 max-w-sm text-xs text-white/80 bg-white/10 border border-white/15 rounded-xl px-4 py-2"
            role="status"
          >
            Speaker switching requires the HostelPups mobile app
            <span className="block text-[10px] uppercase tracking-widest text-amber-300 font-bold mt-1">
              PENDING — needs Capacitor native module
            </span>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="pb-10 pt-6 px-6 bg-gradient-to-t from-black/40 to-transparent">
        <div className="mx-auto flex max-w-md items-center justify-around gap-3">
          <button
            type="button"
            onClick={handleMute}
            disabled={connState === "ended" || connState === "failed"}
            aria-pressed={muted}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full transition-colors active:scale-95 ${
                muted ? "bg-white text-[var(--color-ink)]" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {muted ? <MicOff size={22} aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold">
              {muted ? "Muted" : "Mute"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSpeaker}
            disabled={connState === "ended" || connState === "failed"}
            aria-pressed={speakerOn}
            aria-label={speakerOn ? "Switch to earpiece (PENDING native)" : "Switch to loudspeaker (PENDING native)"}
            title="Full speaker switching available on the mobile app (pending Capacitor native module)"
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full transition-colors active:scale-95 relative ${
                speakerOn ? "bg-white text-[var(--color-ink)]" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {speakerOn ? <Volume2 size={22} aria-hidden="true" /> : <VolumeX size={22} aria-hidden="true" />}
              <span
                className="absolute -top-1 -right-1 text-[8px] font-bold uppercase tracking-wider bg-amber-400 text-[var(--color-ink)] rounded-full px-1.5 py-0.5"
                aria-hidden="true"
              >
                Soon
              </span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold">
              Speaker
            </span>
          </button>

          <button
            type="button"
            onClick={handleHangup}
            aria-label="End call"
            className="flex flex-col items-center gap-1.5"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors active:scale-95">
              <PhoneOff size={22} aria-hidden="true" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold">
              End
            </span>
          </button>
        </div>
        <p className="mt-5 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold">
          Audio routed peer-to-peer · No phone numbers exposed
        </p>
        {/* Avoid unused-variable lint */}
        <span className="hidden">{myUserId}</span>
      </div>
    </div>
  );
}
