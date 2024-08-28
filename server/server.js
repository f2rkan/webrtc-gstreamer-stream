const express = require("express");
const cors = require("cors");
const app = express();
const { exec } = require("child_process");
const dgram = require("dgram");
const { createSocket } = dgram;

const {
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStreamTrack,
  RtpPacket,
  randomPort,
} = require("werift");

const serverPort = 3001;
const port1 = 3002;
const port2 = 3003;
const port3 = 3004;

const PeerConfig = {
  iceServers: [
    { urls: "stun:stun_ip_addr:stun_port" },
    {
      urls: "turn:turn_ip_addr:turn_port",
      username: "turn_username",
      credential: "turn_credential",
    },
  ],
};

const peerConnection = new RTCPeerConnection(PeerConfig);

const iceCandidates = [];

app.use(cors());
app.use(express.json());

app.post("/send_offer", async (req, res) => {
  try {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    const receivedOffer = req.body.offer.sdp;
    const offerDescription = new RTCSessionDescription(receivedOffer, "offer");
    await peerConnection.setRemoteDescription(offerDescription);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
      }
    };

    const pipeline1 = `gst-launch-1.0 rtspsrc location=rtsp://admin:rtsp_stream_addr latency=50 ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! videoscale ! video/x-raw,width=640,height=480 ! vp8enc deadline=1 buffer-size=1000000 cpu-used=8 threads=4 cq-level=5 dropframe-threshold=15 tuning=1 ! rtpvp8pay name=pay0 pt=96 ! udpsink host=127.0.0.1 port=${port1}`;

    const pipeline2 = `gst-launch-1.0 rtspsrc location=rtsp://admin:rtsp_stream_addr/cam/realmonitor?channel=1/subtype=0 latency=50 ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! videoscale ! video/x-raw,width=1280,height=720 ! vp8enc deadline=1 buffer-size=1000000 cpu-used=8 threads=4 cq-level=5 dropframe-threshold=15 tuning=1 ! rtpvp8pay name=pay0 pt=96 ! udpsink host=127.0.0.1 port=${port2}`;

    const pipeline3 = `gst-launch-1.0 rtspsrc location=rtsp://admin:rtsp_stream_addr/cam/realmonitor?channel=1/subtype=0 latency=50 ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! videoscale ! video/x-raw,width=1920,height=1080 ! vp8enc deadline=1 buffer-size=1000000 cpu-used=8 threads=4 cq-level=5 dropframe-threshold=15 tuning=1 ! rtpvp8pay name=pay0 pt=96 ! udpsink host=127.0.0.1 port=${port3}`;

    const ports = [port1, port2, port3];
    const pipelines = [pipeline1, pipeline2, pipeline3];

    pipelines.forEach(async (p) => {
      p = exec(p);
    });
    const track1 = new MediaStreamTrack({ kind: "video" });
    const udp1 = createSocket("udp4");
    udp1.bind(port1);

    udp1.on("message", (data) => {
      const rtp = RtpPacket.deSerialize(data);
      rtp.header.payloadType = 96;
      track1.writeRtp(rtp);
    });
    peerConnection.addTrack(track1);

    const track2 = new MediaStreamTrack({ kind: "video" });
    const udp2 = createSocket("udp4");
    udp2.bind(port2);

    udp2.on("message", (data) => {
      const rtp = RtpPacket.deSerialize(data);
      rtp.header.payloadType = 96;
      track2.writeRtp(rtp);
    });

    peerConnection.addTrack(track2);

    const track3 = new MediaStreamTrack({ kind: "video" });
    const udp3 = createSocket("udp4");
    udp3.bind(port3);

    udp3.on("message", (data) => {
      const rtp = RtpPacket.deSerialize(data);
      rtp.header.payloadType = 96;
      track3.writeRtp(rtp);
    });

    peerConnection.addTrack(track3);

    const answer = await peerConnection.createAnswer();
    const modifiedAnswerSDP = answer.sdp.replace(
      "a=group:BUNDLE \r\n",
      "a=group:BUNDLE 0\r\n"
    );
    answer.sdp = modifiedAnswerSDP;

    await peerConnection.setLocalDescription(answer);

    console.log("answer:", answer);

    res.json({ answer });

    peerConnection.onconnectionstatechange = () => {
      console.log("con state change", peerConnection.connectionStateChange);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === "connected") {
        console.log("Peer(ICE) connection established");
      }
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log("ICE Gathering State:", peerConnection.iceGatheringState);
    };

    peerConnection.onsignalingstatechange = () => {
      console.log("Signaling State:", peerConnection.signalingState);
    };
  } catch (error) {
    console.error("Error sending offer:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/send_ice_candidate", async (req, res) => {
  try {
    if (!peerConnection) {
      throw new Error("Peer connection is not initialized.");
    }

    const candidate = req.body.candidate;

    await peerConnection.addIceCandidate(candidate);
    res.json({ iceCandidates });
  } catch (error) {
    console.error("Error adding ICE candidate:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(serverPort, () => {
  console.log(`Server http://localhost:${serverPort} adresinde çalışıyor.`);
});
