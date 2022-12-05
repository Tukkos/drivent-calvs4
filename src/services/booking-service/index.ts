import { notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import ticketRepository from "@/repositories/ticket-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import { cannotListHotelsError } from "@/errors/cannot-list-hotels-error";
import hotelRepository from "@/repositories/hotel-repository";
import { fullRoomError } from "@/errors/full-room-error";

async function getBooking(userId: number) {
  const booking = await bookingRepository.findBookingByUserId(userId);
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}

async function postBooking(userId: number, roomId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw cannotListHotelsError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if(!enrollment || !ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw cannotListHotelsError();
  }

  const room = await hotelRepository.findRoomById(roomId);
  if (!room) {
    throw notFoundError();
  }

  if (room.Booking.length >= room.capacity) {
    throw fullRoomError();
  }

  const booking = await bookingRepository.postBooking(roomId, userId);
  return booking;
}

async function putBooking(userId: number, roomId: number, bookingId: number) {
  const room = await hotelRepository.findRoomById(roomId);
  if (!room) {
    throw notFoundError();
  }

  if (room.Booking.length >= room.capacity) {
    throw fullRoomError();
  }

  const booking = await bookingRepository.putBookingById(roomId, bookingId);
  return booking;
}

const bookingService = {
  getBooking,
  postBooking,
  putBooking,
};

export default bookingService;
