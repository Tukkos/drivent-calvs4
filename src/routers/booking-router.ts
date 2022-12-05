import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { findBooking, postBookingByRoomId, putBookingByRoomId } from "@/controllers/booking-controller";

const bookingRouter = Router();

bookingRouter
  .all("/", authenticateToken)
  .get("/", findBooking)
  .post("/", postBookingByRoomId)
  .put("/:bookingId", putBookingByRoomId);

export { bookingRouter };
