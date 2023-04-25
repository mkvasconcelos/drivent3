import { Hotel, Room } from '@prisma/client';
import { notFoundError, paymentRequiredError } from '@/errors';
import enrollmentRepository from '@/repositories/enrollment-repository';
import hotelsRepository from '@/repositories/hotels-repository';
import paymentsRepository from '@/repositories/payments-repository';
import ticketsRepository from '@/repositories/tickets-repository';

async function getAllHotels(userId: number): Promise<Hotel[]> {
  const enrollment = await enrollmentRepository.findByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }
  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }
  const hotelTrue = await ticketsRepository.findTickeWithTypeById(ticket.id);
  if (hotelTrue.TicketType.isRemote || !hotelTrue.TicketType.includesHotel) {
    throw paymentRequiredError();
  }
  const payment = await paymentsRepository.findPaymentByTicketId(ticket.id);
  if (!payment || ticket.status !== 'PAID') {
    throw paymentRequiredError();
  }
  const hotel = await hotelsRepository.findHotel();
  if (hotel.length === 0) {
    throw notFoundError();
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
  if (!enrollment) {
    throw notFoundError();
  }
  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }
  const hotelTrue = await ticketsRepository.findTickeWithTypeById(ticket.id);
  if (hotelTrue.TicketType.isRemote || !hotelTrue.TicketType.includesHotel) {
    throw paymentRequiredError();
  }
  const payment = await paymentsRepository.findPaymentByTicketId(ticket.id);
  if (!payment) {
    throw paymentRequiredError();
  }
  const hotel = await hotelsRepository.findHotelRooms(hotelId);
  if (!hotel) {
    throw notFoundError();
  }
  return hotel;
}

const hotelsService = { getAllHotels, getAllRooms };

export default hotelsService;
