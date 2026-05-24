"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase realtime channel that the two call peers use as a low-overhead
 * signaling layer. We `broadcast` SDP and ICE messages — they're ephemeral
 * (no DB writes), routed peer-to-peer through Supabase, and torn down with
 * the call.
 *
 * Channel name convention: `call:{call_id}`.
 *
 * Message shape:
 *   { type: 'caller_offer',  sdp: RTCSessionDescriptionInit }
 *   { type: 'callee_answer', sdp: RTCSessionDescriptionInit }
 *   { type: 'ice_candidate', candidate: RTCIceCandidateInit }
 *   { type: 'hangup' }
 */

export type SignalingMessage =
  | { type: "caller_offer"; sdp: RTCSessionDescriptionInit }
  | { type: "callee_answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice_candidate"; candidate: RTCIceCandidateInit }
  | { type: "hangup" };

export type SignalingRole = "caller" | "callee";

export interface SignalingOptions {
  callId: string;
  role: SignalingRole;
  onMessage: (msg: SignalingMessage) => void;
}

const EVENT = "signal";

export class Signaling {
  private channel: RealtimeChannel | null = null;
  private supabase = createClient();
  private subscribed = false;

  constructor(private opts: SignalingOptions) {}

  /**
   * Join the channel. Resolves once subscribed (so the caller can send the
   * offer right away).
   */
  async subscribe(): Promise<void> {
    return new Promise((resolve, reject) => {
      const channelName = `call:${this.opts.callId}`;
      // self: false means we don't echo our own broadcasts back to ourselves.
      this.channel = this.supabase.channel(channelName, {
        config: { broadcast: { self: false, ack: false } },
      });

      this.channel.on(
        "broadcast",
        { event: EVENT },
        (payload: { payload: SignalingMessage }) => {
          if (payload?.payload) this.opts.onMessage(payload.payload);
        },
      );

      this.channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.subscribed = true;
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(new Error(`Signaling subscribe failed: ${status}`));
        }
      });
    });
  }

  /**
   * Broadcast a message to the other peer on this call's channel.
   * Returns the broadcast result so callers can opt-in to retry logic
   * (e.g. resend the offer if the first attempt timed out).
   */
  async send(msg: SignalingMessage): Promise<void> {
    if (!this.channel || !this.subscribed) {
      throw new Error("Signaling channel not ready");
    }
    await this.channel.send({
      type: "broadcast",
      event: EVENT,
      payload: msg,
    });
  }

  /**
   * Leave the channel. Idempotent.
   */
  async close(): Promise<void> {
    if (this.channel) {
      try {
        await this.supabase.removeChannel(this.channel);
      } catch {
        // ignore — already gone
      }
      this.channel = null;
      this.subscribed = false;
    }
  }
}
