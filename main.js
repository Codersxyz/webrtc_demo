let peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUN server
});
let localStream;
let remoteStream;

// Function to get the video stream from a specific device
const getMediaStream = async (deviceId) => {
    return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
        audio: false
    });
};

// Function to initialize the peer connection
const init = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Try to get the media stream from the available video devices
        for (const videoDevice of videoDevices) {
            try {
                localStream = await getMediaStream(videoDevice.deviceId);
                break; // Break if successful
            } catch (error) {
                console.warn(`Failed to access camera: ${videoDevice.label}`, error);
            }
        }

        if (!localStream) {
            alert('No available camera found. Please check your devices.');
            return;
        }

        remoteStream = new MediaStream();
        document.getElementById('user-1').srcObject = localStream;
        document.getElementById('user-2').srcObject = remoteStream;

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                const candidatesTextarea = document.getElementById('ice-candidates');
                candidatesTextarea.value += JSON.stringify(event.candidate) + '\n';
            }
        };
    } catch (error) {
        console.error('Error initializing media devices.', error);
        alert('Could not initialize media devices: ' + error.message);
    }
};

// Function to create an offer
const createOffer = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    document.getElementById('offer-sdp').value = JSON.stringify(offer);
};

// Function to create an answer
const createAnswer = async () => {
    const offer = JSON.parse(document.getElementById('offer-sdp').value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    document.getElementById('answer-sdp').value = JSON.stringify(answer);
};

// Function to add the answer from the other peer
const addAnswer = async () => {
    const answer = JSON.parse(document.getElementById('answer-sdp').value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

// Function to add ICE candidates
const addIceCandidate = async () => {
    const candidatesTextarea = document.getElementById('ice-candidates').value.trim().split('\n');
    for (const candidateStr of candidatesTextarea) {
        if (candidateStr) {
            const candidate = JSON.parse(candidateStr);
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
};

// Initialize the connection and UI
init();

document.getElementById('create-offer').addEventListener('click', createOffer);
document.getElementById('create-answer').addEventListener('click', createAnswer);
document.getElementById('add-answer').addEventListener('click', addAnswer);
document.getElementById('add-ice-candidate').addEventListener('click', addIceCandidate);
