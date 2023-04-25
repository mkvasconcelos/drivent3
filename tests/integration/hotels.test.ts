import faker from '@faker-js/faker';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import {
  createHotel,
  createRoom,
  createUser,
  createEnrollmentWithAddress,
  createTicket,
  createTicketType,
  createPayment,
} from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import { prisma } from '@/config';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /hotels', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/hotels');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 when user doesnt have an enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 404 when user doesnt have a ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 402 when ticketType is remote', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.isRemote = true;
      const enrollment = await createEnrollmentWithAddress(user);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
      expect(ticketType.isRemote).toBe(true);
    });

    it('should respond with status 402 when ticketType doesnt have hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
      await createPayment(ticket.id, ticketType.price);
      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
      expect(ticketType.includesHotel).toBe(false);
    });

    it('should respond with status 402 when ticket isnt paid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = true;
      ticketType.isRemote = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'RESERVED');
      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
      expect(ticket.status).toBe('RESERVED');
    });

    it('should respond with status 404 when there isnt a hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = true;
      ticketType.isRemote = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
      const payment = await createPayment(ticket.id, ticketType.price);
      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    // it('should respond with status 200 when there is hotel', async () => {
    //   const user = await createUser();
    //   const token = await generateValidToken(user);
    //   const ticketType = await createTicketType();
    //   ticketType.includesHotel = true;
    //   ticketType.isRemote = false;
    //   const enrollment = await createEnrollmentWithAddress(user);
    //   const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
    //   await createPayment(ticket.id, ticketType.price);
    //   const hotel = await createHotel();
    //   const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    //   expect(response.status).toBe(httpStatus.OK);
    //   expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(hotel)]));
    // });

    it('should respond with status 200 when there is hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(hotel)]));
    });
  });
});

describe('GET /hotels/:hotelId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/hotels/1');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 when user doesnt have an enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 404 when user doesnt have a ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 402 when ticketType is remote', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.isRemote = true;
      const enrollment = await createEnrollmentWithAddress(user);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
      expect(ticketType.isRemote).toBe(true);
    });

    it('should respond with status 402 when ticketType doesnt have hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
      await createPayment(ticket.id, ticketType.price);
      const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
      expect(ticketType.includesHotel).toBe(false);
    });

    it('should respond with status 402 when ticket isnt paid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = true;
      ticketType.isRemote = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'RESERVED');
      const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
      expect(ticket.status).toBe('RESERVED');
    });

    it('should respond with status 404 when there isnt a hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = true;
      ticketType.isRemote = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
      await createPayment(ticket.id, ticketType.price);
      const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 200 when there is hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      ticketType.includesHotel = true;
      ticketType.isRemote = false;
      const enrollment = await createEnrollmentWithAddress(user);
      const ticket = await createTicket(enrollment.id, ticketType.id, 'PAID');
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoom(hotel.id);
      const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(hotel)]));
    });
  });
});
