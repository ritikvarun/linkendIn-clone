// Shared socket service — so controllers can emit events
let _io = null;
let _onlineUsers = new Map();

export const setIo = (io) => { _io = io; };
export const getIo = () => _io;

export const setOnlineUsers = (map) => { _onlineUsers = map; };
export const getOnlineUsers = () => _onlineUsers;

export const emitToUser = (userId, event, data) => {
  if (!_io) return;
  const socketId = _onlineUsers.get(String(userId));
  if (socketId) _io.to(socketId).emit(event, data);
};
