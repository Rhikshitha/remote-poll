import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: { [option: string]: number };
  createdAt: Date;
  isActive: boolean;
}

interface Vote {
  pollId: string;
  option: string;
  userId: string;
}

const polls: Map<string, Poll> = new Map();
const userVotes: Map<string, Set<string>> = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-poll', (data: { question: string; options: string[] }) => {
    const pollId = generatePollId();
    const poll: Poll = {
      id: pollId,
      question: data.question,
      options: data.options,
      votes: data.options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
      createdAt: new Date(),
      isActive: true
    };
    
    polls.set(pollId, poll);
    socket.emit('poll-created', { pollId, poll });
    socket.join(`poll-${pollId}`);
  });

  socket.on('join-poll', (pollId: string) => {
    const poll = polls.get(pollId);
    if (poll) {
      socket.join(`poll-${pollId}`);
      socket.emit('poll-data', poll);
    } else {
      socket.emit('error', { message: 'Poll not found' });
    }
  });

  socket.on('vote', (data: Vote) => {
    const poll = polls.get(data.pollId);
    if (!poll || !poll.isActive) {
      socket.emit('error', { message: 'Poll not found or inactive' });
      return;
    }

    const userPollKey = `${data.userId}-${data.pollId}`;
    if (!userVotes.has(userPollKey)) {
      userVotes.set(userPollKey, new Set());
    }

    const userPollVotes = userVotes.get(userPollKey)!;
    if (userPollVotes.has(data.option)) {
      socket.emit('error', { message: 'Already voted for this option' });
      return;
    }

    userPollVotes.add(data.option);
    poll.votes[data.option]++;
    
    io.to(`poll-${data.pollId}`).emit('vote-update', {
      pollId: data.pollId,
      votes: poll.votes
    });
  });

  socket.on('close-poll', (pollId: string) => {
    const poll = polls.get(pollId);
    if (poll) {
      poll.isActive = false;
      io.to(`poll-${pollId}`).emit('poll-closed', { pollId });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

function generatePollId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});