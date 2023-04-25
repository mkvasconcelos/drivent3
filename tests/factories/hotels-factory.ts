import faker from '@faker-js/faker';
import { prisma } from '@/config';

export async function createHotel() {
  return prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.internet.url(),
    },
  });
}

export async function createRoom(hotelId: number) {
  return prisma.room.create({
    data: {
      name: faker.name.findName(),
      capacity: faker.datatype.number({ min: 1, max: 6 }),
      hotelId,
    },
  });
}
