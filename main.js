let peerConnection = new RTCPeerConnection();
let localStream;
let remoteStream;

const init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
            // Append candidate to the textarea for manual transfer
            const candidatesTextarea = document.getElementById('ice-candidates');
            candidatesTextarea.value += JSON.stringify(event.candidate) + '\n';
        }
    };
};

const createOffer = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    document.getElementById('offer-sdp').value = JSON.stringify(offer);
};

const createAnswer = async () => {
    const offer = JSON.parse(document.getElementById('offer-sdp').value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    document.getElementById('answer-sdp').value = JSON.stringify(answer);
};

const addAnswer = async () => {
    const answer = JSON.parse(document.getElementById('answer-sdp').value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

const addIceCandidate = async () => {
    const candidatesTextarea = document.getElementById('ice-candidates').value.trim().split('\n');
    for (const candidateStr of candidatesTextarea) {
        if (candidateStr) {
            const candidate = JSON.parse(candidateStr);
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
};

init();

document.getElementById('create-offer').addEventListener('click', createOffer);
document.getElementById('create-answer').addEventListener('click', createAnswer);
document.getElementById('add-answer').addEventListener('click', addAnswer);
document.getElementById('add-ice-candidate').addEventListener('click', addIceCandidate);
