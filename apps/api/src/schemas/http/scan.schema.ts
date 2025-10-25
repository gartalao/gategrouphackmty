import { z } from 'zod';

export const scanRequestSchema = z.object({
  body: z.object({
    flight_id: z.string().transform(Number),
    trolley_id: z.string().transform(Number),
    shelf_id: z.string().transform(Number),
  }),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>['body'];

