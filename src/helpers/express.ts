import * as express from 'express';

// TODO: Share
// Wrap to catch promise rejections and pass to error handling middleware
export type AsyncRequestHandler = (req: express.Request, res: express.Response) => Promise<void>;
export type wrapAsyncRequestHandler = ((
    asyncRequestHandler: AsyncRequestHandler,
) => express.RequestHandler);
export const wrapAsyncRequestHandler: wrapAsyncRequestHandler = promiseFn => (req, res, next) =>
    promiseFn(req, res).catch(next);
