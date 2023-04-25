import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import hotelsService from '@/services/hotels-service';

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  try {
    const hotels = await hotelsService.getAllHotels(userId);
    return res.status(httpStatus.OK).send(hotels);
  } catch (e) {
    if (e.name === 'NotFoundError') {
      return res.status(httpStatus.NOT_FOUND).send({
        message: e.message,
      });
    }
    if (e.name === 'PaymentRequiredError') {
      return res.status(httpStatus.PAYMENT_REQUIRED).send({
        message: e.message,
      });
    }
    return res.status(httpStatus.BAD_REQUEST).send({
      message: e.message,
    });
  }
}

export async function getHotelRooms(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotelId = Number(req.params.hotelId);
  try {
    const hotelRooms = await hotelsService.getAllRooms(userId, hotelId);
    return res.status(httpStatus.OK).send(hotelRooms);
  } catch (e) {
    if (e.name === 'NotFoundError') {
      return res.status(httpStatus.NOT_FOUND).send({
        message: e.message,
      });
    }
    if (e.name === 'PaymentRequiredError') {
      return res.status(httpStatus.PAYMENT_REQUIRED).send({
        message: e.message,
      });
    }
    return res.status(httpStatus.BAD_REQUEST).send({
      message: e.message,
    });
  }
}
