/**
 * Thin wrapper around RTCPeerConnection for one-on-one voice calls.
 *
 * Browser-only. Do NOT import from a server component — `RTCPeerConnection`
 * doesn't exist on the server and the import will crash the build. Every
 * file that pulls this in must already be a "use client" boundary.
 *
 * Lifecycle:
 *   const peer = new PeerManager({ onRemoteStream, onIceCandidate, onConnectionStateChange });
 *   await peer.start();                          // getUserMedia + add tracks
 *   const offer = await peer.createOffer();      // caller only
 *   await peer.setRemoteDescription(remoteOffer); // callee + caller use this
 *   const answer = await peer.createAnswer();    // callee only
 *   await peer.addIceCandidate(c);
 *   peer.setMuted(true);
 *   peer.close();
 */

/**
 * STUN servers — Google's free pool. Works for ~80% of home networks.
 *
 * PENDING (TURN): the remaining ~20% of users behind symmetric NATs or
 * restrictive corporate firewalls will fail to connect with STUN-only. For
 * production reliability we need to add a TURN relay (e.g. Metered.ca's free
 * tier of 50GB/mo, or coturn self-host). Until then those connections will
 * trip the `connectionStateChange` → "failed" path and we'll mark the call
 * as failed in DB.
 */
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // TODO PENDING — add TURN credentials here for production:
  // { urls: "turn:<your-turn-host>:3478", username: "...", credential: "..." },
];

export interface PeerManagerOptions {
  /** Called when the remote side's MediaStream arrives — attach to <audio>. */
  onRemoteStream: (stream: MediaStream) => void;
  /** Called every time the local peer produces an ICE candidate. Forward it via signaling. */
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  /** Called for every RTCPeerConnection state transition (new/connecting/connected/disconnected/failed/closed). */
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export class PeerManager {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream;
  private closed = false;

  constructor(private opts: PeerManagerOptions) {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.remoteStream = new MediaStream();

    this.pc.addEventListener("track", (ev: RTCTrackEvent) => {
      // The server can emit either a stream we should adopt or just bare tracks.
      // Prefer the supplied stream so order-of-tracks works across browsers.
      if (ev.streams && ev.streams[0]) {
        this.opts.onRemoteStream(ev.streams[0]);
      } else {
        this.remoteStream.addTrack(ev.track);
        this.opts.onRemoteStream(this.remoteStream);
      }
    });

    this.pc.addEventListener("icecandidate", (ev) => {
      if (ev.candidate) {
        this.opts.onIceCandidate(ev.candidate.toJSON());
      }
    });

    this.pc.addEventListener("connectionstatechange", () => {
      this.opts.onConnectionStateChange(this.pc.connectionState);
    });
  }

  /**
   * Request mic permission, capture the local stream, and add each track to
   * the peer connection. Throws if the user denied permission — the caller
   * should map that into a user-facing message and fail the call.
   */
  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone API not available in this browser");
    }
    // Audio only — no video for now.
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }
  }

  /**
   * Caller-only: produce an SDP offer and set it as the local description.
   * Send the returned object over the signaling channel as `caller_offer`.
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer({ offerToReceiveAudio: true });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Either side: accept the counterparty's SDP (offer for callee, answer for caller).
   */
  async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(sdp);
  }

  /**
   * Callee-only: produce an SDP answer and set it as the local description.
   * Send the returned object over signaling as `callee_answer`.
   *
   * Must be preceded by setRemoteDescription(offer).
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Add an ICE candidate received from the remote peer over signaling.
   * Silently ignored if the peer is already closed (handles late candidates
   * that arrive after hangup).
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.closed) return;
    try {
      await this.pc.addIceCandidate(candidate);
    } catch (err) {
      // Out-of-order / stale candidates can fail to add — non-fatal.
      console.warn("addIceCandidate failed:", err);
    }
  }

  /**
   * Enable or disable our outgoing audio track. The remote side's level meter
   * will go to zero but the connection stays up. This is the same primitive
   * WhatsApp uses for in-call mute.
   */
  setMuted(muted: boolean): void {
    if (!this.localStream) return;
    for (const track of this.localStream.getAudioTracks()) {
      track.enabled = !muted;
    }
  }

  /**
   * Tear everything down. Idempotent — safe to call from multiple unmount
   * paths.
   */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    try {
      this.localStream?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    try {
      this.pc.close();
    } catch {
      // ignore
    }
  }
}
