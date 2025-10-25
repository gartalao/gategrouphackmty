import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/error';

const router = Router();

router.get('/flights/:id', asyncHandler(async (req, res) => {
  const flightId = parseInt(req.params.id);

  const flight = await prisma.flight.findUnique({
    where: { flightId },
    include: {
      trolleys: {
        include: {
          shelves: true,
        },
      },
    },
  });

  if (!flight) {
    throw new AppError(404, 'Flight not found');
  }

  res.json(flight);
}));

router.get('/flights/:id/requirements', asyncHandler(async (req, res) => {
  const flightId = parseInt(req.params.id);

  const requirements = await prisma.flightRequirement.findMany({
    where: { flightId },
    include: {
      product: true,
      trolley: true,
    },
  });

  const grouped = requirements.reduce((acc: any, req) => {
    const trolleyCode = req.trolley.trolleyCode;
    if (!acc[trolleyCode]) {
      acc[trolleyCode] = {
        trolley_id: req.trolleyId,
        trolley_code: trolleyCode,
        products: [],
      };
    }
    acc[trolleyCode].products.push({
      product_id: req.productId,
      sku: req.product.sku,
      name: req.product.name,
      expected_quantity: req.expectedQuantity,
      priority: req.priority,
    });
    return acc;
  }, {});

  res.json({
    flight_id: flightId,
    requirements: Object.values(grouped),
  });
}));

export default router;

