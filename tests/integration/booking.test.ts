import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress, createHotel, createPayment, createRoomWithHotelId, createTicket, createTicketType, createTicketTypeWithHotel, createTicketTypeWithoutHotel, createUser, } from "../factories";
import { createBooking } from "../factories/booking-factory";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("POST /bookings", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/payments");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/payments").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/payments").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 400 if body param roomId is missing", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {};

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 if body param roomId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: faker.datatype.number({ max: 0 }),
      };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 if body param roomId is NaN", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: NaN,
      };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 403 if it fails business rule", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: faker.datatype.number(),
      };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 if roomId dont exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      await createHotel();            
      const body = {
        roomId: faker.datatype.number(),
      };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if the room has no vacancy", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      await createBooking(user.id, createdRoom.id);
      const body = {
        roomId: createdRoom.id,
      };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 200 and bookingId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = {
        roomId: createdRoom.id,
      };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });
  });
});

describe("GET /bookings", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/payments");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/payments").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/payments").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 if user dont have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 with bookId and Room", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBooking(user.id, createdRoom.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: createdRoom.id,
          name: createdRoom.name,
          capacity: createdRoom.capacity,
          hotelId: createdHotel.id,
          createdAt: createdRoom.createdAt.toISOString(),
          updatedAt: createdRoom.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe("PUT /bookings/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/payments");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/payments").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/payments").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 400 if body param roomId is missing", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {};
      const bookingId = faker.datatype.number();

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 403 if body param roomId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: faker.datatype.number({ max: 0 }),
      };
      const bookingId = faker.datatype.number();

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 403 if body param roomId is NaN", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: NaN,
      };
      const bookingId = faker.datatype.number();

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 403 if param bookingId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: faker.datatype.number({ min: 1 }),
      };
      const bookingId = faker.datatype.number({ max: 0 });

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 403 if ticket is not paid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const body = {
        roomId: faker.datatype.number(),
      };
      const bookingId = faker.datatype.number();

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 if the ticket type dont includes hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithoutHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const body = {
        roomId: faker.datatype.number(),
      };
      const bookingId = faker.datatype.number();

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 if the room dont exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: faker.datatype.number(),
      };
      const bookingId = faker.datatype.number();

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 if user dont have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = {
        roomId: faker.datatype.number(),
      };
      const bookingId = faker.datatype.number();

      const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if the room has no vacancy", async () => {
      const user = await createUser();
      const user2 = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom1 = await createRoomWithHotelId(createdHotel.id);
      const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBooking(user.id, createdRoom1.id);
      await createBooking(user2.id, createdRoom2.id);
      const body = {
        roomId: createdRoom2.id,
      };

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with 200 and bookingId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom1 = await createRoomWithHotelId(createdHotel.id);
      const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBooking(user.id, createdRoom1.id);
      const body = {
        roomId: createdRoom2.id,
      };

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });
  });
});
