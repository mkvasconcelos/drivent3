import { Hotel } from '@prisma/client';
import { prisma } from '@/config';

async function findHotel(): Promise<Hotel[]> {
  const res = await prisma.hotel.findMany();
  return res;
}

async function findHotelRooms(hotelId: number) {
  const res = await prisma.hotel.findFirst({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: true,
    },
  });
  return res;
}

export default { findHotel, findHotelRooms };
