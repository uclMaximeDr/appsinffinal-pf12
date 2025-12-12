const socket = io();

socket.on('raidEvent', (data) => {
    const partyId = data.partyId;
    window.location.href = `/raid/${partyId}`;
});