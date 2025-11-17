// ---------------------------
//  CLIENT: WebRTC + Signaling (Koyeb Ready)
// ---------------------------

// YOUR Koyeb WebSocket URL
const SERVER_URL = "dependent-poppy-brtechnologyorgnation-366e7b67.koyeb.app/";

// Create socket connection
const socket = io(SERVER_URL, {
    transports: ["websocket"]
});

// Local peer connection
let pc = new RTCPeerConnection();

// When new client connects
socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
    socket.emit("get-users");
});

// Get list of online users
socket.on("users", (users) => {
    console.log("Online Users:", users);

    if (users.length > 0) {
        startCall(users[0]);   // connect to first available peer
    }
});

// Start call with remote peer
async function startCall(targetId) {
    console.log("Calling:", targetId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", {
        target: targetId,
        sdp: offer
    });
}

// When receiving an offer
socket.on("offer", async (data) => {
    console.log("Offer received:", data.caller);

    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", {
        target: data.caller,
        sdp: answer
    });
});

// When receiving answer
socket.on("answer", async (data) => {
    console.log("Answer received:", data.answerer);

    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
});

// Handle ICE candidates
pc.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit("ice-candidate", {
            target: remotePeerId,
            candidate: event.candidate
        });
    }
};

// Receive remote ICE candidates
socket.on("ice-candidate", async (data) => {
    console.log("ICE Candidate received");
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Debugging state
pc.onconnectionstatechange = () => {
    console.log("Connection status:", pc.connectionState);
};