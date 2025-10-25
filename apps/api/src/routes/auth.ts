import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/error';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Simple mock token (in production, use JWT)
  const token = Buffer.from(`${user.userId}:${user.username}:${Date.now()}`).toString('base64');

  res.json({
    token,
    user: {
      id: user.userId,
      username: user.username,
      full_name: user.fullName,
      role: user.role,
    },
  });
}));

export default router;

