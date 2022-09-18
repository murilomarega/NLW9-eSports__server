import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { convertHourStringToMinutes } from './utils/convertHourStringToMinutes';
import { convertMinutesToHourString } from './utils/convertMinutesToHourString';

const app = express();
app.use(express.json());
app.use(cors());

const prisma = new PrismaClient({
  log: ['query'],
});

app.get('/games', async (request, response) => {
  console.log(request);
  try {
    const games = await prisma.game
      .findMany({
        include: {
          _count: {
            select: {
              ads: true,
            },
          },
        },
      })
      .catch((error) => {
        return error;
      });
    return response.json(games);
  } catch (error) {
    return response.json(error);
  }
});

app.post('/games/:gameId/ads', async (request, response) => {
  const gameId = request.params.gameId;
  const body: any = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDay: body.weekDay.join(','),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    },
  });

  return response.json(ad);
});

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDay: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourEnd: true,
      hourStart: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return response.json(
    ads.map((ad) => {
      return {
        ...ad,
        weekDay: ad.weekDay.split(','),
        hourStart: convertMinutesToHourString(ad.hourStart),
        hourEnd: convertMinutesToHourString(ad.hourEnd),
      };
    })
  );
});

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  return response.json({
    discord: ad.discord,
  });
});

app.listen(3333, '192.168.3.4');
