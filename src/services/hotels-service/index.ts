import { Hotel, Room } from '@prisma/client';
import { notFoundError, paymentRequiredError } from '@/errors';
import enrollmentRepository from '@/repositories/enrollment-repository';
import hotelsRepository from '@/repositories/hotels-repository';
import paymentsRepository from '@/repositories/payments-repository';
import ticketsRepository from '@/repositories/tickets-repository';

async function getAllHotels(userId: number): Promise<Hotel[]> {
  const enrollment = await enrollmentRepository.findByUserId(userId);
  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment);
  const hotelTrue = await ticketsRepository.findTickeWithTypeById(ticket.id);
  const payment = await paymentsRepository.findPaymentByTicketId(ticket.id);
  const hotel = await hotelsRepository.findHotel();
  if (!enrollment || !ticket) {
    throw notFoundError();
  }
  if (!payment || hotelTrue.TicketType.isRemote || !hotelTrue.TicketType.includesHotel) {
    throw paymentRequiredError();
  }
  return hotel;
}

async function getAllRooms(
  userId: number,
  hotelId: number,
): Promise<
  Hotel & {
    Rooms: Room[];
  }
> {
  const enrollment = await enrollmentRepository.findByUserId(userId);
  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment);
  const hotelTrue = await ticketsRepository.findTickeWithTypeById(ticket.id);
  const payment = await paymentsRepository.findPaymentByTicketId(ticket.id);
  const hotel = await hotelsRepository.findHotelRooms(hotelId);
  if (!enrollment || !ticket || !hotel) {
    throw notFoundError();
  }
  if (!payment || hotelTrue.TicketType.isRemote || !hotelTrue.TicketType.includesHotel) {
    throw paymentRequiredError();
  }
  return hotel;
}

const hotelsService = { getAllHotels, getAllRooms };

export default hotelsService;
