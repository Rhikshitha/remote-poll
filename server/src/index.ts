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

type PollType = 'multiple-choice' | 'rating' | 'word-cloud' | 'yes-no';

interface Poll {
  id: string;
  question: string;
  type: PollType;
  options: string[];
  votes: { [option: string]: number };
  wordCloudResponses?: string[];
  ratings?: number[];
  createdAt: Date;
  isActive: boolean;
  timer?: number;
  anonymous: boolean;
}

interface Vote {
  pollId: string;
  option?: string;
  userId: string;
  wordCloudText?: string;
  rating?: number;
}

const polls: Map<string, Poll> = new Map();
const userVotes: Map<string, Set<string>> = new Map();

app.get('/health', (_, res) => {
  res.json({ status: 'OK' });
});

app.get('/api/polls', (_, res) => {
  const allPolls = Array.from(polls.values()).map(poll => ({
    ...poll,
    totalVotes: Object.values(poll.votes).reduce((sum, count) => sum + count, 0),
    totalRatings: poll.ratings?.length || 0,
    totalResponses: poll.wordCloudResponses?.length || 0
  }));
  res.json(allPolls);
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-poll', (data: { 
    question: string; 
    options: string[]; 
    type: PollType; 
    timer?: number;
    anonymous?: boolean;
  }) => {
    const pollId = generatePollId();
    const poll: Poll = {
      id: pollId,
      question: data.question,
      type: data.type || 'multiple-choice',
      options: data.options,
      votes: data.options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
      wordCloudResponses: [],
      ratings: [],
      createdAt: new Date(),
      isActive: true,
      timer: data.timer,
      anonymous: data.anonymous !== false
    };
    
    polls.set(pollId, poll);
    socket.emit('poll-created', { pollId, poll });
    socket.join(`poll-${pollId}`);
    
    if (data.timer) {
      setTimeout(() => {
        poll.isActive = false;
        io.to(`poll-${pollId}`).emit('poll-closed', { pollId });
      }, data.timer * 1000);
    }
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
    
    switch (poll.type) {
      case 'multiple-choice':
      case 'yes-no':
        if (!data.option) return;
        
        if (!userVotes.has(userPollKey)) {
          userVotes.set(userPollKey, new Set());
        }
        
        const userPollVotes = userVotes.get(userPollKey)!;
        if (userPollVotes.has(data.option)) {
          socket.emit('error', { message: 'Already voted' });
          return;
        }
        
        userPollVotes.add(data.option);
        poll.votes[data.option]++;
        
        io.to(`poll-${data.pollId}`).emit('vote-update', {
          pollId: data.pollId,
          votes: poll.votes,
          type: poll.type
        });
        break;
        
      case 'rating':
        if (data.rating === undefined) return;
        
        if (userVotes.has(userPollKey)) {
          socket.emit('error', { message: 'Already rated' });
          return;
        }
        
        userVotes.set(userPollKey, new Set(['rated']));
        poll.ratings!.push(data.rating);
        
        io.to(`poll-${data.pollId}`).emit('vote-update', {
          pollId: data.pollId,
          ratings: poll.ratings,
          type: poll.type
        });
        break;
        
      case 'word-cloud':
        if (!data.wordCloudText) return;
        
        poll.wordCloudResponses!.push(data.wordCloudText);
        
        io.to(`poll-${data.pollId}`).emit('vote-update', {
          pollId: data.pollId,
          wordCloudResponses: poll.wordCloudResponses,
          type: poll.type
        });
        break;
    }
  });

  socket.on('close-poll', (pollId: string) => {
    const poll = polls.get(pollId);
    if (poll) {
      poll.isActive = false;
      io.to(`poll-${pollId}`).emit('poll-closed', { pollId });
    }
  });

  socket.on('send-emoji', ({ pollId, emoji, x, y }: { pollId: string; emoji: string; x: number; y: number }) => {
    io.to(`poll-${pollId}`).emit('emoji-reaction', { emoji, x, y });
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