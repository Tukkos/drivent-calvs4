import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";
import ticketService from "@/services/tickets-service";

export async function findBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingService.getBooking(Number(userId));
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}

export async function postBookingByRoomId(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
        
  try {
    if (!roomId || roomId < 1 || isNaN(roomId)) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }

    const booking = await bookingService.postBooking(Number(userId), Number(roomId));
    const response = {
      bookingId: booking.id
    };
    return res.status(httpStatus.OK).send(response);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "CannotListHotelsError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "FullRoomError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
  }
}

export async function putBookingByRoomId(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  const { bookingId } = req.params;

  try {
    if (!roomId || roomId < 1 || isNaN(roomId)) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }

    if (Number(bookingId) < 1) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }

    const ticket = await ticketService.getTicketByUserId(userId);
    if (ticket.status === "RESERVED" || ticket.TicketType.includesHotel === false) {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }

    const existingBooking = await bookingService.getBooking(userId);
    if (!existingBooking) {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
        
    const booking = await bookingService.putBooking(Number(userId), Number(roomId), Number(bookingId));
    const response = {
      bookingId: booking.id
    };
    return res.status(httpStatus.OK).send(response);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "FullRoomError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
  }
}
