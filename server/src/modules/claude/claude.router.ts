import { Request, Response, Router } from 'express';
import { claudeService } from './claude.service.ts';

const router = Router();

// 1. Check Claude connection status
router.get('/status', (_req: Request, res: Response) => {
  const status = claudeService.getStatus();
  return res.status(200).json({
    success: true,
    data: status,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// 2. Generate descriptions, menu copy, or marketing text
router.post('/generate', async (req: Request, res: Response) => {
  const { prompt, systemPrompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      success: false,
      error: { message: 'Prompt string is required' },
    });
  }

  try {
    const result = await claudeService.generateContent(prompt, systemPrompt);
    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Claude generation failed' },
    });
  }
});

export const claudeRouter = router;
