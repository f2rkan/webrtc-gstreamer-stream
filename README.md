# JS Engine Video Streaming Project

This project implements a video streaming application using Vue.js, Werift for WebRTC, and GStreamer for media processing. The application allows real-time video streaming with minimal latency, enabling efficient peer-to-peer communication.

## Project Purpose

The primary goal of this project is to create a seamless video streaming experience for users. By leveraging WebRTC technology, the application allows for real-time video sharing and communication, making it suitable for various use cases, including video conferencing, remote collaboration, and live streaming events.

## Key Concepts in WebRTC

- **Peer-to-Peer Communication**: WebRTC enables direct communication between browsers, eliminating the need for intermediaries and reducing latency.
- **ICE (Interactive Connectivity Establishment)**: A framework used by WebRTC to facilitate the discovery of network paths between peers. It helps manage the complexities of NAT traversal.
- **STUN/TURN Servers**: These servers assist in establishing a connection between peers, especially when they are behind firewalls or NATs. STUN servers help clients discover their public IP addresses, while TURN servers relay media when direct peer-to-peer communication is not possible.

## Technologies Used

- **Vue.js** (version 2): A progressive JavaScript framework for building user interfaces.
- **werift-webrtc**: A WebRTC implementation in TypeScript, providing peer-to-peer streaming capabilities.
- **GStreamer**: A multimedia framework used to handle video and audio streaming. It enables flexible media processing pipelines and integration with various media sources.
- **Express**: A web framework for Node.js to handle server-side requests.
- **CORS**: Middleware to enable Cross-Origin Resource Sharing.

## How Werift Fits into the Project

Werift serves as the backbone of the WebRTC implementation in this project. It handles the signaling process, establishing connections between peers, and managing the ICE candidates. By utilizing Werift, the project can efficiently manage real-time video streams and handle the complexities of WebRTC.

## How GStreamer Fits into the Project

GStreamer is utilized for processing and managing multimedia streams in this application. It allows for the configuration of media pipelines that can handle various formats and sources, such as RTSP streams or a local video file. GStreamer enables the application to receive, process, and transmit video streams seamlessly, ensuring high-quality video delivery with minimal latency. Additionally, it supports various output codecs, including OPUS, VP8, H264, VP9, and AV1, allowing for flexible and efficient streaming options.

## coTURN Integration

This project uses **coTURN** as a TURN server to facilitate WebRTC connections. coTURN is an open-source implementation of TURN (Traversal Using Relays around NAT) and STUN (Session Traversal Utilities for NAT) protocols. It is essential for enabling reliable peer-to-peer communication, especially in scenarios where direct connections cannot be established due to NAT or firewall restrictions. By relaying media traffic, coTURN ensures that users can connect successfully even in challenging network environments.

### Monitoring with Prometheus and Grafana

Monitoring for coTURN is accomplished using **Prometheus** and **Grafana** running in Docker containers. Prometheus scrapes metrics from the coTURN server and provides a monitoring interface to track performance and statistics, while Grafana allows for visualizing these metrics through customizable dashboards.

To set up coTURN, Prometheus, and Grafana, the following Docker commands are utilized:

1. **Run coTURN:**

   ```bash
   docker run -d --network=host -v /home/ubuntu/turnserverConf/turnserver.conf:/etc/turnserver.conf -v /home/ubuntu/certs/fullchain.pem:/etc/ssl/certs/fullchain.pem -v /home/ubuntu/certs/privkey.pem:/etc/ssl/private/privkey.pem coturn/coturn
   ```

2. **Run Prometheus:**

   ```bash
   docker run -d -p 9090:9090 -v /home/ubuntu/officialProm/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
   ```

3. **Run Grafana:**

   ```bash
   docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss
   ```

### Prometheus Configuration

The `prometheus.yml` file is configured to scrape metrics from coTURN, Grafana, and the node exporter:

```yaml
global:
  scrape_interval:     1s
  evaluation_interval: 1s
 
scrape_configs:
  - job_name: 'coturn'
    static_configs:
      - targets: ['server_public_ip_addr:9641']
    metrics_path: '/metrics'
    scheme: 'http'
    params:
      collector: [all]

  - job_name: 'grafana'
    static_configs:
      - targets: ['server_public_ip_addr:3000']
    metrics_path: '/metrics'
    scheme: 'http'
    params:
      format: ['prometheus']

  - job_name: node
    static_configs:
      - targets: ['server_public_ip:9100']
```

### coTURN Configuration

The `turnserver.conf` file includes the necessary configurations for coTURN, including the listening and external IPs, user credentials, and enabling Prometheus metrics:

```conf
listening-ip=server_local_ip_addr
relay-ip=server_OS_local_ip_addr
external-ip=server_public_ip_addr
realm=your.personaldomain.com
user=testUsername:testPassword
user=test2Username:test2Password
cert=/home/ubuntu/certs/fullchain.pem
pkey=/home/ubuntu/certs/privkey.pem
prometheus=true
prometheus-username-labels=true
verbose
```

### Accessing the Monitoring Interface

- **Prometheus** can be accessed at `http://<public_ip>:9090`.
- **Grafana** can be accessed at `http://<public_ip>:3000`.

By utilizing these monitoring tools, you can effectively track the performance and reliability of the coTURN server in your video streaming application.

## Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 12 or higher)
- [GStreamer](https://gstreamer.freedesktop.org/) (version 1.18 or higher)
- Vue.js (version 2.x) installed via npm

## Server Setup

1. **Install Dependencies**

   Navigate to the `server` directory and run the following command to install the required dependencies:

   ```bash
   npm install express cors werift
   ```

2. **Configure STUN/TURN Servers**

   In `server.js`, replace `stun_ip_address`, `stun_port`, `turn_ip_address`, `turn_port`, `turn_username`, and `turn_credential` with your actual STUN/TURN server configurations.

3. **Start the Server**

   Run the server with the following command:

   ```bash
   node server.js
   ```

## Client Setup

1. **Install Dependencies**

   Navigate to the `client` directory and run the following command to install the required dependencies:

   ```bash
   npm install
   ```

2. **Run the Client**

   Start the Vue.js client with the following command:

   ```bash
   npm run serve
   ```

   The application will be accessible at `http://localhost:8080` by default.

## Application Workflow

1. After the server is running, open the client application in your web browser.
2. Click the **Send Offer** button to initiate a WebRTC connection.
3. Click the **Send ICE Candidate** button to send any ICE candidates to the server.
4. The video stream processed by GStreamer will be displayed in the client application.

### Important Notes

- Ensure that the STUN and TURN server addresses and credentials are configured correctly in both the client and server code.
- The latency and stream quality depend on the bandwidth, the number of streams, and the processing power of the server.
- To observe the incoming video stream, you need to ensure that your GStreamer pipeline is correctly set up to stream the desired media source.

## GStreamer Configuration

To modify the GStreamer pipeline in `server.js`, you can change the `pipeline1` and `pipeline2` variables to match your media source requirements.

Example pipeline configuration for RTSP streaming:

```javascript
const pipeline1 = `gst-launch-1.0 rtspsrc location=rtsp://admin:rtsp_stream_addr latency=50 ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! videoscale ! video/x-raw,width=640,height=480 ! vp8enc deadline=1 buffer-size=1000000 cpu-used=8 threads=4 cq-level=5 dropframe-threshold=15 tuning=1 ! rtpvp8pay name=pay0 pt=96 ! udpsink host=127.0.0.1 port=${port1}`;
```

## Conclusion

This project demonstrates the integration of Vue.js, Werift, and GStreamer for real-time video streaming applications. Adjust configurations and pipelines as needed for your specific use case.
