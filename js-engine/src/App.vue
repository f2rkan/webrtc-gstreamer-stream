<template>
  <div id="app" class="app-container">
    <div class="controls">
      <button @click="sendOffer" class="control-button">Send Offer</button>
      <button @click="sendIceCandidate" class="control-button">Send ICE Candidate</button>
      <select v-model="selectedItem" @change="handleSelection" class="selection-dropdown">
        <option disabled value="">Select an option</option>
        <option value="Example 1">Example 1</option>
        <option value="Example 2">Example 2</option>
        <option value="Example 3">Example 3</option>
        <option value="Example 4">Example 4</option>
        <option value="Example 5">Example 5</option>
        <option value="Example 6">Example 6</option>
      </select>
    </div>
    <video ref="ffmpegVideo" class="video-player" autoplay playsinline></video>
    <div ref="remoteVideoContainer" class="remote-video-container"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      pc: null,
      localICECandidate: null,
      remoteVideos: [],
      selectedItem: "",
      dataChannel: null,
    };
  },
  methods: {
    sendSelectedOption() {
      if (this.dataChannel) {
        this.dataChannel.send(this.selectedItem);
      } else {
        console.error("Data channel is not established.");
      }
    },
    handleSelection() {
      console.log("Selected item:", this.selectedItem);
      this.sendSelectedOption();
    },
    async sendOffer() {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.localICECandidate = event.candidate;
          console.log("ICE Candidate:", event.candidate.candidate);
        }
      };
      console.log("Offer:", offer);
      
      const response = await fetch("http://ip_address:port/send_offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer: this.pc.localDescription }),
      });

      if (!response.ok) {
        console.error("Server error");
      } else {
        console.log("Offer sent");
        const responseData = await response.json();
        const receivedAnswer = responseData.answer;

        if (receivedAnswer) {
          const answerDescription = new RTCSessionDescription(receivedAnswer);
          await this.pc.setRemoteDescription(answerDescription);
          console.log("Answer Description:", answerDescription);
        }
      }

      this.sendIceCandidate();
    },
    async startVideo() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        
        if (videoDevices.length === 0) {
          console.error("No video devices found.");
          return;
        }
      } catch (error) {
        console.error("Error accessing user media:", error);
      }
    },
    async sendIceCandidate() {
      if (this.localICECandidate) {
        try {
          const response = await fetch("http://ip_addres:port/send_ice_candidate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ candidate: this.localICECandidate }),
          });
          console.log("ICE candidate sent to server:", response);
        } catch (error) {
          console.error("Error sending ICE candidate:", error.message);
        }
      } else {
        console.error("No local ICE candidate available.");
      }
    },
    initializePeerConnection() {
      const iceServers = [
        { urls: "stun:stun_ip_address:stun_port" },
        {
          credential: "__credential__",
          urls: "turn:turn_ip_address:turn_port",
          username: "turn_username",
        },
      ];
      this.pc = new RTCPeerConnection({ iceServers: iceServers });

      this.pc.ontrack = (event) => {
        console.log("Track added to connection", event);
        const videoElement = document.createElement("video");
        videoElement.autoplay = true;
        videoElement.playsinline = true;
        const stream = new MediaStream([event.track]);
        videoElement.srcObject = stream;
        videoElement.classList.add("remote-video");
        this.$refs.remoteVideoContainer.appendChild(videoElement);
      };

      this.startVideo();
      this.dataChannel = this.pc.createDataChannel("chat");
      this.dataChannel.onopen = () => {
        console.log("Data channel opened");
      };
      this.dataChannel.onmessage = (event) => {
        console.log("Received message:", event.data);
      };
    },
  },
  async mounted() {
    this.initializePeerConnection();
  },
};
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  width: 100%;
}

.control-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-button:hover {
  background-color: #0056b3;
}

.selection-dropdown {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ced4da;
}

.video-player {
  width: 640px;
  height: 480px;
  border: 2px solid #007bff;
  border-radius: 10px;
  margin-bottom: 15px;
}

.remote-video-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.remote-video {
  width: 320px;
  height: 240px;
  border: 2px solid #007bff;
  border-radius: 10px;
}
</style>
