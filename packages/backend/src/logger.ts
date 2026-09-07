// THANK YOU ODYSSEUSLARP

import type { Request, Response, NextFunction } from 'express';
import signale from 'signale';
const { Signale } = signale;

const webhook = process.env.DISCORD_WEBHOOK_URL;
let requestsSinceStart = 0;

const logger = new Signale({
	types: {
		// Override the default debug logger to not be so intimidating
		debug: {
			badge: 'i',
			color: 'cyan',
			label: 'debug',
		},
	},
});

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
	next();
	res.on('finish', () => {
		if (res.statusCode < 400) logger.debug(`HTTP ${res.statusCode} ${req.method} ${req.url}`);
		if (res.statusCode > 400 && res.statusCode != 404) logger.error(`HTTP ${res.statusCode} ${req.method} ${req.url}`);
	});
};


// Middleware
const ipGrabber2000 = async (req: Request, res: Response, next: NextFunction) => {
  const ip =
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress || '';
  
  next();
  res.on('finish', async () => {
    if (res.statusCode == 404 || req.path == "/api/moth") return;
    const response = '{ "PERMANENTLY DISABLED PLEASE DO MANUALLY" }';

    if (req.originalUrl.split('.')[0] == req.originalUrl) {
      requestsSinceStart++;
      const body = { content: `**New panel request**\nIP: ${ip}\nDate: ${new Date().toString()}\nPath: ${req.originalUrl}\nRequest number: ${requestsSinceStart}\nGeolocation: ${JSON.stringify(response)}` };

      await Bun.fetch(webhook!, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
};

export { logger, ipGrabber2000, loggerMiddleware };