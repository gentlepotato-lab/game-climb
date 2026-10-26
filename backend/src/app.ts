import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { runsRouter } from './routes/runs';

export const app = express();

const corsOrigin = config.corsOrigin === '*'
  ? true
  : config.corsOrigin.split(',').map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// API는 모두 /api 아래에 단다. 화면(SPA)이 루트를 쓰기 때문에, 앞자락이
// 없으면 API 주소가 화면 경로와 부딪힌다.
//
// 자리 접두사는 여기서만 붙인다. 라우터 파일 안에서 또 붙이지 않는다.
// 한 자원은 한 자리, 한 라우터 파일을 갖고 둘의 이름을 맞춘다.
//
//   /api/health   (여기)            기동 확인
//   /api/runs     routes/runs.ts    기록 저장, 이번 주 랭킹
const API = '/api';

app.get(`${API}/health`, (_req, res) => {
  res.json({ ok: true });
});

app.use(`${API}/runs`, runsRouter);
